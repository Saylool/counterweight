import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { deriveTestnetAddress, nearMarketIndex, testnetMeta, TESTNET_SIGNER } from '../packages/hyperliquid/src/index.js';
import { NEXT_POLICY, V2_BASELINE_SHA256, committedWasm, KEEPER, LIMITS, ORACLE, OWNER, parseOptions, PATH, POLICY, publicCli, rpc, SIGNING_LIMITS, stateAt, testnetAccount } from './testnet-common.js';

export const policyStateSchema = z.object({ owner: z.literal(OWNER), keeper: z.literal(KEEPER), coin: z.literal('NEAR'),
  signer_account: z.literal(TESTNET_SIGNER), wnear_account: z.literal('wrap.testnet'), near_recipient: z.literal(OWNER),
  derivation_path: z.literal(PATH), evm_recipient: z.string().regex(/^0x[0-9a-f]{40}$/).refine(s => !/^0x0{40}$/.test(s)),
  asset_index: z.number().int().nonnegative(), size_decimals: z.number().int().min(0).max(6),
  limits: z.object({ max_short_size: z.string(), per_order_notional_cap: z.string(), per_day_notional_cap: z.string(),
    cooldown_seconds: z.number(), price_band_bps: z.number(), price_max_age_seconds: z.number() }),
  spot_balance: z.string(), signed_short_size: z.string(), paused: z.boolean(), pending: z.unknown(),
  signing_limits: z.record(z.string(), z.number()), mpc_fee: z.string(), signer_gas_tgas: z.number(), callback_gas_tgas: z.number(),
  heartbeat_timeout_seconds: z.number(), keeper_weight_limit: z.string(),
}).passthrough();
export const keyListSchema = z.object({ block_hash: z.string(), keys: z.array(z.object({ public_key: z.string(),
  access_key: z.object({ permission: z.unknown() }).passthrough() })) });
export function checkKeys(value: unknown, beforeRemoval = false) {
  const list = keyListSchema.parse(value);
  const ok = beforeRemoval ? list.keys.length === 1 && list.keys[0]?.access_key.permission === 'FullAccess' : list.keys.length === 0;
  return { ok, expected: beforeRemoval ? 'exactly one temporary full-access key' : 'zero access keys', keys: list.keys };
}
export function planConfigMatches(state: z.infer<typeof policyStateSchema>, expected?: { oracle: unknown; limits: unknown }) {
  return Object.entries(expected?.limits ?? LIMITS).every(([key, value]) => state.limits[key as keyof typeof LIMITS] === value)
    && Object.entries(SIGNING_LIMITS).every(([key, value]) => state.signing_limits[key] === value)
    && state.network === 'Testnet' && Object.entries(expected?.oracle ?? ORACLE).every(([k,v]) => (state.oracle as Record<string, unknown> | undefined)?.[k] === v)
    && state.mpc_fee === '1' && state.signer_gas_tgas === 230 && state.callback_gas_tgas === 30
    && state.heartbeat_timeout_seconds === 3600 && state.keeper_weight_limit === '5000';
}
export async function verifyTestnet(argv: string[]) {
  const options = parseOptions(argv, ['owner-evm', 'before-key-removal', 'policy', 'plan']);
  if (options['before-key-removal'] !== undefined && options['before-key-removal'] !== 'true') throw new Error('Expected --before-key-removal=true');
  if (options['owner-evm']) z.string().regex(/^0x[0-9a-fA-F]{40}$/).parse(options['owner-evm']);
  const policy = testnetAccount(options.policy ?? POLICY);
  if (policy !== POLICY && !options.plan) throw new Error('Policy v2 verification requires --plan=docs/evidence/policy-v2-plan.json');
  const artifact = await committedWasm();
  const saved = options.plan ? JSON.parse(await readFile(options.plan, 'utf8')) : undefined;
  if (saved && saved.policy !== policy) throw new Error('Policy plan account mismatch');
  if (saved && saved.artifact?.sha256 !== artifact.sha256 && !(policy === NEXT_POLICY && saved.artifact?.sha256 === V2_BASELINE_SHA256)) throw new Error('Policy plan artifact mismatch');
  let accountExists = false;
  const checks: { check: string; ok: boolean; details: unknown }[] = [];
  const record = async (name: string, run: () => Promise<{ ok: boolean; details: unknown }>) => {
    try { checks.push({ check: name, ...await run() }); }
    catch (error) { checks.push({ check: name, ok: false, details: error instanceof Error && error.message.startsWith('NEAR RPC') ? error.message : 'Unavailable or invalid public response' }); }
  };
  const block = z.object({ header: z.object({ hash: z.string(), height: z.number() }) }).parse(await rpc('block', { finality: 'final' })).header;
  // All custody/code/state checks use one finalized block, avoiding mixed snapshots.
  await record('code hash', async () => {
    const account = z.object({ block_hash: z.literal(block.hash), code_hash: z.string() }).parse(await rpc('query', {
      request_type: 'view_account', account_id: policy, block_id: block.hash,
    }));
    accountExists = true;
    return { ok: account.code_hash === artifact.codeHash, details: { committedSha256: artifact.sha256, expectedBase58: artifact.codeHash, actualBase58: account.code_hash } };
  });
  await record('access keys', async () => {
    // NEAR can return an empty key list for a nonexistent account. That is not custody evidence.
    if (!accountExists) return { ok: false, details: 'Account existence unavailable; an empty key list would not establish keyless custody' };
    const result = await rpc('query', { request_type: 'view_access_key_list', account_id: policy, block_id: block.hash });
    const list = keyListSchema.parse(result);
    if (list.block_hash !== block.hash) throw new Error('NEAR RPC returned another block');
    const keys = checkKeys(list, options['before-key-removal'] === 'true');
    return { ok: keys.ok, details: keys };
  });
  await record('get_state config and current state', async () => {
    const state = policyStateSchema.parse(await stateAt(block.hash, policy));
    const meta = await testnetMeta();
    const index = nearMarketIndex(meta);
    const recipientMatches = (options['owner-evm'] === undefined || state.evm_recipient === options['owner-evm'].toLowerCase())
      && (saved === undefined || state.evm_recipient === saved.init?.evm_recipient);
    const matchesPlan = planConfigMatches(state, saved?.init);
    return { ok: state.asset_index === index && state.size_decimals === meta.universe[index]?.szDecimals && recipientMatches && matchesPlan,
      details: { recipientMatches, matchesPlan, state, note: 'Identity, current venue metadata and plan baseline limits/resources checked. Mutable config drift fails this baseline check; inspect current state against owner intent. Use --owner-evm=0x... to assert your immutable EVM recipient.' } };
  });
  await record('policy-derived Hyperliquid address', async () => {
    const derived = await deriveTestnetAddress(policy, PATH);
    return { ok: saved === undefined || derived.address === saved.derived?.address,
      details: { predecessor: policy, path: PATH, ...derived, note: 'Local public derivation agrees with signer view at the root block. This is not a signature or fill proof.' } };
  });
  console.log(JSON.stringify({ account: policy, network: 'testnet', finalizedBlock: block, checks }, null, 2));
  if (checks.some(c => !c.ok)) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await publicCli(() => verifyTestnet(process.argv.slice(2)));
