# Counterweight

Reduce-only by construction: a self-custody delta-neutral carry account on NEAR.

The user keeps NEAR spot exposure, a matching Hyperliquid perp short hedges it, and the Hyperliquid account's only
signer is a NEAR policy contract (Chain Signatures). The keeper can reduce risk but can never add unbounded risk or
move money; withdrawals go only to the owner's fixed addresses.

Built for NEAR HACKATHON (November 2026). Work in progress; testnet only.

## TypeScript signing proof

```sh
npm ci
npm test
npm run typecheck
npm run build
NEAR_ACCOUNT_ID=YOUR_ACCOUNT.testnet npm run prove:signing -- counterweight-1
```

The preparation script prints the owner-run NEAR keychain command. Submit its returned public MPC signature with
`npm run prove:submit -- '<mpc-response-json>'`. See [the testnet procedure and evidence](docs/TESTNET.md).
The 24 SDK digest vectors and live server-recovery control pass; the actual owner MPC signature proof remains pending.

## Status

- [ ] Signing boundary: NEAR MPC signatures accepted by Hyperliquid
- [ ] Policy contract with sandbox tests
- [ ] Keeper and deterministic risk engine
- [ ] Keyless replay mode (`npm run replay`)
- [ ] Web UI

This is not a fund, an investment product or financial advice. It is open-source software that a person can run
with their own wallet at their own risk.
