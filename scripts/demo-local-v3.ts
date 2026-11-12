import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { LocalSandbox, BASE, POLICY_V3_SHA256, MOCK_SHA256, assertSigned } from '@counterweight/local-sandbox';

const logger = createRequire(import.meta.url)('@near-js/utils').Logger;
const transcript: string[] = [];
const diagnostics: string[] = [];
logger.overrideLogger({ log: (m: unknown) => diagnostics.push(String(m)),
  warn: (m: unknown) => diagnostics.push(String(m)), error: (m: unknown) => diagnostics.push(String(m)) });
const emit = (line: string) => { transcript.push(line); process.stdout.write(line + '\n'); };
const cases: Record<string, unknown>[] = [];
const report: Record<string, unknown> = {
  schemaVersion: 1, status: 'running', startedAt: new Date().toISOString(), version: 'v3',
  policySha256: POLICY_V3_SHA256, mockSha256: MOCK_SHA256,
  offlineGuardActive: process.env.COUNTERWEIGHT_OFFLINE_GUARD === '1',
  mocked: ['MPC signature-shaped response (not cryptographic)', 'token deposit',
    'illustrative honest and malicious marks; no venue fills or external oracle'],
  boundaries: ['Real shipped production v3 WASM, hash checked before and after deployment on localhost',
    'Signature authorization is not a fill; IOC can partially fill or fail, fees are additional',
    'The 1% limit is relative to an unauthenticated supplied mark, not the true market or a total loss cap',
    'No public chain, wallet credentials, public RPC, paid API or venue relay'],
  transcript, diagnostics, cases,
};
let local: LocalSandbox | undefined;
try {
  assert.equal(report.offlineGuardActive, true, 'Use npm run demo:local:v3 for the loopback guard');
  // Fail before near-workspaces recursively searches ports on a restricted host.
  await new Promise<void>((resolve, reject) => {
    const probe = createServer();
    probe.once('error', error => reject(new Error(`Local sandbox requires a loopback listener: ${error.message}`)));
    probe.listen(0, '127.0.0.1', () => probe.close(error => error ? reject(error) : resolve()));
  });
  emit('V3 LOCAL SANDBOX | production WASM | MOCK MPC / TOKEN / MARKS | NO FILLS');
  local = await LocalSandbox.start('5000000', BASE.toString(), 54, 1, 'v3');
  report.chain = local.evidence;
  report.deployedSha256 = POLICY_V3_SHA256; // start() verifies viewCode bytes against this pin.
  const opened = await local.mustCall(local.keeper, 'request_order_signature', { order: {
    asset_index: 54, size: BASE.toString(), reduce_only: false, reference_price: null,
  } });
  const opening = assertSigned(opened, false);
  await local.mustCall(local.owner, 'set_paused', { paused: true });
  assert((await local.state()).paused);
  const blockedOpen = await local.call(local.keeper, 'request_order_signature', { order: {
    asset_index: 54, size: BASE.toString(), reduce_only: false, reference_price: null,
  } });
  assert(blockedOpen.failed && blockedOpen.receiptFailureMessages.join(' ').includes('ERR_PAUSED'));
  report.pausedOpenRejection = blockedOpen.receiptFailureMessages;
  emit('PASS paused opening rejected ERR_PAUSED; reductions remain eligible');
  const ownerBefore = await local.ownerSnapshot();
  const evidenceStart = local.evidence.length;
  report.ownerBeforeExits = ownerBefore;
  const band = { minMicroUsd: '2500000', maxMicroUsd: '10000000' };
  report.openingBand = band;
  let lastNonce = opening.payload.nonce;
  for (const scenario of [
    { name: 'paused keeper exit', suppliedMarkMicroUsd: 5_000_000n, illustrativeTrueMarkMicroUsd: 5_000_000n },
    { name: 'out-of-band keeper exit while paused', suppliedMarkMicroUsd: 50_000_000n, illustrativeTrueMarkMicroUsd: 50_000_000n },
    { name: 'malicious high mark while paused', suppliedMarkMicroUsd: 100_000_000n, illustrativeTrueMarkMicroUsd: 50_000_000n },
  ]) {
    const observedAt = String(Math.floor(await local.nowMs() / 1000));
    const signed = await local.mustCall(local.keeper, 'request_order_signature', { order: {
      asset_index: 54, size: BASE.toString(), reduce_only: true,
      reference_price: String(scenario.suppliedMarkMicroUsd), observed_at: observedAt,
    } });
    const request = assertSigned(signed, true);
    const order = request.payload.action.orders[0];
    assert.equal(order.a, 54);
    assert.equal(order.b, true, 'Exit must buy');
    assert.equal(order.s, '1');
    assert.equal(order.t.limit.tif, 'Ioc');
    assert(request.payload.nonce > lastNonce, 'Fresh contract-allocated nonce required');
    lastNonce = request.payload.nonce;
    const limitMicro = BigInt(Math.round(Number(order.p) * 1e6));
    const capMicro = scenario.suppliedMarkMicroUsd * 10100n / 10000n;
    assert(limitMicro <= capMicro, 'Signed limit exceeds supplied mark +1%');
    assert.equal(limitMicro, capMicro, 'These chosen prices are exact venue ticks');
    const premiumToTrueMarkPct = Number(limitMicro - scenario.illustrativeTrueMarkMicroUsd)
      / Number(scenario.illustrativeTrueMarkMicroUsd) * 100;
    cases.push({ name: scenario.name, authorized: true, paused: (await local.state()).paused,
      suppliedMarkMicroUsd: String(scenario.suppliedMarkMicroUsd), observedAt,
      illustrativeTrueMarkMicroUsd: String(scenario.illustrativeTrueMarkMicroUsd),
      signedLimitMicroUsd: String(limitMicro), capMicroUsd: String(capMicro), premiumToTrueMarkPct,
      withinSuppliedMarkCap: true, request, transactionHash: signed.transactionReceipt.hash });
    emit(`PASS ${scenario.name} | supplied $${Number(scenario.suppliedMarkMicroUsd) / 1e6} | signed IOC buy limit $${order.p} | ${premiumToTrueMarkPct.toFixed(2)}% above illustrative true mark | reduce-only`);
  }
  assert(Number(cases[2]!.premiumToTrueMarkPct) > 1, 'False mark must demonstrate the unauthenticated-price limitation');
  const state = await local.state();
  assert.equal(state.signed_short_size, BASE.toString(), 'Signatures do not settle exposure');
  assert.equal((await local.policy.viewAccessKeys(local.policy.accountId)).keys.length, 0);
  const ownerAfter = await local.ownerSnapshot();
  assert.deepEqual(ownerAfter, ownerBefore);
  assert(local.evidence.slice(evidenceStart).every(e => e.actor !== local!.owner.accountId));
  report.ownerAfterExits = ownerAfter;
  report.finalState = state;
  report.assertions = { pausedOpenRejected: true, pausedExitAuthorized: true, outOfBandExitAuthorized: true,
    maliciousMarkAuthorized: true, signedLimitWithinSuppliedMarkPlusOnePercent: true,
    trueMarketOnePercentGuaranteeDisproved: true, exitsBuyReduceOnlyIocFixedMarketAndSize: true,
    ownerUnchangedDuringExits: true, policyHasNoKeys: true, signaturesDoNotSettleExposure: true };
  emit('BOUNDARY the 1% cap stops a limit above supplied mark +1%; it does not authenticate the mark, guarantee fills, cap fees or bound total portfolio loss.');
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = error instanceof Error ? error.message : String(error);
  emit(`FAIL ${report.error}`);
  process.exitCode = 1;
} finally {
  if (local) {
    try { await local.close(); emit('SANDBOX stopped; disposable local accounts removed'); }
    catch (error) { report.status = 'failed'; report.cleanupError = String(error); process.exitCode = 1; }
  }
  logger.overrideLogger();
  report.finishedAt = new Date().toISOString();
  const directory = fileURLToPath(new URL('../reports/', import.meta.url));
  await mkdir(directory, { recursive: true });
  await writeFile(directory + 'demo-local-v3.json', JSON.stringify(report, null, 2) + '\n');
  await writeFile(directory + 'demo-local-v3.md', '# V3 offline exit authorization demo\n\n'
    + `Status: **${report.status}**. Run: \`npm run demo:local:v3\`. Shipped production WASM; mock MPC/token/marks; no venue fills.\n\n`
    + 'The configured scenario opening band is $2.50–$10.00. The illustrative true mark is a scenario assumption, not an authenticated observation.\n\n'
    + '```text\n' + transcript.join('\n') + '\n```\n\n'
    + 'Full calls, receipt hashes, signed payloads, assertions and diagnostics: [demo-local-v3.json](demo-local-v3.json).\n');
}
