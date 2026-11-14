import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { base58 } from '@scure/base';
import { getSigningDigest } from '../packages/hyperliquid/src/index.js';
import { PublicClient } from '../apps/keeper/src/run-io.js';
import { stateSchema } from '../apps/keeper/src/run-state.js';
import { SIGNER_RELEASE } from './mainnet-signer.js';
import { BASE, units } from './lifecycle-config.js';
import { mainnetInitialization, mainnetLifecycle, MAINNET_MARGIN_LIMITS, loadMainnetPlan, readConsumedClassTransfers } from './mainnet-lifecycle.js';

const memory = vi.hoisted(() => ({ clock: 1_800_000_000_000, files: new Map<string, string>(), artifact: { sha256: 'ab'.repeat(32), codeHash: 'public-code-hash', bytes: 344776 } }));
vi.mock('node:fs/promises', async original => ({ ...await original<typeof import('node:fs/promises')>(), mkdir: vi.fn(),
  readdir: vi.fn(async () => [...memory.files.keys()].filter(file => file.startsWith('docs/evidence/')).map(file => file.slice('docs/evidence/'.length))),
  readFile: vi.fn(async (file: string) => { const value = memory.files.get(file); if (value === undefined) throw Object.assign(new Error('Missing mocked file'), { code: 'ENOENT' }); return value; }),
  writeFile: vi.fn(async (file: string, body: string, options?: { flag?: string }) => {
    if (options?.flag === 'wx' && memory.files.has(file)) throw new Error('EEXIST'); memory.files.set(file, body);
  }),
}));
vi.mock('../packages/hyperliquid/src/index.js', async original => ({ ...await original<typeof import('../packages/hyperliquid/src/index.js')>(), deriveAddress: vi.fn(async () => ({ address: `0x${'ab'.repeat(20)}` })), recoveredSigner: vi.fn(async () => `0x${'ab'.repeat(20)}`) }));
vi.mock('../apps/keeper/src/run-io.js', async original => {
  const module = await original<typeof import('../apps/keeper/src/run-io.js')>();
  return { ...module, runtime: () => ({ ...module.runtime(), sleep: async (ms: number) => { memory.clock += ms; } }) };
});
vi.mock('./testnet-common.js', async original => ({ ...await original<typeof import('./testnet-common.js')>(), committedWasm: vi.fn(async () => memory.artifact) }));

const now = 1_800_000_000_000, address = `0x${'ab'.repeat(20)}`, recipient = `0x${'12'.repeat(20)}`;
const owner = 'owner.near', keeper = 'keeper.owner.near', policy = 'policy-v4.owner.near', planFile = '/private/tmp/mainnet-mock-plan.json';
const flags = ['--network=mainnet', '--i-understand-real-funds', `--plan=${planFile}`];
function setup({ paused = false, size = '0', keyless = true, mark = '3.34', signerGas = 15, signerCode = SIGNER_RELEASE.codeHash } = {}) {
  // NEAR deliberately lives at index2 here, exercising meta discovery in the real branch.
  const market = { assetIndex: 2, szDecimals: 1, mark: '3.34' };
  const init = mainnetInitialization(owner, keeper, recipient, market);
  const signingResources = { fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, minimumGasTgas: 15, codeHash: SIGNER_RELEASE.codeHash, version: SIGNER_RELEASE.version, block: 'final-block', config: { sign_call_gas_attachment_requirement_tera_gas: 15 }, depositSource: 'verified-release-bytecode' };
  const rawState = { ...init, mpc_fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, outstanding: [], coin: 'NEAR', near_recipient: owner, paused, pending: null,
    oracle_price: '0', oracle_timestamp: '0', reference_price_timestamp: String(now / 1000),
    last_keeper_heartbeat: String(now / 1000), spot_balance: String(37n * BASE / 10n),
    signed_short_size: units(size === '0' ? '0' : size.slice(1), 24).toString(), daily_usage: '0', last_nonce: '0', last_open_expiry: '0' };
  const margin = { limits: MAINNET_MARGIN_LIMITS, observed_at_ms: '0', usable_margin: '20000000', withdrawable: '20000000', withdrawal: null, withdrawals: [] };
  memory.files.set(planFile, JSON.stringify({ network: 'mainnet', policy, owner, keeper, market, init, derived: { address }, artifact: memory.artifact, signingResources, marginLimits: MAINNET_MARGIN_LIMITS }));
  vi.spyOn(PublicClient.prototype, 'policy').mockImplementation(async () => ({ state: stateSchema.parse(rawState), block: 'final-block', codeHash: memory.artifact.codeHash, keyless, rebalance: null }));
  vi.spyOn(PublicClient.prototype, 'derive').mockResolvedValue(address);
  vi.spyOn(PublicClient.prototype, 'view').mockImplementation(async (_account, method) => ({ block: 'final-block',
    value: method === 'config' ? { sign_call_gas_attachment_requirement_tera_gas: signerGas } : method === 'version' ? SIGNER_RELEASE.version : method === 'get_state' ? rawState : method === 'get_margin' ? margin : method === 'ft_balance_of' ? rawState.spot_balance : null }));
  const rpc = vi.spyOn(PublicClient.prototype, 'rpc').mockImplementation(async method => method === 'block'
    ? { header: { timestamp_nanosec: String(BigInt(memory.clock) * 1_000_000n) } } : { block_hash: 'final-block', code_hash: signerCode });
  const account = { marginSummary: { accountValue: '20', totalMarginUsed: size === '0' ? '0' : '1' }, withdrawable: '20',
    assetPositions: size === '0' ? [] : [{ position: { coin: 'NEAR', szi: size, positionValue: '11.69', marginUsed: '1', cumFunding: { allTime: '0', sinceOpen: '0', sinceChange: '0' } } }] };
  const info = vi.spyOn(PublicClient.prototype, 'info').mockImplementation(async body => {
    if (body.type === 'metaAndAssetCtxs') return [{ universe: [{ name: 'ETH', szDecimals: 3 }, { name: 'BTC', szDecimals: 5 }, { name: 'NEAR', szDecimals: 1 }] }, [{}, {}, { markPx: mark, funding: '0.0001' }]];
    if (body.type === 'clearinghouseState') return account;
    if (body.type === 'spotClearinghouseState') return { balances: [] };
    if (body.type === 'openOrders') return [];
    if (body.type === 'l2Book') return { time: memory.clock };
    throw new Error('Unexpected mainnet public read');
  });
  const print = vi.spyOn(console, 'log').mockImplementation(() => {});
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  return { rawState, info, print, fetcher, rpc, account, margin };
}
function request() {
  const rows = [...memory.files].filter(([file]) => file.endsWith('.request.json'));
  expect(rows).toHaveLength(1);
  return JSON.parse(rows[0]![1]) as { expected: { args: { order?: { asset_index: number; reduce_only: boolean; observed_at?: string; size: string }; amount?: string }; size: string; price: string; caller: string; amount: string } };
}
beforeEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); memory.clock = now; memory.files.clear(); vi.spyOn(Date, 'now').mockImplementation(() => memory.clock); });

describe('mainnet lifecycle real command branches with mocked public reads', () => {
  it('prints fresh owner margin immediately before keeper open, discovered lot size and $10–$15 notional', async () => {
    const x = setup();
    await mainnetLifecycle([...flags, '--step=open-prepare']);
    await mainnetLifecycle([...flags, '--step=open']);
    const lines = x.print.mock.calls.map(row => String(row[0])), near = lines.filter(line => line.startsWith('near '));
    expect(near.map(line => /as-transaction \S+ (\w+) /.exec(line)![1])).toEqual(['heartbeat', 'set_keeper_price', 'observe_margin', 'request_order_signature']);
    expect(near[2]).toContain(`sign-as ${owner} network-config mainnet`);
    expect(near[3]).toContain(`sign-as ${keeper} network-config mainnet`);
    const r = request();
    expect(r.expected.args.order).toMatchObject({ asset_index: 2, reduce_only: false });
    expect(units(r.expected.size, 24) % (BASE / 10n)).toBe(0n);
    const notional = Number(r.expected.size) * Number(r.expected.price);
    expect(notional).toBeGreaterThanOrEqual(10); expect(notional).toBeLessThanOrEqual(15);
    expect(x.fetcher).not.toHaveBeenCalled();
    expect(lines.at(-1)).toContain('--step=relay');
  });
  it('prints an actual-position reduce-only close while paused without an owner margin attestation', async () => {
    const x = setup({ paused: true, size: '-3.5' });
    await mainnetLifecycle([...flags, '--step=close']);
    const r = request();
    expect(r.expected.args.order).toMatchObject({ asset_index: 2, reduce_only: true, size: String(35n * BASE / 10n), observed_at: String(now / 1000) });
    expect(r.expected.size).toBe('3.5');
    expect(x.print.mock.calls.map(row => String(row[0])).join('\n')).not.toContain(' observe_margin ');
    expect(x.fetcher).not.toHaveBeenCalled();
  });
  it('prints a fixed-recipient withdrawal with $1.10 residual and owner observation first', async () => {
    const x = setup({ paused: true });
    await mainnetLifecycle([...flags, '--step=withdraw-prepare']);
    await mainnetLifecycle([...flags, '--step=withdraw']);
    const r = request(), lines = x.print.mock.calls.map(row => String(row[0]));
    expect(r.expected).toMatchObject({ amount: '18.9', caller: owner, args: { recipient, amount: '18900000' } });
    const near = lines.filter(line => line.startsWith('near '));
    expect(near.map(line => /as-transaction \S+ (\w+) /.exec(line)![1])).toEqual(['set_reference_price', 'observe_margin', 'request_evm_withdrawal']);
    expect(x.fetcher).not.toHaveBeenCalled();
  });
  it('refuses signing while any policy access key remains before reading venue data or writing a request', async () => {
    const x = setup({ keyless: false });
    await expect(mainnetLifecycle([...flags, '--step=open'])).rejects.toThrow('code/access-key');
    expect(x.info).not.toHaveBeenCalled(); expect(x.print).not.toHaveBeenCalled();
    expect([...memory.files.keys()].some(file => file.endsWith('.request.json'))).toBe(false);
  });
  it('fails closed when the discovered NEAR market moves to a different asset index', async () => {
    const x = setup();
    x.info.mockImplementation(async body => body.type === 'metaAndAssetCtxs'
      ? [{ universe: [{ name: 'NEAR', szDecimals: 1 }] }, [{ markPx: '3.34', funding: '0' }]]
      : body.type === 'clearinghouseState' ? { marginSummary: { accountValue: '20', totalMarginUsed: '0' }, withdrawable: '20', assetPositions: [] }
        : body.type === 'openOrders' ? [] : body.type === 'l2Book' ? { time: now } : { balances: [] });
    await expect(mainnetLifecycle([...flags, '--step=open'])).rejects.toThrow('metadata changed');
    expect([...memory.files.keys()].some(file => file.endsWith('.request.json'))).toBe(false);
  });
  it('allows the complete open planning path with host 2s behind network time', async () => {
    const x = setup();
    memory.clock = now - 2000;
    const info = x.info.getMockImplementation()!;
    x.info.mockImplementation(async body => body.type === 'l2Book' ? { time: now } : info(body));
    x.rpc.mockImplementation(async method => method === 'block' ? { header: { timestamp_nanosec: String(BigInt(now) * 1_000_000n) } } : { block_hash: 'final-block', code_hash: SIGNER_RELEASE.codeHash });
    await mainnetLifecycle([...flags, '--step=open-prepare']);
    await mainnetLifecycle([...flags, '--step=open']);
    const near = x.print.mock.calls.map(row => String(row[0])).filter(line => line.startsWith('near '));
    expect(near).toHaveLength(4);
    expect(near[1]).toContain(`"observed_at":"${now / 1000 - 2}"`);
  });
  it('stops an ahead host before any open preparation command', async () => {
    const x = setup();
    const info = x.info.getMockImplementation()!;
    x.info.mockImplementation(async body => body.type === 'l2Book' ? { time: now - 1001 } : info(body));
    x.rpc.mockImplementation(async method => method === 'block' ? { header: { timestamp_nanosec: String(BigInt(now - 1001) * 1_000_000n) } } : { block_hash: 'final-block', code_hash: SIGNER_RELEASE.codeHash });
    await expect(mainnetLifecycle([...flags, '--step=open-prepare'])).rejects.toThrow('more than 1 s ahead');
    expect(x.print).not.toHaveBeenCalled();
  });
  it('settles an unpaused policy without issuing a pause or invalidating its consumed class transfer', async () => {
    const x = setup();
    await mainnetLifecycle([...flags, '--step=settle-prepare']);
    await mainnetLifecycle([...flags, '--step=settle']);
    const commands = x.print.mock.calls.map(row => String(row[0])).filter(line => line.startsWith('near '));
    expect(commands).toHaveLength(1);
    expect(commands[0]).toContain(' settle_position ');
    expect(commands[0]).not.toContain(' set_paused ');
  });
});

describe('withdrawal status uses the real read-only poll path', () => {
  for (const lostResponse of [false, true]) it(`waits through four minutes of ledger lag, response lost=${lostResponse}`, async () => {
    const x = setup(), hash = base58.encode(new Uint8Array(32).fill(7)), file = 'docs/evidence/mainnet-v4-withdraw-mock.request.json';
    const expected = { method: 'request_evm_withdrawal', caller: owner, policy, asset: 2, reduceOnly: false, size: '0', price: '0', recipient, amount: '18.9', args: { recipient, amount: '18900000' } };
    const input = { scheme: 'user' as const, network: 'mainnet' as const, action: { type: 'withdraw3' as const, destination: recipient, amount: '18.9', time: now } };
    const signature = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
    const payload = { action: { ...input.action, hyperliquidChain: 'Mainnet', signatureChainId: '0x66eee' }, nonce: now };
    const events = [{ event: 'request', data: [{ id: '1', caller: owner, kind: 'EvmWithdrawal', payload, digest: getSigningDigest(input).slice(2) }] },
      { event: 'signature', data: [{ id: '1', nonce: String(now), expiresAfter: null, signature }] }];
    const tx = { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' }, transaction: { hash, signer_id: owner, receiver_id: policy,
      actions: [{ FunctionCall: { method_name: expected.method, deposit: '0', args: Buffer.from(JSON.stringify(expected.args)).toString('base64') } }] },
      receipts_outcome: events.map((e, i) => ({ id: `r${i}`, block_hash: `b${i}`, outcome: { executor_id: policy, status: { SuccessValue: 'dHJ1ZQ==' },
        logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', version: '1.0.0', ...e })}`] } })) };
    const rpc = x.rpc.getMockImplementation()!;
    x.rpc.mockImplementation(async (method, params) => method === 'tx' ? tx : rpc(method, params));
    memory.files.set(file, JSON.stringify({ network: 'mainnet', plan: planFile, createdAt: now, address, codeHash: memory.artifact.codeHash,
      before: { clearing: x.account, spot: { balances: [] } }, expected }));
    if (!lostResponse) memory.files.set(`${file}.response.json`, JSON.stringify({ status: 'ok', response: { type: 'default' } }));
    const info = x.info.getMockImplementation()!;
    x.info.mockImplementation(async body => body.type === 'userNonFundingLedgerUpdates'
      ? memory.clock - now < 240_000 ? [] : [{ time: now - 1000, hash: `0x${'ef'.repeat(32)}`, delta: { type: 'withdraw', usdc: '17.9', fee: '1', nonce: now * 1000 } }]
      : info(body));
    await mainnetLifecycle([...flags, '--step=status', `--request=${file}`, `--relay-tx=${hash}`]);
    expect(memory.clock - now).toBe(240_000);
    const ledgerReads = x.info.mock.calls.filter(([body]) => body.type === 'userNonFundingLedgerUpdates');
    expect(ledgerReads).toHaveLength(25);
    expect(ledgerReads[0]![0]).toMatchObject({ startTime: now - 5000 });
    expect(x.print.mock.calls.some(row => String(row[0]).startsWith('near ') || String(row[0]).startsWith('curl '))).toBe(false);
    expect(x.fetcher).not.toHaveBeenCalled();
  });
});

describe('consumed class transfer proof survives later trading', () => {
  it('revalidates the exact typed nonce, saved balance deltas and unique public ledger after equity changes', async () => {
    const x = setup(), hash = base58.encode(new Uint8Array(32).fill(7)), file = 'docs/evidence/mainnet-v4-to-perp-mock.request.json';
    x.account.marginSummary.accountValue = '19.1'; x.account.withdrawable = '19.1';
    const before = { ...x.account, marginSummary: { accountValue: '0', totalMarginUsed: '0' }, withdrawable: '0' };
    const expected = { method: 'request_usd_class_transfer', caller: owner, policy, asset: 2, reduceOnly: false, size: '0', price: '0', recipient, amount: '19.1', args: { amount: '19100000', to_perp: true } };
    const input = { scheme: 'user' as const, network: 'mainnet' as const, action: { type: 'usdClassTransfer' as const, amount: '19.1', toPerp: true, nonce: now } };
    const signature = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
    const payload = { action: { ...input.action, hyperliquidChain: 'Mainnet', signatureChainId: '0x66eee' }, nonce: now };
    const events = [{ event: 'request', data: [{ id: '1', caller: owner, kind: 'UsdClassTransfer', payload, digest: getSigningDigest(input).slice(2) }] },
      { event: 'signature', data: [{ id: '1', nonce: String(now), expiresAfter: null, signature }] }];
    const tx = { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' }, transaction: { hash, signer_id: owner, receiver_id: policy,
      actions: [{ FunctionCall: { method_name: expected.method, deposit: '0', args: Buffer.from(JSON.stringify(expected.args)).toString('base64') } }] },
      receipts_outcome: events.map((e, i) => ({ id: `r${i}`, block_hash: `b${i}`, outcome: { executor_id: policy, status: { SuccessValue: 'dHJ1ZQ==' },
        logs: [`EVENT_JSON:${JSON.stringify({ standard: 'counterweight', version: '1.0.0', ...e })}`] } })) };
    const rpc = x.rpc.getMockImplementation()!;
    x.rpc.mockImplementation(async (method, params) => method === 'tx' ? tx : rpc(method, params));
    memory.files.set(file, JSON.stringify({ network: 'mainnet', plan: planFile, createdAt: now, address, codeHash: memory.artifact.codeHash,
      before: { clearing: before, spot: { balances: [{ coin: 'USDC', total: '19.1', hold: '0' }] } }, expected }));
    memory.files.set(`${file}.response.json`, JSON.stringify({ status: 'ok', response: { type: 'default' } }));
    const info = x.info.getMockImplementation()!;
    const ledger = [{ time: now - 1000, hash: `0x${'ef'.repeat(32)}`, delta: { type: 'accountClassTransfer', usdc: '19.1', toPerp: true } }];
    x.info.mockImplementation(async body => body.type === 'userNonFundingLedgerUpdates' ? ledger : info(body));
    await mainnetLifecycle([...flags, '--step=status', `--request=${file}`, `--relay-tx=${hash}`]);
    expect(memory.files.has(`${file}.verified.json`)).toBe(true);
    x.account.marginSummary.accountValue = '18.9';
    const plan = await loadMainnetPlan(planFile);
    const client = new PublicClient({ now: Date.now, sleep: vi.fn() } as never);
    expect(await readConsumedClassTransfers(client, planFile, plan)).toEqual(new Set([now]));
    ledger[0]!.delta.usdc = '19';
    await expect(readConsumedClassTransfers(client, planFile, plan)).rejects.toThrow('unique matching public ledger');
  });
});


describe('mainnet plan verifies finalized signer resources before writing any plan', () => {
  const planArgs = [...flags, '--step=plan', `--owner=${owner}`, `--keeper=${keeper}`, `--policy=${policy}`, `--owner-evm=${recipient}`];
  it('pins live signer bytecode/deposit and config and prints explicit resource configuration', async () => {
    const x = setup(); memory.files.delete(planFile);
    await mainnetLifecycle(planArgs);
    const saved = JSON.parse(memory.files.get(planFile)!);
    expect(saved.signingResources).toMatchObject({ fee: '1', minimumGasTgas: 15, signer_gas_tgas: 230, callback_gas_tgas: 30, codeHash: SIGNER_RELEASE.codeHash });
    expect(x.rpc).toHaveBeenCalledWith('query', { request_type: 'view_account', account_id: 'v1.signer', block_id: 'final-block' });
    expect(x.print.mock.calls.flat().join('\n')).toContain(' set_signing_resources ');
    expect(x.fetcher).not.toHaveBeenCalled();
  });
  it('fails if current signer gas exceeds the configured initializer resources', async () => {
    setup({ signerGas: 231 }); memory.files.delete(planFile);
    await expect(mainnetLifecycle(planArgs)).rejects.toThrow('incompatible');
    expect(memory.files.has(planFile)).toBe(false);
  });
  it('fails on unknown signer bytecode rather than guessing its fee', async () => {
    setup({ signerCode: 'unverified-bytecode' }); memory.files.delete(planFile);
    await expect(mainnetLifecycle(planArgs)).rejects.toThrow('unknown live');
    expect(memory.files.has(planFile)).toBe(false);
  });
});
