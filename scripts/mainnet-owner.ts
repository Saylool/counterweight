/** Explicit owner CLI. Importing it has no keychain, signing or sending side effects. */
import { execFile } from 'node:child_process';
import { promisify, isDeepStrictEqual } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { PublicClient, runtime, extractHash } from '../apps/keeper/src/run-io.js';
import { getSigningDigest, mpcToHyperliquidSignature, recoveredSigner, type SigningInput } from '../packages/hyperliquid/src/index.js';
import { BASE, decimal, orderPrice, parseMarket, units } from './lifecycle-config.js';
import { parseAccount } from './lifecycle-parsing.js';
import { checkPolicy, loadMainnetPlan, mainnetLifecycle, MAINNET_PLAN, V4_WASM } from './mainnet-lifecycle.js';
import { assertSigningResources, readSigningResources } from './mainnet-signer.js';
import { committedWasm, parseOptions, publicKey, txHash } from './testnet-common.js';
import { checkOwnerSpend } from './mainnet-budget.js';

export const OWNER_ACCOUNTS = { owner: 'haxheton.near', policy: 'cw4.haxheton.near', keeper: 'keeper4.haxheton.near' };
const evidence = 'docs/evidence/mainnet-owner-v4';
export const OWNER_LIFECYCLE_EVIDENCE = 'docs/evidence/mainnet-owner-v4-lifecycle';
const execute = promisify(execFile);
type Plan = Awaited<ReturnType<typeof loadMainnetPlan>>;
const suffix = ['network-config', 'mainnet', 'sign-with-keychain', 'send'];
const client = () => new PublicClient(runtime(), undefined, 'mainnet');
export function assertOwnerPlan(plan: Pick<Plan, 'owner' | 'policy' | 'keeper'>) {
  for (const key of ['owner', 'policy', 'keeper'] as const) if (plan[key] !== OWNER_ACCOUNTS[key]) throw new Error(`Owner fixed ${key} mismatch`);
}
export function chooseSpot(mark: string, szDecimals: number, maxShort: string) {
  const price = units(mark, 6), lot = 10n ** BigInt(24 - szDecimals);
  const amount = [12_000_000n * BASE / price, 398n * BASE / 100n, BigInt(maxShort)].reduce((a, b) => a < b ? a : b) / lot * lot;
  const limit = orderPrice(price, szDecimals, false, 100);
  if (amount <= 0n || amount * limit < 10_000_000n * BASE) throw new Error('Owner budget cannot fit the venue $10 minimum with <=3.98 NEAR; STOP before account creation');
  return { amount: decimal(amount, 24), yocto: amount.toString(), totalNear: decimal(722n * BASE / 100n + amount, 24) };
}
function call(plan: Plan, method: string, args: unknown, caller = plan.owner, gas = '30 Tgas', deposit = '0 NEAR') {
  return ['contract', 'call-function', 'as-transaction', plan.policy, method, 'json-args', JSON.stringify(args), 'prepaid-gas', gas,
    'attached-deposit', deposit, 'sign-as', caller, ...suffix];
}
export async function assertFinalSuccess(raw: unknown, hash: string, signer: string, receiver: string) {
  return z.object({ final_execution_status: z.literal('FINAL'), status: z.object({ SuccessValue: z.string() }).strict(),
    transaction: z.object({ hash: z.literal(hash), signer_id: z.literal(signer), receiver_id: z.literal(receiver) }),
    receipts_outcome: z.array(z.object({ outcome: z.object({ status: z.record(z.string(), z.unknown()).refine(s => !('Failure' in s)) }) })) }).parse(raw);
}
/** Validate a no-exposure fixed-market cancel through the real policy->MPC->callback path. */
export async function verifySigningTest(raw: unknown, hash: string, plan: Plan) {
  await assertFinalSuccess(raw, hash, plan.keeper, plan.policy);
  const tx = z.object({ status: z.object({ SuccessValue: z.literal('dHJ1ZQ==') }), transaction: z.object({ actions: z.array(z.object({ FunctionCall: z.object({
    method_name: z.literal('request_cancel_signature'), args: z.string(), deposit: z.literal('0') }) }).strict()).length(1) }),
    receipts_outcome: z.array(z.object({ block_hash: z.string(), outcome: z.object({ executor_id: z.string(), logs: z.array(z.string()), status: z.record(z.string(), z.unknown()) }) })) }).parse(raw);
  if (!isDeepStrictEqual(JSON.parse(Buffer.from(tx.transaction.actions[0]!.FunctionCall.args, 'base64').toString()), { order_id: '0' })) throw new Error('Owner test cancel arguments mismatch');
  const events = tx.receipts_outcome.filter(r => r.outcome.executor_id === plan.policy).flatMap(r => r.outcome.logs.filter(l => l.startsWith('EVENT_JSON:')).map(l => ({
    block: r.block_hash, status: r.outcome.status, event: z.object({ standard: z.literal('counterweight'), version: z.literal('1.0.0'), event: z.string(), data: z.array(z.unknown()).length(1) }).parse(JSON.parse(l.slice(11))) })));
  const requests = events.filter(e => e.event.event === 'request'), signatures = events.filter(e => e.event.event === 'signature');
  if (requests.length !== 1 || signatures.length !== 1) throw new Error('Owner test requires exactly one request and signature');
  const request = z.object({ id: z.string(), caller: z.literal(plan.keeper), kind: z.literal('Cancel'), digest: z.string(), payload: z.object({
    nonce: z.number().int().positive(), expiresAfter: z.number().int().positive(), action: z.object({ type: z.literal('cancel'), cancels: z.array(z.object({ a: z.literal(plan.init.asset_index), o: z.literal(0) }).strict()).length(1) }).strict() }).strict() }).parse(requests[0]!.event.data[0]);
  const sig = z.object({ id: z.literal(request.id), nonce: z.literal(String(request.payload.nonce)), expiresAfter: z.literal(String(request.payload.expiresAfter)), signature: z.unknown() }).parse(signatures[0]!.event.data[0]);
  if (signatures[0]!.status.SuccessValue !== 'dHJ1ZQ==' || request.payload.expiresAfter - request.payload.nonce !== 60000) throw new Error('Owner test callback/expiry mismatch');
  const input: SigningInput = { scheme: 'l1', network: 'mainnet', nonce: request.payload.nonce, expiresAfter: request.payload.expiresAfter, action: request.payload.action };
  const digest = getSigningDigest(input);
  if (digest.slice(2) !== request.digest || (await recoveredSigner(digest, mpcToHyperliquidSignature(sig.signature))).toLowerCase() !== plan.derived.address) throw new Error('Owner test signature digest/recovery mismatch');
  return { hash, nonce: request.payload.nonce, expiresAfter: request.payload.expiresAfter, blocks: [...new Set([requests[0]!.block, signatures[0]!.block])] };
}
async function send(step: string, args: string[], signer: string, receiver: string, pc: PublicClient) {
  const folder = /^(spot|storage-|wrap$|reconcile$|return-spot$|unpause$|abandon-withdrawal$)/.test(step) ? OWNER_LIFECYCLE_EVIDENCE : evidence;
  const journal = `${folder}/${step}.json`;
  // A retry is a public finality check, never a second transfer. Keep the exact
  // arguments even when finality/CLI output fails so sub-step identity survives.
  let saved: unknown;
  try { saved = JSON.parse(await readFile(journal, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  if (saved !== undefined) {
    const result = await reconcileOwnerJournal(saved, args, signer, receiver, pc);
    console.log(`SKIP ${step}; existing transaction ${result.hash} finalized`);
    return result;
  }
  const depositText = args[args.indexOf('attached-deposit') + 1];
  const createBalance = args[0] === 'account' && args[1] === 'create-account' ? args[4] : undefined;
  const deposit = createBalance ?? (args.includes('attached-deposit') ? depositText : '0 NEAR');
  const attached = deposit?.endsWith(' yoctoNEAR') ? BigInt(deposit.split(' ')[0]!) : units((deposit ?? '0 NEAR').split(' ')[0]!, 24);
  const gas = args.includes('prepaid-gas') ? Number(args[args.indexOf('prepaid-gas') + 1]!.split(' ')[0]) : 300;
  await checkOwnerSpend(pc, OWNER_ACCOUNTS.owner, signer, attached, gas);
  await mkdir(folder, { recursive: true });
  await writeFile(journal, JSON.stringify({ phase: 'claimed-before-send', args, signer, receiver }), { flag: 'wx' });
  console.log(`OWNER EXECUTES near ${args.join(' ')}`);
  let submittedHash: string | undefined;
  try {
    const result = await execute('near', args, { encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024 });
    const hash = extractHash(`${result.stdout}\n${result.stderr}`);
    submittedHash = hash;
    await writeFile(journal, JSON.stringify({ phase: 'sent-awaiting-finality', hash, args, signer, receiver }));
    const raw = await pc.rpc('tx', { tx_hash: hash, sender_account_id: signer, wait_until: 'FINAL' });
    await assertFinalSuccess(raw, hash, signer, receiver);
    await writeFile(journal, JSON.stringify({ phase: 'final-success', hash, args, signer, receiver, raw }, null, 2));
    console.log(`PASS ${step} finalized ${hash}`); return { hash, raw };
  } catch (error) {
    if (!submittedHash) {
      const output = error as { stdout?: string; stderr?: string };
      try { submittedHash = extractHash(`${output.stdout ?? ''}\n${output.stderr ?? ''}`); } catch { /* An absent hash remains uncertain. */ }
      if (submittedHash) await writeFile(journal, JSON.stringify({ phase: 'sent-awaiting-finality', hash: submittedHash, args, signer, receiver }));
    }
    console.error(`STOP: ${step} not proven successful. Preserve ${journal}; never blindly repeat a possibly sent transaction.`); throw error;
  }
}
export async function reconcileOwnerJournal(saved: unknown, args: string[], signer: string, receiver: string, pc: PublicClient) {
  const j = z.object({ phase: z.enum(['final-success', 'sent-awaiting-finality']), hash: z.string(), args: z.array(z.string()), signer: z.literal(signer), receiver: z.literal(receiver) }).safeParse(saved);
  if (!j.success || !isDeepStrictEqual(j.data.args, args)) throw new Error('Existing owner sub-step is uncertain or arguments differ; preserve journal and reconcile the exact transaction publicly before retry');
  const hash = txHash(j.data.hash), raw = await pc.rpc('tx', { tx_hash: hash, sender_account_id: signer, wait_until: 'FINAL' });
  await assertFinalSuccess(raw, hash, signer, receiver);
  if (args[0] === 'contract' && args[1] === 'call-function') {
    const action = z.object({ transaction: z.object({ actions: z.array(z.object({ FunctionCall: z.object({ method_name: z.literal(args[4]!), args: z.string(), deposit: z.string().regex(/^\d+$/), gas: z.union([z.string(), z.number()]).transform(String) }) }).strict()).length(1) }) }).parse(raw).transaction.actions[0]!.FunctionCall;
    const depositText = args[args.indexOf('attached-deposit') + 1] ?? '0 NEAR';
    const wantedDeposit = depositText.endsWith(' yoctoNEAR') ? BigInt(depositText.split(' ')[0]!) : units(depositText.split(' ')[0]!, 24);
    const wantedGas = BigInt((args[args.indexOf('prepaid-gas') + 1] ?? '0 Tgas').split(' ')[0]!) * 10n ** 12n;
    if (!isDeepStrictEqual(JSON.parse(Buffer.from(action.args, 'base64').toString('utf8')), JSON.parse(args[args.indexOf('json-args') + 1]!)) || BigInt(action.deposit) !== wantedDeposit || BigInt(action.gas) !== wantedGas)
      throw new Error('Finalized owner sub-step public ABI arguments, deposit or gas mismatch');
  }
  return { hash, raw };
}
export function assertWithdrawalAbandonmentAllowed(rawAuthorizations: unknown, nonce: bigint, finalizedAtMs: bigint) {
  // Authorization fields are plain Rust u64 JSON numbers. MarginWithdrawal uses
  // U64 and therefore its nonce is a JSON string; do not conflate these ABIs.
  const uint = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
  const auths = z.array(z.object({ nonce: uint, withdrawal: z.boolean(), expires_after: uint, invalidation_confirmed: z.boolean() }).passthrough()).parse(rawAuthorizations);
  const authorization = auths.find(a => a.withdrawal && BigInt(a.nonce) === nonce);
  const expiry = authorization ? BigInt(authorization.expires_after) : nonce + 172_800_001n;
  if (!authorization?.invalidation_confirmed && finalizedAtMs <= expiry) throw new Error(`Withdrawal signature remains replayable until after ${expiry} ms; wait past its full 48-hour window, never resubmit withdraw3`);
}
async function readStepHash(step: string) {
  return z.object({ phase: z.literal('final-success'), hash: z.string() }).parse(JSON.parse(await readFile(`${evidence}/${step}.json`, 'utf8'))).hash;
}
async function ask(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(question)).trim(); } finally { rl.close(); }
}
async function account(pc: PublicClient, account_id: string) {
  return z.object({ amount: z.string(), storage_usage: z.number(), locked: z.string(), code_hash: z.string(), block_hash: z.string() }).parse(await pc.rpc('query', { request_type: 'view_account', account_id, finality: 'final' }));
}
async function assertAbsent(pc: PublicClient, account_id: string) {
  // PublicClient deliberately masks RPC errors; inspect a raw public response to distinguish absence from transport failure.
  const { MAINNET_RPC } = await import('../packages/hyperliquid/src/index.js');
  const response = await fetch(MAINNET_RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 'owner-absence', method: 'query', params: { request_type: 'view_account', account_id, finality: 'final' } }), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Owner account absence RPC unavailable');
  const raw = await response.json();
  if (!z.object({ error: z.object({ cause: z.object({ name: z.literal('UNKNOWN_ACCOUNT') }) }) }).safeParse(raw).success) throw new Error(`Owner ${account_id} already exists or absence unverified; STOP`);
}
export async function predeleteGate(pc: PublicClient, plan: Plan) {
  const current = await checkPolicy(pc, plan, false);
  if (current.margin === null || current.state.pending !== null || current.state.paused) throw new Error('Owner gate requires initialized configured idle unpaused policy');
  const live = await readSigningResources(pc);
  assertSigningResources(plan.signingResources, live.minimumGasTgas, live.fee);
  const hash = txHash(await readStepHash('sign-test'));
  const raw = await pc.rpc('tx', { tx_hash: hash, sender_account_id: plan.keeper, wait_until: 'FINAL' });
  const proof = await verifySigningTest(raw, hash, plan);
  for (const block of proof.blocks) await checkPolicy(pc, plan, false, block);
  const keys = z.object({ block_hash: z.literal(current.block), keys: z.array(z.object({ public_key: z.string(), access_key: z.object({ permission: z.literal('FullAccess') }) })).length(1) })
    .parse(await pc.rpc('query', { request_type: 'view_access_key_list', account_id: plan.policy, block_id: current.block }));
  const keeperKeys = z.object({ keys: z.array(z.object({ access_key: z.object({ permission: z.unknown() }) })).min(1) }).parse(await pc.rpc('query', { request_type: 'view_access_key_list', account_id: plan.keeper, finality: 'final' }));
  if (!keeperKeys.keys.some(k => k.access_key.permission === 'FullAccess')) throw new Error('Owner keeper has no full-access signing path');
  const keeper = await account(pc, plan.keeper);
  if (BigInt(keeper.amount) - BigInt(keeper.storage_usage) * 10n ** 19n < BASE / 100n) throw new Error('Owner keeper gas insufficient');
  console.log('PASS predelete: deployed code + initialization + margin config + live resources + actual recovered MPC test signature');
  return { publicKey: publicKey(keys.keys[0]!.public_key), proof, block: current.block };
}
export async function ownerMainnet(argv: string[]) {
  const opts = parseOptions(argv, ['step']);
  z.enum(['plan', 'create-keeper', 'create-policy', 'deploy', 'resources', 'margin', 'sign-test', 'predelete', 'delete-key', 'spot', 'reconcile', 'return-spot', 'status', 'unpause', 'abandon-withdrawal']).parse(opts.step);
  const pc = client();
  if (opts.step === 'plan') {
    const recipient = z.string().regex(/^0x[0-9a-fA-F]{40}$/).refine(s => !/^0x0{40}$/.test(s)).parse(await ask('Public owner EVM address (Arbitrum One native USDC recipient): '));
    const [balance] = await Promise.all([account(pc, OWNER_ACCOUNTS.owner), assertAbsent(pc, OWNER_ACCOUNTS.policy), assertAbsent(pc, OWNER_ACCOUNTS.keeper)]);
    const available = BigInt(balance.amount) - BigInt(balance.storage_usage) * 10n ** 19n;
    if (available < 112n * BASE / 10n) throw new Error('Owner liquid balance below conservative 11.20 NEAR budget');
    // Feasibility is checked before exclusively saving the plan; no funded accounts yet.
    const market = parseMarket(await pc.info({ type: 'metaAndAssetCtxs' }));
    const { mainnetInitialization } = await import('./mainnet-lifecycle.js');
    const init = mainnetInitialization(OWNER_ACCOUNTS.owner, OWNER_ACCOUNTS.keeper, recipient, market);
    chooseSpot(market.mark, market.szDecimals, init.limits.max_short_size);
    await mainnetLifecycle(['--network=mainnet', '--i-understand-real-funds', '--step=plan', `--owner=${OWNER_ACCOUNTS.owner}`, `--policy=${OWNER_ACCOUNTS.policy}`, `--keeper=${OWNER_ACCOUNTS.keeper}`, `--owner-evm=${recipient}`]);
    const p = await loadMainnetPlan(MAINNET_PLAN), backing = chooseSpot(p.market.mark, p.market.szDecimals, p.init.limits.max_short_size);
    await mkdir(evidence, { recursive: true });
    await writeFile(`${evidence}/budget.json`, JSON.stringify({ ...backing, maximumNear: '11.20', ownerBalanceAtPlan: balance.amount }, null, 2), { flag: 'wx' });
    console.log(`PASS plan: backing ${backing.amount} NEAR; total ${backing.totalNear} NEAR <=11.20. Derived strategy ${p.derived.address}`); return;
  }
  const plan = await loadMainnetPlan(MAINNET_PLAN); assertOwnerPlan(plan);
  const sent = async (args: string[], signer: string, receiver: string) => send(opts.step!, args, signer, receiver, pc);
  if (opts.step === 'create-keeper' || opts.step === 'create-policy') {
    const keeper = opts.step === 'create-keeper', target = keeper ? plan.keeper : plan.policy;
    await assertAbsent(pc, target);
    await sent(['account', 'create-account', 'fund-myself', target, keeper ? '0.1 NEAR' : '7 NEAR', 'autogenerate-new-keypair', 'save-to-keychain', 'sign-as', plan.owner, ...suffix], plan.owner, target); return;
  }
  if (opts.step === 'deploy') {
    const artifact = await committedWasm(V4_WASM, 'contracts/policy/artifacts/SHA256SUMS.v4');
    if (!isDeepStrictEqual(artifact, plan.artifact)) throw new Error('Owner artifact mismatch');
    await sent(['contract', 'deploy', plan.policy, 'use-file', V4_WASM, 'with-init-call', 'new', 'json-args', JSON.stringify(plan.init), 'prepaid-gas', '30 Tgas', 'attached-deposit', '0 NEAR', ...suffix], plan.policy, plan.policy);
    await checkPolicy(pc, plan, false); return;
  }
  if (opts.step === 'resources') {
    const live = await readSigningResources(pc);
    assertSigningResources(plan.signingResources, live.minimumGasTgas, live.fee);
    const { fee, signer_gas_tgas, callback_gas_tgas } = plan.signingResources;
    await sent(call(plan, 'set_signing_resources', { fee, signer_gas_tgas, callback_gas_tgas }), plan.owner, plan.policy); return;
  }
  if (opts.step === 'margin') { await sent(call(plan, 'configure_margin_withdrawals', { limits: plan.marginLimits }), plan.owner, plan.policy); await checkPolicy(pc, plan, false); return; }
  if (opts.step === 'sign-test') {
    const state = await checkPolicy(pc, plan, false);
    if (state.margin === null || state.state.pending !== null || state.state.paused) throw new Error('Owner finish resources/margin before signature test');
    const result = await sent(call(plan, 'request_cancel_signature', { order_id: '0' }, plan.keeper, '300 Tgas'), plan.keeper, plan.policy);
    await verifySigningTest(result.raw, result.hash, plan);
    console.log('PASS real MPC signature path; cancellation is test-only and is never relayed to the venue'); return;
  }
  if (opts.step === 'predelete' || opts.step === 'delete-key') {
    const gate = await predeleteGate(pc, plan);
    if (opts.step === 'predelete') return;
    await sent(['account', 'delete-keys', plan.policy, 'public-keys', gate.publicKey, ...suffix], plan.policy, plan.policy);
    const keys = z.object({ keys: z.array(z.unknown()).length(0) }).parse(await pc.rpc('query', { request_type: 'view_access_key_list', account_id: plan.policy, finality: 'final' }));
    console.log(`PASS zero access keys at finality (${keys.keys.length}); policy custody is now irreversible`); return;
  }
  if (opts.step === 'status') {
    const policy = await checkPolicy(pc, plan, true);
    const [clearing, openOrders, owner, keeper, nativePolicy] = await Promise.all([
      pc.info({ type: 'clearinghouseState', user: plan.derived.address }), pc.info({ type: 'openOrders', user: plan.derived.address }),
      account(pc, plan.owner), account(pc, plan.keeper), account(pc, plan.policy),
    ]);
    const venue = parseAccount(clearing), orders = z.array(z.unknown()).parse(openOrders);
    if (policy.state.pending !== null || policy.state.signed_short_size !== '0' || policy.token !== '0' || venue.signedSize !== 0 || venue.otherPositions.length || orders.length ||
      !z.object({ withdrawal: z.null() }).safeParse(policy.margin).success) throw new Error('Owner final status unresolved; preserve evidence');
    await mkdir(OWNER_LIFECYCLE_EVIDENCE, { recursive: true });
    const file = `${OWNER_LIFECYCLE_EVIDENCE}/final-status-${Date.now()}.json`;
    const result = { policy, venue, orders, balances: { owner, keeper, nativePolicy }, derivedAddress: plan.derived.address };
    await writeFile(file, JSON.stringify(result, null, 2), { flag: 'wx' });
    console.log(JSON.stringify(result, null, 2)); console.log(`PASS final status saved ${file}`); return;
  }
  const policy = await checkPolicy(pc, plan, true);
  if (opts.step === 'abandon-withdrawal') {
    const withdrawal = z.object({ withdrawal: z.object({ nonce: z.string().regex(/^\d+$/), amount: z.string().regex(/^\d+$/) }) }).parse(policy.margin).withdrawal;
    const nonce = BigInt(withdrawal.nonce);
    const block = z.object({ header: z.object({ timestamp_nanosec: z.string().regex(/^\d+$/) }) }).parse(await pc.rpc('block', { finality: 'final' }));
    const nowMs = BigInt(block.header.timestamp_nanosec) / 1_000_000n;
    assertWithdrawalAbandonmentAllowed(policy.fullState.outstanding, nonce, nowMs);
    const ledger = z.array(z.object({ time: z.number(), delta: z.object({ type: z.string(), nonce: z.number().optional() }).passthrough() })).parse(await pc.info({ type: 'userNonFundingLedgerUpdates', user: plan.derived.address, startTime: Number(nonce) - 5000, endTime: Number(nowMs) }));
    if (ledger.length >= 2000 || ledger.some(e => e.delta.type === 'withdraw' && (e.delta.nonce === undefined || BigInt(e.delta.nonce) === nonce * 1000n))) throw new Error('Withdrawal may have been consumed; reconcile destination receipt instead of abandonment');
    if (await ask('After checking the venue ledger AND Arbitrum recipient history, type NO_RECEIPT only if this withdrawal never arrived: ') !== 'NO_RECEIPT') throw new Error('Owner absence attestation required');
    await sent(call(plan, 'abandon_margin_withdrawal', {}), plan.owner, plan.policy);
    const after = await checkPolicy(pc, plan, true);
    if (!z.object({ withdrawal: z.null() }).safeParse(after.margin).success) throw new Error('Withdrawal abandonment not proven');
    console.log('PASS expired/unusable withdrawal abandoned; refresh margin before any further request'); return;
  }
  if (opts.step === 'unpause') {
    const venue = parseAccount(await pc.info({ type: 'clearinghouseState', user: plan.derived.address }));
    const orders = z.array(z.unknown()).parse(await pc.info({ type: 'openOrders', user: plan.derived.address }));
    if (!policy.state.paused || policy.state.pending !== null || policy.state.signed_short_size !== '0' || venue.signedSize !== 0 || venue.otherPositions.length || orders.length ||
      Date.now() <= Number(policy.state.last_open_expiry) || !z.object({ withdrawal: z.null() }).safeParse(policy.margin).success)
      throw new Error('Owner unpause requires reconciled flat settled policy and venue');
    await sent(call(plan, 'set_paused', { paused: false }), plan.owner, plan.policy); return;
  }
  if (opts.step === 'spot') {
    const budget = z.object({ amount: z.string(), yocto: z.string(), totalNear: z.string() }).parse(JSON.parse(await readFile(`${evidence}/budget.json`, 'utf8')));
    if (units(budget.amount, 24) > 398n * BASE / 100n || units(budget.totalNear, 24) > 112n * BASE / 10n || !['0', budget.yocto].includes(policy.token)) throw new Error('Owner spot budget or preexisting balance mismatch');
    const budgetAmount = units(budget.amount, 24);
    if (budgetAmount.toString() !== budget.yocto || units(budget.totalNear, 24) !== 722n * BASE / 100n + budgetAmount) throw new Error('Owner budget evidence mismatch');
    const depositArgs = ['contract', 'call-function', 'as-transaction', 'wrap.near', 'ft_transfer_call', 'json-args', JSON.stringify({ receiver_id: plan.policy, amount: budget.yocto, msg: '' }), 'prepaid-gas', '100 Tgas', 'attached-deposit', '1 yoctoNEAR', 'sign-as', plan.owner, ...suffix];
    if (policy.token === budget.yocto) {
      const saved: unknown = JSON.parse(await readFile(`${OWNER_LIFECYCLE_EVIDENCE}/spot.json`, 'utf8'));
      await reconcileOwnerJournal(saved, depositArgs, plan.owner, 'wrap.near', pc);
      console.log(`SKIP spot; finalized deposit and exact ${budget.amount} wNEAR custody verified`); return;
    }
    const initialOwned = BigInt(z.string().regex(/^\d+$/).parse((await pc.view('wrap.near', 'ft_balance_of', { account_id: plan.owner })).value));
    const initialMissing = budgetAmount > initialOwned ? budgetAmount - initialOwned : 0n;
    // Reserve all remaining deposits and prepaid gas before beginning a multi-tx
    // step, so wrapping cannot strand the following custody transfer.
    await checkOwnerSpend(pc, plan.owner, plan.owner, initialMissing + BASE / 50n + 1n, 190);
    for (const target of [plan.owner, plan.policy]) await send(`storage-${target}`, ['contract', 'call-function', 'as-transaction', 'wrap.near', 'storage_deposit', 'json-args', JSON.stringify({ account_id: target, registration_only: true }), 'prepaid-gas', '30 Tgas', 'attached-deposit', '0.01 NEAR', 'sign-as', plan.owner, ...suffix], plan.owner, 'wrap.near', pc);
    const wrapArgs = (amount: bigint) => ['contract', 'call-function', 'as-transaction', 'wrap.near', 'near_deposit', 'json-args', '{}', 'prepaid-gas', '30 Tgas', 'attached-deposit', `${decimal(amount, 24)} NEAR`, 'sign-as', plan.owner, ...suffix];
    let priorWrap: unknown;
    try { priorWrap = JSON.parse(await readFile(`${OWNER_LIFECYCLE_EVIDENCE}/wrap.json`, 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    if (priorWrap !== undefined) {
      const previous = z.object({ args: z.array(z.string()) }).parse(priorWrap).args;
      const amount = units((previous[previous.indexOf('attached-deposit') + 1] ?? '').split(' ')[0]!, 24);
      if (amount <= 0n || amount > budgetAmount) throw new Error('Saved wrap amount exceeds frozen spot budget');
      await reconcileOwnerJournal(priorWrap, wrapArgs(amount), plan.owner, 'wrap.near', pc);
      console.log('SKIP wrap; previous exact transaction finalized');
    }
    const owned = z.string().regex(/^\d+$/).parse((await pc.view('wrap.near', 'ft_balance_of', { account_id: plan.owner })).value);
    const missing = budgetAmount > BigInt(owned) ? budgetAmount - BigInt(owned) : 0n;
    if (missing > 0n && priorWrap !== undefined) throw new Error('Previously finalized wrapping no longer covers spot budget; inspect owner wNEAR history before any further wrapping');
    if (missing > 0n) await send('wrap', wrapArgs(missing), plan.owner, 'wrap.near', pc);
    await sent(depositArgs, plan.owner, 'wrap.near');
    const after = await checkPolicy(pc, plan, true);
    if (after.token !== budget.yocto) throw new Error('Owner deposited spot custody not proven');
    console.log(`PASS spot custody ${budget.amount} wNEAR`); return;
  }
  if (opts.step === 'return-spot') {
    const venue = parseAccount(await pc.info({ type: 'clearinghouseState', user: plan.derived.address }));
    const orders = z.array(z.unknown()).parse(await pc.info({ type: 'openOrders', user: plan.derived.address }));
    if (venue.signedSize !== 0 || venue.otherPositions.length || orders.length || policy.state.signed_short_size !== '0' || policy.token === '0') throw new Error('Owner return-spot requires settled flat venue, no orders, positive custody');
    const before = z.string().regex(/^\d+$/).parse((await pc.view('wrap.near', 'ft_balance_of', { account_id: plan.owner })).value);
    await sent(call(plan, 'withdraw_spot', { recipient: plan.owner, amount: policy.token }, plan.owner, '80 Tgas', '1 yoctoNEAR'), plan.owner, plan.policy);
    const after = await checkPolicy(pc, plan, true);
    const balance = z.string().regex(/^\d+$/).parse((await pc.view('wrap.near', 'ft_balance_of', { account_id: plan.owner })).value);
    if (after.token !== '0' || BigInt(balance) - BigInt(before) !== BigInt(policy.token)) throw new Error('Owner spot return not proven');
    console.log(`PASS returned ${decimal(BigInt(policy.token), 24)} wNEAR to ${plan.owner}; held as wNEAR`); return;
  }
  if (opts.step === 'reconcile') {
    const pending = z.object({ withdrawal: z.object({ nonce: z.string(), amount: z.string() }).passthrough() }).parse(policy.margin).withdrawal;
    console.log(`Verify native USDC receipt to ${plan.init.evm_recipient} on Arbitrum One (42161), gross ${pending.amount} micro-USDC.`);
    const receipt_id = z.string().regex(/^0x[0-9a-fA-F]{64}$/).parse(await ask('Successful finalized Arbitrum transaction hash: '));
    const received_usdc = units(await ask('Actual native USDC net received (decimal USDC): '), 6).toString();
    const fee_usdc = units(await ask('Actual bridge fee (decimal USDC, maximum 1): '), 6).toString();
    if (BigInt(received_usdc) <= 0n || BigInt(fee_usdc) > 1_000_000n || BigInt(received_usdc) + BigInt(fee_usdc) !== BigInt(pending.amount)) throw new Error('Owner receipt net + fee does not equal gross');
    if (await ask('Type VERIFIED only after checking receipt success, chain, native USDC token, recipient and amount: ') !== 'VERIFIED') throw new Error('Owner receipt not verified');
    await sent(call(plan, 'reconcile_margin_withdrawal', { nonce: pending.nonce, received_usdc, fee_usdc, receipt_id, finalized_at_ms: String(Date.now()) }), plan.owner, plan.policy);
    const after = await checkPolicy(pc, plan, true);
    if (z.object({ withdrawal: z.null() }).safeParse(after.margin).success !== true) throw new Error('Owner reconciliation not proven');
    console.log('PASS owner-attested Arbitrum receipt reconciled; venue ledger alone was not destination proof'); return;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  ownerMainnet(process.argv.slice(2)).catch(error => { console.error(`STOP: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
