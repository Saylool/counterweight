# Signing boundary proof — 2026-11-10 (testnet)

Claim: a NEAR Chain Signatures (MPC) signature, requested by a NEAR account, is authenticated by Hyperliquid as
coming from the EVM address derived for that account and path.

Scope: owner-account probe (`counterweight-samet.testnet`, path `counterweight-1`). This is not yet the policy
contract signing; the contract has a different predecessor and therefore a different derived address. No funds are
involved; the probe cancels a nonexistent order.

1. `NEAR_ACCOUNT_ID=counterweight-samet.testnet npm run prove:signing -- counterweight-1`
   - Derived EVM address: `0xea8b5c6f1e3e1537222d4cbbbed3d6fa5bcc819a`
   - NEAR asset index on Hyperliquid testnet: 54
   - Digest: `0xbbdeb75aea7882abe05ff47309f7e08245781e3cc38d1c49e9e342e7dbeb8925`
   - Local derivation agreed with the MPC contract's derived-key view.
2. Owner ran `near contract call-function as-transaction v1.signer-prod.testnet sign ...` (keychain signing).
   Raw output: [2026-11-10-mpc-sign-output.txt](2026-11-10-mpc-sign-output.txt). MPC response:

```json
{"big_r":{"affine_point":"03e1aa93028ad6b59c6c1c838acd29ab26fb4d65c0ef0aa37c0b57b4ad6d69cd2f"},"recovery_id":0,
 "s":{"scalar":"1803fe3f07beceb286c81c76c897dd56456a393fc128d6ca13f8923b918c6415"},"scheme":"Secp256k1"}
```

3. `npm run prove:submit -- '<mpc-response-json>'` sent a `cancel` action (asset 54, order 0, nonce 1794304933424,
   v=27) to Hyperliquid testnet. Response:

```json
{"status":"err","response":"User or API Wallet 0xea8b5c6f1e3e1537222d4cbbbed3d6fa5bcc819a does not exist."}
```

   Hyperliquid names the address it recovered from the signature. It equals the derived address
   (verdict `server-recovered-address-matches`): the MPC signature was accepted as that address's signature. The
   account "does not exist" only because it has never been funded.

Not established by this proof: funding, fills, or policy-contract enforcement.
