# Known issues

## UI Send funds spot; owner class-transfer upgrade prepared

The owner reports 50 mock USDC at policy-v2's derived address in
`spotClearinghouseState`, with perps accountValue 0. UI Send offers no perp
destination. Use the [in-place upgrade and to-perp instructions](FUNDED-LIFECYCLE.md#upgrade-the-already-initialized-v2-current-run)
to move 49 USDC within that same account. The old deployed `d85b2f91…` code cannot
do this. The new artifact is prepared locally and has not been deployed by this
change. Full-access key retention permits upgrade; do not delete it until the
lead has deployed and checked the new code. Do not reinitialize v2.

`usdClassTransfer` is user-signed with no venue expiry; the local 60s callback
and relay freshness checks do not revoke an already disclosed signature. Relay
claims prevent repeat submission of a NEAR tx hash. Never retry an uncertain
transfer; inspect both spot and perps balances and the saved evidence.


## 1. Delegated function-call key MPC fee — fixed in the next artifact

Zero-deposit signing now pays the configured MPC fee from the policy's native
operating balance. The subsidy is capped at **0.01 NEAR per authorized request**;
caller checks, block/window limits, outstanding limits and cumulative keeper
address budgets still apply. Storage stake plus **128 KiB** future state growth
must remain funded after paying the fee. The existing owner sweep retains that
same storage floor **plus 1 NEAR** for operations. Top up the policy with an
ordinary native transfer when needed; there is no automatic refill. A partial
positive deposit below the fee fails; a deposit covering the fee retains the
existing excess-refund behavior. Failed signer receipts refund the policy via NEAR.
No policy access key is needed. Keeper function-call keys must target the policy,
allow only intended keeper methods, and have sufficient gas allowance.

The previous deployment `policy.counterweight-samet.testnet` still runs
`698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289` and still
requires an attached fee. Its full-access policy key is intentionally retained
until final code freeze. The reserve-funded fix is deployed on initialized v2 at `d85b2f91…`.
The new same-account transfer artifact is `1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a`;
upgrade existing v2 without init as documented above.
Deleting all keys freezes that account's code irreversibly under this ABI.

The local demo uses library-managed disposable local keeper keys, attaches zero
for signing, and keeps the policy account keyless. A Rust sandbox regression
actually signs through a restricted function-call access key. No real wallet
credentials are used. See [deployment and rehearsal commands](TESTNET-DEPLOYMENT.md).

## 2. Live proof expires after 60 seconds; rehearsal is not final custody evidence

The 60-second window begins in the policy request block and includes MPC signing,
NEAR finality, receipt verification and HTTP relay time. Start `prove:contract:live`
before running its printed keeper command in a second terminal, then paste the
hash immediately. Less than three seconds remaining fails closed. An old tx such
as `5ThwVx4mRcfAKBWCqWEcF2kUqMuUsqAL887yVtbqzaP9` cannot be revived.
`--rehearsal` requires a full-access policy key in the current finalized view and
at both proof receipt blocks. Console and JSON/Markdown evidence explicitly say:

> REHEARSAL — policy account still had a full-access key; not the final keyless proof

Final mode requires zero keys at both receipt blocks and the committed WASM hash.
The historical hash override is restricted to rehearsals on the original account.
Neither mode proves funding, fills, or every policy invariant.

## 3. Demo attack semantics and owner boundary

Part B permits bounded non-reduce opens. The demo rejects a forged price-bearing
non-reduce replacement for a close with `ERR_OPEN_PRICE_OVERRIDE`, and separately
exceeds the hedge cap. Signing nonces are allocated internally; there is no raw
payload or caller-nonce signing method. Callback replay is rejected by the private
wrapper; this does not claim venue rejection of a reused mock signature.

The autonomous replay, attacks and public dead-man recovery leave the owner nonce
and balance unchanged. Mock fills do not release contract reservations. A clearly
marked **OWNER RESUMED** phase then waits for expiry, unpauses, configures the fixed
mock route, owner-attests the fill with `settle_position`, approves the exact spot
sale, and reconciles its mock finalized receipt. The timeline ends with zero spot,
zero reserved short and credited margin. MPC, token transfers, route execution and
venue receipts are simulated; there is no live adapter or live fill proof.

## 4. Blind-review alignment and oracle availability (2026-11-10)

Replay reports before this revision used a different headroom formula and invalid
open-short withdrawals; those reports are superseded. Regenerated reports use
contract upper-band notional and micro-unit rounding, fee reserve and minimum
headroom, quantity/notional/cooldown/sale caps. Research sizes have explicit scaled
caps, rather than claiming to run unchanged under policy-v2's tiny limits. The
cross-layer TS test invokes real Rust contract methods on identical scenarios.
Margin withdrawal still requires zero reserved short; reverse rebalancing is disabled
in replay. Settlement, equity and route finality remain owner-attested.

Pyth officially retired NEAR support on 2026-08-26. The init plan has no oracle account,
and uses the immutable bounded keeper fallback described in [ORACLE](ORACLE.md).
The optional Pyth-compatible reader is tested against a local mock only, not a
maintained public NEAR deployment. Stale/absent/uncertain feeds never refresh the
oracle cache. Fresh oracle readings take precedence; owner fallback cannot override
them. Fixed fallback bounds cannot ratchet; motion outside them fails closed and
can prevent fills. The dummy $0.95–$1.05 proof configuration must not be funded.

Keeper/public reductions now have configured price bands and bounded quantities.
README authority tiers publishes the conservative $1,060.978 lifetime direct buy-debit
ceiling at the current plan's limits, with fee and owner-replenishment assumptions;
this is not a total portfolio-loss or liquidation guarantee. Subsidized MPC costs
have a separate worst-case 10 NEAR lifetime ceiling at the per-request fee maximum.

Network is now an immutable `Testnet` / `Mainnet` init enum, binding both account
checks and signing domains. Mainnet deployment/operation is untested and not claimed.
The shared Hyperliquid package now handles noop; the duplicate relay codec is removed.
That historical network/oracle layout required a fresh controller when moving from v1.
Initialized v2 already uses it. The current class-transfer upgrade preserves that
layout and uses the retained full-access key for code deployment without init.
No deployment, key removal, funded venue lifecycle, or testnet send was performed
in this revision. Existing dated on-chain evidence still describes the old artifact.
