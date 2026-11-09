# Frozen NEAR market capture

`npm run replay` reads these files offline. It uses no credentials, signing requests,
live quotes, or network calls. `npm test` checks the hashes, derivation from raw
responses, missing-data behavior, chronological decisions, and report reproduction.

The fixed replay window is **2026-05-12 00:00 UTC to 2026-11-08 00:00 UTC**, end
exclusive: 180 days / 4,320 hours. An additional 24 hours precede it for the first
trailing funding calculation. Capture timestamps are retained in `requests.json`
and `metadata.json`; replay never substitutes the current date.

- `funding.json`: Hyperliquid mainnet `fundingHistory`, NEAR, in requests of at
  most 400 hours, below the general 500-record limit. Original millisecond event
  timestamps remain intact. For risk decisions, an event is available only at
  the end of its UTC hour; there is no forward fill.
- `perp.json`: Hyperliquid mainnet `candleSnapshot`, NEAR, `1h`. The complete
  4,344-hour interval was inside its latest-5,000-candle retention at capture.
  Pagination cannot recover candles outside that retention. The capture script
  refuses to overwrite this capture once the frozen start is too old.
- `spot.json`: independent Coinbase Exchange NEAR-USD hourly candles. The
  product exists: see `raw/coinbase-product.json`. Requests span at most 299
  hours, below Coinbase's 300-candle limit. Coinbase's arrays are
  `[unixSeconds, low, high, open, close, volume]`, initially newest first.
- `raw/`: all parsed API responses, reserialized as JSON with two-space
  indentation and a final newline. These are response contents, not original
  HTTP wire bytes. No raw record is selected for its return or funding sign.
- `requests.json`: exact methods, URLs, application-supplied headers, JSON request
  bodies, HTTP status, request/response timestamps, and response filenames.
- `metadata.json`: window, source URLs, resolved NEAR asset index and margin
  table ID. The loader imports the existing Hyperliquid market resolver.
- `manifest.json`: SHA-256 and byte length of every raw response and normalized
  data/provenance JSON file. The manifest's own hash appears in both reports.
  Hashes verify consistency with this recorded capture; they are not signatures
  from the exchanges. This README is explanatory and is outside the data manifest.

Normalization filters to the frozen interval, deduplicates overlapping page
boundaries only when complete rows agree, then sorts chronologically. The loader
rejects duplicates, invalid prices and OHLC, unexpected NEAR maintenance tiers,
and corrupt files. Missing series-hours are listed in reports; any gap (including
warm-up) suppresses all performance and makes the replay command fail.

`npm run capture:market` is the separate, explicit **online** acquisition command.
It needs public API access, never keys. Preserve the existing capture: fresh
responses can change and the fixed candle window eventually expires from the API.
There is no silent network fallback in replay.

The captured current NEAR mainnet table is 10x maximum leverage to $20m, then 5x.
Maintenance uses half the initial margin rate and the continuous tier deduction:
5% to $20m, then 10% less $1m. Applying this table throughout history is an explicit
assumption; historical table changes are unavailable. Candle trades are proxies
for funding marks and risk monitoring. No historical executable depth, ADL,
venue stops, actual fills, or owner approvals are inferred from these data.

All simulated accounting, policy, fee, slippage, and operating-cost assumptions,
including limitations of the break-even search, are generated from code in
`reports/replay-report.md`. The larger size is illustrative, not a recommendation.

Primary API references:

- [Hyperliquid info endpoint](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)
- [Hyperliquid margin tiers](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-tiers)
- [Coinbase public candles](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles)
