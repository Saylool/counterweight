# Counterweight local demo

Status: **passed**. Real recorded market data; local policy execution; mock MPC, token and venue fills.

Run: `npm ci && npm run demo:local`. No runtime network beyond loopback. See [demo boundary](../packages/local-sandbox/README.md) and [known issues](../docs/KNOWN-ISSUES.md).

```text
COUNTERWEIGHT | LOCAL SANDBOX | MOCK MPC / MOCK FILLS | no wallet or testnet account
OFFLINE GUARD active | Node connections restricted to loopback
FIXTURES SHA-256 verified | worst 24h +32.499065% / 4297 windows
WINDOW 2026-09-17T05:00:00.000Z -> 2026-09-18T05:00:00.000Z
POLICY SHA-256 1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a verified before deploy
MOCK MPC SHA-256 69ba632f36ccaa2d00f73466d617da0a0d1d267a0484624e61abf302201b591f verified before deploy
SETUP local accounts + mock spot 9.3 NEAR | policy access keys: 0
BOUNDARY policy operating reserve pays MPC fee; keeper attaches zero; spot disposal awaits owner approval
SETUP keeper bounded short SIGNED (mock); pre-existing hedge / simulated margin $30.00
OWNER FROZEN nonce=7000002 balance=99999347412735944600000000 yocto
HOUR (UTC)        NEAR       H USD     KEEPER ACTION          CONTRACT RESULT
09-17 06:00 UTC  $2.6597     5.018   monitor                no transaction
09-17 07:00 UTC  $2.6987     4.289   monitor                no transaction
09-17 08:00 UTC  $2.7248     3.802   monitor                no transaction
09-17 09:00 UTC  $2.7520     3.293   monitor                no transaction
09-17 10:00 UTC  $2.8062     2.281   reduce-only close      SIGNED mock + event
09-17 11:00 UTC  $2.8098    28.614   spot approval pending  no transaction
09-17 12:00 UTC  $2.8739    28.614   spot approval pending  no transaction
09-17 13:00 UTC  $2.8713    28.614   spot approval pending  no transaction
09-17 14:00 UTC  $2.8750    28.614   spot approval pending  no transaction
09-17 15:00 UTC  $2.8173    28.614   spot approval pending  no transaction
09-17 16:00 UTC  $2.8816    28.614   spot approval pending  no transaction
09-17 17:00 UTC  $2.9751    28.614   spot approval pending  no transaction
09-17 18:00 UTC  $3.0480    28.614   spot approval pending  no transaction
09-17 19:00 UTC  $2.9900    28.614   spot approval pending  no transaction
09-17 20:00 UTC  $3.0520    28.614   spot approval pending  no transaction
09-17 21:00 UTC  $3.0128    28.614   spot approval pending  no transaction
09-17 22:00 UTC  $3.0243    28.614   spot approval pending  no transaction
09-17 23:00 UTC  $3.1435    28.614   spot approval pending  no transaction
09-18 00:00 UTC  $3.1476    28.614   spot approval pending  no transaction
09-18 01:00 UTC  $3.1596    28.614   spot approval pending  no transaction
09-18 02:00 UTC  $3.2299    28.614   spot approval pending  no transaction
09-18 03:00 UTC  $3.3684    28.614   spot approval pending  no transaction
09-18 04:00 UTC  $3.5048    28.614   spot approval pending  no transaction
09-18 05:00 UTC  $3.5417    28.614   spot approval pending  no transaction
PASS owner nonce + balance unchanged; keeper reduce-only close signed; spot sale still owner-approved
ROGUE increase beyond caps    REJECT ERR_EXCEEDS_SPOT_HEDGE
ROGUE non-reduce close        REJECT ERR_OPEN_PRICE_OVERRIDE
ROGUE withdraw to rogue       REJECT ERR_CALLER_NOT_OWNER
ROGUE approveAgent            REJECT MethodNotFound
ROGUE replayed nonce/callback REJECT Method on_signature is private
WAIT sandbox fast-forward 1/20 | 101s to deadline
WAIT sandbox deadline reached
ROGUE stale price             REJECT ERR_STALE_PRICE
ROGUE unrelated rogue account REJECT ERR_CALLER_NOT_KEEPER
DEAD-MAN before timeout REJECT ERR_HEARTBEAT_ACTIVE
WAIT sandbox fast-forward 1/20 | 600s to deadline
WAIT sandbox deadline reached
DEAD-MAN +601s bystander.testnet -> reduce-only SIGNED mock + event; policy paused
OWNER AFTER nonce=7000002 balance=99999347412735944600000000 yocto (unchanged)
PASS 7/7 rogue attempts rejected | owner untouched | close + dead-man signed
OWNER RESUMED | autonomous owner-free phase ended; mock rebalance completion begins
WAIT sandbox fast-forward 1/20 | 60s to deadline
WAIT sandbox deadline reached
REBALANCE owner settle_position | mock close fill attested; reserved short released
REBALANCE owner approve_spot_sale | mock route dispatched; awaiting finalized receipt; no margin credit yet
REBALANCE rebalance complete | owner reconciled mock receipt; sold 9.3 NEAR; margin credited 32558432 micro-USDC
SANDBOX stopped; disposable local accounts removed
REPORTS reports/demo-local.md + reports/demo-local.json (timeline, logs, receipts, assertions)
```

All emitted application lines are above. Full policy logs, receipt hashes, failures, snapshots and raw SDK diagnostics are retained below and in the JSON report.

```json
{
  "schemaVersion": 1,
  "status": "passed",
  "startedAt": "2026-11-10T17:19:39.497Z",
  "offlineGuardActive": true,
  "policySha256": "1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a",
  "mockSha256": "69ba632f36ccaa2d00f73466d617da0a0d1d267a0484624e61abf302201b591f",
  "transcript": [
    "COUNTERWEIGHT | LOCAL SANDBOX | MOCK MPC / MOCK FILLS | no wallet or testnet account",
    "OFFLINE GUARD active | Node connections restricted to loopback",
    "FIXTURES SHA-256 verified | worst 24h +32.499065% / 4297 windows",
    "WINDOW 2026-09-17T05:00:00.000Z -> 2026-09-18T05:00:00.000Z",
    "POLICY SHA-256 1bb1cc572586154d39d0931ebdc097b06b5a91bf54bb97be1a8d8238deb08a7a verified before deploy",
    "MOCK MPC SHA-256 69ba632f36ccaa2d00f73466d617da0a0d1d267a0484624e61abf302201b591f verified before deploy",
    "SETUP local accounts + mock spot 9.3 NEAR | policy access keys: 0",
    "BOUNDARY policy operating reserve pays MPC fee; keeper attaches zero; spot disposal awaits owner approval",
    "SETUP keeper bounded short SIGNED (mock); pre-existing hedge / simulated margin $30.00",
    "OWNER FROZEN nonce=7000002 balance=99999347412735944600000000 yocto",
    "HOUR (UTC)        NEAR       H USD     KEEPER ACTION          CONTRACT RESULT",
    "09-17 06:00 UTC  $2.6597     5.018   monitor                no transaction",
    "09-17 07:00 UTC  $2.6987     4.289   monitor                no transaction",
    "09-17 08:00 UTC  $2.7248     3.802   monitor                no transaction",
    "09-17 09:00 UTC  $2.7520     3.293   monitor                no transaction",
    "09-17 10:00 UTC  $2.8062     2.281   reduce-only close      SIGNED mock + event",
    "09-17 11:00 UTC  $2.8098    28.614   spot approval pending  no transaction",
    "09-17 12:00 UTC  $2.8739    28.614   spot approval pending  no transaction",
    "09-17 13:00 UTC  $2.8713    28.614   spot approval pending  no transaction",
    "09-17 14:00 UTC  $2.8750    28.614   spot approval pending  no transaction",
    "09-17 15:00 UTC  $2.8173    28.614   spot approval pending  no transaction",
    "09-17 16:00 UTC  $2.8816    28.614   spot approval pending  no transaction",
    "09-17 17:00 UTC  $2.9751    28.614   spot approval pending  no transaction",
    "09-17 18:00 UTC  $3.0480    28.614   spot approval pending  no transaction",
    "09-17 19:00 UTC  $2.9900    28.614   spot approval pending  no transaction",
    "09-17 20:00 UTC  $3.0520    28.614   spot approval pending  no transaction",
    "09-17 21:00 UTC  $3.0128    28.614   spot approval pending  no transaction",
    "09-17 22:00 UTC  $3.0243    28.614   spot approval pending  no transaction",
    "09-17 23:00 UTC  $3.1435    28.614   spot approval pending  no transaction",
    "09-18 00:00 UTC  $3.1476    28.614   spot approval pending  no transaction",
    "09-18 01:00 UTC  $3.1596    28.614   spot approval pending  no transaction",
    "09-18 02:00 UTC  $3.2299    28.614   spot approval pending  no transaction",
    "09-18 03:00 UTC  $3.3684    28.614   spot approval pending  no transaction",
    "09-18 04:00 UTC  $3.5048    28.614   spot approval pending  no transaction",
    "09-18 05:00 UTC  $3.5417    28.614   spot approval pending  no transaction",
    "PASS owner nonce + balance unchanged; keeper reduce-only close signed; spot sale still owner-approved",
    "ROGUE increase beyond caps    REJECT ERR_EXCEEDS_SPOT_HEDGE",
    "ROGUE non-reduce close        REJECT ERR_OPEN_PRICE_OVERRIDE",
    "ROGUE withdraw to rogue       REJECT ERR_CALLER_NOT_OWNER",
    "ROGUE approveAgent            REJECT MethodNotFound",
    "ROGUE replayed nonce/callback REJECT Method on_signature is private",
    "WAIT sandbox fast-forward 1/20 | 101s to deadline",
    "WAIT sandbox deadline reached",
    "ROGUE stale price             REJECT ERR_STALE_PRICE",
    "ROGUE unrelated rogue account REJECT ERR_CALLER_NOT_KEEPER",
    "DEAD-MAN before timeout REJECT ERR_HEARTBEAT_ACTIVE",
    "WAIT sandbox fast-forward 1/20 | 600s to deadline",
    "WAIT sandbox deadline reached",
    "DEAD-MAN +601s bystander.testnet -> reduce-only SIGNED mock + event; policy paused",
    "OWNER AFTER nonce=7000002 balance=99999347412735944600000000 yocto (unchanged)",
    "PASS 7/7 rogue attempts rejected | owner untouched | close + dead-man signed",
    "OWNER RESUMED | autonomous owner-free phase ended; mock rebalance completion begins",
    "WAIT sandbox fast-forward 1/20 | 60s to deadline",
    "WAIT sandbox deadline reached",
    "REBALANCE owner settle_position | mock close fill attested; reserved short released",
    "REBALANCE owner approve_spot_sale | mock route dispatched; awaiting finalized receipt; no margin credit yet",
    "REBALANCE rebalance complete | owner reconciled mock receipt; sold 9.3 NEAR; margin credited 32558432 micro-USDC",
    "SANDBOX stopped; disposable local accounts removed",
    "REPORTS reports/demo-local.md + reports/demo-local.json (timeline, logs, receipts, assertions)"
  ],
  "diagnostics": [
    "Receipt: FfYVtcvUL8XiJbH2ZSkL2YgETm96TUXrF6MmjQZ9tEn2",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"init\",\"data\":[{\"owner\":\"owner.testnet\",\"keeper\":\"keeper.testnet\",\"asset_index\":74,\"size_decimals\":1,\"evm_recipient\":\"0x1111111111111111111111111111111111111111\",\"signer_account\":\"mock-mpc.testnet\",\"wnear_account\":\"mock-mpc.testnet\",\"limits\":{\"max_short_size\":\"9300000000000000000000000\",\"per_order_notional_cap\":\"30000000\",\"per_day_notional_cap\":\"30000000\",\"cooldown_seconds\":60,\"price_band_bps\":100,\"price_max_age_seconds\":120},\"heartbeat_timeout_seconds\":600,\"signing_limits\":{\"keeper_per_block\":2,\"keeper_per_window\":8,\"keeper_outstanding\":8,\"owner_per_window\":16,\"window_ms\":60000,\"max_nonce_ahead_ms\":1000}}]}",
    "Receipt: 5fhMwqkLGjgfHZzzy8caTkituizzCwwyrTtVXdLPYuuf",
    "\tLog [mock-mpc.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"deposit\",\"data\":[{\"amount\":\"9300000000000000000000000\",\"sender_id\":\"owner.testnet\"}]}",
    "Receipts: 4okFdHP4RZ1Aib92LqJqJ9ypsaXjHs5mCqkoZbHyvYN1, 68Vk2LXaAVzWUYwF9LbC7CQ6eUoxgwjptdjVp5pf7ZdG, 96ENKr5Y2Mz4MgaiSXvKF6k8bVsCDvsG7pwbK8WCWGJU",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"1\",\"caller\":\"keeper.testnet\",\"kind\":\"Increase\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":false,\"p\":\"2.6462\",\"s\":\"9.3\",\"r\":false,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794331203305,\"expiresAfter\":1794331263305},\"digest\":\"aca197707eaf41c945aaf989004d4966a8c3c0e8d2504858359b39e12891deb9\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
    "Receipt: 3v2zEZdgKM9mcmqJdAXdKdb992bpWEPdDqCjvRXm63Np",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"1\",\"nonce\":\"1794331203305\",\"expiresAfter\":\"1794331263305\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}",
    "Receipt: HxjYRb8ZQXhuSJhf9MoZDLDerY6gvWDZSiEcGztuRcYH",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794331206\"}]}",
    "Receipts: 2evXPHzVyU5Le7gecFUEZzEttFJM3RfsnHx9TtY6qMk7, 6hvDdeANomv8yCth7TLEZqmWRDAZ272zj2afLQP8eacp, CYJEZVMguhJVQ6EPDZvUNcDYu7aX7oJsBdPha5t4BTaH",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"2\",\"caller\":\"keeper.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"2.8343\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794331208147,\"expiresAfter\":1794331268147},\"digest\":\"774889d5c5e0c932783ddc587b19a26126288f0fb1515bfbc33224bd0b65df00\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
    "Receipt: 5m8f8EzLZ5GJMfmXH1S36UWwNpdqS7hP694bUuXKmomx",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"2\",\"nonce\":\"1794331208147\",\"expiresAfter\":\"1794331268147\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}",
    "Receipt: DY2SXcRKa1fQPR3DCqXAW8qbow4ippBUSxnSXyJPFhs9",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_EXCEEDS_SPOT_HEDGE\"}}}}",
    "Receipt: 2KpnoAoYFXUtQytm6dEdnL9fbZ3iKcsMYjHYLwc4Lx3M",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_OPEN_PRICE_OVERRIDE\"}}}}",
    "Receipt: UywwZ856nTEJizgJ2ocTR4L1SNfGRjyTikiAm4q5knd",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_CALLER_NOT_OWNER\"}}}}",
    "Receipt: 2GgPuXBZ3sh4MvmDNdYE3r6MzN1Cnm94UKBw25wW2Vec",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"MethodResolveError\":\"MethodNotFound\"}}}}",
    "Receipt: BSJ1JZg1GUHXwb8GFGrCkT78oDgdLz8KBbzAwCixV5Gx",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: Method on_signature is private\"}}}}",
    "Receipt: FkZuJGbquNCw2fJVEb49dCzvsdFB6giYsBzKDjPDubjA",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_STALE_PRICE\"}}}}",
    "Receipt: BWqrSgkruqZwBSdeqjEitqdjX2Dq9u7F4PJWBT1qvwnw",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_CALLER_NOT_KEEPER\"}}}}",
    "Receipt: 7Yj47xjEYHUCqhGUSj2TJvBUme49Xi3YguxQveDwv5SX",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794332519\"}]}",
    "Receipt: A8834bhjbgQo4ANkdxbZ1fKPZK2142S1EFRxihNa7SS6",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_HEARTBEAT_ACTIVE\"}}}}",
    "Receipts: 2ozkoN7t5BdDE9G7m7S7nXfkzfsETisK4ggn3TNZBJ9K, 4u7V4x4UfmsanstD8UHGzNpb8aANRb5pAh5FjUuwaoBz, 77e72svmtoRWyM5wkEXmhC9uHBVvyiDthSSfM4JLQxp3",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"pause\",\"data\":[{\"paused\":true,\"reason\":\"recovery\",\"complete\":true}]}",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"3\",\"caller\":\"bystander.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"3.5772\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794333818858,\"expiresAfter\":1794333878858},\"digest\":\"fc48ceb426986e1f62c7afb46e1e6bc81e3fee1537ec818a7817c0978faee4cc\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
    "Receipt: 4aBfKxqGMBCGc4GVzKJHEShPDb5867Ew6KzWnjs1nZpX",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"3\",\"nonce\":\"1794333818858\",\"expiresAfter\":\"1794333878858\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}",
    "Receipt: 5CH88JU7bT2RTxgNsfcpp8Hiv2b3WzjsQrW4izHKoiH8",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"pause\",\"data\":[{\"paused\":false,\"complete\":true}]}",
    "Receipt: sGTJGAr6JvTm9uLnh3KKc7tdc5JEX5vRH4J7GhJuZYa",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"reference_price\",\"data\":[{\"price\":\"3541700\"}]}",
    "Receipt: 86iqtLAB8nTgmLdpwkK7pLgir7srEiYZhuX1pk7x9rhh",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"rebalance_config\",\"data\":[{\"limits\":{\"adapter\":\"mock-mpc.testnet\",\"strategy_margin_address\":\"0x1111111111111111111111111111111111111111\",\"destination_token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\",\"per_sale_near\":\"9300000000000000000000000\",\"daily_sale_near\":\"9300000000000000000000000\",\"max_fee_usdc\":\"50000\",\"max_impact_bps\":100,\"quote_age_ms\":30000,\"completion_ms\":3600000,\"max_mismatch_near\":\"9300000000000000000000000\",\"per_withdrawal_usdc\":\"10000000\",\"daily_withdrawal_usdc\":\"20000000\",\"min_residual_equity_usdc\":\"1000000\",\"min_headroom_bps\":1000,\"lower_headroom_bps\":3000,\"target_headroom_bps\":6000,\"upper_headroom_bps\":9000,\"fee_reserve_usdc\":\"100000\",\"original_target_usdc\":\"32937810\"},\"source\":\"policy.testnet\",\"source_token\":\"mock-mpc.testnet\",\"destination_chain\":\"hyperliquid\",\"withdrawal_recipient\":\"0x1111111111111111111111111111111111111111\"}]}",
    "Receipt: 9heyqMaiQaGjq1YtW3YgHexWrNYR1Xmz7S6t2KngGzsF",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"margin_observation\",\"data\":[{\"equity_usdc\":\"28714402\",\"withdrawable_usdc\":\"0\",\"observed_at_ms\":\"1794335119973\",\"source\":\"owner_finality_attestation\"}]}",
    "Receipt: 8zapYHhHNe6zivVRnjiYAwnHtQFGzc9vyq8vK5uUh2CT",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"position_settlement\",\"data\":[{\"short_size\":\"0\",\"released\":\"9300000000000000000000000\",\"observed_at_ms\":\"1794335121788\",\"source\":\"owner_attestation\",\"daily_budget_released\":false}]}",
    "Receipt: Aaoeki8yWJxJvNGv1dDk45QFiR5sFavGpzV8NpZgLzsD",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"reference_price\",\"data\":[{\"price\":\"3541700\"}]}",
    "Receipts: DuaqhWshKAfDtYJx5XPecnJZgSthzNyChTYXe4mC87NM, mQe84y9nixeEbk1nrf1nvZH7rjgemmJuc5cMmYWjb1F, 4yyEUdzsso2qmVYs8tCZf84DB3L62GLN5Zgi1NtHWPpz",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"sale_route\",\"data\":[{\"status\":\"dispatching\",\"route\":{\"id\":\"1\",\"quote\":{\"near_amount\":\"9300000000000000000000000\",\"paired_closed_near\":\"9300000000000000000000000\",\"min_usdc\":\"32558432\",\"fee_usdc\":\"50000\",\"impact_bps\":100,\"quoted_at_ms\":\"1794335125425\",\"deadline_ms\":\"1794335155425\"},\"dispatched_near\":\"9300000000000000000000000\",\"phase\":\"Dispatching\",\"completion_deadline_ms\":\"1794338728439\"},\"source\":\"policy.testnet\",\"destination\":\"0x1111111111111111111111111111111111111111\",\"chain\":\"hyperliquid\",\"token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\"}]}",
    "Receipt: EAtnrtrR1MuYbKoWr3BbrJ1mfqj1pcxZzLWTb9BtkXBS",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"sale_dispatch\",\"data\":[{\"route_id\":\"1\",\"used_near\":\"9300000000000000000000000\",\"status\":\"resolved\"}]}",
    "Receipt: GFtbNNCmqFTWEhyn8wsobyaYnrF5VGnsTWfFBPMHxqLB",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"margin_topup\",\"data\":[{\"route_id\":\"1\",\"sold_near\":\"9300000000000000000000000\",\"refunded_near\":\"0\",\"credited_usdc\":\"32558432\",\"recipient\":\"0x1111111111111111111111111111111111111111\",\"chain\":\"hyperliquid\",\"token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\",\"receipt_id\":\"demo-local-mock-finalized-sale-1\",\"finalized_at_ms\":\"1794335128439\",\"source\":\"owner_finality_attestation\"}]}"
  ],
  "mocked": [
    "MPC signature-shaped response (not cryptographic)",
    "wNEAR token + sale route receipt",
    "venue margin, funding settlement and fills",
    "historical executable depth at 5 bps"
  ],
  "boundaries": [
    "H is keeper policy, not a contract oracle",
    "Spot sale requires owner approval; spot remains directional after close",
    "Replay time differs from sandbox block time",
    "Contract signing reservations do not prove fills",
    "Keeper uses a disposable local key with zero attached deposit; policy operating reserve pays MPC; policy has zero access keys",
    "Callback replay is rejected; no Hyperliquid nonce replay/fill claim"
  ],
  "selection": {
    "hours": 24,
    "start": 1789621200000,
    "end": 1789707600000,
    "perpMovePct": 32.49906472128694,
    "spotMovePct": 32.43435592014083,
    "candidates": 4297
  },
  "fixtureManifestSha256": "0bece3400021060f20f8e3b4db3e8cdf9287a8d649e7b03029556f55025719cb",
  "configuration": {
    "quantityNear": 9.3,
    "initialMarginUsd": 30,
    "assetIndex": 74,
    "szDecimals": 1,
    "priceMaxAgeSeconds": 120,
    "heartbeatTimeoutSeconds": 600
  },
  "accounts": {
    "owner": "owner.testnet",
    "keeper": "keeper.testnet",
    "rogue": "rogue.testnet",
    "bystander": "bystander.testnet",
    "policy": "policy.testnet",
    "mockMpc": "mock-mpc.testnet"
  },
  "chain": [
    {
      "actor": "owner.testnet",
      "method": "new",
      "args": {
        "owner": "owner.testnet",
        "keeper": "keeper.testnet",
        "asset_index": 74,
        "size_decimals": 1,
        "derivation_path": "counterweight-local-mock-only",
        "evm_recipient": "0x1111111111111111111111111111111111111111",
        "signer_account": "mock-mpc.testnet",
        "wnear_account": "mock-mpc.testnet",
        "limits": {
          "max_short_size": "9300000000000000000000000",
          "per_order_notional_cap": "30000000",
          "per_day_notional_cap": "30000000",
          "cooldown_seconds": 60,
          "price_band_bps": 100,
          "price_max_age_seconds": 120
        },
        "network": "Testnet",
        "heartbeat_timeout_seconds": 600,
        "reference_price": "2673000",
        "signing_limits": null,
        "oracle": {
          "account_id": null,
          "feed_id": "c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750",
          "max_age_seconds": 120,
          "max_confidence_bps": 100,
          "min_price": "1336500",
          "max_price": "5346000"
        }
      },
      "transactionHash": "EsgSVHYbzw5W3MtzqdaLYS2X49aDDtG53SnYqjWDYVmr",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"init\",\"data\":[{\"owner\":\"owner.testnet\",\"keeper\":\"keeper.testnet\",\"asset_index\":74,\"size_decimals\":1,\"evm_recipient\":\"0x1111111111111111111111111111111111111111\",\"signer_account\":\"mock-mpc.testnet\",\"wnear_account\":\"mock-mpc.testnet\",\"limits\":{\"max_short_size\":\"9300000000000000000000000\",\"per_order_notional_cap\":\"30000000\",\"per_day_notional_cap\":\"30000000\",\"cooldown_seconds\":60,\"price_band_bps\":100,\"price_max_age_seconds\":120},\"heartbeat_timeout_seconds\":600,\"signing_limits\":{\"keeper_per_block\":2,\"keeper_per_window\":8,\"keeper_outstanding\":8,\"owner_per_window\":16,\"window_ms\":60000,\"max_nonce_ahead_ms\":1000}}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "mock:deposit_to",
      "args": {
        "amount": "9300000000000000000000000"
      },
      "transactionHash": "FZTJJimR4Y7sCXDe1si57S5PBWXsk947NjfM8VS6Dww4",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"deposit\",\"data\":[{\"amount\":\"9300000000000000000000000\",\"sender_id\":\"owner.testnet\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "keeper.testnet",
      "method": "request_order_signature",
      "args": {
        "order": {
          "asset_index": 74,
          "size": "9300000000000000000000000",
          "reduce_only": false,
          "reference_price": null
        }
      },
      "transactionHash": "9oiCeKvmx8wHrrHQVVTfinqgY1EFwc9cLC1RGVfbkLzy",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"1\",\"caller\":\"keeper.testnet\",\"kind\":\"Increase\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":false,\"p\":\"2.6462\",\"s\":\"9.3\",\"r\":false,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794331203305,\"expiresAfter\":1794331263305},\"digest\":\"aca197707eaf41c945aaf989004d4966a8c3c0e8d2504858359b39e12891deb9\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"1\",\"nonce\":\"1794331203305\",\"expiresAfter\":\"1794331263305\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
      ],
      "errors": []
    },
    {
      "actor": "keeper.testnet",
      "method": "heartbeat",
      "args": {},
      "transactionHash": "7HVcY6gCz3aZs9K9Mz6oTnQhpb7ao1BJ1gWhZCLiuJSR",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794331206\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "keeper.testnet",
      "method": "request_order_signature",
      "args": {
        "order": {
          "asset_index": 74,
          "size": "9300000000000000000000000",
          "reduce_only": true,
          "reference_price": "2806200"
        }
      },
      "transactionHash": "Hf9SUSyJ27AQAstYdgWfPU7fkxwyQA9eFfSw8jJdyxku",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"2\",\"caller\":\"keeper.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"2.8343\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794331208147,\"expiresAfter\":1794331268147},\"digest\":\"774889d5c5e0c932783ddc587b19a26126288f0fb1515bfbc33224bd0b65df00\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"2\",\"nonce\":\"1794331208147\",\"expiresAfter\":\"1794331268147\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
      ],
      "errors": []
    },
    {
      "actor": "keeper.testnet",
      "method": "request_order_signature",
      "args": {
        "order": {
          "asset_index": 74,
          "size": "100000000000000000000000000",
          "reduce_only": false,
          "reference_price": null
        }
      },
      "transactionHash": "HxMsfVYmVFfXUVBk26CiNmbCXKQbF99Utz7smEffRSZS",
      "succeeded": false,
      "logs": [],
      "errors": [
        "{\"ActionError\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_EXCEEDS_SPOT_HEDGE\"}}}}"
      ]
    },
    {
      "actor": "keeper.testnet",
      "method": "request_order_signature",
      "args": {
        "order": {
          "asset_index": 74,
          "size": "100000000000000000000000",
          "reduce_only": false,
          "reference_price": "3541700"
        }
      },
      "transactionHash": "Cvk9idFFpquaGZVCQXnLcZR6ovqMrRU9pFJwu9RRzy2M",
      "succeeded": false,
      "logs": [],
      "errors": [
        "{\"ActionError\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_OPEN_PRICE_OVERRIDE\"}}}}"
      ]
    },
    {
      "actor": "keeper.testnet",
      "method": "request_evm_withdrawal",
      "args": {
        "recipient": "0x2222222222222222222222222222222222222222",
        "amount": "1000000"
      },
      "transactionHash": "5mdDa9ni1ZXXH42ud5a15pZmocq68aXEj7gbir4bPbK1",
      "succeeded": false,
      "logs": [],
      "errors": [
        "{\"ActionError\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_CALLER_NOT_OWNER\"}}}}"
      ]
    },
    {
      "actor": "keeper.testnet",
      "method": "approveAgent",
      "args": {
        "agentAddress": "0x2222222222222222222222222222222222222222"
      },
      "transactionHash": "7NbgGqnThwXeAqozKrMJjPR2d6NPisUkv68aX4W5UjTH",
      "succeeded": false,
      "logs": [],
      "errors": [
        "{\"ActionError\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"MethodResolveError\":\"MethodNotFound\"}}}}"
      ]
    },
    {
      "actor": "keeper.testnet",
      "method": "on_signature",
      "args": {
        "operation_id": "2",
        "nonce": 1794331208147
      },
      "transactionHash": "7Smf2MjnN8QbW6Nsm6TJsJp3FL6qZiRTJHeu76APz9qq",
      "succeeded": false,
      "logs": [],
      "errors": [
        "{\"ActionError\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: Method on_signature is private\"}}}}"
      ]
    },
    {
      "actor": "keeper.testnet",
      "method": "request_order_signature",
      "args": {
        "order": {
          "asset_index": 74,
          "size": "100000000000000000000000",
          "reduce_only": false,
          "reference_price": null
        }
      },
      "transactionHash": "Rg5zVxXj4bEMfegin7RK1iztrqVAu2LF7qHQ2HovuB7",
      "succeeded": false,
      "logs": [],
      "errors": [
        "{\"ActionError\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_STALE_PRICE\"}}}}"
      ]
    },
    {
      "actor": "rogue.testnet",
      "method": "request_order_signature",
      "args": {
        "order": {
          "asset_index": 74,
          "size": "100000000000000000000000",
          "reduce_only": true,
          "reference_price": "3541700"
        }
      },
      "transactionHash": "4kpETXnuW4KMrj7PiZC1T2kesDGAcbGhVzo9ioSmx58h",
      "succeeded": false,
      "logs": [],
      "errors": [
        "{\"ActionError\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_CALLER_NOT_KEEPER\"}}}}"
      ]
    },
    {
      "actor": "keeper.testnet",
      "method": "heartbeat",
      "args": {},
      "transactionHash": "7qEQid24CTUGwyPHb9r6TZ6pCqD5NhYCSYNLzu19m7qu",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794332519\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "bystander.testnet",
      "method": "deleverage",
      "args": {
        "price": "3541700"
      },
      "transactionHash": "5x1buWQLu7kFzPeA6uHbF599nSS2dEaWtWif6K4HSQeV",
      "succeeded": false,
      "logs": [],
      "errors": [
        "{\"ActionError\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_HEARTBEAT_ACTIVE\"}}}}"
      ]
    },
    {
      "actor": "bystander.testnet",
      "method": "deleverage",
      "args": {
        "price": "3541700"
      },
      "transactionHash": "FKzr73DTmt1f4jTfnvKifKPqaWTzvmEDXARMhVpYuVsi",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"pause\",\"data\":[{\"paused\":true,\"reason\":\"recovery\",\"complete\":true}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"3\",\"caller\":\"bystander.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"3.5772\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794333818858,\"expiresAfter\":1794333878858},\"digest\":\"fc48ceb426986e1f62c7afb46e1e6bc81e3fee1537ec818a7817c0978faee4cc\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"3\",\"nonce\":\"1794333818858\",\"expiresAfter\":\"1794333878858\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "set_paused",
      "args": {
        "paused": false
      },
      "transactionHash": "J1yA1uqgpeFXy5FgiGJ1UbMiyR3S5vrjhSDdNrFU1WmS",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"pause\",\"data\":[{\"paused\":false,\"complete\":true}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "set_reference_price",
      "args": {
        "price": "3541700"
      },
      "transactionHash": "6eXN9PbNX5EV2gaFxWFuZSZYCPJhfCvMs6L48RxBfgi3",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"reference_price\",\"data\":[{\"price\":\"3541700\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "configure_rebalancing",
      "args": {
        "limits": {
          "adapter": "mock-mpc.testnet",
          "strategy_margin_address": "0x1111111111111111111111111111111111111111",
          "destination_token": "1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054",
          "per_sale_near": "9300000000000000000000000",
          "daily_sale_near": "9300000000000000000000000",
          "max_fee_usdc": "50000",
          "max_impact_bps": 100,
          "quote_age_ms": 30000,
          "completion_ms": 3600000,
          "max_mismatch_near": "9300000000000000000000000",
          "per_withdrawal_usdc": "10000000",
          "daily_withdrawal_usdc": "20000000",
          "min_residual_equity_usdc": "1000000",
          "min_headroom_bps": 1000,
          "lower_headroom_bps": 3000,
          "target_headroom_bps": 6000,
          "upper_headroom_bps": 9000,
          "fee_reserve_usdc": "100000",
          "original_target_usdc": "32937810"
        }
      },
      "transactionHash": "GHqws33zjKAZXdcd8AwHJXEtfVjWXXQ5QPwasvGTWwT4",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"rebalance_config\",\"data\":[{\"limits\":{\"adapter\":\"mock-mpc.testnet\",\"strategy_margin_address\":\"0x1111111111111111111111111111111111111111\",\"destination_token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\",\"per_sale_near\":\"9300000000000000000000000\",\"daily_sale_near\":\"9300000000000000000000000\",\"max_fee_usdc\":\"50000\",\"max_impact_bps\":100,\"quote_age_ms\":30000,\"completion_ms\":3600000,\"max_mismatch_near\":\"9300000000000000000000000\",\"per_withdrawal_usdc\":\"10000000\",\"daily_withdrawal_usdc\":\"20000000\",\"min_residual_equity_usdc\":\"1000000\",\"min_headroom_bps\":1000,\"lower_headroom_bps\":3000,\"target_headroom_bps\":6000,\"upper_headroom_bps\":9000,\"fee_reserve_usdc\":\"100000\",\"original_target_usdc\":\"32937810\"},\"source\":\"policy.testnet\",\"source_token\":\"mock-mpc.testnet\",\"destination_chain\":\"hyperliquid\",\"withdrawal_recipient\":\"0x1111111111111111111111111111111111111111\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "observe_margin",
      "args": {
        "equity_usdc": "28714402",
        "withdrawable_usdc": "0",
        "observed_at_ms": "1794335119973"
      },
      "transactionHash": "Cb8jU2wSDGrFs3tJGcTtvojbZT37FKCxc9zW3RQfFstw",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"margin_observation\",\"data\":[{\"equity_usdc\":\"28714402\",\"withdrawable_usdc\":\"0\",\"observed_at_ms\":\"1794335119973\",\"source\":\"owner_finality_attestation\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "settle_position",
      "args": {
        "short_size": "0",
        "observed_at_ms": "1794335121788"
      },
      "transactionHash": "Ghr676He2qdfpUTCQkCtyT16LRfnWqrNGZa455xMC28X",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"position_settlement\",\"data\":[{\"short_size\":\"0\",\"released\":\"9300000000000000000000000\",\"observed_at_ms\":\"1794335121788\",\"source\":\"owner_attestation\",\"daily_budget_released\":false}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "set_reference_price",
      "args": {
        "price": "3541700"
      },
      "transactionHash": "4qJgTXQmrR4EbZa2wn6qkb66miN7qvcBMXvWzsKFe6VJ",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"reference_price\",\"data\":[{\"price\":\"3541700\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "approve_spot_sale",
      "args": {
        "quote": {
          "near_amount": "9300000000000000000000000",
          "paired_closed_near": "9300000000000000000000000",
          "min_usdc": "32558432",
          "fee_usdc": "50000",
          "impact_bps": 100,
          "quoted_at_ms": "1794335125425",
          "deadline_ms": "1794335155425"
        }
      },
      "transactionHash": "9S2GXcDzWa8FYi7uwp9FLsC3dEaKZWQc9o4jFN1VKks1",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"sale_route\",\"data\":[{\"status\":\"dispatching\",\"route\":{\"id\":\"1\",\"quote\":{\"near_amount\":\"9300000000000000000000000\",\"paired_closed_near\":\"9300000000000000000000000\",\"min_usdc\":\"32558432\",\"fee_usdc\":\"50000\",\"impact_bps\":100,\"quoted_at_ms\":\"1794335125425\",\"deadline_ms\":\"1794335155425\"},\"dispatched_near\":\"9300000000000000000000000\",\"phase\":\"Dispatching\",\"completion_deadline_ms\":\"1794338728439\"},\"source\":\"policy.testnet\",\"destination\":\"0x1111111111111111111111111111111111111111\",\"chain\":\"hyperliquid\",\"token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"sale_dispatch\",\"data\":[{\"route_id\":\"1\",\"used_near\":\"9300000000000000000000000\",\"status\":\"resolved\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "reconcile_sale_receipt",
      "args": {
        "route_id": "1",
        "refunded_near": "0",
        "credited_usdc": "32558432",
        "receipt_id": "demo-local-mock-finalized-sale-1",
        "finalized_at_ms": "1794335128439"
      },
      "transactionHash": "48QTAdZpuZVn5tS8RtPYQ2DQs6YRoZt3c9biHxPDzsWU",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"margin_topup\",\"data\":[{\"route_id\":\"1\",\"sold_near\":\"9300000000000000000000000\",\"refunded_near\":\"0\",\"credited_usdc\":\"32558432\",\"recipient\":\"0x1111111111111111111111111111111111111111\",\"chain\":\"hyperliquid\",\"token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\",\"receipt_id\":\"demo-local-mock-finalized-sale-1\",\"finalized_at_ms\":\"1794335128439\",\"source\":\"owner_finality_attestation\"}]}"
      ],
      "errors": []
    }
  ],
  "ownerBefore": {
    "balanceYocto": "99999347412735944600000000",
    "accessKeys": [
      {
        "publicKey": "ed25519:BVBTaHvQ9opyYusQ1quvcmegxLySTr2UCEMaPkF31LLa",
        "nonce": 7000002
      }
    ]
  },
  "timeline": [
    {
      "hour": 1,
      "time": 1789624800000,
      "nearPrice": 2.6597,
      "headroomUsd": 5.017821,
      "venueEquityUsd": 30.100384723125,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 2,
      "time": 1789628400000,
      "nearPrice": 2.6987,
      "headroomUsd": 4.289103,
      "venueEquityUsd": 29.737993971375,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 3,
      "time": 1789632000000,
      "nearPrice": 2.7248,
      "headroomUsd": 3.80153,
      "venueEquityUsd": 29.495577683625,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 4,
      "time": 1789635600000,
      "nearPrice": 2.752,
      "headroomUsd": 3.293398,
      "venueEquityUsd": 29.242934360250008,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 5,
      "time": 1789639200000,
      "nearPrice": 2.8062,
      "headroomUsd": 2.280557,
      "venueEquityUsd": 28.739194361625007,
      "proposals": [
        {
          "type": "full-unwind",
          "reduceOnly": true,
          "fraction": 1,
          "reason": "stress-headroom",
          "requiresSpotApproval": true
        }
      ],
      "action": "reduce-only close",
      "result": "SIGNED mock + event",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 6,
      "time": 1789642800000,
      "nearPrice": 2.8098,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 7,
      "time": 1789646400000,
      "nearPrice": 2.8739,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 8,
      "time": 1789650000000,
      "nearPrice": 2.8713,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 9,
      "time": 1789653600000,
      "nearPrice": 2.875,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 10,
      "time": 1789657200000,
      "nearPrice": 2.8173,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 11,
      "time": 1789660800000,
      "nearPrice": 2.8816,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 12,
      "time": 1789664400000,
      "nearPrice": 2.9751,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 13,
      "time": 1789668000000,
      "nearPrice": 3.048,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 14,
      "time": 1789671600000,
      "nearPrice": 2.99,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 15,
      "time": 1789675200000,
      "nearPrice": 3.052,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 16,
      "time": 1789678800000,
      "nearPrice": 3.0128,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 17,
      "time": 1789682400000,
      "nearPrice": 3.0243,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 18,
      "time": 1789686000000,
      "nearPrice": 3.1435,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 19,
      "time": 1789689600000,
      "nearPrice": 3.1476,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 20,
      "time": 1789693200000,
      "nearPrice": 3.1596,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 21,
      "time": 1789696800000,
      "nearPrice": 3.2299,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 22,
      "time": 1789700400000,
      "nearPrice": 3.3684,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 23,
      "time": 1789704000000,
      "nearPrice": 3.5048,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 24,
      "time": 1789707600000,
      "nearPrice": 3.5417,
      "headroomUsd": 28.614401,
      "venueEquityUsd": 28.71440158462501,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "phase": "owner-rebalance",
      "action": "owner settle_position",
      "result": "mock close fill attested; reserved short released",
      "historicalTime": 1789707600000
    },
    {
      "phase": "owner-rebalance",
      "action": "owner approve_spot_sale",
      "result": "mock route dispatched; awaiting finalized receipt; no margin credit yet",
      "historicalTime": 1789707600000
    },
    {
      "phase": "owner-rebalance",
      "action": "rebalance complete",
      "result": "owner reconciled mock receipt; sold 9.3 NEAR; margin credited 32558432 micro-USDC",
      "historicalTime": 1789707600000
    }
  ],
  "ownerAfterReplay": {
    "balanceYocto": "99999347412735944600000000",
    "accessKeys": [
      {
        "publicKey": "ed25519:BVBTaHvQ9opyYusQ1quvcmegxLySTr2UCEMaPkF31LLa",
        "nonce": 7000002
      }
    ]
  },
  "rogueAttempts": [
    {
      "name": "increase beyond caps",
      "error": "ERR_EXCEEDS_SPOT_HEDGE",
      "rejected": true,
      "explanation": "Configured keeper exceeds inventory backing."
    },
    {
      "name": "non-reduce close",
      "error": "ERR_OPEN_PRICE_OVERRIDE",
      "rejected": true,
      "explanation": "Attempt to convert a mark-bearing close into a non-reduce open; bounded ordinary opens remain allowed."
    },
    {
      "name": "withdraw to rogue",
      "error": "ERR_CALLER_NOT_OWNER",
      "rejected": true,
      "explanation": "Keeper cannot withdraw or replace the owner-fixed recipient."
    },
    {
      "name": "approveAgent",
      "error": "MethodNotFound",
      "rejected": true,
      "explanation": "No approveAgent export exists in the deployed Wasm."
    },
    {
      "name": "replayed nonce/callback",
      "error": "Method on_signature is private",
      "rejected": true,
      "explanation": "Replays an old completed operation/nonce at the private callback; callers cannot select signing nonces."
    },
    {
      "name": "stale price",
      "error": "ERR_STALE_PRICE",
      "rejected": true,
      "explanation": "Opening with an expired owner reference price fails; reduce-only recovery deliberately remains available."
    },
    {
      "name": "unrelated rogue account",
      "error": "ERR_CALLER_NOT_KEEPER",
      "rejected": true,
      "explanation": "Distinct local rogue identity cannot impersonate the configured keeper."
    }
  ],
  "ownerAfter": {
    "balanceYocto": "99999347412735944600000000",
    "accessKeys": [
      {
        "publicKey": "ed25519:BVBTaHvQ9opyYusQ1quvcmegxLySTr2UCEMaPkF31LLa",
        "nonce": 7000002
      }
    ]
  },
  "autonomousFinalState": {
    "network": "Testnet",
    "oracle": {
      "account_id": null,
      "feed_id": "c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750",
      "max_age_seconds": 120,
      "max_confidence_bps": 100,
      "min_price": "1336500",
      "max_price": "5346000"
    },
    "oracle_price": "0",
    "oracle_timestamp": "0",
    "owner": "owner.testnet",
    "keeper": "keeper.testnet",
    "coin": "NEAR",
    "asset_index": 74,
    "size_decimals": 1,
    "derivation_path": "counterweight-local-mock-only",
    "near_recipient": "owner.testnet",
    "evm_recipient": "0x1111111111111111111111111111111111111111",
    "signer_account": "mock-mpc.testnet",
    "wnear_account": "mock-mpc.testnet",
    "limits": {
      "max_short_size": "9300000000000000000000000",
      "per_order_notional_cap": "30000000",
      "per_day_notional_cap": "30000000",
      "cooldown_seconds": 60,
      "price_band_bps": 100,
      "price_max_age_seconds": 120
    },
    "spot_balance": "9300000000000000000000000",
    "signed_short_size": "9300000000000000000000000",
    "daily_usage": "25107489",
    "usage_day": 20767,
    "operation_id": "3",
    "pending": null,
    "paused": true,
    "last_keeper_heartbeat": "1794332519",
    "heartbeat_timeout_seconds": 600,
    "reference_price": "2673000",
    "reference_price_timestamp": "1794331197",
    "last_nonce": "1794333818858",
    "signing_limits": {
      "keeper_per_block": 2,
      "keeper_per_window": 8,
      "keeper_outstanding": 8,
      "owner_per_window": 16,
      "window_ms": 60000,
      "max_nonce_ahead_ms": 1000
    },
    "outstanding": [
      {
        "nonce": 1794333818858,
        "expires_after": 1794333878858,
        "keeper": false,
        "discarded": false,
        "invalidation_requested": false,
        "invalidation_signed": false,
        "invalidation_confirmed": false,
        "withdrawal": false
      }
    ],
    "pause_complete": true,
    "lifetime_opened": "9300000000000000000000000",
    "last_open_expiry": "1794331263305",
    "keeper_weight_used": "15",
    "keeper_weight_limit": "5000",
    "mpc_fee": "1",
    "signer_gas_tgas": 230,
    "callback_gas_tgas": 30
  },
  "assertions": {
    "keeperCloseSigned": true,
    "rogueRejected": 7,
    "ownerUntouchedDuringAutonomousPhase": true,
    "ownerTransactionsDuringAutonomousPhase": 0,
    "freshContractNonces": true,
    "earlyDeadmanRejected": true,
    "unrelatedDeadmanSigned": true,
    "policyHasNoKeys": true,
    "conservativeExposureRetained": true,
    "ownerRebalanceCompleted": true,
    "marginCreditedOnlyAfterReceipt": true,
    "finalSpotAndShortZero": true
  },
  "finalState": {
    "network": "Testnet",
    "oracle": {
      "account_id": null,
      "feed_id": "c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750",
      "max_age_seconds": 120,
      "max_confidence_bps": 100,
      "min_price": "1336500",
      "max_price": "5346000"
    },
    "oracle_price": "0",
    "oracle_timestamp": "0",
    "owner": "owner.testnet",
    "keeper": "keeper.testnet",
    "coin": "NEAR",
    "asset_index": 74,
    "size_decimals": 1,
    "derivation_path": "counterweight-local-mock-only",
    "near_recipient": "owner.testnet",
    "evm_recipient": "0x1111111111111111111111111111111111111111",
    "signer_account": "mock-mpc.testnet",
    "wnear_account": "mock-mpc.testnet",
    "limits": {
      "max_short_size": "9300000000000000000000000",
      "per_order_notional_cap": "30000000",
      "per_day_notional_cap": "30000000",
      "cooldown_seconds": 60,
      "price_band_bps": 100,
      "price_max_age_seconds": 120
    },
    "spot_balance": "0",
    "signed_short_size": "0",
    "daily_usage": "25107489",
    "usage_day": 20767,
    "operation_id": "3",
    "pending": null,
    "paused": false,
    "last_keeper_heartbeat": "1794332519",
    "heartbeat_timeout_seconds": 600,
    "reference_price": "3541700",
    "reference_price_timestamp": "1794335126",
    "last_nonce": "1794333818858",
    "signing_limits": {
      "keeper_per_block": 2,
      "keeper_per_window": 8,
      "keeper_outstanding": 8,
      "owner_per_window": 16,
      "window_ms": 60000,
      "max_nonce_ahead_ms": 1000
    },
    "outstanding": [],
    "pause_complete": true,
    "lifetime_opened": "9300000000000000000000000",
    "last_open_expiry": "1794331263305",
    "keeper_weight_used": "15",
    "keeper_weight_limit": "5000",
    "mpc_fee": "1",
    "signer_gas_tgas": 230,
    "callback_gas_tgas": 30
  },
  "rebalance": {
    "mocked": true,
    "dispatched": {
      "processed_receipts": [],
      "withdrawal": null,
      "acquisition_budget_usdc": "0",
      "acquired_near": "0",
      "reentry_required": false,
      "limits": {
        "adapter": "mock-mpc.testnet",
        "strategy_margin_address": "0x1111111111111111111111111111111111111111",
        "destination_token": "1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054",
        "per_sale_near": "9300000000000000000000000",
        "daily_sale_near": "9300000000000000000000000",
        "max_fee_usdc": "50000",
        "max_impact_bps": 100,
        "quote_age_ms": 30000,
        "completion_ms": 3600000,
        "max_mismatch_near": "9300000000000000000000000",
        "per_withdrawal_usdc": "10000000",
        "daily_withdrawal_usdc": "20000000",
        "min_residual_equity_usdc": "1000000",
        "min_headroom_bps": 1000,
        "lower_headroom_bps": 3000,
        "target_headroom_bps": 6000,
        "upper_headroom_bps": 9000,
        "fee_reserve_usdc": "100000",
        "original_target_usdc": "32937810"
      },
      "initial_inventory": "9300000000000000000000000",
      "sold_inventory": "0",
      "reduced_inventory": "0",
      "usable_margin": "28714402",
      "withdrawable": "0",
      "observed_at_ms": "1794335119973",
      "next_route_id": "1",
      "route": {
        "id": "1",
        "quote": {
          "near_amount": "9300000000000000000000000",
          "paired_closed_near": "9300000000000000000000000",
          "min_usdc": "32558432",
          "fee_usdc": "50000",
          "impact_bps": 100,
          "quoted_at_ms": "1794335125425",
          "deadline_ms": "1794335155425"
        },
        "dispatched_near": "9300000000000000000000000",
        "phase": "AwaitingReceipt",
        "completion_deadline_ms": "1794338728439"
      },
      "sales": [
        [
          1794335128439,
          9.3e+24
        ]
      ],
      "withdrawals": []
    },
    "completed": {
      "processed_receipts": [
        [
          181,
          136,
          90,
          141,
          17,
          101,
          226,
          88,
          149,
          50,
          114,
          216,
          166,
          114,
          96,
          233,
          21,
          79,
          118,
          37,
          65,
          242,
          225,
          76,
          217,
          82,
          225,
          159,
          243,
          59,
          117,
          86
        ]
      ],
      "withdrawal": null,
      "acquisition_budget_usdc": "0",
      "acquired_near": "0",
      "reentry_required": false,
      "limits": {
        "adapter": "mock-mpc.testnet",
        "strategy_margin_address": "0x1111111111111111111111111111111111111111",
        "destination_token": "1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054",
        "per_sale_near": "9300000000000000000000000",
        "daily_sale_near": "9300000000000000000000000",
        "max_fee_usdc": "50000",
        "max_impact_bps": 100,
        "quote_age_ms": 30000,
        "completion_ms": 3600000,
        "max_mismatch_near": "9300000000000000000000000",
        "per_withdrawal_usdc": "10000000",
        "daily_withdrawal_usdc": "20000000",
        "min_residual_equity_usdc": "1000000",
        "min_headroom_bps": 1000,
        "lower_headroom_bps": 3000,
        "target_headroom_bps": 6000,
        "upper_headroom_bps": 9000,
        "fee_reserve_usdc": "100000",
        "original_target_usdc": "32937810"
      },
      "initial_inventory": "9300000000000000000000000",
      "sold_inventory": "9300000000000000000000000",
      "reduced_inventory": "0",
      "usable_margin": "61272834",
      "withdrawable": "0",
      "observed_at_ms": "1794335119973",
      "next_route_id": "1",
      "route": null,
      "sales": [
        [
          1794335128439,
          9.3e+24
        ]
      ],
      "withdrawals": []
    },
    "creditedUsdc": "32558432"
  },
  "ownerAfterRebalance": {
    "balanceYocto": "99696269565908328999999999",
    "accessKeys": [
      {
        "publicKey": "ed25519:BVBTaHvQ9opyYusQ1quvcmegxLySTr2UCEMaPkF31LLa",
        "nonce": 7000010
      }
    ]
  },
  "finishedAt": "2026-11-10T17:21:03.322Z"
}
```
