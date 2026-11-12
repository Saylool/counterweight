import { z } from "zod";
import { base58 } from "@scure/base";
import { keccak256 } from "viem";
import {
  evaluateRisk,
  maintenanceMargin,
  HOUR_MS,
} from "../../../packages/domain/src/index";
import type { Artifacts } from "./model";

export const DEFAULT_ACCOUNT = "policy-v2.counterweight-samet.testnet";
export const V3_ACCOUNT = "policy-v3.counterweight-samet.testnet";
export const REHEARSAL_ACCOUNT = "policy.counterweight-samet.testnet";
export const HL_TESTNET_API = "https://api.hyperliquid-testnet.xyz/info";
export const NEAR_RPC =
  import.meta.env.VITE_NEAR_RPC || "https://rpc.testnet.near.org";
export const HL_API = "https://api.hyperliquid.xyz/info";
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export async function loadJson<T>(
  path: string,
  schema: z.ZodType<T>,
  fetcher: typeof fetch = fetch,
): Promise<T> {
  const response = await fetcher(assetUrl(path), {
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok)
    throw new Error(`Could not load ${path} (HTTP ${response.status}).`);
  const result = schema.safeParse(await response.json());
  if (!result.success)
    throw new Error(`Invalid data in ${path}; no results displayed.`);
  return result.data;
}
async function post(url: string, body: unknown, fetcher: typeof fetch) {
  const res = await fetcher(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Public API returned HTTP ${res.status}.`);
  return res.json() as Promise<unknown>;
}
const rpcEnvelope = z.object({
  result: z.unknown().optional(),
  error: z
    .object({
      message: z.string().optional(),
      cause: z.object({ name: z.string() }).optional(),
    })
    .passthrough()
    .optional(),
});
async function query(params: Record<string, unknown>, fetcher: typeof fetch) {
  const body = rpcEnvelope.parse(
    await post(
      NEAR_RPC,
      {
        jsonrpc: "2.0",
        id: "counterweight-read-only",
        method: "query",
        params,
      },
      fetcher,
    ),
  );
  if (body.error)
    throw new Error(
      `NEAR RPC: ${body.error.cause?.name ?? body.error.message ?? "query failed"}.`,
    );
  if (body.result === undefined)
    throw new Error("NEAR RPC returned no result.");
  return body.result;
}
const viewSchema = z.object({
  block_hash: z.string(),
  block_height: z.number().int(),
  result: z.array(z.number().int().min(0).max(255)),
});
export function decodeView(value: unknown, block?: string): unknown {
  const view = viewSchema.parse(value);
  if (block && view.block_hash !== block)
    throw new Error("RPC returned a different block; verification stopped.");
  return JSON.parse(
    new TextDecoder().decode(new Uint8Array(view.result)),
  ) as unknown;
}
const counters = z.record(
  z.string(),
  z.union([z.string(), z.number().finite(), z.boolean()]),
);
export const stateSchema = z.object({
  owner: z.string(),
  keeper: z.string(),
  paused: z.boolean(),
  derivation_path: z.string(),
  signer_account: z.string(),
  limits: counters,
  signing_limits: counters,
  outstanding: z.array(z.unknown()),
  operation_id: z.string(),
  last_nonce: z.string(),
  daily_usage: z.string(),
  keeper_weight_used: z.string(),
  keeper_weight_limit: z.string(),
});
export function addressFromPublicKey(value: string) {
  if (!value.startsWith("secp256k1:"))
    throw new Error("MPC returned an unsupported public key.");
  const bytes = base58.decode(value.slice(10));
  if (bytes.length !== 64)
    throw new Error("MPC public key must contain 64 bytes.");
  return `0x${keccak256(bytes).slice(-40)}`;
}
export async function readContract(
  account: string,
  artifacts: Artifacts,
  fetcher: typeof fetch = fetch,
) {
  if (
    !/^(?=.{2,64}$)[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\.[a-z0-9]+(?:[-_][a-z0-9]+)*)*\.testnet$/.test(
      account,
    )
  )
    throw new Error("Enter a named NEAR testnet account (2–64 characters).");
  const info = z
    .object({
      code_hash: z.string(),
      block_hash: z.string(),
      block_height: z.number().int(),
    })
    .parse(
      await query(
        {
          request_type: "view_account",
          account_id: account,
          finality: "final",
        },
        fetcher,
      ),
    );
  const pinned = { account_id: account, block_id: info.block_hash };
  const [rawState, rawKeys] = await Promise.all([
    query(
      {
        ...pinned,
        request_type: "call_function",
        method_name: "get_state",
        args_base64: "e30=",
      },
      fetcher,
    ),
    query({ ...pinned, request_type: "view_access_key_list" }, fetcher),
  ]);
  const state = stateSchema.parse(decodeView(rawState, info.block_hash));
  const keys = z
    .object({
      block_hash: z.literal(info.block_hash),
      keys: z.array(z.unknown()),
    })
    .parse(rawKeys);
  const args = {
    predecessor: account,
    path: state.derivation_path,
    domain_id: 0,
  };
  const args_base64 = btoa(
    String.fromCharCode(...new TextEncoder().encode(JSON.stringify(args))),
  );
  // Ask the configured MPC's public derived-key view, pinned to the policy observation.
  let address: string | null = null;
  let derivationError: string | null = null;
  try {
    const derived = await query(
      {
        request_type: "call_function",
        account_id: state.signer_account,
        block_id: info.block_hash,
        method_name: "derived_public_key",
        args_base64,
      },
      fetcher,
    );
    address = addressFromPublicKey(
      z.string().parse(decodeView(derived, info.block_hash)),
    );
  } catch (error) {
    derivationError = errorMessage(error);
  }
  return {
    state,
    keyCount: keys.keys.length,
    codeHash: info.code_hash,
    expectedArtifact: account === DEFAULT_ACCOUNT ? artifacts.v2 : account === V3_ACCOUNT ? artifacts.v3 : null,
    artifactVersion: account === DEFAULT_ACCOUNT ? "v2" : account === V3_ACCOUNT ? "v3" : null,
    codeMatches: account === DEFAULT_ACCOUNT ? info.code_hash === artifacts.v2.codeHash
      : account === V3_ACCOUNT ? info.code_hash === artifacts.v3.codeHash : null,
    blockHeight: info.block_height,
    address,
    derivationError,
    fetchedAt: Date.now(),
  };
}
export type Contract = Awaited<ReturnType<typeof readContract>>;
const numeric = z
  .string()
  .trim()
  .min(1)
  .refine((v) => Number.isFinite(Number(v)))
  .transform(Number);
const positive = numeric.refine((v) => v > 0);
const fundingRate = numeric.pipe(z.number().min(-1).max(1));
export async function readMarket(
  fetcher: typeof fetch = fetch,
  now = Date.now(),
) {
  const info = (body: unknown) => post(HL_API, body, fetcher);
  const [rawMeta, rawFunding, rawBook] = await Promise.all([
    info({ type: "metaAndAssetCtxs" }),
    info({
      type: "fundingHistory",
      coin: "NEAR",
      startTime: now - 26 * HOUR_MS,
      endTime: now,
    }),
    info({ type: "l2Book", coin: "NEAR" }),
  ]);
  const [meta, contexts] = z
    .tuple([
      z.object({
        universe: z.array(
          z.object({ name: z.string(), isDelisted: z.boolean().optional() }),
        ),
      }),
      z.array(z.object({ markPx: positive, funding: fundingRate })),
    ])
    .parse(rawMeta);
  const index = meta.universe.findIndex(
    (a) => a.name === "NEAR" && !a.isDelisted,
  );
  const context = contexts[index];
  if (!context) throw new Error("NEAR market is unavailable.");
  const funding = z
    .array(
      z.object({
        coin: z.literal("NEAR"),
        time: z.number().int().nonnegative(),
        fundingRate: fundingRate,
      }),
    )
    .parse(rawFunding)
    .map((f) => ({
      time: Math.floor(f.time / HOUR_MS) * HOUR_MS,
      rate: f.fundingRate,
    }))
    .sort((a, b) => a.time - b.time);
  if (new Set(funding.map((f) => f.time)).size !== funding.length)
    throw new Error("Duplicate funding hours; entry verdict unavailable.");
  const level = z.array(z.object({ px: positive, sz: positive }));
  const book = z
    .object({
      coin: z.literal("NEAR"),
      time: z.number().int().nonnegative(),
      levels: z.tuple([level, level]),
    })
    .parse(rawBook);
  const asks = book.levels[1];
  const depth = z
    .object({
      availableNotional: z.number().finite().min(0).max(1e15),
      impactBps: z.number().finite().nonnegative(),
    })
    .parse({
      availableNotional: asks
        .filter((a) => a.px <= context.markPx * 1.0025)
        .reduce((sum, a) => sum + a.px * a.sz, 0),
      impactBps: asks.length
        ? Math.max(0, (asks[0]!.px / context.markPx - 1) * 10_000)
        : 10_000,
    });
  return {
    markPrice: context.markPx,
    currentFundingRate: context.funding,
    funding,
    observedAt: book.time,
    fetchedAt: now,
    depth,
  };
}
export type Market = Awaited<ReturnType<typeof readMarket>>;
/** Isolated illustrative short; no real account state or execution. */
export function illustrativeRisk(
  market: Market,
  shortNotional: number,
  venueEquity: number,
  now = Date.now(),
) {
  return evaluateRisk({
    intent: "enter",
    shortNotional,
    venueEquity,
    now,
    observedAt: market.observedAt,
    maxDataAgeMs: 60_000,
    unresolvedOrders: 0,
    reconciled: true,
    depth: market.depth,
    funding: market.funding,
    state: { entryHalted: false },
    adl: false,
    unexpectedReductionQuantity: 0,
  });
}
/** Solve the domain maintenance model for an isolated fixed-quantity short; no fees/cross margin. */
export function liquidationDistance(
  notional: number,
  equity: number,
): number | null {
  if (notional <= 0 || equity <= maintenanceMargin(notional))
    return equity <= maintenanceMargin(notional) ? 0 : null;
  let lo = 0,
    hi = 1;
  const residual = (move: number) =>
    equity - notional * move - maintenanceMargin(notional * (1 + move));
  while (residual(hi) > 0 && hi < 1e6) hi *= 2;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    if (residual(mid) > 0) lo = mid;
    else hi = mid;
  }
  return ((lo + hi) / 2) * 100;
}
export function errorMessage(error: unknown) {
  if (error instanceof z.ZodError)
    return "Public API returned an unexpected data format. No verified data available.";
  if (error instanceof Error && /timeout|abort/i.test(error.name))
    return "Public API timed out. Retry when connectivity returns.";
  return error instanceof Error
    ? error.message
    : "Public data could not be loaded.";
}


/** Live testnet account observations, independent of historical evidence and mainnet risk inputs. */
export async function readVenue(address: string, startTime: number, fetcher: typeof fetch = fetch) {
  z.string().regex(/^0x[0-9a-fA-F]{40}$/).parse(address);
  z.number().int().nonnegative().parse(startTime);
  const [rawAccount, rawLedger] = await Promise.all([
    post(HL_TESTNET_API, { type: "clearinghouseState", user: address }, fetcher),
    post(HL_TESTNET_API, { type: "userNonFundingLedgerUpdates", user: address, startTime }, fetcher),
  ]);
  const account = z.object({
    marginSummary: z.object({ accountValue: numeric, totalMarginUsed: numeric }), withdrawable: numeric,
    assetPositions: z.array(z.object({ position: z.object({ coin: z.string(), szi: numeric }) })),
  }).parse(rawAccount);
  const ledger = z.array(z.object({ time: z.number().int().nonnegative(), hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    delta: z.object({ type: z.string() }).passthrough(),
  })).parse(rawLedger);
  return { account, ledger, fetchedAt: Date.now() };
}
