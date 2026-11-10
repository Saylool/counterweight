import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { base58 } from '@scure/base';
import { getSigningDigest, type L1Input } from '../packages/hyperliquid/src/index.js';
import { assertFreshContractProof, parseContractProof } from './prove-contract.js';
import { deploymentSteps, initialization } from './testnet-plan.js';
import { checkKeys, planConfigMatches, policyStateSchema, verifyTestnet } from './testnet-verify.js';
import { committedWasm, KEEPER, OWNER, parseOptions, PATH, POLICY, PROBE_ADDRESS, publicKey, rpc, SIGNING_LIMITS, txHash } from './testnet-common.js';
import { deriveEvmAddress } from '../packages/hyperliquid/src/index.js';

const publicSignature: unknown = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
const hash = base58.encode(new Uint8Array(32).fill(7));
const pk = `ed25519:${base58.encode(new Uint8Array(32).fill(8))}`;
const nonce = 1794304933424;
const input: L1Input = { scheme: 'l1', network: 'testnet', action: { type: 'cancel', cancels: [{ a: 54, o: 0 }] }, nonce, expiresAfter: nonce + 60000 };
function receipt(event: string, data: unknown, executor = POLICY) {
  return { id: `receipt-${event}`, block_hash: `block-${event}`, outcome: { executor_id: executor,
    status: { SuccessValue: 'dHJ1ZQ==' }, logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', version: '1.0.0', event, data: [data] })}`] } };
}
function fixture() {
  return { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' },
    transaction: { hash, signer_id: KEEPER, receiver_id: POLICY, actions: [{ FunctionCall: { method_name: 'request_cancel_signature',
      args: Buffer.from('{"order_id":"0"}').toString('base64') } }] }, receipts_outcome: [
      receipt('request', { id: '1', caller: KEEPER, kind: 'Cancel', digest: getSigningDigest(input).slice(2),
        payload: { action: input.action, nonce, expiresAfter: input.expiresAfter } }),
      receipt('signature', { id: '1', nonce: String(nonce), expiresAfter: String(input.expiresAfter), signature: publicSignature }),
    ] };
}
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('auditable deployment command builder', () => {
  it('builds the real initializer ABI with immutable testnet identities and bounded limits', () => {
    expect(initialization(54, 1, PROBE_ADDRESS)).toMatchObject({ owner: OWNER, keeper: KEEPER, asset_index: 54,
      size_decimals: 1, derivation_path: PATH, evm_recipient: PROBE_ADDRESS, signer_account: 'v1.signer-prod.testnet',
      wnear_account: 'wrap.testnet', limits: { max_short_size: '1000000000000000000000000', per_order_notional_cap: '10000000' } });
  });
  it('orders create/deploy/init/preflight/delete/keyless verify/contract cancel with keychain-only signing', () => {
    const steps = deploymentSteps(initialization(54, 1, PROBE_ADDRESS), 'a'.repeat(64), pk, pk);
    expect(steps).toHaveLength(9);
    expect(steps[0]!.command).toContain(`fund-myself ${POLICY} '7 NEAR' use-manually-provided-public-key '${pk}'`);
    expect(steps[1]!.command).toContain(`fund-myself ${KEEPER} '0.2 NEAR'`);
    expect(steps[2]!.command).toMatch(/^test .*shasum.* && near contract deploy/);
    expect(steps[3]!.command).toContain(`new json-args '${JSON.stringify(initialization(54, 1, PROBE_ADDRESS))}'`);
    expect(steps[3]!.command).toContain(`sign-as ${OWNER}`);
    expect(steps[4]!.command).toContain('--before-key-removal=true');
    expect(steps[5]!.command).toContain(`delete-keys ${POLICY} public-keys '${pk}'`);
    expect(steps[5]!.expect).toContain('IRREVERSIBLE');
    expect(steps[7]!.command).toContain(`${POLICY} request_cancel_signature json-args '{"order_id":"0"}' prepaid-gas '300 Tgas' attached-deposit '1 yoctoNEAR' sign-as ${KEEPER}`);
    for (const step of steps.filter(s => s.command.includes('near '))) {
      expect(step.command).toContain('network-config testnet sign-with-keychain send');
      expect(step.command).not.toMatch(/sign-with-(?:plaintext|access-key|legacy)|autogenerate|v1.signer-prod.testnet sign /);
    }
  });
  it('leaves public key placeholders that fail closed when unset', () => {
    const steps = deploymentSteps(initialization(54, 1, PROBE_ADDRESS), 'a'.repeat(64));
    expect(steps[0]!.command).toContain('${POLICY_PUBLIC_KEY:?');
    expect(steps[1]!.command).toContain('${KEEPER_PUBLIC_KEY:?');
  });
  it.each(['0x...', `0x${'0'.repeat(40)}`, `${PROBE_ADDRESS}'; echo bad`])('rejects invalid owner recipients %s', evm => {
    expect(() => initialization(54, 1, evm)).toThrow();
  });
  it('rejects invalid metadata, shell injection and ambiguous CLI arguments', () => {
    expect(() => initialization(-1, 1, PROBE_ADDRESS)).toThrow();
    expect(() => initialization(54, 7, PROBE_ADDRESS)).toThrow();
    expect(() => publicKey('ed25519:$(echo bad)')).toThrow();
    expect(() => txHash('bad')).toThrow();
    expect(txHash(hash)).toBe(hash);
    expect(parseOptions(['--owner-evm=0xabc'], ['owner-evm'])).toEqual({ 'owner-evm': '0xabc' });
    for (const argv of [['--network=mainnet'], ['--tx=a', '--tx=b'], ['secret'], ['--tx=']])
      expect(() => parseOptions(argv, ['tx'])).toThrow();
  });
  it('verifies artifact bytes against the committed SHA-256 manifest and converts to NEAR base58', async () => {
    const result = await committedWasm();
    expect(result.sha256).toBe('698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289');
    expect(Buffer.from(base58.decode(result.codeHash)).toString('hex')).toBe(result.sha256);
  });
});
describe('public receipt parsing and custody', () => {
  it('binds successful policy events and callback to the requested tx, operation, digest and expiry', () => {
    const result = parseContractProof(fixture(), hash, 54);
    expect(result.input).toEqual(input);
    expect(result.digest).toBe(getSigningDigest(input));
    expect(result.signature.v).toBe(27);
  });
  it.each(['wrong-executor', 'duplicate', 'failed-receipt', 'failed-callback', 'wrong-nonce', 'wrong-expiry', 'wrong-digest', 'wrong-action', 'wrong-caller', 'not-final', 'wrong-method', 'wrong-args', 'wrong-tx', 'wrong-standard'])('rejects %s', change => {
    const tx = fixture();
    const req = tx.receipts_outcome[0]!; const sig = tx.receipts_outcome[1]!;
    const mutate = (r: typeof req, f: (event: any) => void) => {
      const e = JSON.parse(r.outcome.logs[0]!.slice(11)); f(e); r.outcome.logs[0] = `EVENT_JSON:${JSON.stringify(e)}`;
    };
    if (change === 'wrong-executor') req.outcome.executor_id = OWNER;
    if (change === 'duplicate') tx.receipts_outcome.push(req);
    if (change === 'failed-receipt') (req.outcome.status as Record<string, unknown>).Failure = {};
    if (change === 'failed-callback') sig.outcome.status.SuccessValue = 'ZmFsc2U=';
    if (change === 'wrong-nonce') mutate(sig, e => { e.data[0].nonce = '0'; });
    if (change === 'wrong-expiry') mutate(sig, e => { e.data[0].expiresAfter = '1'; });
    if (change === 'wrong-digest') mutate(req, e => { e.data[0].digest = '0'.repeat(64); });
    if (change === 'wrong-action') mutate(req, e => { e.data[0].payload.action.cancels[0].o = 1; });
    if (change === 'wrong-caller') tx.transaction.signer_id = OWNER;
    if (change === 'not-final') tx.final_execution_status = 'EXECUTED_OPTIMISTIC';
    if (change === 'wrong-method') tx.transaction.actions[0]!.FunctionCall.method_name = 'sign';
    if (change === 'wrong-args') tx.transaction.actions[0]!.FunctionCall.args = Buffer.from('{"order_id":"1"}').toString('base64');
    if (change === 'wrong-tx') tx.transaction.hash = base58.encode(new Uint8Array(32).fill(1));
    if (change === 'wrong-standard') mutate(req, e => { e.standard = 'spoof'; });
    expect(() => parseContractProof(tx, hash, 54)).toThrow();
  });
  it('rejects wrong market and expired/near-expired/future signatures', () => {
    expect(() => parseContractProof(fixture(), hash, 74)).toThrow();
    expect(() => assertFreshContractProof(input, nonce + 30000)).not.toThrow();
    for (const now of [nonce - 1001, nonce + 57000, nonce + 60001]) expect(() => assertFreshContractProof(input, now)).toThrow();
  });
  it('expects zero keys finally and exactly one full-access key only in pre-removal mode', () => {
    const empty = { block_hash: 'block', keys: [] };
    const full = { block_hash: 'block', keys: [{ public_key: pk, access_key: { permission: 'FullAccess' } }] };
    expect(checkKeys(empty).ok).toBe(true); expect(checkKeys(full).ok).toBe(false);
    expect(checkKeys(empty, true).ok).toBe(false); expect(checkKeys(full, true).ok).toBe(true);
    expect(checkKeys({ ...full, keys: [...full.keys, ...full.keys] }, true).ok).toBe(false);
    expect(checkKeys({ ...full, keys: [{ public_key: pk, access_key: { permission: { FunctionCall: {} } } }] }, true).ok).toBe(false);
  });
  it('flags mutable config drift instead of treating any valid view as matching the plan', () => {
    const init = initialization(54, 1, PROBE_ADDRESS);
    const state = policyStateSchema.parse({ ...init, coin: 'NEAR', near_recipient: OWNER, spot_balance: '0', signed_short_size: '0',
      paused: false, pending: null, signing_limits: SIGNING_LIMITS, mpc_fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, keeper_weight_limit: '5000' });
    expect(planConfigMatches(state)).toBe(true);
    expect(planConfigMatches({ ...state, limits: { ...state.limits, per_day_notional_cap: '999999999' } })).toBe(false);
    expect(planConfigMatches({ ...state, mpc_fee: '1000' })).toBe(false);
    expect(() => policyStateSchema.parse({ ...state, near_recipient: 'attacker.testnet' })).toThrow();
  });
  it('never claims keyless custody for an absent policy, even if RPC would return an empty key list', async () => {
    const root = JSON.parse(readFileSync(new URL('../fixtures/chainsig-public-derivation.json', import.meta.url), 'utf8')).root.value as string;
    const derived = deriveEvmAddress(root, POLICY, PATH);
    const remoteKey = `secp256k1:${base58.encode(Buffer.from(derived.publicKey.slice(4), 'hex'))}`;
    const json = (value: unknown) => new Response(JSON.stringify(value));
    const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
      const { method, params } = JSON.parse(String(init?.body));
      if (method === 'block') return json({ result: { header: { hash: 'finalized', height: 42 } } });
      if (params.account_id === POLICY) return json({ error: { cause: { name: 'UNKNOWN_ACCOUNT' } } });
      if (params.account_id === 'v1.signer-prod.testnet') return json({ result: { block_hash: 'root', block_height: 43,
        result: [...Buffer.from(JSON.stringify(params.method_name === 'public_key' ? root : remoteKey))] } });
      throw new Error('Unexpected test request');
    });
    vi.stubGlobal('fetch', fetcher);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const savedExitCode = process.exitCode;
    try {
      await verifyTestnet([]);
      expect(process.exitCode).toBe(1);
      const result = JSON.parse(String(log.mock.calls[0]![0]));
      expect(result.checks.map((c: { ok: boolean }) => c.ok)).toEqual([false, false, false, true]);
      expect(result.checks[1].details).toContain('Account existence unavailable');
    } finally { process.exitCode = savedExitCode; }
  });
  it('builds public-only RPC and reports unknown accounts without exposing response data', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ result: { code_hash: 'public' } })));
    expect(await rpc('query', { request_type: 'view_account', account_id: POLICY, finality: 'final' }, fetcher)).toEqual({ code_hash: 'public' });
    expect(JSON.parse(String(fetcher.mock.calls[0]![1]?.body))).toMatchObject({ method: 'query', params: { request_type: 'view_account' } });
    fetcher.mockResolvedValue(new Response(JSON.stringify({ error: { cause: { name: 'UNKNOWN_ACCOUNT' }, data: 'untrusted' } })));
    await expect(rpc('query', {}, fetcher)).rejects.toThrow('NEAR RPC UNKNOWN_ACCOUNT');
  });
});
