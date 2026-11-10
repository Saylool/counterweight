import { z } from 'zod';
import { nearMarketIndex } from './proof.js';

const numeric = z.string().refine(s => s.trim() !== '' && Number.isFinite(Number(s)));
const positive = numeric.refine(s => Number(s) > 0);
export const PUBLIC_INFO = 'https://api.hyperliquid.xyz/info';
export type PublicFetch = typeof globalThis.fetch;
async function info(body: Record<string, unknown>, fetcher: PublicFetch) {
  const response = await fetcher(PUBLIC_INFO, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Hyperliquid ${body.type} HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}
/** Public observations only; never queries an account, exchange endpoint, or signer. */
export async function readLiveNearMarket(fetcher: PublicFetch = globalThis.fetch, now = Date.now()) {
  const results = await Promise.all([
    info({ type: 'metaAndAssetCtxs' }, fetcher),
    info({ type: 'fundingHistory', coin: 'NEAR', startTime: now - 26 * 3_600_000, endTime: now }, fetcher),
    info({ type: 'l2Book', coin: 'NEAR' }, fetcher),
  ]);
  const [meta, contexts] = z.tuple([
    z.object({ universe: z.array(z.object({ name: z.string(), szDecimals: z.number().int().min(0).max(6), isDelisted: z.boolean().optional() })) }),
    z.array(z.object({ markPx: positive, oraclePx: positive, funding: numeric })),
  ]).parse(results[0]);
  const assetIndex = nearMarketIndex({ universe: meta.universe.map(a => ({ name: a.name,
    ...(a.isDelisted === undefined ? {} : { isDelisted: a.isDelisted }) })) });
  const context = contexts[assetIndex];
  if (!context) throw new Error('NEAR asset context missing');
  const funding = z.array(z.object({ coin: z.literal('NEAR'), time: z.number().int().nonnegative(), fundingRate: numeric }))
    .parse(results[1]).map(r => ({ time: Math.floor(r.time / 3_600_000) * 3_600_000, rate: Number(r.fundingRate) }))
    .sort((a, b) => a.time - b.time);
  if (new Set(funding.map(f => f.time)).size !== funding.length) throw new Error('Duplicate funding settlement hours');
  const book = z.object({ coin: z.literal('NEAR'), time: z.number().int().nonnegative(), levels: z.tuple([
    z.array(z.object({ px: positive, sz: positive })), z.array(z.object({ px: positive, sz: positive })),
  ]) }).parse(results[2]);
  const markPrice = Number(context.markPx);
  // Buying to reduce a short uses ask liquidity within the engine's 25bps depth band.
  const asks = book.levels[1];
  const availableNotional = asks.filter(a => Number(a.px) <= markPrice * 1.0025)
    .reduce((sum, a) => sum + Number(a.px) * Number(a.sz), 0);
  return { source: PUBLIC_INFO, fetchedAt: Date.now(), observedAt: book.time, assetIndex,
    szDecimals: meta.universe[assetIndex]!.szDecimals, markPrice, oraclePrice: Number(context.oraclePx),
    currentFundingRate: Number(context.funding), funding,
    depth: { availableNotional, impactBps: asks.length ? Math.max(0, (Number(asks[0]!.px) / markPrice - 1) * 10_000) : 10_000 } };
}
