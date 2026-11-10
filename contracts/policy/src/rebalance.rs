use super::*;
pub const HYPERCORE_USDC: &str = "1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054";

/// Fixed route adapter is an owner-approved trust boundary, never selected by keeper.
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct RebalanceLimits {
    pub adapter: AccountId,
    pub strategy_margin_address: String,
    pub destination_token: String,
    pub per_sale_near: U128,
    pub daily_sale_near: U128,
    pub max_fee_usdc: U128,
    pub max_impact_bps: u16,
    pub quote_age_ms: u64,
    pub completion_ms: u64,
    pub max_mismatch_near: U128,
    pub per_withdrawal_usdc: U128,
    pub daily_withdrawal_usdc: U128,
    pub min_residual_equity_usdc: U128,
    pub min_headroom_bps: u16,
    pub lower_headroom_bps: u16,
    pub target_headroom_bps: u16,
    pub upper_headroom_bps: u16,
    pub fee_reserve_usdc: U128,
    pub original_target_usdc: U128,
}
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct SaleQuote {
    pub near_amount: U128,
    pub paired_closed_near: U128,
    pub min_usdc: U128,
    pub fee_usdc: U128,
    pub impact_bps: u16,
    pub quoted_at_ms: U64,
    pub deadline_ms: U64,
}
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub enum RoutePhase {
    Dispatching,
    AwaitingReceipt,
    Uncertain,
    TimedOut,
}
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct SaleRoute {
    pub id: U64,
    pub quote: SaleQuote,
    pub dispatched_near: U128,
    pub phase: RoutePhase,
    pub completion_deadline_ms: U64,
}
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct RebalanceState {
    pub processed_receipts: Vec<[u8; 32]>,
    pub withdrawal: Option<MarginWithdrawal>,
    pub acquisition_budget_usdc: U128,
    pub acquired_near: U128,
    pub reentry_required: bool,
    pub limits: RebalanceLimits,
    pub initial_inventory: U128,
    pub sold_inventory: U128,
    pub reduced_inventory: U128,
    pub usable_margin: U128,
    pub withdrawable: U128,
    pub observed_at_ms: U64,
    pub next_route_id: U64,
    pub route: Option<SaleRoute>,
    pub sales: Vec<(u64, u128)>,
    pub withdrawals: Vec<(u64, u128)>,
}
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct MarginWithdrawal {
    pub nonce: U64,
    pub amount: U128,
}
#[near]
impl Policy {
    pub fn get_rebalance(&self) -> Option<RebalanceState> {
        self.rebalance.clone()
    }

    /// One-time exact route approval. No keeper recipient/chain/token override exists.
    pub fn configure_rebalancing(&mut self, limits: RebalanceLimits) {
        self.assert_owner();
        self.owner_idle();
        require!(
            self.rebalance.is_none() && self.get_margin().is_none(),
            "ERR_ROUTE_IMMUTABLE"
        );
        validate_evm(&limits.strategy_margin_address);
        require!(
            self.network.matches_account(&limits.adapter)
                && limits.adapter != env::current_account_id()
                && limits.adapter != self.owner
                && limits.adapter != self.keeper,
            "ERR_ROUTE_ADAPTER"
        );
        require!(
            limits.destination_token == HYPERCORE_USDC,
            "ERR_ROUTE_TOKEN"
        );
        require!(
            limits.per_sale_near.0 > 0
                && limits.daily_sale_near.0 >= limits.per_sale_near.0
                && limits.max_mismatch_near.0 > 0
                && limits.per_withdrawal_usdc.0 > 0
                && limits.daily_withdrawal_usdc.0 >= limits.per_withdrawal_usdc.0
                && limits.max_impact_bps <= 1000
                && (1..=30_000).contains(&limits.quote_age_ms)
                && (60_000..=3_600_000).contains(&limits.completion_ms)
                && (1000..=10_000).contains(&limits.min_headroom_bps)
                && limits.lower_headroom_bps >= limits.min_headroom_bps
                && limits.target_headroom_bps >= limits.lower_headroom_bps
                && limits.upper_headroom_bps > limits.target_headroom_bps
                && limits.min_residual_equity_usdc.0 > 0
                && limits.fee_reserve_usdc.0 > 0
                && limits.original_target_usdc.0 > 0,
            "ERR_REBALANCE_LIMITS"
        );
        require!(
            limits.original_target_usdc.0
                <= self
                    .spot_balance
                    .checked_mul(self.active_price().0)
                    .expect("ERR_OVERFLOW")
                    / BASE,
            "ERR_ORIGINAL_TARGET"
        );
        event(
            "rebalance_config",
            near_sdk::serde_json::json!({"limits": limits, "source": env::current_account_id(), "source_token": self.wnear_account, "destination_chain": "hyperliquid", "withdrawal_recipient": self.evm_recipient}),
        );
        self.rebalance = Some(RebalanceState {
            processed_receipts: vec![],
            withdrawal: None,
            acquisition_budget_usdc: U128(0),
            acquired_near: U128(0),
            reentry_required: false,
            limits,
            initial_inventory: U128(self.spot_balance),
            sold_inventory: U128(0),
            reduced_inventory: U128(0),
            usable_margin: U128(0),
            withdrawable: U128(0),
            observed_at_ms: U64(0),
            next_route_id: U64(0),
            route: None,
            sales: vec![],
            withdrawals: vec![],
        });
    }

    /// Explicit owner-attested finalized equity, excluding pending/refundable routes.
    pub fn observe_margin(
        &mut self,
        equity_usdc: U128,
        withdrawable_usdc: U128,
        observed_at_ms: U64,
    ) {
        self.assert_owner();
        self.owner_idle();
        self.assert_route_idle();
        require!(
            !self
                .outstanding
                .iter()
                .any(|a| a.withdrawal && !a.invalidation_confirmed),
            "ERR_WITHDRAWAL_UNRESOLVED"
        );
        fresh(observed_at_ms.0, 30_000);
        require!(
            withdrawable_usdc.0 <= equity_usdc.0,
            "ERR_MARGIN_OBSERVATION"
        );
        let mut r = self.margin_state();
        r.usable_margin = equity_usdc;
        r.withdrawable = withdrawable_usdc;
        r.observed_at_ms = observed_at_ms;
        self.save_margin(r);
        event(
            "margin_observation",
            near_sdk::serde_json::json!({"equity_usdc": equity_usdc, "withdrawable_usdc": withdrawable_usdc, "observed_at_ms": observed_at_ms, "source": "owner_finality_attestation"}),
        );
    }

    /// Owner approves both filled reduce-only quantity and this exact bounded sale.
    /// Spot cannot leave until the expiry-gated position settlement releases it.
    #[payable]
    pub fn approve_spot_sale(&mut self, quote: SaleQuote) -> Promise {
        self.assert_owner();
        self.owner_idle();
        self.assert_route_idle();
        require!(!self.paused, "ERR_PAUSED");
        require!(
            env::attached_deposit() == NearToken::from_yoctonear(1),
            "ERR_ONE_YOCTO"
        );
        require!(env::prepaid_gas() >= Gas::from_tgas(100), "ERR_GAS");
        let ms = env::block_timestamp_ms();
        let r = self.rebalance.as_ref().expect("ERR_REBALANCE_CONFIG");
        let l = &r.limits;
        fresh(quote.quoted_at_ms.0, l.quote_age_ms);
        fresh(self.active_price().1 * 1000, l.quote_age_ms);
        require!(
            quote.deadline_ms.0 > ms
                && quote.deadline_ms.0 <= quote.quoted_at_ms.0 + l.quote_age_ms,
            "ERR_QUOTE_DEADLINE"
        );
        require!(
            quote.near_amount.0 > 0
                && quote
                    .near_amount
                    .0
                    .is_multiple_of(10u128.pow(24 - u32::from(self.size_decimals)))
                && quote.near_amount == quote.paired_closed_near
                && quote.near_amount.0 <= l.per_sale_near.0
                && quote.near_amount.0 <= l.max_mismatch_near.0
                && quote.near_amount.0 <= self.spot_balance.saturating_sub(self.signed_short_size)
                && quote.near_amount.0 <= r.reduced_inventory.0
                && add(r.sold_inventory.0, quote.near_amount.0) <= r.initial_inventory.0,
            "ERR_SALE_QUANTITY"
        );
        require!(
            quote.fee_usdc.0 <= l.max_fee_usdc.0 && quote.impact_bps <= l.max_impact_bps,
            "ERR_ROUTE_COST"
        );
        let gross = quote
            .near_amount
            .0
            .checked_mul(self.active_price().0)
            .expect("ERR_OVERFLOW")
            .div_ceil(BASE);
        let minimum = gross
            .checked_mul(10_000 - u128::from(quote.impact_bps))
            .expect("ERR_OVERFLOW")
            .div_ceil(10_000)
            .saturating_sub(quote.fee_usdc.0);
        require!(
            quote.min_usdc.0 > 0 && quote.min_usdc.0 >= minimum,
            "ERR_MIN_OUT"
        );
        let used = rolling_sum(&r.sales);
        require!(
            add(used, quote.near_amount.0) <= l.daily_sale_near.0 && r.sales.len() < 1024,
            "ERR_SALE_DAILY_CAP"
        );
        self.assert_margin_health(self.signed_short_size, r.usable_margin.0);
        let r = self.rebalance.as_mut().unwrap();
        prune_usage(&mut r.sales);
        r.sales.push((ms, quote.near_amount.0));
        r.reduced_inventory.0 -= quote.near_amount.0;
        r.next_route_id.0 = r
            .next_route_id
            .0
            .checked_add(1)
            .expect("ERR_ROUTE_OVERFLOW");
        let route = SaleRoute {
            id: r.next_route_id,
            quote: quote.clone(),
            dispatched_near: quote.near_amount,
            phase: RoutePhase::Dispatching,
            completion_deadline_ms: U64(ms + r.limits.completion_ms),
        };
        r.route = Some(route.clone());
        self.spot_balance -= quote.near_amount.0;
        event(
            "sale_route",
            near_sdk::serde_json::json!({"status": "dispatching", "route": route, "source": env::current_account_id(), "destination": r.limits.strategy_margin_address, "chain": "hyperliquid", "token": r.limits.destination_token}),
        );
        Promise::new(self.wnear_account.clone()).function_call("ft_transfer_call", json_bytes(near_sdk::serde_json::json!({"receiver_id": r.limits.adapter, "amount": quote.near_amount, "memo": "Counterweight exact approved sale", "msg": near_sdk::serde_json::json!({"route_id": route.id, "source": env::current_account_id(), "destination_chain": "hyperliquid", "destination_token": r.limits.destination_token, "recipient": r.limits.strategy_margin_address, "min_usdc": quote.min_usdc, "fee_usdc": quote.fee_usdc, "max_impact_bps": quote.impact_bps, "deadline_ms": quote.deadline_ms}).to_string()})), NearToken::from_yoctonear(1), Gas::from_tgas(60))
            .then(Promise::new(env::current_account_id()).function_call("on_sale_dispatch", json_bytes(near_sdk::serde_json::json!({"route_id": route.id})), NearToken::from_yoctonear(0), Gas::from_tgas(20)))
    }

    #[private]
    pub fn on_sale_dispatch(&mut self, route_id: U64) -> bool {
        require!(
            env::predecessor_account_id() == env::current_account_id(),
            "ERR_PRIVATE_CALLBACK"
        );
        require!(env::promise_results_count() == 1, "ERR_CALLBACK_RESULTS");
        let Some(route) = self
            .rebalance
            .as_ref()
            .and_then(|r| r.route.clone())
            .filter(|r| r.id == route_id && r.phase == RoutePhase::Dispatching)
        else {
            return false;
        };
        // NEP-141 ft_transfer_call returns the amount USED, not the unused amount.
        let used = env::promise_result_checked(0, 128)
            .ok()
            .and_then(|b| near_sdk::serde_json::from_slice::<U128>(&b).ok())
            .filter(|u| u.0 <= route.quote.near_amount.0);
        let r = self.rebalance.as_mut().unwrap();
        match used {
            Some(used) => {
                self.spot_balance = add(self.spot_balance, route.quote.near_amount.0 - used.0);
                r.reduced_inventory.0 =
                    add(r.reduced_inventory.0, route.quote.near_amount.0 - used.0);
                if used.0 == 0 {
                    r.route = None;
                } else {
                    let p = r.route.as_mut().unwrap();
                    p.dispatched_near = used;
                    p.phase = RoutePhase::AwaitingReceipt;
                }
                event(
                    "sale_dispatch",
                    near_sdk::serde_json::json!({"route_id": route_id, "used_near": used, "status": "resolved"}),
                );
                true
            }
            None => {
                r.route.as_mut().unwrap().phase = RoutePhase::Uncertain;
                self.emergency_pause();
                event(
                    "sale_dispatch",
                    near_sdk::serde_json::json!({"route_id": route_id, "status": "uncertain", "inventory_released": false}),
                );
                false
            }
        }
    }
    pub fn expire_sale_route(&mut self) {
        let route = self
            .rebalance
            .as_mut()
            .and_then(|r| r.route.as_mut())
            .expect("ERR_NO_ROUTE");
        require!(
            env::block_timestamp_ms() > route.completion_deadline_ms.0,
            "ERR_ROUTE_ACTIVE"
        );
        route.phase = RoutePhase::TimedOut;
        self.emergency_pause();
        event(
            "sale_timeout",
            near_sdk::serde_json::json!({"inventory_released": false}),
        );
    }

    /// Fixed-recipient arrival attestation; no pending arrival is usable spot.
    pub fn reconcile_margin_withdrawal(
        &mut self,
        nonce: U64,
        received_usdc: U128,
        fee_usdc: U128,
        receipt_id: String,
        finalized_at_ms: U64,
    ) {
        self.assert_owner();
        fresh(finalized_at_ms.0, 30_000);
        require!(
            !receipt_id.is_empty() && receipt_id.len() <= 128,
            "ERR_RECEIPT"
        );
        let mut r = self.margin_state();
        let w = r
            .withdrawal
            .as_ref()
            .filter(|w| w.nonce == nonce)
            .expect("ERR_WITHDRAWAL_UNRESOLVED");
        require!(
            received_usdc.0 > 0
                && add(received_usdc.0, fee_usdc.0) == w.amount.0
                && fee_usdc.0 <= r.limits.max_fee_usdc.0,
            "ERR_WITHDRAWAL_RECEIPT"
        );
        let digest = env::sha256_array(receipt_id.as_bytes());
        require!(
            !r.processed_receipts.contains(&digest),
            "ERR_DUPLICATE_RECEIPT"
        );
        require!(r.processed_receipts.len() < 1024, "ERR_RECEIPT_CAPACITY");
        r.processed_receipts.push(digest);
        r.withdrawal = None;
        self.save_margin(r);
        if let Some(r) = &mut self.rebalance {
            r.acquisition_budget_usdc.0 = add(r.acquisition_budget_usdc.0, received_usdc.0);
            r.reentry_required = true;
        }
        if let Some(a) = self
            .outstanding
            .iter_mut()
            .find(|a| a.nonce == nonce.0 && a.withdrawal)
        {
            a.invalidation_confirmed = true;
        } // finalized consumed withdrawal nonce, owner proof boundary
        event(
            "margin_withdrawal_receipt",
            near_sdk::serde_json::json!({"nonce": nonce, "recipient": self.evm_recipient, "received_usdc": received_usdc, "fee_usdc": fee_usdc, "receipt_id": receipt_id, "finalized_at_ms": finalized_at_ms, "source": "owner_finality_attestation"}),
        );
    }
    /// A confirmed noop (or natural replay-window expiry) permits owner cancellation.
    /// Margin is not refunded: owner must refresh finalized venue equity separately.
    pub fn abandon_margin_withdrawal(&mut self) {
        self.assert_owner();
        let mut r = self.margin_state();
        let w = r.withdrawal.as_ref().expect("ERR_WITHDRAWAL_UNRESOLVED");
        require!(
            self.outstanding.iter().all(|a| a.nonce != w.nonce.0
                || a.invalidation_confirmed
                || a.expires_after < env::block_timestamp_ms()),
            "ERR_WITHDRAWAL_UNRESOLVED"
        );
        r.withdrawal = None;
        self.save_margin(r);
    }

    /// Owner verifies the finalized adapter/venue receipt for this exact fixed route.
    /// A late receipt may reconcile an unresolved route, never a completed route.
    pub fn reconcile_sale_receipt(
        &mut self,
        route_id: U64,
        refunded_near: U128,
        credited_usdc: U128,
        receipt_id: String,
        finalized_at_ms: U64,
    ) {
        self.assert_owner();
        fresh(finalized_at_ms.0, 30_000);
        require!(
            !receipt_id.is_empty() && receipt_id.len() <= 128,
            "ERR_RECEIPT"
        );
        let r = self.rebalance.as_ref().expect("ERR_REBALANCE_CONFIG");
        let route = r
            .route
            .clone()
            .filter(|r| r.id == route_id)
            .expect("ERR_NO_ROUTE");
        require!(
            route.phase != RoutePhase::Dispatching,
            "ERR_DISPATCH_UNRESOLVED"
        );
        require!(
            refunded_near.0 <= route.dispatched_near.0
                && refunded_near
                    .0
                    .is_multiple_of(10u128.pow(24 - u32::from(self.size_decimals))),
            "ERR_REFUND_AMOUNT"
        );
        let sold = route.dispatched_near.0 - refunded_near.0;
        let min_out = route
            .quote
            .min_usdc
            .0
            .checked_mul(sold)
            .expect("ERR_OVERFLOW")
            .div_ceil(route.quote.near_amount.0);
        let max_out = sold
            .checked_mul(self.active_price().0)
            .expect("ERR_OVERFLOW")
            .div_ceil(BASE)
            .checked_mul(2)
            .expect("ERR_OVERFLOW");
        require!(
            credited_usdc.0 >= min_out
                && credited_usdc.0 <= max_out
                && (sold > 0 || credited_usdc.0 == 0),
            "ERR_ROUTE_RECEIPT_AMOUNT"
        );
        self.record_receipt(&receipt_id);
        self.spot_balance = add(self.spot_balance, refunded_near.0);
        let r = self.rebalance.as_mut().unwrap();
        r.sold_inventory.0 = add(r.sold_inventory.0, sold);
        r.reduced_inventory.0 = add(r.reduced_inventory.0, refunded_near.0);
        r.usable_margin.0 = add(r.usable_margin.0, credited_usdc.0);
        // Receipt credits only its actual amount; it does not refresh old equity marks.
        r.route = None;
        event(
            "margin_topup",
            near_sdk::serde_json::json!({"route_id": route_id, "sold_near": U128(sold), "refunded_near": refunded_near, "credited_usdc": credited_usdc, "recipient": r.limits.strategy_margin_address, "chain": "hyperliquid", "token": r.limits.destination_token, "receipt_id": receipt_id, "finalized_at_ms": finalized_at_ms, "source": "owner_finality_attestation"}),
        );
    }
}
impl Policy {
    fn record_receipt(&mut self, receipt_id: &str) {
        let digest: [u8; 32] = env::sha256(receipt_id.as_bytes()).try_into().unwrap();
        let r = self.rebalance.as_mut().expect("ERR_REBALANCE_CONFIG");
        require!(
            !r.processed_receipts.contains(&digest),
            "ERR_DUPLICATE_RECEIPT"
        );
        require!(r.processed_receipts.len() < 1024, "ERR_RECEIPT_CAPACITY");
        r.processed_receipts.push(digest);
    }
    pub(crate) fn assert_route_idle(&self) {
        require!(
            self.rebalance
                .as_ref()
                .is_none_or(|r| r.route.is_none() && r.withdrawal.is_none()),
            "ERR_ROUTE_UNRESOLVED"
        );
        require!(
            self.get_margin().is_none_or(|m| m.withdrawal.is_none()),
            "ERR_ROUTE_UNRESOLVED"
        );
    }
    pub(crate) fn assert_margin_health(&self, short: u128, equity: u128) {
        let r = self.margin_state();
        fresh(r.observed_at_ms.0, 30_000);
        let upper = if short == 0 {
            0
        } else {
            fresh(self.active_price().1 * 1000, 30_000);
            self.active_price()
                .0
                .checked_mul(10_000 + u128::from(self.limits.price_band_bps))
                .expect("ERR_OVERFLOW")
                .div_ceil(10_000)
        };
        let notional = short
            .checked_mul(upper)
            .expect("ERR_OVERFLOW")
            .div_ceil(BASE);
        let usable = equity.saturating_sub(r.limits.fee_reserve_usdc.0);
        require!(
            equity >= r.limits.min_residual_equity_usdc.0
                && equity >= r.limits.fee_reserve_usdc.0
                && usable >= notional
                && usable.saturating_sub(notional)
                    >= notional
                        .checked_mul(u128::from(r.limits.min_headroom_bps))
                        .expect("ERR_OVERFLOW")
                        .div_ceil(10_000),
            "ERR_MARGIN_HEALTH"
        );
    }
    pub(crate) fn reserve_margin_withdrawal(&mut self, amount: u128) {
        self.assert_route_idle();
        let r = self.margin_state();
        require!(
            amount <= r.limits.per_withdrawal_usdc.0
                && amount <= r.withdrawable.0
                && add(rolling_sum(&r.withdrawals), amount) <= r.limits.daily_withdrawal_usdc.0
                && r.withdrawals.len() < 1024,
            "ERR_MARGIN_WITHDRAWAL_CAP"
        );
        require!(amount <= r.usable_margin.0, "ERR_MARGIN_HEALTH");
        self.assert_margin_health(self.signed_short_size, r.usable_margin.0 - amount);
        let mut r = self.margin_state();
        prune_usage(&mut r.withdrawals);
        r.withdrawals.push((env::block_timestamp_ms(), amount));
        r.withdrawal = Some(MarginWithdrawal {
            nonce: U64(0),
            amount: U128(amount),
        });
        r.usable_margin.0 -= amount;
        r.withdrawable.0 -= amount;
        self.save_margin(r);
    }
    pub(crate) fn check_rebalance_increase(&self, total: u128) {
        self.assert_route_idle();
        if self.get_margin().is_some() {
            self.assert_margin_health(total, self.margin_state().usable_margin.0);
        }
        if let Some(r) = &self.rebalance {
            require!(
                total <= r.initial_inventory.0
                    && total
                        .checked_mul(
                            self.active_price()
                                .0
                                .checked_mul(10_000 + u128::from(self.limits.price_band_bps))
                                .expect("ERR_OVERFLOW")
                                .div_ceil(10_000)
                        )
                        .expect("ERR_OVERFLOW")
                        .div_ceil(BASE)
                        <= r.limits.original_target_usdc.0,
                "ERR_ORIGINAL_TARGET"
            );
            require!(
                !self
                    .outstanding
                    .iter()
                    .any(|a| a.withdrawal && !a.invalidation_confirmed),
                "ERR_WITHDRAWAL_UNRESOLVED"
            );
            if r.reentry_required {
                let size = total.saturating_sub(self.signed_short_size);
                let upper = self
                    .active_price()
                    .0
                    .checked_mul(10_000 + u128::from(self.limits.price_band_bps))
                    .expect("ERR_OVERFLOW")
                    .div_ceil(10_000);
                let cost = size
                    .checked_mul(upper)
                    .expect("ERR_OVERFLOW")
                    .div_ceil(BASE);
                let before_notional = self
                    .signed_short_size
                    .checked_mul(upper)
                    .expect("ERR_OVERFLOW")
                    .div_ceil(BASE);
                let after_notional = total
                    .checked_mul(upper)
                    .expect("ERR_OVERFLOW")
                    .div_ceil(BASE);
                let equity = r
                    .usable_margin
                    .0
                    .saturating_sub(r.limits.fee_reserve_usdc.0);
                let before_h = equity
                    .saturating_sub(before_notional)
                    .checked_mul(10_000)
                    .expect("ERR_OVERFLOW")
                    .checked_div(before_notional)
                    .unwrap_or(u128::MAX);
                let after_h = equity
                    .saturating_sub(after_notional)
                    .checked_mul(10_000)
                    .expect("ERR_OVERFLOW")
                    / after_notional;
                require!(
                    before_h > u128::from(r.limits.upper_headroom_bps)
                        && after_h >= u128::from(r.limits.lower_headroom_bps)
                        && after_h.abs_diff(u128::from(r.limits.target_headroom_bps))
                            < before_h.abs_diff(u128::from(r.limits.target_headroom_bps)),
                    "ERR_HEADROOM_BAND"
                );
                require!(
                    size <= r.acquired_near.0
                        && cost >= 10_000_000
                        && add(cost, r.limits.fee_reserve_usdc.0) <= r.acquisition_budget_usdc.0,
                    "ERR_ACQUISITION_UNFINALIZED"
                );
            }
            self.assert_margin_health(total, r.usable_margin.0);
        }
    }
}
fn fresh(timestamp_ms: u64, age_ms: u64) {
    let ms = env::block_timestamp_ms();
    require!(
        timestamp_ms <= ms && ms - timestamp_ms <= age_ms,
        "ERR_REBALANCE_STALE"
    );
}
fn rolling_sum(entries: &[(u64, u128)]) -> u128 {
    entries
        .iter()
        .filter(|(t, _)| env::block_timestamp_ms().saturating_sub(*t) < DAY * 1000)
        .fold(0, |a, (_, n)| add(a, *n))
}
fn prune_usage(entries: &mut Vec<(u64, u128)>) {
    entries.retain(|(t, _)| env::block_timestamp_ms().saturating_sub(*t) < DAY * 1000);
}
