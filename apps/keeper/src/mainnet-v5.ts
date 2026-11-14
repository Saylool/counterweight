import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { base58 } from '@scure/base';
import { pathToFileURL } from 'node:url';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { parseRunOptions, runKeeper, safeFailure, type RunOptions } from './run.js';

/** Live execution is opt-in; this module never reads keys itself. near-cli uses the owner's keychain at runtime. */
export function parseV5Options(argv: string[]): RunOptions {
  if (argv.some(arg => /^--(policy|keeper|network|allow-open)(=|$)/.test(arg))) throw new Error('Expected fixed v5 policy/keeper; autonomous opening is disabled');
  const options = parseRunOptions(['--network=mainnet', '--policy=cw5.haxheton.near', '--keeper=keeper4.haxheton.near', ...(argv.some(arg => arg.startsWith('--interval-seconds=')) ? [] : ['--interval-seconds=30']), ...argv]);
  return { ...options, dry: argv.includes('--dry'), allowOpen: false, autonomousMainnetV5: true };
}
export async function mainnetV5Main(argv: string[]) {
  const options = parseV5Options(argv), controller = new AbortController();
  const wasm = await readFile(new URL('../../../contracts/policy/artifacts/counterweight_policy_v5.wasm', import.meta.url));
  const sha = createHash('sha256').update(wasm).digest();
  const sums = await readFile(new URL('../../../contracts/policy/artifacts/SHA256SUMS.v5', import.meta.url), 'utf8');
  if (!sums.split(/\r?\n/).some(line => line.trim().split(/\s+/)[0] === sha.toString('hex') && line.includes('counterweight_policy_v5.wasm'))) throw new Error('Policy local v5 artifact checksum mismatch');
  options.expectedCodeHash = base58.encode(sha);
  const stop = () => { console.log('Stopping after current operation; uncertain journals stay locked for inspection.'); controller.abort(); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  const dispatcher = new EnvHttpProxyAgent(); setGlobalDispatcher(dispatcher);
  try { return await runKeeper(options, { signal: controller.signal }); }
  finally { process.off('SIGINT', stop); process.off('SIGTERM', stop); await dispatcher.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await mainnetV5Main(process.argv.slice(2)); }
  catch (e) { console.error(safeFailure(e)); process.exitCode = 1; }
}
