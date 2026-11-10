# Counterweight demo script

Lead with the **keyless funded testnet lifecycle**, recorded 2026-11-10 on
`policy-v2.counterweight-samet.testnet`. This is a recording plan, not a claim that a video already exists.
Open the [summary and exact transaction links](evidence/2026-11-10-lifecycle-summary.md),
[NEAR policy](https://testnet.nearblocks.io/address/policy-v2.counterweight-samet.testnet) and
[derived Hyperliquid testnet address](https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390).
Use the [README quickstart](../README.md); inspection requires no wallet or transaction.
Do not record keychains, credentials or secret environment values. Keep testnet, historical and mock labels visible.

## Main cut: 2 minutes 30 seconds

| Edit time | Screen | Narration |
|---|---|---|
| 0:00–0:25 | Web hero and Funded testnet lifecycle table. Open key-deletion explorer link; show `npm run testnet:verify` v2 checks. | “A keyless NEAR policy completed a funded Hyperliquid testnet lifecycle. The policy held 4 wNEAR. Owner funding preceded key removal; keeper trading and withdrawal followed it. Public verification checks the committed code, zero access keys, configuration and derived address. The old v1 account is only a rehearsal with a key.” |
| 0:25–0:55 | Open [owner transfer](https://testnet.nearblocks.io/txns/FnEqLsBCYzBFx7E9Mn7EXWHQJFyWbncVBNafUNGLDmp3), [keeper open](https://testnet.nearblocks.io/txns/2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd) and [close](https://testnet.nearblocks.io/txns/65WWr7W1DSvDKLGjF8tVZJtzYzwL6NX8DGfh7QZeL8JW); compare saved fills. | “UI Send lands in spot. The owner separately authorized a contract-signed 49 USDC transfer to perps. The keeper opened a bounded IOC short of 3.5 NEAR at 3.5121 and closed it reduce-only at 3.5212. The public fill records and position check showed flat.” |
| 0:55–1:15 | [Settlement](https://testnet.nearblocks.io/txns/FDepMaKNUmLZP8g6DzXzVcUsqV91V6Borv9Rh8uKNob8), [withdraw3 request](https://testnet.nearblocks.io/txns/9cWjW9vYfWvWgrvPAk2EZNrhWxxdfFZ52EoMou5PKK25), and [withdrawal ledger](https://app.hyperliquid-testnet.xyz/explorer/tx/0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0). Refresh live testnet position/margin/ledger. | “The owner settled reserved exposure and approved a fixed-recipient withdrawal. The signed amount was 47.957074 USDC; the ledger records 46.957074 net plus a 1 USDC fee. Destination-chain arrival is unverified. Live reads are separate from these dated records.” |
| 1:15–1:50 | `npm run demo:local`: offline guard, local keyless setup, keeper close, seven rejected rogue attempts, dead-man and OWNER RESUMED phase. | “The local sandbox exercises contract boundaries with mocked MPC, tokens, fills and route receipts. Keeper opens are bounded; closes are reduce-only. The autonomous phase leaves the owner untouched. The owner then resumes, attests settlement and approves mock spot disposal. This demonstrates local enforcement, not another live route.” |
| 1:50–2:15 | `npm run replay`; results table and historical simulation labels. | “The replay uses recorded mainnet markets with simulated execution. The small allocation loses to costs. Larger examples are positive in this window; the always-hedged comparator has unfunded margin losses. This retrospective holdout and zero proxy breaches do not promise returns or solvency.” |
| 2:15–2:30 | Lifecycle limitations, retained spot and expired Intents dry quote. | “The funded run was supervised: owner funding, observations, settlement and withdrawal approval were required. Venue state is not verified on-chain. The retained spot remains directional. Intents has dry quotes only; no live rebalancing route, multi-day carry or mainnet operation is proven.” |

## Short cut: 45 seconds

| Edit time | Screen | Narration |
|---|---|---|
| 0:00–0:12 | Funded lifecycle table, v2 zero-key verification and derived-address explorer. | “A keyless NEAR policy completed a funded Hyperliquid testnet lifecycle with contract-signed actions and 4 wNEAR custody.” |
| 0:12–0:30 | 49 USDC transfer, 3.5 NEAR open/close fills and withdrawal ledger. | “Owner funding arrived in spot, then moved to perps. The keeper short opened at 3.5121 and closed reduce-only at 3.5212, flat. The fixed-recipient withdrawal ledger records 46.957074 USDC net.” |
| 0:30–0:45 | Live testnet panel and limitations; README reproduction commands. | “This was supervised testnet execution. Owner observations remain trusted; bridge arrival is unverified. Intents has dry quotes only, and multi-day carry is unproved. Reproduce public checks without signing.” |

Edit times are production choices, not measured runtimes. Wait for commands to finish and edit pauses honestly.
If a public read fails, show its unavailable state or the clearly dated source evidence.
The [claims index](CLAIMS.md) maps factual statements to records and tests. Use actual output, not fabricated transcripts.
