import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { base58 } from '@scure/base';
import { getSigningDigest } from '../packages/hyperliquid/src/index.js';
import { initialization } from './testnet-plan.js';
import { committedWasm, KEEPER, OWNER, POLICY, PROBE_ADDRESS } from './testnet-common.js';
import { proveContract, REHEARSAL_NOTICE } from './prove-contract.js';

const memory = vi.hoisted(() => ({ files: new Map<string, string>() }));
vi.mock('node:fs/promises', async original => ({
  ...await original<typeof import('node:fs/promises')>(),
  mkdir: vi.fn(),
  writeFile: vi.fn(async (path: string, data: string, options?: { flag?: string }) => {
    if (options?.flag === 'wx' && memory.files.has(path)) throw new Error('EEXIST');
    memory.files.set(path, data);
  }),
}));
vi.mock('../packages/hyperliquid/src/index.js', async original => ({
  ...await original<typeof import('../packages/hyperliquid/src/index.js')>(),
  deriveTestnetAddress: vi.fn(async () => ({ address: '0x1111111111111111111111111111111111111111' })),
  recoveredSigner: vi.fn(async () => '0x1111111111111111111111111111111111111111'),
  testnetMeta: vi.fn(async () => ({ universe: [{ name: 'NEAR', szDecimals: 1 }] })),
}));
const signature = JSON.parse(readFileSync(new URL('../fixtures/nearblocks-mpc-response.json', import.meta.url), 'utf8')).signatureResponse;
const hash = base58.encode(new Uint8Array(32).fill(9));
const json = (value: unknown) => new Response(JSON.stringify(value));
function setup(fullAccess: boolean, receiptFullAccess = fullAccess, expiryOffset = 60000) {
  const nonce = Date.now();
  const payload = { action: { type: 'cancel' as const, cancels: [{ a: 0, o: 0 }] }, nonce, expiresAfter: nonce + expiryOffset };
  const event = (name: string, data: unknown) => ({ id: name, block_hash: name, outcome: { executor_id: POLICY,
    status: { SuccessValue: 'dHJ1ZQ==' }, logs: ['EVENT_JSON:' + JSON.stringify({ standard: 'counterweight', version: '1.0.0', event: name, data: [data] })] } });
  const transaction = { final_execution_status: 'FINAL', status: { SuccessValue: 'dHJ1ZQ==' },
    transaction: { hash, signer_id: KEEPER, receiver_id: POLICY, actions: [{ FunctionCall: { method_name: 'request_cancel_signature', args: Buffer.from('{"order_id":"0"}').toString('base64') } }] },
    receipts_outcome: [event('request', { id: '1', caller: KEEPER, kind: 'Cancel', payload,
      digest: getSigningDigest({ scheme: 'l1', network: 'testnet', ...payload }).slice(2) }),
    event('signature', { id: '1', nonce: String(nonce), expiresAfter: String(payload.expiresAfter), signature })] };
  const fetcher = vi.fn<typeof fetch>(async (url, init) => {
    if (String(url).endsWith('/exchange')) return json({ status: 'ok', response: { type: 'cancel', data: { statuses: [{ error: 'Order was never placed, already canceled, or filled.' }] } } });
    const { method, params } = JSON.parse(String(init?.body));
    const block = params.block_id;
    if (method === 'tx') return json({ result: transaction });
    if (params.request_type === 'view_access_key_list') return json({ result: { block_hash: block ?? 'latest',
      keys: (block ? receiptFullAccess : fullAccess) ? [{ public_key: 'public-only', access_key: { permission: 'FullAccess' } }] : [] } });
    if (params.request_type === 'view_account') return json({ result: { block_hash: block, code_hash: (await committedWasm()).codeHash } });
    if (params.request_type === 'call_function') return json({ result: { block_hash: block, result: [...Buffer.from(JSON.stringify({
      ...initialization(0, 1, PROBE_ADDRESS), coin: 'NEAR', near_recipient: OWNER, spot_balance: '0', signed_short_size: '0', paused: false,
      pending: null, mpc_fee: '1', signer_gas_tgas: 230, callback_gas_tgas: 30, keeper_weight_limit: '5000',
    }))] } });
    throw new Error('Unexpected request');
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}
beforeEach(() => { memory.files.clear(); vi.spyOn(console, 'log').mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('contract relay mode and evidence', () => {
  it('labels both evidence formats and console as rehearsal and records actual keys', async () => {
    const fetcher = setup(true);
    await proveContract(['--rehearsal', `--tx=${hash}`]);
    const [record] = [...memory.files].filter(([path]) => path.endsWith('.json')).map(([, data]) => JSON.parse(data));
    expect(record).toMatchObject({ rehearsal: true, notice: REHEARSAL_NOTICE, kind: 'policy-contract-mpc-rehearsal', verdict: 'authenticated-cancel-response' });
    expect(record.checks.every((c: any) => c.accessKeys[0].access_key.permission === 'FullAccess')).toBe(true);
    expect([...memory.files].find(([path]) => path.endsWith('.md'))?.[1]).toContain(REHEARSAL_NOTICE);
    expect(console.log).toHaveBeenCalledWith(REHEARSAL_NOTICE);
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
    await expect(proveContract(['--rehearsal', `--tx=${hash}`])).rejects.toThrow('EEXIST');
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/exchange'))).toHaveLength(1);
  });
  it.each([[true, true, false], [false, true, true], [true, false, true]])('rejects incompatible latest/receipt key state before relay (%s/%s, rehearsal %s)', async (latest, receipts, rehearsal) => {
    const fetcher = setup(latest, receipts);
    await expect(proveContract([`--tx=${hash}`, ...(rehearsal ? ['--rehearsal'] : [])])).rejects.toThrow(/Policy/);
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/exchange'))).toBe(false);
    expect(memory.files.size).toBe(0);
  });
  it('accepts final mode only with zero keys and never bypasses the expiry guard', async () => {
    setup(false);
    await proveContract([`--tx=${hash}`]);
    const record = JSON.parse([...memory.files].find(([path]) => path.endsWith('.json'))![1]);
    expect(record).toMatchObject({ rehearsal: false, notice: 'FINAL KEYLESS PROOF' });
    memory.files.clear();
    const fetcher = setup(true, true, 2000);
    await expect(proveContract(['--rehearsal', `--tx=${hash}`])).rejects.toThrow('expired');
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith('/exchange'))).toBe(false);
  });
});
