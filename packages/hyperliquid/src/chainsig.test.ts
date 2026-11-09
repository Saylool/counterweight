import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toHex } from 'viem';
import * as crypto from 'node:crypto';
vi.mock('node:crypto', async importOriginal => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return { ...actual, createHash: vi.fn(actual.createHash) };
});
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { deriveTestnetAddress, testnetView, deriveEvmAddress, mpcToHyperliquidSignature, nearPublicKeyToHex, publicKeyToEvmAddress } from './chainsig.js';
import { SECP256K1_ORDER } from './signing.js';
const fixture = JSON.parse(readFileSync(new URL('../../../fixtures/chainsig-public-derivation.json', import.meta.url), 'utf8')) as {
 root: { value: string }; examples: { predecessor: string; path: string; address: string; publicKey: string; rpcResponse: { value: string } }[];
};
for (const example of fixture.examples) it(`matches recorded testnet MPC view: ${example.predecessor}/${example.path}`, () => {
  const derived = deriveEvmAddress(fixture.root.value, example.predecessor, example.path);
  expect(derived).toEqual({ address: example.address, publicKey: example.publicKey });
  expect(nearPublicKeyToHex(example.rpcResponse.value)).toBe(example.publicKey);
});
it('binds predecessor as well as path', () => {
  const first = fixture.examples[0]!;
  expect(deriveEvmAddress(fixture.root.value, 'other.testnet', first.path).address).not.toBe(first.address);
  expect(deriveEvmAddress(fixture.root.value, first.predecessor, `${first.path} `).address).not.toBe(first.address);
});
// Public curve point used only as a wire-format example. No key or signing operation.
const point = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
const scalar = '04d417c672d65a5e5c1f826cf0cccd62343162a046a8169bb5b66e3797202798';
it('converts documented nested and flat MPC formats, including scheme tag', () => {
  const nested = { big_r: { affine_point: point }, s: { scalar }, recovery_id: 0 };
  const expected = { r: `0x${point.slice(2)}`, s: `0x${scalar}`, v: 27 };
  expect(mpcToHyperliquidSignature(nested)).toEqual(expected);
  expect(mpcToHyperliquidSignature({ big_r: point, s: scalar, recovery_id: 0, scheme: 'Secp256k1' })).toEqual(expected);
  expect(mpcToHyperliquidSignature({ big_r: point, s: scalar, recovery_id: 1 }).v).toBe(28);
});
it('normalizes high-s and flips v while preserving r', () => {
  const high = toHex(SECP256K1_ORDER - BigInt(`0x${scalar}`), { size: 32 }).slice(2);
  expect(mpcToHyperliquidSignature({ big_r: point, s: high, recovery_id: 0 })).toEqual({ r: `0x${point.slice(2)}`, s: `0x${scalar}`, v: 28 });
});
it.each([
 { big_r: point, s: scalar, recovery_id: 2 }, { big_r: point, s: '00'.repeat(32), recovery_id: 0 },
 { big_r: `02${'ff'.repeat(32)}`, s: scalar, recovery_id: 0 }, { big_r: point.slice(2), s: scalar, recovery_id: 0 },
 { big_r: point, s: '01', recovery_id: 0 }, { big_r: point, s: toHex(SECP256K1_ORDER, { size: 32 }), recovery_id: 0 },
])('rejects malformed MPC response %#', response => expect(() => mpcToHyperliquidSignature(response)).toThrow());
it('rejects non-secp256k1 or malformed public keys', () => {
  expect(() => nearPublicKeyToHex('ed25519:1111')).toThrow();
  expect(() => nearPublicKeyToHex('secp256k1:1111')).toThrow();
  expect(() => publicKeyToEvmAddress('0x04')).toThrow();
});


describe('MPC Derivation Cross-Check & Curve Boundary Suite', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  function rpc(value: unknown, blockHash = 'pinned-root') {
    return new Response(JSON.stringify({ result: { result: [...Buffer.from(JSON.stringify(value))], block_height: 42, block_hash: blockHash } }));
  }
  it('pins derived view to root block and domain zero across root rotation', async () => {
    const example = fixture.examples[0]!;
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const { params } = JSON.parse(init.body as string);
      if (params.method_name === 'public_key') return rpc(fixture.root.value);
      // Simulates a new final root arriving between calls. Only a pinned view agrees.
      return rpc(params.block_id === 'pinned-root' ? example.rpcResponse.value : fixture.root.value);
    });
    vi.stubGlobal('fetch', fetchMock);
    expect((await deriveTestnetAddress(example.predecessor, example.path)).address).toBe(example.address);
    const [root, derived] = fetchMock.mock.calls.map(call => JSON.parse((call[1] as RequestInit).body as string).params);
    expect(JSON.parse(Buffer.from(root.args_base64, 'base64').toString())).toEqual({ domain_id: 0 });
    expect(root.finality).toBe('final');
    expect(derived.block_id).toBe('pinned-root');
    expect(derived).not.toHaveProperty('finality');
  });
  it('rejects remote derived key mismatch and a mismatched block response', async () => {
    const example = fixture.examples[0]!;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(rpc(fixture.root.value)).mockResolvedValueOnce(rpc(fixture.root.value)));
    await expect(deriveTestnetAddress(example.predecessor, example.path)).rejects.toThrow('disagrees');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(rpc(fixture.root.value)).mockResolvedValueOnce(rpc(example.rpcResponse.value, 'wrong-block')));
    await expect(deriveTestnetAddress(example.predecessor, example.path)).rejects.toThrow('block');
  });
  it.each([{}, { result: { result: [256], block_height: 1, block_hash: 'x' } }, { result: { result: [123], block_height: 1, block_hash: 'x' } }])('rejects malformed RPC payload %#', async value => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(value))));
    await expect(testnetView('public_key', {})).rejects.toThrow();
  });
  it('rejects HTTP errors and non-string view results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(testnetView('public_key', {})).rejects.toThrow('HTTP 503');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(rpc(42)));
    await expect(testnetView('public_key', {})).rejects.toThrow();
  });
  it('validates path type and uncompressed public key prefix', () => {
    expect(() => deriveEvmAddress(fixture.root.value, 'example.near', undefined as unknown as string)).toThrow();
    expect(() => publicKeyToEvmAddress(`0x${point}`)).toThrow();
  });
  it('rejects tweak at or above the scalar order', () => {
    vi.mocked(crypto.createHash).mockReturnValueOnce({ update: () => ({ digest: () => SECP256K1_ORDER.toString(16) }) } as unknown as ReturnType<typeof crypto.createHash>);
    expect(() => deriveEvmAddress(fixture.root.value, 'example.near', 'path')).toThrow('outside the scalar field');
  });
  it('rejects valid curve points with x at or above the scalar order and recovery IDs 2/3', () => {
    let overflow = '';
    for (let x = SECP256K1_ORDER; x < SECP256K1_ORDER + 100n; x++) {
      const candidate = `02${x.toString(16).padStart(64, '0')}`;
      try { secp256k1.Point.fromHex(candidate).assertValidity(); overflow = candidate; break; } catch { /* public point search */ }
    }
    expect(overflow).not.toBe('');
    expect(() => mpcToHyperliquidSignature({ big_r: overflow, s: scalar, recovery_id: 0 })).toThrow('x-overflow');
    for (const recovery_id of [2, 3]) expect(() => mpcToHyperliquidSignature({ big_r: point, s: scalar, recovery_id })).toThrow();
  });
  it('converts actual raw NearBlocks SignatureResponse JSON', () => {
    const raw = JSON.parse(readFileSync(new URL('../../../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8'));
    const control = JSON.parse(readFileSync(new URL('../../../fixtures/hyperliquid-testnet-public-control.json', import.meta.url), 'utf8'));
    expect(JSON.parse(Buffer.from(raw.successValueBase64, 'base64').toString())).toEqual(raw.signatureResponse);
    expect(mpcToHyperliquidSignature(raw.signatureResponse)).toEqual(control.request.signature);
  });
});
