# Funded testnet lifecycle — 2026-11-10 (keyless policy-v2)

Policy: `policy-v2.counterweight-samet.testnet` (wasm `1bb1cc57…08a7a`, upgraded in place from `d85b2f91…` before
key removal). Its only access key was deleted in tx `DGcGa5e5rjma3r7ohmP3Vhoshm9wdHMdU6DdA1ksS8eT`; `testnet:verify`
then reported code hash, zero access keys, config and derived address all ok.
Derived Hyperliquid address (Chain Signatures, path `counterweight-1`): `0x3e72c8963761c3f436710df9b891d8e3a74b5390`.
Fixed withdrawal recipient (owner wallet): `0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a`.

| Step | NEAR tx | Hyperliquid testnet result | Detail |
|---|---|---|---|
| Spot: owner deposits 4 wNEAR | `H4ecuHKFutGfsfRY5S9v2DXfpRPQAibCSH9MiVdQ1vnt` | — | contract `spot_balance` = 4 NEAR |
| Funding: owner UI Send of 50 mock USDC | — | landed in SPOT balance | UI offers no perp destination |
| Owner-only spot→perp (`usdClassTransfer`, contract-signed) | see [to-perp](2026-11-10-lifecycle-to-perp.md) | `accountClassTransfer` 49.0, hash `0x326745dbd188e26333e1042dd228a20106005dc16c8c0135d62ff12e908cbc4d` | perps 0 → 49 |
| Keeper open (bounded IOC short, contract-signed) | `2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd` | fill 3.5 NEAR @ 3.5121, oid 65016476566, fill hash `0x6b25c2b7cf4537026c9f042dd231c8010400da9d6a4855d40eee6e0a8e4910ed` | [open](2026-11-10-lifecycle-open.md) |
| Keeper close (reduce-only IOC, contract-signed) | see [close](2026-11-10-lifecycle-close.md) | fill 3.5 NEAR @ 3.5212, position flat | [close](2026-11-10-lifecycle-close.md) |
| Owner settlement | `FDepMaKNUmLZP8g6DzXzVcUsqV91V6Borv9Rh8uKNob8` | — | `settle_position` short 0 |
| Owner one-time withdrawal config | `2RAnd7iZgoJ7mzE4RPyCyvNMnzVTybg6Y4UsASePJuoc` | — | `configure_rebalancing` |
| Owner fixed-recipient `withdraw3` (contract-signed) | `9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25` | ledger `withdraw` 46.957074 USDC, hash `0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0` | recipient fixed in contract |

The withdrawal row comes from Hyperliquid testnet `userNonFundingLedgerUpdates` for the derived address (start time
1794330000000). The automated relay check (`lifecycle --step=status --relay-tx=…`) did not yet match this ledger entry
(known issue); arrival on the destination chain is not verified here.

Not established: mainnet operation, NEAR Intents settlement (only `dry: true` quotes), multi-day carry, rebalancing
with real routes.
