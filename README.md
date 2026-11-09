# Counterweight

Reduce-only by construction: a self-custody delta-neutral carry account on NEAR.

The user keeps NEAR spot exposure, a matching Hyperliquid perp short hedges it, and the Hyperliquid account's only
signer is a NEAR policy contract (Chain Signatures). The keeper can reduce risk but can never add unbounded risk or
move money; withdrawals go only to the owner's fixed addresses.

Built for NEAR HACKATHON (November 2026). Work in progress; testnet only.

## Status

- [ ] Signing boundary: NEAR MPC signatures accepted by Hyperliquid
- [ ] Policy contract with sandbox tests
- [ ] Keeper and deterministic risk engine
- [ ] Keyless replay mode (`npm run replay`)
- [ ] Web UI

This is not a fund, an investment product or financial advice. It is open-source software that a person can run
with their own wallet at their own risk.
