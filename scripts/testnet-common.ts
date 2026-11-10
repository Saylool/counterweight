import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { base58 } from '@scure/base';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { z } from 'zod';
import { TESTNET_RPC } from '../packages/hyperliquid/src/index.js';

export const OWNER = 'counterweight-samet.testnet';
export const POLICY = `policy.${OWNER}`;
export const V3_POLICY = `policy-v3.${OWNER}`;
export const NEXT_POLICY = `policy-v2.${OWNER}`;
export function policyPlanFile(policy: string): string | undefined {
  return policy === NEXT_POLICY ? 'docs/evidence/policy-v2-plan.json'
    : policy === V3_POLICY ? 'docs/evidence/policy-v3-plan.json' : undefined;
}
// Deployed, initialized v2 baseline; the saved initializer plan remains authoritative after upgrade.
export const V2_BASELINE_SHA256 = 'd85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1';
export const DEPLOYED_SHA256 = '698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289';
export const KEEPER = `keeper.${OWNER}`;
export const PATH = 'counterweight-1';
export const PROBE_ADDRESS = '0xea8b5c6f1e3e1537222d4cbbbed3d6fa5bcc819a';
export const WASM = 'contracts/policy/artifacts/counterweight_policy.wasm'; // Historical v2, pinned by the legacy demo.
export const V3_WASM = 'contracts/policy/artifacts/counterweight_policy_v3.wasm';
export const LIMITS = { max_short_size: '1000000000000000000000000', per_order_notional_cap: '10000000',
  per_day_notional_cap: '20000000', cooldown_seconds: 60, price_band_bps: 100, price_max_age_seconds: 60 };
export const ORACLE = { account_id: null, feed_id: 'c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750',
  max_age_seconds: 60, max_confidence_bps: 100, min_price: '950000', max_price: '1050000' };
export const SIGNING_LIMITS = { keeper_per_block: 2, keeper_per_window: 8, keeper_outstanding: 8,
  owner_per_window: 16, window_ms: 60000, max_nonce_ahead_ms: 1000 };

export function parseOptions(argv: string[], allowed: readonly string[]) {
  const result: Record<string, string> = {};
  for (const arg of argv) {
    const match = /^--([a-z][a-z0-9-]*)=(.+)$/.exec(arg);
    if (!match || !allowed.includes(match[1]!) || result[match[1]!] !== undefined)
      throw new Error(`Expected unique options: ${allowed.map(a => `--${a}=VALUE`).join(' ')}`);
    result[match[1]!] = match[2]!;
  }
  return result;
}
export function testnetAccount(value: string) {
  if (!/^(?=.{2,64}$)[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\.[a-z0-9]+(?:[-_][a-z0-9]+)*)*\.testnet$/.test(value))
    throw new Error('Expected a named testnet account');
  return value;
}
export function publicKey(value: string) {
  const match = /^ed25519:([1-9A-HJ-NP-Za-km-z]+)$/.exec(value);
  if (!match || base58.decode(match[1]!).length !== 32) throw new Error('Expected an ed25519 public key (32 bytes)');
  return value;
}
export function txHash(value: string) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) || base58.decode(value).length !== 32)
    throw new Error('Expected a base58 NEAR transaction hash');
  return value;
}
export async function committedWasm(wasm = WASM) {
  const [bytes, manifest] = await Promise.all([readFile(wasm), readFile('contracts/policy/artifacts/SHA256SUMS', 'utf8')]);
  const filename = wasm.replace(/^contracts\/policy\//, '');
  const expected = manifest.split('\n').find(line => line.endsWith(`  ${filename}`))?.split('  ')[0];
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== expected) throw new Error('Committed WASM SHA-256 does not match SHA256SUMS; refusing');
  return { sha256, codeHash: base58.encode(Buffer.from(sha256, 'hex')), bytes: bytes.length };
}
export async function rpc(method: 'query' | 'tx' | 'block', params: unknown, fetcher = globalThis.fetch): Promise<unknown> {
  const response = await fetcher(TESTNET_RPC, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'counterweight-testnet-public', method, params }), signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`NEAR RPC HTTP ${response.status}`);
  const envelope = z.object({ result: z.unknown().optional(), error: z.object({ cause: z.object({ name: z.string() }).optional() }).passthrough().optional() }).parse(await response.json());
  if (envelope.error) throw new Error(`NEAR RPC ${envelope.error.cause?.name ?? 'request failed'}`);
  if (envelope.result === undefined) throw new Error('NEAR RPC missing result');
  return envelope.result;
}
export async function stateAt(blockHash: string, policy = POLICY) {
  const result = z.object({ block_hash: z.literal(blockHash), result: z.array(z.number().int().min(0).max(255)) }).parse(await rpc('query', {
    request_type: 'call_function', account_id: policy, method_name: 'get_state', args_base64: 'e30=', block_id: blockHash,
  }));
  return JSON.parse(Buffer.from(result.result).toString('utf8')) as unknown;
}
/** Only public RPC/HTTP. Never invokes a wallet, keychain, CLI or child process. */
export async function publicCli(run: () => Promise<void>) {
  const dispatcher = new EnvHttpProxyAgent();
  setGlobalDispatcher(dispatcher);
  try { await run(); } catch (error) {
    console.error(error instanceof Error && /^(NEAR|Expected|Committed|Contract|Policy|Proof|Usage|Owner|Hyperliquid)/.test(error.message)
      ? error.message : 'Public verification failed (invalid response or transport failure); no NEAR transaction sent');
    process.exitCode = 1;
  } finally { await dispatcher.close(); }
}
