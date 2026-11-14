import { readFileSync } from 'node:fs';
import { base58 } from '@scure/base';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountForNetwork, apiForNetwork, chainSignatureView, getSigningDigest, MAINNET_RPC, type SigningInput } from '../packages/hyperliquid/src/index.js';
import { commandArgs, PublicClient, type Runtime } from '../apps/keeper/src/run-io.js';
import { parseRunOptions } from '../apps/keeper/src/run.js';
import { mainnetCall, mainnetInitialization, mainnetLifecycle, mainnetOptions, MAINNET_MARGIN_LIMITS, assertMainnetRelayFresh, assertMainnetUserUnsubmitted, assertSingleLabelChild,
  mainnetTransferAmount, assertMainnetClock, checkMainnetClock, ledgerStartTime, pollMainnetProof, mainnetInfo, mainnetSigningGasTgas } from './mainnet-lifecycle.js';
import { parseLifecycleReceipt, parseWithdrawal, parseMainnetWithdrawal, WITHDRAWAL_WINDOW_MS, type ExpectedCall } from './lifecycle-parsing.js';
import { BASE, parseMarket } from './lifecycle-config.js';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const recipient = `0x${'12'.repeat(20)}`;
const flags = ['--network=mainnet', '--i-understand-real-funds'];
describe('mainnet commands-only operator boundary', () => {
  it('refuses mainnet execution without acknowledgement before any fetch', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(mainnetLifecycle(['--network=mainnet', '--step=plan'])).rejects.toThrow('i-understand-real-funds');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('requires the real-funds flag before public reads and rejects duplicates/unknown flags', () => {
    expect(() => mainnetOptions(['--network=mainnet', '--step=plan'])).toThrow('i-understand-real-funds');
    expect(() => mainnetOptions([...flags, '--i-understand-real-funds', '--step=plan'])).toThrow();
    expect(() => mainnetOptions([...flags, '--step=plan', '--max-notional=99'])).toThrow();
    expect(mainnetOptions([...flags, '--step=plan']).step).toBe('plan');
  });
  it('initializes v4 mainnet identities and caps once with discovered metadata', () => {
    const market = parseMarket([{ universe: [{ name: 'ETH', szDecimals: 3 }, { name: 'NEAR', szDecimals: 1 }] }, [{}, { markPx: '3.34', funding: '0' }]]);
    const init = mainnetInitialization('owner.near', 'keeper.owner.near', recipient, market);
    expect(init).toMatchObject({ network: 'Mainnet', signer_account: 'v1.signer', wnear_account: 'wrap.near', asset_index: 1, size_decimals: 1,
      limits: { per_order_notional_cap: '15000000', per_day_notional_cap: '30000000' } });
    expect(BigInt(init.limits.max_short_size) * BigInt(init.oracle.max_price)).toBeLessThanOrEqual(15_000_000n * BASE);
    expect(MAINNET_MARGIN_LIMITS.per_withdrawal_usdc).toBe('20000000');
    expect(() => mainnetInitialization('owner.testnet', 'keeper.near', recipient, market)).toThrow();
    expect(() => accountForNetwork('child.test.near', 'mainnet')).toThrow();
  });
  it('keeps the default keeper testnet and mainnet commands-only under explicit consent', () => {
    expect(parseRunOptions(['--dry']).network).toBeUndefined();
    expect(() => parseRunOptions(['--network=mainnet', '--policy=v4.owner.near', '--keeper=keeper.owner.near'])).toThrow('i-understand-real-funds');
    const options = parseRunOptions([...flags, '--policy=v4.owner.near', '--keeper=keeper.owner.near', '--allow-open']);
    expect(options).toMatchObject({ network: 'mainnet', dry: true, keeper: 'keeper.owner.near' });
    expect(commandArgs(options.policy, 'heartbeat', {}, options.network, options.keeper)).toEqual(expect.arrayContaining(['keeper.owner.near', 'mainnet']));
    expect(mainnetCall(options.policy, 'heartbeat', {}, options.keeper!)).toContain('network-config mainnet sign-with-keychain send');
  });
  it('routes public mainnet reads to the env-driven RPC and mainnet venue only', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify({ result: { ok: true } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ universe: [] })));
    const rt = { fetch: fetcher, now: Date.now, sleep: vi.fn(), random: () => 0, print: vi.fn(), exec: vi.fn() } as Runtime;
    const client = new PublicClient(rt, undefined, 'mainnet');
    expect(await client.rpc('block', {})).toEqual({ ok: true });
    await client.info({ type: 'meta' });
    expect(fetcher.mock.calls.map(c => c[0])).toEqual([MAINNET_RPC, 'https://api.hyperliquid.xyz/info']);
    expect(rt.exec).not.toHaveBeenCalled();
    expect(apiForNetwork('testnet')).toBe('https://api.hyperliquid-testnet.xyz');
  });
  it('queries the mainnet signer account rather than a testnet root', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ result: { result: [...Buffer.from(JSON.stringify('public-view-value'))], block_height: 1, block_hash: 'block' } })));
    vi.stubGlobal('fetch', fetcher);
    await chainSignatureView('mainnet', 'public_key', { domain_id: 0 });
    expect(fetcher.mock.calls[0]![0]).toBe(MAINNET_RPC);
    expect(JSON.parse(String(fetcher.mock.calls[0]![1]!.body)).params.account_id).toBe('v1.signer');
  });
});

describe('mainnet receipt domains', () => {
  it('verifies a withdrawal relayed after day one within the mainnet user nonce window', () => {
    const nonce = 1_794_314_000_000;
    const response = { status: 'ok', response: { type: 'default' } };
    const ledger = [{ time: nonce + 30 * 3600000, hash: `0x${'ab'.repeat(32)}`, delta: { type: 'withdraw', usdc: '17', fee: '1', nonce: nonce * 1000 } }];
    expect(() => parseWithdrawal(response, ledger, '18', nonce)).toThrow('not yet verified');
    expect(parseWithdrawal(response, ledger, '18', nonce, 3 * WITHDRAWAL_WINDOW_MS)).toEqual(ledger[0]);
  });
  const signature = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
  for (const method of ['request_order_signature', 'request_usd_class_transfer', 'request_evm_withdrawal'] as const) it(`validates ${method} with mainnet separation and rejects testnet reuse`, () => {
    const nonce = 1_794_314_000_000, hash = base58.encode(new Uint8Array(32).fill(7));
    const expected: ExpectedCall = { method, caller: 'owner.near', policy: 'v4.owner.near', asset: 7, reduceOnly: false, size: '3.4', price: '3.34', recipient, amount: '18',
      args: method === 'request_order_signature' ? { order: { asset_index: 7, size: String(34n * BASE / 10n), reduce_only: false, reference_price: null } }
        : method === 'request_usd_class_transfer' ? { amount: '18000000', to_perp: true } : { recipient, amount: '18000000' } };
    const input: SigningInput = method === 'request_order_signature' ? { scheme: 'l1', network: 'mainnet', nonce, expiresAfter: nonce + 60000,
      action: { type: 'order', grouping: 'na', orders: [{ a: 7, b: false, p: '3.34', s: '3.4', r: false, t: { limit: { tif: 'Ioc' } } }] } }
      : { scheme: 'user', network: 'mainnet', action: method === 'request_usd_class_transfer' ? { type: 'usdClassTransfer', amount: '18', toPerp: true, nonce }
        : { type: 'withdraw3', destination: recipient, amount: '18', time: nonce } };
    const payload = input.scheme === 'l1' ? { action: input.action, nonce, expiresAfter: nonce + 60000 }
      : { action: { ...input.action, hyperliquidChain: 'Mainnet', signatureChainId: '0x66eee' }, nonce };
    const events = [{ event: 'request', data: [{ id: '1', caller: expected.caller, kind: method === 'request_order_signature' ? 'Increase' : method === 'request_usd_class_transfer' ? 'UsdClassTransfer' : 'EvmWithdrawal', payload, digest: getSigningDigest(input).slice(2) }] },
      { event: 'signature', data: [{ id: '1', nonce: String(nonce), expiresAfter: input.scheme === 'l1' ? String(nonce + 60000) : null, signature }] }];
    const raw = { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' }, transaction: { hash, signer_id: expected.caller, receiver_id: expected.policy,
      actions: [{ FunctionCall: { method_name: method, deposit: '0', args: Buffer.from(JSON.stringify(expected.args)).toString('base64') } }] },
      receipts_outcome: events.map((e, i) => ({ id: `r${i}`, block_hash: `b${i}`, outcome: { executor_id: expected.policy, status: { SuccessValue: 'dHJ1ZQ==' },
        logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', version: '1.0.0', ...e })}`] } })) };
    expect(parseLifecycleReceipt(raw, hash, expected, 'mainnet').input.network).toBe('mainnet');
    expect(() => parseLifecycleReceipt(raw, hash, expected)).toThrow();
  });
});


describe('mainnet relay recovery boundaries', () => {
  const now = 1_794_314_000_000;
  it('allows delayed user relay within the venue nonce window but retains order expiry checks', () => {
    const nonce = now - 120000;
    const action = { type: 'usdClassTransfer' as const, amount: '20', toPerp: true, nonce };
    expect(() => assertMainnetRelayFresh({ scheme: 'user', network: 'mainnet', action }, nonce, now)).not.toThrow();
    expect(() => assertMainnetRelayFresh({ scheme: 'user', network: 'mainnet', action }, now - 172800000, now)).toThrow('too old');
    expect(() => assertMainnetRelayFresh({ scheme: 'l1', network: 'mainnet', action: { type: 'noop' }, nonce, expiresAfter: now + 60000 }, nonce, now)).not.toThrow();
    expect(() => assertMainnetRelayFresh({ scheme: 'l1', network: 'mainnet', action: { type: 'noop' }, nonce, expiresAfter: now + 1000 }, nonce, now)).toThrow('too old');
  });
  it('refuses ambiguous public history before delayed user submission', () => {
    expect(() => assertMainnetUserUnsubmitted([], 'request_usd_class_transfer', now)).not.toThrow();
    expect(() => assertMainnetUserUnsubmitted([{ time: now + 1, delta: { type: 'accountClassTransfer' } }], 'request_usd_class_transfer', now)).toThrow('already');
    expect(() => assertMainnetUserUnsubmitted([{ time: now + 1, delta: { type: 'withdraw' } }], 'request_evm_withdrawal', now)).toThrow('already');
  });
  it('rejects nested child names before creation', () => {
    expect(() => assertSingleLabelChild('policy-v4.haxheton.near', 'haxheton.near')).not.toThrow();
    expect(() => assertSingleLabelChild('policy.v4.haxheton.near', 'haxheton.near')).toThrow('single-label');
    expect(() => assertSingleLabelChild('other.near', 'haxheton.near')).toThrow('single-label');
  });
});

describe('remaining mainnet lifecycle regressions', () => {
  const now = 1_794_314_000_000;
  it('funds the actual available Spot amount and skips already-funded Perps', () => {
    expect(mainnetTransferAmount(0, 19_100_000n)).toBe(19_100_000n);
    expect(mainnetTransferAmount(2, 21_000_000n)).toBe(18_000_000n);
    expect(mainnetTransferAmount(14.9, 100_000n)).toBe(100_000n);
    expect(mainnetTransferAmount(19.1, 0n)).toBe(0n);
    expect(mainnetTransferAmount(21, 0n)).toBe(0n);
    expect(() => mainnetTransferAmount(0, 14_000_000n)).toThrow('at least 15');
  });
  it('uses the exact frozen signing-resource threshold', () => {
    expect(mainnetSigningGasTgas({ signingResources: { signer_gas_tgas: 230, callback_gas_tgas: 30 } as never })).toBe(285);
  });
  it('rejects a Mac over 1s ahead and accepts 2s behind both public clocks', () => {
    expect(() => assertMainnetClock(now + 1001, now, now)).toThrow('more than 1 s ahead');
    expect(() => assertMainnetClock(now + 1000, now, now)).not.toThrow();
    expect(() => assertMainnetClock(now - 2000, now, now + 100)).not.toThrow();
  });
  it('checks optimistic NEAR and venue timestamps using request start time', async () => {
    const rt = { now: () => now - 2000, sleep: vi.fn() };
    const rpc = vi.fn().mockResolvedValue({ header: { timestamp_nanosec: String(BigInt(now) * 1_000_000n) } });
    const info = vi.fn().mockResolvedValue({ time: now });
    expect(await checkMainnetClock({ rt, rpc, info } as unknown as PublicClient)).toBe(now - 2000);
    expect(rpc).toHaveBeenCalledWith('block', { finality: 'optimistic' });
  });
  it('polls through four minutes of withdrawal ledger lag without resubmission', async () => {
    let clock = now, reads = 0;
    const entry = { time: now - 1000, hash: `0x${'ab'.repeat(32)}`, delta: { type: 'withdraw', usdc: '17', fee: '1', nonce: now * 1000 } };
    const result = await pollMainnetProof(async () => {
      reads++;
      return parseMainnetWithdrawal(undefined, clock - now < 240_000 ? [] : [entry], '18', now);
    }, { now: () => clock, sleep: async ms => { clock += ms; } });
    expect(result).toEqual(entry);
    expect(reads).toBe(25);
    expect(ledgerStartTime(now)).toBe(now - 5000);
  });
  it('keeps an unverified withdrawal recoverable after polling times out', async () => {
    let clock = now;
    await expect(pollMainnetProof(async () => parseMainnetWithdrawal(undefined, [], '18', now), {
      now: () => clock, timeoutMs: 600_000, sleep: async ms => { clock += ms; },
    })).rejects.toThrow('not yet verified');
    expect(clock).toBe(now + 600_000);
  });
  it('requires exact nonce when response is lost and accepts the 5s ledger skew buffer', () => {
    const entry = { time: now - 5000, hash: `0x${'ab'.repeat(32)}`, delta: { type: 'withdraw', usdc: '17', fee: '1', nonce: now * 1000 } };
    expect(parseMainnetWithdrawal(undefined, [entry], '18', now)).toEqual(entry);
    expect(() => parseMainnetWithdrawal(undefined, [{ ...entry, delta: { type: 'withdraw', usdc: '17', fee: '1' } }], '18', now)).toThrow();
    expect(() => parseMainnetWithdrawal(undefined, [{ ...entry, time: now - 5001 }], '18', now)).toThrow();
    expect(() => assertMainnetUserUnsubmitted([{ time: now - 1000, delta: { type: 'accountClassTransfer' } }], 'request_usd_class_transfer', now)).toThrow('already');
  });
  it('retries only public /info reads with backoff', async () => {
    const info = vi.fn().mockRejectedValueOnce(new Error('HTTP 429')).mockRejectedValueOnce(new Error('HTTP 503')).mockResolvedValue([]);
    const sleep = vi.fn().mockResolvedValue(undefined);
    expect(await mainnetInfo({ info, rt: { sleep } } as unknown as PublicClient, { type: 'userFills' })).toEqual([]);
    expect(info).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[500], [1000]]);
  });
});

describe('Noop invalidation receipts', () => {
  it('verifies original old user nonce with fresh expiry from either pause or next-invalidation', () => {
    const signature = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
    const nonce = 1_794_314_000_000, expiry = nonce + 3_600_000, hash = base58.encode(new Uint8Array(32).fill(9));
    const input: SigningInput = { scheme: 'l1', network: 'mainnet', action: { type: 'noop' }, nonce, expiresAfter: expiry };
    for (const method of ['set_paused', 'request_next_invalidation'] as const) {
      const expected: ExpectedCall = { method, caller: 'owner.near', policy: 'v4.owner.near', asset: 7, reduceOnly: false, size: '0', price: '0', recipient, amount: '0', args: method === 'set_paused' ? { paused: true } : {} };
      const events = [{ event: 'request', data: [{ id: '1', caller: expected.caller, kind: 'Invalidation', payload: { action: { type: 'noop' }, nonce, expiresAfter: expiry }, digest: getSigningDigest(input).slice(2) }] },
        { event: 'signature', data: [{ id: '1', nonce: String(nonce), expiresAfter: String(expiry), signature }] }];
      const raw = { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' }, transaction: { hash, signer_id: expected.caller, receiver_id: expected.policy,
        actions: [{ FunctionCall: { method_name: method, deposit: '0', args: Buffer.from(JSON.stringify(expected.args)).toString('base64') } }] },
        receipts_outcome: events.map((e, i) => ({ id: `r${i}`, block_hash: `b${i}`, outcome: { executor_id: expected.policy, status: { SuccessValue: 'dHJ1ZQ==' },
          logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', version: '1.0.0', ...e })}`] } })) };
      expect(parseLifecycleReceipt(raw, hash, expected, 'mainnet').input).toEqual(input);
      raw.receipts_outcome[0]!.outcome.logs[0] = raw.receipts_outcome[0]!.outcome.logs[0]!.replace('Invalidation', 'Increase');
      expect(() => parseLifecycleReceipt(raw, hash, expected, 'mainnet')).toThrow();
    }
  });
});
