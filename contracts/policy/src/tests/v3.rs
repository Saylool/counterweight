use super::*;
use crate::withdrawals::MarginLimits;
fn margin_limits() -> MarginLimits {
    MarginLimits {
        per_withdrawal_usdc: U128(10_000_000),
        daily_withdrawal_usdc: U128(20_000_000),
        min_residual_equity_usdc: U128(1_000_000),
        min_headroom_bps: 1000,
        fee_reserve_usdc: U128(100_000),
        max_fee_usdc: U128(1_000_000),
    }
}
fn margin(p: &mut Policy, equity: u128) {
    at(OWNER, 1000);
    p.configure_margin_withdrawals(margin_limits());
    p.observe_margin(U128(equity), U128(equity), U64(1_000_000));
}
#[test]
fn exits_far_outside_opening_band_all_authorities_and_exact_slippage_cap() {
    for mark in [
        10,
        12,
        100_000,
        500_000,
        50_000_000,
        500_000_000,
        1_000_000_000_000,
    ] {
        for role in [OWNER, KEEPER, "anyone.testnet"] {
            let mut p = policy();
            p.signed_short_size = BASE;
            p.size_decimals = 1;
            p.limits.price_band_bps = 9999; // Exit cap cannot be widened by set_config.
            p.keeper_weight_used = 5000;
            p.keeper_requests = vec![(5_000_000, 5000); 8];
            p.owner_requests = vec![5_000_000; 16];
            p.paused = true;
            at(role, 5000);
            if role == OWNER {
                p.emergency_reduce(U128(BASE), U128(mark), U64(5000));
            } else if role == KEEPER {
                let mut o = order(BASE, true);
                o.reference_price = Some(U128(mark));
                p.request_order_signature(o);
            } else {
                p.deleverage(U128(mark), U64(5000));
            }
            let e = request_event();
            let o = &e["payload"]["action"]["orders"][0];
            assert_eq!(o["b"], true);
            assert_eq!(o["r"], true);
            assert_eq!(o["t"]["limit"]["tif"], "Ioc");
            let price = o["p"].as_str().unwrap().parse::<f64>().unwrap();
            assert!(price <= mark as f64 / 1e6 * 1.01 + 1e-12);
            assert!(p.outstanding.is_empty());
        }
    }
}
#[test]
fn exits_reject_stale_future_and_outside_sanity_marks() {
    for (price, ts) in [
        (5_000_000, 4939),
        (5_000_000, 5001),
        (9, 5000),
        (1_000_000_000_001, 5000),
    ] {
        let mut p = policy();
        at("anyone.testnet", 5000);
        rejected(|| {
            p.deleverage(U128(price), U64(ts));
        });
    }
}
#[test]
fn oracle_outside_band_can_close_but_cannot_open() {
    let mut p = policy();
    p.oracle.account_id = Some(account("pyth.testnet"));
    callback(
        PromiseResult::Successful(json_bytes(
            near_sdk::serde_json::json!({"price":"50000000","conf":"0","expo":-6,"publish_time":1000}),
        )),
        1001,
    );
    assert!(p.on_oracle_price());
    at(KEEPER, 1001);
    rejected(|| {
        p.request_order_signature(order(BASE, false));
    });
    at(KEEPER, 1001);
    let mut o = order(BASE, true);
    o.reference_price = None;
    o.observed_at = None;
    p.request_order_signature(o);
    assert_eq!(
        request_event()["payload"]["action"]["orders"][0]["p"],
        "50.5"
    );
}
#[test]
fn keeper_close_preempts_stuck_open_and_full_queue() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    let a = p.outstanding[0].clone();
    p.outstanding = vec![a; 32];
    at(KEEPER, 1001);
    p.request_order_signature(order(BASE, true));
    assert!(matches!(
        p.pending.as_ref().unwrap().kind,
        OperationKind::Reduce
    ));
    assert_eq!(p.outstanding.len(), 32);
    success(&mut p, 1002); // Pause cannot discard a keeper reduction callback.
}
#[test]
fn price_bounds_timelock_cancel_replace_and_owner_only() {
    let mut p = policy();
    rejected(|| {
        p.propose_price_bounds(U128(10), U128(50_000_000));
    });
    at(OWNER, 1000);
    p.propose_price_bounds(U128(10), U128(50_000_000));
    at(OWNER, 87399);
    rejected(|| {
        p.execute_price_bounds();
    });
    at(OWNER, 87400);
    p.cancel_price_bounds();
    rejected(|| {
        p.execute_price_bounds();
    });
    p.propose_price_bounds(U128(40_000_000), U128(60_000_000));
    at(OWNER, 87401);
    p.propose_price_bounds(U128(45_000_000), U128(55_000_000));
    assert_eq!(
        p.get_price_bounds_proposal().unwrap().execute_after.0,
        173801
    );
    at(OWNER, 173800);
    rejected(|| {
        p.execute_price_bounds();
    });
    at(OWNER, 173801);
    p.execute_price_bounds();
    assert!(p.get_price_bounds_proposal().is_none());
    at(KEEPER, 173801);
    p.set_keeper_price(U128(50_000_000), U64(173801));
    p.request_order_signature(order(BASE / 10, false));
}
#[test]
fn exits_never_wait_for_price_bounds_proposal() {
    let mut p = policy();
    at(OWNER, 1000);
    p.propose_price_bounds(U128(10), U128(100_000_000));
    at("anyone.testnet", 5000);
    p.deleverage(U128(50_000_000), U64(5000));
    assert!(p.get_price_bounds_proposal().is_some());
}
#[test]
fn independent_margin_flat_and_open_withdrawals_reserve_and_reconcile() {
    for short in [0, BASE] {
        let mut p = policy();
        margin(&mut p, 100_000_000);
        p.signed_short_size = short;
        p.request_evm_withdrawal(EVM.into(), U128(10_000_000));
        assert!(p.rebalance.is_none());
        let m = p.get_margin().unwrap();
        assert_eq!(m.usable_margin.0, 90_000_000);
        assert_eq!(m.withdrawable.0, 90_000_000);
        let nonce = p.last_nonce;
        success(&mut p, 1001);
        at(OWNER, 1002);
        rejected(|| {
            p.observe_margin(U128(100_000_000), U128(100_000_000), U64(1_002_000));
        });
        p.reconcile_margin_withdrawal(
            U64(nonce),
            U128(9_000_000),
            U128(1_000_000),
            "finalized-receipt".into(),
            U64(1_002_000),
        );
        assert!(p.get_margin().unwrap().withdrawal.is_none());
        assert!(p.outstanding[0].invalidation_confirmed);
    }
}
#[test]
fn independent_margin_wrong_recipient_stale_observation_and_no_config_switch() {
    let mut p = policy();
    margin(&mut p, 100_000_000);
    rejected(|| {
        p.request_evm_withdrawal("0x2222222222222222222222222222222222222222".into(), U128(1));
    });
    rejected(|| {
        p.configure_rebalancing(super::rebalance::config());
    });
    at(OWNER, 1031);
    rejected(|| {
        p.request_evm_withdrawal(EVM.into(), U128(1));
    });
}
#[test]
fn v3_cross_layer_withdrawals() {
    let cases: Vec<near_sdk::serde_json::Value> =
        near_sdk::serde_json::from_str(include_str!("../../fixtures/v3-withdrawals.json")).unwrap();
    let mut decisions = vec![];
    for x in cases {
        let n = |k: &str| x[k].as_str().unwrap().parse::<u128>().unwrap();
        let mut p = policy();
        margin(&mut p, n("equity"));
        p.signed_short_size = n("short");
        p.reference_price = n("price");
        let accepted = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            p.request_evm_withdrawal(EVM.into(), U128(n("amount")));
        }))
        .is_ok();
        decisions.push(accepted);
    }
    println!(
        "V3_WITHDRAWAL_DECISIONS={}",
        near_sdk::serde_json::to_string(&decisions).unwrap()
    );
}

#[test]
fn v2_cleanup_fee_cap_requires_expiry_abandonment_without_margin_credit() {
    let mut p = policy();
    p.spot_balance = 4 * BASE;
    at(OWNER, 1000);
    p.request_usd_class_transfer(U128(49_000_000), true);
    success(&mut p, 1000);
    at(OWNER, 1001);
    let mut l = super::rebalance::config();
    l.max_fee_usdc = U128(1);
    l.per_withdrawal_usdc = U128(60_000_000);
    l.daily_withdrawal_usdc = U128(60_000_000);
    l.min_residual_equity_usdc = U128(1_000_000);
    l.original_target_usdc = U128(20_000_000);
    p.configure_rebalancing(l);
    p.observe_margin(U128(48_957_074), U128(47_957_074), U64(1_001_000));
    p.request_evm_withdrawal(EVM.into(), U128(47_957_074));
    let nonce = p.last_nonce;
    success(&mut p, 1002);
    at(OWNER, 1003);
    rejected(|| {
        p.reconcile_margin_withdrawal(
            U64(nonce),
            U128(46_957_074),
            U128(1_000_000),
            "actual-fee-receipt".into(),
            U64(1_003_000),
        );
    });
    rejected(|| {
        p.abandon_margin_withdrawal();
    });
    let horizon = p.outstanding.iter().map(|a| a.expires_after).max().unwrap();
    at(OWNER, horizon / 1000 + 1);
    p.expire_pending_signature();
    p.abandon_margin_withdrawal();
    let r = p.rebalance.as_ref().unwrap();
    assert!(r.withdrawal.is_none());
    assert_eq!(r.usable_margin.0, 1_000_000);
    assert_eq!(r.acquisition_budget_usdc.0, 0);
    assert!(p.outstanding.is_empty());
    p.withdraw_spot(account(OWNER), U128(4 * BASE));
    callback(PromiseResult::Successful(vec![]), horizon / 1000 + 2);
    assert!(p.on_spot_withdrawal(U64(p.operation_id)));
    assert_eq!(p.spot_balance, 0);
}
#[test]
fn atomic_self_initialization_preserves_separate_owner_and_keeper() {
    at(CONTRACT, 1000);
    let p = Policy::new(
        account(OWNER),
        account(KEEPER),
        4,
        1,
        "counterweight-1".into(),
        EVM.into(),
        account("v1.signer-prod.testnet"),
        account(TOKEN),
        limits(),
        600,
        U128(5_000_000),
        None,
        oracle_config(),
        Network::Testnet,
    );
    assert_eq!(p.owner, account(OWNER));
    assert_eq!(p.keeper, account(KEEPER));
    at("stranger.testnet", 1000);
    rejected(|| {
        Policy::new(
            account(OWNER),
            account(KEEPER),
            4,
            1,
            "counterweight-1".into(),
            EVM.into(),
            account("v1.signer-prod.testnet"),
            account(TOKEN),
            limits(),
            600,
            U128(5_000_000),
            None,
            oracle_config(),
            Network::Testnet,
        );
    });
}

#[test]
fn exits_and_spot_callbacks_are_independent_in_both_receipt_orders() {
    for exit_first in [true, false] {
        let mut p = policy();
        at(OWNER, 1000);
        p.withdraw_spot(account(OWNER), U128(BASE));
        let spot_id = p.operation_id;
        at(OWNER, 1000);
        p.emergency_reduce(U128(BASE), U128(50_000_000), U64(1000));
        let exit_id = p.operation_id;
        assert_eq!(p.pending.as_ref().unwrap().id, spot_id);
        assert_eq!(p.get_pending_exit().unwrap().id, exit_id);
        if exit_first {
            success(&mut p, 1001);
            assert_eq!(p.pending.as_ref().unwrap().id, spot_id);
            callback(PromiseResult::Failed, 1002);
            assert!(!p.on_spot_withdrawal(U64(spot_id)));
        } else {
            callback(PromiseResult::Failed, 1001);
            assert!(!p.on_spot_withdrawal(U64(spot_id)));
            success(&mut p, 1002);
        }
        assert!(p.pending.is_none());
        assert!(p.get_pending_exit().is_none());
        assert_eq!(p.spot_balance, 100 * BASE);
    }
}
#[test]
fn fresh_caller_exit_can_override_oracle_older_than_exit_freshness() {
    let mut p = policy();
    p.oracle.account_id = Some(account("pyth.testnet"));
    p.oracle.max_age_seconds = 300;
    p.oracle_price = 5_000_000;
    p.oracle_timestamp = 1000;
    at(KEEPER, 1100); // Still a fresh opening oracle, but too old for an exit.
    let mut o = order(BASE, true);
    o.reference_price = Some(U128(50_000_000));
    p.request_order_signature(o);
    assert_eq!(
        request_event()["payload"]["action"]["orders"][0]["p"],
        "50.5"
    );
}

#[test]
fn wide_keeper_cache_unblocks_margin_health_but_never_opening_band() {
    let mut p = policy();
    margin(&mut p, 100_000_000);
    p.signed_short_size = BASE;
    at(KEEPER, 1000);
    p.set_keeper_price(U128(50_000_000), U64(1000));
    rejected(|| {
        p.request_order_signature(order(BASE, false));
    });
    at(OWNER, 1000);
    p.request_evm_withdrawal(EVM.into(), U128(10_000_000));
    assert_eq!(p.get_margin().unwrap().usable_margin.0, 90_000_000);
}
#[test]
fn flat_withdrawal_requires_fresh_equity_but_no_price_observation() {
    let mut p = policy();
    margin(&mut p, 100_000_000);
    p.reference_price_timestamp = 1;
    p.request_evm_withdrawal(EVM.into(), U128(10_000_000));
    assert!(p.get_margin().unwrap().withdrawal.is_some());
}
