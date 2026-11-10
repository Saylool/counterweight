import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { base58 } from "@scure/base";
import { z } from "zod";
import {
  DEFAULT_ACCOUNT,
  addressFromPublicKey,
  decodeView,
  illustrativeRisk,
  liquidationDistance,
  loadJson,
  readContract,
  readMarket,
} from "./data";
import {
  comparisonsFor,
  demoSchema,
  formatNumber,
  nearTransactionHashes,
  pct,
  reportSchema,
  usd,
} from "./model";
import { evaluateRisk } from "../../../packages/domain/src/index";

const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
const now = Date.UTC(2026, 10, 10, 12, 30),
  hour = 3_600_000;
const history = Array.from({ length: 26 }, (_, i) => ({
  coin: "NEAR",
  time: Math.floor(now / hour) * hour - (25 - i) * hour,
  fundingRate: "0.00001",
}));
const marketFetch = (funding = history, bookTime = now) =>
  vi.fn<typeof fetch>(async (_, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.type === "metaAndAssetCtxs")
      return response([
        { universe: [{ name: "BTC" }, { name: "NEAR" }] },
        [
          { markPx: "50000", funding: "0" },
          { markPx: "3.5", funding: "0.00001" },
        ],
      ]);
    if (body.type === "fundingHistory") return response(funding);
    return response({
      coin: "NEAR",
      time: bookTime,
      levels: [
        [{ px: "3.499", sz: "1000" }],
        [
          { px: "3.501", sz: "1000" },
          { px: "4", sz: "1" },
        ],
      ],
    });
  });
const view = (data: unknown, block = "final-block") => ({
  block_hash: block,
  block_height: 42,
  result: [...new TextEncoder().encode(JSON.stringify(data))],
});
const state = {
  owner: "owner.testnet",
  keeper: "keeper.testnet",
  paused: false,
  derivation_path: "counterweight-1",
  signer_account: "v1.signer-prod.testnet",
  limits: { max_short_size: "1" },
  signing_limits: { keeper_per_block: 2 },
  outstanding: [],
  operation_id: "2",
  last_nonce: "100",
  daily_usage: "0",
  keeper_weight_used: "10",
  keeper_weight_limit: "5000",
};
const publicKey =
  "secp256k1:" +
  base58.encode(
    Uint8Array.from(
      Buffer.from(
        "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" +
          "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
        "hex",
      ),
    ),
  );
const contractFetch = (
  keys: unknown[] = [],
  codeHash = "expected",
  failDerivation = false,
) =>
  vi.fn<typeof fetch>(async (_, init) => {
    const { params } = JSON.parse(String(init?.body));
    if (params.request_type === "view_account")
      return response({
        result: {
          block_hash: "final-block",
          block_height: 42,
          code_hash: codeHash,
        },
      });
    if (params.request_type === "view_access_key_list")
      return response({ result: { block_hash: "final-block", keys } });
    if (params.method_name === "get_state")
      return response({ result: view(state) });
    return failDerivation
      ? response({ error: { cause: { name: "UNAVAILABLE_SHARD" } } })
      : response({ result: view(publicKey) });
  });
const artifact = { sha256: "a".repeat(64), codeHash: "expected" };

describe("formatting", () => {
  it("formats money, negative values and percentages", () => {
    expect(usd(2500.124)).toBe("$2,500.12");
    expect(usd(-6.3)).toBe("−$6.30");
    expect(pct(0.0007, 5)).toBe("0.00070%");
  });
  it("never presents absent or nonfinite values as zero", () => {
    for (const value of [null, undefined, NaN, Infinity]) {
      expect(usd(value)).toBe("Unavailable");
      expect(pct(value)).toBe("Unavailable");
      expect(formatNumber(value)).toBe("Unavailable");
    }
  });
});
describe("static data loading", () => {
  it("extracts only public NEAR testnet transactions from both explorer URL formats", () => {
    const hash = "FAvY2YaKKFkri8nkC5X8ZMp8FfirtetWr5vThm746RPU";
    expect(
      nearTransactionHashes(
        `https://testnet.nearblocks.io/txns/${hash} https://explorer.testnet.near.org/transactions/${hash}`,
      ),
    ).toEqual([hash]);
    expect(
      nearTransactionHashes(
        "https://nearblocks.io/txns/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA https://example.com/txns/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      ),
    ).toEqual([]);
  });
  it("loads validated JSON with a base-aware URL", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ result: 3 }));
    expect(
      await loadJson("data/x.json", z.object({ result: z.number() }), fetcher),
    ).toEqual({ result: 3 });
    expect(String(fetcher.mock.calls[0]?.[0])).toMatch(/data\/x.json$/);
  });
  it("reports HTTP failures", async () => {
    await expect(
      loadJson("bad.json", z.unknown(), async () => response({}, 404)),
    ).rejects.toThrow("HTTP 404");
  });
  it("rejects malformed successful responses", async () => {
    await expect(
      loadJson("bad.json", z.object({ amount: z.number() }), async () =>
        response({ amount: "0" }),
      ),
    ).rejects.toThrow("Invalid data");
  });
  it("validates the real report and all period/size comparisons", () => {
    const report = reportSchema.parse(
      JSON.parse(
        readFileSync(
          new URL("../../../reports/replay-report.json", import.meta.url),
          "utf8",
        ),
      ),
    );
    for (const period of ["full", "training", "holdout"] as const)
      for (const label of ["demo", "illustrative", "large"]) {
        const rows = comparisonsFor(report, period, label);
        expect(rows).toHaveLength(3);
        expect(rows[0]?.netPnlUsd).toBe(
          report.comparisons.find(
            (r) =>
              r.policy === "hedged-rebalance" &&
              r.period === period &&
              r.label === label,
          )?.netPnlUsd,
        );
      }
    expect(() => comparisonsFor(report, "full", "missing")).toThrow("Missing");
  });
  it("rejects incomplete report comparisons before the page renders", () => {
    const source = JSON.parse(
      readFileSync(
        new URL("../../../reports/replay-report.json", import.meta.url),
        "utf8",
      ),
    );
    source.comparisons = source.comparisons.filter(
      (r: { period: string; label: string; policy: string }) =>
        !(
          r.period === "holdout" &&
          r.label === "demo" &&
          r.policy === "spot-holder"
        ),
    );
    expect(reportSchema.safeParse(source).success).toBe(false);
  });
  it("validates local proof, rejected attempts and dead-man provenance", () => {
    const demo = demoSchema.parse(
      JSON.parse(
        readFileSync(
          new URL("../../../reports/demo-local.json", import.meta.url),
          "utf8",
        ),
      ),
    );
    expect(demo.rogueAttempts.every((r) => r.rejected)).toBe(true);
    expect(demo.rogueAttempts).toHaveLength(7);
    expect(demo.transcript.some((t) => t.startsWith("DEAD-MAN"))).toBe(true);
    expect(demo.timeline.some((t) => t.action === "reduce-only close")).toBe(
      true,
    );
  });
});
describe("NEAR public views", () => {
  it("decodes UTF-8 and rejects mismatched blocks", () => {
    expect(decodeView(view("NEAR ✓"))).toBe("NEAR ✓");
    expect(() => decodeView(view(state), "different")).toThrow(
      "different block",
    );
  });
  it("derives the EVM address from public key bytes", () => {
    expect(addressFromPublicKey(publicKey)).toBe(
      "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
    );
    expect(() => addressFromPublicKey("ed25519:test")).toThrow("unsupported");
    expect(() => addressFromPublicKey("secp256k1:1")).toThrow("64 bytes");
  });
  it("pins every follow-up to the account block and only uses query", async () => {
    const fetcher = contractFetch([{ public_key: "public" }]);
    const data = await readContract(DEFAULT_ACCOUNT, artifact, fetcher);
    expect(data.keyCount).toBe(1);
    expect(data.codeMatches).toBe(true);
    expect(data.address).toBe("0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
    const calls = fetcher.mock.calls.map(([, init]) =>
      JSON.parse(String(init?.body)),
    );
    expect(calls.every((c) => c.method === "query")).toBe(true);
    expect(
      calls.slice(1).every((c) => c.params.block_id === "final-block"),
    ).toBe(true);
    expect(calls.at(-1).params.account_id).toBe(state.signer_account);
    expect(JSON.parse(atob(calls.at(-1).params.args_base64))).toEqual({
      predecessor: DEFAULT_ACCOUNT,
      path: state.derivation_path,
      domain_id: 0,
    });
  });
  it("exposes mismatched code and retains independently verified fields if derivation fails", async () => {
    const data = await readContract(
      DEFAULT_ACCOUNT,
      artifact,
      contractFetch([], "different", true),
    );
    expect(data.codeMatches).toBe(false);
    expect(data.keyCount).toBe(0);
    expect(data.address).toBeNull();
    expect(data.derivationError).toContain("UNAVAILABLE_SHARD");
  });
  it("does not turn an unknown account into a zero-key proof", async () => {
    await expect(
      readContract("missing.testnet", artifact, async () =>
        response({ error: { cause: { name: "UNKNOWN_ACCOUNT" } } }),
      ),
    ).rejects.toThrow("UNKNOWN_ACCOUNT");
  });
  it("validates testnet account before fetching", async () => {
    const fetcher = vi.fn<typeof fetch>();
    for (const a of ["owner.near", "https://evil.testnet", ".testnet"])
      await expect(readContract(a, artifact, fetcher)).rejects.toThrow(
        "testnet account",
      );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
describe("market and domain risk", () => {
  it("selects NEAR by metadata and evaluates the imported engine", async () => {
    const fetcher = marketFetch();
    const market = await readMarket(fetcher, now);
    expect(market.markPrice).toBe(3.5);
    expect(market.depth.availableNotional).toBe(3501);
    const risk = illustrativeRisk(market, 2500, 3000, now);
    expect(risk.metrics).toEqual(
      evaluateRisk({
        intent: "enter",
        shortNotional: 2500,
        venueEquity: 3000,
        now,
        observedAt: now,
        maxDataAgeMs: 60_000,
        unresolvedOrders: 0,
        reconciled: true,
        depth: market.depth,
        funding: market.funding,
        state: { entryHalted: false },
        adl: false,
        unexpectedReductionQuantity: 0,
      }).metrics,
    );
    expect(risk.entryBlocks).toEqual([]);
    expect(risk.funding.trailing24hRate).toBeCloseTo(0.00024);
    expect(
      fetcher.mock.calls.every(([url]) => String(url).endsWith("/info")),
    ).toBe(true);
  });
  it("blocks incomplete funding instead of extrapolating 24h", async () => {
    const market = await readMarket(marketFetch(history.slice(-10)), now);
    const risk = illustrativeRisk(market, 2500, 3000, now);
    expect(risk.funding.trailing24hRate).toBeNull();
    expect(risk.entryBlocks).toContain("funding-incomplete");
  });
  it("blocks stale observations", async () => {
    const market = await readMarket(marketFetch(history, now - 61_000), now);
    expect(illustrativeRisk(market, 2500, 3000, now).entryBlocks).toContain(
      "stale-data",
    );
  });
  it("rejects duplicate settlements", async () => {
    await expect(
      readMarket(marketFetch([...history, history[0]!]), now),
    ).rejects.toThrow("Duplicate");
  });
  it("handles upstream HTTP errors", async () => {
    await expect(
      readMarket(async () => response({}, 429), now),
    ).rejects.toThrow("HTTP 429");
  });
  it("computes an isolated liquidation proxy using the domain maintenance model", () => {
    expect(liquidationDistance(2500, 3000)).toBeCloseTo(
      ((3000 - 125) / 2625) * 100,
    );
    expect(liquidationDistance(2500, 0)).toBe(0);
    expect(liquidationDistance(0, 3000)).toBeNull();
  });
});
