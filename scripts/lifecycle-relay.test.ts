import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { base58 } from '@scure/base';
import { getSigningDigest } from '../packages/hyperliquid/src/index.js';
import { lifecycle, buildOrder } from './lifecycle.js';
import { BASE, withdrawalConfig } from './lifecycle-config.js';
import { parseAccount } from './lifecycle-parsing.js';
import { initialization, V3_MARGIN_LIMITS } from './testnet-plan.js';
import { committedWasm, KEEPER, NEXT_POLICY, OWNER, V3_POLICY, V3_WASM } from './testnet-common.js';
import { policyStateSchema, verifyTestnet } from './testnet-verify.js';

const memory = vi.hoisted(() => ({ files: new Map<string, string>(), plan: '' }));
vi.mock('node:fs/promises', async original => {
  const fs = await original<typeof import('node:fs/promises')>();
  return { ...fs, mkdir: vi.fn(),
    readFile: vi.fn(async (...args: Parameters<typeof fs.readFile>) => {
      if (['docs/evidence/policy-v2-plan.json', 'docs/evidence/policy-v3-plan.json'].includes(String(args[0]))) return memory.plan;
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

async function setup(step: 'open' | 'close' | 'withdraw' | 'to-perp', badKeys = false, expired = false, transportFailure = false, policy = NEXT_POLICY) {
  const spot = policy === V3_POLICY && step === 'withdraw' ? '0' : String(5n * BASE);
  const init = initialization(0, 1, recipient, '3.6348'), artifact = await committedWasm(policy === V3_POLICY ? V3_WASM : undefined);
  const market = { assetIndex: 0, szDecimals: 1, mark: '3.6348', funding: '0', capturedAt: new Date(now).toISOString(), source: 'test', request: { type: 'metaAndAssetCtxs' } };
  const state = policyStateSchema.parse({ ...init, coin: 'NEAR', near_recipient: OWNER, spot_balance: spot,
    signed_short_size: step === 'close' ? String(34n * BASE / 10n) : '0', last_open_expiry: step === 'open' ? '0' : String(now - 60001),
    paused: false, pending: null, mpc_fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, keeper_weight_limit: '5000' });
  memory.plan = JSON.stringify({ policy, capturedAt: market.capturedAt, market, init, ...(policy === V3_POLICY ? { marginLimits: V3_MARGIN_LIMITS } : {}), derived: { address }, artifact });
  const beforeSize = step === 'close' ? '-3.4' : '0';
  const order = (step === 'withdraw' || step === 'to-perp') ? null : buildOrder(state, market, parseAccount(account(beforeSize)), step === 'close', policy);
  const args = order?.args ?? (step === 'to-perp' ? { amount: '49000000', to_perp: true } : { recipient, amount: '49000000' });
  const nonce = expired ? now - 60000 : now;
  const action = order ? { type: 'order' as const, grouping: 'na' as const, orders: [{ a: 0, b: step === 'close', r: step === 'close',
    p: order.price, s: order.size, t: { limit: { tif: 'Ioc' as const } } }] }
    : step === 'to-perp' ? { type: 'usdClassTransfer' as const, amount: '49', toPerp: true, nonce } : { type: 'withdraw3' as const, destination: recipient, amount: '49', time: nonce };
  const input = action.type === 'order' ? { scheme: 'l1' as const, network: 'testnet' as const, action, nonce, expiresAfter: nonce + 60000 }
    : { scheme: 'user' as const, network: 'testnet' as const, action };
  const payload = { action: action.type === 'order' ? action : { ...action, hyperliquidChain: 'Testnet', signatureChainId: '0x66eee' },
    nonce, ...(order ? { expiresAfter: nonce + 60000 } : {}) };
  const method = step === 'to-perp' ? 'request_usd_class_transfer' : step === 'withdraw' ? 'request_evm_withdrawal' : 'request_order_signature';
  const caller = (step === 'withdraw' || step === 'to-perp') ? OWNER : KEEPER;
  const event = (name: string, data: unknown) => ({ id: name, block_hash: name, outcome: { executor_id: policy,
    status: { SuccessValue: 'dHJ1ZQ==' }, logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', version: '1.0.0', event: name, data: [data] })}`] } });
  const transaction = { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' },
    transaction: { hash, signer_id: caller, receiver_id: policy, actions: [{ FunctionCall: { method_name: method, deposit: '0',
      args: Buffer.from(JSON.stringify(args)).toString('base64') } }] }, receipts_outcome: [
      event('request', { id: '1', caller, kind: step === 'to-perp' ? 'UsdClassTransfer' : step === 'withdraw' ? 'EvmWithdrawal' : step === 'close' ? 'Reduce' : 'Increase', payload, digest: getSigningDigest(input).slice(2) }),
      event('signature', { id: '1', nonce: String(nonce), expiresAfter: order ? String(nonce + 60000) : null, signature }),
    ] };
  let submitted = false;
  const fetcher = vi.fn<typeof fetch>(async (url, request) => {
    const body = JSON.parse(String(request?.body));
    if (String(url).endsWith('/exchange')) {
      submitted = true;
      if (transportFailure) throw new Error('connection lost');
      return json((step === 'withdraw' || step === 'to-perp') ? { status: 'ok', response: { type: 'default' } }
        : { status: 'ok', response: { type: 'order', data: { statuses: [{ filled: { oid: 42, totalSz: order!.size, avgPx: market.mark } }] } } });
    }
    if (String(url).endsWith('/info')) {
      if (body.type === 'meta') return json({ universe: [{ name: 'NEAR', szDecimals: 1 }] });
      if (body.type === 'metaAndAssetCtxs') return json([{ universe: [{ name: 'NEAR', szDecimals: 1 }] }, [{ markPx: market.mark, funding: '0' }]]);
      if (body.type === 'spotClearinghouseState') return json({ balances: [{ coin: 'USDC', total: submitted && step === 'to-perp' ? '1' : '50', hold: '0' }] });
      if (body.type === 'clearinghouseState' && step === 'to-perp') return json({ ...account('0'), marginSummary: { accountValue: submitted ? '49' : '0', totalMarginUsed: '0' } });
      if (body.type === 'clearinghouseState') return json(account(submitted ? step === 'open' ? '-3.4' : '0' : beforeSize));
      if (body.type === 'userFills') return json(submitted && order ? [{ coin: 'NEAR', oid: 42, time: nonce, hash: hlHash, side: step === 'close' ? 'B' : 'A', sz: order.size, px: market.mark, fee: '0.01', closedPnl: '0' }] : []);
      if (body.type === 'userNonFundingLedgerUpdates') return json(submitted && step === 'withdraw' ? [{ hash: hlHash, time: nonce, delta: { type: 'withdraw', usdc: '48', fee: '1.0', nonce: nonce * 1000 } }] : []);
      if (['openOrders', 'userFunding'].includes(body.type)) return json([]);
    }
    const p = body.params;
    if (body.method === 'block') return json({ result: { header: { hash: 'finalized', height: 1 } } });
    if (body.method === 'tx') return json({ result: transaction });
    if (p.request_type === 'view_account') return json({ result: { block_hash: p.block_id, code_hash: artifact.codeHash } });
    if (p.request_type === 'view_access_key_list') return json({ result: { block_hash: p.block_id, keys: (step === 'to-perp' || (badKeys && p.block_id === 'signature')) ? [{ public_key: 'public', access_key: { permission: 'FullAccess' } }] : [] } });
    if (p.request_type === 'call_function') {
      const value = p.method_name === 'get_state' ? state : p.method_name === 'ft_balance_of' ? spot
        : p.method_name === 'get_margin' ? { limits: V3_MARGIN_LIMITS, withdrawal: null, withdrawals: [] }
        : step === 'withdraw' && policy !== V3_POLICY ? { limits: withdrawalConfig(address, String(5n * BASE), init.oracle.min_price, NEXT_POLICY), route: null, withdrawal: null, withdrawals: [] } : null;
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
  it.each([
    [V3_POLICY, 'open', true],
    [V3_POLICY, 'close', false],
    [NEXT_POLICY, 'open', false],
    [NEXT_POLICY, 'close', false],
  ] as const)('prints owner margin attestation immediately before only the v3 open request (%s, %s)', async (policy, step, observesMargin) => {
    await setup(step, false, false, false, policy);
    await lifecycle([`--policy=${policy}`, `--step=${step}`]);
    const printed = vi.mocked(console.log).mock.calls
      .map(([message]) => String(message)).filter(message => message.startsWith('near contract '));
    expect(printed.map(command => command.match(/ as-transaction \S+ (\S+) json-args /)![1])).toEqual([
      'heartbeat', 'set_keeper_price', ...(observesMargin ? ['observe_margin'] : []), 'request_order_signature',
    ]);
    expect(printed.at(-1)).toContain(`sign-as ${KEEPER}`);
    if (observesMargin) {
      expect(printed.at(-2)).toContain(`sign-as ${OWNER}`);
      expect(printed.at(-2)).toContain(`as-transaction ${V3_POLICY} observe_margin`);
      expect(printed.at(-2)).toContain(`'${JSON.stringify({ equity_usdc: '50000000', withdrawable_usdc: '50000000', observed_at_ms: String(now) })}'`);
    }
  });

  it.each([NEXT_POLICY, V3_POLICY])('verification selects saved plan and artifact from %s', async policy => {
    await setup('to-perp', false, false, false, policy);
    await verifyTestnet([`--policy=${policy}`, '--before-key-removal=true']);
    const report = JSON.parse(String(vi.mocked(console.log).mock.calls.at(-1)![0]));
    expect(report.checks.every((c: { ok: boolean }) => c.ok)).toBe(true);
    expect(report.account).toBe(policy);
  });

  it.each(['open', 'close', 'withdraw', 'to-perp'] as const)('uses v3 artifact, address and adapter-free setup for %s', async step => {
    const fetcher = await setup(step, false, false, false, V3_POLICY);
    await lifecycle([`--policy=${V3_POLICY}`, `--step=${step}`, ...(step === 'to-perp' ? ['--amount=49'] : [])]);
    const record = JSON.parse(memory.files.get(`docs/evidence/lifecycle-relay-${hash}.json`)!);
    expect(record.outcome).toMatch(/verified/);
    expect(record.commands.join('\n')).toContain(V3_POLICY);
    expect(record.commands.join('\n')).not.toMatch(/policy-v2|configure_rebalancing/);
    if (step === 'withdraw') expect(record.spot.contract).toBe('0');
    if (step === 'close') expect(record.expected.args.order.observed_at).toBe(String(now / 1000));
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });
  it('relays an already-signed v3 transfer older than the local 60s limit once without prompting', async () => {
    const fetcher = await setup('to-perp', false, true, false, V3_POLICY);
    await lifecycle([`--policy=${V3_POLICY}`, '--step=to-perp', `--relay-tx=${hash}`]);
    const record = JSON.parse(memory.files.get(`docs/evidence/lifecycle-relay-${hash}.json`)!);
    expect(record.commands).toEqual([]);
    expect(record.outcome).toBe('spot-to-perps-balances-verified');
    await expect(lifecycle([`--policy=${V3_POLICY}`, '--step=to-perp', `--relay-tx=${hash}`])).rejects.toThrow('already claimed');
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });
  it('prints a fresh owner command for a v3 transfer beyond the venue nonce window', async () => {
    const fetcher = await setup('to-perp', false, false, false, V3_POLICY);
    vi.setSystemTime(now + 172800000);
    await lifecycle([`--policy=${V3_POLICY}`, '--step=to-perp', `--relay-tx=${hash}`]);
    expect(vi.mocked(console.log).mock.calls.flat().join('\n')).toContain('request_usd_class_transfer');
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(0);
    expect(memory.files.has(`docs/evidence/lifecycle-relay-${hash}.json`)).toBe(false);
  });
  it('blocks resumed transfers when public history shows an earlier submission', async () => {
    const fetcher = await setup('to-perp', false, true, false, V3_POLICY);
    const original = fetcher.getMockImplementation()!;
    fetcher.mockImplementation(async (url, request) => {
      const body = JSON.parse(String(request?.body));
      if (body.type === 'userNonFundingLedgerUpdates') return json([{ time: now, delta: { type: 'accountClassTransfer' } }]);
      return original(url, request);
    });
    await expect(lifecycle([`--policy=${V3_POLICY}`, '--step=to-perp', `--relay-tx=${hash}`])).rejects.toThrow('already');
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/exchange'))).toBe(false);
  });
  it('retains a resumed transfer claim across a lost exchange response', async () => {
    const fetcher = await setup('to-perp', false, true, true, V3_POLICY);
    const args = [`--policy=${V3_POLICY}`, '--step=to-perp', `--relay-tx=${hash}`];
    await expect(lifecycle(args)).rejects.toThrow('connection lost');
    await expect(lifecycle(args)).rejects.toThrow('already claimed');
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });
  it.each([NEXT_POLICY, V3_POLICY])('prints spot owner calls and verifies post-transfer custody for %s', async policy => {
    const fetcher = await setup('open', false, false, false, policy);
    await lifecycle([`--policy=${policy}`, '--step=spot', '--amount=4']);
    const output = vi.mocked(console.log).mock.calls.flat().join('\n');
    expect(output).toContain('near_deposit'); expect(output).toContain('ft_transfer_call');
    const original = fetcher.getMockImplementation()!;
    fetcher.mockImplementation(async (url, request) => {
      const body = JSON.parse(String(request?.body));
      if (body.method === 'tx') return json({ result: { final_execution_status: 'FINAL', status: { SuccessValue: '' },
        transaction: { hash, signer_id: OWNER, receiver_id: 'wrap.testnet', actions: [{ FunctionCall: { method_name: 'ft_transfer_call',
          args: Buffer.from(JSON.stringify({ receiver_id: policy, amount: String(4n * BASE), msg: '' })).toString('base64') } }] },
        receipts_outcome: [{ outcome: { executor_id: policy, status: { SuccessValue: '' }, logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', event: 'deposit', data: [{ amount: String(4n * BASE) }] })}`] } }] } });
      return original(url, request);
    });
    await lifecycle([`--policy=${policy}`, '--step=spot', '--amount=4', `--spot-tx=${hash}`]);
    expect(vi.mocked(console.log).mock.calls.flat().join('\n')).toContain('spot-deposit-custody-verified');
    await expect(lifecycle([`--policy=${policy}`, '--step=spot', '--amount=3', `--spot-tx=${hash}`])).rejects.toThrow('amount');
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/exchange'))).toBe(false);
  });
  it('keeps explicit v2 commands and request identical to the default historical flow', async () => {
    await setup('open');
    await lifecycle(['--step=open']);
    const historical = JSON.parse(memory.files.get(`docs/evidence/lifecycle-relay-${hash}.json`)!);
    memory.files.clear();
    await setup('open');
    await lifecycle([`--policy=${NEXT_POLICY}`, '--step=open']);
    const explicit = JSON.parse(memory.files.get(`docs/evidence/lifecycle-relay-${hash}.json`)!);
    expect(explicit).toEqual(historical);
  });

  it.each(['open', 'close', 'withdraw', 'to-perp'] as const)('relays %s once and persists actual public verification', async step => {
    const fetcher = await setup(step);
    await lifecycle([`--step=${step}`, ...(step === 'to-perp' ? ['--amount=49'] : [])]);
    const record = JSON.parse(memory.files.get(`docs/evidence/lifecycle-relay-${hash}.json`)!);
    expect(record.outcome).toBe(step === 'to-perp' ? 'spot-to-perps-balances-verified' : step === 'withdraw' ? 'venue-withdrawal-ledger-verified-bridge-arrival-unverified' : 'public-fill-and-position-verified');
    expect(record.commands).toHaveLength(step === 'to-perp' ? 1 : 3);
    expect(record.commands.every((c: string) => c.includes('sign-with-keychain'))).toBe(true);
    expect([...memory.files.entries()].find(([p]) => p.endsWith(`-lifecycle-${step}.md`))?.[1]).toContain(step === 'to-perp' ? 'perpsAfter' : hlHash);
    if (step === 'to-perp') {
      expect(record.commands[0]).toContain(`sign-as ${OWNER}`);
      expect(record.request.action).toMatchObject({ type: 'usdClassTransfer', amount: '49', toPerp: true });
      expect(record.request.expiresAfter).toBeUndefined();
      expect(record.request.vaultAddress).toBeUndefined();
    }
    await expect(lifecycle([`--step=${step}`, ...(step === 'to-perp' ? ['--amount=49'] : [])])).rejects.toThrow();
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });
  it('retains the deployed baseline plan after upgrading code', async () => {
    await setup('to-perp');
    const saved = JSON.parse(memory.plan);
    saved.artifact.sha256 = 'd85b2f91a182402fd1089ad6353e174a5b3de7611534cc839e601d78401eabe1';
    memory.plan = JSON.stringify(saved);
    await lifecycle(['--step=to-perp', '--amount=49']);
    expect(memory.plan).toBe(JSON.stringify(saved));
    expect(JSON.parse(memory.files.get(`docs/evidence/lifecycle-relay-${hash}.json`)!).outcome).toBe('spot-to-perps-balances-verified');
  });
  it('rejects an expired class transfer before exchange submission', async () => {
    const fetcher = await setup('to-perp', false, true);
    await expect(lifecycle(['--step=to-perp', '--amount=49'])).rejects.toThrow('too old');
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/exchange'))).toBe(false);
  });
  it.each(['0', '60.000001', '-1', '1e1', '0.0000001'])('rejects invalid transfer amount %s', async amount => {
    await expect(lifecycle(['--step=to-perp', `--amount=${amount}`])).rejects.toThrow();
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
  it.each(['withdraw', 'to-perp'] as const)('rechecks a recorded %s using only public reads', async step => {
    const fetcher = await setup(step);
    await lifecycle([`--step=${step}`, ...(step === 'to-perp' ? ['--amount=49'] : [])]);
    await lifecycle(['--step=status', `--relay-tx=${hash}`]);
    const evidence = [...memory.files.entries()].find(([p]) => p.endsWith('-lifecycle-status.md'))![1];
    expect(evidence).toContain('relayVerification');
    expect(evidence).toContain(step === 'to-perp' ? 'perpsAfter' : hlHash);
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });
  it('rechecks an older withdrawal from its saved nonce window without resubmitting', async () => {
    const fetcher = await setup('withdraw');
    await lifecycle(['--step=withdraw']);
    vi.setSystemTime(now + 3 * 86400000);
    await lifecycle(['--step=status', `--relay-tx=${hash}`]);
    const queries = fetcher.mock.calls.filter(([url]) => String(url).endsWith('/info')).map(([, request]) => JSON.parse(String(request?.body)));
    expect(queries).toContainEqual({ type: 'userNonFundingLedgerUpdates', user: address, startTime: now, endTime: now + 86400000 });
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });

});
