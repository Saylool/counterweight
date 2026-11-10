import assert from 'node:assert/strict';
import { HOUR_MS, evaluateRisk } from '@counterweight/domain';
import { BASE } from '@counterweight/local-sandbox';
import type { MarketDataset } from './market.js';
import { selectWorstMoves } from './replay.js';

export function prepareLocalReplay(data: MarketDataset) {
  assert.equal(data.gaps.length, 0, 'Refusing a gapped market fixture');
  const selection = selectWorstMoves(data).find(s => s.hours === 24)!;
  const anchor = data.bars.find(b => b.end === selection.start)!;
  const bars = data.bars.filter(b => b.start >= selection.start && b.end <= selection.end);
  assert.equal(bars.length, 24);
  const lots = Math.floor(25 / anchor.perp.close * 10 ** data.szDecimals);
  const quantity = lots / 10 ** data.szDecimals;
  const quantityBase = (BigInt(lots) * BASE / 10n ** BigInt(data.szDecimals)).toString();
  return { selection, anchor, bars, quantity, quantityBase, initialMargin: 30 };
}
export type ReplayPlan = ReturnType<typeof prepareLocalReplay>;
export function replayRisk(data: MarketDataset, plan: ReplayPlan, hourIndex: number, quantity: number, cash: number) {
  const bar = plan.bars[hourIndex]!;
  const venueEquity = cash + quantity * (plan.anchor.perp.close - bar.perp.close);
  const risk = evaluateRisk({ intent: 'monitor', shortNotional: quantity * bar.perp.close, venueEquity, shortQuantityNear: quantity, referencePriceUsd: bar.perp.close,
    now: bar.end, observedAt: bar.end, maxDataAgeMs: HOUR_MS, unresolvedOrders: 0, reconciled: true,
    depth: { availableNotional: quantity * bar.perp.close, impactBps: 5 },
    funding: data.bars.filter(b => b.end <= bar.end && b.end > bar.end - 24 * HOUR_MS).map(b => ({ time: b.end, rate: b.fundingRate })),
    state: { entryHalted: false }, adl: false, unexpectedReductionQuantity: 0,
  });
  return { venueEquity, risk };
}
