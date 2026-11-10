import { statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { deriveTestnetAddress, TESTNET_SIGNER } from '../packages/hyperliquid/src/index.js';
import { shellQuote } from './proof-plan.js';
import { committedWasm, KEEPER, ORACLE, NEXT_POLICY, OWNER, parseOptions, PATH, POLICY, publicCli, publicKey, V3_POLICY, SIGNING_LIMITS, testnetAccount, WASM, V3_WASM } from './testnet-common.js';
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
      command: `npm run lifecycle -- ${policy === NEXT_POLICY ? '' : `--policy=${policy} `}--step=status --spot-tx=PASTE_DEPOSIT_TX_HASH` },
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
/** Historical upgrade route is permanently disabled after v2 key deletion. */
export function upgradeSteps(sha256: string) {
  // Historical builder retained for the pinned v2 rehearsal tests; CLI never exposes it.
  z.string().regex(/^[a-f0-9]{64}$/).parse(sha256);
  return [
    { expect: 'HISTORICAL ONLY. v2 is now keyless. Do not execute this obsolete code-only upgrade.',
      command: `test "$(shasum -a 256 ${WASM} | cut -d ' ' -f 1)" = '${sha256}' && near contract deploy ${NEXT_POLICY} use-file ${WASM} without-init-call ${suffix}` },
    { expect: 'Historical single-key verification before removal.',
      command: `npm run testnet:verify -- --policy=${NEXT_POLICY} --before-key-removal=true --plan=docs/evidence/policy-v2-plan.json` },
    { expect: 'Historical supervised funding step; do not rerun.', command: 'npm run lifecycle -- --step=to-perp --amount=49' },
    { expect: 'Historical status.', command: 'npm run lifecycle -- --step=status' },
  ];
}
export const V3_MARGIN_LIMITS = { per_withdrawal_usdc:'50000000', daily_withdrawal_usdc:'100000000', min_residual_equity_usdc:'1000000',
  min_headroom_bps:1000, fee_reserve_usdc:'100000', max_fee_usdc:'1000000' };
// Measured by sandbox_v3_creation_reserve_matches_initialized_storage using the
// saved initializer, one ed25519 key and the unchanged production layout.
export const V3_INITIAL_STORAGE_OVERHEAD = 847;
export function v3CreationBudget(wasmBytes: number) {
  z.number().int().positive().safe().parse(wasmBytes);
  const initializedStorageBytes = wasmBytes + V3_INITIAL_STORAGE_OVERHEAD;
  const storageByteCostYoctoNear = 10n ** 19n;
  const reserve = BigInt(initializedStorageBytes + 131_072) * storageByteCostYoctoNear + BASE;
  const create = reserve + BASE / 2n;
  const near = (value: bigint) => `${value / BASE}.${(value % BASE).toString().padStart(24, '0')}`.replace(/0+$/, '').replace(/\.$/, '');
  return { wasmBytes, initializedStorageBytes, initialStorageOverheadBytes: V3_INITIAL_STORAGE_OVERHEAD,
    growthBytes: 131_072, storageByteCostYoctoNear: storageByteCostYoctoNear.toString(),
    operatingYoctoNear: BASE.toString(), marginYoctoNear: (BASE / 2n).toString(),
    reserveYoctoNear: reserve.toString(), reserveNear: near(reserve), createYoctoNear: create.toString(), createNear: near(create),
    formula: `(${wasmBytes} + ${V3_INITIAL_STORAGE_OVERHEAD} + 131072) × 10^19 / 10^24 + 1 + 0.5 = ${near(create)} NEAR` };
}
export function v3SpotSteps(spotNear?: string, wrapSpot = false) {
  let amount = 'REPLACE_POSITIVE_SPOT_YOCTONEAR';
  if (spotNear !== undefined) {
    if (!/^(0|[1-9][0-9]*)(\.[0-9]{1,24})?$/.test(spotNear)) throw new Error('Expected positive --spot-near with at most 24 decimals');
    const [whole, fraction = ''] = spotNear.split('.');
    const yocto = BigInt(whole!) * BASE + BigInt(fraction.padEnd(24, '0'));
    if (yocto <= 0n || yocto > 2n ** 128n - 1n) throw new Error('Expected positive u128 spot amount');
    amount = yocto.toString();
  }
  if (wrapSpot && spotNear === undefined) throw new Error('Expected --spot-near when --wrap-spot=true');
  return [
    ...spotSteps(V3_POLICY).slice(0, 2).map(step => ({...step, expect: `LATER, optional independent spot stage: ${step.expect}`})),
    ...(wrapSpot ? [{expect: `Optional wrap of ${spotNear} NEAR; skip when using recovered wNEAR.`,
      command: callCommand('near_deposit', {}, OWNER, '30 Tgas', `${spotNear} NEAR`, 'wrap.testnet')}] : []),
    {expect: 'LATER: deposit any positive owner-selected wNEAR amount with empty msg. Recovered 4 wNEAR is already wrapped; wait until v2 cleanup after 2026-11-12 17:31:03.419 UTC. No new wrapping is required. Replace placeholder before executing. Owner deposits also work after policy key deletion.',
      command: callCommand('ft_transfer_call', {receiver_id:V3_POLICY, amount, msg:''}, OWNER, '100 Tgas', '1 yoctoNEAR', 'wrap.testnet')},
    {expect: 'Before opening any short, verify token custody and spot_balance equal the selected deposit. Signed shorts remain bounded by actual spot and max_short_size.',
      command: `near contract call-function as-read-only ${V3_POLICY} get_state json-args '{}' network-config testnet now`},
  ];
}
export function freshV3Steps(init: ReturnType<typeof initialization>, sha256: string, policyKey?: string, options: {wasmBytes?: number; spotNear?: string | undefined; wrapSpot?: boolean} = {}) {
  z.string().regex(/^[a-f0-9]{64}$/).parse(sha256);
  const creation = v3CreationBudget(options.wasmBytes ?? statSync(V3_WASM).size);
  const pk = policyKey ? shellQuote(publicKey(policyKey)) : '"${POLICY_PUBLIC_KEY:?Set POLICY_PUBLIC_KEY to an already-provisioned public key; never paste a private key}"';
  return [
    {expect:`Create a FRESH v3 account. Reserve + margin formula: ${creation.formula}. Venue funding and later spot are separate; leave owner gas funds.`,command:`near account create-account fund-myself ${V3_POLICY} '${creation.createNear} NEAR' use-manually-provided-public-key ${pk} sign-as ${OWNER} ${suffix}`},
    {expect:`Check SHA-256 ${sha256}. Atomic deploy+init prevents an uninitialized interval; init permits the temporary policy key to initialize on behalf of the fixed owner.`,command:`test "$(shasum -a 256 ${V3_WASM} | cut -d ' ' -f 1)" = '${sha256}' && near contract deploy ${V3_POLICY} use-file ${V3_WASM} with-init-call new json-args ${shellQuote(JSON.stringify(init))} prepaid-gas '30 Tgas' attached-deposit '0 NEAR' ${suffix}`},
    {expect:'Configure fixed-recipient withdrawal controls without any adapter or route.',command:callCommand('configure_margin_withdrawals',{limits:V3_MARGIN_LIMITS},OWNER,'30 Tgas','0 NEAR',V3_POLICY)},
    {expect:'Verify the artifact, fixed identities, public derivation and temporary access key.',command:`npm run testnet:verify -- --policy=${V3_POLICY} --before-key-removal=true --owner-evm=${init.evm_recipient} --plan=docs/evidence/policy-v3-plan.json`},
    {expect:'After the new derived address has received 50 mock USDC in SPOT, supervise the owner same-account 49 USDC spot-to-perps transfer. Lifecycle validates the receipt, derived signature and public balance deltas before continuing.',command:`npm run lifecycle -- --policy=${V3_POLICY} --step=to-perp --amount=49`},
    {expect:'PLACEHOLDERS: fetch a fresh mark; replace both values with micro-USD and observation seconds (<=60s old). Opening band is enforced when signing an open; the cache itself uses the wide sanity range. This is keeper price authority, not a verified oracle.',command:callCommand('set_keeper_price',{price:'REPLACE_FRESH_MARK_MICRO_USD',observed_at:'REPLACE_OBSERVATION_SECONDS'},KEEPER,'30 Tgas','0 NEAR',V3_POLICY)},
    {expect:'PLACEHOLDERS: independently verify finalized venue equity/withdrawable micro-USDC and replace all values; timestamp milliseconds <=30s old. Confirm fee cap is 1000000, no short/route/pending withdrawal, then inspect get_margin before freezing keys.',command:callCommand('observe_margin',{equity_usdc:'REPLACE_VERIFIED_EQUITY_MICRO_USDC',withdrawable_usdc:'REPLACE_VERIFIED_WITHDRAWABLE_MICRO_USDC',observed_at_ms:'REPLACE_VERIFICATION_MILLISECONDS'},OWNER,'30 Tgas','0 NEAR',V3_POLICY)},

    {expect:'READ ONLY. After manual venue funding/class transfer and owner margin observation, inspect state. Lifecycle requires explicit --policy for v3; the default remains historical v2.',command:`near contract call-function as-read-only ${V3_POLICY} get_state json-args '{}' network-config testnet now`},
    {expect:'IRREVERSIBLE, owner executes only after validating identities, margin and config (spot may be deposited later): delete the sole temporary full-access key. Owner contract calls, including timelocked bounds, remain usable after key deletion.',command:`near account delete-keys ${V3_POLICY} public-keys ${pk} ${suffix}`},
    ...v3SpotSteps(options.spotNear, options.wrapSpot),
    {expect:'Verify zero keys and saved config before any trading; the spot stage can be deferred independently.',command:`npm run testnet:verify -- --policy=${V3_POLICY} --owner-evm=${init.evm_recipient} --plan=docs/evidence/policy-v3-plan.json`},
  ];
}
export async function testnetPlan(argv: string[]) {
  const options = parseOptions(argv, ['owner-evm', 'policy-public-key', 'keeper-public-key', 'policy', 'recover-v1', 'upgrade-v2', 'spot-near', 'wrap-spot', 'spot-only']);
  if (options['upgrade-v2'] !== undefined) throw new Error('Policy v2 is keyless and cannot be upgraded; deploy fresh policy-v3');
  if (options['wrap-spot'] !== undefined && options['wrap-spot'] !== 'true') throw new Error('Expected --wrap-spot=true');
  if (options['spot-only'] !== undefined) {
    if (options['spot-only'] !== 'true' || !options['spot-near']) throw new Error('Expected --spot-only=true --spot-near=AMOUNT');
    if (Object.keys(options).some(key => !['spot-only', 'spot-near', 'wrap-spot'].includes(key))) throw new Error('Expected only spot-stage options with --spot-only=true');
    console.log('LATER SPOT STAGE ONLY. Prints commands; no RPC, keys, sends, deployment or saved-plan changes. Complete v2 cleanup before using recovered wNEAR.');
    for (const step of v3SpotSteps(options['spot-near'], options['wrap-spot'] === 'true')) console.log(`\nExpect: ${step.expect}\n${step.command}`);
    return;
  }
  if (!options['owner-evm']) throw new Error('Usage: testnet:plan -- --owner-evm=0xYOUR_OWN_WALLET [--recover-v1=true]');
  if (options['recover-v1'] !== undefined && options['recover-v1'] !== 'true') throw new Error('Expected --recover-v1=true');
  const policy = testnetAccount(options.policy ?? V3_POLICY);
  if (policy !== V3_POLICY) throw new Error('Expected fresh policy-v3; v2 is keyless and cannot be upgraded');
  const [artifact, market, derived] = await Promise.all([committedWasm(V3_WASM), liveMarket(), deriveTestnetAddress(policy, PATH)]);
  const init = initialization(market.assetIndex, market.szDecimals, options['owner-evm'], market.mark);
  if (options['keeper-public-key']) publicKey(options['keeper-public-key']);
  const creation = v3CreationBudget(artifact.bytes);
  const spot = {stage:'deferred; independent of deployment and venue funding', amountNear:options['spot-near'] ?? null, wrap:options['wrap-spot'] === 'true'};
  const steps = freshV3Steps(init, artifact.sha256, options['policy-public-key'], {wasmBytes:artifact.bytes, spotNear:options['spot-near'], wrapSpot:spot.wrap});
  const plan = { policy, capturedAt: market.capturedAt, market, derived, artifact, creation, spot, init, marginLimits:V3_MARGIN_LIMITS, priceBoundsDelaySeconds:86400, exitMaxSlippageBps:100, exitSanityMicroUsd:['10','1000000000000'] };
  await mkdir('docs/evidence', { recursive: true });
  try { await writeFile('docs/evidence/policy-v3-plan.json', `${JSON.stringify(plan, null, 2)}\n`, { flag: 'wx' }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error('Policy plan already exists. Retain the deployed baseline; archive an undeployed plan before generating a replacement.');
    throw error;
  }
  console.log('TESTNET ONLY. Prints exact commands; never reads keys or sends NEAR transactions. Plan saved exclusively to docs/evidence/policy-v3-plan.json; retain it for verification (do not overwrite after deployment).');
  console.log(`Derived strategy address: ${derived.address}; signer ${TESTNET_SIGNER}; path ${PATH}; local derivation cross-checked with signer view.`);
  console.log(`Source: POST ${market.source} ${JSON.stringify(market.request)} at ${market.capturedAt}. NEAR mark $${market.mark}, reference ${init.reference_price} micro-USD; opening bounds $${Number(init.oracle.min_price)/1e6}–$${Number(init.oracle.max_price)/1e6} (initially 80–120% of mark; cancellable 24h owner timelock to update).`);
  console.log('Opening fallback: fresh sane keeper observations; opens enforce the opening band at signing. Exits use oracle or caller-attested mark + observed_at (seconds, <=60s old), sanity $0.00001–$1,000,000, independent of opening bounds. Buy reduce-only IOC <= mark +1%, rounded DOWN; never waits for band updates. This bounds slippage against the reported mark, not an independently authenticated market. See docs/POLICY-V3.md.');
  console.log(`Creation reserve plus 0.5 NEAR margin: ${creation.formula}`);
  console.log('Limits: 5 NEAR maximum signed short, $20/order, $40/rolling day, 60s cooldown, 1% IOC price band. Open targets $12 (above $10 venue minimum), never exceeds spot. Deploy/configure and fund the venue with 50 mock USDC first. Deposit any chosen positive wNEAR amount later (--spot-near=AMOUNT; optional --wrap-spot=true only for unwrapped NEAR). Recovered 4 wNEAR comes from v2 cleanup after 2026-11-12 17:31:03.419 UTC. No opening before spot custody is verified; no bridge from NEAR is implied.');
  console.log(`Owner UI: unlock and claim faucet with your own wallet at https://app.hyperliquid-testnet.xyz/drip, then Send 50 mock USDC to ${derived.address} which credits SPOT USDC. Use lifecycle --policy=policy-v3.counterweight-samet.testnet --step=to-perp --amount=49 for a supervised relay and public balance verification. Fixed withdraw3 recipient is ${init.evm_recipient} (Arbitrum Sepolia withdrawal, not a HyperCore Send).`);
  if (options['recover-v1']) console.log(`\nOPTIONAL — deletes policy v1 permanently, ONLY if full-access key remains and no funds/obligations remain. Recover native testnet NEAR to owner:\nnear account delete-account ${POLICY} beneficiary ${OWNER} ${suffix}`);
  for (const [i, step] of steps.entries())
    console.log(`\n${i + 1}. Expect: ${step.expect}\n${step.command}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => testnetPlan(process.argv.slice(2)));
