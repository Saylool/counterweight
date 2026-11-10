# Known issues

## Funded keyless v2 is complete; v1 remains a rehearsal

[Primary lifecycle evidence](evidence/2026-11-10-lifecycle-summary.md) now establishes a supervised funded testnet
run on `policy-v2.counterweight-samet.testnet`, committed WASM `1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a`,
zero access keys verified after [key deletion](https://testnet.nearblocks.io/txns/DGcGa5e5rjma3r7ohmP3Vhoshm9wdHMdU6DdA1ksS8eT).
Owner funding and the spot→perp transfer occurred while the temporary v2 key was present. Keeper open, close and
withdrawal records show zero keys at their receipt blocks.
The original `policy.counterweight-samet.testnet` retains a key and old WASM; it is a rehearsal only.
The earlier v2 upgrade/key-removal instructions are historical. Do not redeploy, reinitialize or rerun the funded run.
Deleting all keys freezes this policy's code under the current ABI.

## Withdrawal status matching — fixed; destination-chain arrival unverified

The signed `withdraw3` amount was 47.957074 USDC; public ledger `delta.usdc` is 46.957074 **net**,
with `fee: "1.0"`. The old matcher compared net against gross. The ledger also encodes nonce
1794331863418000 in microseconds versus action time 1794331863418 in milliseconds.
The corrected matcher uses exact micro-USDC net + fee = gross and checks the converted nonce when available.
It requires a unique entry in the action's bounded 24-hour window. Status now queries from that saved nonce,
so a recheck after a day does not silently omit the event. Minimal rows without fee/nonce use the documented
1 USDC testnet fee and unique amount/time correlation; they provide weaker identity evidence.
The Hyperliquid hash is separate from both the NEAR transaction hash and signing digest.
Regression tests use the exact recorded ledger shape, missing-field variant and wrong/ambiguous cases.
Original failed captures remain historical evidence. Public-ledger confirmation does **not** prove destination-chain arrival.
Never resubmit an uncertain signature. API result/history limits and fees may change; unmatched rows fail closed.

## UI Send lands in spot; owner-only class transfer was required

UI Send of mock USDC offered no perp destination. The owner separately moved 49 USDC from spot to perps
with a contract-signed `usdClassTransfer` before trading. This is a supervised funding step, not autonomous rebalancing.
User-signed transfers/withdrawals have no venue `expiresAfter`; local callback freshness does not revoke a disclosed signature.
Relay claims prevent local repeat submission of the same NEAR transaction. Inspect saved evidence and balances after uncertainty.

## Reserve-funded MPC and public RPC limits

v2 pays the configured MPC fee from its operating balance for authorized zero-deposit calls. Subsidy is capped at
0.01 NEAR per request; caller, signing-rate, outstanding and lifetime budgets remain enforced. Storage plus 128 KiB
future growth must remain funded; owner sweeping also retains 1 NEAR for operations. Native top-ups are manual.
Restricted keeper function-call keys are tested locally; a funded keeper lifecycle does not prove every key configuration.
v1 still requires an attached fee. See [contract checks](../contracts/policy/TEST_RESULTS.md).

Public NEAR RPC can return HTTP 429 during parallel reads. CLI readers share `NEAR_TESTNET_RPC` from
`packages/hyperliquid/src/chainsig.ts`; use an available public endpoint as described in [README](../README.md).
The browser uses build-time `VITE_NEAR_RPC` and needs CORS. Unavailable reads fail closed and do not establish custody.
Order proofs expire after 60 seconds; historical transactions cannot be revived. The read-only status path never relays.

## Remaining scope limits

Testnet only, supervised owner funding/observations/settlement/withdrawal approval, no on-chain venue light client,
no multi-day carry, Intents dry quotes only, no live rebalancing route, and no destination-chain arrival verification.
The 4 wNEAR spot leg remains directional after the perp close. Price bands and IOC orders can prevent fills;
signer availability, fees, liquidity, liquidation/ADL and owner mistakes remain risks.

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
v2 was upgraded to the state-compatible class-transfer artifact before key removal, and the funded lifecycle
is recorded above. This release-engineering pass used public reads and local checks only; it performed no testnet sends.
