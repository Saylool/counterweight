# Testnet lifecycle status — 2026-11-10T17:11:10.528Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:11:10.528Z",
  "network": "testnet",
  "outcome": "failed-before-submission",
  "commands": [],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277096358,
    "derivedBlockHeight": 277096358
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.4872",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:11:12.322Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": null,
  "preflight": {
    "block": "5f7SM8WCeW2oX1daFDmsXKsUSGwdUTivKChvDh5w3jUw",
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
      "operation_id": "0",
      "last_keeper_heartbeat": "1794330578",
      "reference_price": "3480700",
      "reference_price_timestamp": "1794330578",
      "last_nonce": "0",
      "outstanding": [],
      "pause_complete": true,
      "lifetime_opened": "0",
      "last_open_expiry": "0",
      "keeper_weight_used": "0"
    },
    "keys": {
      "block_hash": "5f7SM8WCeW2oX1daFDmsXKsUSGwdUTivKChvDh5w3jUw",
      "block_height": 277096369,
      "keys": [
        {
          "access_key": {
            "nonce": 277096081000001,
            "permission": "FullAccess"
          },
          "public_key": "ed25519:HP2JGykntY2wskpg225XZqPrkgfPdGQ2i652g2uR57kk"
        }
      ]
    },
    "account": {
      "amount": "7995458676134777700000000",
      "block_hash": "5f7SM8WCeW2oX1daFDmsXKsUSGwdUTivKChvDh5w3jUw",
      "block_height": 277096369,
      "code_hash": "FZZi4RZz25yYPHhDhjAfvfQw1R3FQhSgtr1rg8SFXJTi",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 628808
    }
  },
  "before": {
    "observedAtMs": 1794330680685,
    "clearinghouseState": {
      "marginSummary": {
        "accountValue": "0.0",
        "totalNtlPos": "0.0",
        "totalRawUsd": "0.0",
        "totalMarginUsed": "0.0"
      },
      "crossMarginSummary": {
        "accountValue": "0.0",
        "totalNtlPos": "0.0",
        "totalRawUsd": "0.0",
        "totalMarginUsed": "0.0"
      },
      "crossMaintenanceMarginUsed": "0.0",
      "withdrawable": "0.0",
      "assetPositions": [],
      "time": 1794330680844
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
      }
    ],
    "funding": [],
    "openOrders": [],
    "account": {
      "equity": 0,
      "marginUsed": 0,
      "withdrawable": 0,
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
    "headroom": -0.1
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "error": "[\n  {\n    \"code\": \"invalid_value\",\n    \"values\": [\n      \"5000000000000000000000000\"\n    ],\n    \"path\": [\n      \"amount\"\n    ],\n    \"message\": \"Invalid input: expected \\\"5000000000000000000000000\\\"\"\n  }\n]"
}
```

# Testnet lifecycle status — 2026-11-10T17:25:21.204Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a) · [Public explorer](https://testnet.nearblocks.io/txns/H4ecuHKFutGfsfRY5S9v2DXfpRPQAibCSH9MiVdQ1vnt)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:25:21.204Z",
  "network": "testnet",
  "outcome": "public-status-verified",
  "commands": [],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277097791,
    "derivedBlockHeight": 277097791
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.50282",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:25:22.384Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": null,
  "preflight": {
    "block": "3j4duyWiSRy5kbbMv9wufZcqahHe6fSppM2XzeeL2P8C",
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
      "block_hash": "3j4duyWiSRy5kbbMv9wufZcqahHe6fSppM2XzeeL2P8C",
      "block_height": 277097801,
      "keys": [
        {
          "access_key": {
            "nonce": 277096081000002,
            "permission": "FullAccess"
          },
          "public_key": "ed25519:HP2JGykntY2wskpg225XZqPrkgfPdGQ2i652g2uR57kk"
        }
      ]
    },
    "account": {
      "amount": "7990877376141475399999999",
      "block_hash": "3j4duyWiSRy5kbbMv9wufZcqahHe6fSppM2XzeeL2P8C",
      "block_height": 277097801,
      "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 634438
    }
  },
  "before": {
    "observedAtMs": 1794331530970,
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
      "time": 1794331530864
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
  "spot-tx": {
    "final_execution_status": "FINAL",
    "receipts_outcome": [
      {
        "block_hash": "DCY8YoLWqbGyi3mdZebujDgykDMbuyTowhTppXysxSZ4",
        "id": "2ixJe39TggZ4ZzPenjNUEmNZZHPiW7KsNr5edU7QNX8t",
        "outcome": {
          "executor_id": "wrap.testnet",
          "gas_burnt": 2663416343943,
          "logs": [
            "Transfer 4000000000000000000000000 from counterweight-samet.testnet to policy-v2.counterweight-samet.testnet"
          ],
          "metadata": {
            "contracts": [
              {
                "local": "DsbyUrKaSJAT91Pewfi71QExPLBooDp1z4sL9GUDhNHa"
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
                "gas_used": "5253520547"
              },
              {
                "cost": "NEW_ACTION_RECEIPT",
                "cost_category": "ACTION_COST",
                "gas_used": "289092464624"
              },
              {
                "cost": "BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "9002115774"
              },
              {
                "cost": "CONTRACT_LOADING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35445963"
              },
              {
                "cost": "CONTRACT_LOADING_BYTES",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "201792988045"
              },
              {
                "cost": "LOG_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3543313050"
              },
              {
                "cost": "LOG_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1425469428"
              },
              {
                "cost": "PROMISE_RETURN",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "560152386"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "84360000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "49587400800"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2539290444"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "20137321488"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "22964946"
              },
              {
                "cost": "STORAGE_READ_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "169070537247"
              },
              {
                "cost": "STORAGE_READ_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2445250107"
              },
              {
                "cost": "STORAGE_READ_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "342271244"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "192590208000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1959155727"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5568146493"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1892130879"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "84360000000"
              },
              {
                "cost": "UTF8_DECODING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "9335337183"
              },
              {
                "cost": "UTF8_DECODING_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "45778135203"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "142087492932"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "25234153749"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "678219228"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "25789702374"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "612051804"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "EJmkGZxnixgdeb19cQVrSawZmfUyFY65ojfD5rAeDwtD",
            "8RtUZscooHhDvmuk3oPyv4msAF1tF4nQEs9efotMaXMz",
            "GVwp4hxnuELecYU8X6D1FT7xcXnSibwHkGsR83wzKyzv"
          ],
          "status": {
            "SuccessReceiptId": "8RtUZscooHhDvmuk3oPyv4msAF1tF4nQEs9efotMaXMz"
          },
          "tokens_burnt": "266341634394300000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "2gbx4eWwDy8sgS25pdjFU81UMYZ1UxdPAFb9nnU86V1p"
          },
          {
            "direction": "Right",
            "hash": "6uD1TQkbR8QqoonLpwjRLwWob5gG6QA3g2jZYhCUpvp5"
          }
        ]
      },
      {
        "block_hash": "BdCFScpv8K18HDDe7HuNZpsHAg6DDvbzxZ1VumB3pCPG",
        "id": "EJmkGZxnixgdeb19cQVrSawZmfUyFY65ojfD5rAeDwtD",
        "outcome": {
          "executor_id": "policy-v2.counterweight-samet.testnet",
          "gas_burnt": 2020370036073,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"deposit\",\"data\":[{\"amount\":\"4000000000000000000000000\",\"sender_id\":\"counterweight-samet.testnet\"}]}"
          ],
          "metadata": {
            "contracts": [
              {
                "local": "FZZi4RZz25yYPHhDhjAfvfQw1R3FQhSgtr1rg8SFXJTi"
              }
            ],
            "gas_profile": [
              {
                "cost": "NEW_DATA_RECEIPT_BYTE",
                "cost_category": "ACTION_COST",
                "gas_used": "194687178"
              },
              {
                "cost": "BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3441985443"
              },
              {
                "cost": "CONTRACT_LOADING_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35445963"
              },
              {
                "cost": "CONTRACT_LOADING_BYTES",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "684034777495"
              },
              {
                "cost": "LOG_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3543313050"
              },
              {
                "cost": "LOG_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2177800515"
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
                "gas_used": "3033463734"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "7551495558"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "71063202"
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
                "gas_used": "3478822480"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "19912730340"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "352414335"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "19231494180"
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
                "gas_used": "48110779035"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "113596275408"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "11215179444"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2007419964"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "11462089944"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4759558128"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "FeZsTkdSFFb2TTy7cDVzEhANGoCxt7r4WQx2yuYtSES5"
          ],
          "status": {
            "SuccessValue": "IjAi"
          },
          "tokens_burnt": "202037003607300000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "HfVc2zJFQix8AYZEa8CBkEvS8Kfv6sUC1DH5vi8RYrX"
          }
        ]
      },
      {
        "block_hash": "CQ9juxztps24RTSqRt9gG9NRG4cK7tFUfXHwbWE2dkxd",
        "id": "FeZsTkdSFFb2TTy7cDVzEhANGoCxt7r4WQx2yuYtSES5",
        "outcome": {
          "executor_id": "counterweight-samet.testnet",
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
        "block_hash": "CQ9juxztps24RTSqRt9gG9NRG4cK7tFUfXHwbWE2dkxd",
        "id": "8RtUZscooHhDvmuk3oPyv4msAF1tF4nQEs9efotMaXMz",
        "outcome": {
          "executor_id": "wrap.testnet",
          "gas_burnt": 1373645025497,
          "logs": [],
          "metadata": {
            "contracts": [
              {
                "local": "DsbyUrKaSJAT91Pewfi71QExPLBooDp1z4sL9GUDhNHa"
              }
            ],
            "gas_profile": [
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
                "gas_used": "201792988045"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2280000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "10439452800"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "250887978"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "12585825930"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "18726780"
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
                "gas_used": "162719116"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "931401903"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "352414335"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "899537631"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "38760000000"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "56371127340"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "16822769166"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "561097032"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "17193134916"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "311728248"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "BjYHz3c7sMtYw3LC7Em9EZcT1Eprf6YPpJSRuxzuBK4Z"
          ],
          "status": {
            "SuccessValue": "IjQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAi"
          },
          "tokens_burnt": "137364502549700000000"
        },
        "proof": [
          {
            "direction": "Right",
            "hash": "GZJ8xNt9ZoGH3tpZ3Q1Pb7zii7LbyG7UNVJiJgxPPHDj"
          },
          {
            "direction": "Right",
            "hash": "5JgN2kA8SMJRm2nujcMjMmZRwE2EGt6nxd5Mg7NkLQ4U"
          }
        ]
      },
      {
        "block_hash": "Bn8Kcgkm3KoPVT5PLdEEFT6TaXcRW2Uecuhuq6DLVR3n",
        "id": "BjYHz3c7sMtYw3LC7Em9EZcT1Eprf6YPpJSRuxzuBK4Z",
        "outcome": {
          "executor_id": "counterweight-samet.testnet",
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
        "block_hash": "BdCFScpv8K18HDDe7HuNZpsHAg6DDvbzxZ1VumB3pCPG",
        "id": "GVwp4hxnuELecYU8X6D1FT7xcXnSibwHkGsR83wzKyzv",
        "outcome": {
          "executor_id": "counterweight-samet.testnet",
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
            "hash": "F2P5qqNhMnhZM5gyusS8Yrux64DdCfFArUQB4ikaTwSz"
          }
        ]
      }
    ],
    "status": {
      "SuccessValue": "IjQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAi"
    },
    "transaction": {
      "actions": [
        {
          "FunctionCall": {
            "args": "eyJhbW91bnQiOiI0MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwibXNnIjoiIiwicmVjZWl2ZXJfaWQiOiJwb2xpY3ktdjIuY291bnRlcndlaWdodC1zYW1ldC50ZXN0bmV0In0=",
            "deposit": "1",
            "gas": 100000000000000,
            "method_name": "ft_transfer_call"
          }
        }
      ],
      "hash": "H4ecuHKFutGfsfRY5S9v2DXfpRPQAibCSH9MiVdQ1vnt",
      "nonce": 277052380000010,
      "priority_fee": 0,
      "public_key": "ed25519:G6Wmxh6djy5Uh5hMAYPAreERcBXgCp73XsruiRoSRNCi",
      "receiver_id": "wrap.testnet",
      "signature": "ed25519:2RnUwQCLo2DuybcUPzbuvM1qwyAKYcPtfacak2jePm9hE5biLU54fep2GUkNFjPFEV5rwii2a92rib6a42hEtEas",
      "signer_id": "counterweight-samet.testnet"
    },
    "transaction_outcome": {
      "block_hash": "8Ezx8WHKTBkg8snEQMoSRdeMQEMxb515jt3sRauiysvR",
      "id": "H4ecuHKFutGfsfRY5S9v2DXfpRPQAibCSH9MiVdQ1vnt",
      "outcome": {
        "executor_id": "counterweight-samet.testnet",
        "gas_burnt": 313638494655,
        "logs": [],
        "metadata": {
          "gas_profile": null,
          "version": 1
        },
        "receipt_ids": [
          "2ixJe39TggZ4ZzPenjNUEmNZZHPiW7KsNr5edU7QNX8t"
        ],
        "status": {
          "SuccessReceiptId": "2ixJe39TggZ4ZzPenjNUEmNZZHPiW7KsNr5edU7QNX8t"
        },
        "tokens_burnt": "31363849465500000000"
      },
      "proof": [
        {
          "direction": "Right",
          "hash": "8kCqUMHNJR9DShcQN5AccHUvoKwgFGMcFQeitwv4VKY2"
        }
      ]
    }
  },
  "openOrders": []
}
```

# Testnet lifecycle status — 2026-11-10T17:27:31.412Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:27:31.412Z",
  "network": "testnet",
  "outcome": "public-status-verified",
  "commands": [],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277098008,
    "derivedBlockHeight": 277098008
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.5145",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:27:32.507Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": null,
  "preflight": {
    "block": "BcRLj8m9jVusZCzXw2yadByNyVQKYBdsZ2TdG4VU5QFF",
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
      "block_hash": "BcRLj8m9jVusZCzXw2yadByNyVQKYBdsZ2TdG4VU5QFF",
      "block_height": 277098018,
      "keys": []
    },
    "account": {
      "amount": "7990836774916475399999998",
      "block_hash": "BcRLj8m9jVusZCzXw2yadByNyVQKYBdsZ2TdG4VU5QFF",
      "block_height": 277098018,
      "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 634418
    }
  },
  "before": {
    "observedAtMs": 1794331661233,
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
        "accountValue": "48.992719",
        "totalNtlPos": "12.2941",
        "totalRawUsd": "61.286819",
        "totalMarginUsed": "0.614705"
      },
      "crossMarginSummary": {
        "accountValue": "48.992719",
        "totalNtlPos": "12.2941",
        "totalRawUsd": "61.286819",
        "totalMarginUsed": "0.614705"
      },
      "crossMaintenanceMarginUsed": "0.307352",
      "withdrawable": "47.763309",
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
            "positionValue": "12.2941",
            "unrealizedPnl": "-0.00175",
            "returnOnEquity": "-0.0028472993",
            "liquidationPx": "17.0834338676",
            "marginUsed": "0.614705",
            "maxLeverage": 20,
            "cumFunding": {
              "allTime": "0.0",
              "sinceOpen": "0.0",
              "sinceChange": "0.0"
            }
          }
        }
      ],
      "time": 1794331661219
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
      "equityText": "48.992719",
      "equity": 48.992719,
      "marginUsed": 0.614705,
      "withdrawable": 47.763309,
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
    "leverage": 0.25107302168716134,
    "reserve": 0.1,
    "stressedMaintenance": 0.9225562500000001,
    "headroom": 36.468961
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "openOrders": []
}
```

# Testnet lifecycle status — 2026-11-10T17:28:36.621Z



Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:28:36.621Z",
  "network": "testnet",
  "outcome": "failed-before-submission",
  "commands": [],
  "error": "NEAR RPC HTTP 429"
}
```

# Testnet lifecycle status — 2026-11-10T17:29:57.755Z



Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:29:57.755Z",
  "network": "testnet",
  "outcome": "failed-before-submission",
  "commands": [],
  "error": "NEAR RPC HTTP 429"
}
```

# Testnet lifecycle status — 2026-11-10T17:30:18.846Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:30:18.846Z",
  "network": "testnet",
  "outcome": "public-status-verified",
  "commands": [],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277098287,
    "derivedBlockHeight": 277098287
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.5185",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:30:19.793Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": null,
  "preflight": {
    "block": "C5g1TiKtsok5bKh8wshhQvQs8615FHFoXyA3AjX3uw71",
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
        }
      ],
      "pause_complete": true,
      "lifetime_opened": "3500000000000000000000000",
      "last_open_expiry": "1794331682790",
      "keeper_weight_used": "10"
    },
    "keys": {
      "block_hash": "C5g1TiKtsok5bKh8wshhQvQs8615FHFoXyA3AjX3uw71",
      "block_height": 277098289,
      "keys": []
    },
    "account": {
      "amount": "7990836774916475399999997",
      "block_hash": "C5g1TiKtsok5bKh8wshhQvQs8615FHFoXyA3AjX3uw71",
      "block_height": 277098289,
      "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 634418
    }
  },
  "before": {
    "observedAtMs": 1794331819905,
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
      "time": 1794331819840
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
  "spot": {
    "contract": "4000000000000000000000000",
    "token": "4000000000000000000000000",
    "near": "4"
  },
  "risk": {
    "leverage": 0,
    "reserve": 0.1,
    "stressedMaintenance": 0,
    "headroom": 48.857074
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "openOrders": [],
  "settlementRequired": {
    "afterMs": 1794331682790,
    "command": "near contract call-function as-transaction policy-v2.counterweight-samet.testnet settle_position json-args '{\"short_size\":\"0\",\"observed_at_ms\":\"1794331819905\"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "note": "Run only after last_open_expiry, no open orders/remaining short, and within 30s of this public observation. Regenerate status if stale. Owner attestation releases reserved exposure; it is not an on-chain Hyperliquid proof."
  }
}
```

# Testnet lifecycle status — 2026-11-10T17:30:33.391Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:30:33.391Z",
  "network": "testnet",
  "outcome": "public-status-verified",
  "commands": [],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277098316,
    "derivedBlockHeight": 277098316
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.5245",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:30:34.337Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": null,
  "preflight": {
    "block": "CvrjAWFRkBAsSFiGh6SWDdMmW3WVm8JGgrnm2Emm32xU",
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
        }
      ],
      "pause_complete": true,
      "lifetime_opened": "3500000000000000000000000",
      "last_open_expiry": "1794331682790",
      "keeper_weight_used": "10"
    },
    "keys": {
      "block_hash": "CvrjAWFRkBAsSFiGh6SWDdMmW3WVm8JGgrnm2Emm32xU",
      "block_height": 277098318,
      "keys": []
    },
    "account": {
      "amount": "7990836774916475399999997",
      "block_hash": "CvrjAWFRkBAsSFiGh6SWDdMmW3WVm8JGgrnm2Emm32xU",
      "block_height": 277098318,
      "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 634418
    }
  },
  "before": {
    "observedAtMs": 1794331834476,
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
      "time": 1794331834332
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
  "spot": {
    "contract": "4000000000000000000000000",
    "token": "4000000000000000000000000",
    "near": "4"
  },
  "risk": {
    "leverage": 0,
    "reserve": 0.1,
    "stressedMaintenance": 0,
    "headroom": 48.857074
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "openOrders": [],
  "settlementRequired": {
    "afterMs": 1794331682790,
    "command": "near contract call-function as-transaction policy-v2.counterweight-samet.testnet settle_position json-args '{\"short_size\":\"0\",\"observed_at_ms\":\"1794331834476\"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "note": "Run only after last_open_expiry, no open orders/remaining short, and within 30s of this public observation. Regenerate status if stale. Owner attestation releases reserved exposure; it is not an on-chain Hyperliquid proof."
  }
}
```

# Testnet lifecycle status — 2026-11-10T17:30:40.720Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a) · [Public explorer](https://testnet.nearblocks.io/txns/FDepMaKNUmLZP8g6DzXzVcUsqV91V6Borv9Rh8uKNob8)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:30:40.720Z",
  "network": "testnet",
  "outcome": "public-status-verified",
  "commands": [],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277098328,
    "derivedBlockHeight": 277098328
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.5245",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:30:41.812Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": null,
  "preflight": {
    "block": "EUxZ4FrEZ3u4kwveDFX2fa3XcMBqeCF7CRWf777jUhu2",
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
        }
      ],
      "pause_complete": true,
      "lifetime_opened": "3500000000000000000000000",
      "last_open_expiry": "1794331682790",
      "keeper_weight_used": "10"
    },
    "keys": {
      "block_hash": "EUxZ4FrEZ3u4kwveDFX2fa3XcMBqeCF7CRWf777jUhu2",
      "block_height": 277098330,
      "keys": []
    },
    "account": {
      "amount": "7990836774916475399999997",
      "block_hash": "EUxZ4FrEZ3u4kwveDFX2fa3XcMBqeCF7CRWf777jUhu2",
      "block_height": 277098330,
      "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 634380
    }
  },
  "before": {
    "observedAtMs": 1794331841893,
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
      "time": 1794331841743
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
  "spot": {
    "contract": "4000000000000000000000000",
    "token": "4000000000000000000000000",
    "near": "4"
  },
  "risk": {
    "leverage": 0,
    "reserve": 0.1,
    "stressedMaintenance": 0,
    "headroom": 48.857074
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "settle-tx": {
    "final_execution_status": "FINAL",
    "receipts_outcome": [
      {
        "block_hash": "FwHfm93Rmez6qm6v2FNkHNGw88crVMz8uq29z6U4nbn9",
        "id": "7a7FwQ3kbVXhtGDowPJVRJaKfcDT7csYYpEEyTHV1huf",
        "outcome": {
          "executor_id": "policy-v2.counterweight-samet.testnet",
          "gas_burnt": 2087546363015,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"position_settlement\",\"data\":[{\"short_size\":\"0\",\"released\":\"3500000000000000000000000\",\"observed_at_ms\":\"1794331834476\",\"source\":\"owner_attestation\",\"daily_budget_released\":false}]}"
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
                "gas_used": "3441985443"
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
                "gas_used": "3246902586"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2280000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "10439452800"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3535239690"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "7551495558"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "77863980"
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
                "gas_used": "20906495286"
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
                "gas_used": "71728797834"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "146273675460"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "11215179444"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2195360232"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "11462089944"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5516069364"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "AoQsKr9QpRTjHFWWH2r2EHq7hJF3EEyZ7gRMDAVx2eGz"
          ],
          "status": {
            "SuccessValue": ""
          },
          "tokens_burnt": "208754636301500000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "7Hyd1MGkXr55uNg3m3o8chydTqqFMG5irq1m9h97JUyi"
          },
          {
            "direction": "Left",
            "hash": "5BD5uUzHp9GiUtAh6q9fV8bEWuW6QEiX16kjByxaFdan"
          },
          {
            "direction": "Right",
            "hash": "pZaAxSxkCXjmDKYeoaBMcjLQWa6avKnPfYvBgfgFGGi"
          }
        ]
      },
      {
        "block_hash": "ApCAqySZFScz87Dt6oib8K8K5zwTUKDNJD11Z16XDm6m",
        "id": "AoQsKr9QpRTjHFWWH2r2EHq7hJF3EEyZ7gRMDAVx2eGz",
        "outcome": {
          "executor_id": "counterweight-samet.testnet",
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
      "SuccessValue": ""
    },
    "transaction": {
      "actions": [
        {
          "FunctionCall": {
            "args": "eyJvYnNlcnZlZF9hdF9tcyI6IjE3OTQzMzE4MzQ0NzYiLCJzaG9ydF9zaXplIjoiMCJ9",
            "deposit": "0",
            "gas": 30000000000000,
            "method_name": "settle_position"
          }
        }
      ],
      "hash": "FDepMaKNUmLZP8g6DzXzVcUsqV91V6Borv9Rh8uKNob8",
      "nonce": 277052380000012,
      "priority_fee": 0,
      "public_key": "ed25519:G6Wmxh6djy5Uh5hMAYPAreERcBXgCp73XsruiRoSRNCi",
      "receiver_id": "policy-v2.counterweight-samet.testnet",
      "signature": "ed25519:2k2HLCYYe6Pbv4DtEJk2cyQ91DzDFMHYYc8pL6Nv7DLCp6eRFdNjAafv1tLu3Xbs3YtTAj97WT2uADwA1ZxwhxwQ",
      "signer_id": "counterweight-samet.testnet"
    },
    "transaction_outcome": {
      "block_hash": "4C9acftnowVVvAUAnfEvM7cHKZjKFZzYPTFzQyyNe4d4",
      "id": "FDepMaKNUmLZP8g6DzXzVcUsqV91V6Borv9Rh8uKNob8",
      "outcome": {
        "executor_id": "counterweight-samet.testnet",
        "gas_burnt": 311206625190,
        "logs": [],
        "metadata": {
          "gas_profile": null,
          "version": 1
        },
        "receipt_ids": [
          "7a7FwQ3kbVXhtGDowPJVRJaKfcDT7csYYpEEyTHV1huf"
        ],
        "status": {
          "SuccessReceiptId": "7a7FwQ3kbVXhtGDowPJVRJaKfcDT7csYYpEEyTHV1huf"
        },
        "tokens_burnt": "31120662519000000000"
      },
      "proof": [
        {
          "direction": "Right",
          "hash": "WXNTvMkJNTwNFSnrHzt1NbaAAkpHq5nRMMtCpMyUHLk"
        },
        {
          "direction": "Right",
          "hash": "aKa61mdWpa9Qn3JNVaDwuE5YrCBSoyzPAxoGUriLiUp"
        },
        {
          "direction": "Right",
          "hash": "AQrMDCW5T2ZDdbkv1fNN1oNEvwGrEEEAfzJU6riqkEyc"
        }
      ]
    }
  },
  "openOrders": [],
  "withdrawalSetup": {
    "command": "near contract call-function as-transaction policy-v2.counterweight-samet.testnet configure_rebalancing json-args '{\"limits\":{\"adapter\":\"disabled-routes.policy-v2.counterweight-samet.testnet\",\"strategy_margin_address\":\"0x3e72c8963761c3f436710df9b891d8e3a74b5390\",\"destination_token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\",\"per_sale_near\":\"1\",\"daily_sale_near\":\"1\",\"max_fee_usdc\":\"1\",\"max_impact_bps\":0,\"quote_age_ms\":30000,\"completion_ms\":60000,\"max_mismatch_near\":\"1\",\"per_withdrawal_usdc\":\"60000000\",\"daily_withdrawal_usdc\":\"60000000\",\"min_residual_equity_usdc\":\"1000000\",\"min_headroom_bps\":1000,\"lower_headroom_bps\":3000,\"target_headroom_bps\":6000,\"upper_headroom_bps\":9000,\"fee_reserve_usdc\":\"100000\",\"original_target_usdc\":\"11138240\"}}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "note": "Owner runs once after close. Existing WASM requires this for withdraw3. Adapter is an uncreated child of the keyless policy; no route is invoked. Sale caps are 1 yoctoNEAR, withdrawal caps $60, residual equity $1. This setup ends the run; do not reopen without a separate plan."
  }
}
```

# Testnet lifecycle status — 2026-11-10T17:35:14.988Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:35:14.988Z",
  "network": "testnet",
  "outcome": "failed-before-submission",
  "commands": [],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277098796,
    "derivedBlockHeight": 277098796
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.5275",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:35:15.403Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": {
    "processed_receipts": [],
    "withdrawal": {
      "nonce": "1794331863418",
      "amount": "47957074"
    },
    "acquisition_budget_usdc": "0",
    "acquired_near": "0",
    "reentry_required": false,
    "limits": {
      "adapter": "disabled-routes.policy-v2.counterweight-samet.testnet",
      "strategy_margin_address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
      "destination_token": "1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054",
      "per_sale_near": "1",
      "daily_sale_near": "1",
      "max_fee_usdc": "1",
      "max_impact_bps": 0,
      "quote_age_ms": 30000,
      "completion_ms": 60000,
      "max_mismatch_near": "1",
      "per_withdrawal_usdc": "60000000",
      "daily_withdrawal_usdc": "60000000",
      "min_residual_equity_usdc": "1000000",
      "min_headroom_bps": 1000,
      "lower_headroom_bps": 3000,
      "target_headroom_bps": 6000,
      "upper_headroom_bps": 9000,
      "fee_reserve_usdc": "100000",
      "original_target_usdc": "11138240"
    },
    "initial_inventory": "4000000000000000000000000",
    "sold_inventory": "0",
    "reduced_inventory": "0",
    "usable_margin": "1000000",
    "withdrawable": "1000000",
    "observed_at_ms": "1794331852657",
    "next_route_id": "0",
    "route": null,
    "sales": [],
    "withdrawals": [
      [
        1794331863418,
        47957074
      ]
    ]
  },
  "preflight": {
    "block": "4QnoBXaTYdzuzUQS8VsiyTjCuQDvcR46XQop9Un54L3N",
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
      "daily_usage": "12408204",
      "usage_day": 20767,
      "operation_id": "4",
      "last_keeper_heartbeat": "1794331679",
      "reference_price": "3528000",
      "reference_price_timestamp": "1794331854",
      "last_nonce": "1794331863418",
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
          "nonce": 1794331863418,
          "expires_after": 1794504663419,
          "keeper": false,
          "discarded": false,
          "invalidation_requested": false,
          "invalidation_signed": false,
          "invalidation_confirmed": false,
          "withdrawal": true
        }
      ],
      "pause_complete": true,
      "lifetime_opened": "3500000000000000000000000",
      "last_open_expiry": "1794331682790",
      "keeper_weight_used": "10"
    },
    "keys": {
      "block_hash": "4QnoBXaTYdzuzUQS8VsiyTjCuQDvcR46XQop9Un54L3N",
      "block_height": 277098796,
      "keys": []
    },
    "account": {
      "amount": "7990836774916475399999996",
      "block_hash": "4QnoBXaTYdzuzUQS8VsiyTjCuQDvcR46XQop9Un54L3N",
      "block_height": 277098796,
      "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 634934
    }
  },
  "before": {
    "observedAtMs": 1794332115524,
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
        "accountValue": "1.0",
        "totalNtlPos": "0.0",
        "totalRawUsd": "1.0",
        "totalMarginUsed": "0.0"
      },
      "crossMarginSummary": {
        "accountValue": "1.0",
        "totalNtlPos": "0.0",
        "totalRawUsd": "1.0",
        "totalMarginUsed": "0.0"
      },
      "crossMaintenanceMarginUsed": "0.0",
      "withdrawable": "1.0",
      "assetPositions": [],
      "time": 1794332115415
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
      },
      {
        "time": 1794332099146,
        "hash": "0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0",
        "delta": {
          "type": "withdraw",
          "usdc": "46.957074",
          "nonce": 1794331863418000,
          "fee": "1.0"
        }
      }
    ],
    "funding": [],
    "openOrders": [],
    "account": {
      "equityText": "1.0",
      "equity": 1,
      "marginUsed": 0,
      "withdrawable": 1,
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
  "spot": {
    "contract": "4000000000000000000000000",
    "token": "4000000000000000000000000",
    "near": "4"
  },
  "risk": {
    "leverage": 0,
    "reserve": 0.1,
    "stressedMaintenance": 0,
    "headroom": 0.9
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "openOrders": [],
  "error": "Hyperliquid withdrawal not yet verified in public ledger; do not resubmit signature"
}
```

# Testnet lifecycle status — 2026-11-10T17:40:47.158Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a) · [Public explorer](https://testnet.nearblocks.io/txns/9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/tx/0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "status",
  "capturedAt": "2026-11-10T17:40:47.158Z",
  "network": "testnet",
  "outcome": "public-status-verified",
  "commands": [],
  "derived": {
    "address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
    "publicKey": "0x04e210798f654d841d6e293d3570b677355ce719a980076589a327dd8a80e38e8b8b26163cd2cff359c1417eb8766d6f752473a42f31a6bff36d3fa6b8645349d2",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277099352,
    "derivedBlockHeight": 277099352
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.5047",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T17:40:48.017Z",
    "source": "https://api.hyperliquid-testnet.xyz/info",
    "request": {
      "type": "metaAndAssetCtxs"
    }
  },
  "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
  "rebalance": {
    "processed_receipts": [],
    "withdrawal": {
      "nonce": "1794331863418",
      "amount": "47957074"
    },
    "acquisition_budget_usdc": "0",
    "acquired_near": "0",
    "reentry_required": false,
    "limits": {
      "adapter": "disabled-routes.policy-v2.counterweight-samet.testnet",
      "strategy_margin_address": "0x3e72c8963761c3f436710df9b891d8e3a74b5390",
      "destination_token": "1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054",
      "per_sale_near": "1",
      "daily_sale_near": "1",
      "max_fee_usdc": "1",
      "max_impact_bps": 0,
      "quote_age_ms": 30000,
      "completion_ms": 60000,
      "max_mismatch_near": "1",
      "per_withdrawal_usdc": "60000000",
      "daily_withdrawal_usdc": "60000000",
      "min_residual_equity_usdc": "1000000",
      "min_headroom_bps": 1000,
      "lower_headroom_bps": 3000,
      "target_headroom_bps": 6000,
      "upper_headroom_bps": 9000,
      "fee_reserve_usdc": "100000",
      "original_target_usdc": "11138240"
    },
    "initial_inventory": "4000000000000000000000000",
    "sold_inventory": "0",
    "reduced_inventory": "0",
    "usable_margin": "1000000",
    "withdrawable": "1000000",
    "observed_at_ms": "1794331852657",
    "next_route_id": "0",
    "route": null,
    "sales": [],
    "withdrawals": [
      [
        1794331863418,
        47957074
      ]
    ]
  },
  "preflight": {
    "block": "8ovmhHB4ACRKcwZ1orpLCWPGRTd1RZc43Kpojd59nV2U",
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
      "daily_usage": "12408204",
      "usage_day": 20767,
      "operation_id": "4",
      "last_keeper_heartbeat": "1794331679",
      "reference_price": "3528000",
      "reference_price_timestamp": "1794331854",
      "last_nonce": "1794331863418",
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
          "nonce": 1794331863418,
          "expires_after": 1794504663419,
          "keeper": false,
          "discarded": false,
          "invalidation_requested": false,
          "invalidation_signed": false,
          "invalidation_confirmed": false,
          "withdrawal": true
        }
      ],
      "pause_complete": true,
      "lifetime_opened": "3500000000000000000000000",
      "last_open_expiry": "1794331682790",
      "keeper_weight_used": "10"
    },
    "keys": {
      "block_hash": "8ovmhHB4ACRKcwZ1orpLCWPGRTd1RZc43Kpojd59nV2U",
      "block_height": 277099353,
      "keys": []
    },
    "account": {
      "amount": "7990836774916475399999996",
      "block_hash": "8ovmhHB4ACRKcwZ1orpLCWPGRTd1RZc43Kpojd59nV2U",
      "block_height": 277099353,
      "code_hash": "2s7Fhgf2cFHEWCHv7d7zwwMUmiPrbDEvbFVTPcbTfp2M",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 634934
    }
  },
  "before": {
    "observedAtMs": 1794332448087,
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
        "accountValue": "1.0",
        "totalNtlPos": "0.0",
        "totalRawUsd": "1.0",
        "totalMarginUsed": "0.0"
      },
      "crossMarginSummary": {
        "accountValue": "1.0",
        "totalNtlPos": "0.0",
        "totalRawUsd": "1.0",
        "totalMarginUsed": "0.0"
      },
      "crossMaintenanceMarginUsed": "0.0",
      "withdrawable": "1.0",
      "assetPositions": [],
      "time": 1794332447985
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
      },
      {
        "time": 1794332099146,
        "hash": "0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0",
        "delta": {
          "type": "withdraw",
          "usdc": "46.957074",
          "nonce": 1794331863418000,
          "fee": "1.0"
        }
      }
    ],
    "funding": [],
    "openOrders": [],
    "account": {
      "equityText": "1.0",
      "equity": 1,
      "marginUsed": 0,
      "withdrawable": 1,
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
  "spot": {
    "contract": "4000000000000000000000000",
    "token": "4000000000000000000000000",
    "near": "4"
  },
  "risk": {
    "leverage": 0,
    "reserve": 0.1,
    "stressedMaintenance": 0,
    "headroom": 0.9
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "openOrders": [],
  "relayVerification": {
    "step": "withdraw",
    "txHash": "9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25",
    "nearResponse": {
      "final_execution_status": "FINAL",
      "receipts_outcome": [
        {
          "block_hash": "72N7XKEeCcs4mWGSeE9ZKi5Mhr8M9H6K2C37rhVU31gz",
          "id": "E35uigafRzmoXADr7RjRzKvvaWD7X8RfnNRMUHaDoqtE",
          "outcome": {
            "executor_id": "policy-v2.counterweight-samet.testnet",
            "gas_burnt": 3589422676422,
            "logs": [
              "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"4\",\"caller\":\"counterweight-samet.testnet\",\"kind\":\"EvmWithdrawal\",\"payload\":{\"action\":{\"type\":\"withdraw3\",\"hyperliquidChain\":\"Testnet\",\"signatureChainId\":\"0x66eee\",\"destination\":\"0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a\",\"amount\":\"47.957074\",\"time\":1794331863418},\"nonce\":1794331863418},\"digest\":\"0fa044ae0f2306c6726fb27f3736349586efc9a254ff1ea0107fa296ce12026a\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
              "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"withdrawal\",\"data\":[{\"id\":\"4\",\"kind\":\"withdraw3\",\"recipient\":\"0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a\",\"amount\":\"47957074\",\"status\":\"requested\"}]}"
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
                  "gas_used": "9531651996"
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
                  "gas_used": "58794912750"
                },
                {
                  "cost": "KECCAK256_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "14042102670"
                },
                {
                  "cost": "LOG_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "7086626100"
                },
                {
                  "cost": "LOG_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "9595521057"
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
                  "gas_used": "62636716800"
                },
                {
                  "cost": "READ_MEMORY_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "11160713688"
                },
                {
                  "cost": "READ_REGISTER_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "35240312604"
                },
                {
                  "cost": "READ_REGISTER_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "158881944"
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
                  "gas_used": "6452654600"
                },
                {
                  "cost": "STORAGE_WRITE_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "64196736000"
                },
                {
                  "cost": "STORAGE_WRITE_EVICTED_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "36934903050"
                },
                {
                  "cost": "STORAGE_WRITE_KEY_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "352414335"
                },
                {
                  "cost": "STORAGE_WRITE_VALUE_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "39455581608"
                },
                {
                  "cost": "TOUCHING_TRIE_NODE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "54720000000"
                },
                {
                  "cost": "UTF8_DECODING_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "12447116244"
                },
                {
                  "cost": "UTF8_DECODING_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "229182256494"
                },
                {
                  "cost": "WASM_INSTRUCTION",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "500977773912"
                },
                {
                  "cost": "WRITE_MEMORY_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "44860717776"
                },
                {
                  "cost": "WRITE_MEMORY_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "4477881168"
                },
                {
                  "cost": "WRITE_REGISTER_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "42982837290"
                },
                {
                  "cost": "WRITE_REGISTER_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "10203397776"
                }
              ],
              "version": 4
            },
            "receipt_ids": [
              "CqeTHNJmRGeXtMvr3BLVA1t5AeCg7GcQ58GYPM1LiPx8",
              "ET6aajnVHU1TdJ8FRs9oe7vGLWboeMM2Apy8DRBnyzFA",
              "2dXXLWLN7LPJ22sW1prJcxy9zDd8KMEEif7EVPbUk8D9"
            ],
            "status": {
              "SuccessReceiptId": "ET6aajnVHU1TdJ8FRs9oe7vGLWboeMM2Apy8DRBnyzFA"
            },
            "tokens_burnt": "358942267642200000000"
          },
          "proof": []
        },
        {
          "block_hash": "FRzgXuYoAStjPXwdqaG2NccC6hbyiFwAu3mF47SZQFCf",
          "id": "CqeTHNJmRGeXtMvr3BLVA1t5AeCg7GcQ58GYPM1LiPx8",
          "outcome": {
            "executor_id": "v1.signer-prod.testnet",
            "gas_burnt": 4424821941037,
            "logs": [
              "sign: predecessor=AccountId(\"policy-v2.counterweight-samet.testnet\"), request=SignRequestArgs { path: \"counterweight-1\", payload: Ecdsa(BoundedVec { inner: [15, 160, 68, 174, 15, 35, 6, 198, 114, 111, 178, 127, 55, 54, 52, 149, 134, 239, 201, 162, 84, 255, 30, 160, 16, 127, 162, 150, 206, 18, 2, 106], witness: NonEmpty(()) }), domain_id: DomainId(0) }"
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
                  "gas_used": "745393898832"
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
              "BRUUgVygPPgp28R73DzbkHbsZshXoX2ikrfFGXDdTzdd",
              "CsGvBV9Jo1mgwaUyhDq6tn3tJRY7pBdVaZcLKo7b8Bup"
            ],
            "status": {
              "SuccessReceiptId": "BRUUgVygPPgp28R73DzbkHbsZshXoX2ikrfFGXDdTzdd"
            },
            "tokens_burnt": "442482194103700000000"
          },
          "proof": [
            {
              "direction": "Left",
              "hash": "3eBYEUNgUv2KUbJJDFLgxbTQv9GEfyrGfSCBhYg1LBVk"
            }
          ]
        },
        {
          "block_hash": "WN2D8gAVWfapQvJwxSTyjVndrD2Hx42nPCf4hczU7Mt",
          "id": "BRUUgVygPPgp28R73DzbkHbsZshXoX2ikrfFGXDdTzdd",
          "outcome": {
            "executor_id": "v1.signer-prod.testnet",
            "gas_burnt": 3609156753726,
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
                  "gas_used": "2280000000"
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
                  "gas_used": "45600000000"
                },
                {
                  "cost": "WASM_INSTRUCTION",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "753834552636"
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
              "Csj6DKehA6d4D7ZfCoUD3PccRopQArrRTEQeTzN1GWUV"
            ],
            "status": {
              "SuccessValue": "eyJzY2hlbWUiOiJTZWNwMjU2azEiLCJiaWdfciI6eyJhZmZpbmVfcG9pbnQiOiIwMjdjNjJmOTA2OTc5N2FlYjY2NjI4OWUyYzM1ZTU1NzkzNjljN2IzYTQzMTRmODQyYWU3NTdkN2U1NWQxMmE3NDEifSwicyI6eyJzY2FsYXIiOiI1MDI2ZTI2ZWNjZmU0NjIwZjdmMDZmZTQ0ZGY4ZTBjZTIyZDU2ZWRkYjA2Yjc1MDdmYjBjZGE1Mjk5NmI3MWJjIn0sInJlY292ZXJ5X2lkIjowfQ=="
            },
            "tokens_burnt": "360915675372600000000"
          },
          "proof": [
            {
              "direction": "Left",
              "hash": "214QyKudVeS668TQbq2C8uWzf7Xt9NFWQaAayDeaiDta"
            },
            {
              "direction": "Right",
              "hash": "CaTDhrd4t1qFmMp5HvyW2xy3C8rYVYe5vKrGkfMBHexx"
            }
          ]
        },
        {
          "block_hash": "7DJxVcS197Kk5N77DZZHix5hLFToyRZLkJXcBE6dhYaX",
          "id": "Csj6DKehA6d4D7ZfCoUD3PccRopQArrRTEQeTzN1GWUV",
          "outcome": {
            "executor_id": "counterweight-samet.testnet",
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
              "hash": "4mM8UbCoHG9zatKaBjb6KSeETfKhcuhxPenWcLR648yP"
            }
          ]
        },
        {
          "block_hash": "AFgy4T29sFtEn4mRfSpUWfoPDibSXf55Pv9TfVE42jne",
          "id": "CsGvBV9Jo1mgwaUyhDq6tn3tJRY7pBdVaZcLKo7b8Bup",
          "outcome": {
            "executor_id": "counterweight-samet.testnet",
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
              "hash": "Gks9XzKyLfZSyNGmkUat6nZ4PrF8DQgT4Fx53h428fBv"
            },
            {
              "direction": "Right",
              "hash": "9tpJcdyNsFannM5WapEsiZjaXouP6HfWnnYH8RLvK8wL"
            }
          ]
        },
        {
          "block_hash": "7DJxVcS197Kk5N77DZZHix5hLFToyRZLkJXcBE6dhYaX",
          "id": "ET6aajnVHU1TdJ8FRs9oe7vGLWboeMM2Apy8DRBnyzFA",
          "outcome": {
            "executor_id": "policy-v2.counterweight-samet.testnet",
            "gas_burnt": 2467804854707,
            "logs": [
              "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"4\",\"nonce\":\"1794331863418\",\"expiresAfter\":null,\"signature\":{\"big_r\":{\"affine_point\":\"027c62f9069797aeb666289e2c35e5579369c7b3a4314f842ae757d7e55d12a741\"},\"s\":{\"scalar\":\"5026e26eccfe4620f7f06fe44df8e0ce22d56eddb06b7507fb0cda52996b71bc\"},\"scheme\":\"Secp256k1\",\"recovery_id\":0}}]}",
              "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"withdrawal\",\"data\":[{\"id\":\"4\",\"kind\":\"withdraw3\",\"recipient\":\"0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a\",\"amount\":\"47957074\",\"status\":\"signed\"}]}"
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
                  "gas_used": "690134829495"
                },
                {
                  "cost": "LOG_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "7086626100"
                },
                {
                  "cost": "LOG_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "7655298780"
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
                  "gas_used": "6926028726"
                },
                {
                  "cost": "READ_REGISTER_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "15102991116"
                },
                {
                  "cost": "READ_REGISTER_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "176820228"
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
                  "gas_used": "7137197088"
                },
                {
                  "cost": "STORAGE_WRITE_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "64196736000"
                },
                {
                  "cost": "STORAGE_WRITE_EVICTED_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "40853214504"
                },
                {
                  "cost": "STORAGE_WRITE_KEY_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "352414335"
                },
                {
                  "cost": "STORAGE_WRITE_VALUE_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "38090765892"
                },
                {
                  "cost": "TOUCHING_TRIE_NODE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "54720000000"
                },
                {
                  "cost": "UTF8_DECODING_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "6223558122"
                },
                {
                  "cost": "UTF8_DECODING_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "169116677820"
                },
                {
                  "cost": "WASM_INSTRUCTION",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "336227466960"
                },
                {
                  "cost": "WRITE_MEMORY_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "19626564027"
                },
                {
                  "cost": "WRITE_MEMORY_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "4930027320"
                },
                {
                  "cost": "WRITE_REGISTER_BASE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "20058657402"
                },
                {
                  "cost": "WRITE_REGISTER_BYTE",
                  "cost_category": "WASM_HOST_COST",
                  "gas_used": "9952494552"
                }
              ],
              "version": 4
            },
            "receipt_ids": [
              "FL3RrxbnjqyAdKGtKE4Yrt6rFLSE6W7q2B3wWzHdoKdC"
            ],
            "status": {
              "SuccessValue": "dHJ1ZQ=="
            },
            "tokens_burnt": "246780485470700000000"
          },
          "proof": [
            {
              "direction": "Right",
              "hash": "Hsa6hcx7Ak4HSmUvsapGn4MVDfKRozS8nLY12nJmYnCK"
            }
          ]
        },
        {
          "block_hash": "BwofxS9gyWXcSN52oW1QeyHFYxEBpZ1zqZk13a8sZfYC",
          "id": "FL3RrxbnjqyAdKGtKE4Yrt6rFLSE6W7q2B3wWzHdoKdC",
          "outcome": {
            "executor_id": "counterweight-samet.testnet",
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
              "hash": "todmGcZnv4q54Vhf8TSdBTVuRQczxWGf2vMqDnwn3df"
            }
          ]
        },
        {
          "block_hash": "FRzgXuYoAStjPXwdqaG2NccC6hbyiFwAu3mF47SZQFCf",
          "id": "2dXXLWLN7LPJ22sW1prJcxy9zDd8KMEEif7EVPbUk8D9",
          "outcome": {
            "executor_id": "counterweight-samet.testnet",
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
              "hash": "5ays75hfU9oWb68g8d7he19c1PPKvQhjPWPZWyaezdPD"
            },
            {
              "direction": "Left",
              "hash": "5Gk12khdicdsy68eBnHHxxULRnhzY8oeA2mo2AMW2x9G"
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
              "args": "eyJhbW91bnQiOiI0Nzk1NzA3NCIsInJlY2lwaWVudCI6IjB4YjFhZjhiMWQzMTZlMTExYzEwZmU2YTJlYjNiN2I3NDdlYzM3ZjM2YSJ9",
              "deposit": "0",
              "gas": 300000000000000,
              "method_name": "request_evm_withdrawal"
            }
          }
        ],
        "hash": "9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25",
        "nonce": 277052380000016,
        "priority_fee": 0,
        "public_key": "ed25519:G6Wmxh6djy5Uh5hMAYPAreERcBXgCp73XsruiRoSRNCi",
        "receiver_id": "policy-v2.counterweight-samet.testnet",
        "signature": "ed25519:3Jo12agFyWjA3hK1Q5ZHgcutQFypappdVgMSNi7zkfKnArGUZD5PQdjGFjaoy246SqKc4uz1nZi4NbCAhhhvoHB8",
        "signer_id": "counterweight-samet.testnet"
      },
      "transaction_outcome": {
        "block_hash": "FBST3A3i8kf27ET4VUez2id4JgP3hSE2HrCRwFZkkBHg",
        "id": "9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25",
        "outcome": {
          "executor_id": "counterweight-samet.testnet",
          "gas_burnt": 312827871500,
          "logs": [],
          "metadata": {
            "gas_profile": null,
            "version": 1
          },
          "receipt_ids": [
            "E35uigafRzmoXADr7RjRzKvvaWD7X8RfnNRMUHaDoqtE"
          ],
          "status": {
            "SuccessReceiptId": "E35uigafRzmoXADr7RjRzKvvaWD7X8RfnNRMUHaDoqtE"
          },
          "tokens_burnt": "31282787150000000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "FfemwE8qYCV1BpNxXsDoSCZAUxBMMFGjG9JDkzSBHpWg"
          },
          {
            "direction": "Right",
            "hash": "GNYepAfWw8itRjicd2PhvJHqkwA4RhBkwQnTP7SvyNVs"
          }
        ]
      }
    },
    "verification": {
      "time": 1794332099146,
      "hash": "0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0",
      "delta": {
        "type": "withdraw",
        "usdc": "46.957074",
        "fee": "1.0",
        "nonce": 1794331863418000
      }
    },
    "note": "Read-only recheck. Position-delta checks require rechecking an order before a later order changes its position. Withdrawal ledger confirmation does not prove bridge arrival."
  }
}
```

