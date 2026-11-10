import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { keeperDry } from './dry-run.js';

// Honor standard proxy environments without printing proxy URLs or credentials.
const dispatcher = new EnvHttpProxyAgent();
setGlobalDispatcher(dispatcher);
try {
  console.log('COUNTERWEIGHT | LIVE PUBLIC DATA + 1Click dry:true | NO SIGNING / NO KEYS');
  const result = await keeperDry();
  console.log(result.assumptions);
  if (result.market) {
    const m = result.market;
    console.log(`LIVE NEAR $${m.markPrice.toFixed(4)} | asset ${m.assetIndex}, precision ${m.szDecimals} | funding ${m.currentFundingRate}`);
    console.log(`Book ${new Date(m.observedAt).toISOString()} | ask depth $${m.depth.availableNotional.toFixed(2)} within 25bps`);
  }
  if (result.risk) console.log(`RISK H=$${result.risk.metrics.headroom.toFixed(3)} | leverage=${result.risk.metrics.leverage?.toFixed(3)} | entry blocks=${result.risk.entryBlocks.join(',') || 'none'}`);
  if (result.rebalanceRoute) console.log(`1CLICK dry:true 10 NEAR -> ${result.rebalanceRoute.outputUsdc.toFixed(6)} HyperCore USDC | min ${result.rebalanceRoute.minOutputUsdc?.toFixed(6) ?? 'unavailable'} | no deposit address`);
  for (const error of result.errors) console.log(error);
  console.log(`WOULD SEND (proposal only): ${JSON.stringify(result.wouldSend, null, 2)}`);
  console.log(`Status ${result.status} | signing requests 0 | transactions 0`);
} catch {
  console.log('Public data unavailable; no proposal submitted. Retry npm run keeper:dry when the network recovers.');
} finally { await dispatcher.close(); }
