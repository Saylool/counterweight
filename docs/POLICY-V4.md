# Policy v4 — mainnet and two bounded repairs

V4 is separately built at `contracts/policy/artifacts/counterweight_policy_v4.wasm`,
pinned by `contracts/policy/artifacts/SHA256SUMS.v4`: **344,776 bytes**, SHA-256
`278057b511924ee1e5769ebc46ac0aff5a17d036c41ce25b06c42c871bffbc91`. It is **deployed keyless on mainnet** at `cw4.haxheton.near` (owner `haxheton.near`, keeper `keeper4.haxheton.near`, signer `v1.signer`). The 14 November owner-supervised run completed one 3.6 NEAR open/close and a fixed-recipient payout of 17.886709 native USDC on Arbitrum One, followed by reconciliation and spot return. See the [proof and verification limits](evidence/2026-11-14-v4-mainnet-lifecycle-summary.md) and [executed MAINNET run](MAINNET.md#executed-run). No audit or autonomous mainnet keeper is claimed.
V1/v2/v3 artifacts/manifests and the running testnet keeper's state stay unchanged.
Deleting all keys from an old deployment prevents replacing its code; v4 used a
fresh mainnet account and derived address `0xb6a1d45ba9154067b7981e2b4b676393c75b0d26`.

Mainnet initialization accepts non-testnet policy accounts and pins signer
`v1.signer` plus token `wrap.near`. Testnet initializer guards/errors and signing
bytes remain compatible. L1 source is `a` on mainnet, `b` on testnet. The official
SDK uses the same user-signing chain ID `0x66eee` / `421614` on both; the signed
`hyperliquidChain` field selects the venue environment. The previous claim that
421614 itself made mainnet user actions unsupported was incorrect. See the
[official SDK](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/2fdb18f9517675ea03695a0962bd19eece9c83f0/hyperliquid/utils/signing.py).
Golden tests bind mainnet orders, withdrawals and both class-transfer directions
and reject mismatched action environments/domains.

V4 serializes the independent concurrent exit slot: a second owner, keeper or
public exit cannot overwrite an outstanding one, and all normal idle gates include
that slot after the spot callback finishes. Expired exits use the same uncertain
operation bookkeeping as other signing slots. Reservations survive; token callbacks
remain independent. Tests exercise each authority, post-token open/cancel/withdraw
blocking, late signatures, expiry and exactly-once token restoration.

Public zero-deposit `deleverage` requests consume a permanent 0.01 NEAR maximum
**lifetime MPC-fee subsidy** in `v4:public_subsidy_spent`, exposed by
`get_public_subsidy_spent`. Failures and flat-position requests consume the budget;
it never resets with signing windows or config changes. Once exhausted, public
recovery must attach the entire configured MPC fee. Owner/keeper reserve-funded
recovery has independent authority/rate capacity. This fixes unbounded public
reserve deposits; it does not eliminate all flat calls, cap privileged callers,
ensure fill, or authenticate caller marks.

The mainnet lifecycle is explicitly gated by `--network=mainnet
--i-understand-real-funds`; default behavior remains testnet. It reads live venue
metadata, derives/cross-checks the strategy address from mainnet signer public data,
prints near-cli-rs calls and verifies signed receipts before printing owner-executed
exchange submissions. Its generated plan allows at most 15 USD opening notional
and 20 USDC planned margin. Commands require a saved plan, fresh reads, matching
code/config/keys and a zero-key strategy before trading. This is a supervised
single-lifecycle path, not an autonomous mainnet keeper deployment.

All other [KNOWN-ISSUES](KNOWN-ISSUES.md) remain disclosed. In particular there is
no on-chain venue verifier; keeper marks and owner margin/position/finality
observations are trusted. A compromised keeper can close adversely while paused.
Config changes other than opening bounds are immediate; pause can detach owner
callbacks; re-entry mode stays sticky; the listed fee/usage/reconciliation limits
remain. Signer/RPC/venue availability, precision, minimum order, fees, bridge
availability and liquidity can prevent completion. User-signed actions have no
venue expiry; local timeouts are not revocations.
