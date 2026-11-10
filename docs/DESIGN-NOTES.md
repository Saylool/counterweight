# Signing requirements for the contract engineer

These are required controller rules. The implementation and remaining external proof boundaries are documented in the 2026-11-10 revision below.

## Nonce allocation

Persist `last_nonce` per derived Hyperliquid signing address. Allocate and persist each authorized signing request atomically as `nonce = max(last_nonce + 1, block_timestamp_ms())`. Use milliseconds, never NEAR's nanosecond `block_timestamp`. Concurrent requests in the same block must receive distinct nonces. Failed MPC callbacks must not roll the counter back or reuse a nonce. Bound clock drift and allocation throughput so the counter cannot run far ahead of wall time.

## Expiry and keeper signing budget

Every production L1 signature must bind a tight `expiresAfter` selected by the contract. Start with a maximum 60-second lifetime from nonce allocation, subject to measured MPC latency; do not let a keeper extend it. Recheck freshness before returning/relaying a signature. An expired action costs 5x address rate limits, so expiry alone cannot stop a malicious keeper from exhausting the venue budget.

Enforce an on-chain keeper rate limit per signing address, counting signing authorizations including pending/failed requests. Set bounded per-block and rolling-window budgets and an outstanding-request cap; reserve capacity for owner emergency deleveraging and nonce invalidations. Specify these limits as contract parameters with tests before deployment. Keepers cannot choose arbitrary nonces, expiries, payloads, or invalidate someone else's emergency capacity.

## Pause and withheld signatures

On `pause`, stop new keeper authorizations and discard pending keeper callbacks. Track outstanding authorized nonces, including withheld signatures. Authorize and relay authenticated Hyperliquid `noop` nonce invalidations for every outstanding nonce; a local pause flag cannot revoke an off-chain signature. Issue each invalidation using the nonce being consumed and confirm venue acceptance. The owner emergency path needs reserved signing/relay capacity. Treat the pause as incomplete until invalidations are confirmed or all outstanding signatures have expired. Merely issuing one newer nonce does not invalidate older signatures in Hyperliquid's 100-largest-nonce window. Include same-block allocation, withheld-signature replay across pause, expiry, keeper-budget exhaustion, and invalidation confirmation/failure cases in the contract tests.

## Custody and proof boundary

Never fund the owner-EOA probe address. Direct owner MPC requests bypass controller policy. Fund only the strategy address derived from the audited policy contract predecessor after policy and immutable custody checks. `approveAgent` and `usdSend` remain interoperability-only codecs; they must never be authorized through the controller or proof relay.

The testnet proof relay is deliberately separate from production rules: only an unfunded order-ID-zero cancel, no vault or expiresAfter, nonce at most 30 minutes old and at most 60 seconds ahead. Plans are one-use and consumed before relay submission, including transport failures. Production keeper actions instead require the tight expiry and on-chain limits above.

## Cross-venue rebalance actions and contract safety limits

The replay's paired fills and one-hour 1Click completion are assumptions, not an
implemented atomic cross-chain operation. The controller must add these explicit
capabilities before this policy can operate. No generic arbitrary payload signer,
recipient override, private key, `usdSend`, or `approveAgent` authority is implied.

- **Spot sale route:** owner-approved exact route, or a keeper-bounded NEAR-to-USDC
  sale authorization. Fix token IDs, source account, destination chain and strategy
  Hyperliquid margin address in policy. Bound per-action NEAR, minimum received USDC,
  maximum route/protocol fee and price impact, quote age/deadline, and rolling daily
  turnover. Reserve inventory atomically against outstanding routes. Compare completed
  spot and perp fills in NEAR units; a dollar-value match is insufficient. Start with
  owner approvals until asynchronous fill reconciliation is audited.
- **Margin top-up:** accept proceeds only from that recorded route into the fixed
  strategy margin account. Bind route ID, amount range, chain/token and destination;
  prove finality/receipt and reconcile actual credited margin before spending it.
  Pending or refundable proceeds are not margin or stress headroom. One pending route
  per strategy, idempotent callbacks, bounded completion timeout, and no double credit.
  A paired spot sale must accompany a reduce-only short buyback, with quantity bounded
  by existing matched inventory. Reserve perp fees and the margin needed during latency.
- **Margin withdrawal to fixed recipient:** policy allowlists the owner's strategy
  spot funding account/1Click deposit recipient, immutable to the keeper. Owner approval
  for recipient changes with pause and delay. Bound per-action/rolling USDC withdrawal,
  fee, minimum residual venue equity and H, and any venue withdrawal availability limit.
  Deduct the full withdrawal immediately from usable margin. Require finalized receipt
  before spot acquisition and matching short increase; never front-run a pending arrival
  with an unbacked short. Requote and recalculate quantity from arrival prices and net
  received funds. No withdrawal of third-party collateral or external top-up assumption.
- **Paired increase:** cap both legs at initial approved NEAR inventory and original
  target dollars for additions, venue size precision, $10 replay minimum adjustment,
  leverage <= 1 after fees, approved liquidity/impact limits, and owner's total exposure
  limit. Check lower/target/upper H bands and interim H >= 10% notional using fresh
  authenticated balances/marks and conservative fees. Replay's selected 30/60/90% bands
  and one-hour latency are historical model settings, not production safety guarantees.
- **Asynchronous failure:** use an on-chain state machine for intent, spot/perp fills,
  route dispatch, final receipt, reconciliation and completion/refund. Prevent duplicate
  keeper actions and additions while unresolved. Enforce a maximum temporary NEAR mismatch,
  timeout and owner emergency capacity; reject excessive mismatch and pause new risk.
  If an actionable band cannot be restored within caps, authorize bounded full unwind
  with paired spot disposal and reduce-only perp close. Never credit a negative venue
  balance as a financed strategy outcome. Real gaps can preclude an executable unwind.

All actions inherit the nonce, tight `expiresAfter`, signing budgets, pause/noop
invalidation, and custody requirements above. Test malicious recipients, stale quotes,
slippage/fee bounds, route failure/refund/late and duplicated callbacks, partial fills,
withdrawals during an unresolved top-up, latency stress, cap exhaustion, and emergency
pause while a signature or route is outstanding. No contract code is changed by replay.

## Implemented policy revision — 2026-11-10

The controller implementation is in `contracts/policy/`. The requirements above
now have owner-approved on-chain sale/receipt and withdrawal state machines;
external venue balances, fills, and finality remain **owner attestations**, as in
DESIGN Part B. There is no oracle, light client, solver, atomic paired fill, or
automatic public-network execution claim. The configured route adapter is a
separate, immutable, owner-approved execution trust boundary. A keeper cannot
approve a sale, change a route, attest a fill/receipt, or invent usable margin.

### Reduce-only recovery and prices

All buys that close shorts are IOC with `r=true`. They take a caller-supplied
current micro-dollar mark, bounded to $0.00001–$1,000,000, and apply a 50% buy
slippage band. They never consult the owner reference mark or its age. Public
`deleverage(price)` requests the larger of reserved exposure and configured maximum
short size, so even an understated zero settlement cannot eliminate recovery.
Owner `emergency_reduce(size, price)` accepts any positive exact-lot size. The
venue's reduce-only rule prevents an oversized order from creating a long.
Keepers pass `order.reference_price` only for reductions; opens reject overrides.
This deliberately trades a wider adverse-execution allowance for recovery during
owner absence. IOC liquidity and movement beyond that band can still prevent fills;
callers must obtain a fresh public venue mark. These inputs are not an oracle.

Prices are quantized with integer arithmetic: floor opens, ceil reduce-only buys;
at most five significant digits and at most `6 - szDecimals` fractional digits,
with Hyperliquid's exception allowing integer prices of any digit count. The
initializer rejects `size_decimals > 6`. Source:
[official tick/lot rules](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size).
Read-only `POST /info {"type":"meta"}` on 2026-11-10 Istanbul time reported
NEAR `szDecimals=1`, testnet index **54**, mainnet index **74**
([captured metadata](../contracts/policy/fixtures/near-market-meta.json)). Metadata must be
rechecked before initialization; index 4 / precision 2 in old mock tests is
synthetic, not NEAR metadata. Mainnet initialization remains prohibited.

### Revocation, replay, and operating resources

Emergency and public recovery pause new keeper signing and mark unexpired keeper
nonces for original-nonce noop invalidation. Detaching a callback never revokes a
public signer receipt. Recovery closes remain available while that queue is
unresolved. Owner relay confirmations remain a stated trust boundary.

`withdraw3` is zero-short-only. Its authorization is retained until original
nonce + two days + one millisecond, even if its 60-second local callback times out.
Pause includes these nonces; each noop has a fresh expiry of at most 60 seconds,
not the withdrawal's two-day replay horizon. No retry is allowed while a previous
withdrawal is unresolved. After confirmed noop consumption (or natural replay
expiry), the owner must explicitly abandon the withdrawal and refresh finalized
margin before retrying. Sources: [nonce window](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets),
[expiry and user-signed actions](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint).

Delegated keeper/public authorizations share an owner-granted cumulative epoch
budget of at most 5,000 address-weight units, charging **five** on authorization,
including cancels, reductions, pending requests, and failures. This reserves half
the initial 10,000 address allowance for owner recovery/invalidation. There is no
automatic reset or inferred trading-volume credit: the owner must verify actual
venue capacity before granting another epoch. Existing block/window caps remain.
This bounds authorized requests, not repeated HTTP spam of already-public bytes.
Source: [official address rate limits](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits).

Owner-configured MPC fee and signer/callback gas replace hardcoded resources.
Defaults: 1 yoctoNEAR, 230/30 Tgas, plus 25 Tgas execution reserve (285 total).
Zero-deposit signing uses the policy operating balance with a 0.01 NEAR/request
cap and storage stake + 128 KiB floor. Positive deposits must cover the whole fee;
excess returns to the caller. Existing caller/rate/outstanding/address budgets
remain in force. A low-gas or reserve-exhausted pause still commits locally and
queues invalidation for a later adequately funded/gassed call. A definite
failed signer receipt releases only its opening exposure; nonce, cooldown, and
rolling turnover charges remain consumed. Malformed, oversized, missing, and
late/detached success responses remain uncertain. Open turnover is rolling 24h.

### Exact spot sale and margin top-up

`configure_rebalancing` fixes the adapter, source wNEAR/current policy account,
HyperCore USDC identifier, Hyperliquid destination, and strategy margin address
once. Withdrawal destination remains the initializer's fixed owner EVM recipient;
no recipient-change entry point exists. The HyperCore asset identifier is
`1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054`, from the
[NEAR Intents Hyperliquid integration](https://docs.near-intents.org/integration/distribution-channels/1click-api/hyperliquid).
The 1Click asset uses 8 decimal places; policy amounts are USDC micro-units (6), and the adapter must convert exactly (multiply micro-units by 100), never compare raw units across domains. The local sandbox adapter is explicitly a mock; a real, independently audited
adapter/network route must exist before this can execute externally.

`approve_spot_sale` requires exact owner approval, a fresh quote/owner mark,
per-action and rolling-day NEAR caps, exact lot size, fee/impact limits, positive
price-derived minimum USDC, and a short quantity already released by expiry-gated
owner position settlement. It reserves matching released quantity and inventory
before NEP-141 `ft_transfer_call` to the fixed adapter. The exact route message
binds source, route ID, token/chain/recipient, amount, minimum output, costs, and
quote deadline. One pending route blocks additions, second routes, spot withdrawals,
and margin withdrawals; emergency reductions remain available.

Dispatch tracks actual NEP-141 **used** tokens. Returned unused tokens release
only corresponding inventory. Failed/malformed callbacks retain reservations and
pause. A bounded completion timeout pauses and retains the route; it never credits
assumed refunds. Owner `reconcile_sale_receipt` attests the finalized fixed-route
USDC credit and actual returned wNEAR, checks proportional minimum output for
partial fills, and credits only actual proceeds. Late receipts can resolve an
unresolved timed-out route; late/replayed dispatch callbacks cannot alter it.
Receipt hashes prevent crediting the same receipt twice across routes. Sale
turnover stays charged on refunds/failures. Negative balances and pending proceeds
are never usable margin. Receipt history is bounded to 1,024 finalized receipts;
rolling turnover histories are bounded to 1,024 entries each.

### Fixed-recipient margin withdrawal and funded re-entry

Before `withdraw3`, the contract checks zero reserved short, no unresolved route
or withdrawal, per-action/rolling USDC limits, freshly observed venue withdrawal
availability, residual equity, conservative fees, leverage <= 1, and headroom
`H = (equity - fee_reserve - upper_band_notional) / upper_band_notional` of at
least the configured floor (minimum 10%). It immediately removes the **full**
withdrawal from usable margin and withdrawal availability, even on signer failure.
No callback assumes a bridge receipt or refunds margin.

`reconcile_margin_withdrawal` accepts the owner's finalized fixed-recipient receipt
only for the recorded nonce/amount, with net received + fee equal to the reservation
and fee below the configured cap. It then waits for actual authenticated owner
wNEAR deposits before a matched short addition. Re-entry uses fresh marks and net
arrived dollars, exact lots, at least $10 upper-band adjustment, original approved
NEAR and dollar ceilings, conservative margin/fees, and owner-selected lower/target/
upper H bands. An increase must start above the upper band, improve distance to
the target, and remain above the lower band and hard floor. No replay model latency
or 30/60/90% selection is assumed to be a universal safety guarantee.

### Keyless custody and relay integration

Owner `sweep_native` transfers only to the fixed NEAR owner and retains current
storage stake, 128 KiB future bounded-state storage, and 1 NEAR operating reserve.
The funding preflight `contracts/policy/tools/check_custody_keys.py` requires zero
access keys at a finalized block, rejecting both full-access and direct-signer
function-call keys. This must be run after local installation/key removal and
before funding. The contract cannot introspect its own access-key list; leaving
an access key defeats custody regardless of contract tests. Immutable account,
market, path, and recipient choices intentionally require a fresh controller to
change; MPC resources and delegated signing allowance are owner-configurable.

The scoped `contracts/policy/relay/signing.ts` supports noop without changing files
outside the authorized edit scope. Policy request consumers must use this module
for invalidations; the unchanged `packages/hyperliquid/src/signing.ts` still rejects
noop. Its test assembles an actual unit-host pause request and the captured public
MPC response, and compares four official SDK noop vectors. Signature callbacks
accept flat/nested MPC schemas and reject zero/out-of-range/high-s scalars. Full
curve validation, recovery, and binding to the derived signer address remain the
relayer's responsibility; this cheap Low hardening is not a full cryptographic
signature-verification claim.
