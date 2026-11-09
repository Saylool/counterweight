import { evaluateRisk, HOUR_MS, maintenanceMargin, RebalanceRuleSchema, stressMetrics } from '@counterweight/domain';
import { COSTS } from './costs.js';
import type { ReplayConfig, LedgerEvent } from './replay.js';
import type { MarketHour } from './market.js';

/** No insolvency flooring, spot collateral credit, or price-dependent fictitious liquidation. */
export class ReplaySolvencyError extends Error {}
export function simulateRebalance(bars: MarketHour[], start: number, end: number, config: ReplayConfig) {
  const rule = RebalanceRuleSchema.parse(config.rebalanceRule);
  const window = bars.filter(b => b.start >= start && b.end <= end);
  if (!window.length || window.length * HOUR_MS !== end - start || window.some((b, i) => b.start !== start + i * HOUR_MS))
    throw new Error('Replay requires contiguous complete hourly observations');
  const unit = 10 ** (config.szDecimals ?? 1);
  const routeRate = COSTS.route + COSTS.protocol, spotRate = routeRate + COSTS.spotSlippage;
  const perpRate = COSTS.perpTaker + COSTS.perpSlippage;
  const initialCapital = config.shortUsd + config.marginUsd + config.operatingUsd;
  const costs = { perpFees: 0, perpSlippage: 0, spotRouteFees: 0, spotSlippage: 0,
    marginRouteFees: config.marginUsd * routeRate, fixed: 6, signing: 0 };
  const totalCosts = () => Object.values(costs).reduce((a, b) => a + b, 0);
  let venue = config.marginUsd, spotCash = config.shortUsd;
  let operating = config.operatingUsd - costs.fixed - costs.marginRouteFees;
  let q = 0, entry = 0, initialQuantity = 0, terminalQuantity = 0;
  let spotPnl = 0, perpPnl = 0, fundingPnl = 0, heldHours = 0, negativeFundingHoursHeld = 0;
  let rebalanceCostsUsd = 0, rebalances = 0, netMarginTransfersUsd = 0;
  let pending: { direction: 'top-up' | 'withdraw'; amount: number; arrives: number } | null = null;
  let signal: 'low' | 'high' | 'unwind' | null = null;
  let minHeadroom: number | null = null, minIntrabarHeadroom: number | null = null, minVenue: number | null = null;
  let maintenanceProxyBreachHours = 0, maxUnmatchedExposureUsd = 0;
  let peak = initialCapital, maxDrawdownUsd = 0, maxDrawdownPct = 0;
  const events: LedgerEvent[] = [], proposals: { time: number; types: string[] }[] = [];
  const equityCurve: { time: number; equityUsd: number }[] = [];
  const survived: boolean[] = [];
  const entryBlockCounts: Record<string, number> = {};
  const entryBlockDetails: Record<string, { firstTime: number; lastTime: number; firstNotional: number; firstVenueEquity: number }> = {};
  const H = (quantity: number, price: number, equity: number) => stressMetrics({ shortNotional: quantity * price, venueEquity: equity }).headroom;
  const venueEquity = (price: number) => venue + q * (entry - price);
  function event(time: number, type: string, quantity: number, s: number, p: number, reason: string) {
    events.push({ time, type, quantity, shortNotional: q * p, spotPrice: s, perpPrice: p, reason,
      spotQuantity: q, shortQuantity: q, venueEquityUsd: venueEquity(p),
      stressHeadroomUsd: q ? H(q, p, venueEquity(p)) : null, pendingTransferUsd: pending?.amount ?? 0 });
  }
  function checkEquity(equity: number, time: number) {
    if (equity < 0) throw new ReplaySolvencyError(`Negative venue equity at ${time}: ${equity}; no executable liquidation inferred`);
    minVenue = Math.min(minVenue ?? Infinity, equity);
  }
  function mark(time: number, s: number, p: number, record = true) {
    const value = spotCash + q * s + venueEquity(p) + operating + (pending?.amount ?? 0);
    peak = Math.max(peak, value);
    maxDrawdownUsd = Math.max(maxDrawdownUsd, peak - value);
    maxDrawdownPct = Math.max(maxDrawdownPct, (peak - value) / peak * 100);
    if (record) equityCurve.push({ time, equityUsd: value });
  }
  function fees(quantity: number, p: number, spotNotional: number, signs: number) {
    costs.perpFees += quantity * p * COSTS.perpTaker;
    costs.perpSlippage += quantity * p * COSTS.perpSlippage;
    venue -= quantity * p * perpRate;
    costs.spotRouteFees += spotNotional * routeRate;
    costs.spotSlippage += spotNotional * COSTS.spotSlippage;
    costs.signing += signs * COSTS.signingPerActionUsd;
    operating -= signs * COSTS.signingPerActionUsd;
  }
  function reduce(quantity: number, s: number, p: number) {
    // Spot cost basis is tracked separately from the perp weighted entry.
    spotPnl += quantity * (s - spotBasis);
    const pnl = quantity * (entry - p);
    perpPnl += pnl; venue += pnl;
    q = Math.max(0, Math.round((q - quantity) * unit) / unit);
  }
  let spotBasis = 0;
  function close(time: number, s: number, p: number, reason: string) {
    if (!q) return;
    checkEquity(venueEquity(p) - q * p * perpRate, time);
    const quantity = q;
    reduce(quantity, s, p);
    spotCash += quantity * s * (1 - spotRate);
    fees(quantity, p, quantity * s, 2);
    event(time, 'close', quantity, s, p, reason);
  }
  // Minimal integer lot satisfying a monotone predicate; no future prices are inputs.
  function firstLot(maxTicks: number, predicate: (quantity: number) => boolean) {
    if (maxTicks < 1 || !predicate(maxTicks / unit)) return null;
    let lo = 1, hi = maxTicks;
    while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (predicate(mid / unit)) hi = mid; else lo = mid + 1; }
    return lo / unit;
  }
  function capacity(s: number, p: number) {
    return Math.max(0, Math.floor((Math.min(initialQuantity, config.shortUsd / s, config.shortUsd / p) - q + 1e-10) * unit));
  }
  let entries = 0;
  for (const [i, bar] of window.entries()) {
    const s = bar.spot.open, p = bar.perp.open;
    const heldBeforeOpen = q;
    // Settlement uses only the quantity present before this open, excluding additions/entry.
    const funding = heldBeforeOpen * p * bar.fundingRate;
    let fundingCredited = 0;
    if (i === 0) {
      const quantity = Math.floor(Math.min(config.shortUsd / s, config.shortUsd / p) * unit) / unit;
      const history = bars.filter(b => b.end <= start).slice(-24).map(b => ({ time: b.end, rate: b.fundingRate }));
      const decision = evaluateRisk({ shortNotional: quantity * p, venueEquity: venue - quantity * p * perpRate,
        now: start, observedAt: start, maxDataAgeMs: 90_000, intent: 'enter', unresolvedOrders: 0, reconciled: true,
        depth: { availableNotional: quantity * p, impactBps: 5 }, funding: history,
        state: { entryHalted: false }, adl: false, unexpectedReductionQuantity: 0 });
      for (const block of decision.entryBlocks) {
        entryBlockCounts[block] = 1;
        entryBlockDetails[block] = { firstTime: start, lastTime: start, firstNotional: quantity * p, firstVenueEquity: venue - quantity * p * perpRate };
      }
      if (!decision.entryBlocks.length && operating >= quantity * s * spotRate + 0.08) {
        q = quantity; initialQuantity = q; entry = p; spotBasis = s; entries = 1;
        spotCash -= q * s;
        operating -= q * s * spotRate;
        fees(q, p, q * s, 2);
        event(start, 'open', q, s, p, 'scheduled-risk-gated-entry');
      }
    }
    if (pending && pending.arrives <= bar.start) {
      const transfer = pending; pending = null;
      if (transfer.direction === 'top-up') {
        venue += transfer.amount; netMarginTransfersUsd += transfer.amount;
        event(bar.start, 'route-arrival', 0, s, p, `top-up:${transfer.amount}`);
      } else if (q && signal !== 'unwind') {
        const beforeCost = totalCosts();
        const cap = Math.min(capacity(s, p), Math.floor(transfer.amount * (1 - spotRate) / s * unit + 1e-10));
        const equity = venueEquity(p);
        const desired = firstLot(cap, k => H(q + k, p, equity - k * p * perpRate) <= rule.target * (q + k) * p);
        const k = desired ?? cap / unit;
        const after = H(q + k, p, equity - k * p * perpRate), n = (q + k) * p;
        if (k * p >= 10 && after >= rule.lower * n && after <= rule.upper * n && equity - k * p * perpRate >= n && operating >= 0.04) {
          const spend = k * s / (1 - spotRate);
          spotBasis = (q * spotBasis + k * s) / (q + k);
          entry = (q * entry + k * p) / (q + k);
          q = Math.round((q + k) * unit) / unit;
          spotCash += transfer.amount - spend;
          fees(k, p, spend, 2); // Withdrawal already signed at dispatch.
          event(bar.start, 'rebalance-increase', k, s, p, 'withdrawal-arrived-paired-increase');
        } else {
          spotCash += transfer.amount;
          close(bar.start, s, p, 'reverse-band-unrestorable');
        }
        if (events.at(-1)?.type === 'rebalance-increase') rebalanceCostsUsd += totalCosts() - beforeCost;
      } else spotCash += transfer.amount;
    }
    checkEquity(venueEquity(p), bar.start);
    // A pending emergency has precedence over new discretionary actions, even on arrival.
    if (q && (signal === 'unwind' || H(q, p, venueEquity(p)) < 0.1 * q * p)) {
      close(bar.start, s, p, 'stress-or-latency-unwind'); signal = null;
    }
    if (q && signal && !pending && bar.end < end) {
      const equity = venueEquity(p), beforeCost = totalCosts(), beforeCount = rebalances;
      if (signal === 'low' && H(q, p, equity) < rule.lower * q * p) {
        const k = firstLot(Math.max(0, Math.round(q * unit) - 1), k => {
          const remaining = q - k, e = equity - k * p * perpRate;
          return H(remaining, p, e + k * s * (1 - spotRate)) >= rule.target * remaining * p &&
            H(remaining, p, e) >= 0.1 * remaining * p;
        });
        const finalH = k === null ? Infinity : H(q - k, p, equity - k * p * perpRate + k * s * (1 - spotRate));
        if (k !== null && k * p >= 10 && (q - k) * p >= 10 && operating >= 0.10 && equity - k * p * perpRate > 0 &&
          finalH <= rule.upper * (q - k) * p) {
          reduce(k, s, p); fees(k, p, k * s, 3);
          pending = { direction: 'top-up', amount: k * s * (1 - spotRate), arrives: bar.start + rule.latencyHours * HOUR_MS };
          rebalances++;
          event(bar.start, 'rebalance-reduce', k, s, p, 'spot-sale-to-margin-in-transit');
        } else close(bar.start, s, p, 'low-band-unrestorable');
      } else if (signal === 'high' && H(q, p, equity) > rule.upper * q * p && capacity(s, p) > 0) {
        const k = firstLot(capacity(s, p), k => H(q + k, p, equity - k * s / (1 - spotRate) - k * p * perpRate) <= rule.target * (q + k) * p);
        if (k !== null && k * p >= 10 && operating >= COSTS.withdrawalUsd + 0.10 &&
          H(q, p, equity - k * s / (1 - spotRate)) >= 0.1 * q * p) {
          const amount = k * s / (1 - spotRate);
          venue -= amount; netMarginTransfersUsd -= amount;
          pending = { direction: 'withdraw', amount, arrives: bar.start + rule.latencyHours * HOUR_MS };
          costs.fixed += COSTS.withdrawalUsd; costs.signing += COSTS.signingPerActionUsd;
          operating -= COSTS.withdrawalUsd + COSTS.signingPerActionUsd; rebalances++;
          event(bar.start, 'rebalance-withdraw', k, s, p, 'excess-margin-to-spot-in-transit');
        } else close(bar.start, s, p, 'high-band-unrestorable');
      }
      if (rebalances > beforeCount) rebalanceCostsUsd += totalCosts() - beforeCost;
    }
    signal = null;
    mark(bar.start, s, p, false);
    if (q) {
      heldHours++;
      // Open exits receive no funding; reductions conservatively settle only remaining quantity.
      if (heldBeforeOpen) {
        fundingCredited = Math.min(q, heldBeforeOpen) / heldBeforeOpen * funding;
        fundingPnl += fundingCredited; venue += fundingCredited;
        if (bar.fundingRate < 0) negativeFundingHoursHeld++;
      }
      const adverseE = venueEquity(bar.perp.high) - Math.max(0, fundingCredited);
      checkEquity(adverseE, bar.end);
      const adverseH = H(q, bar.perp.high, adverseE);
      minIntrabarHeadroom = Math.min(minIntrabarHeadroom ?? Infinity, adverseH);
      const breach = adverseE <= maintenanceMargin(q * bar.perp.high);
      if (breach) maintenanceProxyBreachHours++;
      survived[i] = !breach;
      maxUnmatchedExposureUsd = Math.max(maxUnmatchedExposureUsd, Math.abs(q * (bar.spot.close - bar.perp.close)));
      const closeE = venueEquity(bar.perp.close), h = H(q, bar.perp.close, closeE), n = q * bar.perp.close;
      checkEquity(closeE, bar.end);
      minHeadroom = Math.min(minHeadroom ?? Infinity, h);
      if (h < 0.1 * n || adverseH < 0) signal = 'unwind';
      else if (!pending && h < rule.lower * n) signal = 'low';
      else if (!pending && h > rule.upper * n && capacity(bar.spot.close, bar.perp.close) > 0) signal = 'high';
      if (signal) proposals.push({ time: bar.end, types: [signal === 'unwind' ? 'full-unwind' : `rebalance-${signal}`] });
    } else survived[i] = false;
    if (bar.end === end) { terminalQuantity = q; close(end, bar.spot.close, bar.perp.close, 'fixed-horizon-close'); }
    mark(bar.end, bar.spot.close, bar.perp.close);
  }
  const largestSurvivedMoves = survivedMoves(bars, window, survived);
  const netPnlUsd = spotPnl + perpPnl + fundingPnl - totalCosts();
  return { config, initialCapitalUsd: initialCapital, spotCapitalUsd: config.shortUsd, marginCapitalUsd: config.marginUsd,
    operatingCapitalUsd: config.operatingUsd, netPnlUsd, netReturnPct: netPnlUsd / initialCapital * 100,
    simpleAnnualizedNetReturnPct: netPnlUsd / initialCapital * 100 * 8760 / window.length,
    hedgedEnvelopeReturnPct: netPnlUsd / initialCapital * 100, timeInMarketPct: heldHours / window.length * 100, windowHours: window.length,
    spotPnlUsd: spotPnl, perpPnlUsd: perpPnl, fundingPnlUsd: fundingPnl, costs, totalCostsUsd: totalCosts(), fixedCostsUsd: costs.fixed + costs.signing,
    negativeFundingHoursHeld, heldHours, maxDrawdownUsd, maxDrawdownPct, minStressHeadroomUsd: minHeadroom,
    minIntrabarStressHeadroomUsd: minIntrabarHeadroom, maintenanceProxyBreachHours, maxUnmatchedExposureUsd,
    operatingBudgetExceeded: operating < 0, endingVenueCashUsd: venue, minMarkedVenueEquityUsd: minVenue,
    entries, entryAttempts: 1, blockedEntryAttempts: entries ? 0 : 1, entryBlockCounts, entryBlockDetails,
    rebalances, rebalanceCostsUsd, initialQuantity, terminalQuantity, finalQuantity: q,
    pendingTransferUsd: pending?.amount ?? 0, netMarginTransfersUsd, largestSurvivedMoves, events, proposals, equityCurve };
}

export function survivedMoves(bars: MarketHour[], window: MarketHour[], survived: boolean[]) {
  const byEnd = new Map(bars.map(b => [b.end, b]));
  return [1, 24].flatMap(hours => {
    let best: { hours: number; start: number; end: number; perpMovePct: number; spotMovePct: number } | undefined;
    for (let i = hours - 1; i < window.length; i++) {
      if (!survived.slice(i - hours + 1, i + 1).every(Boolean)) continue;
      const first = window[i - hours + 1]!, last = window[i]!;
      const before = byEnd.get(first.start);
      if (!before || first.start < window[0]!.start) continue;
      const perpMovePct = (last.perp.close / before.perp.close - 1) * 100;
      if (perpMovePct > 0 && (!best || perpMovePct > best.perpMovePct)) best = { hours, start: first.start, end: last.end, perpMovePct,
        spotMovePct: (last.spot.close / before.spot.close - 1) * 100 };
    }
    return best ? [best] : [];
  });
}
