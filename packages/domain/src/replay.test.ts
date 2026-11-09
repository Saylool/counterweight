import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadMarket, type MarketDataset, type MarketHour } from '../../../apps/keeper/src/market.js';
import { COSTS, simulate, selectWorstMoves, syntheticGap } from '../../../apps/keeper/src/replay.js';
import { breakEven, buildReport, markdownReport } from '../../../apps/keeper/src/report.js';
import { HOUR_MS } from './index.js';

const fixtureDirectory = fileURLToPath(new URL('../../../fixtures/market/', import.meta.url));
const reportDirectory = fileURLToPath(new URL('../../../reports/', import.meta.url));
const config = { shortUsd: 25, marginUsd: 30, operatingUsd: 20, szDecimals: 1 };
const flat = (price: number) => ({ open: price, high: price, low: price, close: price });
function bars(hours = 48, rate = 0.0000125): MarketHour[] {
  return Array.from({ length: hours }, (_, i) => ({ start: i * HOUR_MS, end: (i + 1) * HOUR_MS, perp: flat(2), spot: flat(2), fundingRate: rate }));
}
function dataset(rows: MarketHour[]): MarketDataset {
  return { start: 24 * HOUR_MS, end: rows.at(-1)!.end, warmupStart: 0, bars: rows, gaps: [], capturedAt: '2026-11-09T00:00:00Z',
    manifestSha256: 'test', szDecimals: 1, assetIndex: 74 };
}
async function replaceFixture(directory: string, path: string, value: unknown) {
  const body = JSON.stringify(value) + '\n';
  await writeFile(join(directory, path), body);
  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
  const file = manifest.files.find((f: { path: string }) => f.path === path);
  file.bytes = Buffer.byteLength(body);
  file.sha256 = createHash('sha256').update(body).digest('hex');
  await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest));
}
afterEach(() => vi.unstubAllGlobals());
describe('accounting and chronological execution', () => {
  it.each([0.001, -0.001, 0])('credits signed short funding %s and excludes entry-hour settlement', rate => {
    const rows = bars(26); rows[24]!.fundingRate = rate; rows[25]!.fundingRate = rate;
    const r = simulate(rows, 24 * HOUR_MS, 26 * HOUR_MS, config);
    expect(r.fundingPnlUsd).toBeCloseTo(25 * rate, 12);
    expect(r.negativeFundingHoursHeld).toBe(rate < 0 ? 1 : 0);
    expect(r.spotPnlUsd).toBe(0); expect(r.perpPnlUsd).toBe(0);
    expect(r.netPnlUsd).toBeCloseTo(r.fundingPnlUsd - r.totalCostsUsd, 12);
    expect(r.netReturnPct).toBeCloseTo(r.netPnlUsd / 75 * 100, 12);
    expect(r.maxDrawdownUsd + 1e-12).toBeGreaterThanOrEqual(r.totalCostsUsd - Math.max(0, r.fundingPnlUsd));
  });
  it('uses 24 prior hours, rejects nonpositive funding and never counts flat exposure', () => {
    const rows = bars(48, -0.0001);
    const r = simulate(rows, 24 * HOUR_MS, 48 * HOUR_MS, config);
    expect(r.entries).toBe(0); expect(r.heldHours).toBe(0); expect(r.fundingPnlUsd).toBe(0);
    expect(r.minStressHeadroomUsd).toBeNull(); expect(r.events).toEqual([]);
    expect(r.entryBlockCounts['nonpositive-funding']).toBe(24);
  });
  it('funding-flip exit waits for six observations then fills the next open', () => {
    const rows = bars(32);
    for (let i = 24; i < 32; i++) rows[i]!.fundingRate = -0.0001;
    const r = simulate(rows, 24 * HOUR_MS, 32 * HOUR_MS, config);
    expect(r.proposals[0]).toEqual({ time: 30 * HOUR_MS, types: ['exit-proposal'] });
    expect(r.events.find(e => e.type === 'close')).toMatchObject({ time: 30 * HOUR_MS, reason: 'six-negative-hours' });
    expect(r.negativeFundingHoursHeld).toBe(5); // Entry hour excluded, all six observations still inform policy.
  });
  it('does not use future funding or prices for earlier proposals, trades or equity', () => {
    const original = bars(80), changed = structuredClone(original);
    for (let i = 50; i < changed.length; i++) { changed[i]!.perp = flat(20); changed[i]!.spot = flat(21); changed[i]!.fundingRate = -0.01; }
    const a = simulate(original, 24 * HOUR_MS, 80 * HOUR_MS, config);
    const b = simulate(changed, 24 * HOUR_MS, 80 * HOUR_MS, config);
    const before = (e: { time: number }) => e.time < 50 * HOUR_MS;
    expect(a.events.filter(before)).toEqual(b.events.filter(before)); expect(a.proposals.filter(before)).toEqual(b.proposals.filter(before));
    expect(a.equityCurve.filter(before)).toEqual(b.equityCurve.filter(before));
  });
  it('includes spot and perp basis PnL and all cost categories', () => {
    const rows = bars(26); rows[25]!.spot = flat(2.1); rows[25]!.perp = flat(2.2);
    const r = simulate(rows, 24 * HOUR_MS, 26 * HOUR_MS, config);
    expect(r.spotPnlUsd).toBeCloseTo(12.5 * 0.1); expect(r.perpPnlUsd).toBeCloseTo(-12.5 * 0.2);
    expect(r.netPnlUsd).toBeCloseTo(r.spotPnlUsd + r.perpPnlUsd + r.fundingPnlUsd - Object.values(r.costs).reduce((s, c) => s + c, 0));
    expect(r.costs.spotRouteFees).toBeCloseTo(12.5 * (2 + 2.1) * (0.0025 + 0.000001));
    expect(r.costs.perpFees).toBeCloseTo(12.5 * (2 + 2.2) * 0.00045);
    expect(r.costs.marginRouteFees).toBeCloseTo(30 * 0.002501);
    expect(r.costs.fixed).toBe(6); expect(r.costs.signing).toBe(0.08);
    expect(r.endingVenueCashUsd).toBeCloseTo(30 + r.perpPnlUsd + r.fundingPnlUsd - r.costs.perpFees - r.costs.perpSlippage);
  });
  it('models maker entry sensitivity without changing taker exit fees', () => {
    const rows = bars(26);
    const taker = simulate(rows, 24 * HOUR_MS, 26 * HOUR_MS, config);
    const maker = simulate(rows, 24 * HOUR_MS, 26 * HOUR_MS, { ...config, execution: 'maker-entry' });
    expect(maker.netPnlUsd - taker.netPnlUsd).toBeCloseTo(25 * (COSTS.perpTaker - COSTS.perpMaker), 12);
  });
  it('rounds quantity down and preserves equal spot and short coin quantity', () => {
    const rows = bars(26); for (const r of rows) { r.perp = flat(3.01); r.spot = flat(3.02); }
    const r = simulate(rows, 24 * HOUR_MS, 26 * HOUR_MS, config);
    expect(r.events[0]!.quantity).toBe(8.2); expect(r.events[0]!.shortNotional).toBeLessThanOrEqual(25);
    expect(r.events[0]!.quantity * r.events[0]!.spotPrice).toBeLessThanOrEqual(25);
  });
  it('triggers unwind on a labelled +50% opening gap and shows negative further-stress H', () => {
    const rows = syntheticGap(bars()[24]!);
    expect(rows[1]!.perp.open / rows[0]!.perp.close).toBe(1.5);
    expect(rows[1]!.spot.open / rows[0]!.spot.close).toBe(1.5);
    const r = simulate(rows, rows[0]!.start, rows.at(-1)!.end, { ...config, forceInitial: true, reenter: false });
    expect(r.minStressHeadroomUsd).toBeLessThan(0); expect(r.proposals.at(-1)!.types).toContain('full-unwind');
    expect(r.spotPnlUsd + r.perpPnlUsd).toBe(0); expect(r.maintenanceProxyBreachHours).toBe(0);
    expect(r.events.at(-1)).toMatchObject({ type: 'close', reason: 'stress-headroom', time: rows[2]!.start });
  });
  it('marks intrabar adverse maintenance breaches without claiming fills or liquidation', () => {
    const rows = bars(26); rows[25]!.perp.high = 20;
    const r = simulate(rows, 24 * HOUR_MS, 26 * HOUR_MS, config);
    expect(r.maintenanceProxyBreachHours).toBe(1); expect(r.minIntrabarStressHeadroomUsd).toBeLessThan(r.minStressHeadroomUsd!);
  });
  it('does not recycle spot losses into unavailable spot cash', () => {
    const rows = bars(80);
    for (let i = 25; i < 80; i++) { rows[i]!.spot = flat(1); rows[i]!.perp = flat(1); }
    for (let i = 25; i < 31; i++) rows[i]!.fundingRate = -0.0001;
    const r = simulate(rows, 24 * HOUR_MS, 80 * HOUR_MS, config);
    const second = r.events.filter(e => e.type === 'open')[1]; expect(second).toBeDefined();
    expect(second!.quantity * second!.spotPrice).toBeLessThanOrEqual(12.5);
  });
  it('conserves matched-leg price PnL and ledger equity across 50 seeded paths', () => {
    let seed = 789;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2 ** 32; };
    for (let trial = 0; trial < 50; trial++) {
      const rows = bars(96);
      let price = 2;
      for (let i = 24; i < rows.length; i++) {
        const next = price * (1 + (random() - 0.5) * 0.05);
        const candle = { open: price, close: next, high: Math.max(price, next), low: Math.min(price, next) };
        rows[i]!.perp = candle; rows[i]!.spot = { ...candle };
        rows[i]!.fundingRate = (random() - 0.2) * 0.0001;
        price = next;
      }
      const result = simulate(rows, 24 * HOUR_MS, 96 * HOUR_MS, config);
      expect(result.spotPnlUsd + result.perpPnlUsd).toBeCloseTo(0, 12);
      expect(result.netPnlUsd).toBeCloseTo(result.fundingPnlUsd - result.totalCostsUsd, 12);
      expect(result.equityCurve.at(-1)!.equityUsd).toBeCloseTo(result.initialCapitalUsd + result.netPnlUsd, 12);
      expect(result.events.filter(e => e.type === 'open')).toHaveLength(result.events.filter(e => e.type === 'close').length);
      expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    }
  });
  it('detects underallocated operating capital', () => expect(simulate(bars(26), 24 * HOUR_MS, 26 * HOUR_MS, { ...config, operatingUsd: 0 }).operatingBudgetExceeded).toBe(true));
  it.each([[], bars(4), [...bars(26).slice(0, 25), ...bars(28).slice(26)]].map(rows => [rows]))('rejects incomplete/misaligned replay intervals %#', rows => expect(() => simulate(rows, 24 * HOUR_MS, 28 * HOUR_MS, config)).toThrow('Replay requires contiguous complete hourly observations'));
  it.each([-1, 0, NaN, Infinity])('validates invalid sizes %s', shortUsd => expect(() => simulate(bars(26), 24 * HOUR_MS, 26 * HOUR_MS, { ...config, shortUsd })).toThrow());
});
describe('selection and provenance', () => {
  it('reruns and verifies a fixed-cost break-even crossing on a profitable synthetic series', () => {
    const data = dataset(bars(224, 0.001));
    const result = breakEven(data);
    expect(result.status).toBe('first-bracketed-crossing');
    expect(result.shortUsd).toBeGreaterThan(10);
    const size = result.shortUsd!;
    const rerun = simulate(data.bars, data.start, data.end, { shortUsd: size, marginUsd: size * 1.2,
      operatingUsd: Math.max(20, 0.08 * size), szDecimals: data.szDecimals });
    expect(result.verifiedNetPnlUsd).toBe(rerun.netPnlUsd);
    expect(result.verifiedNetPnlUsd).toBeGreaterThanOrEqual(0);
    expect(result.fixedCostsUsd).toBe(rerun.fixedCostsUsd);
    expect(result.allCapitalUsd).toBe(rerun.initialCapitalUsd);
  });
  it('reports no break-even on a negative-carry path and includes the full scan endpoint', () => {
    const result = breakEven(dataset(bars(48, -0.001)));
    expect(result.status).toBe('no-profitable-size-found-through-scan');
    expect(result.shortUsd).toBeNull();
    expect(result.maxTestedShortUsd).toBe(1_000_000);
    expect(result.scan.every(row => row.netPnlUsd < 0)).toBe(true);
    expect(result.fixedCostsUsd).toBe(6);
  });
  it('derives every normalized observation from the exact recorded API responses without selection', async () => {
    const read = async (path: string) => JSON.parse(await readFile(join(fixtureDirectory, path), 'utf8'));
    const metadata = await read('metadata.json');
    const requests = await read('requests.json');
    const { warmupStart, end } = metadata.window;
    const funding: { time: number }[] = [], perps: { t: number }[] = [], spots: number[][] = [];
    for (const request of requests) {
      expect(Date.parse(request.receivedAt)).toBeGreaterThanOrEqual(Date.parse(request.requestedAt));
      expect(Date.parse(request.receivedAt)).toBeLessThanOrEqual(Date.parse(metadata.capturedAt));
      const response = await read(request.responseFile);
      if (request.body?.type === 'fundingHistory') {
        expect(request.body.coin).toBe('NEAR');
        expect(request.body.endTime - request.body.startTime).toBeLessThan(500 * HOUR_MS);
        funding.push(...response);
      }
      if (request.body?.type === 'candleSnapshot') {
        expect(request.body.req.coin).toBe('NEAR');
        expect(request.body.req.interval).toBe('1h');
        expect((request.body.req.endTime - request.body.req.startTime) / HOUR_MS).toBeLessThan(5000);
        perps.push(...response);
      }
      if (new URL(request.url).pathname === '/products/NEAR-USD/candles') {
        expect(new URL(request.url).searchParams.get('granularity')).toBe('3600');
        spots.push(...response);
      }
    }
    const normalize = <T,>(rows: T[], key: (row: T) => number) => [...new Map(rows
      .filter(row => key(row) >= warmupStart && key(row) < end).map(row => [key(row), row])).values()]
      .sort((a, b) => key(a) - key(b));
    expect(normalize(funding, r => r.time)).toEqual(await read('funding.json'));
    expect(normalize(perps, r => r.t)).toEqual(await read('perp.json'));
    expect(normalize(spots, r => r[0]! * 1000)).toEqual(await read('spot.json'));
  });
  it('mechanically scans all 1h/24h moves and chooses the earliest tied maximum', () => {
    const rows = bars(80);
    for (let i = 25; i < rows.length; i++) { rows[i]!.perp = flat(4); rows[i]!.spot = flat(3); }
    const result = selectWorstMoves(dataset(rows));
    expect(result[0]).toMatchObject({ hours: 1, start: 25 * HOUR_MS, end: 26 * HOUR_MS, perpMovePct: 100, candidates: 56 });
    expect(result[1]).toMatchObject({ hours: 24, start: 24 * HOUR_MS, end: 48 * HOUR_MS, perpMovePct: 100, candidates: 33 });
  });
  it('keeps counterfactual stress initial value at the selected close endpoint', () => {
    const rows = bars(26); rows[24]!.spot = flat(3); rows[24]!.perp = flat(3); rows[25]!.spot = flat(3); rows[25]!.perp = flat(3);
    const r = simulate(rows, 24 * HOUR_MS, 26 * HOUR_MS, { ...config, forceInitial: true, reenter: false, preExistingEntry: { spotPrice: 2, perpPrice: 2 } });
    expect(r.events[0]!.perpPrice).toBe(2); expect(r.spotPnlUsd).toBe(12.5); expect(r.perpPnlUsd).toBe(-12.5);
  });
  it('verifies frozen fixtures and recreates both committed reports with fetch forbidden', async () => {
    vi.stubGlobal('fetch', () => { throw new Error('Network forbidden'); });
    const data = await loadMarket(fixtureDirectory);
    expect(data.gaps).toEqual([]); expect(data.bars).toHaveLength(4344);
    expect(data.bars.filter(b => b.start >= data.start && b.fundingRate < 0)).toHaveLength(163);
    const report = buildReport(data);
    expect(report).toEqual(JSON.parse(await readFile(reportDirectory + 'replay-report.json', 'utf8')));
    expect(markdownReport(report)).toBe(await readFile(reportDirectory + 'replay-report.md', 'utf8'));
    for (const r of report.runs) {
      expect(r.equityCurve).toHaveLength(4320);
      expect(r.netReturnPct).toBeCloseTo(r.netPnlUsd / (r.spotCapitalUsd + r.marginCapitalUsd + r.operatingCapitalUsd) * 100, 12);
      expect(r.operatingBudgetExceeded).toBe(false);
    }
    expect(report.worstMoves.map(m => m.candidates)).toEqual([4320, 4297]);
    expect(report.stressScenarios).toHaveLength(6);
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  }, 60_000);
  it('detects fixture tampering before parsing', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'counterweight-hash-'));
    try { await cp(fixtureDirectory, directory, { recursive: true }); await writeFile(join(directory, 'funding.json'), '[]\n');
      await expect(loadMarket(directory)).rejects.toThrow('SHA-256 mismatch: funding.json');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it.each(['funding', 'perp', 'spot'] as const)('records %s gaps and suppresses performance rather than imputing data', async series => {
    const directory = await mkdtemp(join(tmpdir(), 'counterweight-gap-'));
    try {
      await cp(fixtureDirectory, directory, { recursive: true });
      const rows = JSON.parse(await readFile(join(directory, `${series}.json`), 'utf8')); rows.splice(100, 1);
      await replaceFixture(directory, `${series}.json`, rows);
      const data = await loadMarket(directory); expect(data.gaps).toHaveLength(1); expect(data.gaps[0]!.series).toBe(series);
      const report = buildReport(data); expect(report.status).toBe('incomplete-data-no-performance'); expect(report.runs).toEqual([]); expect(report.breakEven).toBeNull();
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it('rejects a changed NEAR tier table even when the file checksum matches', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'counterweight-tier-'));
    try {
      await cp(fixtureDirectory, directory, { recursive: true });
      const meta = JSON.parse(await readFile(join(directory, 'raw/hyperliquid-meta.json'), 'utf8'));
      meta.marginTables.find((t: [number, unknown]) => t[0] === 52)[1].marginTiers[0].maxLeverage = 20;
      await replaceFixture(directory, 'raw/hyperliquid-meta.json', meta);
      await expect(loadMarket(directory)).rejects.toThrow('NEAR maintenance table changed');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it('rejects multiple funding observations assigned to the same UTC hour', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'counterweight-duplicate-'));
    try {
      await cp(fixtureDirectory, directory, { recursive: true });
      const funding = JSON.parse(await readFile(join(directory, 'funding.json'), 'utf8'));
      funding.splice(1, 0, { ...funding[0], time: funding[0].time + 1 });
      await replaceFixture(directory, 'funding.json', funding);
      await expect(loadMarket(directory)).rejects.toThrow('Duplicate or out-of-window hour');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
