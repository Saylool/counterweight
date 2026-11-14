# Testnet lifecycle open — 2026-11-12T17:36:58.130Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v3.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a) · [Public explorer](https://testnet.nearblocks.io/txns/6oiP66YntFXUfqRvfPyfuD1CS5WyahebzqRFmmMsxeRh)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "open",
  "capturedAt": "2026-11-12T17:36:58.130Z",
  "network": "testnet",
  "outcome": "failed-before-submission",
  "commands": [
    "near contract call-function as-transaction policy-v3.counterweight-samet.testnet heartbeat json-args '{}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction policy-v3.counterweight-samet.testnet set_keeper_price json-args '{\"price\":\"3385100\",\"observed_at\":\"1794505019\"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction policy-v3.counterweight-samet.testnet request_order_signature json-args '{\"order\":{\"asset_index\":54,\"size\":\"3600000000000000000000000\",\"reduce_only\":false,\"reference_price\":null}}' prepaid-gas '300 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send"
  ],
  "derived": {
    "address": "0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5",
    "publicKey": "0x049291386cf4ed4a8e0011b19c9ba338397c7ff5f2fded38aac8f2c8c993b69112de24132bd9343b5f927b101a0761dbb9647a25181d728fd61be2ffaafea582df",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277394691,
    "derivedBlockHeight": 277394691
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.3851",
    "funding": "0.0000125",
    "capturedAt": "2026-11-12T17:36:59.256Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "margin": {
    "limits": {
      "per_withdrawal_usdc": "50000000",
      "daily_withdrawal_usdc": "100000000",
      "min_residual_equity_usdc": "1000000",
      "min_headroom_bps": 1000,
      "fee_reserve_usdc": "100000",
      "max_fee_usdc": "1000000"
    },
    "usable_margin": "0",
    "withdrawable": "0",
    "observed_at_ms": "0",
    "withdrawals": [],
    "withdrawal": null,
    "processed_receipts": []
  },
  "rebalance": null,
  "preflight": {
    "block": "Dtw1oRkrLQZu58FuoccW5wMkXeaJJzAsStgkur1SM66f",
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
        "min_price": "2840800",
        "max_price": "4261200"
      },
      "oracle_price": "0",
      "oracle_timestamp": "0",
      "daily_usage": "0",
      "usage_day": 20767,
      "operation_id": "1",
      "last_keeper_heartbeat": "1794504648",
      "reference_price": "3387600",
      "reference_price_timestamp": "1794504950",
      "last_nonce": "1794336738598",
      "outstanding": [
        {
          "nonce": 1794336738598,
          "expires_after": 1794509538599,
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
      "block_hash": "Dtw1oRkrLQZu58FuoccW5wMkXeaJJzAsStgkur1SM66f",
      "block_height": 277394693,
      "keys": []
    },
    "account": {
      "amount": "6297237963885256499999999",
      "block_hash": "Dtw1oRkrLQZu58FuoccW5wMkXeaJJzAsStgkur1SM66f",
      "block_height": 277394693,
      "code_hash": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 344187
    }
  },
  "before": {
    "observedAtMs": 1794505019361,
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
      "time": 1794505019257
    },
    "userFills": [],
    "ledger": [],
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
  "command": "near contract call-function as-transaction policy-v3.counterweight-samet.testnet request_order_signature json-args '{\"order\":{\"asset_index\":54,\"size\":\"3600000000000000000000000\",\"reduce_only\":false,\"reference_price\":null}}' prepaid-gas '300 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
  "expected": {
    "method": "request_order_signature",
    "args": {
      "order": {
        "asset_index": 54,
        "size": "3600000000000000000000000",
        "reduce_only": false,
        "reference_price": null
      }
    },
    "caller": "keeper.counterweight-samet.testnet",
    "policy": "policy-v3.counterweight-samet.testnet",
    "asset": 54,
    "reduceOnly": false,
    "size": "3.6",
    "price": "3.3512",
    "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
    "amount": "0"
  },
  "txHash": "6oiP66YntFXUfqRvfPyfuD1CS5WyahebzqRFmmMsxeRh",
  "nearResponse": {
    "final_execution_status": "FINAL",
    "receipts_outcome": [
      {
        "block_hash": "3tA8nD8UMf8F76DXj93QzCeZWLswKZ3PQfY6ZmErxBT5",
        "id": "2QrKZhb5LPJDbSKpRL96VQX6ym8AiQEVjAM91QCpPaSZ",
        "outcome": {
          "executor_id": "policy-v3.counterweight-samet.testnet",
          "gas_burnt": 1790747456235,
          "logs": [],
          "metadata": {
            "contracts": [
              {
                "local": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm"
              }
            ],
            "gas_profile": [
              {
                "cost": "BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "7413507108"
              },
              {
                "cost": "CONTRACT_LOADING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35445963"
              },
              {
                "cost": "CONTRACT_LOADING_BYTES",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "373859115540"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "18269042400"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "296503974"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "17620156302"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "129510468"
              },
              {
                "cost": "STORAGE_READ_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "338141074494"
              },
              {
                "cost": "STORAGE_READ_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1826199447"
              },
              {
                "cost": "STORAGE_READ_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6587318696"
              },
              {
                "cost": "UTF8_DECODING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3111779061"
              },
              {
                "cost": "UTF8_DECODING_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5540029101"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "76018540620"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "25234153749"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3666197112"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "20058657402"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4592289312"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "7FwjtudbPrfAw3y4ufknmq3LArXa6736Y6uuNK9fAiKp"
          ],
          "status": {
            "Failure": {
              "ActionError": {
                "index": 0,
                "kind": {
                  "FunctionCallError": {
                    "ExecutionError": "Smart contract panicked: ERR_REBALANCE_STALE"
                  }
                }
              }
            }
          },
          "tokens_burnt": "179074745623500000000"
        },
        "proof": [
          {
            "direction": "Right",
            "hash": "9zZ6unqEBmeaQhtkGhdauJ34HTFVRDXMQVmFPoaVSx4e"
          },
          {
            "direction": "Right",
            "hash": "3aUhxtZ6rxvGGUWiUuYRrHobW5Vh7UeR7CvSyi4HCnyu"
          },
          {
            "direction": "Right",
            "hash": "8SQsqKjk8bWkvF58YDu62xRDtfq9EgocSRL5z9xAmkA2"
          }
        ]
      },
      {
        "block_hash": "9TU2QWHC6FsrrdDr5U9Qe7WyUC4p2N3gdYe3aSC9qRVd",
        "id": "7FwjtudbPrfAw3y4ufknmq3LArXa6736Y6uuNK9fAiKp",
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
      "Failure": {
        "ActionError": {
          "index": 0,
          "kind": {
            "FunctionCallError": {
              "ExecutionError": "Smart contract panicked: ERR_REBALANCE_STALE"
            }
          }
        }
      }
    },
    "transaction": {
      "actions": [
        {
          "FunctionCall": {
            "args": "eyJvcmRlciI6eyJhc3NldF9pbmRleCI6NTQsInJlZHVjZV9vbmx5IjpmYWxzZSwicmVmZXJlbmNlX3ByaWNlIjpudWxsLCJzaXplIjoiMzYwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCJ9fQ==",
            "deposit": "0",
            "gas": 300000000000000,
            "method_name": "request_order_signature"
          }
        }
      ],
      "hash": "6oiP66YntFXUfqRvfPyfuD1CS5WyahebzqRFmmMsxeRh",
      "nonce": 277054186000249,
      "priority_fee": 0,
      "public_key": "ed25519:BnSnqej9ZUUmAuX3PHv6Gi3L3vbKt6onLrxNVqj6VjAJ",
      "receiver_id": "policy-v3.counterweight-samet.testnet",
      "signature": "ed25519:3utG1uMGXaABCSXLmqiG4UTdHLZC1Vin7kmDzbiQ98CFYGfYLtMdJLtLE8MsGf9RtNdzvpYiNQH9WJQt1zrVXqJc",
      "signer_id": "keeper.counterweight-samet.testnet"
    },
    "transaction_outcome": {
      "block_hash": "8GDmY611SJ13VoPbFW9Eb6WhDAPK7jVguRLQv4mCRQ3z",
      "id": "6oiP66YntFXUfqRvfPyfuD1CS5WyahebzqRFmmMsxeRh",
      "outcome": {
        "executor_id": "keeper.counterweight-samet.testnet",
        "gas_burnt": 314210699235,
        "logs": [],
        "metadata": {
          "gas_profile": null,
          "version": 1
        },
        "receipt_ids": [
          "2QrKZhb5LPJDbSKpRL96VQX6ym8AiQEVjAM91QCpPaSZ"
        ],
        "status": {
          "SuccessReceiptId": "2QrKZhb5LPJDbSKpRL96VQX6ym8AiQEVjAM91QCpPaSZ"
        },
        "tokens_burnt": "31421069923500000000"
      },
      "proof": [
        {
          "direction": "Right",
          "hash": "2CMuf5nNv6DZhkfMEhzqjyR5vkZr7qCXSVZoZKrq45ey"
        },
        {
          "direction": "Right",
          "hash": "CqLDGE5YUQ2eBnEeDEEZteFHGVCRAqpLKrxZ3HrbD5dx"
        }
      ]
    }
  },
  "error": "[\n  {\n    \"code\": \"invalid_value\",\n    \"values\": [\n      \"dHJ1ZQ==\"\n    ],\n    \"path\": [\n      \"status\",\n      \"SuccessValue\"\n    ],\n    \"message\": \"Invalid input: expected \\\"dHJ1ZQ==\\\"\"\n  },\n  {\n    \"code\": \"unrecognized_keys\",\n    \"keys\": [\n      \"Failure\"\n    ],\n    \"path\": [\n      \"status\"\n    ],\n    \"message\": \"Unrecognized key: \\\"Failure\\\"\"\n  }\n]"
}
```

# Testnet lifecycle open — 2026-11-12T17:38:02.117Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v3.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a) · [Public explorer](https://testnet.nearblocks.io/txns/5ckMPUyA87VycWs2HFyBBQiWvuAJTJbFUA6ZpMuUCwwM) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/tx/0x53ce46989e0e4adf5548042dfb724b0101005e7e390169b1f796f1eb5d0224c9)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "open",
  "capturedAt": "2026-11-12T17:38:02.117Z",
  "network": "testnet",
  "outcome": "public-fill-and-position-verified",
  "commands": [
    "near contract call-function as-transaction policy-v3.counterweight-samet.testnet heartbeat json-args '{}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction policy-v3.counterweight-samet.testnet set_keeper_price json-args '{\"price\":\"3386500\",\"observed_at\":\"1794505082\"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction policy-v3.counterweight-samet.testnet observe_margin json-args '{\"equity_usdc\":\"49000000\",\"withdrawable_usdc\":\"49000000\",\"observed_at_ms\":\"1794505082768\"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction policy-v3.counterweight-samet.testnet request_order_signature json-args '{\"order\":{\"asset_index\":54,\"size\":\"3600000000000000000000000\",\"reduce_only\":false,\"reference_price\":null}}' prepaid-gas '300 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send"
  ],
  "derived": {
    "address": "0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5",
    "publicKey": "0x049291386cf4ed4a8e0011b19c9ba338397c7ff5f2fded38aac8f2c8c993b69112de24132bd9343b5f927b101a0761dbb9647a25181d728fd61be2ffaafea582df",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277394798,
    "derivedBlockHeight": 277394798
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.3865",
    "funding": "0.0000125",
    "capturedAt": "2026-11-12T17:38:02.693Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "margin": {
    "limits": {
      "per_withdrawal_usdc": "50000000",
      "daily_withdrawal_usdc": "100000000",
      "min_residual_equity_usdc": "1000000",
      "min_headroom_bps": 1000,
      "fee_reserve_usdc": "100000",
      "max_fee_usdc": "1000000"
    },
    "usable_margin": "0",
    "withdrawable": "0",
    "observed_at_ms": "0",
    "withdrawals": [],
    "withdrawal": null,
    "processed_receipts": []
  },
  "rebalance": null,
  "preflight": {
    "block": "9HSpy56Vt56E2n4NAU2aQQyTAuTuK9Yz3wSvPjPSMT9r",
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
        "min_price": "2840800",
        "max_price": "4261200"
      },
      "oracle_price": "0",
      "oracle_timestamp": "0",
      "daily_usage": "0",
      "usage_day": 20767,
      "operation_id": "1",
      "last_keeper_heartbeat": "1794505022",
      "reference_price": "3385100",
      "reference_price_timestamp": "1794505019",
      "last_nonce": "1794336738598",
      "outstanding": [
        {
          "nonce": 1794336738598,
          "expires_after": 1794509538599,
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
      "block_hash": "9HSpy56Vt56E2n4NAU2aQQyTAuTuK9Yz3wSvPjPSMT9r",
      "block_height": 277394799,
      "keys": []
    },
    "account": {
      "amount": "6297237963885256499999999",
      "block_hash": "9HSpy56Vt56E2n4NAU2aQQyTAuTuK9Yz3wSvPjPSMT9r",
      "block_height": 277394799,
      "code_hash": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 344187
    }
  },
  "before": {
    "observedAtMs": 1794505082768,
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
      "time": 1794505082672
    },
    "userFills": [],
    "ledger": [],
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
  "command": "near contract call-function as-transaction policy-v3.counterweight-samet.testnet request_order_signature json-args '{\"order\":{\"asset_index\":54,\"size\":\"3600000000000000000000000\",\"reduce_only\":false,\"reference_price\":null}}' prepaid-gas '300 Tgas' attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send",
  "expected": {
    "method": "request_order_signature",
    "args": {
      "order": {
        "asset_index": 54,
        "size": "3600000000000000000000000",
        "reduce_only": false,
        "reference_price": null
      }
    },
    "caller": "keeper.counterweight-samet.testnet",
    "policy": "policy-v3.counterweight-samet.testnet",
    "asset": 54,
    "reduceOnly": false,
    "size": "3.6",
    "price": "3.3526",
    "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
    "amount": "0"
  },
  "txHash": "5ckMPUyA87VycWs2HFyBBQiWvuAJTJbFUA6ZpMuUCwwM",
  "nearResponse": {
    "final_execution_status": "FINAL",
    "receipts_outcome": [
      {
        "block_hash": "GQ9MaAXs1MhSQ4pUngjP1qSiCf3MkJQk6TKFpJTj3uGy",
        "id": "9jAiwqmm3BFTHUcbLZCmkKNJiN4doqckaL3Mq42gNPt7",
        "outcome": {
          "executor_id": "policy-v3.counterweight-samet.testnet",
          "gas_burnt": 3347017109609,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"2\",\"caller\":\"keeper.counterweight-samet.testnet\",\"kind\":\"Increase\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":54,\"b\":false,\"p\":\"3.3526\",\"s\":\"3.6\",\"r\":false,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794505097899,\"expiresAfter\":1794505157899},\"digest\":\"d5afd270abbcc0d8e5616ad142e37b5063ba810abeaaa6cbcdff3bc1e2dd6cf9\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}"
          ],
          "metadata": {
            "contracts": [
              {
                "local": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm"
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
                "gas_used": "12708869328"
              },
              {
                "cost": "CONTRACT_LOADING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35445963"
              },
              {
                "cost": "CONTRACT_LOADING_BYTES",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "373859115540"
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
                "gas_used": "9120000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "70466306400"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "8119647288"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "42791808162"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "160754622"
              },
              {
                "cost": "STORAGE_READ_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "338141074494"
              },
              {
                "cost": "STORAGE_READ_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1826199447"
              },
              {
                "cost": "STORAGE_READ_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6542430664"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "20619311094"
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
                "gas_used": "50160000000"
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
                "gas_used": "378374788572"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "53272102359"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4529632836"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "51579404748"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "8237989188"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "AQqWEfd82AJd5Nfo4ggLoAScSCAuGGLqBx4JuZuSugoo",
            "B4cnbPS6QhRjVPWSpXnUiCKCdofJUWiNRed4TvcR7rG6",
            "AXggrGs8V6YCRV6QfbqS5pTmVFUSG3qg3UrdQ8nDiKDG"
          ],
          "status": {
            "SuccessReceiptId": "B4cnbPS6QhRjVPWSpXnUiCKCdofJUWiNRed4TvcR7rG6"
          },
          "tokens_burnt": "334701710960900000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "8uuJQmqANGgvwsQP2ibLDJZwxSHAN4CAULekV5wpgojP"
          }
        ]
      },
      {
        "block_hash": "FKy1SZXNa3bdnjUv52VWKmMn4kxzyefLuBcwwn9V19gj",
        "id": "AQqWEfd82AJd5Nfo4ggLoAScSCAuGGLqBx4JuZuSugoo",
        "outcome": {
          "executor_id": "v1.signer-prod.testnet",
          "gas_burnt": 4655117536078,
          "logs": [
            "sign: predecessor=AccountId(\"policy-v3.counterweight-samet.testnet\"), request=SignRequestArgs { path: \"counterweight-1\", payload: Ecdsa(BoundedVec { inner: [213, 175, 210, 112, 171, 188, 192, 216, 229, 97, 106, 209, 66, 227, 123, 80, 99, 186, 129, 10, 190, 170, 166, 203, 205, 255, 59, 193, 226, 221, 108, 249], witness: NonEmpty(()) }), domain_id: DomainId(0) }"
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
                "gas_used": "617117784"
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
                "gas_used": "4777962342"
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
                "gas_used": "25035579138"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "10068660744"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "587133834"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5746"
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
                "gas_used": "32240828984"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "128393472000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "184546046022"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5850077961"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "179349192498"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "50160000000"
              },
              {
                "cost": "UTF8_DECODING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3111779061"
              },
              {
                "cost": "UTF8_DECODING_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "105552133398"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "989333648028"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "14018974305"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "16269090156"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "14327612430"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "43949881404"
              },
              {
                "cost": "YIELD_CREATE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "153411779276"
              },
              {
                "cost": "YIELD_CREATE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4317740688"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "GCL7QbuyowTDWqX1Vwit2415WAV3WJnA9C8jTPfLo9oj",
            "5ausWuUuHthrY5uv4M3592xqx6eLn7kMePHbYfng6cb3"
          ],
          "status": {
            "SuccessReceiptId": "GCL7QbuyowTDWqX1Vwit2415WAV3WJnA9C8jTPfLo9oj"
          },
          "tokens_burnt": "465511753607800000000"
        },
        "proof": [
          {
            "direction": "Right",
            "hash": "GDw61bUbbyj6t6iqDwzsBoroEsWYSaozXoNi5XMWUUdQ"
          },
          {
            "direction": "Right",
            "hash": "CLDH5MwCFaTUJ8wjAVjEHzzCNEpVk75bf3ghvkmXfKRd"
          }
        ]
      },
      {
        "block_hash": "HUZUgQQuyqm72AXRyrjBMLD5kqzXah4NFk8cAhPc8Ux3",
        "id": "GCL7QbuyowTDWqX1Vwit2415WAV3WJnA9C8jTPfLo9oj",
        "outcome": {
          "executor_id": "v1.signer-prod.testnet",
          "gas_burnt": 3838770641550,
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
                "gas_used": "11400000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "10439452800"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "22693958010"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "12585825930"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "614731194"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5746"
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
                "gas_used": "32240828984"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "184546046022"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "352414335"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "178232525094"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "36480000000"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "997689557964"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "16822769166"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "17031746316"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "17193134916"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "43854842304"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "32ZY3jNRD9m46BqboeSoNcv4gJTruQUC1AhX5jK6PzP2"
          ],
          "status": {
            "SuccessValue": "eyJzY2hlbWUiOiJTZWNwMjU2azEiLCJiaWdfciI6eyJhZmZpbmVfcG9pbnQiOiIwM2I1ODI4MzNhMDcxOTU1OTk4MzQ0MzU1YThmNzg4MDYzM2E1YzkzNjkwMGZhNGI5MDYzYjAwMjRiNmRjZjE0NGQifSwicyI6eyJzY2FsYXIiOiIyZmFkMTk1YWI0NDk4ZTBiNzQzNjk5ZDBlODZhYmRlN2ZmODljMWMzZDMxZmJhOGMyMDU2N2JhYzJjODM4OGVmIn0sInJlY292ZXJ5X2lkIjowfQ=="
          },
          "tokens_burnt": "383877064155000000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "BmgqZB3WJ6qdWV34FK76anmT6Lh2SdPmDwSN1LYiNN4P"
          },
          {
            "direction": "Left",
            "hash": "CcGwiCXJDmUfYxmfmonLdKc3Yu9DCdqSqRtcFRbtj6Wf"
          }
        ]
      },
      {
        "block_hash": "FizMEAytknNsNoK88aPw6bCEu53QNkYnm9h8VZWJFKd3",
        "id": "32ZY3jNRD9m46BqboeSoNcv4gJTruQUC1AhX5jK6PzP2",
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
            "hash": "AvMGsPM1oFCqXAMX8DHvo4EtXrkMdbAP2p3YXn8MWTkA"
          }
        ]
      },
      {
        "block_hash": "AYEBgpUyFMnvFkrysYFxs7SS8TVhnu5tPSKj4wjJCyfQ",
        "id": "5ausWuUuHthrY5uv4M3592xqx6eLn7kMePHbYfng6cb3",
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
        "block_hash": "FizMEAytknNsNoK88aPw6bCEu53QNkYnm9h8VZWJFKd3",
        "id": "B4cnbPS6QhRjVPWSpXnUiCKCdofJUWiNRed4TvcR7rG6",
        "outcome": {
          "executor_id": "policy-v3.counterweight-samet.testnet",
          "gas_burnt": 1986070684367,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"2\",\"nonce\":\"1794505097899\",\"expiresAfter\":\"1794505157899\",\"signature\":{\"big_r\":{\"affine_point\":\"03b582833a071955998344355a8f7880633a5c936900fa4b9063b0024b6dcf144d\"},\"s\":{\"scalar\":\"2fad195ab4498e0b743699d0e86abde7ff89c1c3d31fba8c20567bac2c8388ef\"},\"scheme\":\"Secp256k1\",\"recovery_id\":0}}]}"
          ],
          "metadata": {
            "contracts": [
              {
                "local": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm"
              }
            ],
            "gas_profile": [
              {
                "cost": "BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6619202775"
              },
              {
                "cost": "CONTRACT_LOADING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35445963"
              },
              {
                "cost": "CONTRACT_LOADING_BYTES",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "373859115540"
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
                "gas_used": "15659179200"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4268896959"
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
                "gas_used": "112713691498"
              },
              {
                "cost": "STORAGE_READ_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "711908259"
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
                "gas_used": "57000000000"
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
                "gas_used": "222615559188"
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
            "FA8ewdA4GyC189uRbjjbUrVNZaFdkQX8BoAY36XrSt9C"
          ],
          "status": {
            "SuccessValue": "dHJ1ZQ=="
          },
          "tokens_burnt": "198607068436700000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "ENuRSGDAXAVmAnW75HR7TsH9iGKsYRHTx8Ny1cMYt5hB"
          },
          {
            "direction": "Left",
            "hash": "7UcgTojJwUmXB8BV2nxfxtG6CsHi61vEuRy8EbRjcG6F"
          },
          {
            "direction": "Right",
            "hash": "A31qgp1sq1XJzKGUPkfQbXWYv1sYmMpXkNiagtshKt6o"
          }
        ]
      },
      {
        "block_hash": "6t8d3t1ZkEsmMeZxgeEG2dhbTLFQLXoy9WDm2Ym7YtEb",
        "id": "FA8ewdA4GyC189uRbjjbUrVNZaFdkQX8BoAY36XrSt9C",
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
            "hash": "D1TSjrCCdp2o3HRDABBpaqAfy6AR9cLmRU8Xqf4FJLio"
          },
          {
            "direction": "Right",
            "hash": "CYBMkTyf1qcS7mujar7WUgYTNBTYMD224R678zEiDbdh"
          }
        ]
      },
      {
        "block_hash": "FKy1SZXNa3bdnjUv52VWKmMn4kxzyefLuBcwwn9V19gj",
        "id": "AXggrGs8V6YCRV6QfbqS5pTmVFUSG3qg3UrdQ8nDiKDG",
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
            "hash": "HNRKQTY1UNrdKGAbcNKKJx4qr5jaT5UWvpFG56PDQXsE"
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
            "args": "eyJvcmRlciI6eyJhc3NldF9pbmRleCI6NTQsInJlZHVjZV9vbmx5IjpmYWxzZSwicmVmZXJlbmNlX3ByaWNlIjpudWxsLCJzaXplIjoiMzYwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMCJ9fQ==",
            "deposit": "0",
            "gas": 300000000000000,
            "method_name": "request_order_signature"
          }
        }
      ],
      "hash": "5ckMPUyA87VycWs2HFyBBQiWvuAJTJbFUA6ZpMuUCwwM",
      "nonce": 277054186000252,
      "priority_fee": 0,
      "public_key": "ed25519:BnSnqej9ZUUmAuX3PHv6Gi3L3vbKt6onLrxNVqj6VjAJ",
      "receiver_id": "policy-v3.counterweight-samet.testnet",
      "signature": "ed25519:5CFQBSW8Z9ZMN1CgBs3SA6BAsaXDxd8Y23aueQHVT91XmwK94zGdvYR5ymv88pd26K4gVsHBiQz3ySmLPc2QoB8A",
      "signer_id": "keeper.counterweight-samet.testnet"
    },
    "transaction_outcome": {
      "block_hash": "957RH26e2rfMFv4WBwyLqxfeYsywSHX7PBZpUFAQG7Pd",
      "id": "5ckMPUyA87VycWs2HFyBBQiWvuAJTJbFUA6ZpMuUCwwM",
      "outcome": {
        "executor_id": "keeper.counterweight-samet.testnet",
        "gas_burnt": 314210699235,
        "logs": [],
        "metadata": {
          "gas_profile": null,
          "version": 1
        },
        "receipt_ids": [
          "9jAiwqmm3BFTHUcbLZCmkKNJiN4doqckaL3Mq42gNPt7"
        ],
        "status": {
          "SuccessReceiptId": "9jAiwqmm3BFTHUcbLZCmkKNJiN4doqckaL3Mq42gNPt7"
        },
        "tokens_burnt": "31421069923500000000"
      },
      "proof": [
        {
          "direction": "Right",
          "hash": "6Y8Yy1za3sdAbDPkvPnHNDKRyn9GSaUFfQMuSTVgC2L5"
        },
        {
          "direction": "Right",
          "hash": "CEigMPcf3UXwwGf7jBUGc7wNgexgwEgSVF5AJMbboWq5"
        },
        {
          "direction": "Right",
          "hash": "7KM1mYVN2SaxXkVQpsnQgvRQTc7nfZixxBYwD7ofHCdM"
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
            "p": "3.3526",
            "s": "3.6",
            "t": {
              "limit": {
                "tif": "Ioc"
              }
            }
          }
        ]
      },
      "nonce": 1794505097899,
      "expiresAfter": 1794505157899
    },
    "digest": "0xd5afd270abbcc0d8e5616ad142e37b5063ba810abeaaa6cbcdff3bc1e2dd6cf9",
    "signature": {
      "r": "0xb582833a071955998344355a8f7880633a5c936900fa4b9063b0024b6dcf144d",
      "s": "0x2fad195ab4498e0b743699d0e86abde7ff89c1c3d31fba8c20567bac2c8388ef",
      "v": 27
    },
    "blocks": [
      "GQ9MaAXs1MhSQ4pUngjP1qSiCf3MkJQk6TKFpJTj3uGy",
      "FizMEAytknNsNoK88aPw6bCEu53QNkYnm9h8VZWJFKd3"
    ],
    "nonce": 1794505097899
  },
  "checks": [
    {
      "block": "GQ9MaAXs1MhSQ4pUngjP1qSiCf3MkJQk6TKFpJTj3uGy",
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
        "signed_short_size": "3600000000000000000000000",
        "paused": false,
        "pending": {
          "id": 2,
          "kind": "Increase",
          "amount": "3600000000000000000000000",
          "phase": "AwaitingCallback",
          "nonce": 1794505097899,
          "expires_after": 1794505157899,
          "keeper": true,
          "callback_deadline_ms": 1794505157899
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
          "min_price": "2840800",
          "max_price": "4261200"
        },
        "oracle_price": "0",
        "oracle_timestamp": "0",
        "daily_usage": "12313314",
        "usage_day": 20767,
        "operation_id": "2",
        "last_keeper_heartbeat": "1794505085",
        "reference_price": "3386500",
        "reference_price_timestamp": "1794505082",
        "last_nonce": "1794505097899",
        "outstanding": [
          {
            "nonce": 1794336738598,
            "expires_after": 1794509538599,
            "keeper": false,
            "discarded": false,
            "invalidation_requested": false,
            "invalidation_signed": false,
            "invalidation_confirmed": false,
            "withdrawal": false
          },
          {
            "nonce": 1794505097899,
            "expires_after": 1794505157899,
            "keeper": true,
            "discarded": false,
            "invalidation_requested": false,
            "invalidation_signed": false,
            "invalidation_confirmed": false,
            "withdrawal": false
          }
        ],
        "pause_complete": true,
        "lifetime_opened": "3600000000000000000000000",
        "last_open_expiry": "1794505157899",
        "keeper_weight_used": "5"
      },
      "keys": {
        "block_hash": "GQ9MaAXs1MhSQ4pUngjP1qSiCf3MkJQk6TKFpJTj3uGy",
        "block_height": 277394829,
        "keys": []
      },
      "account": {
        "amount": "6297237963885256499999998",
        "block_hash": "GQ9MaAXs1MhSQ4pUngjP1qSiCf3MkJQk6TKFpJTj3uGy",
        "block_height": 277394829,
        "code_hash": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm",
        "locked": "0",
        "storage_paid_at": 0,
        "storage_usage": 344301
      }
    },
    {
      "block": "FizMEAytknNsNoK88aPw6bCEu53QNkYnm9h8VZWJFKd3",
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
        "signed_short_size": "3600000000000000000000000",
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
          "min_price": "2840800",
          "max_price": "4261200"
        },
        "oracle_price": "0",
        "oracle_timestamp": "0",
        "daily_usage": "12313314",
        "usage_day": 20767,
        "operation_id": "2",
        "last_keeper_heartbeat": "1794505085",
        "reference_price": "3386500",
        "reference_price_timestamp": "1794505082",
        "last_nonce": "1794505097899",
        "outstanding": [
          {
            "nonce": 1794336738598,
            "expires_after": 1794509538599,
            "keeper": false,
            "discarded": false,
            "invalidation_requested": false,
            "invalidation_signed": false,
            "invalidation_confirmed": false,
            "withdrawal": false
          },
          {
            "nonce": 1794505097899,
            "expires_after": 1794505157899,
            "keeper": true,
            "discarded": false,
            "invalidation_requested": false,
            "invalidation_signed": false,
            "invalidation_confirmed": false,
            "withdrawal": false
          }
        ],
        "pause_complete": true,
        "lifetime_opened": "3600000000000000000000000",
        "last_open_expiry": "1794505157899",
        "keeper_weight_used": "5"
      },
      "keys": {
        "block_hash": "FizMEAytknNsNoK88aPw6bCEu53QNkYnm9h8VZWJFKd3",
        "block_height": 277394839,
        "keys": []
      },
      "account": {
        "amount": "6297237963885256499999998",
        "block_hash": "FizMEAytknNsNoK88aPw6bCEu53QNkYnm9h8VZWJFKd3",
        "block_height": 277394839,
        "code_hash": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm",
        "locked": "0",
        "storage_paid_at": 0,
        "storage_usage": 344249
      }
    }
  ],
  "recovered": "0xb4b87e81E185B7Ad1911CBF5D1EE3729c92d62a5",
  "request": {
    "action": {
      "type": "order",
      "orders": [
        {
          "a": 54,
          "b": false,
          "p": "3.3526",
          "s": "3.6",
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
    "nonce": 1794505097899,
    "signature": {
      "r": "0xb582833a071955998344355a8f7880633a5c936900fa4b9063b0024b6dcf144d",
      "s": "0x2fad195ab4498e0b743699d0e86abde7ff89c1c3d31fba8c20567bac2c8388ef",
      "v": 27
    },
    "expiresAfter": 1794505157899
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
              "totalSz": "3.6",
              "avgPx": "3.3788",
              "oid": 65178500661
            }
          }
        ]
      }
    }
  },
  "after": {
    "observedAtMs": 1794505106948,
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
        "accountValue": "48.986967",
        "totalNtlPos": "12.17124",
        "totalRawUsd": "61.158207",
        "totalMarginUsed": "0.608562"
      },
      "crossMarginSummary": {
        "accountValue": "48.986967",
        "totalNtlPos": "12.17124",
        "totalRawUsd": "61.158207",
        "totalMarginUsed": "0.608562"
      },
      "crossMaintenanceMarginUsed": "0.304281",
      "withdrawable": "47.769843",
      "assetPositions": [
        {
          "type": "oneWay",
          "position": {
            "coin": "NEAR",
            "szi": "-3.6",
            "leverage": {
              "type": "cross",
              "value": 20
            },
            "entryPx": "3.3788",
            "positionValue": "12.17124",
            "unrealizedPnl": "-0.00756",
            "returnOnEquity": "-0.0124304487",
            "liquidationPx": "16.5740398374",
            "marginUsed": "0.608562",
            "maxLeverage": 20,
            "cumFunding": {
              "allTime": "0.0",
              "sinceOpen": "0.0",
              "sinceChange": "0.0"
            }
          }
        }
      ],
      "time": 1794505107092
    },
    "userFills": [
      {
        "coin": "NEAR",
        "px": "3.3788",
        "sz": "3.6",
        "side": "A",
        "time": 1794505106582,
        "startPosition": "0.0",
        "dir": "Open Short",
        "closedPnl": "0.0",
        "hash": "0x53ce46989e0e4adf5548042dfb724b0101005e7e390169b1f796f1eb5d0224c9",
        "oid": 65178500661,
        "crossed": true,
        "fee": "0.005473",
        "tid": 504852341145730,
        "feeToken": "USDC",
        "twapId": null
      }
    ],
    "ledger": [],
    "funding": [],
    "openOrders": [],
    "account": {
      "equityText": "48.986967",
      "equity": 48.986967,
      "marginUsed": 0.608562,
      "withdrawable": 47.769843,
      "signedSize": -3.6,
      "signedSizeText": "-3.6",
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
        "oid": 65178500661,
        "time": 1794505106582,
        "hash": "0x53ce46989e0e4adf5548042dfb724b0101005e7e390169b1f796f1eb5d0224c9",
        "side": "A",
        "sz": "3.6",
        "px": "3.3788",
        "fee": "0.005473",
        "closedPnl": "0.0"
      }
    ]
  },
  "verification": {
    "filled": {
      "totalSz": "3.6",
      "avgPx": "3.3788",
      "oid": 65178500661
    },
    "fills": [
      {
        "coin": "NEAR",
        "oid": 65178500661,
        "time": 1794505106582,
        "hash": "0x53ce46989e0e4adf5548042dfb724b0101005e7e390169b1f796f1eb5d0224c9",
        "side": "A",
        "sz": "3.6",
        "px": "3.3788",
        "fee": "0.005473",
        "closedPnl": "0.0"
      }
    ],
    "fullFill": true,
    "flat": false
  }
}
```

