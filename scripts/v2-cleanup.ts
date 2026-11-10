import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { deriveTestnetAddress } from '../packages/hyperliquid/src/index.js';
import { info, BASE } from './lifecycle-config.js';
import { parseAccount } from './lifecycle-parsing.js';
import { callCommand } from './testnet-plan.js';
import { committedWasm, NEXT_POLICY, OWNER, PATH, parseOptions, publicCli, rpc, stateAt } from './testnet-common.js';
import { checkKeys, policyStateSchema } from './testnet-verify.js';

export const CLEANUP_AFTER_MS = 1794504663419;
const AMOUNT = (4n * BASE).toString();
const withdrawalSchema = z.object({ nonce: z.literal('1794331863418'), amount: z.literal('47957074') });
const cleanupStep = z.enum(['pause', 'expire', 'abandon', 'withdraw-spot', 'status']);
type Step = z.infer<typeof cleanupStep>;
const uint = z.string().regex(/^\d+$/);
export interface CleanupSnapshot {
  blockTimeMs: number; state: unknown; rebalance: unknown; keys: unknown;
  token: string; ownerToken: string; account: unknown; openOrders: unknown;
}
export function cleanupPlan(step: Step, snapshot: CleanupSnapshot) {
  const state = policyStateSchema.parse(snapshot.state);
  const r = z.object({ route: z.null(), withdrawal: withdrawalSchema.nullable(),
    limits: z.object({ max_fee_usdc: z.literal('1') }) }).parse(snapshot.rebalance);
  const account = parseAccount(snapshot.account);
  const orders = z.array(z.unknown()).parse(snapshot.openOrders);
  const outstanding = z.array(z.object({ nonce: z.number().int(), expires_after: z.number().int() })).parse(state.outstanding);
  if (!checkKeys(snapshot.keys).ok || state.signed_short_size !== '0' || state.pending !== null
    || account.signedSize !== 0 || account.otherPositions.length || orders.length)
    throw new Error('Policy cleanup requires keyless, flat, idle policy and venue');
  if (uint.parse(snapshot.token) !== state.spot_balance || ![AMOUNT, '0'].includes(state.spot_balance))
    throw new Error('Policy cleanup spot custody differs from the reviewed 4 wNEAR or completed zero balance');
  uint.parse(snapshot.ownerToken);
  for (const a of outstanding) {
    const expiry = a.nonce === 1794331472735 ? 1794504272736 : a.nonce === 1794331863418 ? CLEANUP_AFTER_MS : undefined;
    if (expiry === undefined || a.expires_after !== expiry) throw new Error('Policy cleanup unexpected outstanding authorization; regenerate plan');
  }
  const finished = state.spot_balance === '0' && r.withdrawal === null && outstanding.length === 0 && state.paused;
  const earliestAllowedMs = step === 'pause' || step === 'status' ? null : CLEANUP_AFTER_MS + 1;
  const reasons: string[] = [];
  if (step !== 'status' && step !== 'pause' && snapshot.blockTimeMs <= CLEANUP_AFTER_MS) reasons.push('Wait for final NEAR block time strictly after the full replay horizon');
  if (step !== 'status' && step !== 'pause' && !state.paused) reasons.push('Run pause and verify paused=true first');
  if (step === 'abandon' && outstanding.length) reasons.push('Run expire and verify outstanding=[] first');
  if (step === 'abandon' && r.withdrawal === null) reasons.push('Withdrawal reservation is already cleared');
  if (step === 'withdraw-spot' && (outstanding.length || r.withdrawal !== null)) reasons.push('Run expire then abandon and verify both reservations cleared first');
  if (step !== 'status' && state.spot_balance !== AMOUNT) reasons.push('Spot already returned; inspect final token receipt');
  const commands = step === 'status' ? [] : step === 'withdraw-spot' ? [
    callCommand('storage_deposit', { account_id: OWNER, registration_only: true }, OWNER, '30 Tgas', '0.01 NEAR', 'wrap.testnet'),
    callCommand('withdraw_spot', { recipient: OWNER, amount: AMOUNT }, OWNER, '100 Tgas', '1 yoctoNEAR', NEXT_POLICY),
  ] : [callCommand(step === 'pause' ? 'set_paused' : step === 'expire' ? 'expire_pending_signature' : 'abandon_margin_withdrawal',
    step === 'pause' ? { paused: true } : {}, OWNER, '30 Tgas', '0 NEAR', NEXT_POLICY)];
  return { step, earliestAllowedMs, earliestAllowedUtc: earliestAllowedMs === null ? 'now (after flat/idle checks)' : new Date(earliestAllowedMs).toISOString(),
    recommendedUtc: earliestAllowedMs === null ? null : '2026-11-12T17:31:04.000Z', ready: reasons.length === 0, reasons, commands,
    verified: { paused: state.paused, expired: outstanding.length === 0, abandoned: r.withdrawal === null, spotReturned: finished },
    note: 'Commands only; never signs or sends. Pause uses 30 Tgas without MPC invalidation. Expiry/abandonment creates no margin credit and asserts no bridge arrival.' };
}
async function view(method: string, args: unknown, account: string, block: string) {
  const result = z.object({ block_hash: z.literal(block), result: z.array(z.number().int().min(0).max(255)) }).parse(await rpc('query', {
    request_type: 'call_function', account_id: account, method_name: method, args_base64: Buffer.from(JSON.stringify(args)).toString('base64'), block_id: block,
  }));
  return JSON.parse(Buffer.from(result.result).toString('utf8')) as unknown;
}
export async function cleanup(argv: string[]) {
  const options = parseOptions(argv, ['step']);
  const step = cleanupStep.parse(options.step);
  const block = z.object({ header: z.object({ hash: z.string(), timestamp_nanosec: uint }) }).parse(await rpc('block', { finality: 'final' })).header;
  const [artifact, derived] = await Promise.all([committedWasm(), deriveTestnetAddress(NEXT_POLICY, PATH)]);
  const [state, rebalance, keys, token, ownerToken, account, openOrders, code] = await Promise.all([
    stateAt(block.hash, NEXT_POLICY), view('get_rebalance', {}, NEXT_POLICY, block.hash),
    rpc('query', { request_type: 'view_access_key_list', account_id: NEXT_POLICY, block_id: block.hash }),
    view('ft_balance_of', { account_id: NEXT_POLICY }, 'wrap.testnet', block.hash),
    view('ft_balance_of', { account_id: OWNER }, 'wrap.testnet', block.hash),
    info({ type: 'clearinghouseState', user: derived.address }), info({ type: 'openOrders', user: derived.address }),
    rpc('query', { request_type: 'view_account', account_id: NEXT_POLICY, block_id: block.hash }),
  ]);
  z.object({ block_hash: z.literal(block.hash), code_hash: z.literal(artifact.codeHash) }).parse(code);
  z.object({ block_hash: z.literal(block.hash) }).parse(keys);
  const snapshot: CleanupSnapshot = { blockTimeMs: Number(BigInt(block.timestamp_nanosec) / 1_000_000n), state, rebalance, keys,
    token: uint.parse(token), ownerToken: uint.parse(ownerToken), account, openOrders };
  const plan = cleanupPlan(step, snapshot);
  // Keep the first pre-withdraw snapshot for an exact owner balance-delta recheck.
  const baselineFile = 'docs/evidence/v2-cleanup-withdraw-before.json';
  if (step === 'withdraw-spot' && plan.ready) {
    try { await writeFile(baselineFile, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' }); }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; }
  }
  let ownerIncreaseVerified: boolean | null = null;
  if (plan.verified.spotReturned) {
    try {
      const before = JSON.parse(await readFile(baselineFile, 'utf8')) as CleanupSnapshot;
      ownerIncreaseVerified = BigInt(snapshot.ownerToken) - BigInt(uint.parse(before.ownerToken)) === BigInt(AMOUNT);
    } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
  }
  console.log(JSON.stringify({ account: NEXT_POLICY, derived, block, ...plan, ownerIncreaseVerified, snapshot }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => cleanup(process.argv.slice(2)));
