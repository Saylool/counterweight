import { HOUR_MS, CarryRuleSchema } from '@counterweight/domain';
import { simulate } from './replay.js';
import type { MarketDataset } from './market.js';

export const TRAINING_HOURS = 2160;
export const CONFIRMATION_CANDIDATES = [6, 12, 24] as const;
export const REPLAY_SIZES = [
  { label: 'demo', shortUsd: 25, marginUsd: 30, operatingUsd: 20 },
  { label: 'illustrative', shortUsd: 2500, marginUsd: 3000, operatingUsd: 200 },
  { label: 'large', shortUsd: 25000, marginUsd: 30000, operatingUsd: 2000 },
] as const;

/** Receives no holdout prices, rates or PnL. Never add candidates based on holdout results. */
export function selectCarryRule(data: Pick<MarketDataset, 'bars' | 'start' | 'szDecimals'>) {
  const end = data.start + TRAINING_HOURS * HOUR_MS;
  const trainingBars = data.bars.filter(b => b.end <= end);
  const scores = CONFIRMATION_CANDIDATES.map(positiveHours => {
    const run = simulate(trainingBars, data.start, end, { shortUsd: 2500, marginUsd: 3000, operatingUsd: 200,
      szDecimals: data.szDecimals, policy: 'reentry', carryRule: { positiveHours } });
    return { positiveHours, netPnlUsd: run.netPnlUsd, netReturnPct: run.netReturnPct,
      entries: run.entries, heldHours: run.heldHours, totalCostsUsd: run.totalCostsUsd };
  });
  const winner = [...scores].sort((a, b) => b.netReturnPct - a.netReturnPct || a.positiveHours - b.positiveHours)[0]!;
  return { trainingStart: data.start, trainingEndExclusive: end,
    objective: 'maximum training net return on ALL capital at $2,500; ties choose smaller N',
    scores, rule: CarryRuleSchema.parse({ positiveHours: winner.positiveHours }) };
}
