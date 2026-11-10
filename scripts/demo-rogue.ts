import assert from 'node:assert/strict';
import { BASE, LocalSandbox } from '@counterweight/local-sandbox';

export interface RogueAttempt { name: string; error: string; rejected: true; explanation: string }
/** Uses the compromised configured keeper, not merely an unauthorized identity. */
export async function runRogueAttempts(local: LocalSandbox, assetIndex: number, priceMicro: string,
  completed: { id: string; nonce: number }, emit: (line: string) => void) {
  const attempts: RogueAttempt[] = [];
  const order = (size: string, reduce: boolean, mark: string | null) => ({ order: {
    asset_index: assetIndex, size, reduce_only: reduce, reference_price: mark,
  } });
  async function reject(name: string, method: string, args: Record<string, unknown>, expected: string, explanation: string,
    actor = local.keeper) {
    const before = await local.state();
    const result = await local.call(actor, method, args);
    assert(result.failed, `${name} unexpectedly accepted`);
    const message = result.receiptFailureMessages.join(' ');
    assert(message.includes(expected), `${name}: expected ${expected}; received ${message}`);
    const after = await local.state();
    assert.deepEqual(after, before, `${name} mutated policy state`);
    attempts.push({ name, error: expected, rejected: true, explanation });
    emit(`ROGUE ${name.padEnd(23)} REJECT ${expected}`);
  }
  // Keep the mark fresh for cap/price-override tests; only advance for the stale test.
  await reject('increase beyond caps', 'request_order_signature', order((100n * BASE).toString(), false, null),
    'ERR_EXCEEDS_SPOT_HEDGE', 'Configured keeper exceeds inventory backing.');
  await reject('non-reduce close', 'request_order_signature', order((BASE / 10n).toString(), false, priceMicro),
    'ERR_OPEN_PRICE_OVERRIDE', 'Attempt to convert a mark-bearing close into a non-reduce open; bounded ordinary opens remain allowed.');
  await reject('withdraw to rogue', 'request_evm_withdrawal', { recipient: '0x2222222222222222222222222222222222222222', amount: '1000000' },
    'ERR_CALLER_NOT_OWNER', 'Keeper cannot withdraw or replace the owner-fixed recipient.');
  await reject('approveAgent', 'approveAgent', { agentAddress: '0x2222222222222222222222222222222222222222' },
    'MethodNotFound', 'No approveAgent export exists in the deployed Wasm.');
  await reject('replayed nonce/callback', 'on_signature', { operation_id: completed.id, nonce: completed.nonce },
    'Method on_signature is private', 'Replays an old completed operation/nonce at the private callback; callers cannot select signing nonces.');
  const state = await local.state();
  await local.advancePast(Number(state.reference_price_timestamp) * 1000 + 121_000);
  await reject('stale price', 'request_order_signature', order((BASE / 10n).toString(), false, null),
    'ERR_STALE_PRICE', 'Opening with an expired owner reference price fails; reduce-only recovery deliberately remains available.');
  await reject('unrelated rogue account', 'request_order_signature', order((BASE / 10n).toString(), true, priceMicro),
    'ERR_CALLER_NOT_KEEPER', 'Distinct local rogue identity cannot impersonate the configured keeper.', local.rogue);
  return attempts;
}
