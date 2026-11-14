import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { accountForNetwork, assembleRequest, deriveAddress, MAINNET_API, MAINNET_RPC, nearMarketIndex, recoveredSigner } from '../packages/hyperliquid/src/index.js';
import { PublicClient, runtime } from '../apps/keeper/src/run-io.js';
import { stateSchema } from '../apps/keeper/src/run-state.js';
import { BASE, decimal, orderPrice, parseMarket, priceBounds, units, v3ExitPrice } from './lifecycle-config.js';
import { parseAccount, parseLifecycleReceipt, parseMainnetWithdrawal, spotUsdc, verifyClassTransfer, verifyFill, WITHDRAWAL_WINDOW_MS, type ExpectedCall } from './lifecycle-parsing.js';
import { committedWasm, ORACLE, parseOptions, publicKey, SIGNING_LIMITS, txHash } from './testnet-common.js';
import { shellQuote } from './proof-plan.js';
import { assertSigningResources, readSigningResources, signingResourcesSchema } from './mainnet-signer.js';

export function assertSingleLabelChild(account: string, owner: string) {
  accountForNetwork(account, 'mainnet'); accountForNetwork(owner, 'mainnet');
  const label = account.slice(0, -(owner.length + 1));
  if (!account.endsWith(`.${owner}`) || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(label)) throw new Error('Policy and keeper must be single-label owner sub-accounts');
}
/** The venue accepts nonces for two days; allow 5 seconds for transport. */
export function assertMainnetRelayFresh(input: import('../packages/hyperliquid/src/index.js').SigningInput, nonce: number, now = Date.now()) {
  if (nonce > now + 1000 || nonce <= now - 172_800_000 + 5000 ||
      (input.scheme === 'l1' && ((input.expiresAfter ?? 0) <= now + 5000 || (input.action.type !== 'noop' && now - nonce > 55000))))
    throw new Error('Contract mainnet signature too old; inspect authorizations and public history before replacement');
}
export function assertMainnetUserUnsubmitted(raw: unknown, method: string, nonce: number) {
  const entries = z.array(z.object({ time: z.number(), delta: z.object({ type: z.string(), nonce: z.number().optional() }).passthrough() })).parse(raw);
  if (entries.length >= 2000 || entries.some(e => e.time >= ledgerStartTime(nonce) && (method === 'request_usd_class_transfer' ? e.delta.type === 'accountClassTransfer' : e.delta.type === 'withdraw')))
    throw new Error('User signature may already have been submitted; reconcile public history, do not relay again');
}

export const ledgerStartTime = (nonce: number) => Math.max(0, nonce - 5000);
/** Only public reads retry. Signing/relay transactions are never retried. */
export async function mainnetInfo(client: PublicClient, body: Record<string, unknown>) {
  for (let attempt = 0; ; attempt++) {
    try { return await client.info(body); }
    catch (error) { if (attempt === 3) throw error; await client.rt.sleep(500 * 2 ** attempt); }
  }
}
export async function pollMainnetProof<T>(read: () => Promise<T>, options: {
  timeoutMs?: number; intervalMs?: number; now?: () => number; sleep?: (ms: number) => Promise<void>; print?: (line: string) => void;
} = {}): Promise<T> {
  const now = options.now ?? Date.now, sleep = options.sleep ?? (ms => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const end = now() + (options.timeoutMs ?? 600_000);
  for (;;) {
    try { return await read(); }
    catch (error) {
      if (now() >= end) throw error;
      options.print?.('Waiting for public venue proof; read-only polling, never resubmitting the signature.');
      await sleep(Math.min(options.intervalMs ?? 10_000, Math.max(0, end - now())));
    }
  }
}
export function mainnetTransferAmount(equity: number, availableSpot: bigint, explicit?: string) {
  if (!Number.isFinite(equity) || equity < 0 || availableSpot < 0n) throw new Error('Invalid public spot/perps balance');
  if (equity >= 15) return 0n;
  const headroom = 20_000_000n - BigInt(Math.floor(equity * 1e6));
  const amount = explicit === undefined ? (availableSpot < headroom ? availableSpot : headroom) : units(explicit, 6);
  if (amount <= 0n || amount > availableSpot || amount > headroom || equity + Number(amount) / 1e6 < 15)
    throw new Error('Strategy needs at least 15 USDC perps margin; fund its Spot or Perps balance before step 10');
  return amount;
}
export function assertMainnetClock(hostMs: number, nearMs: number, venueMs: number) {
  if (![hostMs, nearMs, venueMs].every(Number.isFinite)) throw new Error('STOP: mainnet clock comparison unavailable');
  // The latest NEAR block is itself about one block time (1-1.5 s) old, so its bound is looser; observations still use min(host, NEAR, venue).
  if (hostMs - nearMs > 3000 || hostMs - venueMs > 1000)
    throw new Error(`STOP: Mac clock is more than 1 s ahead of NEAR/venue (NEAR ${hostMs - nearMs} ms, venue ${hostMs - venueMs} ms). Sync Date & Time, then retry step 12 before any send.`);
}
function nearBlockTime(raw: unknown) {
  const header = z.object({ header: z.object({ timestamp_nanosec: z.string().optional(), timestamp: z.union([z.string(), z.number()]).optional() }) }).parse(raw).header;
  const ms = Number(header.timestamp_nanosec ?? header.timestamp) / 1e6;
  if (!Number.isFinite(ms) || ms <= 0) throw new Error('STOP: NEAR block timestamp unavailable');
  return ms;
}
export async function checkMainnetClock(client: PublicClient) {
  // Compare the start of the public-read interval, not receipt time: network latency must not look like clock drift.
  const started = client.rt.now();
  const [block, book] = await Promise.all([client.rpc('block', { finality: 'optimistic' }), mainnetInfo(client, { type: 'l2Book', coin: 'NEAR' })]);
  const nearMs = nearBlockTime(block);
  const venueMs = z.object({ time: z.number().int().positive() }).parse(book).time;
  assertMainnetClock(started, nearMs, venueMs);
  return Math.min(started, nearMs, venueMs);
}

export const V4_WASM = 'contracts/policy/artifacts/counterweight_policy_v4.wasm';
export const MAINNET_PLAN = 'docs/evidence/policy-v4-mainnet-plan.json';
export const MAINNET_MARGIN_LIMITS = { per_withdrawal_usdc: '20000000', daily_withdrawal_usdc: '20000000',
  min_residual_equity_usdc: '1000000', min_headroom_bps: 1000, fee_reserve_usdc: '100000', max_fee_usdc: '1000000' };
const PATH = 'counterweight-mainnet-v4';
// A user signature can be relayed near day two; retain another day for ledger observation.
const MAINNET_WITHDRAWAL_HISTORY_MS = 3 * WITHDRAWAL_WINDOW_MS;
const suffix = 'network-config mainnet sign-with-keychain send';
export function mainnetCall(policy: string, method: string, args: unknown, caller: string, gas = '30 Tgas', deposit = '0 NEAR') {
  accountForNetwork(policy, 'mainnet'); accountForNetwork(caller, 'mainnet');
  return `near contract call-function as-transaction ${policy} ${method} json-args ${shellQuote(JSON.stringify(args))} prepaid-gas '${gas}' attached-deposit '${deposit}' sign-as ${caller} ${suffix}`;
}
export function mainnetInitialization(owner: string, keeper: string, recipient: string, market: { assetIndex: number; szDecimals: number; mark: string }) {
  accountForNetwork(owner, 'mainnet'); accountForNetwork(keeper, 'mainnet');
  z.string().regex(/^0x[0-9a-fA-F]{40}$/).refine(s => !/^0x0{40}$/.test(s)).parse(recipient);
  z.number().int().nonnegative().parse(market.assetIndex); z.number().int().min(0).max(6).parse(market.szDecimals);
  const bounds = priceBounds(market.mark);
  const lot = 10n ** BigInt(24 - market.szDecimals);
  // Immutable opening quantity ceiling also fits $15 at the initial upper opening bound.
  const maxShort = 15_000_000n * BASE / BigInt(bounds.max_price) / lot * lot;
  if (maxShort <= 0n) throw new Error('Policy $15 cap cannot fit a venue size lot');
  return { owner, keeper, asset_index: market.assetIndex, size_decimals: market.szDecimals, derivation_path: PATH,
    evm_recipient: recipient.toLowerCase(), signer_account: 'v1.signer', wnear_account: 'wrap.near', network: 'Mainnet',
    oracle: { ...ORACLE, min_price: bounds.min_price, max_price: bounds.max_price },
    limits: { max_short_size: maxShort.toString(), per_order_notional_cap: '15000000', per_day_notional_cap: '30000000',
      cooldown_seconds: 60, price_band_bps: 100, price_max_age_seconds: 60 },
    heartbeat_timeout_seconds: 3600, reference_price: bounds.reference_price, signing_limits: SIGNING_LIMITS };
}
const planSchema = z.object({ network: z.literal('mainnet'), policy: z.string(), owner: z.string(), keeper: z.string(),
  market: z.object({ assetIndex: z.number(), szDecimals: z.number(), mark: z.string() }), init: z.unknown(),
  derived: z.object({ address: z.string() }), artifact: z.object({ sha256: z.string(), codeHash: z.string(), bytes: z.number() }), marginLimits: z.unknown(), signingResources: signingResourcesSchema });
export async function loadMainnetPlan(file: string) {
  const p = planSchema.parse(JSON.parse(await readFile(file, 'utf8')));
  accountForNetwork(p.policy, 'mainnet');
  assertSingleLabelChild(p.policy, p.owner); assertSingleLabelChild(p.keeper, p.owner);
  if (p.policy === p.keeper) throw new Error('Policy must be a separate owner sub-account');
  const recipient = z.object({ evm_recipient: z.string() }).parse(p.init).evm_recipient;
  const init = mainnetInitialization(p.owner, p.keeper, recipient, p.market);
  if (!isDeepStrictEqual(init, p.init) || !isDeepStrictEqual(p.marginLimits, MAINNET_MARGIN_LIMITS)) throw new Error('Policy mainnet plan config mismatch');
  const artifact = await committedWasm(V4_WASM, 'contracts/policy/artifacts/SHA256SUMS.v4');
  if (!isDeepStrictEqual(artifact, p.artifact)) throw new Error('Policy mainnet artifact differs from saved plan');
  return { ...p, init };
}
type Plan = Awaited<ReturnType<typeof loadMainnetPlan>>;
export function mainnetSigningGasTgas(plan: Pick<Plan, 'signingResources'>) {
  // lib.rs assert_signing_resources; preserve frozen signer/callback allocations.
  return plan.signingResources.signer_gas_tgas + plan.signingResources.callback_gas_tgas + 25;
}
async function marketAndVenue(client: PublicClient, address: string, checkClock = false) {
  const observedAt = Date.now();
  const [rawMarket, clearing, orders, spot, block, book] = await Promise.all([mainnetInfo(client, { type: 'metaAndAssetCtxs' }),
    mainnetInfo(client, { type: 'clearinghouseState', user: address }), mainnetInfo(client, { type: 'openOrders', user: address }),
    mainnetInfo(client, { type: 'spotClearinghouseState', user: address }), client.rpc('block', { finality: 'optimistic' }), mainnetInfo(client, { type: 'l2Book', coin: 'NEAR' })]);
  const nearMs = nearBlockTime(block), venueMs = z.object({ time: z.number().int().positive() }).parse(book).time;
  if (checkClock) assertMainnetClock(observedAt, nearMs, venueMs);
  // A small accepted ahead offset must never become a future on-chain observation.
  return { observedAt: Math.min(observedAt, nearMs, venueMs), serverNow: Math.max(nearMs, venueMs), market: parseMarket(rawMarket), clearing, account: parseAccount(clearing), spot, orders: z.array(z.unknown()).parse(orders) };
}
export async function checkPolicy(client: PublicClient, plan: Plan, requireKeyless: boolean, block?: string) {
  const p = await client.policy(plan.policy, block);
  const state = z.object({ owner: z.literal(plan.owner), near_recipient: z.literal(plan.owner), wnear_account: z.literal('wrap.near') })
    .passthrough().parse((await client.view(plan.policy, 'get_state', {}, p.block)).value);
  for (const key of ['keeper', 'asset_index', 'size_decimals', 'derivation_path', 'evm_recipient', 'signer_account', 'network', 'oracle', 'limits', 'signing_limits', 'heartbeat_timeout_seconds'] as const)
    if (!isDeepStrictEqual(state[key], plan.init[key])) throw new Error(`Policy mainnet ${key} differs from saved plan`);
  if (p.codeHash !== plan.artifact.codeHash || (requireKeyless && !p.keyless)) throw new Error('Policy mainnet code/access-key check failed');
  if (p.rebalance !== null) throw new Error('Policy mainnet lifecycle requires adapter-free controls');
  if (!block) {
    const liveResources = await readSigningResources(client);
    assertSigningResources(plan.signingResources, liveResources.minimumGasTgas, liveResources.fee);
  }
  for (const [stateKey, resourceKey] of [['mpc_fee', 'fee'], ['signer_gas_tgas', 'signer_gas_tgas'], ['callback_gas_tgas', 'callback_gas_tgas']] as const)
    if (state[stateKey] !== plan.signingResources[resourceKey]) throw new Error(`Policy mainnet ${stateKey} differs from verified resources`);
  const [marginRead, derived, tokenRead] = await Promise.all([client.view(plan.policy, 'get_margin', {}, p.block),
    client.derive(plan.policy, p.state), client.view('wrap.near', 'ft_balance_of', { account_id: plan.policy }, p.block)]);
  const margin = marginRead.value;
  if (margin !== null && !isDeepStrictEqual(z.object({ limits: z.unknown() }).parse(margin).limits, MAINNET_MARGIN_LIMITS)) throw new Error('Policy mainnet margin limits mismatch');
  if (derived !== plan.derived.address) throw new Error('Policy mainnet address differs from saved plan');
  const token = z.string().regex(/^\d+$/).parse(tokenRead.value);
  if (token !== p.state.spot_balance) throw new Error('Policy mainnet wNEAR custody differs from ledger');
  return { ...p, margin, token, fullState: state };
}
const requestSchema = z.object({ network: z.literal('mainnet'), plan: z.string(), createdAt: z.number(), address: z.string(), codeHash: z.string(),
  before: z.object({ clearing: z.unknown(), spot: z.unknown() }), expected: z.object({
    method: z.enum(['request_order_signature', 'request_evm_withdrawal', 'request_usd_class_transfer', 'set_paused', 'request_next_invalidation']), args: z.record(z.string(), z.unknown()),
    caller: z.string(), policy: z.string(), asset: z.number(), reduceOnly: z.boolean(), size: z.string(), price: z.string(), recipient: z.string(), amount: z.string() }) });
const classProofSchema = z.object({ network: z.literal('mainnet'), request: z.string(), hash: z.string(), nonce: z.number().int().nonnegative(), digest: z.string(),
  verifiedAt: z.number().int().nonnegative(), response: z.unknown(), after: z.object({ clearing: z.unknown(), spot: z.unknown() }), ledger: z.unknown() });
function verifyClassLedger(raw: unknown, amount: string, nonce: number, endTime: number) {
  const entries = z.array(z.object({ time: z.number(), hash: z.string(), delta: z.object({ type: z.string(), usdc: z.string().optional(), toPerp: z.boolean().optional(), nonce: z.number().optional() }) })).parse(raw);
  const matches = entries.filter(e => e.time >= ledgerStartTime(nonce) && e.time <= endTime && e.delta.type === 'accountClassTransfer' &&
    e.delta.toPerp === true && e.delta.usdc !== undefined && units(e.delta.usdc, 6) === units(amount, 6) &&
    (e.delta.nonce === undefined || e.delta.nonce === nonce || e.delta.nonce === nonce * 1000));
  if (entries.length >= 2000 || matches.length !== 1) throw new Error('Class transfer needs a unique matching public ledger entry; never infer consumption from an unrelated balance');
  return matches[0]!;
}
/** Class ledgers omit signed nonce; require typed receipt, accepted response, exact deltas and a unique public entry together. */
export async function readConsumedClassTransfers(client: PublicClient, planFile: string, plan: Plan): Promise<Set<number>> {
  const result = new Set<number>();
  let names: string[];
  try { names = await readdir('docs/evidence'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return result; throw error; }
  for (const name of names.filter(n => /^mainnet-v4-to-perp-.*\.request\.json\.verified\.json$/.test(n))) {
    const proof = classProofSchema.parse(JSON.parse(await readFile(`docs/evidence/${name}`, 'utf8')));
    const saved = requestSchema.parse(JSON.parse(await readFile(proof.request, 'utf8')));
    if (saved.plan !== planFile || saved.address !== plan.derived.address || saved.codeHash !== plan.artifact.codeHash ||
      saved.expected.method !== 'request_usd_class_transfer' || saved.expected.policy !== plan.policy || saved.expected.caller !== plan.owner) continue;
    const raw = await client.rpc('tx', { tx_hash: txHash(proof.hash), sender_account_id: plan.owner, wait_until: 'FINAL' });
    const parsed = parseLifecycleReceipt(raw, proof.hash, saved.expected, 'mainnet');
    if (parsed.nonce !== proof.nonce || parsed.digest !== proof.digest || (await recoveredSigner(parsed.digest, parsed.signature)).toLowerCase() !== plan.derived.address)
      throw new Error('Saved class-transfer proof nonce/digest/signer mismatch');
    verifyClassTransfer(proof.response, saved.before.spot, proof.after.spot, parseAccount(saved.before.clearing), parseAccount(proof.after.clearing), saved.expected.amount);
    verifyClassLedger(proof.ledger, saved.expected.amount, parsed.nonce, proof.verifiedAt);
    verifyClassLedger(await mainnetInfo(client, { type: 'userNonFundingLedgerUpdates', user: saved.address,
      startTime: ledgerStartTime(parsed.nonce), endTime: proof.verifiedAt }), saved.expected.amount, parsed.nonce, proof.verifiedAt);
    result.add(parsed.nonce);
  }
  return result;
}
export function mainnetOptions(argv: string[]) {
  const understood = argv.filter(x => x === '--i-understand-real-funds').length;
  if (understood !== 1) throw new Error('Expected --i-understand-real-funds for MAINNET (real funds)');
  const opts = parseOptions(argv.filter(x => x !== '--i-understand-real-funds'), ['network', 'step', 'owner', 'keeper', 'policy', 'owner-evm', 'policy-public-key', 'plan', 'amount', 'request', 'relay-tx', 'commands-file']);
  if (opts.network !== 'mainnet') throw new Error('Expected --network=mainnet');
  z.enum(['plan', 'status', 'spot', 'open', 'close', 'settle', 'withdraw', 'to-perp', 'relay', 'invalidate', 'open-prepare', 'withdraw-prepare', 'settle-prepare']).parse(opts.step);
  return opts;
}
/** Read-only mainnet operator assistant. It prints every transaction/relay for the owner to execute. */
export async function mainnetLifecycle(argv: string[]) {
  const opts = mainnetOptions(argv), planFile = opts.plan ?? MAINNET_PLAN;
  const client = new PublicClient(runtime(), MAINNET_RPC, 'mainnet');
  const commands: string[] = [];
  let requestFile: string | undefined;
  const print = (line: string) => { console.log(line); if (line.startsWith('near ') || line.startsWith('curl ') || line.startsWith('test ')) commands.push(line); };
  try {
  const command = (plan: Plan, method: string, args: unknown, caller = plan.owner, gas = '30 Tgas', deposit = '0 NEAR') => print(mainnetCall(plan.policy, method, args, caller, gas, deposit));
  const repeat = `npm run lifecycle -- --network=mainnet --i-understand-real-funds --plan=${shellQuote(planFile)}`;
  if (opts.step === 'plan') {
    const owner = accountForNetwork(opts.owner ?? '', 'mainnet'), keeper = accountForNetwork(opts.keeper ?? '', 'mainnet');
    const policy = accountForNetwork(opts.policy ?? '', 'mainnet');
    assertSingleLabelChild(policy, owner); assertSingleLabelChild(keeper, owner);
    if (policy === keeper || owner === keeper) throw new Error('Policy/keeper must be separate accounts; policy must be owner sub-account');
    const [rawMarket, derived, artifact, signingResources] = await Promise.all([client.info({ type: 'metaAndAssetCtxs' }), deriveAddress('mainnet', policy, PATH), committedWasm(V4_WASM, 'contracts/policy/artifacts/SHA256SUMS.v4'), readSigningResources(client)]);
    const market = parseMarket(rawMarket);
    const init = mainnetInitialization(owner, keeper, opts['owner-evm'] ?? '', market);
    const upperCreation = BigInt(artifact.bytes + 2048 + 131072) * 10n ** 19n + BASE + BASE / 2n;
    if (upperCreation > 7n * BASE) throw new Error('Policy artifact exceeds conservative 7 NEAR account budget');
    const plan = { network: 'mainnet', policy, owner, keeper, market, init, derived, artifact, signingResources, marginLimits: MAINNET_MARGIN_LIMITS,
      capturedAt: new Date().toISOString(), creationNear: '7', maxMarginUsdc: '20', maxNotionalUsd: '15', rawMarket };
    await mkdir('docs/evidence', { recursive: true });
    await writeFile(planFile, `${JSON.stringify(plan, null, 2)}\n`, { flag: 'wx' });
    const pk = opts['policy-public-key'] ? shellQuote(publicKey(opts['policy-public-key'])) : '"${POLICY_PUBLIC_KEY:?Set the temporary policy PUBLIC key from list-keys}"';
    print(`MAINNET REAL FUNDS. Commands only; no keys read, no NEAR sends, no exchange submission. Plan: ${planFile}`);
    print(`Derived address ${derived.address}; mainnet signer v1.signer; path ${PATH}. NEAR index ${market.assetIndex}, szDecimals ${market.szDecimals} discovered from metaAndAssetCtxs.universe.`);
    print(`Caps: $15/order and $30/rolling day (one retry); margin/class transfer <=20 USDC; venue minimum $10. Opening max size ${decimal(BigInt(init.limits.max_short_size), 24)} NEAR. Mainnet bridge withdraw3 fee $1; destination Arbitrum One. Deposit already-owned USDC to THIS derived account's perps; owner-wallet margin is not policy margin.`);
    print(`near account create-account fund-myself ${policy} '7 NEAR' ${opts['policy-public-key'] ? `use-manually-provided-public-key ${pk}` : 'autogenerate-new-keypair save-to-keychain'} sign-as ${owner} ${suffix}`);
    print(`test "$(shasum -a 256 ${V4_WASM} | cut -d ' ' -f 1)" = '${artifact.sha256}' && near contract deploy ${policy} use-file ${V4_WASM} with-init-call new json-args ${shellQuote(JSON.stringify(init))} prepaid-gas '30 Tgas' attached-deposit '0 NEAR' ${suffix}`);
    print(mainnetCall(policy, 'configure_margin_withdrawals', { limits: MAINNET_MARGIN_LIMITS }, owner));
    print(mainnetCall(policy, 'set_signing_resources', { fee: signingResources.fee, signer_gas_tgas: signingResources.signer_gas_tgas, callback_gas_tgas: signingResources.callback_gas_tgas }, owner));
    print(`Live v1.signer ${signingResources.version}, code ${signingResources.codeHash}, verified release deposit ${signingResources.fee} yoctoNEAR; gas minimum ${signingResources.minimumGasTgas} Tgas; policy ${signingResources.signer_gas_tgas}+${signingResources.callback_gas_tgas}+25 <=300 Tgas. Unknown release or incompatible fee/gas stops planning.`);
    print(`near account view-account-summary ${keeper} network-config mainnet now`);
    print(`Before deleting keys inspect: ${repeat} --step=status`);
    print(`near account list-keys ${policy} network-config mainnet now`);
    print(`IRREVERSIBLE: after verifying code, recipient, config and the sole temporary key, owner removes it:`);
    print(`npx tsx scripts/mainnet-owner.ts --network=mainnet --i-understand-real-funds --plan=${shellQuote(planFile)} --step=delete-key`);
    print(`Verify zero keys at finality: python3 contracts/policy/tools/check_custody_keys.py --rpc ${shellQuote(MAINNET_RPC)} --account ${policy}`);
    print(`Then ${repeat} --step=spot --amount=OWNER_SELECTED_NEAR, followed by --step=open. Keep 0.1 NEAR owner gas and 0.1 NEAR in keeper separately. Account budget already includes >=1 NEAR operating reserve. Total fresh NEAR budget: 7.22 + chosen spot NEAR (7 policy +0.02 registrations +0.1 owner gas +0.1 keeper); subtract new wrapping when using existing wNEAR.`);
    return;
  }
  const plan = await loadMainnetPlan(planFile);
  if (opts.policy && opts.policy !== plan.policy) throw new Error('Policy mainnet option differs from plan');
  const signingStep = ['open', 'close', 'withdraw', 'to-perp', 'relay', 'invalidate', 'open-prepare', 'withdraw-prepare', 'settle-prepare'].includes(opts.step!);
  const policy = await checkPolicy(client, plan, signingStep);
  const venue = await marketAndVenue(client, plan.derived.address, ['open', 'open-prepare'].includes(opts.step!));
  if (venue.market.assetIndex !== plan.init.asset_index || venue.market.szDecimals !== plan.init.size_decimals) throw new Error('Policy mainnet NEAR metadata changed');
  if (opts.step === 'open-prepare') {
    command(plan, 'heartbeat', {}, plan.keeper);
    command(plan, 'set_keeper_price', { price: String(Math.round(Number(venue.market.mark) * 1e6)), observed_at: String(Math.floor(venue.observedAt / 1000)) }, plan.keeper);
    return;
  }
  if (opts.step === 'withdraw-prepare') { command(plan, 'set_reference_price', { price: String(Math.round(Number(venue.market.mark) * 1e6)) }); return; }
  if (opts.step === 'settle-prepare') {
    if (venue.account.signedSize !== 0 || Date.now() <= Number(policy.state.last_open_expiry)) throw new Error('Settlement requires flat venue and expired opening signatures');
    print('Settlement needs no pause in frozen v4; do not discard the consumed class-transfer authorization.'); return;
  }
  if (opts.step === 'spot') {
    const amount = units(z.string().regex(/^(0|[1-9]\d*)(\.\d{1,24})?$/).parse(opts.amount), 24);
    if (amount <= 0n || amount > BigInt(plan.init.limits.max_short_size)) throw new Error('Expected positive spot amount <= planned maximum short; cap limits tiny lifecycle exposure');
    print(mainnetCall('wrap.near', 'storage_deposit', { account_id: plan.policy, registration_only: true }, plan.owner, '30 Tgas', '0.01 NEAR'));
    print(mainnetCall('wrap.near', 'storage_deposit', { account_id: plan.owner, registration_only: true }, plan.owner, '30 Tgas', '0.01 NEAR'));
    print('Skip wrapping if the owner already holds sufficient wNEAR. Otherwise:');
    print(mainnetCall('wrap.near', 'near_deposit', {}, plan.owner, '30 Tgas', `${opts.amount} NEAR`));
    print(mainnetCall('wrap.near', 'ft_transfer_call', { receiver_id: plan.policy, amount: amount.toString(), msg: '' }, plan.owner, '100 Tgas', '1 yoctoNEAR'));
    print(`Verify custody with ${repeat} --step=status; never open until token and policy balances agree.`); return;
  }
  if (opts.step === 'relay' || (opts.step === 'status' && opts.request)) {
    const file = z.string().min(1).parse(opts.request), hash = txHash(opts['relay-tx'] ?? '');
    const saved = requestSchema.parse(JSON.parse(await readFile(file, 'utf8')));
    const expected = saved.expected;
    if (saved.plan !== planFile || saved.address !== plan.derived.address || saved.codeHash !== plan.artifact.codeHash || expected.policy !== plan.policy ||
      expected.asset !== plan.init.asset_index || expected.recipient !== plan.init.evm_recipient ||
      expected.caller !== (expected.method === 'request_order_signature' ? plan.keeper : plan.owner)) throw new Error('Policy saved mainnet request identity mismatch');
    const raw = await client.rpc('tx', { tx_hash: hash, sender_account_id: expected.caller, wait_until: 'FINAL' });
    const parsed = parseLifecycleReceipt(raw, hash, expected, 'mainnet');
    if ((await recoveredSigner(parsed.digest, parsed.signature)).toLowerCase() !== plan.derived.address) throw new Error('Contract mainnet signature recovery mismatch');
    await Promise.all(parsed.blocks.map(block => checkPolicy(client, plan, true, block)));
    if (opts.step === 'relay') {
      assertMainnetRelayFresh(parsed.input, parsed.nonce, venue.serverNow);
      if (parsed.input.scheme === 'user') assertMainnetUserUnsubmitted(await mainnetInfo(client, { type: 'userNonFundingLedgerUpdates', user: saved.address, startTime: ledgerStartTime(parsed.nonce), endTime: Date.now() }), expected.method, parsed.nonce);
      assertMainnetRelayFresh(parsed.input, parsed.nonce, Math.max(venue.serverNow, Date.now()));
      const exchangeFile = `${file}.exchange.json`;
      await writeFile(exchangeFile, `${JSON.stringify(assembleRequest(parsed.input, parsed.signature))}\n`, { flag: 'wx' });
      print('Owner executes this ONCE immediately. Never retry an uncertain exchange submission; inspect public history first. This tool has not submitted it.');
      print(`curl --fail-with-body --silent --show-error --max-time 15 -X POST ${MAINNET_API}/exchange -H 'content-type: application/json' --data-binary @${shellQuote(exchangeFile)} --output ${shellQuote(`${file}.response.json`)}`);
      print(`Inspect response and then ${repeat} --step=status --request=${shellQuote(file)} --relay-tx=${hash}`); return;
    }
    let response: unknown;
    try { response = JSON.parse(await readFile(`${file}.response.json`, 'utf8')); }
    catch (error) { if (expected.method !== 'request_evm_withdrawal' || (!(error instanceof SyntaxError) && (error as NodeJS.ErrnoException).code !== 'ENOENT')) throw error; }
    const proof = await pollMainnetProof(async () => {
      if (['set_paused', 'request_next_invalidation'].includes(expected.method)) return z.object({ status: z.literal('ok'), response: z.object({ type: z.literal('default') }) }).parse(response);
      if (expected.method === 'request_evm_withdrawal') return parseMainnetWithdrawal(response, await mainnetInfo(client, {
        type: 'userNonFundingLedgerUpdates', user: saved.address, startTime: ledgerStartTime(parsed.nonce),
        endTime: Math.min(Date.now(), parsed.nonce + MAINNET_WITHDRAWAL_HISTORY_MS) }), expected.amount, parsed.nonce);
      const after = await marketAndVenue(client, saved.address);
      if (expected.method === 'request_usd_class_transfer') {
        const transfer = verifyClassTransfer(response, saved.before.spot, after.spot, parseAccount(saved.before.clearing), after.account, expected.amount);
        const verifiedAt = Date.now();
        const ledger = await mainnetInfo(client, { type: 'userNonFundingLedgerUpdates', user: saved.address, startTime: ledgerStartTime(parsed.nonce), endTime: verifiedAt });
        verifyClassLedger(ledger, expected.amount, parsed.nonce, verifiedAt);
        await writeFile(`${file}.verified.json`, `${JSON.stringify({ network: 'mainnet', request: file, hash, nonce: parsed.nonce, digest: parsed.digest,
          verifiedAt, response, after: { clearing: after.clearing, spot: after.spot }, ledger }, null, 2)}\n`);
        return transfer;
      }
      return verifyFill(response, await mainnetInfo(client, { type: 'userFills', user: saved.address }), parseAccount(saved.before.clearing), after.account, expected.size, expected.reduceOnly, parsed.nonce, 5000);
    }, { now: client.rt.now, sleep: client.rt.sleep, print });
    if (['set_paused', 'request_next_invalidation'].includes(expected.method)) command(plan, 'report_invalidation', { nonce: String(parsed.nonce), accepted: true });
    print(JSON.stringify({ network: 'mainnet', proof, note: 'Venue withdrawal ledger does not prove Arbitrum One arrival; verify destination receipt separately.' }, null, 2)); return;
  }
  if (opts.step === 'status') {
    print(JSON.stringify({ network: 'mainnet', policy, derivedAddress: plan.derived.address, venue, marginCapUsdc: '20', withdrawalRecipient: plan.init.evm_recipient }, null, 2));
    print(`Owner settlement after venue flat + opening expiry: ${repeat} --step=settle. Spot recovery after settlement: ${mainnetCall(plan.policy, 'withdraw_spot', { amount: policy.token, recipient: plan.owner }, plan.owner, '80 Tgas', '1 yoctoNEAR')}`); return;
  }
  const state = stateSchema.parse(policy.state);
  if (state.pending !== null || venue.orders.length || venue.account.otherPositions.length || venue.account.signedSize > 0) throw new Error('Policy mainnet pending operation, open orders or unexpected venue position');
  const observedAtMs = String(Math.floor(venue.observedAt)), observedAt = String(Math.floor(venue.observedAt / 1000));
  const mark = BigInt(Math.round(Number(venue.market.mark) * 1e6));
  const observe = () => command(plan, 'observe_margin', { equity_usdc: String(Math.floor(venue.account.equity * 1e6)),
    withdrawable_usdc: String(Math.floor(Math.min(venue.account.withdrawable, venue.account.equity) * 1e6)), observed_at_ms: observedAtMs });
  if (opts.step === 'settle') {
    if (venue.account.signedSize !== 0 || Date.now() <= Number(state.last_open_expiry) || venue.observedAt <= Number(state.last_open_expiry)) throw new Error('Policy settlement requires verified flat venue and an observation after opening signatures expire');
    command(plan, 'settle_position', { short_size: '0', observed_at_ms: observedAtMs });
    print('Owner attests venue fills, not signatures. Regenerate if observation is older than 30 seconds.'); return;
  }
  let expected: ExpectedCall;
  if (opts.step === 'invalidate') {
    const auths = z.array(z.object({ nonce: z.number(), discarded: z.boolean(), invalidation_requested: z.boolean(), invalidation_confirmed: z.boolean(), expires_after: z.number().int().nonnegative() }).passthrough()).parse(policy.fullState.outstanding);
    const consumed = await readConsumedClassTransfers(client, planFile, plan);
    const next = auths.find(a => !a.invalidation_confirmed && !a.invalidation_requested && a.expires_after >= Date.now() && (!state.paused || a.discarded));
    if (next && consumed.has(next.nonce)) throw new Error('Consumed class transfer is first in the frozen invalidation queue. Do not issue Noop; settle without pause. For an unresolved withdraw3 wait past its nonce + 48 h + 1 ms, then abandon_margin_withdrawal.');
    if (!auths.some(a => !a.invalidation_confirmed && !a.invalidation_requested && Number(a.expires_after) > Date.now() + 10000)) throw new Error('No unrequested live authorization to invalidate; inspect outstanding state');
    // Withdrawals may be signed while already paused; pausing again marks their new authorizations discarded.
    const method = state.paused && auths.some(a => a.discarded && !a.invalidation_requested && !a.invalidation_confirmed) ? 'request_next_invalidation' : 'set_paused';
    expected = { method, args: method === 'set_paused' ? { paused: true } : {}, caller: plan.owner, policy: plan.policy, asset: venue.market.assetIndex, reduceOnly: false, size: '0', price: '0', recipient: plan.init.evm_recipient, amount: '0' };
  } else if (opts.step === 'withdraw') {
    if (venue.account.signedSize !== 0 || state.signed_short_size !== '0' || Date.now() <= Number(state.last_open_expiry) || policy.margin === null) throw new Error('Policy withdrawal requires flat settled venue, expired openings, and configured margin limits');
    const margin = z.object({ withdrawal: z.null(), withdrawals: z.array(z.unknown()) }).parse(policy.margin);
    if (margin.withdrawals.some(entry => z.tuple([z.number(), z.union([z.string(), z.number()])]).parse(entry)[0] >= Date.now() - WITHDRAWAL_WINDOW_MS)) throw new Error('Policy prior withdrawal exists in rolling 24h budget; inspect and reconcile before another');
    const available = BigInt(Math.floor(Math.min(venue.account.withdrawable, venue.account.equity) * 1e6)) - 1_100_000n;
    const amount = opts.amount ? units(opts.amount, 6) : available;
    if (amount <= 1_000_000n || amount > available || amount > 20_000_000n) throw new Error('Expected withdrawal >$1 fee, <=20 USDC, with $1.10 residual');
    observe();
    expected = { method: 'request_evm_withdrawal', args: { recipient: plan.init.evm_recipient, amount: amount.toString() }, caller: plan.owner,
      policy: plan.policy, asset: venue.market.assetIndex, reduceOnly: false, size: '0', price: '0', recipient: plan.init.evm_recipient, amount: decimal(amount, 6) };
    print('Gross withdrawal debits perps; $1 bridge fee reduces destination payout. $1.10 remains in perps under the current policy controls.');
  } else if (opts.step === 'to-perp') {
    const spot = spotUsdc(venue.spot), amount = mainnetTransferAmount(venue.account.equity, spot.total - spot.hold, opts.amount);
    if (amount === 0n) { print('SKIP to-perp; live perps equity already covers the 15 USDC needed margin.'); commands.push('# SKIP: to-perp already funded'); return; }
    expected = { method: 'request_usd_class_transfer', args: { amount: amount.toString(), to_perp: true }, caller: plan.owner,
      policy: plan.policy, asset: venue.market.assetIndex, reduceOnly: false, size: '0', price: '0', recipient: plan.init.evm_recipient, amount: decimal(amount, 6) };
  } else {
    const close = opts.step === 'close', lot = 10n ** BigInt(24 - venue.market.szDecimals);
    if (!close && (state.paused || venue.account.signedSize !== 0 || state.signed_short_size !== '0' || venue.account.withdrawable < 15 || policy.margin === null)) throw new Error('Policy open requires unpaused flat policy and at least 15 USDC verified perps margin');
    if (!close && (mark < BigInt(plan.init.oracle.min_price) || mark > BigInt(plan.init.oracle.max_price))) throw new Error('Policy live mark outside opening bounds');
    let size = close ? units(venue.account.signedSizeText.slice(1), 24) : 12_000_000n * BASE / mark / lot * lot;
    if (close && venue.account.signedSize >= 0) throw new Error('Hyperliquid no short to close');
    if (!close) size = [size, BigInt(state.spot_balance), BigInt(state.limits.max_short_size)].reduce((a, b) => a < b ? a : b) / lot * lot;
    const freshOracle = BigInt(state.oracle_price) > 0n && Number(state.oracle_timestamp) <= Number(observedAt)
      && Number(observedAt) - Number(state.oracle_timestamp) <= Math.min(state.oracle.max_age_seconds, 60);
    // Without a fresh oracle the contract prices an OPEN from its stored keeper reference (set in open-prepare), not from a newer venue mark; a close passes its own reference.
    const reference = freshOracle ? BigInt(state.oracle_price) : close ? mark : BigInt(state.reference_price);
    const px = close ? v3ExitPrice(reference, venue.market.szDecimals) : orderPrice(reference, venue.market.szDecimals, false, state.limits.price_band_bps);
    if (size <= 0n || size % lot !== 0n || (!close && (size * px < 10_000_000n * BASE || size * ((reference * 10100n + 9999n) / 10000n) > 15_000_000n * BASE))) throw new Error('Policy cannot fit venue $10 minimum under $15 cap and spot backing');
    if (!close) observe();
    expected = { method: 'request_order_signature', args: { order: { asset_index: venue.market.assetIndex, size: size.toString(), reduce_only: close,
      reference_price: close ? mark.toString() : null, ...(close ? { observed_at: observedAt } : {}) } }, caller: plan.keeper,
      policy: plan.policy, asset: venue.market.assetIndex, reduceOnly: close, size: decimal(size, 24), price: decimal(px, 6), recipient: plan.init.evm_recipient, amount: '0' };
  }
  if (Date.now() - venue.observedAt > 8000) throw new Error('Hyperliquid observations too old; regenerate commands');
  const file = `docs/evidence/mainnet-v4-${opts.step}-${Date.now()}-${randomUUID().slice(0, 8)}.request.json`;
  requestFile = file;
  await writeFile(file, `${JSON.stringify({ network: 'mainnet', plan: planFile, createdAt: Date.now(), expected,
    address: plan.derived.address, codeHash: plan.artifact.codeHash, before: { clearing: venue.clearing, spot: venue.spot } }, null, 2)}\n`, { flag: 'wx' });
  command(plan, expected.method, expected.args, expected.caller, `${mainnetSigningGasTgas(plan)} Tgas`);
  print(`REQUEST_FILE=${file}`);
  print(`Run immediately after the signed callback (owner executes curl once): ${repeat} --step=relay --request=${shellQuote(file)} --relay-tx=PASTE_NEAR_TX_HASH`);
  } finally {
    if (opts['commands-file']) await writeFile(opts['commands-file'], `#!/bin/sh\nset -eu\n${requestFile ? `# REQUEST_FILE: ${requestFile}\n` : ''}${commands.join('\n')}\n`, { flag: 'wx', mode: 0o700 });
  }
}
