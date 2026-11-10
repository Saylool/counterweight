# Judge-facing validation update — 2026-11-10

The reserve-funded MPC change adds two native regressions and one sandbox
regression. Native suites: **109/109** with default features and **109/109** with
`test-utils` (109 distinct tests, run in two configurations). The new sandbox
case uses an actual restricted function-call keeper key, zero attached deposit,
and verifies the per-call fee cap and storage/growth floor reject without changing
policy state. The final full sandbox suite passes **20/20**. `cargo fmt --check`
and Clippy across workspace/all targets/all features pass with warnings denied.
The default artifact rebuild matches byte-for-byte; SHA256SUMS verifies.
Scoped relay checks pass 4 SDK vectors + 1 event/assembly case; the Python custody
key gate passes 1 test. The harness uses only disposable localhost keys. No testnet transaction was
sent and no real private key was read or printed.

Updated default WASM: **588,218 bytes**, SHA-256
`e8bfa3d5e93c2ea85bd99be5b71a97508a90046f79b9d00aab34b2e9f0d6c48a`.
The export checker accepts 31 required methods and rejects test-only/raw signing
exports. The artifact, SHA256SUMS, local-demo pin and TypeScript provenance test
are synchronized. The new artifact is not deployed; the fresh-account plan targets
`policy-v2.counterweight-samet.testnet`.

`npm test`: **332/332** in 15 files. `npm run typecheck` and `npm run build`: pass.
`npm run test:demo`: pass; seven attacks rejected, owner unchanged during the
autonomous phase, then owner settlement + exact mock sale + finalized mock receipt
complete the rebalance. Final spot and reserved short are zero; pending route
proceeds are credited only on reconciliation. Reports: `reports/demo-local.*`.

The earlier validation record below is historical and describes the old artifact.

---

# Validation — 2026-11-10

Changes are confined to `contracts/` and `docs/DESIGN-NOTES.md`. No git command
was run. No public deployment, public-network transaction, or wallet credential
was used. Disposable localhost sandbox keys were managed by near-workspaces;
no key material was printed. Public Hyperliquid metadata queries were read-only.

## Test-first evidence

The initial ten audit regressions ran against the audited implementation:

```text
test result: FAILED. 0 passed; 10 failed; 0 ignored; 0 measured; 71 filtered out
```

`target/audit-red.log` records tick rounding, residual reduction after an
understated settlement, withdraw3 timeout tracking/zero-short guard, resource-free
pause, emergency nonce invalidation, definite signer failure, rolling turnover,
owner cancel preemption, and minimum nonce drift failures. The new cumulative
budget, configurable signer resource, and native sweep APIs first failed to
compile as missing methods (`target/audit-api-red.log`).

Five route/receipt tests failed before the state-machine implementation
(`target/rebalance-red.log`: 0 passed / 5 failed). A further runtime regression
proved the prior pending-withdrawal behavior allowed premature short risk
(`target/withdrawal-arrival-red.log`: 0 passed / 1 failed). The copied repository
TypeScript codec rejected noop with a Zod discriminator error before the scoped
relay fix (`target/relay-red.log`); the same relay test now passes.

The final suite includes all three priority missing tests: (1) NEAR price/tick and
+15% rally ask-crossing checks, (2) official SDK noop vectors with/without expiry
and actual policy pause event → assembleRequest using the public MPC fixture,
(3) timeout/invalidation-before-withdrawal-retry and residual short recovery after
settlement understated to zero. IOC ask crossing uses synthetic liquidity;
no live venue fill is claimed.

## Environment and commands

Rust `1.98.1 (48a229cea 2026-09-01)`, macOS arm64; pinned near-sdk 5.30.1,
near-workspaces 0.24.0, local near-sandbox 2.14.0. Commands ran from
`contracts/policy/` with:

```sh
export CARGO_HOME="$PWD/.cargo-home"
export RUSTUP_HOME="$PWD/.rustup"
export RUSTUP_TOOLCHAIN=stable-aarch64-apple-darwin
cargo fmt --all
cargo fmt --all --check
cargo clippy --locked --workspace --all-targets --all-features -- -D warnings
cargo test --locked
cargo test --locked --features test-utils
cargo build --locked --release --target wasm32-unknown-unknown -p counterweight-policy
python3 tests/check_default_exports.py target/wasm32-unknown-unknown/release/counterweight_policy.wasm
cargo build --locked --release --target wasm32-unknown-unknown --features test-utils --workspace
TMPDIR=/private/tmp COUNTERWEIGHT_ALLOW_DISPOSABLE_SANDBOX_KEYS=1 \
  cargo test --locked --features sandbox-tests --test sandbox -- --test-threads=1
```

An early Wasm build launched from the repository root skipped Cargo's local
`cfg(near)` configuration and produced unhelpful panic traps in rejection tests.
It was discarded and rebuilt from the documented contract directory. A diagnostic
command that omitted the local Cargo environment was rejected by the read-only
global cache. Final builds/checks use the local configuration and cache.

## Final executed results

`cargo fmt --all`, `cargo fmt --all --check`: exit 0.

`cargo clippy --locked --workspace --all-targets --all-features -- -D warnings`:
exit 0, including policy, mock signer, and sandbox harness. Final log:
`target/clippy.log`. Initial style findings were fixed without suppressions.

`cargo test --locked` (`target/default-tests.log`):

```text
test result: ok. 107 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.99s
```

`cargo test --locked --features test-utils` (`target/test-utils-tests.log`):

```text
test result: ok. 107 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.51s
```

Both doc-test runs: 0 passed / 0 failed. These are 107 distinct native tests under
two feature configurations, including 36 new audit/rebalancing regressions;
they are not 214 distinct tests. The README rule-to-test table maps findings and
policy rules to their exact test names.

Default production-feature Wasm build: exit 0 (`target/default-build.log`).
Updated export checker against the copied default artifact (`target/default-exports.log`):

```text
default Wasm exports: ok; 31 required methods; no test-only or raw-signing methods
```

Default `artifacts/counterweight_policy.wasm` SHA-256:

```text
698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289
```

`artifacts/SHA256SUMS` records the same hash. The later test-utils build overwrites
only the target-directory artifact, not the default artifact above.

Final full sandbox suite (`target/sandbox-tests.log`):

```text
test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 206.33s
```

All original 15 integration cases and four new cases ran. New cases:

- `sandbox_authenticated_deposits_and_token_failure_restoration`: real receiver
  receipts, rejected zero/message/nonowner deposits, failed token transfer ledger
  restoration, oversized successful token result without double credit.
- `sandbox_rally_precision_and_cumulative_address_budget`: delegated address
  budget exhaustion, independent owner emergency, ask-crossing reduce-only price,
  auto-pause and withheld keeper nonce marking.
- `sandbox_exact_sale_route_finality_and_replay`: matching settlement, exact
  dispatch, reserved inventory, pending-route risk rejection, finalized margin
  credit, duplicate receipt rejection.
- `sandbox_withdrawal_nonce_requires_confirmed_invalidation`: tracked withdrawal,
  blocked retry, original-nonce noop with <=60-second expiry, confirmation,
  explicit abandonment, fresh margin, and retry.

The sandbox signer/token/router is a mock. It proves accounting and asynchronous
receipt behavior, not actual bridge execution or valid ECDSA/Hyperliquid fills.

## SDK, relay, and custody checks

From the repository root:

```sh
.tmp/sdk-venv/bin/python contracts/policy/tools/generate-signing-vectors.py
node_modules/.bin/tsx contracts/policy/relay/noop.test.ts
node_modules/.bin/tsc --noEmit --target ES2022 --module NodeNext \
  --moduleResolution NodeNext --allowImportingTsExtensions --skipLibCheck \
  contracts/policy/relay/signing.ts contracts/policy/relay/noop.test.ts
PYTHONDONTWRITEBYTECODE=1 python3 contracts/policy/tools/test_custody_keys.py
```

All exit 0. Official Python SDK 0.24.0 commit/source SHA are asserted by the
generator; it uses only an already-public signature and intercepts digest
construction before signing. It generated **28** contract-local vectors. Rust
checks **22 supported** vectors, including four noop cases; approveAgent/usdSend
remain unsupported controller actions.

```text
noop SDK vectors: 4 passed; pause event + public MPC fixture -> assembleRequest: 1 passed
custody unittest: Ran 1 test — OK
TypeScript no-emit typecheck: exit 0
```

Logs: `target/relay-green.log`, `target/relay-typecheck.log`,
`target/custody-tests.log`. The custody test rejects both FullAccess and
function-call-to-signer permissions and accepts a zero-key account. It is not a
claim that an actual funded account's keys have been removed.

The policy-scoped relay fixes noop within the allowed write scope. Consumers
must use `relay/signing.ts`; the unchanged repository-wide codec outside
`contracts/` still rejects noop. No network relay occurred.

## Explicit proof boundaries

All High/Medium controller changes and the three priority missing tests are
implemented and mapped in README. Keyless custody is an operational pre-funding
zero-access-key gate; the contract cannot introspect access keys. Fixed identities,
market/path and recipients require a fresh controller to change. Resource and
cumulative delegation allowances are configurable by owner.

Position, equity, actual refund/fill and external finalized receipt observations
remain owner attestations, as DESIGN Part B specifies. A separately audited route
adapter is required for external execution; the sandbox does not supply one.
Pending/refundable proceeds are not usable margin. IOC fills and venue acceptance
cannot be guaranteed by local tests.

Cheap Low fixes cover flat/nested MPC formats, scheme/recovery-ID/scalar bounds,
low-s rejection, minimum nonce drift, and event completeness. Full curve validity,
ECDSA recovery, and binding to the derived signer address remain relayer checks.
No public-network deployment readiness or fully cryptographic receipt proof is
claimed.
