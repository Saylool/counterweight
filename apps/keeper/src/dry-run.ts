import { evaluateRisk } from '@counterweight/domain';
import { readLiveNearMarket } from '@counterweight/hyperliquid';
import { quoteDryRebalance } from '@counterweight/intents';

export async function keeperDry(fetcher: typeof globalThis.fetch = globalThis.fetch, now = Date.now()) {
  const [market, quote] = await Promise.allSettled([readLiveNearMarket(fetcher, now), quoteDryRebalance(fetcher, now)]);
  const errors: string[] = [];
  // Return service-local errors only; never serialize transport internals/proxy credentials.
  if (market.status === 'rejected') errors.push(`Hyperliquid unavailable: ${safeError(market.reason)}`);
  if (quote.status === 'rejected') errors.push(`1Click unavailable: ${safeError(quote.reason)}`);
  const observation = market.status === 'fulfilled' ? market.value : null;
  const route = quote.status === 'fulfilled' ? quote.value : null;
  const asOf = observation ? Math.max(now, observation.fetchedAt) : now;
  const risk = observation ? evaluateRisk({ intent: 'monitor', shortNotional: 25, venueEquity: 30,
    now: asOf, observedAt: observation.observedAt, maxDataAgeMs: 60_000,
    unresolvedOrders: 0, reconciled: true, depth: observation.depth, funding: observation.funding,
    state: { entryHalted: false }, adl: false, unexpectedReductionQuantity: 0,
  }) : null;
  return { mode: 'dry-public-only', status: errors.length ? 'degraded' : 'ready',
    assumptions: 'Illustrative existing $25 short / $30 equity; no wallet balances or position queried. Route previews 1 NEAR from Intents to Hyperliquid perps USDC on MAINNET (1Click has no testnet). Dry quote only; no deposit/signature.',
    market: observation, risk, rebalanceRoute: route, errors,
    wouldSend: observation && route && asOf >= observation.observedAt && asOf - observation.observedAt <= 60_000
      ? { policyProposals: risk!.proposals, rebalance: { action: 'sell-spot-to-margin-proposal', near: 1,
        outputUsdc: route.outputUsdc, ownerApprovalRequired: true, dry: true },
        note: 'Only owner-approved spot disposal may use this route; no action submitted.' }
      : { action: 'wait-for-fresh-market-and-quote', reason: 'Incomplete, stale or future public data; no executable proposal.' },
    signingRequests: 0, transactions: 0 };
}
function safeError(error: unknown) {
  if (error instanceof Error && /^(Hyperliquid|1Click|NEAR|Duplicate|Unexpected|Invalid)/.test(error.message)) return error.message;
  return 'network, timeout or invalid response; retry when service is reachable';
}
