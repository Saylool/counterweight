use super::*;
pub(super) fn config() -> RebalanceLimits {
    RebalanceLimits {
        adapter: account("router.testnet"),
        strategy_margin_address: EVM.into(),
        destination_token: crate::rebalance::HYPERCORE_USDC.into(),
        per_sale_near: U128(2 * BASE),
        daily_sale_near: U128(4 * BASE),
        max_fee_usdc: U128(50_000),
        max_impact_bps: 100,
        quote_age_ms: 30_000,
        completion_ms: 3_600_000,
        max_mismatch_near: U128(2 * BASE),
        per_withdrawal_usdc: U128(10_000_000),
        daily_withdrawal_usdc: U128(20_000_000),
        min_residual_equity_usdc: U128(10_000_000),
        min_headroom_bps: 1000,
        lower_headroom_bps: 3000,
        target_headroom_bps: 6000,
        upper_headroom_bps: 9000,
        fee_reserve_usdc: U128(100_000),
        original_target_usdc: U128(500_000_000),
    }
}
fn configured() -> Policy {
    let mut p = policy();
    at(OWNER, 1000);
    p.configure_rebalancing(config());
    p.observe_margin(U128(100_000_000), U128(80_000_000), U64(1_000_000));
    p.signed_short_size = 4 * BASE;
    p.settle_position(U128(0), U64(1_000_000));
    p
}
fn quote() -> SaleQuote {
    SaleQuote {
        near_amount: U128(BASE),
        paired_closed_near: U128(BASE),
        min_usdc: U128(4_900_000),
        fee_usdc: U128(50_000),
        impact_bps: 100,
        quoted_at_ms: U64(1_000_000),
        deadline_ms: U64(1_030_000),
    }
}
#[test]
fn rebalance_exact_route_reserves_inventory_and_credits_only_final_receipt() {
    let mut p = configured();
    p.approve_spot_sale(quote());
    assert_eq!(p.spot_balance, 99 * BASE);
    assert_eq!(p.rebalance.as_ref().unwrap().usable_margin.0, 100_000_000);
    let receipts = get_created_receipts();
    assert!(receipts.iter().flat_map(|r| &r.actions).any(|a| matches!(a, near_sdk::mock::MockAction::FunctionCallWeight { method_name, .. } if method_name == b"ft_transfer_call")));
    callback(
        PromiseResult::Successful(json_bytes(near_sdk::serde_json::json!(BASE.to_string()))),
        1001,
    );
    assert!(p.on_sale_dispatch(U64(1)));
    at(OWNER, 1002);
    p.reconcile_sale_receipt(
        U64(1),
        U128(0),
        U128(4_950_000),
        "final-hl-receipt".into(),
        U64(1_002_000),
    );
    assert_eq!(p.rebalance.as_ref().unwrap().usable_margin.0, 104_950_000);
    rejected(|| {
        p.reconcile_sale_receipt(
            U64(1),
            U128(0),
            U128(4_950_000),
            "final-hl-receipt".into(),
            U64(1_002_000),
        )
    });
}
#[test]
fn rebalance_rejects_keeper_recipient_changes_and_unsafe_quotes() {
    let mut p = configured();
    at(KEEPER, 1000);
    rejected(|| {
        p.approve_spot_sale(quote());
    });
    rejected(|| p.configure_rebalancing(config()));
    at(OWNER, 1000);
    rejected(|| p.configure_rebalancing(config())); // immutable route configuration
    for kind in 0..8 {
        let mut q = quote();
        match kind {
            0 => q.quoted_at_ms = U64(960_000),
            1 => q.deadline_ms = U64(999_999),
            2 => q.fee_usdc = U128(50_001),
            3 => q.impact_bps = 101,
            4 => q.min_usdc = U128(1),
            5 => q.near_amount = U128(3 * BASE),
            6 => q.paired_closed_near = U128(BASE / 2),
            _ => q.near_amount = U128(BASE + 1),
        }
        rejected(|| {
            p.approve_spot_sale(q);
        });
    }
}
#[test]
fn rebalance_failure_timeout_late_and_partial_refund_never_double_credit() {
    let mut p = configured();
    p.approve_spot_sale(quote());
    callback(PromiseResult::Failed, 1001);
    assert!(!p.on_sale_dispatch(U64(1)));
    assert_eq!(p.spot_balance, 99 * BASE); // uncertainty retains reserve
    at("anyone.testnet", 5000);
    p.expire_sale_route();
    assert!(p.paused);
    assert!(p.rebalance.as_ref().unwrap().route.is_some());
    at(OWNER, 5000);
    p.reconcile_sale_receipt(
        U64(1),
        U128(BASE / 2),
        U128(2_450_000),
        "partial-final".into(),
        U64(5_000_000),
    );
    assert_eq!(p.spot_balance, 99 * BASE + BASE / 2);
    assert_eq!(p.rebalance.as_ref().unwrap().usable_margin.0, 102_450_000);
    callback(
        PromiseResult::Successful(json_bytes(near_sdk::serde_json::json!(BASE.to_string()))),
        5001,
    );
    assert!(!p.on_sale_dispatch(U64(1)));
    assert_eq!(p.spot_balance, 99 * BASE + BASE / 2);
}
#[test]
fn rebalance_pending_route_blocks_additions_withdrawals_and_second_route_but_not_emergency() {
    let mut p = configured();
    p.approve_spot_sale(quote());
    rejected(|| {
        p.approve_spot_sale(quote());
    });
    rejected(|| {
        p.request_evm_withdrawal(EVM.into(), U128(1_000_000));
    });
    rejected(|| {
        p.withdraw_spot(account(OWNER), U128(BASE));
    });
    at(KEEPER, 1001);
    rejected(|| {
        p.request_order_signature(order(BASE, false));
    });
    at(OWNER, 1001);
    p.emergency_reduce(
        U128(100 * BASE),
        p.get_exit_pricing().anchor_price,
        U64(now()),
    );
    assert!(p.rebalance.as_ref().unwrap().route.is_some());
}
#[test]
fn rebalance_withdrawal_reserves_full_margin_and_caps_rolling_usage() {
    let mut p = configured();
    p.request_evm_withdrawal(EVM.into(), U128(10_000_000));
    assert_eq!(p.rebalance.as_ref().unwrap().usable_margin.0, 90_000_000);
    assert_eq!(p.rebalance.as_ref().unwrap().withdrawals.len(), 1);
    assert_eq!(p.outstanding.iter().filter(|a| a.withdrawal).count(), 1);
}
#[test]
fn rebalance_pending_withdrawal_blocks_risk_before_final_arrival() {
    let mut p = configured();
    p.request_evm_withdrawal(EVM.into(), U128(10_000_000));
    success(&mut p, 1001);
    at(KEEPER, 1002);
    rejected(|| {
        p.request_order_signature(order(2 * BASE, false));
    });
}
#[test]
fn rebalance_sale_daily_caps_and_margin_health() {
    let mut p = configured();
    p.rebalance
        .as_mut()
        .unwrap()
        .sales
        .push((999_000, 4 * BASE));
    rejected(|| {
        p.approve_spot_sale(quote());
    });
    p.rebalance.as_mut().unwrap().sales.clear();
    p.rebalance.as_mut().unwrap().usable_margin = U128(1);
    rejected(|| {
        p.approve_spot_sale(quote());
    });
    p.rebalance.as_mut().unwrap().usable_margin = U128(100_000_000);
    p.signed_short_size = 100 * BASE;
    rejected(|| {
        p.approve_spot_sale(quote());
    });
}
#[test]
fn rebalance_withdrawal_health_availability_and_fee_caps() {
    for (equity, available, amount) in [
        (10_000_000, 10_000_000, 1_000_000),
        (100_000_000, 999_999, 1_000_000),
        (100_000_000, 80_000_000, 10_000_001),
    ] {
        let mut p = configured();
        let r = p.rebalance.as_mut().unwrap();
        r.usable_margin = U128(equity);
        r.withdrawable = U128(available);
        rejected(|| {
            p.request_evm_withdrawal(EVM.into(), U128(amount));
        });
    }
}
#[test]
fn rebalance_final_withdrawal_arrival_requires_actual_spot_before_reentry() {
    let mut p = configured();
    p.limits.per_order_notional_cap = U128(20_200_000);
    p.limits.per_day_notional_cap = U128(40_400_000);
    p.request_evm_withdrawal(EVM.into(), U128(10_000_000));
    let nonce = p.last_nonce;
    success(&mut p, 1001);
    at(OWNER, 1002);
    rejected(|| {
        p.reconcile_margin_withdrawal(
            U64(nonce),
            U128(9_900_000),
            U128(100_000),
            "receipt".into(),
            U64(1_002_000),
        )
    });
    p.reconcile_margin_withdrawal(
        U64(nonce),
        U128(9_950_000),
        U128(50_000),
        "receipt".into(),
        U64(1_002_000),
    );
    at(KEEPER, 1003);
    rejected(|| {
        p.request_order_signature(order(2 * BASE, false));
    });
    // A real owner NEP-141 deposit is necessary; dollars arriving alone are not spot.
    at(TOKEN, 1003);
    p.ft_on_transfer(account(OWNER), U128(2 * BASE), String::new());
    at(KEEPER, 1003);
    rejected(|| {
        p.request_order_signature(order(2 * BASE, false));
    }); // upper price + fees exceeds net arrival
}
#[test]
fn rebalance_sale_requires_reconciled_matching_short_quantity() {
    let mut p = configured();
    p.rebalance.as_mut().unwrap().reduced_inventory = U128(0);
    rejected(|| {
        p.approve_spot_sale(quote());
    });
}
#[test]
fn rebalance_finalized_funded_reentry_obeys_inventory_dollar_and_health_bands() {
    let mut p = configured();
    p.rebalance.as_mut().unwrap().limits.per_withdrawal_usdc = U128(20_000_000);
    p.limits.per_order_notional_cap = U128(20_200_000);
    p.limits.per_day_notional_cap = U128(40_400_000);
    p.request_evm_withdrawal(EVM.into(), U128(20_000_000));
    let nonce = p.last_nonce;
    success(&mut p, 1001);
    at(OWNER, 1002);
    p.reconcile_margin_withdrawal(
        U64(nonce),
        U128(19_950_000),
        U128(50_000),
        "final".into(),
        U64(1_002_000),
    );
    at(TOKEN, 1003);
    p.ft_on_transfer(account(OWNER), U128(2 * BASE), String::new());
    at(KEEPER, 1003);
    p.request_order_signature(order(2 * BASE, false));
    assert_eq!(p.signed_short_size, 2 * BASE);
    assert_eq!(p.rebalance.as_ref().unwrap().acquired_near.0, 0);
    assert_eq!(
        p.rebalance.as_ref().unwrap().acquisition_budget_usdc.0,
        9_850_000
    );
}

#[test]
fn rebalance_receipt_cannot_be_reused_across_route_ids() {
    let mut p = configured();
    for id in [1, 2] {
        p.approve_spot_sale(quote());
        callback(
            PromiseResult::Successful(json_bytes(near_sdk::serde_json::json!(BASE.to_string()))),
            999 + 2 * id,
        );
        assert!(p.on_sale_dispatch(U64(id)));
        at(OWNER, 1000 + 2 * id);
        if id == 2 {
            rejected(|| {
                p.reconcile_sale_receipt(
                    U64(id),
                    U128(0),
                    U128(4_900_000),
                    "same-venue-receipt".into(),
                    U64((1000 + 2 * id) * 1000),
                )
            });
            assert!(p.rebalance.as_ref().unwrap().route.is_some());
            p.reconcile_sale_receipt(
                U64(id),
                U128(0),
                U128(4_900_000),
                "different-venue-receipt".into(),
                U64((1000 + 2 * id) * 1000),
            );
        } else {
            p.reconcile_sale_receipt(
                U64(id),
                U128(0),
                U128(4_900_000),
                "same-venue-receipt".into(),
                U64((1000 + 2 * id) * 1000),
            );
        }
    }
    assert_eq!(p.rebalance.as_ref().unwrap().usable_margin.0, 109_800_000);
}
