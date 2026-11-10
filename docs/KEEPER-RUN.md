# Unattended testnet keeper

From the repository root, with dependencies installed and Node >=22.19:

```sh
npm run keeper:run -- --policy=YOUR_POLICY.testnet --hours=48
```

Use the account provisioned by the contract engineer, including a v3 account when deployed. A live run requires an explicit `--policy`; it does not select a contract version or deploy/migrate contracts. The policy must designate `keeper.counterweight-samet.testnet` and the testnet MPC signer, and expose the existing `get_state`, `get_rebalance`, heartbeat, keeper-price and order-signature ABI. Unknown or incompatible public responses block trading and are logged.

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

The keeper refreshes stale or changed fallback prices only inside immutable oracle bounds. Observations must be at most 30 seconds old. It respects fresh public-oracle precedence when constructing the expected contract price. It submits an IOC buy with the venue's **reduce-only** flag for a low-headroom short, bounded by actual quantity and contract reduction authorization. Paused/pending state, open orders, unexpected long/other-coin positions, stale data, incompatible metadata, or policy access keys block new orders. It never sells spot, withdraws, settles exposure, changes limits, or calls owner methods.

Opening is off by default. `--allow-open` permits an entry only from a reconciled flat account with zero reserved exposure, after prior authorizations expire and cooldown elapses. Size stays within owned spot, max short, per-order and remaining daily caps; funding history, current positive funding, depth, minimum venue order, equity and headroom checks must pass. Contract checks remain authoritative. Reductions do not release contract reservations; owner settlement remains separate. Restarting without `--allow-open` will not relay an unsent opening signature.

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
