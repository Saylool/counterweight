import { beforeAll, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadMarket, type MarketDataset } from '../apps/keeper/src/market.js';
import { prepareLocalReplay, replayRisk } from '../apps/keeper/src/local-replay.js';
import { verifyHash, POLICY_SHA256, MOCK_SHA256 } from '@counterweight/local-sandbox';

let data: MarketDataset;
beforeAll(async () => { data = await loadMarket(fileURLToPath(new URL('../fixtures/market/', import.meta.url))); });
describe('local demo real squeeze and build provenance', () => {
  it('checks the actual default policy and labelled mock artifacts and rejects tampering', async () => {
    const policy = await readFile(new URL('../contracts/policy/artifacts/counterweight_policy.wasm', import.meta.url));
    const mock = Buffer.from(await readFile(new URL('../packages/local-sandbox/artifacts/mock-mpc.wasm.base64', import.meta.url), 'utf8'), 'base64');
    expect(verifyHash(policy, POLICY_SHA256, 'policy')).toBe(POLICY_SHA256);
    expect(verifyHash(mock, MOCK_SHA256, 'mock')).toBe(MOCK_SHA256);
    const corrupt = Buffer.from(policy); corrupt[50] = corrupt[50]! ^ 1;
    expect(() => verifyHash(corrupt, POLICY_SHA256, 'policy')).toThrow('SHA-256 mismatch');
  });
  it('selects the largest positive rolling 24h move independently over all 4297 endpoints', () => {
    const plan = prepareLocalReplay(data);
    const closes = new Map(data.bars.map(b => [b.end, b.perp.close]));
    const candidates = data.bars.filter(b => b.end - 24 * 3_600_000 >= data.start && b.end <= data.end);
    const maximum = Math.max(...candidates.map(b => (b.perp.close / closes.get(b.end - 24 * 3_600_000)! - 1) * 100));
    expect(plan.selection.perpMovePct).toBe(maximum); expect(plan.selection.candidates).toBe(4297);
    expect(plan.selection.start).toBe(Date.parse('2026-09-17T05:00:00Z'));
    expect(plan.bars).toHaveLength(24); expect(plan.quantityBase).toBe('9300000000000000000000000');
  });
  it('triggers the real risk engine at hour 21 after headroom falls below 10% of short notional', () => {
    const plan = prepareLocalReplay(data);
    let cash = plan.initialMargin - plan.quantity * plan.anchor.perp.close * 0.00095;
    const decisions = plan.bars.map((bar, i) => {
      cash += plan.quantity * bar.perp.open * bar.fundingRate;
      return replayRisk(data, plan, i, plan.quantity, cash);
    });
    const firstClose = decisions.findIndex(d => d.risk.proposals.some(p => p.type === 'full-unwind'));
    expect(firstClose).toBe(20);
    expect(decisions[firstClose]!.risk.metrics.headroom).toBeCloseTo(2.535, 2);
    expect(decisions[firstClose]!.risk.proposals).toContainEqual({ type: 'full-unwind', reduceOnly: true,
      fraction: 1, reason: 'stress-headroom', requiresSpotApproval: true });
    expect(decisions[0]!.risk.metrics.headroom).toBeGreaterThan(decisions[firstClose]!.risk.metrics.headroom);
  });
  it('refuses a fixture gap instead of substituting synthetic data', () => {
    expect(() => prepareLocalReplay({ ...data, gaps: [{ series: 'perp', hourStart: data.start }] })).toThrow('gapped');
  });
});
