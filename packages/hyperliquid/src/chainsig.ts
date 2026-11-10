import { createHash } from 'node:crypto';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { base58 } from '@scure/base';
import { keccak256, toHex, type Hex } from 'viem';
import { z } from 'zod';
import { SECP256K1_ORDER, validateSignature, type HyperliquidSignature } from './signing.js';

export const TESTNET_SIGNER = 'v1.signer-prod.testnet';
// Override with NEAR_TESTNET_RPC (e.g. https://test.rpc.fastnear.com) when the public endpoint rate-limits.
export const TESTNET_RPC = process.env.NEAR_TESTNET_RPC ?? 'https://rpc.testnet.near.org';
export function nearPublicKeyToHex(publicKey: string): Hex {
  if (!publicKey.startsWith('secp256k1:')) throw new Error('Expected NEAR secp256k1 public key');
  const bytes = base58.decode(publicKey.slice('secp256k1:'.length));
  if (bytes.length !== 64) throw new Error('Expected 64 public-key bytes');
  const result = `0x04${Buffer.from(bytes).toString('hex')}` as Hex;
  secp256k1.Point.fromHex(result.slice(2)).assertValidity();
  return result;
}
export function publicKeyToEvmAddress(publicKey: Hex): Hex {
  z.string().regex(/^0x04[0-9a-fA-F]{128}$/).parse(publicKey);
  const point = secp256k1.Point.fromHex(publicKey.slice(2));
  return `0x${keccak256(point.toBytes(false).slice(1)).slice(-40)}`;
}
/** near/mpc derive_tweak: NIST SHA3-256, NOT Ethereum keccak256. Only public EC operations. */
export function deriveEvmAddress(rootPublicKey: string, predecessor: string, path: string) {
  z.string().min(2).max(64).regex(/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/).parse(predecessor);
  z.string().parse(path);
  const root = secp256k1.Point.fromHex(nearPublicKeyToHex(rootPublicKey).slice(2));
  const tweak = BigInt(`0x${createHash('sha3-256').update(`near-mpc-recovery v0.1.0 epsilon derivation:${predecessor},${path}`, 'utf8').digest('hex')}`);
  if (tweak >= SECP256K1_ORDER) throw new Error('Derivation tweak is outside the scalar field');
  const derived = tweak === 0n ? root : root.add(secp256k1.Point.BASE.multiply(tweak));
  const publicKey = toHex(derived.toBytes(false));
  return { address: publicKeyToEvmAddress(publicKey), publicKey };
}
export async function testnetView(method: 'public_key' | 'derived_public_key', args: Record<string, unknown>, blockHash?: string): Promise<{ value: string; blockHeight: number; blockHash: string }> {
  const response = await fetch(TESTNET_RPC, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'counterweight-public-view', method: 'query', params: {
      request_type: 'call_function', ...(blockHash === undefined ? { finality: 'final' } : { block_id: blockHash }), account_id: TESTNET_SIGNER, method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
    } }), signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new Error(`NEAR RPC HTTP ${response.status}`);
  const result = z.object({ result: z.object({ result: z.array(z.number().int().min(0).max(255)), block_height: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), block_hash: z.string().min(1) }) }).safeParse(await response.json());
  if (!result.success) throw new Error('NEAR view failed or returned an unexpected shape');
  if (blockHash !== undefined && result.data.result.block_hash !== blockHash) throw new Error('NEAR view returned a different block');
  return { value: z.string().parse(JSON.parse(Buffer.from(result.data.result.result).toString('utf8'))),
    blockHeight: result.data.result.block_height, blockHash: result.data.result.block_hash };
}
export async function deriveTestnetAddress(predecessor: string, path: string) {
  const root = await testnetView('public_key', { domain_id: 0 });
  const derived = deriveEvmAddress(root.value, predecessor, path);
  const remote = await testnetView('derived_public_key', { predecessor, path, domain_id: 0 }, root.blockHash);
  if (nearPublicKeyToHex(remote.value).toLowerCase() !== derived.publicKey.toLowerCase()) throw new Error('Local derivation disagrees with MPC view');
  return { ...derived, rootPublicKey: root.value, rootBlockHeight: root.blockHeight, derivedBlockHeight: remote.blockHeight };
}
const mpcSchema = z.object({
  scheme: z.literal('Secp256k1').optional(),
  big_r: z.union([z.string(), z.object({ affine_point: z.string() }).strict()]),
  s: z.union([z.string(), z.object({ scalar: z.string() }).strict()]),
  recovery_id: z.number().int().min(0).max(1),
}).strict();
/** Both documented legacy nested and current flat MPC response formats. */
export function mpcToHyperliquidSignature(value: unknown): HyperliquidSignature {
  const response = mpcSchema.parse(value);
  const pointHex = (typeof response.big_r === 'string' ? response.big_r : response.big_r.affine_point).replace(/^0x/, '');
  z.string().regex(/^(02|03)[0-9a-fA-F]{64}$/).parse(pointHex);
  const point = secp256k1.Point.fromHex(pointHex); point.assertValidity();
  if (point.x >= SECP256K1_ORDER) throw new Error('Unsupported recovery x-overflow');
  const scalar = (typeof response.s === 'string' ? response.s : response.s.scalar).replace(/^0x/, '');
  z.string().regex(/^[0-9a-fA-F]{64}$/).parse(scalar);
  let s = BigInt(`0x${scalar}`);
  if (s <= 0n || s >= SECP256K1_ORDER) throw new Error('Invalid MPC s scalar');
  let parity = response.recovery_id;
  if (s > SECP256K1_ORDER / 2n) { s = SECP256K1_ORDER - s; parity ^= 1; }
  const signature: HyperliquidSignature = { r: toHex(point.x, { size: 32 }), s: toHex(s, { size: 32 }), v: parity === 0 ? 27 : 28 };
  validateSignature(signature); return signature;
}
