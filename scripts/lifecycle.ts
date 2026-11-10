import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { assembleRequest, deriveTestnetAddress, recoveredSigner, TESTNET_API } from '../packages/hyperliquid/src/index.js';
import { stressMetrics } from '../packages/domain/src/index.js';
import { BASE, decimal, info, liveMarket, orderPrice, units, withdrawalConfig } from './lifecycle-config.js';
import { parseAccount, parseFills, parseLifecycleReceipt, parseWithdrawal, verifyFill, type ExpectedCall } from './lifecycle-parsing.js';
import { callCommand, initialization } from './testnet-plan.js';
import { committedWasm, KEEPER, NEXT_POLICY, OWNER, parseOptions, PATH, publicCli, rpc, stateAt, txHash } from './testnet-common.js';
import { checkKeys, planConfigMatches, policyStateSchema } from './testnet-verify.js';
import { assertFreshContractProof } from './prove-contract.js';
import { isDeepStrictEqual } from 'node:util';

export async function loadPlan(file: string) {
  const raw = z.object({ policy: z.literal(NEXT_POLICY), capturedAt: z.string().datetime(), market: z.object({ mark: z.string(),
    assetIndex: z.number(), szDecimals: z.number() }), init: z.unknown(), derived: z.object({ address: z.string() }),
    artifact: z.object({ sha256: z.string() }) }).parse(JSON.parse(await readFile(file, 'utf8')));
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
export function buildOrder(state: z.infer<typeof policyStateSchema>, market: Awaited<ReturnType<typeof liveMarket>>, account: ReturnType<typeof parseAccount>, close: boolean) {
  if (state.paused || state.pending !== null || account.otherPositions.length || account.signedSize > 0) throw new Error('Policy paused/pending or unexpected venue positions');
  if (state.asset_index !== market.assetIndex || state.size_decimals !== market.szDecimals) throw new Error('Policy market changed');
  const oracle = z.object({ min_price: z.string(), max_price: z.string() }).parse(state.oracle);
  const mark = BigInt(Math.round(Number(market.mark) * 1e6));
  if (mark < BigInt(oracle.min_price) || mark > BigInt(oracle.max_price)) throw new Error('Policy live mark outside immutable bounds');
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
  const price = decimal(orderPrice(mark, market.szDecimals, close, state.limits.price_band_bps), 6);
  return { size: decimal(size, 24), price, args: { order: { asset_index: market.assetIndex, size: size.toString(), reduce_only: close,
    reference_price: close ? mark.toString() : null } }, reference: mark.toString() };
}
export function withdrawalSetupReady(state: z.infer<typeof policyStateSchema>, account: ReturnType<typeof parseAccount>, observedAtMs: number, openOrders: unknown[]) {
  const expiry = z.string().regex(/^\d+$/).parse(state.last_open_expiry);
  return BigInt(expiry) > 0n && observedAtMs > Number(expiry) && state.signed_short_size === '0'
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
  const [clearinghouseState, userFills, ledger, funding, openOrders] = await Promise.all([
    info({ type: 'clearinghouseState', user: address }), info({ type: 'userFills', user: address }),
    info({ type: 'userNonFundingLedgerUpdates', user: address, startTime: Date.now() - 86400000 }),
    info({ type: 'userFunding', user: address, startTime: Date.now() - 86400000 }),
    info({ type: 'openOrders', user: address }),
  ]);
  return { observedAtMs, clearinghouseState, userFills, ledger, funding, openOrders: z.array(z.unknown()).parse(openOrders),
    account: parseAccount(clearinghouseState), fills: parseFills(userFills) };
}
export async function lifecycle(argv: string[]) {
  const options = parseOptions(argv, ['step', 'plan', 'spot-tx', 'settle-tx', 'relay-tx']);
  const step = z.enum(['open', 'status', 'close', 'withdraw']).parse(options.step);
  if (options['relay-tx'] && step !== 'status') throw new Error('Expected --relay-tx only with --step=status (read-only verification)');
  await mkdir('docs/evidence', { recursive: true });
  const record: Record<string, unknown> = { step, capturedAt: new Date().toISOString(), network: 'testnet', outcome: 'pending' };
  const links: string[] = [];
  let relayClaim: string | undefined;
  const commands: string[] = [];
  record.commands = commands;
  const printCommand = (command: string) => { commands.push(command); console.log(command); };
  const evidence = `docs/evidence/${new Date().toISOString().slice(0, 10)}-lifecycle-${step}.md`;
  try {
    const [plan, artifact, derived, market] = await Promise.all([loadPlan(options.plan ?? 'docs/evidence/policy-v2-plan.json'), committedWasm(),
      deriveTestnetAddress(NEXT_POLICY, PATH), liveMarket()]);
    if (plan.artifact.sha256 !== artifact.sha256 || derived.address !== plan.derived.address || market.assetIndex !== plan.init.asset_index || market.szDecimals !== plan.init.size_decimals) throw new Error('Policy plan/artifact/derivation/metadata mismatch');
    record.derived = derived; record.market = market; record.recipient = plan.init.evm_recipient;
    links.push(`https://testnet.nearblocks.io/address/${NEXT_POLICY}`, `https://app.hyperliquid-testnet.xyz/explorer/address/${derived.address}`,
      `https://sepolia.arbiscan.io/address/${plan.init.evm_recipient}`);
    const block = z.object({ header: z.object({ hash: z.string() }) }).parse(await rpc('block', { finality: 'final' })).header.hash;
    async function checkBlock(at: string, requireKeyless: boolean) {
      const [rawAccount, keys, rawState] = await Promise.all([
        rpc('query', { request_type: 'view_account', account_id: NEXT_POLICY, block_id: at }),
        rpc('query', { request_type: 'view_access_key_list', account_id: NEXT_POLICY, block_id: at }), stateAt(at, NEXT_POLICY),
      ]);
      z.object({ code_hash: z.literal(artifact.codeHash), block_hash: z.literal(at) }).parse(rawAccount);
      z.object({ block_hash: z.literal(at) }).parse(keys);
      if (!checkKeys(keys, !requireKeyless).ok && !(step === 'status' && checkKeys(keys).ok)) throw new Error('Policy custody key list mismatch');
      const state = policyStateSchema.parse(rawState);
      if (!planConfigMatches(state, plan.init) || state.evm_recipient !== plan.init.evm_recipient) throw new Error('Policy config differs from saved plan');
      return { block: at, state, keys, account: rawAccount };
    }
    const [preflight, before, token, rebalance] = await Promise.all([checkBlock(block, step !== 'status'), snapshot(derived.address),
      view('ft_balance_of', { account_id: NEXT_POLICY }, 'wrap.testnet', block), view('get_rebalance', {}, NEXT_POLICY, block)]);
    const state = preflight.state;
    const spot = z.string().regex(/^\d+$/).parse(token);
    if (spot !== state.spot_balance) throw new Error('Policy spot_balance differs from actual wrap.testnet custody');
    record.rebalance = rebalance; record.preflight = preflight; record.before = before; record.spot = { contract: state.spot_balance, token: spot, near: decimal(BigInt(spot), 24) };
    record.risk = stressMetrics({ shortNotional: Math.abs(before.account.signedSize) * Number(market.mark), venueEquity: before.account.equity,
      shortQuantityNear: Math.abs(before.account.signedSize), referencePriceUsd: Number(market.mark), priceBandBps: state.limits.price_band_bps });
    record.riskNote = 'Shared stressMetrics model H in USDC; mainnet NEAR maintenance assumptions, not a venue liquidation guarantee. Live venue equity/margin and funding are recorded separately.';
    for (const [option, method, receiver] of [['spot-tx', 'ft_transfer_call', 'wrap.testnet'], ['settle-tx', 'settle_position', NEXT_POLICY]] as const) {
      if (!options[option]) continue;
      const hash = txHash(options[option]);
      const raw = await rpc('tx', { tx_hash: hash, sender_account_id: OWNER, wait_until: 'FINAL' });
      const tx = z.object({ final_execution_status: z.literal('FINAL'), status: z.object({ SuccessValue: z.string() }).strict(),
        transaction: z.object({ hash: z.literal(hash), signer_id: z.literal(OWNER), receiver_id: z.literal(receiver), actions: z.array(z.object({ FunctionCall: z.object({ method_name: z.literal(method), args: z.string() }) })).length(1) }),
        receipts_outcome: z.array(z.object({ outcome: z.object({ executor_id: z.string(), logs: z.array(z.string()), status: z.record(z.string(), z.unknown()) }) })) }).parse(raw);
      const args = JSON.parse(Buffer.from(tx.transaction.actions[0]!.FunctionCall.args, 'base64').toString('utf8'));
      if (option === 'spot-tx') z.object({ receiver_id: z.literal(NEXT_POLICY), amount: z.literal((5n * BASE).toString()), msg: z.literal('') }).passthrough().parse(args);
      const eventName = option === 'spot-tx' ? 'deposit' : 'position_settlement';
      if (!tx.receipts_outcome.some(r => r.outcome.executor_id === NEXT_POLICY && !('Failure' in r.outcome.status) && r.outcome.logs.some(l => {
        if (!l.startsWith('EVENT_JSON:')) return false;
        const e = JSON.parse(l.slice(11));
        return e.standard === 'counterweight' && e.event === eventName && (option !== 'spot-tx' || e.data?.[0]?.amount === (5n * BASE).toString());
      }))) throw new Error('Contract successful deposit/settlement receipt missing');
      record[option] = raw; links.push(`https://testnet.nearblocks.io/txns/${hash}`);
    }
    const withdrawalLimits = BigInt(state.spot_balance) > 0n ? withdrawalConfig(derived.address, state.spot_balance, plan.init.oracle.min_price, NEXT_POLICY) : null;
    if (rebalance !== null) {
      const configured = z.object({ limits: z.unknown() }).parse(rebalance);
      if (withdrawalLimits === null || !isDeepStrictEqual(configured.limits, withdrawalLimits)) throw new Error('Policy withdrawal configuration differs from bounded lifecycle setup');
    }
    if (step === 'status') {
      record.openOrders = before.openOrders;
      if (options['relay-tx']) {
        const hash = txHash(options['relay-tx']);
        const saved = z.object({ step: z.enum(['open', 'close', 'withdraw']), txHash: z.literal(hash),
          expected: z.object({ method: z.enum(['request_order_signature', 'request_evm_withdrawal']), args: z.record(z.string(), z.unknown()),
            caller: z.string(), policy: z.literal(NEXT_POLICY), asset: z.literal(market.assetIndex), reduceOnly: z.boolean(), size: z.string(),
            price: z.string(), recipient: z.literal(state.evm_recipient), amount: z.string() }),
          before: z.object({ clearinghouseState: z.unknown() }), hyperliquidResponse: z.unknown(),
        }).parse(JSON.parse(await readFile(`docs/evidence/lifecycle-relay-${hash}.json`, 'utf8')));
        if (saved.expected.caller !== (saved.step === 'withdraw' ? OWNER : KEEPER)
          || saved.expected.method !== (saved.step === 'withdraw' ? 'request_evm_withdrawal' : 'request_order_signature')
          || saved.expected.reduceOnly !== (saved.step === 'close')) throw new Error('Policy saved relay identity mismatch');
        const nearResponse = await rpc('tx', { tx_hash: hash, sender_account_id: saved.expected.caller, wait_until: 'FINAL' });
        const parsed = parseLifecycleReceipt(nearResponse, hash, saved.expected);
        if ((await recoveredSigner(parsed.digest, parsed.signature)).toLowerCase() !== derived.address) throw new Error('Contract recorded relay signature mismatch');
        const verification = saved.step === 'withdraw'
          ? parseWithdrawal(saved.hyperliquidResponse, before.ledger, saved.expected.amount, parsed.nonce)
          : verifyFill(saved.hyperliquidResponse, before.userFills, parseAccount(saved.before.clearinghouseState), before.account,
            saved.expected.size, saved.expected.reduceOnly, parsed.nonce);
        record.relayVerification = { step: saved.step, txHash: hash, nearResponse, verification,
          note: 'Read-only recheck. Position-delta checks require rechecking an order before a later order changes its position. Withdrawal ledger confirmation does not prove bridge arrival.' };
        links.push(`https://testnet.nearblocks.io/txns/${hash}`);
        const hashes = saved.step === 'withdraw' ? [z.object({ hash: z.string() }).parse(verification)]
          : z.object({ fills: z.array(z.object({ hash: z.string() })) }).parse(verification).fills;
        for (const entry of hashes) links.push(`https://app.hyperliquid-testnet.xyz/explorer/tx/${entry.hash}`);
      }
      if (before.account.signedSize === 0 && BigInt(state.signed_short_size) > 0n) {
        const expiry = z.string().regex(/^\d+$/).parse(state.last_open_expiry);
        record.settlementRequired = { afterMs: Number(expiry), command: callCommand('settle_position', { short_size: '0', observed_at_ms: String(before.observedAtMs) }, OWNER, '30 Tgas', '0 NEAR', NEXT_POLICY),
          note: 'Run only after last_open_expiry, no open orders/remaining short, and within 30s of this public observation. Regenerate status if stale. Owner attestation releases reserved exposure; it is not an on-chain Hyperliquid proof.' };
        if (before.observedAtMs <= Number(expiry) || before.openOrders.length || state.pending !== null || Date.now() - before.observedAtMs > 25000)
          record.settlementRequired = { wait: 'Wait for expiry, no pending callback and zero open orders, then rerun status for a fresh settlement command', afterMs: Number(expiry) };
      }
      if (withdrawalSetupReady(state, before.account, before.observedAtMs, before.openOrders) && rebalance === null && withdrawalLimits !== null) {
        record.withdrawalSetup = { command: callCommand('configure_rebalancing', { limits: withdrawalLimits }, OWNER, '30 Tgas', '0 NEAR', NEXT_POLICY),
          note: 'Owner runs once after close. Existing WASM requires this for withdraw3. Adapter is an uncreated child of the keyless policy; no route is invoked. Sale caps are 1 yoctoNEAR, withdrawal caps $60, residual equity $1. This setup ends the run; do not reopen without a separate plan.' };
      }
      record.outcome = 'public-status-verified';
      console.log(JSON.stringify(record, null, 2)); return;
    }
    if (Date.now() - Date.parse(market.capturedAt) > 30000) throw new Error('Hyperliquid mark too old; restart for fresh commands');
    let expected: ExpectedCall;
    if (step === 'withdraw') {
      if (before.account.signedSize !== 0 || before.account.otherPositions.length || state.signed_short_size !== '0' || state.pending !== null) throw new Error('Policy withdrawal requires flat venue AND owner-settled contract; run status and its settlement command');
      if (!withdrawalSetupReady(state, before.account, before.observedAtMs, before.openOrders)) throw new Error('Policy withdrawal requires expired opening authorizations and zero open orders');
      if (withdrawalLimits === null) throw new Error('Policy withdrawal setup requires spot inventory');
      if (rebalance === null) {
        record.setupCommand = callCommand('configure_rebalancing', { limits: withdrawalLimits }, OWNER, '30 Tgas', '0 NEAR', NEXT_POLICY);
        record.outcome = 'withdrawal-setup-required';
        console.log(`Run this one-time owner setup, then rerun lifecycle --step=withdraw:\n${record.setupCommand}`);
        return;
      }
      const r = z.object({ route: z.null(), withdrawal: z.null(), withdrawals: z.array(z.tuple([z.number(), z.string()])) }).parse(rebalance);
      if (r.withdrawals.length) throw new Error('Policy has prior withdrawal usage; inspect evidence before another withdrawal');
      // Existing WASM requires $1 residual equity; fees/rounding are also covered conservatively.

      const amount = BigInt(Math.floor(Math.min(before.account.withdrawable, before.account.equity) * 1e6)) - 1_000_000n;
      if (amount <= 1_000_000n || amount > 60_000_000n) throw new Error('Hyperliquid insufficient withdrawable USDC after $1 fee reserve');
      expected = { method: 'request_evm_withdrawal', args: { recipient: state.evm_recipient, amount: amount.toString() }, caller: OWNER,
        policy: NEXT_POLICY, asset: market.assetIndex, reduceOnly: false, size: '0', price: '0', recipient: state.evm_recipient, amount: decimal(amount, 6) };
      console.log('Run these owner commands in terminal B, then the signature request immediately (observations expire after 30s):');
      if (Date.now() - before.observedAtMs > 25000) throw new Error('Hyperliquid margin observation too old; restart for fresh commands');
      printCommand(callCommand('set_reference_price', { price: String(Math.round(Number(market.mark) * 1e6)) }, OWNER, '30 Tgas', '0 NEAR', NEXT_POLICY));
      printCommand(callCommand('observe_margin', { equity_usdc: String(Math.floor(before.account.equity * 1e6)),
        withdrawable_usdc: String(Math.floor(Math.min(before.account.withdrawable, before.account.equity) * 1e6)), observed_at_ms: String(before.observedAtMs) }, OWNER, '30 Tgas', '0 NEAR', NEXT_POLICY));
      console.log('Owner approves withdraw3 to fixed recipient. This starts a bridge withdrawal. The contract retains $1 equity; the venue deducts its withdrawal fee from the bridge payout. No venue expiresAfter exists; relay accepts only a fresh callback.');
    } else {
      if (rebalance !== null) throw new Error('Policy lifecycle trading must finish before one-time withdrawal setup');
      if (before.openOrders.length) throw new Error('Hyperliquid unresolved open orders');
      const order = buildOrder(state, market, before.account, step === 'close');
      expected = { method: 'request_order_signature', args: order.args, caller: KEEPER, policy: NEXT_POLICY, asset: market.assetIndex,
        reduceOnly: step === 'close', size: order.size, price: order.price, recipient: state.evm_recipient, amount: '0' };
      console.log(`Live mark $${market.mark}. IOC ${step}: ${order.size} NEAR; limit $${order.price}. Run these keeper commands in terminal B now, in order:`);
      printCommand(callCommand('heartbeat', {}, KEEPER, '30 Tgas', '0 NEAR', NEXT_POLICY));
      printCommand(callCommand('set_keeper_price', { price: order.reference, observed_at: String(Math.floor(Date.parse(market.capturedAt) / 1000)) }, KEEPER, '30 Tgas', '0 NEAR', NEXT_POLICY));
    }
    const command = callCommand(expected.method, expected.args, expected.caller, '300 Tgas', '0 NEAR', NEXT_POLICY);
    record.command = command; record.expected = expected;
    printCommand(command);
    console.log('Relay ready. Paste final command tx hash immediately (or pipe just the hash to stdin). 60s includes MPC and finality; never retry an uncertain signature.');
    const hash = await readHash(); record.txHash = hash; links.push(`https://testnet.nearblocks.io/txns/${hash}`);
    const raw = await rpc('tx', { tx_hash: hash, sender_account_id: expected.caller, wait_until: 'FINAL' }); record.nearResponse = raw;
    const parsed = parseLifecycleReceipt(raw, hash, expected); record.parsed = parsed;
    const assertFresh = () => {
      if (parsed.input.scheme === 'l1') assertFreshContractProof(parsed.input);
      else if (parsed.nonce > Date.now() + 1000 || parsed.nonce < Date.now() - 57000) throw new Error('Contract withdrawal callback is too old; do not relay');
    };
    assertFresh();
    const [checks, recovered] = await Promise.all([Promise.all(parsed.blocks.map(b => checkBlock(b, true))), recoveredSigner(parsed.digest, parsed.signature)]);
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
        if (step === 'withdraw') verification = parseWithdrawal(exchange, after.ledger, expected.amount, parsed.nonce);
        else verification = verifyFill(exchange, after.userFills, before.account, after.account, expected.size, expected.reduceOnly, parsed.nonce);
        break;
      } catch (error) { lastError = error; }
      if (attempt < 5) await new Promise(resolve => setTimeout(resolve, 1500));
    }
    if (!verification) throw lastError;
    record.verification = verification;
    const fills = step === 'withdraw' ? [z.object({ hash: z.string() }).parse(verification)] : z.object({ fills: z.array(z.object({ hash: z.string() })) }).parse(verification).fills;
    for (const f of fills) links.push(`https://app.hyperliquid-testnet.xyz/explorer/tx/${f.hash}`);
    record.outcome = step === 'withdraw' ? 'venue-withdrawal-ledger-verified-bridge-arrival-unverified' : 'public-fill-and-position-verified';
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
