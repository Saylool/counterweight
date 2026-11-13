# V2 cleanup — executed 12 November 2026

Account: `policy-v2.counterweight-samet.testnet`; owner/fixed NEAR recipient:
`counterweight-samet.testnet`. Keyless v2 cannot be upgraded. Cleanup completed:
paused, expired authorizations, abandoned the withdrawal reservation and returned
4 wNEAR to the fixed owner. The archived [final status](evidence/2026-11-12-v2-cleanup-status.json)
records `paused`, `expired`, `abandoned`, `spotReturned` and
`ownerIncreaseVerified` all true. Its finalized block time is 17:35:10.437 UTC.
The [pre-withdrawal baseline](evidence/v2-cleanup-withdraw-before.json) records
owner balance zero; final policy custody is zero and owner balance is 4 wNEAR.

| Executed stage | NEAR testnet transaction |
|---|---|
| Pause | [4fuycLxY…](https://testnet.nearblocks.io/txns/4fuycLxY8Gip3dYr4rGkU48FkjEDJ1PSEzcDwvGk3ejA) |
| Expire | [G6SwBn4g…](https://testnet.nearblocks.io/txns/G6SwBn4gR3CvCcAdUqZMX1Nm6UB2EWHpqUWH5aJ6pDjE) |
| Abandon | [DcC7Gvmz…](https://testnet.nearblocks.io/txns/DcC7GvmzzbDnLBhEzdRJec4p9EhunkqNK1bipEoRU4cx) |
| Owner wrap.testnet registration | [BV7V3j72…](https://testnet.nearblocks.io/txns/BV7V3j72ECMnbDaWKvFnh5D2j3qTCbjPwy4puKebhUFf) |
| Return 4 wNEAR | [6KjWtjWV…](https://testnet.nearblocks.io/txns/6KjWtjWVsBZ28EekTp2FXutkV4nnY39jufEX6ASbU4PU) |

Stage snapshots: [pause](evidence/2026-11-12-v2-cleanup-pause.json),
[expire](evidence/2026-11-12-v2-cleanup-expire.json),
[abandon](evidence/2026-11-12-v2-cleanup-abandon.json),
[withdraw-spot](evidence/2026-11-12-v2-cleanup-withdraw-spot.json).
These are read-only command-printer snapshots taken before each stage; they are
not transaction receipts. Transaction hashes come from the operator's
[release record](evidence/2026-11-12-v3-lifecycle-summary.md); final status supplies
the later public balance checks. Files were copied byte-for-byte from the local
release outputs without rerunning any command. No USDC bridge arrival is inferred.

## Historical procedure — do not repeat completed stages

The commands below document the executed flow. They use the owner's existing
keychain, never private-key arguments. The earlier public snapshot is in
[evidence/v2-cleanup-preflight.json](evidence/v2-cleanup-preflight.json), then
that preflight; it is superseded for cleanup status by the final status above.

The command printer/verifier performs public reads only:

```sh
npm run v2:cleanup -- --step=pause
npm run v2:cleanup -- --step=expire
npm run v2:cleanup -- --step=abandon
npm run v2:cleanup -- --step=withdraw-spot
npm run v2:cleanup -- --step=status
```

Run each stage separately and inspect `ready`, `reasons`, `earliestAllowedUtc`
and `commands`; only the lead executes printed owner calls. `pause` is allowed
now after flat/idle checks. Later stages require a finalized block strictly after
the replay horizon; use **2026-11-12 17:31:04 UTC or later**. Each stage verifies
the preceding state before becoming ready. The first ready `withdraw-spot` run
saves the owner's token balance in `docs/evidence/v2-cleanup-withdraw-before.json`.
After the callback, `status` checks empty custody/reservations and reports
`ownerIncreaseVerified` for exactly 4 wNEAR against that saved balance. A missing
baseline or intervening owner token movement requires receipt review.

## Exact state and the review's two errors

The [saved lifecycle recheck](evidence/2026-11-10-release-lifecycle-recheck.json)
contains two retained authorizations:

| Nonce | Kind | Replay horizon ends (UTC) |
|---|---|---|
| `1794331472735` | owner spot→perp class transfer | 2026-11-12 17:24:32.736 |
| `1794331863418` | fixed-recipient withdraw3 | 2026-11-12 17:31:03.419 |

`1794331786104` from the review is **not** one of the retained nonces in that
snapshot. Never issue a fabricated `report_invalidation` for it. `get_state`
filters expired entries; only a mutation that calls `prune` physically removes them.

Withdrawal gross: `47957074` micro-USDC; net: `46957074`; fee: `1000000`.
The finalized public venue ledger hash is
`0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0`.
The immutable dummy route has **`max_fee_usdc: "1"`**, i.e. one micro-USDC.
The correct complete ABI would be:

```text
reconcile_margin_withdrawal({
  "nonce":"1794331863418",
  "received_usdc":"46957074",
  "fee_usdc":"1000000",
  "receipt_id":"0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0",
  "finalized_at_ms":"<fresh owner verification timestamp, milliseconds>"
})
```

**Do not send that call on v2:** it necessarily fails `ERR_WITHDRAWAL_RECEIPT`
because `1000000 > 1`. Omitting fee/receipt/timestamp is not the ABI, and inventing
zero fees or inflating received funds is false accounting. A public venue ledger
entry also does not prove destination-chain arrival. v2 has no fee-limit setter.
`report_invalidation(nonce, accepted)` requires an actually requested, signed,
venue-confirmed invalidation; it is not a generic nonce-delete API. No new
withdrawal signature, noop relay, or settlement is needed for the expiry route.

## Archived owner procedure after the horizon

1. After verifying the zero-short snapshot, stop new keeper openings by pausing
   with only 30 Tgas. This commits the pause without requesting an MPC noop; a
   returned `false` means invalidations are incomplete, not that pause rolled back.
   Inspect state after the call. These commands are still only printed here:

```sh
near contract call-function as-transaction policy-v2.counterweight-samet.testnet set_paused json-args '{"paused":true}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send
```

2. Confirm final NEAR block time is **strictly greater than `1794504663419` ms**
   (use 2026-11-12 17:31:04 UTC or later), keys remain empty, short reservation and
   actual venue short are zero, pending slot is empty, route is null, withdrawal
   nonce/gross match above, and both internal/actual spot balances equal
   `4000000000000000000000000`. If state differs, regenerate the plan first.
3. Prune both expired authorizations (owner invocation shown; method is public):

```sh
near contract call-function as-transaction policy-v2.counterweight-samet.testnet expire_pending_signature json-args '{}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send
```

4. Clear the pending accounting reservation after its full replay horizon. This
   does **not** refund equity, create acquisition credit, assert receipt finality,
   or undo the venue withdrawal:

```sh
near contract call-function as-transaction policy-v2.counterweight-samet.testnet abandon_margin_withdrawal json-args '{}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send
```

5. Owner must already be registered on wrap.testnet. If necessary, register with
   `storage_deposit({account_id:"counterweight-samet.testnet",registration_only:true})`
   on `wrap.testnet`, 30 Tgas, 0.01 NEAR deposit, signed by the owner (idempotent,
   excess refunded). Then return exactly 4 wNEAR (token units, not native operating
   NEAR) to the fixed owner:

```sh
near contract call-function as-transaction wrap.testnet storage_deposit json-args '{"account_id":"counterweight-samet.testnet","registration_only":true}' prepaid-gas '30 Tgas' attached-deposit '0.01 NEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send
near contract call-function as-transaction policy-v2.counterweight-samet.testnet withdraw_spot json-args '{"recipient":"counterweight-samet.testnet","amount":"4000000000000000000000000"}' prepaid-gas '100 Tgas' attached-deposit '1 yoctoNEAR' sign-as counterweight-samet.testnet network-config testnet sign-with-keychain send
```

6. Await the token callback. Verify `spot_balance: "0"`, `signed_short_size: "0"`,
   `pending: null`, `outstanding: []`, `get_rebalance().withdrawal: null`, actual
   policy wrap.testnet balance zero, and owner's token balance increased by exactly
   4 wNEAR. A failed transfer restores the internal spot balance; inspect receipts
   before retrying. The residual venue equity remains owner-attested and is not
   swept by this procedure. Save final receipts and read-only verification.

Do not deploy v3 over v2, initialize v2 again, delete its account, or reuse the
v2 address for the new strategy. Historical `testnet:verify` checks the preserved
v2 artifact; `testnet:verify --policy=policy-v3.counterweight-samet.testnet`
selects the saved v3 plan and artifact automatically.
