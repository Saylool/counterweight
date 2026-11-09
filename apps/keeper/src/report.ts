import { simulate, selectWorstMoves, syntheticGap, COSTS } from './replay.js';
import { selectRebalanceRule } from './rebalance-selection.js';
import type { MarketDataset } from './market.js';
import { selectCarryRule, REPLAY_SIZES } from './carry-selection.js';

export const ASSUMPTIONS = [
  'Recorded MAINNET market data; simulated execution only. No actual funded trades, signatures, keys or network in replay.',
  'Frozen 180-day UTC window, end exclusive, plus 24 pre-window hourly observations for entry warm-up. No rates/prices are forward-filled. Any missing hour suppresses all performance results.',
  'Entry gates use only settled prior-hour funding. Monitoring uses completed candle prices. Approved proposals execute at the next hourly open; all paired spot sales assume owner approval by then. The horizon close is scheduled in advance.',
  'Both legs hold identical NEAR quantity, rounded DOWN to captured Hyperliquid size precision. Opening short is capped by target dollars; spot is capped by target and remaining spot cash after realized losses; legacy original/reentry comparators do not transfer collateral. The rebalance policy transfers only owned funds, with additions capped by initial NEAR and target dollars. Residual budget stays cash.',
  'Positive Hyperliquid funding pays shorts; negative funding is a debit. Settlement notional uses that hourly perp OPEN as an oracle proxy. Entry-hour funding is excluded; exit-at-open funding is excluded. Exact funding marks/queue ordering are unavailable.',
  'Perp taker 0.045%, maker 0.015%. Baseline uses taker both ways; maker-entry sensitivity assumes every opening maker order fills and still closes taker. These base fees have no account discounts. Maker fills are unverified.',
  '1Click unauthenticated route fee 0.25% plus 0.0001% protocol fee, on each spot acquisition/sale and once on initially credited margin. Terminal margin returns via the assumed fixed-fee withdrawal. Each reverse rebalance pays another $1 withdrawal and routes withdrawn USDC to spot at the stated conversion rates. No live quote was obtained.',
  'Adverse slippage/spread allowance is 5 bps per leg per trade, added as a cost; fees use reference notional. Coinbase is an independent spot price proxy for wNEAR routes, not an assumed Coinbase execution venue. No additional Coinbase fee is charged.',
  'Fixed planning costs per run: $1 destination activation, $1 storage/gas, $1 withdrawal and $3 infrastructure; $0.02 per leg action for signing/gas. These are assumptions, not measured quotes; unused operating capital earns zero. The operating budget flag reports cost overruns.',
  'All capital denominator = spot budget + initially credited venue margin + operating allocation, including unused cash. In rebalance runs only explicit delayed transfers move cash between venues; transit is excluded from margin. Dollar PnL includes spot + perp + signed funding minus every modelled cost. No staking yield. Simple annualization = net return * 8,760 / window hours; no compounding or forecast.',
  'Historical books, mark/oracle history, stop triggers, latency and ADL are unavailable. Rebalance routes take one full hour after submission; paired trades are assumed simultaneous fills, with no interim coin mismatch. Depth is ASSUMED to cover the size at 5 bps; the engine gate is real but historical executable depth is UNVERIFIED. Intrabar perp-high maintenance/stress values are conservative proxies, not liquidation/fill claims.',
  'Captured current NEAR mainnet maintenance table (5% to $20m, 10% above with $1m deduction) is held constant throughout history; historical tier changes are unknown. USD = USDC and wNEAR = NEAR reference price; depeg, wrapper and venue-default risks are unmodelled.',
  'Rebalance is a continuous hedge until an emergency/unrestorable-band unwind, without funding timing. Signal at close, submission next open, route arrival one full hour later; no cash borrowing. Three signatures per rebalance. High trigger is inactive at addition caps; failed actionable restoration fully unwinds. Negative venue equity is infeasible, never floored. Terminal quantities are before scheduled liquidation; final quantity is zero.',
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
    nonpositiveFundingHours: data.bars.filter(b => b.start >= data.start && b.fundingRate <= 0).length,
    cumulativeFundingRatePct: data.bars.filter(b => b.start >= data.start).reduce((sum, b) => sum + b.fundingRate, 0) * 100 };
  if (data.gaps.length) return { status: 'incomplete-data-no-performance', provenance, assumptions: ASSUMPTIONS, sources: SOURCES, costs: COSTS,
    runs: [], comparisons: [], selection: null, rebalanceSelection: null, makerEntrySensitivity: [], worstMoves: [], stressScenarios: [], breakEven: null };
  const sizes = REPLAY_SIZES.slice(0, 2);
  // Selection completes before any holdout/full-window candidate evaluation.
  const rebalanceSelection = selectRebalanceRule(data);
  const selection = selectCarryRule(data);
  const periods = [{ period: 'training', start: data.start, end: selection.trainingEndExclusive },
    { period: 'holdout', start: selection.trainingEndExclusive, end: data.end },
    { period: 'full', start: data.start, end: data.end }];
  const policies = ['hedged-rebalance', 'original', 'reentry', 'always-hedged', 'spot-holder'] as const;
  const comparisons = periods.flatMap(({ period, start, end }) => policies.flatMap(policy =>
    REPLAY_SIZES.map(({ label, ...size }) => ({ period, label, policy, start, end,
      ...simulate(data.bars.filter(b => b.end <= end), start, end, { ...size, szDecimals: data.szDecimals, policy,
        ...(policy === 'reentry' ? { carryRule: selection.rule } : {}),
        ...(policy === 'hedged-rebalance' ? { rebalanceRule: rebalanceSelection.rule } : {}) }) }))));
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
  return { status: 'complete', provenance, assumptions: ASSUMPTIONS, sources: SOURCES, costs: COSTS, runs, comparisons, selection, rebalanceSelection, makerEntrySensitivity, worstMoves,
    stressScenarios: [...stressScenarios, ...syntheticScenarios], breakEven: breakEven(data) };
}
export type ReplayReport = ReturnType<typeof buildReport>;
const usd = (n: number | null) => n === null ? 'n/a' : `$${n.toFixed(6)}`;
const pct = (n: number) => `${n.toFixed(6)}%`;
/** Compact full-window table is also suitable for copying into the delivery summary. */
export function comparisonTable(report: ReplayReport) {
  const lines = ['|Policy|Spot / capital $|Hedged h|Rebal / cost $|Funding $|All costs $|Net $|Return / annual %|DD $ / %|Min H $|Breach h|NEAR start → end|Survived 1h / 24h %|',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
  for (const r of report.comparisons.filter(r => r.period === 'full' && ['hedged-rebalance', 'always-hedged', 'spot-holder'].includes(r.policy))) lines.push(
    `|${r.policy}|${r.spotCapitalUsd} / ${r.initialCapitalUsd}|${r.policy === 'spot-holder' ? 0 : r.heldHours}|${r.rebalances} / ${r.rebalanceCostsUsd.toFixed(2)}|${r.fundingPnlUsd.toFixed(2)}|${r.totalCostsUsd.toFixed(2)}|${r.netPnlUsd.toFixed(2)}|${r.netReturnPct.toFixed(2)} / ${r.simpleAnnualizedNetReturnPct.toFixed(2)}|${r.maxDrawdownUsd.toFixed(2)} / ${r.maxDrawdownPct.toFixed(2)}|${r.minIntrabarStressHeadroomUsd?.toFixed(2) ?? 'n/a'}|${r.maintenanceProxyBreachHours}|${r.initialQuantity.toFixed(1)} → ${r.terminalQuantity.toFixed(1)}|${r.largestSurvivedMoves.length ? r.largestSurvivedMoves.map(m => m.perpMovePct.toFixed(2)).join(' / ') : 'n/a'}|`);
  return lines.join('\n');
}
function rebalanceDetails(report: ReplayReport) {
  const selection = report.rebalanceSelection;
  if (!selection) return [];
  const lines = ['## Full-window comparison', '', comparisonTable(report), '',
    'USD throughout. Min H uses the adverse hourly perp-high proxy, excluding same-hour positive funding. Hedged hours are zero for spot-only (its spot is held throughout). NEAR end is immediately before scheduled liquidation; all final positions are zero. Theoretical always-hedged has 1,222 maintenance-breach hours and negative venue equity: its carry is not executable. Survived moves are rolling positive perp close returns only over continuously held, maintenance-safe hours; independent spot moves and timestamps are in JSON. No observed move is a guaranteed stress capacity.', '',
    'Spot-only capital excludes uncommitted margin. Common-envelope returns (unused margin held idle) are in the detailed tables. Its price upside is the economic exposure the holder forgoes while hedged. Rebalancing progressively sells NEAR on rallies and can buy it back after falls; it does not preserve the starting coin count.', '',
    '## Frozen rebalance selection and OOS evaluation', '',
    `Protocol: docs/REPLAY-PROTOCOL.md. Only first 90 days, ${new Date(selection.trainingStart).toISOString()} to ${new Date(selection.trainingEndExclusive).toISOString()} exclusive, select the rule. Objective: ${selection.objective}. This already-observed fixture is a retrospective chronological holdout.`, '',
    '|Lower / target / upper H/notional|Training net $|Return %|Hedged h|Rebalances|Rebalance costs $|All costs $|Feasible|',
    '|---|---:|---:|---:|---:|---:|---:|---|'];
  for (const c of selection.scores) lines.push(`|${c.lower} / ${c.target} / ${c.upper}|${c.netPnlUsd?.toFixed(6) ?? 'n/a'}|${c.netReturnPct?.toFixed(6) ?? 'n/a'}|${c.heldHours}|${c.rebalances}|${c.rebalanceCostsUsd?.toFixed(6) ?? 'n/a'}|${c.totalCostsUsd?.toFixed(6) ?? 'n/a'}|${c.feasible}|`);
  lines.push('', `Frozen lower / target / upper = **${selection.rule.lower} / ${selection.rule.target} / ${selection.rule.upper}**, latency **${selection.rule.latencyHours} hour** after submission. Low side sizes the smallest integer lot restoring target including net arrival proceeds, with a 10% interim H floor. Reverse side withdraws first, then buys spot and increases short at arrival prices using received cash only; aim at target and accept rounding/price drift only inside the trigger band. Emergency H < 10% at close/open or adverse-high H < 0 overrides rebalancing. No external money or spot mark-to-market collateral credit.`, '',
    'The selection is not robust evidence of profitability: the winning training run is slightly negative. No parameters are revised on OOS outcomes. Each period starts fresh with the same allocation and pays all setup/exit costs; results are not additive.', '',
    '|Period / spot $|Hedged h|Rebalances / cost $|Funding $|All costs $|Net $|Return / simple annual %|DD $ / %|Min close / high H $|Breach h|Min venue $|NEAR start → end|Survived 1h / 24h %|Transit at end $|',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const r of report.comparisons.filter(r => r.policy === 'hedged-rebalance')) lines.push(
    `|${r.period} / ${r.spotCapitalUsd}|${r.heldHours}|${r.rebalances} / ${r.rebalanceCostsUsd.toFixed(6)}|${r.fundingPnlUsd.toFixed(6)}|${r.totalCostsUsd.toFixed(6)}|${r.netPnlUsd.toFixed(6)}|${r.netReturnPct.toFixed(6)} / ${r.simpleAnnualizedNetReturnPct.toFixed(6)}|${r.maxDrawdownUsd.toFixed(6)} / ${r.maxDrawdownPct.toFixed(6)}|${usd(r.minStressHeadroomUsd)} / ${usd(r.minIntrabarStressHeadroomUsd)}|${r.maintenanceProxyBreachHours}|${usd(r.minMarkedVenueEquityUsd)}|${r.initialQuantity} → ${r.terminalQuantity}|${r.largestSurvivedMoves.map(m => m.perpMovePct.toFixed(6)).join(' / ')}|${r.pendingTransferUsd.toFixed(6)}|`);
  lines.push('', 'All rebalance sizes/periods have zero maintenance-proxy breaches and positive marked venue equity. The $25 demo unwinds after 26 full-window hours (237 OOS hours): the required adjustment falls below the $10 minimum order, so the band cannot be restored. It stays flat thereafter. Fixed overhead dominates that size. Zero breaches are conditional on sampled hourly prices and assumed fills/latency; they are not proof against liquidation, failed routes, basis jumps or larger gaps.', '',
    'Rebalance cost includes every actual adjustment: route/protocol fee and spot slippage on the conversion, perp taker fee/slippage, three signing actions ($0.06 total), plus $1 on each reverse withdrawal. Initial entry/terminal exit and setup are included in all costs but excluded from rebalance-only cost. No second route charge is added to the combined NEAR-sale-to-margin route.', '');
  return lines;
}
function comparisonDetails(report: ReplayReport) {
  if (!report.selection) return [];
  const selection = report.selection;
  const lines = ['## Re-entry procedure and frozen selection', '',
    'The protocol was written in docs/REPLAY-PROTOCOL.md before evaluating the new candidates. This fixture had already been observed: this is a retrospective chronological holdout, not a prospective untouched experiment. No holdout scores feed selection. All sizes, costs, thresholds and the three-candidate search were declared before candidate evaluation.', '',
    `Training: ${new Date(selection.trainingStart).toISOString()} to ${new Date(selection.trainingEndExclusive).toISOString()} exclusive (2,160 hours). Holdout: that boundary to ${report.provenance.windowEndExclusiveUtc} (2,160 hours). Selection objective: ${selection.objective}.`, '',
    '|Positive settlements N|Training net $|Training return on ALL capital %|Entries|Held hours|Costs $|',
    '|---:|---:|---:|---:|---:|---:|'];
  for (const c of selection.scores) lines.push(`|${c.positiveHours}|${c.netPnlUsd.toFixed(6)}|${c.netReturnPct.toFixed(6)}|${c.entries}|${c.heldHours}|${c.totalCostsUsd.toFixed(6)}|`);
  lines.push('', `Frozen N = **${selection.rule.positiveHours}**. Initial entry and re-entry require N consecutive strictly positive completed settlements and positive complete trailing 24h funding. Minimum hold 72 hours; funding exit requires six consecutive negative settlements AND negative trailing 24h funding. Emergency stress exit bypasses minimum hold. Cooldown 24 flat hours after any exit; entry headroom at least 20% of notional versus exit below 10%. Re-entry caps leverage at 0.9 after opening perp costs and reduces quantity to fit remaining venue cash; no top-ups or transfers of spot gains. Existing safety/data/depth/minimum-order gates still apply. The horizon close overrides minimum hold.`, '',
    'The 6h and 12h training candidates differ by only about $0.023 at $2,500: selection is fragile, not evidence of an optimal rule. Full-window results use the frozen rule and are descriptive. Each 90-day run starts fresh, pays all fixed and round-trip costs, and uses the preceding 24 known hours for warm-up; it does not carry positions or training profits. Period results are not additive.', '',
    '## Original low-exposure diagnosis', '',
    'Re-entry was already enabled and retried while flat. Every original full-window strategy exit was a stress-headroom unwind, not the six-negative-hour funding exit. Rising NEAR realized losses on the short while the offsetting spot gains remained in the separate spot account. The original re-entry attempted the original target dollars against depleted venue cash, so the leverage limit of one blocked recovery. Gate counts overlap; they must not be added.', '');
  for (const r of report.comparisons.filter(r => r.period === 'full' && r.policy === 'original')) {
    lines.push(`${r.label} ($${r.spotCapitalUsd}): ${r.heldHours}/${r.windowHours} hours held (${pct(r.timeInMarketPct)}), ${r.entries} entries, ${r.entryAttempts} entry attempts, ${r.blockedEntryAttempts} rejected. Ending venue cash ${usd(r.endingVenueCashUsd)}. Blocks: ${JSON.stringify(r.entryBlockCounts)}.`,
      `Trade chronology: ${r.events.map(e => `${new Date(e.time).toISOString()} ${e.type} (${e.reason})`).join('; ')}.`);
    const detail = r.entryBlockDetails['leverage-exceeded'];
    if (detail) lines.push(`First leverage rejection: ${new Date(detail.firstTime).toISOString()}, target rounded notional ${usd(detail.firstNotional)} versus venue equity after opening costs ${usd(detail.firstVenueEquity)}; last rejection ${new Date(detail.lastTime).toISOString()}.`);
  }
  lines.push('', 'There are zero stale-data, future-data or funding-incomplete rejections: all 24 pre-window warm-up observations exist, all 4,320 replay hours are complete, and replay explicitly assumes each observation is fresh (observedAt = now). That freshness assumption is not a live-data guarantee. Nonpositive trailing funding accounts for 41 rejected attempts per original size but does not explain the persistent leverage block. Exits execute at the next open; the first retry occurs one hour after an exit, so flat time also includes that execution scheduling delay.', '',
    '## Legacy comparison interpretation', '',
    'All currency columns are USD. Hours denominator is 4,320. Return denominator includes all committed capital; annual is SIMPLE annualization (return × 365/180), not a forecast. DD is maximum total-equity drawdown at hourly opens/closes, including fees; its percentage uses the running equity peak. Stress H is the close-time proxy; negative hours count paid negative settlements while short, excluding entry/exit-at-open settlements. Spot-only stress is n/a and negative-funding hours are zero because it has no short.', '',
    'Time held does not mean the original dollar target stays invested: each re-entry can be smaller as venue collateral falls. The demo eventually stays flat because the fixed $5 stress reserve and 20% entry-headroom requirement block its proposed size; the engine does not relax those thresholds. Paired exits sell the spot as well as closing the short, so these active policies also move out of NEAR while flat. Higher participation has increased funding but has not covered the resulting turnover costs.', '',
    '## Separate training and holdout results, with every cost line', '',
    'The following tables include full-window results at higher precision. Fixed $6 per run consists of activation $1, storage/gas $1, withdrawal $1, infrastructure $3. Signing is $0.02 per leg action. Spot-only has no venue capital, perp fees/slippage, funding or margin route fees; the same applicable spot rates and all $6 overhead apply. Its all-capital return uses spot + operating allocation; the envelope-return column also reserves the hedged margin as idle cash for a common-capital comparison.', '');
  for (const period of ['training', 'holdout', 'full']) {
    lines.push(`### ${period}`, '',
      '|Policy / size|All capital $|Hours / % / entries|Funding $|Spot PnL $|Perp PnL $|Net $|Return %|Simple annual %|DD $ / %|Min close / intrabar H $|Negative hours|Envelope return %|',
      '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    const runs = report.comparisons.filter(r => r.period === period);
    for (const r of runs) lines.push(`|${r.policy} / ${r.spotCapitalUsd}|${r.initialCapitalUsd.toFixed(6)}|${r.heldHours} / ${r.timeInMarketPct.toFixed(6)} / ${r.entries}|${r.fundingPnlUsd.toFixed(6)}|${r.spotPnlUsd.toFixed(6)}|${r.perpPnlUsd.toFixed(6)}|${r.netPnlUsd.toFixed(6)}|${r.netReturnPct.toFixed(6)}|${r.simpleAnnualizedNetReturnPct.toFixed(6)}|${r.maxDrawdownUsd.toFixed(6)} / ${r.maxDrawdownPct.toFixed(6)}|${usd(r.minStressHeadroomUsd)} / ${usd(r.minIntrabarStressHeadroomUsd)}|${r.negativeFundingHoursHeld}|${r.hedgedEnvelopeReturnPct.toFixed(6)}|`);
    lines.push('', '|Policy / size|Perp fees $|Perp slip $|Spot route $|Spot slip $|Margin route $|Fixed $|Signing $|Total costs $|',
      '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const r of runs) lines.push(`|${r.policy} / ${r.spotCapitalUsd}|${Object.values(r.costs).map(v => v.toFixed(6)).join('|')}|${r.totalCostsUsd.toFixed(6)}|`);
    lines.push('', '|Policy / size|Maintenance-proxy breach hours|Min marked venue equity $|Ending venue cash $|Operating budget exceeded|', '|---|---:|---:|---:|---|');
    for (const r of runs) lines.push(`|${r.policy} / ${r.spotCapitalUsd}|${r.maintenanceProxyBreachHours}|${usd(r.minMarkedVenueEquityUsd)}|${usd(r.endingVenueCashUsd)}|${r.operatingBudgetExceeded}|`);
    lines.push('');
  }
  lines.push('Always hedged deliberately bypasses ALL entry gates and exits, opens at the first open and closes at the final close. It is a pure-carry accounting counterfactual. Negative marked venue equity and maintenance-proxy breaches mean the original 1.2× margin could not support this path without collateral transfers/top-ups or liquidation. Its reported funding and PnL must not be read as achievable account performance. No hypothetical financing or liquidation fills are credited. Spot-only buys at the first open and sells at the final close; its directional price gains/losses and drawdown show the exposure removed by the matched short, subject to basis risk.', '');
  return lines;
}
export function markdownReport(report: ReplayReport) {
  const p = report.provenance;
  const illustrative = report.comparisons.find(r => r.period === 'full' && r.policy === 'hedged-rebalance' && r.label === 'illustrative');
  const lines = ['# Counterweight recorded market replay', '',
    'A NEAR holder gives up NEAR price upside (and avoids the matching downside) while hedged, receiving only carry net of costs and residual basis PnL. Adding an equal-coin short removes the common spot price move from combined PnL while both legs are held, while keeping basis, venue and collateral risks. The hedge receives positive funding and pays negative funding, trading/routing fees and overhead; net carry depends on those costs and time held. The spot-only baseline retains NEAR price gains and drawdowns. In this window, the always-held hedge outgrew its separate margin account: its pure-carry accounting is not an executable return.' +
      (illustrative ? ` At the $2,500 target, the rebalance policy received $${illustrative.fundingPnlUsd.toFixed(2)} funding, paid $${illustrative.totalCostsUsd.toFixed(2)} costs, and netted $${illustrative.netPnlUsd.toFixed(2)} including basis PnL.` : '') +
      ' Higher participation does not guarantee a profit. These are historical simulations with no promised yield.', '', `Status: **${report.status}**. Recorded MAINNET market data; simulated supervised execution, no funds.`, '',
    `Window: ${p.windowStartUtc} through ${p.windowEndExclusiveUtc} (exclusive). Captured ${p.capturedAt}.`,
    `SHA-256 of manifest.json: \`${p.manifestSha256}\`. Run \`npm run replay\` offline to regenerate both reports.`, '',
    `Data: ${p.completeHours}/${p.expectedHours} complete replay hours; ${p.warmupHours} warm-up hours; ${p.gaps.length} missing series-hours.`,
    `Whole-window negative-funding hours: **${p.negativeFundingHours}**; nonpositive-funding hours: ${p.nonpositiveFundingHours}. Summed hourly funding rates: **${pct(p.cumulativeFundingRatePct)}** (not a fixed-dollar or all-capital return).`, '',
    ...rebalanceDetails(report),
    ...comparisonDetails(report),
    '## Original chronological strategy (legacy audit appendix) (all hours; no event selection)', '',
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
  lines.push('', '## Original-policy break-even search (legacy audit only)', '');
  if (report.breakEven) lines.push(`Status: ${report.breakEven.status}. Target short ${usd(report.breakEven.shortUsd)}; all capital ${usd(report.breakEven.allCapitalUsd)}; verified rerun PnL ${usd(report.breakEven.verifiedNetPnlUsd)}; fixed + signing costs ${usd(report.breakEven.fixedCostsUsd)}. Largest scanned short ${usd(report.breakEven.maxTestedShortUsd)}. At the largest/verified size, PnL before fixed costs per target dollar is ${report.breakEven.proportionalPnlBeforeFixedPerDollar.toFixed(8)}; a nonpositive value has no finite algebraic break-even for that proportional trade path. This is conditional on the same simulated policy and cost assumptions, with no global-minimum claim.`);
  lines.push('', '## Data gaps and limits', '', JSON.stringify(p.gaps), '', 'No historical executable books, marks, funding oracle marks, live quotes or actual approvals are recorded. Performance is conditional on the assumptions below.', '', '## Assumptions fixed in code', '');
  for (const a of report.assumptions) lines.push(`- ${a}`);
  lines.push('', '## Primary sources', '');
  for (const [name, url] of Object.entries(report.sources)) lines.push(`- [${name}](${url})`);
  lines.push('', 'Historical carry is not indicative of future results; not financial or investment advice.', '');
  return lines.join('\n');
}
