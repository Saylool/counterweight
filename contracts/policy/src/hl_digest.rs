//! Replace this boundary with the golden-vector-verified Hyperliquid codec.
//! No endpoint accepts digest bytes. Default builds refuse to sign anything.
use crate::SigningPayload;

pub const PLACEHOLDER_NAME: &str = "TEST_ONLY_NOT_A_HYPERLIQUID_DIGEST";

pub fn digest(payload: &SigningPayload) -> Result<[u8; 32], &'static str> {
    // TODO: canonical MessagePack + action hash + testnet EIP-712 for orders,
    // and the separate Withdraw typed domain; match every relevant vector in
    // fixtures/hyperliquid-signing-vectors.json before removing this gate.
    #[cfg(feature = "day1-placeholder-digest")]
    {
        let mut bytes = PLACEHOLDER_NAME.as_bytes().to_vec();
        bytes.extend(near_sdk::serde_json::to_vec(payload).expect("typed payload serialization"));
        Ok(near_sdk::env::sha256_array(&bytes))
    }
    #[cfg(not(feature = "day1-placeholder-digest"))]
    {
        let _ = payload;
        Err("ERR_HL_DIGEST_NOT_IMPLEMENTED")
    }
}
