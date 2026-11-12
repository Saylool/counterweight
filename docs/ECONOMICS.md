# Economics sensitivity

Intended customer: a NEAR treasury or substantial wNEAR holder seeking to reduce dollar drawdowns, willing to sell inventory to replenish margin and to coordinate owner approvals. This is a supervised prototype, not a coin-count-preservation or passive-income product. Customer demand and revenue are unproved.

Computed offline with the existing replay engine and verified fixtures: **4320 hours**, 2026-05-12T00:00:00.000Z through 2026-11-08T00:00:00.000Z (exclusive). Frozen illustrative allocation: $2500.00 spot + $3000.00 margin + $200.00 operating = **$5700.00**. The saved training-selected rule is held fixed; no retuning. Fresh baseline PnL/costs/capital/hours/rebalances must equal the saved report before output is written.

| Scenario | Signing + routing costs | All engine costs | Owner labor | Net after labor | All-capital return | Net minus assumed cash |
|---|---:|---:|---:|---:|---:|---:|
| Baseline | $26.53 | $43.17 | $0.00 | $67.28 | 1.18% | $-45.15 |
| Slippage ×2 | $26.53 | $50.50 | $0.00 | $59.89 | 1.05% | $-52.55 |
| Signing + routing rates ×2 | $53.05 | $69.69 | $0.00 | $40.66 | 0.71% | $-71.78 |
| Owner operations | $26.53 | $43.17 | $60.00 | $7.28 | 0.13% | $-105.15 |
| Both rate shocks + owner operations | $53.04 | $77.02 | $60.00 | $-26.74 | -0.47% | $-139.18 |

Cash sensitivity on the same $5700.00 for the same window: at 0% annual, $0.00 / 0.00%; at an **assumed** 4.00% simple annual rate, $112.44 / 1.97%. Formula: capital × annual rate × 4320/8760. This is an opportunity-cost input, not a current yield quote or available risk-free investment. No cash fees, taxes or compounding.

Baseline slippage is 5 bps per leg; ×2 uses 10 bps. The signing/routing shock doubles $0.02 per action and the 0.2500% route + 0.0001% protocol rates; perp trading fees stay fixed. Engine reruns include changed costs, inventory, margin and trade decisions. Signing/routing is a subset of all engine costs. These rates are model assumptions, not measured quotes.

Owner labor assumes 10 minutes at $30.00/hour per entry, paired rebalance or close. Baseline has 12 such episodes; charged labor is $60.00. These are assumed work episodes derived from engine events, not actual transaction counts. Labor is an external expense subtracted after replay; staffing delays and collateral feedback are not modeled. All-capital returns retain the same denominator.

Reproduce: `npm run economics`. [Machine-readable inputs/results](../reports/economics-sensitivity.json); [baseline replay](../reports/replay-report.json); [engine](../apps/keeper/src/replay.ts), [cost assumptions](../apps/keeper/src/costs.ts). The command changes only its own process's cost object, restores it after every run, and writes this document plus its separate JSON; it does not modify the keeper or original replay reports. Hourly data, assumed liquidity/owner timing, venue/route/default risks and retrospective selection remain material limits. See [replay protocol](REPLAY-PROTOCOL.md).
