import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { base58 } from '@scure/base';
import { getSigningDigest, recoveredSigner, type SigningInput } from '../packages/hyperliquid/src/index.js';
import type { PublicClient } from '../apps/keeper/src/run-io.js';
import { mainnetInitialization, MAINNET_MARGIN_LIMITS } from './mainnet-lifecycle.js';
import { assertFinalSuccess, assertOwnerPlan, assertWithdrawalAbandonmentAllowed, chooseSpot, OWNER_ACCOUNTS, predeleteGate, reconcileOwnerJournal, verifySigningTest } from './mainnet-owner.js';
import * as signer from './mainnet-signer.js';
import { BASE, units } from './lifecycle-config.js';

vi.mock('node:fs/promises', async original => ({
  ...await original<typeof import('node:fs/promises')>(),
  readFile: vi.fn(async () => JSON.stringify({ phase: 'final-success', hash: base58.encode(new Uint8Array(32).fill(7)) })),
}));
vi.mock('../packages/hyperliquid/src/index.js', async original => ({
  ...await original<typeof import('../packages/hyperliquid/src/index.js')>(),
  recoveredSigner: vi.fn(async () => `0x${'12'.repeat(20)}`),
}));
const address = `0x${'12'.repeat(20)}`, hash = base58.encode(new Uint8Array(32).fill(7));
const pk = `ed25519:${base58.encode(new Uint8Array(32).fill(8))}`;
const signature = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
const nonce = 1_794_314_000_000;
const market = { assetIndex: 7, szDecimals: 1, mark: '3.34' };
const resources = { fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, minimumGasTgas: 15, codeHash: signer.SIGNER_RELEASE.codeHash,
  version: '3.18.0', block: 'final', config: {}, depositSource: 'verified-release-bytecode' as const };
const plan = { network: 'mainnet' as const, ...OWNER_ACCOUNTS, market, init: mainnetInitialization(OWNER_ACCOUNTS.owner, OWNER_ACCOUNTS.keeper, address, market),
  derived: { address }, artifact: { codeHash: 'expected-v4-code', sha256: 'verified', bytes: 344776 }, marginLimits: MAINNET_MARGIN_LIMITS, signingResources: resources };
function receipt() {
  const input: SigningInput = { scheme: 'l1', network: 'mainnet', nonce, expiresAfter: nonce + 60000,
    action: { type: 'cancel', cancels: [{ a: market.assetIndex, o: 0 }] } };
  const event = (event: string, data: unknown) => ({ block_hash: `${event}-block`, outcome: { executor_id: plan.policy,
    status: { SuccessValue: 'dHJ1ZQ==' }, logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', version: '1.0.0', event, data: [data] })}`] } });
  return { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' }, transaction: { hash, signer_id: plan.keeper, receiver_id: plan.policy,
    actions: [{ FunctionCall: { method_name: 'request_cancel_signature', deposit: '0', args: Buffer.from(JSON.stringify({ order_id: '0' })).toString('base64') } }] },
    receipts_outcome: [event('request', { id: '1', caller: plan.keeper, kind: 'Cancel', digest: getSigningDigest(input).slice(2), payload: { action: input.action, nonce, expiresAfter: nonce + 60000 } }),
      event('signature', { id: '1', nonce: String(nonce), expiresAfter: String(nonce + 60000), signature })] };
}
function gateClient() {
  const state = { ...plan.init, near_recipient: plan.owner, spot_balance: '0', pending: null, paused: false,
    mpc_fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30 };
  const snapshot = { state, block: 'final', codeHash: plan.artifact.codeHash, keyless: false, rebalance: null };
  const raw = receipt();
  let margin: unknown = { limits: MAINNET_MARGIN_LIMITS, withdrawal: null };
  const rpc = vi.fn(async (method: string, params: Record<string, unknown>) => {
    if (method === 'tx') return raw;
    if (params.request_type === 'view_account') return { amount: String(BASE / 10n), locked: '0', storage_usage: 200, code_hash: 'keeper-code', block_hash: 'final' };
    if (params.account_id === plan.policy) return { block_hash: 'final', keys: [{ public_key: pk, access_key: { permission: 'FullAccess' } }] };
    return { keys: [{ access_key: { permission: 'FullAccess' } }] };
  });
  const pc = { policy: vi.fn(async () => snapshot), derive: vi.fn(async () => address), rpc,
    view: vi.fn(async (_account: string, method: string) => ({ block: 'final', value: method === 'get_state' ? state : method === 'get_margin' ? margin : '0' })) } as unknown as PublicClient;
  vi.spyOn(signer, 'readSigningResources').mockResolvedValue(resources);
  return { pc, raw, state, snapshot, setMargin: (value: unknown) => { margin = value; } };
}
afterEach(() => vi.restoreAllMocks());

describe('owner budgets and fixed account identities', () => {
  it('fixes owner and both direct child account names', () => {
    expect(() => assertOwnerPlan(plan)).not.toThrow();
    for (const key of ['owner', 'policy', 'keeper'] as const) expect(() => assertOwnerPlan({ ...plan, [key]: 'other.near' })).toThrow('mismatch');
  });
  it('caps newly wrapped backing and the complete allocation at 11.20 NEAR', () => {
    for (const mark of ['2.70', '3.34', '10']) {
      const chosen = chooseSpot(mark, 1, String(100n * BASE));
      expect(BigInt(chosen.yocto)).toBeLessThanOrEqual(398n * BASE / 100n);
      expect(units(chosen.totalNear, 24)).toBe(722n * BASE / 100n + BigInt(chosen.yocto));
      expect(units(chosen.totalNear, 24)).toBeLessThanOrEqual(112n * BASE / 10n);
    }
  });
  it('fails before funding when the budget or immutable quantity ceiling cannot fit the venue minimum', () => {
    expect(() => chooseSpot('2', 1, String(100n * BASE))).toThrow('$10 minimum');
    expect(() => chooseSpot('3.34', 1, String(BASE))).toThrow('$10 minimum');
  });
});

describe('actual signature and key deletion gate', () => {
  it('uses actual numeric authorization ABI and strict finalized expiry for withdrawal abandonment', () => {
    const expiry = nonce + 172_800_001;
    const a = { nonce, withdrawal: true, expires_after: expiry, invalidation_confirmed: false };
    expect(() => assertWithdrawalAbandonmentAllowed([a], BigInt(nonce), BigInt(expiry))).toThrow('remains replayable');
    expect(() => assertWithdrawalAbandonmentAllowed([a], BigInt(nonce), BigInt(expiry + 1))).not.toThrow();
    expect(() => assertWithdrawalAbandonmentAllowed([{ ...a, invalidation_confirmed: true }], BigInt(nonce), BigInt(nonce))).not.toThrow();
    // get_state filters naturally expired authorizations, so an empty view must
    // still respect the original user signature's full two-day replay window.
    expect(() => assertWithdrawalAbandonmentAllowed([], BigInt(nonce), BigInt(expiry))).toThrow('remains replayable');
    expect(() => assertWithdrawalAbandonmentAllowed([], BigInt(nonce), BigInt(expiry + 1))).not.toThrow();
  });
  it('skips a finalized owner sub-step by proving its exact saved transaction publicly', async () => {
    const args = ['contract', 'call-function', 'as-transaction', 'wrap.near', 'near_deposit', 'json-args', '{}', 'prepaid-gas', '30 Tgas', 'attached-deposit', '3.6 NEAR'];
    const raw = { final_execution_status: 'FINAL', status: { SuccessValue: '' }, transaction: { hash, signer_id: plan.owner, receiver_id: 'wrap.near', actions: [{ FunctionCall: { method_name: 'near_deposit', args: Buffer.from('{}').toString('base64'), deposit: '3600000000000000000000000', gas: '30000000000000' } }] }, receipts_outcome: [] };
    const rpc = vi.fn(async () => raw), pc = { rpc } as unknown as PublicClient;
    await expect(reconcileOwnerJournal({ phase: 'final-success', args, hash, signer: plan.owner, receiver: 'wrap.near' }, args, plan.owner, 'wrap.near', pc)).resolves.toEqual({ hash, raw });
    await expect(reconcileOwnerJournal({ phase: 'sent-awaiting-finality', args, hash, signer: plan.owner, receiver: 'wrap.near' }, args, plan.owner, 'wrap.near', pc)).resolves.toEqual({ hash, raw });
    await expect(reconcileOwnerJournal({ phase: 'claimed-before-send', args, signer: plan.owner, receiver: 'wrap.near' }, args, plan.owner, 'wrap.near', pc)).rejects.toThrow('uncertain');
    await expect(reconcileOwnerJournal({ phase: 'final-success', args: ['different'], hash, signer: plan.owner, receiver: 'wrap.near' }, args, plan.owner, 'wrap.near', pc)).rejects.toThrow('arguments differ');
    expect(rpc).toHaveBeenCalledTimes(2);
    raw.transaction.actions[0]!.FunctionCall.deposit = '1';
    await expect(reconcileOwnerJournal({ phase: 'final-success', args, hash, signer: plan.owner, receiver: 'wrap.near' }, args, plan.owner, 'wrap.near', pc)).rejects.toThrow('ABI arguments');
  });
  it('validates the real serialization of the no-exposure cancellation signature path', async () => {
    await expect(verifySigningTest(receipt(), hash, plan)).resolves.toMatchObject({ nonce, expiresAfter: nonce + 60000 });
  });
  it('rejects a failed child receipt even if the outer transaction claims success', async () => {
    const raw = receipt();
    raw.receipts_outcome[1]!.outcome.status = { Failure: { ActionError: {} } } as never;
    await expect(verifySigningTest(raw, hash, plan)).rejects.toThrow();
  });
  it('rejects a callback that returns false, an alternate market, and a mismatched recovered signer', async () => {
    const falseCallback = receipt(); falseCallback.status.SuccessValue = 'ZmFsc2U=';
    await expect(verifySigningTest(falseCallback, hash, plan)).rejects.toThrow();
    await expect(verifySigningTest(receipt(), hash, { ...plan, init: { ...plan.init, asset_index: 8 } })).rejects.toThrow();
    vi.mocked(recoveredSigner).mockResolvedValueOnce(`0x${'34'.repeat(20)}`);
    await expect(verifySigningTest(receipt(), hash, plan)).rejects.toThrow('recovery mismatch');
  });
  it('proves configured deployed code and the signing path before returning the sole public key', async () => {
    const x = gateClient();
    await expect(predeleteGate(x.pc, plan)).resolves.toMatchObject({ publicKey: pk, proof: { hash } });
    expect(x.pc.policy).toHaveBeenCalledTimes(3);
  });
  it('blocks key deletion for wrong code, absent margin configuration, or failed signing', async () => {
    const wrongCode = gateClient(); wrongCode.snapshot.codeHash = 'empty-or-other-code';
    await expect(predeleteGate(wrongCode.pc, plan)).rejects.toThrow('code/access-key');
    const noMargin = gateClient(); noMargin.setMargin(null);
    await expect(predeleteGate(noMargin.pc, plan)).rejects.toThrow('configured');
    const failed = gateClient(); failed.raw.status.SuccessValue = 'ZmFsc2U=';
    await expect(predeleteGate(failed.pc, plan)).rejects.toThrow();
  });
  it('blocks key deletion for mismatched margin limits or signing resources', async () => {
    const margin = gateClient(); margin.setMargin({ limits: { ...MAINNET_MARGIN_LIMITS, max_fee_usdc: '99999999' } });
    await expect(predeleteGate(margin.pc, plan)).rejects.toThrow('margin limits mismatch');
    const fee = gateClient(); fee.state.mpc_fee = '0';
    await expect(predeleteGate(fee.pc, plan)).rejects.toThrow('mpc_fee');
  });
  it('confirms account creation against the parent signer and the new-child receiver', async () => {
    const raw = { final_execution_status: 'FINAL', status: { SuccessValue: '' }, transaction: { hash, signer_id: plan.owner, receiver_id: plan.policy }, receipts_outcome: [] };
    await expect(assertFinalSuccess(raw, hash, plan.owner, plan.policy)).resolves.toBeDefined();
    await expect(assertFinalSuccess(raw, hash, plan.owner, plan.owner)).rejects.toThrow();
  });
});
