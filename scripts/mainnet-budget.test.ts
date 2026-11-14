import { describe, expect, it } from 'vitest';
import { ALREADY_FUNDED_KEEPER_INCREMENT, assertSignerLiquidity, assertSpendCeiling, gasUpfrontReserve } from './mainnet-budget.js';
const N = 10n ** 24n;
describe('owner total spend guard', () => {
  it('reserves the next transfer and gas below the original 11.20 ceiling', () => {
    expect(() => assertSpendCeiling(119n * N / 10n, 119n * N / 10n, 7n * N, 100_000_000n, 300)).not.toThrow();
    expect(() => assertSpendCeiling(119n * N / 10n, 8n * N / 10n, N / 10n, 100_000_000n, 300)).toThrow('11.20');
    expect(() => assertSpendCeiling(119n * N / 10n, 72n * N / 100n, 0n, 100_000_000n, 300)).toThrow('gas headroom');
  });
  it('separates NEP-642 refundable upfront purchase from eventual burn allowance', () => {
    expect(gasUpfrontReserve(100_000_000n, 300)).toBe(301n * N / 1000n);
    expect(gasUpfrontReserve(100_000_000n, 285)).toBe(286n * N / 1000n);
    expect(() => assertSignerLiquidity(10n * N / 100n, 200, 0n, 0n, 100_000_000n, 285)).toThrow('Signer liquid');
    expect(() => assertSignerLiquidity(68n * N / 100n, 200, 0n, 0n, 100_000_000n, 345)).not.toThrow();
    expect(gasUpfrontReserve(100_000_000n, 285, 2_000_000_000n)).toBe(571n * N / 1000n);
  });
  it('includes only the already-funded 0.60 keeper increment and leaves the frozen budget unchanged', () => {
    const start = 121478n * N / 10000n, current = 44n * N / 10n;
    expect(() => assertSpendCeiling(start, current, 362n * N / 100n, 100_000_000n, 190)).toThrow('11.20');
    expect(() => assertSpendCeiling(start, current, 362n * N / 100n, 100_000_000n, 190, ALREADY_FUNDED_KEEPER_INCREMENT)).not.toThrow();
    expect(() => assertSignerLiquidity(current, 200, 0n, 362n * N / 100n, 100_000_000n, 190)).not.toThrow();
  });
  it('keeps storage locked and scales the purchase reserve up with gas price', () => {
    expect(() => assertSignerLiquidity(286n * N / 1000n, 200, 0n, 0n, 100_000_000n, 285)).toThrow('plus storage');
    expect(() => assertSignerLiquidity(286n * N / 1000n, 200, N, 0n, 100_000_000n, 285)).not.toThrow();
    expect(gasUpfrontReserve(1_000_000_000n, 285)).toBe(571n * N / 1000n);
  });
  it('fits the complete 10–18 owner and keeper schedule after finalized gas refunds', () => {
    const price = 100_000_000n, start = 121478n * N / 10000n;
    let owner = 420n * N / 100n, keeper = 38n * N / 100n;
    // Actual happy-path calls: class transfer; register twice/wrap/deposit;
    // observe open; settle; reference/observe/withdraw; reconcile; return wNEAR.
    const ownerCalls: Array<[number, bigint]> = [[285, 0n], [30, N / 100n], [30, N / 100n], [30, 36n * N / 10n],
      [100, 1n], [30, 0n], [30, 0n], [30, 0n], [30, 0n], [285, 0n], [30, 0n], [80, 1n]];
    for (const [gas, deposit] of ownerCalls) {
      expect(() => assertSignerLiquidity(owner, 200, 0n, deposit, price, gas)).not.toThrow();
      expect(() => assertSpendCeiling(start, owner, deposit, price, gas, ALREADY_FUNDED_KEEPER_INCREMENT)).not.toThrow();
      owner -= deposit + 2n * price * BigInt(gas) * 10n ** 12n + N / 1000n;
    }
    for (const gas of [30, 30, 285, 30, 30, 285]) {
      expect(() => assertSignerLiquidity(keeper, 200, 0n, 0n, price, gas)).not.toThrow();
      keeper -= 2n * price * BigInt(gas) * 10n ** 12n + N / 1000n;
    }
    expect(owner).toBeGreaterThan(start - 118n * N / 10n);
    expect(keeper).toBeGreaterThan(0n);
  });
});
