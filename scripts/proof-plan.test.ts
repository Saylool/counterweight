import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { getSigningDigest, harmlessCancel } from '../packages/hyperliquid/src/index.js';
import { ownerSignCommand, shellQuote, validatePlan, type ProofPlan } from './proof-plan.js';
const derivation = JSON.parse(readFileSync(new URL('../fixtures/chainsig-public-derivation.json', import.meta.url), 'utf8')) as { root: { value: string }; examples: { predecessor: string; path: string; address: string; publicKey: string }[] };
const input = harmlessCancel(54, 1700000000000);
const example = derivation.examples[0]!;
const plan = { version: 1, predecessor: example.predecessor, path: example.path, address: example.address, publicKey: example.publicKey, rootPublicKey: derivation.root.value, input, digest: getSigningDigest(input),
  createdAt: new Date(input.nonce).toISOString(), signerContract: 'v1.signer-prod.testnet' } as ProofPlan;
afterEach(() => vi.useRealTimers());
it('rejects a stale plan and a tampered digest or derived address', () => {
  vi.useFakeTimers(); vi.setSystemTime(input.nonce);
  expect(validatePlan(plan)).toEqual(plan);
  expect(() => validatePlan({ ...plan, digest: `0x${'00'.repeat(32)}` })).toThrow('mismatch');
  expect(() => validatePlan({ ...plan, address: `0x${'00'.repeat(20)}` })).toThrow('mismatch');
  vi.setSystemTime(input.nonce + 31 * 60000);
  expect(() => validatePlan(plan)).toThrow('older than 30 minutes');
});
it('prints current MPC request format with an OS-keychain owner command', () => {
  const command = ownerSignCommand(plan);
  expect(command).toContain('as-transaction v1.signer-prod.testnet sign');
  expect(command).toContain(`"payload_v2":{"Ecdsa":"${plan.digest.slice(2)}"}`);
  expect(command).toContain('"domain_id":0');
  expect(command).toContain("attached-deposit '1 yoctoNEAR'");
  expect(command).toContain('network-config testnet sign-with-keychain send');
  expect(shellQuote("x'; $(echo injected)")).toBe("'x'\\''; $(echo injected)'");
});
