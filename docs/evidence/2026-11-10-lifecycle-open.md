# Testnet lifecycle open — 2026-11-10T17:26:39.081Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a) · [Public explorer](https://testnet.nearblocks.io/txns/2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/tx/0x6b25c2b7cf4537026c9f042dd231c8010400da9d6a4855d40eee6e0a8e4910ed)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "open",
  "capturedAt": "2026-11-10T17:26:39.081Z",
  "network": "testnet",
  "outcome": "public-fill-and-position-verified",
  "commands": [
    "near contract call-function as-transaction policy-v2.counterweight-samet.testnet heartbeat json-args '{}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction policy-v2.counterweight-samet.testnet set_keeper_price json-args '{\"price\":\"3510100\",\"observed_at\":\"1794331599\"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction policy-v2.counterweight-samet.testnet request_order_signature json-args '{\"order\":{\"asset_index\":54,\"size\":\"3500000000000000000000000\",\"reduce_only\":false,\"reference_price\":null}}' prepaid-gas '300 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send"
  ],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277097919,
    "derivedBlockHeight": 277097919
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.5101",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:26:39.692Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": null,
  "preflight": {
    "block": "8LcQmWXk9BNL2upjNMTqHiMyTyecutvLoCgLn2azRgqA",
    "state": {
      "owner": "counterweight-samet.testnet",
      "keeper": "keeper.counterweight-samet.testnet",
      "coin": "NEAR",
      "signer_account": "v1.signer-prod.testnet",
      "wnear_account": "wrap.testnet",
      "near_recipient": "counterweight-samet.testnet",
      "derivation_path": "counterweight-1",
      "evm_recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
      "asset_index": 54,
      "size_decimals": 1,
      "limits": {
        "max_short_size": "5000000000000000000000000",
        "per_order_notional_cap": "20000000",
        "per_day_notional_cap": "40000000",
        "cooldown_seconds": 60,
        "price_band_bps": 100,
        "price_max_age_seconds": 60
      },
      "spot_balance": "4000000000000000000000000",
      "signed_short_size": "0",
      "paused": false,
      "pending": null,
      "signing_limits": {
        "keeper_per_block": 2,
        "keeper_per_window": 8,
        "keeper_outstanding": 8,
        "owner_per_window": 16,
        "window_ms": 60000,
        "max_nonce_ahead_ms": 1000
      },
      "mpc_fee": "1",
      "signer_gas_tgas": 230,
      "callback_gas_tgas": 30,
      "heartbeat_timeout_seconds": 3600,
      "keeper_weight_limit": "5000",
      "network": "Testnet",
      "oracle": {
        "account_id": null,
        "feed_id": "c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750",
        "max_age_seconds": 60,
        "max_confidence_bps": 100,
        "min_price": "2784560",
        "max_price": "4176840"
      },
      "oracle_price": "0",
      "oracle_timestamp": "0",
      "daily_usage": "0",
      "usage_day": 20767,
      "operation_id": "1",
      "last_keeper_heartbeat": "1794330578",
      "reference_price": "3480700",
      "reference_price_timestamp": "1794330578",
      "last_nonce": "1794331472735",
      "outstanding": [
        {
          "nonce": 1794331472735,
          "expires_after": 1794504272736,
          "keeper": false,
          "discarded": false,
          "invalidation_requested": false,
          "invalidation_signed": false,
          "invalidation_confirmed": false,
          "withdrawal": false
        }
      ],
      "pause_complete": true,
      "lifetime_opened": "0",
      "last_open_expiry": "0",
      "keeper_weight_used": "0"
    },
    "keys": {
      "block_hash": "8LcQmWXk9BNL2upjNMTqHiMyTyecutvLoCgLn2azRgqA",
      "block_height": 277097930,
      "keys": []
    },
    "account": {
      "amount": "7990836774916475399999999",
      "block_hash": "8LcQmWXk9BNL2upjNMTqHiMyTyecutvLoCgLn2azRgqA",
      "block_height": 277097930,
      "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 634356
    }
  },
  "before": {
    "observedAtMs": 1794331608675,
    "spotClearinghouseState": {
      "balances": [
        {
          "coin": "USDC",
          "token": 0,
          "total": "1.0",
          "hold": "0.0",
          "entryNtl": "0.0"
        }
      ]
    },
    "clearinghouseState": {
      "marginSummary": {
        "accountValue": "49.0",
        "totalNtlPos": "0.0",
        "totalRawUsd": "49.0",
        "totalMarginUsed": "0.0"
      },
      "crossMarginSummary": {
        "accountValue": "49.0",
        "totalNtlPos": "0.0",
        "totalRawUsd": "49.0",
        "totalMarginUsed": "0.0"
      },
      "crossMaintenanceMarginUsed": "0.0",
      "withdrawable": "49.0",
      "assetPositions": [],
      "time": 1794331608685
    },
    "userFills": [],
    "ledger": [
      {
        "time": 1794330483597,
        "hash": "0x44c06110b210b2c4463a042dd1e71301020078f64d13d196e8890c6371148cae",
        "delta": {
          "type": "send",
          "user": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
          "destination": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
          "sourceDex": "spot",
          "destinationDex": "spot",
          "token": "USDC",
          "amount": "50.0",
          "usdcValue": "50.0",
          "fee": "1.0",
          "nativeTokenFee": "0.0",
          "nonce": 1794330429670,
          "feeToken": "USDC"
        }
      },
      {
        "time": 1794331491898,
        "hash": "0x326745dbd188e26333e1042dd228a20106005dc16c8c0135d62ff12e908cbc4d",
        "delta": {
          "type": "accountClassTransfer",
          "usdc": "49.0",
          "toPerp": true
        }
      }
    ],
    "funding": [],
    "openOrders": [],
    "account": {
      "equityText": "49.0",
      "equity": 49,
      "marginUsed": 0,
      "withdrawable": 49,
      "signedSize": 0,
      "signedSizeText": "0",
      "funding": null,
      "otherPositions": []
    },
    "fills": []
  },
  "spot": {
    "contract": "4000000000000000000000000",
    "token": "4000000000000000000000000",
    "near": "4"
  },
  "risk": {
    "leverage": 0,
    "reserve": 0.1,
    "stressedMaintenance": 0,
    "headroom": 48.9
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "command": "near contract call-function as-transaction policy-v2.counterweight-samet.testnet request_order_signature json-args '{\"order\":{\"asset_index\":54,\"size\":\"3500000000000000000000000\",\"reduce_only\":false,\"reference_price\":null}}' prepaid-gas '300 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
  "expected": {
    "method": "request_order_signature",
    "args": {
      "order": {
        "asset_index": 54,
        "size": "3500000000000000000000000",
        "reduce_only": false,
        "reference_price": null
      }
    },
    "caller": "keeper.counterweight-samet.testnet",
    "policy": "policy-v2.counterweight-samet.testnet",
    "asset": 54,
    "reduceOnly": false,
    "size": "3.5",
    "price": "3.4749",
    "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
    "amount": "0"
  },
  "txHash": "2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd",
  "nearResponse": {
    "final_execution_status": "FINAL",
    "receipts_outcome": [
      {
        "block_hash": "4QZ1ViBKqY4K5yXGnDpyx38caUMqCsEGFqwN5o9LVnii",
        "id": "xpeA9pqSe9bzrF2k8FhJDB8kCKutwZBt3ZhsmTsRidU",
        "outcome": {
          "executor_id": "policy-v2.counterweight-samet.testnet",
          "gas_burnt": 3398029174816,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"2\",\"caller\":\"keeper.counterweight-samet.testnet\",\"kind\":\"Increase\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":54,\"b\":false,\"p\":\"3.4749\",\"s\":\"3.5\",\"r\":false,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794331622790,\"expiresAfter\":1794331682790},\"digest\":\"d60710250c7e0fc5f5c7bc5f45eb578d4c76a095c67cf520a5fc9e970b273116\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}"
          ],
          "metadata": {
            "contracts": [
              {
                "local": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M"
              }
            ],
            "gas_profile": [
              {
                "cost": "FUNCTION_CALL_BASE",
                "cost_category": "ACTION_COST",
                "gas_used": "400000000000"
              },
              {
                "cost": "FUNCTION_CALL_BYTE",
                "cost_category": "ACTION_COST",
                "gas_used": "7033372278"
              },
              {
                "cost": "NEW_ACTION_RECEIPT",
                "cost_category": "ACTION_COST",
                "gas_used": "289092464624"
              },
              {
                "cost": "BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "9266883885"
              },
              {
                "cost": "CONTRACT_LOADING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35445963"
              },
              {
                "cost": "CONTRACT_LOADING_BYTES",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "690134829495"
              },
              {
                "cost": "KECCAK256_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "52915421475"
              },
              {
                "cost": "KECCAK256_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "11766165540"
              },
              {
                "cost": "LOG_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3543313050"
              },
              {
                "cost": "LOG_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6427811217"
              },
              {
                "cost": "PROMISE_RETURN",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "560152386"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2280000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "57416990400"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "7914375306"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "32723147418"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "109896630"
              },
              {
                "cost": "STORAGE_READ_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "56356845749"
              },
              {
                "cost": "STORAGE_READ_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "154762665"
              },
              {
                "cost": "STORAGE_READ_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3647152600"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "20876249550"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "352414335"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "23698163796"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "54720000000"
              },
              {
                "cost": "UTF8_DECODING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "9335337183"
              },
              {
                "cost": "UTF8_DECODING_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "159202941534"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "454315167372"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "42056922915"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3124166484"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "40117314804"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6306794676"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "3rnMyPz7JHvLtVezwg184zd3MDoyPo5dfqy6oRqHhdjm",
            "3LqdnergN5chYBdNU37SN6hL1pqUbV6o7T6CqtMBrJbD",
            "CQ5jig8Sx6d6QsCuEANRpbdvsNMndSBPUao839WrBExe"
          ],
          "status": {
            "SuccessReceiptId": "3LqdnergN5chYBdNU37SN6hL1pqUbV6o7T6CqtMBrJbD"
          },
          "tokens_burnt": "339802917481600000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "DCWjPS4vHTYEfdgbhKrZUGEkcr9ZWwfjXL6T4Jn2dsYD"
          }
        ]
      },
      {
        "block_hash": "4M3YD3cdYVHkZoAHYa4ZyeQZkGU5MiH3Zcc77nyiqNKu",
        "id": "3rnMyPz7JHvLtVezwg184zd3MDoyPo5dfqy6oRqHhdjm",
        "outcome": {
          "executor_id": "v1.signer-prod.testnet",
          "gas_burnt": 4424807954185,
          "logs": [
            "sign: predecessor=AccountId(\"policy-v2.counterweight-samet.testnet\"), request=SignRequestArgs { path: \"counterweight-1\", payload: Ecdsa(BoundedVec { inner: [214, 7, 16, 37, 12, 126, 15, 197, 245, 199, 188, 95, 69, 235, 87, 141, 76, 118, 160, 149, 198, 124, 245, 32, 165, 252, 158, 151, 11, 39, 49, 22], witness: NonEmpty(()) }), domain_id: DomainId(0) }"
          ],
          "metadata": {
            "contracts": [
              {
                "local": "CpGX8ywXJwvWPgZFDDCTCuPJBHF7BATT51gSfc3APERJ"
              }
            ],
            "gas_profile": [
              {
                "cost": "FUNCTION_CALL_BASE",
                "cost_category": "ACTION_COST",
                "gas_used": "200000000000"
              },
              {
                "cost": "FUNCTION_CALL_BYTE",
                "cost_category": "ACTION_COST",
                "gas_used": "603702180"
              },
              {
                "cost": "NEW_ACTION_RECEIPT",
                "cost_category": "ACTION_COST",
                "gas_used": "181032964624"
              },
              {
                "cost": "BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5030594109"
              },
              {
                "cost": "CONTRACT_LOADING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35445963"
              },
              {
                "cost": "CONTRACT_LOADING_BYTES",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1228518883245"
              },
              {
                "cost": "LOG_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3543313050"
              },
              {
                "cost": "LOG_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4659173223"
              },
              {
                "cost": "PROMISE_RETURN",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "560152386"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "43320000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "23488768800"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "25632388419"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "10068660744"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "604086498"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5918"
              },
              {
                "cost": "STORAGE_READ_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "112713691498"
              },
              {
                "cost": "STORAGE_READ_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2569060239"
              },
              {
                "cost": "STORAGE_READ_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "33205921672"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "128393472000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "190070222826"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5850077961"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "184684381206"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "52440000000"
              },
              {
                "cost": "UTF8_DECODING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3111779061"
              },
              {
                "cost": "UTF8_DECODING_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "102927909087"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "745379911980"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "14018974305"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "16737578940"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "14327612430"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "45257619420"
              },
              {
                "cost": "YIELD_CREATE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "153411779276"
              },
              {
                "cost": "YIELD_CREATE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4223876760"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "7TXb2xyRLSjQYzFrpS2rVnpTS56NPKNSrBFYrZAWMsvZ",
            "2pmiscJUQ62BRxHmh6HjLU5E85tTheR1YW5Yw1iQTjZ5"
          ],
          "status": {
            "SuccessReceiptId": "7TXb2xyRLSjQYzFrpS2rVnpTS56NPKNSrBFYrZAWMsvZ"
          },
          "tokens_burnt": "442480795418500000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "Coc33gWhEUBzWGYqUYa57TQ751hjaJ2h7cZcsKFyAZLz"
          }
        ]
      },
      {
        "block_hash": "CJnYDv4VUMUJ3cHxdcYBtRkrRyAYF9Nm6A4pKFB3MJAc",
        "id": "7TXb2xyRLSjQYzFrpS2rVnpTS56NPKNSrBFYrZAWMsvZ",
        "outcome": {
          "executor_id": "v1.signer-prod.testnet",
          "gas_burnt": 3609150171678,
          "logs": [],
          "metadata": {
            "contracts": [
              {
                "local": "CpGX8ywXJwvWPgZFDDCTCuPJBHF7BATT51gSfc3APERJ"
              }
            ],
            "gas_profile": [
              {
                "cost": "NEW_DATA_RECEIPT_BYTE",
                "cost_category": "ACTION_COST",
                "gas_used": "13887685364"
              },
              {
                "cost": "BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4765825998"
              },
              {
                "cost": "CONTRACT_LOADING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35445963"
              },
              {
                "cost": "CONTRACT_LOADING_BYTES",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1228518883245"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "13680000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "10439452800"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "23347787286"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "12585825930"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "631092486"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5918"
              },
              {
                "cost": "STORAGE_READ_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "56356845749"
              },
              {
                "cost": "STORAGE_READ_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "154762665"
              },
              {
                "cost": "STORAGE_READ_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "33205921672"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "190070222826"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "352414335"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "183567713802"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "34200000000"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "753827970588"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "16822769166"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "17483892468"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "17193134916"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "45162580320"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "3zMYbijJKLsy4X9mrLduTeKA9TpCH1udMMBbMvTp5xKY"
          ],
          "status": {
            "SuccessValue": "eyJzY2hlbWUiOiJTZWNwMjU2azEiLCJiaWdfciI6eyJhZmZpbmVfcG9pbnQiOiIwMmJiODQxZDY1NjI4ZDI2MTllZTk4MWRmOTNlN2ZjN2FlMGY4YzNlODNkODA1N2E4YTU3ODE3NjcwZGEzMDUzNTIifSwicyI6eyJzY2FsYXIiOiI0MThmOWI4NWVlN2Q3MGI2YjE1NDFmNWViYTFjMjZiYmM2MzAzN2E2N2U0MGQxYzg1NWFjZWFlZjczOTM2NTNhIn0sInJlY292ZXJ5X2lkIjowfQ=="
          },
          "tokens_burnt": "360915017167800000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "7z8y5B4MrL4VbkzqGdiCxM7fMvMwbDbmLFN9Z8dkKBui"
          },
          {
            "direction": "Left",
            "hash": "8J5hwi6qBxgbbhyUGYCZAhtohqTQH7LAC9Fash3ejUv8"
          }
        ]
      },
      {
        "block_hash": "E5zoAiVvKnH1TQFMRkrLUYbgN8FFuqoJH8zMGNhmcNXw",
        "id": "3zMYbijJKLsy4X9mrLduTeKA9TpCH1udMMBbMvTp5xKY",
        "outcome": {
          "executor_id": "keeper.counterweight-samet.testnet",
          "gas_burnt": 223182562500,
          "logs": [],
          "metadata": {
            "contracts": [
              null
            ],
            "gas_profile": [],
            "version": 4
          },
          "receipt_ids": [],
          "status": {
            "SuccessValue": ""
          },
          "tokens_burnt": "0"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "3ZoesaJ3gPtKBesBXXDzLqrx9Cwb2R6gtz8styQYC2mY"
          }
        ]
      },
      {
        "block_hash": "ubS3gYFyEo3eY3WhTAFUG7Bvhc7sFsvyx2jPJurnV9k",
        "id": "2pmiscJUQ62BRxHmh6HjLU5E85tTheR1YW5Yw1iQTjZ5",
        "outcome": {
          "executor_id": "keeper.counterweight-samet.testnet",
          "gas_burnt": 223182562500,
          "logs": [],
          "metadata": {
            "contracts": [
              null
            ],
            "gas_profile": [],
            "version": 4
          },
          "receipt_ids": [],
          "status": {
            "SuccessValue": ""
          },
          "tokens_burnt": "0"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "J9yuYnEnKKj2urchuGgNNvYoZA5ZjZgt1w3rDHJRuZHK"
          }
        ]
      },
      {
        "block_hash": "E5zoAiVvKnH1TQFMRkrLUYbgN8FFuqoJH8zMGNhmcNXw",
        "id": "3LqdnergN5chYBdNU37SN6hL1pqUbV6o7T6CqtMBrJbD",
        "outcome": {
          "executor_id": "policy-v2.counterweight-samet.testnet",
          "gas_burnt": 2251541170062,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"2\",\"nonce\":\"1794331622790\",\"expiresAfter\":\"1794331682790\",\"signature\":{\"big_r\":{\"affine_point\":\"02bb841d65628d2619ee981df93e7fc7ae0f8c3e83d8057a8a57817670da305352\"},\"s\":{\"scalar\":\"418f9b85ee7d70b6b1541f5eba1c26bbc63037a67e40d1c855aceaef7393653a\"},\"scheme\":\"Secp256k1\",\"recovery_id\":0}}]}"
          ],
          "metadata": {
            "contracts": [
              {
                "local": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M"
              }
            ],
            "gas_profile": [
              {
                "cost": "BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6354434664"
              },
              {
                "cost": "CONTRACT_LOADING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35445963"
              },
              {
                "cost": "CONTRACT_LOADING_BYTES",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "690134829495"
              },
              {
                "cost": "LOG_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3543313050"
              },
              {
                "cost": "LOG_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5002341789"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "15960000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "13049316000"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4200472965"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "15102991116"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "126750732"
              },
              {
                "cost": "STORAGE_READ_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "56356845749"
              },
              {
                "cost": "STORAGE_READ_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "154762665"
              },
              {
                "cost": "STORAGE_READ_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4286807056"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "24537622548"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "352414335"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "22085199768"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "41040000000"
              },
              {
                "cost": "UTF8_DECODING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3111779061"
              },
              {
                "cost": "UTF8_DECODING_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "110509001541"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "233947377576"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "19626564027"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3546351144"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "20058657402"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6090105528"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "D7PQsHinmBobzjD4YMbHGTfc4tspdD38wR95Y64j9ngD"
          ],
          "status": {
            "SuccessValue": "dHJ1ZQ=="
          },
          "tokens_burnt": "225154117006200000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "9WUS6X5w6WhRE7LF3PuVQo78o6Bxju4v14gqiL2Ap3pr"
          }
        ]
      },
      {
        "block_hash": "HQ8AdV48MDx9risuFNaRU7Q3nhWbcpMdDwH9joYFvjvB",
        "id": "D7PQsHinmBobzjD4YMbHGTfc4tspdD38wR95Y64j9ngD",
        "outcome": {
          "executor_id": "keeper.counterweight-samet.testnet",
          "gas_burnt": 223182562500,
          "logs": [],
          "metadata": {
            "contracts": [
              null
            ],
            "gas_profile": [],
            "version": 4
          },
          "receipt_ids": [],
          "status": {
            "SuccessValue": ""
          },
          "tokens_burnt": "0"
        },
        "proof": []
      },
      {
        "block_hash": "4M3YD3cdYVHkZoAHYa4ZyeQZkGU5MiH3Zcc77nyiqNKu",
        "id": "CQ5jig8Sx6d6QsCuEANRpbdvsNMndSBPUao839WrBExe",
        "outcome": {
          "executor_id": "keeper.counterweight-samet.testnet",
          "gas_burnt": 223182562500,
          "logs": [],
          "metadata": {
            "contracts": [
              null
            ],
            "gas_profile": [],
            "version": 4
          },
          "receipt_ids": [],
          "status": {
            "SuccessValue": ""
          },
          "tokens_burnt": "0"
        },
        "proof": [
          {
            "direction": "Right",
            "hash": "7ndHQj4ZpFsZH6u3qkJHEQaZLN5a9e5HyMefR6mE16RR"
          }
        ]
      }
    ],
    "status": {
      "SuccessValue": "dHJ1ZQ=="
    },
    "transaction": {
      "actions": [
        {
          "FunctionCall": {
            "args": "eyJvcmRlciI6eyJhc3NldF9pbmRleCI6NTQsInJlZHVjZV9vbmx5IjpmYWxzZSwicmVmZXJlbmNlX3ByaWNlIjpudWxsLCJzaXplIjoiMzUwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCJ9fQ==",
            "deposit": "0",
            "gas": 300000000000000,
            "method_name": "request_order_signature"
          }
        }
      ],
      "hash": "2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd",
      "nonce": 277054186000005,
      "priority_fee": 0,
      "public_key": "ed25519:BnSnqej9ZUUmAuX3PHv6Gi3L3vbKt6onLrxNVqj6VjAJ",
      "receiver_id": "policy-v2.counterweight-samet.testnet",
      "signature": "ed25519:5KL1yFpM5LzrVddngTtZBtKM2dZTAvfvvqHfELB1FjPD5hy34efZmWcDvkHSGJXzrGnWA4fdgmahoAHZKaG7f8K2",
      "signer_id": "keeper.counterweight-samet.testnet"
    },
    "transaction_outcome": {
      "block_hash": "4RESPUNj7aFDBvNYxBgnUq1sYb17JuEFq66uqkBWBv43",
      "id": "2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd",
      "outcome": {
        "executor_id": "keeper.counterweight-samet.testnet",
        "gas_burnt": 314210699235,
        "logs": [],
        "metadata": {
          "gas_profile": null,
          "version": 1
        },
        "receipt_ids": [
          "xpeA9pqSe9bzrF2k8FhJDB8kCKutwZBt3ZhsmTsRidU"
        ],
        "status": {
          "SuccessReceiptId": "xpeA9pqSe9bzrF2k8FhJDB8kCKutwZBt3ZhsmTsRidU"
        },
        "tokens_burnt": "31421069923500000000"
      },
      "proof": [
        {
          "direction": "Right",
          "hash": "C82oEW5yKS3BLm5JZXVTRAi1PgQvjpZzbbB4qXiidhKG"
        }
      ]
    }
  },
  "parsed": {
    "input": {
      "scheme": "l1",
      "network": "testnet",
      "action": {
        "type": "order",
        "grouping": "na",
        "orders": [
          {
            "a": 54,
            "b": false,
            "r": false,
            "p": "3.4749",
            "s": "3.5",
            "t": {
              "limit": {
                "tif": "Ioc"
              }
            }
          }
        ]
      },
      "nonce": 1794331622790,
      "expiresAfter": 1794331682790
    },
    "digest": "0xd60710250c7e0fc5f5c7bc5f45eb578d4c76a095c67cf520a5fc9e970b273116",
    "signature": {
      "r": "0xbb841d65628d2619ee981df93e7fc7ae0f8c3e83d8057a8a57817670da305352",
      "s": "0x418f9b85ee7d70b6b1541f5eba1c26bbc63037a67e40d1c855aceaef7393653a",
      "v": 27
    },
    "blocks": [
      "4QZ1ViBKqY4K5yXGnDpyx38caUMqCsEGFqwN5o9LVnii",
      "E5zoAiVvKnH1TQFMRkrLUYbgN8FFuqoJH8zMGNhmcNXw"
    ],
    "nonce": 1794331622790
  },
  "checks": [
    {
      "block": "4QZ1ViBKqY4K5yXGnDpyx38caUMqCsEGFqwN5o9LVnii",
      "state": {
        "owner": "counterweight-samet.testnet",
        "keeper": "keeper.counterweight-samet.testnet",
        "coin": "NEAR",
        "signer_account": "v1.signer-prod.testnet",
        "wnear_account": "wrap.testnet",
        "near_recipient": "counterweight-samet.testnet",
        "derivation_path": "counterweight-1",
        "evm_recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
        "asset_index": 54,
        "size_decimals": 1,
        "limits": {
          "max_short_size": "5000000000000000000000000",
          "per_order_notional_cap": "20000000",
          "per_day_notional_cap": "40000000",
          "cooldown_seconds": 60,
          "price_band_bps": 100,
          "price_max_age_seconds": 60
        },
        "spot_balance": "4000000000000000000000000",
        "signed_short_size": "3500000000000000000000000",
        "paused": false,
        "pending": {
          "id": 2,
          "kind": "Increase",
          "amount": "3500000000000000000000000",
          "phase": "AwaitingCallback",
          "nonce": 1794331622790,
          "expires_after": 1794331682790,
          "keeper": true,
          "callback_deadline_ms": 1794331682790
        },
        "signing_limits": {
          "keeper_per_block": 2,
          "keeper_per_window": 8,
          "keeper_outstanding": 8,
          "owner_per_window": 16,
          "window_ms": 60000,
          "max_nonce_ahead_ms": 1000
        },
        "mpc_fee": "1",
        "signer_gas_tgas": 230,
        "callback_gas_tgas": 30,
        "heartbeat_timeout_seconds": 3600,
        "keeper_weight_limit": "5000",
        "network": "Testnet",
        "oracle": {
          "account_id": null,
          "feed_id": "c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750",
          "max_age_seconds": 60,
          "max_confidence_bps": 100,
          "min_price": "2784560",
          "max_price": "4176840"
        },
        "oracle_price": "0",
        "oracle_timestamp": "0",
        "daily_usage": "12408204",
        "usage_day": 20767,
        "operation_id": "2",
        "last_keeper_heartbeat": "1794331614",
        "reference_price": "3510100",
        "reference_price_timestamp": "1794331599",
        "last_nonce": "1794331622790",
        "outstanding": [
          {
            "nonce": 1794331472735,
            "expires_after": 1794504272736,
            "keeper": false,
            "discarded": false,
            "invalidation_requested": false,
            "invalidation_signed": false,
            "invalidation_confirmed": false,
            "withdrawal": false
          },
          {
            "nonce": 1794331622790,
            "expires_after": 1794331682790,
            "keeper": true,
            "discarded": false,
            "invalidation_requested": false,
            "invalidation_signed": false,
            "invalidation_confirmed": false,
            "withdrawal": false
          }
        ],
        "pause_complete": true,
        "lifetime_opened": "3500000000000000000000000",
        "last_open_expiry": "1794331682790",
        "keeper_weight_used": "5"
      },
      "keys": {
        "block_hash": "4QZ1ViBKqY4K5yXGnDpyx38caUMqCsEGFqwN5o9LVnii",
        "block_height": 277097959,
        "keys": []
      },
      "account": {
        "amount": "7990836774916475399999998",
        "block_hash": "4QZ1ViBKqY4K5yXGnDpyx38caUMqCsEGFqwN5o9LVnii",
        "block_height": 277097959,
        "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
        "locked": "0",
        "storage_paid_at": 0,
        "storage_usage": 634470
      }
    },
    {
      "block": "E5zoAiVvKnH1TQFMRkrLUYbgN8FFuqoJH8zMGNhmcNXw",
      "state": {
        "owner": "counterweight-samet.testnet",
        "keeper": "keeper.counterweight-samet.testnet",
        "coin": "NEAR",
        "signer_account": "v1.signer-prod.testnet",
        "wnear_account": "wrap.testnet",
        "near_recipient": "counterweight-samet.testnet",
        "derivation_path": "counterweight-1",
        "evm_recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
        "asset_index": 54,
        "size_decimals": 1,
        "limits": {
          "max_short_size": "5000000000000000000000000",
          "per_order_notional_cap": "20000000",
          "per_day_notional_cap": "40000000",
          "cooldown_seconds": 60,
          "price_band_bps": 100,
          "price_max_age_seconds": 60
        },
        "spot_balance": "4000000000000000000000000",
        "signed_short_size": "3500000000000000000000000",
        "paused": false,
        "pending": null,
        "signing_limits": {
          "keeper_per_block": 2,
          "keeper_per_window": 8,
          "keeper_outstanding": 8,
          "owner_per_window": 16,
          "window_ms": 60000,
          "max_nonce_ahead_ms": 1000
        },
        "mpc_fee": "1",
        "signer_gas_tgas": 230,
        "callback_gas_tgas": 30,
        "heartbeat_timeout_seconds": 3600,
        "keeper_weight_limit": "5000",
        "network": "Testnet",
        "oracle": {
          "account_id": null,
          "feed_id": "c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750",
          "max_age_seconds": 60,
          "max_confidence_bps": 100,
          "min_price": "2784560",
          "max_price": "4176840"
        },
        "oracle_price": "0",
        "oracle_timestamp": "0",
        "daily_usage": "12408204",
        "usage_day": 20767,
        "operation_id": "2",
        "last_keeper_heartbeat": "1794331614",
        "reference_price": "3510100",
        "reference_price_timestamp": "1794331599",
        "last_nonce": "1794331622790",
        "outstanding": [
          {
            "nonce": 1794331472735,
            "expires_after": 1794504272736,
            "keeper": false,
            "discarded": false,
            "invalidation_requested": false,
            "invalidation_signed": false,
            "invalidation_confirmed": false,
            "withdrawal": false
          },
          {
            "nonce": 1794331622790,
            "expires_after": 1794331682790,
            "keeper": true,
            "discarded": false,
            "invalidation_requested": false,
            "invalidation_signed": false,
            "invalidation_confirmed": false,
            "withdrawal": false
          }
        ],
        "pause_complete": true,
        "lifetime_opened": "3500000000000000000000000",
        "last_open_expiry": "1794331682790",
        "keeper_weight_used": "5"
      },
      "keys": {
        "block_hash": "E5zoAiVvKnH1TQFMRkrLUYbgN8FFuqoJH8zMGNhmcNXw",
        "block_height": 277097966,
        "keys": []
      },
      "account": {
        "amount": "7990836774916475399999998",
        "block_hash": "E5zoAiVvKnH1TQFMRkrLUYbgN8FFuqoJH8zMGNhmcNXw",
        "block_height": 277097966,
        "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
        "locked": "0",
        "storage_paid_at": 0,
        "storage_usage": 634418
      }
    }
  ],
  "recovered": "0x3e72c8963761c3F436710df9b891d8e3A74b5390",
  "request": {
    "action": {
      "type": "order",
      "orders": [
        {
          "a": 54,
          "b": false,
          "p": "3.4749",
          "s": "3.5",
          "r": false,
          "t": {
            "limit": {
              "tif": "Ioc"
            }
          }
        }
      ],
      "grouping": "na"
    },
    "nonce": 1794331622790,
    "signature": {
      "r": "0xbb841d65628d2619ee981df93e7fc7ae0f8c3e83d8057a8a57817670da305352",
      "s": "0x418f9b85ee7d70b6b1541f5eba1c26bbc63037a67e40d1c855aceaef7393653a",
      "v": 27
    },
    "expiresAfter": 1794331682790
  },
  "httpStatus": 200,
  "hyperliquidResponse": {
    "status": "ok",
    "response": {
      "type": "order",
      "data": {
        "statuses": [
          {
            "filled": {
              "totalSz": "3.5",
              "avgPx": "3.5121",
              "oid": 65016476566
            }
          }
        ]
      }
    }
  },
  "after": {
    "observedAtMs": 1794331639034,
    "spotClearinghouseState": {
      "balances": [
        {
          "coin": "USDC",
          "token": 0,
          "total": "1.0",
          "hold": "0.0",
          "entryNtl": "0.0"
        }
      ]
    },
    "clearinghouseState": {
      "marginSummary": {
        "accountValue": "48.992369",
        "totalNtlPos": "12.29445",
        "totalRawUsd": "61.286819",
        "totalMarginUsed": "0.614722"
      },
      "crossMarginSummary": {
        "accountValue": "48.992369",
        "totalNtlPos": "12.29445",
        "totalRawUsd": "61.286819",
        "totalMarginUsed": "0.614722"
      },
      "crossMaintenanceMarginUsed": "0.307361",
      "withdrawable": "47.762924",
      "assetPositions": [
        {
          "type": "oneWay",
          "position": {
            "coin": "NEAR",
            "szi": "-3.5",
            "leverage": {
              "type": "cross",
              "value": 20
            },
            "entryPx": "3.5121",
            "positionValue": "12.29445",
            "unrealizedPnl": "-0.0021",
            "returnOnEquity": "-0.0034167592",
            "liquidationPx": "17.0834338676",
            "marginUsed": "0.614722",
            "maxLeverage": 20,
            "cumFunding": {
              "allTime": "0.0",
              "sinceOpen": "0.0",
              "sinceChange": "0.0"
            }
          }
        }
      ],
      "time": 1794331638969
    },
    "userFills": [
      {
        "coin": "NEAR",
        "px": "3.5121",
        "sz": "3.5",
        "side": "A",
        "time": 1794331636657,
        "startPosition": "0.0",
        "dir": "Open Short",
        "closedPnl": "0.0",
        "hash": "0x6b25c2b7cf4537026c9f042dd231c8010400da9d6a4855d40eee6e0a8e4910ed",
        "oid": 65016476566,
        "crossed": true,
        "fee": "0.005531",
        "tid": 779931913856026,
        "feeToken": "USDC",
        "twapId": null
      }
    ],
    "ledger": [
      {
        "time": 1794330483597,
        "hash": "0x44c06110b210b2c4463a042dd1e71301020078f64d13d196e8890c6371148cae",
        "delta": {
          "type": "send",
          "user": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
          "destination": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
          "sourceDex": "spot",
          "destinationDex": "spot",
          "token": "USDC",
          "amount": "50.0",
          "usdcValue": "50.0",
          "fee": "1.0",
          "nativeTokenFee": "0.0",
          "nonce": 1794330429670,
          "feeToken": "USDC"
        }
      },
      {
        "time": 1794331491898,
        "hash": "0x326745dbd188e26333e1042dd228a20106005dc16c8c0135d62ff12e908cbc4d",
        "delta": {
          "type": "accountClassTransfer",
          "usdc": "49.0",
          "toPerp": true
        }
      }
    ],
    "funding": [],
    "openOrders": [],
    "account": {
      "equityText": "48.992369",
      "equity": 48.992369,
      "marginUsed": 0.614722,
      "withdrawable": 47.762924,
      "signedSize": -3.5,
      "signedSizeText": "-3.5",
      "funding": {
        "allTime": "0.0",
        "sinceOpen": "0.0",
        "sinceChange": "0.0"
      },
      "otherPositions": []
    },
    "fills": [
      {
        "coin": "NEAR",
        "oid": 65016476566,
        "time": 1794331636657,
        "hash": "0x6b25c2b7cf4537026c9f042dd231c8010400da9d6a4855d40eee6e0a8e4910ed",
        "side": "A",
        "sz": "3.5",
        "px": "3.5121",
        "fee": "0.005531",
        "closedPnl": "0.0"
      }
    ]
  },
  "verification": {
    "filled": {
      "totalSz": "3.5",
      "avgPx": "3.5121",
      "oid": 65016476566
    },
    "fills": [
      {
        "coin": "NEAR",
        "oid": 65016476566,
        "time": 1794331636657,
        "hash": "0x6b25c2b7cf4537026c9f042dd231c8010400da9d6a4855d40eee6e0a8e4910ed",
        "side": "A",
        "sz": "3.5",
        "px": "3.5121",
        "fee": "0.005531",
        "closedPnl": "0.0"
      }
    ],
    "fullFill": true,
    "flat": false
  }
}
```

