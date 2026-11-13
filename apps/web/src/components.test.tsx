import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App, { ContractPanel, LifecycleTable } from "./App";
import { readFileSync } from "node:fs";
import { lifecycleSchema } from "./model";
import { Architecture, Chart, ContractLimit, Notice, ResourceState, Stat } from "./components";

describe("read-only presentation", () => {
  it("shows NEAR and USDC beside exact raw contract limits without losing small amounts", () => {
    for (const [name, value, display] of [
      ["max_short_size", "9300000000000000000000000", "9.3 NEAR"],
      ["max_short_size", "1", "0.000000000000000000000001 NEAR"],
      ["per_order_notional_cap", "10000000", "10 USDC"],
      ["per_day_notional_cap", "20000000", "20 USDC"],
      ["per_day_notional_cap", "1", "0.000001 USDC"],
    ]) {
      const html = renderToStaticMarkup(<ContractLimit name={name!} value={value!} />);
      expect(html).toContain(display);
      expect(html).toContain(`(raw: ${value})`);
    }
  });
  it("renders the product headline and all navigation sections", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Funded testnet.");
    expect(html.match(/<h1>(.*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, ""))
      .toBe("Funded testnet.Keyless policy.");
    for (const id of ["lifecycle", "live", "evidence", "market", "results", "demo"])
      expect(html).toContain(`id="${id}"`);
    expect(html).toContain(
      "Testnet prototype. Not a fund, not investment advice.",
    );
  });
  it("keeps v2 as default and puts the false-mark warning beside the v3 exit cap", () => {
    const artifacts = { v2: { sha256: "a".repeat(64), codeHash: "v2" }, v3: { sha256: "b".repeat(64), codeHash: "v3" } };
    const html = renderToStaticMarkup(<ContractPanel artifact={artifacts} />);
    expect(html).toContain('aria-pressed="true">v2');
    expect(html).toContain('v3 · separate keyless deployment');
    expect(html).toContain('Public Hyperliquid testnet reads for <code>0x3e72c8963761c3f436710df9b891d8e3a74b5390</code>');
    vi.stubEnv("VITE_POLICY_ACCOUNT", "policy-v3.counterweight-samet.testnet");
    try {
      const v3 = renderToStaticMarkup(<ContractPanel artifact={artifacts} />);
      expect(v3).toContain('supplied mark +1%');
      expect(v3).toContain('malicious caller can submit a false high mark');
      expect(v3).toContain('3.6 NEAR reduce-only to flat on testnet inside the opening band');
      expect(v3).toContain('out-of-band exit authorization is locally tested');
      expect(v3).toContain('IOC fills are not guaranteed');
      expect(v3).toContain('Public Hyperliquid testnet reads for <code>0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5</code>');
      expect(v3).not.toContain('0x3e72c8963761c3f436710df9b891d8e3a74b5390');
    } finally { vi.unstubAllEnvs(); }
  });
  it("renders each architecture actor with an accessible description", () => {
    const html = renderToStaticMarkup(<Architecture />);
    for (const s of [
      "Owner",
      "Policy contract",
      "NEAR MPC",
      "Hyperliquid",
      "Keeper",
      "NEAR Intents",
    ])
      expect(html).toContain(s);
    expect(html).toContain("aria-label=");
  });
  it("renders actionable API failures and explicit loading status", () => {
    const html = renderToStaticMarkup(
      <ResourceState
        loading={false}
        error="RPC unavailable"
        retry={() => {}}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Try again");
    expect(
      renderToStaticMarkup(
        <ResourceState loading error={null} retry={() => {}} />,
      ),
    ).toContain("Reading public data");
  });
  it("renders warnings and missing values without green success claims", () => {
    expect(
      renderToStaticMarkup(
        <Notice tone="warning">
          rehearsal deployment — key not yet removed
        </Notice>,
      ),
    ).toContain("rehearsal deployment");
    expect(
      renderToStaticMarkup(<Stat label="Funding" value="Unavailable" />),
    ).toContain("Unavailable");
  });
  it("renders accessible charts, including null gaps and constant series", () => {
    const html = renderToStaticMarkup(
      <Chart
        title="Headroom"
        note="Event snapshots"
        lines={[
          {
            label: "H",
            color: "#fff",
            points: [
              { time: 0, value: 5 },
              { time: 1, value: null },
              { time: 2, value: 5 },
            ],
          },
        ]}
      />,
    );
    expect(html).toContain('role="img"');
    expect(html).toContain("Event snapshots");
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");
  });
  it("states when no chart observations exist", () => {
    expect(
      renderToStaticMarkup(<Chart title="Empty" note="" lines={[]} />),
    ).toContain("No comparable observations");
  });
});

it("renders v3's supervised open/close/settlement without borrowing v2 withdrawal claims", () => {
  const summary = lifecycleSchema.parse(JSON.parse(readFileSync(new URL("../../../docs/evidence/2026-11-12-v3-lifecycle-summary.json", import.meta.url), "utf8")));
  const html = renderToStaticMarkup(<LifecycleTable summary={summary} />);
  for (const row of summary.steps) {
    expect(html).toContain(row.step);
    if (row.tx) expect(html).toContain(`https://testnet.nearblocks.io/txns/${row.tx}`);
    expect(html).toContain(`evidence/${row.evidence}`);
  }
  for (const text of ['3.6 NEAR @ 3.3788', '3.6 NEAR @ 3.3796', '48.986173', 'Owner-assisted open', 'keeper-only close', 'locally tested', 'Owner-reported settlement succeeded after open expiry', 'current state not re-read', '4 wNEAR remain in v3 custody and directional', 'No v3 withdrawal is claimed'])
    expect(html).toContain(text);
  expect(html).not.toContain('Withdrawal ledger:');
  expect(html).not.toContain('preceded key removal');
  expect(html).toContain('evidence/2026-11-12-v3-lifecycle-summary.md');
  const app = renderToStaticMarkup(<App />);
  expect(app).toContain('12 November · keyless v3 open/close/settlement');
  expect(app).toContain('10 November · historical keyless v2 lifecycle');
});


it("renders the recorded lifecycle and exact explorer links before simulated results", () => {
  const summary = lifecycleSchema.parse(JSON.parse(readFileSync(new URL("../../../docs/evidence/2026-11-10-lifecycle-summary.json", import.meta.url), "utf8")));
  const html = renderToStaticMarkup(<LifecycleTable summary={summary} />);
  for (const row of summary.steps) {
    expect(html).toContain(row.step);
    if (row.tx) expect(html).toContain(`https://testnet.nearblocks.io/txns/${row.tx}`);
  }
  expect(html).toContain(`https://app.hyperliquid-testnet.xyz/explorer/address/${summary.address}`);
  for (const limit of ["46.957074", "47.957074", "Destination-chain arrival is unverified", "dry quotes", "No multi-day carry"])
    expect(html).toContain(limit);
  const app = renderToStaticMarkup(<App />);
  expect(app.indexOf('id="lifecycle"')).toBeLessThan(app.indexOf('id="results"'));
});
