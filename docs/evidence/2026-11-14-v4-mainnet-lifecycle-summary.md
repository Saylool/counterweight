# Policy v4 mainnet lifecycle — 14 November 2026

Reverified read-only at **2026-11-14T13:36:58.927224+00:00**. Policy [`cw4.haxheton.near`](https://nearblocks.io/address/cw4.haxheton.near#keys) has **0 access keys**, owner `haxheton.near`, keeper `keeper4.haxheton.near`, signer `v1.signer`, path `counterweight-mainnet-v4`, and derived Hyperliquid address `0xb6a1d45ba9154067b7981e2b4b676393c75b0d26`.

One **owner-supervised, tiny-size mainnet lifecycle** completed: 20 USDC to perps; 3.6 wNEAR custody; 3.6 NEAR short open and reduce-only close; owner settlement; 18.886709 USDC gross withdrawal; 17.886709 native USDC arrived on Arbitrum One; reconciliation; 3.6 wNEAR returned. Final positions/orders and policy spot balance are zero. No autonomous mainnet keeper or audit is claimed.

## Verification method

Finalized NEAR query/tx, Hyperliquid info POST only, Arbitrum JSON-RPC receipt/block only; Nearblocks public indexer used only to discover omitted transaction hashes, then NEAR RPC reverified. Initial Python urllib Arbitrum HTTP 403 was resolved by curl User-Agent Mozilla/5.0 against the same endpoint.

The [machine-readable summary](2026-11-14-v4-mainnet-lifecycle-summary.json) includes compact public API results, complete decoded transaction actions/event logs, historical access-key proofs and source filenames. v1.signer public-key derivation was independently recomputed locally and matched its `derived_public_key` public view at block 224520876. No signing, exchange submission, keychain access or paid API was used.

## Lifecycle and setup proof table

| Step | Amount/result | NEAR transaction | Venue/Arbitrum transaction | Verification and notes |
| --- | --- | --- | --- | --- |
| Create policy account | 7 NEAR | [7PrZ6ScJvgGqPCLaeozyckMUfbnLpfZjdMUSzrTsMejw](https://nearblocks.io/txns/7PrZ6ScJvgGqPCLaeozyckMUfbnLpfZjdMUSzrTsMejw) | — | live NEAR RPC. Created with a setup access key; key deletion followed deployment. |
| Create keeper | 0.1 NEAR | [6EUFAoo82mXHBwhGgNSyCYhDNgDyVWJrewbbKSZgWoU5](https://nearblocks.io/txns/6EUFAoo82mXHBwhGgNSyCYhDNgDyVWJrewbbKSZgWoU5) | — | live NEAR RPC.  |
| Deploy/init v4 | Mainnet / NEAR asset 74 | [FSS5BSu96DhDw1m29wVFsYNqEV1UkAqgkNs8FKk4cbp7](https://nearblocks.io/txns/FSS5BSu96DhDw1m29wVFsYNqEV1UkAqgkNs8FKk4cbp7) | — | live NEAR RPC. Owner haxheton.near; keeper keeper4.haxheton.near; signer v1.signer; code hash 3fCQcNC7KLrfQzYdfQnfbkdpxzfvDp1whUCJqDmk4ivc. |
| Configure signer resources | 1 yoctoNEAR MPC fee; 230+30 Tgas | [HzTRbvGrnvQ871E8vTXhcSjxwGRMimKTovNo3G9PsSGz](https://nearblocks.io/txns/HzTRbvGrnvQ871E8vTXhcSjxwGRMimKTovNo3G9PsSGz) | — | live NEAR RPC.  |
| Configure margin limits | 20 USDC cap; 1 + 0.1 USDC reserves | [FgvGvzBZ2Mjk3wBSxEbqB8ynZrc6prvM1uwifXFev6eW](https://nearblocks.io/txns/FgvGvzBZ2Mjk3wBSxEbqB8ynZrc6prvM1uwifXFev6eW) | — | live NEAR RPC.  |
| Keeper liquidity top-up | +0.6 NEAR (0.7 NEAR funded total) | [6Nu5k3Uas6wdYACNx64tGCR2ufVDmxbzuyDHJF146X4W](https://nearblocks.io/txns/6Nu5k3Uas6wdYACNx64tGCR2ufVDmxbzuyDHJF146X4W) | — | live NEAR RPC. Actual prepaid-gas liquidity need differs from final gas burned. |
| Cancel-signature smoke check | order_id 0; signature only | [ZGnrQPWDZkPuskhTwF9fJbqfSe8ctFFpDT2tsrQMPeW](https://nearblocks.io/txns/ZGnrQPWDZkPuskhTwF9fJbqfSe8ctFFpDT2tsrQMPeW) | — | live NEAR RPC. No Hyperliquid relay is evidenced for this setup signature. |
| Delete policy access key | 0 remaining keys | [6madPJoAh4ZS4BCEz6LsmfyNB6hVvf9WKPhZ8TQeEKuz](https://nearblocks.io/txns/6madPJoAh4ZS4BCEz6LsmfyNB6hVvf9WKPhZ8TQeEKuz) | — | live NEAR RPC. Live and historical keys=[] at transfer/open/close/withdraw blocks; deployment itself used the temporary setup key. |
| Fund Hyperliquid spot wallet | 21 USDC; ledger separately reports 1 USDC fee | — | [0xf00eab0b8114a95bf1880448c6a78302044200f11c17c82e93d7565e40188346](https://app.hyperliquid.xyz/explorer/tx/0xf00eab0b8114a95bf1880448c6a78302044200f11c17c82e93d7565e40188346) | live Hyperliquid ledger. Initial owner-to-policy spot send; separate from withdrawal bridge fee and trading lifecycle costs. |
| usdClassTransfer to perps | 20 USDC | [AVxzs7ai9eC17i1wTW5mNNcsdp9U3uiLK2jEbtFTTkdc](https://nearblocks.io/txns/AVxzs7ai9eC17i1wTW5mNNcsdp9U3uiLK2jEbtFTTkdc) | [0x788997d204c8dc527a030448c6bade02012e00b79fcbfb241c524324c3ccb63d](https://app.hyperliquid.xyz/explorer/tx/0x788997d204c8dc527a030448c6bade02012e00b79fcbfb241c524324c3ccb63d) | live NEAR RPC + Hyperliquid ledger. 1 USDC remained in the separate spot wallet. |
| Register owner wNEAR storage | 0.01 NEAR attached | [8CeUMpnYFVCGxBS5Rz7ZzvsKPZBqJBHeYNPui1iaZoYy](https://nearblocks.io/txns/8CeUMpnYFVCGxBS5Rz7ZzvsKPZBqJBHeYNPui1iaZoYy) | — | live NEAR RPC. Storage receipt total 0.00125 NEAR; attachment is not a measured permanent fee. |
| Register policy wNEAR storage | 0.01 NEAR attached | [2E5ormRvEmNSwcrvDKXMKiYHCRj6Fpp6vbTYetkTRhRC](https://nearblocks.io/txns/2E5ormRvEmNSwcrvDKXMKiYHCRj6Fpp6vbTYetkTRhRC) | — | live NEAR RPC. Storage receipt total 0.00125 NEAR; attachment is not a measured permanent fee. |
| Wrap spot backing | 3.6 NEAR → 3.6 wNEAR | [GWR2AETHNK7fThA7xmdP37evXYvrJfgyN5kjgbfzsoTq](https://nearblocks.io/txns/GWR2AETHNK7fThA7xmdP37evXYvrJfgyN5kjgbfzsoTq) | — | live NEAR RPC.  |
| Deposit spot custody | 3.6 wNEAR | [63Rrz4SdvPQgU33QSbZ6EoMszqbLEaF9AJ7eKbUGQgsP](https://nearblocks.io/txns/63Rrz4SdvPQgU33QSbZ6EoMszqbLEaF9AJ7eKbUGQgsP) | — | live NEAR RPC.  |
| Opening stop: fractional observation | observed_at_ms=1794661434144.6926 | [EHDn22s34FGHoHbVeSbDYYvwDTbiZN6uayet4YKEh9VX](https://nearblocks.io/txns/EHDn22s34FGHoHbVeSbDYYvwDTbiZN6uayet4YKEh9VX) | — | live NEAR RPC. NEAR observe_margin failed integer deserialization; no opening order signature generated by this transaction. |
| Opening stop: host-clock guard | No venue order | — | — | operator report; not independently reconstructable on-chain. Operator report and helper code; no transaction hash exists for a local stop. |
| Opening stop: price mismatch signature | 3.6 NEAR signature at 3.2823; tool expected 3.2827 | [7Yr92zzoTpncQ3bwpr3MCcczxNARvDxasmjg1zqxqdEj](https://nearblocks.io/txns/7Yr92zzoTpncQ3bwpr3MCcczxNARvDxasmjg1zqxqdEj) | — | live NEAR RPC. NEAR request payload verifies 3.2823; immutable request expects 3.2827. Operator says relay refused. No matching fill in live fill history; absence of a relay is not independently provable. |
| Settle expired unused opening | short_size 0; release 3.6 NEAR reservation | [8WMkXPRcFd32joR2FBHarBC3r2hE639MhHGAZ7iGXDhv](https://nearblocks.io/txns/8WMkXPRcFd32joR2FBHarBC3r2hE639MhHGAZ7iGXDhv) | — | live NEAR RPC. Owner attestation after signature expiry; daily risk budget was not released. |
| Open short | Sell 3.6 NEAR @ 3.3241 | [J9ckn6RCUva3eamTSpLBkXQGKipovq8199V6E55SR3aU](https://nearblocks.io/txns/J9ckn6RCUva3eamTSpLBkXQGKipovq8199V6E55SR3aU) | [0xa768851a0c51f57aa8e20448c6ec5002045500ffa755144c4b31306ccb55cf65](https://app.hyperliquid.xyz/explorer/tx/0xa768851a0c51f57aa8e20448c6ec5002045500ffa755144c4b31306ccb55cf65) | live NEAR RPC + Hyperliquid fill. Order 604934422914; fee 0.005385 USDC; NEAR signature limit 3.2885 differs from execution fill price. |
| Reduce-only close | Buy 3.6 NEAR @ 3.3248 | [5Nu3jXF6boa7H9ddFMc2XhD6bMiVDesCyC2vgyVzsFTN](https://nearblocks.io/txns/5Nu3jXF6boa7H9ddFMc2XhD6bMiVDesCyC2vgyVzsFTN) | [0x2fad11edb3ade83731260448c6f1560201f400d34ea10709d375bd4072a1c221](https://app.hyperliquid.xyz/explorer/tx/0x2fad11edb3ade83731260448c6f1560201f400d34ea10709d375bd4072a1c221) | live NEAR RPC + Hyperliquid fill. Order 604935201689; fee 0.005386 USDC; closed PnL −0.00252 USDC; r=true in NEAR signed payload. |
| Owner settlement | short_size 0; release 3.6 NEAR reservation | [CXVj9G3eXKgeiu1Yobq2ECxV55YchxjRNhaREsDVu42P](https://nearblocks.io/txns/CXVj9G3eXKgeiu1Yobq2ECxV55YchxjRNhaREsDVu42P) | — | live NEAR RPC. Owner venue-state attestation, not a cryptographic cross-chain venue proof. |
| Observe pre-withdraw margin | 19.986709 USDC equity/withdrawable | [G7YArB9yCdCdtfzjedVvXpGRCU7QhyYeCowqf9QFvtVC](https://nearblocks.io/txns/G7YArB9yCdCdtfzjedVvXpGRCU7QhyYeCowqf9QFvtVC) | — | live NEAR RPC.  |
| withdraw3 signature and relay | 18.886709 USDC gross | [33gh19xaCzXtKssfjC8Rk4CxbM6VAtoJRDSdDuBnTfEX](https://nearblocks.io/txns/33gh19xaCzXtKssfjC8Rk4CxbM6VAtoJRDSdDuBnTfEX) | [0x6a6ff973ef4558eaab8afc9a8e63c968bde1a08f7713428dc9ed227f771eb07d](https://arbiscan.io/tx/0x6a6ff973ef4558eaab8afc9a8e63c968bde1a08f7713428dc9ed227f771eb07d) | live NEAR RPC + Hyperliquid withdrawal ledger. Ledger uses final Arbitrum transaction hash, not a separately supplied Hyperliquid L1 action hash; see arrival below. |
| Arbitrum One native USDC arrival | 17.886709 USDC received; 1 USDC bridge fee | — | [0x6a6ff973ef4558eaab8afc9a8e63c968bde1a08f7713428dc9ed227f771eb07d](https://arbiscan.io/tx/0x6a6ff973ef4558eaab8afc9a8e63c968bde1a08f7713428dc9ed227f771eb07d) | live Arbitrum One RPC receipt + ERC20 Transfer. chainId 42161; receipt status 1; native USDC 0xaf88d065e77c8cc2239327c5edb3a432268e5831; recipient 0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a. |
| Reconcile withdrawal on NEAR | 17.886709 received + 1 fee = 18.886709 gross | [mkrDFVCMrUidXdNhrbM33gmxnu8FnL1rFANPqUWCiSd](https://nearblocks.io/txns/mkrDFVCMrUidXdNhrbM33gmxnu8FnL1rFANPqUWCiSd) | [0x6a6ff973ef4558eaab8afc9a8e63c968bde1a08f7713428dc9ed227f771eb07d](https://arbiscan.io/tx/0x6a6ff973ef4558eaab8afc9a8e63c968bde1a08f7713428dc9ed227f771eb07d) | live NEAR RPC + Arbitrum receipt. source=owner_finality_attestation; receipt reconciliation is owner-attested. |
| Return spot | 3.6 wNEAR to haxheton.near | [3dtbghnHVmCNNz4kDLSisRTjSV9WZrYjz3J5g7rkvbkp](https://nearblocks.io/txns/3dtbghnHVmCNNz4kDLSisRTjSV9WZrYjz3J5g7rkvbkp) | — | live NEAR RPC. Successful wrap.near ft_transfer and completed policy withdrawal callback; wNEAR returned, no unwrap transaction asserted. |
| Final live status | flat; no open orders; policy spot=0; perps 1.1 USDC; separate spot 1 USDC | — | — | live NEAR state/access keys/account/wNEAR balance + Hyperliquid clearing/orders/spot. Zero positions does not mean zero venue funds; policy account still holds 6.997231424514551799999994 native NEAR. |

## Additional preparation calls

These public history entries were discovered using Nearblocks and reverified through the NEAR RPC; they record the price, heartbeat and margin preparations around the stops and successful lifecycle.

| Action | NEAR transaction | Arguments |
| --- | --- | --- |
| set_keeper_price | [GNon5QYV5Ak9vbPPQfDib19Ch7bWP6ZmfBkstTKJo4mL](https://nearblocks.io/txns/GNon5QYV5Ak9vbPPQfDib19Ch7bWP6ZmfBkstTKJo4mL) | `[{"observed_at":"1794662005","price":"3323500"}]` |
| set_reference_price | [DW9hVwmRyzMobgsxcX9sQCGEGxVqt6iKKG7G617ouSAz](https://nearblocks.io/txns/DW9hVwmRyzMobgsxcX9sQCGEGxVqt6iKKG7G617ouSAz) | `[{"price":"3323600"}]` |
| observe_margin | [265WNzF1xjdvh3gJmLRLAA6pSvZmdfxPu65hQUcwMmth](https://nearblocks.io/txns/265WNzF1xjdvh3gJmLRLAA6pSvZmdfxPu65hQUcwMmth) | `[{"equity_usdc":"20000000","observed_at_ms":"1794661930858","withdrawable_usdc":"20000000"}]` |
| set_keeper_price | [QePmEgq9gGScZ29ohZqz4ed6TbFTGkXPHqU7jfqthj8](https://nearblocks.io/txns/QePmEgq9gGScZ29ohZqz4ed6TbFTGkXPHqU7jfqthj8) | `[{"observed_at":"1794661917","price":"3321800"}]` |
| heartbeat | [GtRNamdbCFgoNVdvpdYJ7s7eHVDKZXyubCruvqDpXnHR](https://nearblocks.io/txns/GtRNamdbCFgoNVdvpdYJ7s7eHVDKZXyubCruvqDpXnHR) | `[{}]` |
| heartbeat | [GXGeZfpiUaHwdkezzy5y8F5aXyNu644fF6FZ9xYfKQXr](https://nearblocks.io/txns/GXGeZfpiUaHwdkezzy5y8F5aXyNu644fF6FZ9xYfKQXr) | `[{}]` |
| observe_margin | [AmguYCnfwdTgtF5QxKs11B5JEtj3HR4BktXs9xL2YFz6](https://nearblocks.io/txns/AmguYCnfwdTgtF5QxKs11B5JEtj3HR4BktXs9xL2YFz6) | `[{"equity_usdc":"20000000","observed_at_ms":"1794661699456","withdrawable_usdc":"20000000"}]` |
| set_keeper_price | [BFAXCB1kcmFhgQZYWH3fZC8uyXfHE4iGpJkw5tXawQEY](https://nearblocks.io/txns/BFAXCB1kcmFhgQZYWH3fZC8uyXfHE4iGpJkw5tXawQEY) | `[{"observed_at":"1794661684","price":"3315500"}]` |
| set_keeper_price | [BH1r778o88fSWoWK7QmLFTJTTQu7YKiyTV3KyF9aAMCZ](https://nearblocks.io/txns/BH1r778o88fSWoWK7QmLFTJTTQu7YKiyTV3KyF9aAMCZ) | `[{"observed_at":"1794661420","price":"3317500"}]` |
| heartbeat | [Ly6ubadA4nvf5yMC8ezTTFAxj7AW6wydNkDxtjYmzCj](https://nearblocks.io/txns/Ly6ubadA4nvf5yMC8ezTTFAxj7AW6wydNkDxtjYmzCj) | `[{}]` |
| heartbeat | [3uG5gwJy8xiiuWfFq3anGZb4gLG9PTcTBUgryGrMtLRi](https://nearblocks.io/txns/3uG5gwJy8xiiuWfFq3anGZb4gLG9PTcTBUgryGrMtLRi) | `[{}]` |

## Real accounting

- Opening fee 0.005385 + closing fee 0.005386 = **0.010771 USDC**. Closed PnL **−0.002520 USDC**. The two fill prices are executions, not signed IOC limit prices.
- Perps accounting: **20 = 0.010771 fees + 0.002520 loss + 17.886709 arrival + 1 bridge fee + 1.1 retained perps**. The 1.1 consists of the policy’s 1 USDC minimum equity and 0.1 USDC fee reserve; it remains capital, not a fee.
- The spot wallet retains a separate **1 USDC** after the initial 21 USDC spot funding and 20 USDC class transfer. The live initial funding ledger also reports **1 USDC send fee**, separate from the withdrawal bridge fee; the accounting identity above begins after funding.
- Native NEAR still in the keyless policy: **6.997231424514551799999994 NEAR**, approximately 7. This is economically immobilized policy capital; RPC `locked=0` means it is not staking-locked. The 3.6 wNEAR was returned as wNEAR, with no unwrap claimed.
- Keeper funded 0.1 + 0.6 = **0.7 NEAR**. A 285–300 Tgas mainnet call needs roughly 0.3 NEAR upfront under the documented prepaid purchase floor. Refundable prepaid liquidity is distinct from final gas burn; aggregate NEAR fees were not reconstructed.

## Honest incidents and verification limits

- Host-clock guard incident and historical public-RPC outage cause/duration are operator reports; neither has a cryptographic on-chain record. The withdrawal signature nonce and final bridge arrival are separated by approximately six minutes; this does not isolate RPC delay from bridge processing.
- The relay refusal for the 3.2823 versus 3.2827 signature is supported by the mismatching on-chain payload and saved request, plus operator report. Live fills show only the successful open/close; public APIs cannot prove a local tool never submitted any message.
- Zero policy access keys were verified at finalized current state and historical transaction blocks for class transfer/open/close/withdraw. Deployment used a temporary setup key, which was deleted before the financial lifecycle; “keyless deployment” describes the resulting account, not the creation transaction.
- Owner settlement and withdrawal reconciliation are trusted owner attestations. Native USDC arrival itself was independently checked against an Arbitrum One receipt.
- The 0.7 NEAR keeper funding is independently verified as 0.1 creation plus 0.6 top-up; approximate 0.3 NEAR prepaid-gas liquidity is documented from the mainnet purchase floor, not a measured permanent fee. Aggregate NEAR gas cost was not reconstructed.
- One owner-supervised tiny mainnet lifecycle is demonstrated; no autonomous mainnet keeper operation, independent security audit, production safety, sustained yield or profitability is established.
- The live ledger separately reports a 1 USDC fee on the initial 21 USDC funding send. It is outside the post-funding trade-to-withdraw accounting above and must not be hidden when discussing whole-run funding costs.

The failed fractional observation is a NEAR transaction, but it did not sign or send an opening order. The host-clock guard stopped locally. The mismatched opening signature expired and was settled before the successful open. A public-RPC outage delayed the withdrawal relay by a few minutes according to the owner; public receipts establish final success, not the exact outage diagnosis.

## Historical evidence handling

Existing files under `docs/evidence/` were read only. These two new summary files do not replace the immutable raw setup, lifecycle, request, response or final-state evidence. v1–v3 proofs remain testnet proofs; this v4 lifecycle is mainnet.
