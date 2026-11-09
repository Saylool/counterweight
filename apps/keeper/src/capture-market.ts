/** Explicit online acquisition. Replay never imports this module. No credentials. */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { nearMarketIndex } from '@counterweight/hyperliquid';
const root = fileURLToPath(new URL('../../../fixtures/market/', import.meta.url));
const hour = 3_600_000;
const end = Date.parse('2026-11-08T00:00:00Z'); // Exclusive; frozen before capture, never slides.
const start = end - 180 * 24 * hour;
const warmupStart = start - 24 * hour;
if (end >= Date.parse(new Date().toISOString().slice(0, 10))) throw new Error('Window must end before today');
if (Date.now() - warmupStart >= 5000 * hour)
  throw new Error('Frozen window exceeds Hyperliquid latest-5000 hourly candle retention; preserve the recorded capture');
await mkdir(`${root}raw`, { recursive: true });
const requests: unknown[] = [];
const files: { path: string; sha256: string; bytes: number }[] = [];
async function save(path: string, data: unknown) {
  const bytes = JSON.stringify(data, null, 2) + '\n';
  await writeFile(root + path, bytes);
  files.push({ path, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: Buffer.byteLength(bytes) });
}
async function request(label: string, url: string, body?: unknown): Promise<any> {
  const requestInfo = { method: body === undefined ? 'GET' : 'POST', url,
    headers: body === undefined ? {} : { 'content-type': 'application/json' }, ...(body === undefined ? {} : { body }) };
  const requestedAt = new Date().toISOString();
  const response = await fetch(url, { method: requestInfo.method, headers: requestInfo.headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const path = `raw/${label}.json`;
  await save(path, data);
  requests.push({ ...requestInfo, requestedAt, receivedAt: new Date().toISOString(), httpStatus: response.status, responseFile: path });
  console.log(label, Array.isArray(data) ? data.length : 'object');
  return data;
}
const api = 'https://api.hyperliquid.xyz/info';
const meta = await request('hyperliquid-meta', api, { type: 'meta' });
const assetIndex = nearMarketIndex(meta);
const product = await request('coinbase-product', 'https://api.exchange.coinbase.com/products/NEAR-USD');
if (product.id !== 'NEAR-USD' || product.base_currency !== 'NEAR' || product.quote_currency !== 'USD') throw new Error('Unexpected Coinbase product');
const funding: any[] = [];
// At most 400 hourly records/request, below the general 500-record limit. Retain raw timestamps.
for (let t = warmupStart, page = 0; t < end; t += 400 * hour, page++) {
  funding.push(...await request(`funding-${page}`, api, { type: 'fundingHistory', coin: 'NEAR', startTime: t, endTime: Math.min(t + 400 * hour, end) - 1 }));
}
// 4344 hourly candles including warmup, below latest-5000 retention. Never pretend pagination restores expired candles.
const candles = await request('perp-candles', api, { type: 'candleSnapshot', req: { coin: 'NEAR', interval: '1h', startTime: warmupStart, endTime: end - 1 } });
const spot: any[] = [];
for (let t = warmupStart, page = 0; t < end; t += 299 * hour, page++) {
  const url = new URL('https://api.exchange.coinbase.com/products/NEAR-USD/candles');
  url.searchParams.set('granularity', '3600');
  url.searchParams.set('start', new Date(t).toISOString());
  url.searchParams.set('end', new Date(Math.min(t + 299 * hour, end)).toISOString());
  spot.push(...await request(`spot-${page}`, url.toString()));
}
function unique<T>(rows: T[], key: (row: T) => number): T[] {
  const map = new Map<number, T>();
  for (const row of rows) {
    const t = key(row);
    if (t < warmupStart || t >= end) continue;
    const old = map.get(t);
    if (old && JSON.stringify(old) !== JSON.stringify(row)) throw new Error(`Conflicting duplicate ${t}`);
    map.set(t, row);
  }
  return [...map.values()].sort((a, b) => key(a) - key(b));
}
await save('funding.json', unique(funding, r => r.time));
await save('perp.json', unique(candles, (r: any) => r.t));
await save('spot.json', unique(spot, r => r[0] * 1000));
await save('requests.json', requests);
await save('metadata.json', { schemaVersion: 1, coin: 'NEAR', assetIndex, marginTableId: meta.universe[assetIndex].marginTableId,
  capturedAt: new Date().toISOString(), window: { start, end, warmupStart, endExclusive: true, hours: 4320 },
  independentSpot: 'Coinbase Exchange NEAR-USD public hourly candles; product verified in raw/coinbase-product.json',
  sources: ['https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-tiers', 'https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint', 'https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles'],
  notes: ['Funding event timestamps have sub-hour jitter; assigned to their UTC hour, available at that hour end.', 'Perp and spot OHLC are trade candles, not historical mark prices or order books.', 'Current captured maintenance table applied throughout; historical tier changes unavailable.'] });
await writeFile(root + 'manifest.json', JSON.stringify({ algorithm: 'SHA-256', capturedAt: new Date().toISOString(), files }, null, 2) + '\n');
// Detect accidental write corruption immediately.
for (const f of files) if (createHash('sha256').update(await readFile(root + f.path)).digest('hex') !== f.sha256) throw new Error(f.path);
