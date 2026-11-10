import { pathToFileURL } from 'node:url';
import { deriveTestnetAddress, TESTNET_SIGNER } from '../packages/hyperliquid/src/index.js';
import { NEXT_POLICY, parseOptions, PATH, publicCli, testnetAccount } from './testnet-common.js';

export async function derive(argv: string[]) {
  const options = parseOptions(argv, ['account']);
  const account = testnetAccount(options.account ?? NEXT_POLICY);
  const derived = await deriveTestnetAddress(account, PATH);
  console.log(JSON.stringify({ account, path: PATH, signer: TESTNET_SIGNER,
    crossCheck: 'local SHA3-256 public derivation equals signer derived_public_key at the same finalized block', ...derived }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => derive(process.argv.slice(2)));
