# Unattended testnet keeper

## Recorded runs through 12 November 2026

These are saved report snapshots, not a current liveness check. All five runs
used keyless v3 on testnet with **opening disabled**. The first four JSONL snapshots show
heartbeats and fallback-price updates, 49 USDC perp equity, zero spot custody and
no position where venue data is available. No verified opens or reductions were
recorded. This establishes unattended monitoring, not multi-day carry or a live
protective-exit fill. Separately, the [supervised 12 November lifecycle](evidence/2026-11-12-v3-lifecycle-summary.md)
verified 4 wNEAR custody and an in-band 3.6 NEAR open/close; owner-assisted
opening is distinct from these unattended monitoring runs.

| Run (UTC) | Saved cycles | Confirmed heartbeats | Errors | Estimated missing intervals | Maximum cycle-start gap |
|---|---:|---:|---:|---:|---:|
| [10 Nov 19:07–20:08](../reports/keeper-run/2026-11-10T19-07-53-363Z-6d892ee6.md) · [JSONL](../reports/keeper-run/2026-11-10T19-07-53-363Z-6d892ee6.jsonl) | 13 | 3 | 0 | 0 | 327.611 s |
| [11 Nov 12:16–22:22](../reports/keeper-run/2026-11-11T12-16-04-347Z-9654a6dd.md) · [JSONL](../reports/keeper-run/2026-11-11T12-16-04-347Z-9654a6dd.jsonl) | 80 | 18 | 6 | 41 | 8415.541 s |
| [12 Nov restart 08:46; snapshot 08:47](../reports/keeper-run/2026-11-12T08-46-45-868Z-4c251f05.md) · [JSONL](../reports/keeper-run/2026-11-12T08-46-45-868Z-4c251f05.jsonl) | 1 | 1 | 1 | 0 | 0 s (one cycle) |
| [12 Nov restart 08:52; snapshot 08:57](../reports/keeper-run/2026-11-12T08-52-39-345Z-9fe1df24.md) · [JSONL](../reports/keeper-run/2026-11-12T08-52-39-345Z-9fe1df24.jsonl) | 2 | 0 | 0 | 0 | 276.597 s |
| [12 Nov restart 17:38; snapshot 18:49](../reports/keeper-run/2026-11-12T17-38-58-147Z-c3b1b13b.md) · [JSONL](../reports/keeper-run/2026-11-12T17-38-58-147Z-c3b1b13b.jsonl) | 15 | 3 | 1 | 0 | 316.72 s |

The release handoff reports that the 11 November host process exited around
22:21 UTC; the last saved cycle began at 22:21:46 and finished at 22:22:06.
Its rolling summary still says `running`, so that label is not evidence of
continued uptime. A [preserved stale lock](../reports/keeper-run/stale-lock-2026-11-11T12-16-04-347Z-9654a6dd.json)
identifies the previous run; the new report starts at 08:46:45 UTC on 12 November.
The logs do not independently establish the host-exit cause or exact time.
The fourth saved summary was updated at **12 November 08:57:36 UTC**: two
cycles over 297.359 seconds, no errors, no missing intervals and no cycles
without risk data. It confirms no new heartbeat, open or reduction in that
snapshot. Its `running` label does not establish current process liveness.

The fifth summary was updated at **12 November 18:49:49 UTC**: 15 cycles,
3 heartbeats, 1 error, no missing intervals or cycles without risk data, and
zero verified opens/reductions over 4251.34 seconds. This is a dated snapshot;
its `running` label does not establish current liveness. The live process,
lock and journals were not changed during this offline release edit.

The 11 November snapshot has four cycles without risk data and includes public
RPC failures and uncertain NEAR submissions. The restart snapshot has one
confirmed heartbeat, one cycle without risk data, and a rejected future-dated
Hyperliquid book timestamp. Errors and gaps are retained; later uninterrupted
operation cannot be inferred from these snapshots. Spot funding was pending in
the first four snapshots; it completed later on 12 November. Monitoring action
counts do not include the separately captured supervised v3 open/close.

## Running the keeper

From the repository root, with dependencies installed and Node >=22.19:

```sh
caffeinate -i npm run keeper:run -- --policy=policy-v3.counterweight-samet.testnet --hours=48
```

This starts the deployed v3 keeper for 48 hours on macOS and keeps the machine awake. Run after funding and key removal are publicly verified. It monitors and reduces existing shorts; opening is disabled. V3 cannot open autonomously: an owner must attest margin with `observe_margin` at most 30 seconds before an opening request, in addition to verified spot custody and the other bounds. The opt-in entry command is retained for supervised operation only (stop any existing keeper first):

```sh
caffeinate -i npm run keeper:run -- --policy=policy-v3.counterweight-samet.testnet --hours=48 --allow-open
```

`--allow-open` does not supply that owner attestation. The current planner does
not precheck its age and may hit `ERR_REBALANCE_STALE`; because the signature
journal is claimed before the CLI call, a failed request can leave a blocking
`.active.json`. Preserve it and reconcile the original operation before recovery.
Do not enable openings on an unattended v3 run. This release leaves the running
keeper implementation and journals untouched.

A live run requires an explicit `--policy`; it does not deploy/migrate contracts. The policy must designate `keeper.counterweight-samet.testnet` and the testnet MPC signer, and expose `get_state`, `get_rebalance`, heartbeat, keeper-price and order-signature methods. The known v3 account selects v3 exit semantics. Unknown or incompatible public responses block trading and are logged.

The executable `near` must be **near-cli-rs**, configured for testnet with the keeper's account already provisioned in the macOS keychain. The keeper invokes only these transaction methods:

- `heartbeat {}` (30 Tgas).
- `set_keeper_price {price, observed_at}` (30 Tgas).
- `request_order_signature {order}` (300 Tgas).

All use `attached-deposit '0 NEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send`. Child processes receive an argument array without a shell. The keeper does not read, export, accept or print private keys. Provision sufficient keeper gas and policy MPC operating balance separately. Keep the machine awake and the keychain available during unattended operation.

Dry mode uses the same public reads, risk engine, scheduler and reporting, prints exact `WOULD SEND near ...` commands, and invokes neither the CLI nor the exchange endpoint:

```sh
npm run keeper:run -- --dry
npm run keeper:run -- --dry --policy=YOUR_POLICY.testnet --cycles=1
npm run keeper:run -- --dry --policy=YOUR_POLICY.testnet --interval-seconds=10 --cycles=3
```

Bare `--dry` observes `policy.counterweight-samet.testnet`; use `--policy` to inspect the currently deployed account. Hours default to 48. `--cycles` limits observations for demos. `--interval-seconds` defaults to 300 and accepts 1–300 seconds. Options must be unique and use `--name=value` except `--dry` and `--allow-open`.

Stop with **Ctrl-C** or send SIGTERM to the keeper process. It stops scheduling new transactions, lets the current bounded operation finish, writes the final summary, and releases its process lock. A CLI operation can take up to 90 seconds; public requests have 15-second timeouts and bounded RPC retries. Network requests already in flight can delay shutdown. Never use a second process to compensate for a delayed signature.

## Decisions and timing

Every cycle first reads finalized policy state and checks the heartbeat before auxiliary RPC checks or venue requests. Heartbeats are due at one third of the configured timeout. Cycle intervals are capped at one sixth of that timeout and jittered ±10%. RPC/MPC delays beyond the scheduled interval are reported as gaps. No program can heartbeat during a persistent chain/network outage or while the machine is asleep.

Public RPC reads start at `https://rpc.testnet.near.org`; failures alternate with `NEAR_TESTNET_RPC`, or `https://test.rpc.fastnear.com` when unset. Four attempts use exponential backoff and jitter, honoring HTTP `Retry-After` up to 20 seconds. RPC error envelopes, including rate limits returned with HTTP 200, are retried. These retries apply only to reads. Standard HTTP proxy variables are honored without logging credentials. near-cli-rs uses its own configured testnet RPC.

Hyperliquid reads and relays are fixed to **TESTNET**. The keeper locally derives the policy's address from the public MPC root and checks the signer view at the same finalized block. It fetches NEAR mark/current funding, funding history, the order book, derived-account `clearinghouseState`, and open orders. Risk comes from `packages/domain`: H in USDC equals venue equity minus fee reserve minus conservative upper-band notional. The trigger is strictly `H < upper-band-notional × min_headroom_bps / 10000`, rounded up to micro-USDC. Limits on `get_state().limits` take precedence; otherwise configured rebalance limits supply the reserve/threshold; absent both, the shared convention is a $0.10 reserve and 1000 bps. Each record includes the chosen settings and threshold in USDC. This is a model based on public observations, not a liquidation guarantee.

The v3 keeper refreshes stale or changed fallback prices across the contract's sanity range ($0.00001–$1,000,000); opening still requires the configured opening bounds. Historical policies retain the immutable-band cache restriction. Observations must be at most 30 seconds old. It respects fresh public-oracle precedence when constructing the expected contract price. It submits an IOC buy with the venue's **reduce-only** flag for a low-headroom short, bounded by actual quantity and contract reduction authorization. V3 exits include `observed_at` in seconds and use a fixed mark +1% cap rounded down to the venue tick, independently of opening bounds and the configured opening price band. V3 can reduce while paused. Pending state, open orders, unexpected long/other-coin positions, stale data, incompatible metadata, or policy access keys block new orders; pauses block opening and historical-policy reductions. It never sells spot, withdraws, settles exposure, changes limits, or calls owner methods.

Opening is off by default. `--allow-open` permits an entry only from a reconciled flat account with zero reserved exposure, after prior authorizations expire and cooldown elapses. On v3 it additionally requires the fresh owner margin attestation above; the keeper never calls that owner method. Size stays within owned spot, max short, per-order and remaining daily caps; funding history, current positive funding, depth, minimum venue order, equity and headroom checks must pass. Contract checks remain authoritative. Reductions do not release contract reservations; owner settlement remains separate. Restarting without `--allow-open` will not relay an unsent opening signature.

## Audit files and recovery

Each run prints its ID and writes under `reports/keeper-run/`:

- `<run-id>.jsonl`: one JSON line per completed cycle, including timestamps, mark, funding, signed position, equity, H, threshold, decision, exact commands, NEAR and Hyperliquid transaction hashes, raw venue responses, public reconciliation and errors. Missing observations are explicit `null`s. Records are flushed to disk.
- `<run-id>.md`: atomically replaced rolling summary, finalized on shutdown. It records uptime, cycles, confirmed heartbeats, publicly verified reductions/opens, error count, estimated missed intervals, maximum start-to-start gap and cycles lacking risk data. Dry proposals do not increment action counts. Uptime includes shutdown work; gaps compare consecutive cycle starts with the scheduled interval.
- `<policy>.active.json`: durable signature journal, claimed **before** invoking near-cli-rs. No second signature is requested while it exists.
- `relay-<near-hash>.json`: exclusive durable claim written before the exchange request, with the exact public request and validated receipts. Claimed signatures are never resubmitted, including after HTTP 429, timeout, lost response, crash or restart.
- `verified-<near-hash>.json`: public fill/order/position-delta evidence. Only this reconciliation clears the active journal. A signature or HTTP success alone is not counted as a reduction.
- `<policy>.lock.json` (or `<policy>.dry.lock.json`): prevents concurrent runs for that policy and mode.

MPC receipts must reach FINAL with successful matching request/signature events, exact keeper caller/ABI/payload, bounded nonce/expiry, matching digest, recovered derived signer, unchanged code hash across receipt blocks and zero policy access keys. Exchange submission requires at least three seconds until expiry. When a known transaction is still awaiting a fresh callback, public follow-up cycles temporarily run at five seconds. Polling never reissues a signature request. Public indexing lag is retried in subsequent cycles. A lost exchange response can be resolved through a unique order's public fills and matching position delta; the exchange request itself is never retried.

If a CLI timeout loses the transaction hash, or a signature expires before relay, the journal deliberately blocks further signatures. Heartbeats and observations continue. Keep the journal/claims as audit evidence. An operator must reconcile the original NEAR transaction, callback expiry, open orders, fills and position before any manual recovery; restarting alone never authorizes a replacement signature. A venue rejection or unproven fill also retains the journal. Do not delete it to force another attempt. No automatic operator recovery is attempted.

After SIGKILL or a machine crash, a lock can remain. Confirm the recorded PID is no longer running, preserve the lock as evidence, then remove only that stale `.lock.json` before restarting. Preserve all `.active.json`, relay and verified evidence files. A crash after an exclusive relay claim conservatively consumes that claim even if no exchange request was actually sent. Archived verified evidence remains authoritative if a crash occurs before the next cycle line/summary is written.

Tests are offline, with mocked RPC/venue/CLI and temporary report directories:

```sh
npx vitest run scripts/keeper-run.test.ts
npm test
npm run typecheck
```
