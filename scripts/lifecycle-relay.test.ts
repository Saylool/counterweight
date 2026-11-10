import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { base58 } from '@scure/base';
import { getSigningDigest } from '../packages/hyperliquid/src/index.js';
import { lifecycle, buildOrder } from './lifecycle.js';
import { BASE, withdrawalConfig } from './lifecycle-config.js';
import { parseAccount } from './lifecycle-parsing.js';
import { initialization } from './testnet-plan.js';
import { committedWasm, KEEPER, NEXT_POLICY, OWNER } from './testnet-common.js';
import { policyStateSchema } from './testnet-verify.js';

const memory = vi.hoisted(() => ({ files: new Map<string, string>(), plan: '' }));
vi.mock('node:fs/promises', async original => {
  const fs = await original<typeof import('node:fs/promises')>();
  return { ...fs, mkdir: vi.fn(),
    readFile: vi.fn(async (...args: Parameters<typeof fs.readFile>) => {
      if (String(args[0]) === 'docs/evidence/policy-v2-plan.json') return memory.plan;
      if (memory.files.has(String(args[0]))) return memory.files.get(String(args[0]));
      return fs.readFile(...args);
    }),
    writeFile: vi.fn(async (path: string, data: string, options?: { flag?: string }) => {
      if (options?.flag === 'wx' && memory.files.has(path)) throw new Error('EEXIST');
      memory.files.set(path, data);
    }),
    appendFile: vi.fn(async (path: string, data: string) => memory.files.set(path, (memory.files.get(path) ?? '') + data)),
  };
});
vi.mock('node:readline/promises', () => ({ createInterface: () => ({ close() {}, async *[Symbol.asyncIterator]() {
  yield base58.encode(new Uint8Array(32).fill(8));
} }) }));
vi.mock('../packages/hyperliquid/src/index.js', async original => ({
  ...await original<typeof import('../packages/hyperliquid/src/index.js')>(),
  deriveTestnetAddress: vi.fn(async () => ({ address: `0x${'11'.repeat(20)}` })),
  recoveredSigner: vi.fn(async () => `0x${'11'.repeat(20)}`),
}));
const hash = base58.encode(new Uint8Array(32).fill(8)), hlHash = `0x${'ab'.repeat(32)}`;
const address = `0x${'11'.repeat(20)}`, recipient = `0x${'12'.repeat(20)}`;
const signature = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
const now = 1794314000000;
const json = (body: unknown) => new Response(JSON.stringify(body));
const account = (size: string) => ({ marginSummary: { accountValue: '50', totalMarginUsed: '1' }, withdrawable: '50',
  assetPositions: size === '0' ? [] : [{ position: { coin: 'NEAR', szi: size, positionValue: '12', marginUsed: '1',
    cumFunding: { allTime: '0', sinceOpen: '0', sinceChange: '0' } } }] });

async function setup(step: 'open' | 'close' | 'withdraw', badKeys = false, expired = false, transportFailure = false) {
  const init = initialization(0, 1, recipient, '3.6348'), artifact = await committedWasm();
  const market = { assetIndex: 0, szDecimals: 1, mark: '3.6348', funding: '0', capturedAt: new Date(now).toISOString(), source: 'test', request: { type: 'metaAndAssetCtxs' } };
  const state = policyStateSchema.parse({ ...init, coin: 'NEAR', near_recipient: OWNER, spot_balance: String(5n * BASE),
    signed_short_size: step === 'close' ? String(34n * BASE / 10n) : '0', last_open_expiry: step === 'open' ? '0' : String(now - 60001),
    paused: false, pending: null, mpc_fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, keeper_weight_limit: '5000' });
  memory.plan = JSON.stringify({ policy: NEXT_POLICY, capturedAt: market.capturedAt, market, init, derived: { address }, artifact });
  const beforeSize = step === 'close' ? '-3.4' : '0';
  const order = step === 'withdraw' ? null : buildOrder(state, market, parseAccount(account(beforeSize)), step === 'close');
  const args = order?.args ?? { recipient, amount: '49000000' };
  const nonce = expired ? now - 60000 : now;
  const action = order ? { type: 'order' as const, grouping: 'na' as const, orders: [{ a: 0, b: step === 'close', r: step === 'close',
    p: order.price, s: order.size, t: { limit: { tif: 'Ioc' as const } } }] }
    : { type: 'withdraw3' as const, destination: recipient, amount: '49', time: nonce };
  const input = action.type === 'order' ? { scheme: 'l1' as const, network: 'testnet' as const, action, nonce, expiresAfter: nonce + 60000 }
    : { scheme: 'user' as const, network: 'testnet' as const, action };
  const payload = { action: action.type === 'order' ? action : { ...action, hyperliquidChain: 'Testnet', signatureChainId: '0x66eee' },
    nonce, ...(order ? { expiresAfter: nonce + 60000 } : {}) };
  const method = step === 'withdraw' ? 'request_evm_withdrawal' : 'request_order_signature';
  const caller = step === 'withdraw' ? OWNER : KEEPER;
  const event = (name: string, data: unknown) => ({ id: name, block_hash: name, outcome: { executor_id: NEXT_POLICY,
    status: { SuccessValue: 'dHJ1ZQ==' }, logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', version: '1.0.0', event: name, data: [data] })}`] } });
  const transaction = { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' },
    transaction: { hash, signer_id: caller, receiver_id: NEXT_POLICY, actions: [{ FunctionCall: { method_name: method, deposit: '0',
      args: Buffer.from(JSON.stringify(args)).toString('base64') } }] }, receipts_outcome: [
      event('request', { id: '1', caller, kind: step === 'withdraw' ? 'EvmWithdrawal' : step === 'close' ? 'Reduce' : 'Increase', payload, digest: getSigningDigest(input).slice(2) }),
      event('signature', { id: '1', nonce: String(nonce), expiresAfter: order ? String(nonce + 60000) : null, signature }),
    ] };
  let submitted = false;
  const fetcher = vi.fn<typeof fetch>(async (url, request) => {
    const body = JSON.parse(String(request?.body));
    if (String(url).endsWith('/exchange')) {
      submitted = true;
      if (transportFailure) throw new Error('connection lost');
      return json(step === 'withdraw' ? { status: 'ok', response: { type: 'default' } }
        : { status: 'ok', response: { type: 'order', data: { statuses: [{ filled: { oid: 42, totalSz: order!.size, avgPx: market.mark } }] } } });
    }
    if (String(url).endsWith('/info')) {
      if (body.type === 'metaAndAssetCtxs') return json([{ universe: [{ name: 'NEAR', szDecimals: 1 }] }, [{ markPx: market.mark, funding: '0' }]]);
      if (body.type === 'clearinghouseState') return json(account(submitted ? step === 'open' ? '-3.4' : '0' : beforeSize));
      if (body.type === 'userFills') return json(submitted && order ? [{ coin: 'NEAR', oid: 42, time: nonce, hash: hlHash, side: step === 'close' ? 'B' : 'A', sz: order.size, px: market.mark, fee: '0.01', closedPnl: '0' }] : []);
      if (body.type === 'userNonFundingLedgerUpdates') return json(submitted && step === 'withdraw' ? [{ hash: hlHash, time: nonce, delta: { type: 'withdraw', usdc: '49' } }] : []);
      if (['openOrders', 'userFunding'].includes(body.type)) return json([]);
    }
    const p = body.params;
    if (body.method === 'block') return json({ result: { header: { hash: 'finalized' } } });
    if (body.method === 'tx') return json({ result: transaction });
    if (p.request_type === 'view_account') return json({ result: { block_hash: p.block_id, code_hash: artifact.codeHash } });
    if (p.request_type === 'view_access_key_list') return json({ result: { block_hash: p.block_id, keys: badKeys && p.block_id === 'signature' ? [{ public_key: 'public', access_key: { permission: 'FullAccess' } }] : [] } });
    if (p.request_type === 'call_function') {
      const value = p.method_name === 'get_state' ? state : p.method_name === 'ft_balance_of' ? String(5n * BASE)
        : step === 'withdraw' ? { limits: withdrawalConfig(address, String(5n * BASE), init.oracle.min_price, NEXT_POLICY), route: null, withdrawal: null, withdrawals: [] } : null;
      return json({ result: { block_hash: p.block_id, result: [...Buffer.from(JSON.stringify(value))] } });
    }
    throw new Error(`Unexpected mocked public request ${String(url)}`);
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}
beforeEach(() => {
  memory.files.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('funded lifecycle relay (offline public API fixtures)', () => {
  it.each(['open', 'close', 'withdraw'] as const)('relays %s once and persists actual public verification', async step => {
    const fetcher = await setup(step);
    await lifecycle([`--step=${step}`]);
    const record = JSON.parse(memory.files.get(`docs/evidence/lifecycle-relay-${hash}.json`)!);
    expect(record.outcome).toBe(step === 'withdraw' ? 'venue-withdrawal-ledger-verified-bridge-arrival-unverified' : 'public-fill-and-position-verified');
    expect(record.commands).toHaveLength(3);
    expect(record.commands.every((c: string) => c.includes('sign-with-keychain'))).toBe(true);
    expect([...memory.files.entries()].find(([p]) => p.endsWith(`-lifecycle-${step}.md`))?.[1]).toContain(hlHash);
    await expect(lifecycle([`--step=${step}`])).rejects.toThrow();
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });
  it('does not print withdrawal setup at the initial funded flat status', async () => {
    const fetcher = await setup('open');
    await lifecycle(['--step=status']);
    const record = JSON.parse([...memory.files.values()][0]!.split('```json\n')[1]!.split('\n```')[0]!);
    expect(record.withdrawalSetup).toBeUndefined();
    expect(record.outcome).toBe('public-status-verified');
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/exchange'))).toBe(false);
  });
  it.each(['keys', 'expired'] as const)('rejects %s before exchange submission', async failure => {
    const fetcher = await setup('open', failure === 'keys', failure === 'expired');
    await expect(lifecycle(['--step=open'])).rejects.toThrow();
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/exchange'))).toBe(false);
    expect([...memory.files.values()].join('\n')).toContain('failed-before-submission');
  });
  it('retains uncertain submissions and blocks replay after a transport failure', async () => {
    const fetcher = await setup('open', false, false, true);
    await expect(lifecycle(['--step=open'])).rejects.toThrow('connection lost');
    expect(JSON.parse(memory.files.get(`docs/evidence/lifecycle-relay-${hash}.json`)!).outcome).toBe('submission-outcome-unknown');
    await expect(lifecycle(['--step=open'])).rejects.toThrow();
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });
  it('rechecks a recorded withdrawal using only public reads', async () => {
    const fetcher = await setup('withdraw');
    await lifecycle(['--step=withdraw']);
    await lifecycle(['--step=status', `--relay-tx=${hash}`]);
    const evidence = [...memory.files.entries()].find(([p]) => p.endsWith('-lifecycle-status.md'))![1];
    expect(evidence).toContain('relayVerification');
    expect(evidence).toContain(hlHash);
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });
});
