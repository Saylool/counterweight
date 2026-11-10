import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { buildReport } from '../apps/keeper/src/report.js';

type Report = ReturnType<typeof buildReport>;
const report = JSON.parse(readFileSync(new URL('../reports/replay-report.json', import.meta.url), 'utf8')) as Report;
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const section = (name: string) => {
  const match = readme.match(new RegExp(`<!-- ${name}:start -->\\n([\\s\\S]*?)\\n<!-- ${name}:end -->`));
  expect(match, `README must retain the checked ${name} block`).not.toBeNull();
  return match![1]!;
};
const money = (n: number) => n.toFixed(2);
const integer = (n: number) => String(n);

describe('judge README numeric claims against replay-report.json', () => {
  it('checks every results cell, including capital, returns, stress headroom and breaches', () => {
    const rows = section('replay-table').split('\n').filter(line => line.startsWith('|')).slice(2);
    // Require the advertised three sizes and both economically distinct comparators.
    const expected = [
      ['full', 'hedged-rebalance', 'demo'], ['full', 'hedged-rebalance', 'illustrative'],
      ['full', 'hedged-rebalance', 'large'], ['full', 'always-hedged', 'illustrative'],
      ['full', 'spot-holder', 'illustrative'], ['holdout', 'hedged-rebalance', 'demo'],
      ['holdout', 'hedged-rebalance', 'illustrative'], ['holdout', 'hedged-rebalance', 'large'],
    ];
    expect(rows).toHaveLength(expected.length);
    for (const [i, [period, policy, label]] of expected.entries()) {
      const source = report.comparisons.filter(r => r.period === period && r.policy === policy && r.label === label);
      expect(source).toHaveLength(1);
      const r = source[0]!;
      expect(rows[i]!.split('|').slice(1, -1).map(s => s.trim())).toEqual([
        period, policy, integer(r.spotCapitalUsd), integer(r.initialCapitalUsd),
        money(r.fundingPnlUsd), money(r.totalCostsUsd), money(r.netPnlUsd), money(r.netReturnPct),
        r.minIntrabarStressHeadroomUsd === null ? 'n/a' : money(r.minIntrabarStressHeadroomUsd),
        policy === 'spot-holder' ? 'n/a' : integer(r.maintenanceProxyBreachHours),
      ]);
    }
  });
  it('checks dates, hours, gaps, funding and selected rule against their exact report fields', () => {
    expect(report.rebalanceSelection).not.toBeNull();
    const p = report.provenance, rule = report.rebalanceSelection!.rule;
    expect(readme).toContain(`Offline replay: ${report.status}; ${p.completeHours} hours, ${p.gaps.length} gaps`);
    const training = report.comparisons.find(r => r.period === 'training' && r.policy === 'hedged-rebalance' && r.label === 'illustrative')!;
    const holdout = report.comparisons.find(r => r.period === 'holdout' && r.policy === 'hedged-rebalance' && r.label === 'illustrative')!;
    expect(section('replay-facts')).toBe([
      `Recorded window: **${p.windowStartUtc} to ${p.windowEndExclusiveUtc} (exclusive)**; **${p.completeHours} complete hours**, **${p.warmupHours} warm-up hours**, **${p.gaps.length} gaps**. Negative-funding hours: **${p.negativeFundingHours}**. Summed hourly funding rates: **${p.cumulativeFundingRatePct.toFixed(6)}%**, not an all-capital return.`,
      '',
      `Selection uses the first **${training.windowHours} hours**; holdout uses the last **${holdout.windowHours} hours**. Frozen H/notional bands: **${rule.lower} / ${rule.target} / ${rule.upper}**; modeled route latency: **${rule.latencyHours} hour**. Selected training net: **$${training.netPnlUsd.toFixed(6)}**.`,
    ].join('\n'));
  });
  it('rejects additional untracked numeric replay prose outside the checked blocks', () => {
    const results = readme.split('## Historical results: simulated execution\n')[1]!.split('\n## NEAR technology')[0]!;
    const prose = results.replace(/<!-- replay-(facts|table):start -->[\s\S]*?<!-- replay-\1:end -->/g, '');
    expect(prose).not.toMatch(/\d/);
  });
});
