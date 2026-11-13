import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';

const evidence = (name: string) => JSON.parse(readFileSync(new URL(`../docs/evidence/${name}`, import.meta.url), 'utf8'));

it('binds the v3 lifecycle table to saved keyless order receipts and fills', () => {
  const summary = evidence('2026-11-12-v3-lifecycle-summary.json');
  for (const [step, price, flat] of [
    ['Keeper IOC short', '3.3788', false], ['Keeper reduce-only close', '3.3796', true],
  ] as const) {
    const row = summary.steps.find((r: { step: string }) => r.step === step);
    const relay = evidence(row.evidence);
    expect(row.tx).toBe(relay.txHash);
    expect(summary.address).toBe(relay.derived.address);
    expect(relay.recovered.toLowerCase()).toBe(summary.address);
    expect(relay.verification).toMatchObject({ fullFill: true, flat, filled: { totalSz: '3.6', avgPx: price } });
    expect(row.result).toContain(`3.6 NEAR @ ${price}`);
    expect(relay.checks.length).toBeGreaterThan(0);
    for (const check of relay.checks) expect(check.keys.keys).toEqual([]);
  }
  const settlement = summary.steps.find((r: { step: string }) => r.step === 'Owner settlement');
  const status = evidence('2026-11-12-v3-settle-status.json');
  expect(settlement.tx).toBe('CYFZdHDe7uqAeCceZAvxeBe8YWQQJQEea5oDJ1wz4D93');
  expect(settlement.result).toContain('Owner-reported success after open expiry');
  expect(settlement.result).toContain('current state not re-read');
  expect(status.before.observedAtMs).toBe(1794509677914);
  expect(status.before.openOrders).toEqual([]);
  expect(status.before.account.signedSizeText).toBe('0');
  expect(status.before.observedAtMs).toBeGreaterThan(Number(status.preflight.state.last_open_expiry));
  expect(status.settlementRequired.command).toContain('"short_size":"0","observed_at_ms":"1794509677914"');
  // The command-generation capture predates settlement; do not treat it as post-settlement state.
  expect(status.preflight.state.signed_short_size).toBe('3600000000000000000000000');
  expect(summary.withdrawalHash).toBeNull();
});

it('archives a matching v3 code/key proof and completed v2 custody return', () => {
  const proof = evidence('2026-11-11-v3-proof.json');
  const bytes = readFileSync(new URL('../contracts/policy/artifacts/counterweight_policy_v3.wasm', import.meta.url));
  expect(proof.matches).toBe(true);
  expect(proof.keys.keys).toEqual([]);
  expect(proof.artifact.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
  const status = evidence('2026-11-12-v2-cleanup-status.json');
  const before = evidence('v2-cleanup-withdraw-before.json');
  expect(status.verified).toEqual({ paused: true, expired: true, abandoned: true, spotReturned: true });
  expect(status.ownerIncreaseVerified).toBe(true);
  expect(status.snapshot.state.spot_balance).toBe('0');
  expect(status.snapshot.token).toBe('0');
  expect(status.snapshot.ownerToken).toBe('4000000000000000000000000');
  expect(before.ownerToken).toBe('0');
});
