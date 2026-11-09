# Validation — 2026-11-10

This resumed run inspected the pre-existing edits, kept the codec/controller work,
and changed files only under `contracts/`. Only the expressly permitted read-only
`git status` / `git diff` inspection was used; no other git command was run.
No public network deployment, public-network transaction, or wallet credential was used.

## Environment and commands

Rust `1.98.1 (48a229cea 2026-09-01)`, macOS arm64; near-sdk 5.30.1,
near-workspaces 0.24.0 and its local near-sandbox 2.14.0. Commands ran from
`contracts/policy/` with:

```sh
export CARGO_HOME="$PWD/.cargo-home"
export RUSTUP_HOME="$PWD/.rustup"
export RUSTUP_TOOLCHAIN=stable-aarch64-apple-darwin
```

The inherited global Cargo cache was read-only; the first invocation failed to
write a downloaded dependency there. Subsequent commands used the existing local
Cargo cache/toolchain. No dependency version was changed. `.cargo/config.toml`
sets `--cfg near` only for the Wasm target, as required by this near-sdk release.

## Final executed native checks

`cargo fmt --all` and `cargo fmt --all --check`: exit 0.

`cargo clippy --locked --workspace --all-targets --all-features -- -D warnings`:
exit 0, including policy, integration harness and mock signer. Clippy's three
initial style findings were fixed without suppressions.

`cargo test --locked`:

```text
test result: ok. 71 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.99s
```

`cargo test --locked --features test-utils`:

```text
test result: ok. 71 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.28s
```

Both doc-test runs also passed (0 tests). These are the same policy tests under
the two feature configurations, not 142 distinct cases. The logs are retained in
`target/default-tests.log`, `target/test-utils-tests.log` and `target/clippy.log`.

`hl_digest::tests::golden_vectors_all_supported_types` checks **18 supported
vectors** from `fixtures/hyperliquid-signing-vectors.json`: 16 L1 action hashes
and digests plus two withdraw3 digests. This covers both network domain sources,
limit/trigger orders, optional cloid, cancel/cancelByCloid, vault flag/address,
expiry and MessagePack integer boundaries. Unsupported approveAgent/usdSend
vectors are skipped. Separate tests check exact noop MessagePack, expiry binding,
canonical decimals and rejection of unsafe integers. No placeholder feature remains.

Controller tests execute same-block nonce allocation, failure/no-reuse, overflow
and clock drift, keeper block/window/outstanding budgets, separate owner/public
capacity, original-nonce invalidation retry/confirmation/failure/expiry,
pause-discarded and late callbacks, local deadlines for missing callbacks,
partial/full settlement, retained churn charges and released backing. The README
rule-to-test table names the tests for each policy rule.

## Executed local sandbox checks

The user explicitly authorized disposable localhost sandbox credentials for this
run. near-workspaces generated and managed them in the external temporary data
directory; no key material was printed or stored in the repository. The harness
checks the canonical TMPDIR against the repository root and verifies loopback RPC.
The sandbox installs the policy and a clearly labelled mock signer/token receiver
only into a disposable local chain.

```sh
cargo build --locked --release --target wasm32-unknown-unknown --features test-utils --workspace
TMPDIR=/private/tmp COUNTERWEIGHT_ALLOW_DISPOSABLE_SANDBOX_KEYS=1 \
  cargo test --locked --features sandbox-tests --test sandbox -- --test-threads=1
```

The first integration run was **12 passed, 1 failed**: the inherited dead-man case
assumed 1,000 sandbox blocks advanced at least 600 seconds. It did not. The test
now polls observed chain timestamps while advancing blocks; the contract timeout
was not weakened. A new native regression also initially needed its mock gas
context reset between separate calls. A mock token receiver's payable method was
corrected to use a mutable receiver before successful Wasm compilation.

The subsequent complete integration run executed all original nine cases and
six additions:

```text
test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 249.53s
```

The additions cover real order/cancel/withdraw digests and expiries, per-nonce
pause invalidation and rejection/confirmation/expiry, failed-signing budget
exhaustion with owner emergency capacity, full settlement and reopening,
partial settlement with successful surplus spot withdrawal, and outstanding-cap
rejection with transactional nonce rollback. Same-block allocation and exact
expiry/rate-window boundaries are also covered in native contract-context tests.

Final-source rerun (exit 0), after the codec style fixes and stricter repository-wide
TMPDIR guard:

```text
test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 258.28s
```

Its complete case results are retained in `target/sandbox-tests.log`.

## Default release artifact

```sh
cargo build --locked --release --target wasm32-unknown-unknown \
  --target-dir target/production -p counterweight-policy
python3 tests/check_default_exports.py target/production/wasm32-unknown-unknown/release/counterweight_policy.wasm
python3 tests/check_default_exports.py artifacts/counterweight_policy.wasm
```

Both export checks passed:

```text
default Wasm exports: ok; 19 required methods; no test-only or raw-signing methods
```

The isolated production target directory prevents the default build from replacing
the sandbox test-utils Wasm during integration execution. The default Wasm was
copied to `artifacts/counterweight_policy.wasm`, its SHA-256 recorded in
`artifacts/SHA256SUMS`, and the obsolete signing-disabled artifact removed.
No placeholder or test-utils feature is enabled in this release artifact.
The SHA-256 manifest was independently verified:

```text
e3748857e0ecc5124dc594036945e230af24403c272ce10ecab041190ae1cedf  artifacts/counterweight_policy.wasm
```

## Remaining proof boundary

The mock signer fabricates public signature-shaped bytes; it does not perform
MPC, ECDSA recovery or venue authentication. No accepted Hyperliquid action, live
fill, real-token custody, key removal or immutable deployment proof is claimed.
Owner settlement and invalidation acceptance are explicit trusted attestations,
not cryptographic venue proofs. Settlement waits beyond every opening expiry;
close signatures alone never release backing or daily usage. A false owner
position observation can understate exposure.

Live signer gas/deposit sufficiency, venue price precision, market-index/delisting
checks, expiresAfter enforcement and noop acceptance remain unverified. Callback
shape checking is not signer recovery verification. withdraw3 has no venue
expiry; its local timeout only releases the operation slot and cannot revoke
public signer receipts. A missing token-transfer callback retains its slot to
avoid unsafe balance restoration. No public deployment was requested or performed.
