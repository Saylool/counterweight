import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { deriveTestnetAddress, nearMarketIndex, testnetMeta, TESTNET_SIGNER } from '../packages/hyperliquid/src/index.js';
import { shellQuote } from './proof-plan.js';
import { committedWasm, KEEPER, LIMITS, OWNER, parseOptions, PATH, POLICY, PROBE_ADDRESS, publicCli, publicKey, SIGNING_LIMITS, WASM } from './testnet-common.js';

export function initialization(assetIndex: number, decimals: number, ownerEvm: string) {
  z.number().int().nonnegative().parse(assetIndex);
  z.number().int().min(0).max(6).parse(decimals);
  z.string().regex(/^0x[0-9a-fA-F]{40}$/).refine(a => !/^0x0{40}$/.test(a)).parse(ownerEvm);
  return { owner: OWNER, keeper: KEEPER, asset_index: assetIndex, size_decimals: decimals, derivation_path: PATH,
    evm_recipient: ownerEvm.toLowerCase(), signer_account: TESTNET_SIGNER, wnear_account: 'wrap.testnet',
    limits: LIMITS, heartbeat_timeout_seconds: 3600, reference_price: '1000000', signing_limits: SIGNING_LIMITS };
}
const suffix = 'network-config testnet sign-with-keychain send';
export function callCommand(method: string, args: unknown, caller: string, gas = '30 Tgas', deposit = '0 NEAR') {
  return `near contract call-function as-transaction ${POLICY} ${method} json-args ${shellQuote(JSON.stringify(args))} prepaid-gas '${gas}' attached-deposit '${deposit}' sign-as ${caller} ${suffix}`;
}
export function deploymentSteps(init: ReturnType<typeof initialization>, sha256: string, policyKey?: string, keeperKey?: string) {
  z.string().regex(/^[a-f0-9]{64}$/).parse(sha256);
  const pk = policyKey ? shellQuote(publicKey(policyKey)) : '"${POLICY_PUBLIC_KEY:?Set POLICY_PUBLIC_KEY to the public key already provisioned in the policy account keychain}"';
  const kk = keeperKey ? shellQuote(publicKey(keeperKey)) : '"${KEEPER_PUBLIC_KEY:?Set KEEPER_PUBLIC_KEY to the public key already provisioned in the keeper account keychain}"';
  return [
    { expect: 'Policy account created with 7 testnet NEAR and one full-access public key. WASM storage alone costs about 5.88 NEAR.',
      command: `near account create-account fund-myself ${POLICY} '7 NEAR' use-manually-provided-public-key ${pk} sign-as ${OWNER} ${suffix}` },
    { expect: 'Keeper account created with 0.2 testnet NEAR; its own full-access key pays the MPC deposit. Policy authority is checked by caller.',
      command: `near account create-account fund-myself ${KEEPER} '0.2 NEAR' use-manually-provided-public-key ${kk} sign-as ${OWNER} ${suffix}` },
    { expect: `SHA-256 must equal ${sha256}; deploy runs only if the check passes.`,
      command: `test "$(shasum -a 256 ${WASM} | cut -d ' ' -f 1)" = '${sha256}' && near contract deploy ${POLICY} use-file ${WASM} without-init-call ${suffix}` },
    { expect: 'Owner initializes fixed recipients, testnet market/path and limits. Reference price is a dummy $1: no spot is deposited; this proof only cancels order 0.',
      command: callCommand('new', init, OWNER) },
    { expect: 'Before deletion: code/config/derivation PASS, exactly one full-access policy key. Review every field; do not fund a strategy yet.',
      command: `npm run testnet:verify -- --before-key-removal=true --owner-evm=${init.evm_recipient}` },
    { expect: 'FINAL DEPLOYMENT STEP — IRREVERSIBLE: deletes the policy account key. No redeploy, account deletion or key restoration path remains. Owner/keeper contract methods remain callable. Delete ALL keys if the preflight finds any extras.',
      command: `near account delete-keys ${POLICY} public-keys ${pk} ${suffix}` },
    { expect: 'After deletion: empty finalized access-key list, matching code/config and contract-derived address. Stop on any FAIL.',
      command: `npm run testnet:verify -- --owner-evm=${init.evm_recipient}` },
    { expect: 'Keeper requests a signature THROUGH policy; request + signature events, final callback true. Immediately run prove:contract with this tx hash (expiry is only 60 seconds).',
      command: callCommand('request_cancel_signature', { order_id: '0' }, KEEPER, '300 Tgas', '1 yoctoNEAR') },
    { expect: 'Locally recovered and server-recovered addresses match the policy predecessor; evidence saved under docs/evidence/. No fill or funding claim.',
      command: 'npm run prove:contract -- --tx=TX_HASH_FROM_KEEPER_CALL' },
  ];
}
export async function testnetPlan(argv: string[]) {
  const options = parseOptions(argv, ['owner-evm', 'policy-public-key', 'keeper-public-key']);
  const artifact = await committedWasm();
  const [meta, derived] = await Promise.all([testnetMeta(), deriveTestnetAddress(POLICY, PATH)]);
  const index = nearMarketIndex(meta);
  const decimals = z.number().int().min(0).max(6).parse(meta.universe[index]?.szDecimals);
  const init = initialization(index, decimals, options['owner-evm'] ?? PROBE_ADDRESS);
  console.log('TESTNET ONLY. Prints commands; never signs, sends NEAR transactions, or accesses keys. Run from repository root.');
  console.log('Public-key placeholders require owner-managed keychain entries for EACH subaccount. Set POLICY_PUBLIC_KEY and KEEPER_PUBLIC_KEY to their public keys only; this tool does not generate/import keys.');
  console.log('Recipient override: npm run testnet:plan -- --owner-evm=0x... (REPLACE with your fixed owner withdrawal address).');
  console.log(`Testnet-only default ${PROBE_ADDRESS} is the proven owner-derived probe address, used solely as a recognizable no-funds withdrawal placeholder. Never fund that probe address. Mainnet is unsupported.`);
  console.log(`Policy-derived strategy address: ${derived.address}; path ${PATH}; NEAR testnet asset ${index}, szDecimals ${decimals}.`);
  console.log(`WASM verified: ${artifact.sha256} (${artifact.bytes} bytes); total account funding 7.2 of owner's 10 NEAR, plus gas. Limits: 1 NEAR maximum short, $10/order, $20/rolling day, 60s cooldown, 1% open band. No spot means no opens.`);
  console.log('Run init immediately after deployment: the uninitialized contract is public. If init/config preflight fails, retain the temporary key and stop; never remove it or fund the strategy.');
  for (const [i, step] of deploymentSteps(init, artifact.sha256, options['policy-public-key'], options['keeper-public-key']).entries())
    console.log(`\n${i + 1}. Expect: ${step.expect}\n${step.command}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => testnetPlan(process.argv.slice(2)));
