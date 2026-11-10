# Policy v3 — exit availability and fresh deployment

This source revision is **not deployed**. The fresh account is
`policy-v3.counterweight-samet.testnet`, path `counterweight-1`, signer
`v1.signer-prod.testnet`. Its derived EVM address is
**`0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5`**, locally derived from the
public root and cross-checked against the signer's public view at block 277102080.
Read-only capture and exact printed commands:
[evidence/policy-v3-plan.json](evidence/policy-v3-plan.json),
[evidence/policy-v3-plan.txt](evidence/policy-v3-plan.txt).
No keys were read and no testnet transactions were sent.

The new production artifact is `contracts/policy/artifacts/counterweight_policy_v3.wasm`:
SHA-256 `8d57d6b681ac68fb7e677c8d7b966c8715862a4ffdcbacfad2e4069dc31767f3`.
The separate `counterweight_policy.wasm` remains the exact historical keyless v2
binary so existing replay/demo evidence and v2 code verification remain reproducible.
Both hashes are in `SHA256SUMS`. Sandbox uses the newly compiled test-utils v3
binary; the old-layout compatibility test deploys the distinct default v3 artifact.
The main Borsh state layout is preserved by versioned storage extensions for
margin-only policy, exit rate counters, and the bounds proposal. **No upgrade of
keyless v2 is possible or proposed.**

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

## Fresh deployment procedure (print only)

`npm run testnet:plan -- --owner-evm=<your fixed recipient>` now targets v3 and
creates `policy-v3-plan.json` exclusively. The existing saved plan uses the same
public owner recipient as v2; confirm it against owner intent before funding.
Regenerate an archived **undeployed** plan with current market metadata/price
before execution. Do not use its captured mark as a fresh observation later.

The printed flow creates a fresh account, verifies the v3 hash, and atomically
deploys+initializes via its temporary account key. `new` permits the owner or the
policy account itself during initialization, allowing that atomic action; owner
and keeper still cannot be the policy account. Configure adapter-free margin,
verify identities/one temporary key, register/deposit spot, and manually fund the
**new derived address**. Before deleting its sole key, explicitly request owner
`request_usd_class_transfer({amount:"49000000",to_perp:true})` on **v3**, verify the
public request digest/signature and venue result, then owner-attest actual equity
with fresh `observe_margin`. Use the v3 plan's 50 USDC per-request/100 USDC per-day
caps, $1 residual, $0.10 fee reserve, 10% H floor, and **$1 max fee**.

The existing `lifecycle` CLI targets historical v2; do not use it for v3 signatures.
All v3 calls/relays must specify v3, its new derived address, fresh observations,
and canonical public request digest checks. Delete the temporary key only after
funding/config validation; final verification uses `--policy=policy-v3.counterweight-samet.testnet
--plan=docs/evidence/policy-v3-plan.json`. The CLI rejects `--upgrade-v2`; the
historical exported upgrade builder remains only for existing rehearsal tests.
See [V2-CLEANUP](V2-CLEANUP.md) for the separate unsent legacy cleanup procedure.
