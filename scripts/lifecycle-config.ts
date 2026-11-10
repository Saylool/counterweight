import { z } from 'zod';
import { nearMarketIndex, TESTNET_API } from '../packages/hyperliquid/src/index.js';

export const BASE = 10n ** 24n;
export const MICRO = 1_000_000n;
export const FUNDED_LIMITS = { max_short_size: (5n * BASE).toString(), per_order_notional_cap: '20000000',
  per_day_notional_cap: '40000000', cooldown_seconds: 60, price_band_bps: 100, price_max_age_seconds: 60 };
export const numeric = z.string().regex(/^-?\d+(?:\.\d+)?$/).refine(s => Number.isFinite(Number(s)));
export const positive = numeric.refine(s => Number(s) > 0);
export function units(value: string, decimals: number): bigint {
  if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error('Expected unsigned decimal');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals && /[1-9]/.test(fraction.slice(decimals))) throw new Error('Expected exact decimal precision');
  return BigInt(whole!) * 10n ** BigInt(decimals) + BigInt(fraction.slice(0, decimals).padEnd(decimals, '0'));
}
export function decimal(value: bigint, decimals: number): string {
  const padded = value.toString().padStart(decimals + 1, '0');
  return decimals ? `${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`.replace(/\.?0+$/, '') : padded;
}
export function priceBounds(mark: string) {
  positive.parse(mark);
  const reference = BigInt(Math.round(Number(mark) * 1e6));
  if (reference < 100n || reference > 800_000_000_000n) throw new Error('Expected reasonable NEAR micro-price');
  return { reference_price: reference.toString(), min_price: (reference * 80n / 100n).toString(),
    max_price: ((reference * 120n + 99n) / 100n).toString() };
}
export async function info(body: Record<string, unknown>, fetcher = globalThis.fetch): Promise<unknown> {
  const response = await fetcher(`${TESTNET_API}/info`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`Hyperliquid info HTTP ${response.status}`);
  return response.json();
}
export function parseMarket(raw: unknown) {
  const [meta, ctxs] = z.tuple([z.object({ universe: z.array(z.object({ name: z.string(),
    szDecimals: z.number().int().min(0).max(6), isDelisted: z.boolean().optional() })) }),
  z.array(z.unknown())]).parse(raw);
  const assetIndex = nearMarketIndex({ universe: meta.universe.map(a => ({ name: a.name, szDecimals: a.szDecimals, ...(a.isDelisted === undefined ? {} : { isDelisted: a.isDelisted }) })) });
  const ctx = z.object({ markPx: positive, funding: numeric }).parse(ctxs[assetIndex]);
  return { assetIndex, szDecimals: meta.universe[assetIndex]!.szDecimals, mark: ctx.markPx, funding: ctx.funding };
}
export async function liveMarket() {
  return { ...parseMarket(await info({ type: 'metaAndAssetCtxs' })), capturedAt: new Date().toISOString(),
    source: `${TESTNET_API}/info`, request: { type: 'metaAndAssetCtxs' } };
}
// Match the contract's quantization (five significant figures; 6-szDecimals decimals).
export function orderPrice(reference: bigint, sizeDecimals: number, reduceOnly: boolean, band = 100) {
  const n = reduceOnly ? (reference * BigInt(10000 + band) + 9999n) / 10000n : reference * BigInt(10000 - band) / 10000n;
  const step = 10n ** BigInt(Math.min(6, Math.max(sizeDecimals, n.toString().length - 5)));
  return reduceOnly ? (n + step - 1n) / step * step : n / step * step;
}
/** V3 fixes the exit cap at mark +1%, always rounding down to the venue tick. */
export function v3ExitPrice(reference: bigint, sizeDecimals: number) {
  if (reference < 10n || reference > 1_000_000_000_000n) throw new Error('Policy exit mark outside sanity bounds');
  const cap = reference * 10100n / 10000n;
  const tick = 10n ** BigInt(Math.min(6, Math.max(sizeDecimals, cap.toString().length - 5)));
  return cap / tick * tick;
}

/** Existing WASM gates withdraw3 behind RebalanceState. Configure only after the final close.
 * The adapter is an uncreated child of the keyless policy; no sale route is executed in this run.
 */
export function withdrawalConfig(address: string, spot: string, minPrice: string, policy: string) {
  z.string().regex(/^0x[0-9a-f]{40}$/).parse(address);
  const target = BigInt(spot) * BigInt(minPrice) / BASE;
  if (target <= 0n) throw new Error('Policy withdrawal setup requires retained spot backing');
  return { adapter: `disabled-routes.${policy}`, strategy_margin_address: address,
    destination_token: '1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054',
    per_sale_near: '1', daily_sale_near: '1', max_fee_usdc: '1', max_impact_bps: 0,
    quote_age_ms: 30000, completion_ms: 60000, max_mismatch_near: '1',
    per_withdrawal_usdc: '60000000', daily_withdrawal_usdc: '60000000',
    min_residual_equity_usdc: '1000000', min_headroom_bps: 1000, lower_headroom_bps: 3000,
    target_headroom_bps: 6000, upper_headroom_bps: 9000, fee_reserve_usdc: '100000', original_target_usdc: target.toString() };
}
