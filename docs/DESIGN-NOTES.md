# Signing requirements for the contract engineer

These are required controller rules. This TypeScript change does not implement contract code.

## Nonce allocation

Persist `last_nonce` per derived Hyperliquid signing address. Allocate and persist each authorized signing request atomically as `nonce = max(last_nonce + 1, block_timestamp_ms())`. Use milliseconds, never NEAR's nanosecond `block_timestamp`. Concurrent requests in the same block must receive distinct nonces. Failed MPC callbacks must not roll the counter back or reuse a nonce. Bound clock drift and allocation throughput so the counter cannot run far ahead of wall time.

## Expiry and keeper signing budget

Every production L1 signature must bind a tight `expiresAfter` selected by the contract. Start with a maximum 60-second lifetime from nonce allocation, subject to measured MPC latency; do not let a keeper extend it. Recheck freshness before returning/relaying a signature. An expired action costs 5x address rate limits, so expiry alone cannot stop a malicious keeper from exhausting the venue budget.

Enforce an on-chain keeper rate limit per signing address, counting signing authorizations including pending/failed requests. Set bounded per-block and rolling-window budgets and an outstanding-request cap; reserve capacity for owner emergency deleveraging and nonce invalidations. Specify these limits as contract parameters with tests before deployment. Keepers cannot choose arbitrary nonces, expiries, payloads, or invalidate someone else's emergency capacity.

## Pause and withheld signatures

On `pause`, stop new keeper authorizations and discard pending keeper callbacks. Track outstanding authorized nonces, including withheld signatures. Authorize and relay authenticated Hyperliquid `noop` nonce invalidations for every outstanding nonce; a local pause flag cannot revoke an off-chain signature. Issue each invalidation using the nonce being consumed and confirm venue acceptance. The owner emergency path needs reserved signing/relay capacity. Treat the pause as incomplete until invalidations are confirmed or all outstanding signatures have expired. Merely issuing one newer nonce does not invalidate older signatures in Hyperliquid's 100-largest-nonce window. Include same-block allocation, withheld-signature replay across pause, expiry, keeper-budget exhaustion, and invalidation confirmation/failure cases in the contract tests.

## Custody and proof boundary

Never fund the owner-EOA probe address. Direct owner MPC requests bypass controller policy. Fund only the strategy address derived from the audited policy contract predecessor after policy and immutable custody checks. `approveAgent` and `usdSend` remain interoperability-only codecs; they must never be authorized through the controller or proof relay.

The testnet proof relay is deliberately separate from production rules: only an unfunded order-ID-zero cancel, no vault or expiresAfter, nonce at most 30 minutes old and at most 60 seconds ahead. Plans are one-use and consumed before relay submission, including transport failures. Production keeper actions instead require the tight expiry and on-chain limits above.
