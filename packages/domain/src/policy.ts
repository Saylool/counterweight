/** Integer mirror of contracts/policy. USD micro-units, NEAR yocto-units. */
export const BASE = 10n ** 24n;
export const ceilDiv = (n: bigint, d: bigint) => (n + d - 1n) / d;
export interface PolicyScenario {
  action: 'open' | 'reduce' | 'withdraw' | 'health'; size: string; short: string; spot: string;
  price: string; equity: string; reserve: string; maxShort: string; perOrder: string; perDay: string;
  used: string; elapsed: number; cooldown: number; band: number; minHeadroom: number;
  withdrawable: string; withdrawalCap: string; withdrawalDayCap: string; withdrawalUsed: string;
}
export function policyDecision(x: PolicyScenario): boolean {
  const n = (q: bigint) => ceilDiv(q * ceilDiv(BigInt(x.price) * BigInt(10000 + x.band), 10000n), BASE);
  const size = BigInt(x.size), short = BigInt(x.short), equity = BigInt(x.equity), reserve = BigInt(x.reserve);
  const healthy = (q: bigint, e: bigint) => e >= 1000000n && e >= reserve + n(q) + ceilDiv(n(q) * BigInt(x.minHeadroom), 10000n);
  if (x.action === 'health') return healthy(short, equity);
  if (size <= 0n) return false;
  if (x.action === 'reduce') return size <= (short > BigInt(x.maxShort) ? short : BigInt(x.maxShort)); // reduce-only is enforced by the venue; no margin is released on signature.
  if (x.action === 'withdraw') return short === 0n && size <= BigInt(x.withdrawable) &&
    size <= BigInt(x.withdrawalCap) && size + BigInt(x.withdrawalUsed) <= BigInt(x.withdrawalDayCap) &&
    equity >= size && healthy(short, equity - size);
  return short + size <= BigInt(x.spot) && short + size <= BigInt(x.maxShort) &&
    n(size) <= BigInt(x.perOrder) && n(size) + BigInt(x.used) <= BigInt(x.perDay) &&
    x.elapsed >= x.cooldown && healthy(short + size, equity);
}

export function policyUpperNotional(quantityNear: number, priceUsd: number, band = 100): number {
  const quantity = BigInt(Math.round(quantityNear * 1e6)) * 10n ** 18n;
  const price = BigInt(Math.round(priceUsd * 1e6));
  return Number(ceilDiv(quantity * ceilDiv(price * BigInt(10000 + band), 10000n), BASE)) / 1e6;
}
