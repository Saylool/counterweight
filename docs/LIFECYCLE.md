# Supervised testnet lifecycle

All NEAR calls are printed for the lead. Scripts never read a keychain or send
NEAR transactions. Signing steps relay a validated signature to Hyperliquid
TESTNET once, then verify public balances/fills/ledger. Run them only when ready
for that exchange submission. Default policy and evidence paths retain historical
v2 behavior. `--policy=policy-v3.counterweight-samet.testnet` selects the v3 plan,
artifact, derived address, adapter-free margin controls and exit ABI. V3 evidence
uses a separate `-lifecycle-policy-v3-` filename prefix. `--plan` overrides the
saved plan path but must match the selected policy, initializer and artifact.

The already-signed funding request is:

```sh
npm run lifecycle -- --policy=policy-v3.counterweight-samet.testnet --step=to-perp --relay-tx=AEk3mDFkuVnVowPzfXRfPBBkk7ympuSR6cZfXk7eNN5s
```

The amount is read from the validated owner ABI; optional `--amount=49` asserts
it. This path accepts the existing successful callback beyond the normal local
60-second limit, within Hyperliquid's two-day nonce window (with five seconds
transport margin). See the [venue nonce rules](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets).
It checks the exact caller, account, method, amount, digest, recovered signer,
receipt-block code/config/keys, flat venue and available spot. A local exclusive
claim blocks any repeated or uncertain submission. Public non-funding ledger
history since signing must have no class transfers and must not be truncated;
any class transfer is ambiguous because that history does not expose the signed
nonce. This check supplements the lead's assertion that the signature was never
submitted; there is no public proof that a failed external submission never
occurred. Never submit it through another process concurrently.

An expired signature prints a fresh owner command and exits without prompting
or relaying. Start a supervised replacement with:

```sh
npm run lifecycle -- --policy=policy-v3.counterweight-samet.testnet --step=to-perp --amount=49
```

Run its printed owner call and paste the new transaction hash immediately.
A claimed signature instead blocks replacement until its outcome is reconciled.
Recheck a completed relay without submitting it again:

```sh
npm run lifecycle -- --policy=policy-v3.counterweight-samet.testnet --step=status --relay-tx=AEk3mDFkuVnVowPzfXRfPBBkk7ympuSR6cZfXk7eNN5s
npm run testnet:verify -- --policy=policy-v3.counterweight-samet.testnet --before-key-removal=true
```

After successful funding and owner review, the lead freezes the policy using its
already-provisioned **public** key, then verifies zero access keys:

```sh
near account delete-keys policy-v3.counterweight-samet.testnet public-keys "${POLICY_PUBLIC_KEY:?Set the existing policy public key}" network-config testnet sign-with-keychain send
npm run testnet:verify -- --policy=policy-v3.counterweight-samet.testnet
```

Later, after [v2 cleanup](V2-CLEANUP.md), print the 4 wNEAR spot stage:

```sh
npm run lifecycle -- --policy=policy-v3.counterweight-samet.testnet --step=spot --amount=4
```

Any positive NEAR decimal with up to 24 fractional places and within u128 is
accepted. Registration, wrap and deposit commands are printed. Skip
`near_deposit` for recovered wNEAR, which is already wrapped. Execute the
`ft_transfer_call` with empty `msg`, await the callback, then verify the exact
deposit amount/event and current internal/actual token custody:

```sh
npm run lifecycle -- --policy=policy-v3.counterweight-samet.testnet --step=spot --amount=4 --spot-tx=PASTE_DEPOSIT_TX_HASH
```

The same explicit policy applies to `status`, `open`, `close` and `withdraw`.
V3 close is independent of opening bounds, supports paused reductions, carries
an observation timestamp and rounds its fixed 1% exit cap down. V3 flat margin
withdrawals need neither retained spot nor rebalancing configuration; configured
margin limits must match the v3 plan. Owner settlement remains necessary after
closing any reserved short. Venue withdrawal acceptance does not prove bridge
arrival. Start unattended monitoring with [KEEPER-RUN.md](KEEPER-RUN.md).
