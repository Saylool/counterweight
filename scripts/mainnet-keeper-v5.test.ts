import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseV5Options } from '../apps/keeper/src/mainnet-v5.js';
import { Keeper, runKeeper, type Cycle } from '../apps/keeper/src/run.js';
import { DiskStore, commandArgs, type Runtime } from '../apps/keeper/src/run-io.js';
import { stateSchema } from '../apps/keeper/src/run-state.js';
import { parseAccount } from './lifecycle-parsing.js';
const dirs: string[] = [], now = 1_794_420_000_000, B = 10n ** 24n;
const c = (): Cycle => ({ timestamp: '', finishedAt: '', mark: null, funding: null, position: null, equity: null, H: null, thresholdUsd: null, decision: 'monitor', txHashes: [], hyperliquidResponses: {}, commands: [], heartbeats: 0, reductions: 0, opens: 0, errors: [], dry: false });
async function harness() {
  const dir = await mkdtemp(join(tmpdir(), 'cw-keeper-v5-')); dirs.push(dir);
  const store = new DiskStore(dir); let clock = now, chainTime = now, balance = 69n * B / 100n, protocolFloor = '1000000000';
  const rt: Runtime = { now: () => clock, random: () => .5, sleep: async () => {}, print: vi.fn(), exec: vi.fn(async () => ({ stdout: `Transaction ID: ${'8'.repeat(43)}`, stderr: '' })), fetch: vi.fn(async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    const result = body.method === 'query' ? { amount: balance.toString(), locked: '0', storage_usage: 200 }
      : body.method === 'gas_price' ? { gas_price: '100000000' }
      : body.method === 'EXPERIMENTAL_protocol_config' ? { runtime_config: { min_gas_purchase_price: protocolFloor } }
      : body.method === 'block' ? { header: { timestamp_nanosec: String(BigInt(chainTime) * 1_000_000n) } } : null;
    return new Response(JSON.stringify({ result }));
  }) as typeof fetch };
  const options = { ...parseV5Options(['--i-understand-real-funds']), expectedCodeHash: 'v5-hash' };
  const keeper = new Keeper(options, store, rt);
  const state = stateSchema.parse({ network: 'Mainnet', keeper: 'keeper4.haxheton.near', coin: 'NEAR', signer_account: 'v1.signer', derivation_path: 'counterweight-mainnet-v5', evm_recipient: `0x${'11'.repeat(20)}`, asset_index: 0, size_decimals: 1,
    limits: { max_short_size: String(5n * B), per_order_notional_cap: '15000000', per_day_notional_cap: '30000000', cooldown_seconds: 60, price_band_bps: 10, price_max_age_seconds: 60 },
    oracle: { account_id: null, min_price: '2000000', max_price: '4000000', max_age_seconds: 60 }, oracle_price: '0', oracle_timestamp: '0', reference_price: '3000000', reference_price_timestamp: String(now / 1000),
    last_keeper_heartbeat: String(now / 1000), heartbeat_timeout_seconds: 3600, paused: false, pending: null, spot_balance: String(5n * B), signed_short_size: String(4n * B), daily_usage: '0', last_nonce: '0', last_open_expiry: '0' });
  const clearing = { marginSummary: { accountValue: '1', totalMarginUsed: '1' }, withdrawable: '1', assetPositions: [{ position: { coin: 'NEAR', szi: '-4', positionValue: '12', marginUsed: '1', cumFunding: { allTime: '0', sinceOpen: '0', sinceChange: '0' } } }] };
  vi.spyOn(keeper.client, 'policy').mockResolvedValue({ state, block: 'block', codeHash: 'v5-hash', keyless: true, rebalance: null });
  vi.spyOn(keeper.client, 'derive').mockResolvedValue(`0x${'11'.repeat(20)}`);
  vi.spyOn(keeper.client, 'observe').mockResolvedValue({ observedAt: now, mark: 3, funding: .0001, assetIndex: 0, szDecimals: 1, fundingHistory: [], depth: { availableNotional: 1000, impactBps: 1 }, clearinghouseState: clearing, account: parseAccount(clearing), openOrders: [], responses: {} });
  vi.spyOn(keeper.client, 'view').mockResolvedValue({ block: 'block', value: { anchor_price: '3000000', mark_band_bps: 25, fallback_slippage_bps: 100, max_fallback_price: '3025000' } });
  return { keeper, rt, store, state, options, setTime: (n: number) => { clock = n; }, setChainTime: (n: number) => { chainTime = n; }, setBalance: (n: bigint) => { balance = n; }, setProtocolFloor: (n: string) => { protocolFloor = n; } };
}
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
describe('mainnet v5 autonomous safety', () => {
  it('requires explicit mainnet consent, fixes identities and never permits opens', () => {
    expect(() => parseV5Options([])).toThrow('real funds');
    expect(() => parseV5Options(['--i-understand-real-funds', '--allow-open'])).toThrow('opening');
    expect(parseV5Options(['--i-understand-real-funds'])).toMatchObject({ policy: 'cw5.haxheton.near', keeper: 'keeper4.haxheton.near', dry: false, allowOpen: false, intervalMs: 30000 });
    expect(parseV5Options(['--i-understand-real-funds', '--dry'])).toMatchObject({ dry: true });
  });
  it('uses small liveness gas and reserves enough for a 285 Tgas close at 0.69 NEAR', async () => {
    const x = await harness();
    await expect(x.keeper.assertMainnetBudget()).resolves.toBeGreaterThan(663500000000000000000000n);
    expect(commandArgs(x.options.policy, 'heartbeat', {}, 'mainnet', x.options.keeper, 5)).toContain('5 Tgas');
    expect(commandArgs(x.options.policy, 'refresh_oracle', {}, 'mainnet', x.options.keeper, 40)).toContain('40 Tgas');
    x.setBalance(36n * B / 100n);
    await expect(x.keeper.assertMainnetBudget()).rejects.toThrow('reserve');
    expect(x.rt.exec).not.toHaveBeenCalled();
  });
  it('honors the protocol gas purchase floor and the three-second optimistic clock guard', async () => {
    const x = await harness(); x.setProtocolFloor('2000000000');
    await expect(x.keeper.assertMainnetBudget()).rejects.toThrow('reserve');
    x.setProtocolFloor('1000000000'); x.setTime(now + 3001);
    await expect(x.keeper.assertMainnetBudget()).rejects.toThrow('clock');
  });
  it('blocks forged fallback marks and a stale configured oracle without sending', async () => {
    const x = await harness();
    expect(await x.keeper.v5ExitAllowed(x.state, 3.1, c())).toBe(false);
    expect(await x.keeper.v5ExitAllowed(x.state, 3, c())).toBe(true);
    x.state.oracle.account_id = 'pyth.near'; x.state.oracle_price = '3000000'; x.state.oracle_timestamp = String(now / 1000 - 61);
    expect(await x.keeper.v5ExitAllowed(x.state, 3, c())).toBe(false);
    expect(x.rt.exec).not.toHaveBeenCalled();
  });
  it('stops on uncertain control submission and never re-sends on the next cycle', async () => {
    const x = await harness(); vi.mocked(x.rt.exec).mockRejectedValue(new Error('timeout after possible broadcast'));
    await expect(x.keeper.command(c(), 'heartbeat', {})).rejects.toThrow('uncertain');
    const cycle = await x.keeper.cycle();
    expect(cycle.decision).toBe('blocked-uncertain-control'); expect(x.rt.exec).toHaveBeenCalledTimes(1);
    expect(await x.store.read(x.keeper.controlName)).toMatchObject({ outcome: 'submission-uncertain' });
  });
  it('stops the loop after its first low-balance cycle', async () => {
    const x = await harness(); x.setBalance(35n * B / 100n);
    const run = await runKeeper({ ...x.options, cycles: 3 }, { rt: x.rt, store: x.store, runId: 'low-balance' });
    expect(run.summary.cycles).toBe(1); expect(x.rt.exec).not.toHaveBeenCalled();
  });
  it('heartbeats at ten minutes and refreshes a configured oracle before a reduction', async () => {
    const x = await harness();
    const command = vi.spyOn(x.keeper, 'command').mockImplementation(async (cycle, method) => { if (method === 'heartbeat') cycle.heartbeats++; });
    x.setTime(now + 599_000); x.setChainTime(now + 599_000);
    await x.keeper.cycle(); expect(command).not.toHaveBeenCalled();
    x.setTime(now + 600_000); x.setChainTime(now + 600_000);
    await x.keeper.cycle(); expect(command).toHaveBeenCalledWith(expect.anything(), 'heartbeat', {});
    command.mockClear(); x.setTime(now); x.setChainTime(now);
    x.state.oracle.account_id = 'pyth.near'; x.state.oracle_price = '3000000'; x.state.oracle_timestamp = String(now / 1000);
    vi.spyOn(x.keeper, 'verifyActive').mockResolvedValue(true);
    await x.keeper.cycle();
    expect(command).toHaveBeenCalledWith(expect.anything(), 'refresh_oracle', {});
    expect(command.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(x.rt.exec).mock.invocationCallOrder[0]!);
  });
  it('checks deployed bytecode before a heartbeat or order', async () => {
    const x = await harness(); x.state.last_keeper_heartbeat = '0'; x.options.expectedCodeHash = 'wrong';
    const cycle = await x.keeper.cycle();
    expect(cycle.errors.join()).toContain('pin mismatch'); expect(x.rt.exec).not.toHaveBeenCalled();
  });
  it('signs only a reduction when risk requires it and matches the v5 capped fallback price', async () => {
    const x = await harness(); const verify = vi.spyOn(x.keeper, 'verifyActive').mockResolvedValue(true);
    const cycle = await x.keeper.cycle();
    expect(cycle.decision).toBe('reduce-only-close'); expect(x.rt.exec).toHaveBeenCalledTimes(1);
    const args = vi.mocked(x.rt.exec).mock.calls[0]![0];
    expect(args[4]).toBe('request_order_signature'); expect(args).toContain('285 Tgas');
    expect(JSON.parse(args[6]!).order.reduce_only).toBe(true);
    expect(verify.mock.calls[0]![0].expected).toMatchObject({ reduceOnly: true, price: '3.025' });
  });
});
