# @counterweight/hyperliquid

Pure signing codecs and a restricted testnet proof relay; no key handling or signing implementation.

- `getSigningDigest(input)` returns the 32-byte EIP-712 digest as `0x` hex. `digestToSign(input)` returns its 32 raw bytes.
- `actionHash(action, nonce, vaultAddress?, expiresAfter?)` returns the L1 MessagePack connection ID.
- `assembleRequest(input, { r, s, v })` builds the exchange body. `v` is 27/28; `r`/`s` are fixed-width hex; s must be low.
- `deriveEvmAddress(rootPublicKey, predecessor, path)` performs public derivation. `deriveTestnetAddress` fetches the current root for domain zero and cross-checks the derived contract view at that same block hash.
- `mpcToHyperliquidSignature(response)` accepts nested or flat MPC responses and normalizes s.
- `submitTestnetProof` refuses mainnet, vaults, expiry and actions other than cancellation of order ID zero; nonces must be within the local 30-minute age / 60-second future limits.

L1 actions are already-serialized wire orders, trigger orders, cancellations cloid cancellations and `noop` nonce invalidations. The codec rebuilds canonical SDK field order recursively and omits undefined optional keys for both hashing and submission. Supply normalized decimal strings with at most eight fractional places and no trailing fractional zeros; sizes and transfer amounts must be positive. Addresses, cloids and signature scalars must be lowercase hex. User actions are `approveAgent`, `withdraw3`, and `usdSend`; network fields and the SDK's signature chain ID are supplied by the codec. This package grants no controller permissions.

See [testnet procedure and evidence](../../docs/TESTNET.md).

Public NEAR testnet reads use `NEAR_TESTNET_RPC` (default `https://rpc.testnet.near.org`).
Public RPCs can rate-limit; e.g. `NEAR_TESTNET_RPC=https://test.rpc.fastnear.com npm run testnet:verify`
from the repository root. This setting is shared by derivation and release CLI RPC checks.
