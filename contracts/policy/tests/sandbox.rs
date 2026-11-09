//! Local sandbox only; mock signer returns fabricated signature-shaped public data.
//! Running requires explicit consent for near-workspaces' disposable test keys.
use anyhow::Result;
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
        anyhow::ensure!(
            std::env::var("COUNTERWEIGHT_ALLOW_DISPOSABLE_SANDBOX_KEYS").as_deref() == Ok("1"),
            "sandbox execution requires explicit permission for disposable local test keys"
        );
        let worker = near_workspaces::sandbox().await?;
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
            "reference_price": "5000000"
        })).transact().await?.into_result()?;
        owner
            .call(contract.id(), "test_only_set_spot_balance")
            .args_json(json!({"amount": (100 * BASE).to_string()}))
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
        args: Value,
    ) -> Result<near_workspaces::result::ExecutionFinalResult> {
        Ok(who
            .call(self.contract.id(), method)
            .args_json(args)
            .deposit(NearToken::from_yoctonear(1))
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
            json!({"order": {"asset_index": 4, "size": size.to_string(), "reduce_only": reduce}}),
        )
        .await
    }
    async fn config(&self, cooldown: u64) -> Result<()> {
        self.owner.call(self.contract.id(), "set_config").args_json(json!({"keeper": self.keeper.id(), "limits": limits(cooldown), "heartbeat_timeout_seconds": 600})).transact().await?.into_result()?;
        Ok(())
    }
}
fn rejects(result: near_workspaces::result::ExecutionFinalResult, message: &str) {
    assert!(result.is_failure(), "expected {message}");
    assert!(
        format!("{:?}", result.into_result().unwrap_err()).contains(message),
        "expected {message}"
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
async fn sandbox_reduce_always_allowed_and_budget_not_recycled() -> Result<()> {
    let f = Fixture::new(600).await?;
    f.order(2 * BASE, false).await?.into_result()?;
    f.order(2 * BASE, true).await?.into_result()?;
    f.order(2 * BASE, true).await?.into_result()?;
    assert_eq!(
        f.state().await?["signed_short_size"],
        (2 * BASE).to_string()
    );
    rejects(f.order(3 * BASE, true).await?, "ERR_REDUCE_SIZE");
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
async fn sandbox_pause_blocks_increases_not_reductions() -> Result<()> {
    let f = Fixture::new(0).await?;
    f.order(BASE, false).await?.into_result()?;
    f.owner
        .call(f.contract.id(), "set_paused")
        .args_json(json!({"paused": true}))
        .transact()
        .await?
        .into_result()?;
    rejects(f.order(BASE, false).await?, "ERR_PAUSED");
    f.order(BASE, true).await?.into_result()?;
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
    f.worker.fast_forward(1000).await?;
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
    assert_eq!(state["pending"]["phase"], "Uncertain");
    assert_eq!(state["signed_short_size"], BASE.to_string());
    rejects(f.order(BASE, true).await?, "ERR_PENDING_OPERATION");
    rejects(
        f.stranger
            .call(f.contract.id(), "acknowledge_failed_signature")
            .args_json(json!({"operation_id": "1"}))
            .transact()
            .await?,
        "ERR_CALLER_NOT_OWNER",
    );
    f.owner
        .call(f.contract.id(), "acknowledge_failed_signature")
        .args_json(json!({"operation_id": "1"}))
        .transact()
        .await?
        .into_result()?;
    f.signer
        .call("set_mode")
        .args_json(json!({"mode": 0}))
        .transact()
        .await?
        .into_result()?;
    f.order(BASE, true).await?.into_result()?;
    assert_eq!(f.state().await?["operation_id"], "2");
    assert_eq!(f.state().await?["signed_short_size"], BASE.to_string());
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
    assert_eq!(f.state().await?["pending"]["phase"], "Uncertain");
    let forged = f
        .stranger
        .call(f.contract.id(), "on_signature")
        .args_json(json!({"operation_id": "1"}))
        .transact()
        .await?;
    assert!(forged.is_failure());
    Ok(())
}
