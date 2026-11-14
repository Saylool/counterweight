# Policy v5 — bounded fallback exits

See [contract handoff](v5-contract-handoff.md) for the exact price-debit bound, public pricing view and reproduction command. V5 requires a fresh deployment at `cw5.haxheton.near`; it does not upgrade or change any frozen v1–v4 deployment or evidence. V4's separate concurrent exit slot and permanent 0.01NEAR public MPC subsidy cap are preserved.

Fresh authenticated oracle data takes priority for keeper, public-timeout and owner emergency exits. An unavailable or stale feed leaves a narrow fallback: marks must be inside the owner time-locked corridor and 25bps from a non-ratcheting authenticated/opening anchor. Final IOC buy prices also have a 100bps anchor cap and a direct 1% opening-attested-margin price-debit cap. The fallback is intentionally unable to authorize many legitimate large market moves. It cannot guarantee fills or prevent venue liquidation. The mainnet plan uses a 10bps opening band so an unchanged market remains closeable.

Pyth deployment availability must be independently verified; source support for a Pyth-compatible account does not establish a current maintained NEAR oracle. No new deployment, autonomous uptime, real Intents route or mainnet send is proved by this source change. Every other KNOWN-ISSUES disclosure remains in force, including owner margin/fill/finality attestation and absence of a venue light client.
