# Initialized v2 upgrade validation — 2026-11-10

Local validation passed. The lead has not executed this upgrade or class transfer
as part of this change. No real private keys, testnet NEAR transactions or live
Hyperliquid exchange submissions were used. Sandbox credentials were disposable
and RPC was loopback.

New production WASM: **633,561 bytes**, SHA-256
`1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a`. SHA256SUMS and local-demo pin match. Rebuilding produces identical
bytes. Export check passes **35 required methods** and rejects raw signing/test ABI.

Old production fixture: `d85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1`.
The upgrade regression initializes the exact old binary, deposits 5 mock wNEAR,
deploys the new production binary without init, compares all `get_state` fields,
rejects keeper/unrelated callers, then successfully calls the owner method.
The main persisted struct has no new/reordered fields. Existing operation enum
indices 0–5 stay fixed; the new variant is appended as 6.

| Check | Result |
|---|---|
| Rust default | pass |
| Rust test-utils | pass |
| Rust sandbox | pass |
| Exact old-to-new upgrade regression | pass |
| TypeScript | pass |
| Frontend | pass |
| Clippy | pass |
| Build | pass |
| Offline demo | pass |
| Typecheck, formatting, Clippy warnings denied | pass |
| Python custody checker | 1/1 |

Counts: **119/119** Rust default and **119/119** test-utils; **22/22** sandbox;
**420/420** TypeScript (20 files); **28/28** frontend (2 files).
The separately focused upgrade test is included in the 22 sandbox cases.

Six new official SDK Exchange-generated golden vectors cover both networks,
both transfer directions and a micro-unit amount. Rust and TS digests match
byte-for-byte. The fixture generator pins SDK 0.24.0 and both signing/exchange
source SHA-256 values. It intercepts `wallet.sign_message` without any private key.
See [structured results and vector digests](2026-11-10-v2-upgrade-validation.json).

The method is owner-only, caps each request at $60, selects monotonic nonces,
uses owner rate/fee/outstanding/pending rules, and emits normal request/signature
events. It supports the same derived account only. No destination or vault suffix
can be supplied. Transfers back to spot require zero reserved short and expired
opening authorizations. Contract wNEAR accounting is unchanged.

The relay is covered offline for exact owner identity/arguments/action/digest,
retained-key funding, original baseline plan after upgrade, stale callback
rejection, exclusive claims/no replay and balance-delta verification. Read-only
status can recheck the saved transfer without posting again. Venue user-signed
actions have no `expiresAfter`; callback/relay deadlines are local freshness
checks and do not revoke disclosed signatures.

Exact lead commands: [printed upgrade plan](2026-11-10-v2-upgrade-plan.txt).
Preserve `policy-v2-plan.json`; do not recreate or reinitialize the account.
Live transfer evidence will be produced by the lifecycle script when the lead
runs the printed owner command and supplies the transaction hash on stdin.
