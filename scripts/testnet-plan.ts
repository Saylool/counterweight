import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { deriveTestnetAddress, TESTNET_SIGNER } from '../packages/hyperliquid/src/index.js';
import { shellQuote } from './proof-plan.js';
import { committedWasm, KEEPER, ORACLE, NEXT_POLICY, OWNER, parseOptions, PATH, POLICY, publicCli, publicKey, V2_BASELINE_SHA256, SIGNING_LIMITS, testnetAccount, WASM } from './testnet-common.js';
import { BASE, FUNDED_LIMITS, liveMarket, priceBounds } from './lifecycle-config.js';

export function initialization(assetIndex: number, decimals: number, ownerEvm: string, mark: string) {
  z.number().int().nonnegative().parse(assetIndex);
  z.number().int().min(0).max(6).parse(decimals);
  z.string().regex(/^0x[0-9a-fA-F]{40}$/).refine(a => !/^0x0{40}$/.test(a)).parse(ownerEvm);
  const { reference_price, min_price, max_price } = priceBounds(mark);
  return { owner: OWNER, keeper: KEEPER, asset_index: assetIndex, size_decimals: decimals, derivation_path: PATH,
    evm_recipient: ownerEvm.toLowerCase(), signer_account: TESTNET_SIGNER, wnear_account: 'wrap.testnet',
    network: 'Testnet', oracle: { ...ORACLE, min_price, max_price }, limits: FUNDED_LIMITS,
    heartbeat_timeout_seconds: 3600, reference_price, signing_limits: SIGNING_LIMITS };
}
const suffix = 'network-config testnet sign-with-keychain send';
export function callCommand(method: string, args: unknown, caller: string, gas = '30 Tgas', deposit = '0 NEAR', policy = POLICY) {
  return `near contract call-function as-transaction ${policy} ${method} json-args ${shellQuote(JSON.stringify(args))} prepaid-gas '${gas}' attached-deposit '${deposit}' sign-as ${caller} ${suffix}`;
}
export function spotSteps(policy = NEXT_POLICY) {
  testnetAccount(policy);
  return [
    { expect: 'Register policy on wrap.testnet; registration_only refunds excess. Owner pays storage.',
      command: callCommand('storage_deposit', { account_id: policy, registration_only: true }, OWNER, '30 Tgas', '0.01 NEAR', 'wrap.testnet') },
    { expect: 'Register owner on wrap.testnet (idempotent).',
      command: callCommand('storage_deposit', { account_id: OWNER, registration_only: true }, OWNER, '30 Tgas', '0.01 NEAR', 'wrap.testnet') },
    { expect: 'Wrap 5 testnet NEAR. This is separate from policy native storage/operating balance.',
      command: callCommand('near_deposit', {}, OWNER, '30 Tgas', '5 NEAR', 'wrap.testnet') },
    { expect: 'Deposit 5 wNEAR; msg MUST be the empty string. Only owner deposits are accepted.',
      command: callCommand('ft_transfer_call', { receiver_id: policy, amount: (5n * BASE).toString(), msg: '' }, OWNER, '100 Tgas', '1 yoctoNEAR', 'wrap.testnet') },
    { expect: 'Verify actual token custody equals contract spot_balance; record deposit tx with --spot-tx=HASH.',
      command: 'npm run lifecycle -- --step=status --spot-tx=PASTE_DEPOSIT_TX_HASH' },
  ];
}
export function deploymentSteps(init: ReturnType<typeof initialization>, sha256: string, policyKey?: string, keeperKey?: string, policy = NEXT_POLICY) {
  testnetAccount(policy);
  z.string().regex(/^[a-f0-9]{64}$/).parse(sha256);
  const pk = policyKey ? shellQuote(publicKey(policyKey)) : '"${POLICY_PUBLIC_KEY:?Set POLICY_PUBLIC_KEY to the public key already provisioned in the policy account keychain}"';
  if (keeperKey) publicKey(keeperKey);
  return [
    { expect: 'Create fresh policy with 9 testnet NEAR for WASM storage, bounded growth and operating reserve. Owner needs another 5 NEAR for spot plus gas.',
      command: `near account create-account fund-myself ${policy} '9 NEAR' use-manually-provided-public-key ${pk} sign-as ${OWNER} ${suffix}` },
    { expect: 'Reuse the funded keeper; keys stay in macOS keychain.',
      command: `near account view-account-summary ${KEEPER} network-config testnet now` },
    { expect: `Verify SHA-256 ${sha256}, then deploy. Initialize immediately: uninitialized new is public.`,
      command: `test "$(shasum -a 256 ${WASM} | cut -d ' ' -f 1)" = '${sha256}' && near contract deploy ${policy} use-file ${WASM} without-init-call ${suffix}` },
    { expect: 'Initialize fixed owner recipient and live testnet price bounds. Stop on any config failure.',
      command: callCommand('new', init, OWNER, '30 Tgas', '0 NEAR', policy) },
    { expect: 'Verify code/config/derivation and exactly one temporary full-access key against saved plan.',
      command: `npm run testnet:verify -- --before-key-removal=true --policy=${policy} --owner-evm=${init.evm_recipient} --plan=docs/evidence/policy-v2-plan.json` },
    ...spotSteps(policy),
    { expect: 'OWNER UI FUNDING: connect your own eligible wallet, claim mock USDC, then Send 50 mock USDC to the derived address printed above (SPOT balance). Then run to-perp to move 49 into perps. Verify equity >= $49 and no positions before freezing keys.',
      command: 'npm run lifecycle -- --step=to-perp --amount=49' },
    { expect: 'SEPARATE FINAL DEPLOYMENT STEP — IRREVERSIBLE: review config, spot, recipient and funding first. Deletes the sole policy key, preventing redeploy, deletion and key restoration. Stop if extra keys exist.',
      command: `near account delete-keys ${policy} public-keys ${pk} ${suffix}` },
    { expect: 'Verify zero keys and matching saved config before trading.',
      command: `npm run testnet:verify -- --policy=${policy} --owner-evm=${init.evm_recipient} --plan=docs/evidence/policy-v2-plan.json` },
    { expect: 'Run open/status/close/status/withdraw. Each signing step prints commands for the lead and accepts tx hash on stdin; it never runs near-cli.',
      command: 'npm run lifecycle -- --step=open' },
    { expect: 'Inspect fill, spot, margin, funding and stress headroom H.', command: 'npm run lifecycle -- --step=status' },
    { expect: 'Keeper closes only the actual short, reduce-only IOC.', command: 'npm run lifecycle -- --step=close' },
    { expect: 'After open expiry, run printed owner settlement and one-time withdrawal configuration commands. Regenerate timestamps if older than 30s.', command: 'npm run lifecycle -- --step=status' },
    { expect: 'Owner refreshes price/margin using printed commands, approves fixed-recipient withdraw3 and pastes its tx hash for relay. $1 residual required by WASM.', command: 'npm run lifecycle -- --step=withdraw' },
    { expect: 'Record final position, margin, funding and withdrawal ledger. Bridge arrival needs a separate destination receipt.', command: 'npm run lifecycle -- --step=status' },
  ];
}
/** Already initialized v2: upgrade code only. The original initializer plan is retained. */
export function upgradeSteps(sha256: string) {
  z.string().regex(/^[a-f0-9]{64}$/).parse(sha256);
  return [
    { expect: 'Existing initialized v2, full-access policy key still present. Check checksum and deploy code only; NEVER call new again.',
      command: `test "$(shasum -a 256 ${WASM} | cut -d ' ' -f 1)" = '${sha256}' && near contract deploy ${NEXT_POLICY} use-file ${WASM} without-init-call ${suffix}` },
    { expect: 'Verify new code and original saved config while the single temporary policy key remains.',
      command: `npm run testnet:verify -- --policy=${NEXT_POLICY} --before-key-removal=true --plan=docs/evidence/policy-v2-plan.json` },
    { expect: 'UI Send credited spot. Start relay, run its printed OWNER signature request in terminal B, paste only tx hash immediately. Verify spot falls 49 and perps rises 49.',
      command: 'npm run lifecycle -- --step=to-perp --amount=49' },
    { expect: 'Inspect public balances and evidence before the separate final key-removal step in the original deployment plan.',
      command: 'npm run lifecycle -- --step=status' },
  ];
}
export async function testnetPlan(argv: string[]) {
  const options = parseOptions(argv, ['owner-evm', 'policy-public-key', 'keeper-public-key', 'policy', 'recover-v1', 'upgrade-v2']);
  if (options['upgrade-v2'] !== undefined) {
    if (options['upgrade-v2'] !== 'true' || (options.policy && options.policy !== NEXT_POLICY) || options['recover-v1'])
      throw new Error('Expected --upgrade-v2=true for initialized policy-v2 only');
    const [artifact, saved] = await Promise.all([committedWasm(), readFile('docs/evidence/policy-v2-plan.json', 'utf8').then(JSON.parse)]);
    z.object({ policy: z.literal(NEXT_POLICY), artifact: z.object({ sha256: z.literal(V2_BASELINE_SHA256) }) }).passthrough().parse(saved);
    console.log('Upgrade initialized v2 in place. Retain original plan, account, derivation and state. No init call. Commands only; lead executes.');
    for (const [i, step] of upgradeSteps(artifact.sha256).entries()) console.log(`\n${i + 1}. Expect: ${step.expect}\n${step.command}`);
    return;
  }
  if (!options['owner-evm']) throw new Error('Usage: testnet:plan -- --owner-evm=0xYOUR_OWN_WALLET [--recover-v1=true]');
  if (options['recover-v1'] !== undefined && options['recover-v1'] !== 'true') throw new Error('Expected --recover-v1=true');
  const policy = testnetAccount(options.policy ?? NEXT_POLICY);
  if (policy !== NEXT_POLICY) throw new Error('Expected fresh policy-v2 for funded lifecycle');
  const [artifact, market, derived] = await Promise.all([committedWasm(), liveMarket(), deriveTestnetAddress(policy, PATH)]);
  const init = initialization(market.assetIndex, market.szDecimals, options['owner-evm'], market.mark);
  const steps = deploymentSteps(init, artifact.sha256, options['policy-public-key'], options['keeper-public-key'], policy);
  const plan = { policy, capturedAt: market.capturedAt, market, derived, artifact, init };
  await mkdir('docs/evidence', { recursive: true });
  try { await writeFile('docs/evidence/policy-v2-plan.json', `${JSON.stringify(plan, null, 2)}\n`, { flag: 'wx' }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('Policy plan already exists. Retain the deployed baseline; archive an undeployed plan before generating a replacement.');
    throw error;
  }
  console.log('TESTNET ONLY. Prints exact commands; never reads keys or sends NEAR transactions. Plan saved exclusively to docs/evidence/policy-v2-plan.json; retain it for verification (do not overwrite after deployment).');
  console.log(`Derived strategy address: ${derived.address}; signer ${TESTNET_SIGNER}; path ${PATH}; local derivation cross-checked with signer view.`);
  console.log(`Source: POST ${market.source} ${JSON.stringify(market.request)} at ${market.capturedAt}. NEAR mark $${market.mark}, reference ${init.reference_price} micro-USD; immutable bounds $${Number(init.oracle.min_price)/1e6}–$${Number(init.oracle.max_price)/1e6} (80–120% of mark).`);
  console.log('Keeper fallback: oracle account null; keeper may set_keeper_price only with observations <=60s old, nondecreasing timestamps, inside immutable bounds. Fetch a fresh TESTNET mark before each order. Opens cannot override price; close uses bounded reference_price hint. Outside bounds: stop and review; bounds cannot ratchet.');
  console.log('Limits: 5 NEAR maximum signed short, $20/order, $40/rolling day, 60s cooldown, 1% IOC price band. Open targets $12 (above $10 venue minimum), never exceeds spot. Fund venue with 50 mock USDC, plus 5 wNEAR spot; no bridge from NEAR is implied.');
  console.log(`Owner UI: unlock and claim faucet with your own wallet at https://app.hyperliquid-testnet.xyz/drip, then Send 50 mock USDC to ${derived.address} which credits SPOT USDC. Run lifecycle --step=to-perp --amount=49, then verify perps equity with lifecycle status before opening. Fixed withdraw3 recipient is ${init.evm_recipient} (Arbitrum Sepolia withdrawal, not a HyperCore Send).`);
  if (options['recover-v1']) console.log(`\nOPTIONAL — deletes policy v1 permanently, ONLY if full-access key remains and no funds/obligations remain. Recover native testnet NEAR to owner:\nnear account delete-account ${POLICY} beneficiary ${OWNER} ${suffix}`);
  for (const [i, step] of steps.entries())
    console.log(`\n${i + 1}. Expect: ${step.expect}\n${step.command}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => testnetPlan(process.argv.slice(2)));
