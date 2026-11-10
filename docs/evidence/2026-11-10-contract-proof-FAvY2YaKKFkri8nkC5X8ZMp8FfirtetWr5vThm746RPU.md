# Policy-contract signing boundary proof — 2026-11-10T10:37:02.354Z

Testnet only; no funds.

REHEARSAL — policy account still had a full-access key; not the final keyless proof

Transaction: [FAvY2YaKKFkri8nkC5X8ZMp8FfirtetWr5vThm746RPU](https://testnet.nearblocks.io/txns/FAvY2YaKKFkri8nkC5X8ZMp8FfirtetWr5vThm746RPU). Keeper called policy request_cancel_signature(order_id=0). Only successful policy request/signature receipts and final callback true were accepted. Both receipt blocks match expected WASM 698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289; full-access policy keys were present (rehearsal only).

Predecessor: policy.counterweight-samet.testnet; path: counterweight-1; derived address: 0xaa640b1c7b3ac37db14d2705eaeceeb42d91eb0c; locally recovered: 0xaa640b1c7B3ac37DB14D2705eAECeeB42d91eb0C.

Digest: 0x6ecfda44ae71e7509caf002d2d12d214ccb504ce053708b79c8da88429a74d27; expiry: 1794307067731. Formatted public signature: {"r":"0xdec7a7945f05883c3bb654de94056f90cde44a85b2ef68d499657ac6834026e6","s":"0x0751dac4c7d080639a6a4cf423eaa3af960ce0b160cbd5951c62fb79117e7864","v":27}.

Hyperliquid testnet HTTP 200; verdict: **server-recovered-address-matches**.

```json
{
  "status": "err",
  "response": "User or API Wallet 0xaa640b1c7b3ac37db14d2705eaeceeb42d91eb0c does not exist."
}
```

Full public request, receipt events, code/config checks and derivation: [JSON](2026-11-10-contract-proof-FAvY2YaKKFkri8nkC5X8ZMp8FfirtetWr5vThm746RPU.json). This rehearsal is not a final keyless proof. It establishes the signing boundary only if verdict is proven; it does not establish funding, fills, or every policy invariant.
