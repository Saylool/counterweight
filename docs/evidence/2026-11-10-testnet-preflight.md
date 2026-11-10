# Policy deployment preflight — 2026-11-10 (testnet)

Scope: public verification and owner-run command preparation. **No NEAR
transaction was signed or sent, and no private key was generated or accessed.**

1. `npm run testnet:plan` verified the committed 587,853-byte policy artifact:
   SHA-256 `698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289`.
   Hyperliquid testnet metadata: NEAR asset **54**, size decimals **1**.
   Full owner commands and expected results: [plan output](2026-11-10-testnet-plan.txt).
2. `npm run testnet:verify` at finalized block **277053814**:
   - Code: **FAIL / UNKNOWN_ACCOUNT**; policy has not been created.
   - Access keys: **UNPROVEN**; an empty list for a nonexistent account cannot
     establish custody. The verifier fails this check until account existence is proved.
   - `get_state`: **FAIL / UNKNOWN_ACCOUNT**; no deployed configuration to inspect.
   - Public derivation: **PASS**. Predecessor
     `policy.counterweight-samet.testnet`, path `counterweight-1`, address
     `0xaa640b1c7b3ac37db14d2705eaeceeb42d91eb0c`. Local derivation agrees with
     the MPC derived-key view at root block **277053831**.
   Full output: [preflight JSON](2026-11-10-testnet-preflight.json).
3. `npm run keeper:dry` returned **ready**, HTTP **201**, for a 1 NEAR
   Intents-balance → Hyperliquid **mainnet perps USDC** quote. A subsequent public
   capture at `2026-11-10T10:16:33.836Z` returned **3.266120 USDC**, minimum
   **3.230358 USDC**, estimated 22 seconds. `dry:true`, no deposit address,
   signing requests **0**, transactions **0**. Quote expired at
   `2026-11-10T10:19:33.837Z`; it is not an execution promise.
   Full request/response: [quote JSON](2026-11-10-oneclick-dry-quote.json).

The former `ORIGIN_CHAIN` NEAR deposit/refund combination returned HTTP 400 with
`Internal server error`; the working preview uses `INTENTS` for both. This changes
the modeled source to wNEAR already in Intents. It does not implement a direct
native-wallet deposit or the policy route adapter. NEAR Intents has no testnet.
See [request schema](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request),
[Hyperliquid perps delivery](https://docs.near-intents.org/integration/distribution-channels/1click-api/hyperliquid)
and [no-testnet statement](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/introduction).

Validation: `npm test` **322 tests / 13 files passed** (offline, mocked HTTP);
`npm run typecheck` and `npm run build` passed. Contract receipt parsing tests
use an already-public signature fixture, never a newly generated signature/key.

Not established: deployment, zero keys on an existing policy account, live policy
config, a contract-requested MPC signature, funding or fills. Those require the
owner's printed steps and a real keeper transaction hash passed to
`npm run prove:contract -- --tx=...`. No synthetic contract proof was recorded.
