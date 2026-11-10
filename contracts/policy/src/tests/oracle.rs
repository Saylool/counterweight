use super::*;
fn price(price: &str, conf: &str, expo: i32, publish: i64) -> PromiseResult {
    PromiseResult::Successful(json_bytes(
        near_sdk::serde_json::json!({"price":price,"conf":conf,"expo":expo,"publish_time":publish}),
    ))
}
#[test]
fn oracle_is_permissionless_private_and_reads_fixed_feed() {
    let mut p = policy();
    p.oracle.account_id = Some(account("pyth.testnet"));
    at("stranger.testnet", 1000);
    p.refresh_oracle();
    let receipts = get_created_receipts();
    assert!(format!("{receipts:?}").contains("pyth.testnet"));
    let rejected = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| p.on_oracle_price()));
    assert!(rejected.is_err());
    callback(price("500000000", "100000", -8, 1000), 1001);
    assert!(p.on_oracle_price());
    assert_eq!(p.active_price(), (5_000_000, 1000));
    // A hostile caller price is ignored while the oracle is fresh.
    at(KEEPER, 1002);
    let mut o = order(BASE, true);
    o.reference_price = Some(U128(1_000_000_000_000));
    p.request_order_signature(o);
    assert!(
        get_logs()
            .iter()
            .any(|l| l.contains("\\\"p\\\":\\\"5.05\\\""))
            || get_logs().iter().any(|l| l.contains("\"p\":\"5.05\""))
    );
}
#[test]
fn oracle_stale_absent_uncertain_invalid_and_out_of_order_fail_closed() {
    let mut p = policy();
    p.oracle.account_id = Some(account("pyth.testnet"));
    for result in [
        PromiseResult::Failed,
        PromiseResult::Successful(b"null".to_vec()),
        PromiseResult::Successful(vec![b'x'; 513]),
        price("500000000", "5000001", -8, 1000),
        price("-1", "0", -8, 1000),
        price("0", "0", -8, 1000),
        price("500000000", "0", -19, 1000),
        price("500000000", "0", -8, 1002),
        price("500000000", "0", -8, 1),
        price("100000000000001", "0", 6, 1000),
    ] {
        callback(result, 1001);
        assert!(!p.on_oracle_price());
        assert_eq!(p.oracle_timestamp, 0);
    }
    callback(price("500000000", "5000000", -8, 1000), 1001);
    assert!(p.on_oracle_price());
    callback(price("510000000", "0", -8, 999), 1001);
    assert!(!p.on_oracle_price());
    at(KEEPER, 1301);
    assert!(!p.oracle_fresh());
    // Stale fallback cannot open; bounded keeper refresh restores autonomy.
    assert!(
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(
            || p.request_order_signature(order(BASE, false))
        ))
        .is_err()
    );
    p.set_keeper_price(U128(5_100_000), U64(1301));
    p.request_order_signature(order(BASE, false));
}
#[test]
fn sane_fallback_rejects_scale_errors_stale_future_and_owner_oracle_override() {
    let mut p = policy();
    for px in [4_000_000, 6_000_000, 7_000_000] {
        p.set_keeper_price(U128(px), U64(1000));
    }
    for (px, ts) in [
        (1_000_000_000_001, 1000),
        (9, 1000),
        (5_000_000, 1001),
        (5_000_000, 1),
    ] {
        assert!(
            std::panic::catch_unwind(std::panic::AssertUnwindSafe(
                || p.set_keeper_price(U128(px), U64(ts))
            ))
            .is_err()
        );
    }
    at(OWNER, 1001);
    assert!(
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(
            || p.set_reference_price(U128(1_000_000_000_001))
        ))
        .is_err()
    );
    p.oracle.account_id = Some(account("pyth.testnet"));
    p.oracle_price = 5_000_000;
    p.oracle_timestamp = 1001;
    assert!(
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(
            || p.set_reference_price(U128(5_000_000))
        ))
        .is_err()
    );
}

#[test]
fn configured_keeper_maximum_direct_execution_debit_bound() {
    let mut p = policy();
    p.limits.max_short_size = U128(BASE);
    p.size_decimals = 1;
    p.oracle.min_price = U128(950_000);
    p.oracle.max_price = U128(1_050_000);
    let slots = p.keeper_weight_limit / 5;
    let max_limit = quantize_price(p.oracle.max_price.0 * 10100 / 10000, p.size_decimals, true);
    let max_notional = (p.limits.max_short_size.0 * max_limit).div_ceil(BASE);
    // Conservative debit includes principal, not merely adverse slippage. Per-action rounding up.
    let debit = (max_notional * 1_000_450).div_ceil(1_000_000);
    assert_eq!(max_limit, 1_060_500);
    assert_eq!(slots * debit as u64, 1_060_978_000); // $1060.978 for 1000 authorizations
    for i in 0..=100 {
        let hint = p.oracle.min_price.0 + i * 1000;
        assert!(quantize_price((hint * 10100).div_ceil(10000), 1, true) <= max_limit);
    }
    // The keeper/public budget cannot be reset by the keeper or a rolling day.
    p.keeper_weight_used = 5000;
    at(KEEPER, 1000);
    assert!(
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(
            || p.request_cancel_signature(U64(0))
        ))
        .is_err()
    );
}

#[test]
fn immutable_mainnet_domain_and_network_accounts() {
    let mut ctx = context("owner.near", 1000);
    ctx.current_account_id(account("policy.near"));
    testing_env!(ctx.build());
    let p = Policy::new(
        account("owner.near"),
        account("keeper.near"),
        4,
        1,
        "path".into(),
        EVM.into(),
        account("v1.signer"),
        account("wrap.near"),
        limits(),
        600,
        U128(5_000_000),
        None,
        oracle_config(),
        Network::Mainnet,
    );
    assert_eq!(p.get_state().network, Network::Mainnet);
    let test = SigningPayload {
        action: HlAction::Noop,
        nonce: 1000000,
        expires_after: Some(1060000),
    };
    assert_ne!(
        hl_digest::digest(&test, true).unwrap(),
        hl_digest::digest(&test, false).unwrap()
    );
    let withdrawal = SigningPayload {
        action: HlAction::Withdraw {
            hyperliquid_chain: "Mainnet".into(),
            signature_chain_id: "0x66eee".into(),
            destination: EVM.into(),
            amount: "1".into(),
            time: 1000000,
        },
        nonce: 1000000,
        expires_after: None,
    };
    assert_eq!(
        hl_digest::digest(&withdrawal, true).unwrap(),
        hl_digest::withdraw_digest(EVM, "1", 1000000, true).unwrap()
    );
    assert!(hl_digest::digest(&withdrawal, false).is_err());
    assert!(!Network::Mainnet.matches_account(&account("signer.testnet")));
    assert!(!Network::Testnet.matches_account(&account("wrap.near")));
}
