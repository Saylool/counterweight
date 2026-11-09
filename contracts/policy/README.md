# Counterweight policy contract — Day 1, testnet only

This crate implements the authority boundary in `docs/DESIGN.md` Part B and the
T1 contract scope. It has **not been deployed**. Nothing here proves a live MPC
signature, Hyperliquid authentication, an order fill, or immutable custody.

Validation in this session: 28 default unit tests and 43 placeholder-enabled unit
tests passed; release Wasm, export checks, formatting and Clippy passed. The nine
sandbox cases **compile but have not been executed**: their disposable synthetic
credentials conflict with the user's no-private-keys rule, and the requested
exception is still unanswered. See `TEST_RESULTS.md` for exact summary lines.

`near-sdk = 5.30.1` is pinned to the current stable 5.x release, checked on
2026-11-09 against the crates.io registry (`cargo info near-sdk@5.30.1`),
[package](https://crates.io/crates/near-sdk/5.30.1), and
[upstream releases](https://github.com/near/near-sdk-rs/releases).
`near-workspaces = 0.24.0` is pinned as an optional native test dependency.
The Cargo.lock, cdylib/rlib outputs, overflow-checked release profile and isolated
workspace follow cargo-near project conventions. Rust 1.95+ is required.

## Build and test

Run from `contracts/policy/`. These commands use no wallet credentials. The
unit tests use NEAR's in-memory context and require no transaction signing.

```sh
mkdir -p .cargo-home .tmp
export CARGO_HOME="$PWD/.cargo-home"
export TMPDIR="$PWD/.tmp"
cargo test --locked
cargo test --locked --features day1-placeholder-digest,test-utils
cargo fmt --all --check
cargo clippy --locked --all-targets --features day1-placeholder-digest,test-utils -- -D warnings
```

Install the `wasm32-unknown-unknown` standard-library target using rustup if
necessary. If installation must stay inside this directory, use a local
`RUSTUP_HOME` with a toolchain installed/copied there. In this session a local
toolchain copy is under `.rustup/`; select it with:

```sh
export RUSTUP_HOME="$PWD/.rustup"
export RUSTUP_TOOLCHAIN=stable-aarch64-apple-darwin
```

Build a default, **signing-disabled** artifact:

```sh
cargo build --locked --release --target wasm32-unknown-unknown -p counterweight-policy
python3 tests/check_default_exports.py target/wasm32-unknown-unknown/release/counterweight_policy.wasm
# With cargo-near installed, the conventional equivalent is:
cargo near build non-reproducible-wasm --no-abi
```

The raw Cargo artifact is
`target/wasm32-unknown-unknown/release/counterweight_policy.wasm`.
`artifacts/counterweight_policy.signing-disabled.wasm` and `artifacts/SHA256SUMS`
contain the checked default artifact. Neither test feature is enabled in it.

Sandbox integration uses **only a local disposable chain** and a clearly labelled
mock signer. near-workspaces internally manages synthetic test keys; it does not
use the user's wallet, keychain, credentials directory, or a public network.
This execution is gated on explicit permission for those synthetic keys. Do not
set the opt-in under an unqualified prohibition on creating/reading private keys.
The test harness never prints or directly handles key material.

```sh
# Compile the harness without starting a chain or creating test accounts:
cargo test --locked --features sandbox-tests --test sandbox --no-run

# Only after permission for disposable sandbox credentials:
cargo build --locked --release --target wasm32-unknown-unknown \
  --features day1-placeholder-digest,test-utils \
  -p counterweight-policy -p counterweight-mock-signer
COUNTERWEIGHT_ALLOW_DISPOSABLE_SANDBOX_KEYS=1 \
  cargo test --locked --features sandbox-tests --test sandbox -- --test-threads=1
```

The sandbox harness runs Wasm and actual asynchronous receipts, including signer
failures and malformed responses. The mock signer returns fabricated public
signature-shaped bytes; it performs **no cryptographic signing**. It is not an
MPC emulator. Its deliberately unauthenticated `set_mode` exists only in the
separate mock crate. Sandbox setup installs code only into the disposable local
chain. No public-chain deployment command is supplied here.

## Interface and units

Initialize from the owner account with `new(owner, keeper, asset_index,
size_decimals, derivation_path, evm_recipient, signer_account, wnear_account,
limits, heartbeat_timeout_seconds, reference_price)`.

* `coin` is always `NEAR`. Owner, market index, lot precision, derivation path,
  signer, token contract and recipients are fixed at initialization. NEAR
  withdrawals always use the owner account; EVM addresses are validated and
  normalized. Use **`v1.signer-prod.testnet`**, as corrected in `docs/TESTNET.md`.
  The production initializer accepts `.testnet` contract/signer/token accounts
  only; `test-utils` additionally accepts local `.test.near` accounts.
* Quantities use **24-decimal wNEAR base units** (`10^24 = 1 NEAR`), including
  `max_short_size`, deposits, and order size. An order must be an exact multiple
  of the initialized market's `size_decimals` lot (0–8); no silent rounding.
* Prices and notional caps use **USD micro-units** (`5_000_000 = $5/NEAR`).
  Per-order policy notional is rounded up at the reference's **upper band**,
  including for sell opens. Daily usage is the sum of those charges, by UTC day.
  This is a reference-based risk budget, not a guarantee about venue execution
  notional when a sell fills at a better price.
* Owner `set_config` can change keeper, limits and heartbeat timeout while idle.
  It cannot reset usage, signed size, cooldown or heartbeat. Only owner can
  `set_paused`, including unpause. `set_reference_price` is an explicitly
  **owner-approved observation**, with an on-chain timestamp and configured
  staleness threshold. A keeper-supplied price cannot redefine its own band.
* Owner deposits via the configured wNEAR's `ft_transfer_call` with empty `msg`.
  `ft_on_transfer` authenticates the predecessor token and owner sender.
  `test_only_set_spot_balance` is owner-only and absent without `test-utils`.
* Keeper calls `request_order_signature({asset_index, size, reduce_only})`.
  Opens are always sell IOC orders; closes are always buy IOC with `r=true`.
  The contract builds the price from the owner reference and band. There is no
  caller-selectable side, price, TIF, nonce, destination, action blob or digest.
* Increases obey pause, maximum size, spot backing, per-order/day notional,
  cooldown, market, lot size, and price freshness. Reduce-only bypasses all
  increase-only limits, up to the signed short upper bound. Keeper heartbeat is
  a separate authenticated method; other actions do not refresh it.
* Anyone can `deleverage()` when heartbeat age is **at least** the timeout,
  signing a full-size reduce-only IOC. Pause and reference freshness cannot
  disable it. It still needs an idle operation slot, gas, and signer deposit.
  An IOC close is a marketable-limit approximation; a fill is never guaranteed.
* All signature requests attach exactly **1 yoctoNEAR** and **300 Tgas**. The
  contract forwards 1 yoctoNEAR and 250 Tgas to MPC, reserves 30 Tgas for its
  callback, and builds strictly increasing millisecond nonces. Order expiry is
  60 seconds after nonce; its final codec/venue behavior remains unverified.
* Owner `request_evm_withdrawal(recipient, amount)` builds a typed testnet
  `withdraw3` to the fixed EVM destination. Amount uses USDC micro-units. It
  remains available while paused and does not claim to prove withdrawable
  collateral. Owner `withdraw_spot(recipient, amount)` transfers **wNEAR**, not
  operating native NEAR, only to the owner, with 1 yoctoNEAR and at least 80 Tgas.
  Both reject any alternative recipient. There is no generic transfer/call,
  raw-hash signing, `usdSend`, `spotSend`, `approveAgent`, vault or upgrade method.

## Conservative accounting and asynchronous outcomes

`signed_short_size` is the **lifetime cumulative upper bound of requested opens**.
Reservation occurs before the signer receipt. Neither a successful close
signature nor a failed/malformed signing callback decreases it or refunds daily
usage/cooldown: neither proves that an opening signature was never released, nor
that a close filled. Thus `signed_short_size <= spot_balance` holds for signed
opens even when a keeper withholds or reorders submissions. There is deliberately
**no epoch reset or owner-reported fill method in Day 1**. The owner must not
initialize a reused derivation path with pre-existing external positions/signatures.

This conservative choice eventually exhausts the opening budget and encumbers
the matching spot **even after a real close**. Only surplus spot is withdrawable.
Unlocking it needs a separately designed, expiration-aware reconciliation/epoch
protocol; it must not be implemented by subtracting signed reduce-only quantities.
External fills, leverage, margin and spot-sale decisions remain off-chain.

One pending slot covers all signature and token-withdrawal operations, with
monotonic IDs and phase-bound private callbacks. Valid signer response clears the
slot and emits a signature event; it does not report a fill. Failure, malformed
data or oversized response marks signing **Uncertain**, emits a failure event,
and keeps reservations. Owner can explicitly `acknowledge_failed_signature(id)`
to clear only that uncertain slot, without releasing any risk budget. A keeper
cannot clear it. In-flight callbacks and mismatched/replayed IDs are rejected.
Token transfer failures restore the debited spot; successful transfers do not,
even when their return data is oversized. All state stays bounded in size.

Events follow NEP-297: `EVENT_JSON:`, standard `counterweight`, version `1.0.0`,
one-element `data` arrays. Events cover request payload/digest/ID, public
signature, failure, reconciliation, pause, withdrawal, deposit, config, price and
heartbeat. Rejected transactions produce no successful request event.

## What is stubbed and still risky

`src/hl_digest.rs` is the only digest boundary. The default returns
`ERR_HL_DIGEST_NOT_IMPLEMENTED`; **all signing, including reductions and EVM
withdrawals, is disabled**. Feature `day1-placeholder-digest` instead hashes a
domain-labelled JSON payload with SHA-256. Its name is
`TEST_ONLY_NOT_A_HYPERLIQUID_DIGEST` and appears in request events. It is not
Hyperliquid MessagePack/Keccak/EIP-712 and cannot be represented as a valid venue
signature. Replace it using the TS engineer's
`fixtures/hyperliquid-signing-vectors.json`; order and withdraw domains differ.
No golden-vector parity is claimed by this crate yet.

The signer callback checks bounded JSON and ECDSA response shape, not
cryptographic recovery or venue acceptance. Final work also includes exact venue
price precision, live market-index/delisting verification by the keeper,
expiry support, signer gas/deposit sufficiency, and external reconciliation.
Owner prices are not an oracle; stale prices can prevent reduce-only IOC fills.
An uncertain or missing callback can block subsequent de-risking until owner
recovery; there is no unsafe automatic timeout that pretends signing never
happened. No live full-access-key removal or code-hash verification has occurred.
Account suffix checking is a testnet guard, not cryptographic network attestation.

For the **unit-test example**, reference $5, 100 bps band, $10.10/order and
$20.20/day policy notional, a same-reference churn estimate with 4.5 bps taker
fees is `$20.20 * (2 * 0.00045 + 2 * 0.01) = $0.42218/day`, plus gas/signing.
This is an illustrative fee/slippage estimate under a fixed reference, not a
complete loss bound: market moves, changed references, venue failures, margin
loss and unavailable fills are excluded. No deployed configuration exists.

## Rule → tests

Unit test names below omit the `tests::` / `tests::placeholder::` prefixes.
The `placeholder` cases need `day1-placeholder-digest`; sandbox cases need the
explicit disposable-credentials opt-in. Compilation alone is not a sandbox pass.

| Rule | Unit test(s) | Sandbox integration test |
|---|---|---|
| Owner-only config; fixed identity and no usage reset | `owner_only_config`, `owner_config_preserves_identity_and_counters` | `sandbox_owner_only_config` |
| Fixed NEAR/EVM recipients; owner withdrawals | `rejects_near_recipient`, `rejects_evm_recipient`, `keeper_cannot_withdraw` | `sandbox_fixed_recipient_rejection` |
| Authentic owner wNEAR deposits | `authenticated_wnear_deposit`, `rejects_fake_token`, `rejects_nonowner_deposit` | — |
| Per-order/day caps and cooldown | `keeper_per_order_cap`, `keeper_daily_cap`, `keeper_cooldown` | `sandbox_keeper_caps_and_cooldown` |
| Reduce-only bypasses increase limits; never frees budget | `reductions_ignore_caps_cooldown_pause_and_stale_price`, `reductions_never_recycle_signed_open_budget` | `sandbox_reduce_always_allowed_and_budget_not_recycled` |
| Signed opens ≤ held spot; maximum size | `short_never_exceeds_spot`, `max_short_cap`, `cannot_withdraw_encumbered_spot` | `sandbox_short_spot_invariant` |
| Pause blocks opens, allows closes; only owner can unpause | `pause_blocks_increases`, `keeper_cannot_unpause`, `pause_emits_nep297` | `sandbox_pause_blocks_increases_not_reductions` |
| Anyone closes after timeout; only keeper heartbeats | `anyone_deleverages_after_timeout_even_paused`, `public_deleverage_requires_timeout`, `stranger_cannot_refresh_heartbeat` | `sandbox_public_heartbeat_timeout_deleverage` |
| Typed market/lot/IOC/band and trusted price | `typed_ioc_price_band_and_mpc_request`, `rejects_other_market`, `rejects_quantity_rounding`, `stale_reference_blocks_increases` | cap and reduction cases above |
| One pending operation; monotonic IDs | `duplicate_pending_operation_rejected`, `withdrawal_cannot_overlap_order`, `failed_callback_retains_reservation_until_owner_ack` | `sandbox_pending_duplicate_and_failed_callback` |
| Failed/malformed/oversized callbacks retain reservations | `malformed_callback_is_uncertain`, `oversized_signature_callback_is_uncertain`, `cannot_ack_inflight_operation` | `sandbox_pending_duplicate_and_failed_callback`, `sandbox_malformed_callback_and_private_endpoint` |
| Private, non-replayable, operation-bound callbacks | `callbacks_are_private`, `stale_callback_id_rejected`, `completed_callback_cannot_replay` | `sandbox_malformed_callback_and_private_endpoint` |
| Failed token transfer restores ledger; success never double-credits | `failed_spot_transfer_restores_ledger`, `successful_spot_transfer_does_not_restore_ledger_for_large_return` | — |
| UTC day rollover does not reset lifetime bound | `utc_day_rollover_preserves_lifetime_budget` | — |
| Default artifact cannot sign placeholder bytes | `default_build_refuses_placeholder_signing` | default artifact export inspection |

Counterweight is open-source, non-custodial software instantiated directly by each user. It is not a fund, custodian, broker, exchange, or investment advisor, and does not pool funds, promise returns, or provide trading signals. Perpetual funding rates can turn negative and reduce principal; smart-contract, cross-chain settlement, and venue execution risks apply.
