# Revised X cut (v3 edit)

Only the X cut is a deliverable. Judge scene data, illustration code and voiceover files remain archived in place; preparing or previewing X does not prepare Judge.

From the repository root:

```sh
npm run video:remotion:test
npm run video:test
npm --workspace @counterweight/video run typecheck
# Render a silent review MP4 with the exact voiceover burned into the picture:
npm run video:remotion -- --cut=x --subtitles
# Interactive local Studio:
npm run video:remotion -- --cut=x --preview --subtitles
# Inspect all scenes and evidence/diagram beats:
npm run video:remotion -- --cut=x --subtitles --stills
# Bundle/timeline audit without Chromium:
npm run video:remotion -- --cut=x --subtitles --bundle-only
```

Output: `videos/counterweight-x-v3-subtitles.mp4`, 1920×1080, 30 fps, H.264/yuv420p. Omit `--subtitles` for `videos/counterweight-x-v3.mp4`. The optional subtitles are a burned preview layer displaying the exact voiceover in cues of at most nine words; the editorial captions remain visible above it. There is no synthesized voice, music or click track when scene audio is missing. `--frames=0-29 --scale=0.5` writes a separate sample. Default render concurrency is 2; use `--concurrency=1` if needed.

The script slots total 82 seconds. The silent preview is **2,635 frames / 87.833 seconds**, because missing audio uses a natural reading floor:

```text
missing audio: ceil(max(scriptSeconds, voiceoverWords / 2.5 + 0.6) * 30)
present audio: ceil(max(scriptSeconds, measuredAudioSeconds + 0.4) * 30)
```

Words use the scene model's whitespace count; no playback speed-up is applied. Every extension ripples subsequent starts without gaps or overlaps. The silent scene lengths are A1 11.400s, A2 14.600s, A3 16.633s, A4 12.000s, A5 13.000s, A6 12.000s, A7 8.200s. A3's four equal evidence beats and A2's three happy-path stages scale with their effective scene durations.

Old X recordings were moved from `videos/vo/x` to `videos/vo-old/x`. Judge files were untouched. The renderer reads only the default `videos/vo/{cut}/01.mp3` etc.; old staged public audio cannot activate a scene because the input audio map is rebuilt from that default path. Put new recordings at `videos/vo/x/01.mp3` through `07.mp3` only after re-voicing all seven revised scenes. Audio must be valid; ffprobe failures stop preparation.

`apps/video/src/scenes.json` supplies exact X narration, captions and script slots. `apps/video/revised-x-script.md` preserves the supplied revised table; `production-script.md` preserves the old script for the archived Judge data. `apps/video/build/x-{props,timeline}.json` records effective timing, source hashes and missing audio. No demo rerun, keys, chain sends, paid services or Git operations are required. Existing passed report and captured evidence are read locally.

The end card defaults to the supplied `https://github.com/Saylool/counterweight`. `VIDEO_REPO_URL` can explicitly override it; no repository destination is inferred through Git. This pass does not assert that the remote repository is publicly accessible.

## Evidence and layout corrections

- A1 states the problem and shows three large verified states, replacing the mismatched transfer crop. A3 reveals four phone-readable evidence cards: owner funded → policy access keys: 0 → 3.5 NEAR short filled → reduce-only close, position flat. Small transaction references stay in a footer; there is no scrolling table or cropped hash column. These are labelled editorial evidence cards, not recreated product UI.
- A2 holds the happy path only. Packet labels travel on a rail 28px above the connectors, above node boxes; the red rejection state is reserved for A6. Archived Judge illustration code remains available.
- A4 holds one framed 50/50 split for its entire duration. The original Hypurrscan table and finalized verifier are contained with 16px panel padding. The capture does **not** have a Fee column; exact gross **47.957074**, net **46.957074**, fee **1 USDC**, and fixed recipient are labelled annotations sourced to `docs/evidence/2026-11-10-lifecycle-status.md`. No explorer column is fabricated. Destination arrival remains unverified.
- The verifier's actual v3 SHA-256 is `052d4d8758a1e470c5d6c32ff8610564c39dde47194d7a4de42f97a2c587838c`, shown fully, wrapping inside its panel. The revised script's proposed `1bb1cc57…08a7a` is the historical v2/local hash, not v3. Narration retains the exact revised distinction between the funded v2 run and separate keyless v3 deployment. The added CLAIMS row names native and production-WASM out-of-band exit regressions and links POLICY-V3; A4 keeps the revised narration without adding an exit/fill guarantee.
- A5 excerpts original lines **003, 005, 007, 010, 016, 036, 050**, strictly ascending. `reports/demo-local.json.timeline` and the **Video rally** row in CLAIMS agree on the actual close: **2026-09-17 10:00 UTC, $2.8062, H 2.281**. The earlier Local demo row in CLAIMS and the revised visual directions still specify September 18 / $3.2299 / H 2.535. September 18 is already after the saved close (`spot approval pending`); those stale values are excluded from the cut. Only the requested v3 entry was added to CLAIMS; no other claims rows were edited. Narration says real WASM, mocked signatures/fills and 32.5% rally, which are supported by both the report and claims.
- A6 keeps all seven original rogue rejection lines, early dead-man rejection, mocked recovery and PASS summary on screen. Three callouts advance alongside them. Blank pipe-only spacers are excluded, inline transcript separators stay on the same physical line, and original source line numbers are preserved. Nothing is typed character by character.
- A7 uses one hackathon label, a large repository URL, reproduction command, historical contract identifier and scope footer.

## Verification status and render requirements

The scene correspondence, literal numeric claims, caption length, silent/audio timing, complete subtitle wording and authentic terminal excerpt checks pass, along with legacy video tests and the video workspace TypeScript check. The X bundle compiles with zero audio files. Stills sample the opening and four points of every scene, including all A3 evidence beats.

This sandbox denies Chromium startup with `bootstrap_check_in … MachPortRendezvousServer … Permission denied (1100)`; the browser access host is also unavailable. **No newly rendered MP4 or pixel-level visual QA is claimed.** Run the render/stills commands above in a terminal with normal local Chromium permission, then inspect the generated frames and movie at phone size. `ffmpeg` and `ffprobe` must be on PATH. Existing Chromium under `videos/build/browsers/chromium_headless_shell-*` is reused; `REMOTION_BROWSER_EXECUTABLE=/absolute/path/to/chrome` can select a different installed browser, but does not override process-launch restrictions. Local Studio additionally depends on the host's watcher limits.
