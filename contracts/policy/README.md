# Counterweight policy contract — testnet only

Implements DESIGN Part B custody tiers and the owner-approved rebalancing revision
in [DESIGN-NOTES](../../docs/DESIGN-NOTES.md). The previous artifact was deployed on testnet by the team lead; this updated
artifact has not been deployed. Sandbox signer/token/route behavior is mocked;
there are no real MPC signatures or venue fills. See [TEST_RESULTS](TEST_RESULTS.md).

Owner-run testnet deployment commands and public-RPC verification are in
[TESTNET-DEPLOYMENT](../../docs/TESTNET-DEPLOYMENT.md). `npm run testnet:plan`
prints keychain-signing commands only; `npm run prove:contract -- --tx=...` checks
the actual contract's public events before relaying a harmless testnet cancellation.

## Reproduce

Run **from `contracts/policy/`**: Cargo discovers `.cargo/config.toml` from the
working directory, not the manifest path. It supplies target-specific `cfg(near)`
for near-sdk 5.30.1. Rust 1.95+ and wasm32-unknown-unknown are required.

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

The harness checks that TMPDIR is outside the repository and RPC is loopback.
near-workspaces alone manages disposable local sandbox keys. Never print keys.
The default artifact is `artifacts/counterweight_policy.wasm`; test-utils setters
are absent from it. Sandbox contracts and artifacts must never custody funds.

From the repository root, the key-free SDK generator and scoped relay check are:

```sh
.tmp/sdk-venv/bin/python contracts/policy/tools/generate-signing-vectors.py
node_modules/.bin/tsx contracts/policy/relay/noop.test.ts
PYTHONDONTWRITEBYTECODE=1 python3 contracts/policy/tools/test_custody_keys.py
```

Generation requires pinned dependencies from `scripts/requirements-signing-vectors.txt`.
It writes only the contract-local fixture. There are 28 SDK vectors: Rust checks
22 supported vectors, including four noop cases; approveAgent/usdSend are codec
interoperability fixtures and have no controller signing entry point.

## Authority, prices, and accounting

Initialization fixes owner, market/precision, signer, wNEAR, derivation path and
EVM withdrawal recipient. Production accepts testnet account names only;
`.test.near` is enabled solely by test-utils. Verify NEAR metadata before funding:
read-only venue metadata on 2026-11-10 Istanbul time reported testnet index 54,
mainnet index 74, `szDecimals=1` ([captured metadata](fixtures/near-market-meta.json)). Historical index 4 / precision 2 tests are mocks.

Only owner deposits through the configured token with empty `msg` increase spot.
Keeper opens are fixed-market sell IOC, bounded by held spot, reserved short,
per-order and rolling-24h notional, cooldown, and fresh owner price. Opens cannot
supply prices. Signing counts reservations, not fills. Failed malformed/missing
callbacks retain exposure; a **definite failed signer receipt** releases its
opening exposure, while keeping turnover/cooldown/nonce charges.

Keeper reductions require `order.reference_price`; owner
`emergency_reduce(size, price)` and public `deleverage(price)` also take micro-USD
marks bounded to $0.00001–$1,000,000. These buy IOC orders apply a 50% band and
`r=true`, independently of owner price freshness. There is no local exposure-size
ceiling on reductions. Public recovery requests at least the configured maximum
short size, permitting residual recovery after an understated settlement.
Prices floor for sells and ceil for buys to the official five-significant-digit
and `6 - szDecimals` tick rules; integer prices follow the venue exception.
[Official tick source](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size).
Liquidity, mark accuracy and a move outside the band can still prevent an IOC fill.

`settle_position` is a fresh, expiry-gated **owner position attestation**, never a
signature-as-fill inference. It releases matching backing without refunding churn.
A false owner observation can understate external exposure; reduce-only recovery
remains usable even then. Pause first, then wait for opening expiry to prevent a
keeper from extending the settlement barrier. Owner config/spot withdrawal expire
stale signing slots and can preempt keeper cancels. Token-transfer slots retain
their callbacks to prevent double credit.

## Signing, pause, resources, and custody

Fresh nonces are persisted as `max(last_nonce+1, block_timestamp_ms)`. L1 expiry is
at most 60 seconds; withdraw3 instead has a 60-second local callback deadline and
is tracked through its two-day nonce replay horizon. At most 32 outstanding
authorizations are retained; invalidations still work with a full queue.

SigningLimits defaults: keeper 2/block, 8/rolling-minute, 8 outstanding; owner
16/rolling-minute (permitted 10–16); public 1/minute; window 60,000ms;
nonce-ahead drift 1,000ms (permitted 20–1,000). Every keeper **and public**
authorization additionally costs five units of a cumulative address allowance,
default/max 5,000. Owner alone can grant another epoch after verifying actual
venue capacity. No automatic volume credit or daily reset exists. Owner emergency
and invalidation capacity is separate. The budget bounds authorizations, not
repeated relaying of public signatures.
[Venue address budget source](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits).

Owner `set_signing_resources` configures fee and signer/callback gas. Defaults are
1 yoctoNEAR, 230/30 Tgas, plus 25 Tgas execution reserve: 285 Tgas total. Signing
accepts zero deposit and pays from its own operating balance, capped at 0.01 NEAR
per authorization while preserving storage stake + 128 KiB growth. A positive
deposit must cover the whole fee; excess is refunded to the caller. Existing rate,
caller and cumulative address budgets also bound reserve-funded requests. Spot transfers require
exactly 1 yoctoNEAR and 80 Tgas. Native sweep retains storage stake + 128 KiB future
state reserve + 1 NEAR, and sends only to the owner.

Pause commits with no deposit/low gas, blocks keeper signing, discards its local
callback, and queues original-nonce noop invalidations. Emergency/public recovery
also pause and mark keeper nonces. A newer nonce never proves revocation. The
owner must relay each noop and attest consumption; unpause waits for confirmed
consumption or expiry. Withdrawals require zero reserved short, configured margin
limits/observations, and resolution of earlier withdrawals before retry.

The policy-scoped relay is [relay/signing.ts](relay/signing.ts). The unchanged
repository-wide codec outside this task's write scope does not accept noop;
policy invalidation consumers must use the scoped module. `noop.test.ts` compares
SDK vectors and assembles a real unit-host pause request with the public MPC fixture.
It constructs wire bytes only; it never relays to a network.

Before funding a strategy, require zero access keys at finality:
`python3 tools/check_custody_keys.py --rpc <RPC> --account <POLICY>`.
The contract cannot inspect access keys. A remaining full-access or direct-signer
function-call key can bypass policy. Market/path/account/recipient changes require
a fresh controller. No upgrade, arbitrary digest, approveAgent, usdSend, spotSend,
vault, or keeper recipient override is exposed.

## Owner-approved rebalancing

`configure_rebalancing` fixes the adapter and actual HyperCore USDC asset ID,
strategy margin address, source account/token, per-action/rolling sale and
withdrawal caps, fees/impact, quote age/deadline, completion timeout, maximum NEAR
mismatch, original inventory/dollar ceiling, equity/fee reserves, and H bands.
There is no recipient-change method. Policy USDC amounts use 6 decimals; the fixed 1Click asset uses 8. The adapter must
convert micro-units exactly by multiplying by 100. The separate adapter must be audited before
external use; the included implementation in tests is a mock.

`approve_spot_sale` requires exact owner approval and already-reconciled matching
short reduction. It reserves spot and close quantities, then dispatches a typed
NEP-141 transfer_call to the fixed adapter. Its callback records used tokens;
failed/uncertain/expired routes retain reservations and pause. One pending route
blocks additions and withdrawals. Final owner-attested receipts reconcile actual
refunds and proportional minimum output, then credit only finalized margin.
Receipt hashes reject duplicates across route IDs; history is bounded to 1,024.

Margin withdrawals check zero short, fresh finalized equity and venue withdrawal
availability, fee reserve, residual equity, leverage <=1, per-action/rolling USDC
limits and minimum H (>=10%). The full withdrawal immediately leaves usable
margin. A final fixed-recipient receipt checks net+fee against the original amount
and fee cap. Re-entry then requires actual authenticated wNEAR deposits, fresh
marks, original inventory/dollar ceilings, $10 minimum adjustment, conservative
margin and improving lower/target/upper H bands. Pending proceeds are never spot
or margin. External receipt/fill/finality verification is explicitly owner-trusted.

## Rule → executed tests

Names omit `tests::`; `audit::` and `rebalance::` identify the new test modules.

| Rule / finding | Unit test(s) | Sandbox / other |
|---|---|---|
| H: stale-price close | `audit::audit_rally_closes_and_price_precision_matrix` | `sandbox_rally_precision_and_cumulative_address_budget` |
| H: tick / five significant digits | `audit::audit_nonround_near_price_obeys_ticks`, `audit::audit_open_price_rounding_nonround_bands_matrix` | rally test above; official SDK fixtures |
| H: timed-out withdraw3 revocation / retry | `audit::audit_withdraw_timeout_remains_revocable`, `audit::audit_withdraw_requires_invalidation_before_retry`, `audit::audit_withdraw_rejects_open_short` | `sandbox_withdrawal_nonce_requires_confirmed_invalidation` |
| H: understated settlement / residual close | `audit::audit_residual_reduce_after_understated_settlement`, `reduce_can_exceed_local_exposure_bound` | `sandbox_reduce_signatures_do_not_prove_fills` |
| H: cumulative address allowance | `audit::audit_cumulative_keeper_budget_reserves_owner_capacity` | `sandbox_rally_precision_and_cumulative_address_budget` |
| H: configurable MPC fee/gas / local pause | `audit::audit_configurable_mpc_fee_gas_and_refund`, `audit::audit_pause_without_signing_resources_commits` | `sandbox_pause_blocks_keeper_but_allows_owner_emergency` |
| M: detached/public MPC / withheld nonce | `audit::audit_emergency_marks_withheld_keeper_nonce`, `audit::audit_private_successful_detached_callback_and_public_recovery_after_owner_deadline` | pause invalidation sandbox |
| M: noop SDK + TS assembly | `hl_digest::tests::golden_vectors_all_supported_types`, `audit::audit_emits_pause_request_fixture_for_ts_relay` | `relay/noop.test.ts`: 4 vectors + pause event/public MPC fixture |
| M: definite failure retains no fictitious exposure | `audit::audit_definite_signer_failure_releases_only_exposure` | `sandbox_pending_duplicate_and_failed_callback` |
| M: rolling-day cap / keeper slot grief | `audit::audit_rolling_turnover_cannot_double_at_midnight`, `audit::audit_owner_config_preempts_keeper_cancel` | `sandbox_keeper_caps_and_cooldown` |
| M: keyless funding / native reserve | `audit::audit_native_sweep_preserves_storage_and_operating_reserve` | `tools/test_custody_keys.py` |
| L: flat/nested MPC / scalar / drift | `audit::audit_real_mpc_fixture_and_flat_schema`, `audit::audit_mpc_scalar_and_event_guards`, `audit::audit_nonce_drift_zero_rejected` | public captured MPC fixture |
| L: event metadata | `audit::audit_mpc_scalar_and_event_guards`, `pause_emits_nep297` | real order/cancel/withdraw digest sandbox |
| Owner/config / fixed recipients | `owner_only_config`, `owner_config_preserves_identity_and_counters`, `rejects_near_recipient`, `rejects_evm_recipient`, `keeper_cannot_withdraw` | `sandbox_owner_only_config`, `sandbox_fixed_recipient_rejection` |
| Testnet / initializer / resources / full queue | `audit::audit_initializer_and_resource_guards`, `audit::audit_limits_evm_self_authority_and_spot_resources`, `audit::audit_full_outstanding_queue_can_still_pause_and_invalidate` | default export checker |
| Authentic deposits; nonempty msg / zero amount | `authenticated_wnear_deposit`, `rejects_fake_token`, `rejects_nonowner_deposit`, `audit::audit_deposit_rejects_nonempty_message_and_zero_amount` | `sandbox_authenticated_deposits_and_token_failure_restoration` uses actual receiver receipts |
| Open backing / caps / cooldown | `short_never_exceeds_spot`, `max_short_cap`, `keeper_per_order_cap`, `signing::keeper_daily_cap`, `signing::keeper_cooldown`, `rejects_other_market`, `rejects_quantity_rounding` | `sandbox_short_spot_invariant`, `sandbox_keeper_caps_and_cooldown` |
| Settlement releases matching backing only | `settlement_releases_partial_and_full_backing_but_never_daily_churn_budget`, `settlement_rejects_keeper_stale_observation_and_unexpired_open_replay`, `settlement_cannot_ignore_a_newer_open_authorization` | both settlement sandboxes |
| Heartbeat and reserved owner capacity | `public_deleverage_requires_timeout`, `stranger_cannot_refresh_heartbeat`, `public_rate_limit_cannot_consume_owner_capacity`, `keeper_block_limit_and_owner_reserved_emergency` | public heartbeat / failed signing budget sandboxes |
| Original nonce pause / retry / confirmation / expiry | `pause_invalidates_each_original_nonce_and_confirmation_controls_completion`, `interrupted_invalidation_can_retry_same_nonce`, `withheld_signature_keeps_pause_incomplete_until_expiry_without_confirmation` | `sandbox_pause_invalidates_all_nonces_confirmation_failure_and_expiry` |
| Local pause survives exhausted owner capacity / token transfer | `exhausted_owner_budget_still_commits_local_pause_and_discards_keeper_callback`, `pause_commits_during_token_transfer_and_preserves_its_callback` | — |
| Nonce / expiry / callbacks / private ABI | `same_block_nonce_allocation_and_failed_callback_never_reuse`, `nonce_cannot_drift_ahead_of_clock`, `nonce_overflow_fails_closed`, `signer_success_after_expiry_never_emits_signature`, `callbacks_are_private`, `signing::oversized_signature_callback_is_uncertain` | real digest / malformed callback / outstanding limit sandboxes |
| Token failure and oversized successful transfer | `failed_spot_transfer_restores_ledger`, `successful_spot_transfer_does_not_restore_ledger_for_large_return` | `sandbox_authenticated_deposits_and_token_failure_restoration` |
| Exact sale reservation / finalized credit / replay | `rebalance::rebalance_exact_route_reserves_inventory_and_credits_only_final_receipt`, `rebalance::rebalance_receipt_cannot_be_reused_across_route_ids` | `sandbox_exact_sale_route_finality_and_replay` |
| Quote age, deadline, recipient, lot, fee, impact, min output | `rebalance::rebalance_rejects_keeper_recipient_changes_and_unsafe_quotes` | exact route sandbox |
| Route uncertainty / timeout / partial refund / late callback | `rebalance::rebalance_failure_timeout_late_and_partial_refund_never_double_credit` | — |
| Matching close quantity / sale turnover / health | `rebalance::rebalance_sale_requires_reconciled_matching_short_quantity`, `rebalance::rebalance_sale_daily_caps_and_margin_health` | exact route sandbox |
| Pending route blocks additions and withdrawals, preserves recovery | `rebalance::rebalance_pending_route_blocks_additions_withdrawals_and_second_route_but_not_emergency` | exact route sandbox |
| Margin reservation / action and day caps / availability / H | `rebalance::rebalance_withdrawal_reserves_full_margin_and_caps_rolling_usage`, `rebalance::rebalance_withdrawal_health_availability_and_fee_caps` | withdrawal invalidation sandbox |
| Finalized arrival, actual spot, original target and funded H-band re-entry | `rebalance::rebalance_pending_withdrawal_blocks_risk_before_final_arrival`, `rebalance::rebalance_final_withdrawal_arrival_requires_actual_spot_before_reentry`, `rebalance::rebalance_finalized_funded_reentry_obeys_inventory_dollar_and_health_bands` | — |

Full ECDSA point validation/recovery/address binding remains a relayer check;
contract callbacks enforce schema, low/nonzero s, scheme and recovery-ID bounds.
Owner price/position/equity/finality attestations remain trusted. Test passing
proves local accounting/receipts and serialization, not live venue fills, bridge
finality, MPC fee availability, or an account's actual key removal.
