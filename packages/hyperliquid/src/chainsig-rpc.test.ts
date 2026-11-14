import { afterEach, describe, expect, it, vi } from 'vitest';
import { chainSignatureView, MAINNET_RPC, TESTNET_RPC } from './chainsig.js';
const view = (value = 'public-root', block = 'exact-block') => new Response(JSON.stringify({ result: { result: [...Buffer.from(JSON.stringify(value))], block_height: 123, block_hash: block } }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });
describe('mainnet Chain Signatures public RPC failover', () => {
  it('fails over transient transport/HTTP errors without changing the pinned query', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(view());
    vi.stubGlobal('fetch', fetcher);
    const pending = chainSignatureView('mainnet', 'derived_public_key', { predecessor: 'cw5.haxheton.near', path: 'counterweight-mainnet-v5' }, 'exact-block');
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toEqual({ value: 'public-root', blockHeight: 123, blockHash: 'exact-block' });
    expect(fetcher.mock.calls.map(call => call[0])).toEqual([MAINNET_RPC, 'https://rpc.mainnet.near.org', MAINNET_RPC]);
    const bodies = fetcher.mock.calls.map(call => String(call[1]?.body));
    expect(new Set(bodies).size).toBe(1);
    expect(JSON.parse(bodies[0]!).params).toMatchObject({ account_id: 'v1.signer', method_name: 'derived_public_key', block_id: 'exact-block' });
    expect(JSON.parse(bodies[0]!).method).toBe('query');
  });
  it('uses an explicit mainnet endpoint then falls back after a transient RPC error', async () => {
    vi.useFakeTimers(); vi.stubEnv('NEAR_MAINNET_RPC', 'https://owner-rpc.example');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: -32603, message: 'Internal error' } }))).mockResolvedValueOnce(view());
    vi.stubGlobal('fetch', fetcher);
    const pending = chainSignatureView('mainnet', 'public_key', { domain_id: 0 });
    await vi.runAllTimersAsync(); await expect(pending).resolves.toMatchObject({ blockHash: 'exact-block' });
    expect(fetcher.mock.calls.map(call => call[0])).toEqual(['https://owner-rpc.example', 'https://rpc.mainnet.fastnear.com']);
  });
  it('bounds retries to four public reads even when all endpoints remain unavailable', async () => {
    vi.useFakeTimers(); const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 429 })); vi.stubGlobal('fetch', fetcher);
    const pending = expect(chainSignatureView('mainnet', 'public_key', {})).rejects.toThrow('HTTP 429');
    await vi.runAllTimersAsync(); await pending; expect(fetcher).toHaveBeenCalledTimes(4);
  });
  it.each(['http', 'shape', 'contract', 'block'])('does not retry permanent %s errors or invalid views', async kind => {
    const response = kind === 'http' ? new Response('', { status: 400 }) : kind === 'shape' ? new Response('{}') : kind === 'contract'
      ? new Response(JSON.stringify({ error: { cause: { name: 'CONTRACT_EXECUTION_ERROR' }, message: 'FunctionCallError' } })) : view('root', 'wrong-block');
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response); vi.stubGlobal('fetch', fetcher);
    await expect(chainSignatureView('mainnet', 'public_key', {}, 'exact-block')).rejects.toThrow(); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('keeps testnet single-attempt behavior unchanged', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 })); vi.stubGlobal('fetch', fetcher);
    await expect(chainSignatureView('testnet', 'public_key', {})).rejects.toThrow('HTTP 503'); expect(fetcher).toHaveBeenCalledTimes(1); expect(fetcher.mock.calls[0]![0]).toBe(TESTNET_RPC);
  });
});
