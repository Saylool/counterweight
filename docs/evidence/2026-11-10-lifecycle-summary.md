# Funded testnet lifecycle — 2026-11-10 (keyless policy-v2)

Policy: [policy-v2.counterweight-samet.testnet](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet),
committed WASM `1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a`.
Upgraded in place from `d85b2f91…` before key removal. The verifier then reported code hash, zero access keys,
config and derived address all ok. The old `policy.counterweight-samet.testnet` is a rehearsal deployment with a key.
Owner funding (deposit, UI Send and class transfer) preceded key deletion: the to-perp relay records one temporary
full-access key at its receipt blocks. Keeper open, close and withdrawal records show zero keys at their receipt blocks.
Derived address (Chain Signatures, path `counterweight-1`):
[0x3e72c8963761c3f436710df9b891d8e3a74b5390](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390).
Fixed withdrawal recipient: `0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a`.

| Step | NEAR testnet transaction | Result | Evidence |
|---|---|---|---|
| Owner spot deposit | [H4ecuHKFutGfsfRY5S9v2DXfpRPQAibCSH9MiVdQ1vnt](https://testnet.nearblocks.io/txns/H4ecuHKFutGfsfRY5S9v2DXfpRPQAibCSH9MiVdQ1vnt) | 4 wNEAR held by policy contract | [record](2026-11-10-lifecycle-status.md) |
| Owner UI Send | — | 50 mock USDC sent; UI Send lands in SPOT, no perp destination | [record](2026-11-10-lifecycle-to-perp.md) |
| Owner-only spot → perp | [FnEqLsBCYzBFx7E9Mn7EXWHQJFyWbncVBNafUNGLDmp3](https://testnet.nearblocks.io/txns/FnEqLsBCYzBFx7E9Mn7EXWHQJFyWbncVBNafUNGLDmp3) | 49 USDC; contract-signed usdClassTransfer before key removal; perps 0 → 49 | [record](2026-11-10-lifecycle-to-perp.md) |
| Access key removal | [DGcGa5e5rjma3r7ohmP3Vhoshm9wdHMdU6DdA1ksS8eT](https://testnet.nearblocks.io/txns/DGcGa5e5rjma3r7ohmP3Vhoshm9wdHMdU6DdA1ksS8eT) | Zero access keys verified before keeper trading and withdrawal; committed WASM 1bb1cc57…08a7a | [record](2026-11-10-release-testnet-verify.json) |
| Keeper IOC short | [2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd](https://testnet.nearblocks.io/txns/2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd) | 3.5 NEAR @ 3.5121; contract-signed; oid 65016476566 | [record](2026-11-10-lifecycle-open.md) |
| Keeper reduce-only close | [65WWr7W1DSvDKLGjF8tVZJtzYzwL6NX8DGfh7QZeL8JW](https://testnet.nearblocks.io/txns/65WWr7W1DSvDKLGjF8tVZJtzYzwL6NX8DGfh7QZeL8JW) | 3.5 NEAR @ 3.5212; contract-signed; position flat | [record](2026-11-10-lifecycle-close.md) |
| Owner settlement | [FDepMaKNUmLZP8g6DzXzVcUsqV91V6Borv9Rh8uKNob8](https://testnet.nearblocks.io/txns/FDepMaKNUmLZP8g6DzXzVcUsqV91V6Borv9Rh8uKNob8) | settle_position short 0; trusted owner attestation | [record](2026-11-10-lifecycle-status.md) |
| Owner withdrawal config | [2RAnd7iZgoJ7mzE4RPyCyvNMnzVTybg6Y4UsASePJuoc](https://testnet.nearblocks.io/txns/2RAnd7iZgoJ7mzE4RPyCyvNMnzVTybg6Y4UsASePJuoc) | configure_rebalancing; fixed recipient; no sale route executed | [record](2026-11-10-lifecycle-withdraw.md) |
| Owner fixed-recipient withdraw3 | [9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25](https://testnet.nearblocks.io/txns/9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25) | 47.957074 USDC signed gross; ledger withdraw 46.957074 USDC net + 1 USDC fee | [record](2026-11-10-lifecycle-status.md) |

Withdrawal ledger hash:
[0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0](https://app.hyperliquid-testnet.xyz/explorer/tx/0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0).
The row is recorded in `userNonFundingLedgerUpdates` from start time 1794330000000 in the
[historical status capture](2026-11-10-lifecycle-status.md). Its time is 1794332099146,
`delta.nonce` is 1794331863418000 (microseconds), and `delta.fee` is `"1.0"`.
The signed action time is 1794331863418 (milliseconds). Amounts use exact micro-USDC arithmetic.

The historical automated check failed because it compared the signed gross amount with the net ledger payout;
it also queried only a rolling day. The corrected status recheck queries the saved nonce's bounded day,
checks the microsecond nonce when present and net + fee = gross, and requires a unique match.
The ledger hash is a Hyperliquid hash, not the NEAR tx hash or signing digest. Original failed captures are
retained; a [successful read-only recheck](2026-11-10-release-lifecycle-recheck.json) is recorded separately. Destination-chain arrival is **unverified**.

Proven: funded testnet contract custody, contract-signed owner transfer, keeper open and reduce-only close,
public fills and flat position, owner settlement, fixed-recipient withdrawal ledger observation.
This was a **supervised run** with owner funding, price/margin observations, settlement and withdrawal approval.
The contract does not verify Hyperliquid state on-chain; 4 wNEAR remains directional after the perp close.
Not established: mainnet operation, multi-day carry, NEAR Intents settlement (only `dry: true` quotes),
live rebalancing routes or destination-chain withdrawal arrival.

[Structured table used by the web app](2026-11-10-lifecycle-summary.json).
