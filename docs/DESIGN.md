# Counterweight design (agreed 2026-11-09)

Testnet only (decision 2026-11-09: no real funds). NEAR testnet + Hyperliquid testnet; NEAR Intents 1Click only as
`dry: true` quotes (Intents has no testnet). One human (Samet) owns the NEAR account and approves owner actions.
AI agents never see or handle private keys.

Sources: architecture review (part A), cross-review with the merged design (part B), product/demo plan (part C).
Where A and B differ, B wins.

---

# Part B — cross-review and merged design

## 3. Is "Samet approves every transaction" fatal?

**It isn't fatal, but it caps the result in the defi track.** It turns the contract into an expensive 1-of-1 multisig and contradicts both the track tagline and T2's demo. The answer is **tiered authority enforced at the signing step**, not "trust the keeper."

**Owner (Samet's NEAR account), one-time approvals:**
- Sets the configuration: market, derivation path, fixed NEAR/Arbitrum recipients, caps.
- Deposits wNEAR and approves a **risk budget**: a lifetime ceiling on opened quantity for this "epoch."
- Is the only one who can reset the epoch, unpause, or change settings. (Config is immutable after full-access keys are removed, as T1 proposes, so a change means a new contract.)

**Keeper (contract checks the caller is the keeper; the keeper's own key has function-call access only), no human needed:**
- **Increase the short:** allowed only if lifetime opened size plus the new order stays within the wNEAR the contract holds. Further limits: a per-order notional cap, a daily cap, a cooldown, and IOC orders with a contract-built price limit. The contract counts *signed* opens, not fills, so the bound stays conservative even if the keeper lies about fills.
- **Reduce-only orders** (the contract hard-codes the order's reduce-only flag `r=true`): any size, any time. They can never add exposure.
- **Cancel orders**, and **reduce-only stop / take-profit triggers**.
- **`withdraw3` to the owner's fixed Arbitrum address only.** It's safe to let the keeper trigger this, because the funds can only go to Samet.

**Anyone, as a dead-man switch:**
- If the keeper's heartbeat has been stale for N hours, *anyone* can call `deleverage()`. That makes the contract sign a reduce-only market close. This is the "unstoppable" property: de-risking can't be switched off.

**Never possible, with no method for it:** `usdSend`, `spotSend`, `approveAgent`, vault transfers, signing an arbitrary digest, or sending to any recipient that isn't fixed.

**Worst case if the keeper is compromised, and you can compute it.** The keeper can churn: open within the caps, then close. The damage is bounded by:

*daily op cap × per-op notional × (taker fee + price band)*

The README should publish this number for the deployed config. That answers Eddy's "maximum damage" question with a formula, not an adjective.

**Signing details to get right:**
- The contract sets the nonce to the current block time. Hyperliquid rejects stale nonces (the exact window is UNVERIFIED, about 2 days), which limits how long the keeper can hold a signature before using it.
- Use `expiresAfter` where Hyperliquid supports it (UNVERIFIED for each action type).

**Spot leg after a stop:** the wNEAR stays in the contract and the position is directional. In v1, selling the spot stays owner-approved, and the README says so. Only if time allows: a keeper-callable 1Click sale with a minimum-out bound and verified quote.

**New demo moment.** Run the keeper from its own terminal, with the wall clock and an untouched wallet in view. A funding flip is replayed against the live keeper (not faked on-chain), and it closes the position with a reduce-only signature. NearBlocks shows the request and Hyperliquid shows the fill. Then a "rogue keeper" script tries three things:
- open more than the wNEAR held → `ERR_EXCEEDS_SPOT_HEDGE`
- withdraw to an attacker address → no such method
- sign a raw hash → no such method

---

## 4. Differentiation vs ZeroDelta, Lemon, Liminal and Ethena

**Not strong enough as written.**
- "Real funds" is fragile and only worth $25.
- "Keyless custody" is already used by Lemon (NEAR-derived wallets) and by the Chain Signatures crowd (Handover, Satchel, near-policy-vault).
- "Honest returns" is hygiene, not a differentiator.

**The sharper angle: risk rules enforced at the signing step, so the operator can de-risk but can never add risk or move money.**
- **Liminal:** the agent key has full trading authority.
- **Lemon:** NEAR-derived agent wallets; the docs reviewed don't show on-chain trading policy (UNVERIFIED).
- **ZeroDelta:** simulated TEE, no funds moved.
- **Ethena:** custodial pool.

Counterweight would be the one where *the venue's only signer is a contract enforcing risk policy*. That generalises beyond carry trades ("give your DAO or AI agent a Hyperliquid account it can't blow up"). It matches Illia's "Never Get Liquidated" and "Delta-Neutral Anything" ideas, as T2 cites them, without becoming an agent-track toy. Proposed tagline: **"Reduce-only by construction."**

---

## 5. Final merged design

1. **Asset:** NEAR. The contract holds the wNEAR spot; a Hyperliquid NEAR perp short hedges it. No LSTs, no other assets.
2. **Venue:** Hyperliquid perps. The asset index is looked up from `meta` at runtime and rejected if the market changed.
3. **Custody:** one NEAR policy contract per owner. Full-access keys removed after validation, no upgrade path. Code hash and key list published.
4. **Signing:** `v1.signer` Chain Signatures from the contract account. The contract builds every Hyperliquid payload itself from typed inputs. No agent key, no raw-hash signing.
5. **Authority tiers:** as in §3. The owner sets config and budgets. The keeper does bounded increases plus unlimited reduce-only actions. Anyone can deleverage after a heartbeat timeout.
6. **Hard rules (on-chain):**
   - short size ≤ wNEAR held, counted on signed orders
   - per-order and per-day caps, cooldowns
   - orders carry a contract-built price limit
   - always-allowed withdrawals go only to the fixed owner addresses
7. **Soft rules (keeper, labelled as such):** current leverage ≤ 1× (0.83× at the demo size), the stress-headroom test H > 0, entry blocked when funding is non-positive or data is stale, exit after 6 negative funding hours, reconciliation after every action.
8. **Funding:** live 1Click deposit to Hyperliquid perps USDC, showing PENDING/SUCCESS/REFUNDED/FAILED states and a "where are my funds" tracker (track requirement). Dry-quote mode for judges. Fees always taken from the quote.
9. **Budget:** $75–100. The losing live run is shown honestly next to the computed break-even size.
10. **Demo moment:** the keeper closes the position autonomously with a reduce-only signature while Samet's wallet stays untouched, then the three rogue-keeper attempts are rejected. One 1× liquidation-distance chart (about 90–110% away, from T1's math), no "zero-short lock."
11. **Wording:** "no single party holds the key," never "no key exists." State plainly that Hyperliquid positions are public. Use T2's legal disclaimers.
12. **Tracks:** primary **defi**. One secondary: **open** for safest fit, or **security**, which fits "signing-step policy" but is crowded. Skip **business**. Skip privacy and agents. Whether multiple tracks are allowed per submission is UNVERIFIED in what I read.
13. **Reproducibility:**
    - `npm ci && npm test && npm run replay`: offline, no keys, prebuilt `.wasm` checked by hash
    - `make contract`: sandbox tests with a clearly labelled mock signer
    - `npm run verify:live`: re-derives the address, checks the published transactions and fills on public APIs
14. **Honest stats:**
    - 180-day hourly funding and candles, frozen fixtures with a SHA-256 manifest
    - worst real moves picked mechanically, plus a labelled synthetic +50% gap
    - net = spot + perp + funding − all costs, measured against all capital deployed
15. **CLAIMS.md:** every README or video claim maps to a test or an explorer link. Anything unproven is marked UNVERIFIED or removed.

### Top 5 risks

| Risk | Owner | Mitigation |
|---|---|---|
| MPC → Hyperliquid signature rejected (MessagePack/EIP-712 bytes, recovery `v`, number formatting) | Codex (signing package) + Claude Code (contract) | Golden vectors from the official SDK on 10 Nov. Accepted testnet action by 11 Nov, or fall back to replay plus testnet. |
| Hyperliquid eligibility or KYC for a Turkey-based user; local law | **Samet** | Decide before any funding. If no, submit testnet plus mainnet 1Click dry quotes only (Q-010/Q-012), and say so. |
| Keeper-authority bugs (signed-vs-filled accounting, nonce replay, dead-man griefing) | Claude Code | Sandbox tests for each attack. Conservative accounting by signed orders. Publish the max-damage formula. |
| README/video overclaims caught by the AI screener | Antigravity (docs/demo) | CLAIMS.md gate. All numbers generated from reports. Final audit pass against the code on 13 Nov. |
| Schedule slip leaves no time for the fresh-machine test, video and X post | Samet + Claude Code | Freeze scope at end of 12 Nov. Clean-clone run on 13 Nov. Submit by 14 Nov 20:00 UTC. Cut in T1's order. |


---

# Part A — architecture

**Decision: build Counterweight as an individual NEAR carry account: wNEAR spot held by a NEAR contract, matched by a USDC-margined Hyperliquid NEAR short. Use Chain Signatures for every external authorization, with no agent wallet in v1.**

Samet approves each mainnet transaction. The keeper proposes deterministic actions and relays signatures. This delivers a supervised vault prototype; unattended operation is a later capability.

Checked **9 November 2026**. All requested files were read; none were modified. Current documentation verifies the components, but **the complete MPC → Hyperliquid integration remains untested**. Live market-data retrieval failed with `ENOTFOUND`; recent funding, executable liquidity and empirical returns remain **UNVERIFIED**.

```text
Samet's NEAR wallet
  | deposits wNEAR; approves each mainnet operation
  v
NEAR policy contract — one owner, one strategy
  | holds wNEAR spot
  | fixes withdrawal recipients, limits and signing payloads
  |
  +--> v1.signer MPC --> signature --> TS relayer
  |                                      |
  |                                      v
  |                              Hyperliquid derived address
  |                              USDC collateral + NEAR short
  |
  +--> owner-approved 1Click route --> USDC perps funding

Public market/account APIs --> deterministic keeper --> action proposal
Recorded fixtures ---------> same engine -----------> replay/report/UI
```

**1. Account control and signing**

Derive the Hyperliquid master address from **the contract’s NEAR account**, an immutable strategy path and the MPC public key. Deriving it from Samet’s personal NEAR account would give that account independent signing authority. Mainnet’s documented signer is `v1.signer`. [NEAR signing implementation](https://docs.near.org/chain-abstraction/chain-signatures/implementation)

**MPC compatibility is a supported architectural inference, not a verified integration.** Hyperliquid uses recoverable ECDSA signatures; its official SDK distinguishes:

- Orders: MessagePack action hash, wrapped in the EIP-712 “phantom agent” payload.
- `approveAgent`, `withdraw3` and transfers: action-specific user-signed EIP-712 payloads.

The contract must construct the exact digest, request MPC signing, format `{r,s,v}`, and verify recovery to its derived address. Golden vectors must match the official SDK byte-for-byte. Signing an order’s JSON hash would be incorrect. [Signing guidance](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing), [official signing implementation](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/hyperliquid/utils/signing.py)

**Agent permissions:** the official example authorizes trading/order management and expressly excludes transfers and withdrawals. That is still authority to lose collateral through trading; it is insufficient to enforce our market, size and price rules. Agents also have signer-specific nonce and revocation/replay considerations. [Official agent example](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/examples/basic_agent.py), [nonces and agents](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets)

**V1 choice: no Hyperliquid agent key anywhere.** Samet holds the NEAR wallet key; MPC holds distributed shares of the external signing key. Samet approves the NEAR request, and MPC produces the external signature.

Cut TEE integration. NEAR AI Cloud’s documented verification concerns inference requests; it does not establish custody of our bot. OutLayer supports enclave-generated secrets and execution measurements, but those would require a separate implementation and audit. [NEAR AI verification](https://docs.near.ai/cloud/verification/index), [OutLayer secrets](https://app.outlayer.ai/docs/secrets)

Screeners can inspect contract code, access keys, immutable configuration, signature vectors and transaction evidence. They cannot infer safe custody from a TEE logo.

**2. Funding, withdrawals and budget**

**The earlier 1Click claim is verified:** specifying Hyperliquid USDC as `destinationAsset` and the derived `0x` address as recipient credits **perps**, not spot or HyperEVM. The documented asset ID is:

`1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054`

Discover supported tokens at runtime and validate that identifier before quoting. A deposit funds collateral; opening the short is a separate signed action. [Hyperliquid integration](https://docs.near-intents.org/integration/distribution-channels/1click-api/hyperliquid)

Use separate capital: **retain the spot quantity and supply additional USDC margin**. Selling all deposited NEAR to fund margin would defeat the strategy.

For returning collateral through Intents, quote Hyperliquid USDC as origin, then send to the quote’s HyperCore deposit address. Documentation specifies a **0.5 USDC minimum**, **0.2 USDC deposit fee**, and additional network fees. Prefer `sendAsset`; the documented `usdSend` path additionally deducts 1 USDC and requires adjusted funding. [Return-route instructions](https://docs.near-intents.org/integration/distribution-channels/1click-api/hyperliquid)

For v1, implement the simpler withdrawal first: contract-authorized `withdraw3` to Samet’s **fixed Arbitrum recipient**. The documented legacy bridge has a 5 USDC deposit minimum; current documentation marks it deprecated and prefers CCTP. Keep it as a tested compatibility path, not the funding architecture. [USDC bridge documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/usdc)

Costs to budget:

- Minimum opening order: **$10**. [Order errors](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/error-responses)
- New HyperCore destination activation: **1 quote token**. [Activation fee](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/activation-gas-fee)
- Base perp taker/maker: **0.045% / 0.015%**; use actual account fees when reporting. [Trading fees](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees)
- Current 1Click documentation: **additional 0.25% without authentication**; authenticated defaults are 0.20%, or 0.01% for stablecoin/same-asset routes. This differs from supplied Q-006’s 0.2%. Use the returned quote’s complete economics. [1Click fees](https://docs.near-intents.org/resources/fees)

**Smallest budget I would schedule: $75 equivalent**—$25 spot, $30 credited margin, $20 for fees, NEAR storage/signing and retries. Prefer $100. This is a planning allowance, not a verified all-inclusive quote. A tiny demonstration will likely lose money after fixed costs; show that honestly.

**3. Asset selection**

**Choose NEAR, held as wNEAR by the contract on NEAR.** Keep operating NEAR separate from the hedged quantity. The official 1Click token flow documents `nep141:wrap.near`. [Token discovery and routing](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request)

BTC, ETH, SOL and NEAR all appear in current official mainnet margin tables. Nevertheless, execution must discover `meta`, resolve the asset index and reject delisted or changed markets. [Margin tables](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-tiers)

NEAR wins on implementation scope: one local spot ledger and one external signing integration. SOL requires another native-chain execution path; BTC requires another settlement model; ETH adds an external spot transaction/gas path. Avoid Rhea LSTs: their exchange-rate and redemption behavior would add another basis to measure.

**This is an engineering choice, not a verified yield/liquidity ranking.** Before funds, collect trailing 7/30-day funding and measure executable depth for all four candidates. For NEAR, require entry/exit book impact below a proposed 25 bps limit at demo size.

**4. Deterministic risk engine**

Define leverage as **current short notional / current venue equity**, rather than trusting the UI setting. Enter at ≤1×; proposed demo sizing is $25/$30 = **0.83×**.

At every reconciled observation, require:

\[
H = E - 0.5N - MM(1.5N) - R > 0
\]

Here \(E\) is venue equity, \(N\) current short notional, \(MM\) actual tiered maintenance, and \(R=\max(\$5,10\%N)\) is our proposed funding/execution reserve.

For the documented small NEAR tier, maintenance is 5%. A $25 short with $30 equity leaves **$10.625 stress headroom** after a +50% move and $5 reserve. This calculation assumes unchanged margin rules and excludes additional losses beyond that reserve. [Maintenance tiers](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-tiers)

Proposed rules, fixed before backtesting:

- Block entry on stale data, unresolved orders, nonpositive trailing 24-hour funding, or failed stress/depth checks.
- Begin full unwind when \(H<10\%N\); v1 avoids fractional reductions that create minimum-order dust.
- Install venue-native **reduce-only buy stop protection**, then read it back. Replace protection after every partial fill or size change.
- Six consecutive negative hourly funding observations trigger an exit proposal.
- Reconcile balances, fills, funding, open orders and position size after every action and periodically. Unknown order state blocks retries that could duplicate exposure.
- On unexpected short reduction, including venue ADL, stop entry and propose selling matching spot.

Hyperliquid stops trigger on mark price and can slip or fail to fill; partial parent-order cancellation can remove child protection. Install protection against the confirmed position. [TP/SL behavior](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/take-profit-and-stop-loss-orders-tp-sl)

Venue ADL can involuntarily close profitable positions. It is distinct from our voluntary unwind. [ADL specification](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/auto-deleveraging)

**Operational limit:** Samet’s signature requirement prevents unattended keeper transactions. Preauthorized venue stops remain active, but a stop can leave directional spot until Samet approves its sale. Never promise uninterrupted neutrality, unlimited squeeze survival or emergency bridge rescue. [Liquidation mechanics](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations)

**5. Contract scope**

Implement Rust `near-sdk-rs` with one strategy account per owner and these enforceable boundaries:

- Fixed owner, market, derivation path and NEAR/Arbitrum withdrawal recipients.
- Owner-only withdrawals; quantity/notional limits; bounded order prices; monotonic operation identifiers.
- Canonical signing payload construction. **No arbitrary digest-signing endpoint.**
- Pause blocks new risk; close/cancel/owner withdrawal paths remain available.
- One pending operation per execution phase; callbacks cannot silently reset uncertain actions.
- Structured events for requests, signatures, reconciliation acknowledgements, pauses and withdrawals. [NEAR events](https://docs.near.org/smart-contracts/anatomy/events)

After validation, remove contract-account full-access keys and expose no upgrade or generic self-call method. Full-access keys can replace code and bypass policy. Publish code hash and key-list evidence. [NEAR access permissions](https://docs.near.org/protocol/accounts-contracts/access-keys)

The keeper handles observations, risk calculations, quotes, submission and reconciliation. **The contract does not independently prove Hyperliquid equity or fills.** V1 acknowledgements are owner-approved observations, explicitly a trust boundary.

Dynamic 1Click deposit addresses require exact owner approval, amount/expiry binding and quote-signature verification in the client. Until that verification is enforced on-chain, describe recipient validation as owner-reviewed—not a cryptographic contract guarantee. [Quote verification](https://docs.near-intents.org/integration/distribution-channels/1click-api/verify-quote-signature)

**6. What screeners can run without funds**

Make these separate, explicit modes:

- **`make demo`:** install pinned dependencies, build WASM, run local contract tests, replay committed data, generate a net-return report and launch the small UI. After installation, market replay requires no internet, wallet, API key or funds.
- **`make dry`:** fetch public observations and `dry:true` 1Click quotes; print action proposals and costs. It never requests signatures or submits transactions. Dry quotes create no deposit address. [Quote API](https://docs.near-intents.org/api-reference/oneclick/request-a-swap-quote)
- **Contract sandbox:** test ownership, recipient rejection, limits, pause, duplicate operations and failed callbacks using a clearly labelled mock signer. Sandbox validates contract behavior, not the live MPC network. [NEAR integration testing](https://docs.near.org/smart-contracts/testing/integration-test)

Include SHA-256 fixture manifests, capture timestamps, source requests, expected outputs and a claim-to-test/evidence index. Clearly distinguish **recorded live data**, **simulated execution**, and **actual funded execution**.

Q-007 has independent documentation confirmation: Intents has no testnet. Q-010/Q-012 permit the testnet/local fallback in the supplied rules. Q-017 makes reproducibility essential; current event FAQ also confirms AI screening. The live rules Markdown could not be extracted here, so recheck before submission. [Intents quickstart](https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/introduction), [event rules](https://nearhackathon.com/HACKATHON.md), [current event FAQ](https://nearhackathon.com/)

**7. Honest historical evidence**

Use public `POST https://api.hyperliquid.xyz/info`:

- `fundingHistory`: coin and millisecond start/end times.
- `metaAndAssetCtxs`: market context.
- `clearinghouseState` and `userFunding`: funded-account reconciliation. [Perpetual endpoints](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals)

Use `candleSnapshot` for perp prices, respecting its **latest 5,000 candles** limit. Use Coinbase’s public `/products/{product_id}/candles` for independent spot prices after verifying the product exists. [Hyperliquid market endpoints](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint), [Coinbase candles](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles)

Backtest a frozen 90-day window ending before evaluation. Select the largest observed upward one-hour and 24-hour moves mechanically; publish their dates and raw data. Add a separately labelled synthetic +50% gap. Missing historical mark/book data means liquidation and fill results remain approximations. Hyperliquid’s archive explicitly warns of missing data and delayed updates. [Historical archive](https://hyperliquid.gitbook.io/hyperliquid-docs/historical-data)

Report spot PnL + perp PnL + signed funding − trading, routing, spread, slippage, gas/signing and infrastructure costs. Divide returns by **spot plus collateral plus operating capital**. Include negative-funding hours, drawdown, minimum stress headroom, unmatched exposure and data gaps.

**No observed APY or profitable backtest is established in this report.**

**Verification ledger**

| Claim | Verified? | Source |
|---|---|---|
| NEAR contracts can obtain external signatures | Yes | [NEAR](https://docs.near.org/chain-abstraction/chain-signatures/implementation) |
| Our MPC signatures execute Hyperliquid actions | UNVERIFIED integration | [Signing requirements](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing) |
| Agent cannot transfer/withdraw | Yes | [Official SDK example](https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/master/examples/basic_agent.py) |
| 1Click credits Hyperliquid perps | Yes | [Integration](https://docs.near-intents.org/integration/distribution-channels/1click-api/hyperliquid) |
| NEAR/SOL/BTC/ETH perps documented | Yes; runtime check required | [Margin tables](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-tiers) |
| Recent funding/liquidity ranking | UNVERIFIED; DNS failure | [Public endpoints](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals) |
| Stops guarantee execution | No | [TP/SL limits](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/take-profit-and-stop-loss-orders-tp-sl) |
| Profitable net returns | UNVERIFIED | Historical analysis required |
| Turkish-resident eligibility/KYC | UNVERIFIED | [Official terms](https://app.hyperliquid.xyz/terms) |

**8. Stack, schedule and cuts**

Use a standalone GitLab Counterweight repository. Proposed layout:

```text
contracts/policy/        Rust contract + sandbox tests
packages/domain/        schemas, accounting, deterministic risk
packages/hyperliquid/   codecs, signing vectors, API adapter
packages/intents/       quotes, verification, status tracking
apps/keeper/            proposals, reconciliation, relaying
apps/web/               balances, risk, evidence, approval preview
fixtures/               recorded data + provenance
reports/ scripts/ docs/ Makefile .gitlab-ci.yml
```

TypeScript strict ESM, zod, pino, vitest; React/Vite for the small UI. Reuse the existing weighted limiter as disclosed baseline code. No LLM sits in the risk or signing path.

1. **10 Nov — prove the signing boundary.** Contract rejects arbitrary destinations/hashes; sandbox passes. Demonstrate MPC recovery and an accepted Hyperliquid testnet action on an available test market. Capture market/funding data. **If external signing fails, freeze the live claim.**
2. **11 Nov — complete supervised lifecycle.** Deposit → collateral confirmation → short → verified stop → close → withdrawal in tests. Samet performs a tiny mainnet funding/withdrawal round trip only after eligibility and budget checks.
3. **12 Nov — execution and failure recovery.** If entry conditions permit, record the funded NEAR hedge. Exercise restart, timeout, partial-fill and reconciliation failures. Produce stress replays.
4. **13 Nov — independent reproduction.** Fresh-machine `make demo` works without credentials; historical report includes costs and losses. Freeze scope and capture evidence.
5. **14 Nov — release and submit.** Finish README, LICENSE, baseline disclosure, video and evidence links. Samet approves publication and submission payload. Target **20:00 UTC**, ahead of **23:59 UTC**.

Cut in order: TEE/privacy, multiple assets, pooled shares, LSTs, portfolio margin, automated Intents withdrawals, hosting polish. Never cut withdrawal enforcement, reconciliation, stop verification or reproducibility. If live execution misses its gate, submit a clearly labelled testnet/replay prototype.

The supplied competitor review already rules out “no competitors.” Counterweight’s defensible demonstration is **enforced withdrawal policy, a verifiable funded lifecycle and honest failure/return reporting**.

**Only Samet must resolve**

- Which NEAR owner account and fixed Arbitrum withdrawal address will he use?
- Is the total allocation $75 or $100, and what loss ceiling is acceptable?
- Can he confirm eligibility from his actual location/citizenship and current Hyperliquid terms, including any verification requirement? The official terms page returned no readable text and browser access was unavailable; **I cannot verify Turkey’s status, KYC requirements or local-law permissibility from primary evidence here.** Keep mainnet funding gated on that answer.

---

# Part C — product, demo and README plan

# Counterweight — Product Spec & Jury-Winning Pitch Playbook

**Baseline sources:** [baglam.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/baglam.md), [HACKATHON.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/kaynak/HACKATHON.md) ([live](https://nearhackathon.com/HACKATHON.md)), [01-defi.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/kaynak/track-ornekleri/01-defi.md), [out-a1-rekabet.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/out-a1-rekabet.md), [finalistler.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/finalistler.md), [out-d3-pitch-juri.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/out-d3-pitch-juri.md), and [out-d1-rakipsizlik.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/out-d1-rakipsizlik.md).

---

## 1. Positioning & Naming

### One-Sentence Positioning
**Counterweight is a self-custodial cross-chain hedge controller on NEAR that funds via NEAR Intents 1Click and uses Chain Signatures (`v1.signer`) to hold a keyless, contract-capped `≤1x` Hyperliquid perp short against your spot asset—eliminating custodian risk, squeeze liquidations, and APY marketing theater.**

### Why Counterweight Is NOT "A Small Ethena" and NOT "ZeroDelta"
Pre-jury feedback ([finalistler.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/finalistler.md)) and live competitor reconnaissance ([out-d1-rakipsizlik.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/out-d1-rakipsizlik.md)) expose two traps: looking like an under-scaled [Ethena](https://docs.ethena.fi/) clone to VCs, or tying on narrative with [ZeroDelta](https://github.com/g4stein/zerodelta) during AI screening (`Q-017`). We win by separating on four verifiable facts:

| Dimension | [Ethena](https://docs.ethena.fi/) / [Liminal](https://docs.liminal.money/getting-started/products) | [ZeroDelta](https://github.com/g4stein/zerodelta) / [OptionZero](https://github.com/fepvenancio/optionsZero) / [Lemon](https://lemonmarkets.finance/docs) | **Counterweight (Our Edge)** |
| :--- | :--- | :--- | :--- |
| **1. Real Funds** | Institutional / pooled production capital, opaque to individual asset customizability. | **Unfunded or mocked:** ZeroDelta's README admits fills/funds movement are absent and TEE is simulated; OptionZero uses `MockPerpAdapter`; Lemon showed zero active vaults (**UNVERIFIED** traction). | **Live mainnet execution:** Real (tiny-dollar, `Q-007`) 1Click deposit + live `v1.signer`-derived EVM fills verifiable on NearBlocks and Hyperliquid Explorer. |
| **2. Custody Model** | **Custodial / pooled:** Ethena relies on off-exchange CEX custodians (Copper/Ceffu) and issues a pooled synthetic dollar; Liminal uses managed agent accounts/xTokens. | Testnet guard stubs or server-held agent wallets with no proven mainnet principal-operator separation. | **Per-user contract custody:** Your personal NEAR contract state owns a keyless `v1.signer` EVM address. Withdrawals require your NEAR signature while shorts are `0`; an optional Hyperliquid `approveAgent` trading key (**UNVERIFIED** exact EIP-712 byte layout—verify against HL docs) can rebalance/close only, never withdraw. |
| **3. Stress Proof** | Managed discretionary risk desks behind closed doors. | Paper architecture; vulnerable to the 10–15s cross-chain MPC/bridge latency squeeze flaw flagged in [finalistler.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/finalistler.md#L29-L34). | **Hard `≤1.0x` leverage + keyless replay:** Because `short_notional ≤ perp_USDC_margin` is enforced in-contract, initial liquidation distance is ~85–95% (exact maintenance margin tier queried per asset from HL `meta`, **UNVERIFIED** statically). A +35% candle with 15s settlement lag never triggers emergency rescue. |
| **4. Honest Net Returns** | Headline gross yield marketing; fee and negative-funding drag abstracted into protocol reserves. | Simulated/projected APY with no live fee reconciliation or negative-funding stress window. | **Full carry decomposition:** Reports realized + 180d historical net carry = `funding + optional LST yield − HL fees − 1Click spread (0.2% w/o JWT, Q-006) − gas`, highlighting worst 21-day negative-funding drawdowns and deterministic auto-unwind rules. |

### Three Name Options
1. **Counterweight** *(Recommended — keep)*: Exact physical metaphor for a `1:1` mechanical balance; memorable, neutral, and carries zero regulatory "fund/yield/alpha" baggage.
2. **EvenKeel**: Naval engineering metaphor emphasizing stability through storms (+35% squeezes) rather than speculative yield.
3. **Deadband**: Control-systems term matching a deterministic, non-LLM risk engine that rebalances only outside explicit drift thresholds.

---

## 2. Track Strategy & Jury Visibility Map

### Track Selection ([HACKATHON.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/kaynak/HACKATHON.md#L180-L194))
* **Primary Track — `defi` (*Unstoppable DeFi*):** Moderate repo count (~11 public repos due to mainnet-only Intents friction, `Q-007`) and **5/5 judge appeal** ([out-a1-rekabet.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/out-a1-rekabet.md#L143)). Directly fulfills every requirement in [01-defi.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/kaynak/track-ornekleri/01-defi.md)—1Click quotes, `REFUNDED`/`FAILED` handling, `dry: true` zero-fund mode, custody transparency—plus the stretch goal of a NEAR contract controlling an external account via Chain Signatures.
* **Secondary Track 1 — `business` (*Autonomous Business*):** Lowest crowding (**2/5**, ~11 repos). Fits treasury working-capital stabilization where humans set hard config constraints (`max_leverage: 1.0`, `max_funding_bleed_bps`, `delta_band_bps`) and software executes cross-chain via Intents + Chain Signatures with an auditable ledger.
* **Secondary Track 2 — `open` (*Open Innovation*):** Explicitly welcomes cross-chain Chain Signatures mechanisms paired with adversarial failure analysis.
* **Deliberately Excluded Tracks:** Do **not** tag `privacy` (no TEE in stack; Hyperliquid positions are public—avoids Mert/Codex penalties for privacy theater), `agents` (crowding 5/5; triggers Haseeb's toy-agent skepticism), or `security` (crowding 5/5 with 60+ LLM `leash` clones).

### What Screeners & Judges Must Immediately See
* **Claude Code & Codex (`Q-017` AI Screeners):** Clean `npm ci && npm test && npm run replay` finishing in `<60s` with zero API keys, zero mocked adapters disguised as live code, and `verify:live` matching README tx hashes.
* **Illia Polosukhin:** Direct execution of his Oct 3 Idea #9 (*"Delta-Neutral Anything"*, [crypto.news](https://crypto.news/near-co-founder-pitches-ai-pets-private-trading/)) + Idea #8 (*"Never Get Liquidated"*), proving programmable contract guardrails beat raw private keys ([ilblackdragon.com](https://ilblackdragon.com/)).
* **Kain Warwick:** CEX-smooth 1Click funding from any chain, real perp margin math, `≤1x` survival under violent squeezes, and honest negative-funding handling ([Bankless](https://www.bankless.com/the-end-of-centralized-exchanges-kain-warwicks-infinex)).
* **Haseeb Qureshi:** Structural necessity of crypto (self-custodial cross-chain hedging impossible on Stripe/Web2), zero agent-to-agent theater, and net carry after fees + drawdowns ([TokenPost](https://www.tokenpost.com/news/technology/35716)).
* **Eddy Lazzarin:** Cryptographic principal-operator binding (KYA, [a16z Big Ideas 2026](https://a16z.com/newsletter/big-ideas-2026-part-3/))—operator can reduce/rebalance risk, never withdraw principal.
* **Mert Mumtaz:** Real mainnet systems engineering, zero AI buzzwords, and explicit honesty about public venue visibility ([Helius](https://www.helius.dev/blog/manifesto)).
* **Avichal Garg:** User-owned treasury infrastructure with reproducible empirical backtest data ([Electric Capital](https://data.electriccapital.com/posts/investing-in-user-owned-technology-26-opportunities-in-2026)).
* **Stepan Gershuni:** Intention-based funding via 1Click solver auctions plus a modular `PerpVenueAdapter` ready for multi-venue routing ([cyber•Fund](https://cyberfund.vercel.app/content/agent-economy-stack)).

---

## 3. Demo Videos: 2:30 Master Cut & 60-Second X Cut

### Master Demo Video (`2:30` — English Narration, ~335 Spoken Words)

> **THE SINGLE "WOW" MOMENT (`1:05–1:42`):** A NEAR smart contract—for which no private key has ever existed—signs via `v1.signer` to open a real mainnet `≤1x` short on Hyperliquid Explorer, and immediately **blocks a live rogue-keeper withdrawal cold on-screen** (`ERR_CALLER_NOT_OWNER` + Hyperliquid trade-only scope).

| Time | Screen (Visuals — Zero Slides) | Narration (English) |
| :--- | :--- | :--- |
| `0:00–0:18` | Split screen: Left shows a treasury holding spot ETH/NEAR dropping `-22%`; Right shows Counterweight UI in **Keyless Replay Mode** holding flat USD value. No slides or logos. | *"If you hold spot crypto or DAO working capital, keeping upside exposure out of dollar volatility usually forces a bad choice: hand custody to a centralized exchange, or run a bot holding your raw private key. Counterweight fixes both."* |
| `0:18–0:45` | **Screen 2 (Hedge Builder):** User enters `$20` from Arbitrum/Solana USDC via NEAR Intents 1Click. Toggle shows `Dry Quote (Judge Mode)` vs `Live Mainnet`. Live status pipeline moves `QUOTED -> DEPOSIT_SENT -> SETTLED`, displaying the custody hop bar (`Wallet -> 1Click -> NEAR Contract`). | *"Here on mainnet, we fund a personal Counterweight controller from another chain using NEAR Intents 1Click—including explicit handling for refunded or failed quotes. Half holds the spot leg; half routes as USDC collateral to an EVM address derived deterministically by NEAR's `v1.signer` MPC network."* |
| `0:45–1:05` | **Screen 3 (Contract Limits Panel):** Zoom on immutable contract invariants (`max_leverage = 1.00x`, `owner = samet.near`, `withdraw_locked_while_short_open = true`). Click **Open 1x Hedge**. NearBlocks tx confirms `v1.signer` call. | *"Before any order fires, the NEAR contract checks hard invariants: short notional can never exceed one-times posted margin. Now the contract asks `v1.signer` to sign the Hyperliquid action."* |
| `1:05–1:42` ⭐ **WOW** | **Split screen:** Left shows **Hyperliquid Explorer** updating live with the `0.95x` short at the derived `0x...` address (`Net Delta: +0.01%`). Right terminal runs `npm run demo:rogue-withdraw`: red revert `ERR_NOT_CONTRACT_OWNER` on NEAR + `Agent wallet cannot withdraw` on Hyperliquid. | *"Look at Hyperliquid Explorer: that live short is owned by a NEAR smart contract—no seed phrase exists anywhere on earth. Now watch what happens if our off-chain keeper gets compromised and tries to withdraw one dollar to an attacker address. Rejected by Hyperliquid's trade-only agent scope, and rejected on NEAR because only the owner can unlock withdrawals after closing the hedge."* |
| `1:42–2:12` | **Screen 1 (Stress Lab):** Run `npm run replay -- --scenario squeeze-35pct` and switch UI tab to **180d Honest Carry**. Chart overlays a `+35%` 15-minute candle + `15s` simulated cross-chain lag: `3x` reference vault liquidates in red; Counterweight (`≤1x`) stays at `58%` margin buffer. Below: 21-day negative-funding drawdown bar in amber triggering auto-unwind. | *"What about a violent short squeeze while cross-chain settlement takes fifteen seconds? Our keyless replay injects a real thirty-five-percent candle with a fifteen-second lag. Because leverage is capped at one-x, liquidation sits nearly ninety percent away—zero emergency bridge race required. And we don't hide bad markets: our stats deduct every swap and taker fee, show multi-week negative funding in red, and auto-unwind if cumulative funding bleed hits your floor."* |
| `2:12–2:30` | Terminal runs `git clone ... && npm ci && npm run replay && npm run verify:live` completing green in seconds. End on repo URL + disclaimer footer. | *"Clone the repo and verify every test, replay, dry 1Click quote, and live mainnet address in forty seconds—no keys, no funds needed. Counterweight: self-custodial stability, enforced by NEAR."* |

### 60-Second Cut for X (`1:00`) + Post Draft
* `0:00–0:10`: Problem hook on live UI—hedging spot today means CEX custody risk or a server holding your private key.
* `0:10–0:24`: 1Click cross-chain deposit settles -> NEAR contract triggers `v1.signer` -> live `≤1x` short appears on Hyperliquid Explorer (`Net Delta ~0%`).
* `0:24–0:40` (**Wow**): Run rogue-keeper withdrawal attempt -> instant double rejection on-screen (trade-only scope + NEAR owner invariant).
* `0:40–0:52`: Keyless `+35%` squeeze replay w/ 15s lag (`0` liquidations at `≤1x`) + honest net carry chart showing negative-funding weeks.
* `0:52–1:00`: Terminal `npm run replay && npm run verify:live` green output + repo link.

**X Post Copy ([HACKATHON.md Procedure §2](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/kaynak/HACKATHON.md#L106-L118)):**
> Hedging spot volatility shouldn't require trusting a CEX custodian or putting a private key on a bot server.
>
> Built **Counterweight** at NEAR HACKATHON: a self-custody cross-chain hedge controller.
> - Fund from any chain via NEAR Intents 1Click
> - NEAR contract owns a keyless Hyperliquid `≤1x` short via Chain Signatures (`v1.signer`)
> - Keeper can rebalance, never withdraw
>
> Keyless replay + live mainnet verifier in `<60s`: `<REPO_URL>` | Demo: `<DEMO_URL>`
>
> Curious for feedback from perp & treasury builders: what funding-bleed threshold would you set for auto-unwind? @NEARProtocol #NEARHackathon @NearBuilders

---

## 4. Machine + Human README Blueprint

Structured for **Claude Code / Codex (`Q-017`)** first (deterministic CLI verification, exact paths, zero hype) and **human judges** second.

1. **`# Counterweight` (What It Is & Problem Solved — 4 lines, zero marketing)**
   * Exact architecture summary + live links: `NEAR Contract ID`, `Derived EVM Address (0x...)`, `NearBlocks tx`, `Hyperliquid Explorer URL`.
2. **`## Quickstart: Verify Everything ("Do X — See Y", Keyless First)`**
   * **Step 1 — Deterministic Engine & Contract Invariants (Offline, 0 keys, ~20s):**
     * **Do:** `npm ci && npm test`
     * **See:** All Vitest + contract tests pass (`max_leverage <= 1.0x`, `ERR_NOT_CONTRACT_OWNER` on rogue withdrawal, `REFUNDED`/`FAILED` 1Click state transitions, auto-unwind trigger).
   * **Step 2 — Keyless Historical Stress Replay (Offline fixtures, 0 keys, ~15s):**
     * **Do:** `npm run replay -- --scenario squeeze-35pct && npm run replay -- --scenario neg-funding-21d`
     * **See:** Deterministic table + `artifacts/replay-report.json`: during a `+35%` candle with simulated `15s` MPC/Intents lag, max `|net_delta|` stays within band and minimum margin buffer stays `>50%` (`0` liquidations); during a 21-day negative-funding flip, cumulative bleed crosses floor and triggers clean unwind.
   * **Step 3 — Live Public Chain & Dry-Quote Verification (Network read-only, 0 keys/0 funds, ~15s):**
     * **Do:** `npm run verify:live`
     * **See:** (a) Derives `0x...` directly from `(NEAR_CONTRACT_ID, path)` via public NEAR RPC ([docs.near.org](https://docs.near.org/api/rpc/providers)); (b) reads live/historical position & fills from Hyperliquid public `info` API; (c) requests a live `dry: true` quote (`Q-007`) from NEAR Intents 1Click API and prints status-handler output.
   * **Step 4 — Local Dashboard in Judge Replay Mode (~10s):**
     * **Do:** `npm run dev` -> open `http://localhost:3000`
     * **See:** Full 4-screen UI pre-loaded with live read-only mainnet state + interactive stress-test toggles; optional funded execution requires explicit user wallet connection.
3. **`## Architecture & NEAR Integration (Built in Hackathon Window, Q-001 / Q-004)`**
   * Exact codebase map (`contracts/controller`, `src/intents/oneclick.ts`, `src/mpc/chain-signatures.ts`, `src/risk/engine.ts`, `src/venues/hyperliquid.ts`) explaining why only NEAR (`v1.signer` keyless EVM ownership + 1Click cross-chain funding) enables non-custodial cross-chain hedging.
4. **`## Honest Risk, Latency Budget & Limitations`**
   * **Latency vs. Leverage Math:** `1Click` + `v1.signer` signing takes `~10–20s`. Why `>2x` vaults liquidate on wicks, and why enforcing `≤1.0x` (`~85–95%` initial distance to liquidation) removes emergency top-ups from the critical path.
   * **Negative Funding & Fee Drag:** Full formula deducting 1Click `0.2%` unauthenticated fee (`Q-006`), Hyperliquid fees, and gas; historical 180-day drawdown percentile table; auto-unwind threshold.
   * **No Privacy Theater:** Explicit note that Hyperliquid positions and derived `0x` addresses are publicly visible on-chain.
   * **1Click Failure Modes:** Exact state handling when a deposit lands late or returns `REFUNDED` / `FAILED` ([01-defi.md](file:///Users/samet/Desktop/nearhacheton/.claude/worktrees/near-hackathon-rules-22faa2/ekip/kaynak/track-ornekleri/01-defi.md)).
5. **`## Hackathon Provenance & Disclosures (Q-002, Q-003, Q-005, Q-015)`**
   * **Window (`Q-001`/`Q-004`):** Confirm all NEAR contracts, Chain Signatures derivation/signing, 1Click client, deterministic hedge engine, replay suite, and UI were written between `2026-10-19` and `2026-11-14`.
   * **Baseline / Libraries (`Q-002`/`Q-003`/`Q-005`):** If reusing any prior Hyperliquid rate-limiter/schema utilities from Samet's pre-hackathon codebase, tag `pre-hackathon` vs `hackathon-submission` with a direct GitHub compare diff link (`Q-003`) and list them as unjudged baseline alongside `near-api-js`, `viem`, `zod`, `vitest`, and AI coding assistants (Claude Code, Codex, Gemini).
   * **Submission Count (`Q-015`):** State `"Single team submission (1 of 1)"` *(or explicitly cross-link the second repo if submitting two independent projects)*.
6. **`## Legal & Non-Custodial Software Notice` + `## License`**
   * Root `LICENSE` file set to **MIT** (`Q-014`); repository + hosted read-only demo kept live past `2026-11-25` (`Q-012`).

---

## 5. UI Design: The 4 Judge Screens & Honest Metrics

### Screen 1: Keyless Replay & Stress Lab *(Default Landing — Zero Wallet Popup)*
```text
+-----------------------------------------------------------------------------------+
| COUNTERWEIGHT [SELF-CUSTODY TOOL]    Mode: [● Judge Replay (Keyless)] [○ Mainnet] |
+-----------------------------------------------------------------------------------+
| Scenario: [ +35% 15m Squeeze (15s MPC Lag) v ]   [▶ Run Deterministic Replay]     |
|-----------------------------------------------------------------------------------|
| Portfolio Value ($):  Counterweight (≤1.0x): $1,001.40  | Naive 3x Vault: LIQ ($0)|
| Max |Net Delta|:      1.8% (Band: ±2.5%)                | Min Stress Buffer: 58.4%|
| [Chart: Spot +35% | Short -35% | Margin Ratio Curve vs Maintenance Floor (6.5%)]  |
+-----------------------------------------------------------------------------------+
```

### Screen 2: Self-Custody Hedge Builder & 1Click Custody Pipeline
```text
+-----------------------------------------------------------------------------------+
| 1. FUND & CONFIGURE CONSTRAINTS                   [✓ Dry-Run Quote Only (Q-007)]  |
| Source: [USDC on Arbitrum v] Amount: [ 20.00 ] -> Split: 50% Spot / 50% 1x Margin |
| Max Short Leverage: [ 0.95x ] (Contract Hard Cap: ≤1.00x)                         |
| Auto-Unwind Floor:  [ -45 bps cumulative funding bleed ]   [ Fetch 1Click Quote ] |
|-----------------------------------------------------------------------------------|
| CUSTODY TRACKER (Where funds sit at every step — 01-defi.md):                     |
| [1. User Wallet] ==(1Click: PENDING | SUCCESS | REFUNDED | FAILED)==>             |
| [2. NEAR Controller: user.cw.near] ==(v1.signer)==> [3. HL Derived: 0x7a...9f]    |
+-----------------------------------------------------------------------------------+
```

### Screen 3: Live Position Cockpit & Honest Carry Breakdown
```text
+-----------------------------------------------------------------------------------+
| NET DELTA         DISTANCE TO LIQ.        STRESS BUFFER        NET REALIZED CARRY |
| +$0.12 (+0.6%)    +89.2% (Mark $6,140)    $9.15 (91.5% free)   +4.82% ann. (30d)  |
|-----------------------------------------------------------------------------------|
| HONEST CARRY DECOMPOSITION (180d Historical + Live Mainnet — Neg. Days Included): |
|   Gross Perp Funding (incl. 43 negative-funding days in red):    +7.90%           |
| + Spot Staking Yield (optional Rhea LST / 0.00% if raw spot):    +0.00%           |
| - 1Click Swap Spread & 0.20% Unauthenticated Fee (Q-006):        -0.84%           |
| - Hyperliquid Maker/Taker & NEAR/EVM Gas Costs:                  -2.24%           |
| = NET HISTORICAL BASIS RESULT (Worst 21d Drawdown: -0.61%):      +4.82%           |
|-----------------------------------------------------------------------------------|
| CONTRACT-ENFORCED LIMITS (Read directly from NEAR RPC):                           |
| • Leverage Cap: ≤1.00x [IMMUTABLE]   • Withdrawals: Owner + Zero-Short ONLY       |
| • Keeper Key: Reduce/Rebalance ONLY  • Auto-Unwind: ARMED (-45 bps funding floor) |
+-----------------------------------------------------------------------------------+
```

### Screen 4: Custody & Adversarial Proof Drawer
```text
+-----------------------------------------------------------------------------------+
| VERIFY KEYLESS OWNERSHIP & ADVERSARIAL SAFETY                                     |
| NEAR Controller: cw-v1.near [NearBlocks ↗] -> Derived EVM: 0x7a..9f [HL Scan ↗]   |
| Derivation Check: sha256(contract_id, path) Verified Locally ✓ (0 Private Keys)   |
| [Simulate Rogue Keeper Withdrawal] -> Result: REVERTED (ERR_NOT_CONTRACT_OWNER)   |
+-----------------------------------------------------------------------------------+
```

---

## 6. Screener & Judge Q&A (One Question, One-Line Answer)

* **AI Screeners — Claude Code & Codex (`Q-017`):** *"Does this repo actually execute what the README claims without hidden keys or `MockPerpAdapter` stubs?"*
  * **Answer:** Run `npm test && npm run replay && npm run verify:live` with zero secrets to verify every risk invariant offline and confirm our `v1.signer`-derived EVM address and real fills directly against public NEAR and Hyperliquid APIs.
* **1. Illia Polosukhin (NEAR):** *"What protects the position during the 10–15 seconds it takes for NEAR Intents and `v1.signer` to settle during a violent market move?"*
  * **Answer:** The NEAR contract hard-caps short leverage at `≤1.0x`, keeping liquidation ~85–95% away so cross-chain rebalancing is an asynchronous drift reset rather than a 10-second survival race.
* **2. Mert Mumtaz (Helius):** *"Hyperliquid positions are completely public on-chain—are you claiming this is private?"*
  * **Answer:** Zero privacy theater: positions on Hyperliquid are public and our README states that plainly; our guarantee is keyless contract custody and deterministic risk execution, not fake unlinkability.
* **3. Eddy Lazzarin (a16z crypto):** *"If the off-chain rebalancing keeper is compromised, what is the maximum damage it can inflict on user funds?"*
  * **Answer:** It cannot withdraw a single cent because Hyperliquid agent keys are trade-only and NEAR contract withdrawals revert unless signed by the human owner after open shorts reach zero.
* **4. Avichal Garg (Electric Capital):** *"Why use this instead of holding Ethena's USDe?"*
  * **Answer:** USDe pools users behind off-exchange CEX custodians on issuer-chosen collateral, whereas Counterweight lets any treasury hedge its own spot asset in isolated self-custody without selling or pooling principal.
* **5. Kain Warwick (Synthetix / Infinex):** *"Perp funding flips negative for three straight weeks—what happens to the user, and how clunky is onboarding?"*
  * **Answer:** Users fund in one click from any chain via Intents, see negative funding deducted transparently in real time, and auto-unwind deterministically the moment cumulative funding bleed hits their preset floor.
* **6. Haseeb Qureshi (Dragonfly):** *"Where does the return actually come from, and what does it look like after real fees and bad funding regimes?"*
  * **Answer:** Every percentage point comes strictly from perp funding plus optional spot staking minus 1Click spreads, taker fees, gas, and negative-funding drawdowns—all shown net over a 180-day window including worst losing streaks.
* **7. Stepan Gershuni (cyber•Fund):** *"Why hardcode Hyperliquid instead of routing hedges through competing solvers?"*
  * **Answer:** Funding already clears via NEAR Intents solver auctions, and the perp leg sits behind a typed `PerpVenueAdapter` interface so multi-venue solver routing plugs in without changing the NEAR custody contract.

---

## 7. Legal Safety & Wording Rules (Global + Turkish Law Sensitivity)

Because paid trading signals, discretionary portfolio management (*portföy yöneticiliği*), unauthorized investment advisory (*yatırım danışmanlığı*), and custodial crypto asset services carry strict liability under Turkish Capital Markets Law No. 6362 / Law No. 7518 (*SPK* framework; exact statutory application to open-source tools **UNVERIFIED** without local counsel), enforce these product and copy rules everywhere:

### Structural Product Guardrails
1. **Isolated Self-Custody Software Only:** Never pool user deposits, never issue vault/LP shares, never hold user keys or upgrade admin keys over user balances, and charge `0%` management/performance fees.
2. **User-Initiated Parameters Only:** The user chooses the asset, size, leverage cap (`≤1x`), and unwind floor. No "AI alpha picker," no "recommended coin to hedge," and **zero paid or gated trading signals**.

### Wording Rules: Say This / Never Say This
| Never Say (High Legal & Jury Risk) | Always Say Instead (Safe & Accurate) |
| :--- | :--- |
| *"Delta-neutral yield vault"* / *"Pooled fund"* | *"Self-custodial hedge controller"* / *"Personal treasury software"* |
| *"Earn 15% risk-free / guaranteed APY"* | *"Historical net basis carry (net of fees & negative funding)"* |
| *"Deposit into Counterweight"* | *"Initialize your personal controller state on NEAR"* |
| *"Smart trading signals / AI alpha bot"* | *"User-configured deterministic risk engine"* |

### Mandatory Verbatim Disclaimers (UI Footer, Video End-Card & `README.md`)
* **UI Banner & `README.md`:** *"Counterweight is open-source, non-custodial software instantiated directly by each user. It is not a fund, custodian, broker, exchange, or investment advisor, and does not pool funds, promise returns, or provide trading signals. Perpetual funding rates can turn negative and reduce principal; smart-contract, cross-chain settlement, and venue execution risks apply."*
* **Demo Video End-Card (`2:25–2:30`):** *"Open-source self-custody hackathon prototype. Historical carry is not indicative of future results; not financial or investment advice."*
