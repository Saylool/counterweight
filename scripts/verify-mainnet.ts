import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { base58 } from '@scure/base';
import { recoverAddress } from 'viem';
import { z } from 'zod';
import { deriveEvmAddress, nearPublicKeyToHex, mpcToHyperliquidSignature } from '../packages/hyperliquid/src/chainsig.js';
import { getSigningDigest, type SigningInput } from '../packages/hyperliquid/src/signing.js';

export const DEFAULT_SUMMARY = 'docs/evidence/2026-11-14-v4-mainnet-lifecycle-summary.json';
export const ENDPOINTS = {
  near: ['https://rpc.mainnet.fastnear.com', 'https://rpc.mainnet.near.org'],
  hyperliquid: 'https://api.hyperliquid.xyz/info',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
} as const;
export const NATIVE_USDC = '0xaf88d065e77c8cc2239327c5edb3a432268e5831';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const accountId = z.string().min(2).max(64).regex(/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/);
const address = z.string().regex(/^0x[0-9a-f]{40}$/);
const hash = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const nearHash = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
const uint = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const record = z.record(z.string(), z.unknown());
const success = z.object({ SuccessValue: z.string() }).strict();
const successfulOutcome = z.union([success, z.object({ SuccessReceiptId: nearHash }).strict()]);
const SIGNING_METHODS = new Set(['request_cancel_signature', 'request_order_signature', 'request_usd_class_transfer', 'request_evm_withdrawal', 'request_next_invalidation']);
const archivedReceiptSchema = z.object({ signer: accountId, receiver: accountId, actions: z.array(z.union([record, z.string()])).min(1),
  final_execution_status: z.literal('FINAL'), status: record, block_hash: nearHash,
  receipt_logs: z.array(z.object({ executor: accountId, status: record, logs: z.array(z.string()) })) });
export type ArchivedReceipt = z.infer<typeof archivedReceiptSchema>;
const fillSchema = z.object({ coin: z.string(), oid: uint, time: uint, hash, side: z.enum(['A', 'B']), sz: z.string(), px: z.string() }).passthrough();
const ledgerSchema = z.object({ time: uint, hash, delta: z.object({ type: z.string() }).passthrough() }).passthrough();
const summarySchema = z.object({ schema_version: z.literal(1), read_only: z.literal(true),
  policy: z.object({ account: accountId, owner: accountId, keeper: accountId, signer: z.literal('v1.signer'), derived_address: address,
    derivation_path: z.string().min(1), key_count: z.literal(0), code_hash: nearHash }),
  public_derivation: z.object({ address, publicKey: z.string(), rootPublicKey: z.string() }),
  steps: z.array(z.object({ step: z.string(), near_tx: nearHash.nullable(), venue_hash: hash.nullable() }).passthrough()).min(1),
  economics: z.object({ withdrawal_gross_usdc: z.string(), bridge_fee_usdc: z.string(), arbitrum_arrival_usdc: z.string() }).passthrough(),
  public_api_reads: z.object({ near_state: z.object({ decoded: z.object({ evm_recipient: address, asset_index: uint, coin: z.string(),
    signer_account: z.literal('v1.signer'), network: z.literal('Mainnet'), derivation_path: z.string() }).passthrough() }),
    hl_fills: z.array(fillSchema), hl_ledger: z.array(ledgerSchema) }).passthrough(),
  near_transaction_receipts: z.record(nearHash, archivedReceiptSchema),
  verification: z.object({ artifact: z.string(), manifest: z.string() }).optional(),
}).passthrough();
export type MainnetSummary = z.infer<typeof summarySchema>;
export function parseSummary(value: unknown): MainnetSummary {
  const s = summarySchema.parse(value);
  if (s.public_derivation.address !== s.policy.derived_address || s.public_api_reads.near_state.decoded.derivation_path !== s.policy.derivation_path)
    throw new Error('Summary derivation identity mismatch');
  if (units(s.economics.arbitrum_arrival_usdc, 6) + units(s.economics.bridge_fee_usdc, 6) !== units(s.economics.withdrawal_gross_usdc, 6))
    throw new Error('Summary withdrawal arithmetic mismatch');
  for (const step of s.steps) if (step.near_tx && !s.near_transaction_receipts[step.near_tx]) throw new Error(`Missing archived NEAR transaction for ${step.step}`);
  // Validate all policy event JSON before selection; malformed evidence cannot silently omit a signing.
  for (const receipt of Object.values(s.near_transaction_receipts)) events(receipt, s.policy.account, 'request');
  return s;
}
/** Exact integer arithmetic: never round token amounts or accept exponent notation. */
export function units(value: unknown, decimals: number): bigint {
  const text = z.string().regex(/^(0|[1-9]\d*)(\.\d+)?$/).parse(value);
  const [whole, fraction = ''] = text.split('.');
  if (fraction.length > decimals) throw new Error(`Amount exceeds ${decimals} decimal places`);
  return BigInt(whole!) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
}
export function codeHashToSha256(value: string): string {
  const bytes = base58.decode(value);
  if (bytes.length !== 32) throw new Error('NEAR code_hash must contain 32 bytes');
  return Buffer.from(bytes).toString('hex');
}
export function artifactPaths(summary: MainnetSummary) {
  const version = /-v(\d+)$/.exec(summary.policy.derivation_path)?.[1];
  const paths = summary.verification ?? (version ? {
    artifact: `contracts/policy/artifacts/counterweight_policy_v${version}.wasm`,
    manifest: `contracts/policy/artifacts/SHA256SUMS.v${version}`,
  } : undefined);
  if (!paths || !/^contracts\/policy\/artifacts\/counterweight_policy(?:_v\d+)?\.wasm$/.test(paths.artifact)
    || !/^contracts\/policy\/artifacts\/SHA256SUMS(?:\.v\d+)?$/.test(paths.manifest)) throw new Error('Summary needs safe committed WASM artifact/manifest paths');
  return paths;
}
export function verifyArtifact(bytes: Uint8Array, manifest: string, artifact: string, codeHash: string): string {
  const sha = createHash('sha256').update(bytes).digest('hex');
  const entry = `artifacts/${artifact.split('/').at(-1)}`;
  const matches = manifest.trim().split(/\r?\n/).filter(line => line === `${sha}  ${entry}`);
  if (matches.length !== 1) throw new Error('WASM bytes do not match the committed SHA256 manifest');
  if (codeHashToSha256(codeHash) !== sha) throw new Error('Deployed code_hash differs from committed WASM SHA256');
  return sha;
}

/** Keep RPC response validation separate from transport, so malformed/offline fixtures fail identically. */
export function normalizeTransaction(raw: unknown, expectedHash: string): ArchivedReceipt {
  const tx = z.object({ final_execution_status: z.literal('FINAL'), status: success,
    transaction: z.object({ hash: z.literal(expectedHash), signer_id: accountId, receiver_id: accountId, actions: z.array(record).min(1) }),
    transaction_outcome: z.object({ block_hash: nearHash, outcome: z.object({ status: successfulOutcome }) }),
    receipts_outcome: z.array(z.object({ block_hash: nearHash, outcome: z.object({ executor_id: accountId, status: successfulOutcome, logs: z.array(z.string()) }) })).min(1) }).parse(raw);
  return { signer: tx.transaction.signer_id, receiver: tx.transaction.receiver_id,
    actions: tx.transaction.actions.map(a => {
      if (!a.FunctionCall) return a;
      const f = z.object({ method_name: z.string(), args: z.string(), deposit: z.string(), gas: uint }).parse(a.FunctionCall);
      return { method: f.method_name, args: JSON.parse(Buffer.from(f.args, 'base64').toString('utf8')) as unknown, deposit_yocto: f.deposit, gas: f.gas };
    }), final_execution_status: tx.final_execution_status, status: tx.status,
    block_hash: tx.transaction_outcome.block_hash,
    receipt_logs: tx.receipts_outcome.filter(r => r.outcome.logs.length > 0).map(r => ({ executor: r.outcome.executor_id, status: r.outcome.status, logs: r.outcome.logs })) };
}
const eventSchema = z.object({ standard: z.literal('counterweight'), version: z.literal('1.0.0'), event: z.string(), data: z.array(record).length(1) });
export function events(receipt: ArchivedReceipt, policy: string, name: string) {
  return receipt.receipt_logs.filter(r => r.executor === policy).flatMap(r => r.logs.filter(l => l.startsWith('EVENT_JSON:'))
    .map(l => ({ receipt: r, event: eventSchema.parse(JSON.parse(l.slice(11))) }))).filter(e => e.event.event === name);
}
export function signingInput(request: Record<string, unknown>): SigningInput {
  const p = z.object({ action: record, nonce: uint, expiresAfter: uint.nullable().optional() }).strict().parse(request.payload);
  if (['order', 'cancel', 'cancelByCloid', 'noop'].includes(String(p.action.type))) {
    const expiresAfter = uint.parse(p.expiresAfter);
    if (expiresAfter <= p.nonce || expiresAfter - p.nonce > 172_800_001) throw new Error('Invalid signing expiry');
    // getSigningDigest validates the complete action schema before hashing it.
    return { scheme: 'l1', network: 'mainnet', action: p.action as unknown as Extract<SigningInput, { scheme: 'l1' }>['action'], nonce: p.nonce, expiresAfter };
  }
  if (p.expiresAfter != null || p.action.hyperliquidChain !== 'Mainnet' || p.action.signatureChainId !== '0x66eee') throw new Error('Invalid mainnet user action domain/expiry');
  const { hyperliquidChain: _chain, signatureChainId: _id, ...action } = p.action;
  if ((action.type === 'usdClassTransfer' ? action.nonce : action.time) !== p.nonce) throw new Error('User action nonce mismatch');
  return { scheme: 'user', network: 'mainnet', action: action as unknown as Extract<SigningInput, { scheme: 'user' }>['action'] };
}
export async function verifySigningReceipt(actual: ArchivedReceipt, expected: ArchivedReceipt, summary: MainnetSummary) {
  if (actual.receiver !== summary.policy.account || ![summary.policy.owner, summary.policy.keeper].includes(actual.signer)) throw new Error('Signing transaction identity mismatch');
  if (!isDeepStrictEqual(actual.actions, expected.actions) || actual.signer !== expected.signer || actual.status.SuccessValue !== 'dHJ1ZQ==') throw new Error('NEAR signing ABI arguments/callback status mismatch');
  const reqs = events(actual, summary.policy.account, 'request'), sigs = events(actual, summary.policy.account, 'signature');
  const oldReqs = events(expected, summary.policy.account, 'request');
  if (reqs.length !== 1 || sigs.length !== 1 || oldReqs.length !== 1) throw new Error('Need exactly one policy request and successful signature callback');
  const request = reqs[0]!.event.data[0]!, signature = sigs[0]!.event.data[0]!;
  if (!isDeepStrictEqual(request, oldReqs[0]!.event.data[0])) throw new Error('Live signing request differs from summary');
  const payload = z.object({ nonce: uint, expiresAfter: uint.nullable().optional() }).parse(request.payload);
  if (request.caller !== actual.signer || request.id !== signature.id || String(payload.nonce) !== signature.nonce ||
    String(payload.expiresAfter ?? '') !== String(signature.expiresAfter ?? '') || sigs[0]!.receipt.status.SuccessValue !== 'dHJ1ZQ==') throw new Error('Signing callback operation/nonce/expiry mismatch');
  const input = signingInput(request), digest = getSigningDigest(input);
  if (digest.slice(2) !== request.digest) throw new Error('Logged signing digest does not match rebuilt mainnet action');
  const recovered = await recoverAddress({ hash: digest, signature: (() => { const s = mpcToHyperliquidSignature(signature.signature); return { ...s, v: BigInt(s.v) }; })() });
  if (recovered.toLowerCase() !== summary.policy.derived_address) throw new Error('MPC signature does not recover the derived address');
  return { input, digest, request };
}
export function verifyFill(input: SigningInput, expected: z.infer<typeof fillSchema>, fillsRaw: unknown, orderRaw: unknown, asset: number, coin: string) {
  if (input.scheme !== 'l1' || input.action.type !== 'order' || input.action.orders.length !== 1) throw new Error('Expected one signed order');
  const signed = input.action.orders[0]!;
  if (signed.a !== asset || signed.b !== signed.r || !('limit' in signed.t) || signed.t.limit.tif !== 'Ioc') throw new Error('Signed asset/side/reduce-only/IOC mismatch');
  const fills = z.array(fillSchema).parse(fillsRaw).filter(f => f.oid === expected.oid);
  if (fills.length !== 1) throw new Error('Need exactly one matching venue fill');
  const fill = fills[0]!;
  if (fill.hash.toLowerCase() !== expected.hash.toLowerCase() || fill.coin !== coin || fill.side !== (signed.b ? 'B' : 'A') ||
    units(fill.sz, 24) !== units(expected.sz, 24) || units(fill.sz, 24) !== units(signed.s, 24) || units(fill.px, 8) !== units(expected.px, 8) ||
    fill.time !== expected.time || fill.time < input.nonce || input.expiresAfter === undefined || fill.time > input.expiresAfter) throw new Error('Venue fill hash/size/price/side/time mismatch');
  if (signed.b ? units(fill.px, 8) > units(signed.p, 8) : units(fill.px, 8) < units(signed.p, 8)) throw new Error('Execution price violates the signed limit');
  const order = z.object({ status: z.literal('order'), order: z.object({ status: z.literal('filled'), order: z.object({
    coin: z.literal(coin), oid: z.literal(expected.oid), side: z.enum(['A', 'B']), limitPx: z.string(), origSz: z.string(),
    reduceOnly: z.boolean(), tif: z.literal('Ioc'), timestamp: uint }) }) }).parse(orderRaw).order.order;
  if (order.side !== fill.side || order.reduceOnly !== signed.r || units(order.limitPx, 8) !== units(signed.p, 8) || units(order.origSz, 24) !== units(signed.s, 24) || order.timestamp !== fill.time)
    throw new Error('Venue order limit/size/reduce-only does not match the signed payload');
  return `${fill.sz} ${coin} @ ${fill.px}; reduceOnly=${signed.r}`;
}
export function verifyWithdrawal(input: SigningInput, ledgerRaw: unknown, summary: MainnetSummary) {
  if (input.scheme !== 'user' || input.action.type !== 'withdraw3') throw new Error('Expected signed withdraw3');
  const a = input.action, recipient = summary.public_api_reads.near_state.decoded.evm_recipient;
  if (a.destination !== recipient || units(a.amount, 6) !== units(summary.economics.withdrawal_gross_usdc, 6)) throw new Error('Signed withdrawal fixed recipient/gross mismatch');
  const archived = summary.public_api_reads.hl_ledger.filter(l => l.delta.type === 'withdraw');
  if (archived.length !== 1) throw new Error('Need one summary withdrawal ledger entry');
  const wanted = archived[0]!;
  const rows = z.array(ledgerSchema).parse(ledgerRaw).filter(l => l.hash.toLowerCase() === wanted.hash.toLowerCase() && l.delta.type === 'withdraw');
  if (rows.length !== 1) throw new Error('Withdrawal ledger entry missing or duplicated');
  const row = rows[0]!, d = row.delta;
  if (d.nonce !== a.time * 1000 || row.time !== wanted.time || row.time < a.time || row.time > a.time + 3 * 86_400_000 ||
    units(d.usdc, 6) !== units(summary.economics.arbitrum_arrival_usdc, 6) || units(d.fee, 6) !== units(summary.economics.bridge_fee_usdc, 6) || units(d.usdc, 6) + units(d.fee, 6) !== units(a.amount, 6))
    throw new Error('Withdrawal ledger nonce/net/fee/gross mismatch');
  return { hash: row.hash, recipient, amount: units(d.usdc, 6) };
}
export function verifyUsdcTransfer(receiptRaw: unknown, chainId: unknown, txHash: string, recipient: string, amount: bigint) {
  if (chainId !== '0xa4b1') throw new Error('Endpoint is not Arbitrum One (42161)');
  const receipt = z.object({ status: z.literal('0x1'), transactionHash: hash, blockHash: hash, blockNumber: z.string().regex(/^0x[0-9a-f]+$/), logs: z.array(z.object({
    address, topics: z.array(hash), data: z.string().regex(/^0x(?:[0-9a-fA-F]{2})*$/), removed: z.boolean(), transactionHash: hash, blockHash: hash, blockNumber: z.string() }).passthrough()) }).parse(receiptRaw);
  if (receipt.transactionHash.toLowerCase() !== txHash.toLowerCase()) throw new Error('Arbitrum receipt transaction hash mismatch');
  const matches = receipt.logs.filter(l => l.address === NATIVE_USDC && l.topics.length === 3 && l.topics[0] === TRANSFER_TOPIC
    && /^0x[0-9a-fA-F]{64}$/.test(l.data) && l.topics[2]?.toLowerCase() === `0x${recipient.slice(2).padStart(64, '0')}` && BigInt(l.data) === amount && !l.removed
    && l.transactionHash.toLowerCase() === txHash.toLowerCase() && l.blockHash === receipt.blockHash && l.blockNumber === receipt.blockNumber);
  if (matches.length !== 1) throw new Error('Exact native USDC Transfer recipient/amount missing or duplicated');
  return receipt;
}

export type Check = { check: string; ok: boolean; detail: string };
export function printTable(checks: Check[]) {
  const width = Math.max(5, ...checks.map(c => c.check.length));
  return [`${'CHECK'.padEnd(width)} | RESULT`, `${'-'.repeat(width)} | ------`, ...checks.map(c => `${c.check.padEnd(width)} | ${c.ok ? 'PASS' : 'FAIL'}`)].join('\n');
}
function errorText(error: unknown) { return error instanceof z.ZodError ? 'Invalid or incomplete public response/summary' : error instanceof Error ? error.message : String(error); }
/** Allowlist is deliberately closed: this executable has no signing, exchange, or broadcast method. */
export function allowedRead(endpoint: string, body: Record<string, unknown>) {
  if ((ENDPOINTS.near as readonly string[]).includes(endpoint)) return ['query', 'block', 'tx'].includes(String(body.method));
  if (endpoint === ENDPOINTS.arbitrum) return ['eth_chainId', 'eth_getTransactionReceipt', 'eth_getBlockByNumber'].includes(String(body.method));
  if (endpoint === ENDPOINTS.hyperliquid) return ['userFillsByTime', 'userNonFundingLedgerUpdates', 'orderStatus'].includes(String(body.type));
  return false;
}
export async function verifyMainnet(argv: string[] = []): Promise<Check[]> {
  const checks: Check[] = [];
  const check = async (name: string, work: () => Promise<string>) => {
    try { checks.push({ check: name, ok: true, detail: await work() }); }
    catch (error) { checks.push({ check: name, ok: false, detail: errorText(error) }); }
  };
  const options = argv.map(arg => /^--summary=(.+)$/.exec(arg));
  if (options.some(o => !o) || options.length > 1) return [{ check: 'summary', ok: false, detail: 'Usage: npm run verify:mainnet -- --summary=FILE' }];
  let summary: MainnetSummary;
  try { summary = parseSummary(JSON.parse(await readFile(resolve(options[0]?.[1] ?? DEFAULT_SUMMARY), 'utf8'))); }
  catch (error) { return [{ check: 'summary', ok: false, detail: errorText(error) }]; }
  const s = summary, account = s.policy.account, state = s.public_api_reads.near_state.decoded;
  const deadline = AbortSignal.timeout(48_000);
  const post = async (endpoint: string, body: Record<string, unknown>): Promise<unknown> => {
    if (!allowedRead(endpoint, body)) throw new Error('Refused non-allowlisted read');
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 CounterweightReadOnlyVerifier/1' }, body: JSON.stringify(body), signal: AbortSignal.any([deadline, AbortSignal.timeout(6500)]) });
    if (!response.ok) throw new Error(`${new URL(endpoint).host}: HTTP ${response.status}`);
    return response.json();
  };
  const rpc = async (network: 'near' | 'arbitrum', method: string, params: unknown): Promise<unknown> => {
    let last: unknown;
    for (const endpoint of network === 'near' ? ENDPOINTS.near : [ENDPOINTS.arbitrum]) {
      try {
        const result = z.object({ result: z.unknown(), error: z.unknown().optional() }).parse(await post(endpoint, { jsonrpc: '2.0', id: 'counterweight-read-only', method, params }));
        if (result.error !== undefined || result.result === undefined || result.result === null) throw new Error(`${new URL(endpoint).host}: ${method} unavailable`);
        return result.result;
      } catch (error) { last = error; }
    }
    throw last;
  };
  const info = (body: Record<string, unknown>) => post(ENDPOINTS.hyperliquid, body);
  // All current account/keys/state/root reads are pinned to the same finalized block.
  const blockPromise = rpc('near', 'block', { finality: 'final' }).then(v => z.object({ header: z.object({ hash: nearHash, height: uint }) }).parse(v).header);
  const current = (request_type: string, rest: Record<string, unknown>) => blockPromise.then(block => rpc('near', 'query', { request_type, account_id: account, block_id: block.hash, ...rest })).then(async v => {
    const block = await blockPromise;
    if (z.object({ block_hash: z.string() }).parse(v).block_hash !== block.hash) throw new Error('NEAR returned a different finalized block');
    return v;
  });
  const accountPromise = current('view_account', {});
  // Attach handlers immediately; each check later consumes the same settled reads.
  void blockPromise.catch(() => {}); void accountPromise.catch(() => {});
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const tasks: Promise<void>[] = [];
  tasks.push(check('code hash', async () => {
    const paths = artifactPaths(s), [bytes, manifest, live] = await Promise.all([readFile(resolve(root, paths.artifact)), readFile(resolve(root, paths.manifest), 'utf8'), accountPromise]);
    const deployed = z.object({ code_hash: z.string() }).parse(live).code_hash;
    const sha = verifyArtifact(bytes, manifest, paths.artifact, deployed);
    if (deployed !== s.policy.code_hash) throw new Error('Deployed code hash differs from summary');
    return `WASM SHA256 ${sha}`;
  }));
  tasks.push(check('access keys', async () => {
    await accountPromise;
    const keys = z.object({ keys: z.array(z.unknown()) }).parse(await current('view_access_key_list', {})).keys;
    if (keys.length !== 0) throw new Error(`Expected 0 access keys; got ${keys.length}`);
    return `${account}: 0 keys at final block`;
  }));
  tasks.push(check('fixed policy', async () => {
    const raw = z.object({ result: z.array(z.number().int().min(0).max(255)) }).parse(await current('call_function', { method_name: 'get_state', args_base64: 'e30=' }));
    const live = z.object({ network: z.literal('Mainnet'), evm_recipient: address, signer_account: z.literal('v1.signer'), derivation_path: z.string(), asset_index: uint, coin: z.string() }).parse(JSON.parse(Buffer.from(raw.result).toString('utf8')));
    for (const key of ['evm_recipient', 'signer_account', 'derivation_path', 'asset_index', 'coin'] as const) if (live[key] !== state[key]) throw new Error(`Policy immutable ${key} differs from summary`);
    return `recipient ${live.evm_recipient}`;
  }));
  tasks.push(check('public derivation', async () => {
    const block = await blockPromise;
    const view = async (method_name: string, args: Record<string, unknown>) => {
      const raw = z.object({ block_hash: z.literal(block.hash), result: z.array(z.number().int().min(0).max(255)) }).parse(await rpc('near', 'query', { request_type: 'call_function', account_id: s.policy.signer, block_id: block.hash, method_name, args_base64: Buffer.from(JSON.stringify(args)).toString('base64') }));
      return z.string().parse(JSON.parse(Buffer.from(raw.result).toString('utf8')));
    };
    const rootKey = await view('public_key', { domain_id: 0 });
    const derived = deriveEvmAddress(rootKey, account, s.policy.derivation_path);
    const remote = await view('derived_public_key', { predecessor: account, path: s.policy.derivation_path, domain_id: 0 });
    if (derived.address !== s.policy.derived_address || derived.publicKey.toLowerCase() !== s.public_derivation.publicKey.toLowerCase() || nearPublicKeyToHex(remote).toLowerCase() !== derived.publicKey.toLowerCase()) throw new Error('Public local/signer/summary derivation mismatch');
    return `${s.policy.signer} → ${derived.address}`;
  }));
  const deletion = Object.entries(s.near_transaction_receipts).filter(([, r]) => r.receiver === account && r.actions.some(a => typeof a === 'object' && a.DeleteKey));
  tasks.push(check('key deletion', async () => {
    if (deletion.length !== 1) throw new Error('Summary needs exactly one key-deletion transaction');
    const [id, expected] = deletion[0]!;
    const live = normalizeTransaction(await rpc('near', 'tx', { tx_hash: id, sender_account_id: expected.signer, wait_until: 'FINAL' }), id);
    if (live.receiver !== account || live.signer !== account || !isDeepStrictEqual(live.actions, expected.actions)) throw new Error('Final key-deletion account/actions mismatch');
    return `FINAL success ${id}`;
  }));
  const signings = Object.entries(s.near_transaction_receipts).filter(([, r]) => r.receiver === account && (r.actions.some(a => typeof a === 'object' && SIGNING_METHODS.has(String(a.method))) || events(r, account, 'request').length > 0));
  const signingPromises = new Map<string, Promise<Awaited<ReturnType<typeof verifySigningReceipt>>>>();
  for (const [id, archived] of signings) {
    const promise = rpc('near', 'tx', { tx_hash: id, sender_account_id: archived.signer, wait_until: 'FINAL' }).then(raw => verifySigningReceipt(normalizeTransaction(raw, id), archived, s));
    void promise.catch(() => {});
    signingPromises.set(id, promise);
  }
  tasks.push(check('NEAR signatures', async () => {
    if (signings.length < 4) throw new Error('Missing lifecycle signing transactions');
    await Promise.all(signingPromises.values());
    return `${signings.length} FINAL; rebuilt digests + recovered MPC signatures`;
  }));
  const fills = s.public_api_reads.hl_fills;
  const fillStart = Math.min(...fills.map(f => f.time)) - 60_000, fillEnd = Math.max(...fills.map(f => f.time)) + 60_000;
  const liveFills = fills.length ? info({ type: 'userFillsByTime', user: s.policy.derived_address, startTime: fillStart, endTime: fillEnd }) : Promise.reject(new Error('Summary has no fills'));
  void liveFills.catch(() => {});
  for (const reduceOnly of [false, true]) tasks.push(check(reduceOnly ? 'close fill' : 'open fill', async () => {
    const expected = fills.filter(f => f.side === (reduceOnly ? 'B' : 'A'));
    if (expected.length !== 1) throw new Error('Summary needs exactly one open and one close fill');
    const fill = expected[0]!, steps = s.steps.filter(step => step.venue_hash?.toLowerCase() === fill.hash.toLowerCase() && step.near_tx !== null);
    if (steps.length !== 1) throw new Error('Fill must link to exactly one NEAR signing transaction');
    const signed = await signingPromises.get(steps[0]!.near_tx!);
    if (!signed) throw new Error('Linked NEAR signing transaction missing');
    const [actualFills, order] = await Promise.all([liveFills, info({ type: 'orderStatus', user: s.policy.derived_address, oid: fill.oid })]);
    return verifyFill(signed.input, fill, actualFills, order, state.asset_index, state.coin);
  }));
  const withdrawals = signings.filter(([, r]) => events(r, account, 'request')[0]?.event.data[0]?.kind === 'EvmWithdrawal');
  const withdrawalPromise = (async () => {
    if (withdrawals.length !== 1) throw new Error('Summary needs one withdraw3 signing transaction');
    const signed = await signingPromises.get(withdrawals[0]![0]);
    if (!signed || signed.input.scheme !== 'user' || signed.input.action.type !== 'withdraw3') throw new Error('Missing withdraw3 signature');
    const a = signed.input.action;
    const ledger = await info({ type: 'userNonFundingLedgerUpdates', user: s.policy.derived_address, startTime: a.time - 1000, endTime: a.time + 3 * 86_400_000 });
    const withdrawal = verifyWithdrawal(signed.input, ledger, s);
    const linked = s.steps.filter(step => step.near_tx === withdrawals[0]![0] && step.venue_hash?.toLowerCase() === withdrawal.hash.toLowerCase());
    if (linked.length !== 1) throw new Error('Withdrawal ledger hash is not linked to its NEAR signing step');
    return withdrawal;
  })();
  void withdrawalPromise.catch(() => {});
  tasks.push(check('withdraw ledger', async () => {
    const w = await withdrawalPromise;
    return `${s.economics.arbitrum_arrival_usdc} net + ${s.economics.bridge_fee_usdc} fee; nonce matched`;
  }));
  tasks.push(check('Arbitrum USDC', async () => {
    const w = await withdrawalPromise;
    const [receiptRaw, chain] = await Promise.all([rpc('arbitrum', 'eth_getTransactionReceipt', [w.hash]), rpc('arbitrum', 'eth_chainId', [])]);
    const receipt = verifyUsdcTransfer(receiptRaw, chain, w.hash, w.recipient, w.amount);
    const block = z.object({ hash, number: z.string() }).parse(await rpc('arbitrum', 'eth_getBlockByNumber', [receipt.blockNumber, false]));
    if (block.hash !== receipt.blockHash || block.number !== receipt.blockNumber) throw new Error('Receipt block is not canonical');
    return `${w.amount} units native USDC → ${w.recipient}`;
  }));
  // Class-transfer signature is already covered above; require its independent ledger linkage too.
  tasks.push(check('perps funding', async () => {
    const candidates = signings.filter(([, r]) => events(r, account, 'request')[0]?.event.data[0]?.kind === 'UsdClassTransfer');
    if (candidates.length !== 1) throw new Error('Summary needs one spot→perps signing transaction');
    const id = candidates[0]![0], signed = await signingPromises.get(id);
    if (!signed || signed.input.scheme !== 'user' || signed.input.action.type !== 'usdClassTransfer' || !signed.input.action.toPerp) throw new Error('Invalid class-transfer action');
    const action = signed.input.action, steps = s.steps.filter(step => step.near_tx === id && step.venue_hash);
    if (steps.length !== 1) throw new Error('Class transfer venue hash missing');
    const ledger = z.array(ledgerSchema).parse(await info({ type: 'userNonFundingLedgerUpdates', user: s.policy.derived_address, startTime: action.nonce - 1000, endTime: action.nonce + 86_400_000 }));
    const rows = ledger.filter(l => l.hash === steps[0]!.venue_hash && l.delta.type === 'accountClassTransfer');
    if (rows.length !== 1 || rows[0]!.delta.toPerp !== true || units(rows[0]!.delta.usdc, 6) !== units(action.amount, 6) || rows[0]!.time < action.nonce || rows[0]!.time > action.nonce + 86_400_000) throw new Error('Spot→perps ledger mismatch');
    return `${action.amount} USDC; signed action + public ledger`;
  }));
  await Promise.all(tasks);
  const order = ['code hash', 'access keys', 'fixed policy', 'key deletion', 'public derivation', 'NEAR signatures', 'perps funding', 'open fill', 'close fill', 'withdraw ledger', 'Arbitrum USDC'];
  checks.sort((a, b) => order.indexOf(a.check) - order.indexOf(b.check));
  return checks;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const checks = await verifyMainnet(process.argv.slice(2));
  for (const c of checks) console.log(`[${c.ok ? 'PASS' : 'FAIL'}] ${c.check}: ${c.detail.replace(/[\r\n]+/g, ' ')}`);
  console.log('\n' + printTable(checks));
  process.exitCode = checks.every(c => c.ok) ? 0 : 1;
}
