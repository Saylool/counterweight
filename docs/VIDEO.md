# Counterweight X cut — round 4 · final recording script

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

Output: `apps/video/build/counterweight-x-v3-subtitles.mp4`, 1920×1080, 30 fps, H.264/yuv420p. The filename retains the existing edit version; this is review round 4. Omit `--subtitles` for `apps/video/build/counterweight-x-v3.mp4`. Stills, props, timeline and bundle are written inside `apps/video/build`. `--frames=0-29 --scale=0.5` renders a separate sample. Default render concurrency is 2.

## Narration, subtitles and timing

`src/scenes.json` and `revised-x-script.md` contain the final exact manager-supplied A1–A7 narration (A2, A3 and A7 unchanged): **184 whitespace-delimited words**. All seven scenes require new recordings. No paid generation, network evidence capture, keys, chain sends or demo rerun is needed.

There is **one bottom text band**. `--subtitles` replaces the bold editorial caption with sentence/clause narration pages, sized for at most two lines. It does not stack captions and subtitles. Protected phrases stay on one page: “what the keeper can sign”, “policy's access keys”, “NEAR HACKATHON” and “testnet evidence”. Evidence labels, source records and the requested A1 headline remain in the main picture. The final voiced export should use `--subtitles` too.

Script slots total **80 seconds**. The current silent preview is **2,550 frames / 85.0 seconds**, using the unchanged timing rule:

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

The voiced runtime depends on measured recordings and will be at least 80 seconds. No speed-up is applied. Missing audio produces no synthesized voice, music or click track. New recordings are read from `videos/vo/x/01.mp3` through `07.mp3`; those files are currently absent. Old recordings remain in their existing archive. Preparation rebuilds the audio map, so stale staged public assets cannot activate a scene.

`apps/video/build/x-{props,timeline}.json` records effective timing, source hashes and absent audio. The end-card repository URL defaults to `https://github.com/Saylool/counterweight`; `VIDEO_REPO_URL` overrides it. This pass does not claim a remote accessibility check.

## Picture changes

- A1 retains the requested headline, adds the simple **NEAR holdings + short hedge** visual, and reveals **0 ACCESS KEYS / BOUNDED OPEN / REDUCE-ONLY FLAT** beside short transaction IDs. Fill quantities/prices appear in A3.
- A2 advances the headline, node and arrow highlight once: **Keeper → Policy checks → NEAR Chain Signatures → Hyperliquid**. Packet motion is clamped to one traversal. Owner configuration remains a separate edge; the padlock stays beside the zero-keys badge.
- A3 uses four chronological beats. Short/close beats hold the **saved `verification.fills[0]` selected fields and `verification.flat`** as the main element, with large **3.5, 3.5121, 3.5212 and flat**. These are typeset JSON excerpts, not screenshots or a fresh exchange query. Full evidence filenames and field labels preserve provenance. `src/recorded-fills.json` contains the complete original verification objects; preparation compares every field against the saved source files and records their SHA-256 hashes in the timeline.
- A4 uses **two sequential full-width beats**, changing exactly with the subtitle page beginning **“Separately”** (6.552s into the silent 13s scene). First: original Hypurrscan Method and Amount/Token crops at 2.5×, **46.957074 USDC net**, and **destination arrival unverified**. The source rounds to 46.96; exact precision is attributed to the saved lifecycle status. Second: the original verifier crop `[80,138,1040,245]` at 1.2× shows the policy, finalized block, zero keys and matching v3 WASM. Its entire block-hash line fits; the lower live/committed-code and SHA lines are excluded. The full WASM SHA appears only once, in muted provenance. **IOC fill not guaranteed** stays visible.
- A5 foregrounds **Local simulation · +32.5% / 24h · reduce-only close · owner nonce/balance unchanged**. Original lines **003 → 010 → 016 → 036 → 050** reveal progressively. The muted **TIME UTC / NEAR / H / ACTION / RESULT** header appears immediately above 016; **nonce=7000002** and **(unchanged)** are highlighted on 050. Close values remain **09-17 10:00 UTC, $2.8062, H 2.281**.
- A6 shows exactly **seven red REJECT rows** beside **7/7 tested cases**. Emphasis moves through original rows **037 (over cap), 039 (rogue withdrawal), 044 (stale price)**, then **049 (+601s mocked recovery)**. The early dead-man rejection is amber behind a separate timelock divider and stays outside the red-case count.
- A7 gives **Code + recorded testnet evidence** and the repository URL the principal hierarchy. The complete CTA finishes its entrance at 0.8s and holds for the remaining **7.8s** of the silent scene. Installation commands appear only in the archived Judge card; repository instructions contain the X reproduction steps.

Subtitles and picture beats share word-proportional pacing over the scene, reserving a 0.4s tail. The A4 switch and A2 transitions follow the named narration phrases. This is estimated synchronization for the silent cut; final waveform timing must be checked after recording, with the wording locked. No speech is accelerated.

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
| A4: The recorded v2 run withdrew nearly forty-seven USDC net; destination arrival is unverified. | Primary withdrawal and Video rounding rows: 46.957074 net, 47.957074 gross, 1 fee; destination arrival explicitly unverified. Video versions identifies funded v2. |
| A4: Separately, a keyless v3 keeps reduce-only exits open outside the price band. | Video versions and protective-exit rows, named native/WASM regressions, separate zero-key verifier. “Open” describes authorization availability; fresh sane marks and other guards still apply. IOC fills are not guaranteed (labelled in picture). |
| A5: In a local simulation with the real policy WASM and mocked signatures, NEAR rallied thirty-two and a half percent in a day. | JSON `selection`: 24h, +32.499065% (32.5% rounded); `policySha256`, `mocked`, `boundaries`; CLAIMS local-demo/rally rows. Historical-data replay, not a live price move during execution. |
| A5: The keeper closed the hedge reduce-only, and the owner's nonce and balance stayed unchanged. | First JSON `timeline` reduce-only close; `ownerBefore == ownerAfterReplay == ownerAfter` (nonce 7000002 and balance 99999347412735944600000000 yocto); autonomous-phase assertions and CLAIMS owner nonce/balance row. Signatures/fills are mocked and labelled. Owner participates only after the narrated autonomous phase. |
| A6: Seven tested unauthorized requests, from oversized shorts to rogue withdrawals, were all rejected. | Seven JSON `rogueAttempts`, each `rejected == true`; examples “increase beyond caps” and “withdraw to rogue”; `assertions.rogueRejected == 7`; CLAIMS seven-attack row. This count excludes the separate early-timeout check. |
| A6: After a timeout, the policy allows recovery; that signature was mocked. | JSON early recovery rejection, transcript +601s public recovery, `assertions.unrelatedDeadmanSigned`, `mocked` signature boundary; CLAIMS local authority rows. |
| A7: Counterweight is a supervised testnet prototype, built at NEAR HACKATHON. | Prototype, hackathon deliverables and supervised-execution scope rows; no mainnet assertion. |
| A7: Run the local demo and check the testnet evidence yourself. | Quickstart/demo and primary evidence links; invitation to reproduce. |

## Verification

The video regression suites and workspace TypeScript check cover script correspondence, numerical claim anchors, complete subtitle wording, authentic source-line ordering, silent/audio timing and reveal pacing. A dedicated regression parses the **specific Worst rolling 24h rally CLAIMS row** and compares its close timestamp, four-decimal NEAR price and three-decimal H with the first `reduce-only close` in `reports/demo-local.json`. It also checks selection percentage and candidate count; matching another row cannot hide a stale claim.

Validation passed: **16 Remotion tests**, **7 legacy video tests**, the video workspace TypeScript check, and the X bundle build with zero audio files. Added regressions lock final narration, protected subtitle phrases, monotonic architecture progression, the “Separately” switch, exact saved fill records, seven red-case classification, and three representative highlights followed by recovery. The full-resolution still-render attempt stopped with **`Error: No available ports found`** when Remotion tried to open its local render server in this sandbox. A direct local Chromium launch also failed inside the sandbox. No newly rendered MP4 or frame-level QA is claimed. The pre-existing MP4 under `videos/` is stale; the next successful X render writes under `apps/video/build/`. Run the render/stills commands above on a host that permits the local server and Chromium. No new voiceover was generated by this task.
