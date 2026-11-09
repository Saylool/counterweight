import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { toHex } from 'viem';
import { deriveEvmAddress, mpcToHyperliquidSignature, nearPublicKeyToHex, publicKeyToEvmAddress } from './chainsig.js';
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

it('converts the published MPC signature used by the recorded public control', () => {
  const control = JSON.parse(readFileSync(new URL('../../../fixtures/hyperliquid-testnet-public-control.json', import.meta.url), 'utf8')) as { request: { signature: { r: string; s: string; v: number } } };
  const { signature } = control.request;
  expect(mpcToHyperliquidSignature({ scheme: 'Secp256k1', big_r: { affine_point: `02${signature.r.slice(2)}` },
    s: { scalar: signature.s.slice(2) }, recovery_id: 0 })).toEqual(signature);
});
