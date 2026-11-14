use super::*;

fn mainnet_context(caller: &str, seconds: u64) {
    let mut ctx = context(caller, seconds);
    ctx.current_account_id(account("policy.owner.near"));
    testing_env!(ctx.build());
}

fn mainnet_policy(signer: &str, token: &str) -> Policy {
    Policy::new(
        account("owner.near"),
        account("keeper.near"),
        74,
        1,
        "counterweight-v4-mainnet".into(),
        EVM.into(),
        account(signer),
        account(token),
        limits(),
        600,
        U128(5_000_000),
        None,
        oracle_config(),
        Network::Mainnet,
    )
}

#[test]
fn mainnet_initializer_pins_services_and_rejects_testnet_policy() {
    mainnet_context("owner.near", 1000);
    let p = mainnet_policy("v1.signer", "wrap.near");
    assert_eq!(p.network, Network::Mainnet);
    for (signer, token) in [
        ("v1.signer-prod.testnet", "wrap.near"),
        ("attacker.near", "wrap.near"),
        ("v1.signer", "wrap.testnet"),
        ("v1.signer", "attacker.near"),
    ] {
        mainnet_context("owner.near", 1000);
        rejected(|| {
            mainnet_policy(signer, token);
        });
    }
    for current in ["policy.testnet", "policy.test.near"] {
        let mut ctx = context("owner.near", 1000);
        ctx.current_account_id(account(current));
        testing_env!(ctx.build());
        rejected(|| {
            mainnet_policy("v1.signer", "wrap.near");
        });
    }
}

#[test]
fn mainnet_class_transfer_and_withdraw_build_sdk_domains() {
    mainnet_context("owner.near", 1000);
    let mut p = mainnet_policy("v1.signer", "wrap.near");
    p.request_usd_class_transfer(U128(20_000_000), true);
    let e = request_event();
    assert_eq!(e["payload"]["action"]["hyperliquidChain"], "Mainnet");
    assert_eq!(e["payload"]["action"]["signatureChainId"], "0x66eee");
    let payload: SigningPayload = near_sdk::serde_json::from_value(e["payload"].clone()).unwrap();
    assert_eq!(
        e["digest"],
        hex(&hl_digest::digest(&payload, true).unwrap())
    );
    assert!(hl_digest::digest(&payload, false).is_err());

    // A fresh controller independently exercises the margin withdrawal builder.
    mainnet_context("owner.near", 1100);
    let mut p = mainnet_policy("v1.signer", "wrap.near");
    env::storage_remove(b"v3:margin");
    p.configure_margin_withdrawals(crate::withdrawals::MarginLimits {
        per_withdrawal_usdc: U128(20_000_000),
        daily_withdrawal_usdc: U128(20_000_000),
        min_residual_equity_usdc: U128(1_000_000),
        min_headroom_bps: 1000,
        fee_reserve_usdc: U128(1_000_000),
        max_fee_usdc: U128(1_000_000),
    });
    p.observe_margin(U128(20_000_000), U128(20_000_000), U64(1_100_000));
    p.request_evm_withdrawal(EVM.into(), U128(18_000_000));
    let e = request_event();
    assert_eq!(e["payload"]["action"]["hyperliquidChain"], "Mainnet");
    assert_eq!(e["payload"]["action"]["signatureChainId"], "0x66eee");
    let payload: SigningPayload = near_sdk::serde_json::from_value(e["payload"].clone()).unwrap();
    assert_eq!(
        e["digest"],
        hex(&hl_digest::digest(&payload, true).unwrap())
    );
    assert!(hl_digest::digest(&payload, false).is_err());
}

#[test]
fn mainnet_sdk_vectors_include_l1_withdraw_and_both_class_directions() {
    let fixture: near_sdk::serde_json::Value = near_sdk::serde_json::from_str(include_str!(
        "../../fixtures/hyperliquid-signing-vectors.json"
    ))
    .unwrap();
    mainnet_context("owner.near", 1000);
    for name in [
        "mainnet-order",
        "mainnet-withdraw3",
        "mainnet-usdClassTransfer-to-perp",
        "mainnet-usdClassTransfer-to-spot",
    ] {
        let vector = fixture["vectors"]
            .as_array()
            .unwrap()
            .iter()
            .find(|v| v["name"] == name)
            .unwrap();
        let action: HlAction = near_sdk::serde_json::from_value(
            vector
                .get("wireAction")
                .unwrap_or(&vector["action"])
                .clone(),
        )
        .unwrap();
        let payload = SigningPayload {
            action,
            nonce: vector["nonce"].as_u64().unwrap(),
            expires_after: None,
        };
        assert_eq!(
            format!("0x{}", hex(&hl_digest::digest(&payload, true).unwrap())),
            vector["digest"],
            "{name}"
        );
        if name == "mainnet-order" {
            assert_ne!(
                hl_digest::digest(&payload, true).unwrap(),
                hl_digest::digest(&payload, false).unwrap()
            );
        } else {
            assert!(hl_digest::digest(&payload, false).is_err());
            let mut wrong_domain = near_sdk::serde_json::to_value(&payload).unwrap();
            wrong_domain["action"]["signatureChainId"] = "0xa4b1".into();
            let wrong_domain: SigningPayload =
                near_sdk::serde_json::from_value(wrong_domain).unwrap();
            assert!(hl_digest::digest(&wrong_domain, true).is_err());
        }
    }
}

#[test]
fn concurrent_exit_cannot_be_overwritten_by_any_exit_authority() {
    for role in [OWNER, KEEPER, "anyone.testnet"] {
        let mut p = policy();
        at(OWNER, 1600);
        p.withdraw_spot(account(OWNER), U128(BASE));
        let spot_id = p.operation_id;
        at(OWNER, 1600);
        p.emergency_reduce(U128(BASE), p.get_exit_pricing().anchor_price, U64(1600));
        let exit_id = p.operation_id;
        let nonce = p.last_nonce;
        at(role, 1601);
        rejected(|| match role {
            OWNER => {
                p.emergency_reduce(U128(BASE), p.get_exit_pricing().anchor_price, U64(1601));
            }
            KEEPER => {
                p.request_order_signature(order(BASE, true));
            }
            _ => {
                p.deleverage(p.get_exit_pricing().anchor_price, U64(1601));
            }
        });
        assert_eq!(p.get_pending_exit().unwrap().id, exit_id);
        assert_eq!(p.pending.as_ref().unwrap().id, spot_id);
        assert_eq!(p.last_nonce, nonce);
        assert_eq!(p.operation_id, exit_id);
    }
}

#[test]
fn outstanding_exit_blocks_open_cancel_and_withdraw_after_spot_callback() {
    let mut p = policy();
    at(OWNER, 1600);
    p.withdraw_spot(account(OWNER), U128(BASE));
    let spot_id = p.operation_id;
    at(OWNER, 1600);
    p.emergency_reduce(U128(BASE), p.get_exit_pricing().anchor_price, U64(1600));
    let exit_id = p.operation_id;
    callback(PromiseResult::Successful(vec![]), 1601);
    assert!(p.on_spot_withdrawal(U64(spot_id)));
    assert!(p.pending.is_none());
    assert_eq!(p.get_pending_exit().unwrap().id, exit_id);
    p.paused = false;
    at(KEEPER, 1601);
    rejected(|| {
        p.request_order_signature(order(BASE, false));
    });
    at(KEEPER, 1601);
    rejected(|| {
        p.request_cancel_signature(U64(1));
    });
    at(OWNER, 1601);
    rejected(|| {
        p.withdraw_spot(account(OWNER), U128(BASE));
    });
    at(OWNER, 1601);
    rejected(|| {
        p.request_usd_class_transfer(U128(1_000_000), true);
    });
    assert_eq!(p.get_pending_exit().unwrap().id, exit_id);
    success(&mut p, 1602);
    assert!(p.get_pending_exit().is_none());
    at(KEEPER, 1603);
    p.request_cancel_signature(U64(1));
}

#[test]
fn concurrent_exit_timeout_records_uncertainty_and_preserves_spot_callback() {
    let mut p = policy();
    p.signed_short_size = BASE;
    at(OWNER, 1600);
    p.withdraw_spot(account(OWNER), U128(BASE));
    let spot_id = p.operation_id;
    at(OWNER, 1600);
    p.emergency_reduce(U128(BASE), p.get_exit_pricing().anchor_price, U64(1600));
    let exit_id = p.operation_id;
    at("anyone.testnet", 1661);
    p.expire_pending_signature();
    assert!(p.get_pending_exit().is_none());
    assert_eq!(p.pending.as_ref().unwrap().id, spot_id);
    assert_eq!(p.signed_short_size, BASE);
    assert_eq!(p.spot_balance, 99 * BASE);
    assert!(
        get_logs()
            .iter()
            .any(|log| log.contains("callback_timeout_expired")
                && log.contains("\"budget_released\":false"))
    );
    callback(PromiseResult::Successful(vec![]), 1662);
    assert!(!p.on_signature(U64(exit_id)));
    assert_eq!(p.pending.as_ref().unwrap().id, spot_id);
    callback(PromiseResult::Failed, 1663);
    assert!(!p.on_spot_withdrawal(U64(spot_id)));
    assert_eq!(p.spot_balance, 100 * BASE);
    assert_eq!(p.signed_short_size, BASE);
}

#[test]
fn public_reserve_subsidy_has_lifetime_cap_even_when_flat() {
    let mut p = policy();
    p.mpc_fee = PUBLIC_SUBSIDY_LIMIT / 2;
    for seconds in [1600, 1661] {
        let mut ctx = context("anyone.testnet", seconds);
        ctx.attached_deposit(NearToken::from_yoctonear(0));
        testing_env!(ctx.build());
        assert_eq!(p.signed_short_size, 0);
        p.deleverage(p.get_exit_pricing().anchor_price, U64(seconds));
        // A definite signer failure also consumes the irreversible reserve subsidy.
        callback(PromiseResult::Failed, seconds + 1);
        assert!(!p.on_signature(U64(p.operation_id)));
    }
    assert_eq!(p.get_public_subsidy_spent().0, PUBLIC_SUBSIDY_LIMIT);
    let mut ctx = context("anyone.testnet", 1722);
    ctx.attached_deposit(NearToken::from_yoctonear(0));
    testing_env!(ctx.build());
    let nonce = p.last_nonce;
    rejected(|| {
        p.deleverage(p.get_exit_pricing().anchor_price, U64(1722));
    });
    assert_eq!(p.last_nonce, nonce);
    assert!(get_created_receipts().is_empty());
    // Anyone can still recover residual venue exposure by paying the MPC fee.
    ctx.attached_deposit(NearToken::from_yoctonear(p.mpc_fee));
    testing_env!(ctx.build());
    p.deleverage(p.get_exit_pricing().anchor_price, U64(1722));
    assert_eq!(p.get_public_subsidy_spent().0, PUBLIC_SUBSIDY_LIMIT);
    success(&mut p, 1723);
    // Public exhaustion never consumes the owner or keeper's reserve allowance.
    let mut ctx = context(OWNER, 1724);
    ctx.attached_deposit(NearToken::from_yoctonear(0));
    testing_env!(ctx.build());
    p.emergency_reduce(U128(BASE), p.get_exit_pricing().anchor_price, U64(1724));
    assert_eq!(p.get_public_subsidy_spent().0, PUBLIC_SUBSIDY_LIMIT);
    success(&mut p, 1725);
    let mut ctx = context(KEEPER, 1726);
    ctx.attached_deposit(NearToken::from_yoctonear(0));
    testing_env!(ctx.build());
    p.request_order_signature(order(BASE, true));
    assert_eq!(p.get_public_subsidy_spent().0, PUBLIC_SUBSIDY_LIMIT);
}
