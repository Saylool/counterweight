# Rebuilding the Counterweight demo videos

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
