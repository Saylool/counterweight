# Known issues

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
until final code freeze. This fix is **not deployed**. The next default artifact is
`e8bfa3d5e93c2ea85bd99be5b71a97508a90046f79b9d00aab34b2e9f0d6c48a`;
use a fresh account such as `policy-v2.counterweight-samet.testnet`.
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
