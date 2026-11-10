import { pathToFileURL } from 'node:url';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { parseRunOptions, runKeeper, safeFailure } from '../apps/keeper/src/run.js';

export async function keeperMain(argv: string[]) {
  const options = parseRunOptions(argv);
  const controller = new AbortController();
  const stop = () => { console.log('Stopping after the current operation; preserving any uncertain signature journal.'); controller.abort(); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  const dispatcher = new EnvHttpProxyAgent(); setGlobalDispatcher(dispatcher);
  try { return await runKeeper(options, { signal: controller.signal }); }
  finally { process.off('SIGINT', stop); process.off('SIGTERM', stop); await dispatcher.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await keeperMain(process.argv.slice(2)); }
  catch (e) { console.error(safeFailure(e)); process.exitCode = 1; }
}
