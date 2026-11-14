# Economics sensitivity

Intended customer: a NEAR treasury or substantial wNEAR holder seeking to reduce dollar drawdowns, willing to sell inventory to replenish margin and to coordinate owner approvals. This is a supervised prototype, not a coin-count-preservation or passive-income product. Customer demand and revenue are unproved.

<!-- mainnet-costs:start -->
## Executed mainnet costs — 14 November 2026

The [single owner-supervised v4 mainnet lifecycle](evidence/2026-11-14-v4-mainnet-lifecycle-summary.md) is measured separately from the replay below. A 3.6 NEAR short opened at 3.3241 and closed at 3.3248; 20 USDC had been moved to perps.

| Item | USDC / NEAR | Treatment |
|---|---:|---|
| Open + close trading fees | about 0.011 USDC | Real venue cost; exact fill fees in summary |
| Realized trading loss | about 0.0025 USDC | `(3.3248 − 3.3241) × 3.6 = 0.00252`; excludes fees |
| withdraw3 gross | 18.886709 USDC | Withdrawal amount, not a cost |
| Bridge fee | 1 USDC | Gross minus destination payout |
| Native USDC destination payout | 17.886709 USDC | Arrived on Arbitrum One; summary states RPC verification limits |
| Inbound funding send fee | 1 USDC | Separate setup/funding ledger charge; additional to withdrawal bridge fee |
| Venue spot residual | 1 USDC | Retained venue capital, separate from perps residual |
| Perps residual | 1.1 USDC | Retained by policy, not a fee or realized loss |
| Native policy balance retained | about 7 NEAR | Capital in a keyless immutable account, including storage/operating reserves; not a measured burned fee |
| Keeper funding | 0.7 NEAR | Liquidity allocation, not final gas cost; a 285–300 Tgas call needs about 0.3 NEAR prepaid |
| Spot backing | 3.6 wNEAR | Returned to owner; directional exposure during custody was separate from the perp PnL |

Approximate fees plus realized trading loss are **0.0133 USDC**, before the **1 USDC bridge fee**. Residual USDC and retained NEAR are capital, not trading costs. The inbound send ledger adds a separate **1 USDC funding fee**, making the identified trading, funding-send and withdrawal-fee total approximately **2.0133 USDC**. Every NEAR burned fee, other setup costs and owner labor are not fully reconstructed here; no all-in profit or yield claim follows from this smoke test. The prepaid-gas requirement is refundable liquidity and must not be booked as the burned fee. Three pre-open tooling stops and a public-RPC delay also consumed owner time; [incidents](MAINNET.md#executed-run).

<!-- mainnet-costs:end -->

## Historical replay sensitivity

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
