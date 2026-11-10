import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { assembleRequest, recoveredSigner, TESTNET_API } from '../../../packages/hyperliquid/src/index.js';
import { parseAccount, parseFills, parseLifecycleReceipt, verifyFill, type ExpectedCall } from '../../../scripts/lifecycle-parsing.js';
import { assertFreshContractProof } from '../../../scripts/prove-contract.js';
import { decimal, units } from '../../../scripts/lifecycle-config.js';
import { testnetAccount } from '../../../scripts/testnet-common.js';
import { assess, heartbeatDue, priceNeeded, planOrder, riskSettings, KEEPER, type PolicyState } from './run-state.js';
import { commandArgs, DiskStore, printable, PublicClient, runtime, sendNear, type Runtime } from './run-io.js';

export interface RunOptions { policy: string; hours: number; intervalMs: number; dry: boolean; allowOpen: boolean; cycles?: number }
export function parseRunOptions(argv: string[]): RunOptions {
  const values: Record<string, string> = {};
  for (const arg of argv) {
    const m = /^--(policy|hours|interval-seconds|cycles)=(.+)$/.exec(arg);
    const key = m?.[1] ?? (['--dry', '--allow-open'].includes(arg) ? arg.slice(2) : '');
    if (!key || values[key] !== undefined) throw new Error('Expected unique --policy=ACCOUNT --hours=N --interval-seconds=N --cycles=N --dry --allow-open');
    values[key] = m?.[2] ?? 'true';
  }
  if (values.dry !== 'true' && values.policy === undefined) throw new Error('Expected --policy=ACCOUNT for a live keeper run');
  const hours = z.coerce.number().finite().positive().max(8760).parse(values.hours ?? 48);
  const intervalMs = z.coerce.number().finite().min(1).max(300).parse(values['interval-seconds'] ?? 300) * 1000;
  return { policy: testnetAccount(values.policy ?? 'policy.counterweight-samet.testnet'), hours, intervalMs,
    dry: values.dry === 'true', allowOpen: values['allow-open'] === 'true',
    ...(values.cycles === undefined ? {} : { cycles: z.coerce.number().int().positive().parse(values.cycles) }) };
}
export interface Cycle {
  timestamp: string; finishedAt: string; mark: number | null; funding: number | null; position: number | null; equity: number | null;
  H: number | null; thresholdUsd: number | null; decision: string; txHashes: string[]; hyperliquidResponses: Record<string, unknown>;
  commands: string[]; heartbeats: number; reductions: number; opens: number; errors: string[]; dry: boolean;
  [key: string]: unknown;
}
export interface Summary {
  startedAt: number; finishedAt: number; cycles: number; heartbeats: number; reductions: number; opens: number;
  errors: number; gaps: number; maxGapMs: number; lastCycleAt: number | null; dataErrorCycles: number;
}
export function newSummary(now: number): Summary {
  return { startedAt: now, finishedAt: now, cycles: 0, heartbeats: 0, reductions: 0, opens: 0, errors: 0, gaps: 0,
    maxGapMs: 0, lastCycleAt: null, dataErrorCycles: 0 };
}
export function addCycle(s: Summary, c: Cycle, intervalMs: number): Summary {
  const start = Date.parse(c.timestamp), gap = s.lastCycleAt === null ? 0 : Math.max(0, start - s.lastCycleAt);
  return { ...s, finishedAt: Date.parse(c.finishedAt), cycles: s.cycles + 1, heartbeats: s.heartbeats + c.heartbeats,
    reductions: s.reductions + c.reductions, opens: s.opens + c.opens, errors: s.errors + c.errors.length,
    gaps: s.gaps + (gap > intervalMs * 1.5 ? Math.max(1, Math.floor(gap / intervalMs) - 1) : 0),
    maxGapMs: Math.max(s.maxGapMs, gap), lastCycleAt: start, dataErrorCycles: s.dataErrorCycles + (c.H === null ? 1 : 0) };
}
export function summaryMarkdown(s: Summary, options: RunOptions, runId: string, final: boolean) {
  return `# Counterweight keeper ${runId}\n\n` +
    `Policy: ${options.policy} · TESTNET · ${options.dry ? 'DRY (commands only)' : 'LIVE'} · opening ${options.allowOpen ? 'enabled within caps' : 'disabled'}\n\n` +
    `Status: ${final ? 'stopped' : 'running'}\nStarted: ${new Date(s.startedAt).toISOString()}\nUpdated: ${new Date(s.finishedAt).toISOString()}\n\n` +
    `| Metric | Value |\n| --- | ---: |\n| Uptime seconds | ${Math.max(0, s.finishedAt - s.startedAt) / 1000} |\n| Cycles | ${s.cycles} |\n| Confirmed heartbeats | ${s.heartbeats} |\n| Verified reductions | ${s.reductions} |\n| Verified opens | ${s.opens} |\n| Errors | ${s.errors} |\n| Missing cycle intervals (estimated) | ${s.gaps} |\n| Maximum cycle start gap seconds | ${s.maxGapMs / 1000} |\n| Cycles without risk data | ${s.dataErrorCycles} |\n\n` +
    'H is USDC headroom from packages/domain, using observed venue equity and the policy price band/reserve. Threshold is upper-band notional × policy min_headroom_bps (default 1000 when absent). Maintenance assumptions are model diagnostics. A signature is not a fill. Dry commands do not count as confirmed actions.\n';
}
interface ActiveOrder {
  phase: 'near-uncertain' | 'relay-claimed' | 'verify'; expected: ExpectedCall; address: string; codeHash: string;
  before: unknown; createdAt: number; txHash?: string; exchangeResponse?: unknown; httpStatus?: number;
}
export function safeFailure(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') return 'Policy keeper lock or relay claim already exists; inspect the audit files before restarting';
  if (error instanceof Error && /^(Expected |Policy |NEAR |Hyperliquid |Contract )/.test(error.message)) return error.message.split('\n')[0]!.slice(0, 240);
  return 'Unavailable or invalid public response; no uncertain signature retried';
}
export class Keeper {
  readonly client: PublicClient;
  readonly activeName: string;
  private addressCache: { identity: string; address: string } | undefined;
  constructor(readonly options: RunOptions, readonly store: DiskStore, readonly rt: Runtime, readonly stopped: () => boolean = () => false) {
    this.client = new PublicClient(rt);
    this.activeName = `${options.policy}.active.json`;
  }
  async command(c: Cycle, method: 'heartbeat' | 'set_keeper_price', args: unknown) {
    const command = commandArgs(this.options.policy, method, args);
    c.commands.push(printable(command)); this.rt.print(`${this.options.dry ? 'WOULD SEND' : 'SEND'} ${printable(command)}`);
    if (this.options.dry || this.stopped()) return;
    const hash = await sendNear(this.rt, command); c.txHashes.push(hash);
    const raw = await this.client.rpc('tx', { tx_hash: hash, sender_account_id: KEEPER, wait_until: 'FINAL' });
    z.object({ final_execution_status: z.literal('FINAL'), status: z.object({ SuccessValue: z.string() }).strict(),
      transaction: z.object({ hash: z.literal(hash), signer_id: z.literal(KEEPER), receiver_id: z.literal(this.options.policy) }),
      receipts_outcome: z.array(z.object({ outcome: z.object({ status: z.record(z.string(), z.unknown()).refine(s => !('Failure' in s)) }) })),
    }).parse(raw);
    if (method === 'heartbeat') c.heartbeats++;
  }
  async address(state: PolicyState) {
    const identity = `${state.signer_account}:${state.derivation_path}`;
    if (this.addressCache?.identity === identity) return this.addressCache.address;
    const address = await this.client.derive(this.options.policy, state);
    this.addressCache = { identity, address }; return address;
  }
  async verifyActive(active: ActiveOrder, c: Cycle): Promise<boolean> {
    if (active.expected.method !== 'request_order_signature' || active.expected.policy !== this.options.policy || active.expected.caller !== KEEPER ||
      !['near-uncertain', 'relay-claimed', 'verify'].includes(active.phase)) throw new Error('Policy active journal identity invalid');
    if (!active.txHash) { c.decision = 'blocked-uncertain-near-signature'; return false; }
    if (!c.txHashes.includes(active.txHash)) c.txHashes.push(active.txHash);
    const raw = await this.client.rpc('tx', { tx_hash: active.txHash, sender_account_id: KEEPER, wait_until: 'FINAL' });
    const parsed = parseLifecycleReceipt(raw, active.txHash, active.expected);
    if (active.address !== c.derivedAddress) throw new Error('Policy active order derivation changed');
    if (parsed.input.scheme !== 'l1') throw new Error('Contract keeper order must use l1 signature');
    c.nearReceipt = raw;
    if (active.phase === 'near-uncertain') {
      if (!active.expected.reduceOnly && !this.options.allowOpen) { c.decision = 'blocked-opening-disabled'; return false; }
      assertFreshContractProof(parsed.input, this.rt.now());
      const [checks, recovered] = await Promise.all([
        Promise.all(parsed.blocks.map(block => this.client.policy(this.options.policy, block))), recoveredSigner(parsed.digest, parsed.signature),
      ]);
      if (recovered.toLowerCase() !== active.address || checks.some(p => !p.keyless || p.codeHash !== active.codeHash ||
        p.state.asset_index !== active.expected.asset || `${p.state.signer_account}:${p.state.derivation_path}` !== this.addressCache?.identity))
        throw new Error('Policy relay identity/code/keyless check failed');
      const request = assembleRequest(parsed.input, parsed.signature);
      // As in lifecycle.ts: exclusive durable claim BEFORE exchange; never retry a claimed signature.
      let claimed = false;
      try {
        await this.store.claim(`relay-${active.txHash}.json`, { expected: active.expected, request, raw, outcome: 'claimed-not-yet-submitted' });
        claimed = true;
      } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e; }
      active.phase = 'relay-claimed'; this.urgentUntil = 0; await this.store.write(this.activeName, active);
      assertFreshContractProof(parsed.input, this.rt.now());
      if (this.stopped()) { c.decision = 'stopped-before-relay'; return false; }
      if (claimed) try {
        const response = await this.rt.fetch(`${TESTNET_API}/exchange`, { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(request), signal: AbortSignal.timeout(15_000) });
        active.httpStatus = response.status; active.exchangeResponse = await response.json();
        c.hyperliquidResponses.exchange = active.exchangeResponse;
        if (!response.ok) c.errors.push(`Hyperliquid exchange HTTP ${response.status}; signature will not be retried`);
      } catch { c.errors.push('Hyperliquid exchange outcome unknown; signature will not be retried'); }
      active.phase = 'verify'; await this.store.write(this.activeName, active);
      if (claimed) await this.store.write(`relay-${active.txHash}.json`, { request, raw, ...active, outcome: 'submitted-awaiting-public-fill' });
    }
    // Reconciliation is public reads only, including after restart or a lost HTTP response.
    const [clearing, orders, fillsRaw] = await Promise.all([
      this.client.info({ type: 'clearinghouseState', user: active.address }), this.client.info({ type: 'openOrders', user: active.address }),
      this.client.info({ type: 'userFills', user: active.address }),
    ]);
    c.hyperliquidResponses.reconciliation = { clearinghouseState: clearing, openOrders: orders, userFills: fillsRaw, exchange: active.exchangeResponse ?? null };
    if (z.array(z.unknown()).parse(orders).length) { c.decision = 'awaiting-order-reconciliation'; return false; }
    let response = active.exchangeResponse;
    if (response === undefined) {
      const expiresAfter = parsed.input.expiresAfter!;
      const fills = parseFills(fillsRaw).filter(f => f.coin === 'NEAR' && f.side === (active.expected.reduceOnly ? 'B' : 'A') &&
        f.time >= parsed.nonce && f.time <= expiresAfter);
      if (!fills.length || new Set(fills.map(f => f.oid)).size !== 1) { c.decision = 'blocked-uncertain-exchange'; return false; }
      response = { status: 'ok', response: { type: 'order', data: { statuses: [{ filled: {
        oid: fills[0]!.oid, totalSz: decimal(fills.reduce((sum, f) => sum + units(f.sz, 24), 0n), 24), avgPx: fills[0]!.px,
      } }] } } };
    }
    const verification = verifyFill(response, fillsRaw, parseAccount(active.before), parseAccount(clearing), active.expected.size, active.expected.reduceOnly, parsed.nonce);
    c.verification = verification;
    c.hyperliquidTxHashes = verification.fills.map(f => f.hash);
    await this.store.write(`verified-${active.txHash}.json`, { ...active, verification, verifiedAt: this.rt.now() });
    await this.store.remove(this.activeName); this.urgentUntil = 0;
    if (active.expected.reduceOnly) c.reductions++; else c.opens++;
    c.decision = active.expected.reduceOnly ? 'reduction-verified' : 'open-verified'; return true;
  }
  async cycle(): Promise<Cycle> {
    const c: Cycle = { timestamp: new Date(this.rt.now()).toISOString(), finishedAt: '', mark: null, funding: null, position: null,
      equity: null, H: null, thresholdUsd: null, decision: 'monitor', txHashes: [], hyperliquidResponses: {}, commands: [],
      heartbeats: 0, reductions: 0, opens: 0, errors: [], dry: this.options.dry };
    try {
      let snapshot = await this.client.policy(this.options.policy, undefined, async state => {
        this.heartbeatTimeoutMs = state.heartbeat_timeout_seconds * 1000;
        if (heartbeatDue(state, this.rt.now()) && !this.stopped()) {
          try { await this.command(c, 'heartbeat', {}); } catch (e) { c.errors.push(safeFailure(e)); }
        }
      });
      c.policyState = snapshot;
      const address = await this.address(snapshot.state); c.derivedAddress = address;
      const o = await this.client.observe(address);
      c.mark = o.mark; c.funding = o.funding; c.position = o.account.signedSize; c.equity = o.account.equity;
      c.hyperliquidResponses = { ...c.hyperliquidResponses, ...o.responses };
      const settings = riskSettings(snapshot.state, snapshot.rebalance), risk = assess(snapshot.state, o, settings, this.rt.now());
      c.H = risk.metrics.headroom; c.thresholdUsd = risk.thresholdUsd; c.risk = risk; c.riskSettings = settings;
      const active = await this.store.read<ActiveOrder>(this.activeName);
      this.urgentUntil = active?.phase === 'near-uncertain' && active.txHash ? active.createdAt + 60000 : 0;
      if (active && !this.options.dry) { await this.verifyActive(active, c); return c; }
      if (active) { c.decision = 'dry-existing-order-blocked'; return c; }
      if (this.stopped()) { c.decision = 'stopping'; return c; }
      if (!snapshot.keyless) { c.decision = 'blocked-policy-access-keys'; return c; }
      if (priceNeeded(snapshot.state, o.mark, o.observedAt, this.rt.now())) {
        await this.command(c, 'set_keeper_price', { price: String(Math.round(o.mark * 1e6)), observed_at: String(Math.floor(o.observedAt / 1000)) });
        if (this.options.dry) snapshot = { ...snapshot, state: { ...snapshot.state, reference_price: String(Math.round(o.mark * 1e6)), reference_price_timestamp: String(Math.floor(o.observedAt / 1000)) } };
        else {
          snapshot = await this.client.policy(this.options.policy);
          c.policyAfterPrice = snapshot;
          if (!snapshot.keyless) { c.decision = 'blocked-policy-access-keys'; return c; }
        }
      }
      const latestSettings = riskSettings(snapshot.state, snapshot.rebalance);
      const latestRisk = assess(snapshot.state, o, latestSettings, this.rt.now());
      c.H = latestRisk.metrics.headroom; c.thresholdUsd = latestRisk.thresholdUsd; c.risk = latestRisk; c.riskSettings = latestSettings;
      const expected = planOrder(this.options.policy, snapshot.state, o, latestSettings, this.rt.now(), this.options.allowOpen);
      if (!expected) return c;
      c.decision = `${this.options.dry ? 'would-' : ''}${expected.reduceOnly ? 'reduce-only-close' : 'open-within-caps'}`;
      const args = commandArgs(this.options.policy, 'request_order_signature', expected.args);
      c.commands.push(printable(args)); this.rt.print(`${this.options.dry ? 'WOULD SEND' : 'SEND'} ${printable(args)}`);
      if (this.options.dry || this.stopped()) return c;
      const pending: ActiveOrder = { phase: 'near-uncertain', expected, address, codeHash: snapshot.codeHash, before: o.clearinghouseState, createdAt: this.rt.now() };
      // Claim before invoking near-cli-rs. Even a crash before receiving its hash blocks new signatures.
      await this.store.claim(this.activeName, pending);
      if (this.stopped()) { c.decision = 'stopped-before-signature'; return c; }
      pending.txHash = await sendNear(this.rt, args); c.txHashes.push(pending.txHash); this.urgentUntil = pending.createdAt + 60000;
      await this.store.write(this.activeName, pending);
      await this.verifyActive(pending, c);
    } catch (e) { c.errors.push(safeFailure(e)); c.decision = 'error-await-next-cycle'; }
    finally { c.finishedAt = new Date(this.rt.now()).toISOString(); }
    return c;
  }
  heartbeatTimeoutMs = 3_600_000;
  urgentUntil = 0;
}
export async function runKeeper(options: RunOptions, dependencies: { rt?: Runtime; store?: DiskStore; signal?: AbortSignal; runId?: string } = {}) {
  const rt = dependencies.rt ?? runtime(), store = dependencies.store ?? new DiskStore('reports/keeper-run');
  const runId = dependencies.runId ?? `${new Date(rt.now()).toISOString().replaceAll(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  await store.init();
  const lock = `${options.policy}${options.dry ? '.dry' : ''}.lock.json`;
  await store.claim(lock, { pid: process.pid, runId, startedAt: new Date(rt.now()).toISOString(), dry: options.dry });
  let summary = newSummary(rt.now());
  const deadline = summary.startedAt + options.hours * 3_600_000;
  const keeper = new Keeper(options, store, rt, () => (dependencies.signal?.aborted ?? false) || rt.now() >= deadline);
  let interval = options.intervalMs;
  rt.print(`Keeper ${runId} | ${options.policy} | ${options.dry ? 'DRY' : 'LIVE'} | reports: ${store.path(`${runId}.jsonl`)}`);
  try {
    await store.replace(`${runId}.md`, summaryMarkdown(summary, options, runId, false));
    while (!dependencies.signal?.aborted && rt.now() < deadline && (options.cycles === undefined || summary.cycles < options.cycles)) {
      const c = await keeper.cycle();
      await store.append(`${runId}.jsonl`, c);
      summary = addCycle(summary, c, interval);
      await store.replace(`${runId}.md`, summaryMarkdown(summary, options, runId, false));
      rt.print(`${c.timestamp} ${c.decision} H=${c.H ?? 'unavailable'} errors=${c.errors.length}`);
      if (dependencies.signal?.aborted || rt.now() >= deadline || (options.cycles !== undefined && summary.cycles >= options.cycles)) break;
      interval = Math.min(options.intervalMs, keeper.heartbeatTimeoutMs / 6, keeper.urgentUntil > rt.now() ? 5000 : Infinity);
      // Schedule from cycle start; long RPC/MPC work is included in gap accounting.
      const next = Date.parse(c.timestamp) + interval * (0.9 + rt.random() * 0.2);
      const until = Math.min(deadline, next);
      while (!dependencies.signal?.aborted && rt.now() < until) await rt.sleep(Math.min(1000, until - rt.now()));
    }
  } finally {
    summary.finishedAt = rt.now();
    try { await store.replace(`${runId}.md`, summaryMarkdown(summary, options, runId, true)); }
    finally { await store.remove(lock); }
  }
  rt.print(`Keeper stopped | cycles=${summary.cycles} heartbeats=${summary.heartbeats} reductions=${summary.reductions} errors=${summary.errors} gaps=${summary.gaps} | ${store.path(`${runId}.md`)}`);
  return { runId, summary };
}
