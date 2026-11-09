//! TEST ONLY. Returns fabricated public signature-shaped data, never cryptography.
use near_sdk::serde_json::{Value, json};
use near_sdk::{AccountId, Gas, NearToken, Promise, env, near};

#[near(contract_state)]
#[derive(Default)]
pub struct MockSigner {
    mode: u8,
}

#[near]
impl MockSigner {
    /// Minimal successful token receipt for policy-ledger tests; no real token.
    #[payable]
    pub fn ft_transfer(&mut self, receiver_id: String, amount: String, memo: String) -> Value {
        assert!(!receiver_id.is_empty() && !memo.is_empty());
        assert!(amount.parse::<u128>().unwrap() > 0);
        if self.mode == 3 {
            env::panic_str("MOCK_TOKEN_FAILURE");
        }
        if self.mode == 4 {
            return json!("x".repeat(2048));
        }
        json!(null)
    }
    #[payable]
    pub fn ft_transfer_call(
        &mut self,
        receiver_id: String,
        amount: String,
        msg: String,
        memo: String,
    ) -> String {
        assert!(!receiver_id.is_empty() && !memo.is_empty());
        let route: Value = near_sdk::serde_json::from_str(&msg).unwrap();
        assert_eq!(route["destination_chain"], "hyperliquid");
        assert!(route["recipient"].as_str().unwrap().starts_with("0x"));
        if self.mode == 3 {
            env::panic_str("MOCK_ROUTE_FAILURE");
        }
        if self.mode == 5 {
            return "0".into();
        }
        amount
    }
    pub fn deposit_to(
        &self,
        policy: AccountId,
        sender_id: AccountId,
        amount: String,
        msg: String,
    ) -> Promise {
        Promise::new(policy).function_call(
            "ft_on_transfer",
            near_sdk::serde_json::to_vec(
                &json!({"sender_id": sender_id, "amount": amount, "msg": msg}),
            )
            .unwrap(),
            NearToken::from_yoctonear(0),
            Gas::from_tgas(25),
        )
    }
    pub fn set_mode(&mut self, mode: u8) {
        self.mode = mode;
    }
    #[payable]
    pub fn sign(&mut self, request: Value) -> Value {
        assert!(request["payload_v2"]["Ecdsa"].as_str().unwrap().len() == 64);
        assert_eq!(request["domain_id"], 0);
        if self.mode == 1 {
            env::panic_str("MOCK_SIGNER_FAILURE");
        }
        if self.mode == 2 {
            return json!({"malformed": true});
        }
        json!({"big_r": {"affine_point": format!("02{}", "11".repeat(32))}, "s": {"scalar": "22".repeat(32)}, "recovery_id": 0})
    }
}
