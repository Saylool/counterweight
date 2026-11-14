# Testnet lifecycle close — 2026-11-10T17:27:45.305Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a) · [Public explorer](https://testnet.nearblocks.io/txns/65WWr7W1DSvDKLGjF8tVZJtzYzwL6NX8DGfh7QZeL8JW) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/tx/0xabadf684c164a663ad27042dd235b90101000e6a5c67c5354f76a1d78068804e)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "close",
  "capturedAt": "2026-11-10T17:27:45.305Z",
  "network": "testnet",
  "outcome": "public-fill-and-position-verified",
  "commands": [
    "near contract call-function as-transaction policy-v2.counterweight-samet.testnet heartbeat json-args '{}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction policy-v2.counterweight-samet.testnet set_keeper_price json-args '{\"price\":\"3512950\",\"observed_at\":\"1794331665\"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction policy-v2.counterweight-samet.testnet request_order_signature json-args '{\"order\":{\"asset_index\":54,\"size\":\"3500000000000000000000000\",\"reduce_only\":true,\"reference_price\":\"3512950\"}}' prepaid-gas '300 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send"
  ],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277098030,
    "derivedBlockHeight": 277098030
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.51295",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:27:45.671Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": null,
  "preflight": {
    "block": "7aZcG5JkyARyJQhMxzTHYgVHoMc3QPsTrs5Apy5ZggPa",
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
      "block_hash": "7aZcG5JkyARyJQhMxzTHYgVHoMc3QPsTrs5Apy5ZggPa",
      "block_height": 277098041,
      "keys": []
    },
    "account": {
      "amount": "7990836774916475399999998",
      "block_hash": "7aZcG5JkyARyJQhMxzTHYgVHoMc3QPsTrs5Apy5ZggPa",
      "block_height": 277098041,
      "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 634418
    }
  },
  "before": {
    "observedAtMs": 1794331674744,
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
        "accountValue": "48.987819",
        "totalNtlPos": "12.299",
        "totalRawUsd": "61.286819",
        "totalMarginUsed": "0.61495"
      },
      "crossMarginSummary": {
        "accountValue": "48.987819",
        "totalNtlPos": "12.299",
        "totalRawUsd": "61.286819",
        "totalMarginUsed": "0.61495"
      },
      "crossMaintenanceMarginUsed": "0.307475",
      "withdrawable": "47.757919",
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
            "positionValue": "12.299",
            "unrealizedPnl": "-0.00665",
            "returnOnEquity": "-0.0108197375",
            "liquidationPx": "17.0834338676",
            "marginUsed": "0.61495",
            "maxLeverage": 20,
            "cumFunding": {
              "allTime": "0.0",
              "sinceOpen": "0.0",
              "sinceChange": "0.0"
            }
          }
        }
      ],
      "time": 1794331674777
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
      "equityText": "48.987819",
      "equity": 48.987819,
      "marginUsed": 0.61495,
      "withdrawable": 47.757919,
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
  "spot": {
    "contract": "4000000000000000000000000",
    "token": "4000000000000000000000000",
    "near": "4"
  },
  "risk": {
    "leverage": 0.25098739341712684,
    "reserve": 0.1,
    "stressedMaintenance": 0.922149375,
    "headroom": 36.469539
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "command": "near contract call-function as-transaction policy-v2.counterweight-samet.testnet request_order_signature json-args '{\"order\":{\"asset_index\":54,\"size\":\"3500000000000000000000000\",\"reduce_only\":true,\"reference_price\":\"3512950\"}}' prepaid-gas '300 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
  "expected": {
    "method": "request_order_signature",
    "args": {
      "order": {
        "asset_index": 54,
        "size": "3500000000000000000000000",
        "reduce_only": true,
        "reference_price": "3512950"
      }
    },
    "caller": "keeper.counterweight-samet.testnet",
    "policy": "policy-v2.counterweight-samet.testnet",
    "asset": 54,
    "reduceOnly": true,
    "size": "3.5",
    "price": "3.5481",
    "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
    "amount": "0"
  },
  "txHash": "65WWr7W1DSvDKLGjF8tVZJtzYzwL6NX8DGfh7QZeL8JW",
  "nearResponse": {
    "final_execution_status": "FINAL",
    "receipts_outcome": [
      {
        "block_hash": "6BskFUmCXQydDDnCdtMi8LzyjtAGZMcgECaJBrQrrx5W",
        "id": "8faAm1LL9p84CQEs5GNHe9Ru4Xo1Li3ziDVKb2TRNrQ1",
        "outcome": {
          "executor_id": "policy-v2.counterweight-samet.testnet",
          "gas_burnt": 3401475750618,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"3\",\"caller\":\"keeper.counterweight-samet.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":54,\"b\":true,\"p\":\"3.5481\",\"s\":\"3.5\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794331685244,\"expiresAfter\":1794331745244},\"digest\":\"0f645f62690b31fcd7451a8d7e8a30de0b1fb5bf99c108b055638c71bb6cf74c\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}"
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
                "gas_used": "6375016053"
              },
              {
                "cost": "PROMISE_RETURN",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "560152386"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "9120000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "57416990400"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "7899169974"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "32723147418"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "116401722"
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
                "gas_used": "3995034848"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "22867522584"
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
                "gas_used": "47880000000"
              },
              {
                "cost": "UTF8_DECODING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "9335337183"
              },
              {
                "cost": "UTF8_DECODING_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "158036619618"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "455990298588"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "42056922915"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3303935436"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "40117314804"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6778188612"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "5eFXKxwAKHoXyWe5yuPYH9NaAmo7APoAgE892RBndKFc",
            "4xhYMbE2QwLfR14QMpBdeYweMnS5vdjSJeTrr5ctTchu",
            "EwGKZL7uBCjDB7rPB5HBx6PopbdNB9KfAxWQRt77bEJW"
          ],
          "status": {
            "SuccessReceiptId": "4xhYMbE2QwLfR14QMpBdeYweMnS5vdjSJeTrr5ctTchu"
          },
          "tokens_burnt": "340147575061800000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "E6jyyLBUT4nY8RRZj9iKvmTAXZ6igSBkCDXErDyfb4ns"
          },
          {
            "direction": "Right",
            "hash": "CLqFpmPyg6m8MK33MV59wJFqUuQhGxeCZokc3aTzUtGc"
          }
        ]
      },
      {
        "block_hash": "HfMQA6T6sqM4sLGmmuHR1nHwgJ2u3CqVfUytf1DYNpgq",
        "id": "5eFXKxwAKHoXyWe5yuPYH9NaAmo7APoAgE892RBndKFc",
        "outcome": {
          "executor_id": "v1.signer-prod.testnet",
          "gas_burnt": 4376914790089,
          "logs": [
            "sign: predecessor=AccountId(\"policy-v2.counterweight-samet.testnet\"), request=SignRequestArgs { path: \"counterweight-1\", payload: Ecdsa(BoundedVec { inner: [15, 100, 95, 98, 105, 11, 49, 252, 215, 69, 26, 141, 126, 138, 48, 222, 11, 31, 181, 191, 153, 193, 8, 176, 85, 99, 140, 113, 187, 108, 247, 76], witness: NonEmpty(()) }), domain_id: DomainId(0) }"
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
                "gas_used": "45600000000"
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
                "gas_used": "2280000000"
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
                "gas_used": "745366747884"
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
            "7uYCyWzyj1ZpqCvGDp7ZGB4MAkajGwtHmJUjGrytCvuj",
            "9WHW8r2V8G7qZxAsZbtHfpSWLczM3mAHg1xLdpVTk9vM"
          ],
          "status": {
            "SuccessReceiptId": "7uYCyWzyj1ZpqCvGDp7ZGB4MAkajGwtHmJUjGrytCvuj"
          },
          "tokens_burnt": "437691479008900000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "C8eP4o2nPFS79VcrBavek9SAP9f5wxUCYsm65UvtRDVr"
          },
          {
            "direction": "Left",
            "hash": "7ZV9eYAjM1eyf2aT8thbixnXi2oBnXeV3LsnsvofFSLm"
          },
          {
            "direction": "Right",
            "hash": "hoyUfff37w2ZZk8wyUTbEzu9xj4YwBsVd7YwhoRyqfa"
          }
        ]
      },
      {
        "block_hash": "6uvNhtB33F6xk6jXwNngGgkELQx8jAJFiYURakZFeuQv",
        "id": "7uYCyWzyj1ZpqCvGDp7ZGB4MAkajGwtHmJUjGrytCvuj",
        "outcome": {
          "executor_id": "v1.signer-prod.testnet",
          "gas_burnt": 3561289917822,
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
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "753847716732"
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
            "8WFgjUvtikFzkkgzKJjLoqViyniLFyegh91umeA6xn6C"
          ],
          "status": {
            "SuccessValue": "eyJzY2hlbWUiOiJTZWNwMjU2azEiLCJiaWdfciI6eyJhZmZpbmVfcG9pbnQiOiIwMzg0NzZhYmEyOTQ2MGE5YjNjYzJmOTRiMDE2YTgyNjQxYTFjMmJlYzE4NzY2MTNmNTI5Njk2NDMwNDg1ZDM3NDYifSwicyI6eyJzY2FsYXIiOiIxMDdhMzdmZjVlZjZhOWRlZDhjMmI2OTRmMGNiMDQ2ZWM0NTdlYmM5YzY5NTE1YjBlNjhjMmM1OTViNzcwODAxIn0sInJlY292ZXJ5X2lkIjowfQ=="
          },
          "tokens_burnt": "356128991782200000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "2MUDckdDxoSjC5kKYUxddDBU87ChaXaKjcSRiiQpUrhd"
          }
        ]
      },
      {
        "block_hash": "E1XCX2Qg1tHpPJuHf7PnYKiuJ8vw7vq1ejEJs4XDU3vy",
        "id": "8WFgjUvtikFzkkgzKJjLoqViyniLFyegh91umeA6xn6C",
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
        "block_hash": "6pCjThVvRkSvePhQVvo7yjcBvygFEaCNx4MLAgZiDntQ",
        "id": "9WHW8r2V8G7qZxAsZbtHfpSWLczM3mAHg1xLdpVTk9vM",
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
        "block_hash": "E1XCX2Qg1tHpPJuHf7PnYKiuJ8vw7vq1ejEJs4XDU3vy",
        "id": "4xhYMbE2QwLfR14QMpBdeYweMnS5vdjSJeTrr5ctTchu",
        "outcome": {
          "executor_id": "policy-v2.counterweight-samet.testnet",
          "gas_burnt": 2251582307862,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"3\",\"nonce\":\"1794331685244\",\"expiresAfter\":\"1794331745244\",\"signature\":{\"big_r\":{\"affine_point\":\"038476aba29460a9b3cc2f94b016a82641a1c2bec1876613f529696430485d3746\"},\"s\":{\"scalar\":\"107a37ff5ef6a9ded8c2b694f0cb046ec457ebc9c69515b0e68c2c595b770801\"},\"scheme\":\"Secp256k1\",\"recovery_id\":0}}]}"
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
                "gas_used": "2280000000"
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
                "gas_used": "54720000000"
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
                "gas_used": "233988515376"
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
            "D27XpSeJL9Pry9rm9y1AJHDk9dnpYsXP2UWcM8hpEVvz"
          ],
          "status": {
            "SuccessValue": "dHJ1ZQ=="
          },
          "tokens_burnt": "225158230786200000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "mXKcd8XeyVptSMYxLZ3d6P5k6H8zrdiMsAy3F4H715b"
          }
        ]
      },
      {
        "block_hash": "9isH8ATKLJvSjA19uZUdJruPUo4xx4SY1ACi7BiitQWx",
        "id": "D27XpSeJL9Pry9rm9y1AJHDk9dnpYsXP2UWcM8hpEVvz",
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
            "hash": "FRdPruFpkMRzU3xdK3jAeHWNF1PLDFG1mt6HEZcK1J6J"
          }
        ]
      },
      {
        "block_hash": "HfMQA6T6sqM4sLGmmuHR1nHwgJ2u3CqVfUytf1DYNpgq",
        "id": "EwGKZL7uBCjDB7rPB5HBx6PopbdNB9KfAxWQRt77bEJW",
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
      }
    ],
    "status": {
      "SuccessValue": "dHJ1ZQ=="
    },
    "transaction": {
      "actions": [
        {
          "FunctionCall": {
            "args": "eyJvcmRlciI6eyJhc3NldF9pbmRleCI6NTQsInJlZHVjZV9vbmx5Ijp0cnVlLCJyZWZlcmVuY2VfcHJpY2UiOiIzNTEyOTUwIiwic2l6ZSI6IjM1MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAifX0=",
            "deposit": "0",
            "gas": 300000000000000,
            "method_name": "request_order_signature"
          }
        }
      ],
      "hash": "65WWr7W1DSvDKLGjF8tVZJtzYzwL6NX8DGfh7QZeL8JW",
      "nonce": 277054186000007,
      "priority_fee": 0,
      "public_key": "ed25519:BnSnqej9ZUUmAuX3PHv6Gi3L3vbKt6onLrxNVqj6VjAJ",
      "receiver_id": "policy-v2.counterweight-samet.testnet",
      "signature": "ed25519:cQCNHTSmpVjHWQDRh6rv9Tbn8G7ANdd3Z8Kwfeu1YV6K3VNowwbGPCgiZgEq34YA1SVQGKsJSWDrQ7JawhNTktL",
      "signer_id": "keeper.counterweight-samet.testnet"
    },
    "transaction_outcome": {
      "block_hash": "Bcyv2ZQstcB45paNQT5FurQeDJE38q1KSp6PCr4Zid54",
      "id": "65WWr7W1DSvDKLGjF8tVZJtzYzwL6NX8DGfh7QZeL8JW",
      "outcome": {
        "executor_id": "keeper.counterweight-samet.testnet",
        "gas_burnt": 314401434095,
        "logs": [],
        "metadata": {
          "gas_profile": null,
          "version": 1
        },
        "receipt_ids": [
          "8faAm1LL9p84CQEs5GNHe9Ru4Xo1Li3ziDVKb2TRNrQ1"
        ],
        "status": {
          "SuccessReceiptId": "8faAm1LL9p84CQEs5GNHe9Ru4Xo1Li3ziDVKb2TRNrQ1"
        },
        "tokens_burnt": "31440143409500000000"
      },
      "proof": []
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
            "b": true,
            "r": true,
            "p": "3.5481",
            "s": "3.5",
            "t": {
              "limit": {
                "tif": "Ioc"
              }
            }
          }
        ]
      },
      "nonce": 1794331685244,
      "expiresAfter": 1794331745244
    },
    "digest": "0x0f645f62690b31fcd7451a8d7e8a30de0b1fb5bf99c108b055638c71bb6cf74c",
    "signature": {
      "r": "0x8476aba29460a9b3cc2f94b016a82641a1c2bec1876613f529696430485d3746",
      "s": "0x107a37ff5ef6a9ded8c2b694f0cb046ec457ebc9c69515b0e68c2c595b770801",
      "v": 27
    },
    "blocks": [
      "6BskFUmCXQydDDnCdtMi8LzyjtAGZMcgECaJBrQrrx5W",
      "E1XCX2Qg1tHpPJuHf7PnYKiuJ8vw7vq1ejEJs4XDU3vy"
    ],
    "nonce": 1794331685244
  },
  "checks": [
    {
      "block": "6BskFUmCXQydDDnCdtMi8LzyjtAGZMcgECaJBrQrrx5W",
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
          "id": 3,
          "kind": "Reduce",
          "amount": "3500000000000000000000000",
          "phase": "AwaitingCallback",
          "nonce": 1794331685244,
          "expires_after": 1794331745244,
          "keeper": true,
          "callback_deadline_ms": 1794331745244
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
        "operation_id": "3",
        "last_keeper_heartbeat": "1794331679",
        "reference_price": "3510100",
        "reference_price_timestamp": "1794331599",
        "last_nonce": "1794331685244",
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
            "nonce": 1794331685244,
            "expires_after": 1794331745244,
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
        "keeper_weight_used": "10"
      },
      "keys": {
        "block_hash": "6BskFUmCXQydDDnCdtMi8LzyjtAGZMcgECaJBrQrrx5W",
        "block_height": 277098062,
        "keys": []
      },
      "account": {
        "amount": "7990836774916475399999997",
        "block_hash": "6BskFUmCXQydDDnCdtMi8LzyjtAGZMcgECaJBrQrrx5W",
        "block_height": 277098062,
        "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
        "locked": "0",
        "storage_paid_at": 0,
        "storage_usage": 634470
      }
    },
    {
      "block": "E1XCX2Qg1tHpPJuHf7PnYKiuJ8vw7vq1ejEJs4XDU3vy",
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
        "operation_id": "3",
        "last_keeper_heartbeat": "1794331679",
        "reference_price": "3510100",
        "reference_price_timestamp": "1794331599",
        "last_nonce": "1794331685244",
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
            "nonce": 1794331685244,
            "expires_after": 1794331745244,
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
        "keeper_weight_used": "10"
      },
      "keys": {
        "block_hash": "E1XCX2Qg1tHpPJuHf7PnYKiuJ8vw7vq1ejEJs4XDU3vy",
        "block_height": 277098070,
        "keys": []
      },
      "account": {
        "amount": "7990836774916475399999997",
        "block_hash": "E1XCX2Qg1tHpPJuHf7PnYKiuJ8vw7vq1ejEJs4XDU3vy",
        "block_height": 277098070,
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
          "b": true,
          "p": "3.5481",
          "s": "3.5",
          "r": true,
          "t": {
            "limit": {
              "tif": "Ioc"
            }
          }
        }
      ],
      "grouping": "na"
    },
    "nonce": 1794331685244,
    "signature": {
      "r": "0x8476aba29460a9b3cc2f94b016a82641a1c2bec1876613f529696430485d3746",
      "s": "0x107a37ff5ef6a9ded8c2b694f0cb046ec457ebc9c69515b0e68c2c595b770801",
      "v": 27
    },
    "expiresAfter": 1794331745244
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
              "avgPx": "3.5212",
              "oid": 65016537461
            }
          }
        ]
      }
    }
  },
  "after": {
    "observedAtMs": 1794331700760,
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
        "accountValue": "48.957074",
        "totalNtlPos": "0.0",
        "totalRawUsd": "48.957074",
        "totalMarginUsed": "0.0"
      },
      "crossMarginSummary": {
        "accountValue": "48.957074",
        "totalNtlPos": "0.0",
        "totalRawUsd": "48.957074",
        "totalMarginUsed": "0.0"
      },
      "crossMaintenanceMarginUsed": "0.0",
      "withdrawable": "48.957074",
      "assetPositions": [],
      "time": 1794331700647
    },
    "userFills": [
      {
        "coin": "NEAR",
        "px": "3.5212",
        "sz": "3.5",
        "side": "B",
        "time": 1794331700441,
        "startPosition": "-3.5",
        "dir": "Close Short",
        "closedPnl": "-0.03185",
        "hash": "0xabadf684c164a663ad27042dd235b90101000e6a5c67c5354f76a1d78068804e",
        "oid": 65016537461,
        "crossed": true,
        "fee": "0.005545",
        "tid": 208398018647727,
        "feeToken": "USDC",
        "twapId": null
      },
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
      "equityText": "48.957074",
      "equity": 48.957074,
      "marginUsed": 0,
      "withdrawable": 48.957074,
      "signedSize": 0,
      "signedSizeText": "0",
      "funding": null,
      "otherPositions": []
    },
    "fills": [
      {
        "coin": "NEAR",
        "oid": 65016537461,
        "time": 1794331700441,
        "hash": "0xabadf684c164a663ad27042dd235b90101000e6a5c67c5354f76a1d78068804e",
        "side": "B",
        "sz": "3.5",
        "px": "3.5212",
        "fee": "0.005545",
        "closedPnl": "-0.03185"
      },
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
      "avgPx": "3.5212",
      "oid": 65016537461
    },
    "fills": [
      {
        "coin": "NEAR",
        "oid": 65016537461,
        "time": 1794331700441,
        "hash": "0xabadf684c164a663ad27042dd235b90101000e6a5c67c5354f76a1d78068804e",
        "side": "B",
        "sz": "3.5",
        "px": "3.5212",
        "fee": "0.005545",
        "closedPnl": "-0.03185"
      }
    ],
    "fullFill": true,
    "flat": true
  }
}
```

