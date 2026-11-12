# Testnet lifecycle spot — 2026-11-12T17:35:33.035Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v3.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "spot",
  "capturedAt": "2026-11-12T17:35:33.035Z",
  "network": "testnet",
  "outcome": "spot-owner-commands-printed",
  "commands": [
    "near contract call-function as-transaction wrap.testnet storage_deposit json-args '{\"account_id\":\"policy-v3.counterweight-samet.testnet\",\"registration_only\":true}' prepaid-gas '30 Tgas' attached-deposit '0.01 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction wrap.testnet storage_deposit json-args '{\"account_id\":\"counterweight-samet.testnet\",\"registration_only\":true}' prepaid-gas '30 Tgas' attached-deposit '0.01 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction wrap.testnet near_deposit json-args '{}' prepaid-gas '30 Tgas' attached-deposit '4 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send",
    "near contract call-function as-transaction wrap.testnet ft_transfer_call json-args '{\"receiver_id\":\"policy-v3.counterweight-samet.testnet\",\"amount\":\"4000000000000000000000000\",\"msg\":\"\"}' prepaid-gas '100 Tgas' attached-deposit '1 yoctoNEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send"
  ],
  "derived": {
    "address": "0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5",
    "publicKey": "0x049291386cf4ed4a8e0011b19c9ba338397c7ff5f2fded38aac8f2c8c993b69112de24132bd9343b5f927b101a0761dbb9647a25181d728fd61be2ffaafea582df",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277394549,
    "derivedBlockHeight": 277394549
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.3838",
    "funding": "0.0000125",
    "capturedAt": "2026-11-12T17:35:33.883Z",
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
    "block": "CaGXg2p1R9i53pUrh1onynARSe54CCvhY88VhaU7WmGR",
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
      "spot_balance": "0",
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
      "reference_price": "3394700",
      "reference_price_timestamp": "1794504657",
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
      "block_hash": "CaGXg2p1R9i53pUrh1onynARSe54CCvhY88VhaU7WmGR",
      "block_height": 277394560,
      "keys": []
    },
    "account": {
      "amount": "6297237963885256499999999",
      "block_hash": "CaGXg2p1R9i53pUrh1onynARSe54CCvhY88VhaU7WmGR",
      "block_height": 277394560,
      "code_hash": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 344187
    }
  },
  "before": {
    "observedAtMs": 1794504942484,
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
      "time": 1794504942450
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
    "contract": "0",
    "token": "0",
    "near": "0"
  },
  "risk": {
    "leverage": 0,
    "reserve": 0.1,
    "stressedMaintenance": 0,
    "headroom": 48.9
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately."
}
```

# Testnet lifecycle spot — 2026-11-12T17:36:04.228Z



Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "spot",
  "capturedAt": "2026-11-12T17:36:04.228Z",
  "network": "testnet",
  "outcome": "failed-before-submission",
  "commands": [],
  "error": "NEAR RPC HTTP 429"
}
```

# Testnet lifecycle spot — 2026-11-12T17:36:08.314Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v3.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a) · [Public explorer](https://testnet.nearblocks.io/txns/6Y8MaKavd49GAc7pTCSTzKf39qA5LmjKhPaC5SD6p4ia)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "spot",
  "capturedAt": "2026-11-12T17:36:08.314Z",
  "network": "testnet",
  "outcome": "spot-deposit-custody-verified",
  "commands": [],
  "derived": {
    "address": "0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5",
    "publicKey": "0x049291386cf4ed4a8e0011b19c9ba338397c7ff5f2fded38aac8f2c8c993b69112de24132bd9343b5f927b101a0761dbb9647a25181d728fd61be2ffaafea582df",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277394602,
    "derivedBlockHeight": 277394602
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.3895",
    "funding": "0.0000125",
    "capturedAt": "2026-11-12T17:36:09.167Z",
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
    "block": "8zyFkr864r3jGn4m8oW4g3z7BKH81sFmZ6HRAhRPAhSr",
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
      "block_hash": "8zyFkr864r3jGn4m8oW4g3z7BKH81sFmZ6HRAhRPAhSr",
      "block_height": 277394604,
      "keys": []
    },
    "account": {
      "amount": "6297237963885256499999999",
      "block_hash": "8zyFkr864r3jGn4m8oW4g3z7BKH81sFmZ6HRAhRPAhSr",
      "block_height": 277394604,
      "code_hash": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 344187
    }
  },
  "before": {
    "observedAtMs": 1794504969241,
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
      "time": 1794504969178
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
  "spot-tx": {
    "final_execution_status": "FINAL",
    "receipts_outcome": [
      {
        "block_hash": "3fw6GhpzsdtRoXssmkJahJ7Lt7SxDKVcgFotwdy8rXEw",
        "id": "FHW2JBnF4zZCE2F8fmR65zu3pFdxYKWjNWSKSGeT7AqA",
        "outcome": {
          "executor_id": "wrap.testnet",
          "gas_burnt": 2667976343943,
          "logs": [
            "Transfer 4000000000000000000000000 from counterweight-samet.testnet to policy-v3.counterweight-samet.testnet"
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
                "gas_used": "93480000000"
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
                "gas_used": "79800000000"
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
            "GyTuSxzJytfvoXv4fvFMpM3ZUsyRoAxjHasuSCiPR1i8",
            "H4Y7kgouhUpN3H1thGZEE8LanyDhf2HEFdjyeJfL5fTY",
            "5A7xjUK82oTws8YkGLTXWLVM8sLASX5cg6FSA8nmmdcg"
          ],
          "status": {
            "SuccessReceiptId": "H4Y7kgouhUpN3H1thGZEE8LanyDhf2HEFdjyeJfL5fTY"
          },
          "tokens_burnt": "266797634394300000000"
        },
        "proof": [
          {
            "direction": "Right",
            "hash": "5KpmHuLx6KMVpjND66miW2Hw37dtMW19tyBZez1wDgcC"
          },
          {
            "direction": "Left",
            "hash": "9dxCvdmt5AfkcL3RtcTAYBw4nFW2gx9DNmsLrGj1ogk5"
          }
        ]
      },
      {
        "block_hash": "EBxXhf7LFsqN73cVnAA5kZPAtCkc4XZqLq3C9eVqxeL6",
        "id": "GyTuSxzJytfvoXv4fvFMpM3ZUsyRoAxjHasuSCiPR1i8",
        "outcome": {
          "executor_id": "policy-v3.counterweight-samet.testnet",
          "gas_burnt": 1715574891176,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"deposit\",\"data\":[{\"amount\":\"4000000000000000000000000\",\"sender_id\":\"counterweight-samet.testnet\"}]}"
          ],
          "metadata": {
            "contracts": [
              {
                "local": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm"
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
                "gas_used": "2177800515"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "9120000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "13049316000"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3147503724"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "7551495558"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "74020062"
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
                "gas_used": "20162050350"
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
                "gas_used": "48110779035"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "114207583116"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "11215179444"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "2089133124"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "11462089944"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4987651968"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "7yzybToDMZUgrFFgNNKEVpaiNv4ECRLxnGVb8oxMdTin"
          ],
          "status": {
            "SuccessValue": "IjAi"
          },
          "tokens_burnt": "171557489117600000000"
        },
        "proof": [
          {
            "direction": "Right",
            "hash": "ASJngV3UU7fpdBop4wmmx3j4FvzGR4jgF1nSay6wWvu4"
          },
          {
            "direction": "Left",
            "hash": "GqFsmWXufwqnUrdWQGFTpR4QHmpKUjCUyay955aQsqbC"
          }
        ]
      },
      {
        "block_hash": "HZ4sXoppNTpnSEFjJpRymBp3qx8qiy5kQ1Sx6P3TMear",
        "id": "7yzybToDMZUgrFFgNNKEVpaiNv4ECRLxnGVb8oxMdTin",
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
        "block_hash": "HZ4sXoppNTpnSEFjJpRymBp3qx8qiy5kQ1Sx6P3TMear",
        "id": "H4Y7kgouhUpN3H1thGZEE8LanyDhf2HEFdjyeJfL5fTY",
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
                "gas_used": "29640000000"
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
            "DwrJ2wnDjf7chhTuL9r96TQApcV2kSCQseEHYUUDbf2D"
          ],
          "status": {
            "SuccessValue": "IjQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAi"
          },
          "tokens_burnt": "137364502549700000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "wFbjNawxzRC2sfeBMJU4J5tJ1ya9JKrTzqhcZPLNk3N"
          },
          {
            "direction": "Left",
            "hash": "88dj6a2Tv6rmd1iYpocpAeNkoE2ztwB2ACkR6NJ1AsgH"
          },
          {
            "direction": "Right",
            "hash": "G2XtQvudxSTa1vx4Br2i4WGJZTBsmABPvDzYifkK6NUy"
          }
        ]
      },
      {
        "block_hash": "89uEsByWfJNimGHyMjBUnJy5L3QufWJiDcKh1su3V5pU",
        "id": "DwrJ2wnDjf7chhTuL9r96TQApcV2kSCQseEHYUUDbf2D",
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
        "block_hash": "EBxXhf7LFsqN73cVnAA5kZPAtCkc4XZqLq3C9eVqxeL6",
        "id": "5A7xjUK82oTws8YkGLTXWLVM8sLASX5cg6FSA8nmmdcg",
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
            "hash": "45J9BHpfeEsF9QeomsDDM5Jsnh7BzBfAUxkBLG2mMnua"
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
            "args": "eyJhbW91bnQiOiI0MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwibXNnIjoiIiwicmVjZWl2ZXJfaWQiOiJwb2xpY3ktdjMuY291bnRlcndlaWdodC1zYW1ldC50ZXN0bmV0In0=",
            "deposit": "1",
            "gas": 100000000000000,
            "method_name": "ft_transfer_call"
          }
        }
      ],
      "hash": "6Y8MaKavd49GAc7pTCSTzKf39qA5LmjKhPaC5SD6p4ia",
      "nonce": 277052380000026,
      "priority_fee": 0,
      "public_key": "ed25519:G6Wmxh6djy5Uh5hMAYPAreERcBXgCp73XsruiRoSRNCi",
      "receiver_id": "wrap.testnet",
      "signature": "ed25519:CsmkJziL3RXdoDHSrWYSfdYYaMFax2FaxKp3AAfHY7s6MLn2z5KK19pMyDL8D8ZGzURp1Y2HDHFjqWbSzjbqdZY",
      "signer_id": "counterweight-samet.testnet"
    },
    "transaction_outcome": {
      "block_hash": "8RpWe13mDq7hh1ziLJeMDEkxyrV7bGSX9LreXwmTEz7e",
      "id": "6Y8MaKavd49GAc7pTCSTzKf39qA5LmjKhPaC5SD6p4ia",
      "outcome": {
        "executor_id": "counterweight-samet.testnet",
        "gas_burnt": 313638494655,
        "logs": [],
        "metadata": {
          "gas_profile": null,
          "version": 1
        },
        "receipt_ids": [
          "FHW2JBnF4zZCE2F8fmR65zu3pFdxYKWjNWSKSGeT7AqA"
        ],
        "status": {
          "SuccessReceiptId": "FHW2JBnF4zZCE2F8fmR65zu3pFdxYKWjNWSKSGeT7AqA"
        },
        "tokens_burnt": "31363849465500000000"
      },
      "proof": [
        {
          "direction": "Right",
          "hash": "Ahhv8Y3nC16yxKHpZyTvd13fMQTDcGRJAcMSNDknRC1G"
        },
        {
          "direction": "Right",
          "hash": "HrUQEQuqQzSUuHxN44SHsCmX5soPm9HqjqeTVEjmwGJh"
        }
      ]
    }
  }
}
```

