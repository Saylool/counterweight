import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { base58 } from '@scure/base';
import { proveContractLive } from './prove-contract-live.js';
import { DEPLOYED_SHA256, KEEPER, NEXT_POLICY, POLICY } from './testnet-common.js';

const relay = vi.hoisted(() => ({ prepare: vi.fn(async () => ({ ready: true })), prove: vi.fn(async () => {}), line: '' }));
vi.mock('./prove-contract.js', async original => ({
  ...await original<typeof import('./prove-contract.js')>(), prepareContractProof: relay.prepare, proveContract: relay.prove,
}));
vi.mock('./testnet-common.js', async original => ({
  ...await original<typeof import('./testnet-common.js')>(),
  rpc: vi.fn(async () => ({ block_hash: 'latest', keys: [{ public_key: 'public', access_key: { permission: 'FullAccess' } }] })),
}));
vi.mock('node:readline/promises', () => ({ createInterface: vi.fn(() => ({
  async *[Symbol.asyncIterator]() { yield relay.line; }, close: vi.fn(),
})) }));
beforeEach(() => {
  relay.prove.mockClear(); relay.prepare.mockClear();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  relay.line = base58.encode(new Uint8Array(32).fill(13));
});
afterEach(() => vi.restoreAllMocks());
describe('live relay command and hash handoff', () => {
  it('warms first, prints the zero-deposit keeper command and forwards stdin hash', async () => {
    await proveContractLive([`--keeper=${KEEPER}`, `--policy=${NEXT_POLICY}`]);
    expect(relay.prepare).toHaveBeenCalledWith(NEXT_POLICY);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`as-transaction ${NEXT_POLICY} request_cancel_signature`));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`attached-deposit '0 NEAR' sign-as ${KEEPER}`));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('60 s expiresAfter'));
    expect(relay.prove).toHaveBeenCalledWith([`--keeper=${KEEPER}`, `--policy=${NEXT_POLICY}`, `--tx=${relay.line}`], { ready: true });
  });
  it('accepts an argument hash and prints the original deployment fee for rehearsal', async () => {
    const args = [`--keeper=${KEEPER}`, `--policy=${POLICY}`, '--rehearsal', `--wasm-sha256=${DEPLOYED_SHA256}`, `--tx=${relay.line}`];
    await proveContractLive(args);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("attached-deposit '1 yoctoNEAR'"));
    expect(relay.prove).toHaveBeenCalledWith(args, { ready: true });
  });
  it('requires an explicit keeper and rejects missing or invalid stdin hashes before relay', async () => {
    await expect(proveContractLive([])).rejects.toThrow('Usage');
    expect(relay.prepare).not.toHaveBeenCalled();
    relay.line = '';
    await expect(proveContractLive([`--keeper=${KEEPER}`])).rejects.toThrow('Expected keeper transaction hash');
    relay.line = 'bad';
    await expect(proveContractLive([`--keeper=${KEEPER}`])).rejects.toThrow('Expected a base58');
    expect(relay.prove).not.toHaveBeenCalled();
  });
});
