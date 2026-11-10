import { mkdtemp, readFile, rm, readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { base58 } from '@scure/base';
import { getSigningDigest } from '../packages/hyperliquid/src/index.js';
import { DiskStore, PublicClient, commandArgs, extractHash, type Runtime } from '../apps/keeper/src/run-io.js';
import { KEEPER, assess, heartbeatDue, planOrder, priceNeeded, riskSettings, stateSchema } from '../apps/keeper/src/run-state.js';
import { Keeper, addCycle, newSummary, parseRunOptions, runKeeper, summaryMarkdown } from '../apps/keeper/src/run.js';

vi.mock('../packages/hyperliquid/src/index.js', async original => ({
  ...await original<typeof import('../packages/hyperliquid/src/index.js')>(),
  recoveredSigner: vi.fn(async () => `0x${'11'.repeat(20)}`),
}));
const address = `0x${'11'.repeat(20)}`, policy = 'policy-v3.counterweight-samet.testnet';
const hash = base58.encode(new Uint8Array(32).fill(8)), fillHash = `0x${'ab'.repeat(32)}`;
const signature = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
const dirs: string[] = [];
const json = (value: unknown, status = 200, headers?: Record<string, string>) => new Response(JSON.stringify(value), { status, ...(headers ? { headers } : {}) });
const BASE = 10n ** 24n;
const start = 1794314000000;
const account = (size: string, equity = '13') => ({ marginSummary: { accountValue: equity, totalMarginUsed: '1' }, withdrawable: equity,
  assetPositions: size === '0' ? [] : [{ position: { coin: 'NEAR', szi: size, positionValue: '12', marginUsed: '1', cumFunding: { allTime: '0', sinceOpen: '0', sinceChange: '0' } } }] });
function makeState() {
  return stateSchema.parse({ network: 'Testnet', keeper: KEEPER, coin: 'NEAR', signer_account: 'v1.signer-prod.testnet', derivation_path: 'counterweight-1',
    evm_recipient: address, asset_index: 0, size_decimals: 1, limits: { max_short_size: String(5n * BASE), per_order_notional_cap: '20000000', per_day_notional_cap: '40000000',
      cooldown_seconds: 60, price_band_bps: 100, price_max_age_seconds: 60 }, oracle: { min_price: '2000000', max_price: '4000000', max_age_seconds: 60 },
    oracle_price: '0', oracle_timestamp: '0', reference_price: '3000000', reference_price_timestamp: String(Math.floor(start / 1000)),
    last_keeper_heartbeat: String(Math.floor(start / 1000)), heartbeat_timeout_seconds: 3600, paused: false, pending: null,
    spot_balance: String(5n * BASE), signed_short_size: String(4n * BASE), daily_usage: '0', last_nonce: '0', last_open_expiry: '0' });
}
async function setup(dry = false) {
  const dir = await mkdtemp(join(tmpdir(), 'counterweight-keeper-')); dirs.push(dir);
  const store = new DiskStore(dir), state = makeState();
  let now = start, size = '-4', equity = '13', submitted = false, receipt: unknown;
  let exchangeFailure = false, nearFailure = false, venueFailure = false, fillVisible = true;
  const options = { ...parseRunOptions([`--policy=${policy}`]), dry };
  const rt: Runtime = { now: () => now, random: () => 0.5, print: vi.fn(), sleep: vi.fn(async ms => { now += ms; }),
    exec: vi.fn(async args => {
      const method = args[4], input = JSON.parse(args[6]!);
      if (method === 'heartbeat') state.last_keeper_heartbeat = String(Math.floor(now / 1000));
      if (method === 'set_keeper_price') { state.reference_price = input.price; state.reference_price_timestamp = input.observed_at; }
      if (method === 'request_order_signature') {
        if (nearFailure) throw new Error('CLI timeout after broadcast');
        const reduce = input.order.reduce_only;
        const orderSize = String(Number(BigInt(input.order.size)) / 1e24);
        const action = { type: 'order' as const, grouping: 'na' as const, orders: [{ a: 0, b: reduce, p: reduce ? '3.03' : '2.97', s: orderSize, r: reduce, t: { limit: { tif: 'Ioc' as const } } }] };
        const signing = { scheme: 'l1' as const, network: 'testnet' as const, action, nonce: now, expiresAfter: now + 60000 };
        const event = (event: string, data: unknown) => ({ id: event, block_hash: event, outcome: { executor_id: policy,
          status: { SuccessValue: 'dHJ1ZQ==' }, logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', version: '1.0.0', event, data: [data] })}`] } });
        receipt = { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' }, transaction: { hash, signer_id: KEEPER, receiver_id: policy,
          actions: [{ FunctionCall: { method_name: method, deposit: '0', args: Buffer.from(JSON.stringify(input)).toString('base64') } }] }, receipts_outcome: [
          event('request', { id: '1', caller: KEEPER, kind: reduce ? 'Reduce' : 'Increase', digest: getSigningDigest(signing).slice(2), payload: { action, nonce: now, expiresAfter: now + 60000 } }),
          event('signature', { id: '1', nonce: String(now), expiresAfter: String(now + 60000), signature }),
        ] };
      } else receipt = { final_execution_status: 'FINAL', status: { SuccessValue: '' }, transaction: { hash, signer_id: KEEPER, receiver_id: policy }, receipts_outcome: [] };
      return { stdout: `Transaction ID: ${hash}`, stderr: '' };
    }),
    fetch: vi.fn<typeof fetch>(async (url, init) => {
      const body = JSON.parse(String(init?.body));
      if (String(url).endsWith('/exchange')) {
        submitted = true;
        if (exchangeFailure) throw new Error('lost response after venue acceptance');
        return json({ status: 'ok', response: { type: 'order', data: { statuses: [{ filled: { totalSz: '4', avgPx: '3', oid: 42 } }] } } });
      }
      if (String(url).endsWith('/info')) {
        if (venueFailure) throw new Error('offline');
        if (body.type === 'metaAndAssetCtxs') return json([{ universe: [{ name: 'NEAR', szDecimals: 1 }] }, [{ markPx: '3', funding: '0.0001' }]]);
        if (body.type === 'clearinghouseState') return json(account(submitted && fillVisible ? '0' : size, equity));
        if (body.type === 'openOrders') return json([]);
        if (body.type === 'userFills') return json(submitted && fillVisible ? [{ coin: 'NEAR', oid: 42, time: start, hash: fillHash, side: 'B', sz: '4', px: '3', fee: '0.01', closedPnl: '0' }] : []);
        if (body.type === 'fundingHistory') return json(Array.from({ length: 24 }, (_, i) => ({ coin: 'NEAR', time: Math.floor(now / 3600000) * 3600000 - (23 - i) * 3600000, fundingRate: '0.0001' })));
        if (body.type === 'l2Book') return json({ coin: 'NEAR', time: now, levels: [[{ px: '2.999', sz: '1000' }], [{ px: '3.001', sz: '1000' }]] });
      }
      if (body.method === 'tx') return json({ result: receipt });
      if (body.params.request_type === 'view_account') return json({ result: { block_hash: body.params.block_id, code_hash: 'code-v3' } });
      if (body.params.request_type === 'view_access_key_list') return json({ result: { block_hash: body.params.block_id, keys: [] } });
      if (body.params.request_type === 'call_function') return json({ result: { block_hash: body.params.block_id ?? 'final', result: [...Buffer.from(JSON.stringify(body.params.method_name === 'get_state' ? state : null))] } });
      throw new Error('Unexpected mock request');
    }),
  };
  vi.spyOn(PublicClient.prototype, 'derive').mockResolvedValue(address);
  const keeper = new Keeper(options, store, rt);
  return { store, state, rt, keeper, options, dir, setTime: (n: number) => { now = n; }, setSize: (s: string) => { size = s; }, setEquity: (e: string) => { equity = e; },
    failExchange: () => { exchangeFailure = true; }, failNear: () => { nearFailure = true; }, failVenue: () => { venueFailure = true; }, hideFill: () => { fillVisible = false; }, showFill: () => { fillVisible = true; } };
}
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });

describe('unattended keeper policy and timing', () => {
  it('supports the requested dry command and defaults to no opening', () => {
    expect(parseRunOptions(['--dry'])).toMatchObject({ dry: true, allowOpen: false, hours: 48, intervalMs: 300000 });
    expect(parseRunOptions([`--policy=${policy}`, '--allow-open'])).toMatchObject({ policy, allowOpen: true });
  });
  it.each(['', '--hours=0', '--hours=NaN', '--interval-seconds=0', '--policy=mainnet.near', '--dry --dry', '--oops'])('rejects invalid options %s', args => {
    expect(() => parseRunOptions(args.split(' '))).toThrow();
  });
  it('heartbeats at one third of timeout, well before expiration', () => {
    const state = makeState();
    expect(heartbeatDue(state, start + 1199000)).toBe(false);
    expect(heartbeatDue(state, start + 1200000)).toBe(true);
  });
  it('sends and confirms heartbeat even while the venue is unavailable', async () => {
    const x = await setup(); x.setTime(start + 1200000); x.failVenue();
    const c = await x.keeper.cycle();
    expect(c.heartbeats).toBe(1); expect(c.errors).toHaveLength(1);
    expect(x.rt.exec).toHaveBeenCalledTimes(1);
    expect(vi.mocked(x.rt.exec).mock.calls[0]![0]).toEqual(commandArgs(policy, 'heartbeat', {}));
  });
  it('uses shared H and reduces below the policy threshold while H remains positive', async () => {
    const x = await setup(); const o = await x.keeper.client.observe(address);
    const risk = assess(x.state, o, riskSettings(x.state, null), start);
    expect(risk.metrics.headroom).toBe(0.78); expect(risk.thresholdUsd).toBe(1.212);
    expect(planOrder(policy, x.state, o, riskSettings(x.state, null), start, false)).toMatchObject({ reduceOnly: true, size: '4' });
  });
  it('honors policy-specific reserve/threshold and rebalance settings', async () => {
    const x = await setup();
    expect(riskSettings(x.state, { limits: { min_headroom_bps: 3000, fee_reserve_usdc: '200000' } })).toEqual({ minHeadroomBps: 3000, feeReserve: 0.2 });
    x.state.limits.min_headroom_bps = 4000;
    expect(riskSettings(x.state, null).minHeadroomBps).toBe(4000);
  });
  it('refreshes changed/stale prices and rejects marks outside immutable bounds', () => {
    const state = makeState();
    expect(priceNeeded(state, 3, start, start)).toBe(false);
    expect(priceNeeded(state, 3.1, start, start)).toBe(true);
    expect(priceNeeded(state, 3, start + 31000, start + 31000)).toBe(true);
    expect(() => priceNeeded(state, 5, start, start)).toThrow('bounds');
    expect(() => priceNeeded(state, 3, start - 31000, start)).toThrow('stale');
  });
  it('never opens by default; explicit opening obeys backing, turnover and funding rules', async () => {
    const x = await setup(); x.setSize('0'); x.setEquity('100'); x.state.signed_short_size = '0';
    const o = await x.keeper.client.observe(address), settings = riskSettings(x.state, null);
    expect(planOrder(policy, x.state, o, settings, start, false)).toBeNull();
    expect(planOrder(policy, x.state, o, settings, start, true)).toMatchObject({ reduceOnly: false, size: '5' });
    x.state.daily_usage = '40000000'; expect(planOrder(policy, x.state, o, settings, start, true)).toBeNull();
    x.state.daily_usage = '0'; o.funding = -0.001; expect(planOrder(policy, x.state, o, settings, start, true)).toBeNull();
  });
  it.each(['pending', 'paused', 'orders', 'long', 'stale'] as const)('blocks unsafe %s observations', async issue => {
    const x = await setup(), o = await x.keeper.client.observe(address);
    if (issue === 'pending') x.state.pending = {};
    if (issue === 'paused') x.state.paused = true;
    if (issue === 'orders') o.openOrders = [{}];
    if (issue === 'long') o.account.signedSize = 4;
    if (issue === 'stale') o.observedAt -= 31000;
    expect(planOrder(policy, x.state, o, riskSettings(x.state, null), start, false)).toBeNull();
  });
});

describe('public RPC backoff', () => {
  it('honors HTTP 429 Retry-After and switches to the configured fallback', async () => {
    const x = await setup();
    x.rt.fetch = vi.fn<typeof fetch>().mockResolvedValueOnce(json({}, 429, { 'retry-after': '2' })).mockResolvedValueOnce(json({ result: { ok: true } }));
    const client = new PublicClient(x.rt, 'https://fallback.example.test');
    expect(await client.rpc('query', {})).toEqual({ ok: true });
    expect(x.rt.sleep).toHaveBeenCalledWith(2125);
    expect(vi.mocked(x.rt.fetch).mock.calls.map(c => c[0])).toEqual(['https://rpc.testnet.near.org', 'https://fallback.example.test']);
  });
  it('backs off RPC-level errors, bounds retries and survives network errors', async () => {
    const x = await setup(); x.rt.fetch = vi.fn<typeof fetch>().mockResolvedValue(json({ error: { code: 429 } }));
    await expect(new PublicClient(x.rt).rpc('query', {})).rejects.toThrow('backoff');
    expect(x.rt.fetch).toHaveBeenCalledTimes(4);
    expect(vi.mocked(x.rt.sleep).mock.calls.map(c => c[0])).toEqual([625, 1125, 2125]);
  });
});

describe('keychain-only signing and durable relay safety', () => {
  it('dry-run prints exact keychain commands with no CLI, exchange or signing journal', async () => {
    const x = await setup(true); x.state.last_keeper_heartbeat = '0'; x.state.reference_price_timestamp = '0';
    const c = await x.keeper.cycle();
    expect(c.decision).toBe('would-reduce-only-close'); expect(c.commands).toHaveLength(3);
    expect((c.policyState as { state: { reference_price_timestamp: string } }).state.reference_price_timestamp).toBe('0');
    expect(c.commands.every(s => s.includes(`sign-as ${KEEPER}`) && s.includes('sign-with-keychain send'))).toBe(true);
    expect(x.rt.exec).not.toHaveBeenCalled(); expect(await x.store.read(x.keeper.activeName)).toBeNull();
    expect(vi.mocked(x.rt.fetch).mock.calls.some(c => String(c[0]).endsWith('/exchange'))).toBe(false);
  });
  it('validates final receipts and public fills, then records a verified reduction', async () => {
    const x = await setup(); const c = await x.keeper.cycle();
    expect(c.errors).toEqual([]); expect(c.decision).toBe('reduction-verified'); expect(c.reductions).toBe(1);
    expect(c.hyperliquidTxHashes).toEqual([fillHash]); expect(await x.store.read(x.keeper.activeName)).toBeNull();
    expect(await x.store.read(`verified-${hash}.json`)).toMatchObject({ phase: 'verify' });
  });
  it('blocks new signatures after a near-cli timeout, including after restarting the keeper', async () => {
    const x = await setup(); x.failNear();
    const first = await x.keeper.cycle(); expect(first.errors).toHaveLength(1);
    expect(await x.store.read(x.keeper.activeName)).toMatchObject({ phase: 'near-uncertain' });
    const restarted = new Keeper(x.options, x.store, x.rt);
    const next = await restarted.cycle();
    expect(next.decision).toBe('blocked-uncertain-near-signature'); expect(x.rt.exec).toHaveBeenCalledTimes(1);
  });
  it('never resubmits an uncertain exchange request and reconciles later through public reads', async () => {
    const x = await setup(); x.failExchange(); x.hideFill();
    const first = await x.keeper.cycle(); expect(first.decision).toBe('blocked-uncertain-exchange');
    const restarted = new Keeper(x.options, x.store, x.rt);
    expect((await restarted.cycle()).decision).toBe('blocked-uncertain-exchange');
    x.showFill(); expect((await restarted.cycle()).reductions).toBe(1);
    expect(vi.mocked(x.rt.fetch).mock.calls.filter(c => String(c[0]).endsWith('/exchange'))).toHaveLength(1);
    expect(x.rt.exec).toHaveBeenCalledTimes(1);
  });
  it('retains an exclusive relay claim and refuses a duplicate submission after a crash', async () => {
    const x = await setup(); await x.store.claim(`relay-${hash}.json`, { outcome: 'crash-after-claim' });
    const c = await x.keeper.cycle();
    expect(c.decision).toBe('blocked-uncertain-exchange');
    expect(vi.mocked(x.rt.fetch).mock.calls.filter(c => String(c[0]).endsWith('/exchange'))).toHaveLength(0);
    expect(await x.store.read(`relay-${hash}.json`)).toEqual({ outcome: 'crash-after-claim' });
  });
  it('blocks expired callbacks and never sends them to the venue', async () => {
    const x = await setup(), original = x.rt.exec;
    x.rt.exec = vi.fn(async args => {
      const output = await original(args);
      if (args[4] === 'request_order_signature') x.setTime(start + 59000);
      return output;
    });
    const c = await x.keeper.cycle();
    expect(c.errors).toHaveLength(1);
    expect(vi.mocked(x.rt.fetch).mock.calls.filter(c => String(c[0]).endsWith('/exchange'))).toHaveLength(0);
    expect(await x.store.read(x.keeper.activeName)).toMatchObject({ phase: 'near-uncertain', txHash: hash });
  });
  it('waits for final MPC receipts and follows up with reads without reissuing the signature', async () => {
    const x = await setup(), original = x.rt.fetch;
    let delayed = true;
    x.rt.fetch = vi.fn<typeof fetch>(async (url, init) => {
      const body = JSON.parse(String(init?.body));
      if (body.method === 'tx' && delayed) return json({ result: { final_execution_status: 'EXECUTED_OPTIMISTIC' } });
      return original(url, init);
    });
    expect((await x.keeper.cycle()).errors).toHaveLength(1);
    delayed = false;
    const next = await x.keeper.cycle();
    expect(next.reductions).toBe(1); expect(x.rt.exec).toHaveBeenCalledTimes(1);
  });
  it('preserves price refresh and suppresses new orders when its stop signal is set', async () => {
    const x = await setup();
    const c = await new Keeper(x.options, x.store, x.rt, () => true).cycle();
    expect(c.decision).toBe('stopping'); expect(x.rt.exec).not.toHaveBeenCalled();
  });
  it('refuses to relay an unsent opening journal after restarting without --allow-open', async () => {
    const x = await setup();
    const o = await x.keeper.client.observe(address);
    const expected = planOrder(policy, x.state, o, riskSettings(x.state, null), start, false)!;
    expected.reduceOnly = false;
    await x.store.claim(x.keeper.activeName, { phase: 'near-uncertain', expected, address, codeHash: 'code-v3', before: o.clearinghouseState, createdAt: start, txHash: hash });
    const original = x.rt.exec;
    // Produce a valid opening receipt; no order is actually sent by the test keeper.
    const openArgs = { ...expected.args, order: { ...(expected.args.order as object), reduce_only: false } };
    expected.args = openArgs;
    await original(commandArgs(policy, 'request_order_signature', openArgs));
    await x.store.write(x.keeper.activeName, { phase: 'near-uncertain', expected, address, codeHash: 'code-v3', before: o.clearinghouseState, createdAt: start, txHash: hash });
    expected.price = '2.97';
    await x.store.write(x.keeper.activeName, { phase: 'near-uncertain', expected, address, codeHash: 'code-v3', before: o.clearinghouseState, createdAt: start, txHash: hash });
    const c = await x.keeper.cycle();
    expect(c.decision).toBe('blocked-opening-disabled');
    expect(vi.mocked(x.rt.fetch).mock.calls.some(c => String(c[0]).endsWith('/exchange'))).toBe(false);
  });
  it('parses a public tx hash from near-cli output but rejects missing/ambiguous hashes', () => {
    expect(extractHash(`Transaction ID: ${hash}`)).toBe(hash);
    expect(extractHash(`https://testnet.nearblocks.io/txns/${hash}`)).toBe(hash);
    expect(() => extractHash('CLI timeout')).toThrow('uncertain');
    expect(() => extractHash(`Transaction ID: ${hash}\nTransaction ID: ${base58.encode(new Uint8Array(32).fill(9))}`)).toThrow();
  });
});

describe('rolling reports, scheduler and shutdown', () => {
  it('computes summary counters, uptime, missing intervals and data errors', async () => {
    const x = await setup(true), c = await x.keeper.cycle();
    let s = addCycle(newSummary(start), c, 300000);
    const next = { ...c, timestamp: new Date(start + 900000).toISOString(), finishedAt: new Date(start + 910000).toISOString(), heartbeats: 2, reductions: 1, H: null, errors: ['one', 'two'] };
    s = addCycle(s, next, 300000);
    expect(s).toMatchObject({ cycles: 2, heartbeats: 2, reductions: 1, errors: 2, gaps: 2, maxGapMs: 900000, dataErrorCycles: 1 });
    expect(summaryMarkdown(s, x.options, 'test-run', true)).toContain('| Uptime seconds | 910 |');
  });
  it('writes one JSON line per cycle and final summary, without sending during dry runs', async () => {
    const x = await setup(true);
    const { summary } = await runKeeper({ ...x.options, cycles: 2 }, { store: x.store, rt: x.rt, runId: 'demo' });
    expect(summary.cycles).toBe(2);
    const lines = (await readFile(join(x.dir, 'demo.jsonl'), 'utf8')).trim().split('\n').map(s => JSON.parse(s));
    expect(lines).toHaveLength(2); expect(lines[0]).toMatchObject({ mark: 3, position: -4, equity: 13, H: 0.78 });
    expect(await readFile(join(x.dir, 'demo.md'), 'utf8')).toContain('Status: stopped');
    expect((await readdir(x.dir)).some(f => f.endsWith('.lock.json'))).toBe(false);
  });
  it('stops promptly when its signal fires during the wait and still finalizes the summary', async () => {
    const x = await setup(true), controller = new AbortController();
    x.rt.sleep = vi.fn(async ms => { x.setTime(start + ms); controller.abort(); });
    const { summary } = await runKeeper(x.options, { store: x.store, rt: x.rt, signal: controller.signal, runId: 'stopped' });
    expect(summary.cycles).toBe(1); expect(x.rt.sleep).toHaveBeenCalledTimes(1);
    expect(await readFile(join(x.dir, 'stopped.md'), 'utf8')).toContain('Status: stopped');
  });
  it('does not send when the hours deadline expires during public reads', async () => {
    const x = await setup(), original = x.rt.fetch;
    x.rt.fetch = vi.fn<typeof fetch>(async (url, init) => {
      const response = await original(url, init);
      if (String(url).endsWith('/info')) x.setTime(start + 10000);
      return response;
    });
    const result = await runKeeper({ ...x.options, hours: 0.001 }, { store: x.store, rt: x.rt, runId: 'deadline' });
    expect(result.summary.cycles).toBe(1); expect(x.rt.exec).not.toHaveBeenCalled();
  });
  it('prevents concurrent live keepers for the same policy', async () => {
    const x = await setup(); await x.store.claim(`${policy}.lock.json`, { pid: 1 });
    await expect(runKeeper(x.options, { store: x.store, rt: x.rt, runId: 'other' })).rejects.toMatchObject({ code: 'EEXIST' });
    expect(x.rt.exec).not.toHaveBeenCalled();
  });
});
