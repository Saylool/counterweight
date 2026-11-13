# Policy v3 — exit availability and fresh deployment

**Deployed separately and keyless** at `policy-v3.counterweight-samet.testnet`,
path `counterweight-1`, signer `v1.signer-prod.testnet`. Its derived EVM address is
**`0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5`**, locally derived from the
public root and cross-checked against the signer's public view at block 277102080.
The [11 November code/key capture](evidence/2026-11-11-v3-proof.json)
records zero access keys and matching v3 code. The earlier [funding relay](evidence/lifecycle-relay-AEk3mDFkuVnVowPzfXRfPBBkk7ympuSR6cZfXk7eNN5s.json)
recorded 49 USDC in perps before spot funding. The [12 November lifecycle](evidence/2026-11-12-v3-lifecycle-summary.md)
then verified 4 wNEAR custody, a keeper short of 3.6 NEAR @ 3.3788 and a
reduce-only close @ 3.3796 to flat, with zero keys at both order receipt blocks.
Opening required a fresh owner margin attestation; the keeper closed alone.
The saved lifecycle does not document owner settlement. This live close was in-band; paused and
out-of-band exit authorization remains locally tested, with no guaranteed fill.
The [saved plan](evidence/policy-v3-plan.json) and
[printed commands](evidence/policy-v3-plan.txt) are deployment history, not
instructions to redeploy this keyless account. This release edit used local
evidence only and sent no testnet transactions.

The new production artifact is `contracts/policy/artifacts/counterweight_policy_v3.wasm`:
**343,212 bytes** (48.95% smaller than 672,309 bytes),
SHA-256 `052d4d8758a1e470c5d6c32ff8610564c39dde47194d7a4de42f97a2c587838c`.
The separate `counterweight_policy.wasm` remains the exact historical keyless v2
binary so existing replay/demo evidence and v2 code verification remain reproducible.
Both hashes are in `SHA256SUMS`. Every sandbox test now uses the exact optimized
production v3 artifact, including the old-layout compatibility test. Local `.testnet`
account aliases exercise production network guards; mock-token receipts replace
test-only balance setters. A regression compares deployed RPC code byte-for-byte
with the artifact and rejects test-only entry points.
The main Borsh state layout is preserved by versioned storage extensions for
margin-only policy, exit rate counters, and the bounds proposal. **No upgrade of
keyless v2 is possible or proposed.**

## Optimized build and native reserve

Run `bash tools/build-v3.sh` from `contracts/policy/`. It uses release `opt-level="z"`,
LTO, one codegen unit, aborting panics, stripped symbols, no debug info, and
**overflow checks ON**. [Binaryen](https://github.com/WebAssembly/binaryen) **123.0.0** is installed into a local npm prefix/cache
without sudo. The script runs `wasm-opt -Oz`, sign-extension lowering, control-flow
restructuring, function merging and GUFA, then checks production exports and the
350,000-byte ceiling. Rust **1.98.1**, target `wasm32-unknown-unknown`, with `cfg(near)`
produces the pinned artifact. See [reproduction commands](../contracts/policy/README.md#reproduce).
The SDK explicitly enables only its required `wee_alloc` feature; sandbox dependencies
stay optional and outside the production build. SDK-required serde features are
retained to preserve JSON behavior. Hex/decimal formatting avoids general formatting
machinery while retaining exact encoded bytes and golden signing digests.

The sandbox measures **847 bytes** of account, one ed25519 access key and initial
state beyond the WASM for this fixed initializer. Creation budget:

```text
storage = 343212 + 847 = 344059 bytes
reserve = (344059 + 131072) × 10^19 yoctoNEAR + 10^24 yoctoNEAR
        = 5.75131 NEAR
create  = reserve + 0.5 NEAR = 6.25131 NEAR
```

This uses [NEAR's storage rate](https://docs.near.org/protocol/storage/storage-staking)
of 10^19 yoctoNEAR/byte (100,000 bytes/NEAR),
the contract's 128 KiB growth allowance and 1 NEAR operating reserve. The plan
prints both the formula and **6.25131 NEAR**; this leaves **1.10869 NEAR** from the
stated 7.36 NEAR for owner gas/registration and other costs. Initialized storage and
the exact margin are regression checked in sandbox. Configuration/extensions consume
part of the margin; replenish operations as needed. No storage, signing, price,
margin or overflow protection was weakened. V2's artifact is unchanged.

## Protective exits

Keeper `request_order_signature` reductions, owner
`emergency_reduce(size, price, observed_at)`, and public
`deleverage(price, observed_at)` bypass the opening price range. `observed_at` is
seconds, not milliseconds; a caller-supplied reduction order has
`reference_price` (micro-USD) and `observed_at` (JSON decimal-string U64). A fresh
configured oracle no older than 60 seconds takes priority and ignores the caller hint; otherwise a fresh
cached keeper/owner mark can be used when the hint is absent. Explicit hints
require an explicit timestamp. All exit observations must be non-future and no
older than `min(60, oracle.max_age_seconds)` seconds. Public deleverage still
requires keeper heartbeat timeout. Caller hints do not refresh opening permission.

The wide, fixed sanity range is **10–1,000,000,000,000 micro-USD**
(**$0.00001–$1,000,000**) and does not depend on any proposed or active opening
band. It rejects zero, obvious scale errors and unbounded arithmetic; it covers
orders of magnitude beyond the initial market. Price must also be representable
on the configured venue tick. For this deployment's `szDecimals=1`, the minimum
tick is $0.00001. Other precisions can have coarser minimum ticks.

Every exit is a fixed-market **buy**, **reduce-only**, **IOC**, with quantity no
larger than `max(reserved_short, configured_max_short)`. For mark M the contract
sets `L = floor_to_venue_tick(floor(M × 10100 / 10000))`. Therefore any fill has
price **≤ 1.01 × M**, even after tick rounding; rounding never adds slippage.
The exit allowance is always 100 bps regardless of the owner's configurable
opening band. The venue cannot use the signed action to sell spot, increase a
short, open a long, change the market, or redirect funds. Fees are additional to
the price limit. IOC can partially fill or not fill; retry with a fresh mark.

**The 1% bound is relative to the supplied mark, not an authenticated market
price.** With `account_id:null`, keeper/public timestamps and prices are
attestations. A malicious caller can submit a false high mark within the wide
sanity range and permit an adverse short buyback up to that mark +1%. There is no
honest way to guarantee 1% against the true market while accepting unauthenticated
permissionless prices during an oracle outage. This revision guarantees the
signed IOC limit and reduce-only direction, not truthful price discovery or a
total portfolio-loss ceiling. A trusted live feed or verified signed price payload
is required for that stronger guarantee. Old v2 absolute debit/lifetime estimates
do not apply to v3 exits.

Pause blocks additions/cancels but permits keeper closes. Closes preempt pending
keeper signing slots without releasing their exposure; late callbacks cannot
clear the new operation. Reductions do not fill the 32-entry invalidation queue,
consume the keeper's opening/cancel address epoch, or use its rate counters.
Exit rate slots are separate: keeper 2/block and 8/minute, owner 16/minute,
public 1/minute at the default settings. Fresh owner signing callbacks retain their bounded serialization guarantees. A
pending spot-token transfer has a separate concurrent exit slot, so closing never
discards or waits for its callback. `get_pending_exit` exposes that signature slot;
both token/signature receipt orders preserve exactly-once token accounting. Fees, gas,
storage stake, nonce drift, signer availability, venue limits and liquidity still
apply. The product promise means opening-band/config/budget independence;
it cannot promise a fill during an outage. Exit authorizations are rate-bounded,
not lifetime-bounded; reserve subsidy is not an unlimited-lifetime cost guarantee.

## Adapter-free and partial margin withdrawal

`configure_margin_withdrawals(limits)` is owner-only and one-time. Its fields are
`per_withdrawal_usdc`, `daily_withdrawal_usdc`, `min_residual_equity_usdc`,
`min_headroom_bps`, `fee_reserve_usdc`, `max_fee_usdc`. No adapter or routing token
is configured. `observe_margin`, `request_evm_withdrawal`, receipt reconciliation
and abandonment work with it. Existing configured rebalancing uses the same margin
checks; the two configuration modes cannot replace one another or reset history.
The immutable EVM recipient remains the only withdrawal destination.

The blanket open-short prohibition is removed from `request_evm_withdrawal`.
For short Q (yocto-NEAR), fresh price P (micro-USD), opening stress band B,
pre-withdraw equity E, request W and fee reserve F, calculate:

```text
upper = ceil(P × (10000+B) / 10000)
N = ceil(Q × upper / 10^24)
H_after = E − W − F − N
require E−W ≥ min_residual_equity
require E−W ≥ F
require H_after ≥ ceil(N × min_headroom_bps / 10000)
```

This is the integer `policyDecision(action:'health', equity:E−W)` / TS
`stressMetrics.headroom` formula, including micro-unit rounding. Equality at the
policy floor is accepted. Equity observations must be ≤30 seconds old; price must also be ≤30 seconds old
when a short remains. Flat withdrawals need no price observation;
availability, per-action and rolling-day caps also apply. The full gross amount
leaves usable and withdrawable margin immediately. Pending withdrawals block new
margin observations, additions and duplicate withdrawals, while exits remain
usable. Receipt reconciliation checks exact net+fee=gross and the configured fee
cap; fees never restore usable margin. Venue equity/finality is still an owner
attestation. The wider TS replay's v2 withdrawal eligibility gate remains historical;
the new v3 cross-layer test uses its unchanged health calculation on post-withdrawal
equity. No new replay economics are claimed in this contract-scoped work.

## Time-locked opening bounds after key deletion

Owner `propose_price_bounds(min_price,max_price)` records new bounds and
`execute_after = block_time + 86400 seconds`. Bounds must lie within the same wide
sanity range and be strictly ordered. `get_price_bounds_proposal` exposes the
proposal. `cancel_price_bounds` removes it. Replacing a proposal resets the entire
24h delay. Only owner `execute_price_bounds` at/after the deadline applies it;
execution consumes the proposal. No full-access policy key or upgrade is needed.
Price setters cannot change bounds. Keeper/owner caches accept wide sane prices
for exits/health outside the opening band; accepting a cache update does not
authorize an open. Fresh oracle values outside the opening band
remain available for exits/health; **opens recheck the current band on every
request**, including after narrowing/recentering. Exits never wait for a proposal.

## Historical fresh deployment procedure (print only)

The account above is already deployed and keyless. Retain this procedure for
review; do not recreate, reinitialize or rerun funding for that account.

`npm run testnet:plan -- --owner-evm=<your fixed recipient>` now targets v3 and
creates `policy-v3-plan.json` exclusively. The existing saved plan uses the same
public owner recipient as v2; confirm it against owner intent before funding.
For any future, distinct account, generate a new plan with current market
metadata/price before execution. Do not use its captured mark as a fresh observation later.

The printed flow creates a fresh account, verifies the v3 hash, and atomically
deploys+initializes via its temporary account key. `new` permits the owner or the
policy account itself during initialization, allowing that atomic action; owner
and keeper still cannot be the policy account. Configure adapter-free margin,
verify identities/one temporary key, and manually fund the
**new derived address**. Deployment and venue funding can complete with zero spot.
Spot registration/deposit is an independent later stage; no new short can open
until actual spot custody backs it. Before deleting its sole key, explicitly request owner
`request_usd_class_transfer({amount:"49000000",to_perp:true})` on **v3**, verify the
public request digest/signature and venue result, then owner-attest actual equity
with fresh `observe_margin`. Use the v3 plan's 50 USDC per-request/100 USDC per-day
caps, $1 residual, $0.10 fee reserve, 10% H floor, and **$1 max fee**.

The `lifecycle` CLI defaults to historical v2; select `--policy=policy-v3.counterweight-samet.testnet` explicitly for v3.
All v3 calls/relays must specify v3, its new derived address, fresh observations,
and canonical public request digest checks. Delete the temporary key only after
venue funding/config validation. Owner spot deposits can follow key deletion.
Final verification uses `--policy=policy-v3.counterweight-samet.testnet
--plan=docs/evidence/policy-v3-plan.json`. The CLI rejects `--upgrade-v2`; the
historical exported upgrade builder remains only for existing rehearsal tests.
See [V2-CLEANUP](V2-CLEANUP.md) for the cleanup executed on 12 November and its archived proof.

For the later spot stage, print commands without RPC, deployment or saved-plan
changes:

```sh
npm run testnet:plan -- --spot-only=true --spot-near=4
```

The **4 wNEAR** was returned by v2 cleanup on **12 November**, after the
2026-11-12 17:31:03.419 UTC horizon, and deposited into v3 in
[6Y8MaKav…](https://testnet.nearblocks.io/txns/6Y8MaKavd49GAc7pTCSTzKf39qA5LmjKhPaC5SD6p4ia).
Do not repeat that completed funding stage. It was already wrapped. `--spot-near` accepts any positive
amount with up to 24 decimals, independently of the 5-NEAR signed-short ceiling.
Use `--wrap-spot=true` only when intentionally wrapping additional native NEAR.
A fresh full plan can also select `--spot-near=AMOUNT`; by default it prints an
explicit amount placeholder and no wrapping command. Match contract `spot_balance`
to token custody before trading. Fresh price/equity observations remain required.
