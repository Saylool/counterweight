import { describe, expect, it } from 'vitest';
import { evaluateRisk, fundingStats, HOUR_MS, maintenanceMargin, stressMetrics, type RiskInput } from './index.js';

const now = 100 * HOUR_MS;
function input(overrides: Partial<RiskInput> = {}): RiskInput {
  return { shortNotional: 25, venueEquity: 30, intent: 'enter', now, observedAt: now, maxDataAgeMs: 90_000,
    unresolvedOrders: 0, reconciled: true, depth: { availableNotional: 25, impactBps: 5 },
    funding: Array.from({ length: 24 }, (_, i) => ({ time: now - (23 - i) * HOUR_MS, rate: 0.0000125 })),
    state: { entryHalted: false }, adl: false, unexpectedReductionQuantity: 0, ...overrides };
}
describe('real NEAR maintenance and stress arithmetic', () => {
  it.each([[0, 0], [25, 1.25], [20_000_000, 1_000_000], [20_000_001, 1_000_000.1], [40_000_000, 3_000_000]])('MM(%s) = %s', (n, expected) => expect(maintenanceMargin(n)).toBeCloseTo(expected, 8));
  it('uses venue equity for leverage and reproduces design demo headroom', () => {
    expect(stressMetrics({ shortNotional: 25, venueEquity: 30 })).toEqual({ leverage: 25 / 30, reserve: 0.1, stressedMaintenance: 1.875, headroom: 4.65 });
  });
  it('computes maintenance in the stressed tier across $20m', () => {
    expect(stressMetrics({ shortNotional: 20_000_000, venueEquity: 30_000_000 }).stressedMaintenance).toBe(2_000_000);
  });
  it('represents overflowing leverage as null and blocks entry even for positive subnormal equity', () => {
    const r = evaluateRisk(input({ venueEquity: Number.MIN_VALUE }));
    expect(r.metrics.leverage).toBeNull();
    expect(r.entryBlocks).toContain('leverage-exceeded');
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });
  it.each([[-1], [NaN], [Infinity], [-Infinity], ['25'], [null], [undefined]])('rejects invalid notional %s', n => expect(() => maintenanceMargin(n)).toThrow());
  it.each([[0, 0, 0], [0, 1, 0], [1, 0, null], [1, -1, null], [0, -1, null]])('handles N=%s E=%s leverage=%s', (n, e, leverage) => {
    expect(stressMetrics({ shortNotional: n, venueEquity: e }).leverage).toBe(leverage);
  });
  it('has continuous monotone MM and bounded marginal rates over a seeded grid', () => {
    let seed = 12345;
    for (let i = 0; i < 1000; i++) {
      seed = (1664525 * seed + 1013904223) >>> 0;
      const n = seed / 2 ** 32 * 1e9;
      const d = maintenanceMargin(n + 1) - maintenanceMargin(n);
      expect(d).toBeGreaterThanOrEqual(0.05 - 1e-7);
      expect(d).toBeLessThanOrEqual(0.1 + 1e-7);
      expect(maintenanceMargin(n)).toBeGreaterThanOrEqual(0.05 * n - 1e-7);
    }
    expect(maintenanceMargin(20_000_000 + 1e-4) - maintenanceMargin(20_000_000 - 1e-4)).toBeCloseTo(0.000015, 7);
  });
  it('headroom increases dollar for dollar with equity and decreases with notional', () => {
    for (const n of [0, 1e-8, 10, 25, 50, 100, 13_333_333, 20_000_000, 1e12, 1e15]) {
      const a = stressMetrics({ shortNotional: n, venueEquity: 100 });
      const b = stressMetrics({ shortNotional: n, venueEquity: 110 });
      expect(b.headroom - a.headroom).toBe(10);
      expect(Number.isFinite(a.headroom)).toBe(true);
      if (n < 1e15) expect(stressMetrics({ shortNotional: n + 1, venueEquity: 100 }).headroom).toBeLessThan(a.headroom);
    }
  });
});
describe('entry gates', () => {
  it('proposes a supervised entry only when every check passes', () => expect(evaluateRisk(input()).proposals).toEqual([{ type: 'enter', shortNotional: 25, supervised: true }]));
  const gates: [string, Partial<RiskInput>, string][] = [
    ['stale', { observedAt: now - 90_001 }, 'stale-data'],
    ['future', { observedAt: now + 1 }, 'future-data'],
    ['unresolved', { unresolvedOrders: 1 }, 'unresolved-orders'],
    ['unreconciled', { reconciled: false }, 'unreconciled'],
    ['stress', { venueEquity: 19.375 }, 'stress-failed'],
    ['depth quantity', { depth: { availableNotional: 24.99, impactBps: 5 } }, 'depth-failed'],
    ['depth impact', { depth: { availableNotional: 25, impactBps: 25.001 } }, 'depth-failed'],
    ['leverage', { venueEquity: 24.99 }, 'leverage-exceeded'],
    ['insolvent', { venueEquity: 0 }, 'leverage-exceeded'],
    ['dust', { shortNotional: 9.99 }, 'minimum-order'],
    ['halted', { state: { entryHalted: true } }, 'entry-halted'],
    ['missing funding', { funding: [] }, 'funding-incomplete'],
  ];
  it.each(gates)('blocks %s', (_, override, reason) => {
    const result = evaluateRisk(input(override));
    expect(result.entryBlocks).toContain(reason);
    expect(result.proposals.some(p => p.type === 'enter')).toBe(false);
  });
  it.each([0, -0.001])('blocks nonpositive trailing24h funding %s', rate => {
    const x = input(); x.funding = x.funding.map(f => ({ ...f, rate }));
    expect(evaluateRisk(x).entryBlocks).toContain('nonpositive-funding');
  });
  it('allows exact stale-age, depth-impact, notional and leverage boundaries', () => {
    expect(evaluateRisk(input({ observedAt: now - 90_000, depth: { availableNotional: 25, impactBps: 25 }, venueEquity: 27.875 })).entryBlocks).toEqual([]);
    expect(evaluateRisk(input({ shortNotional: 10 })).entryBlocks).toEqual([]);
  });
  it('positive trailing24h sum permits isolated negative hours', () => {
    const x = input(); x.funding[0]!.rate = -0.000001;
    expect(evaluateRisk(x).entryBlocks).toEqual([]);
  });
  it('does not mutate inputs and is deterministic', () => {
    const x = input(); const before = structuredClone(x);
    expect(evaluateRisk(x)).toEqual(evaluateRisk(x)); expect(x).toEqual(before);
  });
  it.each(['NaN', 'Infinity', 'negative-notional', 'string-equity', 'extra', 'negative-orders', 'fractional-time', 'zero-age', 'bad-funding', 'unsorted-funding', 'duplicate-funding', 'unaligned-funding'])('rejects malformed input %s', kind => {
    const x: any = input();
    if (kind === 'NaN') x.venueEquity = NaN;
    if (kind === 'Infinity') x.depth.impactBps = Infinity;
    if (kind === 'negative-notional') x.shortNotional = -1;
    if (kind === 'string-equity') x.venueEquity = '30';
    if (kind === 'extra') x.privateKey = 'forbidden-field';
    if (kind === 'negative-orders') x.unresolvedOrders = -1;
    if (kind === 'fractional-time') x.now += 0.1;
    if (kind === 'zero-age') x.maxDataAgeMs = 0;
    if (kind === 'bad-funding') x.funding[0].rate = NaN;
    if (kind === 'unsorted-funding') x.funding.reverse();
    if (kind === 'duplicate-funding') x.funding[1].time = x.funding[0].time;
    if (kind === 'unaligned-funding') x.funding[0].time++;
    expect(() => evaluateRisk(x)).toThrow();
  });
});
describe('exits, reconciliation and persistent ADL halt', () => {
  it('H strictly below 10% N proposes full reduce-only unwind', () => {
    const r = evaluateRisk(input({ intent: 'monitor', venueEquity: 27.874999 }));
    expect(r.proposals).toContainEqual({ type: 'full-unwind', reduceOnly: true, fraction: 1, reason: 'stress-headroom', requiresSpotApproval: true });
  });
  it('H exactly 10% N does not force unwind', () => expect(evaluateRisk(input({ intent: 'monitor', venueEquity: 27.875 })).proposals).toEqual([]));
  it.each([0, 1, 5, 6, 7, 24])('%s negative hours use exact six-hour threshold', negatives => {
    const x = input({ intent: 'monitor' });
    for (let i = 0; i < negatives; i++) x.funding[23 - i]!.rate = -0.0001;
    expect(evaluateRisk(x).proposals.some(p => p.type === 'exit-proposal')).toBe(negatives >= 6);
  });
  it('zero funding resets negative streak', () => {
    const x = input({ intent: 'monitor' }); x.funding = x.funding.map(f => ({ ...f, rate: -0.0001 })); x.funding[21]!.rate = 0;
    expect(evaluateRisk(x).funding.consecutiveNegativeHours).toBe(2);
  });
  it('funding gaps reset streak and block entry, rather than bridging missing hours', () => {
    const x = input(); x.funding = x.funding.map(f => ({ ...f, rate: -0.0001 })); x.funding.splice(21, 1);
    const r = evaluateRisk(x); expect(r.funding.consecutiveNegativeHours).toBe(2); expect(r.entryBlocks).toContain('funding-incomplete');
  });
  it('stale funding does not trigger a six-hour exit from old data', () => {
    const x = input({ intent: 'monitor', now: now + HOUR_MS }); x.funding = x.funding.map(f => ({ ...f, rate: -0.1 }));
    expect(evaluateRisk(x).funding.consecutiveNegativeHours).toBe(0);
  });
  it('ignores future funding: appending bad future rates cannot change today', () => {
    const x = input(); const base = evaluateRisk(x);
    x.funding.push({ time: now + HOUR_MS, rate: -1 }); expect(evaluateRisk(x)).toEqual(base);
  });
  it('prioritizes emergency unwind over funding proposal without duplicate closes', () => {
    const x = input({ intent: 'monitor', venueEquity: -1, unresolvedOrders: 1 }); x.funding = x.funding.map(f => ({ ...f, rate: -0.001 }));
    const r = evaluateRisk(x);
    expect(r.proposals.filter(p => p.type === 'full-unwind' || p.type === 'exit-proposal')).toHaveLength(1);
    expect(r.proposals).toContainEqual({ type: 'reconcile', reason: 'unresolved-orders' });
  });
  it.each([true, false])('unexpected reduction halts entry and proposes matching spot sale; ADL=%s', adl => {
    const r = evaluateRisk(input({ adl, unexpectedReductionQuantity: 2 }));
    expect(r.state.entryHalted).toBe(true);
    expect(r.proposals).toContainEqual({ type: 'sell-spot-proposal', quantity: 2, ownerApprovalRequired: true });
    expect(r.proposals.some(p => p.type === 'enter')).toBe(false);
    expect(evaluateRisk(input({ state: r.state })).entryBlocks).toContain('entry-halted');
  });
  it('ADL without known reduction halts without inventing a spot quantity', () => {
    const r = evaluateRisk(input({ adl: true })); expect(r.state.entryHalted).toBe(true);
    expect(r.proposals.some(p => p.type === 'sell-spot-proposal')).toBe(false);
  });
  it('flat portfolios never propose reduce-only exits', () => expect(evaluateRisk(input({ intent: 'monitor', shortNotional: 0, venueEquity: -1 })).proposals).toEqual([]));
  it('checks all entry safety invariants over 500 deterministic combinations', () => {
    for (let i = 0; i < 500; i++) {
      const x = input({ shortNotional: i, venueEquity: i * 1.1, depth: { availableNotional: i, impactBps: i % 31 }, unresolvedOrders: i % 5 === 0 ? 1 : 0 });
      const r = evaluateRisk(x);
      if (r.proposals.some(p => p.type === 'enter')) {
        expect(r.entryBlocks).toHaveLength(0); expect(r.metrics.headroom).toBeGreaterThan(0);
        expect(r.metrics.leverage).toBeLessThanOrEqual(1); expect(x.unresolvedOrders).toBe(0);
        expect(x.depth.impactBps).toBeLessThanOrEqual(25); expect(r.funding.trailing24hRate).toBeGreaterThan(0);
      }
    }
  });
});
it('funding stats requires an explicit as-of time', () => expect(() => fundingStats([], undefined)).toThrow());
