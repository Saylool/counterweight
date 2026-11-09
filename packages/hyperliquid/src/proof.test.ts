import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { type Hex } from 'viem';
import { testnetMeta, classifyProofResponse, harmlessCancel, recoveredSigner, submitTestnetProof } from './proof.js';
import { getSigningDigest, type HyperliquidSignature, type L1Input } from './signing.js';
import { mpcToHyperliquidSignature } from './chainsig.js';
const live = JSON.parse(readFileSync(new URL('../../../fixtures/hyperliquid-testnet-public-control.json', import.meta.url), 'utf8')) as {
 input: L1Input; digest: Hex; request: { signature: HyperliquidSignature }; recovered: Hex; response: unknown;
};
vi.spyOn(Date, 'now').mockReturnValue(live.input.nonce);
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
it('requires a locally authenticated signer for per-action cancel evidence', () => {
  expect(classifyProofResponse({ status: 'ok', response: { type: 'cancel', data: { statuses: [{ error: 'Order was never placed, already canceled, or filled.' }] } } }, live.recovered)).toBe('unproven');
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

it.each([
  { expiresAfter: live.input.nonce - 1 }, { expiresAfter: live.input.nonce + 60_000 },
  { nonce: live.input.nonce - 30 * 60_000 - 1 }, { nonce: live.input.nonce + 60_001 }, { nonce: live.input.nonce + 86400_000 },
  { vaultAddress: `0x${'ab'.repeat(20)}` },
  { scheme: 'user', action: { type: 'usdSend', destination: live.recovered, amount: '1', time: live.input.nonce } },
  { action: { type: 'order', orders: [], grouping: 'na' } },
  { action: { type: 'cancelByCloid', cancels: [{ asset: 54, cloid: `0x${'ab'.repeat(16)}` }] } },
])('rejects unsafe relay input before any fetch %#', async patch => {
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
  await expect(submitTestnetProof({ ...live.input, ...patch } as L1Input, live.request.signature, live.recovered)).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
it('preserves delisting metadata for proof market guards', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ universe: [{ name: 'NEAR', isDelisted: true }] }))));
  expect(await testnetMeta()).toEqual({ universe: [{ name: 'NEAR', isDelisted: true }] });
});
it('rejects malformed meta and HTTP failures', async () => {
  for (const response of [new Response('{}'), new Response(JSON.stringify({ universe: [{ name: 'NEAR', isDelisted: 'true' }] })), new Response('', { status: 503 })]) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(testnetMeta()).rejects.toThrow();
  }
});
it('binds authenticated cancel evidence to the expected signer and known zero-ID result', () => {
  const response = (status: unknown) => ({ status: 'ok', response: { type: 'cancel', data: { statuses: [status] } } });
  const known = response({ error: 'Order was never placed, already canceled, or filled.' });
  expect(classifyProofResponse(known, live.recovered, live.recovered)).toBe('authenticated-cancel-response');
  expect(classifyProofResponse(known, `0x${'00'.repeat(20)}`, live.recovered)).toBe('unproven');
  for (const unknown of ['success', { error: 'invalid signature' }, { error: 'anything' }])
    expect(classifyProofResponse(response(unknown), live.recovered, live.recovered)).toBe('unproven');
});
it('keeps the relay request fixed while asynchronous recovery is pending', async () => {
  const input = structuredClone(live.input);
  const signature = { ...live.request.signature };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(live.response))));
  const pending = submitTestnetProof(input, signature, live.recovered);
  if (input.action.type === 'cancel') input.action.cancels[0]!.o = 42;
  input.expiresAfter = live.input.nonce - 1;
  signature.r = `0x${'01'.repeat(32)}`;
  const result = await pending;
  expect(result.request).toEqual(live.request);
});
