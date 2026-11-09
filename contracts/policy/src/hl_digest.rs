//! Hyperliquid SDK wire order, minimal unsigned MessagePack and EIP-712.
//! This module is a codec, never an arbitrary-payload contract entry point.
use crate::{HlAction, OrderType, SigningPayload};
use near_sdk::env::keccak256_array as keccak;

pub const IMPLEMENTATION: &str = "HYPERLIQUID_MSGPACK_EIP712_V1";
type Result<T> = std::result::Result<T, &'static str>;

pub fn digest(payload: &SigningPayload) -> Result<[u8; 32]> {
    if let HlAction::Withdraw {
        hyperliquid_chain,
        signature_chain_id,
        destination,
        amount,
        time,
    } = &payload.action
    {
        if hyperliquid_chain != "Testnet"
            || signature_chain_id != "0x66eee"
            || *time != payload.nonce
            || payload.expires_after.is_some()
        {
            return Err("ERR_WITHDRAW_DOMAIN");
        }
        withdraw_digest(destination, amount, *time, false)
    } else {
        l1_digest(
            &payload.action,
            payload.nonce,
            None,
            payload.expires_after,
            false,
        )
    }
}

fn word(n: u64) -> [u8; 32] {
    let mut w = [0; 32];
    w[24..].copy_from_slice(&n.to_be_bytes());
    w
}
fn hash_words(parts: &[[u8; 32]]) -> [u8; 32] {
    keccak(parts.concat())
}
fn domain(name: &str, chain_id: u64) -> [u8; 32] {
    hash_words(&[
        keccak(
            b"EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
        ),
        keccak(name.as_bytes()),
        keccak(b"1"),
        word(chain_id),
        [0; 32],
    ])
}
fn typed(domain: [u8; 32], message: [u8; 32]) -> [u8; 32] {
    keccak([&[0x19, 0x01][..], &domain, &message].concat())
}
pub fn l1_digest(
    action: &HlAction,
    nonce: u64,
    vault: Option<&str>,
    expiry: Option<u64>,
    mainnet: bool,
) -> Result<[u8; 32]> {
    let connection = action_hash(action, nonce, vault, expiry)?;
    Ok(typed(
        domain("Exchange", 1337),
        hash_words(&[
            keccak(b"Agent(string source,bytes32 connectionId)"),
            keccak(if mainnet { b"a" } else { b"b" }),
            connection,
        ]),
    ))
}
pub fn withdraw_digest(
    destination: &str,
    amount: &str,
    time: u64,
    mainnet: bool,
) -> Result<[u8; 32]> {
    safe_integer(time)?;
    address(destination)?;
    decimal(amount, true)?;
    Ok(typed(domain("HyperliquidSignTransaction", 421614), hash_words(&[
        keccak(b"HyperliquidTransaction:Withdraw(string hyperliquidChain,string destination,string amount,uint64 time)"),
        keccak(if mainnet { b"Mainnet" } else { b"Testnet" }),
        keccak(destination.as_bytes()), keccak(amount.as_bytes()), word(time),
    ])))
}
pub fn action_hash(
    action: &HlAction,
    nonce: u64,
    vault: Option<&str>,
    expiry: Option<u64>,
) -> Result<[u8; 32]> {
    safe_integer(nonce)?;
    if let Some(expiry) = expiry {
        safe_integer(expiry)?;
    }
    let mut bytes = canonical_msgpack(action)?;
    bytes.extend(nonce.to_be_bytes());
    match vault {
        None => bytes.push(0),
        Some(v) => {
            bytes.push(1);
            bytes.extend(address(v)?);
        }
    }
    if let Some(expiry) = expiry {
        bytes.push(0);
        bytes.extend(expiry.to_be_bytes());
    }
    Ok(keccak(&bytes))
}
fn safe_integer(value: u64) -> Result<()> {
    if value > 9_007_199_254_740_991 {
        return Err("ERR_UNSAFE_INTEGER");
    }
    Ok(())
}
fn address(value: &str) -> Result<Vec<u8>> {
    hex_bytes(value, 20)
}
fn hex_bytes(value: &str, len: usize) -> Result<Vec<u8>> {
    if value.len() != 2 + 2 * len
        || !value.starts_with("0x")
        || !value[2..]
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        return Err("ERR_HEX");
    }
    (2..value.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&value[i..i + 2], 16).map_err(|_| "ERR_HEX"))
        .collect()
}
/// Reject noncanonical wire decimals rather than silently hashing a different action.
fn decimal(value: &str, positive: bool) -> Result<()> {
    let (whole, frac) = value
        .split_once('.')
        .map_or((value, None), |(w, f)| (w, Some(f)));
    if whole.is_empty()
        || !whole.bytes().all(|b| b.is_ascii_digit())
        || (whole.len() > 1 && whole.starts_with('0'))
        || frac.is_some_and(|f| {
            f.is_empty()
                || f.len() > 8
                || f.ends_with('0')
                || !f.bytes().all(|b| b.is_ascii_digit())
        })
        || (positive && value == "0")
    {
        return Err("ERR_DECIMAL");
    }
    Ok(())
}

struct Mp(Vec<u8>);
impl Mp {
    fn map(&mut self, n: u8) {
        self.0.push(0x80 | n);
    }
    fn array(&mut self, n: usize) -> Result<()> {
        if n <= 15 {
            self.0.push(0x90 | n as u8);
        } else if let Ok(n) = u16::try_from(n) {
            self.0.push(0xdc);
            self.0.extend(n.to_be_bytes());
        } else {
            return Err("ERR_ARRAY_LENGTH");
        }
        Ok(())
    }
    fn str(&mut self, s: &str) -> Result<()> {
        let n = s.len();
        if n <= 31 {
            self.0.push(0xa0 | n as u8);
        } else if let Ok(n) = u8::try_from(n) {
            self.0.extend([0xd9, n]);
        } else if let Ok(n) = u16::try_from(n) {
            self.0.push(0xda);
            self.0.extend(n.to_be_bytes());
        } else {
            return Err("ERR_STRING_LENGTH");
        }
        self.0.extend(s.as_bytes());
        Ok(())
    }
    fn uint(&mut self, n: u64) -> Result<()> {
        // Match JS SDK safe integers; importantly, uint64 instead of float64 above u32.
        safe_integer(n)?;
        if n < 128 {
            self.0.push(n as u8);
        } else if let Ok(n) = u8::try_from(n) {
            self.0.extend([0xcc, n]);
        } else if let Ok(n) = u16::try_from(n) {
            self.0.push(0xcd);
            self.0.extend(n.to_be_bytes());
        } else if let Ok(n) = u32::try_from(n) {
            self.0.push(0xce);
            self.0.extend(n.to_be_bytes());
        } else {
            self.0.push(0xcf);
            self.0.extend(n.to_be_bytes());
        }
        Ok(())
    }
    fn bool(&mut self, b: bool) {
        self.0.push(if b { 0xc3 } else { 0xc2 });
    }
}
pub fn canonical_msgpack(action: &HlAction) -> Result<Vec<u8>> {
    let mut m = Mp(Vec::new());
    match action {
        HlAction::Order { orders, grouping } => {
            if orders.is_empty()
                || !["na", "normalTpsl", "positionTpsl"].contains(&grouping.as_str())
            {
                return Err("ERR_ORDER");
            }
            m.map(3);
            m.str("type")?;
            m.str("order")?;
            m.str("orders")?;
            m.array(orders.len())?;
            for o in orders {
                decimal(&o.p, false)?;
                decimal(&o.s, true)?;
                m.map(if o.c.is_some() { 7 } else { 6 });
                m.str("a")?;
                m.uint(o.a)?;
                m.str("b")?;
                m.bool(o.b);
                m.str("p")?;
                m.str(&o.p)?;
                m.str("s")?;
                m.str(&o.s)?;
                m.str("r")?;
                m.bool(o.r);
                m.str("t")?;
                m.map(1);
                match &o.t {
                    OrderType::Limit { limit } => {
                        if !["Alo", "Ioc", "Gtc"].contains(&limit.tif.as_str()) {
                            return Err("ERR_TIF");
                        }
                        m.str("limit")?;
                        m.map(1);
                        m.str("tif")?;
                        m.str(&limit.tif)?;
                    }
                    OrderType::Trigger { trigger } => {
                        decimal(&trigger.trigger_px, false)?;
                        if !["tp", "sl"].contains(&trigger.tpsl.as_str()) {
                            return Err("ERR_TPSL");
                        }
                        m.str("trigger")?;
                        m.map(3);
                        m.str("isMarket")?;
                        m.bool(trigger.is_market);
                        m.str("triggerPx")?;
                        m.str(&trigger.trigger_px)?;
                        m.str("tpsl")?;
                        m.str(&trigger.tpsl)?;
                    }
                }
                if let Some(c) = &o.c {
                    hex_bytes(c, 16)?;
                    m.str("c")?;
                    m.str(c)?;
                }
            }
            m.str("grouping")?;
            m.str(grouping)?;
        }
        HlAction::Cancel { cancels } => {
            if cancels.is_empty() {
                return Err("ERR_CANCEL");
            }
            m.map(2);
            m.str("type")?;
            m.str("cancel")?;
            m.str("cancels")?;
            m.array(cancels.len())?;
            for c in cancels {
                m.map(2);
                m.str("a")?;
                m.uint(c.a)?;
                m.str("o")?;
                m.uint(c.o)?;
            }
        }
        HlAction::CancelByCloid { cancels } => {
            if cancels.is_empty() {
                return Err("ERR_CANCEL");
            }
            m.map(2);
            m.str("type")?;
            m.str("cancelByCloid")?;
            m.str("cancels")?;
            m.array(cancels.len())?;
            for c in cancels {
                hex_bytes(&c.cloid, 16)?;
                m.map(2);
                m.str("asset")?;
                m.uint(c.asset)?;
                m.str("cloid")?;
                m.str(&c.cloid)?;
            }
        }
        HlAction::Noop => {
            m.map(1);
            m.str("type")?;
            m.str("noop")?;
        }
        HlAction::Withdraw { .. } => return Err("ERR_NOT_L1"),
    }
    Ok(m.0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::{
        serde_json::{self, Value},
        test_utils::VMContextBuilder,
        testing_env,
    };
    #[test]
    fn golden_vectors_all_supported_types() {
        testing_env!(VMContextBuilder::new().build());
        let fixtures: Value =
            serde_json::from_str(include_str!("../fixtures/hyperliquid-signing-vectors.json"))
                .unwrap();
        let mut checked = 0;
        for v in fixtures["vectors"].as_array().unwrap() {
            let mainnet = v["network"] == "mainnet";
            let action = &v["action"];
            let digest = if v["scheme"] == "l1" {
                let action: HlAction = serde_json::from_value(action.clone()).unwrap();
                let nonce = v["nonce"].as_u64().unwrap();
                let vault = v["vaultAddress"].as_str();
                let expiry = v["expiresAfter"].as_u64();
                assert_eq!(
                    format!(
                        "0x{}",
                        crate::hex(&action_hash(&action, nonce, vault, expiry).unwrap())
                    ),
                    v["actionHash"],
                    "{} action hash",
                    v["name"]
                );
                l1_digest(&action, nonce, vault, expiry, mainnet).unwrap()
            } else if action["type"] == "withdraw3" {
                withdraw_digest(
                    action["destination"].as_str().unwrap(),
                    action["amount"].as_str().unwrap(),
                    action["time"].as_u64().unwrap(),
                    mainnet,
                )
                .unwrap()
            } else {
                continue;
            };
            assert_eq!(
                format!("0x{}", crate::hex(&digest)),
                v["digest"],
                "{}",
                v["name"]
            );
            checked += 1;
        }
        assert_eq!(
            checked, 22,
            "all order/trigger/cancel/cloid/vault/expiry/boundary/withdraw vectors"
        );
    }
    #[test]
    fn canonical_decimal_validation() {
        for s in ["01", "1.0", "1.", "-1", "1e2", ".1", "0.000000001", "NaN"] {
            assert!(decimal(s, false).is_err(), "{s}");
        }
        for s in ["0", "1", "0.00000001", "1234.5"] {
            assert!(decimal(s, false).is_ok());
        }
        assert!(decimal("0", true).is_err());
    }
    #[test]
    fn noop_msgpack_exact_and_expiry_bound() {
        testing_env!(VMContextBuilder::new().build());
        assert_eq!(
            crate::hex(&canonical_msgpack(&HlAction::Noop).unwrap()),
            "81a474797065a46e6f6f70"
        );
        assert_ne!(
            l1_digest(&HlAction::Noop, 1, None, Some(60_001), false).unwrap(),
            l1_digest(&HlAction::Noop, 1, None, None, false).unwrap()
        );
    }
    #[test]
    fn unsafe_integer_and_noncanonical_inputs_fail_closed() {
        testing_env!(VMContextBuilder::new().build());
        let unsafe_int = 9_007_199_254_740_992;
        assert!(action_hash(&HlAction::Noop, unsafe_int, None, None).is_err());
        assert!(action_hash(&HlAction::Noop, 1, None, Some(unsafe_int)).is_err());
        assert!(
            withdraw_digest(
                "0x1111111111111111111111111111111111111111",
                "1",
                unsafe_int,
                false
            )
            .is_err()
        );
        assert!(
            withdraw_digest(
                "0x1111111111111111111111111111111111111111",
                "1.0",
                1,
                false
            )
            .is_err()
        );
        assert!(action_hash(&HlAction::Noop, 1, Some("0xINVALID"), None).is_err());
        assert!(
            canonical_msgpack(&HlAction::Cancel {
                cancels: vec![crate::Cancel {
                    a: 1,
                    o: unsafe_int
                }]
            })
            .is_err()
        );
    }
}
