import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { actionHash, assembleRequest, digestToSign, getSigningDigest, type SigningInput, type L1Input, type HyperliquidSignature } from './signing.js';

interface Vector { name: string; digest: string; actionHash?: string; wireAction?: unknown }
const fixtures = JSON.parse(readFileSync(new URL('../../../fixtures/hyperliquid-signing-vectors.json', import.meta.url), 'utf8')) as { vectors: (SigningInput & Vector)[] };
const signature: HyperliquidSignature = { r: `0x${'01'.repeat(32)}`, s: `0x${'02'.repeat(32)}`, v: 27 };
function inputFor(vector: SigningInput): SigningInput {
  return vector.scheme === 'l1' ? { scheme: 'l1', network: vector.network, action: vector.action, nonce: vector.nonce,
    ...(vector.vaultAddress === undefined ? {} : { vaultAddress: vector.vaultAddress }),
    ...(vector.expiresAfter === undefined ? {} : { expiresAfter: vector.expiresAfter }) }
    : { scheme: 'user', network: vector.network, action: vector.action };
}
describe('official Python SDK 0.24.0 golden vectors', () => {
  for (const vector of fixtures.vectors) it(vector.name, () => {
    const input = inputFor(vector);
    expect(getSigningDigest(input)).toBe(vector.digest);
    expect(digestToSign(input)).toHaveLength(32);
    if (input.scheme === 'l1') expect(actionHash(input.action, input.nonce, input.vaultAddress, input.expiresAfter)).toBe(vector.actionHash);
    const request = assembleRequest(input, signature);
    expect(request.action).toEqual(vector.scheme === 'user' ? vector.wireAction : vector.action);
    expect(request.nonce).toBe('nonce' in vector ? vector.nonce : undefined);
    expect(request.signature).toEqual(signature);
    if (input.scheme === 'l1') { expect(request.vaultAddress).toBe(input.vaultAddress); expect(request.expiresAfter).toBe(input.expiresAfter); }
  });
});
const base: L1Input = { scheme: 'l1', network: 'testnet', action: { type: 'cancel', cancels: [{ a: 54, o: 0 }] }, nonce: 1700000000000 };
it('binds insertion order, network, nonce, vault and expiry', () => {
  const digest = getSigningDigest(base);
  const reordered = { ...base, action: { cancels: [{ a: 54, o: 0 }], type: 'cancel' as const } };
  for (const input of [reordered, { ...base, network: 'mainnet' as const }, { ...base, nonce: base.nonce + 1 },
    { ...base, vaultAddress: `0x${'12'.repeat(20)}` as const }, { ...base, expiresAfter: base.nonce + 60000 }]) expect(getSigningDigest(input)).not.toBe(digest);
});
it.each([-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid nonce %s', nonce => expect(() => getSigningDigest({ ...base, nonce })).toThrow());
it('rejects numeric price and unknown wire fields', () => {
  const input = structuredClone(fixtures.vectors.find(v => v.name === 'testnet-order')) as L1Input;
  const raw = input.action as unknown as { orders: { p: unknown }[] };
  raw.orders[0]!.p = 1.25;
  expect(() => getSigningDigest(input)).toThrow();
  expect(() => getSigningDigest({ ...base, action: { ...base.action, extra: true } } as unknown as L1Input)).toThrow();
});
it('assembles an isolated request without mutating the caller action', () => {
  const request = assembleRequest(base, signature);
  expect(request.action).not.toBe(base.action);
  expect(base.action).toEqual({ type: 'cancel', cancels: [{ a: 54, o: 0 }] });
});
it.each([
  { ...signature, v: 0 }, { ...signature, r: '0x00' }, { ...signature, s: `0x${'ff'.repeat(32)}` },
])('rejects malformed venue signature %#', bad => expect(() => assembleRequest(base, bad as HyperliquidSignature)).toThrow());
