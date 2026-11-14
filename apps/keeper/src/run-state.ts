import { z } from 'zod';
import { ceilDiv, evaluateRisk, policyUpperNotional } from '../../../packages/domain/src/index.js';
import { BASE, decimal, orderPrice, units, v3ExitPrice } from '../../../scripts/lifecycle-config.js';
import { parseAccount, type ExpectedCall } from '../../../scripts/lifecycle-parsing.js';
import { NEXT_POLICY, V3_POLICY } from '../../../scripts/testnet-common.js';

export const KEEPER = 'keeper.counterweight-samet.testnet';
export const uint = z.string().regex(/^\d+$/);
const seconds = z.number().int().positive().max(31_536_000);
export const stateSchema = z.object({
  network: z.enum(['Testnet', 'Mainnet']), keeper: z.string().min(2), coin: z.literal('NEAR'),
  signer_account: z.enum(['v1.signer-prod.testnet', 'v1.signer']), derivation_path: z.string().min(1),
  evm_recipient: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  asset_index: z.number().int().nonnegative(), size_decimals: z.number().int().min(0).max(6),
  limits: z.object({ max_short_size: uint, per_order_notional_cap: uint, per_day_notional_cap: uint,
    cooldown_seconds: z.number().int().nonnegative(), price_band_bps: z.number().int().min(0).max(1000),
    price_max_age_seconds: seconds, min_headroom_bps: z.number().int().min(0).max(10000).optional(), fee_reserve_usdc: uint.optional() }),
  oracle: z.object({ min_price: uint, max_price: uint, max_age_seconds: seconds }),
  oracle_price: uint, oracle_timestamp: uint, reference_price: uint, reference_price_timestamp: uint,
  last_keeper_heartbeat: uint, heartbeat_timeout_seconds: seconds,
  paused: z.boolean(), pending: z.unknown().refine(v => v !== undefined),
  spot_balance: uint, signed_short_size: uint, daily_usage: uint, last_nonce: uint, last_open_expiry: uint,
});
export type PolicyState = z.infer<typeof stateSchema>;
export type Account = ReturnType<typeof parseAccount>;
export interface Observation {
  observedAt: number; mark: number; funding: number; assetIndex: number; szDecimals: number;
  fundingHistory: { time: number; rate: number }[];
  depth: { availableNotional: number; impactBps: number };
  clearinghouseState: unknown; account: Account; openOrders: unknown[];
  responses: Record<string, unknown>;
}
export interface RiskSettings { minHeadroomBps: number; feeReserve: number }
export function riskSettings(state: PolicyState, rebalance: unknown): RiskSettings {
  const limits = rebalance === null ? undefined : z.object({ limits: z.object({
    min_headroom_bps: z.number().int().min(0).max(10000), fee_reserve_usdc: uint,
  }) }).parse(rebalance).limits;
  return { minHeadroomBps: state.limits.min_headroom_bps ?? limits?.min_headroom_bps ?? 1000,
    feeReserve: Number(state.limits.fee_reserve_usdc ?? limits?.fee_reserve_usdc ?? '100000') / 1e6 };
}
export function heartbeatDue(state: PolicyState, now: number) {
  return now / 1000 >= Number(state.last_keeper_heartbeat) + state.heartbeat_timeout_seconds / 3;
}
export function priceNeeded(state: PolicyState, mark: number, observedAt: number, now: number, policy = NEXT_POLICY) {
  const price = BigInt(Math.round(mark * 1e6));
  if (policy === V3_POLICY || state.network === 'Mainnet' ? price < 10n || price > 1_000_000_000_000n
    : price < BigInt(state.oracle.min_price) || price > BigInt(state.oracle.max_price)) throw new Error('Policy mark outside immutable bounds');
  if (observedAt > now || now - observedAt > Math.min(30_000, state.oracle.max_age_seconds * 1000)) throw new Error('Policy stale market');
  return price !== BigInt(state.reference_price) || now / 1000 - Number(state.reference_price_timestamp) >= Math.min(state.limits.price_max_age_seconds, state.oracle.max_age_seconds) / 2;
}
export function effectivePrice(state: PolicyState, now: number) {
  const fresh = (timestamp: string, age: number) => Number(timestamp) <= now / 1000 && now / 1000 - Number(timestamp) <= age;
  if (BigInt(state.oracle_price) > 0n && fresh(state.oracle_timestamp, state.oracle.max_age_seconds)) return BigInt(state.oracle_price);
  if (fresh(state.reference_price_timestamp, Math.min(state.limits.price_max_age_seconds, state.oracle.max_age_seconds))) return BigInt(state.reference_price);
  throw new Error('Policy price cache stale');
}
export function assess(state: PolicyState, o: Observation, settings: RiskSettings, now: number, quantity = Math.abs(o.account.signedSize), intent: 'enter' | 'monitor' = 'monitor') {
  const risk = evaluateRisk({ intent, shortNotional: quantity * o.mark, shortQuantityNear: quantity, referencePriceUsd: o.mark,
    venueEquity: o.account.equity, feeReserveUsd: settings.feeReserve, priceBandBps: state.limits.price_band_bps,
    now, observedAt: o.observedAt, maxDataAgeMs: 30_000, unresolvedOrders: o.openOrders.length,
    reconciled: !o.account.otherPositions.length && o.account.signedSize <= 0 && state.pending === null &&
      units(String(Math.abs(o.account.signedSize)), 24) <= BigInt(state.signed_short_size),
    depth: o.depth, funding: o.fundingHistory, state: { entryHalted: state.paused }, adl: false, unexpectedReductionQuantity: 0 });
  const upper = policyUpperNotional(quantity, o.mark, state.limits.price_band_bps);
  return { ...risk, thresholdUsd: Number(ceilDiv(BigInt(Math.round(upper * 1e6)) * BigInt(settings.minHeadroomBps), 10000n)) / 1e6 };
}
export function planOrder(policy: string, state: PolicyState, o: Observation, settings: RiskSettings, now: number, allowOpen: boolean): ExpectedCall | null {
  const v3 = policy === V3_POLICY || state.network === 'Mainnet';
  if ((!v3 && state.paused) || state.pending !== null || o.openOrders.length || o.account.otherPositions.length || o.account.signedSize > 0) return null;
  if (state.asset_index !== o.assetIndex || state.size_decimals !== o.szDecimals) throw new Error('Policy market metadata mismatch');
  const risk = assess(state, o, settings, now);
  if (now < o.observedAt || now - o.observedAt > 30_000) return null;
  const reduce = o.account.signedSize < 0 && risk.metrics.headroom < risk.thresholdUsd;
  const step = 10n ** BigInt(24 - o.szDecimals);
  const oracleFresh = BigInt(state.oracle_price) > 0n && Number(state.oracle_timestamp) <= Math.floor(now / 1000)
    && Math.floor(now / 1000) - Number(state.oracle_timestamp) <= Math.min(state.oracle.max_age_seconds, 60);
  const reference = v3 && reduce ? (oracleFresh ? BigInt(state.oracle_price) : BigInt(Math.round(o.mark * 1e6))) : effectivePrice(state, now);
  if (v3 && reduce && (reference < 10n || reference > 1_000_000_000_000n)) throw new Error('Policy exit mark outside sanity bounds');
  let size: bigint;
  if (reduce) {
    size = units(o.account.signedSizeText.slice(1), 24);
    const cap = BigInt(state.signed_short_size) > BigInt(state.limits.max_short_size) ? BigInt(state.signed_short_size) : BigInt(state.limits.max_short_size);
    size = size < cap ? size : cap;
  } else {
    if (state.network === 'Mainnet' && o.account.equity > 20) return null;
    if (state.paused || reference < BigInt(state.oracle.min_price) || reference > BigInt(state.oracle.max_price)) return null;
    if (!allowOpen || o.account.signedSize !== 0 || BigInt(state.signed_short_size) !== 0n || now <= Number(state.last_open_expiry) ||
      now < Number(state.last_nonce) + state.limits.cooldown_seconds * 1000 || o.funding <= 0) return null;
    // Do not reset daily usage locally: the contract is authoritative (including rolling windows).
    const remaining = BigInt(state.limits.per_day_notional_cap) - BigInt(state.daily_usage);
    const cap = remaining < BigInt(state.limits.per_order_notional_cap) ? remaining : BigInt(state.limits.per_order_notional_cap);
    if (cap <= 0n) return null;
    const conservative = reference > BigInt(Math.round(o.mark * 1e6)) ? reference : BigInt(Math.round(o.mark * 1e6));
    const upper = (conservative * BigInt(10000 + state.limits.price_band_bps) + 9999n) / 10000n;
    size = [cap * BASE / upper, BigInt(state.spot_balance), BigInt(state.limits.max_short_size)].reduce((a, b) => a < b ? a : b);
  }
  size = size / step * step;
  if (size <= 0n) return null;
  if (!reduce) {
    const q = Number(decimal(size, 24)), entry = assess(state, o, settings, now, q, 'enter');
    if (entry.entryBlocks.length || entry.metrics.headroom < entry.thresholdUsd || o.account.withdrawable < q * o.mark ||
      size * orderPrice(reference, o.szDecimals, false, state.limits.price_band_bps) < 10_000_000n * BASE) return null;
  }
  const args = { order: { asset_index: o.assetIndex, size: size.toString(), reduce_only: reduce,
    reference_price: reduce ? String(Math.round(o.mark * 1e6)) : null,
    ...(v3 && reduce ? { observed_at: String(Math.floor(o.observedAt / 1000)) } : {}) } };
  return { method: 'request_order_signature', args, caller: state.keeper, policy, asset: o.assetIndex, reduceOnly: reduce,
    size: decimal(size, 24), price: decimal(v3 && reduce ? v3ExitPrice(reference, o.szDecimals) : orderPrice(reference, o.szDecimals, reduce, state.limits.price_band_bps), 6),
    recipient: state.evm_recipient, amount: '0' };
}
