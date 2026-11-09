import { z } from 'zod';
import { evaluateRisk, HOUR_MS, stressMetrics, maintenanceMargin, CarryRuleSchema, carrySignal, type FundingObservationSchema } from '@counterweight/domain';
import type { z as Zod } from 'zod';
import type { MarketDataset, MarketHour } from './market.js';

import { COSTS } from './costs.js';
export { COSTS } from './costs.js';
import { simulateRebalance, survivedMoves } from './rebalance.js';
import { RebalanceRuleSchema } from '@counterweight/domain';

type Funding = Zod.infer<typeof FundingObservationSchema>;
const ConfigSchema = z.object({ shortUsd: z.number().finite().min(10).max(1e9), marginUsd: z.number().finite().positive().max(1e10),
  operatingUsd: z.number().finite().nonnegative().max(1e10), execution: z.enum(['taker', 'maker-entry']).default('taker'),
  policy: z.enum(['original', 'reentry', 'always-hedged', 'spot-holder', 'hedged-rebalance']).default('original'),
  carryRule: CarryRuleSchema.optional(), rebalanceRule: RebalanceRuleSchema.optional(),
  forceInitial: z.boolean().default(false), reenter: z.boolean().default(true), szDecimals: z.number().int().min(0).max(8).default(1),
  preExistingEntry: z.object({ spotPrice: z.number().finite().positive(), perpPrice: z.number().finite().positive() }).strict().optional() }).strict();
export type ReplayConfig = z.input<typeof ConfigSchema>;
export interface LedgerEvent { time: number; type: string; quantity: number; shortNotional: number; spotPrice: number; perpPrice: number; reason: string; spotQuantity?: number; shortQuantity?: number; venueEquityUsd?: number; stressHeadroomUsd?: number | null; pendingTransferUsd?: number }
export function simulate(bars: MarketHour[], start: number, end: number, input: ReplayConfig) {
  const config = ConfigSchema.parse(input);
  if (config.policy === 'hedged-rebalance') return simulateRebalance(bars, start, end, config);
  if (config.policy === 'reentry' && !config.carryRule) throw new Error('Re-entry requires a frozen carry rule');
  const hedged = config.policy !== 'spot-holder';
  const passive = config.policy === 'always-hedged' || !hedged;
  const window = bars.filter(b => b.start >= start && b.end <= end);
  if (window.length === 0 || window.length * HOUR_MS !== end - start || window.some((b, i) => b.start !== start + i * HOUR_MS)) throw new Error('Replay requires contiguous complete hourly observations');
  const marginCapital = hedged ? config.marginUsd : 0;
  const initialCapital = config.shortUsd + marginCapital + config.operatingUsd;
  const costs = { perpFees: 0, perpSlippage: 0, spotRouteFees: 0, spotSlippage: 0,
    marginRouteFees: marginCapital * (COSTS.route + COSTS.protocol), fixed: COSTS.activationUsd + COSTS.storageGasUsd + COSTS.withdrawalUsd + COSTS.infrastructureUsd, signing: 0 };
  let spotPnl = 0, perpPnl = 0, fundingPnl = 0, negativeFundingHoursHeld = 0, heldHours = 0;
  let position: { quantity: number; spotEntry: number; perpEntry: number; enteredAt: number } | null = null;
  let initialQuantity = 0, terminalQuantity = 0;
  let lastExit: number | null = null, entryAttempts = 0, blockedEntryAttempts = 0;
  let pendingEntry = true, pendingExit: string | null = null, entered = false;
  let minHeadroom: number | null = null, minIntrabarHeadroom: number | null = null;
  let maintenanceProxyBreachHours = 0, maxUnmatchedExposureUsd = 0;
  let peak = initialCapital, maxDrawdownUsd = 0, maxDrawdownPct = 0;
  const events: LedgerEvent[] = [], proposals: { time: number; types: string[] }[] = [];
  const entryBlockCounts: Record<string, number> = {};
  const entryBlockDetails: Record<string, { firstTime: number; lastTime: number; firstNotional: number; firstVenueEquity: number }> = {};
  const survived: boolean[] = [];
  const equityCurve: { time: number; equityUsd: number }[] = [];
  const totalCosts = () => Object.values(costs).reduce((a, b) => a + b, 0);
  const venueCash = () => marginCapital + perpPnl + fundingPnl - costs.perpFees - costs.perpSlippage;
  let minMarkedVenueEquity: number | null = null;
  let history: Funding[] = bars.filter(b => b.end <= start).slice(-24).map(b => ({ time: b.end, rate: b.fundingRate }));
  function risk(n: number, e: number, now: number, intent: 'enter' | 'monitor') {
    return evaluateRisk({ shortNotional: n, venueEquity: e, now, observedAt: now, maxDataAgeMs: 90_000,
      intent, unresolvedOrders: 0, reconciled: true, depth: { availableNotional: n, impactBps: 5 },
      funding: history, state: { entryHalted: false }, adl: false, unexpectedReductionQuantity: 0 });
  }
  function close(time: number, spotPrice: number, perpPrice: number, reason: string) {
    if (!position) return;
    const q = position.quantity;
    spotPnl += q * (spotPrice - position.spotEntry);
    if (hedged) {
      perpPnl += q * (position.perpEntry - perpPrice);
      costs.perpFees += q * perpPrice * COSTS.perpTaker;
      costs.perpSlippage += q * perpPrice * COSTS.perpSlippage;
    }
    costs.spotRouteFees += q * spotPrice * (COSTS.route + COSTS.protocol);
    costs.spotSlippage += q * spotPrice * COSTS.spotSlippage;
    costs.signing += (hedged ? 2 : 1) * COSTS.signingPerActionUsd;
    events.push({ time, type: 'close', quantity: q, shortNotional: hedged ? q * perpPrice : 0, spotPrice, perpPrice, reason });
    if (hedged) minMarkedVenueEquity = Math.min(minMarkedVenueEquity ?? Infinity, venueCash());
    position = null;
    lastExit = time;
  }
  function mark(time: number, spotPrice: number, perpPrice: number, record = true) {
    const unrealized = position ? position.quantity * ((spotPrice - position.spotEntry) + (hedged ? position.perpEntry - perpPrice : 0)) : 0;
    const value = initialCapital + spotPnl + perpPnl + fundingPnl + unrealized - totalCosts();
    peak = Math.max(peak, value);
    maxDrawdownUsd = Math.max(maxDrawdownUsd, peak - value);
    maxDrawdownPct = Math.max(maxDrawdownPct, (peak - value) / peak * 100);
    if (record) equityCurve.push({ time, equityUsd: value });
  }
  for (const [barIndex, bar] of window.entries()) {
    let heldBeforeOpen = position !== null;
    if (pendingExit) { close(bar.start, bar.spot.open, bar.perp.open, pendingExit); pendingExit = null; heldBeforeOpen = false; }
    if (!position && pendingEntry && (!entered || config.reenter)) {
      pendingEntry = false;
      // Fixed user cap, equal coin quantity on each leg; round DOWN to captured venue size precision.
      const unit = 10 ** config.szDecimals;
      const spotPrice = !entered && config.forceInitial ? config.preExistingEntry?.spotPrice ?? bar.spot.open : bar.spot.open;
      const perpPrice = !entered && config.forceInitial ? config.preExistingEntry?.perpPrice ?? bar.perp.open : bar.perp.open;
      const entryPerpRate = (config.execution === 'taker' ? COSTS.perpTaker : COSTS.perpMaker) + COSTS.perpSlippage;
      const collateralCap = config.carryRule && config.policy === 'reentry'
        ? Math.max(0, config.carryRule.entryLeverageCap * venueCash() / (1 + config.carryRule.entryLeverageCap * entryPerpRate)) : Infinity;
      const quantity = Math.floor(Math.min(config.shortUsd / (hedged ? perpPrice : spotPrice),
        Math.max(0, config.shortUsd + spotPnl) / spotPrice, collateralCap / perpPrice) * unit) / unit;
      const n = quantity * perpPrice;
      const entryPerpCost = n * entryPerpRate;
      const decision = risk(n, venueCash() - entryPerpCost, bar.start, 'enter');
      const blocks: string[] = passive ? [] : [...decision.entryBlocks];
      if (config.policy === 'reentry') {
        const rule = config.carryRule!;
        if (!carrySignal(history, bar.start, rule).positiveConfirmed) blocks.push('positive-confirmation');
        if (lastExit !== null && bar.start - lastExit < rule.cooldownHours * HOUR_MS) blocks.push('cooldown');
        if (decision.metrics.headroom < rule.entryHeadroomFraction * n) blocks.push('entry-headroom-hysteresis');
      }
      entryAttempts++;
      for (const block of blocks) {
        entryBlockCounts[block] = (entryBlockCounts[block] ?? 0) + 1;
        const detail = entryBlockDetails[block] ??= { firstTime: bar.start, lastTime: bar.start, firstNotional: n, firstVenueEquity: venueCash() - entryPerpCost };
        detail.lastTime = bar.start;
      }
      if ((config.forceInitial && !entered) || (blocks.length === 0 && (!passive || !entered))) {
        position = { quantity, spotEntry: spotPrice, perpEntry: perpPrice, enteredAt: bar.start };
        if (!entered) initialQuantity = quantity;
        entered = true;
        if (hedged) {
          costs.perpFees += n * (config.execution === 'taker' ? COSTS.perpTaker : COSTS.perpMaker);
          costs.perpSlippage += n * COSTS.perpSlippage;
        }
        costs.spotRouteFees += quantity * spotPrice * (COSTS.route + COSTS.protocol);
        costs.spotSlippage += quantity * spotPrice * COSTS.spotSlippage;
        costs.signing += (hedged ? 2 : 1) * COSTS.signingPerActionUsd;
        events.push({ time: bar.start, type: 'open', quantity, shortNotional: hedged ? n : 0, spotPrice, perpPrice,
          reason: passive ? 'scheduled-passive-entry' : config.forceInitial && events.length === 0 ? 'counterfactual-pre-existing-hedge' : 'previous-hour-entry-gate' });
      } else blockedEntryAttempts++;
    }
    mark(bar.start, bar.spot.open, bar.perp.open, false);
    const fundingBefore = fundingPnl;
    if (position) {
      heldHours++;
      // Funding events occur near the hourly OPEN. Exclude an entry-hour settlement to avoid assuming queue ordering.
      if (heldBeforeOpen && hedged) {
        fundingPnl += position.quantity * bar.perp.open * bar.fundingRate; // Positive funding pays a SHORT.
        if (bar.fundingRate < 0) negativeFundingHoursHeld++;
      }
      // Adverse perp high, independently of spot candle ordering. This is a risk proxy, not a fill/liquidation simulation.
      if (hedged) {
        const adverseEquity = venueCash() - Math.max(0, fundingPnl - fundingBefore) + position.quantity * (position.perpEntry - bar.perp.high);
        minMarkedVenueEquity = Math.min(minMarkedVenueEquity ?? Infinity, adverseEquity);
        const adverse = stressMetrics({ shortNotional: position.quantity * bar.perp.high, venueEquity: adverseEquity });
        minIntrabarHeadroom = Math.min(minIntrabarHeadroom ?? Infinity, adverse.headroom);
        // Maintenance before the additional hypothetical +50% shock.
        const breach = adverseEquity <= maintenanceMargin(position.quantity * bar.perp.high);
        if (breach) maintenanceProxyBreachHours++;
        survived[barIndex] = !breach;
        maxUnmatchedExposureUsd = Math.max(maxUnmatchedExposureUsd, Math.abs(position.quantity * (bar.spot.close - bar.perp.close)));
      } else maxUnmatchedExposureUsd = Math.max(maxUnmatchedExposureUsd, position.quantity * bar.spot.close);
    }
    survived[barIndex] ??= false;
    history = [...history, { time: bar.end, rate: bar.fundingRate }].slice(-24);
    if (position && hedged) {
      const n = position.quantity * bar.perp.close;
      const decision = risk(n, venueCash() + position.quantity * (position.perpEntry - bar.perp.close), bar.end, 'monitor');
      minHeadroom = Math.min(minHeadroom ?? Infinity, decision.metrics.headroom);
      const exit = passive ? undefined : decision.proposals.find(p => p.type === 'full-unwind' || (p.type === 'exit-proposal' &&
        (config.policy !== 'reentry' || (bar.end - position!.enteredAt >= config.carryRule!.minimumHoldHours * HOUR_MS &&
          carrySignal(history, bar.end, config.carryRule!).fundingExit))));
      if (exit && (exit.type === 'full-unwind' || exit.type === 'exit-proposal')) {
        pendingExit = exit.reason; proposals.push({ time: bar.end, types: decision.proposals.map(p => p.type) });
      }
    } else if (!position && !passive && (config.reenter || !entered)) pendingEntry = true;
    // Predetermined horizon close uses this last completed candle; no future price is read.
    if (bar.end === end) { terminalQuantity = position?.quantity ?? 0; close(end, bar.spot.close, bar.perp.close, 'fixed-horizon-close'); }
    mark(bar.end, bar.spot.close, bar.perp.close);
  }
  const netPnlUsd = spotPnl + perpPnl + fundingPnl - totalCosts();
  const fixedCostsUsd = costs.fixed + costs.signing;
  return { config, initialCapitalUsd: initialCapital, spotCapitalUsd: config.shortUsd, marginCapitalUsd: marginCapital,
    operatingCapitalUsd: config.operatingUsd, netPnlUsd, netReturnPct: netPnlUsd / initialCapital * 100,
    simpleAnnualizedNetReturnPct: netPnlUsd / initialCapital * 100 * 8760 / window.length,
    hedgedEnvelopeReturnPct: netPnlUsd / (config.shortUsd + config.marginUsd + config.operatingUsd) * 100,
    timeInMarketPct: heldHours / window.length * 100, windowHours: window.length,
    spotPnlUsd: spotPnl, perpPnlUsd: perpPnl, fundingPnlUsd: fundingPnl, costs, totalCostsUsd: totalCosts(), fixedCostsUsd,
    negativeFundingHoursHeld, heldHours, maxDrawdownUsd, maxDrawdownPct, minStressHeadroomUsd: minHeadroom,
    minIntrabarStressHeadroomUsd: minIntrabarHeadroom, maintenanceProxyBreachHours, maxUnmatchedExposureUsd,
    rebalances: 0, rebalanceCostsUsd: 0, initialQuantity, terminalQuantity, finalQuantity: 0,
    pendingTransferUsd: 0, netMarginTransfersUsd: 0, largestSurvivedMoves: hedged ? survivedMoves(bars, window, survived) : [],
    operatingBudgetExceeded: totalCosts() - costs.perpFees - costs.perpSlippage > config.operatingUsd,
    endingVenueCashUsd: venueCash(), minMarkedVenueEquityUsd: minMarkedVenueEquity,
    entries: events.filter(e => e.type === 'open').length, entryAttempts, blockedEntryAttempts,
    entryBlockCounts, entryBlockDetails, events, proposals, equityCurve };
}

export function selectWorstMoves(data: MarketDataset) {
  return [1, 24].map(hours => {
    let best: { hours: number; start: number; end: number; perpMovePct: number; spotMovePct: number; candidates: number } | undefined;
    let candidates = 0;
    const byEnd = new Map(data.bars.map(b => [b.end, b]));
    for (const endBar of data.bars) {
      const start = endBar.end - hours * HOUR_MS;
      if (start < data.start || endBar.end > data.end) continue;
      const before = byEnd.get(start);
      if (!before || data.bars.filter(b => b.start >= start && b.end <= endBar.end).length !== hours) continue;
      candidates++;
      const perpMovePct = (endBar.perp.close / before.perp.close - 1) * 100;
      if (!best || perpMovePct > best.perpMovePct) best = { hours, start, end: endBar.end, perpMovePct,
        spotMovePct: (endBar.spot.close / before.spot.close - 1) * 100, candidates: 0 };
    }
    if (!best) throw new Error('No complete move candidates');
    return { ...best, candidates };
  });
}

export function syntheticGap(anchor: MarketHour): MarketHour[] {
  const flat = (price: number) => ({ open: price, high: price, low: price, close: price });
  // A pre-existing hedge sees a discontinuous +50% opening gap in BOTH reference prices. Zero synthetic funding.
  // Keep a post-gap hour so the close-time unwind proposal executes at the next open.
  return [0, 1, 2].map(i => ({ start: anchor.start + i * HOUR_MS, end: anchor.start + (i + 1) * HOUR_MS,
    spot: flat(anchor.spot.open * (i === 0 ? 1 : 1.5)), perp: flat(anchor.perp.open * (i === 0 ? 1 : 1.5)), fundingRate: 0 }));
}
