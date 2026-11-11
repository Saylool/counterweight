# Counterweight demo script

Generated editorial table from `scripts/video/edit.ts`. Update that file, then run `npm run video:script`. Captions below are the exact burned-in English text. No narration or music is generated.

Real product captures, public explorer pages and actual local logs only. No wallet, credentials, signing, testnet sends, paid APIs or AI imagery. The browser uses a fresh profile. Keep testnet, historical and mock labels visible.

The funded lifecycle belongs to **policy-v2**, dated **2026-11-10**, at Hyperliquid address `0x3e72c8963761c3f436710df9b891d8e3a74b5390`. **policy-v3 is a separate deployment**, not the account behind those fills. The current product may compare all live accounts with the v2 artifact; do not relabel that mismatch as a match. A separate, clearly labelled capture utility compares actual finalized v3 RPC responses with the committed v3 WASM bytes. Raw responses and failures are saved.

## Main cut: 150 seconds

| Edit time | Screen / scope | Exact caption | Claim |
|---|---|---|---|
| 0:00–0:04 | title · TESTNET PROTOTYPE | Counterweight · a NEAR policy prototype on Hyperliquid testnet. | intro |
| 0:04–0:10 | hero · REAL PRODUCT · READ-ONLY | Counterweight · a NEAR policy prototype on Hyperliquid testnet. | intro |
| 0:10–0:20 | lifecycle-top · RECORDED V2 · 2026-11-10 | Recorded v2 lifecycle: owner funding preceded key removal; keeper trading followed it. | lifecycle |
| 0:20–0:28 | lifecycle-scroll · RECORDED V2 · SUPERVISED OWNER STEPS | Dated v2 proof: zero access keys. Funding and the spot-to-perp transfer came first. | keys |
| 0:28–0:35 | near-keys · PUBLIC EXPLORER · V2 KEY DELETION | Dated v2 proof: zero access keys. Funding and the spot-to-perp transfer came first. | keys |
| 0:35–0:45 | hl-fills · PUBLIC EXPLORER · V2 TESTNET | Testnet keeper short: 3.5 NEAR at 3.5121; reduce-only close at 3.5212. Position checked flat. | fills |
| 0:45–0:52 | near-open · PUBLIC EXPLORER · V2 SIGNATURE REQUEST | The public NEAR transaction records the keeper open-signature request; venue fills are separate evidence. | open |
| 0:52–1:00 | live-v2 · DATED V2 LEDGER AMOUNT · LIVE READS MAY DIFFER | Withdrawal ledger: 46.957074 USDC net plus a 1 USDC fee. Destination-chain arrival is unverified. | withdrawal |
| 1:00–1:09 | v3-proof · PUBLIC RPC CAPTURE UTILITY · SEPARATE V3 ACCOUNT | Separate v3 deployment: read-only checks compare finalized code and access keys. This is not the v2 fill account. | v3 |
| 1:09–1:16 | market · LIVE MAINNET MARKET · ILLUSTRATIVE RISK | Public mainnet market data powers an illustrative risk gate. This panel does not query a trading account. | market |
| 1:16–1:22 | evidence · DATED EVIDENCE · REHEARSAL LIMITS VISIBLE | Dated evidence and current public reads are separate. Rehearsal signatures do not prove funded fills. | evidence |
| 1:22–1:29 | demo · LOCAL SANDBOX · MOCK MPC / FILLS / ROUTE | Local sandbox: real policy WASM; mocked MPC, tokens, venue fills and route receipts. | local |
| 1:29–1:44 | terminal · ACTUAL LOCAL LOG · EDITED REVEAL, NOT REAL TIME | Local keeper close: reduce-only signature. Owner nonce and balance stay unchanged in the autonomous phase. | keeper |
| 1:44–1:53 | rogue · LOCAL CONTRACT ENFORCEMENT · MOCK EXTERNAL SYSTEMS | Local contract checks reject seven rogue attempts. Bounded ordinary keeper opens remain permitted. | rogue |
| 1:53–1:59 | resume · LOCAL OWNER-APPROVED MOCK REBALANCE | The owner then resumes and approves mock spot disposal. The local route is not a live Intents settlement. | resume |
| 1:59–2:08 | results-full · RECORDED MAINNET DATA · SIMULATED EXECUTION | Historical simulation: hedged-rebalance versus spot holder. Costs and committed-capital denominators matter. | results |
| 2:08–2:17 | results-oos · RETROSPECTIVE HOLDOUT · NOT A RETURN PROMISE | Retrospective out-of-sample holdout, with simulated execution. No return or solvency guarantee. | oos |
| 2:17–2:24 | lifecycle-scroll · SUPERVISED TESTNET · NO LIVE INTENTS ROUTE | Supervised testnet prototype. Owner observations remain trusted; no multi-day carry or live Intents route is proven. | limits |
| 2:24–2:30 | end · SUPERVISED TESTNET · OWNER OBSERVATIONS TRUSTED | Built at NEAR HACKATHON · Testnet prototype · not investment advice | end |

## X cut: 60 seconds

| Edit time | Screen / scope | Exact caption | Claim |
|---|---|---|---|
| 0:00–0:07 | keeper · LOCAL SANDBOX · MOCK MPC / FILLS · OWNER UNTOUCHED | Local keeper close: reduce-only signature. Owner nonce and balance stay unchanged in the autonomous phase. | keeper |
| 0:07–0:16 | rogue · LOCAL SANDBOX · SEVEN REJECTIONS | Local contract checks reject seven rogue attempts. Bounded ordinary keeper opens remain permitted. | rogue |
| 0:16–0:26 | hl-fills · RECORDED V2 · REAL TESTNET FILLS · 2026-11-10 | Testnet keeper short: 3.5 NEAR at 3.5121; reduce-only close at 3.5212. Position checked flat. | fills |
| 0:26–0:33 | near-keys · RECORDED V2 · PUBLIC KEY-DELETION PROOF | Dated v2 proof: zero access keys. Funding and the spot-to-perp transfer came first. | keys |
| 0:33–0:40 | near-open · PUBLIC EXPLORER · SIGNATURE REQUEST, NOT FILL PROOF | The public NEAR transaction records the keeper open-signature request; venue fills are separate evidence. | open |
| 0:40–0:47 | v3-proof · SEPARATE V3 · READ-ONLY PUBLIC RPC CHECKS | Separate v3 deployment: read-only checks compare finalized code and access keys. This is not the v2 fill account. | v3 |
| 0:47–0:54 | lifecycle-scroll · SUPERVISED TESTNET · NO LIVE INTENTS ROUTE | Supervised testnet prototype. Owner observations remain trusted; no multi-day carry or live Intents route is proven. | limits |
| 0:54–1:00 | end · SOURCE AND REBUILD INSTRUCTIONS IN THE REPOSITORY | Built at NEAR HACKATHON · Testnet prototype · not investment advice | end |

## Claim mapping

- **intro**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Testnet policy prototype”
- **lifecycle**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “funding preceded deletion, keeper trading/withdrawal followed it”
- **keys**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “v2 zero access keys”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “temporary full-access key still present during class transfer”
- **fills**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Keeper IOC short 3.5 @ 3.5121; reduce-only close 3.5 @ 3.5212, flat”
- **open**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Reservations are signed exposure, not fills”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd”
- **withdrawal**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “46.957074 net + 1 USDC fee”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “Destination-chain arrival unverified”
- **v3**: [docs/evidence/2026-11-10-policy-v3-keyless-verify.txt](evidence/2026-11-10-policy-v3-keyless-verify.txt) — anchor: “"account": "policy-v3.counterweight-samet.testnet"”; [docs/evidence/2026-11-10-policy-v3-keyless-verify.txt](evidence/2026-11-10-policy-v3-keyless-verify.txt) — anchor: “"expected": "zero access keys"”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “v2 zero access keys”
- **market**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Read-only UI, report/evidence display, public market and finalized contract reads”; [apps/web/src/App.tsx](../apps/web/src/App.tsx) — anchor: “No account is queried.”
- **evidence**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Dated evidence is historical”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “Contract signing rehearsal successful but key still present”
- **local**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “MPC responses/token handling/fills/routes mocked; real policy WASM local execution”
- **keeper**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Owner nonce/balance unchanged; no autonomous owner transaction”; [reports/demo-local.json](../reports/demo-local.json) — anchor: “"keeperCloseSigned": true”
- **rogue**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Seven attack categories/errors”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “bounded ordinary opens remain permitted”
- **resume**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Owner nonce/balance unchanged; no autonomous owner transaction”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “Mock adapter/token/receipt; owner trusted”
- **results**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Full rebalance sizes”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “Capital denominator differs for spot-holder”
- **oos**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Retrospective holdout; independent periods; frozen costs/latency”
- **limits**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “No mainnet, live Intents route, multi-day carry or bridge-arrival proof”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “Owner observations trusted”
- **end**: [docs/CLAIMS.md](CLAIMS.md) — anchor: “Hackathon deliverables”; [docs/CLAIMS.md](CLAIMS.md) — anchor: “Experimental user-account software, not a fund/investment product”

Edit times and terminal typing are editorial choices, not measured command runtimes. The terminal cut is an excerpt: setup, monitor waits and repeated lines may be omitted, with original line numbers retained. Full source log and its SHA-256 are saved. Mock labels remain visible throughout. Public failures are retained and labelled unavailable; they never become fabricated green states. Before publishing, review every image and the capture manifest, replace the repository-link placeholder with the actual public repo URL, and check that explorer details are readable. See [VIDEO.md](VIDEO.md) for exact rebuild commands and limitations.
