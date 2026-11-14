import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { assetUrl, loadJson } from "./data";
import { z } from "zod";
import { MAINNET_ACCOUNT, MAINNET_RPCS, bundledMainnetStatus, readMainnetStatus } from "./mainnet-data";
import { MainnetOverview, MainnetStatusView } from "./mainnet";

const response = (result: unknown) => new Response(JSON.stringify({ result }), { status: 200 });
const rpcFetch = (keyCount = 0, code = bundledMainnetStatus.codeHash) => vi.fn<typeof fetch>(async (_url, init) => {
  const { params } = JSON.parse(String(init?.body));
  if (params.request_type === "view_account") return response({
    code_hash: code, amount: "1", block_hash: "finalized-block", block_height: 234,
  });
  if (params.request_type === "view_access_key_list") return response({
    block_hash: "finalized-block", keys: Array.from({ length: keyCount }, () => ({ public_key: "public" })),
  });
  return response({ block_hash: "finalized-block", block_height: 234,
    result: [...new TextEncoder().encode(JSON.stringify({
      network: "Mainnet", paused: false, spot_balance: "0", signed_short_size: "0",
    }))] });
});
afterEach(() => vi.unstubAllEnvs());

describe("mainnet browser inspection", () => {
  it("reads only query methods and pins keys/state to the finalized account block", async () => {
    const fetcher = rpcFetch();
    const status = await readMainnetStatus(fetcher);
    expect(status).toMatchObject({ source: "live", keyCount: 0, codeMatches: true, blockHeight: 234, endpoint: MAINNET_RPCS[0] });
    const calls = fetcher.mock.calls.map(([url, init]) => ({ url, body: JSON.parse(String(init?.body)) }));
    expect(calls).toHaveLength(3);
    expect(calls.every(c => c.url === MAINNET_RPCS[0] && c.body.method === "query" && c.body.params.account_id === MAINNET_ACCOUNT)).toBe(true);
    expect(calls[0]!.body.params.finality).toBe("final");
    expect(calls.slice(1).every(c => c.body.params.block_id === "finalized-block")).toBe(true);
  });
  it("uses the public fallback when the primary is unavailable", async () => {
    const good = rpcFetch();
    const fetcher = vi.fn<typeof fetch>(async (url, init) => {
      if (url === MAINNET_RPCS[0]) throw new Error("CORS/network failure");
      return good(url, init);
    });
    expect((await readMainnetStatus(fetcher)).endpoint).toBe(MAINNET_RPCS[1]);
    expect(fetcher.mock.calls).toHaveLength(4);
  });
  it("does not disguise new keys or changed code as keyless verification", async () => {
    const changed = await readMainnetStatus(rpcFetch(1, "different"));
    expect(changed).toMatchObject({ source: "live", keyCount: 1, codeMatches: false });
    const html = renderToStaticMarkup(<MainnetStatusView status={changed} loading={false} error={null} retry={() => {}} />);
    expect(html).toContain("WARNING: account is not keyless");
    expect(html).toContain("WARNING: code differs");
  });
  it("rejects malformed or mixed-block responses instead of reporting success", async () => {
    const invalid = vi.fn<typeof fetch>(async () => response({ block_hash: "other", block_height: 1, code_hash: "hash", amount: "0" }));
    await expect(readMainnetStatus(invalid)).rejects.toThrow();
    const valid = rpcFetch();
    await expect(readMainnetStatus(async (url, init) => {
      const params = JSON.parse(String(init?.body)).params;
      if (params.request_type === "view_access_key_list") return response({ block_hash: "wrong", keys: [] });
      return valid(url, init);
    })).rejects.toThrow();
  });
  it("retains an explicitly dated embedded snapshot on total public-read failure", async () => {
    await expect(readMainnetStatus(async () => { throw new Error("offline"); })).rejects.toThrow("offline");
    expect(bundledMainnetStatus).toMatchObject({ source: "bundled", keyCount: 0, shortReservation: "0", spotBalance: "0" });
    const html = renderToStaticMarkup(<MainnetStatusView status={bundledMainnetStatus} loading={false} error="offline" retry={() => {}} />);
    expect(html).toContain("Bundled mainnet evidence");
    expect(html).toContain("not a live verification");
    expect(html).toContain("2026-11-14T13:36:58.927Z");
    expect(html).toContain("Refresh mainnet status");
    expect(html).not.toContain("Live mainnet status");
  });
  it("keeps downloads under the GitHub Pages base and first-screen explorer links public", async () => {
    vi.stubEnv("BASE_URL", "/counterweight/");
    expect(assetUrl("data/lifecycle-v4.json")).toBe("/counterweight/data/lifecycle-v4.json");
    const fetcher = vi.fn<typeof fetch>(async () => new Response('{"ok":true}'));
    await loadJson("data/lifecycle-v4.json", z.object({ ok: z.boolean() }), fetcher);
    expect(fetcher.mock.calls[0]![0]).toBe("/counterweight/data/lifecycle-v4.json");
    const html = renderToStaticMarkup(<MainnetOverview />);
    for (const host of ["https://nearblocks.io/", "https://app.hyperliquid.xyz/", "https://arbiscan.io/"]) expect(html).toContain(host);
    expect(html).toContain("0 access keys");
    expect(html).toContain("17.886709 USDC");
  });
});
