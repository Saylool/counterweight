//! Fixed-recipient margin controls have no route/adapter dependency.
use super::*;
const MARGIN_KEY: &[u8] = b"v3:margin";
const EXIT_KEY: &[u8] = b"v3:exit_requests";
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct MarginLimits {
    pub per_withdrawal_usdc: U128,
    pub daily_withdrawal_usdc: U128,
    pub min_residual_equity_usdc: U128,
    pub min_headroom_bps: u16,
    pub fee_reserve_usdc: U128,
    pub max_fee_usdc: U128,
}
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct MarginState {
    pub limits: MarginLimits,
    pub usable_margin: U128,
    pub withdrawable: U128,
    pub observed_at_ms: U64,
    pub withdrawals: Vec<(u64, u128)>,
    pub withdrawal: Option<MarginWithdrawal>,
    pub processed_receipts: Vec<[u8; 32]>,
}
#[near]
impl Policy {
    /// One-time margin policy; no adapter, token route, or spot sale is configured.
    pub fn configure_margin_withdrawals(&mut self, limits: MarginLimits) {
        self.assert_owner();
        self.owner_idle();
        require!(
            self.rebalance.is_none() && self.get_margin().is_none(),
            "ERR_MARGIN_IMMUTABLE"
        );
        require!(
            limits.per_withdrawal_usdc.0 > 0
                && limits.daily_withdrawal_usdc.0 >= limits.per_withdrawal_usdc.0
                && limits.min_residual_equity_usdc.0 >= 1_000_000
                && (1000..=10_000).contains(&limits.min_headroom_bps)
                && limits.fee_reserve_usdc.0 > 0,
            "ERR_MARGIN_LIMITS"
        );
        let m = MarginState {
            limits,
            usable_margin: U128(0),
            withdrawable: U128(0),
            observed_at_ms: U64(0),
            withdrawals: vec![],
            withdrawal: None,
            processed_receipts: vec![],
        };
        event(
            "margin_config",
            near_sdk::serde_json::json!({"limits":m.limits,"recipient":self.evm_recipient}),
        );
        write_extension(MARGIN_KEY, &m);
    }
    pub fn get_margin(&self) -> Option<MarginState> {
        if let Some(r) = &self.rebalance {
            Some(MarginState {
                limits: MarginLimits {
                    per_withdrawal_usdc: r.limits.per_withdrawal_usdc,
                    daily_withdrawal_usdc: r.limits.daily_withdrawal_usdc,
                    min_residual_equity_usdc: r.limits.min_residual_equity_usdc,
                    min_headroom_bps: r.limits.min_headroom_bps,
                    fee_reserve_usdc: r.limits.fee_reserve_usdc,
                    max_fee_usdc: r.limits.max_fee_usdc,
                },
                usable_margin: r.usable_margin,
                withdrawable: r.withdrawable,
                observed_at_ms: r.observed_at_ms,
                withdrawals: r.withdrawals.clone(),
                withdrawal: r.withdrawal.clone(),
                processed_receipts: r.processed_receipts.clone(),
            })
        } else {
            read_extension(MARGIN_KEY)
        }
    }
}
impl Policy {
    pub(crate) fn margin_state(&self) -> MarginState {
        self.get_margin().expect("ERR_MARGIN_CONFIG")
    }
    pub(crate) fn save_margin(&mut self, m: MarginState) {
        if let Some(r) = &mut self.rebalance {
            r.usable_margin = m.usable_margin;
            r.withdrawable = m.withdrawable;
            r.observed_at_ms = m.observed_at_ms;
            r.withdrawals = m.withdrawals;
            r.withdrawal = m.withdrawal;
            r.processed_receipts = m.processed_receipts;
        } else {
            write_extension(MARGIN_KEY, &m);
        }
    }
    /// Separate bounded exit allowance: additions/cancels cannot exhaust it.
    pub(crate) fn charge_exit(&mut self, keeper: bool, public: bool) {
        self.prune();
        let role: u8 = if keeper {
            1
        } else if public {
            2
        } else {
            0
        };
        let ms = env::block_timestamp_ms();
        let mut requests: Vec<(u8, u64, u64)> = read_extension(EXIT_KEY).unwrap_or_default();
        requests.retain(|(_, t, _)| ms.saturating_sub(*t) < self.signing_limits.window_ms);
        let count = requests.iter().filter(|(r, _, _)| *r == role).count();
        let limit = if public {
            1
        } else if keeper {
            self.signing_limits.keeper_per_window
        } else {
            self.signing_limits.owner_per_window
        };
        require!(count < limit as usize, "ERR_EXIT_RATE_LIMIT");
        if keeper {
            require!(
                requests
                    .iter()
                    .filter(|(r, _, h)| *r == role && *h == env::block_height())
                    .count()
                    < self.signing_limits.keeper_per_block as usize,
                "ERR_KEEPER_BLOCK_LIMIT"
            );
        }
        requests.push((role, ms, env::block_height()));
        write_extension(EXIT_KEY, &requests);
    }
}
