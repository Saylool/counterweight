import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { z } from 'zod';
import { nearMarketIndex } from '@counterweight/hyperliquid';
import { HOUR_MS, NEAR_MAINTENANCE_TIERS } from '@counterweight/domain';

const timestamp = z.number().int().nonnegative();
const numericString = z.string().refine(s => s.trim() !== '' && Number.isFinite(Number(s)));
const priceString = numericString.refine(s => Number(s) > 0);
export const CandleSchema = z.object({ t: timestamp, T: timestamp, s: z.literal('NEAR'), i: z.literal('1h'),
  o: priceString, c: priceString, h: priceString, l: priceString, v: numericString, n: z.number().int().nonnegative() })
  .refine(c => c.t % HOUR_MS === 0 && c.T === c.t + HOUR_MS - 1 && Number(c.h) >= Math.max(Number(c.o), Number(c.c)) &&
    Number(c.l) <= Math.min(Number(c.o), Number(c.c)) && Number(c.h) >= Number(c.l) && Number(c.v) >= 0, 'Invalid OHLC');
const FundingSchema = z.object({ coin: z.literal('NEAR'), fundingRate: numericString.refine(s => Math.abs(Number(s)) <= 1), premium: numericString, time: timestamp });
const positive = z.number().finite().positive();
const SpotSchema = z.tuple([timestamp, positive, positive, positive, positive, z.number().finite().nonnegative()])
  .refine(c => c[0] % 3600 === 0 && c[1] <= Math.min(c[3], c[4]) && c[2] >= Math.max(c[3], c[4]) && c[2] >= c[1], 'Invalid spot OHLC');
const MetaSchema = z.object({ capturedAt: z.iso.datetime(), assetIndex: z.number().int(), marginTableId: z.number().int(),
  window: z.object({ start: timestamp, end: timestamp, warmupStart: timestamp, hours: z.literal(4320), endExclusive: z.literal(true) }) });
const ManifestSchema = z.object({ algorithm: z.literal('SHA-256'), capturedAt: z.iso.datetime(), files: z.array(z.object({
  path: z.string().regex(/^(?:raw\/)?[a-z0-9-]+\.json$/), sha256: z.string().regex(/^[a-f0-9]{64}$/), bytes: z.number().int().positive(),
})) });
export interface OHLC { open: number; high: number; low: number; close: number }
export interface MarketHour { start: number; end: number; perp: OHLC; spot: OHLC; fundingRate: number }
export interface DataGap { series: 'perp' | 'spot' | 'funding'; hourStart: number }
export interface MarketDataset {
  start: number; end: number; warmupStart: number; bars: MarketHour[]; gaps: DataGap[];
  capturedAt: string; manifestSha256: string; szDecimals: number; assetIndex: number;
}
/** Read-only offline loader. All fixture bytes are checked against the recorded manifest before parsing. */
export async function loadMarket(directory: string): Promise<MarketDataset> {
  const manifestBytes = await readFile(resolve(directory, 'manifest.json'));
  const manifest = ManifestSchema.parse(JSON.parse(manifestBytes.toString()));
  const contents = new Map<string, unknown>();
  for (const file of manifest.files) {
    if (contents.has(file.path)) throw new Error(`Duplicate manifest path: ${file.path}`);
    const bytes = await readFile(resolve(directory, file.path));
    if (bytes.length !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error(`SHA-256 mismatch: ${file.path}`);
    contents.set(file.path, JSON.parse(bytes.toString()));
  }
  for (const required of ['metadata.json', 'funding.json', 'perp.json', 'spot.json', 'requests.json', 'raw/hyperliquid-meta.json', 'raw/coinbase-product.json'])
    if (!contents.has(required)) throw new Error(`Missing manifest entry: ${required}`);
  const requests = z.array(z.object({ method: z.enum(['POST', 'GET']), url: z.url(), requestedAt: z.iso.datetime(), receivedAt: z.iso.datetime(),
    httpStatus: z.literal(200), responseFile: z.string(), body: z.unknown().optional() })).parse(contents.get('requests.json'));
  if (requests.some(r => !contents.has(r.responseFile))) throw new Error('Unhashed raw response');
  const metadata = MetaSchema.parse(contents.get('metadata.json'));
  const { start, end, warmupStart } = metadata.window;
  if (end - start !== 4320 * HOUR_MS || start - warmupStart !== 24 * HOUR_MS || [start, end, warmupStart].some(t => t % HOUR_MS !== 0)) throw new Error('Invalid frozen window');
  if (end >= Date.parse(metadata.capturedAt.slice(0, 10))) throw new Error('Window did not end before capture day');
  const meta = z.object({ universe: z.array(z.object({ name: z.string(), isDelisted: z.boolean().optional(), szDecimals: z.number().int().min(0).max(8), marginTableId: z.number().int() })),
    marginTables: z.array(z.tuple([z.number(), z.object({ marginTiers: z.array(z.object({ lowerBound: numericString, maxLeverage: z.number() })) })])) }).parse(contents.get('raw/hyperliquid-meta.json'));
  const assetIndex = nearMarketIndex({ universe: meta.universe.map(a => ({ name: a.name, ...(a.isDelisted === undefined ? {} : { isDelisted: a.isDelisted }) })) });
  const asset = meta.universe[assetIndex]!;
  const tiers = meta.marginTables.find(t => t[0] === asset.marginTableId)?.[1].marginTiers;
  if (assetIndex !== metadata.assetIndex || asset.marginTableId !== metadata.marginTableId || JSON.stringify(tiers?.map(t => ({ lowerBound: Number(t.lowerBound), maxLeverage: t.maxLeverage }))) !== JSON.stringify(NEAR_MAINTENANCE_TIERS)) throw new Error('NEAR maintenance table changed');
  z.object({ id: z.literal('NEAR-USD'), base_currency: z.literal('NEAR'), quote_currency: z.literal('USD') }).parse(contents.get('raw/coinbase-product.json'));
  const funding = z.array(FundingSchema).parse(contents.get('funding.json'));
  const perps = z.array(CandleSchema).parse(contents.get('perp.json'));
  const spots = z.array(SpotSchema).parse(contents.get('spot.json'));
  function index<T>(rows: T[], key: (r: T) => number) {
    const map = new Map<number, T>();
    for (const row of rows) {
      const t = key(row);
      if (t < warmupStart || t >= end || map.has(t)) throw new Error(`Duplicate or out-of-window hour: ${t}`);
      map.set(t, row);
    }
    return map;
  }
  const f = index(funding, r => Math.floor(r.time / HOUR_MS) * HOUR_MS);
  const p = index(perps, r => r.t);
  const s = index(spots, r => r[0] * 1000);
  const gaps: DataGap[] = [], bars: MarketHour[] = [];
  for (let t = warmupStart; t < end; t += HOUR_MS) {
    const perp = p.get(t), spot = s.get(t), rate = f.get(t);
    if (!perp) gaps.push({ series: 'perp', hourStart: t });
    if (!spot) gaps.push({ series: 'spot', hourStart: t });
    if (!rate) gaps.push({ series: 'funding', hourStart: t });
    if (perp && spot && rate) bars.push({ start: t, end: t + HOUR_MS,
      perp: { open: Number(perp.o), high: Number(perp.h), low: Number(perp.l), close: Number(perp.c) },
      spot: { open: spot[3], high: spot[2], low: spot[1], close: spot[4] }, fundingRate: Number(rate.fundingRate) });
  }
  return { start, end, warmupStart, bars, gaps, capturedAt: metadata.capturedAt,
    manifestSha256: createHash('sha256').update(manifestBytes).digest('hex'), szDecimals: asset.szDecimals, assetIndex };
}
