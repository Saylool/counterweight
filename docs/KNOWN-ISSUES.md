# Known issues

## V2 retains the immutable-band exit bug; v3 is separately deployed

**Deployed keyless v2 has the band bug:** when NEAR leaves its fixed
$2.784560–$4.176840 band, keeper closes and public deleverage can panic
`ERR_PRICE_BOUNDS`. Deleting its keys made that code unupgradable. Do not describe
its dead-man exit as available across price regimes. It also rejects withdrawals
while a short is open and requires the dummy route for flat withdrawals.

The separate [deployed v3 policy](POLICY-V3.md) removes those
contract gates and adds independent exit rate capacity, adapter-free partial
withdrawals with post-withdrawal H checks, and cancellable 24h owner opening-bound updates.
V3 is **deployed keyless** as `policy-v3.counterweight-samet.testnet`, derived
address `0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5`. The
[saved code/key proof](evidence/2026-11-11-v3-proof.json) records zero keys and
WASM SHA-256 `052d4d8758a1e470c5d6c32ff8610564c39dde47194d7a4de42f97a2c587838c`.
[12 November lifecycle evidence](evidence/2026-11-12-v3-lifecycle-summary.md) verifies
4 wNEAR custody, a keeper IOC short of 3.6 NEAR @ 3.3788 and a reduce-only buy
of 3.6 @ 3.3796, leaving the venue flat with 48.986173 USDC equity. Both successful
requests have zero policy keys at their request/signature receipt blocks and recovered
signers matching the derived address. The historical close capture reserves 3.6 NEAR;
the owner subsequently reports [successful settlement](https://testnet.nearblocks.io/txns/CYFZdHDe7uqAeCceZAvxeBe8YWQQJQEea5oDJ1wz4D93)
after open expiry on 12 November with `short_size: "0"` and
`observed_at_ms: "1794509677914"`. The [archived status](evidence/2026-11-12-v3-settle-status.json)
prints the command and records the pre-settlement reservation, not a settlement receipt.
Current state: **not re-read** (sandbox public RPC DNS failure). Out-of-band exit authorization is locally tested;
this live close occurred inside the opening band and proves no live paused/out-of-band fill.
These changes do not repair v2; its historical WASM remains separately pinned.

The first v3 opening request failed with `ERR_REBALANCE_STALE`. V3 opens require
an owner `observe_margin` attestation no more than 30 seconds old: the keeper
cannot open alone; it can reduce alone. `scripts/lifecycle.ts` now prints the
owner observation last, immediately before the keeper request for v3 opens;
v2 trading and closes omit it. The successful open capture records that command
order, and the close capture records keeper-only commands. Margin and settlement
remain owner attestations without an on-chain venue verifier.

V3 build size is **343,212 bytes** after release stripping and Binaryen optimization
(previously 672,309). Its measured creation budget is **6.25131 NEAR**:
`(343212 + 847 + 131072) / 100000 + 1 + 0.5`. This fits the stated 7.36 NEAR
owner balance before owner gas/registration. Production overflow checks remain on.
The plan separates deployment/venue funding from later owner-selected spot deposits;
`--spot-only=true --spot-near=AMOUNT` prints that stage without changing the saved
plan. Recovered wNEAR needs no new wrap. There is no fixed 5-NEAR spot requirement.
All sandbox fixtures execute the shipped optimized production artifact. See
[build, reserve and staged funding details](POLICY-V3.md).

V2 cleanup **completed on 12 November**: pause, expiry, abandonment, owner wrap.testnet
registration and return of 4 wNEAR to the fixed owner. The archived [final status](evidence/2026-11-12-v2-cleanup-status.json)
verifies paused, expired, abandoned, spotReturned and ownerIncreaseVerified=true;
see the [transaction table, provenance and baseline](evidence/2026-11-12-v3-lifecycle-summary.md).
Those 4 wNEAR were then deposited into v3. The historical v2 fee-cap mismatch
(1 micro-USDC configured versus the actual 1 USDC fee) still prevents truthful
`reconcile_margin_withdrawal`; cleanup instead abandoned its expired reservation
without margin credit or any claim of destination-chain arrival.

V3's exit IOC guarantees at most 1% above its fresh **reported** mark (fees extra),
rounded down. With no authenticated oracle, callers can lie about price or timestamp;
there is no 1% guarantee relative to the real market, no absolute lifetime buy-debit
ceiling, and no guaranteed fill. Price sanity ($0.00001–$1,000,000), venue tick/size,
short-only direction, freshness and separate rate limits remain enforced. Signer,
venue, gas and fee availability still matter. See the explicit trust boundary in
[POLICY-V3](POLICY-V3.md).

## Keeper monitoring has interruptions; no autonomous trading proof

The current keeper's opt-in opening planner does not check the age of v3's owner
margin attestation before claiming its signature journal. A rejected
`ERR_REBALANCE_STALE` opening can therefore leave a blocking `.active.json`.
Keep openings disabled for unattended operation. Preserve and reconcile any
journal before recovery; restarting or deleting it is not proof that no signature
exists. The live keeper source, process, locks and journals were left untouched
in this offline release edit. See [the supervised-entry warning](KEEPER-RUN.md#running-the-keeper).

## V3 pause, concurrent callbacks and governance boundaries

Pause intentionally blocks additions/cancels while allowing reduce-only exits.
It does **not** revoke a compromised keeper's closing authority. Combined with
unauthenticated marks, that keeper can request adverse buybacks while paused;
rotate the keeper through owner `set_config` to remove its authority to request
new signatures. Already issued signatures retain their original venue validity.
The 24h timelock covers opening price bounds only: `set_config` changes to the
keeper, caps and configurable opening band take effect immediately.

The jury identified an untested multiple-exit edge case in the shipped v3 source:
while a spot withdrawal is pending, another exit writes the same
`v3:concurrent_exit` slot, overwriting its predecessor; timeout expiry removes that
slot without the normal uncertain-operation bookkeeping. The existing
single-exit/token-callback ordering tests do not establish safety for repeated
concurrent exits. Avoid treating that sequence as supported. Repair requires
contract changes, regression tests and a separately deployed successor because
the keyless v3 deployment is immutable. No deployed fix is claimed here.

## Mainnet user-signed actions are unsupported

Although the init enum accepts `Mainnet`, class-transfer and withdrawal builders
and their digest validation hardcode signature chain ID `0x66eee` / `421614`
in `contracts/policy/src/lib.rs` and `hl_digest.rs`. They do not select the
mainnet domain. Do not deploy or operate this artifact on mainnet. Correcting and
validating those domains belongs to a future artifact; both frozen testnet WASMs
and their manifests remain unchanged. No mainnet compatibility is claimed.

## Recorded monitoring limits

The [recorded-run table](KEEPER-RUN.md#recorded-runs-through-12-november-2026)
links each Markdown summary and raw JSONL. It reports heartbeats and price updates
with opening disabled and no verified opens or reductions. The 11 November
snapshot records 6 errors, 41 estimated missed intervals and an 8415.541-second
maximum cycle-start gap. The release handoff reports host-process exit around
22:21 UTC (last cycle finished 22:22); its saved `running` label is stale.
A new run started 12 November at 08:46 UTC; its one-cycle snapshot confirms a
heartbeat but rejects a future-dated venue book and lacks risk data. Continuous
uptime and later liveness are unverified by those snapshots. The separate
[supervised 12 November v3 run](evidence/2026-11-12-v3-lifecycle-summary.md) does
verify an open and reduce-only close; it does not establish autonomous opening
or continuous trading. Host exit timing/cause comes from the handoff, not an
independently captured exit event.

## Historical funded keyless v2 smoke test; v1 remains a rehearsal

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

The rendered demo predates the corrected narration in `docs/VIDEO.md` and
`apps/video/src/scenes.json`: “can authorize” out-of-band exits describes the
tested boundary; “keeps exits open” overstates fill availability. Re-rendering
alone cannot correct the existing spoken audio. Replacement narration and a
matching render remain outside this offline repo edit; no paid voice API was used.

Testnet only, supervised owner funding/observations/settlement/withdrawal approval, no on-chain venue light client,
no multi-day carry, Intents dry quotes only, no live rebalancing route, and no destination-chain arrival verification.
The v3 run records spot → open → reduce-only close → owner settlement (success reported by the owner); current state not re-read. The 4 wNEAR spot leg remains in v3 custody and directional after settlement. No v3 withdrawal is claimed. V2 price bands can block exit requests; IOC liquidity can prevent fills in either version;
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
The historical TS replay still requires zero reserved short; reverse rebalancing is disabled
in that replay. V3 contract partial withdrawals use the same post-withdrawal health
formula, tested against the TS engine; this revision does not rerun or alter replay economics. Settlement, equity and route finality remain owner-attested.

Pyth officially retired NEAR support on 2026-08-26. The init plan has no oracle account,
and uses the immutable bounded keeper fallback described in [ORACLE](ORACLE.md).
The optional Pyth-compatible reader is tested against a local mock only, not a
maintained public NEAR deployment. Stale/absent/uncertain feeds never refresh the
oracle cache. Fresh oracle readings take precedence; owner fallback cannot override
them. In deployed v2, fixed fallback bounds cannot ratchet; motion outside them fails closed and
bricks the exit request itself. V3 permits 24h time-locked owner band updates and
keeps exits independent of those bounds. The dummy $0.95–$1.05 proof configuration must not be funded.

Historical v2 keeper/public reductions have configured price bands and bounded quantities.
README authority tiers gives $1,060.978 for the historical cancellation fixture
and $22,036.913 for the funded v2 test mark, with fee and owner-replenishment assumptions;
this is not a total portfolio-loss or liquidation guarantee and is not a bound for v3. Subsidized MPC costs
have a separate worst-case 10 NEAR lifetime ceiling at the per-request fee maximum.

Network is now an immutable `Testnet` / `Mainnet` init enum, binding both account
checks and signing domains. Mainnet deployment/operation is untested and not claimed.
The shared Hyperliquid package now handles noop; the duplicate relay codec is removed.
That historical network/oracle layout required a fresh controller when moving from v1.
v2 was upgraded to the state-compatible class-transfer artifact before key removal, and the funded lifecycle
is recorded above. This release-engineering pass used public reads and local checks only; it performed no testnet sends.
