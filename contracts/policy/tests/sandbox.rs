//! Local sandbox only; mock signer returns fabricated signature-shaped public data.
//! Running requires explicit consent for near-workspaces' disposable test keys.
use anyhow::Result;
use counterweight_policy::{SigningPayload, hl_digest};
use near_sdk::serde_json::{Value, json};
use near_workspaces::{Account, Contract, Worker, network::Sandbox, types::NearToken};

const BASE: u128 = 10u128.pow(24);
const EVM: &str = "0x1111111111111111111111111111111111111111";

struct Fixture {
    worker: Worker<Sandbox>,
    owner: Account,
    keeper: Account,
    stranger: Account,
    contract: Contract,
    signer: Contract,
}

fn limits(cooldown: u64) -> Value {
    json!({"max_short_size": (100 * BASE).to_string(), "per_order_notional_cap": "10100000",
        "per_day_notional_cap": "20200000", "cooldown_seconds": cooldown,
        "price_band_bps": 100, "price_max_age_seconds": 3600})
}

impl Fixture {
    async fn new(cooldown: u64) -> Result<Self> {
        Self::with_signing_limits(cooldown, Value::Null).await
    }
    async fn with_signing_limits(cooldown: u64, signing_limits: Value) -> Result<Self> {
        anyhow::ensure!(
            std::env::var("COUNTERWEIGHT_ALLOW_DISPOSABLE_SANDBOX_KEYS").as_deref() == Ok("1"),
            "sandbox execution requires explicit permission for disposable local test keys"
        );
        let repository = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../..")
            .canonicalize()?;
        anyhow::ensure!(
            !std::env::temp_dir().canonicalize()?.starts_with(repository),
            "sandbox TMPDIR must be outside the repository"
        );
        let worker = near_workspaces::sandbox().await?;
        anyhow::ensure!(
            worker.rpc_addr().starts_with("http://127.0.0.1:"),
            "sandbox RPC must be loopback"
        );
        let owner = worker.dev_create_account().await?;
        let keeper = worker.dev_create_account().await?;
        let stranger = worker.dev_create_account().await?;
        let contract = worker
            .dev_deploy(&std::fs::read(
                "target/wasm32-unknown-unknown/release/counterweight_policy.wasm",
            )?)
            .await?;
        let signer = worker
            .dev_deploy(&std::fs::read(
                "target/wasm32-unknown-unknown/release/counterweight_mock_signer.wasm",
            )?)
            .await?;
        owner.call(contract.id(), "new").args_json(json!({
            "owner": owner.id(), "keeper": keeper.id(), "asset_index": 4, "size_decimals": 2,
            "derivation_path": "counterweight-1", "evm_recipient": EVM, "signer_account": signer.id(),
            "wnear_account": signer.id(), "limits": limits(cooldown), "heartbeat_timeout_seconds": 600,
            "network":"Testnet", "reference_price": "5000000", "signing_limits": signing_limits,
            "oracle": {"account_id": signer.id(), "feed_id": "c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750", "max_age_seconds":300,"max_confidence_bps":100,"min_price":"4000000","max_price":"7000000"}
        })).transact().await?.into_result()?;
        owner
            .call(signer.id(), "deposit_to")
            .args_json(json!({"policy": contract.id(), "sender_id": owner.id(), "amount": (100 * BASE).to_string(), "msg": ""}))
            .max_gas()
            .transact()
            .await?
            .into_result()?;
        Ok(Self {
            worker,
            owner,
            keeper,
            stranger,
            contract,
            signer,
        })
    }
    async fn state(&self) -> Result<Value> {
        Ok(self.contract.view("get_state").await?.json()?)
    }
    async fn call(
        &self,
        who: &Account,
        method: &str,
        mut args: Value,
    ) -> Result<near_workspaces::result::ExecutionFinalResult> {
        if matches!(method, "emergency_reduce" | "deleverage") {
            if args.get("price").is_none() {
                args["price"] = json!("5750000");
            }
            args["observed_at"] =
                json!((self.worker.view_block().await?.timestamp() / 1_000_000_000).to_string());
        }
        if method == "request_order_signature" && args["order"]["reduce_only"] == true {
            args["order"]["observed_at"] =
                json!((self.worker.view_block().await?.timestamp() / 1_000_000_000).to_string());
        }
        Ok(who
            .call(self.contract.id(), method)
            .args_json(args)
            .deposit(NearToken::from_yoctonear(
                if matches!(
                    method,
                    "request_order_signature"
                        | "request_cancel_signature"
                        | "request_evm_withdrawal"
                        | "withdraw_spot"
                        | "deleverage"
                        | "emergency_reduce"
                        | "set_paused"
                        | "request_next_invalidation"
                ) {
                    1
                } else {
                    0
                },
            ))
            .max_gas()
            .transact()
            .await?)
    }
    async fn order(
        &self,
        size: u128,
        reduce: bool,
    ) -> Result<near_workspaces::result::ExecutionFinalResult> {
        self.call(
            &self.keeper,
            "request_order_signature",
            json!({"order": {"asset_index": 4, "size": size.to_string(), "reduce_only": reduce, "reference_price": if reduce { json!("5000000") } else { Value::Null }}}),
        )
        .await
    }
    async fn config(&self, cooldown: u64) -> Result<()> {
        self.owner.call(self.contract.id(), "set_config").args_json(json!({"keeper": self.keeper.id(), "limits": limits(cooldown), "heartbeat_timeout_seconds": 600})).transact().await?.into_result()?;
        Ok(())
    }
    async fn prepare_margin(&self) -> Result<()> {
        let mark = self
            .call(
                &self.owner,
                "set_reference_price",
                json!({"price": "5000000"}),
            )
            .await?;
        mark.into_result()?;
        if self
            .contract
            .view("get_rebalance")
            .await?
            .json::<Value>()?
            .is_null()
        {
            self.call(
                &self.owner,
                "configure_rebalancing",
                json!({"limits": route_limits(self.signer.id().as_str())}),
            )
            .await?
            .into_result()?;
        }
        let observed = self.worker.view_block().await?.timestamp() / 1_000_000;
        self.call(&self.owner, "observe_margin", json!({"equity_usdc":"100000000", "withdrawable_usdc":"80000000", "observed_at_ms":observed.to_string()})).await?.into_result()?;
        Ok(())
    }
    async fn advance_past_ms(&self, timestamp_ms: u64) -> Result<()> {
        // fast_forward advances block height; block duration is sandbox-specific.
        for _ in 0..20 {
            if self.worker.view_block().await?.timestamp() / 1_000_000 > timestamp_ms {
                return Ok(());
            }
            self.worker.fast_forward(1000).await?;
        }
        anyhow::bail!("sandbox clock did not reach requested timestamp")
    }
}
fn rejects(result: near_workspaces::result::ExecutionFinalResult, message: &str) {
    assert!(result.is_failure(), "expected {message}");
    let error = format!("{:?}", result.into_result().unwrap_err());
    assert!(
        error.contains(message),
        "expected {message}, received {error}"
    );
}

#[tokio::test]
async fn sandbox_owner_only_config() -> Result<()> {
    let f = Fixture::new(60).await?;
    let args =
        json!({"keeper": f.keeper.id(), "limits": limits(60), "heartbeat_timeout_seconds": 600});
    rejects(
        f.keeper
            .call(f.contract.id(), "set_config")
            .args_json(args)
            .transact()
            .await?,
        "ERR_CALLER_NOT_OWNER",
    );
    f.config(0).await?;
    assert_eq!(f.state().await?["limits"]["cooldown_seconds"], 0);
    Ok(())
}
#[tokio::test]
async fn sandbox_fixed_recipient_rejection() -> Result<()> {
    let f = Fixture::new(0).await?;
    rejects(
        f.call(
            &f.owner,
            "withdraw_spot",
            json!({"recipient": f.stranger.id(), "amount": "1"}),
        )
        .await?,
        "ERR_RECIPIENT",
    );
    rejects(
        f.call(
            &f.owner,
            "request_evm_withdrawal",
            json!({"recipient": "0x2222222222222222222222222222222222222222", "amount": "1"}),
        )
        .await?,
        "ERR_RECIPIENT",
    );
    rejects(
        f.call(
            &f.keeper,
            "request_evm_withdrawal",
            json!({"recipient": EVM, "amount": "1"}),
        )
        .await?,
        "ERR_CALLER_NOT_OWNER",
    );
    f.prepare_margin().await?;
    let result = f
        .call(
            &f.owner,
            "request_evm_withdrawal",
            json!({"recipient": EVM, "amount": "1000000"}),
        )
        .await?;
    assert!(
        result
            .logs()
            .iter()
            .any(|l| l.contains("\"event\":\"withdrawal\""))
    );
    result.into_result()?;
    Ok(())
}
#[tokio::test]
async fn sandbox_keeper_caps_and_cooldown() -> Result<()> {
    let f = Fixture::new(600).await?;
    rejects(f.order(3 * BASE, false).await?, "ERR_PER_ORDER_CAP");
    f.order(2 * BASE, false).await?.into_result()?;
    rejects(f.order(BASE, false).await?, "ERR_COOLDOWN");
    f.config(0).await?;
    f.order(2 * BASE, false).await?.into_result()?;
    rejects(f.order(BASE, false).await?, "ERR_PER_DAY_CAP");
    assert_eq!(f.state().await?["daily_usage"], "20200000");
    Ok(())
}
#[tokio::test]
async fn sandbox_reduce_signatures_do_not_prove_fills() -> Result<()> {
    let f = Fixture::new(600).await?;
    f.order(2 * BASE, false).await?.into_result()?;
    f.order(2 * BASE, true).await?.into_result()?;
    f.order(2 * BASE, true).await?.into_result()?;
    assert_eq!(
        f.state().await?["signed_short_size"],
        (2 * BASE).to_string()
    );
    f.order(3 * BASE, true).await?.into_result()?;
    assert_eq!(
        f.state().await?["signed_short_size"],
        (2 * BASE).to_string()
    );
    Ok(())
}
#[tokio::test]
async fn sandbox_short_spot_invariant() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.owner
        .call(f.contract.id(), "test_only_set_spot_balance")
        .args_json(json!({"amount": BASE.to_string()}))
        .transact()
        .await?
        .into_result()?;
    rejects(f.order(2 * BASE, false).await?, "ERR_EXCEEDS_SPOT_HEDGE");
    f.order(BASE, false).await?.into_result()?;
    f.order(BASE, true).await?.into_result()?;
    rejects(f.order(BASE, false).await?, "ERR_EXCEEDS_SPOT_HEDGE");
    rejects(
        f.call(
            &f.owner,
            "withdraw_spot",
            json!({"recipient": f.owner.id(), "amount": "1"}),
        )
        .await?,
        "ERR_ENCUMBERED_SPOT",
    );
    Ok(())
}
#[tokio::test]
async fn sandbox_pause_blocks_keeper_additions_but_allows_reductions() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.order(BASE, false).await?.into_result()?;
    f.call(&f.owner, "set_paused", json!({"paused": true}))
        .await?
        .into_result()?;
    rejects(f.order(BASE, false).await?, "ERR_PAUSED");
    f.order(BASE, true).await?.into_result()?;
    f.call(
        &f.owner,
        "emergency_reduce",
        json!({"size": BASE.to_string()}),
    )
    .await?
    .into_result()?;
    Ok(())
}
#[tokio::test]
async fn sandbox_public_heartbeat_timeout_deleverage() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.order(BASE, false).await?.into_result()?;
    rejects(
        f.call(&f.stranger, "deleverage", json!({})).await?,
        "ERR_HEARTBEAT_ACTIVE",
    );
    let state = f.state().await?;
    let heartbeat = state["last_keeper_heartbeat"]
        .as_str()
        .unwrap()
        .parse::<u64>()?;
    f.advance_past_ms((heartbeat + 600) * 1000).await?;
    f.call(&f.stranger, "deleverage", json!({}))
        .await?
        .into_result()?;
    Ok(())
}
#[tokio::test]
async fn sandbox_pending_duplicate_and_failed_callback() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.signer
        .call("set_mode")
        .args_json(json!({"mode": 1}))
        .transact()
        .await?
        .into_result()?;
    // The outer callback explicitly returns false; internal mock signer receipt fails.
    let result = f.order(BASE, false).await?;
    assert!(!result.clone().json::<bool>()?);
    let state = f.state().await?;
    assert!(state["pending"].is_null());
    assert_eq!(state["signed_short_size"], "0");
    f.signer
        .call("set_mode")
        .args_json(json!({"mode": 0}))
        .transact()
        .await?
        .into_result()?;
    f.order(BASE, true).await?.into_result()?;
    assert_eq!(f.state().await?["operation_id"], "2");
    assert_eq!(f.state().await?["signed_short_size"], "0");
    Ok(())
}
#[tokio::test]
async fn sandbox_malformed_callback_and_private_endpoint() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.signer
        .call("set_mode")
        .args_json(json!({"mode": 2}))
        .transact()
        .await?
        .into_result()?;
    let result = f.order(BASE, false).await?;
    assert!(!result.json::<bool>()?);
    assert!(f.state().await?["pending"].is_null());
    let forged = f
        .stranger
        .call(f.contract.id(), "on_signature")
        .args_json(json!({"operation_id": "1"}))
        .transact()
        .await?;
    assert!(forged.is_failure());
    Ok(())
}

fn request(result: &near_workspaces::result::ExecutionFinalResult) -> Value {
    result
        .logs()
        .iter()
        .filter_map(|l| l.strip_prefix("EVENT_JSON:"))
        .filter_map(|l| near_sdk::serde_json::from_str::<Value>(l).ok())
        .find(|e| e["event"] == "request")
        .unwrap()["data"][0]
        .clone()
}
fn verify_request_digest(r: &Value) {
    near_sdk::testing_env!(near_sdk::test_utils::VMContextBuilder::new().build());
    let payload: SigningPayload = near_sdk::serde_json::from_value(r["payload"].clone()).unwrap();
    let digest = hl_digest::digest(&payload, false).unwrap();
    let encoded: String = digest.iter().map(|b| format!("{b:02x}")).collect();
    assert_eq!(r["digest"], encoded);
    assert_eq!(r["digest_implementation"], hl_digest::IMPLEMENTATION);
}
#[tokio::test]
async fn sandbox_real_order_cancel_withdraw_digests_and_expiries() -> Result<()> {
    let f = Fixture::new(0).await?;
    let result = f.order(BASE, false).await?;
    verify_request_digest(&request(&result));
    let order_request = request(&result);
    let first_nonce = order_request["payload"]["nonce"].as_u64().unwrap();
    assert!(order_request["payload"]["expiresAfter"].as_u64().unwrap() <= first_nonce + 60_000);
    result.into_result()?;
    let result = f
        .call(
            &f.keeper,
            "request_cancel_signature",
            json!({"order_id": "9007199254740991"}),
        )
        .await?;
    verify_request_digest(&request(&result));
    assert_eq!(request(&result)["payload"]["action"]["cancels"][0]["a"], 4);
    assert!(request(&result)["payload"]["nonce"].as_u64().unwrap() > first_nonce);
    result.into_result()?;
    let expiry = f.state().await?["last_open_expiry"]
        .as_str()
        .unwrap()
        .parse::<u64>()?;
    f.advance_past_ms(expiry).await?;
    let observed = f.worker.view_block().await?.timestamp() / 1_000_000;
    f.call(
        &f.owner,
        "settle_position",
        json!({"short_size": "0", "observed_at_ms": observed.to_string()}),
    )
    .await?
    .into_result()?;
    f.prepare_margin().await?;
    let result = f
        .call(
            &f.owner,
            "request_evm_withdrawal",
            json!({"recipient": EVM, "amount": "1000001"}),
        )
        .await?;
    verify_request_digest(&request(&result));
    assert_eq!(request(&result)["payload"]["action"]["amount"], "1.000001");
    assert_eq!(request(&result)["payload"]["action"]["destination"], EVM);
    result.into_result()?;
    Ok(())
}
#[tokio::test]
async fn sandbox_pause_invalidates_all_nonces_confirmation_failure_and_expiry() -> Result<()> {
    let f = Fixture::new(0).await?;
    let r1 = f.order(BASE, false).await?;
    let n1 = request(&r1)["payload"]["nonce"].clone();
    r1.into_result()?;
    let r2 = f
        .call(
            &f.keeper,
            "request_cancel_signature",
            json!({"order_id": "7"}),
        )
        .await?;
    let n2 = request(&r2)["payload"]["nonce"].clone();
    r2.into_result()?;
    let result = f
        .call(&f.owner, "set_paused", json!({"paused": true}))
        .await?;
    let r = request(&result);
    verify_request_digest(&r);
    assert_eq!(r["payload"]["action"]["type"], "noop");
    assert_eq!(r["payload"]["nonce"], n1);
    result.into_result()?;
    assert_eq!(f.state().await?["pause_complete"], false);
    rejects(
        f.call(&f.owner, "set_paused", json!({"paused": false}))
            .await?,
        "ERR_PAUSE_INCOMPLETE",
    );
    rejects(
        f.call(
            &f.keeper,
            "report_invalidation",
            json!({"nonce": n1.as_u64().unwrap().to_string(), "accepted": true}),
        )
        .await?,
        "ERR_CALLER_NOT_OWNER",
    );
    f.call(
        &f.owner,
        "report_invalidation",
        json!({"nonce": n1.as_u64().unwrap().to_string(), "accepted": false}),
    )
    .await?
    .into_result()?;
    let retry = f
        .call(&f.owner, "request_next_invalidation", json!({}))
        .await?;
    assert_eq!(request(&retry)["payload"]["nonce"], n1);
    retry.into_result()?;
    f.call(
        &f.owner,
        "report_invalidation",
        json!({"nonce": n1.as_u64().unwrap().to_string(), "accepted": true}),
    )
    .await?
    .into_result()?;
    let next = f
        .call(&f.owner, "request_next_invalidation", json!({}))
        .await?;
    assert_eq!(request(&next)["payload"]["nonce"], n2);
    next.into_result()?;
    assert_eq!(f.state().await?["pause_complete"], false);
    let expiry = r["payload"]["expiresAfter"].as_u64().unwrap();
    // The second nonce may expire slightly later than the first.
    f.advance_past_ms(expiry + 10_000).await?;
    f.call(&f.owner, "set_paused", json!({"paused": false}))
        .await?
        .into_result()?;
    assert_eq!(f.state().await?["pause_complete"], true);
    assert_eq!(f.state().await?["signed_short_size"], BASE.to_string());
    Ok(())
}
#[tokio::test]
async fn sandbox_failed_signing_budget_exhaustion_preserves_owner_emergency() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.order(BASE, false).await?.into_result()?;
    f.signer
        .call("set_mode")
        .args_json(json!({"mode": 1}))
        .transact()
        .await?
        .into_result()?;
    for _ in 0..7 {
        let r = f
            .call(
                &f.keeper,
                "request_cancel_signature",
                json!({"order_id": "0"}),
            )
            .await?;
        assert!(!r.json::<bool>()?);
    }
    rejects(
        f.call(
            &f.keeper,
            "request_cancel_signature",
            json!({"order_id": "0"}),
        )
        .await?,
        "ERR_KEEPER_WINDOW_LIMIT",
    );
    f.signer
        .call("set_mode")
        .args_json(json!({"mode": 0}))
        .transact()
        .await?
        .into_result()?;
    f.call(
        &f.owner,
        "emergency_reduce",
        json!({"size": BASE.to_string()}),
    )
    .await?
    .into_result()?;
    f.call(&f.owner, "set_paused", json!({"paused": true}))
        .await?
        .into_result()?;
    assert_eq!(f.state().await?["paused"], true);
    Ok(())
}
#[tokio::test]
async fn sandbox_settlement_releases_backing_and_opening_capacity_after_expiry() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.owner
        .call(f.contract.id(), "test_only_set_spot_balance")
        .args_json(json!({"amount": BASE.to_string()}))
        .transact()
        .await?
        .into_result()?;
    let open = f.order(BASE, false).await?;
    let expiry = request(&open)["payload"]["expiresAfter"].as_u64().unwrap();
    open.into_result()?;
    f.order(BASE, true).await?.into_result()?;
    assert_eq!(f.state().await?["signed_short_size"], BASE.to_string());
    rejects(
        f.call(
            &f.owner,
            "settle_position",
            json!({"short_size": "0", "observed_at_ms": expiry.to_string()}),
        )
        .await?,
        "ERR_SETTLEMENT_FRESHNESS",
    );
    f.advance_past_ms(expiry).await?;
    let block = f.worker.view_block().await?;
    let observed = block.timestamp() / 1_000_000;
    rejects(
        f.call(
            &f.keeper,
            "settle_position",
            json!({"short_size": "0", "observed_at_ms": observed.to_string()}),
        )
        .await?,
        "ERR_CALLER_NOT_OWNER",
    );
    f.call(
        &f.owner,
        "settle_position",
        json!({"short_size": "0", "observed_at_ms": observed.to_string()}),
    )
    .await?
    .into_result()?;
    assert_eq!(f.state().await?["signed_short_size"], "0");
    assert_eq!(f.state().await?["daily_usage"], "5050000");
    // Time advancement may exceed the new price-age limit. Keeper refreshes the
    // immutable bounded fallback; settlement itself is not a price observation.
    let observed_seconds = f.worker.view_block().await?.timestamp() / 1_000_000_000;
    f.call(
        &f.keeper,
        "set_keeper_price",
        json!({"price":"5000000", "observed_at":observed_seconds.to_string()}),
    )
    .await?
    .into_result()?;
    f.order(BASE, false).await?.into_result()?;
    assert_eq!(f.state().await?["signed_short_size"], BASE.to_string());
    assert_eq!(f.state().await?["lifetime_opened"], (2 * BASE).to_string());
    Ok(())
}

#[tokio::test]
async fn sandbox_partial_settlement_releases_only_matching_spot() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.owner
        .call(f.contract.id(), "test_only_set_spot_balance")
        .args_json(json!({"amount": (2 * BASE).to_string()}))
        .transact()
        .await?
        .into_result()?;
    let open = f.order(2 * BASE, false).await?;
    let expiry = request(&open)["payload"]["expiresAfter"].as_u64().unwrap();
    open.into_result()?;
    f.order(BASE, true).await?.into_result()?;
    rejects(
        f.call(
            &f.owner,
            "withdraw_spot",
            json!({"recipient": f.owner.id(), "amount": BASE.to_string()}),
        )
        .await?,
        "ERR_ENCUMBERED_SPOT",
    );
    f.advance_past_ms(expiry).await?;
    let observed = f.worker.view_block().await?.timestamp() / 1_000_000;
    f.call(
        &f.owner,
        "settle_position",
        json!({"short_size": BASE.to_string(), "observed_at_ms": observed.to_string()}),
    )
    .await?
    .into_result()?;
    f.call(
        &f.owner,
        "withdraw_spot",
        json!({"recipient": f.owner.id(), "amount": BASE.to_string()}),
    )
    .await?
    .into_result()?;
    let state = f.state().await?;
    assert_eq!(state["spot_balance"], BASE.to_string());
    assert_eq!(state["signed_short_size"], BASE.to_string());
    assert_eq!(state["daily_usage"], "10100000");
    rejects(
        f.call(
            &f.owner,
            "withdraw_spot",
            json!({"recipient": f.owner.id(), "amount": "1"}),
        )
        .await?,
        "ERR_ENCUMBERED_SPOT",
    );
    Ok(())
}
#[tokio::test]
async fn sandbox_outstanding_limit_and_failed_transaction_do_not_advance_nonce() -> Result<()> {
    let f = Fixture::with_signing_limits(
        0,
        json!({
            "keeper_per_block": 1, "keeper_per_window": 2, "keeper_outstanding": 1,
            "owner_per_window": 16, "window_ms": 60000, "max_nonce_ahead_ms": 1000
        }),
    )
    .await?;
    f.order(BASE, false).await?.into_result()?;
    let nonce = f.state().await?["last_nonce"].clone();
    rejects(
        f.call(
            &f.keeper,
            "request_cancel_signature",
            json!({"order_id": "1"}),
        )
        .await?,
        "ERR_KEEPER_OUTSTANDING_LIMIT",
    );
    assert_eq!(f.state().await?["last_nonce"], nonce);
    let pause = f
        .call(&f.owner, "set_paused", json!({"paused": true}))
        .await?;
    assert_eq!(
        request(&pause)["payload"]["nonce"]
            .as_u64()
            .unwrap()
            .to_string(),
        nonce.as_str().unwrap()
    );
    pause.into_result()?;
    f.call(
        &f.owner,
        "emergency_reduce",
        json!({"size": BASE.to_string()}),
    )
    .await?
    .into_result()?;
    assert_eq!(f.state().await?["paused"], true);
    Ok(())
}

fn route_limits(adapter: &str) -> Value {
    json!({"adapter":adapter, "strategy_margin_address": EVM, "destination_token": counterweight_policy::rebalance::HYPERCORE_USDC,
        "per_sale_near":(2*BASE).to_string(), "daily_sale_near":(4*BASE).to_string(), "max_fee_usdc":"50000", "max_impact_bps":100,
        "quote_age_ms":30000, "completion_ms":3600000, "max_mismatch_near":(2*BASE).to_string(), "per_withdrawal_usdc":"10000000",
        "daily_withdrawal_usdc":"20000000", "min_residual_equity_usdc":"10000000", "min_headroom_bps":1000, "lower_headroom_bps":3000, "target_headroom_bps":6000, "upper_headroom_bps":9000, "fee_reserve_usdc":"100000", "original_target_usdc":"500000000"})
}

#[tokio::test]
async fn sandbox_authenticated_deposits_and_token_failure_restoration() -> Result<()> {
    let f = Fixture::new(0).await?;
    for (sender, amount, msg, error) in [
        (f.owner.id(), "0".to_string(), "", "ERR_DEPOSIT"),
        (f.owner.id(), BASE.to_string(), "unexpected", "ERR_DEPOSIT"),
        (f.keeper.id(), BASE.to_string(), "", "ERR_DEPOSIT_OWNER"),
    ] {
        rejects(f.owner.call(f.signer.id(), "deposit_to").args_json(json!({"policy": f.contract.id(), "sender_id":sender, "amount":amount,"msg":msg})).max_gas().transact().await?, error);
    }
    assert_eq!(f.state().await?["spot_balance"], (100 * BASE).to_string());
    f.signer
        .call("set_mode")
        .args_json(json!({"mode":3}))
        .transact()
        .await?
        .into_result()?;
    let failed = f
        .call(
            &f.owner,
            "withdraw_spot",
            json!({"recipient":f.owner.id(), "amount":BASE.to_string()}),
        )
        .await?;
    assert!(!failed.json::<bool>()?);
    assert_eq!(f.state().await?["spot_balance"], (100 * BASE).to_string());
    f.signer
        .call("set_mode")
        .args_json(json!({"mode":4}))
        .transact()
        .await?
        .into_result()?;
    let large = f
        .call(
            &f.owner,
            "withdraw_spot",
            json!({"recipient":f.owner.id(), "amount":BASE.to_string()}),
        )
        .await?;
    assert!(large.json::<bool>()?);
    assert_eq!(f.state().await?["spot_balance"], (99 * BASE).to_string());
    Ok(())
}

#[tokio::test]
async fn sandbox_rally_precision_and_cumulative_address_budget() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.order(BASE, false).await?.into_result()?;
    f.call(&f.owner, "set_reference_price", json!({"price":"5123000"}))
        .await?
        .into_result()?;
    f.call(&f.owner, "set_keeper_address_budget", json!({"weight":"5"}))
        .await?
        .into_result()?;
    f.call(
        &f.keeper,
        "request_cancel_signature",
        json!({"order_id":"1"}),
    )
    .await?
    .into_result()?;
    rejects(
        f.call(
            &f.keeper,
            "request_cancel_signature",
            json!({"order_id":"2"}),
        )
        .await?,
        "ERR_KEEPER_ADDRESS_BUDGET",
    );
    let reduced = f
        .call(
            &f.owner,
            "emergency_reduce",
            json!({"size": (100 * BASE).to_string()}),
        )
        .await?;
    let wire = request(&reduced);
    verify_request_digest(&wire);
    assert!(
        wire["payload"]["action"]["orders"][0]["p"]
            .as_str()
            .unwrap()
            .parse::<f64>()?
            >= 5.75
    );
    assert_eq!(wire["payload"]["action"]["orders"][0]["r"], true);
    reduced.into_result()?;
    assert_eq!(f.state().await?["paused"], true);
    assert!(
        f.state().await?["outstanding"]
            .as_array()
            .unwrap()
            .iter()
            .any(|a| a["keeper"] == true && a["discarded"] == true)
    );
    Ok(())
}

#[tokio::test]
async fn sandbox_exact_sale_route_finality_and_replay() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.order(2 * BASE, false).await?.into_result()?;
    let expiry = f.state().await?["last_open_expiry"]
        .as_str()
        .unwrap()
        .parse::<u64>()?;
    f.advance_past_ms(expiry).await?;
    f.prepare_margin().await?;
    let observed = f.worker.view_block().await?.timestamp() / 1_000_000;
    f.call(
        &f.owner,
        "settle_position",
        json!({"short_size":"0", "observed_at_ms":observed.to_string()}),
    )
    .await?
    .into_result()?;
    let quoted = f.worker.view_block().await?.timestamp() / 1_000_000;
    let quote = json!({"near_amount":BASE.to_string(), "paired_closed_near":BASE.to_string(), "min_usdc":"4900000", "fee_usdc":"50000", "impact_bps":100, "quoted_at_ms":quoted.to_string(), "deadline_ms":(quoted+30000).to_string()});
    let sale = f
        .owner
        .call(f.contract.id(), "approve_spot_sale")
        .args_json(json!({"quote":quote}))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?;
    sale.into_result()?;
    assert_eq!(f.state().await?["spot_balance"], (99 * BASE).to_string());
    let state: Value = f.contract.view("get_rebalance").await?.json()?;
    assert_eq!(state["route"]["phase"], "AwaitingReceipt");
    assert_eq!(state["usable_margin"], "100000000");
    rejects(f.order(BASE, false).await?, "ERR_ROUTE_UNRESOLVED");
    let now = f.worker.view_block().await?.timestamp() / 1_000_000;
    let args = json!({"route_id":"1", "refunded_near":"0", "credited_usdc":"4950000", "receipt_id":"local-finalized-mock", "finalized_at_ms":now.to_string()});
    f.call(&f.owner, "reconcile_sale_receipt", args.clone())
        .await?
        .into_result()?;
    rejects(
        f.call(&f.owner, "reconcile_sale_receipt", args).await?,
        "ERR_NO_ROUTE",
    );
    let state: Value = f.contract.view("get_rebalance").await?.json()?;
    assert_eq!(state["usable_margin"], "104950000");
    assert!(state["route"].is_null());
    Ok(())
}

#[tokio::test]
async fn sandbox_withdrawal_nonce_requires_confirmed_invalidation() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.prepare_margin().await?;
    let withdrawal = f
        .call(
            &f.owner,
            "request_evm_withdrawal",
            json!({"recipient":EVM,"amount":"1000000"}),
        )
        .await?;
    let nonce = request(&withdrawal)["payload"]["nonce"].as_u64().unwrap();
    withdrawal.into_result()?;
    rejects(
        f.call(
            &f.owner,
            "request_evm_withdrawal",
            json!({"recipient":EVM,"amount":"1000000"}),
        )
        .await?,
        "ERR_WITHDRAWAL_UNRESOLVED",
    );
    let pause = f
        .call(&f.owner, "set_paused", json!({"paused":true}))
        .await?;
    let invalidate = request(&pause);
    assert_eq!(invalidate["payload"]["nonce"], nonce);
    assert_eq!(invalidate["payload"]["action"]["type"], "noop");
    assert!(
        invalidate["payload"]["expiresAfter"].as_u64().unwrap()
            <= f.worker.view_block().await?.timestamp() / 1_000_000 + 60_000
    );
    pause.into_result()?;
    f.call(
        &f.owner,
        "report_invalidation",
        json!({"nonce":nonce.to_string(),"accepted":true}),
    )
    .await?
    .into_result()?;
    f.call(&f.owner, "abandon_margin_withdrawal", json!({}))
        .await?
        .into_result()?;
    f.prepare_margin().await?;
    f.call(
        &f.owner,
        "request_evm_withdrawal",
        json!({"recipient":EVM,"amount":"1000000"}),
    )
    .await?
    .into_result()?;
    Ok(())
}

#[tokio::test]
async fn sandbox_function_call_keeper_uses_contract_fee_reserve() -> Result<()> {
    use near_workspaces::types::{AccessKey, KeyType, SecretKey};
    let mut f = Fixture::new(0).await?;
    // Disposable sandbox key only. Never serialize or print it.
    let delegated = SecretKey::from_random(KeyType::ED25519);
    f.keeper
        .batch(f.keeper.id())
        .add_key(
            delegated.public_key(),
            AccessKey::function_call_access(
                f.contract.id(),
                &["request_cancel_signature"],
                Some(NearToken::from_near(10)),
            ),
        )
        .transact()
        .await?
        .into_result()?;
    f.keeper.set_secret_key(delegated);
    let before = f.contract.view_account().await?.balance.as_yoctonear();
    let signed = f
        .keeper
        .call(f.contract.id(), "request_cancel_signature")
        .args_json(json!({"order_id":"0"}))
        .max_gas()
        .transact()
        .await?;
    verify_request_digest(&request(&signed));
    assert!(signed.json::<bool>()?);
    let after = f.contract.view_account().await?.balance.as_yoctonear();
    assert!(after < before, "contract pays the fee from its balance");
    // Owner can configure higher fees, but reserve subsidy is capped at 0.01 NEAR.
    f.call(
        &f.owner,
        "set_signing_resources",
        json!({"fee":(BASE/100+1).to_string(), "signer_gas_tgas":230, "callback_gas_tgas":30}),
    )
    .await?
    .into_result()?;
    let before_state = f.state().await?;
    rejects(
        f.keeper
            .call(f.contract.id(), "request_cancel_signature")
            .args_json(json!({"order_id":"0"}))
            .max_gas()
            .transact()
            .await?,
        "ERR_MPC_FEE",
    );
    assert_eq!(f.state().await?, before_state);
    f.call(
        &f.owner,
        "set_signing_resources",
        json!({"fee":"1", "signer_gas_tgas":230, "callback_gas_tgas":30}),
    )
    .await?
    .into_result()?;
    // Local sandbox patch only: leave storage+growth floor but no operating fee.
    let usage = f.contract.view_account().await?.storage_usage;
    let floor = u128::from(usage + 131_072) * 10u128.pow(19);
    f.worker
        .patch(f.contract.id())
        .account_from_current(move |account| {
            near_workspaces::types::AccountDetailsPatch::from(account)
                .balance(NearToken::from_yoctonear(floor))
        })
        .transact()
        .await?;
    let before_state = f.state().await?;
    rejects(
        f.keeper
            .call(f.contract.id(), "request_cancel_signature")
            .args_json(json!({"order_id":"0"}))
            .max_gas()
            .transact()
            .await?,
        "ERR_MPC_FEE",
    );
    assert_eq!(f.state().await?, before_state);
    Ok(())
}

#[tokio::test]
async fn sandbox_public_oracle_age_confidence_and_absent_fallback() -> Result<()> {
    let f = Fixture::new(60).await?;
    // Default mock returns null. No price or timestamp is changed on an absent response.
    let before = f.state().await?;
    f.call(&f.stranger, "refresh_oracle", json!({}))
        .await?
        .into_result()?;
    assert_eq!(f.state().await?["oracle_timestamp"], "0");
    for mode in [10, 11] {
        // stale and confidence wider than 1%
        f.owner
            .call(f.signer.id(), "set_mode")
            .args_json(json!({"mode":mode}))
            .transact()
            .await?
            .into_result()?;
        f.call(&f.stranger, "refresh_oracle", json!({}))
            .await?
            .into_result()?;
        assert_eq!(f.state().await?["oracle_timestamp"], "0");
    }
    f.owner
        .call(f.signer.id(), "set_mode")
        .args_json(json!({"mode":9}))
        .transact()
        .await?
        .into_result()?;
    f.call(&f.stranger, "refresh_oracle", json!({}))
        .await?
        .into_result()?;
    let state = f.state().await?;
    assert_eq!(state["oracle_price"], "5000000");
    assert_ne!(state["oracle_timestamp"], "0");
    assert_eq!(
        state["reference_price_timestamp"],
        before["reference_price_timestamp"]
    );
    assert!(
        f.call(&f.owner, "set_reference_price", json!({"price":"5000000"}))
            .await?
            .is_failure()
    );
    assert!(
        f.call(&f.stranger, "on_oracle_price", json!({}))
            .await?
            .is_failure()
    );
    // Even a malicious keeper hint cannot replace a fresh oracle close price.
    let result = f.keeper.call(f.contract.id(),"request_order_signature").args_json(json!({"order":{
        "asset_index":4,"size":BASE.to_string(),"reduce_only":true,"reference_price":"999999999999","observed_at":"0"
    }})).deposit(NearToken::from_yoctonear(1)).max_gas().transact().await?.into_result()?;
    assert!(result.logs().iter().any(|l| l.contains("\"p\":\"5.05\"")));
    Ok(())
}

/// Exact deployed production bytes, initialized before upgrading; no migration/init on new code.
#[tokio::test]
async fn sandbox_upgrade_initialized_v2_preserves_deposit_and_class_transfer() -> Result<()> {
    anyhow::ensure!(
        std::env::var("COUNTERWEIGHT_ALLOW_DISPOSABLE_SANDBOX_KEYS").as_deref() == Ok("1"),
        "local disposable keys only"
    );
    let worker = near_workspaces::sandbox().await?;
    anyhow::ensure!(
        worker.rpc_addr().starts_with("http://127.0.0.1:"),
        "loopback only"
    );
    let owner = worker.dev_create_account().await?;
    let keeper = worker.dev_create_account().await?;
    // Patch only disposable localhost accounts to .testnet names so the OLD default
    // production binary's network guard executes unchanged (no test-utils bypass).
    let mut named = Vec::new();
    for name in ["upgrade-policy.testnet", "upgrade-signer.testnet"] {
        let donor = worker.dev_create_account().await?;
        let id = name.parse()?;
        worker
            .patch(&id)
            .account(near_workspaces::types::AccountDetailsPatch::from(
                donor.view_account().await?,
            ))
            .access_key(
                donor.secret_key().public_key(),
                near_workspaces::AccessKey::full_access(),
            )
            .transact()
            .await?;
        named.push(Account::from_secret_key(
            id,
            donor.secret_key().clone(),
            &worker,
        ));
    }
    near_sdk::testing_env!(near_sdk::test_utils::VMContextBuilder::new().build());
    let old = include_bytes!("fixtures/policy-v2-d85b2f91.wasm");
    // Assert exact old binary, independently of whatever source is now checked out.
    assert_eq!(
        near_sdk::env::sha256_array(old),
        [
            0xd8, 0x5b, 0x2f, 0x91, 0xa1, 0x82, 0x40, 0x2f, 0xd1, 0x08, 0x9a, 0xd6, 0x35, 0x3e,
            0x17, 0x4a, 0x5b, 0x3d, 0xe7, 0x61, 0x15, 0x34, 0xcc, 0x83, 0x9e, 0x60, 0x1d, 0x78,
            0x40, 0x1e, 0xab, 0xe1
        ]
    );
    let contract = named[0].deploy(old).await?.into_result()?;
    let signer = named[1]
        .deploy(&std::fs::read(
            "target/wasm32-unknown-unknown/release/counterweight_mock_signer.wasm",
        )?)
        .await?
        .into_result()?;
    owner.call(contract.id(), "new").args_json(json!({
        "owner":owner.id(), "keeper":keeper.id(), "asset_index":4, "size_decimals":2,
        "derivation_path":"counterweight-1", "evm_recipient":EVM, "signer_account":signer.id(),
        "wnear_account":signer.id(), "limits":limits(60), "heartbeat_timeout_seconds":600,
        "network":"Testnet", "reference_price":"5000000", "signing_limits":null,
        "oracle":{"account_id":null,"feed_id":"c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750","max_age_seconds":300,"max_confidence_bps":100,"min_price":"4000000","max_price":"7000000"}
    })).transact().await?.into_result()?;
    owner.call(signer.id(), "deposit_to").args_json(json!({"policy":contract.id(),"sender_id":owner.id(),"amount":(5*BASE).to_string(),"msg":""})).max_gas().transact().await?.into_result()?;
    let before: Value = contract.view("get_state").await?.json()?;
    assert_eq!(before["spot_balance"], (5 * BASE).to_string());
    named[0]
        .deploy(&std::fs::read("artifacts/counterweight_policy_v3.wasm")?)
        .await?
        .into_result()?;
    let after: Value = contract.view("get_state").await?.json()?;
    assert_eq!(
        after, before,
        "all state fields survive exact old -> new upgrade"
    );
    for caller in [&keeper, &named[1]] {
        rejects(
            caller
                .call(contract.id(), "request_usd_class_transfer")
                .args_json(json!({"amount":"49000000","to_perp":true}))
                .max_gas()
                .transact()
                .await?,
            "ERR_CALLER_NOT_OWNER",
        );
    }
    let result = owner
        .call(contract.id(), "request_usd_class_transfer")
        .args_json(json!({"amount":"49000000","to_perp":true}))
        .deposit(NearToken::from_yoctonear(1))
        .max_gas()
        .transact()
        .await?;
    verify_request_digest(&request(&result));
    assert!(result.json::<bool>()?);
    let after: Value = contract.view("get_state").await?.json()?;
    assert_eq!(after["spot_balance"], before["spot_balance"]);
    assert_eq!(after["owner"], before["owner"]);
    assert_eq!(after["pending"], Value::Null);
    assert!(after["last_nonce"].as_str().unwrap().parse::<u64>()? > 0);
    Ok(())
}

#[tokio::test]
async fn sandbox_v3_keyless_timelock_and_out_of_band_exits() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.call(
        &f.owner,
        "propose_price_bounds",
        json!({"min_price":"40000000","max_price":"60000000"}),
    )
    .await?
    .into_result()?;
    f.contract
        .as_account()
        .batch(f.contract.id())
        .delete_key(f.contract.as_account().secret_key().public_key())
        .transact()
        .await?
        .into_result()?;
    assert!(f.contract.view_access_keys().await?.is_empty());
    rejects(
        f.call(&f.stranger, "execute_price_bounds", json!({}))
            .await?,
        "ERR_CALLER_NOT_OWNER",
    );
    rejects(
        f.call(&f.owner, "execute_price_bounds", json!({})).await?,
        "ERR_BOUNDS_TIMELOCK",
    );
    // Owner and keeper can exit immediately at 10x and 0.1x the original mark.
    for (caller, mark) in [(&f.owner, "50000000"), (&f.keeper, "500000")] {
        let result = if caller.id() == f.owner.id() {
            f.call(
                caller,
                "emergency_reduce",
                json!({"size":BASE.to_string(),"price":mark}),
            )
            .await?
        } else {
            f.call(caller,"request_order_signature",json!({"order":{"asset_index":4,"size":BASE.to_string(),"reduce_only":true,"reference_price":mark}})).await?
        };
        let e = request(&result);
        verify_request_digest(&e);
        let o = &e["payload"]["action"]["orders"][0];
        assert_eq!(o["r"], true);
        assert!(
            o["p"].as_str().unwrap().parse::<f64>()? <= mark.parse::<f64>()? / 1e6 * 1.01 + 1e-12
        );
        result.into_result()?;
    }
    f.call(&f.owner, "cancel_price_bounds", json!({}))
        .await?
        .into_result()?;
    assert!(
        f.contract
            .view("get_price_bounds_proposal")
            .await?
            .json::<Value>()?
            .is_null()
    );
    f.call(
        &f.owner,
        "propose_price_bounds",
        json!({"min_price":"40000000","max_price":"60000000"}),
    )
    .await?
    .into_result()?;
    let p: Value = f.contract.view("get_price_bounds_proposal").await?.json()?;
    let deadline = p["execute_after"].as_str().unwrap().parse::<u64>()?;
    let current_seconds = f.worker.view_block().await?.timestamp() / 1_000_000_000;
    assert!(deadline >= current_seconds + 86_390);
    // Local fixture maturity only: exact 24h boundary is exercised in native tests.
    // Avoid mining a day of sandbox blocks; no production setter exists.
    let matured = counterweight_policy::oracle::PriceBoundsProposal {
        min_price: near_sdk::json_types::U128(40_000_000),
        max_price: near_sdk::json_types::U128(60_000_000),
        execute_after: near_sdk::json_types::U64(current_seconds),
    };
    f.worker
        .patch(f.contract.id())
        .state(b"v3:bounds", &near_sdk::borsh::to_vec(&matured)?)
        .transact()
        .await?;
    f.call(&f.owner, "execute_price_bounds", json!({}))
        .await?
        .into_result()?;
    assert_eq!(f.state().await?["oracle"]["min_price"], "40000000");
    // Public recovery also ignores the old band, the pause, and keeper epoch budget.
    let heartbeat = f.state().await?["last_keeper_heartbeat"]
        .as_str()
        .unwrap()
        .parse::<u64>()?;
    f.advance_past_ms((heartbeat + 600) * 1000).await?;
    f.call(&f.owner, "set_keeper_address_budget", json!({"weight":"0"}))
        .await?
        .into_result()?;
    let result = f
        .call(&f.stranger, "deleverage", json!({"price":"500000"}))
        .await?;
    assert_eq!(
        request(&result)["payload"]["action"]["orders"][0]["p"],
        "0.505"
    );
    result.into_result()?;
    Ok(())
}

#[tokio::test]
async fn sandbox_v3_partial_margin_without_route_and_receipt_reconciliation() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.order(BASE, false).await?.into_result()?;
    f.call(&f.owner,"configure_margin_withdrawals",json!({"limits":{
        "per_withdrawal_usdc":"10000000","daily_withdrawal_usdc":"20000000","min_residual_equity_usdc":"1000000",
        "min_headroom_bps":1000,"fee_reserve_usdc":"100000","max_fee_usdc":"1000000"
    }})).await?.into_result()?;
    let ms = f.worker.view_block().await?.timestamp() / 1_000_000;
    f.call(&f.owner,"observe_margin",json!({"equity_usdc":"100000000","withdrawable_usdc":"80000000","observed_at_ms":ms.to_string()})).await?.into_result()?;
    let result = f
        .call(
            &f.owner,
            "request_evm_withdrawal",
            json!({"recipient":EVM,"amount":"10000000"}),
        )
        .await?;
    let e = request(&result);
    verify_request_digest(&e);
    let nonce = e["payload"]["nonce"].as_u64().unwrap();
    result.into_result()?;
    assert!(
        f.contract
            .view("get_rebalance")
            .await?
            .json::<Value>()?
            .is_null()
    );
    let m: Value = f.contract.view("get_margin").await?.json()?;
    assert_eq!(m["usable_margin"], "90000000");
    assert_eq!(f.state().await?["signed_short_size"], BASE.to_string());
    rejects(
        f.call(
            &f.owner,
            "request_evm_withdrawal",
            json!({"recipient":EVM,"amount":"1000000"}),
        )
        .await?,
        "ERR_WITHDRAWAL_UNRESOLVED",
    );
    let ms = f.worker.view_block().await?.timestamp() / 1_000_000;
    f.call(&f.owner,"reconcile_margin_withdrawal",json!({"nonce":nonce.to_string(),"received_usdc":"9000000","fee_usdc":"1000000","receipt_id":"mock-final-destination-receipt","finalized_at_ms":ms.to_string()})).await?.into_result()?;
    assert!(f.contract.view("get_margin").await?.json::<Value>()?["withdrawal"].is_null());
    Ok(())
}
