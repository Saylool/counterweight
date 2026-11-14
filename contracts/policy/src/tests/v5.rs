use super::*;

#[test]
fn forged_high_exit_marks_rejected_for_every_authority() {
    for role in [OWNER, KEEPER, "anyone.testnet"] {
        for forged in [6_000_000, 50_000_000, 1_000_000_000_000] {
            let mut p = policy();
            p.signed_short_size = BASE;
            at(role, 1600);
            rejected(|| match role {
                OWNER => {
                    p.emergency_reduce(U128(BASE), U128(forged), U64(1600));
                }
                KEEPER => {
                    let mut o = order(BASE, true);
                    o.reference_price = Some(U128(forged));
                    p.request_order_signature(o);
                }
                _ => {
                    p.deleverage(U128(forged), U64(1600));
                }
            });
            assert_eq!(p.get_exit_pricing().anchor_price.0, 5_000_000);
            assert_eq!(p.signed_short_size, BASE);
        }
    }
}

#[test]
fn stale_feed_cannot_authorize_forged_post_timeout_public_price() {
    let mut p = policy();
    p.oracle.account_id = Some(account("pyth.testnet"));
    callback(
        PromiseResult::Successful(json_bytes(near_sdk::serde_json::json!({
            "price":"5000000", "conf":"0", "expo":-6, "publish_time":1000
        }))),
        1001,
    );
    assert!(p.on_oracle_price());
    at("anyone.testnet", 1600);
    rejected(|| {
        p.deleverage(U128(6_000_000), U64(1600));
    });
    at("anyone.testnet", 1600);
    p.deleverage(U128(5_000_000), U64(1600));
    assert_eq!(
        request_event()["payload"]["action"]["orders"][0]["p"],
        "5.05"
    );
}

#[test]
fn caller_cache_and_non_oracle_additions_never_ratchet_anchor() {
    let mut p = policy();
    p.limits.price_band_bps = 10;
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    let anchor = p.get_exit_pricing().anchor_price.0;
    assert_eq!(anchor, 4_995_000);
    at(KEEPER, 1060);
    p.set_keeper_price(U128(6_000_000), U64(1060));
    p.request_order_signature(order(BASE, false));
    assert_eq!(p.get_exit_pricing().anchor_price.0, anchor);
    success(&mut p, 1061);
    at(OWNER, 1062);
    p.set_reference_price(U128(7_000_000));
    assert_eq!(p.get_exit_pricing().anchor_price.0, anchor);
    at(KEEPER, 1062);
    rejected(|| {
        let mut o = order(BASE, true);
        o.reference_price = Some(U128(6_000_000));
        p.request_order_signature(o);
    });
    at(KEEPER, 1062);
    p.request_order_signature(order(BASE, true));
    assert_eq!(p.get_exit_pricing().anchor_price.0, anchor);
    success(&mut p, 1063);
    at(KEEPER, 1064);
    p.request_order_signature(order(BASE, true));
    assert_eq!(p.get_exit_pricing().anchor_price.0, anchor);
}

#[test]
fn fallback_limit_caps_combined_partial_execution_to_one_percent_margin() {
    let mut p = policy();
    at(OWNER, 1000);
    p.configure_margin_withdrawals(crate::withdrawals::MarginLimits {
        per_withdrawal_usdc: U128(10_000_000),
        daily_withdrawal_usdc: U128(20_000_000),
        min_residual_equity_usdc: U128(1_000_000),
        min_headroom_bps: 1000,
        fee_reserve_usdc: U128(100_000),
        max_fee_usdc: U128(1_000_000),
    });
    p.observe_margin(U128(20_000_000), U128(20_000_000), U64(1_000_000));
    p.limits.price_band_bps = 10;
    at(KEEPER, 1000);
    p.request_order_signature(order(BASE, false));
    success(&mut p, 1001);
    // Simulate a smaller retained margin to exercise the direct margin-derived cap.
    let mut margin = p.get_margin().unwrap();
    margin.usable_margin = U128(1_000_000);
    p.save_margin(margin);
    let pricing = p.get_exit_pricing();
    assert_eq!(
        pricing.max_fallback_price.0,
        pricing.anchor_price.0 + 10_000
    );
    let aggregate_adverse =
        p.signed_short_size * (pricing.max_fallback_price.0 - pricing.anchor_price.0) / BASE;
    assert!(aggregate_adverse <= p.get_margin().unwrap().usable_margin.0 / 100);
    at(KEEPER, 1002);
    p.request_order_signature(order(BASE / 2, true));
    assert_eq!(
        request_event()["payload"]["action"]["orders"][0]["p"],
        "5.005"
    );
    success(&mut p, 1003);
    // A partial owner settlement cannot increase the remaining authorization cap.
    at(OWNER, 1064);
    p.settle_position(U128(BASE / 2), U64(1_064_000));
    assert_eq!(
        p.get_exit_pricing().max_fallback_price,
        pricing.max_fallback_price
    );
    at(KEEPER, 1064);
    p.request_order_signature(order(BASE / 2, true));
    assert_eq!(
        request_event()["payload"]["action"]["orders"][0]["p"],
        "5.005"
    );
}

#[test]
fn fallback_requires_timelocked_corridor_even_inside_anchor_band() {
    let mut p = policy();
    p.oracle.min_price = U128(5_001_000);
    rejected(|| {
        p.request_order_signature(order(BASE, true));
    });
}

#[test]
fn mainnet_open_requires_owner_margin_configuration() {
    let mut p = policy();
    p.network = Network::Mainnet;
    rejected(|| {
        p.request_order_signature(order(BASE, false));
    });
    assert_eq!(p.signed_short_size, 0);
}
