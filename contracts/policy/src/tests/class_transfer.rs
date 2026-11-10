use super::*;
#[test]
fn owner_nonce_callback_and_accounting() {
    let mut p = policy();
    at(OWNER, 1001);
    let before_spot = p.spot_balance;
    p.request_usd_class_transfer(U128(49_000_000), true);
    let nonce = p.last_nonce;
    let op = p.pending.clone().unwrap();
    assert!(matches!(op.kind, OperationKind::UsdClassTransfer));
    assert_eq!(op.expires_after, None);
    assert_eq!(op.callback_deadline_ms, 1_061_000);
    assert!(!op.keeper);
    assert_eq!(p.owner_requests.len(), 1);
    assert_eq!(p.keeper_weight_used, 0);
    assert_eq!(p.outstanding.len(), 1);
    assert!(!p.outstanding[0].withdrawal);
    assert!(
        get_logs()
            .iter()
            .any(|l| l.contains("\"toPerp\":true") && l.contains("\"amount\":\"49\""))
    );
    success(&mut p, 1001);
    at(OWNER, 1001);
    p.request_usd_class_transfer(U128(1), false);
    assert_eq!(p.last_nonce, nonce + 1);
    assert_eq!(p.spot_balance, before_spot);
    assert_eq!(p.signed_short_size, 0);
    callback(PromiseResult::Failed, 1002);
    assert!(!p.on_signature(U64(p.operation_id)));
    assert!(p.pending.is_none());
    assert_eq!(p.last_nonce, nonce + 1);
}
#[test]
fn rejects_unauthorized_amount_pending_and_open_risk() {
    for caller in [KEEPER, "stranger.testnet"] {
        let mut p = policy();
        at(caller, 1001);
        assert!(
            std::panic::catch_unwind(std::panic::AssertUnwindSafe(
                || p.request_usd_class_transfer(U128(1), true)
            ))
            .is_err()
        );
    }
    for amount in [0, 60_000_001, u128::MAX] {
        let mut p = policy();
        at(OWNER, 1001);
        assert!(
            std::panic::catch_unwind(std::panic::AssertUnwindSafe(
                || p.request_usd_class_transfer(U128(amount), true)
            ))
            .is_err()
        );
    }
    let mut p = policy();
    at(OWNER, 1001);
    p.request_usd_class_transfer(U128(1), true);
    assert!(
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(
            || p.request_usd_class_transfer(U128(1), true)
        ))
        .is_err()
    );
    let mut p = policy();
    p.signed_short_size = BASE;
    at(OWNER, 1001);
    assert!(
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(
            || p.request_usd_class_transfer(U128(1), false)
        ))
        .is_err()
    );
    p.signed_short_size = 0;
    p.last_open_expiry = 1_002_000;
    assert!(
        std::panic::catch_unwind(std::panic::AssertUnwindSafe(
            || p.request_usd_class_transfer(U128(1), false)
        ))
        .is_err()
    );
}
#[test]
fn expired_callback_never_emits_signature() {
    let mut p = policy();
    at(OWNER, 1001);
    p.request_usd_class_transfer(U128(60_000_000), true);
    callback(
        PromiseResult::Successful(json_bytes(near_sdk::serde_json::json!({}))),
        1062,
    );
    assert!(!p.on_signature(U64(p.operation_id)));
    assert!(p.pending.is_none());
    assert_eq!(p.outstanding.len(), 1);
    assert!(
        !get_logs()
            .iter()
            .any(|l| l.contains("\"event\":\"signature\""))
    );
}

#[test]
fn user_domain_and_existing_borsh_discriminants_are_fixed() {
    at(OWNER, 1001);
    for (kind, index) in [
        (OperationKind::Increase, 0),
        (OperationKind::Reduce, 1),
        (OperationKind::EvmWithdrawal, 2),
        (OperationKind::SpotWithdrawal, 3),
        (OperationKind::Cancel, 4),
        (OperationKind::Invalidation, 5),
        (OperationKind::UsdClassTransfer, 6),
    ] {
        assert_eq!(near_sdk::borsh::to_vec(&kind).unwrap(), vec![index]);
    }
    let base = near_sdk::serde_json::json!({"action":{"type":"usdClassTransfer","hyperliquidChain":"Testnet","signatureChainId":"0x66eee","amount":"49","toPerp":true,"nonce":1},"nonce":1});
    let original: SigningPayload = near_sdk::serde_json::from_value(base.clone()).unwrap();
    let digest = hl_digest::digest(&original, false).unwrap();
    assert!(hl_digest::digest(&original, true).is_err());
    for (field, value) in [
        ("hyperliquidChain", near_sdk::serde_json::json!("Mainnet")),
        ("signatureChainId", near_sdk::serde_json::json!("0x1")),
        ("nonce", near_sdk::serde_json::json!(2)),
    ] {
        let mut changed = base.clone();
        changed["action"][field] = value;
        assert!(
            hl_digest::digest(&near_sdk::serde_json::from_value(changed).unwrap(), false).is_err()
        );
    }
    let mut changed = base.clone();
    changed["expiresAfter"] = near_sdk::serde_json::json!(60001);
    assert!(hl_digest::digest(&near_sdk::serde_json::from_value(changed).unwrap(), false).is_err());
    let mut changed = base;
    changed["action"]["toPerp"] = near_sdk::serde_json::json!(false);
    assert_ne!(
        digest,
        hl_digest::digest(&near_sdk::serde_json::from_value(changed).unwrap(), false).unwrap()
    );
}
