# V2 cleanup — printed procedure, not executed

Account: `policy-v2.counterweight-samet.testnet`; owner/fixed NEAR recipient:
`counterweight-samet.testnet`. Keyless v2 cannot be upgraded. No commands below
were executed during the v3 work. They use the owner's existing keychain, never
private-key arguments. Review the public snapshot in
[evidence/v2-cleanup-preflight.json](evidence/v2-cleanup-preflight.json), then
refresh state, Hyperliquid position and actual wrap.testnet balance before acting.

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

## Executable owner procedure after the horizon

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
v2 artifact; v3 verification must specify the v3 account and plan explicitly.
