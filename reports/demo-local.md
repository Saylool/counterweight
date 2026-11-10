# Counterweight local demo

Status: **passed**. Real recorded market data; local policy execution; mock MPC, token and venue fills.

Run: `npm ci && npm run demo:local`. No runtime network beyond loopback. See [demo boundary](../packages/local-sandbox/README.md) and [known issues](../docs/KNOWN-ISSUES.md).

```text
COUNTERWEIGHT | LOCAL SANDBOX | MOCK MPC / MOCK FILLS | no wallet or testnet account
OFFLINE GUARD active | Node connections restricted to loopback
FIXTURES SHA-256 verified | worst 24h +32.499065% / 4297 windows
WINDOW 2026-09-17T05:00:00.000Z -> 2026-09-18T05:00:00.000Z
POLICY SHA-256 d85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1 verified before deploy
MOCK MPC SHA-256 69ba632f36ccaa2d00f73466d617da0a0d1d267a0484624e61abf302201b591f verified before deploy
SETUP local accounts + mock spot 9.3 NEAR | policy access keys: 0
BOUNDARY policy operating reserve pays MPC fee; keeper attaches zero; spot disposal awaits owner approval
SETUP keeper bounded short SIGNED (mock); pre-existing hedge / simulated margin $30.00
OWNER FROZEN nonce=7000002 balance=99999348632746344600000000 yocto
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
OWNER AFTER nonce=7000002 balance=99999348632746344600000000 yocto (unchanged)
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
  "startedAt": "2026-11-10T12:09:58.500Z",
  "offlineGuardActive": true,
  "policySha256": "d85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1",
  "mockSha256": "69ba632f36ccaa2d00f73466d617da0a0d1d267a0484624e61abf302201b591f",
  "transcript": [
    "COUNTERWEIGHT | LOCAL SANDBOX | MOCK MPC / MOCK FILLS | no wallet or testnet account",
    "OFFLINE GUARD active | Node connections restricted to loopback",
    "FIXTURES SHA-256 verified | worst 24h +32.499065% / 4297 windows",
    "WINDOW 2026-09-17T05:00:00.000Z -> 2026-09-18T05:00:00.000Z",
    "POLICY SHA-256 d85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1 verified before deploy",
    "MOCK MPC SHA-256 69ba632f36ccaa2d00f73466d617da0a0d1d267a0484624e61abf302201b591f verified before deploy",
    "SETUP local accounts + mock spot 9.3 NEAR | policy access keys: 0",
    "BOUNDARY policy operating reserve pays MPC fee; keeper attaches zero; spot disposal awaits owner approval",
    "SETUP keeper bounded short SIGNED (mock); pre-existing hedge / simulated margin $30.00",
    "OWNER FROZEN nonce=7000002 balance=99999348632746344600000000 yocto",
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
    "OWNER AFTER nonce=7000002 balance=99999348632746344600000000 yocto (unchanged)",
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
    "Receipt: 9FEifvU4PCxnT6PhY83n3WN29EzUSh1a352XAm264CFE",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"init\",\"data\":[{\"owner\":\"owner.testnet\",\"keeper\":\"keeper.testnet\",\"asset_index\":74,\"size_decimals\":1,\"evm_recipient\":\"0x1111111111111111111111111111111111111111\",\"signer_account\":\"mock-mpc.testnet\",\"wnear_account\":\"mock-mpc.testnet\",\"limits\":{\"max_short_size\":\"9300000000000000000000000\",\"per_order_notional_cap\":\"30000000\",\"per_day_notional_cap\":\"30000000\",\"cooldown_seconds\":60,\"price_band_bps\":100,\"price_max_age_seconds\":120},\"heartbeat_timeout_seconds\":600,\"signing_limits\":{\"keeper_per_block\":2,\"keeper_per_window\":8,\"keeper_outstanding\":8,\"owner_per_window\":16,\"window_ms\":60000,\"max_nonce_ahead_ms\":1000}}]}",
    "Receipt: yGmibqfE1evs5TgJZUnsPeYXA3cX4BrS36tBiywDujS",
    "\tLog [mock-mpc.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"deposit\",\"data\":[{\"amount\":\"9300000000000000000000000\",\"sender_id\":\"owner.testnet\"}]}",
    "Receipts: ECD4UqmdvB1PAGmH4Dd2vHWZTMfYExFcDFi3R7hNkduS, BGGDYVr9MNVTzZMwNPji79X3ypURPJGC2UBn5RFXXwhu, Hhn1b4XuFTAPqBvGkNaNwQx9R8uZx4ipUcukrk2kR7w5",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"1\",\"caller\":\"keeper.testnet\",\"kind\":\"Increase\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":false,\"p\":\"2.6462\",\"s\":\"9.3\",\"r\":false,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794312622367,\"expiresAfter\":1794312682367},\"digest\":\"322a0f63c469772fee77f180a9a28f785ffbcf0b006a5711292d83d11cde352c\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
    "Receipt: BKmGhLVfFEHdVWFv9ahHaiFAcFXdhkiyX21ymZGCXtsP",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"1\",\"nonce\":\"1794312622367\",\"expiresAfter\":\"1794312682367\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}",
    "Receipt: DH2iYdeE55PtGgpBiQUvW8gcFuNnDumredephWNreNA6",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794312625\"}]}",
    "Receipts: HyuHrbz9bCdFtxifdtBKHmEYuJycS5ayvpACSpMzXK56, FvwrvWsiD8gR7vh9XEsmvoV3z1YG6MdKV2J7rjV9g8Ks, 2VPsjzM9qeobmj7FJnwW9Yf6XRK1kbaDJyPgs5uHHpw6",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"2\",\"caller\":\"keeper.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"2.8343\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794312627215,\"expiresAfter\":1794312687215},\"digest\":\"43b5a81b00c67bc5f270a8b2a5b40a34831bb443192b386792b5ed14c0cbfbfc\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
    "Receipt: n1tS2EYQ28oXivxkHcJcLYgi93JKKhzGRZQGCkfk86a",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"2\",\"nonce\":\"1794312627215\",\"expiresAfter\":\"1794312687215\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}",
    "Receipt: Awv8vcV26kNhGUrhudQBJ43pG9ZRhvEwggEk6wqSg6k1",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_EXCEEDS_SPOT_HEDGE\"}}}}",
    "Receipt: 87eRv57y2R8vdoM5WKwwgsqB8MZjTx3XXBGpoVKFqxfx",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_OPEN_PRICE_OVERRIDE\"}}}}",
    "Receipt: GNMoMMrDYrawzPCpBXB66KzQ2PaDWkUbQQ9is1SGZ4zE",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_CALLER_NOT_OWNER\"}}}}",
    "Receipt: CFJDzAvCQrZz6keUzmZsKsmSbtTxJE3G3GxgeEoBqSyw",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"MethodResolveError\":\"MethodNotFound\"}}}}",
    "Receipt: CbX2adKaQFBDdXqByQ55L3YLQCzTYer46Su5w4qAjjMh",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: Method on_signature is private\"}}}}",
    "Receipt: ABVRQUJuJXd5kAVncF9npeLMtoyWaRLaMji127r81nK1",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_STALE_PRICE\"}}}}",
    "Receipt: 6HybSX8Ykjho3cD9n8cX3mN19EJnoELwcwByugaR5Fxp",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_CALLER_NOT_KEEPER\"}}}}",
    "Receipt: F57yq9vGSiZLru3YeQ6Yvk7cxbJWtNKZ5CJcWgX1K8jn",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794313938\"}]}",
    "Receipt: DY3gpFvpigA1B28kB1RUXW9Q3XxdkVNXvWfjgaTT93er",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_HEARTBEAT_ACTIVE\"}}}}",
    "Receipts: Ab6X7EzzP2QfMEir6eyrcS33UqJfazo57Yake97g8HJL, 9VCSxyyHiBX1P6ERqmTyZYibMm1h87X7x4kiDmwqYAUE, HBsjFGQZD4Mf6rwzU2iPJWo2wxDmWW8gxn7k9KyyfQ2d",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"pause\",\"data\":[{\"paused\":true,\"reason\":\"recovery\",\"complete\":true}]}",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"3\",\"caller\":\"bystander.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"3.5772\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794315237923,\"expiresAfter\":1794315297923},\"digest\":\"bf17849b50ac0074f2ede84f96e1b4d6073535ed0fc4fb6ace3ce250e9ef2cce\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
    "Receipt: Fh6wytZp368Q6w946JGfc56TKoEsT9U9iXmZpxWQ79KX",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"3\",\"nonce\":\"1794315237923\",\"expiresAfter\":\"1794315297923\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}",
    "Receipt: EMLZ9XcAvCergMPZg5PVtmcDgt9Cpceg959AbDRcsZqD",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"pause\",\"data\":[{\"paused\":false,\"complete\":true}]}",
    "Receipt: HErGdP4PHTdSfT1wQEFCCcvBRhC8VAdUtkbzNBtWnQz1",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"reference_price\",\"data\":[{\"price\":\"3541700\"}]}",
    "Receipt: AyPpBq61ud9RyBKdTtUBua3XBRo2H4pBGdTM1R2xzTFN",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"rebalance_config\",\"data\":[{\"limits\":{\"adapter\":\"mock-mpc.testnet\",\"strategy_margin_address\":\"0x1111111111111111111111111111111111111111\",\"destination_token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\",\"per_sale_near\":\"9300000000000000000000000\",\"daily_sale_near\":\"9300000000000000000000000\",\"max_fee_usdc\":\"50000\",\"max_impact_bps\":100,\"quote_age_ms\":30000,\"completion_ms\":3600000,\"max_mismatch_near\":\"9300000000000000000000000\",\"per_withdrawal_usdc\":\"10000000\",\"daily_withdrawal_usdc\":\"20000000\",\"min_residual_equity_usdc\":\"1000000\",\"min_headroom_bps\":1000,\"lower_headroom_bps\":3000,\"target_headroom_bps\":6000,\"upper_headroom_bps\":9000,\"fee_reserve_usdc\":\"100000\",\"original_target_usdc\":\"32937810\"},\"source\":\"policy.testnet\",\"source_token\":\"mock-mpc.testnet\",\"destination_chain\":\"hyperliquid\",\"withdrawal_recipient\":\"0x1111111111111111111111111111111111111111\"}]}",
    "Receipt: HDtWuBC5zsPETR3HjCTthQfmCTX61DZCjHjXNuMEwobA",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"margin_observation\",\"data\":[{\"equity_usdc\":\"28714402\",\"withdrawable_usdc\":\"0\",\"observed_at_ms\":\"1794316539052\",\"source\":\"owner_finality_attestation\"}]}",
    "Receipt: Fn2g8mx2UgiqBp6KCitoaaCpbyHSrsZssMFrvDfa26hN",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"position_settlement\",\"data\":[{\"short_size\":\"0\",\"released\":\"9300000000000000000000000\",\"observed_at_ms\":\"1794316540870\",\"source\":\"owner_attestation\",\"daily_budget_released\":false}]}",
    "Receipt: EpQPRhjkiUrP9ES7baV6EbDT3gU5zesz6uHaQXUJLjqU",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"reference_price\",\"data\":[{\"price\":\"3541700\"}]}",
    "Receipts: 7DbmsvLmFo3dWd3yuE1ZxwdjA7LhDjtUpQN8ZqUBvZSC, 3PMUBvwMYaVhGJZhT9QqbonzxjuVmFeWtVdK7iKtDZxc, 39jrBBH6oLrs74kgN7sHWpCX66u47DAwcP1in4pJNY6x",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"sale_route\",\"data\":[{\"status\":\"dispatching\",\"route\":{\"id\":\"1\",\"quote\":{\"near_amount\":\"9300000000000000000000000\",\"paired_closed_near\":\"9300000000000000000000000\",\"min_usdc\":\"32558432\",\"fee_usdc\":\"50000\",\"impact_bps\":100,\"quoted_at_ms\":\"1794316544520\",\"deadline_ms\":\"1794316574520\"},\"dispatched_near\":\"9300000000000000000000000\",\"phase\":\"Dispatching\",\"completion_deadline_ms\":\"1794320147559\"},\"source\":\"policy.testnet\",\"destination\":\"0x1111111111111111111111111111111111111111\",\"chain\":\"hyperliquid\",\"token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\"}]}",
    "Receipt: ELaCo6zkf6QuPDUbjd8dTk57ebuBN8DWUgtkewQWqBG1",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"sale_dispatch\",\"data\":[{\"route_id\":\"1\",\"used_near\":\"9300000000000000000000000\",\"status\":\"resolved\"}]}",
    "Receipt: DQm93r2NrA79JiAAvuoJMC4KdmKZz8Va1JQrnJS8KqKp",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"margin_topup\",\"data\":[{\"route_id\":\"1\",\"sold_near\":\"9300000000000000000000000\",\"refunded_near\":\"0\",\"credited_usdc\":\"32558432\",\"recipient\":\"0x1111111111111111111111111111111111111111\",\"chain\":\"hyperliquid\",\"token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\",\"receipt_id\":\"demo-local-mock-finalized-sale-1\",\"finalized_at_ms\":\"1794316547559\",\"source\":\"owner_finality_attestation\"}]}"
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
      "transactionHash": "51rFrREkyJzNJuiJcq1GXQwZ1rfhZpK1AEAT8q8bwqMT",
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
      "transactionHash": "6pfUWSckQmCU1CjaiLXy8qACD6dHskMR1vGuCYcTVCkL",
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
      "transactionHash": "3givysvvJCAsBY9neaJKCXERsRUUULAMY36iA45Cp87K",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"1\",\"caller\":\"keeper.testnet\",\"kind\":\"Increase\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":false,\"p\":\"2.6462\",\"s\":\"9.3\",\"r\":false,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794312622367,\"expiresAfter\":1794312682367},\"digest\":\"322a0f63c469772fee77f180a9a28f785ffbcf0b006a5711292d83d11cde352c\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"1\",\"nonce\":\"1794312622367\",\"expiresAfter\":\"1794312682367\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
      ],
      "errors": []
    },
    {
      "actor": "keeper.testnet",
      "method": "heartbeat",
      "args": {},
      "transactionHash": "D1kqCizPfBGy9k5EQZyBp2czMmnr4ziav64AnB3v36m3",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794312625\"}]}"
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
      "transactionHash": "CNAjwc4fjGa1HQNbbdNQp2Vya2dG4FrEaH81GUkB28cc",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"2\",\"caller\":\"keeper.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"2.8343\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794312627215,\"expiresAfter\":1794312687215},\"digest\":\"43b5a81b00c67bc5f270a8b2a5b40a34831bb443192b386792b5ed14c0cbfbfc\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"2\",\"nonce\":\"1794312627215\",\"expiresAfter\":\"1794312687215\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
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
      "transactionHash": "HYSXHYFBWBMJpuDh8YvmTPtVXfbHZxxaAGekJjgTZL8a",
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
      "transactionHash": "DxQvQM9d6F7LfRcBAknNgHVqo8UaQysx3nzxUAiEYg4u",
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
      "transactionHash": "Ex9cwx2j1PPZ1B7MKhfibm5two9ZwCGvbPMksDeP17t5",
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
      "transactionHash": "CDqagJu6EMGZYrcS1M6cNFeUd5ZsLwbBgfguj5ypBTeN",
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
        "nonce": 1794312627215
      },
      "transactionHash": "Be48jFVC4fJRHQQeoHHJWmHKGZuZWpHCRAoc34eCjfVf",
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
      "transactionHash": "6pWmF27umwWpEypkisMzwL3Rg83Ln18iSJrx19raaBqW",
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
      "transactionHash": "Gc9rqgWeKyMTLEtDeothmzTV7qZcaAt6izpQETBKcjkb",
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
      "transactionHash": "9Kos7Hy5TAM4bvPDEYaKskHmFcL2NF62rL9HQgLDXk48",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794313938\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "bystander.testnet",
      "method": "deleverage",
      "args": {
        "price": "3541700"
      },
      "transactionHash": "CgkDX5VK3ZYGZo8YHAPEsW6aJmpQVSxveWLSyyZ1Pg32",
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
      "transactionHash": "CcYzfxMfpVkDjSg4RcR15AmgPYFDkaKLmtTGcdva4nDs",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"pause\",\"data\":[{\"paused\":true,\"reason\":\"recovery\",\"complete\":true}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"3\",\"caller\":\"bystander.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"3.5772\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794315237923,\"expiresAfter\":1794315297923},\"digest\":\"bf17849b50ac0074f2ede84f96e1b4d6073535ed0fc4fb6ace3ce250e9ef2cce\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"3\",\"nonce\":\"1794315237923\",\"expiresAfter\":\"1794315297923\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "set_paused",
      "args": {
        "paused": false
      },
      "transactionHash": "8Z8hgMHPqk1K7iNtQ41JiM4HCuSAt94iKJC2gWyNa6rE",
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
      "transactionHash": "5iPUEokKrpNNFkNdWDoCdQ4jpnQk8nh3Aceyb8oQCHPj",
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
      "transactionHash": "D9WwXnwN9LzPcTRFMWdwHNXyJvSiHYmgqQVpQ1QBGczv",
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
        "observed_at_ms": "1794316539052"
      },
      "transactionHash": "8NVkxN2D6qnPKBo1Xw9jVBB5qz52mtdqdHYsLCXycm6y",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"margin_observation\",\"data\":[{\"equity_usdc\":\"28714402\",\"withdrawable_usdc\":\"0\",\"observed_at_ms\":\"1794316539052\",\"source\":\"owner_finality_attestation\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "settle_position",
      "args": {
        "short_size": "0",
        "observed_at_ms": "1794316540870"
      },
      "transactionHash": "7Cs7kvofZhBtrTYqqdhWYx8gMJhNe1N5xacEpG63h5Dc",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"position_settlement\",\"data\":[{\"short_size\":\"0\",\"released\":\"9300000000000000000000000\",\"observed_at_ms\":\"1794316540870\",\"source\":\"owner_attestation\",\"daily_budget_released\":false}]}"
      ],
      "errors": []
    },
    {
      "actor": "owner.testnet",
      "method": "set_reference_price",
      "args": {
        "price": "3541700"
      },
      "transactionHash": "65kyx8v1R6Nxj22c6VgxLVxZvnXWj2Gd7vZGndNt4wVe",
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
          "quoted_at_ms": "1794316544520",
          "deadline_ms": "1794316574520"
        }
      },
      "transactionHash": "EbNmTDqRCUE85vmP4CjHMB9fNAEEwq8BEJTB3pRA98bZ",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"sale_route\",\"data\":[{\"status\":\"dispatching\",\"route\":{\"id\":\"1\",\"quote\":{\"near_amount\":\"9300000000000000000000000\",\"paired_closed_near\":\"9300000000000000000000000\",\"min_usdc\":\"32558432\",\"fee_usdc\":\"50000\",\"impact_bps\":100,\"quoted_at_ms\":\"1794316544520\",\"deadline_ms\":\"1794316574520\"},\"dispatched_near\":\"9300000000000000000000000\",\"phase\":\"Dispatching\",\"completion_deadline_ms\":\"1794320147559\"},\"source\":\"policy.testnet\",\"destination\":\"0x1111111111111111111111111111111111111111\",\"chain\":\"hyperliquid\",\"token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\"}]}",
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
        "finalized_at_ms": "1794316547559"
      },
      "transactionHash": "CwWLkKbWhiXCz8SEDeq4gRYntTLwp9JxCui3DgrdTbe3",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"margin_topup\",\"data\":[{\"route_id\":\"1\",\"sold_near\":\"9300000000000000000000000\",\"refunded_near\":\"0\",\"credited_usdc\":\"32558432\",\"recipient\":\"0x1111111111111111111111111111111111111111\",\"chain\":\"hyperliquid\",\"token\":\"1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054\",\"receipt_id\":\"demo-local-mock-finalized-sale-1\",\"finalized_at_ms\":\"1794316547559\",\"source\":\"owner_finality_attestation\"}]}"
      ],
      "errors": []
    }
  ],
  "ownerBefore": {
    "balanceYocto": "99999348632746344600000000",
    "accessKeys": [
      {
        "publicKey": "ed25519:HaG9s6pVQfhXDBS6akaVwY7TsPL7Svq5zsDCE5QbEaSB",
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
    "balanceYocto": "99999348632746344600000000",
    "accessKeys": [
      {
        "publicKey": "ed25519:HaG9s6pVQfhXDBS6akaVwY7TsPL7Svq5zsDCE5QbEaSB",
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
    "balanceYocto": "99999348632746344600000000",
    "accessKeys": [
      {
        "publicKey": "ed25519:HaG9s6pVQfhXDBS6akaVwY7TsPL7Svq5zsDCE5QbEaSB",
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
    "last_keeper_heartbeat": "1794313938",
    "heartbeat_timeout_seconds": 600,
    "reference_price": "2673000",
    "reference_price_timestamp": "1794312616",
    "last_nonce": "1794315237923",
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
        "nonce": 1794315237923,
        "expires_after": 1794315297923,
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
    "last_open_expiry": "1794312682367",
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
    "last_keeper_heartbeat": "1794313938",
    "heartbeat_timeout_seconds": 600,
    "reference_price": "3541700",
    "reference_price_timestamp": "1794316545",
    "last_nonce": "1794315237923",
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
    "last_open_expiry": "1794312682367",
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
      "observed_at_ms": "1794316539052",
      "next_route_id": "1",
      "route": {
        "id": "1",
        "quote": {
          "near_amount": "9300000000000000000000000",
          "paired_closed_near": "9300000000000000000000000",
          "min_usdc": "32558432",
          "fee_usdc": "50000",
          "impact_bps": 100,
          "quoted_at_ms": "1794316544520",
          "deadline_ms": "1794316574520"
        },
        "dispatched_near": "9300000000000000000000000",
        "phase": "AwaitingReceipt",
        "completion_deadline_ms": "1794320147559"
      },
      "sales": [
        [
          1794316547559,
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
      "observed_at_ms": "1794316539052",
      "next_route_id": "1",
      "route": null,
      "sales": [
        [
          1794316547559,
          9.3e+24
        ]
      ],
      "withdrawals": []
    },
    "creditedUsdc": "32558432"
  },
  "ownerAfterRebalance": {
    "balanceYocto": "99696275665960328999999999",
    "accessKeys": [
      {
        "publicKey": "ed25519:HaG9s6pVQfhXDBS6akaVwY7TsPL7Svq5zsDCE5QbEaSB",
        "nonce": 7000010
      }
    ]
  },
  "finishedAt": "2026-11-10T12:11:22.417Z"
}
```
