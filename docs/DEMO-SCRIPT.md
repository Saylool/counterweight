# Counterweight demo script

Recording plan, not a claim that a video already exists. Run the [README quickstart](../README.md) first. Keep the terminal's mock labels visible. Do not record a wallet, keychain, secret environment values or signing credentials. Timing below is an editing budget, not a command-runtime guarantee.

## Main cut: 2 minutes 30 seconds

| Edit time | Screen | Narration |
|---|---|---|
| 0:00–0:20 | Start `npm run demo:local`. Show the offline guard, committed policy hash and local `policy access keys: 0` setup line. | “Counterweight is a testnet hedge-policy prototype on NEAR. The local sandbox runs the policy WASM with no policy access keys. The signer, token and exchange responses in this demonstration are mocks. Keeper opens are bounded; closes are reduce-only.” |
| 0:20–0:55 | Show the selected worst recorded 24-hour rally, `+32.499065%` across `4297` candidate windows. Highlight `09-17 10:00 UTC`, `$2.8062`, H `2.281`, and `SIGNED mock + event`. | “The recorded rally drives stress headroom below the keeper threshold. The keeper requests a reduce-only close without an owner transaction. This proves local authorization and execution of the contract, not a real exchange fill. The spot leg remains until the owner approves disposal.” |
| 0:55–1:25 | Show the seven rejected rogue attempts, the early heartbeat rejection, public dead-man request at `+601s`, and the unchanged owner snapshot. | “The sandbox rejects over-backing, open-price override, unauthorized withdrawal, agent-registration, callback replay, stale opening price and an unrelated caller. Callback replay fails at the private method boundary; this is not a venue nonce-replay test. The public dead-man path signs a close after the timeout and pauses keeper signing.” |
| 1:25–1:45 | Show `OWNER RESUMED`, settlement, exact spot-sale dispatch and finalized mock receipt reconciliation. | “Now the owner participates. It attests the mock close, approves the sale of 9.3 NEAR, and reconciles the mock receipt. Only that reconciliation credits 32558432 micro-USDC. Final local spot and reserved short are zero. External fill and finality observations remain owner-trusted.” |
| 1:45–2:10 | Run `npm run replay`. Open the README results table and `reports/replay-report.md`; show full and holdout rows, all-capital denominator, costs and infeasible always-hedged comparator. | “Execution here is simulated against recorded mainnet data. The small allocation loses money. The larger rebalance examples have positive net results in this window, while the always-hedged comparator has unfunded margin losses. The holdout is retrospective, and zero modeled breach hours are not proof of future solvency or returns.” |
| 2:10–2:30 | Show owner signing evidence, successful contract REHEARSAL evidence, old/new artifact hashes, and the current `npm run testnet:verify` failure. Optionally show the saved, expired Intents dry quote. | “Live evidence establishes testnet signature recovery for the owner and a contract rehearsal. The rehearsal policy still has a full-access key and runs the old WASM. Fresh deployment of the newer artifact to policy-v2, key removal and final keyless proof are pending. Intents is a dry quote, not a live route. No funded fills or yield promise are claimed.” |

## Short cut: 45 seconds

| Edit time | Screen | Narration |
|---|---|---|
| 0:00–0:12 | Local sandbox mock banner, policy hash and keyless local account. | “A NEAR policy contract can constrain a hedge keeper. This is local sandbox execution with mocked external services; bounded opens and reduce-only closes.” |
| 0:12–0:30 | Keeper close, rogue rejections, dead-man path, unchanged owner snapshot. | “The keeper requests a close during the recorded rally; rogue calls fail contract checks. Owner nonce and balance stay unchanged during this autonomous phase. Selling the remaining spot still needs owner approval.” |
| 0:30–0:45 | Results table and contract REHEARSAL label next to pending policy-v2 status. | “Reproduce the replay and sandbox with the README commands. The live contract proof is a rehearsal with a key still present. Final keyless deployment is pending. Historical simulations are not promised returns.” |

The edit timestamps are production choices. No runtime or fresh-machine time budget is promised. Wait for commands to finish and edit pauses rather than implying that the video duration is the test duration. The replay, testnet snapshot and local run outputs have different scopes; retain their labels in the recording.

Every factual statement and displayed quantity above is indexed in [CLAIMS](CLAIMS.md). The source reports contain runtime-dependent sandbox timestamps and receipt hashes; those should change on a new run. Use the actual successful run, not a fabricated terminal transcript.
