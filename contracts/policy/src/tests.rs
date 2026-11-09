#![allow(unused_must_use)] // Promises are deliberately dropped to materialize mock receipts.
use super::*;
use near_sdk::test_utils::get_created_receipts;
use near_sdk::test_utils::{VMContextBuilder, get_logs};
use near_sdk::{PromiseResult, RuntimeFeesConfig, testing_env};

const OWNER: &str = "owner.testnet";
const KEEPER: &str = "keeper.testnet";
const CONTRACT: &str = "policy.testnet";
const TOKEN: &str = "wrap.testnet";
const EVM: &str = "0x1111111111111111111111111111111111111111";
fn account(s: &str) -> AccountId {
    s.parse().unwrap()
}
fn context(caller: &str, seconds: u64) -> VMContextBuilder {
    let mut b = VMContextBuilder::new();
    b.current_account_id(account(CONTRACT))
        .predecessor_account_id(account(caller))
        .signer_account_id(account(caller))
        .block_timestamp(seconds * 1_000_000_000)
        .block_height(seconds)
        .prepaid_gas(Gas::from_tgas(300))
        .attached_deposit(NearToken::from_yoctonear(1));
    b
}
fn at(caller: &str, seconds: u64) {
    testing_env!(context(caller, seconds).build());
}
fn limits() -> Limits {
    Limits {
        max_short_size: U128(100 * BASE),
        per_order_notional_cap: U128(10_100_000),
        per_day_notional_cap: U128(20_200_000),
        cooldown_seconds: 60,
        price_band_bps: 100,
        price_max_age_seconds: 3600,
    }
}
fn policy() -> Policy {
    at(OWNER, 1000);
    let mut p = Policy::new(
        account(OWNER),
        account(KEEPER),
        4,
        2,
        "counterweight-1".into(),
        EVM.into(),
        account("v1.signer-prod.testnet"),
        account(TOKEN),
        limits(),
        600,
        U128(5_000_000),
        None,
    );
    at(TOKEN, 1000);
    p.ft_on_transfer(account(OWNER), U128(100 * BASE), String::new());
    at(KEEPER, 1000);
    p
}
fn order(size: u128, reduce_only: bool) -> OrderParams {
    OrderParams {
        asset_index: 4,
        size: U128(size),
        reduce_only,
        reference_price: reduce_only.then_some(U128(5_000_000)),
    }
}
fn success(p: &mut Policy, seconds: u64) {
    let data = json_bytes(
        near_sdk::serde_json::json!({"big_r":{"affine_point":format!("02{}", "11".repeat(32))},"s":{"scalar":"22".repeat(32)},"recovery_id":0}),
    );
    callback(PromiseResult::Successful(data), seconds);
    assert!(p.on_signature(U64(p.operation_id)));
}
fn callback(result: PromiseResult, seconds: u64) {
    testing_env!(
        context(CONTRACT, seconds).build(),
        near_sdk::test_vm_config(),
        RuntimeFeesConfig::test(),
        Default::default(),
        vec![result]
    );
}

#[test]
fn owner_config_preserves_identity_and_counters() {
    let mut p = policy();
    at(OWNER, 1001);
    p.daily_usage = 42;
    p.turnover.push((1000, 42));
    p.set_config(account("new-keeper.testnet"), limits(), 1200);
    assert_eq!(p.get_state().owner, account(OWNER));
    assert_eq!(p.get_state().near_recipient, account(OWNER));
    assert_eq!(p.daily_usage, 42);
    assert_eq!(p.last_keeper_heartbeat, 1000);
}
#[test]
#[should_panic(expected = "ERR_CALLER_NOT_OWNER")]
fn owner_only_config() {
    let mut p = policy();
    p.set_config(account(KEEPER), limits(), 600);
}
#[test]
#[should_panic(expected = "ERR_RECIPIENT")]
fn rejects_near_recipient() {
    let mut p = policy();
    at(OWNER, 1000);
    p.withdraw_spot(account("attacker.testnet"), U128(BASE));
}
#[test]
#[should_panic(expected = "ERR_RECIPIENT")]
fn rejects_evm_recipient() {
    let mut p = policy();
    at(OWNER, 1000);
    p.request_evm_withdrawal("0x2222222222222222222222222222222222222222".into(), U128(1));
}
#[test]
#[should_panic(expected = "ERR_CALLER_NOT_OWNER")]
fn keeper_cannot_withdraw() {
    let mut p = policy();
    p.request_evm_withdrawal(EVM.into(), U128(1));
}
#[test]
#[should_panic(expected = "ERR_TOKEN")]
fn rejects_fake_token() {
    let mut p = policy();
    p.ft_on_transfer(account(OWNER), U128(BASE), String::new());
}
#[test]
#[should_panic(expected = "ERR_DEPOSIT_OWNER")]
fn rejects_nonowner_deposit() {
    let mut p = policy();
    at(TOKEN, 1000);
    p.ft_on_transfer(account(KEEPER), U128(BASE), String::new());
}
#[test]
fn authenticated_wnear_deposit() {
    let p = policy();
    assert_eq!(p.spot_balance, 100 * BASE);
}
#[test]
#[should_panic(expected = "ERR_ENCUMBERED_SPOT")]
fn cannot_withdraw_encumbered_spot() {
    let mut p = policy();
    p.signed_short_size = BASE;
    at(OWNER, 1000);
    p.withdraw_spot(account(OWNER), U128(100 * BASE));
}
#[test]
fn failed_spot_transfer_restores_ledger() {
    let mut p = policy();
    at(OWNER, 1000);
    p.withdraw_spot(account(OWNER), U128(BASE));
    assert_eq!(p.spot_balance, 99 * BASE);
    callback(PromiseResult::Failed, 1001);
    assert!(!p.on_spot_withdrawal(U64(1)));
    assert_eq!(p.spot_balance, 100 * BASE);
    assert!(p.pending.is_none());
}
#[test]
fn successful_spot_transfer_does_not_restore_ledger_for_large_return() {
    let mut p = policy();
    at(OWNER, 1000);
    p.withdraw_spot(account(OWNER), U128(BASE));
    callback(PromiseResult::Successful(vec![0; 2048]), 1001);
    assert!(p.on_spot_withdrawal(U64(1)));
    assert_eq!(p.spot_balance, 99 * BASE);
    assert!(p.pending.is_none());
}
#[test]
#[should_panic(expected = "ERR_CALLER_NOT_OWNER")]
fn keeper_cannot_unpause() {
    let mut p = policy();
    p.paused = true;
    p.set_paused(false);
}
#[test]
#[should_panic(expected = "ERR_CALLER_NOT_KEEPER")]
fn owner_cannot_impersonate_keeper() {
    let mut p = policy();
    at(OWNER, 1000);
    p.request_order_signature(order(BASE, false));
}
#[test]
#[should_panic(expected = "ERR_PER_ORDER_CAP")]
fn keeper_per_order_cap() {
    let mut p = policy();
    p.request_order_signature(order(3 * BASE, false));
}
#[test]
#[should_panic(expected = "ERR_EXCEEDS_SPOT_HEDGE")]
fn short_never_exceeds_spot() {
    let mut p = policy();
    p.spot_balance = BASE;
    p.request_order_signature(order(2 * BASE, false));
}
#[test]
#[should_panic(expected = "ERR_MAX_SHORT")]
fn max_short_cap() {
    let mut p = policy();
    p.limits.max_short_size = U128(BASE);
    p.request_order_signature(order(2 * BASE, false));
}
#[test]
#[should_panic(expected = "ERR_PAUSED")]
fn pause_blocks_increases() {
    let mut p = policy();
    at(OWNER, 1000);
    p.set_paused(true);
    at(KEEPER, 1000);
    p.request_order_signature(order(BASE, false));
}
#[test]
#[should_panic(expected = "ERR_STALE_PRICE")]
fn stale_reference_blocks_increases() {
    let mut p = policy();
    at(KEEPER, 4601);
    p.request_order_signature(order(BASE, false));
}
#[test]
#[should_panic(expected = "ERR_MARKET")]
fn rejects_other_market() {
    let mut p = policy();
    let mut o = order(BASE, false);
    o.asset_index = 5;
    p.request_order_signature(o);
}
#[test]
#[should_panic(expected = "ERR_SIZE")]
fn rejects_quantity_rounding() {
    let mut p = policy();
    p.request_order_signature(order(BASE + 1, false));
}
#[test]
fn reduce_can_exceed_local_exposure_bound() {
    let mut p = policy();
    p.signed_short_size = BASE;
    p.request_order_signature(order(2 * BASE, true));
}
#[test]
#[should_panic(expected = "ERR_HEARTBEAT_ACTIVE")]
fn public_deleverage_requires_timeout() {
    let mut p = policy();
    at("stranger.testnet", 1599);
    p.deleverage(U128(5_000_000));
}
#[test]
fn heartbeat_keeper_only_and_refreshes() {
    let mut p = policy();
    at(KEEPER, 1500);
    p.heartbeat();
    assert_eq!(p.last_keeper_heartbeat, 1500);
}
#[test]
#[should_panic(expected = "ERR_CALLER_NOT_KEEPER")]
fn stranger_cannot_refresh_heartbeat() {
    let mut p = policy();
    at("stranger.testnet", 1500);
    p.heartbeat();
}
#[test]
#[should_panic(expected = "ERR_PRIVATE_CALLBACK")]
fn callbacks_are_private() {
    let mut p = policy();
    p.on_signature(U64(1));
}
#[test]
fn decimal_encoding_is_exact() {
    assert_eq!(decimal(123400, 6), "0.1234");
    assert_eq!(decimal(BASE, 24), "1");
}
#[test]
fn pause_emits_nep297() {
    let mut p = policy();
    at(OWNER, 1000);
    p.set_paused(true);
    let log = get_logs().pop().unwrap();
    assert!(log.starts_with("EVENT_JSON:"));
    let event: near_sdk::serde_json::Value = near_sdk::serde_json::from_str(&log[11..]).unwrap();
    assert_eq!(event["standard"], "counterweight");
    assert_eq!(event["event"], "pause");
    assert_eq!(event["data"][0]["paused"], true);
}

mod signing {
    use super::*;
    #[test]
    fn typed_ioc_price_band_and_mpc_request() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        assert_eq!(p.signed_short_size, BASE);
        assert_eq!(p.daily_usage, 5_050_000);
        let e: near_sdk::serde_json::Value =
            near_sdk::serde_json::from_str(&get_logs()[0][11..]).unwrap();
        let o = &e["data"][0]["payload"]["action"]["orders"][0];
        assert_eq!(o["p"], "4.95");
        assert_eq!(o["b"], false);
        assert_eq!(o["r"], false);
        assert_eq!(o["t"]["limit"]["tif"], "Ioc");
        let receipts = get_created_receipts();
        assert_eq!(receipts.len(), 2);
        assert_eq!(receipts[0].receiver_id, account("v1.signer-prod.testnet"));
        success(&mut p, 1001);
        assert!(p.pending.is_none());
        assert!(
            get_logs()
                .iter()
                .any(|l| l.contains("\"event\":\"signature\""))
        );
    }
    #[test]
    #[should_panic(expected = "ERR_COOLDOWN")]
    fn keeper_cooldown() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        success(&mut p, 1001);
        at(KEEPER, 1059);
        p.request_order_signature(order(BASE, false));
    }
    #[test]
    #[should_panic(expected = "ERR_PER_DAY_CAP")]
    fn keeper_daily_cap() {
        let mut p = policy();
        p.request_order_signature(order(2 * BASE, false));
        success(&mut p, 1001);
        at(KEEPER, 1060);
        p.request_order_signature(order(2 * BASE, false));
        success(&mut p, 1061);
        at(KEEPER, 1120);
        p.request_order_signature(order(BASE, false));
    }
    #[test]
    fn rolling_day_preserves_lifetime_budget() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        success(&mut p, 1001);
        at(OWNER, DAY);
        p.set_reference_price(U128(5_000_000));
        at(KEEPER, DAY);
        p.request_order_signature(order(BASE, false));
        assert_eq!(p.daily_usage, 10_100_000);
        assert_eq!(p.signed_short_size, 2 * BASE);
    }
    #[test]
    fn reductions_ignore_caps_cooldown_pause_and_stale_price() {
        let mut p = policy();
        p.signed_short_size = 100 * BASE;
        p.daily_usage = p.limits.per_day_notional_cap.0;
        p.last_increase = Some(5000);
        at(OWNER, 5000);
        p.emergency_reduce(U128(100 * BASE), U128(5_000_000));
        success(&mut p, 5001);
        assert_eq!(p.signed_short_size, 100 * BASE);
        at(OWNER, 5062);
        p.set_paused(false);
        at(KEEPER, 5062);
        p.request_order_signature(order(100 * BASE, true)); // no cooldown for reductions
    }
    #[test]
    fn anyone_deleverages_after_timeout_even_paused() {
        let mut p = policy();
        p.signed_short_size = BASE;
        p.paused = true;
        at("stranger.testnet", 1600);
        p.deleverage(U128(5_000_000));
        let logs = get_logs().join("");
        assert!(logs.contains("\"r\":true"));
        assert!(logs.contains("\"b\":true"));
    }
    #[test]
    #[should_panic(expected = "ERR_PENDING_OPERATION")]
    fn duplicate_pending_operation_rejected() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        p.request_order_signature(order(BASE, true));
    }
    #[test]
    fn definite_failed_callback_releases_exposure_without_refunding_churn() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        callback(PromiseResult::Failed, 1001);
        assert!(!p.on_signature(U64(1)));
        assert!(p.pending.is_none());
        assert_eq!(p.signed_short_size, 0);
        assert_eq!(p.daily_usage, 5_050_000);
        at(KEEPER, 1060);
        p.request_order_signature(order(BASE, false));
        assert_eq!(p.operation_id, 2);
        assert_eq!(p.signed_short_size, BASE);
    }
    #[test]
    fn malformed_callback_is_uncertain() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        callback(PromiseResult::Successful(b"{}".to_vec()), 1001);
        assert!(!p.on_signature(U64(1)));
        assert!(p.pending.is_none());
    }
    #[test]
    fn oversized_signature_callback_is_uncertain() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        callback(PromiseResult::Successful(vec![0; 2048]), 1001);
        assert!(!p.on_signature(U64(1)));
        assert!(p.pending.is_none());
        assert_eq!(p.signed_short_size, BASE);
    }
    #[test]
    fn completed_callback_cannot_replay() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        success(&mut p, 1001);
        callback(PromiseResult::Failed, 1002);
        assert!(!p.on_signature(U64(1)));
    }
    #[test]
    #[should_panic(expected = "ERR_PENDING_OPERATION")]
    fn withdrawal_cannot_overlap_order() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        at(OWNER, 1001);
        p.withdraw_spot(account(OWNER), U128(BASE));
    }
    #[test]
    fn stale_callback_id_rejected() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        callback(PromiseResult::Failed, 1001);
        assert!(!p.on_signature(U64(0)));
        assert_eq!(p.pending.as_ref().unwrap().id, 1);
    }
    #[test]
    fn reductions_never_recycle_signed_open_budget() {
        let mut p = policy();
        p.spot_balance = 2 * BASE;
        p.request_order_signature(order(2 * BASE, false));
        success(&mut p, 1001);
        at(KEEPER, 1001);
        p.request_order_signature(order(2 * BASE, true));
        success(&mut p, 1002);
        assert_eq!(p.signed_short_size, 2 * BASE);
        at(KEEPER, 1060);
        let rejected = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            p.request_order_signature(order(BASE, false))
        }));
        assert!(rejected.is_err());
        assert!(p.signed_short_size <= p.spot_balance);
    }
    #[test]
    fn evm_withdrawal_uses_only_fixed_owner_recipient_while_paused() {
        let mut p = policy();
        at(OWNER, 1000);
        prepare_margin(&mut p);
        p.set_paused(true);
        at(OWNER, 1001);
        p.request_evm_withdrawal(EVM.into(), U128(1_500_000));
        let log = get_logs().join("");
        assert!(log.contains("withdraw3"));
        assert!(log.contains(EVM));
        assert!(log.contains("Testnet"));
        success(&mut p, 1002);
    }
}

fn request_event() -> near_sdk::serde_json::Value {
    get_logs()
        .iter()
        .filter_map(|l| l.strip_prefix("EVENT_JSON:"))
        .map(|l| near_sdk::serde_json::from_str::<near_sdk::serde_json::Value>(l).unwrap())
        .find(|e| e["event"] == "request")
        .unwrap()["data"][0]
        .clone()
}
fn rejected(f: impl FnOnce()) {
    assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(f)).is_err());
}
#[test]
fn same_block_nonce_allocation_and_failed_callback_never_reuse() {
    let mut p = policy();
    p.request_cancel_signature(U64(1));
    assert_eq!(p.last_nonce, 1_000_000);
    assert_eq!(request_event()["payload"]["expiresAfter"], 1_060_000);
    callback(PromiseResult::Failed, 1000);
    assert!(!p.on_signature(U64(1)));
    at(KEEPER, 1000);
    p.request_cancel_signature(U64(2));
    assert_eq!(p.last_nonce, 1_000_001);
    assert_eq!(request_event()["payload"]["expiresAfter"], 1_060_000);
    assert_eq!(p.outstanding.len(), 1);
}
#[test]
#[should_panic(expected = "ERR_NONCE_DRIFT")]
fn nonce_cannot_drift_ahead_of_clock() {
    let mut p = policy();
    p.last_nonce = 1_001_000;
    p.request_cancel_signature(U64(0));
}
#[test]
#[should_panic(expected = "ERR_NONCE_OVERFLOW")]
fn nonce_overflow_fails_closed() {
    let mut p = policy();
    p.last_nonce = u64::MAX;
    p.request_cancel_signature(U64(0));
}
#[test]
fn keeper_block_limit_and_owner_reserved_emergency() {
    let mut p = policy();
    p.signing_limits.keeper_per_block = 1;
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1000);
    at(KEEPER, 1000);
    rejected(|| {
        p.request_cancel_signature(U64(1));
    });
    at(OWNER, 1000);
    p.emergency_reduce(U128(BASE), U128(5_000_000));
    assert_eq!(p.owner_requests.len(), 1);
    assert_eq!(p.keeper_requests.len(), 1);
}
#[test]
fn keeper_rolling_budget_counts_failed_requests_and_expires_at_boundary() {
    let mut p = policy();
    p.signing_limits.keeper_per_window = 2;
    for t in [1000, 1001] {
        at(KEEPER, t);
        p.request_cancel_signature(U64(t));
        callback(PromiseResult::Failed, t);
        p.on_signature(U64(p.operation_id));
    }
    at(KEEPER, 1059);
    rejected(|| {
        p.request_cancel_signature(U64(3));
    });
    at(KEEPER, 1060);
    p.request_cancel_signature(U64(4));
    assert_eq!(p.keeper_requests.len(), 2);
    assert_eq!(p.last_nonce, 1_060_000);
}
#[test]
fn keeper_outstanding_cap_keeps_invalidation_capacity() {
    let mut p = policy();
    p.signing_limits.keeper_outstanding = 1;
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    at(KEEPER, 1002);
    rejected(|| {
        p.request_cancel_signature(U64(1));
    });
    at(OWNER, 1002);
    p.set_paused(true);
    assert!(matches!(
        p.pending.as_ref().unwrap().kind,
        OperationKind::Invalidation
    ));
    assert_eq!(p.outstanding.len(), 1);
    assert_eq!(p.keeper_requests.len(), 1);
    assert_eq!(p.owner_requests.len(), 1);
}
#[test]
fn emergency_detaches_stuck_signer_and_late_callback_cannot_clear_new_slot() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    at(OWNER, 1001);
    p.emergency_reduce(U128(BASE), U128(5_000_000));
    callback(PromiseResult::Failed, 1002);
    assert!(!p.on_signature(U64(1)));
    assert_eq!(p.pending.as_ref().unwrap().id, 2);
    assert_eq!(p.signed_short_size, BASE);
    success(&mut p, 1003);
}
#[test]
fn expired_callback_is_discarded_and_missing_callback_recovers_permissionlessly() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    at("stranger.testnet", 1060);
    p.expire_pending_signature();
    assert!(p.pending.is_some()); // venue expiry is strictly after expiresAfter
    at("stranger.testnet", 1061);
    p.expire_pending_signature();
    assert!(p.pending.is_none());
    assert_eq!(p.signed_short_size, BASE);
    at(KEEPER, 1061);
    p.request_order_signature(order(BASE, true));
    callback(PromiseResult::Failed, 1062);
    assert!(!p.on_signature(U64(1)));
    assert_eq!(p.pending.as_ref().unwrap().id, 2);
}
#[test]
fn signer_success_after_expiry_never_emits_signature() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    let data = json_bytes(
        near_sdk::serde_json::json!({"big_r":{"affine_point":format!("02{}", "11".repeat(32))},"s":{"scalar":"22".repeat(32)},"recovery_id":0}),
    );
    callback(PromiseResult::Successful(data), 1061);
    assert!(!p.on_signature(U64(1)));
    assert!(p.pending.is_none());
    assert!(!get_logs().join("").contains("\"event\":\"signature\""));
    assert_eq!(p.signed_short_size, BASE);
}
#[test]
fn pause_invalidates_each_original_nonce_and_confirmation_controls_completion() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    at(KEEPER, 1002);
    p.request_cancel_signature(U64(9));
    success(&mut p, 1003);
    let last = p.last_nonce;
    at(OWNER, 1004);
    p.set_paused(true);
    assert_eq!(request_event()["payload"]["action"]["type"], "noop");
    assert_eq!(request_event()["payload"]["nonce"], 1_000_000);
    assert_eq!(request_event()["payload"]["expiresAfter"], 1_060_000);
    assert_eq!(p.last_nonce, last);
    assert!(!p.pause_complete());
    success(&mut p, 1005);
    at(OWNER, 1006);
    p.report_invalidation(U64(1_000_000), true);
    assert!(!p.pause_complete());
    p.request_next_invalidation();
    assert_eq!(request_event()["payload"]["nonce"], 1_002_000);
    success(&mut p, 1007);
    at(OWNER, 1008);
    p.report_invalidation(U64(1_002_000), true);
    assert!(p.pause_complete());
    p.set_paused(false);
    assert!(!p.paused);
    assert_eq!(p.signed_short_size, BASE);
}
#[test]
fn pause_discards_inflight_keeper_callback_and_retries_failed_invalidation() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    at(OWNER, 1001);
    p.set_paused(true);
    callback(PromiseResult::Failed, 1002);
    assert!(!p.on_signature(U64(1)));
    assert_eq!(p.pending.as_ref().unwrap().id, 2);
    assert!(!p.on_signature(U64(2))); // noop signer failed
    assert!(!p.outstanding[0].invalidation_requested);
    at(OWNER, 1003);
    p.request_next_invalidation();
    success(&mut p, 1004);
    at(OWNER, 1005);
    p.report_invalidation(U64(1_000_000), false);
    assert!(!p.pause_complete());
    p.request_next_invalidation();
    success(&mut p, 1006);
    at(OWNER, 1007);
    p.report_invalidation(U64(1_000_000), true);
    assert!(p.pause_complete());
}
#[test]
fn withheld_signature_keeps_pause_incomplete_until_expiry_without_confirmation() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    at(OWNER, 1002);
    p.set_paused(true);
    success(&mut p, 1003);
    at(OWNER, 1060);
    rejected(|| {
        p.set_paused(false);
    });
    assert!(p.paused);
    at(OWNER, 1061);
    p.set_paused(false);
    assert!(!p.paused);
    assert!(p.pause_complete());
    assert_eq!(p.signed_short_size, BASE);
}
#[test]
fn pause_blocks_all_keeper_signing_but_owner_can_reduce() {
    let mut p = policy();
    p.signed_short_size = BASE;
    at(OWNER, 1000);
    p.set_paused(true);
    at(KEEPER, 1000);
    rejected(|| {
        p.request_order_signature(order(BASE, true));
    });
    rejected(|| {
        p.request_cancel_signature(U64(0));
    });
    at(OWNER, 1000);
    p.emergency_reduce(U128(BASE), U128(5_000_000));
}
#[test]
fn public_rate_limit_cannot_consume_owner_capacity() {
    let mut p = policy();
    p.signed_short_size = BASE;
    at("stranger.testnet", 1600);
    p.deleverage(U128(5_000_000));
    success(&mut p, 1601);
    at("another.testnet", 1602);
    rejected(|| {
        p.deleverage(U128(5_000_000));
    });
    at(OWNER, 1602);
    p.emergency_reduce(U128(BASE), U128(5_000_000));
    assert_eq!(p.owner_requests.len(), 1);
}
#[test]
fn settlement_releases_partial_and_full_backing_but_never_daily_churn_budget() {
    let mut p = policy();
    p.spot_balance = 2 * BASE;
    p.request_order_signature(order(2 * BASE, false));
    success(&mut p, 1001);
    at(KEEPER, 1002);
    p.request_order_signature(order(BASE, true));
    success(&mut p, 1003);
    assert_eq!(p.signed_short_size, 2 * BASE); // signature is not a fill
    at(OWNER, 1061);
    p.settle_position(U128(BASE), U64(1_061_000));
    assert_eq!(p.signed_short_size, BASE);
    assert_eq!(p.daily_usage, 10_100_000);
    p.withdraw_spot(account(OWNER), U128(BASE));
    callback(PromiseResult::Successful(vec![]), 1062);
    assert!(p.on_spot_withdrawal(U64(p.operation_id)));
    assert_eq!(p.spot_balance, BASE);
    at(OWNER, 1063);
    p.settle_position(U128(0), U64(1_063_000));
    at(KEEPER, 1063);
    p.request_order_signature(order(BASE, false));
    assert_eq!(p.signed_short_size, BASE);
    assert_eq!(p.lifetime_opened, 3 * BASE);
    assert_eq!(p.daily_usage, 15_150_000);
}
#[test]
fn settlement_rejects_keeper_stale_observation_and_unexpired_open_replay() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    at(OWNER, 1002);
    rejected(|| p.settle_position(U128(0), U64(1_002_000)));
    at(KEEPER, 1061);
    rejected(|| p.settle_position(U128(0), U64(1_061_000)));
    at(OWNER, 1061);
    rejected(|| p.settle_position(U128(0), U64(1_060_000)));
    rejected(|| p.settle_position(U128(0), U64(1_062_000)));
    at(OWNER, 1100);
    rejected(|| p.settle_position(U128(0), U64(1_061_000)));
    assert_eq!(p.signed_short_size, BASE);
}
#[test]
fn settlement_cannot_ignore_a_newer_open_authorization() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    at(KEEPER, 1060);
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1061);
    at(OWNER, 1062);
    rejected(|| p.settle_position(U128(0), U64(1_062_000)));
    at(OWNER, 1121);
    p.settle_position(U128(0), U64(1_121_000));
    assert_eq!(p.signed_short_size, 0);
    assert_eq!(p.daily_usage, 10_100_000);
}
#[test]
fn invalidation_confirmation_is_owner_only_and_requires_signed_request() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    at(OWNER, 1002);
    rejected(|| p.report_invalidation(U64(1_000_000), true));
    p.set_paused(true);
    success(&mut p, 1003);
    at(KEEPER, 1004);
    rejected(|| p.report_invalidation(U64(1_000_000), true));
    assert!(!p.pause_complete());
}

#[test]
fn interrupted_invalidation_can_retry_same_nonce() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    at(OWNER, 1002);
    p.set_paused(true);
    assert!(p.outstanding[0].invalidation_requested);
    at(OWNER, 1002);
    p.emergency_reduce(U128(BASE), U128(5_000_000));
    assert!(!p.outstanding[0].invalidation_requested);
    success(&mut p, 1003);
    at(OWNER, 1004);
    p.request_next_invalidation();
    assert_eq!(request_event()["payload"]["nonce"], 1_000_000);
}
#[test]
fn pause_also_tracks_existing_owner_and_public_l1_authorizations() {
    let mut p = policy();
    p.signed_short_size = BASE;
    at(OWNER, 1600);
    p.emergency_reduce(U128(BASE), U128(5_000_000));
    success(&mut p, 1601);
    at("stranger.testnet", 1602);
    p.deleverage(U128(5_000_000));
    success(&mut p, 1603);
    at(OWNER, 1604);
    p.set_paused(true);
    assert_eq!(p.outstanding.iter().filter(|a| a.discarded).count(), 2);
    assert!(!p.pause_complete());
}
#[test]
fn exhausted_owner_budget_still_commits_local_pause_and_discards_keeper_callback() {
    let mut p = policy();
    p.owner_requests = vec![1_000_000; 16];
    p.request_order_signature(order(BASE, false));
    at(OWNER, 1001);
    assert!(matches!(p.set_paused(true), PromiseOrValue::Value(false)));
    assert!(p.paused);
    assert!(p.pending.is_none());
    assert!(!p.pause_complete());
    at(OWNER, 1060);
    p.request_next_invalidation();
    assert_eq!(request_event()["payload"]["nonce"], 1_000_000);
}
#[test]
fn public_cannot_interrupt_owner_emergency_or_invalidation() {
    let mut p = policy();
    p.signed_short_size = BASE;
    at(OWNER, 1600);
    p.emergency_reduce(U128(BASE), U128(5_000_000));
    at("stranger.testnet", 1601);
    rejected(|| {
        p.deleverage(U128(5_000_000));
    });
    assert_eq!(p.pending.as_ref().unwrap().id, 1);
    at(OWNER, 1602);
    p.set_paused(true);
    let id = p.pending.as_ref().unwrap().id;
    at("stranger.testnet", 1603);
    rejected(|| {
        p.deleverage(U128(5_000_000));
    });
    assert_eq!(p.pending.as_ref().unwrap().id, id);
}
#[test]
fn missing_withdraw_callback_expires_locally_without_reusing_its_nonce() {
    let mut p = policy();
    at(OWNER, 1000);
    prepare_margin(&mut p);
    p.request_evm_withdrawal(EVM.into(), U128(1_000_000));
    assert!(p.pending.as_ref().unwrap().expires_after.is_none());
    let old_nonce = p.last_nonce;
    at("stranger.testnet", 1061);
    p.expire_pending_signature();
    assert!(p.pending.is_none());
    at(KEEPER, 1061);
    p.request_cancel_signature(U64(1));
    assert!(p.last_nonce > old_nonce);
    callback(PromiseResult::Failed, 1062);
    assert!(!p.on_signature(U64(1)));
    assert_eq!(p.pending.as_ref().unwrap().id, 2);
}
#[test]
fn public_can_preempt_keeper_but_uses_separate_bounded_capacity() {
    let mut p = policy();
    at(KEEPER, 1600);
    p.request_order_signature(order(BASE, false));
    at("stranger.testnet", 1601);
    p.deleverage(U128(5_000_000));
    assert!(!p.pending.as_ref().unwrap().keeper);
    assert_eq!(p.keeper_requests.len(), 1);
    assert!(p.owner_requests.is_empty());
    assert_eq!(p.signed_short_size, BASE);
}

#[test]
fn pause_commits_during_token_transfer_and_preserves_its_callback() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    at(OWNER, 1002);
    p.withdraw_spot(account(OWNER), U128(BASE));
    at(OWNER, 1003);
    assert!(matches!(p.set_paused(true), PromiseOrValue::Value(false)));
    assert!(p.paused);
    assert!(matches!(
        p.pending.as_ref().unwrap().kind,
        OperationKind::SpotWithdrawal
    ));
    callback(PromiseResult::Failed, 1004);
    assert!(!p.on_spot_withdrawal(U64(2)));
    at(OWNER, 1005);
    p.request_next_invalidation();
    assert_eq!(request_event()["payload"]["nonce"], 1_000_000);
}

mod audit;

mod rebalance;

fn prepare_margin(p: &mut Policy) {
    if p.rebalance.is_none() {
        p.configure_rebalancing(rebalance::config());
    }
    p.observe_margin(
        U128(100_000_000),
        U128(80_000_000),
        U64(env::block_timestamp_ms()),
    );
}
