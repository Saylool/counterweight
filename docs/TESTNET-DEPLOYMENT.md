# Reproducible policy testnet deployment

Run from the repository root. The TypeScript tools never invoke `near`, read wallets,
access the keychain, generate key material, sign, or submit NEAR transactions.
Only the owner runs the printed near-cli-rs commands. Syntax was checked against
installed near-cli-rs **0.31.1** help; calls use the successful
[owner proof](evidence/2026-11-10-signing-proof.md) `sign-with-keychain send` suffix.

## Prepare and review the commands

```sh
npm run testnet:plan
# Explicitly choose the immutable owner withdrawal recipient:
npm run testnet:plan -- --owner-evm=0x...
```

Replace `0x...` with a complete, nonzero owner address. The **testnet-only** default
is the proven owner-predecessor address `0xea8b5c6f1e3e1537222d4cbbbed3d6fa5bcc819a`.
It gives this no-funds proof a recognizable fixed recipient without inventing an
owner wallet. It is a placeholder for withdrawal configuration, **not** the strategy
signer. Never fund the owner probe address. The policy predecessor/path independently
derive the strategy address. Mainnet deployment is unsupported.

The owner must provision their own keychain entries under **each subaccount's**
near-cli-rs account identity before executing the plan. Set `POLICY_PUBLIC_KEY` and
`KEEPER_PUBLIC_KEY` to those entries' **public** `ed25519:` keys. No key generation,
import, export, private-key argument or credential-file operation is supplied here.
An owner account keychain entry alone is not a policy/keeper account entry, even
if the same public key were reused. Optional `--policy-public-key=ed25519:...` and
`--keeper-public-key=ed25519:...` arguments render literal public keys in the plan;
unset shell placeholders fail closed.

The plan creates policy with **7 NEAR** and keeper with **0.2 NEAR**, leaving 2.8
of the stated owner's 10 NEAR for fees/other use. This is testnet operating/storage
funding, not strategy funding. The 587,853-byte WASM alone stakes approximately
5.88 NEAR for storage, so a sub-NEAR deployment balance would fail. The plan checks
the local SHA-256 manifest before printing anything and prints a second hash guard
immediately before deployment. NEAR's code hash is the same SHA-256 bytes encoded
as base58, not the hexadecimal digest string.

Creation → guarded deployment → owner initialization → preflight → key deletion
are separate owner steps. **Initialize immediately after deploying.** The generic
initializer accepts the owner supplied by its caller; an uninitialized deployment
can be raced. Keep the temporary policy key if any config check fails and stop.
Do not delete it or fund the strategy until the exact owner, keeper, market, path,
signer and recipients are verified. No contract code is changed by these scripts.

The plan reads live Hyperliquid **testnet** metadata, requiring a unique active
NEAR market with precision 0–6. Current metadata is index 54 / precision 1. It
initializes `wrap.testnet`, owner NEAR recipient, selected owner EVM recipient,
`v1.signer-prod.testnet`, path `counterweight-1`, maximum short 1 NEAR, $10 per
order, $20 per rolling day, 60s cooldown, 1% opening price band and 60s price age.
Default signing resources/budgets are explicit. The initial $1 reference price is
a dummy for a cancellation-only proof; no spot is deposited, so no opening order
is possible. Refresh a real price and review budgets before any later funded use.

Key deletion is the **separate final deployment step**, after initialization and
preflight. It is irreversible under this contract: no key restoration, upgrade,
or account deletion entry point exists. The owner and keeper continue calling
contract methods from their own accounts. All policy access keys must be gone,
including function-call keys. The keeper retains a full-access key on **its own**
account because the MPC deposit cannot be paid with a function-call key; see
[KNOWN-ISSUES](KNOWN-ISSUES.md). This does not give it a policy-account access key.

## Public verification and contract proof

```sh
npm run testnet:verify -- --before-key-removal=true --owner-evm=0x...
# After the separately run irreversible removal command:
npm run testnet:verify -- --owner-evm=0x...
```

The verifier exits nonzero on any failed check. Code hash, keys and `get_state`
share one finalized block. It validates fixed account identities and live testnet
market metadata, prints all returned state, and checks limits/resources against
the plan baseline. An owner-approved later config change is reported as baseline
drift and must be reviewed. Pass the chosen `--owner-evm` to assert the exact
immutable recipient; without that argument it is displayed and syntax checked.
Pre-removal mode requires exactly one full-access policy key; normal mode requires
zero keys. An absent account is a failure even if RPC returns an empty key list.
Public derivation independently checks local curve arithmetic against the MPC view
at the same root-key block. It is not evidence of an actual signature or fill.

After keyless verification, the owner's printed keeper command calls
`request_cancel_signature({"order_id":"0"})` **through policy** with 300 Tgas
and 1 yoctoNEAR. The policy constructs the action/digest/nonce/60-second expiry.
No balance or order exists for this proof, and no funds are required on Hyperliquid.
Run immediately after receiving the NEAR transaction hash:

```sh
npm run prove:contract -- --tx=TX_HASH_FROM_KEEPER_CALL
```

The proof reads finalized public RPC receipts, accepts only policy-executor
Counterweight request/signature events and successful callback `true`, binds
operation/nonce/market/expiry/digest, and checks committed code, config identity
and zero keys at both receipt blocks. It derives the EVM address using predecessor
**policy**, recovers `{r,s,v}` locally, and refuses a mismatch or expiry with less
than three seconds remaining. It relays only that exact testnet order-zero cancel
to Hyperliquid; no arbitrary actions, vaults, transfers or signatures are accepted.
This is separate from the owner-probe relay, which still rejects `expiresAfter`.

An exclusive evidence-file claim prevents duplicate relay attempts for the same
transaction. Ambiguous HTTP results must not be retried; request a fresh cancel.
JSON and Markdown under `docs/evidence/DATE-contract-proof-TX.*` contain only public
events, checks, keys/addresses, request/signature and server response. A named
server-recovered address match or authenticated nonexistent-order cancellation
counts as signing-boundary evidence. No funding, fill or full policy-correctness
claim follows. No contract proof exists until the owner actually runs these steps.

## 1Click dry quote

```sh
npm run keeper:dry
```

This route is **mainnet public data**, independent of the testnet deployment.
[1Click has no testnet](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/introduction).
The current [request schema](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request)
supports Intents-balance sources. On 2026-11-10, the former NEAR `ORIGIN_CHAIN`
deposit/refund combination returned HTTP 400 `Internal server error`. Changing both
to `INTENTS` produced HTTP 201 with a dry quote. This previews **wNEAR already in
Intents**, not a direct native-wallet deposit or an implemented policy adapter.

Request: `dry:true`, `EXACT_INPUT`, 100 bps slippage,
`originAsset:nep141:wrap.near`, **1 NEAR** = `1000000000000000000000000`,
`depositType:INTENTS`, `refundType:INTENTS`, `refundTo:counterweight-dry.near`,
`recipientType:DESTINATION_CHAIN`, fixed dummy EVM recipient
`0x1111111111111111111111111111111111111111`, deadline now + 3 minutes.
Destination is the discovered 8-decimal
`1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054`.
The [official Hyperliquid route](https://docs.near-intents.org/integration/distribution-channels/1click-api/hyperliquid)
credits **perps USDC**, not spot or HyperEVM. There is no deposit, signature,
authorization header or live-mode option. Any deposit address anywhere in the
response is rejected. Exact input and positive minimum/output bounds are checked.

Captured public results: [quote JSON](evidence/2026-11-10-oneclick-dry-quote.json),
[testnet preflight](evidence/2026-11-10-testnet-preflight.json),
[printed plan](evidence/2026-11-10-testnet-plan.txt). Quotes expire and amounts change.
