import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { Hex } from 'viem';
import { deriveTestnetAddress, mpcToHyperliquidSignature, submitTestnetProof } from '../packages/hyperliquid/src/index.js';
import { PLAN_PATH, validatePlan } from './proof-plan.js';

async function main() {
  const arg = process.argv[2];
  if (!arg || process.argv.length !== 3) throw new Error("Usage: npm run prove:submit -- '<mpc-response-json>' (or @.tmp/mpc-response.json)");
  const plan = validatePlan(JSON.parse(await readFile(PLAN_PATH, 'utf8')));
  const current = await deriveTestnetAddress(plan.predecessor, plan.path);
  if (current.address !== plan.address) throw new Error('Current MPC-derived address differs from saved plan');
  const signature = mpcToHyperliquidSignature(JSON.parse(arg.startsWith('@') ? await readFile(arg.slice(1), 'utf8') : arg));
  const result = await submitTestnetProof(plan.input, signature, plan.address as Hex);
  const evidence = { capturedAt: new Date().toISOString(), kind: 'owner-mpc-probe', plan, ...result };
  await mkdir('.tmp', { recursive: true });
  await writeFile('.tmp/signing-proof-result.json', `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (result.verdict === 'unproven') { console.error('UNPROVEN: this response does not establish the signing boundary.'); process.exitCode = 1; }
  else console.log('PROVED: Hyperliquid testnet authenticated the signature from the derived address. This does not establish funding, a fill, or contract policy enforcement.');
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Proof submission failed'); process.exitCode = 1; });
