/** Owner-invoked runner. Importing this module never signs or sends. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { mainnetLifecycle, MAINNET_PLAN, loadMainnetPlan, checkPolicy, readConsumedClassTransfers, mainnetSigningGasTgas, mainnetInfo } from './mainnet-lifecycle.js';
import { parseAccount } from './lifecycle-parsing.js';
import { MAINNET_RPC } from '../packages/hyperliquid/src/index.js';
import { PublicClient, runtime, extractHash } from '../apps/keeper/src/run-io.js';
import { parseOptions } from './testnet-common.js';
import { mainnetVersion } from './mainnet-version.js';
import { checkOwnerSpend } from './mainnet-budget.js';
const exec = promisify(execFile);
export function executionOptions(argv: string[]) {
  if (argv.filter(v => v === '--i-understand-real-funds').length !== 1) throw new Error('Owner execution requires --i-understand-real-funds');
  if (argv.filter(v => v === '--resume').length > 1) throw new Error('Duplicate --resume');
  const opts = parseOptions(argv.filter(v => v !== '--i-understand-real-funds' && v !== '--resume'), ['network', 'step', 'plan', 'amount']);
  if (opts.network !== 'mainnet') throw new Error('Owner execution requires --network=mainnet');
  z.enum(['open', 'close', 'settle', 'withdraw', 'to-perp', 'invalidate']).parse(opts.step);
  return Object.assign(opts, { resume: argv.includes('--resume') });
}
export function executionJournal(plan: string, step: string, original: { step: string } | null, recoverySteps: string[], resume: boolean) {
  const normal = `${plan}.active-execution.json`, recovery = `${plan}.${step}.recovery-execution.json`;
  if (resume) return recoverySteps.includes(step) ? recovery : normal;
  if (original?.step === step || recoverySteps.includes(step)) throw new Error(`Existing uncertain ${step} execution; use --resume after public reconciliation`);
  if (original || recoverySteps.length) {
    if (!['close', 'settle', 'invalidate'].includes(step)) throw new Error('Existing uncertain execution blocks new risk; recover with close, settle or invalidate, then --resume');
    return recovery;
  }
  return normal;
}
/** Expired/confirmed authorizations and independently proved consumed class-transfer nonces
 * do not authorize further venue risk. Never ignore an unproved user authorization. */
export function liveResumeAuthorizations(raw: unknown, consumedClassTransfers: ReadonlySet<number>, now = Date.now()) {
  return z.array(z.object({ nonce: z.number().int().nonnegative(), expires_after: z.number().int().nonnegative(),
    keeper: z.boolean(), withdrawal: z.boolean(), invalidation_confirmed: z.boolean() }).passthrough()).parse(raw)
    .filter(a => a.expires_after >= now && !a.invalidation_confirmed &&
      !(consumedClassTransfers.has(a.nonce) && !a.keeper && !a.withdrawal));
}
export async function executeMainnet(argv: string[]) {
  const opts = executionOptions(argv), planFile = opts.plan ?? MAINNET_PLAN;
  const base = ['--network=mainnet', '--i-understand-real-funds', `--plan=${planFile}`];
  const runFolder = mainnetVersion().version === 'v5' ? 'docs/evidence/mainnet-execute-v5' : 'docs/evidence';
  const run = `${runFolder}/mainnet-execute-${Date.now()}-${randomUUID().slice(0, 8)}`;
  await mkdir(runFolder, { recursive: true });
  const existingJournal = async (file: string) => {
    try { return z.object({ step: z.string() }).passthrough().parse(JSON.parse(await readFile(file, 'utf8'))); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
  };
  const original = await existingJournal(`${planFile}.active-execution.json`);
  const recoverySteps: string[] = [];
  for (const step of ['close', 'settle', 'invalidate']) if (await existingJournal(`${planFile}.${step}.recovery-execution.json`)) recoverySteps.push(step);
  const active = executionJournal(planFile, opts.step!, original, recoverySteps, opts.resume);
  const publicSnapshot = async () => {
    const plan = await loadMainnetPlan(planFile), client = new PublicClient(runtime(), MAINNET_RPC, 'mainnet');
    const [policy, clearing, orders] = await Promise.all([checkPolicy(client, plan, true),
      mainnetInfo(client, { type: 'clearinghouseState', user: plan.derived.address }), mainnetInfo(client, { type: 'openOrders', user: plan.derived.address })]);
    return { policy, venue: parseAccount(clearing), orders: z.array(z.unknown()).parse(orders) };
  };
  if (opts.resume) {
    const journal = z.object({ step: z.literal(opts.step!), request: z.string().optional(), hash: z.string().optional() }).passthrough().parse(JSON.parse(await readFile(active, 'utf8')));
    if (journal.request && journal.hash) {
      try {
        await mainnetLifecycle([...base, '--step=status', `--request=${journal.request}`, `--relay-tx=${journal.hash}`]);
        if (opts.step === 'invalidate') throw new Error('Noop acceptance alone does not prove report_invalidation finalized; checking settled recovery state');
        await unlink(active); console.log('SUCCESS resume; public request proof verified; no sends retried'); return;
      } catch { console.log('Request proof incomplete; checking independently settled recovery state.'); }
    }
    const snapshot = await publicSnapshot();
    const { policy, venue, orders } = snapshot;
    const withdrawal = z.object({ withdrawal: z.unknown().nullable() }).parse(policy.margin).withdrawal;
    const plan = await loadMainnetPlan(planFile), client = new PublicClient(runtime(), MAINNET_RPC, 'mainnet');
    const consumedClassTransfers = await readConsumedClassTransfers(client, planFile, plan);
    if (policy.state.pending !== null || policy.state.signed_short_size !== '0' || venue.signedSize !== 0 || venue.otherPositions.length || orders.length ||
      Date.now() <= Number(policy.state.last_open_expiry) || withdrawal !== null ||
      liveResumeAuthorizations(policy.fullState.outstanding, consumedClassTransfers).length) throw new Error('Resume requires verified request proof OR settled flat state with no pending operation, withdrawal, orders or unconsumed live authorizations');
    await unlink(active); console.log('SUCCESS resume; settled flat recovery verified; no sends retried'); return;
  }
  if (opts.step === 'to-perp') {
    const { venue, orders, policy } = await publicSnapshot();
    if (policy.state.pending === null && !orders.length && !venue.otherPositions.length && venue.signedSize === 0 && venue.equity >= 15) {
      console.log('SKIP to-perp; live perps equity already covers the 15 USDC needed margin; no signature or transfer needed'); return;
    }
  }
  // An uncertain CLI/HTTP outcome blocks another run. Never remove this file to guess a retry.
  const journal: { run: string; step: string; phase: string; commandFile?: string; request?: string; hash?: string } = { run, step: opts.step!, phase: 'claimed-before-send' };
  await writeFile(active, `${JSON.stringify(journal)}\n`, { flag: 'wx' });
  let phase = 'claimed-before-send', sent = false;
  const batch = async (step: string, extra: string[] = []) => {
    const file = `${run}-${step}.sh`;
    // Complete owner balance/gas reads BEFORE taking the time-sensitive venue observation.
    const plan = await loadMainnetPlan(planFile), pc = new PublicClient(runtime(), MAINNET_RPC, 'mainnet');
    const signatureGas = mainnetSigningGasTgas(plan);
    const ownerGas: Record<string, number> = { open: 30, withdraw: 30 + signatureGas, 'withdraw-prepare': 30,
      settle: 30, invalidate: signatureGas + 30, 'to-perp': signatureGas };
    const keeperGas: Record<string, number> = { 'open-prepare': 60, open: signatureGas, close: signatureGas };
    await Promise.all([
      ...(ownerGas[step] ? [checkOwnerSpend(pc, plan.owner, plan.owner, 0n, ownerGas[step])] : []),
      ...(keeperGas[step] ? [checkOwnerSpend(pc, plan.owner, plan.keeper, 0n, keeperGas[step])] : []),
    ]);
    await mainnetLifecycle([...base, `--step=${step}`, `--commands-file=${file}`, ...extra]);
    const source = await readFile(file, 'utf8');
    const commands = source.split('\n').filter(line => line.startsWith('near ') || line.startsWith('curl '));
    const request = /^# REQUEST_FILE: (.+)$/m.exec(source)?.[1];
    if (request) { journal.request = request; await writeFile(active, `${JSON.stringify(journal)}\n`); }
    let lastOutput = '';
    for (const command of commands) {
      phase = command.startsWith('curl ') ? 'exchange-submission-uncertain' : `${step}-near-submission-uncertain`;
      journal.phase = phase; journal.commandFile = file;
      await writeFile(active, `${JSON.stringify(journal)}\n`);
      // Commands originate in the validated planner; the owner invokes this runner explicitly.
      // No CLI or exchange send is ever retried, including timeouts/nonzero exit statuses.
      sent = true;
      const isSignature = /^near .* as-transaction \S+ (request_order_signature|request_evm_withdrawal|request_usd_class_transfer|set_paused|request_next_invalidation) /.test(command);
      const saveHash = async (output: string) => {
        if (!isSignature) return;
        try { journal.hash = extractHash(output); await writeFile(active, `${JSON.stringify(journal)}\n`); }
        catch (error) { if (journal.hash) throw error; /* A failed CLI may have no transaction hash. */ }
      };
      try {
        const result = await exec('/bin/sh', ['-c', command], { encoding: 'utf8', timeout: 90_000, maxBuffer: 2 * 1024 * 1024 });
        lastOutput = `${result.stdout}\n${result.stderr}`;
        await saveHash(lastOutput);
        process.stdout.write(lastOutput);
      } catch (error) {
        const failed = error as Error & { stdout?: string; stderr?: string };
        await saveHash(`${failed.stdout ?? ''}\n${failed.stderr ?? ''}`);
        throw error;
      }
    }
    return { source, commands, lastOutput };
  };
  try {
    if (['open', 'close'].includes(opts.step!)) await batch('open-prepare');
    if (opts.step === 'withdraw') await batch('withdraw-prepare');
    if (opts.step === 'settle') await batch('settle-prepare');
    const signed = await batch(opts.step!, opts.amount ? [`--amount=${opts.amount}`] : []);
    if (opts.step === 'to-perp' && signed.source.includes('# SKIP: to-perp already funded')) {
      await unlink(active); console.log('SKIP to-perp; fresh public balances already cover needed margin'); return;
    }
    if (opts.step === 'settle') {
      const { policy, venue, orders } = await publicSnapshot();
      if (policy.state.pending !== null || policy.state.signed_short_size !== '0' || venue.signedSize !== 0 || venue.otherPositions.length || orders.length) throw new Error('Settlement not verified in finalized policy/public venue');
    } else {
      const request = /^# REQUEST_FILE: (.+)$/m.exec(signed.source)?.[1];
      if (!request) throw new Error('Signing request evidence missing; inspect active execution journal');
      const hash = journal.hash ?? extractHash(signed.lastOutput);
      journal.request = request; journal.hash = hash;
      await writeFile(active, `${JSON.stringify(journal)}\n`);
      await writeFile(`${run}.signed.json`, `${JSON.stringify({ request, hash })}\n`, { flag: 'wx' });
      const extra = [`--request=${request}`, `--relay-tx=${hash}`];
      await batch('relay', extra);
      // Verification is read-only; an invalidation status additionally prints report_invalidation.
      const statusFile = `${run}-status.sh`;
      await mainnetLifecycle([...base, '--step=status', `--commands-file=${statusFile}`, ...extra]);
      if (opts.step === 'invalidate') {
        const source = await readFile(statusFile, 'utf8');
        const report = source.split('\n').find(line => line.startsWith('near '));
        if (!report) throw new Error('Verified Noop report command missing');
        const plan = await loadMainnetPlan(planFile);
        await checkOwnerSpend(new PublicClient(runtime(), MAINNET_RPC, 'mainnet'), plan.owner, plan.owner, 0n, 30);
        phase = 'invalidation-report-uncertain';
        journal.phase = phase;
        await writeFile(active, `${JSON.stringify(journal)}\n`);
        const result = await exec('/bin/sh', ['-c', report], { encoding: 'utf8', timeout: 90_000 });
        process.stdout.write(`${result.stdout}\n${result.stderr}`);
      }
    }
    await unlink(active);
    console.log(`SUCCESS ${opts.step}; evidence prefix ${run}`);
  } catch (error) {
    if (!sent) { await unlink(active); console.error('STOP: preflight failed before any send; execution claim released.'); throw error; }
    console.error(`STOP: ${phase}. Retained ${active}; inspect public status and saved evidence before any retry. A delayed ledger is recoverable with --step=${opts.step} --resume; that command retries public verification only, never sends.`);
    throw error;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  executeMainnet(process.argv.slice(2)).catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
