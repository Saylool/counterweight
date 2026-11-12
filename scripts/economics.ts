import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadMarket } from '../apps/keeper/src/market.js';
import { simulate, COSTS, type ReplayConfig } from '../apps/keeper/src/replay.js';

// This command runs in its own process. Cost overrides never change source files,
// saved replay reports, or the separate live keeper process.
const root = fileURLToPath(new URL('../', import.meta.url));
const saved = JSON.parse(await readFile(root + 'reports/replay-report.json', 'utf8'));
const reference = saved.comparisons.find((r: { period: string; policy: string; label: string }) =>
  r.period === 'full' && r.policy === 'hedged-rebalance' && r.label === 'illustrative');
assert(reference, 'Missing full illustrative reference');
const data = await loadMarket(root + 'fixtures/market/');
assert.equal(data.gaps.length, 0);
assert.equal(data.manifestSha256, saved.provenance.manifestSha256);
const config: ReplayConfig = reference.config;
const originalCosts = { ...COSTS };
const replay = (slippageMultiplier = 1, signingRoutingMultiplier = 1) => {
  try {
    Object.assign(COSTS, {
      perpSlippage: originalCosts.perpSlippage * slippageMultiplier,
      spotSlippage: originalCosts.spotSlippage * slippageMultiplier,
      signingPerActionUsd: originalCosts.signingPerActionUsd * signingRoutingMultiplier,
      route: originalCosts.route * signingRoutingMultiplier,
      protocol: originalCosts.protocol * signingRoutingMultiplier,
    });
    return simulate(data.bars, data.start, data.end, config);
  } finally { Object.assign(COSTS, originalCosts); }
};
const baseline = replay();
for (const key of ['netPnlUsd', 'totalCostsUsd', 'initialCapitalUsd', 'heldHours', 'rebalances'] as const)
  assert.equal(baseline[key], reference[key], `Fresh baseline differs: ${key}`);
const hours = (data.end - data.start) / 3_600_000;
const cashAnnualRate = 0.04; // Hypothetical sensitivity input, not a quoted available product.
const cashPnl = baseline.initialCapitalUsd * cashAnnualRate * hours / 8760;
const ownerMinutesPerEpisode = 10, ownerHourlyUsd = 30;
const rows = [
  { name: 'Baseline', slip: 1, routing: 1, owner: false },
  { name: 'Slippage ×2', slip: 2, routing: 1, owner: false },
  { name: 'Signing + routing rates ×2', slip: 1, routing: 2, owner: false },
  { name: 'Owner operations', slip: 1, routing: 1, owner: true },
  { name: 'Both rate shocks + owner operations', slip: 2, routing: 2, owner: true },
].map(scenario => {
  const run = scenario.name === 'Baseline' ? baseline : replay(scenario.slip, scenario.routing);
  // One assumed owner work episode per initial entry, paired rebalance, and terminal/emergency close.
  // This external labor expense is charged after replay, not deducted from venue collateral.
  const ownerEpisodes = run.events.filter(e => ['open', 'rebalance-reduce', 'close'].includes(e.type)).length;
  const ownerOpsUsd = scenario.owner ? ownerEpisodes * ownerMinutesPerEpisode / 60 * ownerHourlyUsd : 0;
  const netAfterOwnerUsd = run.netPnlUsd - ownerOpsUsd;
  return { ...scenario, initialCapitalUsd: run.initialCapitalUsd, windowHours: run.windowHours,
    engineNetPnlUsd: run.netPnlUsd, engineCostsUsd: run.totalCostsUsd,
    signingRoutingCostsUsd: run.costs.signing + run.costs.spotRouteFees + run.costs.marginRouteFees,
    ownerEpisodes, ownerOpsUsd, netAfterOwnerUsd, netReturnPct: netAfterOwnerUsd / run.initialCapitalUsd * 100,
    excessOverCashUsd: netAfterOwnerUsd - cashPnl, rebalances: run.rebalances,
    operatingBudgetExceeded: run.operatingBudgetExceeded };
});
assert.deepEqual(COSTS, originalCosts, 'Cost overrides must be restored');
const report = { generatedAt: new Date().toISOString(), fixtureManifestSha256: data.manifestSha256,
  start: new Date(data.start).toISOString(), endExclusive: new Date(data.end).toISOString(),
  config, baselineCosts: originalCosts, ownerMinutesPerEpisode, ownerHourlyUsd,
  ownerCostTreatment: 'external expense after replay; no collateral or trade-decision feedback',
  cash: { capitalUsd: baseline.initialCapitalUsd, annualRateAssumption: cashAnnualRate,
    hours, pnlUsd: cashPnl, netReturnPct: cashPnl / baseline.initialCapitalUsd * 100,
    zeroRatePnlUsd: 0, zeroRateReturnPct: 0 }, rows };
const money = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number) => `${n.toFixed(2)}%`;
const table = ['| Scenario | Signing + routing costs | All engine costs | Owner labor | Net after labor | All-capital return | Net minus assumed cash |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...rows.map(r => `| ${r.name} | ${money(r.signingRoutingCostsUsd)} | ${money(r.engineCostsUsd)} | ${money(r.ownerOpsUsd)} | ${money(r.netAfterOwnerUsd)} | ${pct(r.netReturnPct)} | ${money(r.excessOverCashUsd)} |`)].join('\n');
const text = `# Economics sensitivity\n\nIntended customer: a NEAR treasury or substantial wNEAR holder seeking to reduce dollar drawdowns, willing to sell inventory to replenish margin and to coordinate owner approvals. This is a supervised prototype, not a coin-count-preservation or passive-income product. Customer demand and revenue are unproved.\n\n`
  + `Computed offline with the existing replay engine and verified fixtures: **${hours} hours**, ${report.start} through ${report.endExclusive} (exclusive). Frozen illustrative allocation: ${money(config.shortUsd)} spot + ${money(config.marginUsd)} margin + ${money(config.operatingUsd)} operating = **${money(baseline.initialCapitalUsd)}**. The saved training-selected rule is held fixed; no retuning. Fresh baseline PnL/costs/capital/hours/rebalances must equal the saved report before output is written.\n\n`
  + table + '\n\n'
  + `Cash sensitivity on the same ${money(baseline.initialCapitalUsd)} for the same window: at 0% annual, ${money(0)} / ${pct(0)}; at an **assumed** ${pct(cashAnnualRate * 100)} simple annual rate, ${money(cashPnl)} / ${pct(report.cash.netReturnPct)}. Formula: capital × annual rate × ${hours}/8760. This is an opportunity-cost input, not a current yield quote or available risk-free investment. No cash fees, taxes or compounding.\n\n`
  + `Baseline slippage is ${originalCosts.perpSlippage * 10000} bps per leg; ×2 uses ${originalCosts.perpSlippage * 20000} bps. The signing/routing shock doubles ${money(originalCosts.signingPerActionUsd)} per action and the ${(originalCosts.route * 100).toFixed(4)}% route + ${(originalCosts.protocol * 100).toFixed(4)}% protocol rates; perp trading fees stay fixed. Engine reruns include changed costs, inventory, margin and trade decisions. Signing/routing is a subset of all engine costs. These rates are model assumptions, not measured quotes.\n\n`
  + `Owner labor assumes ${ownerMinutesPerEpisode} minutes at ${money(ownerHourlyUsd)}/hour per entry, paired rebalance or close. Baseline has ${rows[0]!.ownerEpisodes} such episodes; charged labor is ${money(rows[3]!.ownerOpsUsd)}. These are assumed work episodes derived from engine events, not actual transaction counts. Labor is an external expense subtracted after replay; staffing delays and collateral feedback are not modeled. All-capital returns retain the same denominator.\n\n`
  + `Reproduce: \`npm run economics\`. [Machine-readable inputs/results](../reports/economics-sensitivity.json); [baseline replay](../reports/replay-report.json); [engine](../apps/keeper/src/replay.ts), [cost assumptions](../apps/keeper/src/costs.ts). The command changes only its own process's cost object, restores it after every run, and writes this document plus its separate JSON; it does not modify the keeper or original replay reports. Hourly data, assumed liquidity/owner timing, venue/route/default risks and retrospective selection remain material limits. See [replay protocol](REPLAY-PROTOCOL.md).\n`;
await writeFile(root + 'reports/economics-sensitivity.json', JSON.stringify(report, null, 2) + '\n');
await writeFile(root + 'docs/ECONOMICS.md', text);
console.log(table);
console.log(`Same-capital assumed cash: ${money(cashPnl)}; wrote docs/ECONOMICS.md and reports/economics-sensitivity.json`);
