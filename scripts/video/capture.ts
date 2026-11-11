/// <reference lib="dom" />
/** Fresh Chromium, public reads only. No saved browser profile, wallets, or exchange writes. */
import { chromium, type Browser, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { base58 } from '@scure/base';
import { at, ROOT, WIDTH, HEIGHT, json, png, textLines, wrap, xml, isMain } from './common.js';

const BASE = 'http://localhost:5173';
const POLICY = 'policy-v3.counterweight-samet.testnet';
const RPC = 'https://rpc.testnet.near.org';
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export interface CaptureRecord {
  shot: string; url: string; image: string; clip?: string; capturedAt: string;
  state: 'captured' | 'unavailable'; notes: string[]; bodySha256?: string;
}
export interface CaptureManifest { schema: 1; startedAt: string; viewport: { width: number; height: number }; deviceScaleFactor: number; records: CaptureRecord[] }
async function serve() {
  const ready = async () => {
    try {
      const response = await fetch(BASE, { signal: AbortSignal.timeout(1200) });
      const html = await response.text();
      if (!response.ok || !/counterweight/i.test(html)) throw new Error('Port 5173 is serving another application. Stop it before capture.');
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Port 5173')) throw error;
      return false;
    }
  };
  if (await ready()) return undefined;
  console.log('Starting npm run web on localhost:5173');
  const child = spawn('npm', ['run', 'web'], { cwd: ROOT, detached: true, stdio: 'ignore' });
  for (let i = 0; i < 80; i++) {
    if (await ready()) return child;
    if (child.exitCode !== null) throw new Error('npm run web exited; start it manually and retry.');
    await pause(250);
  }
  stop(child);
  throw new Error('Web startup timed out. Run npm run web manually and retry.');
}
function stop(child?: ChildProcess) { if (child?.pid) { try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already exited */ } } }
async function settled(page: Page, notes: string[]) {
  try { await page.waitForLoadState('networkidle', { timeout: 20_000 }); }
  catch { notes.push('Network idle timed out (polling or blocked public request); visible state retained.'); }
  await page.locator('.loading').waitFor({ state: 'detached', timeout: 1000 }).catch(() => {});
  await page.evaluate(async () => { await document.fonts.ready; });
}
async function cookieBanners(page: Page) {
  // Only explicit cookie UI; never hide product alerts, failure notices, balances or limitations.
  for (const selector of ['#onetrust-banner-sdk', '#CybotCookiebotDialog', '#cookie-consent', '[data-testid="cookie-banner"]', '[aria-label="Cookie consent" i]', '[data-cookie-banner]', '.cookie-banner', '.cookie-consent', '.cc-window', '.cky-consent-container']) {
    await page.locator(selector).evaluateAll(nodes => nodes.forEach(node => { (node as HTMLElement).style.display = 'none'; }));
  }
  const reject = page.getByRole('button', { name: /^(reject all|decline optional cookies|only necessary|necessary only)$/i }).first();
  if (await reject.isVisible().catch(() => false)) await reject.click();
}
async function scroll(page: Page, selector?: string, offset = 0) {
  const target = selector ? await page.locator(selector).evaluate((el, extra) => el.getBoundingClientRect().top + window.scrollY - 100 + extra, offset) : offset;
  // Fixed linear interpolation; no wheel momentum or browser smooth-scroll variability.
  const from = await page.evaluate(() => window.scrollY);
  for (let i = 1; i <= 24; i++) {
    await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), from + (target - from) * i / 24);
    await page.waitForTimeout(1000 / 24);
  }
}
async function unavailable(page: Page, label: string, error: unknown) {
  await page.setContent(`<html><body style="margin:0;background:#0c1521;color:#eee;font:32px sans-serif;padding:100px"><p>PUBLIC READ UNAVAILABLE · NO DATA SUBSTITUTED</p><h1>${xml(label)}</h1><p>${xml(String(error).slice(0, 450))}</p><p>Retry capture when the public page is reachable. Historical claims remain dated.</p></body></html>`);
}
async function record(browser: Browser, shot: string, url: string, prepare: (page: Page) => Promise<void>, records: CaptureRecord[]) {
  const rawDir = at('captures/raw', shot);
  await mkdir(rawDir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1,
    locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce',
    recordVideo: { dir: rawDir, size: { width: WIDTH, height: HEIGHT } } });
  // Reads only, including JSON-RPC views and Hyperliquid info POSTs. Reject transaction-capable endpoints.
  await context.route('**/*', async route => {
    const req = route.request(), method = req.method();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return route.continue();
    const u = new URL(req.url());
    let body: Record<string, unknown> = {};
    try { body = req.postDataJSON() as Record<string, unknown>; } catch { /* invalid JSON rejected below */ }
    const nearRead = u.hostname === 'rpc.testnet.near.org' && ['query', 'block', 'status', 'tx', 'EXPERIMENTAL_tx_status'].includes(String(body.method));
    const hlRead = ['api.hyperliquid.xyz', 'api.hyperliquid-testnet.xyz'].includes(u.hostname) && u.pathname === '/info';
    return nearRead || hlRead ? route.continue() : route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  const notes: string[] = [];
  let state: CaptureRecord['state'] = 'captured';
  let bodySha256: string | undefined;
  let videoStart = 0;
  const started = Date.now();
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    if (response && !response.ok()) throw new Error(`HTTP ${response.status()}`);
    await settled(page, notes);
    if (url.startsWith(BASE)) await page.locator('.loading').first().waitFor({ state: 'detached', timeout: 25_000 }).catch(() => notes.push('Product still loading; inspect screenshot.'));
    await cookieBanners(page);
    await page.addStyleTag({ content: '* { scroll-behavior: auto !important; caret-color: transparent !important; }' });
    await prepare(page);
    await settled(page, notes);
    const body = await page.locator('body').innerText();
    bodySha256 = createHash('sha256').update(body).digest('hex');
    if (!url.startsWith(BASE) && (/just a moment|verify you are human|access denied|checking your browser/i.test(body) || body.length < 150)) {
      state = 'unavailable'; notes.push('Public page returned a challenge or incomplete body; preserved without bypass.');
    }
    if (shot === 'hl-fills' && (!body.includes('3.5121') || !body.includes('3.5212'))) {
      state = 'unavailable'; notes.push('Expected dated open/close prices are not both present. Inspect explorer fills tab/history/pagination before publishing.');
    }
    if (shot === 'near-keys' && !/delete[\s_-]*key/i.test(body)) {
      state = 'unavailable'; notes.push('Key-deletion action not present in loaded explorer text; inspect transaction details.');
    }
    if (shot === 'near-open' && !/success|succeeded/i.test(body)) {
      state = 'unavailable'; notes.push('Successful transaction status not present in loaded explorer text.');
    }
    if (url.startsWith(BASE) && await page.locator('.loading:visible').count()) notes.push('Visible loading indicator remains.');
    // An unavailable product read is a valid product state; retain and annotate it.
    if (url.startsWith(BASE) && /Data unavailable\./.test(body)) notes.push('Product contains public-read errors; visible warnings preserved.');
  } catch (error) {
    state = 'unavailable'; notes.push(String(error));
    await unavailable(page, url, error);
  }
  videoStart = (Date.now() - started) / 1000;
  await page.screenshot({ path: at('captures', `${shot}.png`), animations: 'disabled' });
  // A steady six-second hold is deliberately selected from the recording, excluding page-load flashes.
  await page.waitForTimeout(6200);
  const video = page.video();
  await context.close();
  const raw = video ? await video.path() : undefined;
  if (raw) {
    const { ffmpeg } = await import('./common.js');
    await ffmpeg(['-ss', String(videoStart + 0.2), '-i', raw, '-t', '5', '-an', '-vf', 'scale=1920:1080,setsar=1', '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', at('captures', `${shot}.mp4`)]);
  }
  records.push({ shot, url, image: `captures/${shot}.png`, ...(raw ? { clip: `captures/${shot}.mp4` } : {}),
    capturedAt: new Date().toISOString(), state, notes, ...(bodySha256 ? { bodySha256 } : {}) });
  console.log(`${shot}: ${state}${notes.length ? ' · ' + notes.join(' ') : ''}`);
}
export async function v3Proof(): Promise<CaptureRecord> {
  const record: CaptureRecord = { shot: 'v3-proof', url: RPC, image: 'captures/v3-proof.png', capturedAt: new Date().toISOString(), state: 'captured', notes: [] };
  let lines: string[];
  try {
    let id = 0;
    const call = async (method: string, params: unknown) => {
      const response = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20_000), body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }) });
      const envelope = await response.json() as { error?: unknown; result?: unknown };
      if (!response.ok || envelope.error || !envelope.result) throw new Error(`Public RPC unavailable: ${JSON.stringify(envelope.error ?? response.status)}`);
      return envelope.result;
    };
    const block = await call('block', { finality: 'final' }) as { header: { hash: string; height: number } };
    const pinned = { account_id: POLICY, block_id: block.header.hash };
    const account = await call('query', { request_type: 'view_account', ...pinned }) as { code_hash: string; block_hash: string };
    const keys = await call('query', { request_type: 'view_access_key_list', ...pinned }) as { keys: unknown[]; block_hash: string };
    if (account.block_hash !== block.header.hash || keys.block_hash !== block.header.hash || !Array.isArray(keys.keys)) throw new Error('Invalid or mixed-block public response');
    const bytes = await readFile(path.join(ROOT, 'contracts/policy/artifacts/counterweight_policy_v3.wasm'));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const sums = await readFile(path.join(ROOT, 'contracts/policy/artifacts/SHA256SUMS'), 'utf8');
    if (!sums.split('\n').includes(`${sha256}  artifacts/counterweight_policy_v3.wasm`)) throw new Error('Committed v3 SHA256SUMS mismatch');
    const expected = base58.encode(Buffer.from(sha256, 'hex'));
    const matches = account.code_hash === expected && keys.keys.length === 0;
    await json(at('captures/v3-proof.json'), { capturedAt: record.capturedAt, rpc: RPC, policy: POLICY, block, account, keys, artifact: { sha256, codeHash: expected }, matches });
    if (!matches) { record.state = 'unavailable'; record.notes.push('Observed code/key check failed; never label as a match.'); }
    lines = [POLICY, `Finalized block ${block.header.height}`, `Block hash: ${block.header.hash}`, '',
      `Access keys: ${keys.keys.length}`, `Code matches committed v3 WASM: ${account.code_hash === expected ? 'YES' : 'NO'}`, '',
      `Live code:      ${account.code_hash}`, `Committed code: ${expected}`, 'SHA-256 of committed v3 WASM:', sha256, '',
      `Observed ${record.capturedAt}`, 'Separate deployment from the recorded v2 funded lifecycle.'];
  } catch (error) {
    record.state = 'unavailable'; record.notes.push(String(error));
    lines = [POLICY, 'PUBLIC RPC CHECK UNAVAILABLE', String(error).slice(0, 400), '', 'No zero-key or code-match conclusion is inferred from this failure.'];
    await json(at('captures/v3-proof.json'), record);
  }
  await png(at('captures/v3-proof.png'), '<rect width="1920" height="1080" fill="#0b1522"/>' +
    textLines(['PUBLIC RPC VERIFICATION · CAPTURE UTILITY, NOT PRODUCT UI'], 90, 90, 25, '#d4b480') +
    textLines(lines.flatMap(line => wrap(line, 88)), 90, 170, 29, record.state === 'captured' ? '#c8efdf' : '#f1b7b7', 'monospace', 1.38));
  return record;
}
export async function capture() {
  const { requireFfmpeg } = await import('./common.js');
  await requireFfmpeg();
  const server = await serve();
  let browser: Browser | undefined;
  const manifest: CaptureManifest = { schema: 1, startedAt: new Date().toISOString(), viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, records: [] };
  try {
    browser = await chromium.launch({ channel: 'chromium', headless: !process.argv.includes('--headed') });
    const product: [string, string, number][] = [
      ['hero', '.hero', 0], ['lifecycle-top', '#lifecycle', 0], ['lifecycle-scroll', '#lifecycle', 450],
      ['live-v2', '#lifecycle .panel-meta', 0], ['market', '#market', 0], ['evidence', '#evidence', 0],
      ['results-full', '#results', 0], ['results-oos', '#results', 0], ['demo', '#demo', 0], ['live-v3', '#live', 0],
    ];
    for (const [shot, selector, offset] of product) {
      await record(browser, shot, BASE, async page => {
        if (shot === 'results-oos') await page.getByRole('button', { name: 'Out-of-sample', exact: true }).click();
        if (shot === 'live-v3') {
          await page.getByLabel('Policy account · NEAR testnet').fill(POLICY);
          await page.getByRole('button', { name: /Inspect account/ }).click();
          await page.locator('#live .loading').waitFor({ state: 'detached', timeout: 30_000 });
        }
        await scroll(page, selector, offset);
      }, manifest.records);
    }
    manifest.records.push(await v3Proof());
    const publicPages = [
      ['hl-fills', 'https://app.hyperliquid-testnet.xyz/explorer/address/0x3e72c8963761c3f436710df9b891d8e3a74b5390'],
      ['near-open', 'https://testnet.nearblocks.io/txns/2ZHrq1du5UaAeiQZVBoXCzb6vBFj9eMrQd99NiTDcFNd'],
      ['near-keys', 'https://testnet.nearblocks.io/txns/DGcGa5e5rjma3r7ohmP3Vhoshm9wdHMdU6DdA1ksS8eT'],
    ];
    for (const [shot, url] of publicPages) await record(browser, shot!, url!, async page => {
      if (shot === 'hl-fills') {
        const fills = page.getByRole('button', { name: /^(fills|trade history)$/i }).first();
        const tab = page.getByRole('tab', { name: /^(fills|trade history)$/i }).first();
        if (await fills.isVisible()) await fills.click();
        else if (await tab.isVisible()) await tab.click();
        else {
          const label = page.getByText('Fills', { exact: true }).first();
          if (await label.isVisible()) await label.click();
        }
      }
      await cookieBanners(page);
      await scroll(page, undefined, shot === 'hl-fills' ? 300 : 180);
    }, manifest.records);
  } finally {
    await browser?.close(); stop(server);
    await json(at('captures/manifest.json'), manifest);
  }
  const missing = manifest.records.filter(r => r.state === 'unavailable');
  if (missing.length && !process.argv.includes('--allow-unavailable')) throw new Error(`Public capture needs review: ${missing.map(r => r.shot).join(', ')}. Retry, or explicitly use --allow-unavailable to retain labelled failures.`);
}
if (isMain(import.meta.url)) capture().catch(error => { console.error(error); process.exitCode = 1; });
