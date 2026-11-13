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
  expect(settlement.result).toContain('Owner settled after open expiry');
  const post = evidence(settlement.evidence);
  expect(post.source).toBe('reports/keeper-run/2026-11-12T17-38-58-147Z-c3b1b13b.jsonl');
  expect(post.sourceLine).toBe(16);
  expect(post.finality).toBe('final');
  expect(post.settlementTx).toBe(settlement.tx);
  expect(post.policyState.block).toBe('6PtEDXrjezjp5oCNcyZV4okL4LJwtBoV2Q98JLFkF3oi');
  expect(post.policyState.state).toMatchObject({ signed_short_size: '0', pending: null, spot_balance: '4000000000000000000000000' });
  expect(post.policyState.keyless).toBe(true);
  expect(Date.parse(post.timestamp)).toBeGreaterThan(status.before.observedAtMs);
  // The archived extract must retain the original journal's policy read exactly.
  const journal = JSON.parse(readFileSync(new URL(`../${post.source}`, import.meta.url), 'utf8').split('\n')[post.sourceLine - 1]!);
  expect(post.policyState).toEqual(journal.policyState);
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


it('binds the v2 destination arrival summary to the supplied public Arbitrum Sepolia receipt', () => {
  const summary = evidence('2026-11-10-lifecycle-summary.json');
  const receipt = evidence('2026-11-13-v2-arrival-arbitrum-sepolia.json');
  expect(receipt.checkedAtUtc).toBe('2026-11-13');
  expect(receipt.chain).toBe('Arbitrum Sepolia (chainId 421614)');
  expect(receipt.transfer).toEqual({
    transactionHash: summary.withdrawalHash, blockNumber: 327938892,
    from: '0x08cfc1b6b2dcf36a1480b99353a354aa8ac56f89', amountRaw: '46957074', amountUsdc: '46.957074',
  });
  expect(receipt.recipient).toBe(summary.recipient);
  expect(receipt.recipientBalanceRaw).toBe('46957074');
  expect(receipt.token).toBe('0x1baAbB04529D43a73232B713C0FE471f7c7334d5 (Hyperliquid testnet USDC)');
  expect(summary.arrival).toMatchObject({ status: 'arrived on Arbitrum Sepolia',
    amountUsdc: receipt.transfer.amountUsdc, amountRaw: receipt.transfer.amountRaw,
    recipientBalanceRaw: receipt.recipientBalanceRaw, blockNumber: receipt.transfer.blockNumber,
    checkedAtUtc: receipt.checkedAtUtc, explorer: receipt.explorer,
    evidence: '2026-11-13-v2-arrival-arbitrum-sepolia.json' });
  expect(receipt.explorer).toBe(`https://sepolia.arbiscan.io/tx/${summary.withdrawalHash}`);
});
