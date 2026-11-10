# Known issues

## Delegated function-call key cannot pay MPC fee

The default policy requires `mpc_fee > 0` (`set_signing_resources`) and requires
that fee as attached deposit on delegated signing. NEAR function-call access keys
cannot attach a positive deposit. Consequently the design's function-call-only
keeper cannot invoke this interface directly. A prepaid contract gas/fee budget
or another audited funding interface is needed before claiming that operational
configuration. Contract logic is unchanged in this task.

The local demo uses a disposable near-workspaces-managed keeper full-access key
on **its own local account**, while the policy account has **zero access keys**.
No real wallet credentials are used. Policy caller checks, payload construction,
caps, expiry, private callbacks and public recovery execute in the sandbox.

## Demo attack semantics and owner boundary

Part B permits bounded non-reduce opens, so rejecting every non-reduce order
would contradict the policy. The demo rejects a forged price-bearing non-reduce
replacement for a close with `ERR_OPEN_PRICE_OVERRIDE`, and separately exceeds
the hedge cap. Signing nonces are allocated internally; there is no raw-payload
or caller-nonce signing method. The replay attack calls the private callback for
an already completed operation/nonce and is rejected by the contract wrapper.
This does not claim Hyperliquid rejects reuse of a mock signature.

Autonomous recovery signs a reduce-only perp close. It does not sell the spot or
prove a venue fill. Owner-approved spot disposal and owner-attested fill/receipt
reconciliation remain necessary for a completed rebalance. Demo fills are
explicitly simulated outside the contract; signed exposure remains reserved.
