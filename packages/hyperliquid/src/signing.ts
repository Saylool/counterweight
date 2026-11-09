import { encode } from '@msgpack/msgpack';
import { z } from 'zod';
import { concat, hashTypedData, hexToBytes, keccak256, toHex, zeroAddress, type Hex } from 'viem';

export type Network = 'testnet' | 'mainnet';
export interface OrderWire {
  a: number; b: boolean; p: string; s: string; r: boolean;
  t: { limit: { tif: 'Alo' | 'Ioc' | 'Gtc' } } | { trigger: { isMarket: boolean; triggerPx: string; tpsl: 'tp' | 'sl' } };
  c?: Hex;
}
export type L1Action = { type: 'order'; orders: OrderWire[]; grouping: 'na' | 'normalTpsl' | 'positionTpsl' }
  | { type: 'cancel'; cancels: { a: number; o: number }[] }
  | { type: 'cancelByCloid'; cancels: { asset: number; cloid: Hex }[] };
export type UserAction = { type: 'approveAgent'; agentAddress: Hex; agentName: string; nonce: number }
  | { type: 'withdraw3' | 'usdSend'; destination: string; amount: string; time: number };
export interface L1Input { scheme: 'l1'; network: Network; action: L1Action; nonce: number; vaultAddress?: Hex; expiresAfter?: number }
export interface UserInput { scheme: 'user'; network: Network; action: UserAction }
export type SigningInput = L1Input | UserInput;
export interface HyperliquidSignature { r: Hex; s: Hex; v: 27 | 28 }
export interface ExchangeRequest {
  action: L1Action | (UserAction & { signatureChainId: '0x66eee'; hyperliquidChain: 'Mainnet' | 'Testnet' });
  nonce: number; signature: HyperliquidSignature; vaultAddress?: Hex; expiresAfter?: number;
}
const uint = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const decimal = z.string().regex(/^(0|[1-9]\d*)(\.\d+)?$/);
const cloid = z.string().regex(/^0x[0-9a-fA-F]{32}$/);
const l1Schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('order'), orders: z.array(z.object({ a: uint, b: z.boolean(), p: decimal, s: decimal, r: z.boolean(), t: z.union([
    z.object({ limit: z.object({ tif: z.enum(['Alo', 'Ioc', 'Gtc']) }).strict() }).strict(),
    z.object({ trigger: z.object({ isMarket: z.boolean(), triggerPx: decimal, tpsl: z.enum(['tp', 'sl']) }).strict() }).strict(),
  ]), c: cloid.optional() }).strict()).min(1), grouping: z.enum(['na', 'normalTpsl', 'positionTpsl']) }).strict(),
  z.object({ type: z.literal('cancel'), cancels: z.array(z.object({ a: uint, o: uint }).strict()).min(1) }).strict(),
  z.object({ type: z.literal('cancelByCloid'), cancels: z.array(z.object({ asset: uint, cloid }).strict()).min(1) }).strict(),
]);
const userSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('approveAgent'), agentAddress: address, agentName: z.string(), nonce: uint }).strict(),
  z.object({ type: z.literal('withdraw3'), destination: address, amount: decimal, time: uint }).strict(),
  z.object({ type: z.literal('usdSend'), destination: address, amount: decimal, time: uint }).strict(),
]);
const domain = { name: 'Exchange', version: '1', chainId: 1337, verifyingContract: zeroAddress } as const;
const transferTypes = [
  { name: 'hyperliquidChain', type: 'string' }, { name: 'destination', type: 'string' },
  { name: 'amount', type: 'string' }, { name: 'time', type: 'uint64' },
] as const;
const agentTypes = [
  { name: 'hyperliquidChain', type: 'string' }, { name: 'agentAddress', type: 'address' },
  { name: 'agentName', type: 'string' }, { name: 'nonce', type: 'uint64' },
] as const;
function checkNetwork(network: Network): void { z.enum(['testnet', 'mainnet']).parse(network); }
function u64(value: number): Hex { uint.parse(value); return toHex(BigInt(value), { size: 8 }); }

/** Field insertion order is signing data. Validates without reordering the supplied wire object. */
export function actionHash(action: L1Action, nonce: number, vaultAddress?: Hex, expiresAfter?: number): Hex {
  l1Schema.parse(action);
  if (vaultAddress !== undefined) address.parse(vaultAddress);
  return keccak256(concat([
    toHex(encode(action)), u64(nonce), vaultAddress === undefined ? '0x00' : concat(['0x01', vaultAddress]),
    ...(expiresAfter === undefined ? [] : [concat(['0x00', u64(expiresAfter)])]),
  ]));
}
export function userActionForNetwork(action: UserAction, network: Network) {
  checkNetwork(network); userSchema.parse(action);
  return { ...action, signatureChainId: '0x66eee' as const, hyperliquidChain: network === 'mainnet' ? 'Mainnet' as const : 'Testnet' as const };
}
/** SDK EIP-712 digest, never personal_sign / EIP-191 text-message hashing. */
export function getSigningDigest(input: SigningInput): Hex {
  checkNetwork(input.network);
  if (input.scheme === 'l1') {
    return hashTypedData({ domain, types: { Agent: [
      { name: 'source', type: 'string' }, { name: 'connectionId', type: 'bytes32' },
    ] }, primaryType: 'Agent', message: {
      source: input.network === 'mainnet' ? 'a' : 'b',
      connectionId: actionHash(input.action, input.nonce, input.vaultAddress, input.expiresAfter),
    } });
  }
  const action = userActionForNetwork(input.action, input.network);
  const primaryType = action.type === 'approveAgent' ? 'HyperliquidTransaction:ApproveAgent'
    : action.type === 'withdraw3' ? 'HyperliquidTransaction:Withdraw' : 'HyperliquidTransaction:UsdSend';
  return hashTypedData({ domain: { ...domain, name: 'HyperliquidSignTransaction', chainId: 421614 },
    types: { [primaryType]: action.type === 'approveAgent' ? agentTypes : transferTypes }, primaryType, message: action });
}
export function digestToSign(input: SigningInput): Uint8Array { return hexToBytes(getSigningDigest(input)); }

export const SECP256K1_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
/** Require low-s Ethereum scalars; MPC conversion normalizes high-s with a recovery parity flip. */
export function validateSignature(signature: HyperliquidSignature): void {
  for (const value of [signature.r, signature.s]) z.string().regex(/^0x[0-9a-fA-F]{64}$/).parse(value);
  if (BigInt(signature.r) <= 0n || BigInt(signature.r) >= SECP256K1_ORDER || BigInt(signature.s) <= 0n || BigInt(signature.s) > SECP256K1_ORDER / 2n)
    throw new Error('Invalid r/s scalar (s must be low)');
  if (signature.v !== 27 && signature.v !== 28) throw new Error('v must be 27 or 28');
}
export function assembleRequest(input: SigningInput, signature: HyperliquidSignature): ExchangeRequest {
  getSigningDigest(input); validateSignature(signature);
  if (input.scheme === 'user') return { action: userActionForNetwork(input.action, input.network),
    nonce: input.action.type === 'approveAgent' ? input.action.nonce : input.action.time, signature: { ...signature } };
  return { action: structuredClone(input.action), nonce: input.nonce, signature: { ...signature },
    ...(input.vaultAddress === undefined ? {} : { vaultAddress: input.vaultAddress }),
    ...(input.expiresAfter === undefined ? {} : { expiresAfter: input.expiresAfter }) };
}
