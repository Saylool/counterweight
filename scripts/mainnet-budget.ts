import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import type { PublicClient } from '../apps/keeper/src/run-io.js';
const BASE = 10n ** 24n;
export const OWNER_BUDGET_FILE = 'docs/evidence/mainnet-owner-v4/budget.json';
// Already authorized and funded by the owner: keeper 0.10 -> 0.70 NEAR. This
// records that finite historical increment; it never authorizes another top-up.
export const ALREADY_FUNDED_KEEPER_INCREMENT = 6n * BASE / 10n;
export const GAS_PURCHASE_PRICE_FLOOR = 1_000_000_000n;
export const TX_BASE_RESERVE = BASE / 1000n;
export function gasUpfrontReserve(gasPrice: bigint, gasTgas: number, minimumPurchasePrice = GAS_PURCHASE_PRICE_FLOOR) {
  if (!Number.isSafeInteger(gasTgas) || gasTgas <= 0 || gasPrice <= 0n || minimumPurchasePrice <= 0n) throw new Error('Invalid gas budget');
  const price = 2n * gasPrice > minimumPurchasePrice ? 2n * gasPrice : minimumPurchasePrice;
  return price * BigInt(gasTgas) * 10n ** 12n + TX_BASE_RESERVE;
}
export function assertSignerLiquidity(balance: bigint, storageUsage: number, locked: bigint, deposit: bigint, gasPrice: bigint, gasTgas: number, minimumPurchasePrice = GAS_PURCHASE_PRICE_FLOOR) {
  const storage = BigInt(storageUsage) * 10n ** 19n;
  const liquidStorage = storage > locked ? storage - locked : 0n;
  const needed = deposit + gasUpfrontReserve(gasPrice, gasTgas, minimumPurchasePrice);
  if (balance - liquidStorage < needed) throw new Error(`Signer liquid balance insufficient: needs ${needed} yoctoNEAR plus storage for ${gasTgas} Tgas prepaid gas; wait for refunds or fund signer before retry`);
}
export function assertSpendCeiling(startingBalance: bigint, currentBalance: bigint, nextDeposit: bigint, gasPrice: bigint, gasTgas: number, alreadyFundedIncrement = 0n) {
  // NEP-642 refunds the purchase/burn-price difference as well as unused gas.
  // Charge the expenditure ceiling against conservative burn cost, separately
  // from the larger temporary gas purchase checked by assertSignerLiquidity.
  const maximumDebit = nextDeposit + 2n * gasPrice * BigInt(gasTgas) * 10n ** 12n + TX_BASE_RESERVE;
  if (currentBalance - maximumDebit < startingBalance - 112n * BASE / 10n - alreadyFundedIncrement)
    throw new Error(`Owner ${alreadyFundedIncrement ? '11.80' : '11.20'} NEAR spend ceiling or gas headroom would be exceeded; STOP`);
}
/** Guard every signer liquidity; bound owner actual expenditure separately. */
export async function checkOwnerSpend(pc: PublicClient, owner: string, signer: string, deposit = 0n, gasTgas = 300) {
  const [current, block, protocol] = await Promise.all([
    pc.rpc('query', { request_type: 'view_account', account_id: signer, finality: 'final' }), pc.rpc('block', { finality: 'final' }),
    pc.rpc('EXPERIMENTAL_protocol_config', { finality: 'final' }),
  ]);
  const balance = z.object({ amount: z.string().regex(/^\d+$/), storage_usage: z.number().int().nonnegative(), locked: z.string().regex(/^\d+$/) }).parse(current);
  const gas = z.object({ header: z.object({ gas_price: z.string().regex(/^\d+$/) }) }).parse(block);
  const config = z.object({ runtime_config: z.object({ min_gas_purchase_price: z.string().regex(/^\d+$/).optional() }).passthrough() }).parse(protocol);
  const configured = BigInt(config.runtime_config.min_gas_purchase_price ?? GAS_PURCHASE_PRICE_FLOOR);
  const minimumPurchasePrice = configured > GAS_PURCHASE_PRICE_FLOOR ? configured : GAS_PURCHASE_PRICE_FLOOR;
  assertSignerLiquidity(BigInt(balance.amount), balance.storage_usage, BigInt(balance.locked), deposit, BigInt(gas.header.gas_price), gasTgas, minimumPurchasePrice);
  if (signer === owner) {
    const budget = z.object({ ownerBalanceAtPlan: z.string().regex(/^\d+$/) }).parse(JSON.parse(await readFile(OWNER_BUDGET_FILE, 'utf8')));
    assertSpendCeiling(BigInt(budget.ownerBalanceAtPlan), BigInt(balance.amount), deposit, BigInt(gas.header.gas_price), gasTgas, ALREADY_FUNDED_KEEPER_INCREMENT);
  }
}
