import { z } from 'zod';
import { getSigningDigest, deriveEvmAddress, validateProofNonce, type L1Input } from '../packages/hyperliquid/src/index.js';
export const PLAN_PATH = '.tmp/signing-proof-plan.json';
export const planSchema = z.object({
  version: z.literal(1), predecessor: z.string(), path: z.string(), address: z.string().regex(/^0x[0-9a-f]{40}$/),
  rootPublicKey: z.string(), publicKey: z.string(), digest: z.string().regex(/^0x[0-9a-f]{64}$/),
  createdAt: z.string(), signerContract: z.literal('v1.signer-prod.testnet'),
  input: z.object({ scheme: z.literal('l1'), network: z.literal('testnet'), nonce: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    action: z.object({ type: z.literal('cancel'), cancels: z.array(z.object({ a: z.number().int().nonnegative(), o: z.literal(0) }).strict()).length(1) }).strict(),
  }).strict(),
}).strict();
export type ProofPlan = z.infer<typeof planSchema>;
export function validatePlan(value: unknown): ProofPlan {
  const plan = planSchema.parse(value);
  const derived = deriveEvmAddress(plan.rootPublicKey, plan.predecessor, plan.path);
  if (derived.address !== plan.address || derived.publicKey !== plan.publicKey || getSigningDigest(plan.input as L1Input) !== plan.digest)
    throw new Error('Saved plan digest or derivation mismatch');
  // Conservative local usability limit; not a claim about the venue nonce window.
  validateProofNonce(plan.input.nonce);
  return plan;
}
/** Never expose V8 JSON.parse snippets from files or CLI input. */
export function proofErrorMessage(error: unknown): string {
  if (error instanceof SyntaxError) return 'Invalid JSON; provide only the public MPC signature object or a valid proof plan';
  return error instanceof Error ? error.message : 'Proof failed';
}
export function shellQuote(value: string): string { return `'${value.replaceAll("'", "'\\''")}'`; }
export function ownerSignCommand(plan: ProofPlan): string {
  const args = { request: { payload_v2: { Ecdsa: plan.digest.slice(2) }, path: plan.path, domain_id: 0 } };
  return `near contract call-function as-transaction ${plan.signerContract} sign json-args ${shellQuote(JSON.stringify(args))} prepaid-gas '300 Tgas' attached-deposit '1 yoctoNEAR' sign-as ${shellQuote(plan.predecessor)} network-config testnet sign-with-keychain send`;
}
