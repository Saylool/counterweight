# Counterweight X cut — final voiced export

The authoritative submission demo script is [apps/video/revised-x-script.md](../apps/video/revised-x-script.md), the revised A1–A7 X-cut narration mirrored in [scenes.json](../apps/video/src/scenes.json). [DEMO-SCRIPT.md](DEMO-SCRIPT.md) is the archived legacy capture/edit table; it does not override the locked narration.

A4 source now pairs the recorded v2 withdrawal with the separate live v3 run on 12 November. Replace `videos/vo/x/04.mp3` with the new exact narration below before rendering; the existing audio and MP4 have not been regenerated.

The existing voiced export is [docs/media/counterweight-demo.mp4](media/counterweight-demo.mp4): **93.7 seconds of H.264 video + AAC audio, -14 LUFS** (A4 re-voiced on 13 Nov). The seven **ElevenLabs Curtis** voiceover files are present at `videos/vo/x/01.mp3` through `07.mp3`; `videos/` is gitignored, so those source recordings do not appear in the repository. The MP4 includes the narration.

Only the X cut is a deliverable. The Judge cut remains archived. Source changes and local build artifacts stay in `apps/video`, `scripts/video` and this file; existing reports, captures and voiceover directories are inputs.

From the repository root:

```sh
npm run video:remotion:test
npm run video:test
npm --workspace @counterweight/video run typecheck
# Render with the existing voiceover recordings:
node --import tsx scripts/video/remotion.ts --cut=x --subtitles
# Local Studio:
node --import tsx scripts/video/remotion.ts --cut=x --preview --subtitles
# Full-resolution evidence and animation samples:
node --import tsx scripts/video/remotion.ts --cut=x --subtitles --stills
# Compile and prepare timing without Chromium:
node --import tsx scripts/video/remotion.ts --cut=x --subtitles --bundle-only
```

The direct Node entry avoids the tsx CLI's IPC listener, which this sandbox denies. The equivalent npm entry remains `npm run video:remotion -- --cut=x --subtitles` on an unrestricted host. `ffmpeg` and `ffprobe` must be on PATH. Existing Chromium in `videos/build/browsers/chromium_headless_shell-*` is reused; `REMOTION_BROWSER_EXECUTABLE` may select another installed executable.

Output: `apps/video/build/counterweight-x-v3-subtitles.mp4`, 1920×1080, 30 fps, H.264/yuv420p. The filename retains the existing edit version; this is review round 5. Omit `--subtitles` for `apps/video/build/counterweight-x-v3.mp4`. Stills, props, timeline and bundle are written inside `apps/video/build`. `--frames=0-29 --scale=0.5` renders a separate sample. Default render concurrency is 2.

## Narration, subtitles and timing

`src/scenes.json` and `revised-x-script.md` contain the revised A1–A7 narration, with **only A4** changed for the verified v2 arrival and separate live v3 run: **184 whitespace-delimited words**. The unchanged rendered export contains the earlier A4 recording. The new exact A4 voiceover is:

> The v2 run withdrew nearly forty-seven USDC net, and it arrived. On November twelfth, a separate keyless v3 opened and closed a live testnet short.

The user will replace `videos/vo/x/04.mp3`; the renderer measures its duration on preparation. All seven scenes have ElevenLabs Curtis recordings in `videos/vo/x/`. No paid generation, network evidence capture, keys, chain sends or demo rerun is needed.

There is **one bottom text band**. `--subtitles` replaces the bold editorial caption with sentence/clause narration pages, sized for at most two lines. Every X subtitle page holds for **at least 2 seconds**. Word-position boundaries are rebalanced only as needed to meet that minimum; A4 has exactly two balanced pages, one per sentence (withdrawal/arrival, then live v3 run), A6 has the three requested balanced chunks, and A7 has one complete sentence per page. It does not stack captions and subtitles. Protected phrases stay on one page: “what the keeper can sign”, “policy's access keys”, “NEAR HACKATHON” and “testnet evidence”. Evidence labels, source records and the requested A1 headline remain in the main picture. The final voiced export should use `--subtitles` too.

Script slots total **80 seconds**. The historical silent preview was **2,550 frames / 85.0 seconds**, using the unchanged timing rule:

```text
missing audio: ceil(max(scriptSeconds, voiceoverWords / 2.5 + 0.6) * 30)
present audio: ceil(max(scriptSeconds, measuredAudioSeconds + 0.4) * 30)
```

| Scene | Script slot | Silent duration |
|---|---:|---:|
| A1 | 8s | 9.4s |
| A2 | 12s | 13.0s |
| A3 | 10s | 11.0s |
| A4 | 13s | 13.0s |
| A5 | 14s | 15.0s |
| A6 | 15s | 15.0s |
| A7 | 8s | 8.6s |

The final voiced runtime is 93.7 seconds; render timing uses measured recordings. No speed-up is applied. Missing audio produces no synthesized voice, music or click track. Recordings are read from the existing `videos/vo/x/01.mp3` through `07.mp3` files (ElevenLabs Curtis; gitignored). Old recordings remain in their existing archive. Preparation rebuilds the audio map, so stale staged public assets cannot activate a scene.

`apps/video/build/x-{props,timeline}.json` records effective timing, source hashes and audio availability for each render. The end-card repository URL defaults to `https://github.com/Saylool/counterweight`; `VIDEO_REPO_URL` overrides it. This pass does not claim a remote accessibility check.

## Picture changes

- A1 keeps its narration, headline and **NEAR holdings + short hedge** visual. Its proof reveals now derive from narration word positions too.
- A2 has four states: **contract intro → Keeper proposes → Policy checks bounds → NEAR Chain Signatures sign for Hyperliquid**. The full final headline fits. The intro highlights the policy; the final state highlights both signing and venue nodes. The two explanatory sentences beneath the chain are removed. **Owner configuration: caps + fixed recipient** and the concrete recipient restriction remain.
- A3 highlights the active bottom transaction references in gold: funding references together, key deletion, short, then close. Steps 1–2 fill the lower card with their verification summaries. Saved fill JSON excerpts, source filenames and exact prices remain intact.
- A4 has two sequential full-width beats. **Recorded v2 withdrawal** shows enlarged original Hypurrscan withdraw-row excerpts (hash/method and destination/amount/token), **46.957074 USDC net**, and **Arrived on Arbitrum Sepolia** with tx **0xdf68…01c0** and `docs/evidence/2026-11-13-v2-arrival-arbitrum-sepolia.json`. At **“On November twelfth,”**, the picture and subtitle switch together to **Live v3 run · 12 Nov**: **short 3.6 NEAR @ 3.3788 → reduce-only close 3.6 @ 3.3796 → owner settled, 0 access keys**. The small footer cites `docs/evidence/2026-11-12-v3-lifecycle-summary.md` and open **5ckMPU…**, close **3cvncG…**, settlement **CYFZdH…**. Supervised testnet scope and owner-attestation limits remain visible. The previous verifier/authorization main line is removed.
- A5 uses two large banner lines: **Local simulation: +32.5% / 24h** and **Reduce-only close · owner nonce/balance unchanged**. The **mocked signatures & fills** badge remains. Highlights follow **setup → NEAR rallied → The keeper closed → and the owner's**: **003+010 → percentage fragment on 003 → 016 → 036+050**. Both owner-state lines use the same green nonce pill. Original line numbers, column headers, close price **$2.8062** and headroom **2.281** remain.
- A6 keeps the big **7/7 tested cases**. Only **increase beyond caps** and **withdraw to rogue** brighten during their spoken examples; all other rows dim. **Were all rejected** clears the example highlight. **After a timeout** reveals and emphasises the **+601s mocked recovery** row. The early timelock check stays separate from the seven requests.
- A7 reveals the complete card within **0.3s**, leaving **8.3s** fully visible in the silent cut. The repository URL is enlarged to 58px at its default length, with **npm ci && npm test && npm run demo:local** below in small type. The policy address is removed. Prototype and trust limitations remain.

Picture beats and click cues derive from **word positions in the locked scene narration**. With recordings, the clock uses measured VO length, even when a shorter recording fits inside a longer minimum scene slot. Without audio, it uses the silent estimate minus its 0.4s tail. Subtitle boundaries start from that same clock and borrow adjacent reading time for the two-second minimum. A4’s switch uses `narrationAt('A4', 'On November twelfth,', measuredAudioSeconds + 0.4)`, matching its second subtitle boundary; it has no fixed-second picture offset. A7's word-derived entrance is capped at the requested 0.3s. Waveform alignment should be checked when replacing recordings; no speech is accelerated.

## Sentence audit

Every supplied sentence is supported in the stated testnet/local scope. No unsupported sentence was found. Imperatives and invitations are editorial, not performance claims.

| Scene / sentence | Support in CLAIMS and saved evidence |
|---|---|
| A1: Counterweight hedges NEAR holdings with a short, and a keyless NEAR policy limits what the keeper can sign. | Product-purpose description supported by the keeper IOC short/reduce-only-close primary lifecycle row and owner/keeper/public authority, caps and typed-signing rows. No protection or yield guarantee. |
| A1: Recorded on Hyperliquid testnet. | Primary funded v2 lifecycle and corresponding saved fill evidence; not mainnet. |
| A2: Counterweight puts a keyless NEAR policy contract between the keeper and the exchange. | Prototype/typed-signing and owner/keeper/public authority rows. |
| A2: The keeper proposes an order, the contract checks its bounds, and NEAR Chain Signatures sign it for Hyperliquid. | Contract caps and typed Chain Signatures; recorded lifecycle signature requests and fills. |
| A3: The owner funded the account, then deleted the policy's access keys. | Primary lifecycle funding/transfer/key-deletion ordering. |
| A3: The keeper opened a 3.5 NEAR short and closed it reduce-only. | Exact primary fills row and both saved relay JSON `verification.fills`: 3.5 @ 3.5121, close 3.5 @ 3.5212. |
| A3: The position is flat. | Close relay `verification.flat == true`; this describes the perp position. |
| A4: The v2 run withdrew nearly forty-seven USDC net, and it arrived. | Primary withdrawal and Video rounding rows: 46.957074 net, 47.957074 gross, 1 fee. [Saved Arbitrum Sepolia arrival](evidence/2026-11-13-v2-arrival-arbitrum-sepolia.json) binds 46.957074 USDC to tx `0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0` and the fixed recipient. |
| A4: On November twelfth, a separate keyless v3 opened and closed a live testnet short. | [12 November v3 lifecycle summary](evidence/2026-11-12-v3-lifecycle-summary.md): short 3.6 NEAR @ 3.3788 (`5ckMPU…`), reduce-only close 3.6 @ 3.3796 (`3cvncG…`), flat, zero access keys at request/signature receipt blocks. Owner settlement (`CYFZdH…`) and finalized zero reserved short are recorded separately. Supervised: opening requires a fresh owner margin attestation; settlement remains an owner attestation. The live close was inside the opening band. No v3 withdrawal or live out-of-band exit is claimed. |
| A5: In a local simulation with the real policy WASM and mocked signatures, NEAR rallied thirty-two and a half percent in a day. | JSON `selection`: 24h, +32.499065% (32.5% rounded); `policySha256`, `mocked`, `boundaries`; CLAIMS local-demo/rally rows. Historical-data replay, not a live price move during execution. |
| A5: The keeper closed the hedge reduce-only, and the owner's nonce and balance stayed unchanged. | First JSON `timeline` reduce-only close; `ownerBefore == ownerAfterReplay == ownerAfter` (nonce 7000002 and balance 99999347412735944600000000 yocto); autonomous-phase assertions and CLAIMS owner nonce/balance row. Signatures/fills are mocked and labelled. Owner participates only after the narrated autonomous phase. |
| A6: Seven tested unauthorized requests, from oversized shorts to rogue withdrawals, were all rejected. | Seven JSON `rogueAttempts`, each `rejected == true`; examples “increase beyond caps” and “withdraw to rogue”; `assertions.rogueRejected == 7`; CLAIMS seven-attack row. This count excludes the separate early-timeout check. |
| A6: After a timeout, the policy allows recovery; that signature was mocked. | JSON early recovery rejection, transcript +601s public recovery, `assertions.unrelatedDeadmanSigned`, `mocked` signature boundary; CLAIMS local authority rows. |
| A7: Counterweight is a supervised testnet prototype, built at NEAR HACKATHON. | Prototype, hackathon deliverables and supervised-execution scope rows; no mainnet assertion. |
| A7: Run the local demo and check the testnet evidence yourself. | Quickstart/demo and primary evidence links; invitation to reproduce. |

## Verification

A4 update (13 November): exact narration, two complete sentence pages, saved arrival/v3 provenance, and five measured-audio duration cases (5s, 8s, 12.615s, 18s, 24s) passed direct checks; claims/caption/timing regressions, all seven legacy video tests and the video TypeScript check passed. The full Remotion suite currently passes 14/17 tests: three stale A4 assertions still require the old narration, verifier/hash and “Separately” cue. Updating that test file is outside this edit’s authorized file list. The updated bundle compiled in a temporary directory; still rendering was blocked by sandbox port/Chromium permissions. Audio and existing exports remain unchanged.

The video regression suites and workspace TypeScript check cover script correspondence, numerical claim anchors, complete subtitle wording, authentic source-line ordering, silent/audio timing and reveal pacing. A dedicated regression parses the **specific Worst rolling 24h rally CLAIMS row** and compares its close timestamp, four-decimal NEAR price and three-decimal H with the first `reduce-only close` in `reports/demo-local.json`. It also checks selection percentage and candidate count; matching another row cannot hide a stale claim.

Validation passed in round 5: **17 Remotion tests + 7 legacy video tests (24 total)** and the video workspace TypeScript check. That historical silent-build check compiled with **zero audio files** and prepared **2,550 frames / 85.0s**; it predates the existing 93.7-second voiced export. Tests lock every X voiceover, confirm exact script correspondence and authentic evidence, sample subtitle durations frame by frame (at least 60 frames per page), and exercise varied narration lengths, four architecture states, keeper beats, the two rogue examples, recovery and the closing-card reveal/hold.

The earlier restricted-sandbox still-render attempt stopped with **`Error: No available ports found`** when Remotion tried to open its local render server in this sandbox. That historical attempt updated source, props, timeline and bundle only; it does not describe the current deliverable. The final voiced MP4 now exists at `docs/media/counterweight-demo.mp4`, with the Curtis recordings in `videos/vo/x/`. Run the render/stills commands above on a host that permits the local server and Chromium to reproduce. This documentation update generated no voiceover and used no keys, chain sends, paid APIs or demo rerun.

V2 arrival update (13 November 2026): **arrived on Arbitrum Sepolia** — 46.957074 HL-testnet USDC; [transaction](https://sepolia.arbiscan.io/tx/0xdf68992e9a836bfb5d6b7ff834e2f3537f9913a32b39eeeeb8664099360501c0), [public RPC evidence](evidence/2026-11-13-v2-arrival-arbitrum-sepolia.json). Testnet only.

Release-editor note (13 November): the A4 source wording above reflects the verified arrival and the separate live v3 open/close. The existing rendered video and recorded audio are unchanged; their earlier arrival caveat will change in a future render. Do not treat source wording as a description of the unchanged export.
