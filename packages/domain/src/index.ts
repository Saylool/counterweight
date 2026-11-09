import { z } from 'zod';

// Bounds also keep intermediate dollar arithmetic finite. USD/USDC parity is a replay assumption.
const money = z.number().finite().min(0).max(1e15);
const equity = z.number().finite().min(-1e15).max(1e15);
const time = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const HOUR_MS = 3_600_000;
export const NEAR_MAINTENANCE_TIERS = [
  { lowerBound: 0, maxLeverage: 10 },
  { lowerBound: 20_000_000, maxLeverage: 5 },
] as const;
export const MAINTENANCE_SOURCE = 'https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-tiers';

/** NEAR mainnet table 52: integrate marginal maintenance, preserving the deduction at $20m. */
export function maintenanceMargin(notional: unknown): number {
  const n = z.number().finite().min(0).max(1e16).parse(notional);
  return Math.min(n, 20_000_000) * 0.05 + Math.max(0, n - 20_000_000) * 0.1;
}
export const ExposureSchema = z.object({ shortNotional: money, venueEquity: equity }).strict();
export function stressMetrics(input: unknown) {
  const { shortNotional: n, venueEquity: e } = ExposureSchema.parse(input);
  const reserve = Math.max(5, 0.1 * n);
  const stressedMaintenance = maintenanceMargin(1.5 * n);
  const ratio = e > 0 ? n / e : n === 0 && e === 0 ? 0 : null;
  return {
    // null represents undefined/infinite leverage; JSON-safe, never masks an insolvent account.
    leverage: ratio !== null && Number.isFinite(ratio) ? ratio : null,
    reserve, stressedMaintenance, headroom: e - 0.5 * n - stressedMaintenance - reserve,
  };
}
export const FundingObservationSchema = z.object({ time, rate: z.number().finite().min(-1).max(1) }).strict();
export const FundingSeriesSchema = z.array(FundingObservationSchema).superRefine((rows, ctx) => {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i]!.time % HOUR_MS !== 0 || (i > 0 && rows[i]!.time <= rows[i - 1]!.time))
      ctx.addIssue({ code: 'custom', message: 'Funding times must be strictly increasing UTC hour ends' });
  }
});
export function fundingStats(input: unknown, asOf: unknown) {
  const rows = FundingSeriesSchema.parse(input);
  const now = time.parse(asOf);
  // Ignore future observations even if a caller accidentally supplied a longer series.
  const known = rows.filter(r => r.time <= now);
  const hourEnd = Math.floor(now / HOUR_MS) * HOUR_MS;
  const trailing = known.filter(r => r.time > hourEnd - 24 * HOUR_MS && r.time <= hourEnd);
  const complete24h = trailing.length === 24 && trailing.every((r, i) => r.time === hourEnd - (23 - i) * HOUR_MS);
  let consecutiveNegativeHours = 0;
  for (let i = known.length - 1, expected = hourEnd; i >= 0; i--, expected -= HOUR_MS) {
    if (known[i]!.time !== expected || known[i]!.rate >= 0) break;
    consecutiveNegativeHours++;
  }
  return { complete24h, trailing24hRate: complete24h ? trailing.reduce((s, r) => s + r.rate, 0) : null, consecutiveNegativeHours };
}

/** Replay protocol constants are structural choices; only confirmation is selected on training data. */
export const CarryRuleSchema = z.object({
  positiveHours: z.number().int().min(1).max(24),
  minimumHoldHours: z.literal(72).default(72), cooldownHours: z.literal(24).default(24),
  entryHeadroomFraction: z.literal(0.2).default(0.2), entryLeverageCap: z.literal(0.9).default(0.9),
}).strict();
export type CarryRule = z.input<typeof CarryRuleSchema>;
export function carrySignal(input: unknown, asOf: number, ruleInput: CarryRule) {
  const rule = CarryRuleSchema.parse(ruleInput);
  const rows = FundingSeriesSchema.parse(input).filter(r => r.time <= asOf);
  const stats = fundingStats(rows, asOf);
  const confirmation = rows.slice(-rule.positiveHours);
  const positiveConfirmed = confirmation.length === rule.positiveHours && confirmation.every((r, i) =>
    r.rate > 0 && r.time === asOf - (rule.positiveHours - 1 - i) * HOUR_MS);
  return { ...stats, positiveConfirmed,
    enter: positiveConfirmed && stats.complete24h && stats.trailing24hRate! > 0,
    fundingExit: stats.consecutiveNegativeHours >= 6 && stats.complete24h && stats.trailing24hRate! < 0 };
}
export const RiskInputSchema = ExposureSchema.extend({
  intent: z.enum(['enter', 'monitor']), now: time, observedAt: time,
  maxDataAgeMs: z.number().int().positive().max(HOUR_MS),
  unresolvedOrders: z.number().int().nonnegative(), reconciled: z.boolean(),
  depth: z.object({ availableNotional: money, impactBps: z.number().finite().nonnegative() }).strict(),
  funding: FundingSeriesSchema,
  state: z.object({ entryHalted: z.boolean() }).strict(),
  adl: z.boolean(), unexpectedReductionQuantity: money,
}).strict();
export type RiskInput = z.infer<typeof RiskInputSchema>;
export type EntryBlock = 'stale-data' | 'future-data' | 'unresolved-orders' | 'unreconciled' | 'funding-incomplete' |
  'nonpositive-funding' | 'stress-failed' | 'depth-failed' | 'leverage-exceeded' | 'entry-halted' | 'minimum-order';
export type ActionProposal =
  | { type: 'enter'; shortNotional: number; supervised: true }
  | { type: 'full-unwind'; reduceOnly: true; fraction: 1; reason: 'stress-headroom'; requiresSpotApproval: true }
  | { type: 'exit-proposal'; reduceOnly: true; fraction: 1; reason: 'six-negative-hours'; requiresSpotApproval: true }
  | { type: 'stop-entry'; reason: 'adl' | 'unexpected-reduction' | 'latched' }
  | { type: 'sell-spot-proposal'; quantity: number; ownerApprovalRequired: true }
  | { type: 'reconcile'; reason: 'unresolved-orders' | 'unreconciled' | 'stale-data' | 'future-data' };

/** Soft keeper policy only. No clock, network, wallet, signatures, mutation, or execution. */
export function evaluateRisk(input: unknown) {
  const x = RiskInputSchema.parse(input);
  const metrics = stressMetrics({ shortNotional: x.shortNotional, venueEquity: x.venueEquity });
  const funding = fundingStats(x.funding, x.now);
  const entryBlocks: EntryBlock[] = [];
  const proposals: ActionProposal[] = [];
  const entryHalted = x.state.entryHalted || x.adl || x.unexpectedReductionQuantity > 0;
  if (entryHalted) {
    entryBlocks.push('entry-halted');
    proposals.push({ type: 'stop-entry', reason: x.adl ? 'adl' : x.unexpectedReductionQuantity > 0 ? 'unexpected-reduction' : 'latched' });
    if (x.unexpectedReductionQuantity > 0) proposals.push({ type: 'sell-spot-proposal', quantity: x.unexpectedReductionQuantity, ownerApprovalRequired: true });
  }
  if (x.observedAt > x.now) entryBlocks.push('future-data');
  else if (x.now - x.observedAt > x.maxDataAgeMs) entryBlocks.push('stale-data');
  if (x.unresolvedOrders > 0) entryBlocks.push('unresolved-orders');
  if (!x.reconciled) entryBlocks.push('unreconciled');
  for (const reason of ['future-data', 'stale-data', 'unresolved-orders', 'unreconciled'] as const)
    if (entryBlocks.includes(reason)) proposals.push({ type: 'reconcile', reason });
  if (!funding.complete24h) entryBlocks.push('funding-incomplete');
  else if (funding.trailing24hRate! <= 0) entryBlocks.push('nonpositive-funding');
  if (metrics.headroom <= 0) entryBlocks.push('stress-failed');
  if (x.depth.availableNotional < x.shortNotional || x.depth.impactBps > 25) entryBlocks.push('depth-failed');
  if (metrics.leverage === null || metrics.leverage > 1 || x.venueEquity <= 0) entryBlocks.push('leverage-exceeded');
  if (x.shortNotional < 10) entryBlocks.push('minimum-order');
  if (x.intent === 'monitor' && x.shortNotional > 0) {
    // Emergency de-risking remains proposed even when ordinary entry is blocked.
    if (metrics.headroom < 0.1 * x.shortNotional)
      proposals.push({ type: 'full-unwind', reduceOnly: true, fraction: 1, reason: 'stress-headroom', requiresSpotApproval: true });
    else if (funding.consecutiveNegativeHours >= 6)
      proposals.push({ type: 'exit-proposal', reduceOnly: true, fraction: 1, reason: 'six-negative-hours', requiresSpotApproval: true });
  }
  if (x.intent === 'enter' && entryBlocks.length === 0) proposals.push({ type: 'enter', shortNotional: x.shortNotional, supervised: true });
  return { metrics, funding, entryBlocks, proposals, state: { entryHalted } };
}

/** Fractions of current short notional; latency/caps are protocol constants, not fitted. */
export const RebalanceRuleSchema = z.object({
  lower: z.number().finite().min(0.1).max(1),
  target: z.number().finite().min(0.1).max(2),
  upper: z.number().finite().min(0.1).max(3),
  latencyHours: z.literal(1).default(1),
}).strict().refine(r => r.lower < r.target && r.target < r.upper, 'Require lower < target < upper');
export type RebalanceRule = z.input<typeof RebalanceRuleSchema>;
