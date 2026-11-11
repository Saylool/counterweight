# Counterweight X cut — round 3

Only the X cut is a deliverable. The Judge cut remains archived. Source changes and local build artifacts stay in `apps/video`, `scripts/video`, `docs/CLAIMS.md` and this file; existing reports, captures and voiceover directories are inputs.

From the repository root:

```sh
npm run video:remotion:test
npm run video:test
npm --workspace @counterweight/video run typecheck
# Silent review now; the same command includes new recordings when present:
node --import tsx scripts/video/remotion.ts --cut=x --subtitles
# Local Studio:
node --import tsx scripts/video/remotion.ts --cut=x --preview --subtitles
# Full-resolution evidence and animation samples:
node --import tsx scripts/video/remotion.ts --cut=x --subtitles --stills
# Compile and prepare timing without Chromium:
node --import tsx scripts/video/remotion.ts --cut=x --subtitles --bundle-only
```

The direct Node entry avoids the tsx CLI's IPC listener, which this sandbox denies. The equivalent npm entry remains `npm run video:remotion -- --cut=x --subtitles` on an unrestricted host. `ffmpeg` and `ffprobe` must be on PATH. Existing Chromium in `videos/build/browsers/chromium_headless_shell-*` is reused; `REMOTION_BROWSER_EXECUTABLE` may select another installed executable.

Output: `videos/counterweight-x-v3-subtitles.mp4`, 1920×1080, 30 fps, H.264/yuv420p. The filename retains the existing edit version; this is review round 3. Omit `--subtitles` for `videos/counterweight-x-v3.mp4`. Stills, props, timeline and bundle are written inside `apps/video/build`. `--frames=0-29 --scale=0.5` renders a separate sample. Default render concurrency is 2.

## Narration, subtitles and timing

`src/scenes.json` and `revised-x-script.md` contain the exact manager-supplied A1–A7 narration: **199 whitespace-delimited words**. All seven scenes require new recordings. No paid generation, network evidence capture, keys, chain sends or demo rerun is needed.

There is **one bottom text band**. `--subtitles` replaces the bold editorial caption with whole-word narration cues of at most nine words. It does not stack captions and subtitles. Evidence labels, source records and the requested A1 headline remain in the main picture. The final voiced export should use `--subtitles` too.

Script slots total **80 seconds**. The current silent preview is **2,526 frames / 84.2 seconds**, using the unchanged timing rule:

```text
missing audio: ceil(max(scriptSeconds, voiceoverWords / 2.5 + 0.6) * 30)
present audio: ceil(max(scriptSeconds, measuredAudioSeconds + 0.4) * 30)
```

| Scene | Script slot | Silent duration |
|---|---:|---:|
| A1 | 8s | 9.0s |
| A2 | 12s | 13.0s |
| A3 | 10s | 11.0s |
| A4 | 13s | 13.4s |
| A5 | 14s | 14.2s |
| A6 | 15s | 15.0s |
| A7 | 8s | 8.6s |

The voiced runtime depends on measured recordings and will be at least 80 seconds. No speed-up is applied. Missing audio produces no synthesized voice, music or click track. New recordings are read from `videos/vo/x/01.mp3` through `07.mp3`; those files are currently absent. Old recordings remain in their existing archive. Preparation rebuilds the audio map, so stale staged public assets cannot activate a scene.

`apps/video/build/x-{props,timeline}.json` records effective timing, source hashes and absent audio. The end-card repository URL defaults to `https://github.com/Saylool/counterweight`; `VIDEO_REPO_URL` overrides it. This pass does not claim a remote accessibility check.

## Picture changes

- A1 uses “Automate a NEAR hedge. Limit what the keeper can sign.” Proof rows enter at 0.6, 3.0 and 5.4 seconds, then emphasis continues to advance.
- A2 has animated directional arrows from Keeper → Policy checks → NEAR Chain Signatures → Hyperliquid. A separate dashed owner-configuration arrow enters the policy. The padlock sits next to the zero-keys badge. The enforced fixed-recipient authority bound is stated without inventing a size cap.
- A3 retains four chronological beats. The short and close beats briefly show original pixels from `lifecycle-scroll.png`, cropped to `[376,256,680,63]` and `[376,319,680,63]`, scaled to 1640px wide (about 2.4×). They are labelled “Recorded Hyperliquid testnet fill” and “Saved lifecycle table · original captured record”. This is the saved dashboard's evidence table, not a newly retrieved exchange page. No trailing funding caption repeats the sequence.
- A4 shows two explicitly separated original Hypurrscan excerpts, Method and Amount/Token, each at 2× source pixels. The source displays rounded **46.96**; the large **46.957074 USDC net** annotation is sourced to the saved lifecycle-status evidence. No explorer column or precision is fabricated. The v2/v3 deployment distinction occurs once in the header. The verifier crop excludes its repeated deployment footer; the authentic v3 hash remains intact. Withdrawal, arrival caveat and protective-exit emphasis advance in thirds.
- A5 progressively reveals authentic lines **003 → 010 → 016 → 036 → 050**, highlighting **016** and **036**. Close values stay **09-17 10:00 UTC, $2.8062, H 2.281**. The stale local-demo CLAIMS row is corrected to match the first JSON close.
- A6 progressively reveals all seven original rejection rows, early timeout rejection, mocked +601s recovery and PASS summary. Three callouts advance alongside them. A7 reveals the command and policy identifier sequentially. Main-picture evidence changes occur within about six seconds in the current silent timeline; diagram arrows also move continuously. Subtitles and the progress bar are additional motion, not the only activity.

## Sentence audit

Every supplied sentence is supported in the stated testnet/local scope. No unsupported sentence was found. Imperatives and invitations are editorial, not performance claims.

| Scene / sentence | Support in CLAIMS and saved evidence |
|---|---|
| A1: Automate a NEAR hedge and limit what the keeper can sign. | Contract authority tiers, keeper caps and typed signing; funded lifecycle shows keeper IOC short and reduce-only close. Product-purpose imperative. |
| A1: Counterweight did it on Hyperliquid testnet with zero policy keys. | Primary lifecycle keys and fills rows; key deletion precedes keeper trading. |
| A2: Counterweight puts a keyless NEAR policy contract between the keeper and the exchange. | Prototype/typed-signing and owner/keeper/public authority rows. |
| A2: The keeper proposes an order, the contract checks its bounds, and NEAR Chain Signatures sign it for Hyperliquid. | Contract caps and typed Chain Signatures; recorded lifecycle signature requests and fills. |
| A3: The owner funded the account, then deleted the policy's access keys. | Primary lifecycle funding/transfer/key-deletion ordering. |
| A3: The keeper opened a 3.5 NEAR short and closed it reduce-only. | Exact primary fills row: 3.5 @ 3.5121, close 3.5 @ 3.5212. |
| A3: The position is flat. | Recorded perp position is flat; this does not claim spot inventory was sold. |
| A4: Hypurrscan records a net withdrawal of nearly forty-seven USDC; arrival at the destination is unverified. | Withdrawal and Video rounding rows: 46.957074 net, 47.957074 gross, 1 fee; destination arrival unverified. |
| A4: That funded run was v2. | Primary lifecycle and Video versions rows. |
| A4: A separate keyless v3 lets protective exits work outside the price band. | Video versions and protective-exit rows, named native/WASM regressions, separate zero-key verifier. “Work” means signature authorization; fresh sane marks and other guards still apply, and IOC fills are not guaranteed (also labelled in picture). |
| A5: In a local simulation with the real policy WASM and mocked signatures, NEAR rallied thirty-two and a half percent in a day. | JSON `selection`: 24h, +32.499065% (32.5% rounded); `policySha256`, `mocked`, `boundaries`; local demo/rally rows. This is historical data replay, not a live price move during execution. |
| A5: The keeper closed the hedge reduce-only, and the owner's wallet never moved. | JSON first `timeline` reduce-only close, `ownerBefore == ownerAfterReplay == ownerAfter`, autonomous-phase assertions. Wallet statement is confined to the narrated local autonomous phase; owner resumes afterward. Fills are mocked (persistent badge). |
| A6: We sent seven unauthorized requests as a rogue keeper: oversized shorts, withdrawals to a rogue address, replayed callbacks, stale prices. | JSON seven `rogueAttempts`; these four are examples. The suite includes both the configured keeper and an unrelated rogue identity. |
| A6: All seven were rejected. | All seven JSON attempt `rejected` flags true; `assertions.rogueRejected = 7`. |
| A6: After a timeout, the policy allows recovery; that signature was mocked. | JSON early recovery rejection, +601s public recovery, mocked-signature boundary. |
| A7: Counterweight is a supervised testnet prototype, built at NEAR HACKATHON. | Prototype, hackathon deliverables and supervised-execution scope rows; no mainnet assertion. |
| A7: Run the local demo and check the testnet evidence yourself. | Quickstart/demo and primary evidence links; invitation to reproduce, not a claim of a new live check. |

## Verification

The video regression suites and workspace TypeScript check cover script correspondence, numerical claim anchors, complete subtitle wording, authentic source-line ordering, silent/audio timing and reveal pacing. A dedicated regression parses the **specific Worst rolling 24h rally CLAIMS row** and compares its close timestamp, four-decimal NEAR price and three-decimal H with the first `reduce-only close` in `reports/demo-local.json`. It also checks selection percentage and candidate count; matching another row cannot hide a stale claim.

Validation passed: **12 Remotion tests**, **7 legacy video tests**, the video workspace TypeScript check, and the X bundle build with zero audio files. The full-resolution still-render attempt stopped with **`Error: No available ports found`** when Remotion tried to open its local render server in this sandbox. No newly rendered MP4 or frame-level QA is claimed. Run the render/stills commands above on a host that permits the local server and Chromium. No new voiceover was generated by this task.
