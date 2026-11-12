# V3 offline exit authorization demo

Status: **passed**. Run: `npm run demo:local:v3`. Shipped production WASM; mock MPC/token/marks; no venue fills.

The configured scenario opening band is $2.50–$10.00. The illustrative true mark is a scenario assumption, not an authenticated observation.

```text
V3 LOCAL SANDBOX | production WASM | MOCK MPC / TOKEN / MARKS | NO FILLS
PASS paused opening rejected ERR_PAUSED; reductions remain eligible
PASS paused keeper exit | supplied $5 | signed IOC buy limit $5.05 | 1.00% above illustrative true mark | reduce-only
PASS out-of-band keeper exit while paused | supplied $50 | signed IOC buy limit $50.5 | 1.00% above illustrative true mark | reduce-only
PASS malicious high mark while paused | supplied $100 | signed IOC buy limit $101 | 102.00% above illustrative true mark | reduce-only
BOUNDARY the 1% cap stops a limit above supplied mark +1%; it does not authenticate the mark, guarantee fills, cap fees or bound total portfolio loss.
SANDBOX stopped; disposable local accounts removed
```

Full calls, receipt hashes, signed payloads, assertions and diagnostics: [demo-local-v3.json](demo-local-v3.json).
