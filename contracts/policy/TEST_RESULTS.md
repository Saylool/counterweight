# Class-transfer upgrade validation — 2026-11-10

Current validation and exact upgrade commands: [upgrade evidence](../../docs/evidence/2026-11-10-v2-upgrade-validation.md). The results below are historical for the old `d85b2f91…` artifact, which is now deployed on initialized v2. The new artifact keeps that state layout and upgrades in place without init.

# Historical blind-review validation — 2026-11-10

Validated in the current working directory on macOS arm64, Node 26.9.0 and Rust
1.98.1. No git command, real private key, wallet/keychain operation, deployment,
key deletion or testnet send was performed. near-workspaces used disposable
localhost accounts only. These historical results are superseded by the upgrade validation linked above.

| Check | Result |
|---|---|
| `npm test` root TypeScript suite | 342/342, 18 files |
| `npm test` frontend suite | 28/28, 2 files |
| `npm run typecheck` | pass |
| `npm run replay` | pass: 4,320 complete hours, zero gaps; JSON/Markdown and numeric baseline regenerated |
| `cargo test --locked` | 115/115 native tests; zero doc tests |
| `cargo test --locked --features test-utils` | 115/115, same distinct tests |
| Full Rust sandbox suite (`sandbox-tests`, one test thread) | 21/21 |
| `npm run test:demo` | pass: seven rogue attempts rejected, autonomous phase owner unchanged, close/dead-man signed, owner-resumed mock settlement/sale/receipt completed |
| `npm run web:build` | pass |
| `cargo fmt --all --check` | pass |
| Clippy workspace/all targets/all features, warnings denied | pass |
| Production WASM rebuild, byte comparison, SHA256SUMS | pass |
| Production exports | 34 required methods; no test-only/raw signing exports |
| Shared noop SDK/relay compatibility | 4 official noop vectors + pause-event/assembly case pass |
| Python custody-key checker | 1/1 |

The cross-layer TypeScript test invokes real Rust contract methods on 19 identical
scenarios: backing, short/order/day/cooldown caps, exact health boundaries (including
non-round prices), reduce authorization size, and flat/open-short withdrawal rules.
It also checks the numerical risk headroom against the integer policy arithmetic.
The replay uses conservative upper-band notional, a $0.10 fee reserve and explicitly
scaled research caps; reverse withdrawals/additions are disabled while short.
The operational budget also gates additional entries. Simulated owner settlement
and route receipts are assumptions, not external fill/finality proofs.

Oracle tests cover authenticated public asynchronous reads, null/failed/oversized
responses, stale/future publications, exponent/price bounds, 1% confidence boundary,
out-of-order callbacks, immutable fallback endpoints and a fresh oracle overriding
a hostile keeper hint. The new sandbox oracle case exercises actual cross-contract
receipts against the labelled mock. Pyth NEAR is retired; the public deployment
plan therefore uses a null oracle account and bounded keeper fallback. See
[ORACLE](../../docs/ORACLE.md). No maintained public feed operation is claimed.

The earlier sandbox run exposed one test that reopened after advancing
beyond the new price-age limit. The test now refreshes through the keeper before
reopening; the final complete suite passes. The production artifact and the sandbox
`test-utils` build are separate. The latter supports disposable `.test.near` fixtures
and must never be deployed for custody.

Production artifact: **627,961 bytes**, SHA-256:

```text
d85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1
```

At that historical release, SHA256SUMS, local-demo pin and provenance assertions agreed. That baseline is now deployed on initialized v2. The current upgrade preserves its state layout and needs no migration or init. The init ABI
adds immutable `network` and `oracle`; the exact policy-v2 plan is documented in
[TESTNET-DEPLOYMENT](../../docs/TESTNET-DEPLOYMENT.md). Public reads and tests do not
prove live funding, venue fills, bridge finality or removal of deployed account keys.
