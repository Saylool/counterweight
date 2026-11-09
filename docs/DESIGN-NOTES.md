# Signing requirements for the contract engineer

These are required controller rules. This TypeScript change does not implement contract code.

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
