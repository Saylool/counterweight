# Day 1: signing boundary (testnet only)

Checked 2026-11-10. `docs/DESIGN.md` Part B governs the production architecture. These owner-probe scripts test compatibility; policy deployment, public verification and the contract-event proof are documented in [TESTNET-DEPLOYMENT](TESTNET-DEPLOYMENT.md). `approveAgent` and `usdSend` codecs are interoperability utilities, not controller permissions.

## What is proved so far

- 24 offline digests match the official Hyperliquid Python SDK 0.24.0, commit `2fdb18f9517675ea03695a0962bd19eece9c83f0`. The oracle intercepts the SDK at `wallet.sign_message`, without instantiating an account or using a key. All 24 vectors also cross-check official SDK `recover_*` results against local recovery using an already-public signature on unrelated digests. These recovered addresses are parity checks, not an owner identity proof. Agent wire payloads go through `Exchange.approve_agent` with entropy and account construction replaced by public-address stubs. See [vectors](../fixtures/hyperliquid-signing-vectors.json) and [generator](../scripts/generate-signing-vectors.py). Orders, trigger orders, both cancellation formats, vaults, expiry, integer encoding boundaries, and all three requested user action types cover both environments.
- Local public-key derivation agrees with recorded testnet `derived_public_key` views for two paths. New RPC calls pin the derived view to the domain-zero root view block; mocked rotation, mismatch and malformed-payload tests cover the cross-check. RPC block references and public outputs are in [derivation evidence](../fixtures/chainsig-public-derivation.json).
- A live Hyperliquid testnet control returned HTTP 200 with `status: "err"`, naming `0xb5be443f995aadd4dd3b44acf78b051d6a1d86ce`, exactly the locally recovered address. The complete request, digest, response, and public signature provenance are in [control evidence](../fixtures/hyperliquid-testnet-public-control.json). The actual base64 receipt result and decoded MPC `SignatureResponse` are recorded in [raw MPC evidence](../fixtures/nearblocks-mpc-response.json), retrieved from the [public NearBlocks receipts API](https://api.nearblocks.io/v3/txns/C1BFVeNKTdGisszpssXMcg3qVnJatdcS4zh6Hxt3jxqY/receipts). This recycled an already-public signature on an unrelated digest; it does **not** establish our owner's MPC signing boundary or any funded execution.
- **PROVED:** the owner-predecessor MPC signature was authenticated by Hyperliquid testnet; see [2026-11-10 evidence](evidence/2026-11-10-signing-proof.md). **UNVERIFIED:** the policy-contract predecessor signing boundary; the owner must run the [deployment and contract-proof commands](TESTNET-DEPLOYMENT.md).
- **Omitted:** expected signatures generated using the SDK's public test key. The request also prohibits handling any private key. Digest vectors respect that prohibition; no SDK test-key material was fetched or used.

## Owner procedure

From the repository root, with the owner's existing testnet account already available to near-cli-rs through its OS keychain:

```sh
npm ci
npm test
npm run typecheck
npm run build
NEAR_ACCOUNT_ID=YOUR_ACCOUNT.testnet npm run prove:signing -- counterweight-1
```

The last command performs public RPC reads, resolves NEAR's current active asset index (rejecting delisted, missing or ambiguous markets), prints the derived address and a fresh digest, and saves a public plan to `.tmp/signing-proof-plan.json`. It prints this exact command shape with real values filled in:

```sh
near contract call-function as-transaction v1.signer-prod.testnet sign json-args '{"request":{"payload_v2":{"Ecdsa":"DIGEST_WITHOUT_0x"},"path":"counterweight-1","domain_id":0}}' prepaid-gas '300 Tgas' attached-deposit '1 yoctoNEAR' sign-as 'YOUR_ACCOUNT.testnet' network-config testnet sign-with-keychain send
```

**The owner runs the printed command.** The scripts never spawn `near` or access its keychain. The call consumes testnet NEAR for gas and attaches one yoctoNEAR, matching the current official client. Copy only the returned signature object, not the entire terminal transcript. Both nested `big_r.affine_point` / `s.scalar` and flat `big_r` / `s` are supported, with an optional `scheme: "Secp256k1"` tag.

```sh
npm run prove:submit -- '<mpc-response-json>'
# Alternatively, manually save only that public signature JSON, then:
npm run prove:submit -- @.tmp/mpc-response.json
```

The submitter rechecks the saved digest and current MPC-derived address, recovers the signature locally, and refuses a mismatch before contacting Hyperliquid. It only permits testnet cancellation of order ID 0 without a vault or expiresAfter. That probe cannot create an order, transfer funds, or cancel another real order. The CLI rejects plans older than 30 minutes as a local precaution; this is not the venue's nonce-window specification. It rejects nonces more than 60 seconds ahead of local wall time. A plan is atomically consumed before relay submission and cannot be reused, including after transport failures or an unproven response. Only the literal `@.tmp/mpc-response.json` file argument is accepted; JSON errors never echo input snippets. Prepare and sign a new plan if needed. Do not prepare another plan between signing and submitting the current one.

The current MPC contract is **`v1.signer-prod.testnet`**, not `v1.signer-prd.testnet`. The documented predecessor is the account directly calling the signer; using the owner account here derives a different address from the eventual controller account. [NEAR implementation](https://docs.near.org/chain-abstraction/chain-signatures/implementation), [current client request and deposit](https://github.com/NearDeFi/chainsig.js/blob/main/src/contracts/ChainSignatureContract.ts), [current Rust request schema](https://github.com/near/mpc/blob/main/crates/near-mpc-crypto-types/src/sign.rs).

## Reading the result

The submitter saves plan, request, response, timestamp, recovered address and verdict in `.tmp/signing-proof-result.json`. Preserve that file and the NEAR transaction/explorer link for review. Public signature JSON alone does not independently prove which NEAR transaction produced it.

For an unfunded derived address, a response naming **that exact address** in `User or API Wallet … does not exist.` or `Must deposit before performing actions. User: …` establishes the venue's recovered signer. A different address is a failure. HTTP 200 alone, a generic error, or local recovery alone proves nothing about server recovery. Hyperliquid explicitly documents these recovered-address errors and warns that bad payloads recover unrelated addresses. [Official signing guidance](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing).

For an activated account, a `status: "ok"` cancellation response with the exact known nonexistent-order error counts as authenticated processing only when local recovery has also matched the expected address. The standalone response classifier requires that authenticated signer context; generic per-action errors and success for order ID zero remain unproven. This is an inference from the authenticated exchange API, not a fill claim. Any unrecognized response is `unproven` with a nonzero CLI exit code. [Cancellation API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#cancel-order-s).

The error-address interpretation was observed directly in the recorded control. The actual owner MPC result remains pending; funding, successful order placement, fills, controller policy and immutable custody remain separate proofs.

## Signing details

The L1 action hash is `keccak256(msgpack(action) || uint64_be(nonce) || vaultFlagAndAddress || optionalExpiry)`. No vault is `00`; a vault is `01 || address20`; expiry adds `00 || uint64_be(expiresAfter)`. MessagePack insertion order matters. The codec rebuilds canonical SDK field order recursively for both hashing and submission, omitting undefined optional keys. Prices and quantities must be normalized decimal strings with at most eight fractional places and no trailing fractional zeros; sizes and transfer amounts must be positive. Addresses, cloids and signature r/s must use lowercase hex. The codec never rounds a JS float. An unnamed approveAgent hashes `agentName: ""` but omits that field from the posted wire action.

The L1 EIP-712 domain is `Exchange`, version `1`, chain ID **1337 on both networks**, zero verifying contract. `Agent` has `source: "a"` for mainnet or `"b"` for testnet and the action hash as `connectionId`. The user action domain is `HyperliquidSignTransaction`, version `1`, chain ID **421614 (`0x66eee`) on both networks**, matching the official SDK default. `hyperliquidChain` is `Mainnet` or `Testnet`; the primary types are `HyperliquidTransaction:ApproveAgent`, `HyperliquidTransaction:Withdraw`, and `HyperliquidTransaction:UsdSend`. The user signature chain ID is a wallet signing domain, not the HyperEVM network ID. User actions have no expiry or vault field. [Pinned official implementation](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/2fdb18f9517675ea03695a0962bd19eece9c83f0/hyperliquid/utils/signing.py).

NEAR derivation uses **NIST SHA3-256**, not Ethereum Keccak: hash `near-mpc-recovery v0.1.0 epsilon derivation:` + predecessor + `,` + path, then add `tweak × G` to the root public point. The EVM address is the last 20 bytes of Keccak over the derived uncompressed public key without the `04` prefix. Fetch the root through a public view, never from a local wallet. MPC `r` is the x-coordinate of `big_r`; `v` is `recovery_id + 27`. High-s normalization negates s and flips recovery parity. The response recovery ID is authoritative; it need not equal the original compressed point's parity after signer normalization. [Contract KDF](https://github.com/near/mpc/blob/main/crates/near-mpc-crypto-types/src/kdf.rs), [point derivation](https://github.com/near/mpc/blob/main/crates/contract/src/crypto_shared/kdf.rs), [documented client conversion](https://github.com/NearDeFi/chainsig.js/blob/main/src/utils/cryptography.ts).

The human-readable address examples on the NEAR docs page are illustrative and do not specify a root key or environment. Tests use recorded testnet RPC views rather than assuming those example addresses apply to the current root.

## Faucet and alternative testnet funding

**Yes.** The official faucet requires a previous Hyperliquid mainnet deposit by the **same address**, then offers 1,000 mock USDC. A mainnet deposit by an unrelated owner EOA does not meet that condition for an MPC-derived address. Do not deposit mainnet funds to satisfy this requirement for this project. [Official faucet requirements](https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/testnet-faucet).

**Never fund the owner-EOA probe address.** Direct owner signing bypasses controller policy. Fund only the strategy address derived from the audited policy contract predecessor after custody checks.

For that eventual contract-controlled address, an alternative is a transfer of mock USDC from an already-funded **testnet** HyperCore account to the contract-derived EVM address, using `usdSend` (Core USDC transfer) with `hyperliquidChain: "Testnet"` and the testnet exchange endpoint. The sender authorizes it; the receiver needs no EVM transaction or NEAR signature just to receive. This is inferred from the documented address-to-address transfer API and its explicit testnet environment selector; a donor transfer to our address has **not** been executed. It does not use the EVM bridge. [Core USDC transfer API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#core-usdc-transfer).

Allow for activation: official docs specify a 1 quote-token fee when a new HyperCore address is first a transfer destination. Arrange more than that amount, then inspect `clearinghouseState` for the derived address on the testnet `/info` API before trading. The precise testnet transfer fee and activation behavior remain unverified by a live donor transfer. [Activation fee](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/activation-gas-fee), [perpetual account-state API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals).

No USDC is needed for the cancellation signing proof. NEAR testnet gas is still needed for the owner's MPC request. Mainnet Intents/1Click is outside this proof and must stay in dry-quote mode under the current design.

## Reproduction and limitations

```sh
python3 -m venv .tmp/sdk-venv
.tmp/sdk-venv/bin/pip install -r scripts/requirements-signing-vectors.txt
npm run vectors:generate
npm test
npm run typecheck
npm run build
# Optional network evidence refresh: public views + harmless testnet control only
node --import tsx scripts/capture-public-evidence.ts
```

The generator pins the SDK version, source commit and `signing.py` SHA-256; dependencies are frozen in the requirements file. Test fixtures are offline; the evidence capture explicitly makes network requests. `.tmp/`, dependency installs and compiled output are ignored. npm's cache can be redirected with `--cache .tmp/npm-cache` if the global cache is not writable.

The low-level library encodes both network domains for golden-vector parity; network submission is hardcoded to testnet. Integer JSON inputs are limited to JavaScript safe integers. This is a wire codec, not a risk-policy implementation. MPC latency/deposit sufficiency on the owner's eventual transaction, a live testnet donor transfer, and end-to-end owner MPC authentication remain open until those actions are performed.
