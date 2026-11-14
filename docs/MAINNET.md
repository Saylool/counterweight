# Policy v4: haxheton.near mainnet run

V4 completed one owner-supervised mainnet lifecycle on **14 November 2026** at `cw4.haxheton.near`, owner `haxheton.near`, keeper `keeper4.haxheton.near`, zero access keys. **All steps 1–18 below are now historical instructions; do not rerun setup, funding or trading for this completed run.** Keep the contract, WASM, saved plan and original evidence unchanged. This release verification uses public reads only and performs no signing or sends.

## Executed run

[Step table, exact transaction hashes and public API verification limits](evidence/2026-11-14-v4-mainnet-lifecycle-summary.md) · [JSON](evidence/2026-11-14-v4-mainnet-lifecycle-summary.json).

The policy signed 20 USDC spot→perps, held 3.6 wNEAR, then opened a short of 3.6 NEAR @ 3.3241 and closed reduce-only @ 3.3248 on Hyperliquid mainnet. Owner settlement preceded withdraw3 of **18.886709 USDC gross**: **17.886709 native USDC arrived on Arbitrum One** at the immutable owner recipient, with a 1 USDC bridge fee. Owner reconciliation on NEAR and return of 3.6 wNEAR completed the lifecycle; final saved status and current public reads show flat policy/venue exposure. About 7 NEAR remains in the keyless policy and 1.1 USDC remains in perps by policy, with another 1 USDC in venue spot. The inbound funding ledger records a separate 1 USDC funding fee.

Honest incidents and lessons:

- A fractional `observed_at_ms` was rejected by the contract. Serialize integer milliseconds exactly; do not silently round ambiguous observations.
- An over-strict host-clock guard stopped the next opening preparation. Compare appropriate chain/venue timestamps and allow justified clock skew while failing closed on stale data.
- One opening signature ([7Yr92zzo…](https://nearblocks.io/txns/7Yr92zzoTpncQ3bwpr3MCcczxNARvDxasmjg1zqxqdEj)) used price **3.2823** while the relay expected **3.2827**. The relay refused it; it expired unused and was settled. None of these three stops sent a venue order. Preserve the signed payload and reconcile expiry/venue state before retrying; a relay refusal is not revocation.
- The keeper needed **0.7 NEAR**, because prepaid liquidity for a 285–300 Tgas mainnet call is about **0.3 NEAR**. Budget refundable prepaid gas separately from final burned fees.
- One public-RPC outage delayed the withdrawal relay by a few minutes. Preserve uncertainty evidence and inspect finalized state before retrying; do not infer failure from an unavailable RPC.

This was **owner-supervised, one lifecycle, tiny size, unaudited**, with no autonomous mainnet keeper. Exit marks and owner margin/position/finality observations remain trusted. V4 fixes concurrent-exit serialization and the lifetime public MPC-deposit subsidy cap; other [known issues](KNOWN-ISSUES.md) remain open. Costs and retained capital are separated in [ECONOMICS](ECONOMICS.md#executed-mainnet-costs-14-november-2026).

The historical commands below use near-cli-rs and its OS keychain only when explicitly run by the owner; they are documentation, not authorization to repeat this lifecycle. New verification files must not overwrite the frozen setup/lifecycle evidence.

## Remaining allocation and signer liquidity

The saved plan selected **3.6 NEAR** of spot backing. The keeper was subsequently
topped up from 0.1 to **0.7 NEAR** because a 300 Tgas call needs approximately
0.301 NEAR upfront. The historical 11.20 NEAR allocation therefore has one explicit
**0.60 NEAR already-funded keeper adjustment**, making the accounted ceiling
**11.80 NEAR**. This authorizes no additional top-up, account or wrapping increase.
The saved starting owner balance and budget evidence remain unchanged.

[NEAR gas pricing](https://github.com/near/nearcore/blob/master/docs/architecture/how/gas.md)
distinguishes upfront gas purchase from the final burned fee. With protocol 85's
minimum purchase price, a signer must temporarily cover
`deposit + max(2 * block gas_price, protocol purchase floor, 1e9) * prepaid_gas + 0.001 NEAR` in liquid balance,
in addition to storage stake. Refunds return unused gas and the purchase/burn price
difference. The helper checks every signer, including the keeper, immediately
before each send; it reserves twice the live burn price plus transaction overhead
for the owner's cumulative allocation ceiling. A refundable upfront purchase is
not counted as a permanent allocation. Wait for refunds if liquidity is temporarily
low; never bypass the check.

Signature calls use **285 Tgas**, exactly the frozen configuration's
`230 signer + 30 callback + 25` requirement (`lib.rs:1110–1122`), instead of 300.
Other calls retain their supported budgets: regular observations/settlement 30,
spot transfer-call 100, spot return 80 Tgas. No on-chain resource setting changes.

For steps 10–18 with 3.6 new wrapping, both registrations, a class transfer,
one open/close, and gas at the ordinary `1e8` block price (`1e9` purchase floor),
keep **at least 4.20 NEAR owner and 0.38 NEAR keeper, plus each account's storage
stake**, before step 10. These are conservative full-run requirements under the
spend ceiling, not predicted fees. The reported approximately **4.4 / 0.68 NEAR**
fit. Individual 285 Tgas calls need at least **0.286 NEAR liquid**. Live price or
storage changes are checked before sends; additional recovery transactions need
fresh headroom. Existing wNEAR lowers new wrapping needs. The original plan is never rewritten.

At the ordinary gas prices above, these are the immediate **liquid** preflight
reserves (storage is additional; several separately executed transactions are
conservatively grouped by the runner):

| Step | Owner NEAR | Keeper NEAR |
| --- | ---: | ---: |
| 10 | 0.286 if transfer needed; zero if skipped | — |
| 11 | 3.811 for 3.6 new wrapping, both registrations and transfer | — |
| 12 | 0.031 | 0.061 preparation, then 0.286 signature |
| 13 | — | 0.061 preparation, then 0.286 signature |
| 14 | 0.031 | — |
| 15 | 0.031 preparation, then 0.316 observation/signature group | — |
| 16 | 0.031 | — |
| 17 | 0.081 plus 1 yoctoNEAR | — |
| 18 | zero, public reads only | — |

With settled refunds, twice-live-price burn allowance and 0.001 NEAR overhead per
transaction, the full schedule needs owner **4.1778 NEAR + 2 yoctoNEAR** including
the 0.3478 remaining owner allocation floor, and keeper **0.372 NEAR**, plus storage.
The rounded 4.20 / 0.38 recommendations cover these requirements. Each send still
checks the current protocol purchase floor, gas price, signer funds and owner cap.

Margin is separate: send about **21 already-owned USDC** from the owner's own
Hyperliquid account to **`0xb6a1d45ba9154067b7981e2b4b676393c75b0d26`**. The first UI
Send may deduct a 1 USDC activation fee; funds may land in **Spot or Perps**.
The automated Spot-to-Perps transfer targets at most 20 USDC total Perps equity
and accepts 19.x USDC. Direct Perps credits already above the needed margin are
skipped. No new
USDC purchase is needed. Fees, funding, PnL and the withdrawal fee reduce returns.

Stop on a failed or uncertain transaction, wrong identity/code/key, unexpected
position/order or balance mismatch. Preserve all request, response and journal
files. A timeout is not evidence that a transaction was never sent.

## Owner commands

`scripts/mainnet-runbook.sh` maps each fixed step number to the concrete command
for the action described below. Read that script alongside this document before
beginning; it executes only the one numbered step you request. It does not advance
through later steps automatically.

1. Verify the local tests, types and the pinned production artifact with one script.

   ```sh
   bash scripts/mainnet-runbook.sh 1
   ```

   Expected: tests and typecheck succeed, checksum says `OK`, and production export
   verification passes. Stop on any failure. Do not rebuild the artifact for a
   tooling-only change. The manifest is authoritative; the expected v4 artifact is
   344,776 bytes with SHA-256
   `278057b511924ee1e5769ebc46ac0aff5a17d036c41ce25b06c42c871bffbc91`.

2. Generate the live plan. At the prompt enter the **public** owner EVM address
   whose native USDC receipt you can verify on Arbitrum One.

   ```sh
   bash scripts/mainnet-runbook.sh 2
   ```

   Expected: `PASS plan`, a new `docs/evidence/policy-v4-mainnet-plan.json`, fixed
   accounts above,
   a derived strategy EVM address, NEAR market index/size precision, a feasible
   backing amount no greater than 3.98 NEAR, and a total no greater than 11.20 NEAR.
   The plan reads live mainnet `v1.signer` code hash, version and gas
   configuration. For the supported v3.18.0 deployment, the deposit view is
   unavailable: it verifies the live code hash against the official released
   bytecode and uses the matching source's 1 yoctoNEAR deposit rule. Unknown code,
   version or gas requirements fail closed. It validates ECDSA domain 0 and records
   a gas allocation the unchanged policy can support. Stop if the signer cannot fit
   its supported fee/gas constraints, balance is insufficient, either new account
   already exists,
   or any value is unexpected. A stale or rejected plan is not funding approval.

3. Create the keeper with its entire 0.10 NEAR allocation.

   ```sh
   bash scripts/mainnet-runbook.sh 3
   ```

   Expected: `PASS create-keeper finalized`, successful creation of
   `keeper4.haxheton.near` and its key
   saved in the OS keychain. Stop if creation fails or the signer is not
   `haxheton.near`. Do not create or fund another keeper.

4. Create the policy with exactly 7 NEAR.

   ```sh
   bash scripts/mainnet-runbook.sh 4
   ```

   Expected: `PASS create-policy finalized`, successful creation of
   `cw4.haxheton.near` with one temporary
   full-access key in the keychain. Stop if creation fails. Never repeat a creation
   after an uncertain response without checking the existing account first.

5. Deploy the pinned WASM and initialize it atomically.

   ```sh
   bash scripts/mainnet-runbook.sh 5
   ```

   Expected: `PASS deploy finalized`, successful `deploy ... with-init-call new`,
   matching production code
   hash and owner/keeper, `Mainnet`, `v1.signer`, `wrap.near`, fixed recipient and
   planned market/risk limits. Stop on checksum mismatch, failed initialization or
   a different value. The policy key is still present so a failed setup is
   recoverable; do not fund spot or delete the key.

6. Apply the live signer fee and gas resources.

   ```sh
   bash scripts/mainnet-runbook.sh 6
   ```

   Expected: `PASS resources finalized`, successful `set_signing_resources` using
   freshly checked signer
   requirements. Stop on `ERR_MPC_RESOURCES`, `ERR_MPC_FEE`, unavailable signer
   configuration or any failed receipt. The checked v3.18.0 deployment requires
   1 yoctoNEAR and at least 15 signer Tgas. Its existing initializer defaults (1 yoctoNEAR, 230 signer Tgas and
   30 callback Tgas) already satisfy those requirements today; the automated live
   check and actual signature test prove readiness before key deletion.

7. Configure adapter-free margin withdrawals.

   ```sh
   bash scripts/mainnet-runbook.sh 7
   ```

   Expected: `PASS margin finalized`, successful `configure_margin_withdrawals`
   with 20 USDC per withdrawal
   and day, 1 USDC minimum residual, 0.10 USDC fee reserve, 1 USDC maximum fee and
   1,000 bps minimum headroom. Stop if margin state is missing or limits differ.

8. Prove the actual keeper-to-policy-to-MPC callback signature path before removing
   any policy key.

   ```sh
   bash scripts/mainnet-runbook.sh 8
   ```

   Expected: `PASS real MPC signature path`, a successful typed cancel signature
   receipt, recovered strategy EVM
   signer matching the plan, and saved test evidence. This requests a signature
   without opening a position or submitting an exchange trade. Stop on a missing
   signature event, failed callback, wrong domain/address or any pending operation.

9. Run the automated readiness gate and remove the policy key only if it passes.

   ```sh
   bash scripts/mainnet-runbook.sh 9
   ```

   Expected: `PASS predelete`, then `PASS zero access keys at finality`. The gate
   proves code/deploy, exact initializer identities/limits,
   non-null margin withdrawal configuration, current fee/gas resources and the
   successful test signature path; only then does it delete the sole temporary
   policy key. A final public read must prove zero access keys. Stop if any check
   fails; **do not run `near account delete-keys` separately**. Key deletion is
   irreversible: the parent cannot restore the child's key, and this contract
   exposes no upgrade/key-restoration/account-deletion escape hatch.

Before step 10, finish step 9 and verify the policy has zero access keys.
In the official [Hyperliquid UI](https://app.hyperliquid.xyz/trade), the owner sends
about **21 USDC** from their own account to the exact derived address above.
Compare every address character and confirm the credited Spot/Perps balances.

10. Read live strategy balances and fund Perps if needed.

    ```sh
    bash scripts/mainnet-runbook.sh 10
    ```

    If verified flat Perps already has the required 15 USDC margin, the helper
    prints `SKIP` and succeeds without signing. Otherwise it transfers
    `amount_micro = min(spot_available_micro, 20000000 - floor(perps_equity_USDC * 1e6))` from this same
    account's Spot to Perps. A 19.x Spot credit is valid; it never assumes 20 is
    available. No orders, pending policy operation or other position may exist.
    It submits once and polls public proof; an uncertain relay must be reconciled,
    never resubmitted by guessing. Opening still requires at least 15 USDC verified
    withdrawable margin; automatic funding targets 20 USDC.

11. Register, wrap and deposit the saved **3.6 NEAR** backing.

    ```sh
    bash scripts/mainnet-runbook.sh 11
    ```

    Expected: `PASS spot custody`; registrations, wrapping only the missing owner
    wNEAR, and `ft_transfer_call` with empty `msg`. Policy token balance must equal
    its spot ledger and the saved 3.6 NEAR. Retry skips finalized substeps after
    checking their saved transaction against public finality. A partial run does
    not repeat registration or wrapping. Uncertain substeps remain blocked until
    public finality proves their result. New journals are kept outside the frozen
    setup evidence; do not delete journals as a retry technique.

12. Check the host clock and open one small short.

    ```sh
    bash scripts/mainnet-runbook.sh 12
    ```

    Before keeper heartbeat/price sends, the helper compares the Mac clock with a
    recent NEAR block timestamp and venue time. **More than 1 second ahead stops
    the run with clock correction instructions; 2 seconds behind is accepted.**
    Correct macOS automatic time and rerun only after public reconciliation of any
    prior attempt. Heartbeat/price, fresh owner margin observation and keeper
    signature follow. The exact signed IOC is submitted once before its 60-second
    expiry. Signature success does not prove a fill: the runner checks response,
    public fills, actual short and no open orders. Stop on a failure or partial fill.

13. Close the actual short, reduce-only.

    ```sh
    bash scripts/mainnet-runbook.sh 13
    ```

    Expected: actual observed NEAR quantity, buy/reduce-only IOC, public fills and
    flat position with zero orders. Closes remain available while paused. A partial
    close needs reconciliation and a fresh close of the remaining quantity, never
    another open.

14. **Wait at least 61 seconds after step 12's signature** (and past every opening
    expiry), then settle without pausing.

    ```sh
    bash scripts/mainnet-runbook.sh 14
    ```

    Expected: venue flat/no orders, fresh `settle_position(short_size: "0")`, policy
    short zero. **Do not run `set_paused(true)` on this happy path.** Settlement
    requires owner/idle/freshness/size checks, not pause (`lib.rs:670–699`). A consumed
    class-transfer authorization may still be listed for 48 hours; it does not
    block settlement, withdrawal or spot return while undiscarded.

15. Request withdrawal once; wait for the public ledger.

    ```sh
    bash scripts/mainnet-runbook.sh 15
    ```

    Fresh reference/margin observations precede owner `withdraw3` signing and its
    single exchange submission. Gross withdrawal leaves at least 1.10 USDC in Perps;
    the 1 USDC bridge fee reduces the destination payout. The helper polls public
    ledger proof for up to approximately **10 minutes**, with read-only `/info`
    retries and a 5-second query-start buffer. Ledger lag never triggers another
    send. A timeout retains resumable evidence; use the read-only recovery below.
    User-signed withdrawals have no order-style 60-second expiry.

    **By hand:** wait for finalized native USDC on **Arbitrum One (42161)** at the
    immutable recipient saved in the plan. Verify chain, token, recipient, success,
    gross/net and fee. Venue ledger proof alone does not prove destination arrival.

16. Reconcile the independently verified destination receipt.

    ```sh
    bash scripts/mainnet-runbook.sh 16
    ```

    Enter the finalized Arbitrum transaction hash, actual net decimal USDC, actual
    decimal fee (maximum 1), and `VERIFIED` only after checking the receipt. Net plus
    fee must equal the signed gross. The fresh owner attestation clears the margin
    withdrawal and marks its authorization confirmed (`rebalance.rs:349–399`).

17. Return spot backing to the fixed owner as **wNEAR**.

    ```sh
    bash scripts/mainnet-runbook.sh 17
    ```

    Expected: flat settled venue, no orders, `withdraw_spot`, zero policy spot/token
    and an exact 3.6 wNEAR owner increase. This does not unwrap the returned wNEAR.

18. Save final public status.

    ```sh
    bash scripts/mainnet-runbook.sh 18
    ```

    Expected: matching code/config, zero policy access keys, no pending operation,
    short, orders, spot/token custody or unresolved margin withdrawal. New status
    evidence is outside `docs/evidence/mainnet-owner-v4/`. Residual strategy USDC
    and policy native reserve remain visible. An undiscarded consumed class-transfer
    authorization can remain listed until its replay horizon expires.

## Exact recovery with a consumed class transfer

The review's pause hazard is confirmed by frozen source: user-signed class transfers
enter `outstanding` with `nonce + 2 days + 1 ms` (`lib.rs:1465–1515`).
`set_paused(true)` marks all unconfirmed entries discarded (`581–583`), and
`request_next_invalidation` chooses the **first** discarded unconfirmed entry
(`624–638`). A Noop using an already-consumed class-transfer nonce cannot consume it
again. The contract has no class-transfer reconciliation method. Consequently,
**tooling cannot clear this on-chain pause barrier early**. Never report acceptance
for a rejected Noop. The new happy path avoids pausing; it does not change the
contract's authorization list. Read-only `--resume` ignores a consumed class
transfer only when saved request/receipt and public consumption proof identify it.
Other live authorizations still block settled-state recovery.

For a failed **step 12**:

1. Inspect public state and the saved journal/request/response. If the expected
   fill is proven, `bash scripts/mainnet-runbook.sh 12 --resume` clears its journal
   without sending; continue at 13.
2. If partial/unfilled/uncertain, run step 13 **only if a real short remains**;
   reconcile its result, including `bash scripts/mainnet-runbook.sh 13 --resume`
   if that close failed or timed out. Do not submit a second close while uncertain.
3. Wait past all opening signature expiries (at least 61 seconds), then run
   `bash scripts/mainnet-runbook.sh 14`. It settles without pause. If uncertain,
   reconcile with `bash scripts/mainnet-runbook.sh 14 --resume`.
4. Run `bash scripts/mainnet-runbook.sh 12 --resume`. Public flatness, settled
   policy, expiry and consumption proof allow journal release despite the live
   consumed class transfer. Prefer exiting via **15 → 16 → 17 → 18**. A single
   replacement open is allowed only after all journals clear, unpaused state,
   60-second cooldown and remaining $30 rolling-day budget are independently
   verified. No unpause is needed when the new settlement path was used.

For a failed **step 15**:

```sh
bash scripts/mainnet-runbook.sh 15 --resume
```

This polls public proof again and never signs or relays. If withdrawal is proven,
wait for the Arbitrum receipt, then execute **16 → 17 → 18**. It works even if the
exchange HTTP response was lost; exact public withdrawal proof is required.

If the withdrawal is **not consumed**, never blindly relay again. A consumed class
transfer at the head of the discarded queue prevents targeted withdrawal Noop
invalidation; do not run `invalidate` to try to skip that entry. Preserve the
journal and wait until the **withdrawal authorization's own** `expires_after`
(`withdrawal nonce + 172800001 ms`) is strictly earlier than NEAR block time,
not merely 48 hours after step 10. Then inspect venue ledger and destination
again. If a destination payment exists, use step 16 instead of abandonment.
Otherwise, after verified non-arrival and replay expiry:

```sh
npx --no-install tsx scripts/mainnet-owner.ts --step=abandon-withdrawal
bash scripts/mainnet-runbook.sh 15 --resume
bash scripts/mainnet-runbook.sh 17
bash scripts/mainnet-runbook.sh 18
```

The explicit owner abandonment requires its own public checks/attestation and
clears no USDC receipt: it does not claim returned money or refund the reserved
rolling-day withdrawal budget. A second withdrawal is outside this recovery exit; rolling-day usage remains
charged until it ages out (the helper checks the live 24-hour window). If an earlier tool already
paused the policy, flat settlement/withdrawal/spot return remain possible while
paused; unpause must wait until every discarded unconfirmed authorization expires
or is genuinely confirmed. After that, if needed:

```sh
npx --no-install tsx scripts/mainnet-owner.ts --step=unpause
```

A missing hash/request or ambiguous public outcome remains a STOP for manual
finalized-receipt reconciliation; never delete a journal to infer non-submission.
Expiry of a local pending callback does not prove absence of an external fill.

## Source checks

The fixes above are tooling only. The deployed source's owner/keeper checks,
recipient, $15 order/$30 day limits, margin health and withdrawal constraints are
unchanged. The second review's steps 2–5 rerun blocker is superseded by the owner's
confirmed finalized steps 1–8; rerunning setup is explicitly prohibited.

The on-chain replay/pause limitation is real; the claim that settlement itself
requires pause is disputed by `settle_position` and `owner_idle` (`lib.rs:670`,
`1070`). The earlier initializer gas/fee failure claim is also disputed: frozen
230 signer/30 callback Tgas and 1 yoctoNEAR satisfy the verified v3.18.0 signer.
The tool still checks live signer identity and configuration before use.

Signing and ledger behavior follow the
[official signing SDK](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/hyperliquid/utils/signing.py),
[nonce rules](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets),
[info API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)
and [exchange API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint).
Wallet-signing domain chain ID is **421614**, `signatureChainId` is `0x66eee`;
the payout network is Arbitrum One **42161**. Nonces are shared per signer and
cannot be reused. A user action's replay window differs from an IOC order expiry.

Signer provenance: live supported code hash
`CpGX8ywXJwvWPgZFDDCTCuPJBHF7BATT51gSfc3APERJ`, official
[v3.18.0 release](https://github.com/near/mpc/releases/tag/3.18.0), WASM SHA-256
`af8c66fd218f88bc6223d9d11eea7b6b1911ffd891d37ae3179f15cdf4a94955`.
The [matching signer source](https://github.com/near/mpc/tree/3.18.0/crates/contract)
provides the 1 yoctoNEAR deposit rule when its optional deposit view is absent.
Unknown release/configuration stops execution. No artifact is rebuilt for this
handoff. The completed mainnet trade and payout are documented in the executed-run section; source checks alone do not establish fills or destination receipt.
