# Counterweight recorded market replay

A NEAR holder gives up NEAR price upside (and avoids the matching downside) while hedged, receiving only carry net of costs and residual basis PnL. Adding an equal-coin short removes the common spot price move from combined PnL while both legs are held, while keeping basis, venue and collateral risks. The hedge receives positive funding and pays negative funding, trading/routing fees and overhead; net carry depends on those costs and time held. The spot-only baseline retains NEAR price gains and drawdowns. In this window, the always-held hedge outgrew its separate margin account: its pure-carry accounting is not an executable return. At the $2,500 target, the rebalance policy received $150.88 funding, paid $88.75 costs, and netted $56.90 including basis PnL. Higher participation does not guarantee a profit. These are historical simulations with no promised yield.

Status: **complete**. Recorded MAINNET market data; simulated supervised execution, no funds.

Window: 2026-05-12T00:00:00.000Z through 2026-11-08T00:00:00.000Z (exclusive). Captured 2026-11-09T20:29:36.612Z.
SHA-256 of manifest.json: `0bece3400021060f20f8e3b4db3e8cdf9287a8d649e7b03029556f55025719cb`. Run `npm run replay` offline to regenerate both reports.

Data: 4320/4320 complete replay hours; 24 warm-up hours; 0 missing series-hours.
Whole-window negative-funding hours: **163**; nonpositive-funding hours: 163. Summed hourly funding rates: **6.387413%** (not a fixed-dollar or all-capital return).

## Full-window comparison

|Policy|Spot / capital $|Hedged h|Rebal / cost $|Funding $|All costs $|Net $|Return / annual %|DD $ / %|Min H $|Breach h|NEAR start → end|Survived 1h / 24h %|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance|25 / 75|26|0 / 0.00|0.01|6.36|-6.34|-8.45 / -17.14|6.34 / 8.45|7.14|0|16.1 → 0.0|3.01 / 10.27|
|hedged-rebalance|2500 / 5700|4320|31 / 56.33|150.88|88.75|56.90|1.00 / 2.02|31.73 / 0.56|593.14|0|1616.0 → 608.2|8.63 / 32.50|
|hedged-rebalance|25000 / 57000|4320|31 / 420.45|1509.12|690.05|766.77|1.35 / 2.73|265.32 / 0.47|5928.53|0|16160.3 → 6084.3|8.63 / 32.50|
|always-hedged|25 / 75|4320|0 / 0.00|2.87|6.49|-3.69|-4.92 / -9.98|6.30 / 8.39|-104.87|1222|16.1 → 16.1|7.14 / 32.31|
|always-hedged|2500 / 5700|4320|0 / 0.00|288.51|47.29|233.63|4.10 / 8.31|43.74 / 0.73|-10537.71|1222|1616.0 → 1616.0|7.14 / 32.31|
|always-hedged|25000 / 57000|4320|0 / 0.00|2885.15|418.18|2391.02|4.19 / 8.51|437.41 / 0.73|-105379.64|1222|16160.3 → 16160.3|7.14 / 32.31|
|spot-holder|25 / 45|0|0 / 0.00|0.00|6.30|28.87|64.15 / 130.08|36.57 / 38.47|n/a|0|16.1 → 16.1|n/a|
|spot-holder|2500 / 2700|0|0 / 0.00|0.00|31.64|3497.71|129.54 / 262.69|3670.58 / 47.63|n/a|0|1616.0 → 1616.0|n/a|
|spot-holder|25000 / 27000|0|0 / 0.00|0.00|262.01|35032.09|129.75 / 263.10|36706.51 / 47.58|n/a|0|16160.3 → 16160.3|n/a|

USD throughout. Min H uses the adverse hourly perp-high proxy, excluding same-hour positive funding. Hedged hours are zero for spot-only (its spot is held throughout). NEAR end is immediately before scheduled liquidation; all final positions are zero. Theoretical always-hedged has 1,222 maintenance-breach hours and negative venue equity: its carry is not executable. Survived moves are rolling positive perp close returns only over continuously held, maintenance-safe hours; independent spot moves and timestamps are in JSON. No observed move is a guaranteed stress capacity.

Spot-only capital excludes uncommitted margin. Common-envelope returns (unused margin held idle) are in the detailed tables. Its price upside is the economic exposure the holder forgoes while hedged. Rebalancing progressively sells NEAR on rallies and can buy it back after falls; it does not preserve the starting coin count.

## Frozen rebalance selection and OOS evaluation

Protocol: docs/REPLAY-PROTOCOL.md. Only first 90 days, 2026-05-12T00:00:00.000Z to 2026-08-10T00:00:00.000Z exclusive, select the rule. Objective: maximum solvent training net return on ALL $5,700 capital at $2,500 spot; ties choose grid order. This already-observed fixture is a retrospective chronological holdout.

|Lower / target / upper H/notional|Training net $|Return %|Hedged h|Rebalances|Rebalance costs $|All costs $|Feasible|
|---|---:|---:|---:|---:|---:|---:|---|
|0.2 / 0.5 / 0.8|-29.827614|-0.523291|399|3|5.803513|37.991452|true|
|0.3 / 0.6 / 0.9|-0.240375|-0.004217|2160|15|27.876720|60.277215|true|
|0.4 / 0.7 / 1|-6.858172|-0.120319|2160|17|29.765094|61.413894|true|

Frozen lower / target / upper = **0.3 / 0.6 / 0.9**, latency **1 hour** after submission. Low side sizes the smallest integer lot restoring target including net arrival proceeds, with a 10% interim H floor. Reverse side withdraws first, then buys spot and increases short at arrival prices using received cash only; aim at target and accept rounding/price drift only inside the trigger band. Emergency H < 10% at close/open or adverse-high H < 0 overrides rebalancing. No external money or spot mark-to-market collateral credit.

The selection is not robust evidence of profitability: the winning training run is slightly negative. No parameters are revised on OOS outcomes. Each period starts fresh with the same allocation and pays all setup/exit costs; results are not additive.

|Period / spot $|Hedged h|Rebalances / cost $|Funding $|All costs $|Net $|Return / simple annual %|DD $ / %|Min close / high H $|Breach h|Min venue $|NEAR start → end|Survived 1h / 24h %|Transit at end $|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|training / 25|26|0 / 0.000000|0.006679|6.359527|-6.339968|-8.453291 / -34.282790|6.339968 / 8.453291|$7.611158 / $7.139181|0|$27.746401|16.1 → 0|3.014519 / 10.271164|0.000000|
|training / 2500|2160|15 / 27.876720|65.038360|60.277215|-0.240375|-0.004217 / -0.017103|31.727113 / 0.556616|$683.348383 / $670.596357|0|$2554.433574|1616 → 1416.5|6.873410 / 32.306991|0.000000|
|training / 25000|2160|15 / 198.663385|650.454411|467.966583|132.462778|0.232391 / 0.942474|265.315982 / 0.465037|$6832.739303 / $6705.215841|0|$25544.365813|16160.3 → 14167.6|6.873410 / 32.306991|0.000000|
|holdout / 25|237|0 / 0.000000|0.070919|6.359657|-6.245058|-8.326743 / -33.769571|6.246418 / 8.328557|$7.676874 / $7.477525|0|$28.006389|15.6 → 0|1.501007 / 7.801552|0.000000|
|holdout / 2500|2160|13 / 24.101832|91.962188|56.408202|33.060356|0.580006 / 2.352248|26.699453 / 0.468411|$593.097212 / $528.963246|0|$2544.782571|1562.1 → 601.3|8.629493 / 32.499065|0.000000|
|holdout / 25000|2160|13 / 197.997984|919.672416|466.343163|428.380433|0.751545 / 3.047931|212.634530 / 0.373043|$5926.055174 / $5284.641464|0|$25445.162114|15621 → 6013.1|8.629493 / 32.499065|0.000000|
|full / 25|26|0 / 0.000000|0.006679|6.359527|-6.339968|-8.453291 / -17.141395|6.339968 / 8.453291|$7.611158 / $7.139181|0|$27.746401|16.1 → 0|3.014519 / 10.271164|0.000000|
|full / 2500|4320|31 / 56.325118|150.880796|88.753731|56.896885|0.998191 / 2.024109|31.727113 / 0.556616|$648.209580 / $593.137203|0|$2466.322143|1616 → 608.2|8.629493 / 32.499065|0.000000|
|full / 25000|4320|31 / 420.451428|1509.118237|690.053299|766.771588|1.345213 / 2.727794|265.315982 / 0.465037|$6480.034921 / $5928.534577|0|$24665.753467|16160.3 → 6084.3|8.629493 / 32.499065|0.000000|

All rebalance sizes/periods have zero maintenance-proxy breaches and positive marked venue equity. The $25 demo unwinds after 26 full-window hours (237 OOS hours): the required adjustment falls below the $10 minimum order, so the band cannot be restored. It stays flat thereafter. Fixed overhead dominates that size. Zero breaches are conditional on sampled hourly prices and assumed fills/latency; they are not proof against liquidation, failed routes, basis jumps or larger gaps.

Rebalance cost includes every actual adjustment: route/protocol fee and spot slippage on the conversion, perp taker fee/slippage, three signing actions ($0.06 total), plus $1 on each reverse withdrawal. Initial entry/terminal exit and setup are included in all costs but excluded from rebalance-only cost. No second route charge is added to the combined NEAR-sale-to-margin route.

## Re-entry procedure and frozen selection

The protocol was written in docs/REPLAY-PROTOCOL.md before evaluating the new candidates. This fixture had already been observed: this is a retrospective chronological holdout, not a prospective untouched experiment. No holdout scores feed selection. All sizes, costs, thresholds and the three-candidate search were declared before candidate evaluation.

Training: 2026-05-12T00:00:00.000Z to 2026-08-10T00:00:00.000Z exclusive (2,160 hours). Holdout: that boundary to 2026-11-08T00:00:00.000Z (2,160 hours). Selection objective: maximum training net return on ALL capital at $2,500; ties choose smaller N.

|Positive settlements N|Training net $|Training return on ALL capital %|Entries|Held hours|Costs $|
|---:|---:|---:|---:|---:|---:|
|6|-54.298827|-0.952611|4|2080|83.557582|
|12|-54.276253|-0.952215|4|2064|82.590908|
|24|-73.284947|-1.285701|6|1915|101.105196|

Frozen N = **12**. Initial entry and re-entry require N consecutive strictly positive completed settlements and positive complete trailing 24h funding. Minimum hold 72 hours; funding exit requires six consecutive negative settlements AND negative trailing 24h funding. Emergency stress exit bypasses minimum hold. Cooldown 24 flat hours after any exit; entry headroom at least 20% of notional versus exit below 10%. Re-entry caps leverage at 0.9 after opening perp costs and reduces quantity to fit remaining venue cash; no top-ups or transfers of spot gains. Existing safety/data/depth/minimum-order gates still apply. The horizon close overrides minimum hold.

The 6h and 12h training candidates differ by only about $0.023 at $2,500: selection is fragile, not evidence of an optimal rule. Full-window results use the frozen rule and are descriptive. Each 90-day run starts fresh, pays all fixed and round-trip costs, and uses the preceding 24 known hours for warm-up; it does not carry positions or training profits. Period results are not additive.

## Original low-exposure diagnosis

Re-entry was already enabled and retried while flat. Every original full-window strategy exit was a stress-headroom unwind, not the six-negative-hour funding exit. Rising NEAR realized losses on the short while the offsetting spot gains remained in the separate spot account. The original re-entry attempted the original target dollars against depleted venue cash, so the leverage limit of one blocked recovery. Gate counts overlap; they must not be added.

demo ($25): 240/4320 hours held (5.555556%), 2 entries, 4080 entry attempts, 4078 rejected. Ending venue cash $23.004425. Blocks: {"leverage-exceeded":4078,"nonpositive-funding":41}.
Trade chronology: 2026-05-12T00:00:00.000Z open (previous-hour-entry-gate); 2026-05-21T18:00:00.000Z close (stress-headroom); 2026-05-21T19:00:00.000Z open (previous-hour-entry-gate); 2026-05-22T01:00:00.000Z close (stress-headroom).
First leverage rejection: 2026-05-22T02:00:00.000Z, target rounded notional $24.895200 versus venue equity after opening costs $22.980775; last rejection 2026-11-07T23:00:00.000Z.
illustrative ($2500): 236/4320 hours held (5.462963%), 1 entries, 4084 entry attempts, 4083 rejected. Ending venue cash $2390.082676. Blocks: {"leverage-exceeded":4083,"nonpositive-funding":41}.
Trade chronology: 2026-05-12T00:00:00.000Z open (previous-hour-entry-gate); 2026-05-21T20:00:00.000Z close (stress-headroom).
First leverage rejection: 2026-05-21T21:00:00.000Z, target rounded notional $2499.987230 versus venue equity after opening costs $2387.707689; last rejection 2026-11-07T23:00:00.000Z.
large ($25000): 236/4320 hours held (5.462963%), 1 entries, 4084 entry attempts, 4083 rejected. Ending venue cash $23900.713537. Blocks: {"leverage-exceeded":4083,"nonpositive-funding":41}.
Trade chronology: 2026-05-12T00:00:00.000Z open (previous-hour-entry-gate); 2026-05-21T20:00:00.000Z close (stress-headroom).
First leverage rejection: 2026-05-21T21:00:00.000Z, target rounded notional $24999.872300 versus venue equity after opening costs $23876.963658; last rejection 2026-11-07T23:00:00.000Z.

There are zero stale-data, future-data or funding-incomplete rejections: all 24 pre-window warm-up observations exist, all 4,320 replay hours are complete, and replay explicitly assumes each observation is fresh (observedAt = now). That freshness assumption is not a live-data guarantee. Nonpositive trailing funding accounts for 41 rejected attempts per original size but does not explain the persistent leverage block. Exits execute at the next open; the first retry occurs one hour after an exit, so flat time also includes that execution scheduling delay.

## Legacy comparison interpretation

All currency columns are USD. Hours denominator is 4,320. Return denominator includes all committed capital; annual is SIMPLE annualization (return × 365/180), not a forecast. DD is maximum total-equity drawdown at hourly opens/closes, including fees; its percentage uses the running equity peak. Stress H is the close-time proxy; negative hours count paid negative settlements while short, excluding entry/exit-at-open settlements. Spot-only stress is n/a and negative-funding hours are zero because it has no short.

Time held does not mean the original dollar target stays invested: each re-entry can be smaller as venue collateral falls. The demo eventually stays flat because the fixed $5 stress reserve and 20% entry-headroom requirement block its proposed size; the engine does not relax those thresholds. Paired exits sell the spot as well as closing the short, so these active policies also move out of NEAR while flat. Higher participation has increased funding but has not covered the resulting turnover costs.

## Separate training and holdout results, with every cost line

The following tables include full-window results at higher precision. Fixed $6 per run consists of activation $1, storage/gas $1, withdrawal $1, infrastructure $3. Signing is $0.02 per leg action. Spot-only has no venue capital, perp fees/slippage, funding or margin route fees; the same applicable spot rates and all $6 overhead apply. Its all-capital return uses spot + operating allocation; the envelope-return column also reserves the hedged margin as idle cash for a common-capital comparison.

### training

|Policy / size|All capital $|Hours / % / entries|Funding $|Spot PnL $|Perp PnL $|Net $|Return %|Simple annual %|DD $ / %|Min close / intrabar H $|Negative hours|Envelope return %|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|75.000000|26 / 1.203704 / 1|0.006679|1.948100|-1.935220|-6.339968|-8.453291|-34.282790|6.339968 / 8.453291|$7.611158 / $7.139181|1|-8.453291|
|hedged-rebalance / 2500|5700.000000|2160 / 100.000000 / 1|65.038360|448.581900|-453.583420|-0.240375|-0.004217|-0.017103|31.727113 / 0.556616|$683.348383 / $670.596357|86|-0.004217|
|hedged-rebalance / 25000|57000.000000|2160 / 100.000000 / 1|650.454411|4484.732740|-4534.757790|132.462778|0.232391|0.942474|265.315982 / 0.465037|$6832.739303 / $6705.215841|86|0.232391|
|original / 25|75.000000|240 / 11.111111 / 2|0.069932|6.846200|-6.964400|-6.703287|-8.937716|-36.247404|6.703287 / 8.937716|$2.614424 / $2.324302|9|-8.937716|
|original / 2500|5700.000000|236 / 10.925926 / 1|6.907905|606.000000|-611.494400|-34.323642|-0.602169|-2.442130|34.323642 / 0.602169|$292.270870 / $271.391365|9|-0.602169|
|original / 25000|57000.000000|236 / 10.925926 / 1|69.080331|6060.112500|-6115.057520|-288.520266|-0.506176|-2.052825|288.520266 / 0.506176|$2922.206032 / $2713.407098|9|-0.506176|
|reentry / 25|75.000000|2015 / 93.287037 / 6|0.392811|6.542100|-6.704810|-7.284195|-9.712261|-39.388612|7.284195 / 9.712261|$1.034249 / $0.947488|78|-9.712261|
|reentry / 2500|5700.000000|2064 / 95.555556 / 4|40.430905|392.769200|-404.885450|-54.276253|-0.952215|-3.861761|63.647326 / 1.116620|$80.394326 / $53.903320|77|-0.952215|
|reentry / 25000|57000.000000|2064 / 95.555556 / 4|404.344991|3926.964580|-4048.128620|-485.876463|-0.852415|-3.457016|580.692104 / 1.018758|$803.594982 / $538.682259|77|-0.852415|
|always-hedged / 25|75.000000|2160 / 100.000000 / 1|0.869894|0.795340|-0.864570|-5.554387|-7.405849|-30.034834|6.296196 / 8.394928|$-27.409823 / $-28.256148|86|-7.405849|
|always-hedged / 2500|5700.000000|2160 / 100.000000 / 1|87.313564|79.830400|-86.779200|46.705132|0.819388|3.323075|37.977267 / 0.664914|$-2754.719011 / $-2845.064368|86|0.819388|
|always-hedged / 25000|57000.000000|2160 / 100.000000 / 1|873.151847|798.318820|-867.808110|521.782510|0.915408|3.712488|379.779717 / 0.664294|$-27548.258440 / $-28451.728777|86|0.915408|
|spot-holder / 25|45.000000|2160 / 100.000000 / 1|0.000000|0.795340|0.000000|-5.396537|-11.992304|-48.635455|23.731400 / 37.607073|n/a / n/a|0|-7.195382|
|spot-holder / 2500|2700.000000|2160 / 100.000000 / 1|0.000000|79.830400|0.000000|58.546117|2.168375|8.793964|2381.984000 / 46.565638|n/a / n/a|0|1.027125|
|spot-holder / 25000|27000.000000|2160 / 100.000000 / 1|0.000000|798.318820|0.000000|639.833161|2.369752|9.610663|23820.282200 / 46.516824|n/a / n/a|0|1.122514|

|Policy / size|Perp fees $|Perp slip $|Spot route $|Spot slip $|Margin route $|Fixed $|Signing $|Total costs $|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|0.023287|0.025874|0.129456|0.025881|0.075030|6.000000|0.080000|6.359527|
|hedged-rebalance / 2500|4.305349|4.783721|23.922549|4.782597|7.503000|14.000000|0.980000|60.277215|
|hedged-rebalance / 25000|43.055133|47.839036|239.234621|47.827793|75.030000|14.000000|0.980000|467.966583|
|original / 25|0.047893|0.053214|0.265753|0.053129|0.075030|6.000000|0.160000|6.655019|
|original / 2500|2.525129|2.805699|14.020366|2.802952|7.503000|6.000000|0.080000|35.737146|
|original / 25000|25.251762|28.057513|140.206262|28.030040|75.030000|6.000000|0.080000|302.655577|
|reentry / 25|0.109363|0.121514|0.607031|0.121358|0.075030|6.000000|0.480000|7.514296|
|reentry / 2500|7.841504|8.712782|43.514252|8.699371|7.503000|6.000000|0.320000|82.590908|
|reentry / 25000|78.418267|87.131407|435.160450|86.997291|75.030000|6.000000|0.320000|769.057415|
|always-hedged / 25|0.022805|0.025339|0.126572|0.025304|0.075030|6.000000|0.080000|6.355051|
|always-hedged / 2500|2.289007|2.543342|12.704416|2.539867|7.503000|6.000000|0.080000|33.659632|
|always-hedged / 25000|22.890499|25.433888|127.046516|25.399144|75.030000|6.000000|0.080000|281.880047|
|spot-holder / 25|0.000000|0.000000|0.126572|0.025304|0.000000|6.000000|0.040000|6.191877|
|spot-holder / 2500|0.000000|0.000000|12.704416|2.539867|0.000000|6.000000|0.040000|21.284283|
|spot-holder / 25000|0.000000|0.000000|127.046516|25.399144|0.000000|6.000000|0.040000|158.485659|

|Policy / size|Maintenance-proxy breach hours|Min marked venue equity $|Ending venue cash $|Operating budget exceeded|
|---|---:|---:|---:|---|
|hedged-rebalance / 25|0|$27.746401|$28.022298|false|
|hedged-rebalance / 2500|0|$2554.433574|$2966.531281|false|
|hedged-rebalance / 25000|0|$25544.365813|$29671.529592|false|
|original / 25|0|$22.853790|$23.004425|false|
|original / 2500|0|$2380.235005|$2390.082676|false|
|original / 25000|0|$23802.234991|$23900.713537|false|
|reentry / 25|0|$16.951530|$23.457123|false|
|reentry / 2500|0|$1552.539283|$2618.991169|false|
|reentry / 25000|0|$15524.861781|$26190.666697|false|
|always-hedged / 25|0|$5.364339|$29.957180|false|
|always-hedged / 2500|0|$527.252912|$2995.702015|false|
|always-hedged / 25000|0|$5272.070072|$29957.019350|false|
|spot-holder / 25|0|n/a|$0.000000|false|
|spot-holder / 2500|0|n/a|$0.000000|false|
|spot-holder / 25000|0|n/a|$0.000000|false|

### holdout

|Policy / size|All capital $|Hours / % / entries|Funding $|Spot PnL $|Perp PnL $|Net $|Return %|Simple annual %|DD $ / %|Min close / intrabar H $|Negative hours|Envelope return %|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|75.000000|237 / 10.972222 / 1|0.070919|1.973400|-1.929720|-6.245058|-8.326743|-33.769571|6.246418 / 8.328557|$7.676874 / $7.477525|3|-8.326743|
|hedged-rebalance / 2500|5700.000000|2160 / 100.000000 / 1|91.962188|2437.886700|-2440.380330|33.060356|0.580006|2.352248|26.699453 / 0.468411|$593.097212 / $528.963246|77|0.580006|
|hedged-rebalance / 25000|57000.000000|2160 / 100.000000 / 1|919.672416|24381.686180|-24406.635000|428.380433|0.751545|3.047931|212.634530 / 0.373043|$5926.055174 / $5284.641464|77|0.751545|
|original / 25|75.000000|291 / 13.472222 / 2|0.130334|6.995720|-6.981760|-6.511837|-8.682449|-35.212153|6.511837 / 8.682449|$2.612279 / $2.078993|3|-8.682449|
|original / 2500|5700.000000|287 / 13.287037 / 1|12.582511|608.594160|-607.656900|-22.180521|-0.389132|-1.578146|26.699453 / 0.468411|$304.107496 / $291.922424|3|-0.389132|
|original / 25000|57000.000000|287 / 13.287037 / 1|125.825114|6085.941600|-6076.569000|-167.085208|-0.293132|-1.188813|212.634530 / 0.373043|$3041.074960 / $2919.224239|3|-0.293132|
|reentry / 25|75.000000|1115 / 51.620370 / 7|0.354447|16.159570|-16.173410|-7.367664|-9.823551|-39.839958|7.367664 / 9.823551|$0.611953 / $0.058933|8|-9.823551|
|reentry / 2500|5700.000000|1972 / 91.296296 / 8|49.223536|1878.606280|-1882.903160|-69.126766|-1.212750|-4.918376|71.219015 / 1.249456|$93.894560 / $30.022787|70|-1.212750|
|reentry / 25000|57000.000000|1972 / 91.296296 / 8|492.262921|18786.461950|-18829.432650|-631.539204|-1.107964|-4.493408|658.233173 / 1.154686|$936.526897 / $297.699756|70|-1.107964|
|always-hedged / 25|75.000000|2160 / 100.000000 / 1|1.941928|33.306000|-33.310680|-4.546249|-6.061666|-24.583423|6.246418 / 8.328557|$-98.246607 / $-100.696782|77|-6.061666|
|always-hedged / 2500|5700.000000|2160 / 100.000000 / 1|194.454242|3335.083500|-3335.552130|147.511625|2.587923|10.495467|42.281327 / 0.719984|$-9841.924684 / $-10087.271992|77|2.587923|
|always-hedged / 25000|57000.000000|2160 / 100.000000 / 1|1944.542423|33350.835000|-33355.521300|1529.836252|2.683923|10.884800|422.813268 / 0.719318|$-98419.246842 / $-100872.719920|77|2.683923|
|spot-holder / 25|45.000000|2160 / 100.000000 / 1|0.000000|33.306000|0.000000|27.016613|60.036918|243.483058|35.433840 / 33.382674|n/a / n/a|0|36.022151|
|spot-holder / 2500|2700.000000|2160 / 100.000000 / 1|0.000000|3344.264000|0.000000|3313.183017|122.710482|497.659178|3557.920960 / 37.697928|n/a / n/a|0|58.126018|
|spot-holder / 25000|27000.000000|2160 / 100.000000 / 1|0.000000|33442.853500|0.000000|33186.402075|122.912600|498.478879|35579.436740 / 37.676368|n/a / n/a|0|58.221758|

|Policy / size|Perp fees $|Perp slip $|Spot route $|Spot slip $|Margin route $|Fixed $|Signing $|Total costs $|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|0.023338|0.025931|0.129473|0.025884|0.075030|6.000000|0.080000|6.359657|
|hedged-rebalance / 2500|4.337356|4.819284|24.075406|4.813156|7.503000|10.000000|0.860000|56.408202|
|hedged-rebalance / 25000|43.373695|48.192994|240.754773|48.131702|75.030000|10.000000|0.860000|466.343163|
|original / 25|0.048042|0.053380|0.266417|0.053262|0.075030|6.000000|0.160000|6.656131|
|original / 2500|2.523432|2.803813|13.992638|2.797409|7.503000|6.000000|0.080000|35.700292|
|original / 25000|25.234320|28.038133|139.926382|27.974087|75.030000|6.000000|0.080000|302.282921|
|reentry / 25|0.122383|0.135981|0.679109|0.135768|0.075030|6.000000|0.560000|7.708271|
|reentry / 2500|11.392411|12.658235|63.220693|12.639083|7.503000|6.000000|0.640000|114.053422|
|reentry / 25000|113.930635|126.589594|632.243129|126.398067|75.030000|6.000000|0.640000|1080.831425|
|always-hedged / 25|0.037459|0.041622|0.207836|0.041551|0.075030|6.000000|0.080000|6.483498|
|always-hedged / 2500|3.750985|4.167761|20.811588|4.160653|7.503000|6.000000|0.080000|46.473987|
|always-hedged / 25000|37.509848|41.677609|208.115881|41.606533|75.030000|6.000000|0.080000|410.019871|
|spot-holder / 25|0.000000|0.000000|0.207836|0.041551|0.000000|6.000000|0.040000|6.289387|
|spot-holder / 2500|0.000000|0.000000|20.868876|4.172106|0.000000|6.000000|0.040000|31.080983|
|spot-holder / 25000|0.000000|0.000000|208.690094|41.721330|0.000000|6.000000|0.040000|256.451425|

|Policy / size|Maintenance-proxy breach hours|Min marked venue equity $|Ending venue cash $|Operating budget exceeded|
|---|---:|---:|---:|---|
|hedged-rebalance / 25|0|$28.006389|$28.091930|false|
|hedged-rebalance / 2500|0|$2544.782571|$3226.401747|false|
|hedged-rebalance / 25000|0|$25445.162114|$32266.351708|false|
|original / 25|0|$22.731505|$23.047152|false|
|original / 2500|0|$2394.430919|$2399.598366|false|
|original / 25000|0|$23944.309189|$23995.983661|false|
|reentry / 25|0|$13.590496|$13.922673|false|
|reentry / 2500|0|$806.403369|$1142.269730|false|
|reentry / 25000|0|$8063.090224|$11422.310041|false|
|always-hedged / 25|1222|$-37.376733|$-1.447833|false|
|always-hedged / 2500|1222|$-3746.743239|$-149.016633|false|
|always-hedged / 25000|1222|$-37467.432393|$-1490.166334|false|
|spot-holder / 25|0|n/a|$0.000000|false|
|spot-holder / 2500|0|n/a|$0.000000|false|
|spot-holder / 25000|0|n/a|$0.000000|false|

### full

|Policy / size|All capital $|Hours / % / entries|Funding $|Spot PnL $|Perp PnL $|Net $|Return %|Simple annual %|DD $ / %|Min close / intrabar H $|Negative hours|Envelope return %|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|75.000000|26 / 0.601852 / 1|0.006679|1.948100|-1.935220|-6.339968|-8.453291|-17.141395|6.339968 / 8.453291|$7.611158 / $7.139181|1|-8.453291|
|hedged-rebalance / 2500|5700.000000|4320 / 100.000000 / 1|150.880796|2810.390530|-2815.620710|56.896885|0.998191|2.024109|31.727113 / 0.556616|$648.209580 / $593.137203|163|0.998191|
|hedged-rebalance / 25000|57000.000000|4320 / 100.000000 / 1|1509.118237|28106.360730|-28158.654080|766.771588|1.345213|2.727794|265.315982 / 0.465037|$6480.034921 / $5928.534577|163|1.345213|
|original / 25|75.000000|240 / 5.555556 / 2|0.069932|6.846200|-6.964400|-6.703287|-8.937716|-18.123702|6.703287 / 8.937716|$2.614424 / $2.324302|9|-8.937716|
|original / 2500|5700.000000|236 / 5.462963 / 1|6.907905|606.000000|-611.494400|-34.323642|-0.602169|-1.221065|34.323642 / 0.602169|$292.270870 / $271.391365|9|-0.602169|
|original / 25000|57000.000000|236 / 5.462963 / 1|69.080331|6060.112500|-6115.057520|-288.520266|-0.506176|-1.026412|288.520266 / 0.506176|$2922.206032 / $2713.407098|9|-0.506176|
|reentry / 25|75.000000|2673 / 61.875000 / 9|0.593654|15.074720|-15.266430|-7.763797|-10.351729|-20.991006|7.763797 / 10.351729|$1.034249 / $0.947488|82|-10.351729|
|reentry / 2500|5700.000000|4036 / 93.425926 / 11|83.800213|2056.972590|-2074.866170|-86.177646|-1.511889|-3.065774|87.958803 / 1.543137|$80.367111 / $25.816809|147|-1.511889|
|reentry / 25000|57000.000000|4036 / 93.425926 / 11|838.093546|20570.662400|-20749.608070|-799.903787|-1.403340|-2.845662|818.080894 / 1.435230|$800.203513 / $254.525444|147|-1.403340|
|always-hedged / 25|75.000000|4320 / 100.000000 / 1|2.874385|35.162400|-35.238070|-3.692126|-4.922834|-9.982414|6.296196 / 8.394928|$-102.345783 / $-104.874489|163|-4.922834|
|always-hedged / 2500|5700.000000|4320 / 100.000000 / 1|288.509745|3529.344000|-3536.939200|233.625271|4.098689|8.311230|43.740237 / 0.733956|$-10283.899682 / $-10537.712658|163|4.098689|
|always-hedged / 25000|57000.000000|4320 / 100.000000 / 1|2885.151014|35294.095200|-35370.048610|2391.018603|4.194769|8.506060|437.410490 / 0.733300|$-102841.462894 / $-105379.639770|163|4.194769|
|spot-holder / 25|45.000000|4320 / 100.000000 / 1|0.000000|35.162400|0.000000|28.867388|64.149750|130.081438|36.569540 / 38.469433|n/a / n/a|0|38.489850|
|spot-holder / 2500|2700.000000|4320 / 100.000000 / 1|0.000000|3529.344000|0.000000|3497.707727|129.544731|262.687926|3670.582400 / 47.633425|n/a / n/a|0|61.363293|
|spot-holder / 25000|27000.000000|4320 / 100.000000 / 1|0.000000|35294.095200|0.000000|35032.087716|129.748473|263.101070|36706.505420 / 47.583492|n/a / n/a|0|61.459803|

|Policy / size|Perp fees $|Perp slip $|Spot route $|Spot slip $|Margin route $|Fixed $|Signing $|Total costs $|
|---|---:|---:|---:|---:|---:|---:|---:|---:|
|hedged-rebalance / 25|0.023287|0.025874|0.129456|0.025881|0.075030|6.000000|0.080000|6.359527|
|hedged-rebalance / 2500|6.755682|7.506314|37.543114|7.505621|7.503000|20.000000|1.940000|88.753731|
|hedged-rebalance / 25000|67.554095|75.060106|375.415933|75.053165|75.030000|20.000000|1.940000|690.053299|
|original / 25|0.047893|0.053214|0.265753|0.053129|0.075030|6.000000|0.160000|6.655019|
|original / 2500|2.525129|2.805699|14.020366|2.802952|7.503000|6.000000|0.080000|35.737146|
|original / 25000|25.251762|28.057513|140.206262|28.030040|75.030000|6.000000|0.080000|302.655577|
|reentry / 25|0.156254|0.173615|0.867426|0.173416|0.075030|6.000000|0.720000|8.165741|
|reentry / 2500|15.699816|17.444240|87.136825|17.420397|7.503000|6.000000|0.880000|152.084278|
|reentry / 25000|157.012852|174.458725|871.449811|174.220274|75.030000|6.000000|0.880000|1459.051663|
|always-hedged / 25|0.038273|0.042526|0.212524|0.042488|0.075030|6.000000|0.080000|6.490841|
|always-hedged / 2500|3.841579|4.268422|21.331649|4.264624|7.503000|6.000000|0.080000|47.289274|
|always-hedged / 25000|38.416508|42.685008|213.320453|42.647032|75.030000|6.000000|0.080000|418.179000|
|spot-holder / 25|0.000000|0.000000|0.212524|0.042488|0.000000|6.000000|0.040000|6.295012|
|spot-holder / 2500|0.000000|0.000000|21.331649|4.264624|0.000000|6.000000|0.040000|31.636273|
|spot-holder / 25000|0.000000|0.000000|213.320453|42.647032|0.000000|6.000000|0.040000|262.007484|

|Policy / size|Maintenance-proxy breach hours|Min marked venue equity $|Ending venue cash $|Operating budget exceeded|
|---|---:|---:|---:|---|
|hedged-rebalance / 25|0|$27.746401|$28.022298|false|
|hedged-rebalance / 2500|0|$2466.322143|$2861.503804|false|
|hedged-rebalance / 25000|0|$24665.753467|$28628.506488|false|
|original / 25|0|$22.853790|$23.004425|false|
|original / 2500|0|$2380.235005|$2390.082676|false|
|original / 25000|0|$23802.234991|$23900.713537|false|
|reentry / 25|0|$14.940079|$14.997356|false|
|reentry / 2500|0|$688.898724|$975.789986|false|
|reentry / 25000|0|$6887.570132|$9757.013899|false|
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
| demo | $75.000000 | $-6.703287 | -8.937716% | $0.069932 | $6.655019 | $6.703287 / 8.937716% | $2.614424 | $2.324302 | 2 / 240 / 9 |
| illustrative | $5700.000000 | $-34.323642 | -0.602169% | $6.907905 | $35.737146 | $34.323642 / 0.602169% | $292.270870 | $271.391365 | 1 / 236 / 9 |

demo: spot PnL $6.846200, perp PnL $-6.964400, ending venue cash $23.004425; maximum marked dollar basis exposure $0.122360. Maintenance-proxy breach hours 0. Operating budget exceeded: false.
Cost breakdown: perpFees $0.047893; perpSlippage $0.053214; spotRouteFees $0.265753; spotSlippage $0.053129; marginRouteFees $0.075030; fixed $6.000000; signing $0.160000.

illustrative: spot PnL $606.000000, perp PnL $-611.494400, ending venue cash $2390.082676; maximum marked dollar basis exposure $12.281600. Maintenance-proxy breach hours 0. Operating budget exceeded: false.
Cost breakdown: perpFees $2.525129; perpSlippage $2.805699; spotRouteFees $14.020366; spotSlippage $2.802952; marginRouteFees $7.503000; fixed $6.000000; signing $0.080000.

## Mechanically selected real moves

Selection: rolling perp close-to-close returns, earliest tie. These stress-only counterfactuals bypass entry gates and assume an existing hedge.

1h maximum: **8.629493%**, 2026-09-20T16:00:00.000Z → 2026-09-20T17:00:00.000Z, selected from 4320 candidates. Independent spot move: 8.560908%.

24h maximum: **32.499065%**, 2026-09-17T05:00:00.000Z → 2026-09-18T05:00:00.000Z, selected from 4297 candidates. Independent spot move: 32.434356%.

| Scenario | Net PnL | Return on ALL capital | Min close H | Min intrabar H | Exit proposals |
| --- | ---: | ---: | ---: | ---: | --- |
| demo-worst-1h (recorded-worst-move) | $-6.378304 | -8.504406% | $7.434145 | $6.886423 | none |
| illustrative-worst-1h (recorded-worst-move) | $-36.201048 | -0.635106% | $949.009665 | $890.001693 | none |
| demo-worst-24h (recorded-worst-move) | $-6.376231 | -8.501641% | $2.534745 | $1.361113 | full-unwind |
| illustrative-worst-24h (recorded-worst-move) | $-37.639841 | -0.660348% | $222.088445 | $189.159317 | full-unwind |
| demo-synthetic-50pct-gap (SYNTHETIC +50% gap) | $-6.401046 | -8.534728% | $-8.959040 | $-8.959040 | full-unwind |
| illustrative-synthetic-50pct-gap (SYNTHETIC +50% gap) | $-38.276276 | -0.671514% | $-783.552354 | $-783.552354 | full-unwind |

## Maker-entry sensitivity (assumed fills)

demo: net $-6.688367; return -8.917823%; costs $6.640099.
illustrative: net $-33.573656; return -0.589012%; costs $34.987161.

## Original-policy break-even search (legacy audit only)

Status: no-profitable-size-found-through-scan. Target short n/a; all capital n/a; verified rerun PnL n/a; fixed + signing costs $6.080000. Largest scanned short $1000000.000000. At the largest/verified size, PnL before fixed costs per target dollar is -0.01129762; a nonpositive value has no finite algebraic break-even for that proportional trade path. This is conditional on the same simulated policy and cost assumptions, with no global-minimum claim.

## Data gaps and limits

[]

No historical executable books, marks, funding oracle marks, live quotes or actual approvals are recorded. Performance is conditional on the assumptions below.

## Assumptions fixed in code

- Recorded MAINNET market data; simulated execution only. No actual funded trades, signatures, keys or network in replay.
- Frozen 180-day UTC window, end exclusive, plus 24 pre-window hourly observations for entry warm-up. No rates/prices are forward-filled. Any missing hour suppresses all performance results.
- Entry gates use only settled prior-hour funding. Monitoring uses completed candle prices. Approved proposals execute at the next hourly open; all paired spot sales assume owner approval by then. The horizon close is scheduled in advance.
- Both legs hold identical NEAR quantity, rounded DOWN to captured Hyperliquid size precision. Opening short is capped by target dollars; spot is capped by target and remaining spot cash after realized losses; legacy original/reentry comparators do not transfer collateral. The rebalance policy transfers only owned funds, with additions capped by initial NEAR and target dollars. Residual budget stays cash.
- Positive Hyperliquid funding pays shorts; negative funding is a debit. Settlement notional uses that hourly perp OPEN as an oracle proxy. Entry-hour funding is excluded; exit-at-open funding is excluded. Exact funding marks/queue ordering are unavailable.
- Perp taker 0.045%, maker 0.015%. Baseline uses taker both ways; maker-entry sensitivity assumes every opening maker order fills and still closes taker. These base fees have no account discounts. Maker fills are unverified.
- 1Click unauthenticated route fee 0.25% plus 0.0001% protocol fee, on each spot acquisition/sale and once on initially credited margin. Terminal margin returns via the assumed fixed-fee withdrawal. Each reverse rebalance pays another $1 withdrawal and routes withdrawn USDC to spot at the stated conversion rates. No live quote was obtained.
- Adverse slippage/spread allowance is 5 bps per leg per trade, added as a cost; fees use reference notional. Coinbase is an independent spot price proxy for wNEAR routes, not an assumed Coinbase execution venue. No additional Coinbase fee is charged.
- Fixed planning costs per run: $1 destination activation, $1 storage/gas, $1 withdrawal and $3 infrastructure; $0.02 per leg action for signing/gas. These are assumptions, not measured quotes; unused operating capital earns zero. The operating budget flag reports cost overruns.
- All capital denominator = spot budget + initially credited venue margin + operating allocation, including unused cash. In rebalance runs only explicit delayed transfers move cash between venues; transit is excluded from margin. Dollar PnL includes spot + perp + signed funding minus every modelled cost. No staking yield. Simple annualization = net return * 8,760 / window hours; no compounding or forecast.
- Historical books, mark/oracle history, stop triggers, latency and ADL are unavailable. Rebalance routes take one full hour after submission; paired trades are assumed simultaneous fills, with no interim coin mismatch. Depth is ASSUMED to cover the size at 5 bps; the engine gate is real but historical executable depth is UNVERIFIED. Intrabar perp-high maintenance/stress values are conservative proxies, not liquidation/fill claims.
- Captured current NEAR mainnet maintenance table (5% to $20m, 10% above with $1m deduction) is held constant throughout history; historical tier changes are unknown. USD = USDC and wNEAR = NEAR reference price; depeg, wrapper and venue-default risks are unmodelled.
- Rebalance is a continuous hedge until an emergency/unrestorable-band unwind, without funding timing. Signal at close, submission next open, route arrival one full hour later; no cash borrowing. Three signatures per rebalance. High trigger is inactive at addition caps; failed actionable restoration fully unwinds. Negative venue equity is infeasible, never floored. Terminal quantities are before scheduled liquidation; final quantity is zero.
- Worst moves are the maximum positive rolling close-to-close perp returns over all 1h/24h candidates whose endpoints are inside the window; ties choose earliest. Scenarios value a pre-existing hedge at the start endpoint close regardless of entry gates, disable re-entry, and do not enter the chronological strategy selection.
- Synthetic +50% is a discontinuous gap in BOTH legs after one flat hour at the first window price, with zero funding and a post-gap hour to execute the unwind proposal. It is synthetic, not an observed event. Owner delay, rejected proposals and spot-sale lag could worsen actual outcomes.
- Break-even is a rerun search over target short dollars with margin = 1.2x target and operating capital = max($20, 8% of target), identical fees and engine. Scan upward in powers of two from $10 plus the $1m endpoint, then bisect the first profitable bracket. Size rounding, $5 reserve and policy changes can make PnL nonmonotone: this is a first bracketed crossing, not a proven global minimum or a size recommendation.

## Primary sources

- [maintenance](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-tiers)
- [market](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)
- [spot](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles)
- [fees](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees)
- [route](https://docs.near-intents.org/resources/fees)

Historical carry is not indicative of future results; not financial or investment advice.
