import { mkdir, writeFile } from 'node:fs/promises';
import { base58 } from '@scure/base';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { assembleRequest, classifyProofResponse, deriveTestnetAddress, getSigningDigest, mpcToHyperliquidSignature,
  nearMarketIndex, recoveredSigner, testnetMeta, TESTNET_API, type L1Input } from '../packages/hyperliquid/src/index.js';
import { committedWasm, DEPLOYED_SHA256, KEEPER, parseOptions, PATH, POLICY, publicCli, rpc, stateAt, testnetAccount, txHash } from './testnet-common.js';
import { checkKeys, keyListSchema, policyStateSchema } from './testnet-verify.js';

const uint = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const decimalUint = z.string().regex(/^(0|[1-9]\d*)$/).transform(Number).pipe(uint);
const outcome = z.object({ id: z.string(), block_hash: z.string(), outcome: z.object({ executor_id: z.string(),
  logs: z.array(z.string()), status: z.record(z.string(), z.unknown()) }) });
const transactionSchema = z.object({ final_execution_status: z.literal('FINAL'), status: z.object({ SuccessValue: z.literal('dHJ1ZQ==') }).strict(),
  transaction: z.object({ hash: z.string(), signer_id: z.string(), receiver_id: z.string(),
    actions: z.array(z.object({ FunctionCall: z.object({ method_name: z.literal('request_cancel_signature'), args: z.string() }) }).strict()).length(1) }),
  receipts_outcome: z.array(outcome),
});
const envelope = z.object({ standard: z.literal('counterweight'), version: z.literal('1.0.0'), event: z.string(), data: z.array(z.unknown()).length(1) });
const requestSchema = z.object({ id: decimalUint, caller: z.string(), kind: z.literal('Cancel'), digest: z.string().regex(/^[a-f0-9]{64}$/),
  payload: z.object({ action: z.object({ type: z.literal('cancel'), cancels: z.array(z.object({ a: uint, o: z.literal(0) }).strict()).length(1) }).strict(),
    nonce: uint, expiresAfter: uint }).strict() });
const signatureSchema = z.object({ id: decimalUint, nonce: decimalUint, expiresAfter: decimalUint, signature: z.unknown() });

/** Trust only successful policy receipts, never transaction logs from another executor. */
export function parseContractProof(raw: unknown, expectedTx: string, asset: number, policy = POLICY, keeper = KEEPER) {
  const tx = transactionSchema.parse(raw);
  if (tx.transaction.signer_id !== keeper || tx.transaction.receiver_id !== policy) throw new Error('Contract proof identity mismatch');
  if (tx.transaction.hash !== txHash(expectedTx)) throw new Error('Contract proof transaction hash mismatch');
  const args: unknown = JSON.parse(Buffer.from(tx.transaction.actions[0]!.FunctionCall.args, 'base64').toString('utf8'));
  z.object({ order_id: z.literal('0') }).strict().parse(args);
  const events = tx.receipts_outcome.filter(r => r.outcome.executor_id === policy && !('Failure' in r.outcome.status))
    .flatMap(receipt => receipt.outcome.logs.filter(l => l.startsWith('EVENT_JSON:')).map(log => ({ receipt,
      event: envelope.parse(JSON.parse(log.slice('EVENT_JSON:'.length))) })));
  const requests = events.filter(e => e.event.event === 'request');
  const signatures = events.filter(e => e.event.event === 'signature');
  if (requests.length !== 1 || signatures.length !== 1) throw new Error('Contract proof needs exactly one policy request and signature event');
  const req = requestSchema.parse(requests[0]!.event.data[0]);
  const sig = signatureSchema.parse(signatures[0]!.event.data[0]);
  if (req.caller !== keeper || req.id !== sig.id || req.payload.nonce !== sig.nonce || req.payload.expiresAfter !== sig.expiresAfter
    || req.payload.action.cancels[0]!.a !== asset || signatures[0]!.receipt.outcome.status.SuccessValue !== 'dHJ1ZQ==')
    throw new Error('Contract proof callback, operation, market, nonce or expiry mismatch');
  const input: L1Input = { scheme: 'l1', network: 'testnet', ...req.payload };
  const digest = getSigningDigest(input);
  if (digest.slice(2) !== req.digest) throw new Error('Contract proof digest mismatch');
  if (input.expiresAfter! <= input.nonce || input.expiresAfter! - input.nonce > 60000)
    throw new Error('Contract proof expiry exceeds 60 seconds');
  return { input, digest, signature: mpcToHyperliquidSignature(sig.signature),
    requestReceipt: requests[0]!.receipt, signatureReceipt: signatures[0]!.receipt };
}
export function assertFreshContractProof(input: L1Input, now = Date.now()) {
  if (input.nonce > now + 1000 || input.expiresAfter === undefined || input.expiresAfter <= now + 3000)
    throw new Error('Contract proof expired or too close to expiry; request a fresh keeper cancel and relay immediately');
}
export const REHEARSAL_NOTICE = 'REHEARSAL — policy account still had a full-access key; not the final keyless proof';
export function proofOptions(argv: string[]) {
  if (argv.filter(a => a === '--rehearsal').length > 1) throw new Error('Expected one --rehearsal flag');
  const rehearsal = argv.includes('--rehearsal');
  const options = parseOptions(argv.filter(a => a !== '--rehearsal'), ['tx', 'keeper', 'policy', 'wasm-sha256']);
  const policy = testnetAccount(options.policy ?? POLICY);
  const keeper = testnetAccount(options.keeper ?? KEEPER);
  if (options['wasm-sha256'] && (!rehearsal || policy !== POLICY || options['wasm-sha256'] !== DEPLOYED_SHA256))
    throw new Error('Expected historical WASM override only for rehearsal on the original policy');
  return { tx: options.tx, 'wasm-sha256': options['wasm-sha256'], policy, keeper, rehearsal };
}
export function proofKeys(value: unknown, rehearsal: boolean) {
  const list = keyListSchema.parse(value);
  if (rehearsal ? !list.keys.some(k => k.access_key.permission === 'FullAccess') : !checkKeys(value).ok)
    throw new Error(rehearsal ? 'Policy rehearsal requires a full-access key at each receipt block' : 'Policy still has access keys at the proof receipt block');
  return list.keys;
}
export async function prepareContractProof(policy: string) {
  const [artifact, derived, meta] = await Promise.all([committedWasm(), deriveTestnetAddress(policy, PATH), testnetMeta()]);
  return { artifact, derived, meta };
}
export async function proveContract(argv: string[], prepared?: Awaited<ReturnType<typeof prepareContractProof>>) {
  const options = proofOptions(argv);
  const { policy, keeper, rehearsal } = options;
  if (!options.tx) throw new Error('Usage: npm run prove:contract -- --tx=NEAR_TRANSACTION_HASH');
  const hash = txHash(options.tx);
  const { artifact, derived, meta } = prepared ?? await prepareContractProof(policy);
  const expectedSha256 = options['wasm-sha256'] ?? artifact.sha256;
  const codeHash = base58.encode(Buffer.from(expectedSha256, 'hex'));
  const [raw] = await Promise.all([
    rpc('tx', { tx_hash: hash, sender_account_id: keeper, wait_until: 'FINAL' }),
    rehearsal ? rpc('query', { request_type: 'view_access_key_list', account_id: policy, finality: 'final' })
      .then(keys => proofKeys(keys, true)) : Promise.resolve(),
  ]);
  const parsed = parseContractProof(raw, hash, nearMarketIndex(meta), policy, keeper);
  assertFreshContractProof(parsed.input);
  const checks = await Promise.all([...new Set([parsed.requestReceipt.block_hash, parsed.signatureReceipt.block_hash])].map(async block => {
    const [account, keys, rawState] = await Promise.all([
      rpc('query', { request_type: 'view_account', account_id: policy, block_id: block }),
      rpc('query', { request_type: 'view_access_key_list', account_id: policy, block_id: block }), stateAt(block, policy),
    ]);
    z.object({ code_hash: z.literal(codeHash), block_hash: z.literal(block) }).parse(account);
    z.object({ block_hash: z.literal(block) }).parse(keys);
    const accessKeys = proofKeys(keys, rehearsal);
    const state = policyStateSchema.extend({ keeper: z.literal(keeper) }).parse(rawState);
    if (state.asset_index !== nearMarketIndex(meta) || state.size_decimals !== meta.universe[state.asset_index]?.szDecimals)
      throw new Error('Policy market metadata mismatch');
    return { block, codeHash, accessKeys, state };
  }));
  if (rehearsal) console.log(REHEARSAL_NOTICE);
  const recovered = await recoveredSigner(parsed.digest, parsed.signature);
  if (recovered.toLowerCase() !== derived.address.toLowerCase()) throw new Error('Contract signature does not recover to policy predecessor address');
  const request = assembleRequest(parsed.input, parsed.signature);
  // One exclusive evidence claim per tx: repeated/concurrent invocations cannot relay the same signature.
  await mkdir('docs/evidence', { recursive: true });
  const prefix = `docs/evidence/${new Date().toISOString().slice(0, 10)}-contract-proof-${hash}`;
  const record = { capturedAt: new Date().toISOString(), kind: rehearsal ? 'policy-contract-mpc-rehearsal' : 'policy-contract-mpc-proof',
    notice: rehearsal ? REHEARSAL_NOTICE : 'FINAL KEYLESS PROOF', rehearsal, expectedSha256, committedSha256: artifact.sha256, txHash: hash,
    predecessor: policy, path: PATH, derived, recovered, ...parsed, checks, request };
  await writeFile(`${prefix}.json`, `${JSON.stringify({ ...record, verdict: 'not-submitted' }, null, 2)}\n`, { flag: 'wx' });
  assertFreshContractProof(parsed.input);
  let httpStatus: number | null = null;
  let response: unknown = null;
  let verdict: ReturnType<typeof classifyProofResponse> = 'unproven';
  try {
    const result = await fetch(`${TESTNET_API}/exchange`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request), signal: AbortSignal.timeout(25000) });
    httpStatus = result.status;
    response = await result.json();
    if (result.ok) verdict = classifyProofResponse(response, derived.address, recovered);
  } catch { response = 'Transport failure or invalid JSON; outcome unknown. Do not retry this signature.'; }
  const evidence = { ...record, httpStatus, response, verdict };
  await writeFile(`${prefix}.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  await writeFile(`${prefix}.md`, `# Policy-contract signing boundary proof — ${record.capturedAt}\n\nTestnet only; no funds.\n\n${record.notice}\n\n` +
    `Transaction: [${hash}](https://testnet.nearblocks.io/txns/${hash}). Keeper called policy request_cancel_signature(order_id=0). ` +
    `Only successful policy request/signature receipts and final callback true were accepted. Both receipt blocks match expected WASM ${expectedSha256}; ${rehearsal ? 'full-access policy keys were present (rehearsal only)' : 'zero policy access keys' }.\n\n` +
    `Predecessor: ${policy}; path: ${PATH}; derived address: ${derived.address}; locally recovered: ${recovered}.\n\n` +
    `Digest: ${parsed.digest}; expiry: ${parsed.input.expiresAfter}. Formatted public signature: ${JSON.stringify(parsed.signature)}.\n\n` +
    `Hyperliquid testnet HTTP ${httpStatus}; verdict: **${verdict}**.\n\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\`\n\n` +
    `Full public request, receipt events, code/config checks and derivation: [JSON](${prefix.split('/').at(-1)}.json). ` +
    `${rehearsal ? 'This rehearsal is not a final keyless proof. It establishes' : 'This establishes'} the signing boundary only if verdict is proven; it does not establish funding, fills, or every policy invariant.\n`);
  console.log(JSON.stringify({ notice: record.notice, rehearsal, txHash: hash, derivedAddress: derived.address, recovered, signature: parsed.signature, request, httpStatus, response, verdict, evidence: `${prefix}.md` }, null, 2));
  if (verdict === 'unproven') throw new Error('Proof UNPROVEN; inspect public evidence and request a fresh keeper cancel');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => proveContract(process.argv.slice(2)));
