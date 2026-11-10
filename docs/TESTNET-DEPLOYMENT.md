# Reproducible policy testnet deployment

The funded policy-v2 run now uses [FUNDED-LIFECYCLE](FUNDED-LIFECYCLE.md). The owner recipient is mandatory, and v2 verification requires its saved plan. Historical cancellation evidence below remains separate from funded execution.

Run from the repository root. TypeScript tools never invoke `near`, read wallets,
access the keychain, generate keys, sign, or submit NEAR transactions. The team
lead runs the printed near-cli-rs commands. The relay sends validated contract-authorized actions to Hyperliquid **testnet**.

## Current deployment and next artifact

`policy.counterweight-samet.testnet` is initialized with the original WASM
`698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289`.
Its full-access policy key is intentionally present until final code freeze;
there is no final keyless proof yet. Keeper signature request
`5ThwVx4mRcfAKBWCqWEcF2kUqMuUsqAL887yVtbqzaP9` emitted a signature but is now
expired. A fresh keeper request is required; no script can extend its expiry.

## Upgrade the already initialized v2 (current run)

The deployed `policy-v2.counterweight-samet.testnet` runs baseline
`d85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1`.
Its full-access policy key is still present. The new artifact is **633,561 bytes**,
SHA-256 `1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a`. The main persisted `Policy` struct is unchanged;
`OperationKind::UsdClassTransfer` is appended after all existing enum variants.
No new state fields or migration are required. The sandbox upgrade regression
uses the exact old production WASM, initializes it, deposits 5 mock wNEAR,
upgrades to the new production WASM and verifies every `get_state` field plus
successful owner-only signing.

Run from the repository root; the lead executes all printed NEAR commands:

```sh
npm run testnet:plan -- --upgrade-v2=true
test "$(shasum -a 256 contracts/policy/artifacts/counterweight_policy.wasm | cut -d ' ' -f 1)" = '1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a' && near contract deploy policy-v2.counterweight-samet.testnet use-file contracts/policy/artifacts/counterweight_policy.wasm without-init-call network-config testnet sign-with-keychain send
npm run testnet:verify -- --policy=policy-v2.counterweight-samet.testnet --before-key-removal=true --plan=docs/evidence/policy-v2-plan.json
npm run lifecycle -- --step=to-perp --amount=49
```

**Do not call `new`, recreate the account, or overwrite `policy-v2-plan.json`.**
Verification retains the saved baseline initializer and checks the current WASM
against SHA256SUMS. Upgrade preserves the predecessor, path, recipient and derived
address `0x3e72c8963761c3f436710df9b891d8e3a74b5390`.

Hyperliquid UI **Send credits SPOT USDC**; it offers no perp destination. The 50
mock USDC already sent therefore needs this owner-only `usdClassTransfer` to move
49 into perps, leaving 1 in spot. Start the lifecycle command in terminal A. Run
its one printed owner `request_usd_class_transfer` near-cli command in terminal B,
then immediately paste only that transaction hash into A. The script checks exact
owner/arguments/events/digest, receipt-block code/config/keys and recovered signer,
claims the hash exclusively, posts once to Hyperliquid testnet, and checks both
spot debit and perps equity credit. It records JSON plus Markdown in `docs/evidence/`.
No contract USDC balance is invented; `spot_balance` remains the NEAR wNEAR ledger.

The request takes micro-USDC (`49000000`), internally selects the nonce, and caps
amounts at $60. `to_perp:false` is also owner-only and requires zero reserved short
and expired opening authorizations. An active signing callback or rebalance route/
withdrawal blocks transfer. Rate/fee/nonce/outstanding rules remain enforced.
The SDK user-signed action has **no venue `expiresAfter`**. The callback has a local
60s deadline; the relay refuses signatures older than 57s and never retries an
uncertain submission. A signature already disclosed can remain usable beyond that
local deadline; inspect evidence/public balances before any new request.

A single retained full-access key or zero keys is allowed only for this owner
funding step; this is not a final keyless proof. After verified perps funding,
review config and evidence, then follow the separate final key-removal step before
trading. Orders/withdrawals still require zero policy keys.

SDK sources: [exact EIP-712 types and primary type](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/2fdb18f9517675ea03695a0962bd19eece9c83f0/hyperliquid/utils/signing.py),
[Exchange wire format](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/2fdb18f9517675ea03695a0962bd19eece9c83f0/hyperliquid/exchange.py).
Domain `HyperliquidSignTransaction`, version `1`, chain ID 421614, zero verifying
contract; primary type `HyperliquidTransaction:UsdClassTransfer`; ordered fields
`hyperliquidChain:string, amount:string, toPerp:bool, nonce:uint64`.
`signatureChainId` is `0x66eee`. Exchange appends ` subaccount:<vault>` to amount
only when a vault address is supplied. This ABI supports the same derived account
only: plain amount `"49"`, no vault/subaccount suffix or destination. Six golden
vectors cover both directions, both networks and the minimum micro-unit through
the actual pinned SDK Exchange path, with no signing keys.

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
npm run derive -- --account=policy-v2.counterweight-samet.testnet
npm run testnet:plan -- --owner-evm="$OWNER_EVM" --policy-public-key="$POLICY_PUBLIC_KEY"
```

Set `OWNER_EVM` to the owner's complete nonzero wallet address. There is no default recipient.
`0xea8b5c6f1e3e1537222d4cbbbed3d6fa5bcc819a` is the historical owner-predecessor
probe address. Never fund it.
The strategy signer derives independently from the policy predecessor/path.
Mainnet is unsupported.

The lead provisions a fresh policy keychain entry and sets `POLICY_PUBLIC_KEY` to
its **public** `ed25519:` key, or passes `--policy-public-key=ed25519:...`. No private
key operation is supplied. Reuse the existing keeper; do not recreate its account.
The new contract supports a keeper function-call key restricted to that policy's
intended keeper methods, with a sufficient gas allowance and **zero deposit**.
Provisioning/removing keeper keys is a separate lead-managed operation; the plan
does not rotate existing keys.

Policy creation funds **9 NEAR**, covering roughly 6.28 NEAR WASM storage,
1.31 NEAR bounded state-growth headroom and 1 NEAR operating reserve, plus initial
state. The funded run also wraps 5 NEAR: ensure the owner has 14 NEAR plus gas/storage **available now**; the original account's
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
with precision 0–6 and fetches the live TESTNET mark. Funded limits: 5 NEAR maximum short, $20/order, $40/rolling
day, 60s cooldown, 1% open band, 60s price age, default signing budgets. Reference is the live mark rounded to micro-USD;
immutable bounds are 80–120% of that mark. The full procedure deposits 5 wNEAR and verifies actual custody before final key deletion.

## Final keyless verification and proof

```sh
npm run testnet:verify -- --policy=policy-v2.counterweight-samet.testnet --before-key-removal=true --owner-evm="$OWNER_EVM" --plan=docs/evidence/policy-v2-plan.json
# Lead separately runs the plan's irreversible key-deletion command after code freeze.
npm run testnet:verify -- --policy=policy-v2.counterweight-samet.testnet --owner-evm="$OWNER_EVM" --plan=docs/evidence/policy-v2-plan.json
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

## policy-v2 initializer revision

The new ABI adds **`network`** and **`oracle`**; all previous init arguments remain.
Historical cancellation-only initializer values (superseded for funded v2 by the live mark and bounds saved in `policy-v2-plan.json`):

```json
{
  "network": "Testnet",
  "oracle": {
    "account_id": null,
    "feed_id": "c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750",
    "max_age_seconds": 60,
    "max_confidence_bps": 100,
    "min_price": "950000",
    "max_price": "1050000"
  }
}
```

Pyth NEAR is retired; see [official verification and fallback rules](ORACLE.md).
The range and oracle identity are immutable and apply even to oracle returns.
Keeper function-call permissions should include `set_keeper_price` when bounded
fallback is intended; anyone may call `refresh_oracle` when an oracle is configured.
The historical `$1` reference and fixed proof range permit cancellation evidence only;
do not fund a controller with those values. The current funded planner uses the public TESTNET mark and absolute bounds described above. No funded plan has been executed by these scripts.
The contract supports selecting the Mainnet domain, but this plan, recipient probe,
relay and deployment evidence remain testnet-specific. Mainnet operation is unverified.
