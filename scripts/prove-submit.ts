import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import type { Hex } from 'viem';
import { deriveTestnetAddress, mpcToHyperliquidSignature, submitTestnetProof } from '../packages/hyperliquid/src/index.js';
import { PLAN_PATH, proofErrorMessage, validatePlan } from './proof-plan.js';

export async function submitProof(arg: string | undefined) {
  if (!arg) throw new Error("Usage: npm run prove:submit -- '<mpc-response-json>' (or @.tmp/mpc-response.json)");
  if (arg.startsWith('@') && arg !== '@.tmp/mpc-response.json') throw new Error('Only @.tmp/mpc-response.json is accepted; save only public signature JSON there');
  const plan = validatePlan(JSON.parse(await readFile(PLAN_PATH, 'utf8')));
  const current = await deriveTestnetAddress(plan.predecessor, plan.path);
  if (current.address !== plan.address) throw new Error('Current MPC-derived address differs from saved plan');
  const signature = mpcToHyperliquidSignature(JSON.parse(arg.startsWith('@') ? await readFile(arg.slice(1), 'utf8') : arg));
  // Atomic one-shot claim: concurrent/replayed attempts cannot both delete this plan.
  // Consume before the relay call, including ambiguous transport failures.
  await unlink(PLAN_PATH);
  const result = await submitTestnetProof(plan.input, signature, plan.address as Hex);
  const evidence = { capturedAt: new Date().toISOString(), kind: 'owner-mpc-probe', plan, ...result };
  await mkdir('.tmp', { recursive: true });
  await writeFile('.tmp/signing-proof-result.json', `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (result.verdict === 'unproven') throw new Error('UNPROVEN: this response does not establish the signing boundary.');
  else console.log('PROVED: Hyperliquid testnet authenticated the signature from the derived address. This does not establish funding, a fill, or contract policy enforcement.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  (process.argv.length === 3 ? submitProof(process.argv[2]) : Promise.reject(new Error('Provide exactly one public MPC signature argument')))
    .catch((error: unknown) => { console.error(proofErrorMessage(error)); process.exitCode = 1; });
