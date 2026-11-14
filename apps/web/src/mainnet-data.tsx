import { z } from "zod";
import summary from "../../../docs/evidence/2026-11-14-v4-mainnet-lifecycle-summary.json";
import { decodeView } from "./data";

export const MAINNET_ACCOUNT = "cw4.haxheton.near";
export const MAINNET_RPCS = ["https://rpc.mainnet.fastnear.com", "https://rpc.mainnet.near.org"] as const;
const block = { block_hash: z.string().min(1), block_height: z.number().int().positive() };
const accountSchema = z.object({ ...block, code_hash: z.string().min(1), amount: z.string().regex(/^\d+$/) });
const policySchema = z.object({
  network: z.literal("Mainnet"), paused: z.boolean(),
  spot_balance: z.string().regex(/^\d+$/), signed_short_size: z.string().regex(/^\d+$/),
});
export interface MainnetStatus {
  source: "live" | "bundled";
  observedAt: string;
  blockHash: string;
  blockHeight: number;
  codeHash: string;
  codeMatches: boolean;
  keyCount: number;
  paused: boolean;
  spotBalance: string;
  shortReservation: string;
  endpoint: string | null;
}

const recordedAccount = accountSchema.parse(summary.public_api_reads.near_account.result);
const recordedKeys = z.object({
  block_hash: z.literal(recordedAccount.block_hash), keys: z.array(z.unknown()),
}).parse(summary.public_api_reads.near_access_keys.result);
const recordedPolicy = policySchema.parse(summary.public_api_reads.near_state.decoded);
if (summary.public_api_reads.near_state.result.block_hash !== recordedAccount.block_hash)
  throw new Error("Bundled mainnet evidence has inconsistent blocks.");
/** Embedded in the JS bundle: this status survives RPC/CORS failures without a backend. */
export const bundledMainnetStatus: MainnetStatus = {
  source: "bundled", observedAt: summary.verified_at_utc,
  blockHash: recordedAccount.block_hash, blockHeight: recordedAccount.block_height,
  codeHash: recordedAccount.code_hash, codeMatches: recordedAccount.code_hash === summary.policy.code_hash,
  keyCount: recordedKeys.keys.length, paused: recordedPolicy.paused,
  spotBalance: recordedPolicy.spot_balance, shortReservation: recordedPolicy.signed_short_size,
  endpoint: null,
};

async function query(endpoint: string, params: Record<string, unknown>, fetcher: typeof fetch) {
  const response = await fetcher(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "counterweight-mainnet-read-only", method: "query", params }),
    signal: AbortSignal.timeout(6_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const envelope = z.object({ result: z.unknown().optional(), error: z.unknown().optional() }).parse(await response.json());
  if (envelope.error !== undefined || envelope.result === undefined) throw new Error("NEAR public query unavailable");
  return envelope.result;
}

/** Read-only queries only; account, keys and policy state share one finalized block. */
export async function readMainnetStatus(fetcher: typeof fetch = fetch): Promise<MainnetStatus> {
  const errors: string[] = [];
  for (const endpoint of MAINNET_RPCS) {
    try {
      const account = accountSchema.parse(await query(endpoint, {
        request_type: "view_account", account_id: MAINNET_ACCOUNT, finality: "final",
      }, fetcher));
      const pinned = { account_id: MAINNET_ACCOUNT, block_id: account.block_hash };
      const [rawKeys, rawPolicy] = await Promise.all([
        query(endpoint, { ...pinned, request_type: "view_access_key_list" }, fetcher),
        query(endpoint, { ...pinned, request_type: "call_function", method_name: "get_state", args_base64: "e30=" }, fetcher),
      ]);
      const keys = z.object({
        block_hash: z.literal(account.block_hash), keys: z.array(z.unknown()),
      }).parse(rawKeys);
      const policy = policySchema.parse(decodeView(rawPolicy, account.block_hash));
      return {
        source: "live", observedAt: new Date().toISOString(), endpoint,
        blockHash: account.block_hash, blockHeight: account.block_height,
        codeHash: account.code_hash, codeMatches: account.code_hash === summary.policy.code_hash,
        keyCount: keys.keys.length, paused: policy.paused,
        spotBalance: policy.spot_balance, shortReservation: policy.signed_short_size,
      };
    } catch (error) {
      errors.push(`${new URL(endpoint).hostname}: ${error instanceof Error ? error.message : "read failed"}`);
    }
  }
  throw new Error(errors.join("; "));
}
