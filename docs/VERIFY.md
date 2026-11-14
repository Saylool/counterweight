# Verify the mainnet run yourself

With Node >=22.19.0 and dependencies installed (`npm ci`), run:

```sh
npm run verify:mainnet
```

This reads `docs/evidence/2026-11-14-v4-mainnet-lifecycle-summary.json` and public mainnet APIs. No wallet, account, credentials or private RPC is needed. It never signs, broadcasts, submits a venue action or writes evidence. A PASS/FAIL table reports each check; any mismatch, missing field or unavailable required response exits non-zero. Network requests are bounded so the run finishes within one minute.

The checks bind the finalized NEAR deployment to the committed WASM SHA-256 (converting its base58 code hash), require an empty access-key list and successful final key deletion, and reproduce the public `v1.signer` address derivation. Signing receipts and logged digests/actions are checked against public Hyperliquid orders, fills and ledger entries. Signed limit prices and execution prices can differ: fills must satisfy the signed limit, size, side and reduce-only policy. The withdrawal is matched to its ledger entry and successful Arbitrum One native-USDC Transfer to the fixed recipient, exactly 17.886709 USDC (17886709 base units).

Only public read methods are used: NEAR query/transaction/block RPC at `https://rpc.mainnet.fastnear.com` with one fallback, Hyperliquid info at `https://api.hyperliquid.xyz/info`, and Arbitrum RPC at `https://arb1.arbitrum.io/rpc`. HTTP POST is a read transport here. Endpoint failures are failures of this verification run, never replaced with a recorded PASS.

To check a later summary:

```sh
npm run verify:mainnet -- --summary=path/to/v5-summary.json
```

The summary selects the policy, derivation path, transaction hashes and expected public evidence. Keep its corresponding WASM and checksum manifest in the checkout. The verifier's offline tests exercise parsing, cryptographic derivation, receipt/action matching and tampered evidence without network access:

```sh
npx vitest run scripts/verify-mainnet.test.ts
```

This verifies one recorded lifecycle against public services, not future safety, autonomous operation or trustworthy owner/keeper marks. Matching signed requests, public orders and fills is evidence correlation, not a trustless cross-chain receipt proof. Public RPC responses are trusted; owner settlement remains an attestation. An unrelayed setup signature is checked as a successful NEAR signature, not asserted to have a venue fill.

For GitHub Pages, build with `WEB_BASE_PATH=/counterweight/ npm run web:build` and publish **`apps/web/dist/`**. The directory contains static HTML, JS, CSS, evidence and report data; no application server is required. The first screen shows mainnet proof and attempts browser-only public NEAR status reads. When those reads fail, it explicitly shows the dated bundled evidence. Testnet and local sections are historical.
