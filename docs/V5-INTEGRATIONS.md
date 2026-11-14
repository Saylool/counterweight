# V5 integration verification — 14 November 2026

This is a prepared release, not evidence of an executed v5 mainnet trade.

## Pyth on NEAR

Pyth's [supported chains documentation](https://docs.pyth.network/pro/use-prices-on-blockchain#no-longer-supported) lists NEAR as no longer supported from 26 August 2026. Its current [contract address registry](https://docs.pyth.network/pro/contract-addresses) does not publish a maintained NEAR deployment. We therefore cannot authenticate a current NEAR mainnet contract account or assert that a historical account implements today's interface. V5 deliberately keeps `oracle.account_id: null`; it does not invent an account to make the plan appear oracle-backed.

The [official symbol service](https://pyth.dourolabs.app/v1/symbols?query=NEAR&asset_type=crypto) identifies `Crypto.NEAR/USD`, exponent −8, price feed ID `c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750`. Lazer ID 27 is a different identifier. Feed identity alone does not establish an operating NEAR deployment.

The existing contract requests `get_price_no_older_than({price_id, age})`, expecting an optional price/conf/expo/publish_time object. A future verified account can use that authenticated callback path; the run preparation calls `refresh_oracle` before opening or closing when an authenticated account is configured. Current v5 mainnet uses the documented tight-band fallback. It cannot claim oracle-priced mainnet opens/closes. A stale or failed callback does not authorize an unrestricted caller mark.

## Why the existing sale adapter cannot execute real 1Click

The official [1Click request flow](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request) uses an `ORIGIN_CHAIN` quote's exact `depositAddress`, followed by a transfer to that address. `INTENTS` deposit mode instead requires a signed intent. The verifier's [deposit interface](https://docs.near-intents.org/integration/verifier-contract/deposits-and-withdrawals/deposits) accepts an empty message, an account identifier, or a `DepositMessage` with a `receiver_id` and defined deposit semantics.

`approve_spot_sale` currently sends `ft_transfer_call` to a configured static adapter with custom JSON (`route_id`, source/destination chain, token, recipient, `min_usdc`, etc.). `SaleQuote` cannot bind a dynamic 1Click deposit address. That message is not the documented verifier deposit message, and this contract does not sign an INTENTS deposit-mode intent. Substituting `intents.near` for the mock adapter would not make the route valid.

The current sale destination is fixed to Hypercore USDC. Official [Hyperliquid integration documentation](https://docs.near-intents.org/integration/distribution-channels/1click-api/hyperliquid) specifies eight decimals for Hypercore USDC, whereas the existing reconciliation ledger treats USDC as six decimals. Its owner attestation also does not independently prove a 1Click delivery. It cannot safely route arbitrary owner-selected USDC payouts with this ABI.

A production integration needs exact quote/deposit destination binding, refund and expiry handling, the documented deposit or signed-intent flow, explicit asset-unit conversion, and end-to-end receipt tests. This was excluded from v5 under the deadline. No live quote, API token, transfer, or fabricated route proof was used. Do not run a 1 wNEAR sale against this adapter. Existing mock-adapter limitations and every other known issue remain disclosed in `KNOWN-ISSUES.md`.
