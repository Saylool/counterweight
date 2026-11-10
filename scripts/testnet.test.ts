import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { base58 } from '@scure/base';
import { getSigningDigest, type L1Input } from '../packages/hyperliquid/src/index.js';
import { assertFreshContractProof, parseContractProof, proofKeys, proofOptions, REHEARSAL_NOTICE } from './prove-contract.js';
import { deploymentSteps, initialization } from './testnet-plan.js';
import { checkKeys, planConfigMatches, policyStateSchema, verifyTestnet } from './testnet-verify.js';
import { committedWasm, DEPLOYED_SHA256, KEEPER, NEXT_POLICY, OWNER, parseOptions, PATH, POLICY, PROBE_ADDRESS, publicKey, rpc, SIGNING_LIMITS, txHash } from './testnet-common.js';
import { deriveEvmAddress } from '../packages/hyperliquid/src/index.js';
import { orderPrice } from './lifecycle-config.js';
import { LIMITS, ORACLE } from './testnet-common.js';

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
    expect(initialization(54, 1, PROBE_ADDRESS, '3.6348')).toMatchObject({ owner: OWNER, keeper: KEEPER, asset_index: 54,
      size_decimals: 1, derivation_path: PATH, evm_recipient: PROBE_ADDRESS, signer_account: 'v1.signer-prod.testnet',
      wnear_account: 'wrap.testnet', limits: { max_short_size: '5000000000000000000000000', per_order_notional_cap: '20000000' } });
  });
  it('orders create/deploy/init/preflight/spot/delete/keyless verify/funded lifecycle with keychain-only signing', () => {
    const steps = deploymentSteps(initialization(54, 1, PROBE_ADDRESS, '3.6348'), 'a'.repeat(64), pk, pk);
    expect(steps).toHaveLength(19);
    expect(steps[0]!.command).toContain(`fund-myself ${NEXT_POLICY} '9 NEAR' use-manually-provided-public-key '${pk}'`);
    expect(steps[1]!.command).toBe(`near account view-account-summary ${KEEPER} network-config testnet now`);
    expect(steps[2]!.command).toMatch(/^test .*shasum.* && near contract deploy/);
    expect(steps[3]!.command).toContain(`new json-args '${JSON.stringify(initialization(54, 1, PROBE_ADDRESS, '3.6348'))}'`);
    expect(steps[3]!.command).toContain(`sign-as ${OWNER}`);
    expect(steps[4]!.command).toContain('--before-key-removal=true');
    expect(steps[11]!.command).toContain(`delete-keys ${NEXT_POLICY} public-keys '${pk}'`);
    expect(steps[11]!.expect).toContain('IRREVERSIBLE');
    expect(steps[13]!.command).toBe('npm run lifecycle -- --step=open');
    expect(steps[8]!.command).toContain('ft_transfer_call');
    expect(steps[8]!.command).toContain('\"msg\":\"\"');
    for (const step of steps.filter(s => s.command.includes('near ') && !s.command.includes('view-account-summary'))) {
      expect(step.command).toContain('network-config testnet sign-with-keychain send');
      expect(step.command).not.toMatch(/sign-with-(?:plaintext|access-key|legacy)|autogenerate|v1.signer-prod.testnet sign /);
    }
  });
  it('leaves public key placeholders that fail closed when unset', () => {
    const steps = deploymentSteps(initialization(54, 1, PROBE_ADDRESS, '3.6348'), 'a'.repeat(64));
    expect(steps[0]!.command).toContain('${POLICY_PUBLIC_KEY:?');
    expect(steps[1]!.command).toContain('view-account-summary');
  });
  it.each(['0x...', `0x${'0'.repeat(40)}`, `${PROBE_ADDRESS}'; echo bad`])('rejects invalid owner recipients %s', evm => {
    expect(() => initialization(54, 1, evm, '3.6348')).toThrow();
  });
  it('rejects invalid metadata, shell injection and ambiguous CLI arguments', () => {
    expect(() => initialization(-1, 1, PROBE_ADDRESS, '3.6348')).toThrow();
    expect(() => initialization(54, 7, PROBE_ADDRESS, '3.6348')).toThrow();
    expect(() => publicKey('ed25519:$(echo bad)')).toThrow();
    expect(() => txHash('bad')).toThrow();
    expect(txHash(hash)).toBe(hash);
    expect(parseOptions(['--owner-evm=0xabc'], ['owner-evm'])).toEqual({ 'owner-evm': '0xabc' });
    for (const argv of [['--network=mainnet'], ['--tx=a', '--tx=b'], ['secret'], ['--tx=']])
      expect(() => parseOptions(argv, ['tx'])).toThrow();
  });
  it('verifies artifact bytes against the committed SHA-256 manifest and converts to NEAR base58', async () => {
    const result = await committedWasm();
    expect(result.sha256).toBe('d85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1');
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
  it('restricts rehearsals to full-access policies and restricts old WASM overrides to the original deployment', () => {
    const full = { block_hash: 'b', keys: [{ public_key: pk, access_key: { permission: 'FullAccess' } }] };
    expect(proofKeys(full, true)).toEqual(full.keys);
    expect(() => proofKeys(full, false)).toThrow('still has access keys');
    expect(() => proofKeys({ ...full, keys: [] }, true)).toThrow('requires a full-access key');
    expect(() => proofKeys({ ...full, keys: [{ public_key: pk, access_key: { permission: { FunctionCall: {} } } }] }, true)).toThrow();
    expect(proofOptions(['--rehearsal', `--wasm-sha256=${DEPLOYED_SHA256}`]).rehearsal).toBe(true);
    expect(REHEARSAL_NOTICE).toBe('REHEARSAL — policy account still had a full-access key; not the final keyless proof');
    for (const args of [[`--wasm-sha256=${DEPLOYED_SHA256}`], ['--rehearsal', `--policy=${NEXT_POLICY}`, `--wasm-sha256=${DEPLOYED_SHA256}`],
      ['--rehearsal', '--wasm-sha256=' + 'a'.repeat(64)], ['--rehearsal', '--rehearsal'], ['--keeper=attacker.near'], ['--policy=x;bad.testnet']])
      expect(() => proofOptions(args)).toThrow();
  });
  it('binds alternate policy and keeper accounts in transaction and event identities', () => {
    const tx = fixture(); const keeper = 'alternate.testnet';
    tx.transaction.receiver_id = NEXT_POLICY; tx.transaction.signer_id = keeper;
    for (const receipt of tx.receipts_outcome) receipt.outcome.executor_id = NEXT_POLICY;
    const event = JSON.parse(tx.receipts_outcome[0]!.outcome.logs[0]!.slice(11)); event.data[0].caller = keeper;
    tx.receipts_outcome[0]!.outcome.logs[0] = `EVENT_JSON:${JSON.stringify(event)}`;
    expect(parseContractProof(tx, hash, 54, NEXT_POLICY, keeper).input).toEqual(input);
    expect(() => parseContractProof(tx, hash, 54)).toThrow();
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
    const init = initialization(54, 1, PROBE_ADDRESS, '3.6348');
    const state = policyStateSchema.parse({ ...init, coin: 'NEAR', near_recipient: OWNER, spot_balance: '0', signed_short_size: '0',
      paused: false, pending: null, signing_limits: SIGNING_LIMITS, network: 'Testnet', oracle: initialization(54,1,PROBE_ADDRESS, '3.6348').oracle, mpc_fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, keeper_weight_limit: '5000' });
    expect(planConfigMatches(state, init)).toBe(true);
    expect(planConfigMatches({ ...state, limits: { ...state.limits, per_day_notional_cap: '999999999' } }, init)).toBe(false);
    expect(planConfigMatches({ ...state, mpc_fee: '1000' }, init)).toBe(false);
    expect(planConfigMatches({ ...state, oracle: { ...init.oracle, min_price: '950000' } }, init)).toBe(false);
    expect(planConfigMatches({ ...state, limits: LIMITS, oracle: ORACLE })).toBe(true);
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

it('bounds the funded keeper debit at the immutable maximum mark', () => {
  const init = initialization(54,1,PROBE_ADDRESS, '3.6348');
  const upperPrice = orderPrice(BigInt(init.oracle.max_price), init.size_decimals, true, init.limits.price_band_bps);
  // Reductions round upward to the venue tick, including at the immutable maximum.
  expect(upperPrice).toBe(4405400n);
  const notional = (BigInt(init.limits.max_short_size) * upperPrice + 10n ** 24n - 1n) / 10n ** 24n;
  const debit = (notional * 1000450n + 999999n) / 1000000n;
  expect(debit * 1000n).toBe(22036913000n);
});
