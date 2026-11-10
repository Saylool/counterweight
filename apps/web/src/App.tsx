import { useState, type FormEvent } from "react";
import {
  Architecture,
  Chart,
  Notice,
  ResourceState,
  SectionHead,
  Stat,
  useResource,
} from "./components";
import {
  artifactSchema,
  comparisonsFor,
  date,
  demoSchema,
  evidenceSchema,
  formatNumber,
  pct,
  policyNames,
  reportSchema,
  usd,
  type Artifact,
  type Report,
} from "./model";
import {
  assetUrl,
  DEFAULT_ACCOUNT,
  illustrativeRisk,
  liquidationDistance,
  loadJson,
  readContract,
  readMarket,
  type Market,
} from "./data";

const sourceDocs = {
  near: "https://docs.near.org/api/rpc/contracts",
  hyperliquid:
    "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint",
};
function ContractPanel({ artifact }: { artifact: Artifact }) {
  const [account, setAccount] = useState(
    import.meta.env.VITE_POLICY_ACCOUNT || DEFAULT_ACCOUNT,
  );
  const [draft, setDraft] = useState(account);
  const result = useResource(
    () => readContract(account, artifact),
    [account, artifact],
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim() === account) result.retry();
    else setAccount(draft.trim());
  };
  const data = result.data;
  return (
    <>
      <form className="account-form" onSubmit={submit}>
        <label htmlFor="policy-account">Policy account · NEAR testnet</label>
        <div>
          <input
            id="policy-account"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={64}
            spellCheck={false}
          />
          <button disabled={result.loading}>
            Inspect account <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
      <ResourceState {...result} />
      {data && (
        <>
          <div className="panel-meta">
            <span className="badge">
              Finalized block {formatNumber(data.blockHeight, 0)}
            </span>
            <span>
              Observed {new Date(data.fetchedAt).toLocaleTimeString()}
            </span>
            <button className="text-button" onClick={result.retry}>
              Refresh
            </button>
          </div>
          <div className="stats four">
            <Stat label="Owner" value={<code>{data.state.owner}</code>} />
            <Stat label="Keeper" value={<code>{data.state.keeper}</code>} />
            <Stat
              label="Policy status"
              value={data.state.paused ? "Paused" : "Active"}
            />
            <Stat
              label="Access keys"
              value={data.keyCount}
              note={
                data.keyCount === 0
                  ? "No account access keys at this block"
                  : "Custody boundary incomplete"
              }
            />
          </div>
          {data.keyCount > 0 && (
            <Notice tone="warning">
              <strong>rehearsal deployment — key not yet removed</strong>
              <br />
              The account still has {data.keyCount} access{" "}
              {data.keyCount === 1 ? "key" : "keys"}. This deployment does not
              establish keyless policy custody.
            </Notice>
          )}
          <div className="contract-details">
            <div>
              <h3>Signing counters</h3>
              <dl className="key-values">
                <dt>Operation ID</dt>
                <dd>{data.state.operation_id}</dd>
                <dt>Outstanding authorizations</dt>
                <dd>{data.state.outstanding.length}</dd>
                <dt>Last signing nonce</dt>
                <dd>{data.state.last_nonce}</dd>
                <dt>Keeper weight used / limit</dt>
                <dd>
                  {data.state.keeper_weight_used} /{" "}
                  {data.state.keeper_weight_limit}
                </dd>
                <dt>Daily notional usage</dt>
                <dd>{usd(Number(data.state.daily_usage) / 1e6)}</dd>
              </dl>
            </div>
            <div>
              <h3>Configured limits</h3>
              <dl className="key-values">
                {Object.entries(data.state.limits).map(([key, value]) => (
                  <div className="definition-row" key={key}>
                    <dt>{key.replaceAll("_", " ")}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
              <small>
                Raw contract units: size in 10²⁴ NEAR; notional in 10⁶ USDC;
                time in seconds; bands in bps.
              </small>
            </div>
          </div>
          <details>
            <summary>Signing limits</summary>
            <dl className="key-values">
              {Object.entries(data.state.signing_limits).map(([key, value]) => (
                <div className="definition-row" key={key}>
                  <dt>{key.replaceAll("_", " ")}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          </details>
          <div className="verification">
            <span className={`badge ${data.codeMatches ? "good" : "warning"}`}>
              {data.codeMatches
                ? "Code matches committed WASM"
                : "Code mismatch · deployed artifact differs"}
            </span>
            <dl className="key-values">
              <dt>Live code hash (base58)</dt>
              <dd>
                <code>{data.codeHash}</code>
              </dd>
              <dt>Committed code hash (base58)</dt>
              <dd>
                <code>{artifact.codeHash}</code>
              </dd>
              <dt>Committed WASM SHA-256</dt>
              <dd>
                <code>{artifact.sha256}</code>
              </dd>
            </dl>
          </div>
          <div className="address-card">
            <span className="eyebrow">Derived Hyperliquid testnet address</span>
            {data.address ? (
              <a
                href={`https://app.hyperliquid-testnet.xyz/explorer/address/${data.address}`}
                target="_blank"
                rel="noreferrer"
              >
                <code>{data.address}</code> ↗
              </a>
            ) : (
              <Notice tone="warning">
                Address derivation unavailable: {data.derivationError}
              </Notice>
            )}
            <small>
              Public MPC derived-key view · {data.state.signer_account} · path{" "}
              {data.state.derivation_path}. Address derivation is not proof of
              funding or fills.
            </small>
          </div>
        </>
      )}
      <p className="source-note">
        Public <a href={sourceDocs.near}>NEAR RPC view calls</a> only. Account,
        keys, state and derived key are pinned to one finalized block. Refresh
        to re-check.
      </p>
    </>
  );
}
function RiskView({ market }: { market: Market }) {
  const [short, setShort] = useState(2500),
    [equity, setEquity] = useState(3000);
  const verdict = illustrativeRisk(market, short, equity);
  const distance = liquidationDistance(short, equity);
  return (
    <>
      <div className="stats three market-stats">
        <Stat
          label="NEAR mark price"
          value={usd(market.markPrice)}
          note="Hyperliquid mainnet · public market"
        />
        <Stat
          label="Current hourly funding"
          value={pct(market.currentFundingRate * 100, 5)}
          note="Positive funding pays the short"
        />
        <Stat
          label="Trailing 24h funding"
          value={pct(
            verdict.funding.trailing24hRate === null
              ? null
              : verdict.funding.trailing24hRate * 100,
            5,
          )}
          note={
            verdict.funding.complete24h
              ? "Sum of 24 completed hourly settlements"
              : "Incomplete settlement history; entry blocked"
          }
        />
      </div>
      <div className="risk-sandbox">
        <div className="sandbox-head">
          <h3>What would the risk engine say?</h3>
          <span className="badge">Illustrative position</span>
        </div>
        <div className="position-inputs">
          <label>
            Short notional · USD
            <input
              type="number"
              min="10"
              max="1000000"
              step="10"
              value={short}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) setShort(Math.max(0, Math.min(1e6, v)));
              }}
            />
          </label>
          <label>
            Venue equity · USD
            <input
              type="number"
              min="0"
              max="1000000"
              step="10"
              value={equity}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v))
                  setEquity(Math.max(0, Math.min(1e6, v)));
              }}
            />
          </label>
        </div>
        <div className="stats three">
          <Stat
            label="Effective leverage"
            value={
              verdict.metrics.leverage === null
                ? "Undefined"
                : `${formatNumber(verdict.metrics.leverage)}×`
            }
          />
          <Stat
            label="Stress headroom H"
            value={usd(verdict.metrics.headroom)}
            note="After +50% price stress, maintenance & reserve"
          />
          <Stat
            label="Liquidation distance proxy"
            value={distance === null ? "Unavailable" : `+${pct(distance)}`}
            note="Isolated short · upward price move"
          />
        </div>
        <Notice tone={verdict.entryBlocks.length ? "warning" : "good"}>
          <strong>
            Entry gate:{" "}
            {verdict.entryBlocks.length ? "BLOCKED" : "PASS (illustrative)"}
          </strong>
          <br />
          {verdict.entryBlocks.length
            ? verdict.entryBlocks.join(" · ")
            : "Domain data, funding, leverage, stress and depth gates pass for these inputs."}
        </Notice>
        <p className="source-note">
          Computed by <code>packages/domain</code>. Assumes a reconciled
          isolated short, no open orders or ADL. Uses live ask depth within 25
          bps; this is a risk gate, not a fill quote. Liquidation proxy solves
          the domain maintenance model; fees, cross margin and venue liquidation
          mechanics can change it. No account is queried.
        </p>
      </div>
    </>
  );
}
function MarketPanel() {
  const result = useResource(() => readMarket());
  return (
    <>
      <div className="panel-meta">
        <span className="badge">Mainnet observations · simulation only</span>
        <button
          className="text-button"
          disabled={result.loading}
          onClick={result.retry}
        >
          Refresh market
        </button>
      </div>
      <ResourceState {...result} />
      {result.data && (
        <>
          <RiskView market={result.data} />
          <p className="source-note">
            Book observed {new Date(result.data.observedAt).toLocaleString()} ·
            freshness gate: 60 seconds.{" "}
            <a href={sourceDocs.hyperliquid}>Hyperliquid public info API</a>.
          </p>
        </>
      )}
    </>
  );
}
function EvidencePanel() {
  const result = useResource(() =>
    loadJson("data/evidence.json", evidenceSchema),
  );
  return (
    <>
      <ResourceState {...result} />
      <div className="evidence-grid">
        {result.data?.map((item, index) => {
          const contract = item.name.includes("contract-proof"),
            preflight = item.name.includes("preflight");
          return (
            <article className="evidence-card" key={item.name}>
              <span className="evidence-number">
                E{String(index + 1).padStart(2, "0")}
              </span>
              <span
                className={`badge ${contract || preflight ? "warning" : ""}`}
              >
                {contract
                  ? "Rehearsal"
                  : preflight
                    ? "Historical preflight"
                    : "Signing boundary"}
              </span>
              <h3>
                {contract
                  ? "Policy signs. Venue recovers."
                  : preflight
                    ? "Know what was unproven."
                    : "MPC to Hyperliquid, verified."}
              </h3>
              <p>
                {contract
                  ? "A keeper requested a policy signature. Hyperliquid recovered the policy-derived address. An access key was still present; this is not the final keyless proof."
                  : preflight
                    ? "The earlier preflight found no policy account. Public derivation passed. The Intents quote was a dry mainnet preview and has expired; Intents has no testnet."
                    : "An owner-account cancel probe established MPC signature recovery at the derived address. It did not establish policy enforcement, funding or fills."}
              </p>
              {item.transactions.map((hash) => (
                <a
                  className="transaction-link"
                  key={hash}
                  href={`https://testnet.nearblocks.io/txns/${hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  NEAR testnet transaction <code>{hash}</code> ↗
                </a>
              ))}
              <details>
                <summary>Read source evidence</summary>
                <pre className="markdown-source">{item.markdown}</pre>
              </details>
              <a
                className="card-link"
                href={assetUrl(`evidence/${item.name}`)}
                target="_blank"
                rel="noreferrer"
              >
                Open original .md ↗
              </a>
            </article>
          );
        })}
      </div>
      <p className="source-note">
        Summaries refer to the bundled dated evidence; the contract panel shows
        current public state. “User does not exist” in a signing probe
        demonstrates recovered identity, not a funded or executed order.
      </p>
    </>
  );
}
function Results({ report }: { report: Report }) {
  const [period, setPeriod] = useState<"full" | "training" | "holdout">("full"),
    [label, setLabel] = useState("illustrative");
  const rows = comparisonsFor(report, period, label);
  const rebalance = rows[0]!;
  const colors = ["#67cba0", "#d4a66a", "#8ba9df"];
  return (
    <>
      <div className="results-controls">
        <div className="segmented" aria-label="Replay period">
          {(["full", "training", "holdout"] as const).map((p) => (
            <button
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
              key={p}
            >
              {p === "full"
                ? "Full window"
                : p === "training"
                  ? "In-sample"
                  : "Out-of-sample"}
            </button>
          ))}
        </div>
        <label>
          Spot budget
          <select value={label} onChange={(e) => setLabel(e.target.value)}>
            {report.comparisons
              .filter(
                (r) => r.period === "full" && r.policy === "hedged-rebalance",
              )
              .map((r) => (
                <option value={r.label} key={r.label}>
                  {usd(r.spotCapitalUsd)} · {r.label}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="results-lead">
        <div>
          <span className="eyebrow">
            Rebalance net result · all committed capital
          </span>
          <strong className="result-number">
            {usd(rebalance.netPnlUsd)}{" "}
            <small>{pct(rebalance.netReturnPct)}</small>
          </strong>
          <p>
            {date(rebalance.start)} – {date(rebalance.end)} (end exclusive) ·
            simulated execution
          </p>
        </div>
        <p className="result-comment">
          A hedge gives up NEAR price upside. Funding must cover costs, and spot
          gains cannot protect a separate margin account without a transfer.
        </p>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Policy comparison, scroll horizontally"
      >
        <table>
          <caption>
            Recorded mainnet data ·{" "}
            {period === "holdout"
              ? "out-of-sample"
              : period === "training"
                ? "in-sample"
                : "full-window"}{" "}
            results
          </caption>
          <thead>
            <tr>
              <th scope="col">Policy</th>
              <th scope="col">All capital</th>
              <th scope="col">Funding</th>
              <th scope="col">All costs</th>
              <th scope="col">Net PnL</th>
              <th scope="col">Return</th>
              <th scope="col">Max DD</th>
              <th scope="col">Min H¹</th>
              <th scope="col">Breach hours</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.policy}>
                <th scope="row">
                  <i className="legend-dot" style={{ background: colors[i] }} />
                  {policyNames[row.policy]}
                  {row.policy === "always-hedged" && (
                    <small>Theoretical · not executable</small>
                  )}
                </th>
                <td>{usd(row.initialCapitalUsd)}</td>
                <td>{usd(row.fundingPnlUsd)}</td>
                <td>{usd(row.totalCostsUsd)}</td>
                <td>{usd(row.netPnlUsd)}</td>
                <td>{pct(row.netReturnPct)}</td>
                <td>{pct(row.maxDrawdownPct)}</td>
                <td>
                  {row.minIntrabarStressHeadroomUsd === null
                    ? "n/a"
                    : usd(row.minIntrabarStressHeadroomUsd)}
                </td>
                <td
                  className={
                    row.maintenanceProxyBreachHours ? "warning-text" : ""
                  }
                >
                  {formatNumber(row.maintenanceProxyBreachHours, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Notice tone="warning">
        Always-hedged is theoretical:{" "}
        {formatNumber(rows[1]!.maintenanceProxyBreachHours, 0)}{" "}
        maintenance-proxy breach hours in this period. Its accounting return is
        not an executable return. Spot-holder capital excludes unused margin and
        retains directional NEAR exposure.
      </Notice>
      <Chart
        title="Return on committed capital"
        unit="pct"
        lines={rows.map((row, i) => ({
          label: policyNames[row.policy]!,
          color: colors[i]!,
          points: row.equityCurve.map((p) => ({
            time: p.time,
            value: (p.equityUsd / row.initialCapitalUsd - 1) * 100,
          })),
        }))}
        note="Returns include modeled costs; capital denominators differ. Curve preserves 12-hour bucket extrema. Hover for nearest sampled observation."
      />
      <div className="charts-two">
        <Chart
          title="NEAR price · strategy event snapshots"
          lines={[
            {
              label: "NEAR perp price",
              color: "#8ba9df",
              points: rebalance.events.map((e) => ({
                time: e.time,
                value: e.perpPrice,
              })),
            },
          ]}
          note="Price at recorded rebalance strategy events, connected for orientation; not a complete hourly price series."
        />
        <Chart
          title="Stress headroom H · event snapshots"
          lines={[
            {
              label: "Rebalance H",
              color: "#67cba0",
              points: rebalance.events.map((e) => ({
                time: e.time,
                value: e.stressHeadroomUsd ?? null,
              })),
            },
          ]}
          note="Recorded close-time event H, not intrabar minima. Gaps indicate no headroom observation. Connecting lines do not imply safety between events."
        />
      </div>
      <div className="methodology">
        <div>
          <h3>Frozen before holdout evaluation</h3>
          <p>
            Rule selected using {date(report.rebalanceSelection.trainingStart)}{" "}
            – {date(report.rebalanceSelection.trainingEndExclusive)}{" "}
            (exclusive). Lower / target / upper H-to-notional:{" "}
            <strong>
              {report.rebalanceSelection.rule.lower} /{" "}
              {report.rebalanceSelection.rule.target} /{" "}
              {report.rebalanceSelection.rule.upper}
            </strong>
            . Route latency: {report.rebalanceSelection.rule.latencyHours} hour.
          </p>
          <p>
            Retrospective chronological holdout on an already observed fixture.
            Each period starts fresh and pays setup costs. Period results are
            not additive.
          </p>
        </div>
        <div>
          <h3>What these numbers assume</h3>
          <p>
            ¹ Min H uses the adverse hourly high proxy. Historical depth, fills
            and route latency are assumptions. Zero sampled breaches do not
            establish liquidation safety.
          </p>
          <details>
            <summary>
              All report assumptions ({report.assumptions.length})
            </summary>
            <ol>
              {report.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </details>
        </div>
      </div>
      <p className="source-note">
        {formatNumber(report.provenance.completeHours, 0)} /{" "}
        {formatNumber(report.provenance.expectedHours, 0)} complete hours ·
        captured {date(report.provenance.capturedAt)} ·{" "}
        <a href={assetUrl("reports/replay-report.json")}>
          Original replay-report.json ↗
        </a>
        <br />
        Manifest SHA-256 <code>{report.provenance.manifestSha256}</code>
      </p>
    </>
  );
}
function ResultsPanel() {
  const result = useResource(() => loadJson("data/replay.json", reportSchema));
  return (
    <>
      <ResourceState {...result} />
      {result.data && <Results report={result.data} />}
    </>
  );
}
function DemoPanel() {
  const result = useResource(() => loadJson("data/demo.json", demoSchema));
  const d = result.data;
  return (
    <>
      <ResourceState {...result} />
      {d && (
        <>
          <Notice>
            Local sandbox · {d.status} · {date(d.finishedAt)}. MPC responses,
            fills, venue margin and route receipts are mocked. This is not a
            live trading demonstration.
          </Notice>
          <div className="stats three">
            <Stat
              label="Keeper close"
              value={
                d.assertions.keeperCloseSigned
                  ? "Signed in sandbox"
                  : "Not proven"
              }
              note="Mock MPC · stress-triggered close"
            />
            <Stat
              label="Rogue attempts rejected"
              value={`${d.rogueAttempts.filter((r) => r.rejected).length} / ${d.rogueAttempts.length}`}
              note="Contract boundary checks"
            />
            <Stat
              label="Dead-man recovery"
              value={
                d.assertions.unrelatedDeadmanSigned
                  ? "Bystander triggered"
                  : "Not proven"
              }
              note="Reduce-only recovery after timeout"
            />
          </div>
          <div className="demo-columns">
            <div>
              <h3>The keeper steps in</h3>
              <ol className="timeline">
                {d.timeline
                  .filter((t) => t.action !== "monitor")
                  .map((t, i) => (
                    <li key={i}>
                      <span className="timeline-marker" />
                      <div>
                        <small>
                          {t.hour === undefined
                            ? "Owner-approved rebalance"
                            : `Replay hour ${t.hour}`}
                        </small>
                        <strong>{t.action}</strong>
                        <p>
                          {t.result}
                          {t.headroomUsd !== undefined && (
                            <> · H {usd(t.headroomUsd)}</>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                <li>
                  <span className="timeline-marker" />
                  <div>
                    <small>Dead-man boundary</small>
                    <strong>Recovery stays available</strong>
                    {d.transcript
                      .filter((t) => t.startsWith("DEAD-MAN"))
                      .map((t) => (
                        <p key={t}>{t}</p>
                      ))}
                  </div>
                </li>
              </ol>
              <details>
                <summary>
                  All {d.timeline.length} replay timeline entries
                </summary>
                <ol className="full-timeline">
                  {d.timeline.map((t, i) => (
                    <li key={i}>
                      {t.hour === undefined ? "Owner phase" : `Hour ${t.hour}`}{" "}
                      · {t.action} · {t.result}
                      {t.nearPrice !== undefined
                        ? ` · NEAR ${usd(t.nearPrice)}`
                        : ""}
                    </li>
                  ))}
                </ol>
              </details>
            </div>
            <div>
              <h3>Seven ways a rogue fails</h3>
              <div className="rogue-list">
                {d.rogueAttempts.map((r) => (
                  <details key={r.name}>
                    <summary>
                      <span
                        className={r.rejected ? "reject-dot" : "warning-text"}
                      >
                        {r.rejected ? "×" : "!"}
                      </span>
                      {r.name}
                      <span className="status-label">
                        {r.rejected ? "Rejected" : "Accepted"}
                      </span>
                    </summary>
                    <code>{r.error}</code>
                    <p>{r.explanation}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
          <details>
            <summary>Mock boundaries & assertions</summary>
            <ul>
              {[...d.mocked, ...d.boundaries].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <dl className="key-values">
              {Object.entries(d.assertions).map(([key, value]) => (
                <div className="definition-row" key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          </details>
          <p className="source-note">
            <a href={assetUrl("reports/demo-local.json")}>
              Original demo-local.json ↗
            </a>{" "}
            · Local transaction hashes belong to the sandbox and are not linked
            to a public explorer.
          </p>
        </>
      )}
    </>
  );
}
export default function App() {
  const artifact = useResource(() =>
    loadJson("data/artifact.json", artifactSchema),
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a href="#" className="brand">
          <span className="brand-symbol" aria-hidden="true">
            <i />
            <i />
          </span>
          counterweight<span className="brand-period">.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#live">Live state</a>
          <a href="#evidence">Evidence</a>
          <a href="#results">Results</a>
          <a href="#demo">Local demo</a>
        </nav>
        <span className="read-only">
          <i />
          Read-only
        </span>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-top">
            <p className="eyebrow">
              <span className="mini-dot" />
              NEAR × Hyperliquid · testnet prototype
            </p>
            <span className="hero-tag">A hedge with boundaries.</span>
          </div>
          <h1>
            Reduce-only
            <br />
            <em>by construction</em>
            <span className="accent-dot">.</span>
          </h1>
          <div className="hero-bottom">
            <p className="hero-description">
              A policy-constrained hedge for NEAR holders: the owner sets
              signing limits, a keeper monitors risk, and NEAR MPC signs bounded
              Hyperliquid actions.
            </p>
            <a className="primary-link" href="#live">
              Inspect the boundary <span>↓</span>
            </a>
          </div>
          <Architecture />
          <div className="hero-footnote">
            <span>01 / Inspect public state</span>
            <span>02 / Verify the evidence</span>
            <span>03 / Read the honest results</span>
          </div>
          <p className="boundary-note">
            Emergency closes are reduce-only; ordinary opens remain bounded by
            owner-set caps. Stress H is keeper policy, not a contract price
            oracle. The rehearsal is not yet a keyless deployment.
          </p>
        </section>
        <section id="live" className="section">
          <SectionHead
            number="01"
            label="Public contract"
            title="Trust the state. Check the keys."
          >
            <span className="section-tag">NEAR testnet</span>
          </SectionHead>
          <div className="panel">
            <ResourceState {...artifact} />
            {artifact.data && <ContractPanel artifact={artifact.data} />}
          </div>
        </section>
        <section id="market" className="section">
          <SectionHead
            number="02"
            label="Live market & risk"
            title="Carry is earned. Risk is measured."
          />
          <div className="panel">
            <MarketPanel />
          </div>
        </section>
        <section id="evidence" className="section">
          <SectionHead
            number="03"
            label="Evidence trail"
            title="Proof, with its limits attached."
          />
          <EvidencePanel />
        </section>
        <section id="results" className="section">
          <SectionHead
            number="04"
            label="Honest results"
            title="The hedge is not free upside."
          >
            <span className="section-tag">Historical simulation</span>
          </SectionHead>
          <div className="panel">
            <ResultsPanel />
          </div>
        </section>
        <section id="demo" className="section">
          <SectionHead
            number="05"
            label="Local demonstration"
            title="A keeper closes. A rogue cannot."
          />
          <div className="panel">
            <DemoPanel />
          </div>
        </section>
      </main>
      <footer>
        <a className="brand" href="#">
          counterweight<span className="brand-period">.</span>
        </a>
        <p>Testnet prototype. Not a fund, not investment advice.</p>
        {import.meta.env.VITE_REPO_URL ? (
          <a
            href={import.meta.env.VITE_REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            Source repository ↗
          </a>
        ) : (
          <span className="repo-placeholder">
            Repository link · coming soon
          </span>
        )}
      </footer>
    </>
  );
}
