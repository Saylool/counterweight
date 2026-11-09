#![allow(unused_must_use)] // Promises are deliberately dropped to materialize mock receipts.
use super::*;
#[cfg(feature = "day1-placeholder-digest")]
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
    }
}
#[cfg(feature = "day1-placeholder-digest")]
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
#[should_panic(expected = "ERR_REDUCE_SIZE")]
fn reduce_cannot_exceed_signed_short() {
    let mut p = policy();
    p.signed_short_size = BASE;
    p.request_order_signature(order(2 * BASE, true));
}
#[test]
#[should_panic(expected = "ERR_HEARTBEAT_ACTIVE")]
fn public_deleverage_requires_timeout() {
    let mut p = policy();
    at("stranger.testnet", 1599);
    p.deleverage();
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

#[cfg(not(feature = "day1-placeholder-digest"))]
#[test]
#[should_panic(expected = "ERR_HL_DIGEST_NOT_IMPLEMENTED")]
fn default_build_refuses_placeholder_signing() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
}

#[cfg(feature = "day1-placeholder-digest")]
mod placeholder {
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
    fn utc_day_rollover_preserves_lifetime_budget() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        success(&mut p, 1001);
        at(OWNER, DAY);
        p.set_reference_price(U128(5_000_000));
        at(KEEPER, DAY);
        p.request_order_signature(order(BASE, false));
        assert_eq!(p.daily_usage, 5_050_000);
        assert_eq!(p.signed_short_size, 2 * BASE);
    }
    #[test]
    fn reductions_ignore_caps_cooldown_pause_and_stale_price() {
        let mut p = policy();
        p.signed_short_size = 100 * BASE;
        p.paused = true;
        p.daily_usage = p.limits.per_day_notional_cap.0;
        p.last_increase = Some(5000);
        at(KEEPER, 5000);
        p.request_order_signature(order(100 * BASE, true));
        success(&mut p, 5001);
        assert_eq!(p.signed_short_size, 100 * BASE);
        at(KEEPER, 5001);
        p.request_order_signature(order(100 * BASE, true)); // no cooldown for reductions
    }
    #[test]
    fn anyone_deleverages_after_timeout_even_paused() {
        let mut p = policy();
        p.signed_short_size = BASE;
        p.paused = true;
        at("stranger.testnet", 1600);
        p.deleverage();
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
    fn failed_callback_retains_reservation_until_owner_ack() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        callback(PromiseResult::Failed, 1001);
        assert!(!p.on_signature(U64(1)));
        assert_eq!(p.pending.as_ref().unwrap().phase, Phase::Uncertain);
        assert_eq!(p.signed_short_size, BASE);
        assert_eq!(p.daily_usage, 5_050_000);
        at(OWNER, 1002);
        p.acknowledge_failed_signature(U64(1));
        assert!(p.pending.is_none());
        at(KEEPER, 1060);
        p.request_order_signature(order(BASE, false));
        assert_eq!(p.operation_id, 2);
        assert_eq!(p.signed_short_size, 2 * BASE);
    }
    #[test]
    fn malformed_callback_is_uncertain() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        callback(PromiseResult::Successful(b"{}".to_vec()), 1001);
        assert!(!p.on_signature(U64(1)));
        assert_eq!(p.pending.as_ref().unwrap().phase, Phase::Uncertain);
    }
    #[test]
    fn oversized_signature_callback_is_uncertain() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        callback(PromiseResult::Successful(vec![0; 2048]), 1001);
        assert!(!p.on_signature(U64(1)));
        assert_eq!(p.pending.as_ref().unwrap().phase, Phase::Uncertain);
        assert_eq!(p.signed_short_size, BASE);
    }
    #[test]
    #[should_panic(expected = "ERR_NO_PENDING")]
    fn completed_callback_cannot_replay() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        success(&mut p, 1001);
        callback(PromiseResult::Failed, 1002);
        p.on_signature(U64(1));
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
    #[should_panic(expected = "ERR_CALLBACK_ID")]
    fn stale_callback_id_rejected() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        callback(PromiseResult::Failed, 1001);
        p.on_signature(U64(0));
    }
    #[test]
    #[should_panic(expected = "ERR_PENDING_PHASE")]
    fn cannot_ack_inflight_operation() {
        let mut p = policy();
        p.request_order_signature(order(BASE, false));
        at(OWNER, 1001);
        p.acknowledge_failed_signature(U64(1));
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
