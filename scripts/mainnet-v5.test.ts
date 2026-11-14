import { describe, it, expect, afterEach } from 'vitest';
import { Readable, PassThrough } from 'node:stream';
import { mainnetVersion, selectedPolicyVersion } from './mainnet-version.js';
import { mainnetInitialization, v5FallbackExitPrice } from './mainnet-lifecycle.js';
import { assertSpendCeiling } from './mainnet-budget.js';
import { ownerPrompter, chooseSpot } from './mainnet-owner.js';
const N = 10n ** 24n;
afterEach(() => { delete process.env.POLICY_VERSION; });
describe('v5 mainnet handoff', () => {
  it('isolates all writable run paths and keeps the funded keeper', () => {
    expect(mainnetVersion('v5')).toMatchObject({ policy: 'cw5.haxheton.near', keeper: 'keeper4.haxheton.near', creationNear: '5.5',
      plan: 'docs/evidence/policy-v5-mainnet-plan.json', evidence: 'docs/evidence/mainnet-owner-v5', lifecycleEvidence: 'docs/evidence/mainnet-owner-v5-lifecycle' });
    expect(mainnetVersion('v4').policy).toBe('cw4.haxheton.near');
    expect(() => selectedPolicyVersion('v3')).toThrow('v4 or v5');
  });
  it('keeps v4 config and narrows the opening band only for v5', () => {
    const market = { assetIndex: 74, szDecimals: 1, mark: '3.34' };
    const init = (version: 'v4' | 'v5') => mainnetInitialization('haxheton.near', 'keeper4.haxheton.near', `0x${'12'.repeat(20)}`, market, version);
    expect(init('v4').limits.price_band_bps).toBe(100);
    expect(init('v5')).toMatchObject({ derivation_path: 'counterweight-mainnet-v5', oracle: { account_id: null }, limits: { price_band_bps: 10 } });
    expect(BigInt(chooseSpot('3.34', 1, String(5n * N), 'v5').yocto)).toBeLessThanOrEqual(36n * N / 10n);
  });
  it('enforces the v5 cumulative ceiling after the exact manual top-up', () => {
    const baseline = 601n * N / 100n + 182n * 10n ** 19n;
    expect(() => assertSpendCeiling(baseline, baseline, 55n * N / 10n, 100000000n, 300, 0n, 601n * N / 100n)).not.toThrow();
    expect(() => assertSpendCeiling(baseline, 182n * 10n ** 19n, 0n, 100000000n, 30, 0n, 601n * N / 100n)).toThrow('6.01 NEAR spend ceiling');
  });
  it('buffers every piped reconciliation answer across asynchronous work', async () => {
    const input = Readable.from(['0xhash\n17.1\n1\nVERIFIED\n']);
    const prompts = ownerPrompter(input, new PassThrough());
    expect(await prompts.ask('hash')).toBe('0xhash');
    await new Promise(resolve => setImmediate(resolve));
    expect(await prompts.ask('net')).toBe('17.1');
    expect(await prompts.ask('fee')).toBe('1');
    expect(await prompts.ask('verified')).toBe('VERIFIED');
    await expect(prompts.ask('missing')).rejects.toThrow('ended');
    prompts.close();
  });
  it('expects the capped downward-quantized fallback signed price', () => {
    const pricing = { anchor_price: '3336600', mark_band_bps: 25, fallback_slippage_bps: 100, max_fallback_price: '3369966' };
    const corridor = { min_price: '2600000', max_price: '4000000' };
    expect(v5FallbackExitPrice(3340000n, 1, corridor, pricing)).toBe(3369900n);
    expect(() => v5FallbackExitPrice(3500000n, 1, corridor, pricing)).toThrow('anchor band');
    expect(() => v5FallbackExitPrice(3340000n, 1, { min_price: '3350000', max_price: '4000000' }, pricing)).toThrow('corridor');
  });
});
