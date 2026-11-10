# Testnet lifecycle to-perp — 2026-11-10T19:07:22.076Z

[Public explorer](https://testnet.nearblocks.io/address/policy-v3.counterweight-samet.testnet) · [Public explorer](https://app.hyperliquid-testnet.xyz/explorer/address/0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5) · [Public explorer](https://sepolia.arbiscan.io/address/0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a) · [Public explorer](https://testnet.nearblocks.io/txns/AEk3mDFkuVnVowPzfXRfPBBkk7ympuSR6cZfXk7eNN5s)

Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.

```json
{
  "step": "to-perp",
  "capturedAt": "2026-11-10T19:07:22.076Z",
  "network": "testnet",
  "outcome": "spot-to-perps-balances-verified",
  "commands": [],
  "derived": {
    "address": "0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5",
    "publicKey": "0x049291386cf4ed4a8e0011b19c9ba338397c7ff5f2fded38aac8f2c8c993b69112de24132bd9343b5f927b101a0761dbb9647a25181d728fd61be2ffaafea582df",
    "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    "rootBlockHeight": 277108220,
    "derivedBlockHeight": 277108220
  },
  "market": {
    "assetIndex": 54,
    "szDecimals": 1,
    "mark": "3.5848",
    "funding": "0.0000125",
    "capturedAt": "2026-11-10T19:07:22.945Z",
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
    "block": "3KN7Ty1Jk6nSH6NgfxTmekpZPnS28Q8zYH9wrjVnxxEi",
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
      "last_keeper_heartbeat": "1794336728",
      "reference_price": "3551000",
      "reference_price_timestamp": "1794336728",
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
      "block_hash": "3KN7Ty1Jk6nSH6NgfxTmekpZPnS28Q8zYH9wrjVnxxEi",
      "block_height": 277108222,
      "keys": [
        {
          "access_key": {
            "nonce": 277106639000001,
            "permission": "FullAccess"
          },
          "public_key": "ed25519:6gJq5pWh2SxRxDCDjoo4uGkwEfYBo3EyEWNmJ53igdZZ"
        }
      ]
    },
    "account": {
      "amount": "6297278565110256499999999",
      "block_hash": "3KN7Ty1Jk6nSH6NgfxTmekpZPnS28Q8zYH9wrjVnxxEi",
      "block_height": 277108222,
      "code_hash": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm",
      "locked": "0",
      "storage_paid_at": 0,
      "storage_usage": 344269
    }
  },
  "before": {
    "observedAtMs": 1794337643069,
    "spotClearinghouseState": {
      "balances": [
        {
          "coin": "USDC",
          "token": 0,
          "total": "50.0",
          "hold": "0.0",
          "entryNtl": "0.0"
        }
      ]
    },
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
      "time": 1794337643036
    },
    "userFills": [],
    "ledger": [
      {
        "time": 1794336799753,
        "hash": "0x95cfd4b138dcc2ca9749042dd37ac8010500ec96d3dfe19c39988003f7d09cb5",
        "delta": {
          "type": "send",
          "user": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
          "destination": "0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5",
          "sourceDex": "spot",
          "destinationDex": "spot",
          "token": "USDC",
          "amount": "50.0",
          "usdcValue": "50.0",
          "fee": "1.0",
          "nativeTokenFee": "0.0",
          "nonce": 1794336765941,
          "feeToken": "USDC"
        }
      }
    ],
    "funding": [],
    "openOrders": [],
    "account": {
      "equityText": "0.0",
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
    "contract": "0",
    "token": "0",
    "near": "0"
  },
  "risk": {
    "leverage": 0,
    "reserve": 0.1,
    "stressedMaintenance": 0,
    "headroom": -0.1
  },
  "riskNote": "Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.",
  "command": "near contract call-function as-transaction policy-v3.counterweight-samet.testnet request_usd_class_transfer json-args '{\"amount\":\"49000000\",\"to_perp\":true}' prepaid-gas '300 Tgas' attached-deposit '0 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send",
  "expected": {
    "method": "request_usd_class_transfer",
    "args": {
      "amount": "49000000",
      "to_perp": true
    },
    "caller": "counterweight-samet.testnet",
    "policy": "policy-v3.counterweight-samet.testnet",
    "asset": 54,
    "reduceOnly": false,
    "size": "0",
    "price": "0",
    "recipient": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
    "amount": "49"
  },
  "transferHistory": [
    {
      "time": 1794336799753,
      "hash": "0x95cfd4b138dcc2ca9749042dd37ac8010500ec96d3dfe19c39988003f7d09cb5",
      "delta": {
        "type": "send",
        "user": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
        "destination": "0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5",
        "sourceDex": "spot",
        "destinationDex": "spot",
        "token": "USDC",
        "amount": "50.0",
        "usdcValue": "50.0",
        "fee": "1.0",
        "nativeTokenFee": "0.0",
        "nonce": 1794336765941,
        "feeToken": "USDC"
      }
    }
  ],
  "txHash": "AEk3mDFkuVnVowPzfXRfPBBkk7ympuSR6cZfXk7eNN5s",
  "nearResponse": {
    "final_execution_status": "FINAL",
    "receipts_outcome": [
      {
        "block_hash": "3sbCSdwue6RQD95pQobXCVYG7uJgYCGmicdfcpwxaBms",
        "id": "2mThyR8vC45fp6VP1cVZqfV6G8b3Xb5DvdrWkXX6f3TN",
        "outcome": {
          "executor_id": "policy-v3.counterweight-samet.testnet",
          "gas_burnt": 3031511226869,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"1\",\"caller\":\"counterweight-samet.testnet\",\"kind\":\"UsdClassTransfer\",\"payload\":{\"action\":{\"type\":\"usdClassTransfer\",\"hyperliquidChain\":\"Testnet\",\"signatureChainId\":\"0x66eee\",\"amount\":\"49\",\"toPerp\":true,\"nonce\":1794336738598},\"nonce\":1794336738598},\"digest\":\"150f529fdc2ca0630ea88125959bbe3529e940758bf502806292738ed7f25361\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}"
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
                "gas_used": "10061188218"
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
                "gas_used": "13032960735"
              },
              {
                "cost": "LOG_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3543313050"
              },
              {
                "cost": "LOG_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6216630561"
              },
              {
                "cost": "PROMISE_RETURN",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "560152386"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "11400000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "62636716800"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "7914375306"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "35240312604"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "112262118"
              },
              {
                "cost": "STORAGE_READ_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "169070537247"
              },
              {
                "cost": "STORAGE_READ_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "990481056"
              },
              {
                "cost": "STORAGE_READ_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "4213864004"
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
                "gas_used": "21526866066"
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
                "gas_used": "154537653870"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "280059560352"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "44860717776"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3189537012"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "42982837290"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "6550094772"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "4DiqRSNDVuiKPrADpdLzaAv9CSLCsvqi1oLAM6FirSRA",
            "7dbQaqYxTUDzCTYQir2AhTba6VLMGmjqGHMgUaUELm3b",
            "5ExsMw8B4WkEg9bMhn4Z7Q2KnuPPz2jNhTnMfBnDWBuP"
          ],
          "status": {
            "SuccessReceiptId": "7dbQaqYxTUDzCTYQir2AhTba6VLMGmjqGHMgUaUELm3b"
          },
          "tokens_burnt": "303151122686900000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "9pm7TDKEJt9dBAnZwuHufAgwLzdx5Jm2EJkfa7LufZzX"
          },
          {
            "direction": "Left",
            "hash": "AwFJ8FLMYrbgstFrBBypAXMy3m4uRM2NJBpct8GpDkSk"
          }
        ]
      },
      {
        "block_hash": "2XCQ1KBvPg4xYdSKpbbF2tDbgmKGYfUGKXtc9qbFYEgC",
        "id": "4DiqRSNDVuiKPrADpdLzaAv9CSLCsvqi1oLAM6FirSRA",
        "outcome": {
          "executor_id": "v1.signer-prod.testnet",
          "gas_burnt": 4437608237263,
          "logs": [
            "sign: predecessor=AccountId(\"policy-v3.counterweight-samet.testnet\"), request=SignRequestArgs { path: \"counterweight-1\", payload: Ecdsa(BoundedVec { inner: [21, 15, 82, 159, 220, 44, 160, 99, 14, 168, 129, 37, 149, 155, 190, 53, 41, 233, 64, 117, 139, 245, 2, 128, 98, 146, 115, 142, 215, 242, 83, 97], witness: NonEmpty(()) }), domain_id: DomainId(0) }"
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
                "gas_used": "54720000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "23488768800"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "25959303057"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "10068660744"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "611971458"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5998"
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
                "gas_used": "33654801992"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "128393472000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "192639607386"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5850077961"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "187165864326"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "38760000000"
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
                "gas_used": "753692215848"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "14018974305"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "16955480700"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "14327612430"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "45865869660"
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
            "HZPpfrBNXz23uG3s1V7QqfeN5nNAG1TMCDKJ5NMbpxCU",
            "F3VCQ5AcLeGyiWoYbvhgkhj5tankjomKvi3Kn86FMf9x"
          ],
          "status": {
            "SuccessReceiptId": "HZPpfrBNXz23uG3s1V7QqfeN5nNAG1TMCDKJ5NMbpxCU"
          },
          "tokens_burnt": "443760823726300000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "7At9JYYK88ur9CdAaB8ttDmZVa2iSmY7UCXDKP6jmUwk"
          },
          {
            "direction": "Left",
            "hash": "94z8egwJhySVTb5BuoocGwfCgitK8ajM8nzMkp4uCDQY"
          }
        ]
      },
      {
        "block_hash": "Cf1kX3Jik487oNQYR8H1kSu9WUK81eBi9PggmgYUujeR",
        "id": "HZPpfrBNXz23uG3s1V7QqfeN5nNAG1TMCDKJ5NMbpxCU",
        "outcome": {
          "executor_id": "v1.signer-prod.testnet",
          "gas_burnt": 3624176791170,
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
                "gas_used": "23651893926"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "12585825930"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "639568818"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "1"
              },
              {
                "cost": "STORAGE_LARGE_READ_OVERHEAD_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5998"
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
                "gas_used": "33654801992"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "192639607386"
              },
              {
                "cost": "STORAGE_WRITE_KEY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "352414335"
              },
              {
                "cost": "STORAGE_WRITE_VALUE_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "186049196922"
              },
              {
                "cost": "TOUCHING_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "34200000000"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "762186348792"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "16822769166"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "17718136860"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "17193134916"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "45770830560"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "8jrQgTFv9Ke1F4YwTXsFJgSoVpxd3sk9G4y17wHr2x5C"
          ],
          "status": {
            "SuccessValue": "eyJzY2hlbWUiOiJTZWNwMjU2azEiLCJiaWdfciI6eyJhZmZpbmVfcG9pbnQiOiIwMzk2MjJlMTY4ZGMwNmRiMzZiZDIxYjRlYTU0ZjNkMGM4YTYyMjU5ZTE5ZWFhMGFiN2ZkYjFjY2E3ODc0YWViM2QifSwicyI6eyJzY2FsYXIiOiI3ZDhkNTBiNGM2ZDY3MTQ3ZjljODYxZWEyYzdiODRmNmY4MGExYzAxNTUxMzcwNzhhOWY4MzEyNDgzMTlkMTYyIn0sInJlY292ZXJ5X2lkIjoxfQ=="
          },
          "tokens_burnt": "362417679117000000000"
        },
        "proof": [
          {
            "direction": "Left",
            "hash": "CX3E7jJu8Krat7FXYeCjnjK51ntbTE68prDvXhm3mwoD"
          }
        ]
      },
      {
        "block_hash": "GtBezjo5H2ATXE4ayYVehX9sPxkP8eY8XAqo2sQ7imQ2",
        "id": "8jrQgTFv9Ke1F4YwTXsFJgSoVpxd3sk9G4y17wHr2x5C",
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
            "hash": "GV7sSuEKXepYizeu7S4BGcwGRoYEyKsFWdU2Jo6tWjif"
          },
          {
            "direction": "Right",
            "hash": "4XrHiRUrML5mwYpWaEWFgpN2J7ckyNV9PeSXXWahqfx5"
          }
        ]
      },
      {
        "block_hash": "GG4dW7Ua11uxv1FKJEMddWhQZhvpDRLGpME4798BquKy",
        "id": "F3VCQ5AcLeGyiWoYbvhgkhj5tankjomKvi3Kn86FMf9x",
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
            "hash": "8RdAMtkkDdW3KRGG1ZdpEnkdR78fQd8pzVKkhEk7xC7q"
          }
        ]
      },
      {
        "block_hash": "GtBezjo5H2ATXE4ayYVehX9sPxkP8eY8XAqo2sQ7imQ2",
        "id": "7dbQaqYxTUDzCTYQir2AhTba6VLMGmjqGHMgUaUELm3b",
        "outcome": {
          "executor_id": "policy-v3.counterweight-samet.testnet",
          "gas_burnt": 1968769399968,
          "logs": [
            "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"1\",\"nonce\":\"1794336738598\",\"expiresAfter\":null,\"signature\":{\"big_r\":{\"affine_point\":\"039622e168dc06db36bd21b4ea54f3d0c8a62259e19eaa0ab7fdb1cca7874aeb3d\"},\"s\":{\"scalar\":\"7d8d50b4c6d67147f9c861ea2c7b84f6f80a1c0155137078a9f831248319d162\"},\"scheme\":\"Secp256k1\",\"recovery_id\":1}}]}"
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
                "gas_used": "4857155088"
              },
              {
                "cost": "READ_CACHED_TRIE_NODE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "9120000000"
              },
              {
                "cost": "READ_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "15659179200"
              },
              {
                "cost": "READ_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3991399650"
              },
              {
                "cost": "READ_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "15102991116"
              },
              {
                "cost": "READ_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "119851392"
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
                "gas_used": "3894036776"
              },
              {
                "cost": "STORAGE_WRITE_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "64196736000"
              },
              {
                "cost": "STORAGE_WRITE_EVICTED_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "22289411058"
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
                "gas_used": "107301616272"
              },
              {
                "cost": "WASM_INSTRUCTION",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "214238257596"
              },
              {
                "cost": "WRITE_MEMORY_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "19626564027"
              },
              {
                "cost": "WRITE_MEMORY_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "3355687104"
              },
              {
                "cost": "WRITE_REGISTER_BASE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "20058657402"
              },
              {
                "cost": "WRITE_REGISTER_BYTE",
                "cost_category": "WASM_HOST_COST",
                "gas_used": "5557886568"
              }
            ],
            "version": 4
          },
          "receipt_ids": [
            "FjrvRMgX3XXSMwsgsuwiBDpsk2TmnyuTyJc3sxru69SW"
          ],
          "status": {
            "SuccessValue": "dHJ1ZQ=="
          },
          "tokens_burnt": "196876939996800000000"
        },
        "proof": [
          {
            "direction": "Right",
            "hash": "H6c9fhDoRAW9x75tN8Hke44fxEdR3xQpMx5HWCQKJdeP"
          },
          {
            "direction": "Left",
            "hash": "7GkVLWvDZavexuXGiWW5BES6pRgpiqK8rUnAmNUczXSd"
          }
        ]
      },
      {
        "block_hash": "FpkFSC9BbqT9WXzyENbuVGqAVGFbbSWQJeVzWaNZSnRB",
        "id": "FjrvRMgX3XXSMwsgsuwiBDpsk2TmnyuTyJc3sxru69SW",
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
            "hash": "EUFqK76wjq3N2x8SJpZtCj7cPSR7T5SQkgmhBzk44wDP"
          }
        ]
      },
      {
        "block_hash": "2XCQ1KBvPg4xYdSKpbbF2tDbgmKGYfUGKXtc9qbFYEgC",
        "id": "5ExsMw8B4WkEg9bMhn4Z7Q2KnuPPz2jNhTnMfBnDWBuP",
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
            "hash": "EPHwz7FJBHEiMgvr9Nx4hmeLA69HhfQ2DnpysYrGWRL1"
          },
          {
            "direction": "Right",
            "hash": "Ejv5VFtbXF4ioqpthogZ14hBNhRyeDVZj6deM9YoD6rs"
          },
          {
            "direction": "Right",
            "hash": "5638wnV86nYRBVATrgRcViAuT1H5UjtzYDZkwbm5P4Jh"
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
            "args": "eyJhbW91bnQiOiI0OTAwMDAwMCIsInRvX3BlcnAiOnRydWV9",
            "deposit": "0",
            "gas": 300000000000000,
            "method_name": "request_usd_class_transfer"
          }
        }
      ],
      "hash": "AEk3mDFkuVnVowPzfXRfPBBkk7ympuSR6cZfXk7eNN5s",
      "nonce": 277052380000019,
      "priority_fee": 0,
      "public_key": "ed25519:G6Wmxh6djy5Uh5hMAYPAreERcBXgCp73XsruiRoSRNCi",
      "receiver_id": "policy-v3.counterweight-samet.testnet",
      "signature": "ed25519:4Lijnu1VXTZQk8rg3TLfeApMwdf7qdev3YaCSvMc872iR9czRtPpwHPnScXhM2PPoeNbbzmY45hbfMqwZuPFWnaH",
      "signer_id": "counterweight-samet.testnet"
    },
    "transaction_outcome": {
      "block_hash": "ErSrbyTHS6k1UE92kZvQLn8ziXmQLDS7x7DzL3brHrfU",
      "id": "AEk3mDFkuVnVowPzfXRfPBBkk7ympuSR6cZfXk7eNN5s",
      "outcome": {
        "executor_id": "counterweight-samet.testnet",
        "gas_burnt": 311015890330,
        "logs": [],
        "metadata": {
          "gas_profile": null,
          "version": 1
        },
        "receipt_ids": [
          "2mThyR8vC45fp6VP1cVZqfV6G8b3Xb5DvdrWkXX6f3TN"
        ],
        "status": {
          "SuccessReceiptId": "2mThyR8vC45fp6VP1cVZqfV6G8b3Xb5DvdrWkXX6f3TN"
        },
        "tokens_burnt": "31101589033000000000"
      },
      "proof": [
        {
          "direction": "Left",
          "hash": "ZvvfcDLSo1nr5c3KvZxexQoUQMNRATkTgM8J48v3QTr"
        },
        {
          "direction": "Right",
          "hash": "EBZj5t51sV6rzCoEAZsZHw9G5XGthT64n5hPot8zTsE8"
        },
        {
          "direction": "Right",
          "hash": "3TEiDhTH7P2PdkKkL124fzKdSvdt3dYWJspKRwmwSRz7"
        }
      ]
    }
  },
  "parsed": {
    "input": {
      "scheme": "user",
      "network": "testnet",
      "action": {
        "type": "usdClassTransfer",
        "amount": "49",
        "toPerp": true,
        "nonce": 1794336738598
      }
    },
    "digest": "0x150f529fdc2ca0630ea88125959bbe3529e940758bf502806292738ed7f25361",
    "signature": {
      "r": "0x9622e168dc06db36bd21b4ea54f3d0c8a62259e19eaa0ab7fdb1cca7874aeb3d",
      "s": "0x7d8d50b4c6d67147f9c861ea2c7b84f6f80a1c0155137078a9f831248319d162",
      "v": 28
    },
    "blocks": [
      "3sbCSdwue6RQD95pQobXCVYG7uJgYCGmicdfcpwxaBms",
      "GtBezjo5H2ATXE4ayYVehX9sPxkP8eY8XAqo2sQ7imQ2"
    ],
    "nonce": 1794336738598
  },
  "checks": [
    {
      "block": "3sbCSdwue6RQD95pQobXCVYG7uJgYCGmicdfcpwxaBms",
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
        "pending": {
          "id": 1,
          "kind": "UsdClassTransfer",
          "amount": "49000000",
          "phase": "AwaitingCallback",
          "nonce": 1794336738598,
          "expires_after": null,
          "keeper": false,
          "callback_deadline_ms": 1794336798598
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
        "daily_usage": "0",
        "usage_day": 20767,
        "operation_id": "1",
        "last_keeper_heartbeat": "1794336728",
        "reference_price": "3551000",
        "reference_price_timestamp": "1794336728",
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
        "block_hash": "3sbCSdwue6RQD95pQobXCVYG7uJgYCGmicdfcpwxaBms",
        "block_height": 277106667,
        "keys": [
          {
            "access_key": {
              "nonce": 277106639000001,
              "permission": "FullAccess"
            },
            "public_key": "ed25519:6gJq5pWh2SxRxDCDjoo4uGkwEfYBo3EyEWNmJ53igdZZ"
          }
        ]
      },
      "account": {
        "amount": "6297278565110256499999999",
        "block_hash": "3sbCSdwue6RQD95pQobXCVYG7uJgYCGmicdfcpwxaBms",
        "block_height": 277106667,
        "code_hash": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm",
        "locked": "0",
        "storage_paid_at": 0,
        "storage_usage": 344313
      }
    },
    {
      "block": "GtBezjo5H2ATXE4ayYVehX9sPxkP8eY8XAqo2sQ7imQ2",
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
        "last_keeper_heartbeat": "1794336728",
        "reference_price": "3551000",
        "reference_price_timestamp": "1794336728",
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
        "block_hash": "GtBezjo5H2ATXE4ayYVehX9sPxkP8eY8XAqo2sQ7imQ2",
        "block_height": 277106676,
        "keys": [
          {
            "access_key": {
              "nonce": 277106639000001,
              "permission": "FullAccess"
            },
            "public_key": "ed25519:6gJq5pWh2SxRxDCDjoo4uGkwEfYBo3EyEWNmJ53igdZZ"
          }
        ]
      },
      "account": {
        "amount": "6297278565110256499999999",
        "block_hash": "GtBezjo5H2ATXE4ayYVehX9sPxkP8eY8XAqo2sQ7imQ2",
        "block_height": 277106676,
        "code_hash": "MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm",
        "locked": "0",
        "storage_paid_at": 0,
        "storage_usage": 344269
      }
    }
  ],
  "recovered": "0xb4b87e81E185B7Ad1911CBF5D1EE3729c92d62a5",
  "request": {
    "action": {
      "type": "usdClassTransfer",
      "amount": "49",
      "toPerp": true,
      "nonce": 1794336738598,
      "signatureChainId": "0x66eee",
      "hyperliquidChain": "Testnet"
    },
    "nonce": 1794336738598,
    "signature": {
      "r": "0x9622e168dc06db36bd21b4ea54f3d0c8a62259e19eaa0ab7fdb1cca7874aeb3d",
      "s": "0x7d8d50b4c6d67147f9c861ea2c7b84f6f80a1c0155137078a9f831248319d162",
      "v": 28
    }
  },
  "httpStatus": 200,
  "hyperliquidResponse": {
    "status": "ok",
    "response": {
      "type": "default"
    }
  },
  "after": {
    "observedAtMs": 1794337645770,
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
      "time": 1794337645792
    },
    "userFills": [],
    "ledger": [
      {
        "time": 1794336799753,
        "hash": "0x95cfd4b138dcc2ca9749042dd37ac8010500ec96d3dfe19c39988003f7d09cb5",
        "delta": {
          "type": "send",
          "user": "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
          "destination": "0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5",
          "sourceDex": "spot",
          "destinationDex": "spot",
          "token": "USDC",
          "amount": "50.0",
          "usdcValue": "50.0",
          "fee": "1.0",
          "nativeTokenFee": "0.0",
          "nonce": 1794336765941,
          "feeToken": "USDC"
        }
      },
      {
        "time": 1794337645421,
        "hash": "0xc952ed9afa795fa8cacc042dd3af4e0111000580957c7e7a6d1b98edb97d3993",
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
  "verification": {
    "amount": "49",
    "spotBefore": "50000000",
    "spotAfter": "1000000",
    "perpsBefore": 0,
    "perpsAfter": 49
  }
}
```

