# Remotion production cuts (v2)

The primary production workflow is the `@counterweight/video` npm workspace in `apps/video`, driven by `scripts/video/remotion.ts`. The only root changes are npm command registration/workspace lock metadata and these requested documentation/claim entries. No product, keeper, contract, capture or existing edit logic is changed. No Git command, key, signing operation, testnet send, paid API, AI imagery or music is needed.

From the repository root:

```sh
npm ci --cache /private/tmp/counterweight-video-npm
npm run video:remotion:test
npm --workspace @counterweight/video run typecheck
export VIDEO_REPO_URL=https://gitlab.com/gocworks-group/hip3-smart-money
npm run video:remotion -- --cut=x
npm run video:remotion -- --cut=judge
```

Verify that `VIDEO_REPO_URL` is the public submission URL before publishing. If unset, the review card deliberately displays `[PUBLIC REPOSITORY URL — SET VIDEO_REPO_URL]`. The renderer never discovers it through Git. Use the environment value for an alternative submission repository.

| Composition | Silent base length | Output |
|---|---|---|
| `XCut` | 75 seconds / 2,250 frames | `videos/counterweight-x-v2.mp4` |
| `JudgeCut` | 165 seconds / 4,950 frames | `videos/counterweight-judge-v2.mp4` |

Both compositions are 1920×1080 at 30 fps, H.264/yuv420p (CRF 18). Voiceover is AAC when present. Each scene without a supplied MP3 is silent, including its UI clicks. No music is added. When voiceover is present, quiet synthesized state clicks accompany transitions; the click source is normalized to -24 LUFS. Numeric tables have no music bed. External fonts are not fetched; the film uses system sans/monospace and the real product's captured typography.

## Preview and inspection

```sh
npm run video:remotion -- --cut=x --preview
# Open http://localhost:3333, choose XCut or JudgeCut. Ctrl-C stops Studio.
# Refresh/restart the command after adding/replacing voiceover files.
npm run video:remotion -- --cut=judge --stills
# Cheap 1-second sample (960×540; sample file, never overwrites final):
npm run video:remotion -- --cut=x --frames=0-29 --scale=0.5
# Bundle and audit the timing/assets without launching Chromium:
npm run video:remotion -- --cut=x --bundle-only
npm run video:remotion -- --cut=judge --bundle-only
```

`--preview` prepares **both** cuts and opens a local Remotion Studio server without launching a browser. Git-source integration is disabled; file polling is enabled. Stills include every scene and all architecture beats in `apps/video/build/stills/{x,judge}/`. Inclusive `--frames=START-END` renders to `videos/counterweight-{x,judge}-v2-sample.mp4`. `--scale=0.5` is a review-only resolution override and always uses the sample filename; omit it for final output. `--concurrency=2` is the default; lower to `1` if memory is tight.

The first local Chromium selection reuses `videos/build/browsers/chromium_headless_shell-*` when available; otherwise Remotion uses its normal local browser discovery/download. A custom browser can be supplied:

```sh
REMOTION_BROWSER_EXECUTABLE=/absolute/path/to/chrome npm run video:remotion -- --cut=x
REMOTION_BROWSER_EXECUTABLE=/absolute/path/to/chrome npm run video:remotion -- --cut=judge
```

This sandbox successfully installs dependencies, typechecks, runs the new/existing video tests, prepares both cuts and compiles their bundle. Its Chromium launch fails with macOS `bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100)`. Studio additionally fails with `EMFILE: too many open files, watch` here, even with polling. The available browser host is unavailable. **No new v2 MP4 or rendered still is claimed.** The lead must run the two final render commands above outside this sandbox, then inspect the stills and finished movies at phone size. A browser path alone does not remove a process-launch restriction. `ffmpeg`/`ffprobe` must be on PATH (`brew install ffmpeg` on macOS).

## Voiceover and the single scene data file

Place scene files at `videos/vo/x/01.mp3` … `07.mp3`, and `videos/vo/judge/01.mp3` … `10.mp3`. Names are two-digit scene numbers from the corresponding production table. Missing files are accepted. Present but invalid/unreadable audio fails rather than silently disappearing. `ffprobe` measures each actual MP3; the timeline uses:

```text
durationInFrames = ceil(max(scriptSeconds, audioSeconds + 0.4) * 30)
```

Later scenes start immediately after the extended scene, so nothing overlaps and dialogue is never truncated. Diagram beats run at the script's specified 0–4 / 4–9 / 9–14 / 14–19 seconds, then hold if voiceover extends the scene. Footage pans scale over the available scene duration. The rogue summary holds for the last 3 seconds in X and 3.5 seconds in Judge. All terminal lines appear whole, with their original source line numbers; no typewriter effect or invented transcript.

`apps/video/src/scenes.json` is the one edit file for scene order, timing, exact VO, captions, footage camera rectangles, split-screen placement, badges, numeric claim anchors and known editorial deviations. `apps/video/production-script.md` is a verbatim review snapshot of the supplied final script. The correspondence test can also compare to the lead's source:

```sh
VIDEO_PRODUCTION_SCRIPT=/absolute/path/to/out-v-senaryo.md npm run video:remotion:test
```

`apps/video/build/{x,judge}-timeline.json` records the effective frame schedule, missing audio, source hashes and repo URL; `*-props.json` records render inputs. Completed render verification writes `{x,judge}-render.json` with ffprobe results. These generated files and staged public inputs are ignored inside the video workspace. Preparing does not execute the local demo or contact any explorer: it reads existing captures and the passed `reports/demo-local.json`.

## Evidence and review notes for the lead

All requested footage already exists. The renderer stages original PNG captures and animates smooth camera moves over them; these are authentic captured frames, not recreated product screens. It checks capture-manifest status and fails for absent/failed footage. The sole original illustration is the shared animated architecture diagram, shown once per cut. Hypurrscan is hard-cropped to source rectangle `(76,230,1768,337)` **before** every camera transform, so the RPC error box above it can never re-enter frame. Destination arrival remains labelled unverified.

The supplied script's visual directions contain details that disagree with actual inputs. Voiceover/captions/timings are kept verbatim; footage retains the recorded evidence:

- The finalized **v3** verifier shows SHA `052d4d87…87838c`, distinct from the recorded v2/local `1bb1cc57…08a7a`. Judge's side-by-side view includes the real product mismatch warning as an inset and the separate verifier receipt; it never paints a fake hash match into the product UI.
- The saved sandbox closes on **2026-09-17 10:00 UTC, $2.8062, H 2.281**. The script's **2026-09-18 02:00 UTC, $3.2299, H 2.535** close direction is stale. The +32.499065% window and untouched-owner proof are retained with actual lines.
- The existing evidence shot has three proof/limitation cards, not the proposed scope matrix. The cut supplements it with the real lifecycle limitations text. The existing full/OOS screenshots show the illustrative size; small-size losses and negative venue equity remain narrated and checked against the report, without fabricated extra table rows.

These deviations are also recorded in the scene data and `docs/CLAIMS.md`. Before public release the lead should approve the evidence-faithful visual substitutions (or supply new real shots), add final voiceover, confirm the public URL, render, and review numerical framing/legibility. If a real shot is missing, the lead can rerun `npm run video:capture`; the Remotion workflow itself does not recapture or send transactions.

The new tests enforce exact script correspondence, continuous base timing, MP3-extension arithmetic, ≤8 caption words (standalone separators do not count as words), one diagram per cut, proof-first hooks, mock labels, transaction-table hard crops, complete spoken-number mappings into `docs/CLAIMS.md`, and replay/local quantities against committed reports. Existing legacy video tests also pass. The actual MP3 duration probe and synthesized click normalization were exercised locally (-24.05 LUFS measured for the click source). No browser render or visual QA is asserted from these checks.

---

# Legacy ffmpeg edit (prior cuts)

Run from the repository root with Node >=22.19.0. No wallet, keys, paid APIs, AI imagery, signing, testnet sends or music are used. Chromium visits the real read-only product and public explorers in a fresh browser context. Local execution uses the existing offline-guarded disposable sandbox. Video typing and edit times are editorial, not command runtimes.

```sh
npm ci --cache .tmp/npm-video-cache
# macOS, if ffmpeg/ffprobe are missing:
brew install ffmpeg
# Linux alternative: sudo apt-get install ffmpeg
PLAYWRIGHT_BROWSERS_PATH=videos/build/browsers npx playwright install chromium
npm run video:test
PLAYWRIGHT_BROWSERS_PATH=videos/build/browsers npm run video
```

The last command runs the terminal renderer, browser capture, then assembly. It starts `npm run web` if localhost:5173 is free; an existing Counterweight server is reused. Stop/restart an existing server if the report or source changed, because evidence assets are read at server startup. Chromium runs headless by default; use `npm run video -- --headed` for visible capture. On Linux, Playwright may request OS libraries: run `npx playwright install-deps chromium` with appropriate system privileges. A sandbox may deny Chromium process launch even after downloading it; run the exact commands above on the lead's machine.

To use the actual committed passing local log instead of rerunning the sandbox:

```sh
PLAYWRIGHT_BROWSERS_PATH=videos/build/browsers npm run video -- --log=reports/demo-local.json
```

Individual steps, useful when the lead must do only browser work:

```sh
npm run video:terminal -- --log=reports/demo-local.json
# Optional separate terminal: npm run web
PLAYWRIGHT_BROWSERS_PATH=videos/build/browsers npm run video:capture
npm run video:assemble
```

`--log=/path/to/saved-demo.log` accepts saved real stdout too. The renderer requires the sandbox header, keeper close, owner unchanged, seven rejected attacks and completed owner rebalance; failed/incomplete output is rejected. JSON input must have `status: passed`. The complete source is copied to `videos/build/terminal/source.log` and hashed. Rendered excerpts retain source line numbers, keep mock boundaries visible, and never manufacture output. For fresh sandbox runs, the existing `demo:local` command also regenerates `reports/demo-local.{json,md}`. Do not record unrelated terminal content.

Outputs:

| Path | Content |
|---|---|
| `videos/counterweight-demo.mp4` | 150 seconds, 1920×1080, 30 fps, H.264/yuv420p + silent AAC |
| `videos/counterweight-x.mp4` | 60 seconds, same format, checked below 512 MB |
| `videos/build/captures/*.png` | 1920×1080 stills of every requested product/public view |
| `videos/build/captures/*.mp4` | Five-second steady holds trimmed from real Playwright recordVideo clips |
| `videos/build/captures/raw/` | Original WebM recordings including load/scroll operations |
| `videos/build/captures/manifest.json` | URLs, UTC observation time, body hashes, timeouts and failures |
| `videos/build/captures/v3-proof.json` | Actual finalized RPC responses, code hash and key list; same-block checks |
| `videos/build/terminal/` | Source/provenance, 1920×1080 SVG→Sharp PNG frames, full edited terminal and focus clips |
| `videos/build/captions/` | Transparent English caption PNG overlays; no ffmpeg drawtext dependency |
| `videos/build/*-timeline.json` | Exact caption intervals and evidence mapping for each finished cut |
| `videos/build/build-manifest.json` | Output SHA-256 hashes, ffprobe results, sizes and durations |

All `videos/` output is ignored. Chromium is installed there intentionally to support restricted writable roots. Recordings have a fixed viewport, scale 1, UTC, English locale, dark preference and deterministic scrolling; scale 2 adds file size without improving 1080p output. Public data and explorer layouts can change, so the timeline/layout are reproducible but network captures and encoded bytes are not promised identical across machines.

The funded lifecycle and provided explorer URLs are **v2**. **v3** is a different account. The capture also inspects v3 in the actual UI without changing its returned data or artifact comparison. If the current UI still compares to the v2 artifact, its mismatch is retained. The cut uses a separately labelled **PUBLIC RPC VERIFICATION · CAPTURE UTILITY, NOT PRODUCT UI** receipt: it hashes the committed v3 WASM, verifies SHA256SUMS, and checks live account code and keys at one finalized block. It only prints a match/zero keys when the responses actually show them. A prior deployment report is not silently presented as current verification.

Capture waits for network idle, fonts and product requests, hides only specifically identified cookie banners, and never hides warnings or errors. Its request guard allows GET/HEAD/OPTIONS and public NEAR JSON-RPC views / Hyperliquid `/info` reads; transaction-capable POSTs are blocked. No existing browser profile or wallet extension is loaded. Cookie rejection is limited to explicitly named necessary-only/reject controls. Review the captured explorer fills and transaction details; if the explorer changes, update its selectors rather than fabricating evidence. The dated lifecycle values in captions remain dated even if current balances change.

Public failures are preserved, never converted into zero balances or green checks. The default build stops if a public page or v3 verification fails. Inspect `captures/manifest.json`, then retry the browser step. To intentionally produce a review cut with unavailable public pages labelled on screen:

```sh
PLAYWRIGHT_BROWSERS_PATH=videos/build/browsers npm run video:capture -- --allow-unavailable
npm run video:assemble -- --allow-unavailable
```

Product API errors stay visible as product states and are recorded in manifest notes. Inspect **all** notes and screenshots before publishing. A loading spinner, challenge page or missing fills is not proof. Never bypass explorer challenges or replace failed reads with a simulated response. Captions cite dated records and do not claim current balances.

Edit captions/times/scopes only in `scripts/video/edit.ts`, add evidence anchors for any new claim, then run:

```sh
npm run video:script
npm run video:test
```

Tests enforce 150/60-second continuous frame-aligned schedules, readable caption lengths, short-cut opening order, mock labels, exact script correspondence and real evidence anchors. Human review still determines whether a cited record supports new wording. `docs/CLAIMS.md` and dated evidence bound every factual caption; the small allocation is never sold as profitable and no yield is promised. The holdout is retrospective and execution simulated.

The default end card deliberately contains `[REPOSITORY URL — REPLACE BEFORE PUBLISHING]`. Once the public repository is known, reassemble with:

```sh
VIDEO_REPO_URL=https://github.com/OWNER/REPO npm run video:assemble
```

Both cards include “Built at NEAR HACKATHON” and “Testnet prototype · not investment advice”. Review cuts locally (e.g. `open videos/counterweight-demo.mp4` and `open videos/counterweight-x.mp4` on macOS), including caption legibility, mock/dated labels, visible failures and the public fill/key-deletion proof. Assembly checks ffmpeg/ffprobe, H.264/AAC, 1080p, duration drift and X file size. It uses hard cuts with no voiceover or music; audio is a silent compatibility track.
