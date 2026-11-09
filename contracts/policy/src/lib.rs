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

/// Field order is intentional; the future MessagePack encoder must preserve it.
#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct HlOrder {
    pub a: u32,
    pub b: bool,
    pub p: String,
    pub s: String,
    pub r: bool,
    pub t: OrderType,
}
#[near(serializers = [json])]
#[derive(Clone, Debug)]
pub struct OrderType {
    pub limit: LimitType,
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
    /// Lifetime signed/reserved opens, NEVER decreased by a close signature.
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
            keeper != env::current_account_id() && owner != env::current_account_id(),
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
        Self {
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
            keeper != env::current_account_id() && heartbeat_timeout_seconds > 0,
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

    pub fn set_paused(&mut self, paused: bool) {
        self.assert_owner();
        self.paused = paused;
        event("pause", near_sdk::serde_json::json!({"paused": paused}));
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
        self.assert_idle();
        require!(
            recipient.to_ascii_lowercase() == self.evm_recipient,
            "ERR_RECIPIENT"
        );
        require!(amount.0 > 0, "ERR_AMOUNT");
        self.assert_signing_resources();
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
        let op = self.assert_callback(operation_id.0);
        require!(
            !matches!(op.kind, OperationKind::SpotWithdrawal),
            "ERR_CALLBACK_KIND"
        );
        match env::promise_result_checked(0, 1024) {
            Ok(bytes) => {
                if let Ok(signature) = near_sdk::serde_json::from_slice::<MpcSignature>(&bytes)
                    && signature.valid_shape()
                {
                    event(
                        "signature",
                        near_sdk::serde_json::json!({"id": operation_id, "signature": signature}),
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
                self.mark_uncertain(operation_id.0, "malformed_signer_response");
            }
            Err(_) => self.mark_uncertain(operation_id.0, "signer_receipt_failed_or_oversized"),
        }
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

    /// Acknowledges uncertain MPC outcome; never refunds signed size, daily budget,
    /// or cooldown. Cannot clear a callback still in flight or a token withdrawal.
    pub fn acknowledge_failed_signature(&mut self, operation_id: U64) {
        self.assert_owner();
        let op = self.pending.as_ref().expect("ERR_NO_PENDING");
        require!(
            op.id == operation_id.0 && op.phase == Phase::Uncertain,
            "ERR_PENDING_PHASE"
        );
        require!(
            !matches!(op.kind, OperationKind::SpotWithdrawal),
            "ERR_CALLBACK_KIND"
        );
        self.pending = None;
        event(
            "reconciliation",
            near_sdk::serde_json::json!({"id": operation_id, "budget_released": false}),
        );
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
        (env::block_timestamp_ms()).max(self.last_nonce.checked_add(1).expect("ERR_NONCE_OVERFLOW"))
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
        });
        self.operation_id
    }
    fn request_order(&mut self, order: OrderParams) -> Promise {
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
        let nonce = self.next_nonce();
        let payload = SigningPayload {
            action: HlAction::Order {
                orders: vec![HlOrder {
                    a: self.asset_index,
                    b: order.reduce_only,
                    p: decimal(price, 6),
                    s: decimal(order.size.0, 24),
                    r: order.reduce_only,
                    t: OrderType {
                        limit: LimitType { tif: "Ioc".into() },
                    },
                }],
                grouping: "na".into(),
            },
            nonce,
            expires_after: Some(nonce.checked_add(60_000).expect("ERR_NONCE_OVERFLOW")),
        };
        let digest = hl_digest::digest(&payload).unwrap_or_else(|e| env::panic_str(e));
        if !order.reduce_only {
            self.signed_short_size = add(self.signed_short_size, order.size.0);
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
        let id = self.begin(kind, amount);
        self.last_nonce = payload.nonce;
        event(
            "request",
            near_sdk::serde_json::json!({"id": U64(id), "payload": payload, "digest": hex(&digest), "digest_implementation": hl_digest::PLACEHOLDER_NAME}),
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
        self.pending.as_mut().expect("ERR_NO_PENDING").phase = Phase::Uncertain;
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
