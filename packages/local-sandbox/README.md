# Local demo boundary

With Node 22.19+, curl and tar, `npm ci` installs NEAR sandbox 2.14.0 for macOS arm64 / Linux x64. Then
`npm run demo:local` runs offline, using disposable accounts managed only by
near-workspaces. It never loads a wallet or public account credential.
The demo preloads a Node socket guard that rejects every nonlocal host before
DNS/TCP. If install scripts are disabled, run `npm run demo:install` while online
once. Subsequent demos require no download, Cargo toolchain, or public RPC.

The policy is the default-feature committed `contracts/policy/artifacts/counterweight_policy.wasm`,
checked against its published SHA-256 and a pinned digest before deployment.
`artifacts/mock-mpc.wasm.base64` encodes a copy of the existing
`contracts/policy/tests/mock-signer/src/lib.rs` build. Its SHA-256 is
`69ba632f36ccaa2d00f73466d617da0a0d1d267a0484624e61abf302201b591f`.
The hash is checked on decoded Wasm bytes before deployment. Text encoding keeps
the fixture distributable under the repository's `*.wasm` ignore rule.
It fabricates signature-shaped public data and mock token receipts. It does not
perform MPC cryptography, maintain a real token ledger, or execute venue trades.

Replay hours are historical fixture time; sandbox time is advanced separately
only to exercise contract freshness and heartbeat checks. Stress H is a keeper
rule, not an on-chain oracle. A mock close fill updates only the replay ledger;
the contract conservatively retains signed exposure until owner reconciliation.
Spot disposal and finalized route reconciliation remain owner-approved. After the
owner-free replay/attacks/recovery assertions, an explicit OWNER RESUMED phase
settles the mock close, approves the exact spot sale through the mock token/route,
and reconciles its mock finalized receipt. Only then is margin credited. The final
timeline entry asserts zero spot and zero reserved short. Fast-forward waits print
progress, including periodic output while the sandbox call is running.

Signing calls attach zero deposit and spend the bounded policy operating reserve.
The local keeper key remains disposable and library-managed; the Rust sandbox
suite separately exercises a restricted function-call access key.

The rogue script uses the configured keeper identity to simulate compromise.
Bounded non-reduce opens are intentionally allowed by the design; the attack
attempts to replace a price-bearing reduce-only close with a non-reduce order.
The contract rejects the supplied open price. Callback replay tests an old
operation ID/nonce at the private callback; no caller-controlled signing nonce
or approveAgent ABI exists. No venue nonce-replay protection is claimed.

Run `npm run test:demo` for the complete sandbox assertions. Normal `npm test`
also tests fixture selection, risk triggers, dry-run transport and unsafe input
handling. Reports retain every application timeline line, all contract logs,
transaction receipt hashes, attack failures, and owner balance/access-key nonce
snapshots. No secret keys are included.

`npm run keeper:dry` reads live mainnet public NEAR metadata, mark, order book and
settled funding, plus a runtime-discovered 1Click NEAR-to-HyperCore USDC quote.
It hardcodes `dry: true`, sends no authentication, creates no deposit address,
and never requests a signature. Displayed $25 short/$30 equity and 10 NEAR route
are illustrative inputs, not wallet observations. Service errors are reported
independently and withhold executable proposals; quote outages are never replaced
with historical quotes. HTTP proxy environments are supported without logging
their credentials. API references: [Hyperliquid info](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint),
[1Click quote](https://docs.near-intents.org/api-reference/oneclick/request-a-swap-quote),
[HyperCore asset](https://docs.near-intents.org/integration/distribution-channels/1click-api/hyperliquid).
