# Counterweight recorded market replay

A NEAR holder gives up NEAR price upside (and avoids the matching downside) while hedged, receiving only carry net of costs and residual basis PnL. Adding an equal-coin short removes the common spot price move from combined PnL while both legs are held, while keeping basis, venue and collateral risks. The hedge receives positive funding and pays negative funding, trading/routing fees and overhead; net carry depends on those costs and time held. The spot-only baseline retains NEAR price gains and drawdowns. In this window, the always-held hedge outgrew its separate margin account: its pure-carry accounting is not an executable return. At the $2,500 target, the rebalance policy received $114.59 funding, paid $43.17 costs, and netted $67.28 including basis PnL. Higher participation does not guarantee a profit. These are historical simulations with no promised yield.

Status: **complete**. Recorded MAINNET market data; simulated supervised execution, no funds.

Window: 2026-05-12T00:00:00.000Z through 2026-11-08T00:00:00.000Z (exclusive). Captured 2026-11-09T20:29:36.612Z.
SHA-256 of manifest.json: `0bece3400021060f20f8e3b4db3e8cdf9287a8d649e7b03029556f55025719cb`. Run `npm run replay` offline to regenerate both reports.

Data: 4320/4320 complete replay hours; 24 warm-up hours; 0 missing series-hours.
Whole-window negative-funding hours: **163**; nonpositive-funding hours: 163. Summed hourly funding rates: **6.387413%** (not a fixed-dollar or all-capital return).

## Full-window comparison

|Policy|Spot / capital $|Hedged h|Rebal / cost $|Funding $|All costs $|Net $|Return / annual %|DD $ / %|Min H $|Breach h|NEAR start → end|Survived 1h / 24h %|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance|25 / 75|1|0 / 0.00|0.00|6.35|-6.34|-8.46 / -17.15|6.34 / 8.46|4.71|0|16.1 → 0.0|n/a|
|hedged-rebalance|2500 / 5700|4320|10 / 14.06|114.59|43.17|67.28|1.18 / 2.39|31.85 / 0.56|213.09|0|1616.0 → 383.0|8.63 / 32.50|
|hedged-rebalance|25000 / 57000|4320|10 / 135.19|1145.96|371.57|733.04|1.29 / 2.61|263.65 / 0.46|2122.81|0|16160.3 → 3830.8|8.63 / 32.50|
|always-hedged|25 / 75|4320|0 / 0.00|2.87|6.49|-3.69|-4.92 / -9.98|6.30 / 8.39|-137.41|1222|16.1 → 16.1|7.14 / 32.31|
|always-hedged|2500 / 5700|4320|0 / 0.00|288.51|47.29|233.63|4.10 / 8.31|43.74 / 0.73|-13793.17|1222|1616.0 → 1616.0|7.14 / 32.31|
|always-hedged|25000 / 57000|4320|0 / 0.00|2885.15|418.18|2391.02|4.19 / 8.51|437.41 / 0.73|-137933.94|1222|16160.3 → 16160.3|7.14 / 32.31|
|spot-holder|25 / 45|0|0 / 0.00|0.00|6.30|28.87|64.15 / 130.08|36.57 / 38.47|n/a|0|16.1 → 16.1|n/a|
|spot-holder|2500 / 2700|0|0 / 0.00|0.00|31.64|3497.71|129.54 / 262.69|3670.58 / 47.63|n/a|0|1616.0 → 1616.0|n/a|
|spot-holder|25000 / 27000|0|0 / 0.00|0.00|262.01|35032.09|129.75 / 263.10|36706.51 / 47.58|n/a|0|16160.3 → 16160.3|n/a|

USD throughout. Min H uses the adverse hourly perp-high proxy, excluding same-hour positive funding. Hedged hours are zero for spot-only (its spot is held throughout). NEAR end is immediately before scheduled liquidation; all final positions are zero. Theoretical always-hedged has 1,222 maintenance-breach hours and negative venue equity: its carry is not executable. Survived moves are rolling positive perp close returns only over continuously held, maintenance-safe hours; independent spot moves and timestamps are in JSON. No observed move is a guaranteed stress capacity.

Spot-only capital excludes uncommitted margin. Common-envelope returns (unused margin held idle) are in the detailed tables. Its price upside is the economic exposure the holder forgoes while hedged. Rebalancing progressively sells NEAR on rallies and retains excess margin after falls; it does not preserve the starting coin count.

## Frozen rebalance selection and OOS evaluation

Protocol: docs/REPLAY-PROTOCOL.md. Only first 90 days, 2026-05-12T00:00:00.000Z to 2026-08-10T00:00:00.000Z exclusive, select the rule. Objective: maximum solvent training net return on ALL $5,700 capital at $2,500 spot; ties choose grid order. This already-observed fixture is a retrospective chronological holdout.

|Lower / target / upper H/notional|Training net $|Return %|Hedged h|Rebalances|Rebalance costs $|All costs $|Feasible|
|---|---:|---:|---:|---:|---:|---:|---|
|0.2 / 0.5 / 0.8|7.463715|0.130942|2160|5|7.014562|35.428739|true|
|0.3 / 0.6 / 0.9|-0.208133|-0.003651|2160|6|7.978374|35.779707|true|
|0.4 / 0.7 / 1|0.082211|0.001442|2160|6|7.768015|35.545996|true|

Frozen lower / target / upper = **0.2 / 0.5 / 0.8**, latency **1 hour** after submission. Low side sizes the smallest integer lot restoring target including net arrival proceeds, with a 10% interim H floor. Withdrawals require zero reserved short, so reverse withdrawals and additions are disabled. H equals equity minus $0.10 reserve minus upper-band notional; band fractions use upper-band notional. Research caps scale with portfolio; these are not the deployment caps. Emergency H < 10% at close/open or adverse-high H < 0 overrides rebalancing. No external money or spot mark-to-market collateral credit.

The selection is not robust evidence of profitability: this retrospective selection uses only the training slice. No parameters are revised on OOS outcomes. Each period starts fresh with the same allocation and pays all setup/exit costs; results are not additive.

|Period / spot $|Hedged h|Rebalances / cost $|Funding $|All costs $|Net $|Return / simple annual %|DD $ / %|Min close / high H $|Breach h|Min venue $|NEAR start → end|Survived 1h / 24h %|Transit at end $|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|training / 25|1|0 / 0.000000|0.000000|6.351388|-6.341728|-8.455638 / -34.292309|6.341728 / 8.455638|$4.963278 / $4.710862|0|$29.971509|16.1 → 0||0.000000|
|training / 2500|2160|5 / 7.014562|45.955233|35.428739|7.463715|0.130942 / 0.531044|31.854601 / 0.558853|$381.489339 / $259.572595|0|$2887.109519|1616 → 784.9|6.873410 / 32.306991|0.000000|
|training / 25000|2160|5 / 67.446557|459.577706|296.872679|132.067057|0.231697 / 0.939658|263.649108 / 0.462542|$3814.323030 / $2593.683271|0|$28869.882254|16160.3 → 7849.4|6.873410 / 32.306991|0.000000|
|holdout / 25|1|0 / 0.000000|0.000000|6.352964|-6.296804|-8.395738 / -34.049382|6.296804 / 8.395738|$4.202582 / $4.026988|0|$29.661162|15.6 → 0|0.893359|0.000000|
|holdout / 2500|2160|10 / 13.751216|78.497303|42.800273|35.819070|0.628405 / 2.548530|26.898530 / 0.471904|$329.454941 / $211.755569|0|$2893.727760|1562.1 → 380.4|8.629493 / 32.499065|0.000000|
|holdout / 25000|2160|10 / 132.110100|785.042859|367.888045|418.367043|0.733977 / 2.976686|214.085167 / 0.375588|$3292.048895 / $2107.785592|0|$28932.002407|15621 → 3804.5|8.629493 / 32.499065|0.000000|
|full / 25|1|0 / 0.000000|0.000000|6.351388|-6.341728|-8.455638 / -17.146154|6.341728 / 8.455638|$4.963278 / $4.710862|0|$29.971509|16.1 → 0||0.000000|
|full / 2500|4320|10 / 14.060141|114.586776|43.168034|67.284892|1.180437 / 2.393663|31.854601 / 0.558853|$340.260311 / $213.092367|0|$2887.109519|1616 → 383|8.629493 / 32.499065|0.000000|
|full / 25000|4320|10 / 135.193528|1145.960430|371.566086|733.042274|1.286039 / 2.607801|263.649108 / 0.462542|$3394.715628 / $2122.810364|0|$28869.882254|16160.3 → 3830.8|8.629493 / 32.499065|0.000000|

All rebalance sizes/periods have zero maintenance-proxy breaches and positive marked venue equity. Small allocations can unwind early when health or minimum adjustment gates cannot be restored. It stays flat thereafter. Fixed overhead dominates that size. Zero breaches are conditional on sampled hourly prices and assumed fills/latency; they are not proof against liquidation, failed routes, basis jumps or larger gaps.

Rebalance cost includes every actual adjustment: route/protocol fee and spot slippage on the conversion, perp taker fee/slippage, three signing actions ($0.06 total). Initial entry/terminal exit and setup are included in all costs but excluded from rebalance-only cost. No second route charge is added to the combined NEAR-sale-to-margin route.

## Re-entry procedure and frozen selection

The protocol was written in docs/REPLAY-PROTOCOL.md before evaluating the new candidates. This fixture had already been observed: this is a retrospective chronological holdout, not a prospective untouched experiment. No holdout scores feed selection. All sizes, costs, thresholds and the three-candidate search were declared before candidate evaluation.

Training: 2026-05-12T00:00:00.000Z to 2026-08-10T00:00:00.000Z exclusive (2,160 hours). Holdout: that boundary to 2026-11-08T00:00:00.000Z (2,160 hours). Selection objective: maximum training net return on ALL capital at $2,500; ties choose smaller N.

|Positive settlements N|Training net $|Training return on ALL capital %|Entries|Held hours|Costs $|
|---:|---:|---:|---:|---:|---:|
|6|-158.875349|-2.787287|10|1918|181.180049|
|12|-150.215757|-2.635364|9|1937|167.989270|
|24|-166.031026|-2.912825|11|1739|194.111595|

Frozen N = **12**. Initial entry and re-entry require N consecutive strictly positive completed settlements and positive complete trailing 24h funding. Minimum hold 72 hours; funding exit requires six consecutive negative settlements AND negative trailing 24h funding. Emergency stress exit bypasses minimum hold. Cooldown 24 flat hours after any exit; entry headroom at least 20% of notional versus exit below 10%. Re-entry caps leverage at 0.9 after opening perp costs and reduces quantity to fit remaining venue cash; no top-ups or transfers of spot gains. Existing safety/data/depth/minimum-order gates still apply. The horizon close overrides minimum hold.

The 6h and 12h training candidates differ by only about $0.023 at $2,500: selection is fragile, not evidence of an optimal rule. Full-window results use the frozen rule and are descriptive. Each 90-day run starts fresh, pays all fixed and round-trip costs, and uses the preceding 24 known hours for warm-up; it does not carry positions or training profits. Period results are not additive.

## Original low-exposure diagnosis

Re-entry was already enabled and retried while flat. Every original full-window strategy exit was a stress-headroom unwind, not the six-negative-hour funding exit. Rising NEAR realized losses on the short while the offsetting spot gains remained in the separate spot account. The original re-entry attempted the original target dollars against depleted venue cash, so the leverage limit of one blocked recovery. Gate counts overlap; they must not be added.

demo ($25): 30/4320 hours held (0.694444%), 7 entries, 4290 entry attempts, 4283 rejected. Ending venue cash $27.208496. Blocks: {"contract-caps-or-health":4283,"stress-failed":4271,"nonpositive-funding":41}.
Trade chronology: 2026-05-12T00:00:00.000Z open (previous-hour-entry-gate); 2026-05-12T19:00:00.000Z close (stress-headroom); 2026-05-12T20:00:00.000Z open (previous-hour-entry-gate); 2026-05-12T21:00:00.000Z close (stress-headroom); 2026-05-13T00:00:00.000Z open (previous-hour-entry-gate); 2026-05-13T01:00:00.000Z close (stress-headroom); 2026-05-13T20:00:00.000Z open (previous-hour-entry-gate); 2026-05-14T01:00:00.000Z close (stress-headroom); 2026-05-14T08:00:00.000Z open (previous-hour-entry-gate); 2026-05-14T09:00:00.000Z close (stress-headroom); 2026-05-26T01:00:00.000Z open (previous-hour-entry-gate); 2026-05-26T03:00:00.000Z close (stress-headroom); 2026-09-20T21:00:00.000Z open (previous-hour-entry-gate); 2026-09-20T22:00:00.000Z close (stress-headroom).
illustrative ($2500): 26/4320 hours held (0.601852%), 4 entries, 4294 entry attempts, 4290 rejected. Ending venue cash $2776.107189. Blocks: {"contract-caps-or-health":4290,"stress-failed":4270,"nonpositive-funding":41}.
Trade chronology: 2026-05-12T00:00:00.000Z open (previous-hour-entry-gate); 2026-05-12T19:00:00.000Z close (stress-headroom); 2026-05-12T20:00:00.000Z open (previous-hour-entry-gate); 2026-05-12T21:00:00.000Z close (stress-headroom); 2026-05-13T00:00:00.000Z open (previous-hour-entry-gate); 2026-05-13T01:00:00.000Z close (stress-headroom); 2026-05-13T20:00:00.000Z open (previous-hour-entry-gate); 2026-05-14T01:00:00.000Z close (stress-headroom).
large ($25000): 26/4320 hours held (0.601852%), 4 entries, 4294 entry attempts, 4290 rejected. Ending venue cash $27761.009107. Blocks: {"contract-caps-or-health":4290,"stress-failed":4270,"nonpositive-funding":41}.
Trade chronology: 2026-05-12T00:00:00.000Z open (previous-hour-entry-gate); 2026-05-12T19:00:00.000Z close (stress-headroom); 2026-05-12T20:00:00.000Z open (previous-hour-entry-gate); 2026-05-12T21:00:00.000Z close (stress-headroom); 2026-05-13T00:00:00.000Z open (previous-hour-entry-gate); 2026-05-13T01:00:00.000Z close (stress-headroom); 2026-05-13T20:00:00.000Z open (previous-hour-entry-gate); 2026-05-14T01:00:00.000Z close (stress-headroom).

There are zero stale-data, future-data or funding-incomplete rejections: all 24 pre-window warm-up observations exist, all 4,320 replay hours are complete, and replay explicitly assumes each observation is fresh (observedAt = now). That freshness assumption is not a live-data guarantee. Nonpositive trailing funding accounts for 41 rejected attempts per original size but does not explain the persistent leverage block. Exits execute at the next open; the first retry occurs one hour after an exit, so flat time also includes that execution scheduling delay.

## Legacy comparison interpretation

All currency columns are USD. Hours denominator is 4,320. Return denominator includes all committed capital; annual is SIMPLE annualization (return × 365/180), not a forecast. DD is maximum total-equity drawdown at hourly opens/closes, including fees; its percentage uses the running equity peak. Stress H is the close-time proxy; negative hours count paid negative settlements while short, excluding entry/exit-at-open settlements. Spot-only stress is n/a and negative-funding hours are zero because it has no short.

Time held does not mean the original dollar target stays invested: each re-entry can be smaller as venue collateral falls. The demo eventually stays flat because the fixed $0.10 fee reserve and 20% entry-headroom requirement block its proposed size; the engine does not relax those thresholds. Paired exits sell the spot as well as closing the short, so these active policies also move out of NEAR while flat. Higher participation has increased funding but has not covered the resulting turnover costs.

## Separate training and holdout results, with every cost line

The following tables include full-window results at higher precision. Fixed $6 per run consists of activation $1, storage/gas $1, withdrawal $1, infrastructure $3. Signing is $0.02 per leg action. Spot-only has no venue capital, perp fees/slippage, funding or margin route fees; the same applicable spot rates and all $6 overhead apply. Its all-capital return uses spot + operating allocation; the envelope-return column also reserves the hedged margin as idle cash for a common-capital comparison.

### training

|Policy / size|All capital $|Hours / % / entries|Funding $|Spot PnL $|Perp PnL $|Net $|Return %|Simple annual %|DD $ / %|Min close / intrabar H $|Negative hours|Envelope return %|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|75.000000|1 / 0.046296 / 1|0.000000|-0.112700|0.122360|-6.341728|-8.455638|-34.292309|6.341728 / 8.455638|$4.963278 / $4.710862|0|-8.455638|
|hedged-rebalance / 2500|5700.000000|2160 / 100.000000 / 1|45.955233|452.596360|-455.659140|7.463715|0.130942|0.531044|31.854601 / 0.558853|$381.489339 / $259.572595|86|0.130942|
|hedged-rebalance / 25000|57000.000000|2160 / 100.000000 / 1|459.577706|4526.372660|-4557.010630|132.067057|0.231697|0.939658|263.649108 / 0.462542|$3814.323030 / $2593.683271|86|0.231697|
|original / 25|75.000000|29 / 1.342593 / 6|0.006517|2.164500|-2.259330|-7.831966|-10.442622|-42.350632|7.831966 / 10.442622|$2.282984 / $1.656088|1|-10.442622|
|original / 2500|5700.000000|26 / 1.203704 / 4|0.661706|199.107100|-205.360210|-99.236821|-1.740997|-7.060709|99.236821 / 1.740997|$228.219171 / $200.259606|0|-1.740997|
|original / 25000|57000.000000|26 / 1.203704 / 4|6.617216|1991.122600|-2053.657430|-935.523433|-1.641269|-6.656258|935.523433 / 1.641269|$2281.554941 / $2002.976326|0|-1.641269|
|reentry / 25|75.000000|1944 / 90.000000 / 9|0.356172|1.925600|-1.952590|-7.967727|-10.623636|-43.084748|7.967727 / 10.623636|$0.091534 / $-0.031213|76|-10.623636|
|reentry / 2500|5700.000000|1937 / 89.675926 / 9|36.990582|91.974700|-111.191770|-150.215757|-2.635364|-10.687866|150.215757 / 2.635364|$13.578114 / $-13.579772|75|-2.635364|
|reentry / 25000|57000.000000|1937 / 89.675926 / 9|369.939737|919.357040|-1111.538930|-1441.751038|-2.529388|-10.258073|1441.751038 / 2.529388|$135.220397 / $-136.371263|75|-2.529388|
|always-hedged / 25|75.000000|2160 / 100.000000 / 1|0.869894|0.795340|-0.864570|-5.554387|-7.405849|-30.034834|6.296196 / 8.394928|$-43.927928 / $-45.008169|86|-7.405849|
|always-hedged / 2500|5700.000000|2160 / 100.000000 / 1|87.313564|79.830400|-86.779200|46.705132|0.819388|3.323075|37.977267 / 0.664914|$-4410.406164 / $-4518.832944|86|0.819388|
|always-hedged / 25000|57000.000000|2160 / 100.000000 / 1|873.151847|798.318820|-867.808110|521.782510|0.915408|3.712488|379.779717 / 0.664294|$-44104.537310 / $-45188.825243|86|0.915408|
|spot-holder / 25|45.000000|2160 / 100.000000 / 1|0.000000|0.795340|0.000000|-5.396537|-11.992304|-48.635455|23.731400 / 37.607073|n/a / n/a|0|-7.195382|
|spot-holder / 2500|2700.000000|2160 / 100.000000 / 1|0.000000|79.830400|0.000000|58.546117|2.168375|8.793964|2381.984000 / 46.565638|n/a / n/a|0|1.027125|
|spot-holder / 25000|27000.000000|2160 / 100.000000 / 1|0.000000|798.318820|0.000000|639.833161|2.369752|9.610663|23820.282200 / 46.516824|n/a / n/a|0|1.122514|

|Policy / size|Perp fees $|Perp slip $|Spot route $|Spot slip $|Margin route $|Fixed $|Signing $|Total costs $|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|0.022361|0.024846|0.124301|0.024850|0.075030|6.000000|0.080000|6.351388|
|hedged-rebalance / 2500|2.455003|2.727782|13.636703|2.726250|7.503000|6.000000|0.380000|35.428739|
|hedged-rebalance / 25000|24.550640|27.278489|136.370378|27.263170|75.030000|6.000000|0.380000|296.872679|
|original / 25|0.135397|0.150442|0.752371|0.150414|0.075030|6.000000|0.480000|7.743654|
|original / 2500|9.092040|10.102267|50.526792|10.101318|7.503000|6.000000|0.320000|93.645416|
|original / 25000|90.924006|101.026673|505.287956|101.017184|75.030000|6.000000|0.320000|879.605819|
|reentry / 25|0.171176|0.190196|0.950487|0.190021|0.075030|6.000000|0.720000|8.296910|
|reentry / 2500|17.529819|19.477577|97.305546|19.453328|7.503000|6.000000|0.720000|167.989270|
|reentry / 25000|175.309155|194.787950|973.116333|194.545448|75.030000|6.000000|0.720000|1619.508885|
|always-hedged / 25|0.022805|0.025339|0.126572|0.025304|0.075030|6.000000|0.080000|6.355051|
|always-hedged / 2500|2.289007|2.543342|12.704416|2.539867|7.503000|6.000000|0.080000|33.659632|
|always-hedged / 25000|22.890499|25.433888|127.046516|25.399144|75.030000|6.000000|0.080000|281.880047|
|spot-holder / 25|0.000000|0.000000|0.126572|0.025304|0.000000|6.000000|0.040000|6.191877|
|spot-holder / 2500|0.000000|0.000000|12.704416|2.539867|0.000000|6.000000|0.040000|21.284283|
|spot-holder / 25000|0.000000|0.000000|127.046516|25.399144|0.000000|6.000000|0.040000|158.485659|

|Policy / size|Maintenance-proxy breach hours|Min marked venue equity $|Ending venue cash $|Operating budget exceeded|
|---|---:|---:|---:|---|
|hedged-rebalance / 25|0|$29.971509|$30.075154|false|
|hedged-rebalance / 2500|0|$2887.109519|$4279.547007|false|
|hedged-rebalance / 25000|0|$28869.882254|$42795.308827|false|
|original / 25|0|$27.166447|$27.461348|false|
|original / 2500|0|$2770.820100|$2776.107189|false|
|original / 25000|0|$27708.135199|$27761.009107|false|
|reentry / 25|0|$20.655843|$28.042210|false|
|reentry / 2500|0|$2120.046752|$2888.791417|false|
|reentry / 25000|0|$21200.002344|$28888.303703|false|
|always-hedged / 25|0|$5.364339|$29.957180|false|
|always-hedged / 2500|0|$527.252912|$2995.702015|false|
|always-hedged / 25000|0|$5272.070072|$29957.019350|false|
|spot-holder / 25|0|n/a|$0.000000|false|
|spot-holder / 2500|0|n/a|$0.000000|false|
|spot-holder / 25000|0|n/a|$0.000000|false|

### holdout

|Policy / size|All capital $|Hours / % / entries|Funding $|Spot PnL $|Perp PnL $|Net $|Return %|Simple annual %|DD $ / %|Min close / intrabar H $|Negative hours|Envelope return %|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|75.000000|1 / 0.046296 / 1|0.000000|0.282360|-0.226200|-6.296804|-8.395738|-34.049382|6.296804 / 8.395738|$4.202582 / $4.026988|0|-8.395738|
|hedged-rebalance / 2500|5700.000000|2160 / 100.000000 / 1|78.497303|2253.546370|-2253.424330|35.819070|0.628405|2.548530|26.898530 / 0.471904|$329.454941 / $211.755569|77|0.628405|
|hedged-rebalance / 25000|57000.000000|2160 / 100.000000 / 1|785.042859|22536.807580|-22535.595350|418.367043|0.733977|2.976686|214.085167 / 0.375588|$3292.048895 / $2107.785592|77|0.733977|
|original / 25|75.000000|244 / 11.296296 / 6|0.069973|3.001020|-2.898920|-7.574250|-10.099000|-40.957057|7.574250 / 10.099000|$1.070822 / $0.846618|3|-10.099000|
|original / 2500|5700.000000|233 / 10.787037 / 4|6.646390|222.884450|-216.779450|-80.893832|-1.419190|-5.755604|80.893832 / 1.419190|$227.406039 / $213.885544|3|-1.419190|
|original / 25000|57000.000000|233 / 10.787037 / 4|66.464587|2228.881720|-2167.830450|-752.078873|-1.319437|-5.351049|752.078873 / 1.319437|$2274.755220 / $2139.755449|3|-1.319437|
|reentry / 25|75.000000|811 / 37.546296 / 15|0.275810|17.737870|-17.885430|-9.214501|-12.286001|-49.826559|9.214501 / 12.286001|$-0.767626 / $-1.178513|6|-12.286001|
|reentry / 2500|5700.000000|1093 / 50.601852 / 18|32.531890|1821.583420|-1845.201230|-246.312481|-4.321272|-17.525157|246.312481 / 4.321272|$8.582061 / $-43.961217|11|-4.321272|
|reentry / 25000|57000.000000|1380 / 63.888889 / 19|346.785214|16227.758630|-16465.813840|-2442.614270|-4.285288|-17.379224|2446.428644 / 4.291980|$85.543173 / $-443.942692|53|-4.285288|
|always-hedged / 25|75.000000|2160 / 100.000000 / 1|1.941928|33.306000|-33.310680|-4.546249|-6.061666|-24.583423|6.246418 / 8.328557|$-129.281393 / $-132.222288|77|-6.061666|
|always-hedged / 2500|5700.000000|2160 / 100.000000 / 1|194.454242|3335.083500|-3335.552130|147.511625|2.587923|10.495467|42.281327 / 0.719984|$-12939.667423 / $-13234.152930|77|2.587923|
|always-hedged / 25000|57000.000000|2160 / 100.000000 / 1|1944.542423|33350.835000|-33355.521300|1529.836252|2.683923|10.884800|422.813268 / 0.719318|$-129395.774222 / $-132340.629286|77|2.683923|
|spot-holder / 25|45.000000|2160 / 100.000000 / 1|0.000000|33.306000|0.000000|27.016613|60.036918|243.483058|35.433840 / 33.382674|n/a / n/a|0|36.022151|
|spot-holder / 2500|2700.000000|2160 / 100.000000 / 1|0.000000|3344.264000|0.000000|3313.183017|122.710482|497.659178|3557.920960 / 37.697928|n/a / n/a|0|58.126018|
|spot-holder / 25000|27000.000000|2160 / 100.000000 / 1|0.000000|33442.853500|0.000000|33186.402075|122.912600|498.478879|35579.436740 / 37.676368|n/a / n/a|0|58.221758|

|Policy / size|Perp fees $|Perp slip $|Spot route $|Spot slip $|Margin route $|Fixed $|Signing $|Total costs $|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|0.022571|0.025079|0.125244|0.025039|0.075030|6.000000|0.080000|6.352964|
|hedged-rebalance / 2500|3.264027|3.626697|18.106664|3.619885|7.503000|6.000000|0.680000|42.800273|
|hedged-rebalance / 25000|32.640881|36.267646|181.069998|36.199520|75.030000|6.000000|0.680000|367.888045|
|original / 25|0.135785|0.150873|0.753913|0.150722|0.075030|6.000000|0.480000|7.746323|
|original / 2500|9.097273|10.108081|50.517423|10.099445|7.503000|6.000000|0.320000|93.645222|
|original / 25000|90.975294|101.083660|505.188479|100.997297|75.030000|6.000000|0.320000|879.594730|
|reentry / 25|0.235704|0.261894|1.308522|0.261600|0.075030|6.000000|1.200000|9.342751|
|reentry / 2500|27.392718|30.436353|152.055542|30.398949|7.503000|6.000000|1.440000|255.226561|
|reentry / 25000|281.442620|312.714022|1562.302139|312.335494|75.030000|6.000000|1.520000|2551.344274|
|always-hedged / 25|0.037459|0.041622|0.207836|0.041551|0.075030|6.000000|0.080000|6.483498|
|always-hedged / 2500|3.750985|4.167761|20.811588|4.160653|7.503000|6.000000|0.080000|46.473987|
|always-hedged / 25000|37.509848|41.677609|208.115881|41.606533|75.030000|6.000000|0.080000|410.019871|
|spot-holder / 25|0.000000|0.000000|0.207836|0.041551|0.000000|6.000000|0.040000|6.289387|
|spot-holder / 2500|0.000000|0.000000|20.868876|4.172106|0.000000|6.000000|0.040000|31.080983|
|spot-holder / 25000|0.000000|0.000000|208.690094|41.721330|0.000000|6.000000|0.040000|256.451425|

|Policy / size|Maintenance-proxy breach hours|Min marked venue equity $|Ending venue cash $|Operating budget exceeded|
|---|---:|---:|---:|---|
|hedged-rebalance / 25|0|$29.661162|$29.726149|false|
|hedged-rebalance / 2500|0|$2893.727760|$4135.582335|false|
|hedged-rebalance / 25000|0|$28932.002407|$41354.019786|false|
|original / 25|0|$26.790498|$26.884395|false|
|original / 2500|0|$2768.913766|$2770.661586|false|
|original / 25000|0|$27689.096156|$27706.575183|false|
|reentry / 25|0|$11.705517|$11.892782|false|
|reentry / 2500|0|$1104.056809|$1129.501590|false|
|reentry / 25000|0|$11038.334734|$13286.814733|false|
|always-hedged / 25|1222|$-37.376733|$-1.447833|false|
|always-hedged / 2500|1222|$-3746.743239|$-149.016633|false|
|always-hedged / 25000|1222|$-37467.432393|$-1490.166334|false|
|spot-holder / 25|0|n/a|$0.000000|false|
|spot-holder / 2500|0|n/a|$0.000000|false|
|spot-holder / 25000|0|n/a|$0.000000|false|

### full

|Policy / size|All capital $|Hours / % / entries|Funding $|Spot PnL $|Perp PnL $|Net $|Return %|Simple annual %|DD $ / %|Min close / intrabar H $|Negative hours|Envelope return %|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|75.000000|1 / 0.023148 / 1|0.000000|-0.112700|0.122360|-6.341728|-8.455638|-17.146154|6.341728 / 8.455638|$4.963278 / $4.710862|0|-8.455638|
|hedged-rebalance / 2500|5700.000000|4320 / 100.000000 / 1|114.586776|2335.228010|-2339.361860|67.284892|1.180437|2.393663|31.854601 / 0.558853|$340.260311 / $213.092367|163|1.180437|
|hedged-rebalance / 25000|57000.000000|4320 / 100.000000 / 1|1145.960430|23352.803680|-23394.155750|733.042274|1.286039|2.607801|263.649108 / 0.462542|$3394.715628 / $2122.810364|163|1.286039|
|original / 25|75.000000|30 / 0.694444 / 7|0.006517|2.346810|-2.465240|-8.130542|-10.840723|-21.982577|8.130542 / 10.840723|$2.062610 / $1.656088|1|-10.840723|
|original / 2500|5700.000000|26 / 0.601852 / 4|0.661706|199.107100|-205.360210|-99.236821|-1.740997|-3.530355|99.236821 / 1.740997|$228.219171 / $200.259606|0|-1.740997|
|original / 25000|57000.000000|26 / 0.601852 / 4|6.617216|1991.122600|-2053.657430|-935.523433|-1.641269|-3.328129|935.523433 / 1.641269|$2281.554941 / $2002.976326|0|-1.641269|
|reentry / 25|75.000000|2806 / 64.953704 / 21|0.635262|18.167000|-18.261040|-10.189789|-13.586385|-27.550170|10.189789 / 13.586385|$-0.814945 / $-1.214727|83|-13.586385|
|reentry / 2500|5700.000000|2675 / 61.921296 / 14|61.809577|1032.742320|-1056.235870|-210.583365|-3.694445|-7.491513|210.583365 / 3.694445|$13.578114 / $-13.579772|81|-3.694445|
|reentry / 25000|57000.000000|2683 / 62.106481 / 15|619.208827|11174.962880|-11432.260090|-2193.674810|-3.848552|-7.804009|2193.674810 / 3.848552|$135.220397 / $-136.371263|82|-3.848552|
|always-hedged / 25|75.000000|4320 / 100.000000 / 1|2.874385|35.162400|-35.238070|-3.692126|-4.922834|-9.982414|6.296196 / 8.394928|$-134.372068 / $-137.407223|163|-4.922834|
|always-hedged / 2500|5700.000000|4320 / 100.000000 / 1|288.509745|3529.344000|-3536.939200|233.625271|4.098689|8.311230|43.740237 / 0.733956|$-13488.526067 / $-13793.172747|163|4.098689|
|always-hedged / 25000|57000.000000|4320 / 100.000000 / 1|2885.151014|35294.095200|-35370.048610|2391.018603|4.194769|8.506060|437.410490 / 0.733300|$-134887.421635 / $-137933.944987|163|4.194769|
|spot-holder / 25|45.000000|4320 / 100.000000 / 1|0.000000|35.162400|0.000000|28.867388|64.149750|130.081438|36.569540 / 38.469433|n/a / n/a|0|38.489850|
|spot-holder / 2500|2700.000000|4320 / 100.000000 / 1|0.000000|3529.344000|0.000000|3497.707727|129.544731|262.687926|3670.582400 / 47.633425|n/a / n/a|0|61.363293|
|spot-holder / 25000|27000.000000|4320 / 100.000000 / 1|0.000000|35294.095200|0.000000|35032.087716|129.748473|263.101070|36706.505420 / 47.583492|n/a / n/a|0|61.459803|

|Policy / size|Perp fees $|Perp slip $|Spot route $|Spot slip $|Margin route $|Fixed $|Signing $|Total costs $|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|0.022361|0.024846|0.124301|0.024850|0.075030|6.000000|0.080000|6.351388|
|hedged-rebalance / 2500|3.302670|3.669633|18.345165|3.667566|7.503000|6.000000|0.680000|43.168034|
|hedged-rebalance / 25000|33.027356|36.697062|183.455282|36.676386|75.030000|6.000000|0.680000|371.566086|
|original / 25|0.157633|0.175148|0.875740|0.175078|0.075030|6.000000|0.560000|8.018630|
|original / 2500|9.092040|10.102267|50.526792|10.101318|7.503000|6.000000|0.320000|93.645416|
|original / 25000|90.924006|101.026673|505.287956|101.017184|75.030000|6.000000|0.320000|879.605819|
|reentry / 25|0.339193|0.376881|1.883382|0.376526|0.075030|6.000000|1.680000|10.731011|
|reentry / 2500|26.705576|29.672862|148.258175|29.639779|7.503000|6.000000|1.120000|248.899393|
|reentry / 25000|281.930594|313.256216|1565.245656|312.923962|75.030000|6.000000|1.200000|2555.586427|
|always-hedged / 25|0.038273|0.042526|0.212524|0.042488|0.075030|6.000000|0.080000|6.490841|
|always-hedged / 2500|3.841579|4.268422|21.331649|4.264624|7.503000|6.000000|0.080000|47.289274|
|always-hedged / 25000|38.416508|42.685008|213.320453|42.647032|75.030000|6.000000|0.080000|418.179000|
|spot-holder / 25|0.000000|0.000000|0.212524|0.042488|0.000000|6.000000|0.040000|6.295012|
|spot-holder / 2500|0.000000|0.000000|21.331649|4.264624|0.000000|6.000000|0.040000|31.636273|
|spot-holder / 25000|0.000000|0.000000|213.320453|42.647032|0.000000|6.000000|0.040000|262.007484|

|Policy / size|Maintenance-proxy breach hours|Min marked venue equity $|Ending venue cash $|Operating budget exceeded|
|---|---:|---:|---:|---|
|hedged-rebalance / 25|0|$29.971509|$30.075154|false|
|hedged-rebalance / 2500|0|$2887.109519|$4164.237596|false|
|hedged-rebalance / 25000|0|$28869.882254|$41639.938963|false|
|original / 25|0|$27.089875|$27.208496|false|
|original / 2500|0|$2770.820100|$2776.107189|false|
|original / 25000|0|$27708.135199|$27761.009107|false|
|reentry / 25|0|$11.470884|$11.658148|false|
|reentry / 2500|0|$1939.262629|$1949.195269|false|
|reentry / 25000|0|$18585.302792|$18591.761928|false|
|always-hedged / 25|1222|$-39.524951|$-2.444483|false|
|always-hedged / 2500|1222|$-3978.405018|$-256.539456|false|
|always-hedged / 25000|1222|$-39785.345677|$-2565.999112|false|
|spot-holder / 25|0|n/a|$0.000000|false|
|spot-holder / 2500|0|n/a|$0.000000|false|
|spot-holder / 25000|0|n/a|$0.000000|false|

Always hedged deliberately bypasses ALL entry gates and exits, opens at the first open and closes at the final close. It is a pure-carry accounting counterfactual. Negative marked venue equity and maintenance-proxy breaches mean the original 1.2× margin could not support this path without collateral transfers/top-ups or liquidation. Its reported funding and PnL must not be read as achievable account performance. No hypothetical financing or liquidation fills are credited. Spot-only buys at the first open and sells at the final close; its directional price gains/losses and drawdown show the exposure removed by the matched short, subject to basis risk.

## Original chronological strategy (legacy audit appendix) (all hours; no event selection)

| Size | All capital | Net PnL | Net return on ALL capital | Funding | Total costs | Drawdown USD / peak % | Min close stress H | Min intrabar H | Entries / held hours / negative settlements |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| demo | $75.000000 | $-8.130542 | -10.840723% | $0.006517 | $8.018630 | $8.130542 / 10.840723% | $2.062610 | $1.656088 | 7 / 30 / 1 |
| illustrative | $5700.000000 | $-99.236821 | -1.740997% | $0.661706 | $93.645416 | $99.236821 / 1.740997% | $228.219171 | $200.259606 | 4 / 26 / 0 |

demo: spot PnL $2.346810, perp PnL $-2.465240, ending venue cash $27.208496; maximum marked dollar basis exposure $0.042480. Maintenance-proxy breach hours 0. Operating budget exceeded: false.
Cost breakdown: perpFees $0.157633; perpSlippage $0.175148; spotRouteFees $0.875740; spotSlippage $0.175078; marginRouteFees $0.075030; fixed $6.000000; signing $0.560000.

illustrative: spot PnL $199.107100, perp PnL $-205.360210, ending venue cash $2776.107189; maximum marked dollar basis exposure $3.393600. Maintenance-proxy breach hours 0. Operating budget exceeded: false.
Cost breakdown: perpFees $9.092040; perpSlippage $10.102267; spotRouteFees $50.526792; spotSlippage $10.101318; marginRouteFees $7.503000; fixed $6.000000; signing $0.320000.

## Mechanically selected real moves

Selection: rolling perp close-to-close returns, earliest tie. These stress-only counterfactuals bypass entry gates and assume an existing hedge.

1h maximum: **8.629493%**, 2026-09-20T16:00:00.000Z → 2026-09-20T17:00:00.000Z, selected from 4320 candidates. Independent spot move: 8.560908%.

24h maximum: **32.499065%**, 2026-09-17T05:00:00.000Z → 2026-09-18T05:00:00.000Z, selected from 4297 candidates. Independent spot move: 32.434356%.

| Scenario | Net PnL | Return on ALL capital | Min close H | Min intrabar H | Exit proposals |
| --- | ---: | ---: | ---: | ---: | --- |
| demo-worst-1h (recorded-worst-move) | $-6.378304 | -8.504406% | $0.673864 | $-0.025133 | full-unwind |
| illustrative-worst-1h (recorded-worst-move) | $-36.201048 | -0.635106% | $39.246189 | $-31.563377 | full-unwind |
| demo-worst-24h (recorded-worst-move) | $-6.361435 | -8.481914% | $2.280246 | $1.341537 | full-unwind |
| illustrative-worst-24h (recorded-worst-move) | $-34.338948 | -0.602438% | $222.481405 | $128.085675 | full-unwind |
| demo-synthetic-50pct-gap (SYNTHETIC +50% gap) | $-6.401046 | -8.534728% | $-20.310663 | $-20.310663 | full-unwind |
| illustrative-synthetic-50pct-gap (SYNTHETIC +50% gap) | $-38.276276 | -0.671514% | $-2039.878235 | $-2039.878235 | full-unwind |

## Maker-entry sensitivity (assumed fills)

demo: net $-7.568318; return -10.091091%; costs $7.429692.
illustrative: net $-102.307550; return -1.794869%; costs $90.757113.

## Original-policy break-even search (legacy audit only)

Status: no-profitable-size-found-through-scan. Target short n/a; all capital n/a; verified rerun PnL n/a; fixed + signing costs $6.320000. Largest scanned short $1000000.000000. At the largest/verified size, PnL before fixed costs per target dollar is -0.03716818; a nonpositive value has no finite algebraic break-even for that proportional trade path. This is conditional on the same simulated policy and cost assumptions, with no global-minimum claim.

## Data gaps and limits

[]

No historical executable books, marks, funding oracle marks, live quotes or actual approvals are recorded. Performance is conditional on the assumptions below.

## Assumptions fixed in code

- Recorded MAINNET market data; simulated execution only. No actual funded trades, signatures, keys or network in replay.
- Frozen 180-day UTC window, end exclusive, plus 24 pre-window hourly observations for entry warm-up. No rates/prices are forward-filled. Any missing hour suppresses all performance results.
- Entry gates use only settled prior-hour funding. Monitoring uses completed candle prices. Approved proposals execute at the next hourly open; all paired spot sales assume owner approval by then. The horizon close is scheduled in advance.
- Contract-compatible H = equity - $0.10 reserve - ceil_micro(quantity * ceil_micro(price * 1.01)); minimum headroom is 10% upper-band notional. Research caps: initial inventory maximum; per-order 1.01x target dollars; rolling day 2.02x target; 60s cooldown; per-sale/day inventory caps. Explicit policyLimits may override caps. Deployment caps are different. Owner settlement/route finality is assumed before sales.
- Both legs hold identical NEAR quantity, rounded DOWN to captured Hyperliquid size precision. Opening short is capped by target dollars; spot is capped by target and remaining spot cash after realized losses; legacy original/reentry comparators do not transfer collateral. The rebalance policy transfers only owned funds, with additions capped by initial NEAR and target dollars. Residual budget stays cash.
- Positive Hyperliquid funding pays shorts; negative funding is a debit. Settlement notional uses that hourly perp OPEN as an oracle proxy. Entry-hour funding is excluded; exit-at-open funding is excluded. Exact funding marks/queue ordering are unavailable.
- Perp taker 0.045%, maker 0.015%. Baseline uses taker both ways; maker-entry sensitivity assumes every opening maker order fills and still closes taker. These base fees have no account discounts. Maker fills are unverified.
- 1Click unauthenticated route fee 0.25% plus 0.0001% protocol fee, on each spot acquisition/sale and once on initially credited margin. Ending margin remains at the venue; the $1 withdrawal overhead is a conservative allowance for a later capped withdrawal, not an executed terminal transfer. Open-short withdrawals are forbidden; excess margin remains at the venue. No live quote was obtained.
- Adverse slippage/spread allowance is 5 bps per leg per trade, added as a cost; fees use reference notional. Coinbase is an independent spot price proxy for wNEAR routes, not an assumed Coinbase execution venue. No additional Coinbase fee is charged.
- Fixed planning costs per run: $1 destination activation, $1 storage/gas, $1 withdrawal and $3 infrastructure; $0.02 per leg action for signing/gas. These are assumptions, not measured quotes; unused operating capital earns zero. The operating budget flag reports cost overruns.
- All capital denominator = spot budget + initially credited venue margin + operating allocation, including unused cash. In rebalance runs only explicit delayed transfers move cash between venues; transit is excluded from margin. Dollar PnL includes spot + perp + signed funding minus every modelled cost. No staking yield. Simple annualization = net return * 8,760 / window hours; no compounding or forecast.
- Historical books, mark/oracle history, stop triggers, latency and ADL are unavailable. Rebalance routes take one full hour after submission; paired trades are assumed simultaneous fills, with no interim coin mismatch. Depth is ASSUMED to cover the size at 5 bps; the engine gate is real but historical executable depth is UNVERIFIED. Intrabar perp-high maintenance/stress values are conservative proxies, not liquidation/fill claims.
- Captured current NEAR mainnet maintenance table (5% to $20m, 10% above with $1m deduction) is held constant throughout history; historical tier changes are unknown. USD = USDC and wNEAR = NEAR reference price; depeg, wrapper and venue-default risks are unmodelled.
- Rebalance is a continuous hedge until an emergency/unrestorable-band unwind, without funding timing. Signal at close, submission next open, route arrival one full hour later; no cash borrowing. Three signatures per rebalance. No reverse withdrawals/additions occur; failed actionable restoration fully unwinds. Negative venue equity is infeasible, never floored. Terminal quantities are before scheduled liquidation; final quantity is zero.
- Worst moves are the maximum positive rolling close-to-close perp returns over all 1h/24h candidates whose endpoints are inside the window; ties choose earliest. Scenarios value a pre-existing hedge at the start endpoint close regardless of entry gates, disable re-entry, and do not enter the chronological strategy selection.
- Synthetic +50% is a discontinuous gap in BOTH legs after one flat hour at the first window price, with zero funding and a post-gap hour to execute the unwind proposal. It is synthetic, not an observed event. Owner delay, rejected proposals and spot-sale lag could worsen actual outcomes.
- Break-even is a rerun search over target short dollars with margin = 1.2x target and operating capital = max($20, 8% of target), identical fees and engine. Scan upward in powers of two from $10 plus the $1m endpoint, then bisect the first profitable bracket. Size rounding, $0.10 reserve and policy changes can make PnL nonmonotone: this is a first bracketed crossing, not a proven global minimum or a size recommendation.

## Primary sources

- [maintenance](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-tiers)
- [market](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)
- [spot](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles)
- [fees](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees)
- [route](https://docs.near-intents.org/resources/fees)

Historical carry is not indicative of future results; not financial or investment advice.
