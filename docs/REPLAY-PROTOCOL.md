# Replay procedure declared before candidate evaluation

The frozen fixture is already observed, so this is a chronological holdout evaluation,
not a claim of a prospective or untouched experiment. Do not change the following
candidate set, objective, cost model or sizing after seeing holdout results.

- Split the 180-day window into the first 2,160 hours (90 days, training) and last
  2,160 hours (90 days, holdout). Use only training bars plus the 24 pre-window
  observations to select parameters. The selection function must reject missing
  training observations and pass a physically truncated array to the simulator.
- Candidates differ ONLY in positive-settlement confirmation: N = 6, 12, 24 hours.
  Select the greatest net return on ALL capital for the $2,500 training run, with
  the entire cost model included. Exact ties prefer the smaller N. Publish all
  candidate scores, freeze the winner, then evaluate all sizes and periods. Do not
  optimize sizes, hold duration, cooldown, exit thresholds or costs.
- For initial entry AND every re-entry: N consecutive strictly positive completed
  hourly funding observations, complete and strictly positive trailing 24-hour
  sum, and the existing data, reconciliation, depth, leverage and minimum-order
  gates. After any exit wait at least 24 flat hours. Enter only with stress
  headroom at least 20% of notional. Emergency stress exit remains below 10%.
- Cap equal-coin paired entries at the smaller of the target short budget,
  remaining spot cash and 90% of available venue cash AFTER opening perp costs.
  Solve this last cap as 0.9 * venueCash / (1 + 0.9 * entryPerpCostRate).
  No external top-ups or transfers of spot gains into margin; unused cash earns
  zero. This repairs the original permanently oversized re-entry attempt while
  retaining the separate account constraint.
- Funding exit: hold at least 72 hours, then require BOTH six consecutive negative
  completed settlements AND a strictly negative trailing 24-hour sum. Stress
  exits override the minimum hold. The fixed horizon overrides minimum hold and
  cooldown. No same-open exit/re-entry. Entry observations precede the open;
  close-time proposals execute at the next open. Entry-hour funding is excluded.
- Full-window, training and holdout runs start independently with fresh specified
  capital and each pay their own entry, exit and fixed costs. They are not additive.
  Holdout uses the preceding 24 known observations only as signal warm-up; no
  position, cash PnL, or optimizer state carries from training. The full-window
  result uses the frozen winner even in its training portion and is descriptive.
- Comparators: original policy unchanged; always hedged opens at the first open
  and closes at the last close with all gates/exits disabled; unhedged holder buys
  spot at the first open and sells at the last close. Same applicable fee/slippage
  rates, fixed overhead and rounding. Spot-only commits spot + operating capital,
  no margin capital or margin route/perp fees. Also disclose its return using the
  hedged capital envelope, keeping the extra margin as idle cash.
- Always hedged is pure carry ACCOUNTING, not a solvency claim: retain the original
  1.2x margin budget and explicitly report maintenance-proxy breaches, negative
  venue cash and minimum stress headroom. Do not credit hypothetical top-ups or
  simulate liquidation fills that the data cannot establish.
- Sizes: $25/$30/$20, $2,500/$3,000/$200, $25,000/$30,000/$2,000
  (spot target / venue margin / operating budget). Returns include every committed
  dollar. Simple annualization = net return * 8,760 / window hours, no compounding.
  Drawdown is marked total-account equity at hourly opens and closes, includes
  costs, starts at initial capital, and is not an intrabar liquidation estimate.
  Stress uses the existing close and adverse perp-high proxies; spot-only has no
  venue stress headroom (n/a) and no negative-funding settlements.

Regression tests must pin every numeric comparison field, all candidate scores and
selection, and exact generated markdown/JSON, plus causal synthetic checks for
confirmation, cooldown, minimum holding, emergency override and future perturbation.
No network, wallet or key access is permitted in replay or selection.
