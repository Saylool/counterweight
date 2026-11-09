import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { type Hex } from 'viem';
import { classifyProofResponse, harmlessCancel, recoveredSigner, submitTestnetProof } from './proof.js';
import { getSigningDigest, type HyperliquidSignature, type L1Input } from './signing.js';
import { mpcToHyperliquidSignature } from './chainsig.js';
const live = JSON.parse(readFileSync(new URL('../../../fixtures/hyperliquid-testnet-public-control.json', import.meta.url), 'utf8')) as {
 input: L1Input; digest: Hex; request: { signature: HyperliquidSignature }; recovered: Hex; response: unknown;
};
afterEach(() => vi.unstubAllGlobals());
it('reproduces the address Hyperliquid actually reported in the public control', async () => {
  expect(getSigningDigest(live.input)).toBe(live.digest);
  expect(await recoveredSigner(live.digest, live.request.signature)).toBe(live.recovered);
  expect(classifyProofResponse(live.response, live.recovered)).toBe('server-recovered-address-matches');
});
it('high-s normalization preserves the recovered signer', async () => {
  const { SECP256K1_ORDER } = await import('./signing.js');
  const { signature } = live.request;
  const high = { big_r: `02${signature.r.slice(2)}`, s: (SECP256K1_ORDER - BigInt(signature.s)).toString(16).padStart(64, '0'), recovery_id: 1 };
  expect(await recoveredSigner(live.digest, mpcToHyperliquidSignature(high))).toBe(live.recovered);
});
it.each([
  { status: 'err', response: 'Must deposit before performing actions. User: ' },
  { status: 'err', response: 'L1 error: User or API Wallet ' },
])('recognizes documented address evidence %#', (prefix) => {
  const ending = prefix.response.endsWith('Wallet ') ? ' does not exist.' : '';
  expect(classifyProofResponse({ ...prefix, response: `${prefix.response}${live.recovered}${ending}` }, live.recovered)).toBe('server-recovered-address-matches');
});
it('does not count generic failures, a wrong address, or HTTP success alone as proof', () => {
  for (const response of [{ status: 'ok' }, { status: 'err', response: 'invalid signature' }, 'HTTP 200',
    { status: 'err', response: `Unrelated error mentions ${live.recovered}` }]) expect(classifyProofResponse(response, live.recovered)).toBe('unproven');
  expect(classifyProofResponse(live.response, `0x${'00'.repeat(20)}`)).toBe('unproven');
});
it('recognizes an authenticated per-action cancel result', () => {
  expect(classifyProofResponse({ status: 'ok', response: { type: 'cancel', data: { statuses: [{ error: 'Order was never placed, already canceled, or filled.' }] } } }, live.recovered)).toBe('authenticated-cancel-response');
});
it('refuses a signature recovering to a different account before making a network call', async () => {
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  await expect(submitTestnetProof(live.input, live.request.signature, `0x${'00'.repeat(20)}`)).rejects.toThrow('does not recover');
  expect(fetchMock).not.toHaveBeenCalled();
});
it('hard-blocks mainnet and real cancellation IDs in the relay', async () => {
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  await expect(submitTestnetProof({ ...live.input, network: 'mainnet' }, live.request.signature, live.recovered)).rejects.toThrow('only a testnet cancel');
  const input = harmlessCancel(54, Date.now());
  if (input.action.type === 'cancel') input.action.cancels[0]!.o = 42;
  await expect(submitTestnetProof(input, live.request.signature, live.recovered)).rejects.toThrow('only a testnet cancel');
  expect(fetchMock).not.toHaveBeenCalled();
});
it('submits the exact signed body to testnet and checks the address in the response', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(live.response), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  const result = await submitTestnetProof(live.input, live.request.signature, live.recovered);
  expect(result.verdict).toBe('server-recovered-address-matches');
  expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.hyperliquid-testnet.xyz/exchange');
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
  expect(JSON.parse(init.body as string)).toEqual({ action: live.input.action, nonce: live.input.nonce, signature: live.request.signature });
});
it('does not treat a non-200 response containing the expected text as proof', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(live.response), { status: 500 })));
  expect((await submitTestnetProof(live.input, live.request.signature, live.recovered)).verdict).toBe('unproven');
});
