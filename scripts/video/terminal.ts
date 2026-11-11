/** Only authentic demo output enters the renderer; no invented terminal transcript. */
import { readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { at, ROOT, run, requireFfmpeg, ffmpeg, json, png, textLines, wrap, isMain } from './common.js';

export interface LogLine { number: number; text: string }
export function transcript(raw: string): string[] {
  let lines: string[];
  if (raw.trimStart().startsWith('{')) {
    const report = JSON.parse(raw) as { status?: string; transcript?: unknown };
    if (report.status !== 'passed' || !Array.isArray(report.transcript) || !report.transcript.every(line => typeof line === 'string')) throw new Error('Saved demo JSON must contain a passed transcript.');
    lines = report.transcript as string[];
  } else {
    lines = raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\r/g, '').split('\n');
    const start = lines.findIndex(line => line.startsWith('COUNTERWEIGHT | LOCAL SANDBOX'));
    if (start < 0) throw new Error('Log has no Counterweight local sandbox header.');
    lines = lines.slice(start).filter(Boolean);
  }
  for (const expected of ['MOCK MPC', 'reduce-only close', 'PASS owner nonce + balance unchanged', 'PASS 7/7 rogue attempts rejected', 'OWNER RESUMED', 'REBALANCE rebalance complete']) {
    if (!lines.some(line => line.includes(expected))) throw new Error(`Incomplete demo log: missing ${expected}`);
  }
  if (lines.filter(line => line.startsWith('ROGUE ') && line.includes(' REJECT ')).length !== 7) throw new Error('Expected exactly seven rejected rogue attempts.');
  return lines;
}
const color = (s: string) => s.includes('REJECT') ? '#ff777d' : /SIGNED|PASS/.test(s) ? '#69e2a8' : '#d6e0ef';
export function terminalBody(rows: LogLine[], progress: number, source: string, hash: string, saved: boolean) {
  const physical = rows.flatMap(row => wrap(row.text, 102).map((text, i) => ({ text: `${i === 0 ? String(row.number).padStart(3, '0') : '   '} │ ${text}`, original: row.text })));
  const length = physical.reduce((n, row) => n + row.text.length + 1, 0);
  let remaining = Math.floor(Math.min(1, Math.max(0, progress)) * length);
  const shown: { text: string; original: string }[] = [];
  for (const row of physical) {
    if (remaining <= 0) break;
    shown.push({ ...row, text: row.text.slice(0, remaining) });
    remaining -= row.text.length + 1;
  }
  const visible = shown.slice(-18);
  return `<rect width="1920" height="1080" fill="#080f19"/><rect x="55" y="55" width="1810" height="780" rx="20" fill="#101c2b" stroke="#293d52"/>` +
    `<circle cx="88" cy="88" r="7" fill="#ff777d"/><circle cx="113" cy="88" r="7" fill="#e3bc72"/><circle cx="138" cy="88" r="7" fill="#69e2a8"/>` +
    textLines(['counterweight / npm run demo:local'], 175, 98, 26, '#d6e0ef', 'monospace') +
    textLines([`${saved ? 'SAVED ACTUAL LOG' : 'ACTUAL RUN LOG'} · LOCAL SANDBOX · MOCK MPC / FILLS / ROUTE`], 85, 145, 24, '#e3bc72', 'monospace') +
    visible.map((row, i) => textLines([row.text], 85, 200 + i * 32, 25, color(row.original), 'monospace')).join('') +
    textLines([`EDITED EXCERPT · ORIGINAL LINE NUMBERS · REVEAL IS NOT COMMAND RUNTIME`], 85, 800, 19, '#9fb1c8', 'monospace') +
    textLines([`Source: ${source} · SHA-256 ${hash.slice(0, 20)}…`], 85, 829, 18, '#9fb1c8', 'monospace');
}
async function render(name: string, rows: LogLine[], seconds: number, source: string, hash: string, saved: boolean) {
  if (!rows.length) throw new Error(`No source rows for ${name}`);
  const dir = at('terminal/frames', name);
  await mkdir(dir, { recursive: true });
  const rate = 6, total = seconds * rate;
  for (let i = 0; i < total; i++) {
    // Finish typing at 75%; keep the final evidence readable for the last quarter.
    await png(path.join(dir, `${String(i).padStart(5, '0')}.png`), terminalBody(rows, (i + 1) / (total * 0.75), source, hash, saved));
  }
  await copyFile(path.join(dir, `${String(total - 1).padStart(5, '0')}.png`), at('terminal', `${name}.png`));
  await ffmpeg(['-framerate', String(rate), '-i', path.join(dir, '%05d.png'), '-t', String(seconds), '-an', '-vf', 'fps=30,setsar=1', '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', at('terminal', `${name}.mp4`)]);
  console.log(`Rendered ${name}: ${seconds}s, 1920x1080`);
}
export async function terminal() {
  await requireFfmpeg();
  const arg = process.argv.find(arg => arg.startsWith('--log='));
  const source = arg ? path.relative(ROOT, path.resolve(ROOT, arg.slice(6))) : 'npm run demo:local';
  let raw: string;
  if (arg) raw = await readFile(path.resolve(ROOT, arg.slice(6)), 'utf8');
  else {
    console.log('Running the offline-guarded local demo (disposable localhost accounts only).');
    raw = await run('npm', ['run', 'demo:local'], { capture: true, timeout: 600_000 });
  }
  const lines = transcript(raw);
  const hash = createHash('sha256').update(raw).digest('hex');
  await mkdir(at('terminal'), { recursive: true });
  await writeFile(at('terminal/source.log'), raw);
  await json(at('terminal/provenance.json'), { source, sourceSha256: hash, renderedAt: new Date().toISOString(), saved: !!arg, originalLines: lines, note: 'Edited excerpts; original line numbers preserved. Typing speed is editorial, not runtime.' });
  const rows = lines.map((text, i) => ({ number: i + 1, text }));
  const informative = rows.filter(row => !/^(WAIT |HOUR |\d\d-\d\d .*no transaction)/.test(row.text));
  const keeper = rows.filter(row => /OWNER FROZEN|reduce-only close.*SIGNED|PASS owner nonce|OWNER AFTER/.test(row.text));
  const rogue = rows.filter(row => /^ROGUE |^PASS 7\/7/.test(row.text));
  const resumed = rows.filter(row => /^OWNER RESUMED|^REBALANCE /.test(row.text));
  await render('terminal', informative, 30, source, hash, !!arg);
  await render('keeper', keeper, 7, source, hash, !!arg);
  await render('rogue', rogue, 9, source, hash, !!arg);
  await render('resume', resumed, 6, source, hash, !!arg);
}
if (isMain(import.meta.url)) terminal().catch(error => { console.error(error); process.exitCode = 1; });
