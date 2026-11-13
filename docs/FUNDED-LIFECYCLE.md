# Funded policy-v2 lifecycle (testnet)

The lead runs every `near` command. Scripts never invoke near-cli, read keys, sign NEAR transactions, or submit NEAR transactions. The lifecycle relay posts only the contract-authorized MPC signature to **https://api.hyperliquid-testnet.xyz/exchange**. No mainnet endpoints or private keys are used. A judge must see actual fill/ledger evidence before this is described as a funded lifecycle.

Policy: `policy-v2.counterweight-samet.testnet`; keeper: `keeper.counterweight-samet.testnet`; owner: `counterweight-samet.testnet`; signer: `v1.signer-prod.testnet`; path: `counterweight-1`.

Public derivation cross-checked 2026-11-10: **`0x3e72c8963761c3f436710df9b891d8e3a74b5390`**. Recheck it immediately before funding.

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

## Fresh-account command list (historical setup; skip for initialized v2)

1. Supply the owner's own EVM wallet address as `OWNER_EVM` and the already provisioned temporary policy **public** key as `POLICY_PUBLIC_KEY`. The corresponding signing keys remain in macOS keychain. The scripts neither create nor import keys.

   ```sh
   npm run derive -- --account=policy-v2.counterweight-samet.testnet
   npm run testnet:plan -- --owner-evm="$OWNER_EVM" --policy-public-key="$POLICY_PUBLIC_KEY" --recover-v1=true
   ```

   `--owner-evm` is mandatory. `--recover-v1=true` prints an optional irreversible v1 account deletion command with owner as beneficiary; execute it only if its policy key still exists and v1 has no remaining obligations. The owner cannot delete a child solely by owning its parent. Omit the flag to retain v1.

   The planner performs public reads and writes `docs/evidence/policy-v2-plan.json` **exclusively**, so a deployed policy's baseline cannot be overwritten accidentally. If a plan was never deployed and must be replaced, retain/archive that JSON under another filename first. Do not regenerate the baseline for an existing deployment.

2. Review and execute the exact commands printed by the planner **in their printed order**. They are the complete near-cli-rs command list, with the live initializer JSON, artifact checksum, keychain signing and fixed recipients:

   - Optional v1 `delete-account` recovery to owner.
   - Owner creates v2 with **9 testnet NEAR** and the policy public key; inspect existing keeper funding.
   - Policy key deploys the checksum-verified committed WASM; owner immediately calls `new`.
   - Run the printed `testnet:verify --before-key-removal=true` against the saved plan.
   - Owner registers v2 and owner on `wrap.testnet`, wraps **5 testnet NEAR** via `near_deposit`, and deposits exactly **5000000000000000000000000** wNEAR units via `ft_transfer_call` with **`msg: ""`** and 1 yoctoNEAR deposit.
   - Run `npm run lifecycle -- --step=status --spot-tx=DEPOSIT_TX_HASH`. This checks both the successful policy deposit receipt and equality of `get_state.spot_balance` with `wrap.testnet.ft_balance_of` at one finalized block. Before spot is deposited, status may legitimately show zero.
   - At the printed **OWNER UI FUNDING** step, complete the faucet and Send instructions in step 3 below, then run `to-perp --amount=49` and status to confirm at least $49 venue equity and no positions.
   - Review the saved config, recipient, code, derivation and spot evidence. The printed **separate final deployment step** deletes the sole policy key. This is irreversible: no redeployment, deletion or key restoration path remains. Then run the printed keyless verification command. Stop on any failure or extra key.

   The owner needs at least **14 testnet NEAR plus registration/gas**, less any recovered v1 balance. Ensure the existing keeper has gas. Native policy NEAR pays storage/signing; the separate wNEAR deposit backs the short.

3. In the [Hyperliquid testnet faucet UI](https://app.hyperliquid-testnet.xyz/drip), Samet connects his own eligible wallet, unlocks the faucet and claims mock USDC. In the testnet trading UI, use **Send** to send **50 mock USDC** to the derived address above, which lands in its **SPOT USDC** balance. Run `npm run lifecycle -- --step=to-perp --amount=49` to fund perps. Retain the UI transfer hash for the judge. This is an internal HyperCore transfer, separate from NEAR spot custody. The [official faucet documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/testnet-faucet) describes eligibility and a 1,000 mock USDC claim. Do not send to the old owner-derived probe address.

4. Terminal A:

   ```sh
   npm run lifecycle -- --step=status
   npm run lifecycle -- --step=open
   ```

   The open process warms public metadata, derivation, finalized code/keys/config, spot and venue state. It prints **three exact keeper commands**: `heartbeat`, `set_keeper_price`, then `request_order_signature`. In terminal B the keeper runs those commands in order and immediately pastes **only the final transaction hash** into A. It can also be piped as a single line to the running relay's stdin; do not pipe a complete near-cli log. Never pipe the printed commands to a shell automatically.

   The short targets approximately **$12**, rounded up to the venue size step, capped at 5 NEAR, held spot and $20/order. Minimum checked at the actual IOC lower limit is $10. The contract fixes sell/open and buy/reduce-only IOC behavior; there is no arbitrary action or nonce option. The script matches exact ABI arguments, event action/digest, signature, receipt-block code/zero keys/config and local recovered strategy address before submission. It requires at least three seconds of the 60-second expiry remaining. MPC and NEAR finality consume that same window. A stale keeper price causes the contract to reject; rerun for fresh commands after inspecting state.

5. Inspect the actual fill and risk, then close:

   ```sh
   npm run lifecycle -- --step=status
   npm run lifecycle -- --step=close
   ```

   Run the three newly printed keeper commands in B and paste the request hash into A. Close uses the **observed remaining short**, buys reduce-only with IOC, and verifies order ID, side, size, timestamp, fill hashes and position delta via `userFills` and `clearinghouseState`. Partial fills are recorded explicitly; rerun close for a remaining short. No fill is claimed for resting/rejected orders or HTTP 200 alone. IOC remainders do not rest, but still inspect public orders before settlement.

6. Wait until **all opening authorizations have expired** (the state exposes `last_open_expiry`), then:

   ```sh
   npm run lifecycle -- --step=status
   ```

   Once the venue is flat and no orders remain, status prints the exact **owner** `settle_position(short_size=0, observed_at_ms=...)` command. Execute it within 30 seconds of observation; rerun status if stale. This is explicitly an **owner attestation of public state**, not a cryptographic Hyperliquid proof. It releases conservatively reserved signed exposure; closing signatures cannot release it themselves.

   After executing settlement, rerun status. Only once the contract is settled, opening authorizations have expired, the venue is flat and no orders remain, status prints one owner `configure_rebalancing` command needed by the existing WASM withdrawal gate. Execute it once **after the final close**. It fixes the derived strategy address/token, $60 withdrawal/day caps and $1 minimum residual equity; spot-sale caps are 1 yoctoNEAR. Its adapter is an uncreated child under the keyless policy. No sale, route, bridge deposit or adapter transaction is executed in this lifecycle. This configuration ends the trading phase.

   ```sh
   npm run lifecycle -- --step=status --settle-tx=SETTLEMENT_TX_HASH
   npm run lifecycle -- --step=withdraw
   ```

7. Withdraw prints the exact **owner** `set_reference_price`, `observe_margin`, and `request_evm_withdrawal` commands. Run them promptly in B and paste the last hash into A. Observations must be <=30 seconds old at contract execution. The withdrawal is limited to public withdrawable equity **minus the contract-required $1 residual** and the $60 caps. If setup was omitted, the first withdrawal invocation prints it without requesting a signature; execute it and rerun withdraw.

   `withdraw3` binds the fixed owner EVM recipient; it starts a bridge withdrawal, not an internal HyperCore Send. Unlike an order it has no venue `expiresAfter`; the relay still refuses callbacks older than 57 seconds. The existing WASM reserves an unresolved withdrawal and the relay exclusively claims each NEAR tx before submitting. **Never retry an uncertain signature.** Inspect evidence/public APIs instead. The relay polls public APIs only; it does not resubmit.

   ```sh
   npm run lifecycle -- --step=status
   ```

   Withdrawal verification requires successful exchange response **and a matching public withdrawal ledger entry**, plus the post-submission account snapshot. The v2 withdrawal arrived on Arbitrum Sepolia, verified separately on 13 November; a bridge request or debit is not an arrival proof. Venue fees/testnet bridge availability may reject the withdrawal. Keep that response as evidence; never claim success from a rejection. The contract retains $1 equity; the venue's bridge fee reduces the payout separately.

   The relay polls six times without resubmitting. If public indexing is slower (bridge processing can take minutes), keep the exclusive relay claim and recheck later:

   ```sh
   npm run lifecycle -- --step=status --relay-tx=WITHDRAWAL_NEAR_TX_HASH
   ```

   This reads the saved exchange response, revalidates the public NEAR receipt/signature and checks the current public venue ledger. It never posts to `/exchange`. It also supports an opening/closing tx hash before any subsequent trade changes that position. An uncertain transport response is preserved; without an exchange response this recheck cannot claim verified acceptance. Inspect public state rather than requesting another signature.

## Price policy and evidence

At plan time `POST https://api.hyperliquid-testnet.xyz/info` with `{"type":"metaAndAssetCtxs"}` supplies the NEAR mark, asset index and size decimals. The initializer rounds the reference to micro-USD and fixes absolute bounds at **80–120%** of that mark. Initial observed mark on 2026-11-10 was **$3.6348**, reference **3634800**, bounds **2907840–4361760** micro-USD; the actual planner fetches again. Limits: 5 NEAR maximum signed short, $20/order, $40/rolling day, 60s cooldown, 1% price band.

The public oracle account is null. `set_keeper_price` accepts only the keeper's <=60-second-old, nondecreasing observation inside the fixed bounds; opens cannot override it. Reductions use the bounded fallback hint. A mark outside bounds stops the script. No previous-price ratchet is possible. Status uses the shared `stressMetrics` engine for H in USDC, and records live equity, margin, cumulative funding, actual funding payments and current rate separately. The model's maintenance assumptions are explicitly labeled.

Each invocation appends public responses, commands, hashes, outcome and explorer links to `docs/evidence/<UTC-date>-lifecycle-<step>.md`. Repeated invocations retain earlier attempts. `lifecycle-relay-<NEAR-hash>.json` is the exclusive relay claim; its existence prevents another submission even if the previous process crashed. Rejections and uncertain outcomes are evidence, not successful fills. Source API documentation: [info](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint), [exchange and withdrawal](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint).

V2 arrival update (13 November 2026): **arrived on Arbitrum Sepolia** — 46.957074 HL-testnet USDC; [transaction](https://sepolia.arbiscan.io/tx/0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0), [public RPC evidence](evidence/2026-11-13-v2-arrival-arbitrum-sepolia.json). Testnet only.
