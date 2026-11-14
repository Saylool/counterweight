# Counterweight X cut — final source, 14 November 2026

The final X cut is [revised-x-script.md](../apps/video/revised-x-script.md), mirrored exactly in [scenes.json](../apps/video/src/scenes.json). Its order is **A1 → A2 → A3 → A4 → A4M → A5 → A6 → A7**. Narration is unchanged from the 13 November cut: A1–A7 use only the existing **`videos/vo/x/01.mp3` through `07.mp3`**. A1 and A7 narration and subtitle pages match their committed versions exactly. No replacement voiceovers are required; no audio is generated.

**A4M is a silent, seven-second visual proof card added on 14 November.** It has no voiceover or audio file. The four proof rows, title and footer stay visible while the bottom subtitle-style band displays the following exact sentence in three readable pages, with or without `--subtitles`:

> On mainnet, keyless policy v4 held 3.6 wNEAR, opened and closed a real Hyperliquid short, and 17.886709 USDC arrived on Arbitrum One.

Expected runtime with the seven existing recordings is **3,020 frames / 100.67 seconds (1:40.67)** at 30 fps. Script minimum slots total 87 seconds; measured recording durations plus a 0.4-second tail extend individual scenes. A4M stays exactly 210 frames and is excluded from audio discovery and playback.

| Scene | Frames | Effective duration |
|---|---:|---:|
| A1 | 305 | 10.17 s |
| A2 | 450 | 15.00 s |
| A3 | 373 | 12.43 s |
| A4 | 394 | 13.13 s |
| A4M | 210 | 7.00 s |
| A5 | 520 | 17.33 s |
| A6 | 450 | 15.00 s |
| A7 | 318 | 10.60 s |

From the repository root:

```sh
npm run video:remotion:test
npm run video:test
npm --workspace @counterweight/video run typecheck
npm run video:remotion -- --cut=x --subtitles
```

The owner will run the final render on the host. **No render was attempted for this final-source update:** Chromium is blocked in this sandbox. The target is **`apps/video/build/counterweight-x-v3-subtitles.mp4`**, 1920×1080, 30 fps, H.264/yuv420p with AAC from the existing recordings. The `v3` filename is the existing edit filename; A4M explicitly identifies mainnet policy v4. The old 93.675-second export at that path has not been replaced by this source update. The Judge cut and [DEMO-SCRIPT.md](DEMO-SCRIPT.md) remain archived.

If the tsx CLI cannot open its IPC listener in a restricted sandbox, the equivalent entry is:

```sh
node --import tsx scripts/video/remotion.ts --cut=x --subtitles
```

`ffmpeg`, `ffprobe` and an installed Chromium are required for the owner's render. The renderer reuses Chromium under `videos/build/browsers/`; `REMOTION_BROWSER_EXECUTABLE=/absolute/path/to/chrome` selects another installed executable. Existing recordings and saved captures are inputs; prepared assets, props and output stay in `apps/video`. No evidence recapture, demo rerun, keys, chain sends or paid API is part of this workflow.

## Mainnet proof and historical scope

A4M is titled **MAINNET · 14 Nov 2026 · policy v4**. Its sources are the [14 November lifecycle summary](evidence/2026-11-14-v4-mainnet-lifecycle-summary.md) and [machine-readable evidence](evidence/2026-11-14-v4-mainnet-lifecycle-summary.json):

| Proof row | Saved result |
|---|---|
| Keyless policy | `cw4.haxheton.near`, 0 access keys, 3.6 wNEAR custody |
| Open short | 3.6 NEAR @ 3.3241; Hyperliquid `0xa768851a…` |
| Reduce-only close | 3.6 NEAR @ 3.3248; Hyperliquid `0x2fad11ed…` |
| withdraw3 arrival | 17.886709 native USDC on Arbitrum One; `0x6a6ff973…` |

Spot returned as wNEAR and the position ended flat. The footer states **owner-supervised · one lifecycle · unaudited**. Flat does not mean every venue or policy balance was emptied. The public Arbitrum receipt proves USDC arrival; owner settlement and reconciliation remain owner attestations. The cut does not claim an autonomous mainnet keeper or an audit.

A1 preserves its hedge visual and explicitly labels its policy-v2 proof rows as testnet history. A small badge also identifies the 14 November mainnet run; its original narration still says “Recorded on Hyperliquid testnet.” A2–A4 retain their testnet labels: the v2 fills (3.5 @ 3.5121 / 3.5212), withdrawal arrival on Arbitrum Sepolia, and separate 12 November v3 open/close are historical. A5–A6 retain local simulation, real WASM and mocked signatures/fills labels. Their +32.5% rally and seven rejected requests are saved local evidence.

A7 retains its original spoken testnet-prototype description and local-demo invitation. Its visual end card additionally links **https://saylool.github.io/counterweight/** and **`npm run verify:mainnet`**, states the supervised, unaudited one-mainnet-lifecycle limitation, and retains the local reproduction command.

## Captions and timing

Narrated scenes retain every exact recorded word in sentence/clause subtitle pages, at most 16 words / 110 characters per page with a minimum two-second hold. A1 and A7 use their original subtitle pages. The visual-only A4M uses its exact on-screen sentence as caption text, with the same subtitle style and page bounds; it does not pretend to have recorded narration.

```text
silent visual card: scriptSeconds × 30
missing narrated audio: ceil(max(scriptSeconds, voiceoverWords / 2.5 + 0.6) × 30)
present narrated audio: ceil(max(scriptSeconds, measuredAudioSeconds + 0.4) × 30)
```

Narrated picture beats use word positions against measured audio duration. A4 switches to its full-width v3 picture at “On November twelfth,” with the subtitle boundary. A7 reveals its complete card within 0.3 seconds. `apps/video/build/x-props.json` and `x-timeline.json` record effective timing, audio availability and input hashes when the owner prepares the render.

Video regressions cover exact source/script correspondence, unchanged narration, silent-card captions and timing, mainnet quantities and hashes, recording assignments, historical labels, and subtitle readability. Existing checks continue to cover authentic saved fills, original terminal lines, seven rejected requests, owner-state invariance and report-backed rally values. Validation passed: **19 Remotion tests, 7 legacy video tests, and the video workspace typecheck**. Independent checks confirmed all seven voiceovers match committed text, A1/A7 subtitle page arrays match exactly, and the measured existing MP3s produce 3,020 frames. No rendering or audio generation was performed; visual frame QA awaits the owner's host render.
