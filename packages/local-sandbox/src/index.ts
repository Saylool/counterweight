import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, type NearAccount, type TransactionResult } from 'near-workspaces';

export const POLICY_SHA256 = '698195e3c6b785274055a3cc607251b9598e2fa166c1e20c4d99c28a8822d289';
export const MOCK_SHA256 = '971c4b82a7b2b3a5c34e8693dcf21f448b1457fb4e80a5f64e161f9508c51886';
export const BASE = 10n ** 24n;
export const GAS = 300n * 10n ** 12n;
const root = fileURLToPath(new URL('../../../', import.meta.url));
export function verifyHash(bytes: Uint8Array, expected: string, label: string) {
  const actual = createHash('sha256').update(bytes).digest('hex');
  assert.equal(actual, expected, `${label} SHA-256 mismatch`);
  return actual;
}
export interface PolicyState {
  last_nonce: string; operation_id: string; spot_balance: string; signed_short_size: string;
  reference_price_timestamp: string; last_keeper_heartbeat: string; paused: boolean;
}
export interface OwnerSnapshot { balanceYocto: string; accessKeys: { publicKey: string; nonce: number }[] }
export interface ChainEvidence {
  actor: string; method: string; args: Record<string, unknown>; transactionHash: string;
  succeeded: boolean; logs: string[]; errors: string[];
}
export interface ContractEvent { event: string; data: Record<string, any>[] }
type PublicAccessKey = { public_key: string; access_key: { nonce: number } };
type RuntimeProvider = { connection: { url: string }; block(query: { finality: string }): Promise<{ header: { timestamp_nanosec: string } }> };
export function contractEvents(result: TransactionResult): ContractEvent[] {
  return result.logs.filter(l => l.startsWith('EVENT_JSON:')).map(l => JSON.parse(l.slice(11)) as ContractEvent);
}
export function assertSigned(result: TransactionResult, reduceOnly: boolean) {
  assert(result.succeeded, 'Contract transaction failed');
  assert.equal(result.parseResult(), true, 'Mock signer callback must succeed');
  const events = contractEvents(result);
  const request = events.find(e => e.event === 'request')?.data[0];
  assert(request, 'Missing contract request event');
  assert.equal(request.payload.action.orders[0].r, reduceOnly, 'Contract must build the reduce-only flag');
  assert(events.some(e => e.event === 'signature'), 'Missing successful mock signature event');
  return request;
}

/** Only this module handles disposable sandbox accounts; it never accesses wallet stores. */
export class LocalSandbox {
  readonly evidence: ChainEvidence[] = [];
  private constructor(readonly worker: Worker, readonly owner: NearAccount, readonly keeper: NearAccount,
    readonly rogue: NearAccount, readonly stranger: NearAccount, readonly policy: NearAccount,
    readonly mock: NearAccount, readonly directory: string) {}

  static async start(priceMicro: string, quantity: string, assetIndex: number, sizeDecimals: number) {
    const policyBytes = await readFile(join(root, 'contracts/policy/artifacts/counterweight_policy.wasm'));
    verifyHash(policyBytes, POLICY_SHA256, 'Committed policy');
    const sums = await readFile(join(root, 'contracts/policy/artifacts/SHA256SUMS'), 'utf8');
    assert(sums.split('\n').includes(`${POLICY_SHA256}  artifacts/counterweight_policy.wasm`), 'Published policy digest changed');
    // Text encoding keeps this fixture distributable under the repository's *.wasm ignore rule.
    const mockBytes = Buffer.from(await readFile(join(root, 'packages/local-sandbox/artifacts/mock-mpc.wasm.base64'), 'utf8'), 'base64');
    verifyHash(mockBytes, MOCK_SHA256, 'Labelled mock MPC');
    const binaryDirectory = join(root, 'node_modules/.cache/counterweight-sandbox');
    const binary = join(binaryDirectory, 'near-sandbox');
    try { await access(binary); } catch { throw new Error('Sandbox binary missing. Run npm ci (or npm run demo:install) while online.'); }
    assert(execFileSync(binary, ['--version'], { encoding: 'utf8' }).includes('release 2.14.0)'), 'Install sandbox 2.14.0 with npm run demo:install');
    // Override all binary/network selection. getBinary finds an existing binary; no runtime download.
    process.env.NEAR_SANDBOX_BIN_PATH = binary;
    process.env.NEAR_SANDBOX_BINARY_PATH = binaryDirectory;
    delete process.env.NEAR_WORKSPACES_DEBUG;
    delete process.env.NEAR_WORKSPACES_TXDEBUG;
    const directory = await mkdtemp(join(tmpdir(), 'counterweight-local-'));
    let worker: Worker | undefined;
    try {
      worker = await Worker.init({ network: 'sandbox', homeDir: join(directory, 'chain'), rm: false });
      assert((worker.provider as unknown as RuntimeProvider).connection.url.startsWith('http://127.0.0.1:'), 'Only loopback RPC is allowed');
      // Local genesis setup only: create a registrar ending in .testnet so the
      // committed default Wasm runs without enabling test-utils or patching policy state.
      const registrar = worker.rootAccount.getAccount('testnet');
      await registrar.updateAccount({ amount: (2000n * BASE).toString() });
      const publicKey = await registrar.setKey(); // near-workspaces generates/manages this local key.
      await registrar.updateAccessKey(publicKey);
      const owner = await registrar.createSubAccount('owner');
      const keeper = await registrar.createSubAccount('keeper');
      const rogue = await registrar.createSubAccount('rogue');
      const stranger = await registrar.createSubAccount('bystander');
      const policy = await registrar.createSubAccount('policy');
      const mock = await registrar.createSubAccount('mock-mpc');
      const local = new LocalSandbox(worker, owner, keeper, rogue, stranger, policy, mock, directory);
      assert((await policy.deploy(policyBytes)).succeeded);
      assert((await mock.deploy(mockBytes)).succeeded);
      await local.mustCall(owner, 'new', {
        owner: owner.accountId, keeper: keeper.accountId, asset_index: assetIndex, size_decimals: sizeDecimals,
        derivation_path: 'counterweight-local-mock-only', evm_recipient: '0x1111111111111111111111111111111111111111',
        signer_account: mock.accountId, wnear_account: mock.accountId,
        limits: { max_short_size: quantity, per_order_notional_cap: '30000000', per_day_notional_cap: '30000000',
          cooldown_seconds: 60, price_band_bps: 100, price_max_age_seconds: 120 },
        heartbeat_timeout_seconds: 600, reference_price: priceMicro, signing_limits: null,
      });
      // Remove policy access keys before mock funding, using only public-key views.
      // Keeper local keys stay library-managed: signing requires attached MPC fees.
      const policyKey = (await policy.viewAccessKeys(policy.accountId)).keys[0]!.public_key;
      assert((await policy.batch(policy).deleteKey(policyKey).transact()).succeeded);
      assert.equal((await policy.viewAccessKeys(policy.accountId)).keys.length, 0, 'Policy must have no access keys before deposit');
      const deposit = await owner.callRaw(mock, 'deposit_to', {
        policy: policy.accountId, sender_id: owner.accountId, amount: quantity, msg: '',
      }, { gas: GAS });
      assert(deposit.succeeded, 'Mock deposit failed');
      local.record(owner, 'mock:deposit_to', { amount: quantity }, deposit);
      assert.equal((await local.state()).spot_balance, quantity);
      return local;
    } catch (error) {
      if (worker) await worker.tearDown();
      await rm(directory, { recursive: true, force: true, maxRetries: 30, retryDelay: 100 });
      throw error;
    }
  }
  state() { return this.policy.view<PolicyState>('get_state'); }
  async nowMs() { return Number((await (this.worker.provider as unknown as RuntimeProvider).block({ finality: 'final' })).header.timestamp_nanosec) / 1e6; }
  async advancePast(timestampMs: number) {
    for (let i = 0; i < 20; i++) {
      if (await this.nowMs() > timestampMs) return;
      await this.worker.provider.fastForward(1000);
    }
    throw new Error('Sandbox clock failed to reach deadline');
  }
  async ownerSnapshot(): Promise<OwnerSnapshot> {
    return { balanceYocto: (await this.owner.accountView()).amount,
      accessKeys: (await this.owner.viewAccessKeys(this.owner.accountId)).keys.map((k: PublicAccessKey) => ({ publicKey: k.public_key, nonce: k.access_key.nonce })) };
  }
  record(who: NearAccount, method: string, args: Record<string, unknown>, result: TransactionResult) {
    this.evidence.push({ actor: who.accountId, method, args, transactionHash: result.transactionReceipt.hash,
      succeeded: result.succeeded, logs: result.logs, errors: result.receiptFailureMessages });
  }
  async call(who: NearAccount, method: string, args: Record<string, unknown>) {
    const attachedDeposit = ['request_order_signature', 'request_evm_withdrawal', 'deleverage'].includes(method) ? 1n : 0n;
    const result = await who.callRaw(this.policy, method, args, { gas: GAS, attachedDeposit });
    this.record(who, method, args, result);
    return result;
  }
  async mustCall(who: NearAccount, method: string, args: Record<string, unknown>) {
    const result = await this.call(who, method, args);
    assert(result.succeeded, `${method}: ${result.receiptFailureMessages.join('; ')}`);
    return result;
  }
  async close() {
    try { await this.worker.tearDown(); }
    finally { await rm(this.directory, { recursive: true, force: true, maxRetries: 30, retryDelay: 100 }); }
  }
}
