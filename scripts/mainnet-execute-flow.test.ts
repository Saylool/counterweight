import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  files: new Map<string, string>(), calls: [] as string[], sent: [] as string[], failStatus: false,
  consumed: new Set<number>(), outstanding: [] as unknown[],
  run: vi.fn(),
}));
vi.mock('node:child_process', () => ({ execFile: Object.assign(vi.fn(), {
  [Symbol.for('nodejs.util.promisify.custom')]: mock.run,
}) }));
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => {}),
  readFile: vi.fn(async (file: string) => {
    const value = mock.files.get(file);
    if (value === undefined) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    return value;
  }),
  writeFile: vi.fn(async (file: string, value: string, options?: { flag?: string }) => {
    if (options?.flag === 'wx' && mock.files.has(file)) throw new Error('EEXIST');
    mock.files.set(file, value);
  }),
  unlink: vi.fn(async (file: string) => { if (!mock.files.delete(file)) throw new Error('ENOENT'); }),
}));
vi.mock('./mainnet-budget.js', () => ({ checkOwnerSpend: vi.fn(async () => {}) }));
vi.mock('./mainnet-lifecycle.js', () => ({
  MAINNET_PLAN: '/private/tmp/execute-mocked-plan.json',
  mainnetSigningGasTgas: () => 285,
  loadMainnetPlan: vi.fn(async () => ({ owner: 'owner.near', keeper: 'keeper.owner.near', derived: { address: '0x' + 'ab'.repeat(20) } })),
  checkPolicy: vi.fn(async () => ({ state: { pending: null, signed_short_size: '0', last_open_expiry: '0' },
    margin: { withdrawal: null }, fullState: { outstanding: mock.outstanding } })),
  readConsumedClassTransfers: vi.fn(async () => mock.consumed),
  mainnetInfo: (client: { info: (body: unknown) => Promise<unknown> }, body: unknown) => client.info(body),
  mainnetLifecycle: vi.fn(async (argv: string[]) => {
    const step = argv.find(s => s.startsWith('--step='))!.slice(7);
    mock.calls.push(step);
    if (step === 'status' && mock.failStatus) throw new Error('Ledger verification pending');
    const file = argv.find(s => s.startsWith('--commands-file='))?.slice(16);
    if (!file) return;
    const command = step === 'withdraw-prepare' ? 'near contract call-function as-transaction policy.owner.near set_reference_price json-args x' :
      step === 'withdraw' ? '# REQUEST_FILE: /private/tmp/withdraw.request.json\nnear contract call-function as-transaction policy.owner.near observe_margin json-args x\nnear contract call-function as-transaction policy.owner.near request_evm_withdrawal json-args x' :
      step === 'relay' ? 'curl mocked-once-only-exchange' : '';
    mock.files.set(file, command + '\n');
  }),
}));
vi.mock('../apps/keeper/src/run-io.js', async original => ({
  ...await original<typeof import('../apps/keeper/src/run-io.js')>(),
  PublicClient: class {
    async info(body: { type: string }) {
      if (body.type === 'openOrders') return [];
      return { marginSummary: { accountValue: '19', totalMarginUsed: '0' }, withdrawable: '19', assetPositions: [] };
    }
  },
}));

import { executeMainnet, liveResumeAuthorizations } from './mainnet-execute.js';
const plan = '/private/tmp/execute-mocked-plan.json', active = `${plan}.active-execution.json`;
const flags = ['--network=mainnet', '--i-understand-real-funds', `--plan=${plan}`];
const hash = 'C'.repeat(44);
beforeEach(() => {
  mock.files.clear(); mock.calls.length = 0; mock.sent.length = 0; mock.failStatus = false;
  mock.consumed.clear(); mock.outstanding = [];
  mock.run.mockReset().mockImplementation(async (_bin: string, args: string[]) => {
    const command = args[1]!; mock.sent.push(command);
    if (command.includes('request_evm_withdrawal')) {
      // Signing request is recoverable even if the process dies after this send.
      expect(JSON.parse(mock.files.get(active)!).request).toBe('/private/tmp/withdraw.request.json');
    }
    return { stdout: `Transaction ID: ${hash}`, stderr: '' };
  });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('withdrawal journal recovery after public ledger lag', () => {
  it('retains exact signature evidence and resumes public verification without another send', async () => {
    mock.failStatus = true;
    await expect(executeMainnet([...flags, '--step=withdraw'])).rejects.toThrow('Ledger');
    const journal = JSON.parse(mock.files.get(active)!);
    expect(journal).toMatchObject({ step: 'withdraw', hash, request: '/private/tmp/withdraw.request.json' });
    expect(mock.sent.filter(s => s.startsWith('curl '))).toHaveLength(1);
    const sends = mock.sent.length;
    mock.failStatus = false;
    await executeMainnet([...flags, '--step=withdraw', '--resume']);
    expect(mock.sent).toHaveLength(sends);
    expect(mock.files.has(active)).toBe(false);
    expect(mock.calls.at(-1)).toBe('status');
  });
  it('keeps a signature hash printed by a failed CLI, before any relay', async () => {
    mock.run.mockImplementation(async (_bin: string, args: string[]) => {
      mock.sent.push(args[1]!);
      if (args[1]!.includes('request_evm_withdrawal')) throw Object.assign(new Error('CLI timed out'), { stdout: `Transaction ID: ${hash}` });
      return { stdout: 'preparation finalized', stderr: '' };
    });
    await expect(executeMainnet([...flags, '--step=withdraw'])).rejects.toThrow('timed out');
    expect(JSON.parse(mock.files.get(active)!)).toMatchObject({ hash, request: '/private/tmp/withdraw.request.json' });
    expect(mock.sent.some(s => s.startsWith('curl '))).toBe(false);
  });
});

describe('settled flat recovery with a consumed class transfer', () => {
  const auth = (nonce: number, extra = {}) => ({ nonce, expires_after: Date.now() + 172_800_000, keeper: false,
    withdrawal: false, invalidation_confirmed: false, ...extra });
  it('ignores only proved consumed class transfers, expired auths and confirmed invalidations', () => {
    const now = Date.now();
    expect(liveResumeAuthorizations([auth(1), auth(2, { expires_after: now - 1 }), auth(3, { invalidation_confirmed: true })], new Set([1]), now)).toEqual([]);
    expect(liveResumeAuthorizations([auth(1), auth(4, { keeper: true }), auth(5, { withdrawal: true })], new Set([1, 4, 5]), now).map(a => a.nonce)).toEqual([4, 5]);
  });
  it('clears failed open after settlement despite a proved consumed 48-hour class transfer', async () => {
    mock.files.set(active, JSON.stringify({ step: 'open' }));
    mock.outstanding = [auth(7)]; mock.consumed.add(7);
    await executeMainnet([...flags, '--step=open', '--resume']);
    expect(mock.files.has(active)).toBe(false); expect(mock.sent).toEqual([]);
  });
  it('keeps the recovery journal for an unproved user authorization', async () => {
    mock.files.set(active, JSON.stringify({ step: 'open' })); mock.outstanding = [auth(8)];
    await expect(executeMainnet([...flags, '--step=open', '--resume'])).rejects.toThrow('unconsumed live');
    expect(mock.files.has(active)).toBe(true); expect(mock.sent).toEqual([]);
  });
});
