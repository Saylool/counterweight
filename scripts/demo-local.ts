import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { LocalSandbox, POLICY_SHA256, MOCK_SHA256, assertSigned } from '@counterweight/local-sandbox';
import { loadMarket } from '../apps/keeper/src/market.js';
import { prepareLocalReplay, replayRisk } from '../apps/keeper/src/local-replay.js';
import { runRogueAttempts } from './demo-rogue.js';
import { demoReportLine, writeDemoReports } from './demo-report.js';

// near-workspaces uses the CJS SDK. Its legacy declaration re-exports are not NodeNext compatible.
const cjsLogger = createRequire(import.meta.url)('@near-js/utils').Logger as {
  overrideLogger(logger?: { log(message: unknown): void; warn(message: unknown): void; error(message: unknown): void }): void;
};
const output = fileURLToPath(new URL('../reports/', import.meta.url));
const transcript: string[] = [];
const diagnostics: string[] = [];
const capture = (message: unknown) => { diagnostics.push(String(message)); };
cjsLogger.overrideLogger({ log: capture, warn: capture, error: capture });
const colour = process.stdout.isTTY && !('NO_COLOR' in process.env);
function emit(line: string) {
  transcript.push(line);
  const code = line.includes('REJECT') ? 31 : line.includes('PASS') || line.includes('SIGNED') ? 32 : 36;
  process.stdout.write(colour ? `\u001b[${code}m${line}\u001b[0m\n` : line + '\n');
}
const report: Record<string, unknown> = {
  schemaVersion: 1, status: 'running', startedAt: new Date().toISOString(),
  offlineGuardActive: process.env.COUNTERWEIGHT_OFFLINE_GUARD === '1',
  policySha256: POLICY_SHA256, mockSha256: MOCK_SHA256, transcript, diagnostics,
  mocked: ['MPC signature-shaped response (not cryptographic)', 'wNEAR token + sale route receipt',
    'venue margin, funding settlement and fills', 'historical executable depth at 5 bps'],
  boundaries: ['H is keeper policy, not a contract oracle', 'Spot sale requires owner approval; spot remains directional after close',
    'Replay time differs from sandbox block time', 'Contract signing reservations do not prove fills',
    'Keeper uses a disposable local key with zero attached deposit; policy operating reserve pays MPC; policy has zero access keys',
    'Callback replay is rejected; no Hyperliquid nonce replay/fill claim'],
};
let local: LocalSandbox | undefined;
try {
  emit('COUNTERWEIGHT | LOCAL SANDBOX | MOCK MPC / MOCK FILLS | no wallet or testnet account');
  if (report.offlineGuardActive) emit('OFFLINE GUARD active | Node connections restricted to loopback');
  const data = await loadMarket(fileURLToPath(new URL('../fixtures/market/', import.meta.url)));
  const plan = prepareLocalReplay(data);
  report.selection = plan.selection;
  report.fixtureManifestSha256 = data.manifestSha256;
  report.configuration = { quantityNear: plan.quantity, initialMarginUsd: plan.initialMargin, assetIndex: data.assetIndex,
    szDecimals: data.szDecimals, priceMaxAgeSeconds: 120, heartbeatTimeoutSeconds: 600 };
  emit(`FIXTURES SHA-256 verified | worst 24h +${plan.selection.perpMovePct.toFixed(6)}% / ${plan.selection.candidates} windows`);
  emit(`WINDOW ${new Date(plan.selection.start).toISOString()} -> ${new Date(plan.selection.end).toISOString()}`);
  local = await LocalSandbox.start(String(Math.round(plan.anchor.perp.close * 1e6)), plan.quantityBase, data.assetIndex, data.szDecimals);
  emit(`POLICY SHA-256 ${POLICY_SHA256} verified before deploy`);
  emit(`MOCK MPC SHA-256 ${MOCK_SHA256} verified before deploy`);
  report.accounts = { owner: local.owner.accountId, keeper: local.keeper.accountId, rogue: local.rogue.accountId,
    bystander: local.stranger.accountId, policy: local.policy.accountId, mockMpc: local.mock.accountId };
  report.chain = local.evidence;
  emit(`SETUP local accounts + mock spot ${plan.quantity.toFixed(data.szDecimals)} NEAR | policy access keys: 0`);
  emit('BOUNDARY policy operating reserve pays MPC fee; keeper attaches zero; spot disposal awaits owner approval');
  const order = (reduceOnly: boolean, price: number | null) => ({ order: { asset_index: data.assetIndex,
    size: plan.quantityBase, reduce_only: reduceOnly, reference_price: price === null ? null : String(Math.round(price * 1e6)) } });
  const opened = await local.mustCall(local.keeper, 'request_order_signature', order(false, null));
  const openingRequest = assertSigned(opened, false);
  emit('SETUP keeper bounded short SIGNED (mock); pre-existing hedge / simulated margin $30.00');
  await local.mustCall(local.keeper, 'heartbeat', {});
  const ownerBefore = await local.ownerSnapshot();
  const frozenEvidenceIndex = local.evidence.length;
  report.ownerBefore = ownerBefore;
  emit(`OWNER FROZEN nonce=${ownerBefore.accessKeys.map(k => k.nonce).join(',')} balance=${ownerBefore.balanceYocto} yocto`);
  emit('HOUR (UTC)        NEAR       H USD     KEEPER ACTION          CONTRACT RESULT');
  const timeline: Record<string, unknown>[] = [];
  report.timeline = timeline;
  let quantity = plan.quantity;
  // Opening at the selected endpoint; taker fee/slippage are explicit simulation assumptions.
  let cash = plan.initialMargin - quantity * plan.anchor.perp.close * 0.00095;
  let closeRequest: { id: string; nonce: number } | undefined;
  for (let i = 0; i < plan.bars.length; i++) {
    const bar = plan.bars[i]!;
    cash += quantity * bar.perp.open * bar.fundingRate;
    const { venueEquity, risk } = replayRisk(data, plan, i, quantity, cash);
    const close = risk.proposals.find(p => p.type === 'full-unwind' || p.type === 'exit-proposal');
    let action = quantity === 0 ? 'spot approval pending' : 'monitor';
    let result = 'no transaction';
    if (close && quantity > 0) {
      const signed = await local.mustCall(local.keeper, 'request_order_signature', order(true, bar.perp.close));
      const request = assertSigned(signed, true);
      closeRequest = { id: request.id, nonce: request.payload.nonce };
      action = 'reduce-only close'; result = 'SIGNED mock + event';
      cash = venueEquity - quantity * bar.perp.close * 0.00095;
      quantity = 0; // simulated IOC fill only; never settle contract state without owner.
    }
    timeline.push({ hour: i + 1, time: bar.end, nearPrice: bar.perp.close, headroomUsd: risk.metrics.headroom,
      venueEquityUsd: venueEquity, proposals: risk.proposals, action, result, simulatedShortQuantityAfter: quantity });
    emit(`${new Date(bar.end).toISOString().slice(5, 16).replace('T', ' ')} UTC  $${bar.perp.close.toFixed(4)}   ${risk.metrics.headroom.toFixed(3).padStart(7)}   ${action.padEnd(22)} ${result}`);
  }
  assert(closeRequest, 'Real squeeze must trigger a keeper close');
  assert(closeRequest.nonce > openingRequest.payload.nonce, 'Close must use a new contract-allocated nonce');
  const ownerAfterReplay = await local.ownerSnapshot();
  assert.deepEqual(ownerAfterReplay, ownerBefore, 'Owner changed during autonomous replay');
  report.ownerAfterReplay = ownerAfterReplay;
  emit('PASS owner nonce + balance unchanged; keeper reduce-only close signed; spot sale still owner-approved');
  // Mark staleness is exercised last; all preceding attacks hit their intended checks.
  const rogueAttempts = await runRogueAttempts(local, data.assetIndex,
    String(Math.round(plan.bars.at(-1)!.perp.close * 1e6)), closeRequest, emit);
  report.rogueAttempts = rogueAttempts;
  assert.equal(rogueAttempts.length, 7, 'All seven attacks must execute');
  await local.mustCall(local.keeper, 'heartbeat', {});
  const beforeTimeout = await local.call(local.stranger, 'deleverage', { price: String(Math.round(plan.bars.at(-1)!.perp.close * 1e6)) });
  assert(beforeTimeout.failed && beforeTimeout.receiptFailureMessages.join(' ').includes('ERR_HEARTBEAT_ACTIVE'));
  emit('DEAD-MAN before timeout REJECT ERR_HEARTBEAT_ACTIVE');
  const state = await local.state();
  await local.advancePast(Number(state.last_keeper_heartbeat) * 1000 + 601_000, emit);
  const recovery = await local.mustCall(local.stranger, 'deleverage', { price: String(Math.round(plan.bars.at(-1)!.perp.close * 1e6)) });
  const recoveryRequest = assertSigned(recovery, true);
  assert(recoveryRequest.payload.nonce > closeRequest.nonce, 'Dead-man must use a new contract-allocated nonce');
  const finalState = await local.state();
  assert(finalState.paused, 'Public recovery must pause new keeper authorizations');
  assert.equal(finalState.signed_short_size, plan.quantityBase, 'Mock fills must not release contract reservations');
  assert.equal((await local.policy.viewAccessKeys(local.policy.accountId)).keys.length, 0, 'Policy must remain keyless');
  assert(local.evidence.slice(frozenEvidenceIndex).every(e => e.actor !== local!.owner.accountId), 'Owner sent a transaction after freeze');
  const ownerAfter = await local.ownerSnapshot();
  assert.deepEqual(ownerAfter, ownerBefore, 'Owner changed during attacks or recovery');
  report.ownerAfter = ownerAfter;
  report.autonomousFinalState = finalState;
  report.assertions = { keeperCloseSigned: true, rogueRejected: rogueAttempts.length, ownerUntouchedDuringAutonomousPhase: true,
    ownerTransactionsDuringAutonomousPhase: 0, freshContractNonces: true,
    earlyDeadmanRejected: true, unrelatedDeadmanSigned: true, policyHasNoKeys: true, conservativeExposureRetained: true };
  emit('DEAD-MAN +601s bystander.testnet -> reduce-only SIGNED mock + event; policy paused');
  emit(`OWNER AFTER nonce=${ownerAfter.accessKeys.map(k => k.nonce).join(',')} balance=${ownerAfter.balanceYocto} yocto (unchanged)`);
  emit(`PASS ${rogueAttempts.length}/7 rogue attempts rejected | owner untouched | close + dead-man signed`);
  // Owner resumes only AFTER the autonomous replay/attack/dead-man proof above.
  emit('OWNER RESUMED | autonomous owner-free phase ended; mock rebalance completion begins');
  const progress = (action: string, result: string) => {
    timeline.push({ phase: 'owner-rebalance', action, result, historicalTime: plan.bars.at(-1)!.end });
    emit(`REBALANCE ${action} | ${result}`);
  };
  await local.advancePast(Number(recoveryRequest.payload.expiresAfter), emit);
  await local.mustCall(local.owner, 'set_paused', { paused: false });
  const finalPrice = String(Math.round(plan.bars.at(-1)!.perp.close * 1e6));
  await local.mustCall(local.owner, 'set_reference_price', { price: finalPrice });
  const limits = { adapter: local.mock.accountId,
    strategy_margin_address: '0x1111111111111111111111111111111111111111',
    destination_token: '1cs_v1:hypercore:hip1:0x6d1e7cde53ba9467b783cb7c530ce054',
    per_sale_near: plan.quantityBase, daily_sale_near: plan.quantityBase, max_fee_usdc: '50000', max_impact_bps: 100,
    quote_age_ms: 30000, completion_ms: 3600000, max_mismatch_near: plan.quantityBase,
    per_withdrawal_usdc: '10000000', daily_withdrawal_usdc: '20000000', min_residual_equity_usdc: '1000000',
    min_headroom_bps: 1000, lower_headroom_bps: 3000, target_headroom_bps: 6000, upper_headroom_bps: 9000,
    fee_reserve_usdc: '100000', original_target_usdc: String(BigInt(plan.quantityBase) * BigInt(finalPrice) / 10n ** 24n) };
  await local.mustCall(local.owner, 'configure_rebalancing', { limits });
  await local.mustCall(local.owner, 'observe_margin', { equity_usdc: String(Math.round(cash * 1e6)),
    withdrawable_usdc: '0', observed_at_ms: String(Math.floor(await local.nowMs())) });
  await local.mustCall(local.owner, 'settle_position', { short_size: '0', observed_at_ms: String(Math.floor(await local.nowMs())) });
  assert.equal((await local.state()).signed_short_size, '0');
  progress('owner settle_position', 'mock close fill attested; reserved short released');
  // Refresh immediately before the age-bounded quote and dispatch.
  await local.mustCall(local.owner, 'set_reference_price', { price: finalPrice });
  const quotedAt = Math.floor(await local.nowMs());
  const gross = (BigInt(plan.quantityBase) * BigInt(finalPrice) + 10n ** 24n - 1n) / 10n ** 24n;
  const minUsdc = (gross * 9900n + 9999n) / 10000n - 50000n;
  const sale = await local.mustCall(local.owner, 'approve_spot_sale', { quote: { near_amount: plan.quantityBase,
    paired_closed_near: plan.quantityBase, min_usdc: String(minUsdc), fee_usdc: '50000', impact_bps: 100,
    quoted_at_ms: String(quotedAt), deadline_ms: String(quotedAt + 30000) } });
  assert.equal(sale.parseResult(), true);
  const dispatched = await local.policy.view<any>('get_rebalance');
  assert.equal(dispatched.route.phase, 'AwaitingReceipt');
  assert.equal(dispatched.usable_margin, String(Math.round(cash * 1e6)), 'Dispatch must not credit pending proceeds');
  progress('owner approve_spot_sale', 'mock route dispatched; awaiting finalized receipt; no margin credit yet');
  await local.mustCall(local.owner, 'reconcile_sale_receipt', { route_id: dispatched.route.id, refunded_near: '0',
    credited_usdc: String(minUsdc), receipt_id: 'demo-local-mock-finalized-sale-1',
    finalized_at_ms: String(Math.floor(await local.nowMs())) });
  const completed = await local.policy.view<any>('get_rebalance');
  assert.equal(completed.route, null);
  assert.equal(completed.sold_inventory, plan.quantityBase);
  assert.equal(completed.usable_margin, String(BigInt(dispatched.usable_margin) + minUsdc));
  const completedState = await local.state();
  assert.equal(completedState.spot_balance, '0');
  assert.equal(completedState.signed_short_size, '0');
  assert.equal((await local.policy.viewAccessKeys(local.policy.accountId)).keys.length, 0);
  report.finalState = completedState;
  report.rebalance = { mocked: true, dispatched, completed, creditedUsdc: String(minUsdc) };
  report.ownerAfterRebalance = await local.ownerSnapshot();
  report.assertions = { ...(report.assertions as object), ownerUntouchedDuringAutonomousPhase: true,
    ownerRebalanceCompleted: true, marginCreditedOnlyAfterReceipt: true, finalSpotAndShortZero: true };
  progress('rebalance complete', `owner reconciled mock receipt; sold ${plan.quantity} NEAR; margin credited ${minUsdc} micro-USDC`);
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  const message = error instanceof Error ? error.message : 'Unexpected demo error';
  report.error = message;
  emit(`FAIL ${message}`);
  process.exitCode = 1;
} finally {
  if (local) {
    try { await local.close(); emit('SANDBOX stopped; disposable local accounts removed'); }
    catch { emit('FAIL sandbox cleanup; disposable files may remain in system temp'); process.exitCode = 1; report.status = 'failed'; }
  }
  cjsLogger.overrideLogger();
  report.finishedAt = new Date().toISOString();
  await mkdir(output, { recursive: true });
  emit(demoReportLine('demo-local', report.status));
  const markdown = `# Counterweight local demo\n\nStatus: **${report.status}**. Real recorded market data; local policy execution; mock MPC, token and venue fills.\n\n`
    + `Run: \`npm ci && npm run demo:local\`. No runtime network beyond loopback. See [demo boundary](../packages/local-sandbox/README.md) and [known issues](../docs/KNOWN-ISSUES.md).\n\n`
    + '```text\n' + transcript.join('\n') + '\n```\n\n'
    + 'All emitted application lines are above. Full policy logs, receipt hashes, failures, snapshots and raw SDK diagnostics are retained below and in the JSON report.\n\n```json\n'
    + JSON.stringify(report, null, 2) + '\n```\n';
  await writeDemoReports(output, 'demo-local', report.status, JSON.stringify(report, null, 2) + '\n', markdown);
}
