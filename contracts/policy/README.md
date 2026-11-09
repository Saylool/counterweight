# Counterweight policy contract — testnet only

Implements `docs/DESIGN.md` Part B and `docs/DESIGN-NOTES.md`. All signing uses
real Hyperliquid digests; the placeholder feature has been removed. This contract
has not been deployed to a public network. Local sandbox installation is test-only.
See [TEST_RESULTS.md](TEST_RESULTS.md) for executed commands and results.

## Build and reproduce

Requires Rust 1.95+, `wasm32-unknown-unknown`, pinned near-sdk 5.30.1 and
near-workspaces 0.24.0. Run from `contracts/policy/`. `.cargo/config.toml` supplies
near-sdk's `cfg(near)` only for Wasm, preserving the native in-memory test host.
If the default Cargo home is read-only, use `export CARGO_HOME="$PWD/.cargo-home"`.
The existing local toolchain can be selected with `RUSTUP_HOME="$PWD/.rustup"`
and `RUSTUP_TOOLCHAIN=stable-aarch64-apple-darwin`.

```sh
cargo fmt --all --check
cargo clippy --locked --workspace --all-targets --all-features -- -D warnings
cargo test --locked
cargo test --locked --features test-utils
cargo build --locked --release --target wasm32-unknown-unknown -p counterweight-policy
python3 tests/check_default_exports.py target/wasm32-unknown-unknown/release/counterweight_policy.wasm
```

`artifacts/counterweight_policy.wasm` is the default artifact, with SHA-256 in
`artifacts/SHA256SUMS`. Its exports exclude test setters and arbitrary signing.
Do not use a `test-utils` artifact for custody.

The authorized integration harness uses disposable LOCAL sandbox credentials
managed by near-workspaces, with its data directory outside the repository and
RPC on `127.0.0.1`. It never prints keys or accesses wallet/testnet/mainnet keys.
Do not set TMPDIR inside the repository. Sandbox artifacts and the signer are
explicit mocks; no actual ECDSA signatures or venue fills are produced.

```sh
cargo build --locked --release --target wasm32-unknown-unknown --features test-utils --workspace
TMPDIR=/private/tmp COUNTERWEIGHT_ALLOW_DISPOSABLE_SANDBOX_KEYS=1 \
  cargo test --locked --features sandbox-tests --test sandbox -- --test-threads=1
```

## Authority and payloads

Owner initialization fixes the NEAR/wNEAR/signer identities, market index,
size precision, derivation path and owner EVM recipient. The contract accepts
only testnet-style accounts (local `.test.near` accounts require `test-utils`).
The owner may change keeper/risk limits, heartbeat timeout and reference price,
but cannot change these fixed identities or reset charged daily usage through
configuration. The owner must initialize a fresh derivation path with no external
positions or outstanding signatures.

The configured token's `ft_on_transfer` accepts only owner deposits with empty
`msg`. Spot is accounted in 24-decimal wNEAR units. Keeper inputs contain only
market, size and reduce-only status. Opens are sell IOC orders, reductions buy
IOC orders with `r=true`; the contract builds prices from the owner reference and
price band. Orders must match lot precision. Opens obey backing, maximum short,
per-order/day notional, cooldown and price freshness. Notional is rounded upward
at the upper price band. There is no caller-selected nonce, expiry, vault, price,
side, destination, arbitrary action or raw digest.

The keeper may request fixed-market order-ID cancellations. The codec also
covers trigger orders and cancel-by-cloid vectors, but those have no controller
entry point. Owner-only `request_evm_withdrawal` constructs `withdraw3` to the
fixed lowercase EVM recipient using USDC micro-units. This is more restrictive
than Part B's optional keeper withdrawal authority. `withdraw_spot` transfers
only surplus wNEAR to the owner, with at least 80 Tgas and exactly 1 yoctoNEAR.
No `usdSend`, `spotSend`, `approveAgent`, vault transfer or upgrade is exposed.

Each signing request requires 300 Tgas and exactly 1 yoctoNEAR; 250 Tgas and the
1 yoctoNEAR go to the signer, with 30 Tgas reserved for the callback. Heartbeats
are separately authenticated and are not refreshed by trading. After the timeout,
anyone can request a reduce-only full-size IOC through `deleverage`. Owner
`emergency_reduce` bypasses increase limits and can detach a stuck signing slot.
Public callers can preempt keeper signing, but cannot detach a fresh owner
emergency/invalidation. They can recover its slot after the local deadline.
An unresolved token-transfer callback retains its slot to prevent double credit.

## Digests, nonces, expiry and capacity

`hl_digest` explicitly encodes SDK MessagePack field order, minimal unsigned
integers, canonical normalized decimal strings, optional cloid and trigger order
fields. It hashes action bytes + big-endian nonce + vault flag/address + optional
expiry marker/time, then the phantom-agent EIP-712 domain (`Exchange`, 1337,
source `b` for testnet). `withdraw3` uses its distinct `HyperliquidSignTransaction`
domain, chain 421614 and Withdraw struct. Noncanonical decimals and integers
outside JavaScript's safe range are rejected. Controller integer amounts are
formatted without floating point or trailing fractional zeroes.

All 18 supported fixture vectors match action hashes (where present) and digests,
covering both domain sources, limits, triggers, cancels, cloids, vaults, expiry,
integer encoding boundaries and withdraw3. Mainnet vectors test the codec only;
controller authorization is testnet-only. Unsupported approveAgent/usdSend vectors
are intentionally excluded.

Fresh nonces are persisted atomically as `max(last_nonce + 1, block_timestamp_ms)`;
failed/malformed callbacks never roll them back. Every L1 request binds an expiry
at most 60 seconds after allocation wall time, rechecked before emitting the
callback signature. Local callback deadlines also bound withdraw3 slot recovery;
withdraw3 itself has no venue expiry. Reservations survive all failures/timeouts.

Immutable initializer `signing_limits` defaults:

| Parameter | Default | Permitted range |
|---|---:|---:|
| Keeper authorizations per block | 2 | 1–4 |
| Keeper authorizations per rolling 60 seconds | 8 | 1–8 |
| Unexpired keeper authorizations | 8 | 1–8 |
| Owner authorizations per rolling 60 seconds | 16 | 10–16 |
| Window duration (ms) | 60000 | 60000 |
| Maximum nonce drift ahead of wall time (ms) | 1000 | 0–1000 |

Failures still consume signing capacity. Public dead-man requests have a separate
one-per-window budget. At most 32 outstanding L1 authorizations are retained;
expired entries and rolling counters are pruned. Owner capacity is independent
of keeper/public budgets, including invalidation requests.

## Pause and asynchronous recovery

Pause stops every keeper signing entry point, including reductions, and discards
pending keeper callbacks. Owner emergency reductions and public dead-man recovery
remain available. All existing unexpired L1 nonces are marked for invalidation.
Pause requests the first `noop` using the **original nonce** and its original
expiry; `request_next_invalidation` processes the remaining bounded queue. These
requests do not advance `last_nonce`. Failure or interruption makes the nonce
retryable. Newer nonces alone never count as revoking older signatures.

`report_invalidation` accepts only owner attestations after the corresponding
noop has been signed. A failed report permits retry. Pause remains incomplete
and unpause is rejected until every marked nonce is confirmed consumed or expires.
Expiry is a deterministic alternative to manual confirmation. If owner capacity
is exhausted or a token transfer is pending, local pause still commits; invalidation
continues when capacity/the slot becomes available. A contract cannot relay a
Hyperliquid HTTP request: the owner/relayer must submit the emitted noop and
attest venue acceptance. Issuance alone does not establish revocation.

Successful signing emits a bounded, shape-validated response and frees the slot.
Failed, malformed or oversized callbacks free the slot automatically while
retaining exposure, daily usage, cooldown, nonce and authorization reservations.
Anyone can clear an expired signing slot with `expire_pending_signature`.
Late/replayed/detached signature callbacks return false and cannot affect a newer
operation. Private token callbacks restore spot only on transfer failure, never
on successful oversized return data. Events use NEP-297 `EVENT_JSON`, standard
`counterweight`, version `1.0.0`.

## Releasing backing after reductions

A signed close is not a fill: it cannot safely release opening budget or spot.
`signed_short_size` bounds reserved/current exposure; `lifetime_opened` is
cumulative telemetry. `settle_position(short_size, observed_at_ms)` provides an
explicit owner-approved reconciliation/epoch boundary after closes or partial
closes. Every opening authorization must have expired before both observation
and settlement; the observation must be at most 30 seconds old and not future
dated. No operation may still be pending. A newer opening restarts this barrier.
The owner may only decrease the exposure bound to an exact-lot observed size.

Settlement releases the matching spot encumbrance and opening capacity, allowing
reopening or owner spot withdrawal. It never refunds daily churn usage or
cooldown. The keeper and signing callbacks cannot attest fills or recycle budget.
This is a trusted owner observation, not an on-chain venue-position proof; a false
owner observation can understate external exposure. Automatic release from a close
signature would allow withheld/reordered opens to violate the hedge invariant.

## Rule → executed tests

Unit names omit `tests::`; names in the `signing` module carry that prefix.
Every sandbox case in this table is executed, including the original nine.

| Rule | Unit tests | Sandbox integration |
|---|---|---|
| Owner-only config; fixed identity/counters | `owner_only_config`, `owner_config_preserves_identity_and_counters` | `sandbox_owner_only_config` |
| Fixed withdrawal recipients/authentication | `rejects_near_recipient`, `rejects_evm_recipient`, `keeper_cannot_withdraw` | `sandbox_fixed_recipient_rejection` |
| Authentic owner deposits | `authenticated_wnear_deposit`, `rejects_fake_token`, `rejects_nonowner_deposit` | — |
| Open caps/cooldown/market/lot/band | `keeper_per_order_cap`, `signing::keeper_daily_cap`, `signing::keeper_cooldown`, `rejects_other_market`, `rejects_quantity_rounding`, `signing::typed_ioc_price_band_and_mpc_request` | `sandbox_keeper_caps_and_cooldown` |
| Signed short never exceeds held spot | `short_never_exceeds_spot`, `max_short_cap`, `cannot_withdraw_encumbered_spot` | `sandbox_short_spot_invariant` |
| Reduction signatures never pretend fills | `signing::reductions_never_recycle_signed_open_budget` | `sandbox_reduce_signatures_do_not_prove_fills` |
| Partial/full settlement releases only matching backing; daily usage survives | `settlement_releases_partial_and_full_backing_but_never_daily_churn_budget`, `settlement_rejects_keeper_stale_observation_and_unexpired_open_replay`, `settlement_cannot_ignore_a_newer_open_authorization` | `sandbox_settlement_releases_backing_and_opening_capacity_after_expiry`, `sandbox_partial_settlement_releases_only_matching_spot` |
| Pause blocks keeper, preserves owner emergency | `pause_blocks_all_keeper_signing_but_owner_can_reduce`, `keeper_cannot_unpause` | `sandbox_pause_blocks_keeper_but_allows_owner_emergency` |
| Heartbeat dead-man path and separate public budget | `signing::anyone_deleverages_after_timeout_even_paused`, `public_deleverage_requires_timeout`, `stranger_cannot_refresh_heartbeat`, `public_rate_limit_cannot_consume_owner_capacity` | `sandbox_public_heartbeat_timeout_deleverage` |
| Exact codec/normalized decimals/nonce/expiry | `hl_digest::tests::golden_vectors_all_supported_types`, `hl_digest::tests::canonical_decimal_validation`, `hl_digest::tests::unsafe_integer_and_noncanonical_inputs_fail_closed`, `same_block_nonce_allocation_and_failed_callback_never_reuse`, `nonce_cannot_drift_ahead_of_clock`, `nonce_overflow_fails_closed` | `sandbox_real_order_cancel_withdraw_digests_and_expiries` |
| Keeper block/window/outstanding caps; owner reserved capacity; transactional rollback | `keeper_block_limit_and_owner_reserved_emergency`, `keeper_rolling_budget_counts_failed_requests_and_expires_at_boundary`, `keeper_outstanding_cap_keeps_invalidation_capacity` | `sandbox_failed_signing_budget_exhaustion_preserves_owner_emergency`, `sandbox_outstanding_limit_and_failed_transaction_do_not_advance_nonce` |
| Original-nonce invalidations, confirmation/retry/expiry | `pause_invalidates_each_original_nonce_and_confirmation_controls_completion`, `pause_discards_inflight_keeper_callback_and_retries_failed_invalidation`, `withheld_signature_keeps_pause_incomplete_until_expiry_without_confirmation`, `interrupted_invalidation_can_retry_same_nonce`, `pause_also_tracks_existing_owner_and_public_l1_authorizations` | `sandbox_pause_invalidates_all_nonces_confirmation_failure_and_expiry` |
| Local pause survives blocked invalidation capacity/slot | `exhausted_owner_budget_still_commits_local_pause_and_discards_keeper_callback`, `pause_commits_during_token_transfer_and_preserves_its_callback` | — |
| One operation; failed/malformed/oversized callbacks recover without acknowledgement | `signing::duplicate_pending_operation_rejected`, `signing::failed_callback_retains_reservation_without_owner_ack`, `signing::malformed_callback_is_uncertain`, `signing::oversized_signature_callback_is_uncertain` | `sandbox_pending_duplicate_and_failed_callback`, `sandbox_malformed_callback_and_private_endpoint` |
| Timeout/late callback cannot clear newer slot; public cannot interrupt owner | `expired_callback_is_discarded_and_missing_callback_recovers_permissionlessly`, `signer_success_after_expiry_never_emits_signature`, `emergency_detaches_stuck_signer_and_late_callback_cannot_clear_new_slot`, `missing_withdraw_callback_expires_locally_without_reusing_its_nonce`, `public_cannot_interrupt_owner_emergency_or_invalidation` | — |
| Token failure restores ledger; success never double credits | `failed_spot_transfer_restores_ledger`, `successful_spot_transfer_does_not_restore_ledger_for_large_return` | `sandbox_partial_settlement_releases_only_matching_spot` |
| Private callbacks and bounded ABI | `callbacks_are_private`, `signing::stale_callback_id_rejected`, `signing::completed_callback_cannot_replay` | `sandbox_malformed_callback_and_private_endpoint`; default Wasm export check |

## Remaining proof boundary

The signer callback checks response shape, not ECDSA recovery. Mock sandbox
success proves receipt/state behavior, not a valid MPC signature or venue
acceptance. Live gas/deposit sufficiency, venue price precision, market-index and
delisting verification, expiry enforcement, noop acceptance, fills and immutable
custody/key removal still require public testnet evidence. A local deadline does
not revoke an already-public MPC response. Owner prices are not an oracle and
stale prices can prevent IOC fills. wNEAR spot sale remains owner-approved.

For the unit-test reference ($5 price, 100 bps band, $10.10/order and $20.20/day),
a fixed-reference churn estimate at 4.5 bps taker fees is
`$20.20 × (2 × 0.00045 + 2 × 0.01) = $0.42218/day`, plus signing/gas.
This excludes market moves, margin losses, reference changes and unavailable fills;
it is not a complete financial loss bound or a deployed configuration.

Counterweight is user-instantiated software, not a fund, broker, exchange or
investment advisor. It does not pool funds or promise returns. Funding can turn
negative; contract, venue and cross-chain settlement risks apply.
