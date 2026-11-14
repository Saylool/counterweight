# Counterweight web

Read-only React + Vite + TypeScript frontend. No wallet SDK, private keys, signing, exchange actions, or transactions. Public POST requests are limited to NEAR `query` and Hyperliquid `/info` market and testnet account reads.

From the repository root:

```sh
# Install all locked workspaces, including the frontend and local sandbox.
export npm_config_cache="$PWD/.tmp/npm-cache"
npm ci
npm run web
```

Open the local URL Vite prints (normally http://localhost:5173). The first section presents v4's owner-supervised mainnet lifecycle on 14 November 2026, with NEAR keyless account, Hyperliquid open/close fills, and Arbitrum One arrival links. Its downloadable summary records verification limits and tooling incidents; it is dated evidence, not continuous mainnet monitoring. Historical v1–v3 sections remain testnet, with live testnet position, margin and ledger reads for their derived addresses. v1 is selectable as a rehearsal with an access key. Configured policy limits display exact NEAR/USDC amounts beside raw integer values. Run `npm run web:build` to produce `apps/web/dist`; upload the contents to any static host. No backend, secrets, or SPA fallback is required.

```sh
# Deploy under a subdirectory (include the trailing slash):
WEB_BASE_PATH=/counterweight/ npm run web:build
```

The default base is `./`, suitable for a static directory. Optional build-time environment settings (also supported in `apps/web/.env.local`):

- `VITE_POLICY_ACCOUNT`: defaults to `policy-v3.counterweight-samet.testnet`; the panel can switch to historical v2 or inspect another named testnet account.
- `VITE_NEAR_RPC`: defaults to `https://rpc.testnet.near.org`; use a public CORS-enabled NEAR testnet RPC when the default rate-limits. CLI commands instead use `NEAR_TESTNET_RPC`; never embed credentials in frontend variables.
- `VITE_REPO_URL`: source repository link; defaults to `https://github.com/Saylool/counterweight` when unset.
- `WEB_BASE_PATH`: Vite asset base, defaults to `./`.

`npm test` includes the existing suite and frontend Vitest tests. `npm run typecheck` and `npm run build` include frontend checks; `npm run web:test` runs only frontend tests.

The build validates the replay report, copies dated evidence and original report downloads, and hashes the committed WASM against its manifest. A failed, partial or missing local demo report does not abort the build; it is rendered as **failed** with its recorded error. Smaller presentation JSON is generated from those sources; no performance numbers are hard-coded. The return curve retains extrema per 12-hour bucket. Price and H charts show **recorded strategy events**, because the report does not contain hourly price/H series. Min H in the table is the report's intrabar proxy; chart H is the close-time event value. Periods restart independently and are not additive.

NEAR account, access-key list, state and public MPC derived key are pinned to one finalized block. Access keys and code mismatches are shown independently; an unknown account cannot appear as a zero-key proof. Address derivation comes from the configured signer's public view; it is not a live signature/fill proof. The funded account panel reads Hyperliquid testnet; the separate market/risk illustration uses mainnet and does not query an account. The isolated short liquidation distance is a maintenance-model proxy, not a venue liquidation quote. Live data refreshes on request; the entry gate checks order-book freshness at render time.

Screenshot candidates: hero/architecture, finalized contract verification, replay period comparison, and local keeper/rogue timeline. CSS follows system dark/light preference and reduced-motion preference. Public API failures preserve the rest of the page and offer a retry. Original JSON downloads are loaded only on demand.
