import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { callCommand } from './testnet-plan.js';
import { prepareContractProof, proofOptions, proofKeys, proveContract, REHEARSAL_NOTICE } from './prove-contract.js';
import { publicCli, rpc, txHash } from './testnet-common.js';

/** Print only: the team lead runs near-cli in a second terminal. Never spawns a signer. */
export async function proveContractLive(argv: string[]) {
  const options = proofOptions(argv);
  if (!argv.some(a => a.startsWith('--keeper='))) throw new Error('Usage: prove:contract:live -- --keeper=KEEPER.testnet [--tx=HASH] [--rehearsal]');
  const prepared = await prepareContractProof(options.policy);
  if (options.rehearsal) {
    proofKeys(await rpc('query', { request_type: 'view_access_key_list', account_id: options.policy, finality: 'final' }), true);
    console.log(REHEARSAL_NOTICE);
  }
  console.log('Run this keeper command in another terminal; this script never sends NEAR transactions:');
  console.log(callCommand('request_cancel_signature', { order_id: '0' }, options.keeper, '300 Tgas',
    options['wasm-sha256'] ? '1 yoctoNEAR' : '0 NEAR', options.policy));
  console.log('60 s expiresAfter starts at the policy request block (including MPC/finality time). Paste the hash immediately; relay refuses <3 s remaining.');
  let hash = options.tx;
  if (!hash) {
    const reader = createInterface({ input: process.stdin, output: process.stdout });
    try {
      process.stdout.write('Keeper transaction hash: ');
      // Async iteration accepts both interactive paste and piped stdin, including early input.
      for await (const line of reader) { if (line.trim()) { hash = line.trim(); break; } }
    } finally { reader.close(); }
  }
  if (!hash) throw new Error('Expected keeper transaction hash on stdin or --tx=HASH');
  const relayArgs = argv.filter(a => !a.startsWith('--tx='));
  await proveContract([...relayArgs, `--tx=${txHash(hash)}`], prepared);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => proveContractLive(process.argv.slice(2)));
