import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { actionHash, getSigningDigest, assembleRequest } from './signing.ts';
import { mpcToHyperliquidSignature } from '../../../packages/hyperliquid/src/chainsig.ts';
const read = (path: string) => JSON.parse(readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'));
const vectors = read('../fixtures/hyperliquid-signing-vectors.json').vectors;
const fixture = read('../../../fixtures/nearblocks-mpc-response.json');
const signature = mpcToHyperliquidSignature(fixture.signatureResponse);
let checked = 0;
for (const vector of vectors.filter((v: any) => v.action.type === 'noop')) {
  assert.equal(actionHash(vector.action, vector.nonce, vector.vaultAddress, vector.expiresAfter), vector.actionHash);
  assert.equal(getSigningDigest(vector), vector.digest);
  const wire = assembleRequest(vector, signature);
  assert.deepEqual(wire.action, { type: 'noop' });
  assert.equal(wire.expiresAfter, vector.expiresAfter);
  checked++;
}
assert.equal(checked, 4);
const event = read('../target/pause-request.json');
const input = { scheme: 'l1' as const, network: 'testnet' as const, ...event.payload };
assert.equal(getSigningDigest(input), `0x${event.digest}`);
const wire = assembleRequest(input, signature);
assert.deepEqual(wire.action, { type: 'noop' });
assert.equal(wire.nonce, event.payload.nonce);
assert.equal(wire.expiresAfter, event.payload.expiresAfter);
assert.throws(() => assembleRequest({ ...input, action: { type: 'usdSend' } } as any, signature));
console.log('noop SDK vectors: 4 passed; pause event + public MPC fixture -> assembleRequest: 1 passed');
