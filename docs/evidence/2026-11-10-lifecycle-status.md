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

