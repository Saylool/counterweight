import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deriveEvmAddress } from '../packages/hyperliquid/src/chainsig.js';
import type { ProofPlan } from './proof-plan.js';

const mocks = vi.hoisted(() => ({ files: new Map<string, string>(), derive: vi.fn(), meta: vi.fn(), submit: vi.fn(), reads: vi.fn() }));
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: async (path: string) => { mocks.reads(path); const value = mocks.files.get(path); if (value === undefined) throw new Error('Plan missing or already consumed'); return value; },
  writeFile: async (path: string, value: string) => { mocks.files.set(path, value); },
  unlink: async (path: string) => { if (!mocks.files.delete(path)) throw new Error('Plan missing or already consumed'); },
}));
vi.mock('../packages/hyperliquid/src/index.js', async importOriginal => ({
  ...await importOriginal<typeof import('../packages/hyperliquid/src/index.js')>(),
  deriveTestnetAddress: mocks.derive, testnetMeta: mocks.meta, submitTestnetProof: mocks.submit,
}));
import { prepareProof } from './prove-signing.js';
import { submitProof } from './prove-submit.js';
import { PLAN_PATH, proofErrorMessage } from './proof-plan.js';
const fixture = JSON.parse(readFileSync(new URL('../fixtures/chainsig-public-derivation.json', import.meta.url), 'utf8'));
const example = { ...fixture.examples[0], ...deriveEvmAddress(fixture.root.value, 'owner.testnet', fixture.examples[0].path), predecessor: 'owner.testnet' };
const publicMpc = { big_r: { affine_point: '021b1dbaa86589149a89df3845df0de182ad3190925d66e87b82d4d91108d876c6' }, s: { scalar: '04d417c672d65a5e5c1f826cf0cccd62343162a046a8169bb5b66e3797202798' }, recovery_id: 0 };
let log: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(1794254306205);
  mocks.files.clear(); mocks.reads.mockClear(); mocks.submit.mockReset(); mocks.derive.mockReset(); mocks.meta.mockReset();
  mocks.derive.mockResolvedValue({ ...example, rootPublicKey: fixture.root.value });
  mocks.meta.mockResolvedValue({ universe: [{ name: 'BTC' }, { name: 'NEAR' }] });
  mocks.submit.mockResolvedValue({ verdict: 'server-recovered-address-matches' });
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
async function prepare() { await prepareProof('owner.testnet', example.path); }
function saved(): ProofPlan { return JSON.parse(mocks.files.get(PLAN_PATH)!); }
// Local derivation validation uses this recorded public predecessor, without account access.
async function validPlan() { await prepareProof(example.predecessor, example.path); }
describe('End-to-End Proof CLI & Relay Guard Suite', () => {
  it('prepares only an active NEAR zero-ID cancel and warns never to fund the owner probe', async () => {
    await prepare();
    expect(saved().input.action).toEqual({ type: 'cancel', cancels: [{ a: 1, o: 0 }] });
    expect(log.mock.calls.flat().join('\n')).toContain('Never fund the owner-EOA probe address');
  });
  it.each([
    { universe: [{ name: 'NEAR', isDelisted: true }] }, { universe: [] }, { universe: [{ name: 'NEAR' }, { name: 'NEAR' }] },
  ])('rejects delisted, missing or ambiguous NEAR markets %#', async meta => {
    mocks.meta.mockResolvedValue(meta);
    await expect(prepare()).rejects.toThrow();
    expect(mocks.files.has(PLAN_PATH)).toBe(false);
  });
  it('consumes a plan before relay submission and refuses replay', async () => {
    await validPlan();
    mocks.submit.mockImplementation(async () => { expect(mocks.files.has(PLAN_PATH)).toBe(false); return { verdict: 'server-recovered-address-matches' }; });
    await submitProof(JSON.stringify(publicMpc));
    expect(mocks.files.has('.tmp/signing-proof-result.json')).toBe(true);
    await expect(submitProof(JSON.stringify(publicMpc))).rejects.toThrow();
    expect(mocks.submit).toHaveBeenCalledTimes(1);
  });
  it('allows only one concurrent submission and consumes even on transport failure', async () => {
    await validPlan();
    const results = await Promise.allSettled([submitProof(JSON.stringify(publicMpc)), submitProof(JSON.stringify(publicMpc))]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    await validPlan(); mocks.submit.mockRejectedValue(new Error('transport failed'));
    await expect(submitProof(JSON.stringify(publicMpc))).rejects.toThrow('transport failed');
    expect(mocks.files.has(PLAN_PATH)).toBe(false);
  });
  it('refuses MPC address drift before consuming or submitting', async () => {
    await validPlan();
    mocks.derive.mockResolvedValue({ address: `0x${'00'.repeat(20)}` });
    await expect(submitProof(JSON.stringify(publicMpc))).rejects.toThrow('differs');
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.files.has(PLAN_PATH)).toBe(true);
  });
  it.each(['order', 'cancelByCloid', 'user', 'vaultAddress', 'expiresAfter', 'stale', 'future'])('rejects tampered or unusable plans: %s', async kind => {
    await validPlan(); const plan = saved(); const raw = plan.input as unknown as Record<string, unknown>;
    if (kind === 'order' || kind === 'cancelByCloid') raw.action = { type: kind };
    else if (kind === 'user') raw.scheme = 'user';
    else if (kind === 'stale') vi.setSystemTime(Date.now() + 30 * 60_000 + 1);
    else if (kind === 'future') vi.setSystemTime(Date.now() - 60_001);
    else raw[kind] = kind === 'vaultAddress' ? `0x${'ab'.repeat(20)}` : Date.now();
    mocks.files.set(PLAN_PATH, JSON.stringify(plan));
    await expect(submitProof(JSON.stringify(publicMpc))).rejects.toThrow();
    expect(mocks.submit).not.toHaveBeenCalled();
  });
  it('reads only the designated public signature file and sanitizes JSON errors', async () => {
    await validPlan();
    await expect(submitProof('@some-other-file.json')).rejects.toThrow('Only @.tmp/mpc-response.json');
    expect(mocks.reads).not.toHaveBeenCalledWith('some-other-file.json');
    mocks.files.set('.tmp/mpc-response.json', 'public malformed JSON marker');
    try { await submitProof('@.tmp/mpc-response.json'); throw new Error('expected rejection'); }
    catch (error) { expect(proofErrorMessage(error)).toBe('Invalid JSON; provide only the public MPC signature object or a valid proof plan'); }
  });
  it('reports unproven results as a failed CLI proof', async () => {
    await validPlan(); mocks.submit.mockResolvedValue({ verdict: 'unproven' });
    await expect(submitProof(JSON.stringify(publicMpc))).rejects.toThrow('UNPROVEN');
    expect(mocks.files.has(PLAN_PATH)).toBe(false);
  });
});
