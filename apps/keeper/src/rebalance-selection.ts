import { HOUR_MS, RebalanceRuleSchema } from '@counterweight/domain';
import { simulate } from './replay.js';
import { ReplaySolvencyError } from './rebalance.js';
import { TRAINING_HOURS } from './carry-selection.js';
import type { MarketDataset } from './market.js';

export const REBALANCE_CANDIDATES = [
  { lower: 0.20, target: 0.50, upper: 0.80 },
  { lower: 0.30, target: 0.60, upper: 0.90 },
  { lower: 0.40, target: 0.70, upper: 1.00 },
] as const;
export function selectRebalanceRule(data: Pick<MarketDataset, 'bars' | 'start' | 'szDecimals'>) {
  const end = data.start + TRAINING_HOURS * HOUR_MS;
  const trainingBars = data.bars.filter(b => b.start >= data.start - 24 * HOUR_MS && b.end <= end);
  if (trainingBars.length !== TRAINING_HOURS + 24 || trainingBars.some((b, i) => b.start !== data.start - 24 * HOUR_MS + i * HOUR_MS))
    throw new Error('Selection requires contiguous training and 24 warm-up hours');
  const scores = REBALANCE_CANDIDATES.map((candidate, index) => {
    try {
      const run = simulate(trainingBars, data.start, end, { shortUsd: 2500, marginUsd: 3000, operatingUsd: 200,
        szDecimals: data.szDecimals, policy: 'hedged-rebalance', rebalanceRule: candidate });
      return { index, ...candidate, feasible: run.maintenanceProxyBreachHours === 0 && (run.minMarkedVenueEquityUsd ?? 0) > 0,
        netPnlUsd: run.netPnlUsd, netReturnPct: run.netReturnPct, heldHours: run.heldHours, rebalances: run.rebalances,
        rebalanceCostsUsd: run.rebalanceCostsUsd, totalCostsUsd: run.totalCostsUsd, maintenanceProxyBreachHours: run.maintenanceProxyBreachHours };
    } catch (error) {
      if (!(error instanceof ReplaySolvencyError)) throw error;
      return { index, ...candidate, feasible: false, netPnlUsd: null, netReturnPct: null, heldHours: null,
        rebalances: null, rebalanceCostsUsd: null, totalCostsUsd: null, maintenanceProxyBreachHours: null };
    }
  });
  const winner = scores.filter(s => s.feasible).sort((a, b) => b.netReturnPct! - a.netReturnPct! || a.index - b.index)[0];
  if (!winner) throw new Error('No solvent training rebalance candidate');
  return { trainingStart: data.start, trainingEndExclusive: end,
    objective: 'maximum solvent training net return on ALL $5,700 capital at $2,500 spot; ties choose grid order', scores,
    rule: RebalanceRuleSchema.parse(REBALANCE_CANDIDATES[winner.index]) };
}
