//! TEST ONLY. Returns fabricated public signature-shaped data, never cryptography.
use near_sdk::serde_json::{Value, json};
use near_sdk::{env, near};

#[near(contract_state)]
#[derive(Default)]
pub struct MockSigner {
    mode: u8,
}

#[near]
impl MockSigner {
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
