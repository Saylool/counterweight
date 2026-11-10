import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";
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
    expect(html).toContain("Reduce-only");
    for (const id of ["live", "evidence", "market", "results", "demo"])
      expect(html).toContain(`id="${id}"`);
    expect(html).toContain(
      "Testnet prototype. Not a fund, not investment advice.",
    );
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
