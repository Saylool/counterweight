import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CLEANUP_AFTER_MS, cleanupPlan, type CleanupSnapshot } from './v2-cleanup.js';

function snapshot(): CleanupSnapshot {
  const fixture = JSON.parse(readFileSync('docs/evidence/v2-cleanup-preflight.json', 'utf8'));
  return { blockTimeMs: CLEANUP_AFTER_MS + 1, state: fixture.get_state, rebalance: fixture.get_rebalance,
    keys: { block_hash: 'final', keys: [] }, token: '4000000000000000000000000', ownerToken: '1',
    account: { marginSummary: { accountValue: '1', totalMarginUsed: '0' }, withdrawable: '1', assetPositions: [] }, openOrders: [] };
}
function paused() { const s = snapshot(); (s.state as any).paused = true; return s; }
function expired() { const s = paused(); (s.state as any).outstanding = []; return s; }
function abandoned() { const s = expired(); (s.rebalance as any).withdrawal = null; return s; }

describe('reviewed v2 cleanup owner procedure', () => {
  it('prints pause now with 30 Tgas and no MPC/noop request', () => {
    const s = snapshot(); s.blockTimeMs = CLEANUP_AFTER_MS - 86400000;
    const p = cleanupPlan('pause', s);
    expect(p.ready).toBe(true); expect(p.earliestAllowedMs).toBeNull();
    expect(p.commands[0]).toContain('set_paused');
    expect(p.commands[0]).toContain("'30 Tgas'");
    expect(p.commands.join()).not.toMatch(/report_invalidation|reconcile|noop/);
  });
  it.each(['expire', 'abandon', 'withdraw-spot'] as const)('gates %s on finalized time strictly beyond the reviewed horizon', step => {
    const s = abandoned(); s.blockTimeMs = CLEANUP_AFTER_MS;
    const p = cleanupPlan(step, s);
    expect(p.ready).toBe(false); expect(p.earliestAllowedMs).toBe(CLEANUP_AFTER_MS + 1);
    expect(p.recommendedUtc).toBe('2026-11-12T17:31:04.000Z');
  });
  it('prints the exact expire/abandon/token-return sequence and checks prerequisites', () => {
    expect(cleanupPlan('expire', paused())).toMatchObject({ ready: true });
    expect(cleanupPlan('expire', paused()).commands[0]).toContain('expire_pending_signature');
    expect(cleanupPlan('abandon', paused()).ready).toBe(false);
    expect(cleanupPlan('abandon', expired()).commands[0]).toContain('abandon_margin_withdrawal');
    expect(cleanupPlan('withdraw-spot', expired()).ready).toBe(false);
    const p = cleanupPlan('withdraw-spot', abandoned());
    expect(p.ready).toBe(true); expect(p.commands).toHaveLength(2);
    expect(p.commands[0]).toContain('storage_deposit');
    expect(p.commands[1]).toContain('"amount":"4000000000000000000000000"');
    expect(p.commands[1]).toContain("'100 Tgas' attached-deposit '1 yoctoNEAR'");
  });
  it('verifies the post-callback empty state without printing transactions', () => {
    const s = abandoned(); (s.state as any).spot_balance = s.token = '0';
    expect(cleanupPlan('status', s)).toMatchObject({ commands: [], verified: { paused: true, expired: true, abandoned: true, spotReturned: true } });
  });
  it.each(['keys', 'short', 'pending', 'token', 'nonce', 'withdrawal', 'route'] as const)('rejects drift in %s', field => {
    const s = snapshot();
    if (field === 'keys') s.keys = { block_hash: 'final', keys: [{ public_key: 'public', access_key: { permission: 'FullAccess' } }] };
    if (field === 'short') (s.state as any).signed_short_size = '1';
    if (field === 'pending') (s.state as any).pending = {};
    if (field === 'token') s.token = '0';
    if (field === 'nonce') (s.state as any).outstanding[0].nonce++;
    if (field === 'withdrawal') (s.rebalance as any).withdrawal.amount = '1';
    if (field === 'route') (s.rebalance as any).route = {};
    expect(() => cleanupPlan('status', s)).toThrow();
  });
});
