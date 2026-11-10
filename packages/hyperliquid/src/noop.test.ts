import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { actionHash, getSigningDigest, assembleRequest, type L1Input } from './signing.js';
const vectors = JSON.parse(readFileSync('contracts/policy/fixtures/hyperliquid-signing-vectors.json','utf8')).vectors.filter((v: L1Input) => v.action.type === 'noop');
for (const v of vectors) it(`shared codec ${v.name}`, () => {
  expect(actionHash(v.action,v.nonce,v.vaultAddress,v.expiresAfter)).toBe(v.actionHash);
  expect(getSigningDigest(v)).toBe(v.digest);
  const wire = assembleRequest(v,{r:`0x${'01'.repeat(32)}`,s:`0x${'02'.repeat(32)}`,v:27});
  expect(wire.action).toEqual({type:'noop'}); expect(wire.nonce).toBe(v.nonce); expect(wire.expiresAfter).toBe(v.expiresAfter);
});
it('forbids extra noop fields and binds expiry and nonce', () => {
  expect(vectors).toHaveLength(4);
  const v = vectors[0];
  expect(() => getSigningDigest({...v,action:{type:'noop',nonce:1}})).toThrow();
  expect(getSigningDigest({...v,nonce:v.nonce+1})).not.toBe(v.digest);
  expect(getSigningDigest({...v,expiresAfter:v.nonce+1})).not.toBe(v.digest);
});
