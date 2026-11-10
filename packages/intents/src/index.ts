import { z } from 'zod';

export const ONECLICK_API = 'https://1click.chaindefuser.com/v0';
export const HYPERCORE_USDC = '1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054';
export const WNEAR = 'nep141:wrap.near';
const atomicAmount = z.string().regex(/^\d{1,32}$/);
/** No wallet, configurable live flag, or API-key parameter exists in this client. */
export async function quoteDryRebalance(fetcher: typeof globalThis.fetch = globalThis.fetch, now = Date.now()) {
  const tokensResponse = await fetcher(`${ONECLICK_API}/tokens`, { signal: AbortSignal.timeout(15_000) });
  if (!tokensResponse.ok) throw new Error(`1Click token discovery HTTP ${tokensResponse.status}`);
  const tokens = z.array(z.object({ assetId: z.string(), decimals: z.number().int().nonnegative() })).parse(await tokensResponse.json());
  if (tokens.filter(t => t.assetId === WNEAR && t.decimals === 24).length !== 1
    || tokens.filter(t => t.assetId === HYPERCORE_USDC && t.decimals === 8).length !== 1)
    throw new Error('1Click NEAR / HyperCore USDC asset metadata changed');
  const request = {
    dry: true as const, swapType: 'EXACT_INPUT', slippageTolerance: 100, originAsset: WNEAR,
    destinationAsset: HYPERCORE_USDC, depositType: 'ORIGIN_CHAIN', refundType: 'ORIGIN_CHAIN', recipientType: 'DESTINATION_CHAIN',
    amount: '10000000000000000000000000', // Illustrative 10 NEAR; no funds or account queried.
    refundTo: 'counterweight-dry.near', recipient: '0x1111111111111111111111111111111111111111',
    deadline: new Date(now + 3_600_000).toISOString(),
  };
  const response = await fetcher(`${ONECLICK_API}/quote`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request), signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`1Click dry quote HTTP ${response.status}; quote unavailable (no keys required or loaded)`);
  const result = z.object({ quote: z.object({ amountIn: atomicAmount, amountOut: atomicAmount,
    minAmountOut: atomicAmount, timeEstimate: z.number().finite().nonnegative().optional() }).passthrough() }).passthrough().parse(await response.json());
  if ('depositAddress' in result || 'depositAddress' in result.quote) throw new Error('Unexpected deposit address in dry quote; refusing');
  const amountOut = BigInt(result.quote.amountOut);
  const minimum = BigInt(result.quote.minAmountOut);
  if (result.quote.amountIn !== request.amount || minimum <= 0n || minimum > amountOut
    || amountOut > 10n ** 23n) throw new Error('Invalid dry quote amounts');
  return { request, result, outputUsdc: Number(amountOut) / 1e8, minOutputUsdc: Number(minimum) / 1e8 };
}
