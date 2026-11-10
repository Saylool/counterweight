# Release reproduction — funded keyless lifecycle, 2026-11-10

Start with the [funded lifecycle summary and exact transaction table](evidence/2026-11-10-lifecycle-summary.md),
[NEAR v2 policy](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) and
[derived Hyperliquid testnet address](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390).
This evidence establishes the supervised testnet custody/transfer/open/close/settlement/withdrawal lifecycle;
it does not establish mainnet, multi-day carry, a live Intents route or destination-chain arrival.
The 4 wNEAR remains in spot custody after closing. UI Send lands in spot; the owner separately moves margin to perps.
Owner funding and the spot→perp transfer preceded key deletion; the keeper open, close and withdrawal records
show zero keys at their receipt blocks. The original v1 account remains a rehearsal with an access key.

## Current working-checkout validation

This release pass used the existing checkout and dependencies on macOS arm64; no git commands, real private keys,
wallet/keychain access or testnet sends were used. No fresh install, clean clone, local demo rerun or full Rust
native/sandbox rerun is claimed here. `npm test` includes the focused Rust cross-layer regression.

| Command | Result |
|---|---|
| `npm test` | PASS: 425 tests / 20 root files, 30 tests / 2 frontend files; **455 total** |
| `npm run typecheck` | PASS, exit 0 |
| `npm run build` | PASS, exit 0; includes web build |
| `npm run web:build` | PASS, exit 0 |
| `npm run web` | Vite ready; port 5173 occupied, served on 5174; HTTP 200 for page, lifecycle table JSON, artifact JSON, evidence index and app module |
| Public v2 verifier below | PASS, exit 0; all four named checks true |
| Public withdrawal status below | PASS, exit 0; `public-status-verified` and exact recorded ledger match |

README replay-number drift tests passed in the root suite. Frontend checks cover the funded table, exact explorer
links, v2 default, and testnet position/margin/ledger parsing. Interactive visual inspection was unavailable because
the browser access host was unavailable; the HTTP smoke checks and server rendering tests are not a visual browser test.
The initial gross/net matcher regression was fixed; the final suite above is green.

## Recheck the real evidence without sending

Public RPCs can rate-limit parallel reads. `NEAR_TESTNET_RPC` is shared by CLI RPC and public Chain Signatures
derivation (`packages/hyperliquid/src/chainsig.ts`). No credential is required for this public endpoint:

```sh
NEAR_TESTNET_RPC=https://test.rpc.fastnear.com npm run testnet:verify
NEAR_TESTNET_RPC=https://test.rpc.fastnear.com npm run lifecycle -- --step=status --relay-tx=9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25
```

The verifier defaults to `policy-v2.counterweight-samet.testnet` and `docs/evidence/policy-v2-plan.json`.
You should see `ok: true` for code hash, access keys (zero), config/current state, and derived address.
[Saved successful verifier JSON](evidence/2026-11-10-release-testnet-verify.json).

The status command should show `relayVerification.verification.hash` equal to
[0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0](https://app.hyperliquid-testnet.xyz/explorer/tx/0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0).
[Saved successful status JSON](evidence/2026-11-10-release-lifecycle-recheck.json).
The original failed relay record is retained: it compared signed gross 47.957074 to ledger net 46.957074 USDC.
The corrected match adds the ledger fee `1.0`, checks the ledger microsecond nonce 1794331863418000 against
signed millisecond time 1794331863418, queries the saved action's bounded day and rejects ambiguous matches.
Formatting variants normalize using integer micro-USDC. Minimal rows without nonce use unique amount/time correlation;
without fee they use the documented 1 USDC testnet fee. No match proves destination-chain arrival.

These commands perform public reads and write local evidence only. They never relay a signature.
RPC outages or baseline drift fail closed; do not resubmit an uncertain withdrawal.
The browser uses `VITE_NEAR_RPC` instead, with a public CORS-enabled endpoint.

---

The following is an **archived earlier run**, retained for provenance. Its v1 custody failure, test counts,
timings and pending deployment language are historical, not the current submission status.

# Archived reproduction — earlier 2026-11-10 run

Historical measured run: **2026-11-10T11:03:47.967116+00:00** through **2026-11-10T11:06:34.601275+00:00**. OS: **macOS-26.6.2-arm64-arm-64bit-Mach-O**; architecture **arm64**; Node **v26.9.0**; npm **12.1.0**; shell `/bin/zsh`. Clone: `/tmp/counterweight-judge.XzCFO9/counterweight`. This is a fresh local clone and an empty per-clone npm cache on the existing machine, not a second physical machine or a clean OS image. Linux and the minimum supported Node version were not independently tested.

## Source isolation and the commit restriction

The earlier run permitted read-only git inspection and a local clone; the current release pass ran no git commands. No commit, staging, reset, checkout, fetch, push or remote clone was performed. No real private key, wallet/keychain credential or testnet signing command was used. The demo manages disposable localhost accounts through near-workspaces.

The release-overlay discussion in the earlier record is obsolete: those release files were subsequently included before the blind reviews. The historical timings below describe that earlier run, not the current working tree. This revision is validated directly in the current directory; no git commands, clone, real keys or testnet sends were used. See the updated contract TEST_RESULTS for current checks. An unmodified fresh-clone pass for this uncommitted revision has not been claimed.

## Exact quickstart and timings

The historical clone/setup block used the then-current README (the current quickstart uses the working checkout):

```sh
REPRO_DIR="$(mktemp -d /tmp/counterweight-judge.XXXXXX)"
git clone /Users/samet/Desktop/counterweight "$REPRO_DIR/counterweight"
cd "$REPRO_DIR/counterweight"
export npm_config_cache="$PWD/.tmp/npm-cache"
```

Then, from that clone in the same cache environment, each README command was executed exactly in order. Times are monotonic wall-clock seconds including npm startup. Commands ran sequentially; builds followed the quickstart. Web timing ends at a successful HTTP response, then the process group was interrupted as the README instructs; a server is not expected to exit naturally.

| Command | Seconds | Result |
|---|---:|---|
| Clone + shell setup (block above) | 0.333 | PASS |
| `npm ci` | 12.628 | PASS |
| `npm test` | 18.272 | PASS |
| `npm run replay` | 10.916 | PASS |
| `npm run demo:local` | 85.109 | PASS |
| `npm run web` | 1.926 | HTTP 200; stopped with SIGINT (-2) |
| `npm run testnet:verify` | 20.417 | Expected custody failure (exit 1) |
| `npm run typecheck` | 5.177 | PASS |
| `npm run build` | 7.236 | PASS |
| `npm run web:build` | 4.338 | PASS |

Web reported `http://localhost:5174/` because port 5173 was already occupied. Vite readiness was observed at **1.842s**; HTTP **200** with the React root element at **1.926s**. SIGINT is the Ctrl-C equivalent, not a startup failure. This check did not independently exercise every browser interaction or external API in the UI.

`npm ci` ran the root postinstall and printed `Installed local NEAR sandbox 2.14.0 (darwin-arm64); demo is now offline-ready.` npm also emitted dependency audit advisories and blocked some dependency install scripts under npm 12; these did not prevent the final tests, demo or builds. No audit-fix operation was run.

`npm test` passed **335 tests / 16 root files** and **28 tests / 2 frontend files** (**363 tests** total). README intentionally does not pin a changing test count. `npm run typecheck`, `npm run build`, and the separate `npm run web:build` all exited **0** in the final clone.

## Reproduced outputs

Replay:

```text
Offline replay: complete; 4320 hours, 0 gaps
Generated reports/replay-report.md and reports/replay-report.json
```

The complete regenerated reports exactly match the checked-in reports:

- `reports/replay-report.json`: `34a8b36869b761bb23dc58c0438daa5e5e2646b48a97c6b99dd36215463ebda5` (byte-identical to source checkout).
- `reports/replay-report.md`: `caa6d6b5c42f321de85cc711180c6cebcbaf89012a9270621013faaa802bb265` (byte-identical to source checkout).

The sandbox run exited 0, rechecked the committed policy hash, removed its disposable accounts and printed:

```text
OFFLINE GUARD active | Node connections restricted to loopback
SETUP local accounts + mock spot 9.3 NEAR | policy access keys: 0
PASS 7/7 rogue attempts rejected | owner untouched | close + dead-man signed
OWNER RESUMED | autonomous owner-free phase ended; mock rebalance completion begins
REBALANCE rebalance complete | owner reconciled mock receipt; sold 9.3 NEAR; margin credited 32558432 micro-USDC
SANDBOX stopped; disposable local accounts removed
```

Runtime sandbox receipts/timestamps change across runs. The public-signature-shaped MPC, tokens, fills and route receipts remain mocks. Local keylessness does not prove deployed testnet keylessness.

## Public testnet snapshot and unresolved result

`npm run testnet:verify` exited **1** as documented. It did **not** pass custody. Code hash and access keys failed, while plan configuration and public address derivation passed. No transaction was signed or sent. Full public JSON from this run:

```json
{
  "account": "policy.counterweight-samet.testnet",
  "network": "testnet",
  "finalizedBlock": {
    "hash": "58vsp39ajydWg4Yn2DZXZbUXzZhcrZHSP9eD4BFrE5EH",
    "height": 277059046
  },
  "checks": [
    {
      "check": "code hash",
      "ok": false,
      "details": {
        "committedSha256": "e8bfa3d5e93c2ea85bd99be5b71a97508a90046f79b9d00aab34b2e9f0d6c48a",
        "expectedBase58": "GfZ5FRWpVogdMbA2Mfy7iSzdDbErgXnYrSe3GyQgAGjs",
        "actualBase58": "86rR2rWL6Qeo6cQuwcr5qNopvf17eE9dz5UmVo8UXRXW"
      }
    },
    {
      "check": "access keys",
      "ok": false,
      "details": {
        "ok": false,
        "expected": "zero access keys",
        "keys": [
          {
            "public_key": "ed25519:Drv27Uwd4m5pWoWkZPraCCkw3vva1c3sD17A31Zjyq1t",
            "access_key": {
              "permission": "FullAccess",
              "nonce": 277054172000001
            }
          }
        ]
      }
    },
    {
      "check": "get_state config and current state",
      "ok": true,
      "details": {
        "recipientMatches": true,
        "matchesPlan": true,
        "state": {
          "owner": "counterweight-samet.testnet",
          "keeper": "keeper.counterweight-samet.testnet",
          "coin": "NEAR",
          "signer_account": "v1.signer-prod.testnet",
          "wnear_account": "wrap.testnet",
          "near_recipient": "counterweight-samet.testnet",
          "derivation_path": "counterweight-1",
          "evm_recipient": "0xea8b5c6f1e3e1537222d4cbbbed3d6fa5bcc819a",
          "asset_index": 54,
          "size_decimals": 1,
          "limits": {
            "max_short_size": "1000000000000000000000000",
            "per_order_notional_cap": "10000000",
            "per_day_notional_cap": "20000000",
            "cooldown_seconds": 60,
            "price_band_bps": 100,
            "price_max_age_seconds": 60
          },
          "spot_balance": "0",
          "signed_short_size": "0",
          "paused": false,
          "pending": null,
          "signing_limits": {
            "keeper_per_block": 2,
            "keeper_per_window": 8,
            "keeper_outstanding": 8,
            "owner_per_window": 16,
            "window_ms": 60000,
            "max_nonce_ahead_ms": 1000
          },
          "mpc_fee": "1",
          "signer_gas_tgas": 230,
          "callback_gas_tgas": 30,
          "heartbeat_timeout_seconds": 3600,
          "keeper_weight_limit": "5000",
          "daily_usage": "0",
          "usage_day": 20767,
          "operation_id": "2",
          "last_keeper_heartbeat": "1794305935",
          "reference_price": "1000000",
          "reference_price_timestamp": "1794305935",
          "last_nonce": "1794307007731",
          "outstanding": [],
          "pause_complete": true,
          "lifetime_opened": "0",
          "last_open_expiry": "0",
          "keeper_weight_used": "10"
        },
        "note": "Identity, current venue metadata and plan baseline limits/resources checked. Mutable config drift fails this baseline check; inspect current state against owner intent. Use --owner-evm=0x... to assert your immutable EVM recipient."
      }
    },
    {
      "check": "policy-derived Hyperliquid address",
      "ok": true,
      "details": {
        "predecessor": "policy.counterweight-samet.testnet",
        "path": "counterweight-1",
        "address": "0xaa640b1c7b3ac37db14d2705eaeceeb42d91eb0c",
        "publicKey": "0x047b1ef1e3374ab7f0c29bfda9c9a851ebd0618796a7d4b8a6ec4aed36a3e6c0e87f06f05c05c325a92b544a6aff3c19727191a14b4170ebf1450b559a7a5b9d66",
        "rootPublicKey": "secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
        "rootBlockHeight": 277059068,
        "derivedBlockHeight": 277059068,
        "note": "Local public derivation agrees with signer view at the root block. This is not a signature or fill proof."
      }
    }
  ]
}
```

At that historical point, this corroborated the old v1 deployed WASM and retained full-access key. The funded v2 lifecycle and keyless verification in the current record above supersede that pending deployment status. No funded venue fill, live rebalancing adapter or unexpired Intents execution was reproduced. Existing owner proof, rehearsal and expired dry-quote evidence were inspected, not newly executed. The Rust native/export/sandbox suites were not rerun in this release pass; README identifies their records as historical and links separate instructions.

## Drift regression and retained run details

`scripts/readme-claims.test.ts` checks all numeric replay-table cells, the report-derived facts block and the quickstart replay summary against `reports/replay-report.json`. In a controlled negative check, changing the README small-allocation net from `-6.34` to `-6.33` made the focused Vitest run exit **1** with the cell comparison failing. Restoring the README made the focused run exit **0**, **3 tests passed**. The final full clone suite then passed. Frontend coverage also checks exact NEAR/USDC conversions down to the smallest raw unit.

Raw local logs and the overlay SHA-256 manifest remain in `/private/tmp/counterweight-release-final-logs/` on this machine; these temporary paths are not portable artifacts. The durable commands, durations, selected outputs, hashes and full verifier snapshot are recorded above. No executable source or README change followed that historical run before its record was finalized; later revisions are recorded above. This documentation record was then finalized and checked for valid local links and clean whitespace.
