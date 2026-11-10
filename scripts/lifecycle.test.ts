import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { base58 } from '@scure/base';
import { getSigningDigest, type SigningInput } from '../packages/hyperliquid/src/index.js';
import { BASE, decimal, FUNDED_LIMITS, orderPrice, parseMarket, priceBounds, units, withdrawalConfig } from './lifecycle-config.js';
import { buildOrder, withdrawalSetupReady } from './lifecycle.js';
import { parseAccount, parseFills, parseLifecycleReceipt, parseOrderResponse, parseWithdrawal, verifyFill, type ExpectedCall } from './lifecycle-parsing.js';
import { deploymentSteps, initialization, spotSteps } from './testnet-plan.js';
import { KEEPER, NEXT_POLICY, OWNER } from './testnet-common.js';
import { policyStateSchema } from './testnet-verify.js';

const recipient = `0x${'12'.repeat(20)}`;
const mark = '3.6348';
const nonce = 1794314000000;
const hash = base58.encode(new Uint8Array(32).fill(7));
const hlHash = `0x${'ab'.repeat(32)}`;
const signature = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
const init = initialization(54, 1, recipient, mark);
function state() { return policyStateSchema.parse({ ...init, coin: 'NEAR', near_recipient: OWNER, spot_balance: (5n * BASE).toString(),
  signed_short_size: '0', last_open_expiry: '0', paused: false, pending: null, mpc_fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, keeper_weight_limit: '5000' }); }
function rawAccount(szi = '0') { return { marginSummary: { accountValue: '50', totalMarginUsed: '1' }, withdrawable: '49',
  assetPositions: szi === '0' ? [] : [{ position: { coin: 'NEAR', szi, positionValue: '12', marginUsed: '1', cumFunding: { allTime: '0', sinceOpen: '0.01', sinceChange: '0' } } }] }; }
const market = { assetIndex: 54, szDecimals: 1, mark, funding: '0.0000125', capturedAt: '2026-11-10T12:18:13.419Z', source: 'test', request: { type: 'metaAndAssetCtxs' } };
function receiptFixture(withdraw = false) {
  const expected: ExpectedCall = { policy: NEXT_POLICY, caller: withdraw ? OWNER : KEEPER, asset: 54, reduceOnly: false, size: '3.4', price: '3.5984', recipient, amount: '48',
    method: withdraw ? 'request_evm_withdrawal' : 'request_order_signature',
    args: withdraw ? { recipient, amount: '48000000' } : { order: { asset_index: 54, size: (34n * BASE / 10n).toString(), reduce_only: false, reference_price: null } } };
  const input: SigningInput = withdraw ? { scheme: 'user', network: 'testnet', action: { type: 'withdraw3', destination: recipient, amount: '48', time: nonce } } :
    { scheme: 'l1', network: 'testnet', nonce, expiresAfter: nonce + 60000, action: { type: 'order', grouping: 'na', orders: [{ a: 54, b: false, r: false, p: expected.price, s: '3.4', t: { limit: { tif: 'Ioc' } } }] } };
  const payload = input.scheme === 'l1' ? { action: input.action, nonce, expiresAfter: nonce + 60000 } : { action: { ...input.action, hyperliquidChain: 'Testnet', signatureChainId: '0x66eee' }, nonce };
  const events = [ { standard: 'counterweight', version: '1.0.0', event: 'request', data: [{ id: '1', caller: expected.caller, kind: withdraw ? 'EvmWithdrawal' : 'Increase', payload, digest: getSigningDigest(input).slice(2) }] },
    { standard: 'counterweight', version: '1.0.0', event: 'signature', data: [{ id: '1', nonce: String(nonce), expiresAfter: withdraw ? null : String(nonce + 60000), signature }] } ];
  const raw = { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' }, transaction: { hash, signer_id: expected.caller, receiver_id: NEXT_POLICY,
    actions: [{ FunctionCall: { method_name: expected.method, deposit: '0', args: Buffer.from(JSON.stringify(expected.args)).toString('base64') } }] },
    receipts_outcome: events.map((e, i) => ({ id: `r${i}`, block_hash: `b${i}`, outcome: { executor_id: NEXT_POLICY, status: { SuccessValue: 'dHJ1ZQ==' }, logs: [`EVENT_JSON:${JSON.stringify(e)}`] } })) };
  return { expected, input, raw, events };
}
describe('funded testnet config and command planning (offline)', () => {
  it('sets immutable 80–120% bounds from TESTNET mark and small funded caps', () => {
    expect(priceBounds(mark)).toEqual({ reference_price: '3634800', min_price: '2907840', max_price: '4361760' });
    expect(init).toMatchObject({ network: 'Testnet', evm_recipient: recipient, reference_price: '3634800', limits: FUNDED_LIMITS,
      oracle: { account_id: null, max_age_seconds: 60, min_price: '2907840', max_price: '4361760' } });
  });
  it.each(['0', '-1', 'NaN', 'Infinity', '1e100'])('rejects invalid marks %s', value => expect(() => priceBounds(value)).toThrow());
  it('rejects missing, duplicate and delisted testnet NEAR metadata', () => {
    const asset = { name: 'NEAR', szDecimals: 1 };
    expect(parseMarket([{ universe: [asset] }, [{ markPx: mark, funding: '0.1' }]])).toMatchObject({ assetIndex: 0, mark });
    for (const universe of [[], [asset, asset], [{ ...asset, isDelisted: true }]]) expect(() => parseMarket([{ universe }, [{ markPx: mark, funding: '0' }]])).toThrow();
  });
  it('validates the NEAR context without rejecting unrelated delisted contexts', () => {
    expect(parseMarket([{ universe: [{ name: 'OTHER', szDecimals: 1 }, { name: 'NEAR', szDecimals: 1 }] },
      [{ markPx: null, funding: null }, { markPx: mark, funding: '0' }]])).toMatchObject({ assetIndex: 1, mark });
    expect(() => parseMarket([{ universe: [{ name: 'NEAR', szDecimals: 1 }] }, [{ markPx: null, funding: '0' }]])).toThrow();
  });
  it('never offers withdrawal setup before trading, settlement, expiry and zero orders', () => {
    const a = parseAccount(rawAccount()), s = { ...state(), last_open_expiry: String(nonce) };
    expect(withdrawalSetupReady(s, a, nonce + 1, [])).toBe(true);
    expect(withdrawalSetupReady(state(), a, nonce + 1, [])).toBe(false);
    expect(withdrawalSetupReady(s, a, nonce, [])).toBe(false);
    expect(withdrawalSetupReady({ ...s, signed_short_size: '1' }, a, nonce + 1, [])).toBe(false);
    expect(withdrawalSetupReady({ ...s, pending: {} }, a, nonce + 1, [])).toBe(false);
    expect(withdrawalSetupReady(s, parseAccount(rawAccount('-1')), nonce + 1, [])).toBe(false);
    expect(withdrawalSetupReady(s, a, nonce + 1, [{}])).toBe(false);
  });
  it('uses keychain signing, an empty FT message, real wrap deposit and separate final key removal', () => {
    const steps = deploymentSteps(init, 'a'.repeat(64));
    expect(spotSteps().map(s => s.command).join('\n')).toContain('"msg":""');
    expect(steps.findIndex(s => s.command.includes('ft_transfer_call'))).toBeLessThan(steps.findIndex(s => s.command.includes('delete-keys')));
    for (const s of steps.filter(s => s.command.includes(' send'))) expect(s.command).toContain('sign-with-keychain');
    expect(spotSteps()[2]!.command).toContain("near_deposit json-args '{}' prepaid-gas '30 Tgas' attached-deposit '5 NEAR'");
  });
  it('sizes an IOC above $10, within caps and backed by held spot', () => {
    const order = buildOrder(state(), market, parseAccount(rawAccount()), false);
    expect(order).toMatchObject({ size: '3.4', price: '3.5984', reference: '3634800' });
    expect(order.args.order).toMatchObject({ reduce_only: false, reference_price: null });
  });
  it('closes exact observed partial size with reduce-only and bounded fallback', () => {
    const order = buildOrder(state(), market, parseAccount(rawAccount('-1.7')), true);
    expect(order).toMatchObject({ size: '1.7', price: '3.6712', args: { order: { reduce_only: true, reference_price: '3634800' } } });
  });
  it('blocks stale-state hazards, insufficient spot/margin and out-of-bounds mark', () => {
    const s = state(), a = parseAccount(rawAccount());
    for (const changed of [{ ...s, spot_balance: '1' }, { ...s, paused: true }, { ...s, pending: {} }, { ...s, signed_short_size: '1' }]) expect(() => buildOrder(changed, market, a, false)).toThrow();
    expect(() => buildOrder(s, { ...market, mark: '100' }, a, false)).toThrow();
    expect(() => buildOrder(s, market, { ...a, equity: 1, withdrawable: 1 }, false)).toThrow();
    expect(() => buildOrder(s, market, { ...a, signedSize: 1 }, false)).toThrow();
  });
  it('configures the existing WASM withdrawal gate only after close, with bounded fixed destinations', () => {
    const config = withdrawalConfig(recipient, (5n * BASE).toString(), init.oracle.min_price, NEXT_POLICY);
    expect(config).toMatchObject({ adapter: `disabled-routes.${NEXT_POLICY}`, strategy_margin_address: recipient,
      per_sale_near: '1', per_withdrawal_usdc: '60000000', min_residual_equity_usdc: '1000000', original_target_usdc: '14539200' });
    expect(BigInt(config.original_target_usdc)).toBeLessThanOrEqual(BigInt(init.reference_price) * 5n);
    expect(() => withdrawalConfig(recipient, '0', init.oracle.min_price, NEXT_POLICY)).toThrow();
  });
  it('rounds prices exactly as contract and preserves atomic units', () => {
    expect(orderPrice(3634800n, 1, false)).toBe(3598400n);
    expect(orderPrice(3634800n, 1, true)).toBe(3671200n);
    expect(units('3.4', 24)).toBe(34n * BASE / 10n);
    expect(decimal(12_000_000n, 6)).toBe('12');
    expect(() => units('1.001', 2)).toThrow();
  });
});
describe('public response and MPC receipt parsing (offline)', () => {
  it('requires numeric public equity, position and cumulative funding', () => {
    expect(parseAccount(rawAccount('-3.4'))).toMatchObject({ equity: 50, signedSize: -3.4, funding: { sinceOpen: '0.01' } });
    expect(() => parseAccount({})).toThrow();
    expect(() => parseAccount({ ...rawAccount(), withdrawable: 'NaN' })).toThrow();
  });
  it.each([false, true])('binds ABI identity, operation, callback and digest (withdraw=%s)', withdraw => {
    const f = receiptFixture(withdraw);
    expect(parseLifecycleReceipt(f.raw, hash, f.expected).input).toEqual(f.input);
  });
  it.each(['caller', 'receiver', 'method', 'args', 'deposit', 'duplicate', 'executor', 'callback', 'digest', 'nonce', 'market', 'price', 'size', 'reduce', 'tif', 'expiry', 'destination', 'amount', 'chain'])('rejects mismatched receipt %s', change => {
    const withdraw = ['destination', 'amount', 'chain'].includes(change);
    const f = receiptFixture(withdraw), tx = f.raw;
    if (change === 'caller') tx.transaction.signer_id = OWNER + '.other';
    if (change === 'receiver') tx.transaction.receiver_id = OWNER;
    if (change === 'method') tx.transaction.actions[0]!.FunctionCall.method_name = 'sign' as any;
    if (change === 'args') tx.transaction.actions[0]!.FunctionCall.args = 'e30=';
    if (change === 'deposit') tx.transaction.actions[0]!.FunctionCall.deposit = '1';
    if (change === 'duplicate') tx.receipts_outcome.push(tx.receipts_outcome[0]!);
    if (change === 'executor') tx.receipts_outcome[0]!.outcome.executor_id = OWNER;
    if (change === 'callback') tx.receipts_outcome[1]!.outcome.status.SuccessValue = 'ZmFsc2U=';
    const req = f.events[0]!.data[0] as any;
    if (change === 'digest') req.digest = '0'.repeat(64);
    if (change === 'nonce') req.payload.nonce++;
    if (change === 'expiry') req.payload.expiresAfter += 1;
    if (['market','price','size','reduce','tif'].includes(change)) {
      const o = req.payload.action.orders[0];
      if (change === 'market') o.a = 1;
      if (change === 'price') o.p = '1';
      if (change === 'size') o.s = '100';
      if (change === 'reduce') o.r = true;
      if (change === 'tif') o.t.limit.tif = 'Gtc';
    }
    if (change === 'destination') req.payload.action.destination = `0x${'34'.repeat(20)}`;
    if (change === 'amount') req.payload.action.amount = '1';
    if (change === 'chain') req.payload.action.hyperliquidChain = 'Mainnet';
    tx.receipts_outcome[0]!.outcome.logs[0] = `EVENT_JSON:${JSON.stringify(f.events[0])}`;
    expect(() => parseLifecycleReceipt(tx, hash, f.expected)).toThrow();
  });
  const filled = { status: 'ok', response: { type: 'order', data: { statuses: [{ filled: { totalSz: '3.4', avgPx: mark, oid: 42 } }] } } };
  const fills = [{ coin: 'NEAR', oid: 42, time: nonce, hash: hlHash, side: 'A', sz: '3.4', px: mark, fee: '0.01', closedPnl: '0' }];
  it('proves an opening fill by order ID, timestamp, side, size and position delta', () => {
    expect(verifyFill(filled, fills, parseAccount(rawAccount()), parseAccount(rawAccount('-3.4')), '3.4', false, nonce)).toMatchObject({ fullFill: true, flat: false });
  });
  it('reports partial fills without claiming a complete lifecycle', () => {
    const partial = structuredClone(filled); partial.response.data.statuses[0]!.filled.totalSz = '1.7';
    expect(verifyFill(partial, [{ ...fills[0], sz: '1.7' }], parseAccount(rawAccount()), parseAccount(rawAccount('-1.7')), '3.4', false, nonce).fullFill).toBe(false);
  });
  it.each(['err', 'resting', 'empty', 'wrong-oid', 'wrong-side', 'old', 'delta'])('rejects unproven fills %s', change => {
    const response = change === 'err' ? { status: 'err', response: 'no funds' } : change === 'resting' ? { status: 'ok', response: { type: 'order', data: { statuses: [{ resting: { oid: 42 } }] } } } : filled;
    const changed = change === 'empty' ? [] : [{ ...fills[0], ...(change === 'wrong-oid' ? { oid: 1 } : change === 'wrong-side' ? { side: 'B' } : change === 'old' ? { time: nonce - 1 } : {}) }];
    expect(() => verifyFill(response, changed, parseAccount(rawAccount()), parseAccount(rawAccount(change === 'delta' ? '-1' : '-3.4')), '3.4', false, nonce)).toThrow();
  });
  it('requires ledger confirmation for accepted withdraw3; no success from an HTTP 200 alone', () => {
    const response = { status: 'ok', response: { type: 'default' } };
    const ledger = [{ hash: hlHash, time: nonce, delta: { type: 'withdraw', usdc: '48' } }];
    expect(parseWithdrawal(response, ledger, '48', nonce).hash).toBe(hlHash);
    expect(() => parseWithdrawal(response, [], '48', nonce)).toThrow();
    expect(() => parseWithdrawal(response, ledger, '49', nonce)).toThrow();
    expect(() => parseWithdrawal({ status: 'err' }, ledger, '48', nonce)).toThrow();
  });
  it('rejects malformed fill structures', () => {
    expect(() => parseFills([{ ...fills[0], sz: '-1' }])).toThrow();
    expect(() => parseOrderResponse({ status: 'ok' })).toThrow();
  });
});
