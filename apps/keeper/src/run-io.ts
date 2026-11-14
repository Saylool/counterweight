import { execFile } from 'node:child_process';
import { open, mkdir, readFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { apiForNetwork, accountForNetwork, MAINNET_RPC, deriveEvmAddress, nearPublicKeyToHex, type Network } from '../../../packages/hyperliquid/src/index.js';
import { parseAccount } from '../../../scripts/lifecycle-parsing.js';
import { parseMarket, numeric, positive } from '../../../scripts/lifecycle-config.js';
import { txHash, testnetAccount } from '../../../scripts/testnet-common.js';
import { KEEPER, stateSchema, type Observation } from './run-state.js';

export const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
export interface Runtime {
  fetch: typeof fetch; now: () => number; sleep: (ms: number) => Promise<void>; random: () => number;
  exec: (args: string[]) => Promise<{ stdout: string; stderr: string }>; print: (line: string) => void;
}
const execute = promisify(execFile);
export function runtime(): Runtime {
  return { fetch: globalThis.fetch, now: Date.now, sleep, random: Math.random, print: console.log,
    exec: args => execute('near', args, { encoding: 'utf8', timeout: 90_000, maxBuffer: 2 * 1024 * 1024, killSignal: 'SIGTERM' }) };
}
export class PublicClient {
  constructor(readonly rt: Runtime, readonly fallback = process.env.NEAR_TESTNET_RPC ?? 'https://test.rpc.fastnear.com', readonly network: Network = 'testnet') {}
  async rpc(method: string, params: unknown): Promise<unknown> {
    const endpoints = this.network === 'mainnet' ? [MAINNET_RPC] : [...new Set(['https://rpc.testnet.near.org', this.fallback])];
    for (let attempt = 0; attempt < 4; attempt++) {
      let response: Response | undefined;
      try {
        response = await this.rt.fetch(endpoints[attempt % endpoints.length]!, { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 'keeper-public', method, params }), signal: AbortSignal.timeout(15_000) });
        if (!response.ok) throw new Error('RPC HTTP');
        const body = z.object({ result: z.unknown().optional(), error: z.unknown().optional() }).parse(await response.json());
        if (body.error !== undefined || body.result === undefined) throw new Error('RPC response');
        return body.result;
      } catch {
        if (attempt === 3) throw new Error('NEAR public RPC unavailable after backoff');
        const retry = response?.headers.get('retry-after');
        const retryMs = retry === null || retry === undefined ? 0 : /^\d+(\.\d+)?$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - this.rt.now();
        await this.rt.sleep(Math.min(20_000, Math.max(500 * 2 ** attempt, Number.isFinite(retryMs) ? retryMs : 0)) + Math.floor(this.rt.random() * 250));
      }
    }
    throw new Error('NEAR unreachable');
  }
  async view(account: string, method: string, args: unknown = {}, block?: string) {
    const result = z.object({ result: z.array(z.number().int().min(0).max(255)), block_hash: z.string() }).parse(await this.rpc('query', {
      request_type: 'call_function', account_id: account, method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'), ...(block ? { block_id: block } : { finality: 'final' }),
    }));
    if (block && result.block_hash !== block) throw new Error('NEAR inconsistent block');
    return { value: JSON.parse(Buffer.from(result.result).toString('utf8')) as unknown, block: result.block_hash };
  }
  async policy(policy: string, block?: string, onState?: (state: z.infer<typeof stateSchema>) => Promise<void>) {
    const view = await this.view(policy, 'get_state', {}, block);
    const state = stateSchema.parse(view.value);
    if (state.network !== (this.network === 'mainnet' ? 'Mainnet' : 'Testnet') || state.signer_account !== (this.network === 'mainnet' ? 'v1.signer' : 'v1.signer-prod.testnet') || (this.network === 'testnet' && state.keeper !== KEEPER)) throw new Error('Policy network/signer/keeper mismatch');
    await onState?.(state);
    const [account, keys, rebalance] = await Promise.all([
      this.rpc('query', { request_type: 'view_account', account_id: policy, block_id: view.block }),
      this.rpc('query', { request_type: 'view_access_key_list', account_id: policy, block_id: view.block }),
      this.view(policy, 'get_rebalance', {}, view.block),
    ]);
    const code = z.object({ block_hash: z.literal(view.block), code_hash: z.string().min(1) }).parse(account);
    const access = z.object({ block_hash: z.literal(view.block), keys: z.array(z.unknown()) }).parse(keys);
    return { state, block: view.block, codeHash: code.code_hash, keyless: access.keys.length === 0, rebalance: rebalance.value };
  }
  async derive(policy: string, state: z.infer<typeof stateSchema>) {
    const root = await this.view(state.signer_account, 'public_key', { domain_id: 0 });
    const derived = deriveEvmAddress(z.string().parse(root.value), policy, state.derivation_path);
    const remote = await this.view(state.signer_account, 'derived_public_key', { predecessor: policy, path: state.derivation_path, domain_id: 0 }, root.block);
    if (nearPublicKeyToHex(z.string().parse(remote.value)).toLowerCase() !== derived.publicKey.toLowerCase()) throw new Error('Policy public derivation mismatch');
    return derived.address.toLowerCase();
  }
  async info(body: Record<string, unknown>): Promise<unknown> {
    const r = await this.rt.fetch(`${apiForNetwork(this.network)}/info`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(15_000) });
    if (!r.ok) throw new Error('Hyperliquid public data unavailable');
    return r.json();
  }
  async observe(address: string): Promise<Observation> {
    const observedAt = this.rt.now();
    const [marketRaw, clearinghouseState, orders, history, bookRaw] = await Promise.all([
      this.info({ type: 'metaAndAssetCtxs' }), this.info({ type: 'clearinghouseState', user: address }),
      this.info({ type: 'openOrders', user: address }),
      this.info({ type: 'fundingHistory', coin: 'NEAR', startTime: observedAt - 26 * 3_600_000, endTime: observedAt }),
      this.info({ type: 'l2Book', coin: 'NEAR' }),
    ]);
    const market = parseMarket(marketRaw);
    const fundingHistory = z.array(z.object({ coin: z.literal('NEAR'), time: z.number().int().nonnegative(), fundingRate: numeric }))
      .parse(history).map(r => ({ time: Math.floor(r.time / 3_600_000) * 3_600_000, rate: Number(r.fundingRate) })).sort((a, b) => a.time - b.time);
    const book = z.object({ coin: z.literal('NEAR'), time: z.number().int().nonnegative(), levels: z.tuple([
      z.array(z.object({ px: positive, sz: positive })), z.array(z.object({ px: positive, sz: positive })),
    ]) }).parse(bookRaw);
    // Host clocks drift by a few seconds; 5 s tolerates that while still rejecting clearly bogus timestamps.
    if (book.time > this.rt.now() + 5000) throw new Error('Hyperliquid book timestamp is in the future');
    const mark = Number(market.mark), asks = book.levels[1], bids = book.levels[0];
    const askDepth = asks.filter(a => Number(a.px) <= mark * 1.0025).reduce((s, a) => s + Number(a.px) * Number(a.sz), 0);
    const bidDepth = bids.filter(b => Number(b.px) >= mark * 0.9975).reduce((s, b) => s + Number(b.px) * Number(b.sz), 0);
    return { observedAt: Math.min(observedAt, book.time), mark, funding: Number(market.funding), assetIndex: market.assetIndex,
      szDecimals: market.szDecimals, account: parseAccount(clearinghouseState), clearinghouseState, openOrders: z.array(z.unknown()).parse(orders), fundingHistory,
      depth: { availableNotional: Math.min(askDepth, bidDepth),
        impactBps: asks.length && bids.length ? Math.max(0, (Number(asks[0]!.px) / mark - 1) * 10000, (1 - Number(bids[0]!.px) / mark) * 10000) : 10000 },
      responses: { metaAndAssetCtxs: marketRaw, clearinghouseState, openOrders: orders, fundingHistory: history, l2Book: bookRaw } };
  }
}
export function commandArgs(policy: string, method: 'heartbeat' | 'set_keeper_price' | 'request_order_signature', args: unknown, network: Network = 'testnet', keeper = KEEPER) {
  accountForNetwork(policy, network); accountForNetwork(keeper, network);
  return ['contract', 'call-function', 'as-transaction', policy, method, 'json-args', JSON.stringify(args), 'prepaid-gas',
    method === 'request_order_signature' ? '300 Tgas' : '30 Tgas', 'attached-deposit', '0 NEAR', 'sign-as', keeper,
    'network-config', network, 'sign-with-keychain', 'send'];
}
export function printable(args: string[]) { return `near ${args.map(s => /^[a-zA-Z0-9_.:-]+$/.test(s) ? s : `'${s.replaceAll("'", "'\\''")}'`).join(' ')}`; }
export function extractHash(output: string) {
  const clean = output.replace(/\x1b\[[0-9;]*m/g, '');
  const hashes = [...clean.matchAll(/(?:transaction\s+(?:id|hash)\s*[:=]\s*|\/transactions\/|\/txns\/)([1-9A-HJ-NP-Za-km-z]{32,44})/gi)]
    .flatMap(m => { try { return [txHash(m[1]!)]; } catch { return []; } });
  const unique = [...new Set(hashes)];
  if (unique.length !== 1) throw new Error('NEAR submission uncertain; transaction hash unavailable');
  return unique[0]!;
}
export async function sendNear(rt: Runtime, args: string[]) {
  // Never retry a CLI call, including timeout/nonzero exits: it may already have broadcast.
  try { const result = await rt.exec(args); return extractHash(`${result.stdout}\n${result.stderr}`); }
  catch (error) {
    if (error && typeof error === 'object' && ('stdout' in error || 'stderr' in error)) {
      const e = error as { stdout?: string; stderr?: string };
      return extractHash(`${e.stdout ?? ''}\n${e.stderr ?? ''}`);
    }
    throw new Error('NEAR submission uncertain; inspect journal before any signature retry');
  }
}
export class DiskStore {
  constructor(readonly dir: string) {}
  async init() { await mkdir(this.dir, { recursive: true }); }
  path(name: string) { if (!/^[a-zA-Z0-9_.-]+$/.test(name)) throw new Error('Expected safe report filename'); return join(this.dir, name); }
  async read<T>(name: string): Promise<T | null> {
    try { return JSON.parse(await readFile(this.path(name), 'utf8')) as T; }
    catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; }
  }
  async write(name: string, value: unknown) { await this.replace(name, `${JSON.stringify(value, null, 2)}\n`); }
  async replace(name: string, text: string) {
    const temp = `${this.path(name)}.${randomUUID()}.tmp`;
    const f = await open(temp, 'wx', 0o600);
    try { await f.writeFile(text); await f.sync(); } finally { await f.close(); }
    await rename(temp, this.path(name));
    const d = await open(this.dir, 'r'); try { await d.sync(); } finally { await d.close(); }
  }
  async claim(name: string, value: unknown) {
    const f = await open(this.path(name), 'wx', 0o600);
    try { await f.writeFile(`${JSON.stringify(value, null, 2)}\n`); await f.sync(); } finally { await f.close(); }
    const d = await open(this.dir, 'r'); try { await d.sync(); } finally { await d.close(); }
  }
  async append(name: string, value: unknown) {
    const f = await open(this.path(name), 'a', 0o600);
    try { await f.writeFile(`${JSON.stringify(value)}\n`); await f.sync(); } finally { await f.close(); }
  }
  async remove(name: string) {
    await unlink(this.path(name));
    const d = await open(this.dir, 'r'); try { await d.sync(); } finally { await d.close(); }
  }
}
