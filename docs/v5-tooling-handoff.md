# V5 tooling handoff

Prepared without keys, signing, transactions, exchange submission, or paid APIs. No git was run. Existing v4 evidence and artifacts were not edited.

## Implemented

- `scripts/mainnet-version.ts`: explicit `POLICY_VERSION=v4|v5`, independent plan/WASM/checksum/evidence paths; v4 default preserved. V5 owner/policy/keeper are haxheton.near/cw5.haxheton.near/keeper4.haxheton.near.
- Owner plan reads existing keeper instead of requiring its absence; step3 verifies its reserve and never creates/funds it. Policy creation is exactly5.5NEAR. V5 uses existing wrapped backing, capped3.6wNEAR; it refuses to wrap more. Existing wrap registrations are read and skipped.
- V5 storage feasibility uses artifact bytes+1,144observed state overhead+128KiB growth at10^19yocto/byte, plus0.5NEAR operating reserve, all <=5.5NEAR. Final347891byte artifact gives5.30107NEAR conservative requirement.
- Owner budget is6.01NEAR liquid=5.5policy+.5owner reserve+.01policy wrap registration. Cumulative spend guard uses captured owner amount+exact required manual top-up as funded baseline and6.01spend ceiling; all signers also have live storage/gas liquidity guards.
- V5 opening band10bps; expected reduce-only exit mirrors `get_exit_pricing`, validating25bps anchor band+timelocked corridor, clamping to `max_fallback_price`, rounding down. Fresh oracle remains primary when configured. Preparation refreshes it before either open or close; current mainnet account remains null because no maintained Pyth NEAR deployment could be verified.
- One readline async iterator buffers all reconciliation answers, including piped stdin across asynchronous work. EOF fails explicitly. Proven by regression test.
- Existing integer-ms serialization,3sNEAR/1svenue clock guard, full user-signature replay window and journal-before-send/no resend guarantees preserved. Account-absence public reads now retry RPC transport/errors with read-only backoff and fallback.
- V5 execution writes `docs/evidence/mainnet-execute-v5/`; owner lifecycle uses `mainnet-owner-v5-lifecycle`. Request filenames include v5. Existing v4 request-consumption search remains correct and versioned.
- `docs/MAINNET.md` prepends full v5 ordered commands, financing, fallback limitations, no real Intents claims. `docs/V5-INTEGRATIONS.md` records official Pyth/1Click incompatibility evidence and exact excluded work.

## Prepared mainnet plan

Created by `POLICY_VERSION=v5 ... tsx scripts/mainnet-owner.ts --step=plan` using the owner-approved payout recipient in v4's completed lifecycle. This command only reads public mainnet data and writes new local files. A second `POLICY_VERSION=v5 bash scripts/mainnet-runbook.sh2` verified the prepared plan/budget and reread current liquid funding without overwriting them.

- `docs/evidence/policy-v5-mainnet-plan.json`: derived strategy `0x57fd8540f79e7ca0967ac4105bef0ac94e2ad013`, root/derived public proof block224535741; NEAR asset74, size decimals1, initial market3.20796; artifact347891bytes SHA256`07d9275db2d3e81ab2ba04894616ef8de7fb43777561619f0deb001eaf8d5aed`.
- `docs/evidence/mainnet-owner-v5/budget.json`: owner liquid0.822255179214294499999998NEAR; **exact extra5.187744820785705500000002NEAR**. Funded baseline6.01182NEAR includes owner storage182bytes. Keeper liquid0.6910684689861766NEAR. Owner wrapped balance exactly3.6wNEAR. V4 actual storage345920bytes independently reread at block224535479.
- Initializer payout is immutable `0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a`, prior owner-approved Arbitrum One recipient. Step2 prints it for the owner's review. New derived v5 strategy is distinct from v4.
- Owner should transfer21USDC to v5 strategy and keep22available for a possible separate1USDC funding/activation fee. At least15USDC verified perps margin is required; class transfer caps total20. USDC is separate from NEAR/wNEAR budget.

## Checks

67focused tests passed across seven mainnet tooling suites (including five new v5 tests). Root TypeScript compilation passed before another engineer's protected `scripts/verify-mainnet.test.ts` changes introduced two transient type errors; those files were not edited here. Root is running the final combined test/typecheck pass. Rust/WASM validation belongs to contract agent (148cargo tests reported passing).

Owner command sequence: `export POLICY_VERSION=v5`, then entrypoint steps1→2→3→4→5→6→7→8→9; fund exact v5 derived strategy;10→11→12→13;wait>all opening expiries;14→15;verify independent Arbitrum receipt;16→17→18. Run each step individually. Do not run keeper concurrently with owner execution.

Final combined root validation supersedes the transient verification-test issues above: full `cargo test --manifest-path contracts/policy/Cargo.toml --locked` passed 148 tests; `npm test` passed 668 root tests and 42 web tests; `npm run typecheck` passed. Existing evidence and historical artifact hashes were rechecked unchanged. Two complete v5 production builds were byte-identical. No v5 deployment or live keeper execution was performed.
