# Counterweight

Counterweight is a testnet prototype that holds wrapped NEAR in a NEAR policy contract and authorizes bounded Hyperliquid perpetual hedge actions through NEAR Chain Signatures. It includes a deterministic keeper, a recorded-market replay, a local sandbox demonstration, and a read-only web interface; live funding, fills and final keyless deployment remain unproved.

## Judge quickstart

Requires Node **>=22.19.0**, npm, Git, curl and tar on **macOS arm64 or Linux x64**. Install needs internet for packages and the sandbox binary; tests, replay and the local demo then run offline. The web page makes public market/RPC reads, and the last command needs public testnet services. No wallet credentials are needed. The sandbox library manages disposable localhost accounts; do not supply real keys. Rust 1.95+ is required for the cross-layer regression. The standalone local demo uses the included WASM and does not need Rust.

For this checkout, clone the local repository into a fresh temporary directory. On another machine, substitute the path of your local checkout as the clone source. Run each block in order from the same shell:

```sh
REPRO_DIR="$(mktemp -d /tmp/counterweight-judge.XXXXXX)"
git clone /Users/samet/Desktop/counterweight "$REPRO_DIR/counterweight"
cd "$REPRO_DIR/counterweight"
export npm_config_cache="$PWD/.tmp/npm-cache"
```

You should see `Cloning into ...` and `done.`. The cache setting keeps install writes inside the clone. A local clone contains committed files only; the current working-tree verification and historical reproduction limits are recorded in [REPRODUCE](docs/REPRODUCE.md).

```sh
npm ci
```

You should see `Installed local NEAR sandbox 2.14.0 (darwin-arm64); demo is now offline-ready.` on a fresh macOS arm64 install (Linux reports `linux-x64`), followed by npm's install summary. Audit warnings are dependency advisories, not test results.

Prime the Rust dependency/build cache once while online (use the isolated toolchain/cache setup in [contract instructions](contracts/policy/README.md) if needed):

```sh
(cd contracts/policy && cargo test --locked --lib cross_layer_decisions)
npm test
```

You should see passing `Test Files` and `Tests` summaries for both the root suite and frontend suite. This runs TypeScript/frontend tests and the focused cross-layer Cargo regression. Rust 1.95+ is required for that regression; full native/sandbox validation is recorded separately below.

```sh
npm run replay
```

You should see `Offline replay: complete; 4320 hours, 0 gaps`, comparison lines, and `Generated reports/replay-report.md and reports/replay-report.json`.

```sh
npm run demo:local
```

You should see `OFFLINE GUARD active | Node connections restricted to loopback`, `policy access keys: 0` in the setup line, `PASS 7/7 rogue attempts rejected | owner untouched | close + dead-man signed`, then `OWNER RESUMED` and `REBALANCE rebalance complete`. The owner stays untouched only during the autonomous phase. MPC responses, token handling, venue fills and route receipts are mocks; the policy WASM executes in the local NEAR sandbox.

```sh
npm run web
```

You should see Vite's `ready in` line and `Local: http://localhost:5173/` when the port is free. Open that URL: the page shows replay results, dated evidence, and public contract/market reads. Configured limits show NEAR/USDC alongside exact raw values. Stop the server with Ctrl-C before the next command; if the port is occupied Vite prints another URL. Public read failures appear as unavailable data.

```sh
npm run testnet:verify
```

You should see JSON for `policy.counterweight-samet.testnet` with checks named `code hash`, `access keys`, `get_state config and current state`, and `policy-derived Hyperliquid address`. **Expected current result: exit 1**, with `ok: false` for code and keys: the old deployment differs from the committed artifact and retains a full-access key. A public derivation match proves address derivation only. An unavailable RPC can instead fail the command before the JSON is printed. Do not treat a nonzero verifier as proof of successful custody.

Measured commands, exit codes, startup/HTTP checks and environment: [REPRODUCE](docs/REPRODUCE.md). Additional release checks are `npm run typecheck`, `npm run build`, and `npm run web:build`.

## Architecture

```text
Owner -> wNEAR deposits + policy configuration + trusted observations
Keeper -> bounded order/cancel requests -> NEAR policy -> MPC signer
Relayer -> policy-built signed action -> Hyperliquid testnet
Owner -> exact spot-sale approval -> fixed adapter -> margin receipt reconciliation
Web <- recorded reports + dated evidence + public RPC/market reads
```

The Rust contract builds typed MessagePack/EIP-712 payloads and reserves signed exposure; a signature is not a fill. Replay and configured contract margin checks use H = equity − fee reserve − upper-band short notional. Optional public oracle reads enforce age/confidence; the current Pyth NEAR service is retired, so this plan uses immutable keeper-price bounds. There is no venue light client. Spot-sale accounting exists, but the included adapter is a sandbox mock; the live Intents evidence is a dry quote only. See [contract implementation and invariants](contracts/policy/README.md), [keeper design](docs/DESIGN-NOTES.md), and [demo boundary](packages/local-sandbox/README.md).

## Authority tiers

| Caller | Authority | Boundary |
|---|---|---|
| Owner | Configure limits/resources, supply bounded fallback prices and position/equity/finality attestations, pause, emergency reduce, approve exact sales and withdrawals | Fixed recipients; withdrawals require resolved exposure and pending operations. Owner attestations are trusted. |
| Keeper | Bounded non-reduce opens, reduce-only closes, cancels and heartbeat | Opens require held wNEAR backing, fresh oracle or bounded fallback prices, notional caps and cooldown. No withdrawal or recipient override. The system permits opens; it is not entirely reduce-only. |
| Public | `deleverage` after heartbeat timeout | Signs a reduce-only close and pauses keeper signing; does not prove a venue fill or sell the spot leg. |
| No exported method | Arbitrary digest signing, agent registration, recipient changes or upgrades | Zero account access keys are also required: a remaining full-access key bypasses the intended custody boundary. |

Pause blocks new keeper requests and queues original-nonce invalidations. Existing signatures remain usable until venue consumption or expiry. Keeper/public signing shares a bounded cumulative allowance; owner recovery has separate capacity. Reserve-funded MPC fees in the new artifact address zero-deposit function-call keeper keys. See [known issues and recovery limits](docs/KNOWN-ISSUES.md).

Keeper maximum direct execution debit, for the policy-v2 configuration: let K = floor(5,000 / 5) = 1,000 lifetime keeper/public authorizations, Q = max(reserved short, max_short_size) = 1 NEAR, and L = tick-rounded-up(max_price × (1 + price_band_bps / 10,000)) = $1.0605. Then **D ≤ K × ceil_micro(Q × L × (1 + f)) = $1,060.978**, assuming taker fee f = 0.00045. This deliberately counts the entire buy debit, including principal. It is conservative even if every authorization is a filled close; cancellations consume the same allowance. Test: `configured_keeper_maximum_direct_execution_debit_bound`. Bound assumes fixed limits and no owner budget replenishment. Subsidized MPC fees separately cost at most **10 NEAR** over that allowance (1,000 × 0.01 NEAR); gas paid by callers is separate. There is **no finite total portfolio-loss guarantee**: market moves, funding, liquidation, venue/oracle failure, missed hedges and owner attestations are outside this execution-debit bound. The fee is a model assumption, not enforced venue pricing. An often-quoted daily churn formula based only on the open cap omits uncapped recovery turnover and is not a valid guarantee here.

## Evidence and deployment status

| Scope | Status and evidence |
|---|---|
| Owner MPC signing | Recorded testnet server-recovered address matches the owner-derived address. The harmless cancel returned an unfunded-account error; it establishes signing, not execution. [Owner proof](docs/evidence/2026-11-10-signing-proof.md). |
| Contract MPC signing | **REHEARSAL**: successful receipt/callback checks and matching Hyperliquid server recovery; policy still had a full-access key and ran the old WASM. [Rehearsal proof](docs/evidence/2026-11-10-contract-proof-FAvY2YaKKFkri8nkC5X8ZMp8FfirtetWr5vThm746RPU.md). |
| Preflight | Historical snapshot before account creation; its UNKNOWN_ACCOUNT result is not current deployment evidence. [Preflight](docs/evidence/2026-11-10-testnet-preflight.md). |
| Intents | Recorded mainnet `dry: true` quote; expired, no route execution or funds moved. [Request/response](docs/evidence/2026-11-10-oneclick-dry-quote.json). |
| Local enforcement | Committed default policy executes with no policy access keys; mocked external services. [Demo JSON](reports/demo-local.json), [transcript](reports/demo-local.md). |
| Final keyless proof | **Pending**: owner will freshly deploy the newer artifact to `policy-v2.counterweight-samet.testnet`, remove all account keys before submission, then obtain and relay a fresh contract signature. This release does not perform those actions. [Deployment procedure](docs/TESTNET-DEPLOYMENT.md). |

The deployed rehearsal runs SHA-256 `698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289`. The committed newer WASM is `d85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1` ([manifest](contracts/policy/artifacts/SHA256SUMS)). Deleting all keys freezes the account's code under this ABI. No funded live trading or live rebalancing is established.

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

The always-hedged comparator permits unfunded losses and negative venue equity: its carry figure is infeasible as an executable return. Rebalancing sells NEAR during rallies and can buy it back during falls; the starting coin count is not preserved. Small allocations lose money to fixed and variable costs. The holdout is a retrospective chronological split of already-observed data, not an untouched prospective experiment. Periods restart independently and pay fresh costs; they are not additive. The selected training run is slightly negative.

Fees, slippage, signing overhead and route latency are frozen modeling assumptions, not measured execution quotes. Hourly OHLC and zero proxy breaches do not prove intrabar solvency. See the complete [report](reports/replay-report.md), [protocol and costs](docs/REPLAY-PROTOCOL.md), and [market provenance](fixtures/market/README.md). Historical results are not yield promises.

## NEAR technology and hackathon work (Q-004)

The first commit is **2026-11-09**, per the release brief and the initial local HEAD reflog entry; this release does not independently audit the complete commit history. The repository implements the Rust `near-sdk` policy, NEP-141 wNEAR receiver, Chain Signatures payload construction/relay and public-key derivation, deterministic keeper/replay, owner-approved rebalance accounting, sandbox demonstrations, and read-only web interface. Those are the work presented for the hackathon window. Dependencies and recorded market history are reused inputs, not work claimed as newly invented.

NEAR Chain Signatures is exercised in the dated testnet owner and contract rehearsal proofs. NEAR Intents 1Click is exercised as a mainnet dry quote; external adapter execution remains pending. The current artifact's reserve-funded signing is locally tested and awaits fresh deployment. [Recorded Rust validation](contracts/policy/TEST_RESULTS.md) reports native, export and sandbox checks; the full native/sandbox suites remain separate; `npm test` also invokes the focused cross-layer Cargo regression. Follow [contract reproduction instructions](contracts/policy/README.md) for the separate Rust toolchain.

## Disclosures (Q-005)

Code, tests and documentation include AI-written work using Claude Code, OpenAI Codex and Google Gemini. The team remains responsible for human review and verification. This screener pass uses Codex; it reads public evidence, runs local checks, and does not access real private keys or sign testnet transactions. Local sandbox accounts use library-managed disposable credentials. AI assistance is disclosed rather than presented as unaided human authorship.

Open-source dependencies include `near-sdk`, `near-workspaces`, React, Vite, viem, Zod, Noble/Scure cryptography utilities and MessagePack; exact versions are in the lockfiles. [Claims index](docs/CLAIMS.md) maps the assertions here and in the [demo script](docs/DEMO-SCRIPT.md) to evidence.

## Limitations

Bounded fallback prices and owner-supplied position, equity and finalized-receipt observations are trusted. Pyth-compatible prices are checked for age, confidence and immutable absolute bounds. Compromised or mistaken observations can understate external exposure. Contract reservations bound signed opens, not venue fills or repeated relaying of public signatures. Price bands and reduce-only IOC orders can fail to fill; MPC fees, signer availability, liquidity, venue liquidation/ADL and route delays remain risks.

After an autonomous perp close, spot remains directional until owner-approved disposal. The mock adapter needs a separate audited implementation for external funds. Public Hyperliquid state provides no privacy, and this project makes no TEE claim. The frontend is read-only and handles public-read failures independently. The sandbox installer supports only the platforms listed above; other machines are unverified. See [KNOWN-ISSUES](docs/KNOWN-ISSUES.md) and [web details](apps/web/README.md).

This is experimental software for user-controlled accounts, not a fund or investment product. No financial return is promised.

## License

[MIT](LICENSE), copyright 2026 Samet.
