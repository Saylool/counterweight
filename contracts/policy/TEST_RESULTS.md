# V3 validation — captured 2026-11-10 18:50 UTC

Current artifact and ABI/trust boundaries: [POLICY-V3](../../docs/POLICY-V3.md).
The validation counts below are the **10 November 2026, 18:50 UTC** snapshot
([JSON](../../docs/evidence/policy-v3-validation.json)); frontend counts were last
validated at **18:29 UTC** that day. They are historical, not current suite counts.
That pre-deployment validation used public reads and disposable localhost tests.

V3 was subsequently deployed separately as `policy-v3.counterweight-samet.testnet`.
The [saved keyless verification](../../docs/evidence/2026-11-10-policy-v3-keyless-verify.txt)
at finalized block **277108250** (`5BD3Ur5pomULd1t9rTPFsX8r6WxRYGdDcjZ8Ams5nARp`)
reports zero access keys and code hash `MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm`,
matching the v3 artifact below. This is deployment evidence, not a v3 trading-fill
proof. Native policy layout compatibility does not make a keyless v2 upgrade
possible. Historical binary/demo pins remain unchanged.

| Check | V3 result |
|---|---|
| Native unit tests | 135 passed |
| Native `test-utils` tests | 135 passed (same distinct tests) |
| Root TS tests | 467 passed, 22 files |
| Frontend tests (previous v3 validation; unchanged this build pass) | 30 passed, 2 files |
| Typecheck | root passed; previous web result unchanged |
| Clippy workspace/all targets/all features, warnings denied | passed |
| Default exports | 42 required; no raw signing, upgrade or test-only methods |
| Full Rust sandbox suite | 26 passed against optimized production bytes, 2 threads |

The production build is **343,212 bytes**, SHA-256
`052d4d8758a1e470c5d6c32ff8610564c39dde47194d7a4de42f97a2c587838c`.
Release overflow checks remain enabled. The pinned Binaryen build repeats byte-for-byte;
both v2 and v3 SHA256SUMS entries pass. All sandbox fixtures deploy this exact optimized
production binary, using localhost `.testnet` aliases and real mock token callbacks.
New regressions verify deployed code equals the manifest-pinned artifact (and rejects
test-only methods), and measure the saved initializer's **344,059-byte** storage usage.
The creation formula is `(343212 + 847 + 131072) / 100000 + 1 + 0.5 = 6.25131 NEAR`.
Golden signing vectors pass in both native feature configurations; sandbox compares
actual WASM-generated signing events to the native codec. Hex encoding exhausts all
256 byte values; decimal formatting compares old/new output over 0–24 decimal places,
leading zeroes, trailing zeroes and full u128 boundaries.

Current scoped build/test evidence:
[summary and commands](../../docs/evidence/policy-v3-tests.txt),
[machine-readable validation](../../docs/evidence/policy-v3-validation.json).
Earlier unrelated frontend results above are retained historical checks.

New coverage exercises all three exit authorities at prices from $0.00001 to
$1,000,000 with an unchanged initial opening band; exact 1% IOC caps despite a
wider opening-slippage configuration; stale/future observations and sanity bounds;
paused keeper closes, exhausted opening budgets/full queues/stuck signing slots;
independent spot-transfer and exit callbacks in both receipt orders; and a caller
mark fresher than a still-valid but >60s-old opening oracle.

Margin-only and existing-route health checks use the same integer formula. The
new TS test invokes real Rust withdrawal methods for nine v3 scenarios and compares
post-withdrawal health against the existing TS engine, including exact and one-micro
nonround boundaries. The original 19 shared scenarios remain green (its open-short
rejection now models insufficient post-withdrawal H). The wider replay remains v2.

Timelock unit tests exercise unauthorized callers, the exact 24h boundary,
cancellation and replacement delay reset. Sandbox exercises owner proposal/cancel/
execute after local key deletion; maturity is modeled by a localhost state patch,
not 24h of mined blocks. The unit host exercises actual deadline arithmetic. The
same sandbox verifies keeper/owner/public out-of-band exits and adapter-free partial
withdrawal/reconciliation through real local cross-contract receipts, using mocks.
Additional regressions verify that wide sane keeper caches cannot bypass the
opening band, can support partial-withdrawal health outside it, and that flat
withdrawals need fresh equity without an irrelevant price observation.
A unit regression proves that v2's truthful net+1 USDC-fee reconciliation fails its
immutable one-micro fee cap and that full replay expiry/prune/abandon/4-wNEAR return
preserves the $1 residual without acquisition credit.

# Historical class-transfer upgrade validation — 2026-11-10

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
