# Reproducible policy testnet deployment

Run from the repository root. TypeScript tools never invoke `near`, read wallets,
access the keychain, generate keys, sign, or submit NEAR transactions. The team
lead runs the printed near-cli-rs commands. The relay sends only the validated
public order-zero cancellation to Hyperliquid **testnet**.

## Current deployment and next artifact

`policy.counterweight-samet.testnet` is initialized with the original WASM
`698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289`.
Its full-access policy key is intentionally present until final code freeze;
there is no final keyless proof yet. Keeper signature request
`5ThwVx4mRcfAKBWCqWEcF2kUqMuUsqAL887yVtbqzaP9` emitted a signature but is now
expired. A fresh keeper request is required; no script can extend its expiry.

The rebuilt default artifact is **588,218 bytes**, SHA-256:

```text
e8bfa3d5e93c2ea85bd99be5b71a97508a90046f79b9d00aab34b2e9f0d6c48a
```

It adds bounded reserve-funded MPC signing. It has **not** been deployed. The next
plan defaults to a fresh `policy-v2.counterweight-samet.testnet`, reusing
`keeper.counterweight-samet.testnet`. The old account will be frozen by key
deletion; do not plan to upgrade it afterward. A new predecessor derives a new
strategy EVM address even with the same `counterweight-1` path.

## Rehearse on the existing policy

Start this first; it warms public metadata and derivation before waiting:

```sh
npm run prove:contract:live -- --keeper=keeper.counterweight-samet.testnet --policy=policy.counterweight-samet.testnet --rehearsal --wasm-sha256=698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289
```

In a second terminal, run the exact command it prints (the original WASM still
needs the attached 1 yoctoNEAR):

```sh
near contract call-function as-transaction policy.counterweight-samet.testnet request_cancel_signature json-args '{"order_id":"0"}' prepaid-gas '300 Tgas' attached-deposit '1 yoctoNEAR' sign-as keeper.counterweight-samet.testnet network-config testnet sign-with-keychain send
```

Paste its transaction hash immediately into the waiting relay. Alternatively,
pass an already fresh hash with `--tx=HASH` to the live command, or directly:

```sh
npm run prove:contract -- --rehearsal --wasm-sha256=698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289 --tx=FRESH_KEEPER_TX_HASH
```

**60-second window:** `expiresAfter` starts in the policy request block. MPC
signing, NEAR finality, receipt reads and HTTP submission all consume this window;
it does not start when the hash is pasted. Less than three seconds remaining
fails closed. If expired or transport outcome is unknown, request a fresh cancel;
never retry the same signature. Live mode accepts a newline-delimited hash from
stdin as well as `--tx=HASH`. It prints commands and waits; it never executes them.

Rehearsal requires a full-access key in the current finalized view and at both
request/signature receipt blocks. Console and both evidence formats must say:

> REHEARSAL — policy account still had a full-access key; not the final keyless proof

The historical hash override is allowed **only** with `--rehearsal` on the original
policy and only for the pinned original hash. It does not bypass identity, market,
receipt, expiry, digest or recovery checks. Rehearsal is not final custody evidence.

## Prepare and review the fresh-account plan

```sh
npm run testnet:plan
# Choose another fresh policy and the actual fixed owner withdrawal recipient:
npm run testnet:plan -- --policy=policy-v2.counterweight-samet.testnet --owner-evm=0x...
```

Replace `0x...` with a complete nonzero owner address. The testnet-only default
`0xea8b5c6f1e3e1537222d4cbbbed3d6fa5bcc819a` is the proven owner-predecessor
probe address, a recognizable **no-funds withdrawal placeholder**. Never fund it.
The strategy signer derives independently from the policy predecessor/path.
Mainnet is unsupported.

The lead provisions a fresh policy keychain entry and sets `POLICY_PUBLIC_KEY` to
its **public** `ed25519:` key, or passes `--policy-public-key=ed25519:...`. No private
key operation is supplied. Reuse the existing keeper; do not recreate its account.
The new contract supports a keeper function-call key restricted to that policy's
intended keeper methods, with a sufficient gas allowance and **zero deposit**.
Provisioning/removing keeper keys is a separate lead-managed operation; the plan
does not rotate existing keys.

Policy creation funds **9 NEAR**, covering roughly 5.88 NEAR WASM storage,
1.31 NEAR bounded state-growth headroom and 1 NEAR operating reserve, plus initial
state. Ensure the owner has 9 NEAR plus gas **available now**; the original account's
funding is already spent. Keeper gas uses its existing funding. Signing subsidy
is capped at 0.01 NEAR/request and cannot spend storage/growth funds. The owner
sweep retains that floor plus 1 NEAR. Refill with a normal native transfer when
necessary. This is storage/operating funding, not strategy funding.

Creation → guarded deploy → initialization → preflight → key deletion are separate
lead-run steps. **Initialize immediately after deployment**: the public initializer
can be raced. Keep the temporary key if any check fails and stop. Review owner,
keeper, market, path, signer and recipients before deleting keys or funding a
strategy. The code hash must match committed SHA-256 bytes encoded as base58.

The plan reads live testnet metadata and requires a unique active NEAR market
with precision 0–6. Baseline limits: 1 NEAR maximum short, $10/order, $20/rolling
day, 60s cooldown, 1% open band, 60s price age, default signing budgets. The dummy
$1 initial reference price is suitable only for this cancellation proof. No spot
is deposited, so opens are impossible. Review prices/budgets before funded use.

## Final keyless verification and proof

```sh
npm run testnet:verify -- --policy=policy-v2.counterweight-samet.testnet --before-key-removal=true --owner-evm=0x...
# Lead separately runs the plan's irreversible key-deletion command after code freeze.
npm run testnet:verify -- --policy=policy-v2.counterweight-samet.testnet --owner-evm=0x...
npm run prove:contract:live -- --policy=policy-v2.counterweight-samet.testnet --keeper=keeper.counterweight-samet.testnet
```

Run the relay's printed zero-deposit keeper command in a second terminal and paste
the fresh hash. Final mode requires **zero policy access keys** at both receipt
blocks and the committed artifact hash; there is no final-mode hash override.
Deleting all policy keys freezes code under this ABI: there is no upgrade, account
deletion or key-restoration method. Owner/keeper methods remain callable.

The verifier uses one finalized snapshot for code, keys and configuration. Missing
accounts fail even when a key-list RPC returns empty. Pre-removal requires exactly
one full-access key. It checks immutable identities, metadata and baseline resources;
owner-approved mutable drift is reported for review. `--owner-evm` asserts the exact
immutable recipient. Public derivation agrees with the MPC view at its root-key
block; derivation alone proves no signature.

The proof accepts only successful policy-executor Counterweight request/signature
events and callback `true`. It binds keeper, policy, order zero, market, operation,
nonce, expiry and digest, checks code/config/key state at both receipt blocks,
and recovers the policy-derived EVM address before relaying that exact cancel.
An exclusive evidence-file claim prevents a duplicate attempt for that tx.
Public JSON/Markdown under `docs/evidence/DATE-contract-proof-TX.*` retain checks,
actual key lists, request/signature, response and mode notice. Only a named
server-recovered address match or authenticated cancel response proves the signing
boundary. Neither mode proves funding, fills, or every policy invariant.

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
