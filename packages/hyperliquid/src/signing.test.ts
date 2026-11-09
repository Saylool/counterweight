import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recoveredSigner } from './proof.js';
import { actionHash, assembleRequest, digestToSign, getSigningDigest, type SigningInput, type L1Input, type HyperliquidSignature } from './signing.js';

interface Vector { name: string; digest: string; actionHash?: string; wireAction?: unknown; sdkRecovered: string }
const fixtures = JSON.parse(readFileSync(new URL('../../../fixtures/hyperliquid-signing-vectors.json', import.meta.url), 'utf8')) as { vectors: (SigningInput & Vector)[] };
const signature: HyperliquidSignature = { r: `0x${'01'.repeat(32)}`, s: `0x${'02'.repeat(32)}`, v: 27 };
function inputFor(vector: SigningInput): SigningInput {
  return vector.scheme === 'l1' ? { scheme: 'l1', network: vector.network, action: structuredClone(vector.action), nonce: vector.nonce,
    ...(vector.vaultAddress === undefined ? {} : { vaultAddress: vector.vaultAddress }),
    ...(vector.expiresAfter === undefined ? {} : { expiresAfter: vector.expiresAfter }) }
    : { scheme: 'user', network: vector.network, action: structuredClone(vector.action) };
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
it('binds network, nonce, vault and expiry', () => {
  const digest = getSigningDigest(base);
  for (const input of [{ ...base, network: 'mainnet' as const }, { ...base, nonce: base.nonce + 1 },
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

function reverseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).reverse().map(([k, v]) => [k, reverseKeys(v)]));
  return value;
}
describe('Canonical Wire Serialization & SDK ecrecover Parity', () => {
  for (const vector of fixtures.vectors.filter(v => v.scheme === 'l1')) it(`canonicalizes all nested keys: ${vector.name}`, () => {
    const input = inputFor(vector) as L1Input;
    input.action = reverseKeys(input.action) as L1Input['action'];
    expect(actionHash(input.action, input.nonce, input.vaultAddress, input.expiresAfter)).toBe(vector.actionHash);
    expect(JSON.stringify(assembleRequest(input, signature).action)).toBe(JSON.stringify(vector.action));
  });
  it('omits undefined cloid in both hashing and wire assembly', () => {
    const input = inputFor(fixtures.vectors[0]!) as L1Input;
    const canonical = getSigningDigest(input);
    if (input.action.type === 'order') Object.assign(input.action.orders[0]!, { c: undefined });
    expect(getSigningDigest(input)).toBe(canonical);
    expect(Object.hasOwn((assembleRequest(input, signature).action as { orders: object[] }).orders[0]!, 'c')).toBe(false);
  });
  it.each(['10.0', '1.250', '0.0', '0.123456789'])('rejects unnormalized decimal %s in every decimal field', value => {
    for (const field of ['p', 's', 'triggerPx']) {
      const input = inputFor(fixtures.vectors[1]!) as L1Input;
      if (input.action.type !== 'order') throw new Error('fixture');
      const order = input.action.orders[0]!;
      if (field === 'triggerPx' && 'trigger' in order.t) order.t.trigger.triggerPx = value;
      else Object.assign(order, { [field]: value });
      expect(() => getSigningDigest(input)).toThrow();
    }
    expect(() => getSigningDigest({ scheme: 'user', network: 'testnet', action: { type: 'withdraw3', destination: `0x${'ab'.repeat(20)}`, amount: value, time: 1 } })).toThrow();
  });
  it('rejects zero sizes and transfer amounts, accepts eight decimal places', () => {
    const input = inputFor(fixtures.vectors[0]!) as L1Input;
    if (input.action.type !== 'order') throw new Error('fixture');
    input.action.orders[0]!.s = '0';
    expect(() => getSigningDigest(input)).toThrow();
    input.action.orders[0]!.s = '0.12345678';
    expect(() => getSigningDigest(input)).not.toThrow();
    for (const type of ['withdraw3', 'usdSend'] as const) expect(() => getSigningDigest({ scheme: 'user', network: 'testnet', action: { type, destination: `0x${'ab'.repeat(20)}`, amount: '0', time: 1 } })).toThrow();
  });
  it('rejects uppercase identifiers at every wire boundary', () => {
    const upper = `0x${'aB'.repeat(20)}` as const;
    expect(() => getSigningDigest({ ...base, vaultAddress: upper })).toThrow();
    for (const type of ['withdraw3', 'usdSend'] as const) expect(() => getSigningDigest({ scheme: 'user', network: 'testnet', action: { type, destination: upper, amount: '1', time: 1 } })).toThrow();
    expect(() => getSigningDigest({ scheme: 'user', network: 'testnet', action: { type: 'approveAgent', agentAddress: upper, agentName: '', nonce: 1 } })).toThrow();
    const input = inputFor(fixtures.vectors[1]!) as L1Input;
    if (input.action.type === 'order') input.action.orders[0]!.c = `0x${'AB'.repeat(16)}`;
    expect(() => getSigningDigest(input)).toThrow();
    expect(() => getSigningDigest({ ...base, action: { type: 'cancelByCloid', cancels: [{ asset: 54, cloid: `0x${'AB'.repeat(16)}` }] } })).toThrow();
    expect(() => assembleRequest(base, { ...signature, r: `0x${'0A'.repeat(32)}` })).toThrow();
    expect(() => assembleRequest(base, { ...signature, s: `0x${'0A'.repeat(32)}` })).toThrow();
  });
  it('hashes empty agentName but omits it from the wire', () => {
    const vector = fixtures.vectors.find(v => v.name === 'testnet-approveAgent-empty-name')!;
    expect(getSigningDigest(inputFor(vector))).toBe(vector.digest);
    expect(assembleRequest(inputFor(vector), signature).action).not.toHaveProperty('agentName');
  });
  const publicControl = JSON.parse(readFileSync(new URL('../../../fixtures/hyperliquid-testnet-public-control.json', import.meta.url), 'utf8')) as { request: { signature: HyperliquidSignature } };
  for (const vector of fixtures.vectors) it(`SDK recovery using an already-public signature: ${vector.name}`, async () => {
    expect(vector.sdkRecovered).toMatch(/^0x[0-9a-f]{40}$/);
    expect((await recoveredSigner(getSigningDigest(inputFor(vector)), publicControl.request.signature)).toLowerCase()).toBe(vector.sdkRecovered);
  });
});
