import { describe, expect, it } from 'vitest';
import { HOUR_MS, carrySignal } from './index.js';
import { simulate } from '../../../apps/keeper/src/replay.js';
import { selectCarryRule, TRAINING_HOURS } from '../../../apps/keeper/src/carry-selection.js';
import type { MarketHour } from '../../../apps/keeper/src/market.js';

const config = { shortUsd: 2500, marginUsd: 3000, operatingUsd: 200,
  policy: 'reentry' as const, carryRule: { positiveHours: 12 }, szDecimals: 1 };
const flat = (price: number) => ({ open: price, high: price, low: price, close: price });
const bars = (hours: number): MarketHour[] => Array.from({ length: hours }, (_, i) => ({
  start: i * HOUR_MS, end: (i + 1) * HOUR_MS, perp: flat(2), spot: flat(2), fundingRate: 0.0000125 }));
const run = (rows: MarketHour[]) => simulate(rows, 24 * HOUR_MS, rows.at(-1)!.end, config);

describe('predeclared re-entry and transparent baselines', () => {
  it('requires consecutive strictly positive prior settlements, with zero breaking confirmation', () => {
    const rows = bars(60); rows[12]!.fundingRate = 0;
    const result = run(rows);
    expect(result.events[0]).toMatchObject({ type: 'open', time: 25 * HOUR_MS });
    expect(result.entryBlockCounts['positive-confirmation']).toBe(1);
    const known = rows.slice(0, 24).map(b => ({ time: b.end, rate: b.fundingRate }));
    expect(carrySignal([...known, { time: 25 * HOUR_MS, rate: 1 }], 24 * HOUR_MS, config.carryRule).enter).toBe(false);
  });
  it('holds 72 hours despite persistent negative funding, then exits at the next open', () => {
    const rows = bars(110); for (let i = 24; i < rows.length; i++) rows[i]!.fundingRate = -0.0001;
    const result = run(rows);
    expect(result.events.slice(0, 2).map(e => [e.type, e.time])).toEqual([['open', 24 * HOUR_MS], ['close', 96 * HOUR_MS]]);
    expect(result.heldHours).toBe(72);
    expect(result.negativeFundingHoursHeld).toBe(71);
  });
  it('retains funding hysteresis when six negative hours leave trailing 24h positive', () => {
    const rows = bars(120);
    for (let i = 96; i < 102; i++) rows[i]!.fundingRate = -0.000001;
    const result = run(rows);
    expect(result.proposals).toEqual([]);
    expect(result.entries).toBe(1);
    expect(result.events.at(-1)!.reason).toBe('fixed-horizon-close');
  });
  it('waits 24 flat hours after exit even when funding re-confirms sooner', () => {
    const rows = bars(145);
    for (let i = 24; i < 96; i++) rows[i]!.fundingRate = -0.000001;
    for (let i = 96; i < rows.length; i++) rows[i]!.fundingRate = 0.001;
    const result = run(rows);
    expect(result.events.filter(e => e.type === 'open').map(e => e.time)).toEqual([24 * HOUR_MS, 120 * HOUR_MS]);
    expect(result.entryBlockCounts['cooldown']).toBe(23);
    expect(result.heldHours).toBe(97);
  });
  it('lets emergency stress override the hold and resizes re-entry to available collateral', () => {
    const rows = bars(90);
    for (let i = 25; i < rows.length; i++) { rows[i]!.perp = flat(2.6); rows[i]!.spot = flat(2.6); }
    const result = run(rows);
    expect(result.events[1]).toMatchObject({ type: 'close', time: 26 * HOUR_MS, reason: 'stress-headroom' });
    const second = result.events.filter(e => e.type === 'open')[1]!;
    expect(second.time).toBe(50 * HOUR_MS);
    expect(second.shortNotional).toBeLessThan(0.9 * 2251);
    expect(second.shortNotional).toBeGreaterThan(2000);
    expect(result.entries).toBe(2);
    expect(result.entryBlockCounts['leverage-exceeded']).toBeUndefined();
  });
  it('does not let future prices or funding change earlier re-entry trades, signals or equity', () => {
    const rows = bars(120), changed = structuredClone(rows);
    for (let i = 60; i < changed.length; i++) { changed[i]!.fundingRate = -0.01; changed[i]!.perp = flat(8); changed[i]!.spot = flat(7); }
    const a = run(rows), b = run(changed), before = (e: { time: number }) => e.time < 60 * HOUR_MS;
    expect(a.events.filter(before)).toEqual(b.events.filter(before));
    expect(a.proposals.filter(before)).toEqual(b.proposals.filter(before));
    expect(a.equityCurve.filter(before)).toEqual(b.equityCurve.filter(before));
  });
  it('always hedged ignores funding and stress exits but retains cost and insolvency accounting', () => {
    const rows = bars(110);
    for (let i = 24; i < rows.length; i++) rows[i]!.fundingRate = -0.001;
    for (let i = 25; i < rows.length; i++) { rows[i]!.perp = flat(8); rows[i]!.spot = flat(8); }
    const result = simulate(rows, 24 * HOUR_MS, 110 * HOUR_MS, { ...config, policy: 'always-hedged' });
    expect(result.entries).toBe(1); expect(result.heldHours).toBe(86);
    expect(result.entryBlockCounts).toEqual({}); expect(result.proposals).toEqual([]);
    expect(result.negativeFundingHoursHeld).toBe(85);
    expect(result.fundingPnlUsd).toBeCloseTo(-850);
    expect(result.maintenanceProxyBreachHours).toBe(85);
    expect(result.minMarkedVenueEquityUsd).toBeLessThan(0);
    expect(result.spotPnlUsd + result.perpPnlUsd).toBe(0);
    expect(result.events.at(-1)!.reason).toBe('fixed-horizon-close');
  });
  it('spot holder retains price PnL, has only applicable costs and commits no margin', () => {
    const rows = bars(26); rows[25]!.spot = flat(1);
    const result = simulate(rows, 24 * HOUR_MS, 26 * HOUR_MS, { ...config, policy: 'spot-holder' });
    expect(result.spotPnlUsd).toBe(-1250); expect(result.perpPnlUsd).toBe(0);
    expect(result.fundingPnlUsd).toBe(0); expect(result.negativeFundingHoursHeld).toBe(0);
    expect(result.marginCapitalUsd).toBe(0); expect(result.initialCapitalUsd).toBe(2700);
    expect(result.costs.perpFees + result.costs.perpSlippage + result.costs.marginRouteFees).toBe(0);
    expect(result.costs.signing).toBe(0.04); expect(result.costs.fixed).toBe(6);
    expect(result.costs.spotRouteFees).toBe(3750 * 0.002501);
    expect(result.costs.spotSlippage).toBe(3750 * 0.0005);
    expect(result.netPnlUsd).toBe(-1250 - result.totalCostsUsd);
    expect(result.maxDrawdownUsd).toBeCloseTo(-result.netPnlUsd);
    expect(result.minStressHeadroomUsd).toBeNull();
    expect(result.hedgedEnvelopeReturnPct).toBe(result.netPnlUsd / 5700 * 100);
    expect(result.simpleAnnualizedNetReturnPct).toBe(result.netReturnPct * 8760 / 2);
    expect(result.events.every(e => e.shortNotional === 0)).toBe(true);
  });
  it('can select using training alone and cannot change selection when the holdout is poisoned', () => {
    const rows = bars(24 + TRAINING_HOURS + 24);
    const trainingOnly = rows.filter(b => b.end <= (24 + TRAINING_HOURS) * HOUR_MS);
    const input = { bars: trainingOnly, start: 24 * HOUR_MS, szDecimals: 1 };
    const selection = selectCarryRule(input);
    const poisoned = rows.map(b => b.end <= selection.trainingEndExclusive ? b : { ...b, fundingRate: -1, spot: flat(1000), perp: flat(1) });
    expect(selectCarryRule({ ...input, bars: poisoned })).toEqual(selection);
    expect(selection.rule.positiveHours).toBe(6); // Identical training scores: declared tie-break.
    expect(() => selectCarryRule({ ...input, bars: trainingOnly.slice(0, -1) })).toThrow('contiguous complete');
  }, 30_000);
});
