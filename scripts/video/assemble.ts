import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { at, ROOT, WIDTH, HEIGHT, FPS, ffmpeg, requireFfmpeg, run, png, textLines, wrap, json, readJson, isMain } from './common.js';
import { claims, main, short, schedule, duration, type Scene } from './edit.js';
import type { CaptureManifest } from './capture.js';

const exists = async (file: string) => { try { await access(file); return true; } catch { return false; } };
export async function validateClaims() {
  for (const [id, claim] of Object.entries(claims)) {
    for (const evidence of claim.evidence) {
      const source = await readFile(path.join(ROOT, evidence.path), 'utf8');
      if (!source.includes(evidence.contains)) throw new Error(`Claim ${id}: evidence anchor missing in ${evidence.path}: ${evidence.contains}`);
    }
  }
}
export async function cards() {
  const repo = process.env.VIDEO_REPO_URL || '[REPOSITORY URL — REPLACE BEFORE PUBLISHING]';
  if (repo.length > 160 || (process.env.VIDEO_REPO_URL && !/^https:\/\/[a-z0-9.-]+\//i.test(repo))) throw new Error('VIDEO_REPO_URL must be an HTTPS repository URL, at most 160 characters.');
  for (const end of [false, true]) {
    await png(at('cards', `${end ? 'end' : 'title'}.png`),
      '<rect width="1920" height="1080" fill="#0b1522"/><rect x="100" y="160" width="8" height="510" fill="#67cba0"/>' +
      textLines(['NEAR × HYPERLIQUID'], 150, 220, 30, '#67cba0') +
      textLines(['counterweight.'], 140, 350, 112) +
      textLines(end ? ['Built at NEAR HACKATHON', 'Inspect the evidence. Rebuild the demo.'] : ['A hedge with boundaries.', 'Funded testnet. Keyless policy.'], 150, 460, 42) +
      (end ? '' : textLines(['Built at NEAR HACKATHON'], 150, 585, 28, '#d4b480')) +
      textLines(wrap(repo, 85), 150, 650, 28, '#a6b7d0') +
      textLines(['Testnet prototype · not investment advice'], 150, 775, 30, '#d4b480'));
  }
  return repo;
}
export async function caption(file: string, scene: Scene, unavailable = false) {
  const lines = wrap(claims[scene.claim].caption, 87);
  if (lines.length > 3) throw new Error(`Caption too long: ${scene.claim}`);
  await png(file, '<rect x="0" y="832" width="1920" height="248" fill="#080f19" fill-opacity="0.97"/>' +
    '<rect x="54" y="854" width="5" height="170" fill="#67cba0"/>' +
    textLines([unavailable ? 'PUBLIC READ UNAVAILABLE · NO DATA SUBSTITUTED' : scene.scope], 82, 877, 23, unavailable ? '#ff999c' : '#9cdabc') +
    textLines(lines, 82, 930, 37, '#f5f7fa', 'sans-serif', 1.23) +
    textLines([`COUNTERWEIGHT  /  ${scene.claim.toUpperCase()}  /  SOURCES: docs/DEMO-SCRIPT.md → claim mapping`], 82, 1055, 18, '#9fb1c8'));
}
async function media(scene: Scene) {
  if (scene.shot === 'title' || scene.shot === 'end') return { file: at('cards', `${scene.shot}.png`), still: true };
  const terminal = ['terminal', 'keeper', 'rogue', 'resume'].includes(scene.shot);
  const folder = terminal ? 'terminal' : 'captures';
  const clip = at(folder, `${scene.shot}.mp4`);
  const file = await exists(clip) ? clip : at(folder, `${scene.shot}.png`);
  if (!await exists(file)) throw new Error(`Missing ${scene.shot}. Run video:capture and video:terminal first.`);
  return { file, still: file.endsWith('.png') };
}
export async function probe(file: string) {
  return JSON.parse(await run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { capture: true })) as {
    streams: { codec_type: string; codec_name: string; width?: number; height?: number }[];
    format: { duration: string; size: string };
  };
}
export async function cut(name: string, scenes: Scene[], manifest: CaptureManifest) {
  const chunks: string[] = [];
  const timeline = schedule(scenes);
  for (const [i, scene] of timeline.entries()) {
    const input = await media(scene);
    const overlay = at('captions', name, `${String(i).padStart(2, '0')}.png`);
    const failed = manifest.records.find(r => r.shot === scene.shot)?.state === 'unavailable';
    await caption(overlay, scene, failed);
    const output = at('segments', `${name}-${String(i).padStart(2, '0')}.mp4`);
    await mkdir(path.dirname(output), { recursive: true });
    const inputArgs = input.still ? ['-loop', '1', '-framerate', String(FPS)] : ['-stream_loop', '-1'];
    await ffmpeg([...inputArgs, '-i', input.file, '-loop', '1', '-framerate', String(FPS), '-i', overlay,
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
      '-filter_complex', `[0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0x080f19,setsar=1,fps=${FPS}[base];[base][1:v]overlay=0:0:shortest=1,format=yuv420p[v]`,
      '-map', '[v]', '-map', '2:a:0', '-t', String(scene.seconds), '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
      '-maxrate', '8M', '-bufsize', '16M', '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', '-movflags', '+faststart', output]);
    chunks.push(output);
    console.log(`${name}: ${i + 1}/${scenes.length} ${scene.shot} (${scene.seconds}s)`);
  }
  // Relative known filenames avoid concat shell/path escaping issues.
  const list = at('segments', `${name}.txt`);
  await writeFile(list, chunks.map(file => `file '${path.basename(file)}'`).join('\n') + '\n');
  const output = path.join(ROOT, 'videos', `${name}.mp4`);
  await ffmpeg(['-f', 'concat', '-safe', '1', '-i', list, '-c', 'copy', '-movflags', '+faststart', output]);
  const info = await probe(output);
  const video = info.streams.find(stream => stream.codec_type === 'video');
  const audio = info.streams.find(stream => stream.codec_type === 'audio');
  if (video?.codec_name !== 'h264' || video.width !== WIDTH || video.height !== HEIGHT || audio?.codec_name !== 'aac') throw new Error(`${output}: unexpected codecs or resolution`);
  if (Math.abs(Number(info.format.duration) - duration(scenes)) > 0.25) throw new Error(`${output}: duration drift`);
  if (name === 'counterweight-x' && Number(info.format.size) > 512_000_000) throw new Error('X cut exceeds 512 MB');
  const sha256 = createHash('sha256').update(await readFile(output)).digest('hex');
  await json(at(`${name}-timeline.json`), timeline.map(scene => ({ ...scene, caption: claims[scene.claim].caption, evidence: claims[scene.claim].evidence })));
  return { output: path.relative(ROOT, output), sha256, duration: Number(info.format.duration), bytes: (await stat(output)).size, probe: info };
}
export async function assemble() {
  await requireFfmpeg(); await validateClaims();
  const manifest = await readJson<CaptureManifest>(at('captures/manifest.json'));
  const required = new Set([...main, ...short].map(scene => scene.shot).filter(shot => !['title', 'end', 'terminal', 'keeper', 'rogue', 'resume'].includes(shot)));
  for (const shot of required) if (!manifest.records.some(r => r.shot === shot)) throw new Error(`Capture manifest lacks ${shot}`);
  if (manifest.records.some(r => r.state === 'unavailable') && !process.argv.includes('--allow-unavailable')) throw new Error('Capture contains unavailable public pages. Review manifest, then retry or explicitly pass --allow-unavailable to burn in failure labels.');
  const repo = await cards();
  console.log(`Repository end card: ${repo}`);
  const outputs = [await cut('counterweight-demo', main, manifest), await cut('counterweight-x', short, manifest)];
  await json(at('build-manifest.json'), { builtAt: new Date().toISOString(), repo, captureManifest: 'captures/manifest.json', terminalProvenance: 'terminal/provenance.json', outputs });
  for (const output of outputs) console.log(`${output.output}: ${output.duration.toFixed(2)}s, ${(output.bytes / 1e6).toFixed(1)} MB`);
}
if (isMain(import.meta.url)) assemble().catch(error => { console.error(error); process.exitCode = 1; });
