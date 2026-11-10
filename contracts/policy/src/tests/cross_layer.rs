use super::*;
#[test]
fn cross_layer_decisions() {
    let cases: Vec<near_sdk::serde_json::Value> =
        near_sdk::serde_json::from_str(include_str!("../../fixtures/policy-scenarios.json"))
            .unwrap();
    let mut decisions = vec![];
    for x in cases {
        let n = |key: &str| x[key].as_str().unwrap().parse::<u128>().unwrap();
        let mut p = policy();
        p.signed_short_size = n("short");
        p.limits.max_short_size = U128(n("maxShort"));
        p.limits.per_order_notional_cap = U128(n("perOrder"));
        p.limits.per_day_notional_cap = U128(n("perDay"));
        p.limits.price_band_bps = x["band"].as_u64().unwrap() as u16;
        p.limits.cooldown_seconds = x["cooldown"].as_u64().unwrap();
        p.reference_price = n("price");
        p.turnover = vec![(1000, n("used"))];
        p.last_increase = Some(1000 - x["elapsed"].as_u64().unwrap());
        let mut l = super::rebalance::config();
        l.fee_reserve_usdc = U128(n("reserve"));
        l.min_headroom_bps = x["minHeadroom"].as_u64().unwrap() as u16;
        l.per_withdrawal_usdc = U128(n("withdrawalCap"));
        l.daily_withdrawal_usdc = U128(n("withdrawalDayCap"));
        l.min_residual_equity_usdc = U128(1_000_000);
        l.original_target_usdc = U128(500_000_000);
        at(OWNER, 1000);
        p.configure_rebalancing(l);
        p.spot_balance = n("spot");
        p.observe_margin(
            U128(n("equity")),
            U128(n("withdrawable").min(n("equity"))),
            U64(1_000_000),
        );
        let r = p.rebalance.as_mut().unwrap();
        r.withdrawable = U128(n("withdrawable"));
        r.withdrawals = vec![(1_000_000, n("withdrawalUsed"))];
        let action = x["action"].as_str().unwrap();
        let accepted = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| match action {
            "health" => p.assert_margin_health(n("short"), n("equity")),
            "withdraw" => {
                p.request_evm_withdrawal(EVM.into(), U128(n("size")));
            }
            _ => {
                at(KEEPER, 1000);
                p.request_order_signature(order(n("size"), action == "reduce"));
            }
        }))
        .is_ok();
        decisions.push(accepted);
    }
    println!(
        "CROSS_LAYER_DECISIONS={}",
        near_sdk::serde_json::to_string(&decisions).unwrap()
    );
}
