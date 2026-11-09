import { mkdir, writeFile } from 'node:fs/promises';
import { deriveTestnetAddress, getSigningDigest, harmlessCancel, testnetMeta, TESTNET_SIGNER } from '../packages/hyperliquid/src/index.js';
import { ownerSignCommand, PLAN_PATH, type ProofPlan } from './proof-plan.js';

async function main() {
  const predecessor = process.env.NEAR_ACCOUNT_ID;
  if (!predecessor || !predecessor.endsWith('.testnet')) throw new Error('Set NEAR_ACCOUNT_ID to the owner account ending in .testnet');
  const path = process.argv[2] ?? 'counterweight-1';
  const derived = await deriveTestnetAddress(predecessor, path);
  const meta = await testnetMeta();
  const matches = meta.universe.flatMap((asset, index) => asset.name === 'NEAR' ? [index] : []);
  if (matches.length !== 1 || matches[0] === undefined) throw new Error('NEAR market missing or ambiguous');
  const input = harmlessCancel(matches[0], Date.now());
  const plan: ProofPlan = { version: 1, predecessor, path, address: derived.address, rootPublicKey: derived.rootPublicKey,
    publicKey: derived.publicKey, digest: getSigningDigest(input), createdAt: new Date().toISOString(), signerContract: TESTNET_SIGNER, input: input as ProofPlan['input'] };
  await mkdir('.tmp', { recursive: true });
  await writeFile(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(`Derived EVM address: ${derived.address}\nPath: ${JSON.stringify(path)}\nNEAR asset index: ${matches[0]}\nDigest: ${plan.digest}`);
  console.log('Public key derivation agrees with the MPC contract view. This probe cancels nonexistent order ID 0.');
  console.log(`\nOwner runs (OS keychain signing; this script never executes it):\n${ownerSignCommand(plan)}`);
  console.log("\nCopy the returned MPC signature JSON, then run:\nnpm run prove:submit -- '<mpc-response-json>'\nOr save only the signature JSON to .tmp/mpc-response.json and run:\nnpm run prove:submit -- @.tmp/mpc-response.json");
  console.log('\nThis direct owner probe does not demonstrate the policy contract. That contract has a different predecessor and address.');
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Proof preparation failed'); process.exitCode = 1; });
