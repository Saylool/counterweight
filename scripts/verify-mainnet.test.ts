import { readFileSync } from 'node:fs';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { base58 } from '@scure/base';
import {
  allowedRead, artifactPaths, codeHashToSha256, DEFAULT_SUMMARY, ENDPOINTS, events, normalizeTransaction,
  parseSummary, printTable, signingInput, units, verifyArtifact, verifyFill, verifyMainnet, verifySigningReceipt,
  verifyUsdcTransfer, verifyWithdrawal, type ArchivedReceipt,
} from './verify-mainnet.js';

const raw = JSON.parse(readFileSync(DEFAULT_SUMMARY, 'utf8')) as Record<string, any>;
const summary = parseSummary(raw);
const account = summary.policy.account;
const findRequest = (kind: string) => Object.values(summary.near_transaction_receipts).find(r => events(r, account, 'request')[0]?.event.data[0]?.kind === kind)!;
const requestOf = (kind: string) => events(findRequest(kind), account, 'request')[0]!.event.data[0]!;
const open = signingInput(requestOf('Increase'));
// There is an unused Increase signature; select the actual filled order using the step linkage.
const openId = summary.steps.find(s => s.step === 'Open short')!.near_tx!;
const filledOpenReceipt = summary.near_transaction_receipts[openId]!;
const filledOpen = signingInput(events(filledOpenReceipt, account, 'request')[0]!.event.data[0]!);
const close = signingInput(requestOf('Reduce'));
const withdraw = signingInput(requestOf('EvmWithdrawal'));
const fill = summary.public_api_reads.hl_fills.find(f => f.side === 'A')!;
const closeFill = summary.public_api_reads.hl_fills.find(f => f.side === 'B')!;
const orderFor = (buy: boolean) => ({ status: 'order', order: { status: 'filled', order: {
  coin: 'NEAR', oid: buy ? closeFill.oid : fill.oid, side: buy ? 'B' : 'A', limitPx: buy ? '3.3554' : '3.2885',
  origSz: '3.6', reduceOnly: buy, tif: 'Ioc', timestamp: buy ? closeFill.time : fill.time,
} } });
const arb = raw.public_api_reads.arb_receipt_curl.result;
const withdrawn = verifyWithdrawal(withdraw, summary.public_api_reads.hl_ledger, summary);
const mutate = <T>(value: T, edit: (copy: T) => void): T => { const copy = structuredClone(value); edit(copy); return copy; };

/** Build raw NEAR response fixtures from committed public evidence; never contact an endpoint. */
function rpcTransaction(id: string, archived: ArchivedReceipt) {
  return {
    final_execution_status: archived.final_execution_status, status: archived.status,
    transaction: { hash: id, signer_id: archived.signer, receiver_id: archived.receiver,
      actions: archived.actions.map(a => typeof a === 'object' && a.method ? { FunctionCall: {
        method_name: a.method, args: Buffer.from(JSON.stringify(a.args)).toString('base64'), deposit: a.deposit_yocto, gas: a.gas,
      } } : a) },
    transaction_outcome: { block_hash: archived.block_hash, outcome: { status: { SuccessReceiptId: archived.block_hash } } },
    receipts_outcome: archived.receipt_logs.map(r => ({ block_hash: archived.block_hash, outcome: { executor_id: r.executor, status: r.status, logs: r.logs } })),
  };
}

afterEach(() => vi.unstubAllGlobals());
describe('offline mainnet verification', () => {
  it('decodes the actual NEAR code hash to committed v4 SHA256 bytes', () => {
    expect(codeHashToSha256(summary.policy.code_hash)).toBe('278057b511924ee1e5769ebc46ac0aff5a17d036c41ce25b06c42c871bffbc91');
    expect(() => codeHashToSha256('1')).toThrow('32 bytes');
    expect(() => codeHashToSha256('0')).toThrow();
  });
  it('checks both local artifact bytes and their committed manifest', () => {
    const paths = artifactPaths(summary), bytes = readFileSync(paths.artifact), manifest = readFileSync(paths.manifest, 'utf8');
    expect(verifyArtifact(bytes, manifest, paths.artifact, summary.policy.code_hash)).toBe(codeHashToSha256(summary.policy.code_hash));
    expect(() => verifyArtifact(mutate(bytes, b => { b[0] = b[0]! ^ 1; }), manifest, paths.artifact, summary.policy.code_hash)).toThrow('manifest');
    expect(() => verifyArtifact(bytes, manifest, paths.artifact, base58.encode(new Uint8Array(32)))).toThrow('Deployed');
    expect(() => verifyArtifact(bytes, `${manifest}\n${manifest}`, paths.artifact, summary.policy.code_hash)).toThrow('manifest');
  });
  it('selects future artifacts from summary data and rejects path traversal', () => {
    const future = structuredClone(summary); future.policy.derivation_path = 'counterweight-mainnet-v5';
    expect(artifactPaths(future).artifact).toBe('contracts/policy/artifacts/counterweight_policy_v5.wasm');
    future.verification = { artifact: '/etc/passwd', manifest: '../../private' };
    expect(() => artifactPaths(future)).toThrow('safe committed');
  });
  it('uses exact decimal units and rejects rounded, negative, exponent, and malformed values', () => {
    expect(units('17.886709', 6)).toBe(17886709n);
    for (const text of ['17.8867091', '-1', '1e6', '01', 'NaN', '1.', '']) expect(() => units(text, 6)).toThrow();
    expect(units('3.600', 24)).toBe(3600000000000000000000000n);
  });
  it('rejects inconsistent summary identities/arithmetic and unsupported schemas', () => {
    expect(() => parseSummary(mutate(raw, s => { s.schema_version = 2; }))).toThrow();
    expect(() => parseSummary(mutate(raw, s => { s.public_derivation.address = `0x${'11'.repeat(20)}`; }))).toThrow('identity');
    expect(() => parseSummary(mutate(raw, s => { s.economics.arbitrum_arrival_usdc = '17.886708'; }))).toThrow('arithmetic');
    expect(() => parseSummary(mutate(raw, s => { delete s.near_transaction_receipts.ZGnrQPWDZkPuskhTwF9fJbqfSe8ctFFpDT2tsrQMPeW; delete s.near_transaction_receipts['7Yr92zzoTpncQ3bwpr3MCcczxNARvDxasmjg1zqxqdEj']; }))).toThrow('Missing archived');
    expect(() => parseSummary(mutate(raw, s => { s.near_transaction_receipts[openId].receipt_logs[0].logs[0] = 'EVENT_JSON:{'; }))).toThrow();
  });
  it('requires FINAL success and rejects a failed intermediate receipt even with a successful top status', () => {
    const tx = rpcTransaction(openId, filledOpenReceipt);
    expect(normalizeTransaction(tx, openId).actions).toEqual(filledOpenReceipt.actions);
    expect(() => normalizeTransaction(mutate(tx, x => { (x as { final_execution_status: string }).final_execution_status = 'EXECUTED'; }), openId)).toThrow();
    expect(() => normalizeTransaction(mutate(tx, x => { (x.receipts_outcome[1]!.outcome as { status: unknown }).status = { Failure: 'failed' }; }), openId)).toThrow();
    expect(() => normalizeTransaction(tx, 'different-hash')).toThrow();
    expect(() => normalizeTransaction(mutate(tx, x => { x.receipts_outcome = []; }), openId)).toThrow();
    expect(() => normalizeTransaction(mutate(tx, x => { (x.receipts_outcome[0]!.outcome as { status: unknown }).status = { SuccessValue: null, Failure: {} }; }), openId)).toThrow();
  });
  it('rebuilds and recovers every archived successful signing request, including signature-only stops', async () => {
    const signings = Object.values(summary.near_transaction_receipts).filter(r => events(r, account, 'request').length > 0);
    expect(signings).toHaveLength(6);
    for (const receipt of signings) await expect(verifySigningReceipt(receipt, receipt, summary)).resolves.toHaveProperty('digest');
  });
  it('fails for a tampered digest, failed callback, missing signature, identity, or wrong recovery address', async () => {
    const changeEvent = (receipt: ArchivedReceipt, name: string, update: (e: any) => void) => mutate(receipt, x => {
      for (const r of x.receipt_logs) r.logs = r.logs.map(l => {
        if (!l.startsWith('EVENT_JSON:')) return l;
        const e = JSON.parse(l.slice(11)); if (e.event === name) update(e); return `EVENT_JSON:${JSON.stringify(e)}`;
      });
    });
    const digest = changeEvent(filledOpenReceipt, 'request', e => { e.data[0].digest = '00'.repeat(32); });
    await expect(verifySigningReceipt(digest, digest, summary)).rejects.toThrow('digest');
    const callback = mutate(filledOpenReceipt, x => { x.receipt_logs.at(-1)!.status = { Failure: 'callback failed' }; });
    await expect(verifySigningReceipt(callback, filledOpenReceipt, summary)).rejects.toThrow('callback');
    const missing = mutate(filledOpenReceipt, x => { x.receipt_logs.pop(); });
    await expect(verifySigningReceipt(missing, filledOpenReceipt, summary)).rejects.toThrow('exactly one');
    const identity = mutate(filledOpenReceipt, x => { x.receiver = 'wrong.near'; });
    await expect(verifySigningReceipt(identity, filledOpenReceipt, summary)).rejects.toThrow('identity');
    const other = mutate(summary, x => { x.policy.derived_address = `0x${'11'.repeat(20)}`; });
    await expect(verifySigningReceipt(filledOpenReceipt, filledOpenReceipt, other)).rejects.toThrow('recover');
  });
  it('links exact fills to signed limits and venue order size/reduce-only while permitting favorable execution', () => {
    expect(verifyFill(filledOpen, fill, summary.public_api_reads.hl_fills, orderFor(false), 74, 'NEAR')).toContain('reduceOnly=false');
    expect(verifyFill(close, closeFill, summary.public_api_reads.hl_fills, orderFor(true), 74, 'NEAR')).toContain('reduceOnly=true');
    expect(() => verifyFill(open, fill, summary.public_api_reads.hl_fills, orderFor(false), 74, 'NEAR')).toThrow('time');
    const wrongOrder = orderFor(true); wrongOrder.order.order.reduceOnly = false;
    expect(() => verifyFill(close, closeFill, summary.public_api_reads.hl_fills, wrongOrder, 74, 'NEAR')).toThrow('reduce-only');
    const wrongPrice = structuredClone(summary.public_api_reads.hl_fills); wrongPrice.find(f => f.side === 'A')!.px = '3.3240';
    expect(() => verifyFill(filledOpen, fill, wrongPrice, orderFor(false), 74, 'NEAR')).toThrow('price');
    expect(() => verifyFill(filledOpen, fill, [], orderFor(false), 74, 'NEAR')).toThrow('exactly one');
    expect(() => verifyFill(filledOpen, fill, [...summary.public_api_reads.hl_fills, fill], orderFor(false), 74, 'NEAR')).toThrow('exactly one');
  });
  it('rejects adverse execution, wrong signed asset, venue size and missing RO proof', () => {
    const adverse = structuredClone(filledOpen); if (adverse.scheme === 'l1' && adverse.action.type === 'order') adverse.action.orders[0]!.p = '4';
    expect(() => verifyFill(adverse, fill, summary.public_api_reads.hl_fills, orderFor(false), 74, 'NEAR')).toThrow('violates');
    expect(() => verifyFill(filledOpen, fill, summary.public_api_reads.hl_fills, orderFor(false), 75, 'NEAR')).toThrow('asset');
    const bad = orderFor(false); bad.order.order.origSz = '3.5';
    expect(() => verifyFill(filledOpen, fill, summary.public_api_reads.hl_fills, bad, 74, 'NEAR')).toThrow('size');
    const missing: any = orderFor(false); delete missing.order.order.reduceOnly;
    expect(() => verifyFill(filledOpen, fill, summary.public_api_reads.hl_fills, missing, 74, 'NEAR')).toThrow();
  });
  it('checks withdraw3 recipient, exact microsecond nonce, fee, net and gross; never guesses by amount alone', () => {
    expect(withdrawn.amount).toBe(17886709n);
    for (const edit of [
      (l: any) => { l.delta.nonce++; }, (l: any) => { delete l.delta.nonce; },
      (l: any) => { l.delta.usdc = '17.886708'; }, (l: any) => { l.delta.fee = '0.9'; },
      (l: any) => { l.time = 0; },
    ]) {
      const ledger = structuredClone(summary.public_api_reads.hl_ledger); edit(ledger.find(l => l.delta.type === 'withdraw'));
      expect(() => verifyWithdrawal(withdraw, ledger, summary)).toThrow('mismatch');
    }
    const destination = structuredClone(withdraw); if (destination.scheme === 'user' && destination.action.type === 'withdraw3') destination.action.destination = `0x${'11'.repeat(20)}`;
    expect(() => verifyWithdrawal(destination, summary.public_api_reads.hl_ledger, summary)).toThrow('recipient');
    expect(() => verifyWithdrawal(withdraw, [], summary)).toThrow('missing');
  });
  it('requires native USDC, the exact full recipient topic/amount, chain, transaction, canonical metadata and no removed log', () => {
    const verify = (receipt: unknown = arb, chain: unknown = '0xa4b1') => verifyUsdcTransfer(receipt, chain, withdrawn.hash, withdrawn.recipient, withdrawn.amount);
    expect(verify()).toHaveProperty('status', '0x1');
    expect(() => verify(arb, '0x66eee')).toThrow('Arbitrum One');
    for (const edit of [
      (r: any) => { r.logs[0].address = `0x${'11'.repeat(20)}`; },
      (r: any) => { r.logs[0].topics[2] = `0x${'11'.repeat(32)}`; },
      (r: any) => { r.logs[0].data = `0x${'0'.repeat(63)}1`; },
      (r: any) => { r.logs[0].removed = true; },
      (r: any) => { r.logs[0].blockHash = `0x${'11'.repeat(32)}`; },
      (r: any) => { r.logs.push(r.logs[0]); },
    ]) expect(() => verify(mutate(arb, edit))).toThrow('Transfer');
    expect(() => verify(mutate(arb, (r: any) => { r.status = '0x0'; }))).toThrow();
    expect(() => verify(mutate(arb, (r: any) => { r.transactionHash = `0x${'11'.repeat(32)}`; }))).toThrow('transaction');
    expect(() => verify(null)).toThrow();
  });
  it('transport allowlist rejects every signing, broadcasting, and exchange request', () => {
    for (const method of ['broadcast_tx_commit', 'send_tx', 'eth_sendRawTransaction', 'sign']) {
      for (const endpoint of [...ENDPOINTS.near, ENDPOINTS.arbitrum]) expect(allowedRead(endpoint, { method })).toBe(false);
    }
    expect(allowedRead('https://api.hyperliquid.xyz/exchange', { type: 'order' })).toBe(false);
    expect(allowedRead(ENDPOINTS.hyperliquid, { type: 'order' })).toBe(false);
    expect(allowedRead(ENDPOINTS.hyperliquid, { type: 'orderStatus' })).toBe(true);
    expect(allowedRead(ENDPOINTS.near[0], { method: 'query' })).toBe(true);
  });
  it('prints a compact failure table and rejects CLI options before network access', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    expect(await verifyMainnet(['--key=forbidden'])).toEqual([{ check: 'summary', ok: false, detail: expect.stringContaining('Usage:') }]);
    expect(fetch).not.toHaveBeenCalled();
    expect(printTable([{ check: 'one', ok: false, detail: 'offline\nresponse' }])).toContain('one   | FAIL');
  });
});
