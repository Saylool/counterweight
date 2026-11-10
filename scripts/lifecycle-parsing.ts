import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { getSigningDigest, mpcToHyperliquidSignature, type SigningInput } from '../packages/hyperliquid/src/index.js';
import { txHash } from './testnet-common.js';
import { numeric, positive, units } from './lifecycle-config.js';

const uint = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const decUint = z.string().regex(/^\d+$/).transform(Number).pipe(uint);
export const hashSchema = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
export function parseAccount(raw: unknown) {
  const result = z.object({ marginSummary: z.object({ accountValue: numeric, totalMarginUsed: numeric }), withdrawable: numeric,
    assetPositions: z.array(z.object({ position: z.object({ coin: z.string(), szi: numeric, positionValue: numeric,
      marginUsed: numeric, cumFunding: z.object({ allTime: numeric, sinceOpen: numeric, sinceChange: numeric }) }) })) }).parse(raw);
  const near = result.assetPositions.filter(p => p.position.coin === 'NEAR');
  if (near.length > 1) throw new Error('Hyperliquid duplicate NEAR position');
  return { equityText: result.marginSummary.accountValue, equity: Number(result.marginSummary.accountValue), marginUsed: Number(result.marginSummary.totalMarginUsed),
    withdrawable: Number(result.withdrawable), signedSize: Number(near[0]?.position.szi ?? '0'),
    signedSizeText: near[0]?.position.szi ?? '0', funding: near[0]?.position.cumFunding ?? null,
    otherPositions: result.assetPositions.filter(p => p.position.coin !== 'NEAR' && Number(p.position.szi) !== 0) };
}
export const fillSchema = z.object({ coin: z.string(), oid: uint, time: uint, hash: hashSchema,
  side: z.enum(['A', 'B']), sz: positive, px: positive, fee: numeric, closedPnl: numeric });
export function parseFills(raw: unknown) { return z.array(fillSchema).parse(raw); }
export function parseOrderResponse(raw: unknown) {
  return z.object({ status: z.literal('ok'), response: z.object({ type: z.literal('order'), data: z.object({
    statuses: z.array(z.object({ filled: z.object({ totalSz: positive, avgPx: positive, oid: uint }) }).strict()).length(1),
  }) }) }).parse(raw).response.data.statuses[0]!.filled;
}
export function verifyFill(raw: unknown, fillsRaw: unknown, before: ReturnType<typeof parseAccount>, after: ReturnType<typeof parseAccount>,
  size: string, reduceOnly: boolean, nonce: number) {
  const filled = parseOrderResponse(raw);
  const fills = parseFills(fillsRaw).filter(f => f.oid === filled.oid && f.coin === 'NEAR' && f.time >= nonce && f.side === (reduceOnly ? 'B' : 'A'));
  const total = fills.reduce((sum, f) => sum + units(f.sz, 24), 0n);
  const actual = units(filled.totalSz, 24), wanted = units(size, 24);
  if (actual > wanted || actual === 0n || total !== actual) throw new Error('Hyperliquid fill size/order/side/time not verified');
  const delta = Number(filled.totalSz) * (reduceOnly ? 1 : -1);
  if (Math.abs(after.signedSize - before.signedSize - delta) > 1e-8) throw new Error('Hyperliquid position delta does not match fills');
  if (reduceOnly && (after.signedSize > 0 || Math.abs(after.signedSize) >= Math.abs(before.signedSize))) throw new Error('Hyperliquid close did not reduce the short');
  return { filled, fills, fullFill: actual === wanted, flat: after.signedSize === 0 };
}
// Testnet withdraw3 debits the signed gross amount; ledger usdc is net of the fee.
// The public ledger nonce is in microseconds; the signed action time is milliseconds.
export const WITHDRAWAL_WINDOW_MS = 86_400_000;
export function parseWithdrawal(raw: unknown, ledgerRaw: unknown, amount: string, nonce: number) {
  z.object({ status: z.literal('ok'), response: z.object({ type: z.literal('default') }) }).parse(raw);
  uint.parse(nonce);
  const ledger = z.array(z.object({ time: uint, hash: hashSchema, delta: z.object({ type: z.string(),
    usdc: numeric.optional(), fee: numeric.optional(), nonce: uint.optional() }).passthrough() })).parse(ledgerRaw);
  const gross = units(amount, 6);
  const entries = ledger.filter(l => {
    if (l.time < nonce || l.time > nonce + WITHDRAWAL_WINDOW_MS || l.delta.type !== 'withdraw' || l.delta.usdc === undefined) return false;
    if (l.delta.nonce !== undefined && BigInt(l.delta.nonce) !== BigInt(nonce) * 1000n) return false;
    // Older minimal ledger shapes omit fee/nonce: use the documented 1 USDC testnet
    // fee, exact micro-units and a unique bounded-time match. Never guess a hash:
    // the Hyperliquid ledger hash is not the NEAR tx hash or signing digest.
    return units(l.delta.usdc, 6) + units(l.delta.fee ?? '1', 6) === gross;
  });
  if (entries.length !== 1) throw new Error('Hyperliquid withdrawal not yet verified in public ledger; do not resubmit signature');
  return entries[0]!;
}
export function spotUsdc(raw: unknown) {
  const balances = z.object({ balances: z.array(z.object({ coin: z.string(), total: numeric.refine(s => Number(s) >= 0), hold: numeric })) }).parse(raw).balances;
  const usdc = balances.filter(b => b.coin === 'USDC');
  if (usdc.length > 1) throw new Error('Hyperliquid duplicate spot USDC');
  return { total: units(usdc[0]?.total ?? '0', 6), hold: units(usdc[0]?.hold ?? '0', 6) };
}
export function verifyClassTransfer(raw: unknown, beforeSpot: unknown, afterSpot: unknown,
  before: ReturnType<typeof parseAccount>, after: ReturnType<typeof parseAccount>, amount: string) {
  z.object({ status: z.literal('ok'), response: z.object({ type: z.literal('default') }) }).parse(raw);
  const wanted = units(amount, 6), old = spotUsdc(beforeSpot), current = spotUsdc(afterSpot);
  if (old.total - current.total !== wanted || units(after.equityText, 6) - units(before.equityText, 6) !== wanted
    || before.signedSize !== 0 || after.signedSize !== 0 || before.otherPositions.length || after.otherPositions.length)
    throw new Error('Hyperliquid spot/perps transfer balance deltas not yet verified; do not resubmit signature');
  return { amount, spotBefore: old.total.toString(), spotAfter: current.total.toString(), perpsBefore: before.equity, perpsAfter: after.equity };
}
export interface ExpectedCall { method: 'request_order_signature' | 'request_evm_withdrawal' | 'request_usd_class_transfer'; args: Record<string, unknown>; caller: string;
  policy: string; asset: number; reduceOnly: boolean; size: string; price: string; recipient: string; amount: string }
/** Require successful final callback, exact caller/ABI args, unique policy events and matching digest. */
export function parseLifecycleReceipt(raw: unknown, hash: string, expected: ExpectedCall) {
  const receipt = z.object({ id: z.string(), block_hash: z.string(), outcome: z.object({ executor_id: z.string(),
    status: z.record(z.string(), z.unknown()), logs: z.array(z.string()) }) });
  const tx = z.object({ final_execution_status: z.literal('FINAL'), status: z.object({ SuccessValue: z.literal('dHJ1ZQ==') }).strict(),
    transaction: z.object({ hash: z.literal(txHash(hash)), signer_id: z.literal(expected.caller), receiver_id: z.literal(expected.policy),
      actions: z.array(z.object({ FunctionCall: z.object({ method_name: z.literal(expected.method), args: z.string(), deposit: z.literal('0') }) }).strict()).length(1) }),
    receipts_outcome: z.array(receipt) }).parse(raw);
  const args = JSON.parse(Buffer.from(tx.transaction.actions[0]!.FunctionCall.args, 'base64').toString('utf8'));
  if (!isDeepStrictEqual(args, expected.args)) throw new Error('Contract lifecycle ABI arguments mismatch');
  const events = tx.receipts_outcome.filter(r => r.outcome.executor_id === expected.policy && !('Failure' in r.outcome.status))
    .flatMap(r => r.outcome.logs.filter(l => l.startsWith('EVENT_JSON:')).map(l => ({ receipt: r,
      event: z.object({ standard: z.literal('counterweight'), version: z.literal('1.0.0'), event: z.string(),
        data: z.array(z.unknown()).length(1) }).parse(JSON.parse(l.slice(11))) })));
  const requests = events.filter(e => e.event.event === 'request'), signatures = events.filter(e => e.event.event === 'signature');
  if (requests.length !== 1 || signatures.length !== 1) throw new Error('Contract needs one request and one signature');
  const req = z.object({ id: decUint, caller: z.literal(expected.caller), kind: z.literal(expected.method === 'request_usd_class_transfer' ? 'UsdClassTransfer' : expected.method === 'request_evm_withdrawal' ? 'EvmWithdrawal' : expected.reduceOnly ? 'Reduce' : 'Increase'),
    digest: z.string().regex(/^[0-9a-f]{64}$/), payload: z.object({ action: z.unknown(), nonce: uint, expiresAfter: uint.nullable().optional() }).strict() }).parse(requests[0]!.event.data[0]);
  const sig = z.object({ id: decUint, nonce: decUint, expiresAfter: decUint.nullable(), signature: z.unknown() }).parse(signatures[0]!.event.data[0]);
  if (req.id !== sig.id || req.payload.nonce !== sig.nonce || (req.payload.expiresAfter ?? null) !== sig.expiresAfter ||
    signatures[0]!.receipt.outcome.status.SuccessValue !== 'dHJ1ZQ==') throw new Error('Contract callback operation/nonce/expiry mismatch');
  let input: SigningInput;
  if (expected.method === 'request_order_signature') {
    const action = z.object({ type: z.literal('order'), grouping: z.literal('na'), orders: z.array(z.object({
      a: z.literal(expected.asset), b: z.literal(expected.reduceOnly), r: z.literal(expected.reduceOnly),
      p: z.literal(expected.price), s: z.literal(expected.size), t: z.object({ limit: z.object({ tif: z.literal('Ioc') }).strict() }).strict(),
    }).strict()).length(1) }).strict().parse(req.payload.action);
    const expiry = uint.parse(req.payload.expiresAfter);
    if (expiry <= req.payload.nonce || expiry - req.payload.nonce > 60000) throw new Error('Contract order expiry exceeds 60s');
    input = { scheme: 'l1', network: 'testnet', action, nonce: req.payload.nonce, expiresAfter: expiry };
  } else if (expected.method === 'request_usd_class_transfer') {
    const action = z.object({ type: z.literal('usdClassTransfer'), amount: z.literal(expected.amount), toPerp: z.literal(true),
      nonce: z.literal(req.payload.nonce), hyperliquidChain: z.literal('Testnet'), signatureChainId: z.literal('0x66eee') }).strict().parse(req.payload.action);
    if (req.payload.expiresAfter != null) throw new Error('Contract usdClassTransfer must not have expiresAfter');
    input = { scheme: 'user', network: 'testnet', action: { type: 'usdClassTransfer', amount: action.amount, toPerp: action.toPerp, nonce: action.nonce } };
  } else {
    const action = z.object({ type: z.literal('withdraw3'), destination: z.literal(expected.recipient), amount: z.literal(expected.amount),
      time: z.literal(req.payload.nonce), hyperliquidChain: z.literal('Testnet'), signatureChainId: z.literal('0x66eee') }).strict().parse(req.payload.action);
    if (req.payload.expiresAfter != null) throw new Error('Contract withdraw3 must not have expiresAfter');
    input = { scheme: 'user', network: 'testnet', action: { type: 'withdraw3', destination: action.destination, amount: action.amount, time: action.time } };
  }
  const digest = getSigningDigest(input);
  if (digest.slice(2) !== req.digest) throw new Error('Contract lifecycle digest mismatch');
  return { input, digest, signature: mpcToHyperliquidSignature(sig.signature),
    blocks: [...new Set([requests[0]!.receipt.block_hash, signatures[0]!.receipt.block_hash])], nonce: req.payload.nonce };
}
