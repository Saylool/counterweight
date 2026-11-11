/** Editorial source of truth. Every displayed caption is an exact, reviewed claim with evidence anchors. */
export interface Citation { path: string; contains: string }
export interface Claim { caption: string; evidence: Citation[] }
const index = (contains: string): Citation => ({ path: 'docs/CLAIMS.md', contains });
export const claims = {
  intro: { caption: 'Counterweight · a NEAR policy prototype on Hyperliquid testnet.', evidence: [index('Testnet policy prototype')] },
  lifecycle: { caption: 'Recorded v2 lifecycle: owner funding preceded key removal; keeper trading followed it.', evidence: [index('funding preceded deletion, keeper trading/withdrawal followed it')] },
  keys: { caption: 'Dated v2 proof: zero access keys. Funding and the spot-to-perp transfer came first.', evidence: [index('v2 zero access keys'), index('temporary full-access key still present during class transfer')] },
  fills: { caption: 'Testnet keeper short: 3.5 NEAR at 3.5121; reduce-only close at 3.5212. Position checked flat.', evidence: [index('Keeper IOC short 3.5 @ 3.5121; reduce-only close 3.5 @ 3.5212, flat')] },
  open: { caption: 'The public NEAR transaction records the keeper open-signature request; venue fills are separate evidence.', evidence: [index('Reservations are signed exposure, not fills'), index('2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd')] },
  withdrawal: { caption: 'Withdrawal ledger: 46.957074 USDC net plus a 1 USDC fee. Destination-chain arrival is unverified.', evidence: [index('46.957074 net + 1 USDC fee'), index('Destination-chain arrival unverified')] },
  v3: { caption: 'Separate v3 deployment: read-only checks compare finalized code and access keys. This is not the v2 fill account.', evidence: [{ path: 'docs/evidence/2026-11-10-policy-v3-keyless-verify.txt', contains: '"account": "policy-v3.counterweight-samet.testnet"' }, { path: 'docs/evidence/2026-11-10-policy-v3-keyless-verify.txt', contains: '"expected": "zero access keys"' }, index('v2 zero access keys')] },
  market: { caption: 'Public mainnet market data powers an illustrative risk gate. This panel does not query a trading account.', evidence: [index('Read-only UI, report/evidence display, public market and finalized contract reads'), { path: 'apps/web/src/App.tsx', contains: 'No account is queried.' }] },
  evidence: { caption: 'Dated evidence and current public reads are separate. Rehearsal signatures do not prove funded fills.', evidence: [index('Dated evidence is historical'), index('Contract signing rehearsal successful but key still present')] },
  local: { caption: 'Local sandbox: real policy WASM; mocked MPC, tokens, venue fills and route receipts.', evidence: [index('MPC responses/token handling/fills/routes mocked; real policy WASM local execution')] },
  keeper: { caption: 'Local keeper close: reduce-only signature. Owner nonce and balance stay unchanged in the autonomous phase.', evidence: [index('Owner nonce/balance unchanged; no autonomous owner transaction'), { path: 'reports/demo-local.json', contains: '"keeperCloseSigned": true' }] },
  rogue: { caption: 'Local contract checks reject seven rogue attempts. Bounded ordinary keeper opens remain permitted.', evidence: [index('Seven attack categories/errors'), index('bounded ordinary opens remain permitted')] },
  resume: { caption: 'The owner then resumes and approves mock spot disposal. The local route is not a live Intents settlement.', evidence: [index('Owner nonce/balance unchanged; no autonomous owner transaction'), index('Mock adapter/token/receipt; owner trusted')] },
  results: { caption: 'Historical simulation: hedged-rebalance versus spot holder. Costs and committed-capital denominators matter.', evidence: [index('Full rebalance sizes'), index('Capital denominator differs for spot-holder')] },
  oos: { caption: 'Retrospective out-of-sample holdout, with simulated execution. No return or solvency guarantee.', evidence: [index('Retrospective holdout; independent periods; frozen costs/latency')] },
  limits: { caption: 'Supervised testnet prototype. Owner observations remain trusted; no multi-day carry or live Intents route is proven.', evidence: [index('No mainnet, live Intents route, multi-day carry or bridge-arrival proof'), index('Owner observations trusted')] },
  end: { caption: 'Built at NEAR HACKATHON · Testnet prototype · not investment advice', evidence: [index('Hackathon deliverables'), index('Experimental user-account software, not a fund/investment product')] },
} satisfies Record<string, Claim>;
export type ClaimId = keyof typeof claims;
export type Shot = 'title' | 'hero' | 'lifecycle-top' | 'lifecycle-scroll' | 'live-v2' | 'live-v3' | 'v3-proof' | 'market' | 'evidence' | 'results-full' | 'results-oos' | 'demo' | 'hl-fills' | 'near-open' | 'near-keys' | 'terminal' | 'keeper' | 'rogue' | 'resume' | 'end';
export interface Scene { shot: Shot; seconds: number; claim: ClaimId; scope: string }
export const main: Scene[] = [
  { shot: 'title', seconds: 4, claim: 'intro', scope: 'TESTNET PROTOTYPE' },
  { shot: 'hero', seconds: 6, claim: 'intro', scope: 'REAL PRODUCT · READ-ONLY' },
  { shot: 'lifecycle-top', seconds: 10, claim: 'lifecycle', scope: 'RECORDED V2 · 2026-11-10' },
  { shot: 'lifecycle-scroll', seconds: 8, claim: 'keys', scope: 'RECORDED V2 · SUPERVISED OWNER STEPS' },
  { shot: 'live-v3', seconds: 7, claim: 'v3', scope: 'LIVE PUBLIC RPC · V3 ZERO ACCESS KEYS' },
  { shot: 'hl-fills', seconds: 14, claim: 'withdrawal', scope: 'PUBLIC EXPLORER · HYPURRSCAN · SPOT→PERP + WITHDRAW' },
  { shot: 'live-v2', seconds: 11, claim: 'fills', scope: 'RECORDED V2 · REAL TESTNET FILLS · 2026-11-10' },
  { shot: 'v3-proof', seconds: 9, claim: 'v3', scope: 'PUBLIC RPC CAPTURE UTILITY · SEPARATE V3 ACCOUNT' },
  { shot: 'market', seconds: 7, claim: 'market', scope: 'LIVE MAINNET MARKET · ILLUSTRATIVE RISK' },
  { shot: 'evidence', seconds: 6, claim: 'evidence', scope: 'DATED EVIDENCE · REHEARSAL LIMITS VISIBLE' },
  { shot: 'demo', seconds: 7, claim: 'local', scope: 'LOCAL SANDBOX · MOCK MPC / FILLS / ROUTE' },
  { shot: 'terminal', seconds: 15, claim: 'keeper', scope: 'ACTUAL LOCAL LOG · EDITED REVEAL, NOT REAL TIME' },
  { shot: 'rogue', seconds: 9, claim: 'rogue', scope: 'LOCAL CONTRACT ENFORCEMENT · MOCK EXTERNAL SYSTEMS' },
  { shot: 'resume', seconds: 6, claim: 'resume', scope: 'LOCAL OWNER-APPROVED MOCK REBALANCE' },
  { shot: 'results-full', seconds: 9, claim: 'results', scope: 'RECORDED MAINNET DATA · SIMULATED EXECUTION' },
  { shot: 'results-oos', seconds: 9, claim: 'oos', scope: 'RETROSPECTIVE HOLDOUT · NOT A RETURN PROMISE' },
  { shot: 'lifecycle-scroll', seconds: 7, claim: 'limits', scope: 'SUPERVISED TESTNET · NO LIVE INTENTS ROUTE' },
  { shot: 'end', seconds: 6, claim: 'end', scope: 'SUPERVISED TESTNET · OWNER OBSERVATIONS TRUSTED' },
];
export const short: Scene[] = [
  { shot: 'keeper', seconds: 7, claim: 'keeper', scope: 'LOCAL SANDBOX · MOCK MPC / FILLS · OWNER UNTOUCHED' },
  { shot: 'rogue', seconds: 9, claim: 'rogue', scope: 'LOCAL SANDBOX · SEVEN REJECTIONS' },
  { shot: 'lifecycle-top', seconds: 10, claim: 'fills', scope: 'RECORDED V2 · REAL TESTNET FILLS · 2026-11-10' },
  { shot: 'lifecycle-scroll', seconds: 7, claim: 'keys', scope: 'RECORDED V2 · KEY REMOVED BEFORE KEEPER TRADING' },
  { shot: 'hl-fills', seconds: 7, claim: 'withdrawal', scope: 'PUBLIC EXPLORER · HYPURRSCAN · WITHDRAW' },
  { shot: 'v3-proof', seconds: 7, claim: 'v3', scope: 'SEPARATE V3 · READ-ONLY PUBLIC RPC CHECKS' },
  { shot: 'lifecycle-scroll', seconds: 7, claim: 'limits', scope: 'SUPERVISED TESTNET · NO LIVE INTENTS ROUTE' },
  { shot: 'end', seconds: 6, claim: 'end', scope: 'SOURCE AND REBUILD INSTRUCTIONS IN THE REPOSITORY' },
];
export const duration = (scenes: Scene[]) => scenes.reduce((n, scene) => n + scene.seconds, 0);
export function schedule(scenes: Scene[]) {
  let time = 0;
  return scenes.map(scene => { const start = time; time += scene.seconds; return { ...scene, start, end: time }; });
}
const stamp = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
export function scriptMarkdown() {
  return `# Counterweight demo script\n\nGenerated editorial table from \`scripts/video/edit.ts\`. Update that file, then run \`npm run video:script\`. Captions below are the exact burned-in English text. No narration or music is generated.\n\nReal product captures, public explorer pages and actual local logs only. No wallet, credentials, signing, testnet sends, paid APIs or AI imagery. The browser uses a fresh profile. Keep testnet, historical and mock labels visible.\n\nThe funded lifecycle belongs to **policy-v2**, dated **2026-11-10**, at Hyperliquid address \`0x3e72c8963761c3f436710df9b891d8e3a74b5390\`. **policy-v3 is a separate deployment**, not the account behind those fills. The current product may compare all live accounts with the v2 artifact; do not relabel that mismatch as a match. A separate, clearly labelled capture utility compares actual finalized v3 RPC responses with the committed v3 WASM bytes. Raw responses and failures are saved.\n\n` +
    ([['Main cut', main], ['X cut', short]] as const).map(([name, scenes]) => `## ${name}: ${duration(scenes)} seconds\n\n| Edit time | Screen / scope | Exact caption | Claim |\n|---|---|---|---|\n` + schedule(scenes).map(s => `| ${stamp(s.start)}–${stamp(s.end)} | ${s.shot} · ${s.scope} | ${claims[s.claim].caption} | ${s.claim} |`).join('\n')).join('\n\n') +
    `\n\n## Claim mapping\n\n` + Object.entries(claims).map(([id, claim]) => `- **${id}**: ` + claim.evidence.map(e => `[${e.path}](${e.path.startsWith('docs/') ? e.path.slice(5) : '../' + e.path}) — anchor: “${e.contains}”`).join('; ')).join('\n') +
    `\n\nEdit times and terminal typing are editorial choices, not measured command runtimes. The terminal cut is an excerpt: setup, monitor waits and repeated lines may be omitted, with original line numbers retained. Full source log and its SHA-256 are saved. Mock labels remain visible throughout. Public failures are retained and labelled unavailable; they never become fabricated green states. Before publishing, review every image and the capture manifest, replace the repository-link placeholder with the actual public repo URL, and check that explorer details are readable. See [VIDEO.md](VIDEO.md) for exact rebuild commands and limitations.\n`;
}
