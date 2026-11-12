import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { assembleRequest, deriveTestnetAddress, recoveredSigner, TESTNET_API } from '../packages/hyperliquid/src/index.js';
import { stressMetrics } from '../packages/domain/src/index.js';
import { BASE, decimal, info, liveMarket, orderPrice, units, withdrawalConfig, v3ExitPrice } from './lifecycle-config.js';
import { parseAccount, parseFills, parseLifecycleReceipt, parseWithdrawal, verifyFill, spotUsdc, verifyClassTransfer, WITHDRAWAL_WINDOW_MS, type ExpectedCall } from './lifecycle-parsing.js';
import { callCommand, initialization, V3_MARGIN_LIMITS } from './testnet-plan.js';
import { committedWasm, KEEPER, NEXT_POLICY, OWNER, parseOptions, PATH, publicCli, V2_BASELINE_SHA256, rpc, stateAt, txHash, V3_POLICY, V3_WASM, policyPlanFile, testnetAccount } from './testnet-common.js';
import { checkKeys, planConfigMatches, policyStateSchema } from './testnet-verify.js';
import { assertFreshContractProof } from './prove-contract.js';
import { isDeepStrictEqual } from 'node:util';

// Venue requires nonce in (T - 2 days, T + 1 day). Leave 5s for transport;
// contract-generated nonces are never more than 1s ahead of current time.
// https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets
export function transferNonceValid(nonce: number, now = Date.now()) {
  return Number.isSafeInteger(nonce) && nonce >= 0 && nonce <= now + 1000 && nonce > now - 172_800_000 + 5000;
}
export function assertTransferUnsubmitted(raw: unknown) {
  const history = z.array(z.object({ time: z.number().int().nonnegative(), delta: z.object({ type: z.string() }).passthrough() })).parse(raw);
  // Ledger does not expose the signed nonce. Any class transfer in the interval
  // is ambiguous, including an offsetting transfer: never infer non-use from balances.
  if (history.length >= 2000 || history.some(e => e.delta.type === 'accountClassTransfer'))
    throw new Error('Hyperliquid transfer may already have been submitted; reconcile public history before any replacement');
}
export function spotAmount(value?: string) {
  const amount = units(z.string().regex(/^(0|[1-9]\d*)(\.\d{1,24})?$/).parse(value), 24);
  if (amount <= 0n || amount >= 2n ** 128n) throw new Error('Expected positive u128 spot amount');
  return amount;
}
export function spotCommands(policy: string, value: string) {
  testnetAccount(policy);
  const amount = spotAmount(value);
  return [
    callCommand('storage_deposit', { account_id: policy, registration_only: true }, OWNER, '30 Tgas', '0.01 NEAR', 'wrap.testnet'),
    callCommand('storage_deposit', { account_id: OWNER, registration_only: true }, OWNER, '30 Tgas', '0.01 NEAR', 'wrap.testnet'),
    callCommand('near_deposit', {}, OWNER, '30 Tgas', `${value} NEAR`, 'wrap.testnet'),
    callCommand('ft_transfer_call', { receiver_id: policy, amount: amount.toString(), msg: '' }, OWNER, '100 Tgas', '1 yoctoNEAR', 'wrap.testnet'),
  ];
}
export async function loadPlan(file: string, policy = NEXT_POLICY) {
  const saved: unknown = JSON.parse(await readFile(file, 'utf8'));
  if (policy === V3_POLICY && !isDeepStrictEqual(z.object({ marginLimits: z.unknown() }).parse(saved).marginLimits, V3_MARGIN_LIMITS))
    throw new Error('Policy plan margin limits mismatch');
  const raw = z.object({ policy: z.literal(policy), capturedAt: z.string().datetime(), market: z.object({ mark: z.string(),
    assetIndex: z.number(), szDecimals: z.number() }), init: z.unknown(), derived: z.object({ address: z.string() }),
    artifact: z.object({ sha256: z.string() }) }).parse(saved);
  const ownerEvm = z.object({ evm_recipient: z.string() }).parse(raw.init).evm_recipient;
  const init = initialization(raw.market.assetIndex, raw.market.szDecimals, ownerEvm, raw.market.mark);
  if (!isDeepStrictEqual(init, raw.init)) throw new Error('Policy plan initializer mismatch');
  return { ...raw, init };
}
async function view(method: string, args: unknown, account = NEXT_POLICY, block?: string) {
  const raw = z.object({ result: z.array(z.number().int().min(0).max(255)), ...(block ? { block_hash: z.literal(block) } : {}) }).parse(await rpc('query', {
    request_type: 'call_function', account_id: account, method_name: method, args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
    ...(block ? { block_id: block } : { finality: 'final' }),
  }));
  return JSON.parse(Buffer.from(raw.result).toString('utf8')) as unknown;
}
export function buildOrder(state: z.infer<typeof policyStateSchema>, market: Awaited<ReturnType<typeof liveMarket>>, account: ReturnType<typeof parseAccount>, close: boolean, policy = NEXT_POLICY) {
  const v3 = policy === V3_POLICY;
  if ((state.paused && !(v3 && close)) || state.pending !== null || account.otherPositions.length || account.signedSize > 0) throw new Error('Policy paused/pending or unexpected venue positions');
  if (state.asset_index !== market.assetIndex || state.size_decimals !== market.szDecimals) throw new Error('Policy market changed');
  const oracle = z.object({ min_price: z.string(), max_price: z.string() }).parse(state.oracle);
  const observedAt = Math.floor(Date.parse(market.capturedAt) / 1000);
  const oracleAt = Number(state.oracle_timestamp ?? 0);
  const freshOracle = v3 && Number(state.oracle_price ?? 0) > 0 && oracleAt <= observedAt
    && observedAt - oracleAt <= Math.min(Number((state.oracle as { max_age_seconds: number }).max_age_seconds), 60);
  const mark = freshOracle ? BigInt(String(state.oracle_price)) : BigInt(Math.round(Number(market.mark) * 1e6));
  if (!(v3 && close) && (mark < BigInt(oracle.min_price) || mark > BigInt(oracle.max_price))) throw new Error('Policy live mark outside immutable bounds');
  if (v3 && close && (mark < 10n || mark > 1_000_000_000_000n)) throw new Error('Policy exit mark outside sanity bounds');
  const step = 10n ** BigInt(24 - market.szDecimals);
  const upper = (mark * BigInt(10000 + state.limits.price_band_bps) + 9999n) / 10000n;
  let size: bigint;
  if (close) {
    if (account.signedSize >= 0) throw new Error('Hyperliquid has no short to close');
    size = units(account.signedSizeText.slice(1), 24);
    if (size > (BigInt(state.signed_short_size) > BigInt(state.limits.max_short_size) ? BigInt(state.signed_short_size) : BigInt(state.limits.max_short_size))) throw new Error('Policy close exceeds reduction cap');
  } else {
    if (account.signedSize !== 0 || BigInt(state.signed_short_size) !== 0n) throw new Error('Policy open requires reconciled flat position');
    size = ((12_000_000n * BASE + mark * step - 1n) / (mark * step)) * step;
    const cap = BigInt(state.limits.per_order_notional_cap) * BASE / upper / step * step;
    size = [size, cap, BigInt(state.spot_balance), BigInt(state.limits.max_short_size)].reduce((a, b) => a < b ? a : b) / step * step;
    const notional = (size * upper + BASE - 1n) / BASE;
    if (size <= 0n || size * orderPrice(mark, market.szDecimals, false, state.limits.price_band_bps) < 10_000_000n * BASE || notional > BigInt(state.limits.per_day_notional_cap)) throw new Error('Policy cannot fit $10 minimum within spot/caps');
    const metrics = stressMetrics({ shortNotional: Number(decimal(size, 24)) * Number(market.mark), venueEquity: account.equity,
      shortQuantityNear: Number(decimal(size, 24)), referencePriceUsd: Number(market.mark), priceBandBps: state.limits.price_band_bps });
    if (account.withdrawable < Number(notional) / 1e6 || metrics.headroom <= 0 || metrics.leverage === null || metrics.leverage > 1) throw new Error('Hyperliquid insufficient funded margin/headroom');
  }
  if (size % step !== 0n) throw new Error('Policy position has unsupported precision');
  const price = decimal(v3 && close ? v3ExitPrice(mark, market.szDecimals) : orderPrice(mark, market.szDecimals, close, state.limits.price_band_bps), 6);
  return { size: decimal(size, 24), price, args: { order: { asset_index: market.assetIndex, size: size.toString(), reduce_only: close,
    reference_price: close ? mark.toString() : null, ...(v3 && close ? { observed_at: String(observedAt) } : {}) } }, reference: mark.toString() };
}
export function withdrawalSetupReady(state: z.infer<typeof policyStateSchema>, account: ReturnType<typeof parseAccount>, observedAtMs: number, openOrders: unknown[], policy = NEXT_POLICY) {
  const expiry = z.string().regex(/^\d+$/).parse(state.last_open_expiry);
  return (policy === V3_POLICY || BigInt(expiry) > 0n) && observedAtMs > Number(expiry) && state.signed_short_size === '0'
    && state.pending === null && account.signedSize === 0 && account.otherPositions.length === 0 && openOrders.length === 0;
}
async function readHash() {
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  try {
    process.stdout.write('NEAR transaction hash (paste immediately): ');
    for await (const line of reader) if (line.trim()) return txHash(line.trim());
  } finally { reader.close(); }
  throw new Error('Expected transaction hash on stdin');
}
async function snapshot(address: string) {
  const observedAtMs = Date.now();
  const [clearinghouseState, userFills, ledger, funding, openOrders, spotClearinghouseState] = await Promise.all([
    info({ type: 'clearinghouseState', user: address }), info({ type: 'userFills', user: address }),
    info({ type: 'userNonFundingLedgerUpdates', user: address, startTime: Date.now() - 86400000 }),
    info({ type: 'userFunding', user: address, startTime: Date.now() - 86400000 }),
    info({ type: 'openOrders', user: address }), info({ type: 'spotClearinghouseState', user: address }),
  ]);
  return { observedAtMs, spotClearinghouseState, clearinghouseState, userFills, ledger, funding, openOrders: z.array(z.unknown()).parse(openOrders),
    account: parseAccount(clearinghouseState), fills: parseFills(userFills) };
}
export async function lifecycle(argv: string[]) {
  const options = parseOptions(argv, ['step', 'amount', 'plan', 'spot-tx', 'settle-tx', 'relay-tx', 'policy']);
  const policy = testnetAccount(options.policy ?? NEXT_POLICY);
  const v3 = policy === V3_POLICY;
  if (!policyPlanFile(policy)) throw new Error('Policy lifecycle supports the saved v2 and v3 accounts');
  const step = z.enum(['open', 'status', 'close', 'withdraw', 'to-perp', 'spot']).parse(options.step);
  if (options.amount !== undefined && step !== 'to-perp' && step !== 'spot') throw new Error('Expected --amount only with --step=to-perp or spot');
  let transferAmount = step === 'to-perp' ? units(z.string().regex(/^(0|[1-9]\d*)(\.\d{1,6})?$/).parse(options.amount ?? (options['relay-tx'] ? '49' : undefined)), 6) : 0n;
  if (step === 'to-perp' && (transferAmount <= 0n || transferAmount > 60_000_000n)) throw new Error('Expected transfer amount >0 and <=60 USDC');
  if (options['relay-tx'] && step !== 'status' && step !== 'to-perp') throw new Error('Expected --relay-tx only with --step=status or to-perp');
  if (step === 'spot') spotAmount(options.amount);
  await mkdir('docs/evidence', { recursive: true });
  const record: Record<string, unknown> = { step, capturedAt: new Date().toISOString(), network: 'testnet', outcome: 'pending' };
  const links: string[] = [];
  let relayClaim: string | undefined;
  const commands: string[] = [];
  record.commands = commands;
  const printCommand = (command: string) => { commands.push(command); console.log(command); };
  const evidence = `docs/evidence/${new Date().toISOString().slice(0, 10)}-lifecycle-${v3 ? 'policy-v3-' : ''}${step}.md`;
  try {
    const [plan, artifact, derived, market] = await Promise.all([loadPlan(options.plan ?? policyPlanFile(policy)!, policy), committedWasm(v3 ? V3_WASM : undefined),
      deriveTestnetAddress(policy, PATH), liveMarket()]);
    if ((plan.artifact.sha256 !== artifact.sha256 && !(policy === NEXT_POLICY && plan.artifact.sha256 === V2_BASELINE_SHA256)) || derived.address !== plan.derived.address || market.assetIndex !== plan.init.asset_index || market.szDecimals !== plan.init.size_decimals) throw new Error('Policy plan/artifact/derivation/metadata mismatch');
    record.derived = derived; record.market = market; record.recipient = plan.init.evm_recipient;
    links.push(`https://testnet.nearblocks.io/address/${policy}`, `https://app.hyperliquid-testnet.xyz/explorer/address/${derived.address}`,
      `https://sepolia.arbiscan.io/address/${plan.init.evm_recipient}`);
    const block = z.object({ header: z.object({ hash: z.string() }) }).parse(await rpc('block', { finality: 'final' })).header.hash;
    async function checkBlock(at: string, requireKeyless: boolean) {
      const [rawAccount, keys, rawState] = await Promise.all([
        rpc('query', { request_type: 'view_account', account_id: policy, block_id: at }),
        rpc('query', { request_type: 'view_access_key_list', account_id: policy, block_id: at }), stateAt(at, policy),
      ]);
      z.object({ code_hash: z.literal(artifact.codeHash), block_hash: z.literal(at) }).parse(rawAccount);
      z.object({ block_hash: z.literal(at) }).parse(keys);
      if (!checkKeys(keys, !requireKeyless).ok && !((step === 'status' || step === 'to-perp' || step === 'spot') && checkKeys(keys).ok)) throw new Error('Policy custody key list mismatch');
      const state = policyStateSchema.parse(rawState);
      if (!planConfigMatches(state, plan.init) || state.evm_recipient !== plan.init.evm_recipient) throw new Error('Policy config differs from saved plan');
      return { block: at, state, keys, account: rawAccount };
    }
    const [preflight, before, token, rebalance, margin] = await Promise.all([checkBlock(block, step !== 'status' && step !== 'to-perp' && step !== 'spot'), snapshot(derived.address),
      view('ft_balance_of', { account_id: policy }, 'wrap.testnet', block), view('get_rebalance', {}, policy, block), v3 ? view('get_margin', {}, policy, block) : Promise.resolve(undefined)]);
    const state = preflight.state;
    if (v3) {
      if (rebalance !== null) throw new Error('Policy v3 requires adapter-free margin controls');
      if (margin !== null && !isDeepStrictEqual(z.object({ limits: z.unknown() }).parse(margin).limits, V3_MARGIN_LIMITS))
        throw new Error('Policy v3 margin limits differ from saved plan');
      record.margin = margin;
    }
    const spot = z.string().regex(/^\d+$/).parse(token);
    if (spot !== state.spot_balance) throw new Error('Policy spot_balance differs from actual wrap.testnet custody');
    record.rebalance = rebalance; record.preflight = preflight; record.before = before; record.spot = { contract: state.spot_balance, token: spot, near: decimal(BigInt(spot), 24) };
    record.risk = stressMetrics({ shortNotional: Math.abs(before.account.signedSize) * Number(market.mark), venueEquity: before.account.equity,
      shortQuantityNear: Math.abs(before.account.signedSize), referencePriceUsd: Number(market.mark), priceBandBps: state.limits.price_band_bps });
    record.riskNote = 'Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.';
    for (const [option, method, receiver] of [['spot-tx', 'ft_transfer_call', 'wrap.testnet'], ['settle-tx', 'settle_position', policy]] as const) {
      if (!options[option]) continue;
      const hash = txHash(options[option]);
      const raw = await rpc('tx', { tx_hash: hash, sender_account_id: OWNER, wait_until: 'FINAL' });
      const tx = z.object({ final_execution_status: z.literal('FINAL'), status: z.object({ SuccessValue: z.string() }).strict(),
        transaction: z.object({ hash: z.literal(hash), signer_id: z.literal(OWNER), receiver_id: z.literal(receiver), actions: z.array(z.object({ FunctionCall: z.object({ method_name: z.literal(method), args: z.string() }) })).length(1) }),
        receipts_outcome: z.array(z.object({ outcome: z.object({ executor_id: z.string(), logs: z.array(z.string()), status: z.record(z.string(), z.unknown()) }) })) }).parse(raw);
      const args = JSON.parse(Buffer.from(tx.transaction.actions[0]!.FunctionCall.args, 'base64').toString('utf8'));
      // The deposited amount is whatever the owner chose; the event below must match it exactly.
      const deposited = option === 'spot-tx'
        ? z.object({ receiver_id: z.literal(policy), amount: z.string().regex(/^[1-9]\d*$/), msg: z.literal('') }).passthrough().parse(args).amount
        : null;
      if (step === 'spot' && deposited !== units(options.amount!, 24).toString()) throw new Error('Policy deposit amount differs from --amount');
      const eventName = option === 'spot-tx' ? 'deposit' : 'position_settlement';
      if (!tx.receipts_outcome.some(r => r.outcome.executor_id === policy && !('Failure' in r.outcome.status) && r.outcome.logs.some(l => {
        if (!l.startsWith('EVENT_JSON:')) return false;
        const e = JSON.parse(l.slice(11));
        return e.standard === 'counterweight' && e.event === eventName && (option !== 'spot-tx' || e.data?.[0]?.amount === deposited);
      }))) throw new Error('Contract successful deposit/settlement receipt missing');
      record[option] = raw; links.push(`https://testnet.nearblocks.io/txns/${hash}`);
    }
    if (step === 'spot') {
      const amount = spotAmount(options.amount);
      if (options['spot-tx']) {
        if (BigInt(spot) < amount || state.pending !== null) throw new Error('Policy deposit custody not yet verified');
        record.outcome = 'spot-deposit-custody-verified';
        console.log(JSON.stringify(record, null, 2));
        return;
      }
      for (const command of spotCommands(policy, options.amount!)) printCommand(command);
      console.log(`If using recovered wNEAR, skip near_deposit. After the transfer callback, verify with:\nnpm run lifecycle -- --policy=${policy} --step=spot --amount=${options.amount} --spot-tx=PASTE_DEPOSIT_TX_HASH`);
      record.outcome = 'spot-owner-commands-printed';
      return;
    }
    const withdrawalLimits = !v3 && BigInt(state.spot_balance) > 0n ? withdrawalConfig(derived.address, state.spot_balance, plan.init.oracle.min_price, policy) : null;
    if (rebalance !== null) {
      const configured = z.object({ limits: z.unknown() }).parse(rebalance);
      if (withdrawalLimits === null || !isDeepStrictEqual(configured.limits, withdrawalLimits)) throw new Error('Policy withdrawal configuration differs from bounded lifecycle setup');
    }
    if (step === 'status') {
      record.openOrders = before.openOrders;
      if (options['relay-tx']) {
        const hash = txHash(options['relay-tx']);
        const saved = z.object({ step: z.enum(['open', 'close', 'withdraw', 'to-perp']), txHash: z.literal(hash),
          expected: z.object({ method: z.enum(['request_order_signature', 'request_evm_withdrawal', 'request_usd_class_transfer']), args: z.record(z.string(), z.unknown()),
            caller: z.string(), policy: z.literal(policy), asset: z.literal(market.assetIndex), reduceOnly: z.boolean(), size: z.string(),
            price: z.string(), recipient: z.literal(state.evm_recipient), amount: z.string() }),
          before: z.object({ clearinghouseState: z.unknown(), spotClearinghouseState: z.unknown().optional() }), hyperliquidResponse: z.unknown(),
        }).parse(JSON.parse(await readFile(`docs/evidence/lifecycle-relay-${hash}.json`, 'utf8')));
        if (saved.expected.caller !== ((saved.step === 'withdraw' || saved.step === 'to-perp') ? OWNER : KEEPER)
          || saved.expected.method !== (saved.step === 'to-perp' ? 'request_usd_class_transfer' : saved.step === 'withdraw' ? 'request_evm_withdrawal' : 'request_order_signature')
          || saved.expected.reduceOnly !== (saved.step === 'close')) throw new Error('Policy saved relay identity mismatch');
        const nearResponse = await rpc('tx', { tx_hash: hash, sender_account_id: saved.expected.caller, wait_until: 'FINAL' });
        const parsed = parseLifecycleReceipt(nearResponse, hash, saved.expected);
        if ((await recoveredSigner(parsed.digest, parsed.signature)).toLowerCase() !== derived.address) throw new Error('Contract recorded relay signature mismatch');
        // Rechecks must query the recorded action's window, even days after relay.
        const withdrawalLedger = saved.step === 'withdraw' ? await info({ type: 'userNonFundingLedgerUpdates',
          user: derived.address, startTime: parsed.nonce, endTime: Math.min(Date.now(), parsed.nonce + WITHDRAWAL_WINDOW_MS) }) : null;
        const verification = saved.step === 'to-perp'
          ? verifyClassTransfer(saved.hyperliquidResponse, saved.before.spotClearinghouseState, before.spotClearinghouseState, parseAccount(saved.before.clearinghouseState), before.account, saved.expected.amount)
          : saved.step === 'withdraw'
          ? parseWithdrawal(saved.hyperliquidResponse, withdrawalLedger, saved.expected.amount, parsed.nonce)
          : verifyFill(saved.hyperliquidResponse, before.userFills, parseAccount(saved.before.clearinghouseState), before.account,
            saved.expected.size, saved.expected.reduceOnly, parsed.nonce);
        record.relayVerification = { step: saved.step, txHash: hash, nearResponse, verification,
          note: 'Read-only recheck. Position-delta checks require rechecking an order before a later order changes its position. Withdrawal ledger confirmation does not prove bridge arrival.' };
        links.push(`https://testnet.nearblocks.io/txns/${hash}`);
        const hashes = saved.step === 'to-perp' ? [] : saved.step === 'withdraw' ? [z.object({ hash: z.string() }).parse(verification)]
          : z.object({ fills: z.array(z.object({ hash: z.string() })) }).parse(verification).fills;
        for (const entry of hashes) links.push(`https://app.hyperliquid-testnet.xyz/explorer/tx/${entry.hash}`);
      }
      if (before.account.signedSize === 0 && BigInt(state.signed_short_size) > 0n) {
        const expiry = z.string().regex(/^\d+$/).parse(state.last_open_expiry);
        record.settlementRequired = { afterMs: Number(expiry), command: callCommand('settle_position', { short_size: '0', observed_at_ms: String(before.observedAtMs) }, OWNER, '30 Tgas', '0 NEAR', policy),
          note: 'Run only after last_open_expiry, no open orders/remaining short, and within 30s of this public observation. Regenerate status if stale. Owner attestation releases reserved exposure; it is not an on-chain Hyperliquid proof.' };
        if (before.observedAtMs <= Number(expiry) || before.openOrders.length || state.pending !== null || Date.now() - before.observedAtMs > 25000)
          record.settlementRequired = { wait: 'Wait for expiry, no pending callback and zero open orders, then rerun status for a fresh settlement command', afterMs: Number(expiry) };
      }
      if (!v3 && withdrawalSetupReady(state, before.account, before.observedAtMs, before.openOrders) && rebalance === null && withdrawalLimits !== null) {
        record.withdrawalSetup = { command: callCommand('configure_rebalancing', { limits: withdrawalLimits }, OWNER, '30 Tgas', '0 NEAR', policy),
          note: 'Owner runs once after close. Existing WASM requires this for withdraw3. Adapter is an uncreated child of the keyless policy; no route is invoked. Sale caps are 1 yoctoNEAR, withdrawal caps $60, residual equity $1. This setup ends the run; do not reopen without a separate plan.' };
      }
      record.outcome = 'public-status-verified';
      console.log(JSON.stringify(record, null, 2)); return;
    }
    if (Date.now() - Date.parse(market.capturedAt) > 30000) throw new Error('Hyperliquid mark too old; restart for fresh commands');
    let expected: ExpectedCall;
    let signedTransfer: { hash: string; raw: unknown } | undefined;
    if (step === 'to-perp') {
      if (state.pending !== null || before.account.signedSize !== 0 || before.account.otherPositions.length || before.openOrders.length || rebalance !== null)
        throw new Error('Policy transfer requires idle policy and flat venue before withdrawal setup');
      if (options['relay-tx']) {
        const hash = txHash(options['relay-tx']);
        // A previous claim remains authoritative even if a process lost the HTTP response.
        try {
          await readFile(`docs/evidence/lifecycle-relay-${hash}.json`, 'utf8');
          throw new Error('Policy relay already claimed; run status --relay-tx and reconcile before requesting any replacement');
        } catch (error) {
          if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
        }
        const raw = await rpc('tx', { tx_hash: hash, sender_account_id: OWNER, wait_until: 'FINAL' });
        const tx = z.object({ transaction: z.object({ signer_id: z.literal(OWNER), receiver_id: z.literal(policy),
          actions: z.array(z.object({ FunctionCall: z.object({ method_name: z.literal('request_usd_class_transfer'), args: z.string() }) })).length(1) }) }).parse(raw);
        const args = z.object({ amount: z.string().regex(/^[1-9]\d*$/), to_perp: z.literal(true) }).strict()
          .parse(JSON.parse(Buffer.from(tx.transaction.actions[0]!.FunctionCall.args, 'base64').toString('utf8')));
        const signedAmount = BigInt(args.amount);
        if (signedAmount > 60_000_000n || (options.amount !== undefined && signedAmount !== transferAmount)) throw new Error('Policy signed transfer amount mismatch');
        transferAmount = signedAmount;
        signedTransfer = { hash, raw };
      }
      const balance = spotUsdc(before.spotClearinghouseState);
      if (balance.total - balance.hold < transferAmount) throw new Error('Hyperliquid insufficient available spot USDC');
      expected = { method: 'request_usd_class_transfer', args: { amount: transferAmount.toString(), to_perp: true }, caller: OWNER,
        policy, asset: market.assetIndex, reduceOnly: false, size: '0', price: '0', recipient: state.evm_recipient, amount: decimal(transferAmount, 6) };
      console.log(signedTransfer ? 'Relaying the already-signed same-account spot-to-perps transfer within the venue nonce window. No new owner signature requested.'
        : 'Owner moves spot USDC into perps within the SAME derived account. Relay deadline is local 60s; venue user-signed actions have no expiresAfter. Temporary full-access key is permitted for this funding step.');
    } else if (step === 'withdraw') {
      if (before.account.signedSize !== 0 || before.account.otherPositions.length || state.signed_short_size !== '0' || state.pending !== null) throw new Error('Policy withdrawal requires flat venue AND owner-settled contract; run status and its settlement command');
      if (!withdrawalSetupReady(state, before.account, before.observedAtMs, before.openOrders, policy)) throw new Error('Policy withdrawal requires expired opening authorizations and zero open orders');
      if (!v3 && withdrawalLimits === null) throw new Error('Policy withdrawal setup requires spot inventory');
      if (v3 ? margin === null : rebalance === null) {
        record.setupCommand = callCommand(v3 ? 'configure_margin_withdrawals' : 'configure_rebalancing', { limits: v3 ? V3_MARGIN_LIMITS : withdrawalLimits }, OWNER, '30 Tgas', '0 NEAR', policy);
        record.outcome = 'withdrawal-setup-required';
        console.log(`Run this one-time owner setup, then rerun lifecycle ${v3 ? `--policy=${policy} ` : ''}--step=withdraw:\n${record.setupCommand}`);
        return;
      }
      const r = z.object({ ...(v3 ? {} : { route: z.null() }), withdrawal: z.null(), withdrawals: z.array(z.tuple([z.number(), z.string()])) }).parse(v3 ? margin : rebalance);
      if (r.withdrawals.length) throw new Error('Policy has prior withdrawal usage; inspect evidence before another withdrawal');
      // Existing WASM requires $1 residual equity; fees/rounding are also covered conservatively.

      const amount = BigInt(Math.floor(Math.min(before.account.withdrawable, before.account.equity) * 1e6)) - 1_000_000n;
      if (amount <= 1_000_000n || amount > (v3 ? BigInt(V3_MARGIN_LIMITS.per_withdrawal_usdc) : 60_000_000n)) throw new Error('Hyperliquid insufficient withdrawable USDC after $1 fee reserve');
      expected = { method: 'request_evm_withdrawal', args: { recipient: state.evm_recipient, amount: amount.toString() }, caller: OWNER,
        policy, asset: market.assetIndex, reduceOnly: false, size: '0', price: '0', recipient: state.evm_recipient, amount: decimal(amount, 6) };
      console.log('Run these owner commands in terminal B, then the signature request immediately (observations expire after 30s):');
      if (Date.now() - before.observedAtMs > 25000) throw new Error('Hyperliquid margin observation too old; restart for fresh commands');
      printCommand(callCommand('set_reference_price', { price: String(Math.round(Number(market.mark) * 1e6)) }, OWNER, '30 Tgas', '0 NEAR', policy));
      printCommand(callCommand('observe_margin', { equity_usdc: String(Math.floor(before.account.equity * 1e6)),
        withdrawable_usdc: String(Math.floor(Math.min(before.account.withdrawable, before.account.equity) * 1e6)), observed_at_ms: String(before.observedAtMs) }, OWNER, '30 Tgas', '0 NEAR', policy));
      console.log('Owner approves withdraw3 to fixed recipient. This starts a bridge withdrawal. The contract retains $1 equity; the venue deducts its withdrawal fee from the bridge payout. No venue expiresAfter exists; relay accepts only a fresh callback.');
    } else {
      if (rebalance !== null) throw new Error('Policy lifecycle trading must finish before one-time withdrawal setup');
      if (before.openOrders.length) throw new Error('Hyperliquid unresolved open orders');
      const order = buildOrder(state, market, before.account, step === 'close', policy);
      expected = { method: 'request_order_signature', args: order.args, caller: KEEPER, policy, asset: market.assetIndex,
        reduceOnly: step === 'close', size: order.size, price: order.price, recipient: state.evm_recipient, amount: '0' };
      console.log(`Live mark $${market.mark}. IOC ${step}: ${order.size} NEAR; limit $${order.price}. Run these keeper commands in terminal B now, in order:`);
      printCommand(callCommand('heartbeat', {}, KEEPER, '30 Tgas', '0 NEAR', policy));
      printCommand(callCommand('set_keeper_price', { price: order.reference, observed_at: String(Math.floor(Date.parse(market.capturedAt) / 1000)) }, KEEPER, '30 Tgas', '0 NEAR', policy));
      if (v3 && step === 'open') {
        // v3 opens check an owner margin attestation at most 30 s old (assert_margin_health), so the owner attests last.
        if (Date.now() - before.observedAtMs > 8000) throw new Error('Hyperliquid margin observation too old; restart for fresh commands');
        printCommand(callCommand('observe_margin', { equity_usdc: String(Math.floor(before.account.equity * 1e6)),
          withdrawable_usdc: String(Math.floor(Math.min(before.account.withdrawable, before.account.equity) * 1e6)), observed_at_ms: String(before.observedAtMs) }, OWNER, '30 Tgas', '0 NEAR', policy));
      }
    }
    const command = callCommand(expected.method, expected.args, expected.caller, '300 Tgas', '0 NEAR', policy);
    record.command = command; record.expected = expected;
    if (signedTransfer) {
      const parsed = parseLifecycleReceipt(signedTransfer.raw, signedTransfer.hash, expected);
      if (!transferNonceValid(parsed.nonce)) {
        record.outcome = 'signed-transfer-expired-fresh-command-required';
        printCommand(command);
        console.log(`Signed transfer is outside the safe Hyperliquid nonce window. Run the fresh owner command above via:\nnpm run lifecycle -- --policy=${policy} --step=to-perp --amount=${expected.amount}`);
        return;
      }
      const history = await info({ type: 'userNonFundingLedgerUpdates', user: derived.address, startTime: Math.max(0, parsed.nonce - 1000), endTime: Date.now() });
      assertTransferUnsubmitted(history);
      record.transferHistory = history;
    } else {
      printCommand(command);
      console.log('Relay ready. Paste final command tx hash immediately (or pipe just the hash to stdin). 60s includes MPC and finality; never retry an uncertain signature.');
    }
    const hash = signedTransfer?.hash ?? await readHash(); record.txHash = hash; links.push(`https://testnet.nearblocks.io/txns/${hash}`);
    const raw = signedTransfer?.raw ?? await rpc('tx', { tx_hash: hash, sender_account_id: expected.caller, wait_until: 'FINAL' }); record.nearResponse = raw;
    const parsed = parseLifecycleReceipt(raw, hash, expected); record.parsed = parsed;
    const assertFresh = () => {
      if (parsed.input.scheme === 'l1') assertFreshContractProof(parsed.input);
      else if (signedTransfer) { if (!transferNonceValid(parsed.nonce)) throw new Error('Contract signed transfer nonce window elapsed; do not relay'); }
      else if (parsed.nonce > Date.now() + 1000 || parsed.nonce < Date.now() - 57000) throw new Error('Contract user-signed callback is too old; do not relay');
    };
    assertFresh();
    const [checks, recovered] = await Promise.all([Promise.all(parsed.blocks.map(b => checkBlock(b, step !== 'to-perp'))), recoveredSigner(parsed.digest, parsed.signature)]);
    if (recovered.toLowerCase() !== derived.address.toLowerCase()) throw new Error('Contract signature does not recover derived address');
    record.checks = checks; record.recovered = recovered;
    const request = assembleRequest(parsed.input, parsed.signature); record.request = request;
    // Persist exclusive claim before any submission. Never retry even after a transport failure.
    const claim = `docs/evidence/lifecycle-relay-${hash}.json`;
    await writeFile(claim, `${JSON.stringify({ ...record, outcome: 'claimed-not-yet-submitted' }, null, 2)}\n`, { flag: 'wx' });
    relayClaim = claim;
    assertFresh();
    record.outcome = 'submission-outcome-unknown';
    const response = await fetch(`${TESTNET_API}/exchange`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request), signal: AbortSignal.timeout(15000) });
    record.httpStatus = response.status;
    const exchange: unknown = await response.json(); record.hyperliquidResponse = exchange;
    if (!response.ok) throw new Error(`Hyperliquid exchange HTTP ${response.status}; do not retry`);
    // Public indexing may lag. Poll at most 6 times, never resubmit to exchange.
    let verification: unknown, lastError: unknown;
    for (let attempt = 0; attempt < 6; attempt++) {
      const after = await snapshot(derived.address); record.after = after;
      try {
        if (step === 'to-perp') verification = verifyClassTransfer(exchange, before.spotClearinghouseState, after.spotClearinghouseState, before.account, after.account, expected.amount);
        else if (step === 'withdraw') verification = parseWithdrawal(exchange, after.ledger, expected.amount, parsed.nonce);
        else verification = verifyFill(exchange, after.userFills, before.account, after.account, expected.size, expected.reduceOnly, parsed.nonce);
        break;
      } catch (error) { lastError = error; }
      if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 1500));
    }
    if (!verification) throw lastError;
    record.verification = verification;
    const fills = step === 'to-perp' ? [] : step === 'withdraw' ? [z.object({ hash: z.string() }).parse(verification)] : z.object({ fills: z.array(z.object({ hash: z.string() })) }).parse(verification).fills;
    for (const f of fills) links.push(`https://app.hyperliquid-testnet.xyz/explorer/tx/${f.hash}`);
    record.outcome = step === 'to-perp' ? 'spot-to-perps-balances-verified' : step === 'withdraw' ? 'venue-withdrawal-ledger-verified-bridge-arrival-unverified' : 'public-fill-and-position-verified';
    await writeFile(claim, `${JSON.stringify(record, null, 2)}\n`);
    console.log(JSON.stringify({ outcome: record.outcome, verification, evidence, next: step === 'close' ? 'Run status after open expiry, execute owner settlement command, then withdraw.' : 'Run status for current margin/funding/H.' }, null, 2));
  } catch (error) {
    record.error = error instanceof Error ? error.message : 'Unknown error';
    if (record.outcome === 'pending') record.outcome = 'failed-before-submission';
    console.error(JSON.stringify({ outcome: record.outcome, error: record.error, evidence }));
    throw error;
  } finally {
    if (relayClaim) await writeFile(relayClaim, `${JSON.stringify(record, null, 2)}\n`);
    await appendFile(evidence, `# Testnet lifecycle ${step} — ${record.capturedAt}\n\n${links.map(l => `[Public explorer](${l})`).join(' · ')}\n\n` +
      'Public observations only. NEAR commands are printed for the lead; this script never signs or sends NEAR transactions. A signature is not a fill; bridge arrival is separate from withdrawal acceptance.\n\n' +
      `\`\`\`json\n${JSON.stringify(record, null, 2)}\n\`\`\`\n\n`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => lifecycle(process.argv.slice(2)));
