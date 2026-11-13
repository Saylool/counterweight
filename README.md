# Counterweight

**Problem:** automating a short hedge for held wNEAR on Hyperliquid usually means giving a bot a hot key, or an agent key that can open any size.

**Counterweight:** a **keyless NEAR policy contract** (zero access keys) holds the wNEAR and signs only bounded Hyperliquid actions through **NEAR Chain Signatures** (`v1.signer-prod.testnet`). The submission combines funded testnet evidence, local sandbox demos and a historical replay.

- **Owner opens; the keeper can only de-risk on its own.** v3 opens are capped by held wNEAR, per-order/daily limits and an owner margin attestation at most 30 seconds old. The keeper can send reduce-only closes alone (also while paused), and anyone can call `deleverage` after a heartbeat timeout.
- **Nothing can leave to a new recipient.** Withdrawals use immutable recipients (`withdraw3` to the owner's fixed EVM address). This does not prevent trading losses from false marks, fees or liquidation.
- **Explicit trust boundary.** Venue state is owner-attested (no on-chain Hyperliquid light client). Exit prices are not authenticated: a false high mark can cost up to the perp margin; wNEAR custody is unaffected. See [Limitations](#limitations) and the [claims and limits](docs/CLAIMS.md).

[Watch the 94-second demo](docs/media/counterweight-demo.mp4) · voiced and subtitled.

**Try it without Rust or keys** (Node >=22.19.0; macOS arm64 or Linux x64). Installation needs internet; tests and demos then run offline with mocked MPC/venue inputs:

```sh
npm ci                  # Installed local NEAR sandbox 2.14.0 (...); npm install summary
npm run test:ts         # Test Files / Tests: passed; two Rust cross-layer tests skipped
npm run demo:local:v3   # shipped v3 WASM: PASS paused/out-of-band exits and the false-mark boundary
npm run demo:local      # v2 WASM: keeper close, PASS 7/7 rogue attempts rejected, dead-man recovery
npm run web             # read-only dashboard at http://localhost:5173
```

| Version | NEAR testnet account | Access keys | What it shows |
|---|---|---:|---|
| **v3 (current)** | [`policy-v3.counterweight-samet.testnet`](https://testnet.nearblocks.io/address/policy-v3.counterweight-samet.testnet) | 0 | 12 Nov: 4 wNEAR custody, keeper 3.6 NEAR short @ 3.3788, reduce-only close @ 3.3796, owner settlement ([summary](docs/evidence/2026-11-12-v3-lifecycle-summary.md)). Removes v2's exit price-band gate. |
| **v2 (historical)** | [`policy-v2.counterweight-samet.testnet`](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) | 0 | 10 Nov: 4 wNEAR custody, 49 USDC spot→perp, 3.5 NEAR short and close, fixed-recipient withdrawal that arrived on Arbitrum Sepolia ([summary](docs/evidence/2026-11-10-lifecycle-summary.md)). Cleaned up 12 Nov. |
| **v1 (rehearsal)** | `policy.counterweight-samet.testnet` | 1 | Unfunded signing rehearsal with a key ([proof](docs/evidence/2026-11-10-contract-proof-FAvY2YaKKFkri8nkC5X8ZMp8FfirtetWr5vThm746RPU.md)). |

See [Judge quickstart](#judge-quickstart) for setup details and expected output.

## What is proven

**v2 completed a supervised, funded testnet lifecycle on 10 November:** 4 wNEAR custody, 49 USDC spot→perp, keeper open and reduce-only close, owner settlement and fixed-recipient withdrawal. Funding preceded key removal; keeper trading and withdrawal were verified with **zero access keys at their receipt blocks**.

[Full summary and transaction table](docs/evidence/2026-11-10-lifecycle-summary.md) · [v2 policy on NEAR testnet](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) · [derived Hyperliquid testnet address](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390).

| Evidence | Exact public link / result |
|---|---|
| Owner deposits 4 wNEAR | [H4ecuHKF…](https://testnet.nearblocks.io/txns/H4ecuHKFutGfsfRY5S9v2DXfpRPQAibCSH9MiVdQ1vnt) |
| Owner moves 49 USDC spot→perp before key removal | [FnEqLsBC…](https://testnet.nearblocks.io/txns/FnEqLsBCYzBFx7E9Mn7EXWHQJFyWbncVBNafUNGLDmp3) |
| Key deletion | [DGcGa5e5…](https://testnet.nearblocks.io/txns/DGcGa5e5rjma3r7ohmP3Vhoshm9wdHMdU6DdA1ksS8eT); zero access keys verified |
| Keeper opens 3.5 NEAR short @ 3.5121 | [2ZHrq1du…](https://testnet.nearblocks.io/txns/2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd) |
| Keeper reduce-only closes @ 3.5212; flat | [65WWr7W1…](https://testnet.nearblocks.io/txns/65WWr7W1DSvDKLGjF8tVZJtzYzwL6NX8DGfh7QZeL8JW) |
| Owner settles reserved exposure | [FDepMaKN…](https://testnet.nearblocks.io/txns/FDepMaKNUmLZP8g6DzXzVcUsqV91V6Borv9Rh8uKNob8) |
| Fixed-recipient withdraw3 | [9cWjW9vY…](https://testnet.nearblocks.io/txns/9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25); signed gross 47.957074 USDC |
| Withdrawal ledger | [0xdf68992e…0501c0](https://app.hyperliquid-testnet.xyz/explorer/tx/0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0); 46.957074 USDC net + 1 USDC fee |
| v3 spot → open → reduce-only close → owner settlement, 12 November | 4 wNEAR custody; keeper short 3.6 @ 3.3788 and reduce-only buy 3.6 @ 3.3796, flat; zero keys at order receipt blocks. [Transactions and verification](docs/evidence/2026-11-12-v3-lifecycle-summary.md). Owner [settled on-chain](https://testnet.nearblocks.io/txns/CYFZdHDe7uqAeCceZAvxeBe8YWQQJQEea5oDJ1wz4D93) after open expiry; finalized keeper state records `signed_short_size: "0"`. |

The fills and withdrawal ledger are testnet evidence. Owner observations, settlement and withdrawal approval were required; venue state is not verified on-chain. The v2 withdrawal [arrived on Arbitrum Sepolia](https://sepolia.arbiscan.io/tx/0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0): 46.957074 HL-testnet USDC ([13 November evidence](docs/evidence/2026-11-13-v2-arrival-arbitrum-sepolia.json)). Live Intents routes and multi-day carry remain unproved. v2 cleanup completed on 12 November: paused, expired authorizations, abandoned withdrawal reservation and 4 wNEAR returned to the owner, with the status run verifying the owner balance increase. Those 4 wNEAR remain in v3 custody and directional after owner settlement; see the [12 November summary](docs/evidence/2026-11-12-v3-lifecycle-summary.md). v1 remains a rehearsal with an access key.

## v3 and the keeper loop

[v3](docs/POLICY-V3.md) is a **separate keyless deployment** at `policy-v3.counterweight-samet.testnet`, derived address `0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5`, WASM `052d4d87…838c`. The [12 November live run](docs/evidence/2026-11-12-v3-lifecycle-summary.md) verifies 4 wNEAR custody, a 3.6 NEAR short @ 3.3788 and reduce-only close @ 3.3796, with zero keys at both order receipt blocks. The venue ended flat with 48.986173 USDC equity; the owner [settled on-chain](https://testnet.nearblocks.io/txns/CYFZdHDe7uqAeCceZAvxeBe8YWQQJQEea5oDJ1wz4D93) after open expiry. The finalized keeper read records `signed_short_size: "0"` at block `6PtEDXrjezjp5oCNcyZV4okL4LJwtBoV2Q98JLFkF3oi` ([journal, line 16](reports/keeper-run/2026-11-12T17-38-58-147Z-c3b1b13b.jsonl), [archived extract](docs/evidence/2026-11-12-v3-post-settlement.json)). The first open failed with `ERR_REBALANCE_STALE`: v3 opens need an owner margin attestation at most 30 seconds old, so the keeper cannot open alone; it can reduce alone. Local tests establish out-of-band exit authorization; this live close was inside the band and future fills remain unguaranteed. v2 retains its band-exit bug; its cleanup is complete.

The historical [keeper reports](docs/KEEPER-RUN.md#recorded-runs-through-12-november-2026) show heartbeats and price updates since 10–11 November, with opening disabled and no verified opens or reductions in those monitoring snapshots. The 11 November run stopped around 22:21 UTC when its host process exited (release handoff); the last cycle finished at 22:22 UTC. Later runs started **12 November at 08:46, 08:52 and 17:38 UTC**. Saved reports contain errors and gaps; they establish monitoring, not continuous uptime. The separately recorded live v3 open/close above was supervised and does not prove autonomous opening or uninterrupted trading.

## Judge quickstart

Requires Node **>=22.19.0**, npm, curl and tar on **macOS arm64 or Linux x64**. Install needs internet for packages and the sandbox binary; tests, replay and the local demo then run offline. The web page makes public market/RPC reads, and the last command needs public testnet services. No wallet credentials are needed. The sandbox library manages disposable localhost accounts; do not supply real keys. Rust 1.95+ is required for the cross-layer regression. The standalone local demo uses the included WASM and does not need Rust.

Start from a clone, or use your existing checkout:

```sh
git clone https://github.com/Saylool/counterweight && cd counterweight
```

You should be in the repository containing this README. Current working-tree verification and historical reproduction limits are recorded in [REPRODUCE](docs/REPRODUCE.md).

```sh
npm ci
```

You should see `Installed local NEAR sandbox 2.14.0 (darwin-arm64); demo is now offline-ready.` on a fresh macOS arm64 install (Linux reports `linux-x64`), followed by npm's install summary. Audit warnings are dependency advisories, not test results.

Prime the Rust dependency/build cache once while online (use the isolated toolchain/cache setup in [contract instructions](contracts/policy/README.md) if needed):

```sh
(cd contracts/policy && cargo test --locked --lib cross_layer_decisions)
npm test
```

You should see passing `Test Files` and `Tests` summaries for both the root suite and frontend suite. This runs TypeScript/frontend tests and the focused cross-layer Cargo regression. Rust 1.95+ is required for that regression; full native/sandbox validation is recorded separately below. Run `npm run test:all` to run `npm test` plus the full native Rust library suite (with the Rust toolchain/cache environment above configured).

Without Rust, run `npm run test:ts` instead of the Cargo prime and `npm test` commands. It runs the TypeScript/frontend suite and explicitly skips the two Rust cross-layer tests; it does not validate the Rust contract. Replay, both local demos (using committed WASM), and `npm run web:build` also need no Rust.

```sh
npm run replay
```

You should see `Offline replay: complete; 4320 hours, 0 gaps`, comparison lines, and `Generated reports/replay-report.md and reports/replay-report.json`.

```sh
npm run demo:local
```

You should see `OFFLINE GUARD active | Node connections restricted to loopback`, `policy access keys: 0` in the setup line, `PASS 7/7 rogue attempts rejected | owner untouched | close + dead-man signed`, then `OWNER RESUMED` and `REBALANCE rebalance complete`. The owner stays untouched only during the autonomous phase. MPC responses, token handling, venue fills and route receipts are mocks; the policy WASM executes in the local NEAR sandbox. Sandbox time advances in small calibrated fast-forward steps. A run that does not pass prints `FAIL ...`, exits non-zero and writes `reports/demo-local.failed.json`/`.md` (git-ignored); the committed passing `reports/demo-local.json` is kept, so `npm run web:build` still works.

The separate v3 command is `npm run demo:local:v3`, with output in `reports/demo-local-v3.json` and `.md`. It checks paused and out-of-band exits plus a false-mark case against the shipped v3 WASM; MPC/token/marks are mocked and no venue fills are claimed. It requires a host that permits loopback listeners. The latest saved run **passed** on 2026-11-12, including paused/out-of-band exits and the false-mark boundary case; the deployed WASM hash matches the shipped artifact. The v2 run and saved video inputs are unchanged.

Computed cost sensitivities, a same-capital cash benchmark and the intended customer are in [ECONOMICS](docs/ECONOMICS.md); reproduce with `npm run economics`.

```sh
npm run web
```

You should see Vite's `ready in` line and `Local: http://localhost:5173/` when the port is free. Open that URL: the page leads with **Funded testnet lifecycle**, showing the 12 November v3 open/close beside the historical v2 table. The contract panel defaults to v3; selecting v2 switches its artifact and live testnet position/margin/ledger to the historical v2 address. The demo panel also shows v3 paused/out-of-band authorization and the malicious-mark case. V1 is a rehearsal with a key. V3 exit limits are relative to an unauthenticated mark; the adjacent warning explains the false-mark risk. Replay and mainnet market illustrations follow with separate labels. Configured limits show NEAR/USDC alongside exact raw values. Stop the server with Ctrl-C before the next command; if the port is occupied Vite prints another URL. Public read failures appear as unavailable data.

```sh
npm run testnet:verify
```

The verifier now defaults to `policy-v3.counterweight-samet.testnet` and `docs/evidence/policy-v3-plan.json`. Expect `ok: true` for code hash, zero access keys, config/current state, v3 adapter-free margin policy and derived address, with exit **0** while public services and the baseline remain available. Recheck historical v2 explicitly with `npm run testnet:verify -- --policy=policy-v2.counterweight-samet.testnet`. An RPC outage or changed state fails closed; an unavailable read is not custody proof. To inspect the historical v1 rehearsal explicitly use `--policy=policy.counterweight-samet.testnet` (its code/key checks fail).

Public NEAR RPCs can rate-limit parallel reads (HTTP 429). All CLI NEAR reads, including public derivation in `packages/hyperliquid/src/chainsig.ts`, use `NEAR_TESTNET_RPC`. For example:

```sh
NEAR_TESTNET_RPC=https://test.rpc.fastnear.com npm run testnet:verify
NEAR_TESTNET_RPC=https://test.rpc.fastnear.com npm run lifecycle -- --step=status --relay-tx=9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25
```

These commands only read public state and never sign or send; `lifecycle` appends its capture to a dated local `docs/evidence/*-lifecycle-status.md` file. The status recheck should show `public-status-verified`, `relayVerification` and the ledger hash above. It matches 47.957074 gross = 46.957074 net + 1 USDC fee, with the ledger nonce in microseconds and the action time in milliseconds. It queries the saved action's day, rather than a rolling current day. Minimal ledger rows without a nonce use a unique amount/time correlation; this is public-ledger evidence. The v2 payout arrived on Arbitrum Sepolia, independently verified by the 13 November evidence linked below. Never resubmit an uncertain withdrawal. The original failed capture is retained alongside the corrected recheck. In the browser, set build-time `VITE_NEAR_RPC` to a public CORS-enabled endpoint if needed; do not place credentials in frontend variables.

Measured commands, exit codes, startup/HTTP checks and environment: [REPRODUCE](docs/REPRODUCE.md). Additional release checks are `npm run typecheck`, `npm run build`, and `npm run web:build`.

## Architecture

```text
Owner -> wNEAR deposits + policy configuration + trusted observations
Keeper -> bounded order/cancel requests -> NEAR policy -> MPC signer
Relayer -> policy-built signed action -> Hyperliquid testnet
Owner -> exact spot-sale approval -> fixed adapter -> margin receipt reconciliation
Web <- recorded reports + dated evidence + public RPC/market reads
```

The Rust contract builds typed MessagePack/EIP-712 payloads and reserves signed exposure; a signature is not a fill. Replay and configured contract margin checks use H = equity − fee reserve − upper-band short notional. Optional public oracle reads enforce age/confidence; the recorded Pyth retirement leaves this plan using bounded keeper prices (immutable bounds on v2; time-locked owner updates on v3). There is no venue light client. Spot-sale accounting exists, but the included adapter is a sandbox mock; the live Intents evidence is a dry quote only. See [contract implementation and invariants](contracts/policy/README.md), [keeper design](docs/DESIGN-NOTES.md), and [demo boundary](packages/local-sandbox/README.md).

## Authority tiers

| Caller | Authority | Boundary |
|---|---|---|
| Owner | Configure limits/resources, supply bounded fallback prices and position/equity/finality attestations, pause, emergency reduce, approve exact sales and withdrawals | Fixed recipients; withdrawals require resolved exposure and pending operations. Owner attestations are trusted. |
| Keeper | Bounded non-reduce opens, reduce-only closes, cancels and heartbeat | V3 opens also require an owner margin attestation ≤30 seconds old, held wNEAR backing, fresh oracle or bounded fallback prices, notional caps and cooldown. The keeper can de-risk alone, but cannot open alone on v3. No withdrawal or recipient override. Exit marks are unauthenticated; a false mark can cost up to the perp margin. wNEAR custody is unaffected. |
| Public | `deleverage` after heartbeat timeout | Signs a reduce-only close and pauses keeper signing; does not prove a venue fill or sell the spot leg. After timeout, an unauthenticated false exit mark can cost up to the perp margin; wNEAR custody is unaffected. |
| No exported method | Arbitrary digest signing, agent registration, recipient changes or upgrades | Zero account access keys are also required: a remaining full-access key bypasses the intended custody boundary. |

On v2, pause blocks new keeper requests and queues original-nonce invalidations; v3 permits protective closes while paused. Existing signatures remain usable until venue consumption or expiry. Keeper/public signing shares a bounded cumulative allowance; owner recovery has separate capacity. Reserve-funded MPC fees in the new artifact address zero-deposit function-call keeper keys. See [known issues and recovery limits](docs/KNOWN-ISSUES.md).

**V3 worst case (finding A):** exit marks are unauthenticated. A malicious keeper, or anyone after the heartbeat timeout, can supply a false high mark and authorize a reduce-only buy against a thin or self-dealing ask book. The limit is supplied mark +1%, not true market +1%; a false mark can cost **up to the perp margin**. wNEAR custody on NEAR is unaffected. Pause does not revoke v3 keeper exit authority. Fixed recipients prevent withdrawal redirection, but do not prevent this trading loss. There is no finite total portfolio-loss guarantee once funding, liquidation and other market/venue risks are included. The [historical v2 debit calculation](docs/V2-EXECUTION-DEBIT.md) is separate and does not apply to v3.

## Evidence and deployment status

| Scope | Status and evidence |
|---|---|
| Keyless funded lifecycle | **Completed on testnet**, with supervised owner steps. [Summary](docs/evidence/2026-11-10-lifecycle-summary.md), [open](docs/evidence/2026-11-10-lifecycle-open.md), [close](docs/evidence/2026-11-10-lifecycle-close.md), [withdrawal/status](docs/evidence/2026-11-10-lifecycle-status.md). |
| v2 code / custody | Committed WASM `1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a`; zero account access keys verified after deletion. [Manifest](contracts/policy/artifacts/SHA256SUMS). No upgrade export; key deletion freezes the code under this ABI. |
| v3 code / live open-close-settlement | **Separate keyless deployment**; 4 wNEAR custody, keeper 3.6 NEAR short @ 3.3788 and reduce-only close @ 3.3796; venue flat, 48.986173 USDC equity. [12 Nov evidence](docs/evidence/2026-11-12-v3-lifecycle-summary.md), [code/key capture](docs/evidence/2026-11-11-v3-proof.json). Fresh owner margin attestation required to open; owner settled after open expiry; finalized keeper state records `signed_short_size: "0"`. |
| v1 contract signing | **REHEARSAL with a key** on `policy.counterweight-samet.testnet`, old WASM `698195e3…2d289`. [Historical proof](docs/evidence/2026-11-10-contract-proof-FAvY2YaKKFkri8nkC5X8ZMp8FfirtetWr5vThm746RPU.md). |
| Owner signing / old preflight | Earlier identity-only [owner proof](docs/evidence/2026-11-10-signing-proof.md) and [pre-account-creation preflight](docs/evidence/2026-11-10-testnet-preflight.md); superseded for deployment status by the funded v2 evidence. |
| Intents | Expired mainnet `dry: true` quote; no route execution or funds moved. [Request/response](docs/evidence/2026-11-10-oneclick-dry-quote.json). |
| Local enforcement | Keyless local policy WASM; mocked external services. [Demo JSON](reports/demo-local.json), [transcript](reports/demo-local.md). |

The [funded runbook](docs/FUNDED-LIFECYCLE.md) and [deployment procedure](docs/TESTNET-DEPLOYMENT.md) describe owner execution. Do not redeploy, reinitialize or retry the completed run. The v2 withdrawal arrived on Arbitrum Sepolia. Live rebalancing routes and sustained carry remain unproved.

## Historical results: simulated execution

<!-- replay-facts:start -->
Recorded window: **2026-05-12T00:00:00.000Z to 2026-11-08T00:00:00.000Z (exclusive)**; **4320 complete hours**, **24 warm-up hours**, **0 gaps**. Negative-funding hours: **163**. Summed hourly funding rates: **6.387413%**, not an all-capital return.

Selection uses the first **2160 hours**; holdout uses the last **2160 hours**. Frozen H/notional bands: **0.2 / 0.5 / 0.8**; modeled route latency: **1 hour**. Selected training net: **$7.463715**.
<!-- replay-facts:end -->

The table is rounded from [replay-report.json](reports/replay-report.json); its numbers and the facts above are checked by `scripts/readme-claims.test.ts`. Capital is all committed capital for each policy. Min H is the adverse-hourly-high stress proxy. Spot-only excludes idle hedge margin and is directional; its H/breach columns do not measure spot safety.

<!-- replay-table:start -->
| Period | Policy | Spot $ | Capital $ | Funding $ | All costs $ | Net $ | Return % | Min H $ | Breach hours |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| full | hedged-rebalance | 25 | 75 | 0.00 | 6.35 | -6.34 | -8.46 | 4.71 | 0 |
| full | hedged-rebalance | 2500 | 5700 | 114.59 | 43.17 | 67.28 | 1.18 | 213.09 | 0 |
| full | hedged-rebalance | 25000 | 57000 | 1145.96 | 371.57 | 733.04 | 1.29 | 2122.81 | 0 |
| full | always-hedged | 2500 | 5700 | 288.51 | 47.29 | 233.63 | 4.10 | -13793.17 | 1222 |
| full | spot-holder | 2500 | 2700 | 0.00 | 31.64 | 3497.71 | 129.54 | n/a | n/a |
| holdout | hedged-rebalance | 25 | 75 | 0.00 | 6.35 | -6.30 | -8.40 | 4.03 | 0 |
| holdout | hedged-rebalance | 2500 | 5700 | 78.50 | 42.80 | 35.82 | 0.63 | 211.76 | 0 |
| holdout | hedged-rebalance | 25000 | 57000 | 785.04 | 367.89 | 418.37 | 0.73 | 2107.79 | 0 |
<!-- replay-table:end -->

The always-hedged comparator permits unfunded losses and negative venue equity: its carry figure is infeasible as an executable return. Rebalancing sells NEAR during rallies and can buy it back during falls; the starting coin count is not preserved. Small allocations lose money to fixed and variable costs. The holdout is a retrospective chronological split of already-observed data, not an untouched prospective experiment. Periods restart independently and pay fresh costs; they are not additive.

Fees, slippage, signing overhead and route latency are frozen modeling assumptions, not measured execution quotes. Hourly OHLC and zero proxy breaches do not prove intrabar solvency. See the complete [report](reports/replay-report.md), [protocol and costs](docs/REPLAY-PROTOCOL.md), and [market provenance](fixtures/market/README.md). Historical results are not yield promises.

## Hackathon baseline (Q-002, Q-003, Q-004, Q-005, Q-015)

Hackathon window: 2026-10-19 to 2026-11-14. This repository was created for the hackathon: first commit `07aa968` is dated **2026-11-09** and holds only the README, license and ignore rules. No pre-hackathon code is reused. Tags: `pre-hackathon` = `07aa968`, `hackathon-submission` = the submitted commit ([diff](https://github.com/Saylool/counterweight/compare/pre-hackathon...hackathon-submission)). This is the author's only NEAR HACKATHON submission (1 of 1).

## NEAR technology and hackathon work (Q-004)

The repository implements the Rust `near-sdk` policy, NEP-141 wNEAR receiver, Chain Signatures payload construction/relay and public-key derivation, deterministic keeper/replay, owner-approved rebalance accounting, sandbox demonstrations, and read-only web interface. Those are the work presented for the hackathon window. Dependencies and recorded market history are reused inputs, not work claimed as newly invented.

NEAR Chain Signatures is exercised in the funded keyless v2 lifecycle (10 Nov) and the live keyless v3 open/close/settlement (12 Nov); earlier owner and v1 rehearsal proofs remain historical evidence. NEAR Intents 1Click is exercised as a mainnet dry quote; external adapter execution remains pending. Reserve-funded signing is deployed on keyless v2 and v3. [Recorded Rust validation](contracts/policy/TEST_RESULTS.md) reports native, export and sandbox checks; the full native/sandbox suites remain separate; `npm test` also invokes the focused cross-layer Cargo regression. Follow [contract reproduction instructions](contracts/policy/README.md) for the separate Rust toolchain.

## Disclosures (Q-005)

Code, tests and documentation include AI-written work using Claude Code, OpenAI Codex and Google Gemini. The team remains responsible for human review and verification. Local sandbox accounts use library-managed disposable credentials. AI assistance is disclosed rather than presented as unaided human authorship.

Open-source dependencies include `near-sdk`, `near-workspaces`, React, Vite, viem, Zod, Noble/Scure cryptography utilities and MessagePack; exact versions are in the lockfiles. [Claims index](docs/CLAIMS.md) maps the assertions here and in the [video script](apps/video/revised-x-script.md) (legacy [demo script](docs/DEMO-SCRIPT.md)) to evidence.

## Limitations

**Finding A — unauthenticated exit marks:** a false high mark supplied by the keeper, or by anyone after heartbeat timeout, can cost up to the perp margin on an adverse reduce-only buyback. wNEAR custody is unaffected. The v3 +1% cap is relative to the supplied mark and does not authenticate the true market price.

**Unfixed v3 contract findings:** the deployed keyless v3 is immutable and retains issues from the final static review: concurrent-exit slot overwrite and open/exit overlap after a spot withdrawal, keeper fallback marks that can understate opening notional or block owner health checks, pause detaching in-flight owner callbacks, a sticky re-entry mode, and zero-deposit public `deleverage` reserve spend after timeout. Details: [KNOWN-ISSUES](docs/KNOWN-ISSUES.md#final-static-review-findings-in-shipped-v3-source-13-november-not-fixed).

Bounded fallback prices and owner-supplied position, equity and finalized-receipt observations are trusted. Pyth-compatible prices are checked for age, confidence and immutable absolute bounds. Compromised or mistaken observations can understate external exposure. Contract reservations bound signed opens, not venue fills or repeated relaying of public signatures. Price bands and reduce-only IOC orders can fail to fill; MPC fees, signer availability, liquidity, venue liquidation/ADL and route delays remain risks.

After an autonomous perp close, spot remains directional until owner-approved disposal. The mock adapter needs a separate audited implementation for external funds. Public Hyperliquid state provides no privacy, and this project makes no TEE claim. The frontend is read-only and handles public-read failures independently. The sandbox installer supports only the platforms listed above; other machines are unverified. See [KNOWN-ISSUES](docs/KNOWN-ISSUES.md) and [web details](apps/web/README.md).

This is experimental software for user-controlled accounts, not a fund or investment product. No financial return is promised.

## License

[MIT](LICENSE), copyright 2026 Samet.

V2 arrival update (13 November 2026): **arrived on Arbitrum Sepolia** — 46.957074 HL-testnet USDC; [transaction](https://sepolia.arbiscan.io/tx/0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0), [public RPC evidence](docs/evidence/2026-11-13-v2-arrival-arbitrum-sepolia.json). Testnet only.
