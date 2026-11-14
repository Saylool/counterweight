import { describe, expect, it } from 'vitest';
import { assertSigningResources, readSigningResources, SIGNER_RELEASE } from './mainnet-signer.js';
import type { PublicClient } from '../apps/keeper/src/run-io.js';

describe('live signer resource gate', () => {
  const good = { fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30 };
  it('accepts the live release and reads config/version/code at the same finalized block', async () => {
    const client = { view: async (_: string, method: string, _args?: unknown, block?: string) => {
      if (method === 'version') { expect(block).toBe('final'); return { value: '3.18.0', block }; }
      return { value: { sign_call_gas_attachment_requirement_tera_gas: 15 }, block: 'final' };
    }, rpc: async (_: string, args: unknown) => { expect(args).toMatchObject({ block_id: 'final' }); return { code_hash: SIGNER_RELEASE.codeHash, block_hash: 'final' }; } } as unknown as PublicClient;
    expect(await readSigningResources(client)).toMatchObject({ ...good, minimumGasTgas: 15, depositSource: 'verified-release-bytecode' });
  });
  it('refuses unknown live bytecode rather than assuming a 1 yocto deposit', async () => {
    const client = { view: async (_: string, method: string) => ({ value: method === 'version' ? '3.18.0' : { sign_call_gas_attachment_requirement_tera_gas: 15 }, block: 'final' }),
      rpc: async () => ({ code_hash: 'changed', block_hash: 'final' }) } as unknown as PublicClient;
    await expect(readSigningResources(client)).rejects.toThrow('unknown live');
  });
  it('rejects incompatible fee, live gas, and total callback budget', () => {
    expect(() => assertSigningResources(good, 15, '1')).not.toThrow();
    expect(() => assertSigningResources(good, 231, '1')).toThrow('incompatible');
    expect(() => assertSigningResources(good, 15, '2')).toThrow('incompatible');
    expect(() => assertSigningResources({ ...good, fee: String(10n ** 22n + 1n) }, 15, '1')).toThrow();
    expect(() => assertSigningResources({ ...good, signer_gas_tgas: 250 }, 15, '1')).toThrow();
  });
});
