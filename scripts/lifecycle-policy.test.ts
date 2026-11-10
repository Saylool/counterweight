import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildOrder, transferNonceValid, assertTransferUnsubmitted, spotCommands, spotAmount, loadPlan } from './lifecycle.js';
import { BASE, v3ExitPrice } from './lifecycle-config.js';
import { parseAccount } from './lifecycle-parsing.js';
import { NEXT_POLICY, V3_POLICY, policyPlanFile } from './testnet-common.js';
import { policyStateSchema } from './testnet-verify.js';

const now = 1794314000000;
const plan = JSON.parse(readFileSync('docs/evidence/policy-v3-plan.json', 'utf8'));
const state = () => policyStateSchema.parse({ ...plan.init, coin: 'NEAR', near_recipient: plan.init.owner, spot_balance: String(5n * BASE),
  signed_short_size: String(4n * BASE), last_open_expiry: '0', paused: false, pending: null,
  mpc_fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, keeper_weight_limit: '5000' });
const account = parseAccount({ marginSummary: { accountValue: '50', totalMarginUsed: '1' }, withdrawable: '49',
  assetPositions: [{ position: { coin: 'NEAR', szi: '-4', positionValue: '12', marginUsed: '1', cumFunding: { allTime: '0', sinceOpen: '0', sinceChange: '0' } } }] });
const market = { assetIndex: plan.init.asset_index, szDecimals: plan.init.size_decimals, mark: '50.123456', funding: '0', capturedAt: new Date(now).toISOString(), source: 'test', request: { type: 'metaAndAssetCtxs' } };

describe('policy-specific lifecycle planning', () => {
  it.each([NEXT_POLICY, V3_POLICY])('loads the preserved plan for %s', async policy => {
    expect((await loadPlan(policyPlanFile(policy)!, policy)).policy).toBe(policy);
  });
  it('rejects cross-policy plans', async () => {
    await expect(loadPlan(policyPlanFile(NEXT_POLICY)!, V3_POLICY)).rejects.toThrow();
  });
  it('closes v3 outside the opening band while paused with exact 1% cap independent of configured band', () => {
    const s = state(); s.paused = true; s.limits.price_band_bps = 999;
    const order = buildOrder(s, market, account, true, V3_POLICY);
    expect(order.price).toBe('50.624');
    expect(order.args.order).toMatchObject({ reduce_only: true, reference_price: '50123456', observed_at: String(now / 1000) });
    expect(() => buildOrder(s, market, account, true)).toThrow();
    s.paused = false;
    expect(() => buildOrder(s, market, account, false, V3_POLICY)).toThrow('bounds');
    expect(() => buildOrder(s, market, account, true, NEXT_POLICY)).toThrow('bounds');
  });
  it('honors fresh oracle precedence for v3 exit receipt expectations', () => {
    const s = state(); s.oracle_price = '60123456'; s.oracle_timestamp = String(now / 1000);
    expect(buildOrder(s, market, account, true, V3_POLICY).price).toBe('60.724');
  });
  it.each([10n, 3634800n, 50123456n, 1_000_000_000_000n])('never rounds a v3 exit above the exact cap at %s', price => {
    expect(v3ExitPrice(price, 1) * 10000n).toBeLessThanOrEqual(price * 10100n);
  });
  it.each(['4', '0.125', '0.000000000000000000000001'])('prints arbitrary spot amounts %s for either policy', amount => {
    for (const policy of [NEXT_POLICY, V3_POLICY]) {
      const commands = spotCommands(policy, amount);
      expect(commands[2]).toContain(`'${amount} NEAR'`);
      expect(commands[3]).toContain(`"amount":"${spotAmount(amount)}"`);
      expect(commands[3]).toContain(`"receiver_id":"${policy}"`);
      expect(commands[3]).toContain('"msg":""');
    }
  });
  it.each(['0', '-1', '1e2', '1;echo bad', '0.0000000000000000000000001', '340282366920939'])('rejects invalid spot amount %s', amount => {
    expect(() => spotCommands(V3_POLICY, amount)).toThrow();
  });
});
describe('already-signed transfer guards', () => {
  it('uses the venue two-day window with transport margin, preserving the normal 60s relay path', () => {
    expect(transferNonceValid(now - 60001, now)).toBe(true);
    expect(transferNonceValid(now - 172800000 + 5001, now)).toBe(true);
    expect(transferNonceValid(now - 172800000 + 5000, now)).toBe(false);
    expect(transferNonceValid(now + 1001, now)).toBe(false);
  });
  it('blocks already-submitted or truncated transfer history even if balances were restored', () => {
    expect(() => assertTransferUnsubmitted([{ time: now, delta: { type: 'accountClassTransfer', usdc: '49', toPerp: true } }])).toThrow('already');
    expect(() => assertTransferUnsubmitted(Array.from({ length: 2000 }, () => ({ time: now, delta: { type: 'deposit' } })))).toThrow();
    expect(() => assertTransferUnsubmitted([])).not.toThrow();
    expect(() => assertTransferUnsubmitted({})).toThrow();
  });
});
