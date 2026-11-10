import { describe, expect, it, vi, afterEach } from 'vitest';
import { HOUR_MS, RebalanceRuleSchema } from './index.js';
import { simulate, COSTS } from '../../../apps/keeper/src/replay.js';
import { ReplaySolvencyError } from '../../../apps/keeper/src/rebalance.js';
import { selectRebalanceRule } from '../../../apps/keeper/src/rebalance-selection.js';
import type { MarketHour } from '../../../apps/keeper/src/market.js';

const rule = { lower: 0.3, target: 0.6, upper: 0.9 };
const config = { shortUsd: 2500, marginUsd: 4000, operatingUsd: 200, szDecimals: 1,
  policy: 'hedged-rebalance' as const, rebalanceRule: rule };
const flat = (p: number) => ({ open: p, high: p, low: p, close: p });
function series(prices: number[], rate = 0): MarketHour[] {
  return [...Array<number>(24).fill(2), ...prices].map((p, i) => ({ start: i * HOUR_MS, end: (i + 1) * HOUR_MS,
    spot: flat(p), perp: flat(p), fundingRate: i < 24 ? 0.0001 : rate }));
}
function run(rows: MarketHour[], overrides = {}) {
  return simulate(rows, 24 * HOUR_MS, rows.at(-1)!.end, { ...config, ...overrides });
}
afterEach(() => vi.unstubAllGlobals());
describe('delayed cross-venue collateral accounting', () => {
  it('sells matched NEAR, credits no margin until next hour and charges exactly one conversion', () => {
    const result = run(series([2, 2.3, 2.3, 2.3, 2.3, 2.3]));
    const reduction = result.events.find(e => e.type === 'rebalance-reduce')!;
    const arrival = result.events.find(e => e.type === 'route-arrival')!;
    expect(reduction).toBeDefined(); expect(arrival.time - reduction.time).toBe(HOUR_MS);
    expect(reduction.time).toBe(26 * HOUR_MS); // Previous close decision, never first rising open.
    const k = reduction.quantity, price = reduction.spotPrice;
    const net = k * price * (1 - COSTS.route - COSTS.protocol - COSTS.spotSlippage);
    expect(reduction.pendingTransferUsd).toBeCloseTo(net, 10);
    expect(arrival.venueEquityUsd! - reduction.venueEquityUsd!).toBeCloseTo(net, 10);
    expect(arrival.pendingTransferUsd).toBe(0);
    expect(reduction.stressHeadroomUsd!).toBeGreaterThanOrEqual(0.1 * reduction.shortNotional);
    expect(arrival.stressHeadroomUsd! / arrival.shortNotional).toBeGreaterThanOrEqual(rule.target);
    // One lot less cannot satisfy target at the same observed prices.
    const oneLess = k - 0.1, remain = result.initialQuantity - oneLess;
    const e = config.marginUsd - result.initialQuantity * 2 * (COSTS.perpTaker + COSTS.perpSlippage) - result.initialQuantity * 0.3 - oneLess * price * (COSTS.perpTaker + COSTS.perpSlippage);
    const h = e + oneLess * price * (1 - COSTS.route - COSTS.protocol - COSTS.spotSlippage) - 1.01 * remain * price - 0.1;
    expect(h / (1.01 * remain * price)).toBeLessThan(rule.target);
    expect(result.rebalances).toBe(1);
    expect(result.rebalanceCostsUsd).toBeCloseTo(k * price * (COSTS.route + COSTS.protocol + COSTS.spotSlippage + COSTS.perpTaker + COSTS.perpSlippage) + 0.06, 10);
    for (const e of result.events) expect(e.spotQuantity).toBe(e.shortQuantity);
    expect(result.maintenanceProxyBreachHours).toBe(0);
    expect(result.minMarkedVenueEquityUsd!).toBeGreaterThan(0);
    expect(result.spotPnlUsd + result.perpPnlUsd).toBeCloseTo(0, 10);
    expect(result.equityCurve.at(-1)!.equityUsd).toBeCloseTo(result.initialCapitalUsd + result.netPnlUsd, 10);
  });
  it('retains excess venue margin while a short is open, matching ERR_OPEN_SHORT', () => {
    const result = run(series([2, 2.03, 2.03, 2.03, 1.8, 1.8, 1.8]));
    expect(result.events.some(e => ['rebalance-withdraw', 'rebalance-increase'].includes(e.type))).toBe(false);
    expect(result.netMarginTransfersUsd).toBeGreaterThanOrEqual(0);
    expect(result.pendingTransferUsd).toBe(0);
  });
  it('stress-checks remaining margin during latency and schedules emergency full unwind', () => {
    const rows = series([2, 2.3, 2.3, 2.3, 2.3, 2.3]);
    rows[26]!.perp.high = 3.0;
    const result = run(rows);
    expect(result.minIntrabarStressHeadroomUsd!).toBeLessThan(0);
    expect(result.proposals).toContainEqual({ time: 27 * HOUR_MS, types: ['full-unwind'] });
    expect(result.events.at(-1)).toMatchObject({ time: 27 * HOUR_MS, type: 'close', reason: 'stress-or-latency-unwind' });
    expect(result.events.find(e => e.type === 'route-arrival')!.time).toBe(27 * HOUR_MS);
    expect(result.maintenanceProxyBreachHours).toBe(0);
  });
  it('full-unwinds an adjustment below minimum, stays flat, and keeps cash nonnegative', () => {
    const result = run(series([2, 2.2, 2.2, 2.2, 2.2]), { shortUsd: 25, marginUsd: 30, operatingUsd: 20 });
    expect(result.events.at(-1)?.reason).toBe('stress-or-latency-unwind');
    expect(result.rebalances).toBe(0); expect(result.terminalQuantity).toBe(0);
    expect(result.entries).toBe(1); expect(result.finalQuantity).toBe(0);
    expect(result.minMarkedVenueEquityUsd!).toBeGreaterThan(0);
  });
  it('does not force a reverse withdrawal when additions are at the inventory cap', () => {
    const result = run(series([2, 1, 1, 1, 1, 1]));
    expect(result.rebalances).toBe(0); expect(result.heldHours).toBe(6);
    expect(result.terminalQuantity).toBe(result.initialQuantity);
  });
  it('rejects an insolvent gap instead of financing it or flooring venue equity', () => {
    expect(() => run(series([2, 6, 6]))).toThrow(ReplaySolvencyError);
  });
  it('keeps matched-price PnL equal to signed funding minus costs on a variable path', () => {
    const prices = Array.from({ length: 240 }, (_, i) => 2 + 0.25 * Math.sin(i / 12));
    const result = run(series(prices, -0.00001));
    expect(result.rebalances).toBeGreaterThan(0);
    expect(result.fundingPnlUsd).toBeLessThan(0);
    expect(result.spotPnlUsd + result.perpPnlUsd).toBeCloseTo(0, 10);
    expect(result.netPnlUsd).toBeCloseTo(result.fundingPnlUsd - result.totalCostsUsd, 10);
    expect(result.equityCurve.at(-1)!.equityUsd).toBeCloseTo(result.initialCapitalUsd + result.netPnlUsd, 9);
  });
  it('does not let future prices, funding or arrival quotes change earlier decisions', () => {
    const rows = series([2, 2.3, 2.3, 2.3, 2.0, 2.0, 2.01, 2.01, 2.01]);
    const changed = structuredClone(rows);
    for (let i = 30; i < changed.length; i++) { changed[i]!.spot = flat(1.8); changed[i]!.perp = flat(1.8); changed[i]!.fundingRate = -0.01; }
    const a = run(rows), b = run(changed), before = (x: { time: number }) => x.time < 30 * HOUR_MS;
    expect(a.events.filter(before)).toEqual(b.events.filter(before));
    expect(a.proposals.filter(before)).toEqual(b.proposals.filter(before));
    expect(a.equityCurve.filter(before)).toEqual(b.equityCurve.filter(before));
  });
  it('selects from physically truncated first-90-day data and ignores the OOS path', () => {
    vi.stubGlobal('fetch', () => { throw new Error('Offline only'); });
    const rows = series(Array<number>(4320).fill(2));
    const data = { bars: rows, start: 24 * HOUR_MS, szDecimals: 1 };
    const a = selectRebalanceRule(data);
    const changed = structuredClone(data);
    for (let i = 2184; i < changed.bars.length; i++) { changed.bars[i]!.perp = flat(100); changed.bars[i]!.fundingRate = -1; }
    expect(selectRebalanceRule(changed)).toEqual(a);
    expect(a.rule).toEqual({ lower: 0.2, target: 0.5, upper: 0.8, latencyHours: 1 }); // Exact training tie.
    expect(() => selectRebalanceRule({ ...data, bars: rows.filter((_, i) => i !== 100) })).toThrow('contiguous');
  }, 30000);
  it('validates ordered finite bands and fixed latency', () => {
    expect(() => RebalanceRuleSchema.parse({ ...rule, target: 0.2 })).toThrow();
    expect(() => RebalanceRuleSchema.parse({ ...rule, latencyHours: 0 })).toThrow();
    expect(() => run(series([2, 2]), { rebalanceRule: undefined })).toThrow();
  });
});
