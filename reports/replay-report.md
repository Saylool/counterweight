# Counterweight recorded market replay

Status: **complete**. Recorded MAINNET market data; simulated supervised execution, no funds.

Window: 2026-05-12T00:00:00.000Z through 2026-11-08T00:00:00.000Z (exclusive). Captured 2026-11-09T20:29:36.612Z.
SHA-256 of manifest.json: `0bece3400021060f20f8e3b4db3e8cdf9287a8d649e7b03029556f55025719cb`. Run `npm run replay` offline to regenerate both reports.

Data: 4320/4320 complete replay hours; 24 warm-up hours; 0 missing series-hours.
Whole-window negative-funding hours: **163**; nonpositive-funding hours: 163.

## Chronological strategy (all hours; no event selection)

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

## Break-even search

Status: no-profitable-size-found-through-scan. Target short n/a; all capital n/a; verified rerun PnL n/a; fixed + signing costs $6.080000. Largest scanned short $1000000.000000. At the largest/verified size, PnL before fixed costs per target dollar is -0.01129762; a nonpositive value has no finite algebraic break-even for that proportional trade path. This is conditional on the same simulated policy and cost assumptions, with no global-minimum claim.

## Data gaps and limits

[]

No historical executable books, marks, funding oracle marks, live quotes or actual approvals are recorded. Performance is conditional on the assumptions below.

## Assumptions fixed in code

- Recorded MAINNET market data; simulated execution only. No actual funded trades, signatures, keys or network in replay.
- Frozen 180-day UTC window, end exclusive, plus 24 pre-window hourly observations for entry warm-up. No rates/prices are forward-filled. Any missing hour suppresses all performance results.
- Entry gates use only settled prior-hour funding. Monitoring uses completed candle prices. Approved proposals execute at the next hourly open; all paired spot sales assume owner approval by then. The horizon close is scheduled in advance.
- Both legs hold identical NEAR quantity, rounded DOWN to captured Hyperliquid size precision. Opening short is capped by target dollars; spot is capped by target and remaining spot cash after realized losses; no reinvestment or margin top-ups. Residual budget stays cash.
- Positive Hyperliquid funding pays shorts; negative funding is a debit. Settlement notional uses that hourly perp OPEN as an oracle proxy. Entry-hour funding is excluded; exit-at-open funding is excluded. Exact funding marks/queue ordering are unavailable.
- Perp taker 0.045%, maker 0.015%. Baseline uses taker both ways; maker-entry sensitivity assumes every opening maker order fills and still closes taker. These base fees have no account discounts. Maker fills are unverified.
- 1Click unauthenticated route fee 0.25% plus 0.0001% protocol fee, on each spot acquisition/sale and once on initially credited margin. Margin returns via the assumed fixed-fee withdrawal, without a second 1Click route. No live quote was obtained.
- Adverse slippage/spread allowance is 5 bps per leg per trade, added as a cost; fees use reference notional. Coinbase is an independent spot price proxy for wNEAR routes, not an assumed Coinbase execution venue. No additional Coinbase fee is charged.
- Fixed planning costs per run: $1 destination activation, $1 storage/gas, $1 withdrawal and $3 infrastructure; $0.02 per leg action for signing/gas. These are assumptions, not measured quotes; unused operating capital earns zero. The operating budget flag reports cost overruns.
- All capital denominator = spot budget + initially credited venue margin + operating allocation, including unused cash. Spot and margin capital stay separate. Dollar PnL includes spot + perp + signed funding minus every modelled cost. No staking yield or annualization.
- Historical books, mark/oracle history, stop triggers, latency and ADL are unavailable. Depth is ASSUMED to cover the size at 5 bps; the engine gate is real but historical executable depth is UNVERIFIED. Intrabar perp-high maintenance/stress values are conservative proxies, not liquidation/fill claims.
- Captured current NEAR mainnet maintenance table (5% to $20m, 10% above with $1m deduction) is held constant throughout history; historical tier changes are unknown. USD = USDC and wNEAR = NEAR reference price; depeg, wrapper and venue-default risks are unmodelled.
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
