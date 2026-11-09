import { simulate, selectWorstMoves, syntheticGap, COSTS } from './replay.js';
import type { MarketDataset } from './market.js';

export const ASSUMPTIONS = [
  'Recorded MAINNET market data; simulated execution only. No actual funded trades, signatures, keys or network in replay.',
  'Frozen 180-day UTC window, end exclusive, plus 24 pre-window hourly observations for entry warm-up. No rates/prices are forward-filled. Any missing hour suppresses all performance results.',
  'Entry gates use only settled prior-hour funding. Monitoring uses completed candle prices. Approved proposals execute at the next hourly open; all paired spot sales assume owner approval by then. The horizon close is scheduled in advance.',
  'Both legs hold identical NEAR quantity, rounded DOWN to captured Hyperliquid size precision. Opening short is capped by target dollars; spot is capped by target and remaining spot cash after realized losses; no reinvestment or margin top-ups. Residual budget stays cash.',
  'Positive Hyperliquid funding pays shorts; negative funding is a debit. Settlement notional uses that hourly perp OPEN as an oracle proxy. Entry-hour funding is excluded; exit-at-open funding is excluded. Exact funding marks/queue ordering are unavailable.',
  'Perp taker 0.045%, maker 0.015%. Baseline uses taker both ways; maker-entry sensitivity assumes every opening maker order fills and still closes taker. These base fees have no account discounts. Maker fills are unverified.',
  '1Click unauthenticated route fee 0.25% plus 0.0001% protocol fee, on each spot acquisition/sale and once on initially credited margin. Margin returns via the assumed fixed-fee withdrawal, without a second 1Click route. No live quote was obtained.',
  'Adverse slippage/spread allowance is 5 bps per leg per trade, added as a cost; fees use reference notional. Coinbase is an independent spot price proxy for wNEAR routes, not an assumed Coinbase execution venue. No additional Coinbase fee is charged.',
  'Fixed planning costs per run: $1 destination activation, $1 storage/gas, $1 withdrawal and $3 infrastructure; $0.02 per leg action for signing/gas. These are assumptions, not measured quotes; unused operating capital earns zero. The operating budget flag reports cost overruns.',
  'All capital denominator = spot budget + initially credited venue margin + operating allocation, including unused cash. Spot and margin capital stay separate. Dollar PnL includes spot + perp + signed funding minus every modelled cost. No staking yield or annualization.',
  'Historical books, mark/oracle history, stop triggers, latency and ADL are unavailable. Depth is ASSUMED to cover the size at 5 bps; the engine gate is real but historical executable depth is UNVERIFIED. Intrabar perp-high maintenance/stress values are conservative proxies, not liquidation/fill claims.',
  'Captured current NEAR mainnet maintenance table (5% to $20m, 10% above with $1m deduction) is held constant throughout history; historical tier changes are unknown. USD = USDC and wNEAR = NEAR reference price; depeg, wrapper and venue-default risks are unmodelled.',
  'Worst moves are the maximum positive rolling close-to-close perp returns over all 1h/24h candidates whose endpoints are inside the window; ties choose earliest. Scenarios value a pre-existing hedge at the start endpoint close regardless of entry gates, disable re-entry, and do not enter the chronological strategy selection.',
  'Synthetic +50% is a discontinuous gap in BOTH legs after one flat hour at the first window price, with zero funding and a post-gap hour to execute the unwind proposal. It is synthetic, not an observed event. Owner delay, rejected proposals and spot-sale lag could worsen actual outcomes.',
  'Break-even is a rerun search over target short dollars with margin = 1.2x target and operating capital = max($20, 8% of target), identical fees and engine. Scan upward in powers of two from $10 plus the $1m endpoint, then bisect the first profitable bracket. Size rounding, $5 reserve and policy changes can make PnL nonmonotone: this is a first bracketed crossing, not a proven global minimum or a size recommendation.',
] as const;
export const SOURCES = {
  maintenance: 'https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-tiers',
  market: 'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint',
  spot: 'https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles',
  fees: 'https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees',
  route: 'https://docs.near-intents.org/resources/fees',
};
export function breakEven(data: MarketDataset) {
  const evaluate = (size: number) => simulate(data.bars, data.start, data.end,
    { shortUsd: size, marginUsd: size * 1.2, operatingUsd: Math.max(20, 0.08 * size), szDecimals: data.szDecimals });
  const scan: { shortUsd: number; netPnlUsd: number }[] = [];
  const sizes = [10];
  while (sizes.at(-1)! < 1_000_000) sizes.push(Math.min(1_000_000, sizes.at(-1)! * 2));
  let lower = 10;
  for (const size of sizes) {
    const run = evaluate(size);
    scan.push({ shortUsd: size, netPnlUsd: run.netPnlUsd });
    if (run.netPnlUsd >= 0) {
      let upper = size;
      if (size !== 10) for (let i = 0; i < 16; i++) {
        const middle = (lower + upper) / 2;
        if (evaluate(middle).netPnlUsd >= 0) upper = middle;
        else lower = middle;
      }
      const verified = evaluate(upper);
      return { status: 'first-bracketed-crossing', shortUsd: upper, allCapitalUsd: verified.initialCapitalUsd,
        verifiedNetPnlUsd: verified.netPnlUsd, fixedCostsUsd: verified.fixedCostsUsd, bracketLowerUsd: lower, maxTestedShortUsd: size, proportionalPnlBeforeFixedPerDollar: (verified.netPnlUsd + verified.fixedCostsUsd) / upper, scan };
    }
    lower = size;
  }
  const last = evaluate(lower);
  return { status: 'no-profitable-size-found-through-scan', shortUsd: null, allCapitalUsd: null, verifiedNetPnlUsd: null, fixedCostsUsd: last.fixedCostsUsd, bracketLowerUsd: lower, maxTestedShortUsd: lower, proportionalPnlBeforeFixedPerDollar: (last.netPnlUsd + last.fixedCostsUsd) / lower, scan };
}
export function buildReport(data: MarketDataset) {
  const provenance = { capturedAt: data.capturedAt, manifestSha256: data.manifestSha256, windowStart: data.start, windowEndExclusive: data.end,
    windowStartUtc: new Date(data.start).toISOString(), windowEndExclusiveUtc: new Date(data.end).toISOString(),
    expectedHours: (data.end - data.start) / 3_600_000, completeHours: data.bars.filter(b => b.start >= data.start).length,
    warmupHours: data.bars.filter(b => b.end <= data.start).length, gaps: data.gaps,
    negativeFundingHours: data.bars.filter(b => b.start >= data.start && b.fundingRate < 0).length,
    nonpositiveFundingHours: data.bars.filter(b => b.start >= data.start && b.fundingRate <= 0).length };
  if (data.gaps.length) return { status: 'incomplete-data-no-performance', provenance, assumptions: ASSUMPTIONS, sources: SOURCES, costs: COSTS,
    runs: [], makerEntrySensitivity: [], worstMoves: [], stressScenarios: [], breakEven: null };
  const sizes = [{ label: 'demo', shortUsd: 25, marginUsd: 30, operatingUsd: 20 },
    { label: 'illustrative', shortUsd: 2500, marginUsd: 3000, operatingUsd: 200 }];
  const runs = sizes.map(({ label, ...size }) => ({ label, ...simulate(data.bars, data.start, data.end, { ...size, szDecimals: data.szDecimals }) }));
  const makerEntrySensitivity = sizes.map(({ label, ...size }) => ({ label, ...simulate(data.bars, data.start, data.end,
    { ...size, szDecimals: data.szDecimals, execution: 'maker-entry' }) }));
  const worstMoves = selectWorstMoves(data);
  const stressScenarios = worstMoves.flatMap(move => sizes.map(({ label, ...size }) => ({ label: `${label}-worst-${move.hours}h`,
    kind: 'recorded-worst-move', move, ...simulate(data.bars, move.start, move.end, { ...size, forceInitial: true, reenter: false, szDecimals: data.szDecimals,
      preExistingEntry: { spotPrice: data.bars.find(b => b.end === move.start)!.spot.close, perpPrice: data.bars.find(b => b.end === move.start)!.perp.close } }) })));
  const anchor = data.bars.find(b => b.start === data.start)!;
  const synthetic = syntheticGap(anchor);
  const syntheticScenarios = sizes.map(({ label, ...size }) => ({ label: `${label}-synthetic-50pct-gap`, kind: 'SYNTHETIC +50% gap',
    ...simulate(synthetic, synthetic[0]!.start, synthetic.at(-1)!.end, { ...size, forceInitial: true, reenter: false, szDecimals: data.szDecimals }) }));
  return { status: 'complete', provenance, assumptions: ASSUMPTIONS, sources: SOURCES, costs: COSTS, runs, makerEntrySensitivity, worstMoves,
    stressScenarios: [...stressScenarios, ...syntheticScenarios], breakEven: breakEven(data) };
}
export type ReplayReport = ReturnType<typeof buildReport>;
const usd = (n: number | null) => n === null ? 'n/a' : `$${n.toFixed(6)}`;
const pct = (n: number) => `${n.toFixed(6)}%`;
export function markdownReport(report: ReplayReport) {
  const p = report.provenance;
  const lines = ['# Counterweight recorded market replay', '', `Status: **${report.status}**. Recorded MAINNET market data; simulated supervised execution, no funds.`, '',
    `Window: ${p.windowStartUtc} through ${p.windowEndExclusiveUtc} (exclusive). Captured ${p.capturedAt}.`,
    `SHA-256 of manifest.json: \`${p.manifestSha256}\`. Run \`npm run replay\` offline to regenerate both reports.`, '',
    `Data: ${p.completeHours}/${p.expectedHours} complete replay hours; ${p.warmupHours} warm-up hours; ${p.gaps.length} missing series-hours.`,
    `Whole-window negative-funding hours: **${p.negativeFundingHours}**; nonpositive-funding hours: ${p.nonpositiveFundingHours}.`, '',
    '## Chronological strategy (all hours; no event selection)', '',
    '| Size | All capital | Net PnL | Net return on ALL capital | Funding | Total costs | Drawdown USD / peak % | Min close stress H | Min intrabar H | Entries / held hours / negative settlements |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'];
  for (const r of report.runs) lines.push(`| ${r.label} | ${usd(r.initialCapitalUsd)} | ${usd(r.netPnlUsd)} | ${pct(r.netReturnPct)} | ${usd(r.fundingPnlUsd)} | ${usd(r.totalCostsUsd)} | ${usd(r.maxDrawdownUsd)} / ${pct(r.maxDrawdownPct)} | ${usd(r.minStressHeadroomUsd)} | ${usd(r.minIntrabarStressHeadroomUsd)} | ${r.entries} / ${r.heldHours} / ${r.negativeFundingHoursHeld} |`);
  for (const r of report.runs) lines.push('', `${r.label}: spot PnL ${usd(r.spotPnlUsd)}, perp PnL ${usd(r.perpPnlUsd)}, ending venue cash ${usd(r.endingVenueCashUsd)}; maximum marked dollar basis exposure ${usd(r.maxUnmatchedExposureUsd)}. Maintenance-proxy breach hours ${r.maintenanceProxyBreachHours}. Operating budget exceeded: ${r.operatingBudgetExceeded}.`,
    `Cost breakdown: ${Object.entries(r.costs).map(([k, v]) => `${k} ${usd(v)}`).join('; ')}.`);
  lines.push('', '## Mechanically selected real moves', '', 'Selection: rolling perp close-to-close returns, earliest tie. These stress-only counterfactuals bypass entry gates and assume an existing hedge.');
  for (const m of report.worstMoves) lines.push('', `${m.hours}h maximum: **${pct(m.perpMovePct)}**, ${new Date(m.start).toISOString()} → ${new Date(m.end).toISOString()}, selected from ${m.candidates} candidates. Independent spot move: ${pct(m.spotMovePct)}.`);
  lines.push('', '| Scenario | Net PnL | Return on ALL capital | Min close H | Min intrabar H | Exit proposals |', '| --- | ---: | ---: | ---: | ---: | --- |');
  for (const r of report.stressScenarios) lines.push(`| ${r.label} (${r.kind}) | ${usd(r.netPnlUsd)} | ${pct(r.netReturnPct)} | ${usd(r.minStressHeadroomUsd)} | ${usd(r.minIntrabarStressHeadroomUsd)} | ${r.proposals.flatMap(p => p.types).join(', ') || 'none'} |`);
  lines.push('', '## Maker-entry sensitivity (assumed fills)', '');
  for (const r of report.makerEntrySensitivity) lines.push(`${r.label}: net ${usd(r.netPnlUsd)}; return ${pct(r.netReturnPct)}; costs ${usd(r.totalCostsUsd)}.`);
  lines.push('', '## Break-even search', '');
  if (report.breakEven) lines.push(`Status: ${report.breakEven.status}. Target short ${usd(report.breakEven.shortUsd)}; all capital ${usd(report.breakEven.allCapitalUsd)}; verified rerun PnL ${usd(report.breakEven.verifiedNetPnlUsd)}; fixed + signing costs ${usd(report.breakEven.fixedCostsUsd)}. Largest scanned short ${usd(report.breakEven.maxTestedShortUsd)}. At the largest/verified size, PnL before fixed costs per target dollar is ${report.breakEven.proportionalPnlBeforeFixedPerDollar.toFixed(8)}; a nonpositive value has no finite algebraic break-even for that proportional trade path. This is conditional on the same simulated policy and cost assumptions, with no global-minimum claim.`);
  lines.push('', '## Data gaps and limits', '', JSON.stringify(p.gaps), '', 'No historical executable books, marks, funding oracle marks, live quotes or actual approvals are recorded. Performance is conditional on the assumptions below.', '', '## Assumptions fixed in code', '');
  for (const a of report.assumptions) lines.push(`- ${a}`);
  lines.push('', '## Primary sources', '');
  for (const [name, url] of Object.entries(report.sources)) lines.push(`- [${name}](${url})`);
  lines.push('', 'Historical carry is not indicative of future results; not financial or investment advice.', '');
  return lines.join('\n');
}
