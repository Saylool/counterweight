#![allow(clippy::too_many_arguments)] // Flat NEAR initializer ABI and generated wrapper.
use near_sdk::json_types::{U64, U128};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseOrValue, env, near, require,
};

pub mod hl_digest;
pub mod oracle;
pub mod rebalance;
pub mod withdrawals;
use oracle::*;
use rebalance::*;

const BASE: u128 = 10u128.pow(24); // wNEAR yocto base units
const DAY: u64 = 86_400;

const LIFETIME_MS: u64 = 60_000;

/// Immutable signature domain and NEAR account-network selection; not a deployment claim.
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub enum Network {
    Testnet,
    Mainnet,
}
impl Network {
    fn mainnet(&self) -> bool {
        matches!(self, Self::Mainnet)
    }
    fn matches_account(&self, id: &AccountId) -> bool {
        if self.mainnet() {
            !is_test_account(id) && !id.as_str().ends_with(".test.near")
        } else {
            is_test_account(id)
        }
    }
    fn chain(&self) -> &str {
        if self.mainnet() { "Mainnet" } else { "Testnet" }
    }
}

/// Separate owner emergency capacity is never charged to a keeper/public caller.
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct SigningLimits {
    pub keeper_per_block: u32,
    pub keeper_per_window: u32,
    pub keeper_outstanding: u32,
    pub owner_per_window: u32,
    pub window_ms: u64,
    pub max_nonce_ahead_ms: u64,
}
impl Default for SigningLimits {
    fn default() -> Self {
        Self {
            keeper_per_block: 2,
            keeper_per_window: 8,
            keeper_outstanding: 8,
            owner_per_window: 16,
            window_ms: 60_000,
            max_nonce_ahead_ms: 1_000,
        }
    }
}
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Authorization {
    pub nonce: u64,
    pub expires_after: u64,
    pub keeper: bool,
    pub discarded: bool,
    pub invalidation_requested: bool,
    pub invalidation_signed: bool,
    /// Owner-attested venue acceptance; never used as a position/fill proof.
    pub invalidation_confirmed: bool,
    pub withdrawal: bool,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct Limits {
    pub max_short_size: U128,
    /// USD micro-units, rounded up per order at the contract's limit price.
    pub per_order_notional_cap: U128,
    pub per_day_notional_cap: U128,
    pub cooldown_seconds: u64,
    pub price_band_bps: u16,
    pub price_max_age_seconds: u64,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct OrderParams {
    pub asset_index: u32,
    pub size: U128,
    pub reduce_only: bool,
    /// Contemporaneous caller-attested micro-price for reductions; ignored for a fresh oracle.
    pub reference_price: Option<U128>,
    /// Timestamp in seconds for a caller-attested reduction mark.
    pub observed_at: Option<U64>,
}

/// SDK field order; the codec rebuilds it explicitly.
#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct HlOrder {
    pub a: u64,
    pub b: bool,
    pub p: String,
    pub s: String,
    pub r: bool,
    pub t: OrderType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub c: Option<String>,
}
#[near(serializers = [json])]
#[derive(Clone, Debug)]
#[serde(untagged)]
pub enum OrderType {
    Limit { limit: LimitType },
    Trigger { trigger: TriggerType },
}
#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct TriggerType {
    #[serde(rename = "isMarket")]
    pub is_market: bool,
    #[serde(rename = "triggerPx")]
    pub trigger_px: String,
    pub tpsl: String,
}
#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct Cancel {
    pub a: u64,
    pub o: u64,
}
#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct CancelCloid {
    pub asset: u64,
    pub cloid: String,
}
#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct LimitType {
    pub tif: String,
}
#[near(serializers = [json])]
#[derive(Clone, Debug)]
#[serde(tag = "type")]
pub enum HlAction {
    #[serde(rename = "order")]
    Order {
        orders: Vec<HlOrder>,
        grouping: String,
    },
    #[serde(rename = "cancel")]
    Cancel { cancels: Vec<Cancel> },
    #[serde(rename = "cancelByCloid")]
    CancelByCloid { cancels: Vec<CancelCloid> },
    #[serde(rename = "noop")]
    Noop,
    #[serde(rename = "usdClassTransfer")]
    UsdClassTransfer {
        #[serde(rename = "hyperliquidChain")]
        hyperliquid_chain: String,
        #[serde(rename = "signatureChainId")]
        signature_chain_id: String,
        amount: String,
        #[serde(rename = "toPerp")]
        to_perp: bool,
        nonce: u64,
    },
    #[serde(rename = "withdraw3")]
    Withdraw {
        #[serde(rename = "hyperliquidChain")]
        hyperliquid_chain: String,
        #[serde(rename = "signatureChainId")]
        signature_chain_id: String,
        destination: String,
        amount: String,
        time: u64,
    },
}
#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct SigningPayload {
    pub action: HlAction,
    pub nonce: u64,
    #[serde(rename = "expiresAfter", skip_serializing_if = "Option::is_none")]
    pub expires_after: Option<u64>,
}

#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub enum OperationKind {
    Increase,
    Reduce,
    EvmWithdrawal,
    SpotWithdrawal,
    Cancel,
    Invalidation,
    // Append only: existing persisted Borsh enum discriminants remain unchanged.
    UsdClassTransfer,
}
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub enum Phase {
    AwaitingCallback,
    Uncertain,
}
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct PendingOperation {
    pub id: u64,
    pub kind: OperationKind,
    pub amount: U128,
    pub phase: Phase,
    pub nonce: u64,
    pub expires_after: Option<u64>,
    pub keeper: bool,
    /// Local callback deadline; withdraw3 has no venue expiresAfter support.
    pub callback_deadline_ms: u64,
}

#[near(serializers = [json])]
pub struct StateView {
    pub network: Network,
    pub oracle: OracleConfig,
    pub oracle_price: U128,
    pub oracle_timestamp: U64,
    pub owner: AccountId,
    pub keeper: AccountId,
    pub coin: String,
    pub asset_index: u32,
    pub size_decimals: u8,
    pub derivation_path: String,
    pub near_recipient: AccountId,
    pub evm_recipient: String,
    pub signer_account: AccountId,
    pub wnear_account: AccountId,
    pub limits: Limits,
    pub spot_balance: U128,
    /// Signed/reserved exposure bound; only expiry-gated owner settlement decreases it.
    pub signed_short_size: U128,
    pub daily_usage: U128,
    pub usage_day: u64,
    pub operation_id: U64,
    pub pending: Option<PendingOperation>,
    pub paused: bool,
    pub last_keeper_heartbeat: U64,
    pub heartbeat_timeout_seconds: u64,
    pub reference_price: U128,
    pub reference_price_timestamp: U64,
    pub last_nonce: U64,
    pub signing_limits: SigningLimits,
    pub outstanding: Vec<Authorization>,
    pub pause_complete: bool,
    pub lifetime_opened: U128,
    pub last_open_expiry: U64,
    pub keeper_weight_used: U64,
    pub keeper_weight_limit: U64,
    pub mpc_fee: U128,
    pub signer_gas_tgas: u64,
    pub callback_gas_tgas: u64,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Policy {
    network: Network,
    oracle: OracleConfig,
    oracle_price: u128,
    oracle_timestamp: u64,
    owner: AccountId,
    keeper: AccountId,
    asset_index: u32,
    size_decimals: u8,
    derivation_path: String,
    evm_recipient: String,
    signer_account: AccountId,
    wnear_account: AccountId,
    limits: Limits,
    spot_balance: u128,
    signed_short_size: u128,
    daily_usage: u128,
    usage_day: u64,
    last_increase: Option<u64>,
    operation_id: u64,
    last_nonce: u64,
    pending: Option<PendingOperation>,
    paused: bool,
    last_keeper_heartbeat: u64,
    heartbeat_timeout_seconds: u64,
    reference_price: u128,
    reference_price_timestamp: u64,
    signing_limits: SigningLimits,
    keeper_requests: Vec<(u64, u64)>,
    owner_requests: Vec<u64>,
    last_public_request: Option<u64>,
    outstanding: Vec<Authorization>,
    lifetime_opened: u128,
    last_open_expiry: u64,
    rebalance: Option<RebalanceState>,
    turnover: Vec<(u64, u128)>,
    keeper_weight_used: u64,
    keeper_weight_limit: u64,
    mpc_fee: u128,
    signer_gas_tgas: u64,
    callback_gas_tgas: u64,
}

#[near]
impl Policy {
    #[init]
    pub fn new(
        owner: AccountId,
        keeper: AccountId,
        asset_index: u32,
        size_decimals: u8,
        derivation_path: String,
        evm_recipient: String,
        signer_account: AccountId,
        wnear_account: AccountId,
        limits: Limits,
        heartbeat_timeout_seconds: u64,
        reference_price: U128,
        signing_limits: Option<SigningLimits>,
        oracle: OracleConfig,
        network: Network,
    ) -> Self {
        require!(
            env::predecessor_account_id() == owner
                || env::predecessor_account_id() == env::current_account_id(),
            "ERR_CALLER_NOT_OWNER"
        );
        // Local sandbox accounts may use Testnet; domains are selected once at init.
        require!(
            network.matches_account(&env::current_account_id()),
            "ERR_TESTNET_ONLY"
        );
        require!(
            network.matches_account(&signer_account),
            "ERR_TESTNET_SIGNER"
        );
        require!(network.matches_account(&wnear_account), "ERR_TESTNET_WNEAR");
        require!(
            keeper != env::current_account_id()
                && owner != env::current_account_id()
                && keeper != owner,
            "ERR_SELF_AUTHORITY"
        );
        require!(
            !derivation_path.is_empty() && derivation_path.len() <= 128,
            "ERR_PATH"
        );
        require!(size_decimals <= 6, "ERR_SIZE_DECIMALS");
        validate_evm(&evm_recipient);
        validate_limits(&limits);
        require!(
            heartbeat_timeout_seconds > 0 && reference_price.0 > 0,
            "ERR_CONFIG"
        );
        oracle.validate(reference_price.0);
        if let Some(id) = &oracle.account_id {
            require!(network.matches_account(id), "ERR_ORACLE_NETWORK");
        }
        let signing_limits = signing_limits.unwrap_or_default();
        validate_signing_limits(&signing_limits);
        event(
            "init",
            near_sdk::serde_json::json!({"owner": owner, "keeper": keeper, "asset_index": asset_index, "size_decimals": size_decimals, "evm_recipient": evm_recipient, "signer_account": signer_account, "wnear_account": wnear_account, "limits": limits, "heartbeat_timeout_seconds": heartbeat_timeout_seconds, "signing_limits": signing_limits}),
        );
        Self {
            network,
            oracle,
            oracle_price: 0,
            oracle_timestamp: 0,
            rebalance: None,
            turnover: vec![],
            keeper_weight_used: 0,
            keeper_weight_limit: 5_000,
            mpc_fee: 1,
            signer_gas_tgas: 230,
            callback_gas_tgas: 30,
            signing_limits,
            keeper_requests: vec![],
            owner_requests: vec![],
            last_public_request: None,
            outstanding: vec![],
            lifetime_opened: 0,
            last_open_expiry: 0,
            owner,
            keeper,
            asset_index,
            size_decimals,
            derivation_path,
            evm_recipient: evm_recipient.to_ascii_lowercase(),
            signer_account,
            wnear_account,
            limits,
            spot_balance: 0,
            signed_short_size: 0,
            daily_usage: 0,
            usage_day: now() / DAY,
            last_increase: None,
            operation_id: 0,
            last_nonce: 0,
            pending: None,
            paused: false,
            last_keeper_heartbeat: now(),
            heartbeat_timeout_seconds,
            reference_price: reference_price.0,
            reference_price_timestamp: now(),
        }
    }

    /// Owner grants a fresh cumulative epoch only after checking venue address capacity.
    pub fn set_keeper_address_budget(&mut self, weight: U64) {
        self.assert_owner();
        require!(weight.0 <= 5_000, "ERR_ADDRESS_BUDGET");
        self.keeper_weight_limit = weight.0;
        self.keeper_weight_used = 0;
        event(
            "keeper_budget",
            near_sdk::serde_json::json!({"caller": self.owner, "weight": weight}),
        );
    }
    pub fn set_signing_resources(
        &mut self,
        fee: U128,
        signer_gas_tgas: u64,
        callback_gas_tgas: u64,
    ) {
        self.assert_owner();
        require!(
            fee.0 > 0
                && (10..=250).contains(&signer_gas_tgas)
                && (10..=30).contains(&callback_gas_tgas)
                && signer_gas_tgas + callback_gas_tgas + 25 <= 300,
            "ERR_MPC_RESOURCES"
        );
        self.mpc_fee = fee.0;
        self.signer_gas_tgas = signer_gas_tgas;
        self.callback_gas_tgas = callback_gas_tgas;
        event(
            "signing_resources",
            near_sdk::serde_json::json!({"fee": fee, "signer_gas_tgas": signer_gas_tgas, "callback_gas_tgas": callback_gas_tgas}),
        );
    }
    /// Fixed owner only; retain storage, 128 KiB bounded state growth, and 1 NEAR operations.
    pub fn sweep_native(&mut self, amount: U128) -> Promise {
        self.assert_owner();
        let reserve = Self::storage_reserve() + BASE;
        require!(
            amount.0 > 0
                && amount.0
                    <= env::account_balance()
                        .as_yoctonear()
                        .saturating_sub(reserve),
            "ERR_NATIVE_RESERVE"
        );
        event(
            "withdrawal",
            near_sdk::serde_json::json!({"kind": "native", "recipient": self.owner, "amount": amount, "status": "requested"}),
        );
        Promise::new(self.owner.clone()).transfer(NearToken::from_yoctonear(amount.0))
    }

    pub fn get_state(&self) -> StateView {
        StateView {
            network: self.network.clone(),
            oracle: self.oracle.clone(),
            oracle_price: U128(self.oracle_price),
            oracle_timestamp: U64(self.oracle_timestamp),
            owner: self.owner.clone(),
            keeper: self.keeper.clone(),
            coin: "NEAR".into(),
            asset_index: self.asset_index,
            size_decimals: self.size_decimals,
            derivation_path: self.derivation_path.clone(),
            near_recipient: self.owner.clone(),
            evm_recipient: self.evm_recipient.clone(),
            signer_account: self.signer_account.clone(),
            wnear_account: self.wnear_account.clone(),
            limits: self.limits.clone(),
            spot_balance: U128(self.spot_balance),
            signed_short_size: U128(self.signed_short_size),
            daily_usage: U128(self.daily_usage),
            usage_day: self.usage_day,
            operation_id: U64(self.operation_id),
            pending: self.pending.clone(),
            paused: self.paused,
            last_keeper_heartbeat: U64(self.last_keeper_heartbeat),
            heartbeat_timeout_seconds: self.heartbeat_timeout_seconds,
            reference_price: U128(self.reference_price),
            reference_price_timestamp: U64(self.reference_price_timestamp),
            last_nonce: U64(self.last_nonce),
            signing_limits: self.signing_limits.clone(),
            outstanding: self
                .outstanding
                .iter()
                .filter(|a| a.expires_after >= env::block_timestamp_ms())
                .cloned()
                .collect(),
            pause_complete: self.pause_complete(),
            lifetime_opened: U128(self.lifetime_opened),
            last_open_expiry: U64(self.last_open_expiry),
            keeper_weight_used: U64(self.keeper_weight_used),
            keeper_weight_limit: U64(self.keeper_weight_limit),
            mpc_fee: U128(self.mpc_fee),
            signer_gas_tgas: self.signer_gas_tgas,
            callback_gas_tgas: self.callback_gas_tgas,
        }
    }

    pub fn set_config(
        &mut self,
        keeper: AccountId,
        limits: Limits,
        heartbeat_timeout_seconds: u64,
    ) {
        self.assert_owner();
        self.owner_idle();
        validate_limits(&limits);
        require!(
            limits.max_short_size.0 >= self.signed_short_size,
            "ERR_EXISTING_EXPOSURE"
        );
        require!(
            keeper != env::current_account_id()
                && keeper != self.owner
                && heartbeat_timeout_seconds > 0,
            "ERR_CONFIG"
        );
        self.keeper = keeper;
        self.limits = limits;
        self.heartbeat_timeout_seconds = heartbeat_timeout_seconds;
        // Changing keeper/config does not refresh its heartbeat or reset budgets.
        event(
            "config",
            near_sdk::serde_json::json!({"keeper": self.keeper, "limits": self.limits, "heartbeat_timeout_seconds": self.heartbeat_timeout_seconds, "caller": env::predecessor_account_id()}),
        );
    }

    /// A sane owner-attested observation, not an oracle. Opening bounds are checked at signing.
    pub fn set_reference_price(&mut self, price: U128) {
        self.assert_owner();
        assert_exit_price(price.0);
        require!(!self.oracle_fresh(), "ERR_ORACLE_PRIMARY");
        self.reference_price = price.0;
        self.reference_price_timestamp = now();
        event(
            "reference_price",
            near_sdk::serde_json::json!({"price": price}),
        );
    }

    /// Pause queues every unexpired L1 nonce. One signer call fits in 300 Tgas;
    /// continue with request_next_invalidation for the rest of the bounded queue.
    #[payable]
    pub fn set_paused(&mut self, paused: bool) -> PromiseOrValue<bool> {
        self.assert_owner();
        if !paused {
            require!(self.pause_complete(), "ERR_PAUSE_INCOMPLETE");
        }
        self.paused = paused;
        self.prune();
        if paused {
            for a in &mut self.outstanding {
                if !a.invalidation_confirmed {
                    a.discarded = true;
                    event(
                        "invalidation_required",
                        near_sdk::serde_json::json!({"nonce": U64(a.nonce), "expiresAfter": U64(a.expires_after)}),
                    );
                }
            }
            if self.pending.as_ref().is_some_and(|p| p.keeper) {
                self.pending = None;
            }
        }
        event(
            "pause",
            near_sdk::serde_json::json!({"paused": paused, "complete": self.pause_complete()}),
        );
        if paused
            && self.has_signing_resources()
            && self.owner_requests.len() < self.signing_limits.owner_per_window as usize
            && self
                .pending
                .as_ref()
                .is_none_or(|p| !matches!(p.kind, OperationKind::SpotWithdrawal))
            && self
                .outstanding
                .iter()
                .any(|a| a.discarded && !a.invalidation_requested && !a.invalidation_confirmed)
        {
            return PromiseOrValue::Promise(self.request_next_invalidation());
        }
        self.refund_attached(0);
        PromiseOrValue::Value(self.pause_complete())
    }

    #[payable]
    pub fn request_next_invalidation(&mut self) -> Promise {
        self.assert_owner();
        require!(self.paused, "ERR_NOT_PAUSED");
        self.assert_signing_resources();
        self.prune();
        self.clear_signing_slot();
        let index = self
            .outstanding
            .iter()
            .position(|a| a.discarded && !a.invalidation_requested && !a.invalidation_confirmed)
            .expect("ERR_NO_INVALIDATION");
        let a = self.outstanding[index].clone();
        self.charge_signing(false, false);
        // Consume the original nonce, never a fresh nonce. Do not change last_nonce.
        let payload = SigningPayload {
            action: HlAction::Noop,
            nonce: a.nonce,
            expires_after: Some(a.expires_after.min(env::block_timestamp_ms() + LIFETIME_MS)),
        };
        let digest = hl_digest::digest(&payload, self.network.mainnet())
            .unwrap_or_else(|e| env::panic_str(e));
        self.outstanding[index].invalidation_requested = true;
        self.start_signing(payload, digest, OperationKind::Invalidation, 0)
    }

    /// Trusted owner relay observation, not a cryptographic Hyperliquid proof.
    /// Does not release exposure. Failure enables a bounded retry.
    pub fn report_invalidation(&mut self, nonce: U64, accepted: bool) {
        self.assert_owner();
        let a = self
            .outstanding
            .iter_mut()
            .find(|a| a.nonce == nonce.0)
            .expect("ERR_NONCE");
        require!(
            a.invalidation_requested && a.invalidation_signed,
            "ERR_INVALIDATION_NOT_SIGNED"
        );
        if accepted {
            a.invalidation_confirmed = true;
        } else {
            a.invalidation_requested = false;
            a.invalidation_signed = false;
        }
        event(
            "invalidation_report",
            near_sdk::serde_json::json!({"nonce": nonce, "accepted": accepted, "source": "owner_attestation"}),
        );
    }

    /// A signature is not a fill. After all opens expire, the owner can attest
    /// a fresh observed position to release backing / begin the next risk epoch.
    /// Keeper and signing callbacks can never report fills or recycle budget.
    pub fn settle_position(&mut self, short_size: U128, observed_at_ms: U64) {
        self.assert_owner();
        self.owner_idle();
        let ms = env::block_timestamp_ms();
        require!(
            ms > self.last_open_expiry
                && observed_at_ms.0 > self.last_open_expiry
                && observed_at_ms.0 <= ms
                && ms - observed_at_ms.0 <= 30_000,
            "ERR_SETTLEMENT_FRESHNESS"
        );
        require!(
            short_size.0 <= self.signed_short_size
                && short_size
                    .0
                    .is_multiple_of(10u128.pow(24 - self.size_decimals as u32)),
            "ERR_SETTLEMENT_SIZE"
        );
        let released = self.signed_short_size - short_size.0;
        self.signed_short_size = short_size.0;
        if let Some(r) = &mut self.rebalance {
            r.reduced_inventory.0 = add(r.reduced_inventory.0, released);
        }
        event(
            "position_settlement",
            near_sdk::serde_json::json!({"short_size": short_size, "released": U128(released), "observed_at_ms": observed_at_ms, "source": "owner_attestation", "daily_budget_released": false}),
        );
    }

    /// Anyone may clear an expired L1 callback slot; reservations survive.
    pub fn expire_pending_signature(&mut self) {
        self.expire_pending();
    }

    #[payable]
    pub fn emergency_reduce(&mut self, size: U128, price: U128, observed_at: U64) -> Promise {
        self.assert_owner();
        self.emergency_pause();
        if self
            .pending
            .as_ref()
            .is_some_and(|p| !matches!(p.kind, OperationKind::SpotWithdrawal))
        {
            self.clear_signing_slot();
        }
        self.request_order(OrderParams {
            asset_index: self.asset_index,
            size,
            reduce_only: true,
            reference_price: Some(price),
            observed_at: Some(observed_at),
        })
    }

    /// Typed, fixed-market cancellation only. No arbitrary action/nonce/vault ABI.
    #[payable]
    pub fn request_cancel_signature(&mut self, order_id: U64) -> Promise {
        self.assert_keeper();
        require!(!self.paused, "ERR_PAUSED");
        self.expire_pending();
        self.assert_idle();
        self.assert_signing_resources();
        self.charge_signing(true, false);
        let nonce = self.next_nonce();
        let payload = SigningPayload {
            action: HlAction::Cancel {
                cancels: vec![Cancel {
                    a: u64::from(self.asset_index),
                    o: order_id.0,
                }],
            },
            nonce,
            expires_after: Some(
                env::block_timestamp_ms()
                    .checked_add(LIFETIME_MS)
                    .expect("ERR_NONCE_OVERFLOW"),
            ),
        };
        let digest = hl_digest::digest(&payload, self.network.mainnet())
            .unwrap_or_else(|e| env::panic_str(e));
        self.start_signing(payload, digest, OperationKind::Cancel, 0)
    }

    pub fn heartbeat(&mut self) {
        self.assert_keeper();
        self.last_keeper_heartbeat = now();
        event(
            "heartbeat",
            near_sdk::serde_json::json!({"timestamp": U64(now())}),
        );
    }

    /// NEP-141 receiver. Only the configured wNEAR contract and owner sender count.
    pub fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128> {
        require!(
            env::predecessor_account_id() == self.wnear_account,
            "ERR_TOKEN"
        );
        require!(sender_id == self.owner, "ERR_DEPOSIT_OWNER");
        require!(msg.is_empty() && amount.0 > 0, "ERR_DEPOSIT");
        if let Some(r) = &mut self.rebalance
            && r.reentry_required
            && r.withdrawal.is_none()
        {
            r.acquired_near.0 = add(r.acquired_near.0, amount.0);
        }
        self.spot_balance = add(self.spot_balance, amount.0);
        event(
            "deposit",
            near_sdk::serde_json::json!({"amount": amount, "sender_id": sender_id}),
        );
        PromiseOrValue::Value(U128(0))
    }

    /// TEST ONLY: absent from the default Wasm and ABI.
    #[cfg(feature = "test-utils")]
    pub fn test_only_set_spot_balance(&mut self, amount: U128) {
        self.assert_owner();
        self.assert_idle();
        require!(amount.0 >= self.signed_short_size, "ERR_EXCEEDS_SPOT_HEDGE");
        self.spot_balance = amount.0;
        event(
            "test_only_spot",
            near_sdk::serde_json::json!({"amount": amount}),
        );
    }

    #[payable]
    pub fn request_order_signature(&mut self, order: OrderParams) -> Promise {
        self.assert_keeper();
        self.request_order(order)
    }

    #[payable]
    pub fn deleverage(&mut self, price: U128, observed_at: U64) -> Promise {
        require!(
            now().saturating_sub(self.last_keeper_heartbeat) >= self.heartbeat_timeout_seconds,
            "ERR_HEARTBEAT_ACTIVE"
        );
        self.expire_pending();
        self.emergency_pause();
        // Public callers can preempt a keeper, but cannot discard an owner's
        // fresh emergency/invalidation callback. Its local deadline is bounded.
        if self.pending.as_ref().is_some_and(|p| p.keeper) {
            self.clear_signing_slot();
        }
        self.request_order(OrderParams {
            asset_index: self.asset_index,
            size: U128(self.signed_short_size.max(self.limits.max_short_size.0)),
            reduce_only: true,
            reference_price: Some(price),
            observed_at: Some(observed_at),
        })
    }

    /// Same derived account only: no destination, vault or caller-provided nonce.
    /// Amount is USDC micro-units, bounded to $60 per owner request.
    /// User-signed actions have no venue expiry; callbacks have a local 60s deadline.
    #[payable]
    pub fn request_usd_class_transfer(&mut self, amount: U128, to_perp: bool) -> Promise {
        self.assert_owner();
        self.expire_pending();
        self.assert_idle();
        self.assert_route_idle();
        require!(amount.0 > 0 && amount.0 <= 60_000_000, "ERR_AMOUNT");
        if !to_perp {
            require!(self.signed_short_size == 0, "ERR_OPEN_SHORT");
            require!(
                env::block_timestamp_ms() > self.last_open_expiry,
                "ERR_OPEN_AUTHORIZATION"
            );
        }
        self.assert_signing_resources();
        self.charge_signing(false, false);
        let nonce = self.next_nonce();
        let payload = SigningPayload {
            action: HlAction::UsdClassTransfer {
                hyperliquid_chain: self.network.chain().into(),
                signature_chain_id: "0x66eee".into(),
                amount: decimal(amount.0, 6),
                to_perp,
                nonce,
            },
            nonce,
            expires_after: None,
        };
        let digest = hl_digest::digest(&payload, self.network.mainnet())
            .unwrap_or_else(|e| env::panic_str(e));
        self.start_signing(payload, digest, OperationKind::UsdClassTransfer, amount.0)
    }

    /// Typed withdraw3, destination checked AND replaced with the immutable value.
    #[payable]
    pub fn request_evm_withdrawal(&mut self, recipient: String, amount: U128) -> Promise {
        self.assert_owner();
        self.expire_pending();
        self.assert_idle();
        require!(
            recipient.to_ascii_lowercase() == self.evm_recipient,
            "ERR_RECIPIENT"
        );
        require!(amount.0 > 0, "ERR_AMOUNT");

        require!(
            !self
                .outstanding
                .iter()
                .any(|a| a.withdrawal && !a.invalidation_confirmed),
            "ERR_WITHDRAWAL_UNRESOLVED"
        );
        self.assert_signing_resources();
        self.reserve_margin_withdrawal(amount.0);
        self.charge_signing(false, false);
        let nonce = self.next_nonce();
        let payload = SigningPayload {
            action: HlAction::Withdraw {
                hyperliquid_chain: self.network.chain().into(),
                signature_chain_id: "0x66eee".into(),
                destination: self.evm_recipient.clone(),
                amount: decimal(amount.0, 6),
                time: nonce,
            },
            nonce,
            expires_after: None,
        };
        let digest = hl_digest::digest(&payload, self.network.mainnet())
            .unwrap_or_else(|e| env::panic_str(e));
        self.start_signing(payload, digest, OperationKind::EvmWithdrawal, amount.0)
    }

    /// Withdraw wNEAR (not native operating NEAR); encumbered spot stays held.
    #[payable]
    pub fn withdraw_spot(&mut self, recipient: AccountId, amount: U128) -> Promise {
        self.assert_owner();
        self.owner_idle();
        self.assert_route_idle();
        require!(recipient == self.owner, "ERR_RECIPIENT");
        require!(
            env::attached_deposit() == NearToken::from_yoctonear(1),
            "ERR_ONE_YOCTO"
        );
        require!(
            amount.0 > 0 && amount.0 <= self.spot_balance.saturating_sub(self.signed_short_size),
            "ERR_ENCUMBERED_SPOT"
        );
        require!(env::prepaid_gas() >= Gas::from_tgas(80), "ERR_GAS");
        let id = self.begin(OperationKind::SpotWithdrawal, amount.0);
        self.spot_balance -= amount.0;
        event(
            "withdrawal",
            near_sdk::serde_json::json!({"id": U64(id), "kind": "wnear", "recipient": self.owner, "amount": amount, "status": "requested"}),
        );
        Promise::new(self.wnear_account.clone()).function_call(
            "ft_transfer", json_bytes(near_sdk::serde_json::json!({"receiver_id": self.owner, "amount": amount, "memo": "Counterweight owner withdrawal"})),
            NearToken::from_yoctonear(1), Gas::from_tgas(30),
        ).then(self.callback("on_spot_withdrawal", id))
    }

    /// A reduction may sign concurrently with a token transfer, whose callback must survive.
    pub fn get_pending_exit(&self) -> Option<PendingOperation> {
        read_extension(b"v3:concurrent_exit").or_else(|| {
            self.pending
                .clone()
                .filter(|p| matches!(p.kind, OperationKind::Reduce))
        })
    }
    #[private]
    pub fn on_signature(&mut self, operation_id: U64) -> bool {
        require!(
            env::predecessor_account_id() == env::current_account_id(),
            "ERR_PRIVATE_CALLBACK"
        );
        if let Some(op) = read_extension::<PendingOperation>(b"v3:concurrent_exit")
            .filter(|p| p.id == operation_id.0)
        {
            let saved = self.pending.replace(op);
            let result = self.resolve_signature(operation_id);
            if let Some(op) = self.pending.take() {
                write_extension(b"v3:concurrent_exit", &op);
            } else {
                env::storage_remove(b"v3:concurrent_exit");
            }
            self.pending = saved;
            result
        } else {
            self.resolve_signature(operation_id)
        }
    }
    fn resolve_signature(&mut self, operation_id: U64) -> bool {
        require!(
            env::predecessor_account_id() == env::current_account_id(),
            "ERR_PRIVATE_CALLBACK"
        );
        require!(env::promise_results_count() == 1, "ERR_CALLBACK_RESULTS");
        // Detached, expired or pause-discarded callbacks cannot clear a newer slot.
        let Some(op) = self.pending.clone().filter(|p| p.id == operation_id.0) else {
            event(
                "discarded_callback",
                near_sdk::serde_json::json!({"id": operation_id}),
            );
            return false;
        };
        require!(
            !matches!(op.kind, OperationKind::SpotWithdrawal),
            "ERR_CALLBACK_KIND"
        );
        if env::block_timestamp_ms() > op.callback_deadline_ms || (op.keeper && self.paused) {
            self.mark_uncertain(op.id, "expired_or_paused");
            return false;
        }
        if matches!(
            env::promise_result_checked(0, 1024),
            Err(near_sdk::PromiseError::Failed)
        ) {
            if matches!(op.kind, OperationKind::Increase) {
                self.signed_short_size = self.signed_short_size.saturating_sub(op.amount.0);
            }
            self.outstanding
                .retain(|a| a.nonce != op.nonce || matches!(op.kind, OperationKind::Invalidation));
            self.mark_uncertain(op.id, "signer_definite_failure");
            return false;
        }
        if let Ok(bytes) = env::promise_result_checked(0, 1024)
            && let Ok(signature) = near_sdk::serde_json::from_slice::<MpcSignature>(&bytes)
            && signature.valid_shape()
        {
            if matches!(op.kind, OperationKind::Invalidation)
                && let Some(a) = self.outstanding.iter_mut().find(|a| a.nonce == op.nonce)
            {
                a.invalidation_signed = true;
            }
            event(
                "signature",
                near_sdk::serde_json::json!({"id": operation_id, "nonce": U64(op.nonce), "expiresAfter": op.expires_after.map(U64), "signature": signature}),
            );
            if matches!(op.kind, OperationKind::EvmWithdrawal) {
                event(
                    "withdrawal",
                    near_sdk::serde_json::json!({"id": operation_id, "kind": "withdraw3", "recipient": self.evm_recipient, "amount": op.amount, "status": "signed"}),
                );
            }
            self.pending = None;
            return true;
        }
        self.mark_uncertain(op.id, "signer_receipt_failed_malformed_or_oversized");
        false
    }

    #[private]
    pub fn on_spot_withdrawal(&mut self, operation_id: U64) -> bool {
        let op = self.assert_callback(operation_id.0);
        require!(
            matches!(op.kind, OperationKind::SpotWithdrawal),
            "ERR_CALLBACK_KIND"
        );
        let success = !matches!(
            env::promise_result_checked(0, 0),
            Err(near_sdk::PromiseError::Failed)
        );
        if !success {
            self.spot_balance = add(self.spot_balance, op.amount.0);
        }
        self.pending = None;
        event(
            "withdrawal",
            near_sdk::serde_json::json!({"id": operation_id, "kind": "wnear", "status": if success { "completed" } else { "failed" }, "recipient": self.owner, "amount": op.amount}),
        );
        success
    }
}

impl Policy {
    fn assert_owner(&self) {
        require!(
            env::predecessor_account_id() == self.owner,
            "ERR_CALLER_NOT_OWNER"
        );
    }
    fn assert_keeper(&self) {
        require!(
            env::predecessor_account_id() == self.keeper,
            "ERR_CALLER_NOT_KEEPER"
        );
    }
    fn assert_idle(&self) {
        require!(self.pending.is_none(), "ERR_PENDING_OPERATION");
    }
    fn owner_idle(&mut self) {
        self.expire_pending();
        if self
            .pending
            .as_ref()
            .is_some_and(|p| p.keeper && matches!(p.kind, OperationKind::Cancel))
        {
            self.clear_signing_slot();
        }
        self.assert_idle();
    }
    fn emergency_pause(&mut self) {
        self.paused = true;
        self.prune();
        for a in &mut self.outstanding {
            if a.keeper && !a.invalidation_confirmed {
                a.discarded = true;
                event(
                    "invalidation_required",
                    near_sdk::serde_json::json!({"nonce": U64(a.nonce), "expiresAfter": U64(a.expires_after)}),
                );
            }
        }
        event(
            "pause",
            near_sdk::serde_json::json!({"paused": true, "reason": "recovery", "complete": self.pause_complete()}),
        );
    }
    fn storage_reserve() -> u128 {
        u128::from(env::storage_usage() + 131_072) * env::storage_byte_cost().as_yoctonear()
    }
    // Sweep retains 1 NEAR for operations. A zero-deposit caller may spend at most
    // 0.01 NEAR per authorized signature; storage and bounded growth stay protected.
    // Existing caller, rate, outstanding and cumulative keeper budgets still apply.
    fn has_signing_fee(&self) -> bool {
        let attached = env::attached_deposit().as_yoctonear();
        attached >= self.mpc_fee
            || (attached == 0
                && self.mpc_fee <= BASE / 100
                && env::account_balance().as_yoctonear()
                    >= Self::storage_reserve().saturating_add(self.mpc_fee))
    }
    fn has_signing_resources(&self) -> bool {
        self.has_signing_fee()
            && env::prepaid_gas().as_tgas() >= self.signer_gas_tgas + self.callback_gas_tgas + 25
    }
    fn assert_signing_resources(&self) {
        require!(self.has_signing_fee(), "ERR_MPC_FEE");
        require!(
            env::prepaid_gas().as_tgas() >= self.signer_gas_tgas + self.callback_gas_tgas + 25,
            "ERR_GAS"
        );
    }
    fn refund_attached(&self, retained: u128) {
        let excess = env::attached_deposit()
            .as_yoctonear()
            .saturating_sub(retained);
        if excess > 0 {
            Promise::new(env::predecessor_account_id())
                .transfer(NearToken::from_yoctonear(excess))
                .detach();
        }
    }
    fn next_nonce(&self) -> u64 {
        let ms = env::block_timestamp_ms();
        let nonce = ms.max(self.last_nonce.checked_add(1).expect("ERR_NONCE_OVERFLOW"));
        require!(
            nonce - ms <= self.signing_limits.max_nonce_ahead_ms,
            "ERR_NONCE_DRIFT"
        );
        nonce
    }
    fn pause_complete(&self) -> bool {
        !self.outstanding.iter().any(|a| {
            a.discarded && !a.invalidation_confirmed && env::block_timestamp_ms() <= a.expires_after
        })
    }
    fn prune(&mut self) {
        let ms = env::block_timestamp_ms();
        let window = self.signing_limits.window_ms;
        self.outstanding.retain(|a| a.expires_after >= ms);
        self.turnover
            .retain(|(t, _)| now().saturating_sub(*t) < DAY);
        self.daily_usage = self.turnover.iter().map(|(_, n)| *n).sum();
        self.keeper_requests
            .retain(|(t, _)| ms.saturating_sub(*t) < window);
        self.owner_requests
            .retain(|t| ms.saturating_sub(*t) < window);
    }
    fn charge_signing(&mut self, keeper: bool, public: bool) {
        self.prune();
        let ms = env::block_timestamp_ms();
        if keeper || public {
            require!(
                self.keeper_weight_used + 5 <= self.keeper_weight_limit,
                "ERR_KEEPER_ADDRESS_BUDGET"
            );
            self.keeper_weight_used += 5;
        }
        if keeper {
            require!(
                self.keeper_requests
                    .iter()
                    .filter(|(_, h)| *h == env::block_height())
                    .count()
                    < self.signing_limits.keeper_per_block as usize,
                "ERR_KEEPER_BLOCK_LIMIT"
            );
            require!(
                self.keeper_requests.len() < self.signing_limits.keeper_per_window as usize,
                "ERR_KEEPER_WINDOW_LIMIT"
            );
            require!(
                self.outstanding.iter().filter(|a| a.keeper).count()
                    < self.signing_limits.keeper_outstanding as usize,
                "ERR_KEEPER_OUTSTANDING_LIMIT"
            );
            self.keeper_requests.push((ms, env::block_height()));
        } else if public {
            require!(
                self.last_public_request
                    .is_none_or(|t| ms.saturating_sub(t) >= self.signing_limits.window_ms),
                "ERR_PUBLIC_RATE_LIMIT"
            );
            self.last_public_request = Some(ms);
        } else {
            require!(
                self.owner_requests.len() < self.signing_limits.owner_per_window as usize,
                "ERR_OWNER_WINDOW_LIMIT"
            );
            self.owner_requests.push(ms);
        }
    }
    fn expire_pending(&mut self) {
        if read_extension::<PendingOperation>(b"v3:concurrent_exit")
            .is_some_and(|p| env::block_timestamp_ms() > p.callback_deadline_ms)
        {
            env::storage_remove(b"v3:concurrent_exit");
        }
        if self.pending.as_ref().is_some_and(|p| {
            !matches!(p.kind, OperationKind::SpotWithdrawal)
                && env::block_timestamp_ms() > p.callback_deadline_ms
        }) {
            let id = self.pending.as_ref().unwrap().id;
            self.mark_uncertain(id, "callback_timeout_expired");
        }
        self.prune();
    }
    fn clear_signing_slot(&mut self) {
        if let Some(p) = &self.pending {
            require!(
                !matches!(p.kind, OperationKind::SpotWithdrawal),
                "ERR_PENDING_OPERATION"
            );
            // Keep its authorization and all reservations. A delayed signature is
            // never returned by this contract after the operation is detached.
            event(
                "detached_callback",
                near_sdk::serde_json::json!({"id": U64(p.id)}),
            );
            if matches!(p.kind, OperationKind::Invalidation)
                && let Some(a) = self.outstanding.iter_mut().find(|a| a.nonce == p.nonce)
            {
                a.invalidation_requested = false;
                a.invalidation_signed = false;
            }
            self.pending = None;
        }
    }
    fn begin(&mut self, kind: OperationKind, amount: u128) -> u64 {
        self.assert_idle();
        self.operation_id = self
            .operation_id
            .checked_add(1)
            .expect("ERR_OPERATION_OVERFLOW");
        self.pending = Some(PendingOperation {
            id: self.operation_id,
            kind,
            amount: U128(amount),
            phase: Phase::AwaitingCallback,
            nonce: 0,
            expires_after: None,
            keeper: false,
            callback_deadline_ms: 0,
        });
        self.operation_id
    }
    fn request_order(&mut self, order: OrderParams) -> Promise {
        let keeper = env::predecessor_account_id() == self.keeper;
        if keeper && !order.reduce_only {
            require!(!self.paused, "ERR_PAUSED");
        }
        self.expire_pending();
        if order.reduce_only && self.pending.as_ref().is_some_and(|p| p.keeper) {
            self.clear_signing_slot();
        }
        let concurrent_spot = order.reduce_only
            && self
                .pending
                .as_ref()
                .is_some_and(|p| matches!(p.kind, OperationKind::SpotWithdrawal));
        if !concurrent_spot {
            self.assert_idle();
        }
        self.assert_signing_resources();
        require!(order.asset_index == self.asset_index, "ERR_MARKET");
        require!(
            order.size.0 > 0
                && order
                    .size
                    .0
                    .is_multiple_of(10u128.pow(24 - self.size_decimals as u32)),
            "ERR_SIZE"
        );
        let band = u128::from(self.limits.price_band_bps);
        let (mark, marked_at) = self.active_price();
        let price = if order.reduce_only {
            let (mark, observed_at) = if self.oracle_fresh() && now() - self.oracle_timestamp <= 60
            {
                (mark, marked_at)
            } else if let Some(hint) = order.reference_price {
                (hint.0, order.observed_at.expect("ERR_REDUCE_TIMESTAMP").0)
            } else {
                (mark, marked_at)
            };
            require!(
                observed_at <= now() && now() - observed_at <= self.oracle.max_age_seconds.min(60),
                "ERR_STALE_PRICE"
            );
            assert_exit_price(mark);
            // Round DOWN to the venue tick: execution can never exceed mark + 1%.
            mark.checked_mul(10_100).expect("ERR_OVERFLOW") / 10_000
        } else {
            require!(order.reference_price.is_none(), "ERR_OPEN_PRICE_OVERRIDE");
            self.assert_price_bounds(mark);
            mark.checked_mul(10_000 - band).expect("ERR_OVERFLOW") / 10_000
        };
        let price = quantize_price(price, self.size_decimals, false);
        require!(price > 0, "ERR_PRICE");
        if order.reduce_only {
            require!(
                order.size.0 <= self.signed_short_size.max(self.limits.max_short_size.0),
                "ERR_MAX_REDUCE"
            );
        }
        let mut notional = 0;
        if !order.reduce_only {
            require!(!self.paused, "ERR_PAUSED");
            require!(
                now().saturating_sub(marked_at)
                    <= self
                        .limits
                        .price_max_age_seconds
                        .min(self.oracle.max_age_seconds),
                "ERR_STALE_PRICE"
            );
            let total = add(self.signed_short_size, order.size.0);
            self.check_rebalance_increase(total);
            require!(total <= self.spot_balance, "ERR_EXCEEDS_SPOT_HEDGE");
            require!(total <= self.limits.max_short_size.0, "ERR_MAX_SHORT");
            // Charge at the upper band: a sell can execute ABOVE its lower limit.
            let upper = mark
                .checked_mul(10_000 + band)
                .expect("ERR_OVERFLOW")
                .div_ceil(10_000);
            notional = order
                .size
                .0
                .checked_mul(upper)
                .expect("ERR_OVERFLOW")
                .div_ceil(BASE);
            require!(
                notional <= self.limits.per_order_notional_cap.0,
                "ERR_PER_ORDER_CAP"
            );
            let used: u128 = self
                .turnover
                .iter()
                .filter(|(t, _)| now().saturating_sub(*t) < DAY)
                .map(|(_, n)| *n)
                .sum();
            require!(self.turnover.len() < 1024, "ERR_TURNOVER_CAPACITY");
            require!(
                add(used, notional) <= self.limits.per_day_notional_cap.0,
                "ERR_PER_DAY_CAP"
            );
            if let Some(last) = self.last_increase {
                require!(
                    now().saturating_sub(last) >= self.limits.cooldown_seconds,
                    "ERR_COOLDOWN"
                );
            }
        }
        if order.reduce_only {
            self.charge_exit(
                keeper,
                !keeper && env::predecessor_account_id() != self.owner,
            );
        } else {
            self.charge_signing(keeper, false);
        }
        let nonce = self.next_nonce();
        let payload = SigningPayload {
            action: HlAction::Order {
                orders: vec![HlOrder {
                    a: u64::from(self.asset_index),
                    b: order.reduce_only,
                    p: decimal(price, 6),
                    s: decimal(order.size.0, 24),
                    r: order.reduce_only,
                    t: OrderType::Limit {
                        limit: LimitType { tif: "Ioc".into() },
                    },
                    c: None,
                }],
                grouping: "na".into(),
            },
            nonce,
            expires_after: Some(
                env::block_timestamp_ms()
                    .checked_add(LIFETIME_MS)
                    .expect("ERR_NONCE_OVERFLOW"),
            ),
        };
        let digest = hl_digest::digest(&payload, self.network.mainnet())
            .unwrap_or_else(|e| env::panic_str(e));
        if !order.reduce_only {
            self.signed_short_size = add(self.signed_short_size, order.size.0);
            self.lifetime_opened = add(self.lifetime_opened, order.size.0);
            self.last_open_expiry = payload.expires_after.unwrap();
            self.turnover.push((now(), notional));
            self.daily_usage = add(self.daily_usage, notional);
            if let Some(r) = &mut self.rebalance
                && r.reentry_required
            {
                r.acquired_near.0 -= order.size.0;
                r.acquisition_budget_usdc.0 = r.acquisition_budget_usdc.0.saturating_sub(notional);
            }
            self.last_increase = Some(now());
        }
        self.start_signing(
            payload,
            digest,
            if order.reduce_only {
                OperationKind::Reduce
            } else {
                OperationKind::Increase
            },
            order.size.0,
        )
    }
    fn start_signing(
        &mut self,
        payload: SigningPayload,
        digest: [u8; 32],
        kind: OperationKind,
        amount: u128,
    ) -> Promise {
        let invalidation = matches!(kind, OperationKind::Invalidation);
        let reduction = matches!(kind, OperationKind::Reduce);
        let keeper = env::predecessor_account_id() == self.keeper && !invalidation && !reduction;
        require!(
            invalidation || reduction || self.outstanding.len() < 32,
            "ERR_OUTSTANDING_CAP"
        );
        let user_signed = matches!(
            kind,
            OperationKind::EvmWithdrawal | OperationKind::UsdClassTransfer
        );
        let withdrawal = matches!(kind, OperationKind::EvmWithdrawal);
        if withdrawal {
            let mut m = self.margin_state();
            m.withdrawal.as_mut().expect("ERR_MARGIN_CONFIG").nonce = U64(payload.nonce);
            self.save_margin(m);
        }
        let parked_spot = if reduction
            && self
                .pending
                .as_ref()
                .is_some_and(|p| matches!(p.kind, OperationKind::SpotWithdrawal))
        {
            self.pending.take()
        } else {
            None
        };
        let id = self.begin(kind, amount);
        let op = self.pending.as_mut().unwrap();
        op.nonce = payload.nonce;
        op.expires_after = payload.expires_after;
        op.keeper = keeper;
        op.callback_deadline_ms = payload.expires_after.unwrap_or_else(|| {
            env::block_timestamp_ms()
                .checked_add(LIFETIME_MS)
                .expect("ERR_NONCE_OVERFLOW")
        });
        if !invalidation {
            self.last_nonce = payload.nonce;
            if let Some(expiry) = payload
                .expires_after
                .filter(|_| !reduction)
                .or_else(|| user_signed.then_some(payload.nonce + 2 * DAY * 1000 + 1))
            {
                self.outstanding.push(Authorization {
                    nonce: payload.nonce,
                    withdrawal,
                    expires_after: expiry,
                    keeper,
                    discarded: false,
                    invalidation_requested: false,
                    invalidation_signed: false,
                    invalidation_confirmed: false,
                });
            }
        }
        event(
            "request",
            near_sdk::serde_json::json!({"id": U64(id), "caller": env::predecessor_account_id(), "kind": self.pending.as_ref().unwrap().kind, "payload": payload, "digest": hex(&digest), "digest_implementation": hl_digest::IMPLEMENTATION}),
        );
        self.refund_attached(self.mpc_fee);
        if withdrawal {
            event(
                "withdrawal",
                near_sdk::serde_json::json!({"id": U64(id), "kind": "withdraw3", "recipient": self.evm_recipient, "amount": U128(amount), "status": "requested"}),
            );
        }
        if let Some(spot) = parked_spot {
            write_extension(b"v3:concurrent_exit", self.pending.as_ref().unwrap());
            self.pending = Some(spot);
        }
        Promise::new(self.signer_account.clone()).function_call(
            "sign", json_bytes(near_sdk::serde_json::json!({"request": {"payload_v2": {"Ecdsa": hex(&digest)}, "path": self.derivation_path, "domain_id": 0}})),
            NearToken::from_yoctonear(self.mpc_fee), Gas::from_tgas(self.signer_gas_tgas),
        ).then(self.callback("on_signature", id))
    }
    fn callback(&self, name: &str, id: u64) -> Promise {
        Promise::new(env::current_account_id()).function_call(
            name,
            json_bytes(near_sdk::serde_json::json!({"operation_id": U64(id)})),
            NearToken::from_yoctonear(0),
            Gas::from_tgas(self.callback_gas_tgas),
        )
    }
    fn assert_callback(&self, id: u64) -> PendingOperation {
        require!(
            env::predecessor_account_id() == env::current_account_id(),
            "ERR_PRIVATE_CALLBACK"
        );
        require!(env::promise_results_count() == 1, "ERR_CALLBACK_RESULTS");
        let op = self.pending.clone().expect("ERR_NO_PENDING");
        require!(
            op.id == id && op.phase == Phase::AwaitingCallback,
            "ERR_CALLBACK_ID"
        );
        op
    }
    fn mark_uncertain(&mut self, id: u64, reason: &str) {
        if let Some(p) = &self.pending
            && matches!(p.kind, OperationKind::Invalidation)
            && let Some(a) = self.outstanding.iter_mut().find(|a| a.nonce == p.nonce)
        {
            a.invalidation_requested = false;
            a.invalidation_signed = false;
        }
        if let Some(p) = &self.pending
            && matches!(p.kind, OperationKind::EvmWithdrawal)
        {
            event(
                "withdrawal",
                near_sdk::serde_json::json!({"id": U64(id), "kind": "withdraw3", "recipient": self.evm_recipient, "amount": p.amount, "status": "failed", "reason": reason}),
            );
        }
        self.pending = None;
        event(
            "failure",
            near_sdk::serde_json::json!({"id": U64(id), "reason": reason, "budget_released": false}),
        );
    }
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
struct MpcSignature {
    big_r: PointValue,
    s: ScalarValue,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    scheme: Option<String>,
    recovery_id: u8,
}
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
struct AffinePoint {
    affine_point: String,
}
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
struct Scalar {
    scalar: String,
}
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde", untagged)]
enum PointValue {
    Flat(String),
    Nested(AffinePoint),
}
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde", untagged)]
enum ScalarValue {
    Flat(String),
    Nested(Scalar),
}
impl MpcSignature {
    fn valid_shape(&self) -> bool {
        let r = match &self.big_r {
            PointValue::Flat(s) => s,
            PointValue::Nested(p) => &p.affine_point,
        };
        let scalar = match &self.s {
            ScalarValue::Flat(s) => s,
            ScalarValue::Nested(p) => &p.scalar,
        };
        let scalar = scalar.to_ascii_lowercase();
        r.len() == 66
            && (r.starts_with("02") || r.starts_with("03"))
            && r.bytes().all(|b| b.is_ascii_hexdigit())
            && scalar.len() == 64
            && scalar.bytes().all(|b| b.is_ascii_hexdigit())
            && scalar.bytes().any(|b| b != b'0')
            && scalar.as_str() <= "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0"
            && self.recovery_id <= 1
            && self.scheme.as_ref().is_none_or(|s| s == "Secp256k1")
    }
}
fn validate_signing_limits(l: &SigningLimits) {
    require!(
        l.keeper_per_block > 0
            && l.keeper_per_block <= 4
            && l.keeper_per_window > 0
            && l.keeper_per_window <= 8
            && l.keeper_outstanding > 0
            && l.keeper_outstanding <= 8
            && l.owner_per_window >= 10
            && l.owner_per_window <= 16
            && l.window_ms == 60_000
            && (20..=1_000).contains(&l.max_nonce_ahead_ms),
        "ERR_SIGNING_LIMITS"
    );
}
fn validate_limits(l: &Limits) {
    require!(
        l.max_short_size.0 > 0
            && l.per_order_notional_cap.0 > 0
            && l.per_day_notional_cap.0 >= l.per_order_notional_cap.0,
        "ERR_LIMITS"
    );
    require!(
        l.price_band_bps > 0 && l.price_band_bps < 10_000 && l.price_max_age_seconds > 0,
        "ERR_LIMITS"
    );
}
fn validate_evm(s: &str) {
    require!(
        s.len() == 42
            && s.starts_with("0x")
            && s[2..].bytes().all(|b| b.is_ascii_hexdigit())
            && s[2..].bytes().any(|b| b != b'0'),
        "ERR_EVM_RECIPIENT"
    );
}
fn now() -> u64 {
    env::block_timestamp() / 1_000_000_000
}
fn add(a: u128, b: u128) -> u128 {
    a.checked_add(b).expect("ERR_OVERFLOW")
}
fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}
fn json_bytes(value: near_sdk::serde_json::Value) -> Vec<u8> {
    near_sdk::serde_json::to_vec(&value).expect("typed JSON")
}
fn event(name: &str, data: near_sdk::serde_json::Value) {
    env::log_str(&format!(
        "EVENT_JSON:{}",
        near_sdk::serde_json::json!({"standard": "counterweight", "version": "1.0.0", "event": name, "data": [data]})
    ));
}
// USD micro-units: maximum 5 significant digits AND 6-szDecimals decimals.
fn quantize_price(price: u128, sz_decimals: u8, ceil: bool) -> u128 {
    let digits = price.max(1).ilog10() + 1;
    let step = 10u128.pow(u32::from(sz_decimals).max(digits.saturating_sub(5)).min(6));
    if ceil {
        price.div_ceil(step) * step
    } else {
        price / step * step
    }
}
fn decimal(value: u128, decimals: u32) -> String {
    let factor = 10u128.pow(decimals);
    let (whole, fraction) = (value / factor, value % factor);
    if fraction == 0 {
        whole.to_string()
    } else {
        format!("{whole}.{fraction:0width$}", width = decimals as usize)
            .trim_end_matches('0')
            .to_owned()
    }
}

#[cfg(test)]
mod tests;

fn is_test_account(account: &AccountId) -> bool {
    account.as_str().ends_with(".testnet")
        || (cfg!(feature = "test-utils") && account.as_str().ends_with(".test.near"))
}
