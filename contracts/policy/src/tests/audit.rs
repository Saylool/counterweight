use super::*;

fn requested_price() -> String {
    let log = get_logs()
        .into_iter()
        .find(|l| l.contains("\"event\":\"request\""))
        .unwrap();
    let v: near_sdk::serde_json::Value =
        near_sdk::serde_json::from_str(log.strip_prefix("EVENT_JSON:").unwrap()).unwrap();
    v["data"][0]["payload"]["action"]["orders"][0]["p"]
        .as_str()
        .unwrap()
        .to_owned()
}
#[test]
fn audit_nonround_near_price_obeys_ticks() {
    let mut p = policy();
    p.size_decimals = 1;
    p.reference_price = 5_123_000;
    p.signed_short_size = BASE;
    p.request_order_signature(order(BASE, true));
    let px = requested_price();
    assert!(
        px.replace('.', "").trim_start_matches('0').len() <= 5,
        "{px}"
    );
}
#[test]
fn audit_residual_reduce_after_understated_settlement() {
    let mut p = policy();
    at(OWNER, 1001);
    p.settle_position(U128(0), U64(1_001_000));
    p.emergency_reduce(U128(10 * BASE), U128(5_000_000));
    assert!(p.pending.is_some());
}
#[test]
fn audit_withdraw_timeout_remains_revocable() {
    let mut p = policy();
    at(OWNER, 1000);
    prepare_margin(&mut p);
    p.request_evm_withdrawal(EVM.into(), U128(1_000_000));
    at(OWNER, 1061);
    p.expire_pending_signature();
    assert_eq!(p.outstanding.len(), 1);
    assert!(p.outstanding[0].expires_after > 1_061_000);
}
#[test]
#[should_panic(expected = "ERR_OPEN_SHORT")]
fn audit_withdraw_rejects_open_short() {
    let mut p = policy();
    p.signed_short_size = BASE;
    at(OWNER, 1000);
    p.request_evm_withdrawal(EVM.into(), U128(1));
}
#[test]
fn audit_pause_without_signing_resources_commits() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    let mut ctx = context(OWNER, 1001);
    ctx.attached_deposit(NearToken::from_yoctonear(0))
        .prepaid_gas(Gas::from_tgas(50));
    testing_env!(ctx.build());
    p.set_paused(true);
    assert!(p.paused);
    assert!(p.outstanding[0].discarded);
}
#[test]
fn audit_emergency_marks_withheld_keeper_nonce() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    at(OWNER, 1001);
    p.emergency_reduce(U128(BASE), U128(5_000_000));
    assert!(p.paused);
    assert!(p.outstanding[0].discarded);
}
#[test]
fn audit_definite_signer_failure_releases_only_exposure() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    callback(PromiseResult::Failed, 1001);
    assert!(!p.on_signature(U64(1)));
    assert_eq!(p.signed_short_size, 0);
    assert_eq!(p.daily_usage, 5_050_000);
    assert_eq!(p.last_nonce, 1_000_000);
}
#[test]
fn audit_rolling_turnover_cannot_double_at_midnight() {
    let mut p = policy();
    p.limits.cooldown_seconds = 0;
    p.limits.per_day_notional_cap = U128(5_050_000);
    at(KEEPER, 86399);
    p.reference_price_timestamp = 86399;
    p.request_order_signature(order(BASE, false));
    success(&mut p, 86399);
    at(KEEPER, 86400);
    let rejected = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        p.request_order_signature(order(BASE, false))
    }));
    assert!(rejected.is_err());
}
#[test]
fn audit_owner_config_preempts_keeper_cancel() {
    let mut p = policy();
    p.request_cancel_signature(U64(1));
    at(OWNER, 1001);
    p.set_config(account(KEEPER), limits(), 600);
    assert!(p.pending.is_none());
}
#[test]
fn audit_nonce_drift_zero_rejected() {
    let l = SigningLimits {
        max_nonce_ahead_ms: 0,
        ..SigningLimits::default()
    };
    assert!(std::panic::catch_unwind(|| validate_signing_limits(&l)).is_err());
}
#[test]
fn audit_cumulative_keeper_budget_reserves_owner_capacity() {
    let mut p = policy();
    at(OWNER, 1000);
    p.set_keeper_address_budget(U64(5));
    at(KEEPER, 1000);
    p.request_cancel_signature(U64(1));
    success(&mut p, 1001);
    at(KEEPER, 1061);
    rejected(|| {
        p.request_cancel_signature(U64(2));
    });
    at(OWNER, 1061);
    p.emergency_reduce(U128(BASE), U128(5_750_000));
}
#[test]
fn audit_configurable_mpc_fee_gas_and_refund() {
    let mut p = policy();
    at(OWNER, 1000);
    p.set_signing_resources(U128(123), 200, 30);
    let mut ctx = context(KEEPER, 1001);
    ctx.attached_deposit(NearToken::from_yoctonear(130))
        .prepaid_gas(Gas::from_tgas(260));
    testing_env!(ctx.build());
    p.request_cancel_signature(U64(1));
    assert_eq!(get_created_receipts().len(), 3); // refund, signer, callback
}
#[test]
fn audit_native_sweep_preserves_storage_and_operating_reserve() {
    let mut p = policy();
    at(OWNER, 1000);
    p.sweep_native(U128(BASE));
    rejected(|| {
        p.sweep_native(U128(100 * BASE));
    });
}
#[test]
fn audit_rally_closes_and_price_precision_matrix() {
    for mark in [
        12,
        12_345,
        5_123_000,
        9_999_999,
        123_456_789,
        999_999_999_999,
    ] {
        let mut p = policy();
        p.oracle.min_price = U128(10);
        p.oracle.max_price = U128(1_000_000_000_000); // precision test explicitly spans full configured range
        p.size_decimals = 1;
        p.reference_price = 5_123_000;
        p.reference_price_timestamp = 1;
        p.signed_short_size = BASE;
        at(OWNER, 5000);
        p.emergency_reduce(U128(10 * BASE), U128(mark));
        let px = requested_price();
        let fractional = px.split('.').nth(1).unwrap_or("");
        assert!(fractional.len() <= 5, "{px}");
        assert!(
            fractional.is_empty() || px.replace('.', "").trim_start_matches('0').len() <= 5,
            "{px}"
        );
        assert!(px.parse::<f64>().unwrap() >= mark as f64 / 1e6);
    }
    let mut p = policy();
    p.signed_short_size = BASE;
    at("anyone.testnet", 5000);
    p.deleverage(U128(5_750_000));
    assert!(requested_price().parse::<f64>().unwrap() >= 5.75); // +15% rally, crossing ask
}
#[test]
fn audit_withdraw_requires_invalidation_before_retry() {
    let mut p = policy();
    at(OWNER, 1000);
    prepare_margin(&mut p);
    p.request_evm_withdrawal(EVM.into(), U128(1_000_000));
    at(OWNER, 1061);
    p.expire_pending_signature();
    rejected(|| {
        p.request_evm_withdrawal(EVM.into(), U128(1_000_000));
    });
    p.set_paused(true);
    assert!(matches!(
        p.pending.as_ref().unwrap().kind,
        OperationKind::Invalidation
    ));
    assert!(p.pending.as_ref().unwrap().expires_after.unwrap() <= 1_121_000);
    success(&mut p, 1062);
    at(OWNER, 1062);
    p.report_invalidation(U64(1_000_000), true);
    p.set_reference_price(U128(5_000_000));
    p.abandon_margin_withdrawal();
    prepare_margin(&mut p);
    p.request_evm_withdrawal(EVM.into(), U128(1_000_000));
}
#[test]
fn audit_real_mpc_fixture_and_flat_schema() {
    let fixture: near_sdk::serde_json::Value = near_sdk::serde_json::from_str(include_str!(
        "../../../../fixtures/nearblocks-mpc-response.json"
    ))
    .unwrap();
    for flat in [false, true] {
        let mut p = policy();
        p.request_cancel_signature(U64(1));
        let mut response = fixture["signatureResponse"].clone();
        if flat {
            response["big_r"] = response["big_r"]["affine_point"].clone();
            response["s"] = response["s"]["scalar"].clone();
        }
        callback(PromiseResult::Successful(json_bytes(response)), 1001);
        assert!(p.on_signature(U64(1)));
    }
}

#[test]
fn audit_emits_pause_request_fixture_for_ts_relay() {
    let mut p = policy();
    p.request_cancel_signature(U64(1));
    success(&mut p, 1001);
    at(OWNER, 1002);
    p.set_paused(true);
    let value = request_event();
    let target = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("target");
    std::fs::create_dir_all(&target).unwrap();
    std::fs::write(
        target.join("pause-request.json"),
        near_sdk::serde_json::to_vec_pretty(&value).unwrap(),
    )
    .unwrap();
    assert_eq!(value["payload"]["action"]["type"], "noop");
}
#[test]
fn audit_initializer_and_resource_guards() {
    for (current, signer, token, decimals, expected) in [
        (
            "policy.near",
            "signer.testnet",
            TOKEN,
            1,
            "ERR_TESTNET_ONLY",
        ),
        (CONTRACT, "signer.near", TOKEN, 1, "ERR_TESTNET_SIGNER"),
        (
            CONTRACT,
            "signer.testnet",
            "wrap.near",
            1,
            "ERR_TESTNET_WNEAR",
        ),
        (CONTRACT, "signer.testnet", TOKEN, 7, "ERR_SIZE_DECIMALS"),
    ] {
        let mut ctx = context(OWNER, 1000);
        ctx.current_account_id(account(current));
        testing_env!(ctx.build());
        let result = std::panic::catch_unwind(|| {
            Policy::new(
                account(OWNER),
                account(KEEPER),
                4,
                decimals,
                "path".into(),
                EVM.into(),
                account(signer),
                account(token),
                limits(),
                600,
                U128(5_000_000),
                None,
                oracle_config(),
                Network::Testnet,
            )
        });
        assert!(format!("{:?}", result.err().unwrap().downcast_ref::<String>()).contains(expected));
    }
    if !cfg!(feature = "test-utils") {
        let mut ctx = context(OWNER, 1000);
        ctx.current_account_id(account("policy.test.near"));
        testing_env!(ctx.build());
        rejected(|| {
            Policy::new(
                account(OWNER),
                account(KEEPER),
                4,
                1,
                "path".into(),
                EVM.into(),
                account("signer.testnet"),
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
    let mut p = policy();
    let mut ctx = context(KEEPER, 1000);
    ctx.attached_deposit(NearToken::from_yoctonear(0))
        .account_balance(NearToken::from_yoctonear(Policy::storage_reserve()));
    testing_env!(ctx.build());
    rejected(|| {
        p.request_cancel_signature(U64(1));
    });
    let mut ctx = context(KEEPER, 1000);
    ctx.prepaid_gas(Gas::from_tgas(284));
    testing_env!(ctx.build());
    rejected(|| {
        p.request_cancel_signature(U64(1));
    });
    ctx.prepaid_gas(Gas::from_tgas(285));
    testing_env!(ctx.build());
    p.request_cancel_signature(U64(1));
}
#[test]
fn audit_deposit_rejects_nonempty_message_and_zero_amount() {
    let mut p = policy();
    at(TOKEN, 1000);
    rejected(|| {
        p.ft_on_transfer(account(OWNER), U128(BASE), "arbitrary route".into());
    });
    rejected(|| {
        p.ft_on_transfer(account(OWNER), U128(0), String::new());
    });
    assert_eq!(p.spot_balance, 100 * BASE);
}
#[test]
fn audit_full_outstanding_queue_can_still_pause_and_invalidate() {
    let mut p = policy();
    for nonce in 0..32 {
        p.outstanding.push(Authorization {
            nonce,
            expires_after: 1_060_000,
            keeper: false,
            discarded: false,
            invalidation_requested: false,
            invalidation_signed: false,
            invalidation_confirmed: false,
            withdrawal: false,
        });
    }
    at(OWNER, 1000);
    p.set_paused(true);
    assert!(p.paused);
    assert!(matches!(
        p.pending.as_ref().unwrap().kind,
        OperationKind::Invalidation
    ));
}
#[test]
fn audit_private_successful_detached_callback_and_public_recovery_after_owner_deadline() {
    let mut p = policy();
    p.request_order_signature(order(BASE, false));
    at(OWNER, 1600);
    p.emergency_reduce(U128(BASE), U128(5_750_000));
    let owner_id = p.operation_id;
    let fixture: near_sdk::serde_json::Value = near_sdk::serde_json::from_str(include_str!(
        "../../../../fixtures/nearblocks-mpc-response.json"
    ))
    .unwrap();
    callback(
        PromiseResult::Successful(json_bytes(fixture["signatureResponse"].clone())),
        1601,
    );
    assert!(!p.on_signature(U64(1)));
    assert_eq!(p.pending.as_ref().unwrap().id, owner_id);
    at("anyone.testnet", 1661);
    p.deleverage(U128(5_750_000));
    assert!(p.operation_id > owner_id);
    let public_id = p.operation_id;
    callback(
        PromiseResult::Successful(json_bytes(fixture["signatureResponse"].clone())),
        1662,
    );
    assert!(!p.on_signature(U64(owner_id)));
    assert_eq!(p.pending.as_ref().unwrap().id, public_id);
}
#[test]
fn audit_mpc_scalar_and_event_guards() {
    for scalar in ["00".repeat(32), "ff".repeat(32), "80".repeat(32)] {
        let mut p = policy();
        p.request_cancel_signature(U64(1));
        callback(
            PromiseResult::Successful(json_bytes(
                near_sdk::serde_json::json!({"scheme":"Secp256k1", "big_r":format!("02{}", "11".repeat(32)), "s": scalar, "recovery_id":0}),
            )),
            1001,
        );
        assert!(!p.on_signature(U64(1)));
    }
    let mut p = policy();
    at(OWNER, 1000);
    p.set_config(account(KEEPER), limits(), 777);
    assert!(
        get_logs()
            .iter()
            .any(|l| l.contains("\"heartbeat_timeout_seconds\":777"))
    );
    prepare_margin(&mut p);
    p.request_evm_withdrawal(EVM.into(), U128(1_000_000));
    assert!(
        get_logs()
            .iter()
            .any(|l| l.contains("\"kind\":\"EvmWithdrawal\"")
                && l.contains("\"caller\":\"owner.testnet\""))
    );
    callback(PromiseResult::Failed, 1001);
    p.on_signature(U64(p.operation_id));
    assert!(
        get_logs()
            .iter()
            .any(|l| l.contains("\"kind\":\"withdraw3\"") && l.contains("\"status\":\"failed\""))
    );
}
#[test]
fn audit_limits_evm_self_authority_and_spot_resources() {
    let mut invalid = limits();
    invalid.price_band_bps = 10_000;
    rejected(|| validate_limits(&invalid));
    rejected(|| validate_evm("0x0000000000000000000000000000000000000000"));
    rejected(|| validate_evm("invalid"));
    at(OWNER, 1000);
    rejected(|| {
        Policy::new(
            account(OWNER),
            account(OWNER),
            54,
            1,
            "path".into(),
            EVM.into(),
            account("signer.testnet"),
            account(TOKEN),
            limits(),
            600,
            U128(5_000_000),
            None,
            oracle_config(),
            Network::Testnet,
        );
    });
    let mut p = policy();
    let mut ctx = context(OWNER, 1000);
    ctx.prepaid_gas(Gas::from_tgas(79));
    testing_env!(ctx.build());
    rejected(|| {
        p.withdraw_spot(account(OWNER), U128(BASE));
    });
    ctx.prepaid_gas(Gas::from_tgas(80))
        .attached_deposit(NearToken::from_yoctonear(0));
    testing_env!(ctx.build());
    rejected(|| {
        p.withdraw_spot(account(OWNER), U128(BASE));
    });
}
#[test]
fn audit_open_price_rounding_nonround_bands_matrix() {
    for price in [12_345, 5_123_000, 99_999_999] {
        for band in [1, 137, 999] {
            let mut p = policy();
            p.size_decimals = 1;
            p.reference_price = price;
            p.limits.price_band_bps = band;
            p.limits.per_order_notional_cap = U128(1_000_000_000);
            p.limits.per_day_notional_cap = U128(1_000_000_000);
            p.request_order_signature(order(BASE, false));
            let px = requested_price();
            assert!(px.split('.').nth(1).unwrap_or("").len() <= 5);
            assert!(px.replace('.', "").trim_start_matches('0').len() <= 5);
            let lower = price as f64 / 1e6 * (1.0 - f64::from(band) / 10_000.0);
            assert!(px.parse::<f64>().unwrap() <= lower + 1e-12);
        }
    }
}

#[test]
fn audit_zero_deposit_signing_uses_bounded_operating_reserve() {
    let mut p = policy();
    p.mpc_fee = BASE / 100;
    let mut ctx = context(KEEPER, 1001);
    ctx.attached_deposit(NearToken::from_yoctonear(0))
        .account_balance(NearToken::from_yoctonear(
            Policy::storage_reserve() + p.mpc_fee,
        ));
    testing_env!(ctx.build());
    p.request_cancel_signature(U64(0));
    let receipts = get_created_receipts();
    assert_eq!(receipts.len(), 2); // signer + callback; no refund of contract funds
    assert!(format!("{:?}", receipts[0]).contains(&p.mpc_fee.to_string()));
}
#[test]
fn audit_reserve_fee_rejects_storage_drain_large_fee_and_partial_deposit() {
    for (fee, attached, available) in [(123, 0, 122), (BASE / 100 + 1, 0, BASE), (123, 122, BASE)] {
        let mut p = policy();
        p.mpc_fee = fee;
        let mut ctx = context(KEEPER, 1001);
        ctx.attached_deposit(NearToken::from_yoctonear(attached))
            .account_balance(NearToken::from_yoctonear(
                Policy::storage_reserve() + available,
            ));
        testing_env!(ctx.build());
        assert!(!p.has_signing_resources());
        rejected(|| {
            p.request_cancel_signature(U64(0));
        });
        assert!(p.pending.is_none());
        assert_eq!(p.last_nonce, 0);
        assert!(get_created_receipts().is_empty());
    }
}
