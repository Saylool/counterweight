import { describe, expect, it, vi } from 'vitest';
import { keeperDry } from '../apps/keeper/src/dry-run.js';
import { quoteDryRebalance, dryRebalanceRequest, HYPERCORE_USDC, WNEAR } from '@counterweight/intents';
import { readLiveNearMarket, PUBLIC_INFO } from '@counterweight/hyperliquid';

const hour = 3_600_000;
function transport(options: { marketHttp?: number; quoteHttp?: number; bookAge?: number; duplicateFunding?: boolean;
  depositAddress?: boolean; decimals?: number; delisted?: boolean; mismatchedAmount?: boolean;
  output?: string; minimum?: string | null } = {}) {
  const now = Date.now();
  const funding = Array.from({ length: 26 }, (_, i) => ({ coin: 'NEAR', time: Math.floor(now / hour) * hour - (25 - i) * hour, fundingRate: '0.00001' }));
  const fetcher = vi.fn<typeof globalThis.fetch>(async (input, init) => {
    const url = String(input);
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
    if (url === PUBLIC_INFO) {
      if (options.marketHttp) return json({}, options.marketHttp);
      if (body.type === 'metaAndAssetCtxs') return json([{ universe: [{ name: 'BTC', szDecimals: 5 },
        { name: 'NEAR', szDecimals: 1, isDelisted: options.delisted ?? false }] },
      [{ markPx: '100000', oraclePx: '100000', funding: '0' }, { markPx: '3.5', oraclePx: '3.51', funding: '0.00001' }]]);
      if (body.type === 'fundingHistory') return json(options.duplicateFunding ? [...funding, funding[0]] : funding);
      if (body.type === 'l2Book') return json({ coin: 'NEAR', time: now - (options.bookAge ?? 0),
        levels: [[{ px: '3.499', sz: '100' }], [{ px: '3.501', sz: '100' }]] });
    }
    if (url.endsWith('/tokens')) return json([{ assetId: WNEAR, decimals: 24 }, { assetId: HYPERCORE_USDC, decimals: options.decimals ?? 8 }]);
    if (url.endsWith('/quote')) return json({ quote: { amountIn: options.mismatchedAmount ? '1' : body.amount,
      amountOut: options.output ?? '3500000000', ...(options.minimum === null ? {} : { minAmountOut: options.minimum ?? '3450000000' }), timeEstimate: 60,
      ...(options.depositAddress ? { depositAddress: 'unexpected.near' } : {}) } }, options.quoteHttp ?? 200);
    throw new Error(`Forbidden request ${url}`);
  });
  return { fetcher, now };
}

describe('key-free live keeper dry run', () => {
  it('builds a mainnet Intents-balance dry quote with 24/8-decimal units and explicit refund/recipient/deadline', () => {
    const now = Date.parse('2026-11-10T10:00:00Z');
    expect(dryRebalanceRequest(now)).toEqual({ dry: true, swapType: 'EXACT_INPUT', slippageTolerance: 100,
      originAsset: WNEAR, destinationAsset: HYPERCORE_USDC, amount: '1000000000000000000000000',
      depositType: 'INTENTS', refundType: 'INTENTS', refundTo: 'counterweight-dry.near',
      recipientType: 'DESTINATION_CHAIN', recipient: '0x1111111111111111111111111111111111111111', deadline: '2026-11-10T10:03:00.000Z' });
  });
  it('resolves NEAR metadata, book depth and settled funding, and returns only a dry proposal', async () => {
    const { fetcher, now } = transport();
    const result = await keeperDry(fetcher, now);
    expect(result.status).toBe('ready');
    expect(result.market).toMatchObject({ assetIndex: 1, markPrice: 3.5, szDecimals: 1 });
    expect(result.risk).toMatchObject({ metrics: { headroom: 10.625 }, funding: { complete24h: true } });
    expect(result.rebalanceRoute).toMatchObject({ outputUsdc: 35, minOutputUsdc: 34.5 });
    expect(result.wouldSend).toMatchObject({ rebalance: { dry: true, ownerApprovalRequired: true } });
    expect(result.signingRequests).toBe(0); expect(result.transactions).toBe(0);
    for (const [input, init] of fetcher.mock.calls) {
      expect(String(input)).not.toMatch(/exchange|signer|rpc|account/);
      expect(init?.headers ?? {}).not.toHaveProperty('Authorization');
      if (String(input).endsWith('/quote')) expect(JSON.parse(String(init?.body)).dry).toBe(true);
    }
  });
  it.each([400, 401, 429, 503])('handles a 1Click HTTP %i without inventing a quote', async quoteHttp => {
    const { fetcher, now } = transport({ quoteHttp });
    const result = await keeperDry(fetcher, now);
    expect(result.status).toBe('degraded'); expect(result.rebalanceRoute).toBeNull();
    expect(result.market).not.toBeNull(); expect(result.wouldSend).toMatchObject({ action: 'wait-for-fresh-market-and-quote' });
  });
  it('quotes independently if Hyperliquid is down and withholds executable proposals', async () => {
    const { fetcher, now } = transport({ marketHttp: 503 });
    const result = await keeperDry(fetcher, now);
    expect(result.risk).toBeNull(); expect(result.rebalanceRoute).not.toBeNull();
    expect(result.wouldSend).toMatchObject({ action: 'wait-for-fresh-market-and-quote' });
  });
  it.each([120_000, -120_000])('withholds an executable proposal for stale/future books (%i ms)', async bookAge => {
    const { fetcher, now } = transport({ bookAge });
    const result = await keeperDry(fetcher, now);
    expect(result.wouldSend).toMatchObject({ action: 'wait-for-fresh-market-and-quote' });
    expect(result.risk?.entryBlocks).toContain(bookAge > 0 ? 'stale-data' : 'future-data');
  });
  it('handles transport failure without echoing transport secrets or signing', async () => {
    const fetcher = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new Error('https://secret:password@proxy.invalid'));
    const result = await keeperDry(fetcher);
    expect(JSON.stringify(result)).not.toMatch(/password|proxy.invalid/);
    expect(result.errors).toHaveLength(2); expect(result.transactions).toBe(0);
  });
  it('rejects changed token units before requesting a route', async () => {
    const { fetcher } = transport({ decimals: 6 });
    await expect(quoteDryRebalance(fetcher)).rejects.toThrow('metadata changed');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([{ depositAddress: true }, { mismatchedAmount: true }])('rejects unsafe dry-quote responses %j', async options => {
    const { fetcher } = transport(options);
    await expect(quoteDryRebalance(fetcher)).rejects.toThrow();
  });
  it.each([{ minimum: '0' }, { minimum: '3500000001' }, { minimum: null }, { output: '1'.repeat(400) }])(
    'withholds a rebalance if the public quote has unsafe or missing output bounds %j', async options => {
      const { fetcher, now } = transport(options);
      const result = await keeperDry(fetcher, now);
      expect(result.status).toBe('degraded');
      expect(result.rebalanceRoute).toBeNull();
      expect(result.wouldSend).toMatchObject({ action: 'wait-for-fresh-market-and-quote' });
      expect(result.transactions).toBe(0);
    });
  it.each([{ duplicateFunding: true }, { delisted: true }])('fails closed for inconsistent market data %j', async options => {
    const { fetcher } = transport(options);
    await expect(readLiveNearMarket(fetcher)).rejects.toThrow();
  });
});
