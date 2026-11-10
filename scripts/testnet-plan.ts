import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { deriveTestnetAddress, nearMarketIndex, testnetMeta, TESTNET_SIGNER } from '../packages/hyperliquid/src/index.js';
import { shellQuote } from './proof-plan.js';
import { committedWasm, KEEPER, LIMITS, ORACLE, NEXT_POLICY, OWNER, parseOptions, PATH, POLICY, PROBE_ADDRESS, publicCli, publicKey, SIGNING_LIMITS, testnetAccount, WASM } from './testnet-common.js';

export function initialization(assetIndex: number, decimals: number, ownerEvm: string) {
  z.number().int().nonnegative().parse(assetIndex);
  z.number().int().min(0).max(6).parse(decimals);
  z.string().regex(/^0x[0-9a-fA-F]{40}$/).refine(a => !/^0x0{40}$/.test(a)).parse(ownerEvm);
  return { owner: OWNER, keeper: KEEPER, asset_index: assetIndex, size_decimals: decimals, derivation_path: PATH,
    evm_recipient: ownerEvm.toLowerCase(), signer_account: TESTNET_SIGNER, wnear_account: 'wrap.testnet',
    network: 'Testnet', oracle: ORACLE, limits: LIMITS, heartbeat_timeout_seconds: 3600, reference_price: '1000000', signing_limits: SIGNING_LIMITS };
}
const suffix = 'network-config testnet sign-with-keychain send';
export function callCommand(method: string, args: unknown, caller: string, gas = '30 Tgas', deposit = '0 NEAR', policy = POLICY) {
  return `near contract call-function as-transaction ${policy} ${method} json-args ${shellQuote(JSON.stringify(args))} prepaid-gas '${gas}' attached-deposit '${deposit}' sign-as ${caller} ${suffix}`;
}
export function deploymentSteps(init: ReturnType<typeof initialization>, sha256: string, policyKey?: string, keeperKey?: string, policy = NEXT_POLICY) {
  testnetAccount(policy);
  z.string().regex(/^[a-f0-9]{64}$/).parse(sha256);
  const pk = policyKey ? shellQuote(publicKey(policyKey)) : '"${POLICY_PUBLIC_KEY:?Set POLICY_PUBLIC_KEY to the public key already provisioned in the policy account keychain}"';
  if (keeperKey) publicKey(keeperKey);
  return [
    { expect: 'Policy account created with 9 testnet NEAR (storage + 128 KiB growth + 1 NEAR operating reserve) and one full-access public key. WASM storage alone costs about 6.28 NEAR.',
      command: `near account create-account fund-myself ${policy} '9 NEAR' use-manually-provided-public-key ${pk} sign-as ${OWNER} ${suffix}` },
    { expect: 'Reuse the existing keeper account. Inspect its public account summary; do not recreate it. Zero-deposit signing supports a function-call key restricted to the new policy.',
      command: `near account view-account-summary ${KEEPER} network-config testnet now` },
    { expect: `SHA-256 must equal ${sha256}; deploy runs only if the check passes.`,
      command: `test "$(shasum -a 256 ${WASM} | cut -d ' ' -f 1)" = '${sha256}' && near contract deploy ${policy} use-file ${WASM} without-init-call ${suffix}` },
    { expect: 'Owner initializes fixed recipients, testnet market/path and limits. Reference price is a dummy $1: no spot is deposited; this proof only cancels order 0.',
      command: callCommand('new', init, OWNER, '30 Tgas', '0 NEAR', policy) },
    { expect: 'Before deletion: code/config/derivation PASS, exactly one full-access policy key. Review every field; do not fund a strategy yet.',
      command: `npm run testnet:verify -- --before-key-removal=true --policy=${policy} --owner-evm=${init.evm_recipient}` },
    { expect: 'FINAL DEPLOYMENT STEP — IRREVERSIBLE: deletes the policy account key. No redeploy, account deletion or key restoration path remains. Owner/keeper contract methods remain callable. Delete ALL keys if the preflight finds any extras.',
      command: `near account delete-keys ${policy} public-keys ${pk} ${suffix}` },
    { expect: 'After deletion: empty finalized access-key list, matching code/config and contract-derived address. Stop on any FAIL.',
      command: `npm run testnet:verify -- --policy=${policy} --owner-evm=${init.evm_recipient}` },
    { expect: 'Start the live relay FIRST. It warms metadata/derivation, prints the keeper command, then waits for its tx hash. It never runs near-cli.',
      command: `npm run prove:contract:live -- --policy=${policy} --keeper=${KEEPER}` },
    { expect: 'Run in a second terminal only after the relay is ready. Paste the hash immediately: the 60-second expiry includes MPC/finality. Locally/server recovered address must match policy; no fill or funding claim.',
      command: callCommand('request_cancel_signature', { order_id: '0' }, KEEPER, '300 Tgas', '0 NEAR', policy) },
  ];
}
export async function testnetPlan(argv: string[]) {
  const options = parseOptions(argv, ['owner-evm', 'policy-public-key', 'keeper-public-key', 'policy']);
  const policy = testnetAccount(options.policy ?? NEXT_POLICY);
  const artifact = await committedWasm();
  const [meta, derived] = await Promise.all([testnetMeta(), deriveTestnetAddress(policy, PATH)]);
  const index = nearMarketIndex(meta);
  const decimals = z.number().int().min(0).max(6).parse(meta.universe[index]?.szDecimals);
  const init = initialization(index, decimals, options['owner-evm'] ?? PROBE_ADDRESS);
  console.log('TESTNET ONLY. Prints commands; never signs, sends NEAR transactions, or accesses keys. Run from repository root.');
  console.log('Public-key placeholders require owner-managed keychain entries for EACH subaccount. Set POLICY_PUBLIC_KEY to the fresh policy public key only; reuse the existing keeper; this tool does not generate/import keys.');
  console.log('Recipient override: npm run testnet:plan -- --owner-evm=0x... (REPLACE with your fixed owner withdrawal address).');
  console.log(`Testnet-only default ${PROBE_ADDRESS} is the proven owner-derived probe address, used solely as a recognizable no-funds withdrawal placeholder. Never fund that probe address. The contract has an immutable network enum; this plan and tooling support only testnet. Pyth NEAR is retired: oracle account is null; keeper/owner fallback stays in the immutable $0.95–$1.05 proof range. Never fund this dummy-price policy.`);
  console.log(`Policy-derived strategy address: ${derived.address}; path ${PATH}; NEAR testnet asset ${index}, szDecimals ${decimals}.`);
  console.log(`WASM verified: ${artifact.sha256} (${artifact.bytes} bytes); funding 9 NEAR to the fresh policy; reuse existing keeper funding. Ensure the owner has 9 NEAR plus gas available (prior deployment funding is already spent). Limits: 1 NEAR maximum short, $10/order, $20/rolling day, 60s cooldown, 1% open band. No spot means no opens.`);
  console.log('Run init immediately after deployment: the uninitialized contract is public. If init/config preflight fails, retain the temporary key and stop; never remove it or fund the strategy.');
  for (const [i, step] of deploymentSteps(init, artifact.sha256, options['policy-public-key'], options['keeper-public-key'], policy).entries())
    console.log(`\n${i + 1}. Expect: ${step.expect}\n${step.command}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => testnetPlan(process.argv.slice(2)));
