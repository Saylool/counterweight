#![allow(clippy::too_many_arguments)] // Flat NEAR initializer ABI and generated wrapper.
use near_sdk::json_types::{U64, U128};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    AccountId, Gas, NearToken, PanicOnDefault, Promise, PromiseOrValue, env, near, require,
};

pub mod hl_digest;
const BASE: u128 = 10u128.pow(24); // wNEAR yocto base units
const DAY: u64 = 86_400;
const SIGN_GAS: Gas = Gas::from_tgas(250);
const CALLBACK_GAS: Gas = Gas::from_tgas(30);
const LIFETIME_MS: u64 = 60_000;

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
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Policy {
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
    ) -> Self {
        require!(
            env::predecessor_account_id() == owner,
            "ERR_CALLER_NOT_OWNER"
        );
        // A local sandbox account also ends in .testnet. No mainnet initializer.
        require!(
            is_test_account(&env::current_account_id()),
            "ERR_TESTNET_ONLY"
        );
        require!(is_test_account(&signer_account), "ERR_TESTNET_SIGNER");
        require!(is_test_account(&wnear_account), "ERR_TESTNET_WNEAR");
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
        require!(size_decimals <= 8, "ERR_SIZE_DECIMALS");
        validate_evm(&evm_recipient);
        validate_limits(&limits);
        require!(
            heartbeat_timeout_seconds > 0 && reference_price.0 > 0,
            "ERR_CONFIG"
        );
        let signing_limits = signing_limits.unwrap_or_default();
        validate_signing_limits(&signing_limits);
        Self {
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

    pub fn get_state(&self) -> StateView {
        StateView {
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
        }
    }

    pub fn set_config(
        &mut self,
        keeper: AccountId,
        limits: Limits,
        heartbeat_timeout_seconds: u64,
    ) {
        self.assert_owner();
        self.assert_idle();
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
            near_sdk::serde_json::json!({"keeper": self.keeper, "limits": self.limits}),
        );
    }

    /// An owner-approved observation, not an oracle. Keeper cannot choose its own band.
    pub fn set_reference_price(&mut self, price: U128) {
        self.assert_owner();
        require!(price.0 > 0, "ERR_PRICE");
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
            expires_after: Some(a.expires_after),
        };
        let digest = hl_digest::digest(&payload).unwrap_or_else(|e| env::panic_str(e));
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
        self.expire_pending();
        self.assert_idle();
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
    pub fn emergency_reduce(&mut self, size: U128) -> Promise {
        self.assert_owner();
        self.clear_signing_slot();
        self.request_order(OrderParams {
            asset_index: self.asset_index,
            size,
            reduce_only: true,
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
        let digest = hl_digest::digest(&payload).unwrap_or_else(|e| env::panic_str(e));
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
    pub fn deleverage(&mut self) -> Promise {
        require!(
            now().saturating_sub(self.last_keeper_heartbeat) >= self.heartbeat_timeout_seconds,
            "ERR_HEARTBEAT_ACTIVE"
        );
        self.expire_pending();
        // Public callers can preempt a keeper, but cannot discard an owner's
        // fresh emergency/invalidation callback. Its local deadline is bounded.
        if self.pending.as_ref().is_some_and(|p| p.keeper) {
            self.clear_signing_slot();
        }
        self.request_order(OrderParams {
            asset_index: self.asset_index,
            size: U128(self.signed_short_size),
            reduce_only: true,
        })
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
        self.assert_signing_resources();
        self.charge_signing(false, false);
        let nonce = self.next_nonce();
        let payload = SigningPayload {
            action: HlAction::Withdraw {
                hyperliquid_chain: "Testnet".into(),
                signature_chain_id: "0x66eee".into(),
                destination: self.evm_recipient.clone(),
                amount: decimal(amount.0, 6),
                time: nonce,
            },
            nonce,
            expires_after: None,
        };
        let digest = hl_digest::digest(&payload).unwrap_or_else(|e| env::panic_str(e));
        self.start_signing(payload, digest, OperationKind::EvmWithdrawal, amount.0)
    }

    /// Withdraw wNEAR (not native operating NEAR); encumbered spot stays held.
    #[payable]
    pub fn withdraw_spot(&mut self, recipient: AccountId, amount: U128) -> Promise {
        self.assert_owner();
        self.assert_idle();
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

    #[private]
    pub fn on_signature(&mut self, operation_id: U64) -> bool {
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
                    near_sdk::serde_json::json!({"id": operation_id, "recipient": self.evm_recipient, "amount": op.amount, "status": "signed"}),
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
            near_sdk::serde_json::json!({"id": operation_id, "status": if success { "completed" } else { "failed" }, "recipient": self.owner, "amount": op.amount}),
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
    fn assert_signing_resources(&self) {
        require!(
            env::attached_deposit() == NearToken::from_yoctonear(1),
            "ERR_ONE_YOCTO"
        );
        require!(env::prepaid_gas() >= Gas::from_tgas(300), "ERR_GAS");
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
        self.keeper_requests
            .retain(|(t, _)| ms.saturating_sub(*t) < window);
        self.owner_requests
            .retain(|t| ms.saturating_sub(*t) < window);
    }
    fn charge_signing(&mut self, keeper: bool, public: bool) {
        self.prune();
        let ms = env::block_timestamp_ms();
        require!(self.outstanding.len() < 32, "ERR_OUTSTANDING_CAP");
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
        if keeper {
            require!(!self.paused, "ERR_PAUSED");
        }
        self.expire_pending();
        self.assert_idle();
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
        let price = self
            .reference_price
            .checked_mul(if order.reduce_only {
                10_000 + band
            } else {
                10_000 - band
            })
            .expect("ERR_OVERFLOW")
            / 10_000;
        require!(price > 0, "ERR_PRICE");
        let mut notional = 0;
        if order.reduce_only {
            require!(order.size.0 <= self.signed_short_size, "ERR_REDUCE_SIZE");
        } else {
            require!(!self.paused, "ERR_PAUSED");
            require!(
                now().saturating_sub(self.reference_price_timestamp)
                    <= self.limits.price_max_age_seconds,
                "ERR_STALE_PRICE"
            );
            let total = add(self.signed_short_size, order.size.0);
            require!(total <= self.spot_balance, "ERR_EXCEEDS_SPOT_HEDGE");
            require!(total <= self.limits.max_short_size.0, "ERR_MAX_SHORT");
            // Charge at the upper band: a sell can execute ABOVE its lower limit.
            let upper = self
                .reference_price
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
            let used = if self.usage_day == now() / DAY {
                self.daily_usage
            } else {
                0
            };
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
        self.charge_signing(
            keeper,
            !keeper && env::predecessor_account_id() != self.owner,
        );
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
        let digest = hl_digest::digest(&payload).unwrap_or_else(|e| env::panic_str(e));
        if !order.reduce_only {
            self.signed_short_size = add(self.signed_short_size, order.size.0);
            self.lifetime_opened = add(self.lifetime_opened, order.size.0);
            self.last_open_expiry = payload.expires_after.unwrap();
            if self.usage_day != now() / DAY {
                self.daily_usage = 0;
                self.usage_day = now() / DAY;
            }
            self.daily_usage = add(self.daily_usage, notional);
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
        let keeper = env::predecessor_account_id() == self.keeper && !invalidation;
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
            if let Some(expiry) = payload.expires_after {
                self.outstanding.push(Authorization {
                    nonce: payload.nonce,
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
            near_sdk::serde_json::json!({"id": U64(id), "payload": payload, "digest": hex(&digest), "digest_implementation": hl_digest::IMPLEMENTATION}),
        );
        Promise::new(self.signer_account.clone()).function_call(
            "sign", json_bytes(near_sdk::serde_json::json!({"request": {"payload_v2": {"Ecdsa": hex(&digest)}, "path": self.derivation_path, "domain_id": 0}})),
            NearToken::from_yoctonear(1), SIGN_GAS,
        ).then(self.callback("on_signature", id))
    }
    fn callback(&self, name: &str, id: u64) -> Promise {
        Promise::new(env::current_account_id()).function_call(
            name,
            json_bytes(near_sdk::serde_json::json!({"operation_id": U64(id)})),
            NearToken::from_yoctonear(0),
            CALLBACK_GAS,
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
    big_r: AffinePoint,
    s: Scalar,
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
impl MpcSignature {
    fn valid_shape(&self) -> bool {
        let r = &self.big_r.affine_point;
        r.len() == 66
            && (r.starts_with("02") || r.starts_with("03"))
            && r.bytes().all(|b| b.is_ascii_hexdigit())
            && self.s.scalar.len() == 64
            && self.s.scalar.bytes().all(|b| b.is_ascii_hexdigit())
            && self.recovery_id <= 1
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
            && l.max_nonce_ahead_ms <= 1_000,
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
