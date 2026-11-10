//! Opening bounds are owner time-locked; exits use a separate wide sanity range.
use super::*;
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct OracleConfig {
    pub account_id: Option<AccountId>,
    pub feed_id: String,
    pub max_age_seconds: u64,
    pub max_confidence_bps: u16,
    /// Absolute micro-USD opening bounds; updates require a 24-hour owner timelock.
    pub min_price: U128,
    pub max_price: U128,
}
#[near(serializers = [json])]
pub struct PythPrice {
    pub price: String,
    pub conf: String,
    pub expo: i32,
    pub publish_time: i64,
}
impl OracleConfig {
    pub(crate) fn validate(&self, initial: u128) {
        require!(
            self.feed_id.len() == 64 && self.feed_id.bytes().all(|c| c.is_ascii_hexdigit()),
            "ERR_ORACLE_FEED"
        );
        require!(
            (1..=300).contains(&self.max_age_seconds)
                && (1..=100).contains(&self.max_confidence_bps),
            "ERR_ORACLE_CONFIG"
        );
        require!(
            self.min_price.0 >= 10
                && self.max_price.0 <= 1_000_000_000_000
                && self.min_price.0 <= initial
                && initial <= self.max_price.0,
            "ERR_PRICE_BOUNDS"
        );
    }
}
#[near]
impl Policy {
    /// Any caller can refresh; caller cannot select the account, feed or response.
    pub fn refresh_oracle(&self) -> Promise {
        let oracle = self
            .oracle
            .account_id
            .clone()
            .expect("ERR_ORACLE_UNAVAILABLE");
        Promise::new(oracle).function_call("get_price_no_older_than", json_bytes(near_sdk::serde_json::json!({"price_id": self.oracle.feed_id, "age": self.oracle.max_age_seconds})), NearToken::from_yoctonear(0), Gas::from_tgas(15))
            .then(Promise::new(env::current_account_id()).function_call("on_oracle_price", b"{}".to_vec(), NearToken::from_yoctonear(0), Gas::from_tgas(15)))
    }
    #[private]
    pub fn on_oracle_price(&mut self) -> bool {
        require!(
            env::predecessor_account_id() == env::current_account_id(),
            "ERR_PRIVATE_CALLBACK"
        );
        require!(env::promise_results_count() == 1, "ERR_CALLBACK_RESULTS");
        let result = env::promise_result_checked(0, 512)
            .ok()
            .and_then(|b| near_sdk::serde_json::from_slice::<Option<PythPrice>>(&b).ok())
            .flatten();
        let Some(p) = result else {
            return false;
        };
        let Some((price, published)) = self.checked_oracle_price(p) else {
            return false;
        };
        // Out-of-order asynchronous receipts never roll the cache backwards.
        if published <= self.oracle_timestamp {
            return false;
        }
        self.oracle_price = price;
        self.oracle_timestamp = published;
        true
    }
    /// Only keeper may supply fresh observations when the public feed is unavailable/stale.
    /// Cache wide sane marks for exits/health; opens separately enforce time-locked bounds.
    pub fn set_keeper_price(&mut self, price: U128, observed_at: U64) {
        self.assert_keeper();
        require!(!self.oracle_fresh(), "ERR_ORACLE_PRIMARY");
        require!(
            observed_at.0 <= now() && now() - observed_at.0 <= self.oracle.max_age_seconds,
            "ERR_STALE_PRICE"
        );
        assert_exit_price(price.0);
        require!(
            observed_at.0 >= self.reference_price_timestamp,
            "ERR_PRICE_ROLLBACK"
        );
        self.reference_price = price.0;
        self.reference_price_timestamp = observed_at.0;
    }
}
impl Policy {
    pub(crate) fn assert_price_bounds(&self, price: u128) {
        require!(
            (self.oracle.min_price.0..=self.oracle.max_price.0).contains(&price),
            "ERR_PRICE_BOUNDS"
        );
    }
    pub(crate) fn oracle_fresh(&self) -> bool {
        self.oracle.account_id.is_some()
            && self.oracle_price > 0
            && self.oracle_timestamp <= now()
            && now() - self.oracle_timestamp <= self.oracle.max_age_seconds
    }
    pub(crate) fn active_price(&self) -> (u128, u64) {
        if self.oracle_fresh() {
            (self.oracle_price, self.oracle_timestamp)
        } else {
            (self.reference_price, self.reference_price_timestamp)
        }
    }
    fn checked_oracle_price(&self, p: PythPrice) -> Option<(u128, u64)> {
        self.oracle.account_id.as_ref()?;
        let value: u128 = p.price.parse().ok()?;
        let conf: u128 = p.conf.parse().ok()?;
        let published = u64::try_from(p.publish_time).ok()?;
        if value == 0
            || published > now()
            || now() - published > self.oracle.max_age_seconds
            || conf.checked_mul(10000)?
                > value.checked_mul(u128::from(self.oracle.max_confidence_bps))?
            || !(-18..=6).contains(&p.expo)
        {
            return None;
        }
        let shift = p.expo + 6;
        let price = if shift >= 0 {
            value.checked_mul(10u128.pow(shift as u32))?
        } else {
            value / 10u128.pow((-shift) as u32)
        };
        if !(10..=1_000_000_000_000).contains(&price) {
            return None;
        }
        Some((price, published))
    }
}

const BOUNDS_KEY: &[u8] = b"v3:bounds";
pub const BOUNDS_DELAY_SECONDS: u64 = 86_400;
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug)]
pub struct PriceBoundsProposal {
    pub min_price: U128,
    pub max_price: U128,
    pub execute_after: U64,
}
#[near]
impl Policy {
    pub fn get_price_bounds_proposal(&self) -> Option<PriceBoundsProposal> {
        read_extension(BOUNDS_KEY)
    }
    pub fn propose_price_bounds(&mut self, min_price: U128, max_price: U128) {
        self.assert_owner();
        require!(
            min_price.0 >= 10 && min_price.0 < max_price.0 && max_price.0 <= 1_000_000_000_000,
            "ERR_PRICE_BOUNDS"
        );
        let p = PriceBoundsProposal {
            min_price,
            max_price,
            execute_after: U64(now()
                .checked_add(BOUNDS_DELAY_SECONDS)
                .expect("ERR_OVERFLOW")),
        };
        write_extension(BOUNDS_KEY, &p);
        event("price_bounds_proposed", near_sdk::serde_json::json!(p));
    }
    pub fn cancel_price_bounds(&mut self) {
        self.assert_owner();
        env::storage_remove(BOUNDS_KEY);
        event("price_bounds_cancelled", near_sdk::serde_json::json!({}));
    }
    pub fn execute_price_bounds(&mut self) {
        self.assert_owner();
        let p = self
            .get_price_bounds_proposal()
            .expect("ERR_NO_BOUNDS_PROPOSAL");
        require!(now() >= p.execute_after.0, "ERR_BOUNDS_TIMELOCK");
        self.oracle.min_price = p.min_price;
        self.oracle.max_price = p.max_price;
        env::storage_remove(BOUNDS_KEY);
        event("price_bounds_executed", near_sdk::serde_json::json!(p));
    }
}
pub(crate) fn assert_exit_price(price: u128) {
    require!(
        (10..=1_000_000_000_000).contains(&price),
        "ERR_EXIT_PRICE_SANITY"
    );
}
// Versioned extension keys preserve the v2 Borsh layout; v3 is planned as a fresh account.
pub(crate) fn read_extension<T: near_sdk::borsh::BorshDeserialize>(key: &[u8]) -> Option<T> {
    env::storage_read(key).map(|bytes| T::try_from_slice(&bytes).expect("ERR_EXTENSION_STATE"))
}
pub(crate) fn write_extension<T: near_sdk::borsh::BorshSerialize>(key: &[u8], value: &T) {
    env::storage_write(
        key,
        &near_sdk::borsh::to_vec(value).expect("ERR_EXTENSION_STATE"),
    );
}
