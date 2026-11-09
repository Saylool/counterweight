import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { deriveTestnetAddress, getSigningDigest, harmlessCancel, nearMarketIndex, testnetMeta, TESTNET_SIGNER } from '../packages/hyperliquid/src/index.js';
import { ownerSignCommand, PLAN_PATH, proofErrorMessage, type ProofPlan } from './proof-plan.js';

export async function prepareProof(predecessor: string | undefined, path = 'counterweight-1') {
  if (!predecessor || !predecessor.endsWith('.testnet')) throw new Error('Set NEAR_ACCOUNT_ID to the owner account ending in .testnet');
  const derived = await deriveTestnetAddress(predecessor, path);
  const meta = await testnetMeta();
  const index = nearMarketIndex(meta);
  const input = harmlessCancel(index, Date.now());
  const plan: ProofPlan = { version: 1, predecessor, path, address: derived.address, rootPublicKey: derived.rootPublicKey,
    publicKey: derived.publicKey, digest: getSigningDigest(input), createdAt: new Date().toISOString(), signerContract: TESTNET_SIGNER, input: input as ProofPlan['input'] };
  await mkdir('.tmp', { recursive: true });
  await writeFile(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(`Derived EVM address: ${derived.address}\nPath: ${JSON.stringify(path)}\nNEAR asset index: ${index}\nDigest: ${plan.digest}`);
  console.log('Public key derivation agrees with the MPC contract view. This probe cancels nonexistent order ID 0.');
  console.log(`\nOwner runs (OS keychain signing; this script never executes it):\n${ownerSignCommand(plan)}`);
  console.log("\nCopy the returned MPC signature JSON, then run:\nnpm run prove:submit -- '<mpc-response-json>'\nOr save only the signature JSON to .tmp/mpc-response.json and run:\nnpm run prove:submit -- @.tmp/mpc-response.json");
  console.log('\nThis direct owner probe does not demonstrate the policy contract. That contract has a different predecessor and address.');
  console.log('Never fund the owner-EOA probe address. Only the audited policy contract predecessor may control a funded strategy address.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  prepareProof(process.env.NEAR_ACCOUNT_ID, process.argv[2]).catch((error: unknown) => { console.error(proofErrorMessage(error)); process.exitCode = 1; });
