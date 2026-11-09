import { z } from 'zod';
import { recoverAddress, type Hex } from 'viem';
import { assembleRequest, getSigningDigest, type HyperliquidSignature, type L1Input } from './signing.js';

export const TESTNET_API = 'https://api.hyperliquid-testnet.xyz';
export interface TestnetMeta { universe: { name: string; isDelisted?: boolean }[] }
export async function testnetMeta(): Promise<TestnetMeta> {
  const response = await fetch(`${TESTNET_API}/info`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'meta' }), signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new Error(`Hyperliquid meta HTTP ${response.status}`);
  return z.object({ universe: z.array(z.object({ name: z.string(), isDelisted: z.boolean().optional() })) }).parse(await response.json()) as TestnetMeta;
}
export function nearMarketIndex(meta: TestnetMeta): number {
  const matches = meta.universe.flatMap((asset, index) => asset.name === 'NEAR' ? [index] : []);
  const index = matches[0];
  if (matches.length !== 1 || index === undefined || meta.universe[index]?.isDelisted) throw new Error('NEAR market missing, ambiguous or delisted');
  return index;
}
export function harmlessCancel(asset: number, nonce: number): L1Input {
  return { scheme: 'l1', network: 'testnet', action: { type: 'cancel', cancels: [{ a: asset, o: 0 }] }, nonce };
}
export async function recoveredSigner(digest: Hex, signature: HyperliquidSignature): Promise<Hex> {
  return recoverAddress({ hash: digest, signature: { r: signature.r, s: signature.s, v: BigInt(signature.v) } });
}
export type ProofVerdict = 'server-recovered-address-matches' | 'authenticated-cancel-response' | 'unproven';
/** Only named signing errors or a structurally valid cancel response count as server evidence. */
export function classifyProofResponse(response: unknown, expected: string, authenticatedSigner?: string): ProofVerdict {
  if (!/^0x[0-9a-f]{40}$/i.test(expected)) return 'unproven';
  const error = z.object({ status: z.literal('err'), response: z.string() }).safeParse(response);
  if (error.success) {
    const message = error.data.response;
    const match = /^(?:L1 error: )?User or API Wallet (0x[0-9a-fA-F]{40}) does not exist\.?$/.exec(message)
      ?? /^(?:L1 error: )?Must deposit before performing actions\. User: (0x[0-9a-fA-F]{40})\.?$/.exec(message);
    return match?.[1]?.toLowerCase() === expected.toLowerCase() ? 'server-recovered-address-matches' : 'unproven';
  }
  if (authenticatedSigner?.toLowerCase() !== expected.toLowerCase()) return 'unproven';
  const cancel = z.object({ status: z.literal('ok'), response: z.object({ type: z.literal('cancel'),
    data: z.object({ statuses: z.array(z.object({ error: z.literal('Order was never placed, already canceled, or filled.') }).strict()).length(1) }) }) }).safeParse(response);
  return cancel.success ? 'authenticated-cancel-response' : 'unproven';
}
export const PROOF_MAX_AGE_MS = 30 * 60_000;
export const PROOF_MAX_FUTURE_MS = 60_000;
export function validateProofNonce(nonce: number): void {
  const age = Date.now() - nonce;
  if (!Number.isSafeInteger(nonce) || nonce < 0 || age < -PROOF_MAX_FUTURE_MS || age > PROOF_MAX_AGE_MS)
    throw new Error('Proof nonce is older than 30 minutes or from the future; prepare and sign a fresh plan');
}
export async function submitTestnetProof(input: L1Input, signature: HyperliquidSignature, expectedAddress: Hex) {
  // Retain the exact checked payload across asynchronous signature recovery.
  input = structuredClone(input);
  signature = { ...signature };
  if (input.scheme !== 'l1' || input.network !== 'testnet' || input.action.type !== 'cancel' || input.action.cancels.length !== 1 || input.action.cancels[0]?.o !== 0 || input.vaultAddress !== undefined || input.expiresAfter !== undefined)
    throw new Error('Proof relay accepts only a testnet cancel of order ID zero, without a vault or expiresAfter');
  validateProofNonce(input.nonce);
  const digest = getSigningDigest(input);
  const recovered = await recoveredSigner(digest, signature);
  if (recovered.toLowerCase() !== expectedAddress.toLowerCase()) throw new Error('Signature does not recover to the derived EVM address; refusing to submit');
  const request = assembleRequest(input, signature);
  const result = await fetch(`${TESTNET_API}/exchange`, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request), signal: AbortSignal.timeout(25_000) });
  const raw = await result.text();
  let response: unknown;
  try { response = JSON.parse(raw); } catch { response = raw; }
  return { httpStatus: result.status, request, response, recovered,
    verdict: result.ok ? classifyProofResponse(response, expectedAddress, recovered) : 'unproven' as const };
}
