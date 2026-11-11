import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const BUILD = path.join(ROOT, 'videos/build');
export const WIDTH = 1920, HEIGHT = 1080, FPS = 30;
export const at = (...parts: string[]) => path.join(BUILD, ...parts);
export const xml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);
export const isMain = (url: string) => !!process.argv[1] && url === pathToFileURL(path.resolve(process.argv[1])).href;
export async function json(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2) + '\n');
}
export async function readJson<T>(file: string): Promise<T> { return JSON.parse(await readFile(file, 'utf8')) as T; }
export async function run(command: string, args: string[], options: { capture?: boolean; timeout?: number } = {}) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, env: { ...process.env, NO_COLOR: '1' },
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'] });
    let stdout = '', stderr = '';
    child.stdout?.on('data', b => { stdout += String(b); });
    child.stderr?.on('data', b => { stderr = (stderr + String(b)).slice(-16000); });
    const timer = setTimeout(() => child.kill('SIGTERM'), options.timeout ?? 600_000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} exited ${code}: ${stderr.slice(-3000)}`));
    });
  });
}
export async function requireFfmpeg() {
  try { await run('ffmpeg', ['-version'], { capture: true }); await run('ffprobe', ['-version'], { capture: true }); }
  catch { throw new Error('ffmpeg and ffprobe are required. macOS: brew install ffmpeg; Ubuntu: sudo apt-get install ffmpeg'); }
}
export const ffmpeg = (args: string[]) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
export function wrap(s: string, columns: number): string[] {
  const lines: string[] = [];
  for (const paragraph of s.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      if (line && line.length + word.length + 1 > columns) { lines.push(line); line = ''; }
      // Split long hashes rather than silently clipping them.
      if (word.length > columns) {
        if (line) { lines.push(line); line = ''; }
        for (let i = 0; i < word.length; i += columns) lines.push(word.slice(i, i + columns));
      } else line += (line ? ' ' : '') + word;
    }
    if (line || !paragraph) lines.push(line);
  }
  return lines;
}
export async function png(file: string, body: string) {
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${body}</svg>`)).png().toFile(file);
}
export function textLines(lines: string[], x: number, y: number, size = 34, color = '#edf3f8', family = 'sans-serif', leading = 1.4) {
  return `<text font-family="${family}" font-size="${size}" fill="${color}">${lines.map((line, i) => `<tspan x="${x}" y="${y + i * size * leading}">${xml(line)}</tspan>`).join('')}</text>`;
}
