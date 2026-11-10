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

