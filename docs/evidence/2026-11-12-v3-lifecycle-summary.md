# Supervised keyless v3 testnet open/close — 12 November 2026

The saved public evidence verifies 4 wNEAR custody on `policy-v3.counterweight-samet.testnet`, a keeper IOC short of 3.6 NEAR at 3.3788, and a keeper reduce-only buy of 3.6 at 3.3796, leaving the Hyperliquid position flat. Both successful order requests have zero policy access keys at their request/signature receipt blocks and signatures recovering the policy-derived address `0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5`.

This was supervised: **v3 opens require an owner margin attestation no more than 30 seconds old**. The keeper cannot open alone; it can reduce alone. Owner settlement is not recorded in this saved lifecycle; the close capture still reserves the short. Venue flatness does not release the contract's reserved short automatically.

## Transactions

| Stage | NEAR testnet transaction | Recorded result / Hyperliquid fill |
|---|---|---|
| v2 pause | [4fuycLxY…](https://testnet.nearblocks.io/txns/4fuycLxY8Gip3dYr4rGkU48FkjEDJ1PSEzcDwvGk3ejA) | Cleanup stage in the operator's release record |
| v2 expire | [G6SwBn4g…](https://testnet.nearblocks.io/txns/G6SwBn4gR3CvCcAdUqZMX1Nm6UB2EWHpqUWH5aJ6pDjE) | Expire retained authorizations |
| v2 abandon | [DcC7Gvmz…](https://testnet.nearblocks.io/txns/DcC7GvmzzbDnLBhEzdRJec4p9EhunkqNK1bipEoRU4cx) | Abandon withdrawal reservation; no margin credit or bridge-arrival assertion |
| Owner registration on wrap.testnet | [BV7V3j72…](https://testnet.nearblocks.io/txns/BV7V3j72ECMnbDaWKvFnh5D2j3qTCbjPwy4puKebhUFf) | Storage registration for spot return |
| v2 withdraw_spot | [6KjWtjWV…](https://testnet.nearblocks.io/txns/6KjWtjWVsBZ28EekTp2FXutkV4nnY39jufEX6ASbU4PU) | 4 wNEAR returned to the fixed owner; cleanup status reported complete |
| Owner v3 ft_transfer_call | [6Y8MaKav…](https://testnet.nearblocks.io/txns/6Y8MaKavd49GAc7pTCSTzKf39qA5LmjKhPaC5SD6p4ia) | 4 wNEAR custody verified |
| First keeper v3 open attempt — failed | [6oiP66Yn…](https://testnet.nearblocks.io/txns/6oiP66YntFXUfqRvfPyfuD1CS5WyahebzqRFmmMsxeRh) | Contract panicked with `ERR_REBALANCE_STALE`; no verified fill from this attempt |
| Second keeper v3 open — filled | [5ckMPUyA…](https://testnet.nearblocks.io/txns/5ckMPUyA87VycWs2HFyBBQiWvuAJTJbFUA6ZpMuUCwwM) | Sell 3.6 NEAR @ 3.3788; [fill 0x53ce4698…0224c9](https://app.hyperliquid-testnet.xyz/explorer/tx/0x53ce46989e0e4adf5548042dfb724b0101005e7e390169b1f796f1eb5d0224c9) |
| Keeper v3 reduce-only close — filled | [3cvncGKs…](https://testnet.nearblocks.io/txns/3cvncGKshNgXQop5p438o8Qh1vWZBm4U5mrP5u3xxaUu) | Buy 3.6 NEAR @ 3.3796; [fill 0x1888a834…88dc45](https://app.hyperliquid-testnet.xyz/explorer/tx/0x1888a8348885025b1a02042dfb73c5010700c01a2388212dbc5153874788dc45); flat |

The cleanup transaction hashes come from the operator's 12 November release record.
The archived [final public status](2026-11-12-v2-cleanup-status.json) records
`paused`, `expired`, `abandoned`, `spotReturned`, and `ownerIncreaseVerified` all true
at finalized block `Bw3XwWFYpFymET4zXZKKaXKRgkha8M9kNvuJhqTKdNmH`
(17:35:10.437 UTC). The [pre-withdrawal baseline](v2-cleanup-withdraw-before.json)
records owner token balance `"0"`; final policy internal/token balances are zero
and owner balance is `"4000000000000000000000000"` (4 wNEAR).
The [cleanup record](../V2-CLEANUP.md) links every archived stage output, copied
byte-for-byte from local release JSON. Earlier stage outputs print proposed commands;
the final status supplies the later balance checks. Cleanup does not prove
destination-chain arrival of the earlier USDC withdrawal.

## What the saved v3 evidence verifies

- [Spot capture](2026-11-12-lifecycle-policy-v3-spot.md): the successful `spot-deposit-custody-verified` record binds the owner transaction, wrap.testnet receiver, 4 wNEAR amount, empty FT message and policy deposit event. Internal `spot_balance` and actual wrap.testnet custody both equal `4000000000000000000000000`. A preceding read failed with `NEAR RPC HTTP 429`; it is retained in the same file.
- [Open capture](2026-11-12-lifecycle-policy-v3-open.md): the first transaction's `nearResponse.status.Failure` contains `ERR_REBALANCE_STALE`; its margin snapshot has `observed_at_ms: "0"`. The CLI labels this `failed-before-submission`, meaning before Hyperliquid submission, even though the NEAR transaction was sent and failed. The successful second record prints `heartbeat`, `set_keeper_price`, owner `observe_margin`, then keeper `request_order_signature`. Its owner command attests 49,000,000 micro-USDC equity and withdrawable at `1794505082768` ms. The record contains the printed command, not a separately identified owner-attestation transaction hash.
- [Open relay JSON](lifecycle-relay-5ckMPUyA87VycWs2HFyBBQiWvuAJTJbFUA6ZpMuUCwwM.json) and [close relay JSON](lifecycle-relay-3cvncGKshNgXQop5p438o8Qh1vWZBm4U5mrP5u3xxaUu.json): `parsed` binds typed order payloads, testnet digest, MPC signature, nonce and expiry to the NEAR request/signature receipts. Both `recovered` addresses match the derived account. Each `checks` entry records empty access keys and code hash `MD74j7DDmMa2zMHNiCZBbhe1AdQuDZGGxP3d5HfzzKm` at the receipt block.

| Order | Request receipt block / height | Signature receipt block / height |
|---|---|---|
| Open | `GQ9MaAXs1MhSQ4pUngjP1qSiCf3MkJQk6TKFpJTj3uGy` / 277394829 | `FizMEAytknNsNoK88aPw6bCEu53QNkYnm9h8VZWJFKd3` / 277394839 |
| Close | `62BDfBx7Xaa2nQFPdadVFxwCrTEkuB7XNveimgHGN94M` / 277394875 | `BigcYuKCvhNaSXz4VupCXQXQhFgfPk3GreQdFHeVYb8M` / 277394883 |

The successful relay records contain venue responses and matching public fills by order ID, timestamp, side and size, plus position deltas: open order `65178500661`, full fill, position `0 → -3.6`; close order `65178518642`, full fill, position `-3.6 → 0`. The [close capture](2026-11-12-lifecycle-policy-v3-close.md) records no open orders, equity/withdrawable of 48.986173 USDC, open fee 0.005473 USDC, close fee 0.005474 USDC and close `closedPnl: "-0.00288"`. Its command list contains no owner call or margin refresh.

## Remaining boundary

The close evidence still records `signed_short_size: "3600000000000000000000000"` and `last_open_expiry: "1794505157899"` (12 November 2026, 17:39:17.899 UTC). Owner `settle_position` was not documented in this lifecycle capture; it requires a fresh flat/no-open-orders observation after that expiry. This describes the dated close capture, not a current settlement-status check. No completed v3 settlement or withdrawal is claimed. The 4 wNEAR remain in v3 custody and directional after the venue close.

This live close occurred inside the opening bounds; it does not establish a live out-of-band or paused exit fill. Those authorization cases have separate local evidence. These public captures establish a brief supervised testnet open/close, not continuous keeper uptime, autonomous opening, multi-day carry, live Intents execution or destination-chain arrival. Owner margin and settlement observations remain attestations, without an on-chain venue verifier.
