# Counterweight local demo

Status: **passed**. Real recorded market data; local policy execution; mock MPC, token and venue fills.

Run: `npm ci && npm run demo:local`. No runtime network beyond loopback. See [demo boundary](../packages/local-sandbox/README.md) and [known issues](../docs/KNOWN-ISSUES.md).

```text
COUNTERWEIGHT | LOCAL SANDBOX | MOCK MPC / MOCK FILLS | no wallet or testnet account
OFFLINE GUARD active | Node connections restricted to loopback
FIXTURES SHA-256 verified | worst 24h +32.499065% / 4297 windows
WINDOW 2026-09-17T05:00:00.000Z -> 2026-09-18T05:00:00.000Z
POLICY SHA-256 698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289 verified before deploy
MOCK MPC SHA-256 971c4b82a7b2b3a5c34e8693dcf21f448b1457fb4e80a5f64e161f9508c51886 verified before deploy
SETUP local accounts + mock spot 9.3 NEAR | policy access keys: 0
BOUNDARY keeper local key pays 1 yocto MPC fee; spot disposal awaits owner approval
SETUP keeper bounded short SIGNED (mock); pre-existing hedge / simulated margin $30.00
OWNER FROZEN nonce=7000002 balance=99999363944072069900000000 yocto
HOUR (UTC)        NEAR       H USD     KEEPER ACTION          CONTRACT RESULT
09-17 06:00 UTC  $2.6597    10.878   monitor                no transaction
09-17 07:00 UTC  $2.6987    10.307   monitor                no transaction
09-17 08:00 UTC  $2.7248     9.925   monitor                no transaction
09-17 09:00 UTC  $2.7520     9.527   monitor                no transaction
09-17 10:00 UTC  $2.8062     8.733   monitor                no transaction
09-17 11:00 UTC  $2.8098     8.681   monitor                no transaction
09-17 12:00 UTC  $2.8739     7.742   monitor                no transaction
09-17 13:00 UTC  $2.8713     7.781   monitor                no transaction
09-17 14:00 UTC  $2.8750     7.727   monitor                no transaction
09-17 15:00 UTC  $2.8173     8.573   monitor                no transaction
09-17 16:00 UTC  $2.8816     7.631   monitor                no transaction
09-17 17:00 UTC  $2.9751     6.262   monitor                no transaction
09-17 18:00 UTC  $3.0480     5.195   monitor                no transaction
09-17 19:00 UTC  $2.9900     6.045   monitor                no transaction
09-17 20:00 UTC  $3.0520     5.138   monitor                no transaction
09-17 21:00 UTC  $3.0128     5.712   monitor                no transaction
09-17 22:00 UTC  $3.0243     5.544   monitor                no transaction
09-17 23:00 UTC  $3.1435     3.798   monitor                no transaction
09-18 00:00 UTC  $3.1476     3.739   monitor                no transaction
09-18 01:00 UTC  $3.1596     3.564   monitor                no transaction
09-18 02:00 UTC  $3.2299     2.535   reduce-only close      SIGNED mock + event
09-18 03:00 UTC  $3.3684    19.778   spot approval pending  no transaction
09-18 04:00 UTC  $3.5048    19.778   spot approval pending  no transaction
09-18 05:00 UTC  $3.5417    19.778   spot approval pending  no transaction
PASS owner nonce + balance unchanged; keeper reduce-only close signed; spot sale still owner-approved
ROGUE increase beyond caps    REJECT ERR_EXCEEDS_SPOT_HEDGE
ROGUE non-reduce close        REJECT ERR_OPEN_PRICE_OVERRIDE
ROGUE withdraw to rogue       REJECT ERR_CALLER_NOT_OWNER
ROGUE approveAgent            REJECT MethodNotFound
ROGUE replayed nonce/callback REJECT Method on_signature is private
ROGUE stale price             REJECT ERR_STALE_PRICE
ROGUE unrelated rogue account REJECT ERR_CALLER_NOT_KEEPER
DEAD-MAN before timeout REJECT ERR_HEARTBEAT_ACTIVE
DEAD-MAN +601s bystander.testnet -> reduce-only SIGNED mock + event; policy paused
OWNER AFTER nonce=7000002 balance=99999363944072069900000000 yocto (unchanged)
PASS 7/7 rogue attempts rejected | owner untouched | close + dead-man signed
SANDBOX stopped; disposable local accounts removed
REPORTS reports/demo-local.md + reports/demo-local.json (timeline, logs, receipts, assertions)
```

All emitted application lines are above. Full policy logs, receipt hashes, failures, snapshots and raw SDK diagnostics are retained below and in the JSON report.

```json
{
  "schemaVersion": 1,
  "status": "passed",
  "startedAt": "2026-11-10T10:01:35.007Z",
  "offlineGuardActive": true,
  "policySha256": "698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289",
  "mockSha256": "971c4b82a7b2b3a5c34e8693dcf21f448b1457fb4e80a5f64e161f9508c51886",
  "transcript": [
    "COUNTERWEIGHT | LOCAL SANDBOX | MOCK MPC / MOCK FILLS | no wallet or testnet account",
    "OFFLINE GUARD active | Node connections restricted to loopback",
    "FIXTURES SHA-256 verified | worst 24h +32.499065% / 4297 windows",
    "WINDOW 2026-09-17T05:00:00.000Z -> 2026-09-18T05:00:00.000Z",
    "POLICY SHA-256 698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289 verified before deploy",
    "MOCK MPC SHA-256 971c4b82a7b2b3a5c34e8693dcf21f448b1457fb4e80a5f64e161f9508c51886 verified before deploy",
    "SETUP local accounts + mock spot 9.3 NEAR | policy access keys: 0",
    "BOUNDARY keeper local key pays 1 yocto MPC fee; spot disposal awaits owner approval",
    "SETUP keeper bounded short SIGNED (mock); pre-existing hedge / simulated margin $30.00",
    "OWNER FROZEN nonce=7000002 balance=99999363944072069900000000 yocto",
    "HOUR (UTC)        NEAR       H USD     KEEPER ACTION          CONTRACT RESULT",
    "09-17 06:00 UTC  $2.6597    10.878   monitor                no transaction",
    "09-17 07:00 UTC  $2.6987    10.307   monitor                no transaction",
    "09-17 08:00 UTC  $2.7248     9.925   monitor                no transaction",
    "09-17 09:00 UTC  $2.7520     9.527   monitor                no transaction",
    "09-17 10:00 UTC  $2.8062     8.733   monitor                no transaction",
    "09-17 11:00 UTC  $2.8098     8.681   monitor                no transaction",
    "09-17 12:00 UTC  $2.8739     7.742   monitor                no transaction",
    "09-17 13:00 UTC  $2.8713     7.781   monitor                no transaction",
    "09-17 14:00 UTC  $2.8750     7.727   monitor                no transaction",
    "09-17 15:00 UTC  $2.8173     8.573   monitor                no transaction",
    "09-17 16:00 UTC  $2.8816     7.631   monitor                no transaction",
    "09-17 17:00 UTC  $2.9751     6.262   monitor                no transaction",
    "09-17 18:00 UTC  $3.0480     5.195   monitor                no transaction",
    "09-17 19:00 UTC  $2.9900     6.045   monitor                no transaction",
    "09-17 20:00 UTC  $3.0520     5.138   monitor                no transaction",
    "09-17 21:00 UTC  $3.0128     5.712   monitor                no transaction",
    "09-17 22:00 UTC  $3.0243     5.544   monitor                no transaction",
    "09-17 23:00 UTC  $3.1435     3.798   monitor                no transaction",
    "09-18 00:00 UTC  $3.1476     3.739   monitor                no transaction",
    "09-18 01:00 UTC  $3.1596     3.564   monitor                no transaction",
    "09-18 02:00 UTC  $3.2299     2.535   reduce-only close      SIGNED mock + event",
    "09-18 03:00 UTC  $3.3684    19.778   spot approval pending  no transaction",
    "09-18 04:00 UTC  $3.5048    19.778   spot approval pending  no transaction",
    "09-18 05:00 UTC  $3.5417    19.778   spot approval pending  no transaction",
    "PASS owner nonce + balance unchanged; keeper reduce-only close signed; spot sale still owner-approved",
    "ROGUE increase beyond caps    REJECT ERR_EXCEEDS_SPOT_HEDGE",
    "ROGUE non-reduce close        REJECT ERR_OPEN_PRICE_OVERRIDE",
    "ROGUE withdraw to rogue       REJECT ERR_CALLER_NOT_OWNER",
    "ROGUE approveAgent            REJECT MethodNotFound",
    "ROGUE replayed nonce/callback REJECT Method on_signature is private",
    "ROGUE stale price             REJECT ERR_STALE_PRICE",
    "ROGUE unrelated rogue account REJECT ERR_CALLER_NOT_KEEPER",
    "DEAD-MAN before timeout REJECT ERR_HEARTBEAT_ACTIVE",
    "DEAD-MAN +601s bystander.testnet -> reduce-only SIGNED mock + event; policy paused",
    "OWNER AFTER nonce=7000002 balance=99999363944072069900000000 yocto (unchanged)",
    "PASS 7/7 rogue attempts rejected | owner untouched | close + dead-man signed",
    "SANDBOX stopped; disposable local accounts removed",
    "REPORTS reports/demo-local.md + reports/demo-local.json (timeline, logs, receipts, assertions)"
  ],
  "diagnostics": [
    "Receipt: 7YjMCdjDDeG3hMpYQnqixEVbogLKff7rtaKVg24TxJs8",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"init\",\"data\":[{\"owner\":\"owner.testnet\",\"keeper\":\"keeper.testnet\",\"asset_index\":74,\"size_decimals\":1,\"evm_recipient\":\"0x1111111111111111111111111111111111111111\",\"signer_account\":\"mock-mpc.testnet\",\"wnear_account\":\"mock-mpc.testnet\",\"limits\":{\"max_short_size\":\"9300000000000000000000000\",\"per_order_notional_cap\":\"30000000\",\"per_day_notional_cap\":\"30000000\",\"cooldown_seconds\":60,\"price_band_bps\":100,\"price_max_age_seconds\":120},\"heartbeat_timeout_seconds\":600,\"signing_limits\":{\"keeper_per_block\":2,\"keeper_per_window\":8,\"keeper_outstanding\":8,\"owner_per_window\":16,\"window_ms\":60000,\"max_nonce_ahead_ms\":1000}}]}",
    "Receipt: 5Ma9pH4vTPdK7M4jjFv1poK2oqAyWdruFsyFyRnhYjrc",
    "\tLog [mock-mpc.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"deposit\",\"data\":[{\"amount\":\"9300000000000000000000000\",\"sender_id\":\"owner.testnet\"}]}",
    "Receipts: 7UX7x6sxytp5JnGmXmnhvz5uvcGbZszXeMWsAz9J4yCB, 2mt6puAKffXDB3GZsUTsrmavr4eP7N8ujaMkaV3D6Qy9, 3Y8eGJdbCYh8GZBDcfAPPuvB9dYmes6qgeHwYwGR6PzE",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"1\",\"caller\":\"keeper.testnet\",\"kind\":\"Increase\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":false,\"p\":\"2.6462\",\"s\":\"9.3\",\"r\":false,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794304918671,\"expiresAfter\":1794304978671},\"digest\":\"77da3531218fee42d5ab259a5b86704295408c56e7fada8e3cfcea3081d112ce\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
    "Receipt: Bm6Ki1mTcnZyNNXi6joFZVPnrVCnJnqrzQmVM8nXko6Y",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"1\",\"nonce\":\"1794304918671\",\"expiresAfter\":\"1794304978671\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}",
    "Receipt: 6W6ZqBpteJPhpbLY5Ru9RZNhSv2EqPxHu1vZgkRp6yr4",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794304921\"}]}",
    "Receipts: 86GDpDYbgfoP1nRbLk9PQFqUnYC5hcDpzi95Ufdx6oxq, 6YbkaFTbQoKiiPLYP8ign4C2Q88DxVdfQ5QXAxTtbEgV, GrSxa1JMU7GqembdFLwr58pPPETmpWW4yN6ZSn47sU3s",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"2\",\"caller\":\"keeper.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"4.8449\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794304923501,\"expiresAfter\":1794304983501},\"digest\":\"119fad77f6cbe4251abdcd08f5ffcba2073f147ffbb78e9f0a3bc76c515fcd9a\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
    "Receipt: BRrUo6qY8gJtrCMoanyXBbjYy2JKS9S7QXXiLiQHQrdo",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"2\",\"nonce\":\"1794304923501\",\"expiresAfter\":\"1794304983501\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}",
    "Receipts: 7vM14HtV79hLKNNCE4od3ktiX9FyySzntLHEXxzGNxFR, AcWc6c7EF5kip4WHaDQmhiiNjno2FNGaNKCNB8P4aGSt",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_EXCEEDS_SPOT_HEDGE\"}}}}",
    "Receipts: 8WfHB9hN2jcDDJLLxJ1yvBPqGeQLj1TnTGnLNDdMkPdW, 24rQxFEZdUMC8Ko4pnBp9Bj9TVZ81k4ZjcUjKiKsFnoZ",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_OPEN_PRICE_OVERRIDE\"}}}}",
    "Receipts: GvhLk4Z5HBCREbmnSrEN2eC1aRMkwWAz1R7BG4VJBnzo, 8W3WgsxDYXag74WPRpGwWKwJCb24at5yfP78QBGwqFqc",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_CALLER_NOT_OWNER\"}}}}",
    "Receipt: FVHjPBgpfkNC85KudZnz7Zj1gn5PMCGeFA1SsJUiBcJR",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"MethodResolveError\":\"MethodNotFound\"}}}}",
    "Receipt: 2NsAc2kHmKWUrQK4fXsrZPt7xb5sYqvNEPokHMDBxfXq",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: Method on_signature is private\"}}}}",
    "Receipts: D6PwDXgHT1pzHxCdGVFdCquMwvgFcTPAv6aqNq9wjHgH, BgURS8hfRHoJvyJhucb8KDAbKVepoB3Wv3w6q7Cf2RKQ",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_STALE_PRICE\"}}}}",
    "Receipts: 7yncyunjsTaLGD2qQwxhdsCXkh7spoHHaA8rJXBseHGu, 8wm7TBdevZJDb1uKzR7d8UFyTYtRF3LcnZa5MTyBv5nK",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_CALLER_NOT_KEEPER\"}}}}",
    "Receipt: 45bm5dnqwTdNfpRpoBvHFUijr66Tvgk2GYQHgdZdm3kp",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794306237\"}]}",
    "Receipts: FHfdEPUzCeW7mtQkMueF8gp1jrh9BWDK23vuczbQEeAW, GgzecgHRtmqkddgF2sNbPTgciR7sk9CPRuotPfdj49dK",
    "\tFailure [policy.testnet]: Error: {\"index\":0,\"kind\":{\"index\":0,\"kind\":{\"FunctionCallError\":{\"ExecutionError\":\"Smart contract panicked: ERR_HEARTBEAT_ACTIVE\"}}}}",
    "Receipts: 2AvyfPf9dbsKfm76DqPULzWMohHyUAS7SVMhJEiUeS1s, 5rRLZRuoMiEqCbMmL65AKe87Xz8VwhFP4eSRFg9guoeN, 5Nxa8gGBxLawzaQC9P7hF7sQqkP6SRWaEQAR2AFepVoZ",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"pause\",\"data\":[{\"paused\":true,\"reason\":\"recovery\",\"complete\":true}]}",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"3\",\"caller\":\"bystander.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"5.3126\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794307537792,\"expiresAfter\":1794307597792},\"digest\":\"fe3c7130c1e3c27af3fb3c483519bff2e19a10d7b502aec16d3423cd8830ed81\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
    "Receipt: 3YHRxp7yWfo6h7NzQhHQ7sLsd28BBves6NEkmCAMcyWF",
    "\tLog [policy.testnet]: EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"3\",\"nonce\":\"1794307537792\",\"expiresAfter\":\"1794307597792\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
  ],
  "mocked": [
    "MPC signature-shaped response (not cryptographic)",
    "wNEAR token receipt",
    "venue margin, funding settlement and fills",
    "historical executable depth at 5 bps"
  ],
  "boundaries": [
    "H is keeper policy, not a contract oracle",
    "Spot sale requires owner approval; spot remains directional after close",
    "Replay time differs from sandbox block time",
    "Contract signing reservations do not prove fills",
    "Keeper uses disposable local full-access key for the attached MPC fee; policy has zero access keys",
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
        "heartbeat_timeout_seconds": 600,
        "reference_price": "2673000",
        "signing_limits": null
      },
      "transactionHash": "9LR8hutqPhpE969zaQBTDuEC7XZVXFj7yYBFULgmgk1A",
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
      "transactionHash": "1DvffUVdmDRxhkpuMNRmy8dbF6KDPesSzB8pc2dY4Kr",
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
      "transactionHash": "F7iXjx25AJfV5iRJr7DzCAY4wiXoATeNHD3y7FbsQSW3",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"1\",\"caller\":\"keeper.testnet\",\"kind\":\"Increase\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":false,\"p\":\"2.6462\",\"s\":\"9.3\",\"r\":false,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794304918671,\"expiresAfter\":1794304978671},\"digest\":\"77da3531218fee42d5ab259a5b86704295408c56e7fada8e3cfcea3081d112ce\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"1\",\"nonce\":\"1794304918671\",\"expiresAfter\":\"1794304978671\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
      ],
      "errors": []
    },
    {
      "actor": "keeper.testnet",
      "method": "heartbeat",
      "args": {},
      "transactionHash": "2dyAta8wxSmMoSKyhsRte7wrPT9c1fwavZae1QGDHYaE",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794304921\"}]}"
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
          "reference_price": "3229900"
        }
      },
      "transactionHash": "Cg1uhqmBtgXTrcj9eCSTqBaAnnVsVrfL3aSb2JNpgr8G",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"2\",\"caller\":\"keeper.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"4.8449\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794304923501,\"expiresAfter\":1794304983501},\"digest\":\"119fad77f6cbe4251abdcd08f5ffcba2073f147ffbb78e9f0a3bc76c515fcd9a\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"2\",\"nonce\":\"1794304923501\",\"expiresAfter\":\"1794304983501\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
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
      "transactionHash": "CyGc2BEq6hiFzqSXGqZSo5TgtdJtgG68wzkSmFXiWEfx",
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
      "transactionHash": "DhQXPYDDbYUf2QmUxAesYS3HTENpGkq9xxiZy5NizJm8",
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
      "transactionHash": "Cr9NoKbkioCktLSibKmzGE8arCKWXH9aKik6r2vnRdaP",
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
      "transactionHash": "H8JNKyq4yB28iMwvgXvgNGuKKJyyJa3124df8BytyLmd",
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
        "nonce": 1794304923501
      },
      "transactionHash": "DiFg3WeJ1tmjBVsDGEgHtCpqSNwzyKoVhMhG7xBwraGt",
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
      "transactionHash": "CyVxz8c9HQExm9MuhNB5shphUcsDKiHr53rM1KYYDka5",
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
      "transactionHash": "68PsYeoRd4Xw9S3bfkqHK8wESVwR9GQEEMbcptJiziZ4",
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
      "transactionHash": "HimaBXHdMqXwAGX3orft3SCZSFGfdiXFFHjWa8gsZudc",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"heartbeat\",\"data\":[{\"timestamp\":\"1794306237\"}]}"
      ],
      "errors": []
    },
    {
      "actor": "bystander.testnet",
      "method": "deleverage",
      "args": {
        "price": "3541700"
      },
      "transactionHash": "Hu9wowH4itgcWqwkC4YDpPH5SuPQm5uMBv4pn3xnNEas",
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
      "transactionHash": "77HFjVJPHkCg8MYpGXqAS6uzzHzJ8XRV6zMcR9uQ2Fkp",
      "succeeded": true,
      "logs": [
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"pause\",\"data\":[{\"paused\":true,\"reason\":\"recovery\",\"complete\":true}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"request\",\"data\":[{\"id\":\"3\",\"caller\":\"bystander.testnet\",\"kind\":\"Reduce\",\"payload\":{\"action\":{\"type\":\"order\",\"orders\":[{\"a\":74,\"b\":true,\"p\":\"5.3126\",\"s\":\"9.3\",\"r\":true,\"t\":{\"limit\":{\"tif\":\"Ioc\"}}}],\"grouping\":\"na\"},\"nonce\":1794307537792,\"expiresAfter\":1794307597792},\"digest\":\"fe3c7130c1e3c27af3fb3c483519bff2e19a10d7b502aec16d3423cd8830ed81\",\"digest_implementation\":\"HYPERLIQUID_MSGPACK_EIP712_V1\"}]}",
        "EVENT_JSON:{\"standard\":\"counterweight\",\"version\":\"1.0.0\",\"event\":\"signature\",\"data\":[{\"id\":\"3\",\"nonce\":\"1794307537792\",\"expiresAfter\":\"1794307597792\",\"signature\":{\"big_r\":{\"affine_point\":\"021111111111111111111111111111111111111111111111111111111111111111\"},\"s\":{\"scalar\":\"2222222222222222222222222222222222222222222222222222222222222222\"},\"recovery_id\":0}}]}"
      ],
      "errors": []
    }
  ],
  "ownerBefore": {
    "balanceYocto": "99999363944072069900000000",
    "accessKeys": [
      {
        "publicKey": "ed25519:6cUexr4LnLQibHnxxUWfgertMZ5J9fkppdqPVWo1Tm78",
        "nonce": 7000002
      }
    ]
  },
  "timeline": [
    {
      "hour": 1,
      "time": 1789624800000,
      "nearPrice": 2.6597,
      "headroomUsd": 10.877638973124999,
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
      "headroomUsd": 10.306695721374998,
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
      "headroomUsd": 9.924709683624997,
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
      "headroomUsd": 9.526614360250006,
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
      "headroomUsd": 8.733039861625006,
      "venueEquityUsd": 28.739194361625007,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 6,
      "time": 1789642800000,
      "nearPrice": 2.8098,
      "headroomUsd": 8.681029404153165,
      "venueEquityUsd": 28.706434904153166,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 7,
      "time": 1789646400000,
      "nearPrice": 2.8739,
      "headroomUsd": 7.742451305028167,
      "venueEquityUsd": 28.110631555028167,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 8,
      "time": 1789650000000,
      "nearPrice": 2.8713,
      "headroomUsd": 7.780994479057197,
      "venueEquityUsd": 28.1352712290572,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 9,
      "time": 1789653600000,
      "nearPrice": 2.875,
      "headroomUsd": 7.7271325990571995,
      "venueEquityUsd": 28.1011950990572,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 10,
      "time": 1789657200000,
      "nearPrice": 2.8173,
      "headroomUsd": 8.572627509682198,
      "venueEquityUsd": 28.638139259682198,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 11,
      "time": 1789660800000,
      "nearPrice": 2.8816,
      "headroomUsd": 7.631273819668433,
      "venueEquityUsd": 28.040629819668435,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 12,
      "time": 1789664400000,
      "nearPrice": 2.9751,
      "headroomUsd": 6.262067474293438,
      "venueEquityUsd": 27.171414724293438,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 13,
      "time": 1789668000000,
      "nearPrice": 3.048,
      "headroomUsd": 5.195138822653364,
      "venueEquityUsd": 26.494318822653366,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 14,
      "time": 1789671600000,
      "nearPrice": 2.99,
      "headroomUsd": 6.0454282084274755,
      "venueEquityUsd": 27.03445320842748,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 15,
      "time": 1789675200000,
      "nearPrice": 3.052,
      "headroomUsd": 5.137630679677478,
      "venueEquityUsd": 26.45820067967748,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 16,
      "time": 1789678800000,
      "nearPrice": 3.0128,
      "headroomUsd": 5.71217377463698,
      "venueEquityUsd": 26.82312177463698,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 17,
      "time": 1789682400000,
      "nearPrice": 3.0243,
      "headroomUsd": 5.544077867261974,
      "venueEquityUsd": 26.716522117261977,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 18,
      "time": 1789686000000,
      "nearPrice": 3.1435,
      "headroomUsd": 3.798447418886976,
      "venueEquityUsd": 25.60831366888698,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 19,
      "time": 1789689600000,
      "nearPrice": 3.1476,
      "headroomUsd": 3.7394374455415402,
      "venueEquityUsd": 25.571228445541543,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 20,
      "time": 1789693200000,
      "nearPrice": 3.1596,
      "headroomUsd": 3.5644076604668378,
      "venueEquityUsd": 25.46036866046684,
      "proposals": [],
      "action": "monitor",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 9.3
    },
    {
      "hour": 21,
      "time": 1789696800000,
      "nearPrice": 3.2299,
      "headroomUsd": 2.5350557488418373,
      "venueEquityUsd": 24.80694599884184,
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
      "hour": 22,
      "time": 1789700400000,
      "nearPrice": 3.3684,
      "headroomUsd": 19.77840983234184,
      "venueEquityUsd": 24.77840983234184,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 23,
      "time": 1789704000000,
      "nearPrice": 3.5048,
      "headroomUsd": 19.77840983234184,
      "venueEquityUsd": 24.77840983234184,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    },
    {
      "hour": 24,
      "time": 1789707600000,
      "nearPrice": 3.5417,
      "headroomUsd": 19.77840983234184,
      "venueEquityUsd": 24.77840983234184,
      "proposals": [],
      "action": "spot approval pending",
      "result": "no transaction",
      "simulatedShortQuantityAfter": 0
    }
  ],
  "ownerAfterReplay": {
    "balanceYocto": "99999363944072069900000000",
    "accessKeys": [
      {
        "publicKey": "ed25519:6cUexr4LnLQibHnxxUWfgertMZ5J9fkppdqPVWo1Tm78",
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
    "balanceYocto": "99999363944072069900000000",
    "accessKeys": [
      {
        "publicKey": "ed25519:6cUexr4LnLQibHnxxUWfgertMZ5J9fkppdqPVWo1Tm78",
        "nonce": 7000002
      }
    ]
  },
  "finalState": {
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
    "last_keeper_heartbeat": "1794306237",
    "heartbeat_timeout_seconds": 600,
    "reference_price": "2673000",
    "reference_price_timestamp": "1794304913",
    "last_nonce": "1794307537792",
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
        "nonce": 1794307537792,
        "expires_after": 1794307597792,
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
    "last_open_expiry": "1794304978671",
    "keeper_weight_used": "15",
    "keeper_weight_limit": "5000",
    "mpc_fee": "1",
    "signer_gas_tgas": 230,
    "callback_gas_tgas": 30
  },
  "assertions": {
    "keeperCloseSigned": true,
    "rogueRejected": 7,
    "ownerUntouched": true,
    "ownerTransactionsAfterFreeze": 0,
    "freshContractNonces": true,
    "earlyDeadmanRejected": true,
    "unrelatedDeadmanSigned": true,
    "policyHasNoKeys": true,
    "conservativeExposureRetained": true
  },
  "finishedAt": "2026-11-10T10:02:40.448Z"
}
```
