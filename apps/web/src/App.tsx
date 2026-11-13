import { useState, type FormEvent } from "react";
import {
  Architecture,
  Chart,
  ContractLimit,
  Notice,
  ResourceState,
  SectionHead,
  Stat,
  useResource,
} from "./components";
import {
  lifecycleSchema,
  type LifecycleSummary,
  artifactsSchema,
  comparisonsFor,
  date,
  demoSchema,
  evidenceSchema,
  formatNumber,
  pct,
  policyNames,
  reportSchema,
  usd,
  type Artifacts,
  type Report,
} from "./model";
import {
  assetUrl,
  DEFAULT_ACCOUNT,
  REHEARSAL_ACCOUNT,
  V3_ACCOUNT,
  readVenue,
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
export function ContractPanel({ artifact }: { artifact: Artifacts }) {
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
      <div className="segmented" aria-label="Deployment selection">
        {[{ value: DEFAULT_ACCOUNT, label: "v2 · funded keyless lifecycle" },
          { value: V3_ACCOUNT, label: "v3 · separate keyless deployment" },
          { value: REHEARSAL_ACCOUNT, label: "v1 · rehearsal with an access key" }].map(({ value, label }) => (
          <button key={value} aria-pressed={account === value} onClick={() => { setDraft(value); setAccount(value); }}>{label}</button>
        ))}
      </div>
      {account === REHEARSAL_ACCOUNT && <Notice tone="warning">v1 rehearsal deployment with an access key. Use v2 for funded keyless evidence.</Notice>}
      {account === V3_ACCOUNT && <Notice tone="warning">
        V3 authorizes paused and out-of-band reduce-only IOC buys up to the supplied mark +1%.
        IOC orders can partially fill or fail to fill; fees are additional.
        <strong> The mark is unauthenticated: a malicious caller can submit a false high mark</strong>
        {" "}within the sanity range and authorize an adverse buyback up to that mark +1%.
        The cap does not guarantee 1% against the true market. On 12 November, v3 closed
        3.6 NEAR reduce-only to flat on testnet inside the opening band.
        Paused and out-of-band exit authorization is locally tested; IOC fills are not guaranteed.
        Opens require an owner margin attestation at most 30 seconds old; the keeper can reduce alone.
      </Notice>}
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
                    <dd><ContractLimit name={key} value={String(value)} /></dd>
                  </div>
                ))}
              </dl>
              <small>
                Raw contract units: 10²⁴ raw size units per NEAR; 10⁶ raw notional units per USDC;
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
                : data.codeMatches === null ? "Code comparison unavailable · no deployment artifact configured"
                : "Code mismatch · deployed artifact differs"}
            </span>
            <dl className="key-values">
              <dt>Live code hash (base58)</dt>
              <dd>
                <code>{data.codeHash}</code>
              </dd>
              <dt>Committed {data.artifactVersion ?? "deployment"} code hash (base58)</dt>
              <dd>
                <code>{data.expectedArtifact?.codeHash ?? "Unconfigured account"}</code>
              </dd>
              <dt>Committed WASM SHA-256</dt>
              <dd>
                <code>{data.expectedArtifact?.sha256 ?? "Unconfigured account"}</code>
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
      {(account === V3_ACCOUNT || account === DEFAULT_ACCOUNT) && <VenuePanel
        address={account === V3_ACCOUNT ? "0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5" : "0x3e72c8963761c3f436710df9b891d8e3a74b5390"}
        startTime={account === V3_ACCOUNT ? 1794504000000 : 1794330000000}
      />}
      <p className="source-note">
        Public <a href={sourceDocs.near}>NEAR RPC view calls</a> only. Account,
        keys, state and derived key are pinned to one finalized block. Refresh
        to re-check.
      </p>
    </>
  );
}
export function LifecycleTable({ summary }: { summary: LifecycleSummary }) {
  const isV3 = summary.policy === V3_ACCOUNT;
  return <>
    <p><strong>{summary.policy}</strong> · zero access keys verified in dated evidence · {summary.date}.</p>
    <p><a href={`https://app.hyperliquid-testnet.xyz/explorer/address/${summary.address}`} target="_blank" rel="noreferrer">
      Derived Hyperliquid testnet address: <code>{summary.address}</code> ↗</a></p>
    <div className="table-scroll" role="region" aria-label="Funded testnet lifecycle evidence" tabIndex={0}>
      <table className="lifecycle-table"><caption>Recorded funded lifecycle · supervised owner steps</caption>
        <thead><tr><th scope="col">Step</th><th scope="col">Result</th><th scope="col">NEAR testnet transaction</th><th scope="col">Evidence</th></tr></thead>
        <tbody>{summary.steps.map(row => <tr key={row.step}>
          <th scope="row">{row.step}</th><td>{row.result}</td>
          <td>{row.tx ? <a href={`https://testnet.nearblocks.io/txns/${row.tx}`} target="_blank" rel="noreferrer"><code>{row.tx}</code> ↗</a> : "—"}</td>
          <td><a href={assetUrl(`evidence/${row.evidence}`)}>Source record ↗</a></td>
        </tr>)}</tbody>
      </table>
    </div>
    {summary.withdrawalHash && <p>Withdrawal ledger: <a href={`https://app.hyperliquid-testnet.xyz/explorer/tx/${summary.withdrawalHash}`}><code>{summary.withdrawalHash}</code> ↗</a>.
      Fixed recipient: <code>{summary.recipient}</code>. Destination-chain arrival is unverified.</p>}
    {isV3 ? <p>Owner-assisted open · keeper-only close. Zero keys at both order receipt blocks.
      Owner-reported settlement succeeded after open expiry; current state not re-read.
      The archived status precedes settlement. No v3 withdrawal is claimed; 4 wNEAR remain in v3 custody and directional.
      This live close was in-band; paused and out-of-band authorization is locally tested. IOC fills are not guaranteed.</p>
      : <p>Owner funding and the 49 USDC spot→perp transfer preceded key removal. Keeper trading and withdrawal
      were checked with zero keys at their receipt blocks.</p>}
    <Notice tone="warning">Testnet only; supervised owner funding, observations, settlement and withdrawal approval.
      UI Send lands in spot. Intents has only dry quotes. No multi-day carry or live rebalancing route is proven.
      The contract does not verify venue fills on-chain; the 4 wNEAR spot leg remains directional after closing.</Notice>
    <p><a href={assetUrl(`evidence/${isV3 ? "2026-11-12-v3" : "2026-11-10"}-lifecycle-summary.md`)}>Read the full lifecycle summary ↗</a></p>
  </>;
}
export function VenuePanel({ address, startTime }: { address: string; startTime: number }) {
  const result = useResource(() => readVenue(address, startTime), [address, startTime]);
  const data = result.data;
  return <>
    <div className="panel-meta"><h3>Live position, margin & ledger</h3><button onClick={result.retry} disabled={result.loading}>Refresh testnet account</button></div>
    <p className="source-note">Public Hyperliquid testnet reads for <code>{address}</code>. Separate from the dated lifecycle and mainnet risk illustration below.</p>
    <ResourceState {...result} />
    {data && <>
      <div className="stats three">
        <Stat label="NEAR position" value={`${data.account.assetPositions.filter(p => p.position.coin === "NEAR").reduce((n, p) => n + p.position.szi, 0)} NEAR`} />
        <Stat label="Account equity" value={usd(data.account.marginSummary.accountValue)} />
        <Stat label="Margin used" value={usd(data.account.marginSummary.totalMarginUsed)} />
        <Stat label="Withdrawable" value={usd(data.account.withdrawable)} />
      </div>
      <p>Observed {new Date(data.fetchedAt).toLocaleString()}. Ledger since {new Date(startTime).toISOString()}; API history limits may apply.</p>
      <div className="table-scroll" role="region" aria-label="Live testnet ledger" tabIndex={0}>
        <table className="ledger-table"><caption>Live non-funding ledger updates</caption><thead><tr><th>Time (UTC)</th><th>Type</th><th>Details (API values)</th><th>Hyperliquid hash</th></tr></thead>
          <tbody>{data.ledger.map(entry => <tr key={`${entry.hash}-${entry.time}`}>
            <td>{new Date(entry.time).toISOString()}</td><td>{entry.delta.type}</td><td><code>{JSON.stringify(entry.delta)}</code></td>
            <td><a href={`https://app.hyperliquid-testnet.xyz/explorer/tx/${entry.hash}`}><code>{entry.hash}</code> ↗</a></td>
          </tr>)}</tbody></table>
      </div>
      {data.ledger.length === 0 && <p>No ledger updates returned for this window.</p>}
      <details><summary>All current positions</summary><pre>{JSON.stringify(data.account.assetPositions, null, 2)}</pre></details>
    </>}
  </>;
}
function FundedLifecycle({ file }: { file: string }) {
  const result = useResource(() => loadJson(file, lifecycleSchema), [file]);
  return <><ResourceState {...result} />{result.data && <>
    <LifecycleTable summary={result.data} />
  </>}</>;
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
        {result.data?.filter((item) => /signing-proof|contract-proof|testnet-preflight/.test(item.name)).map((item, index) => {
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
    loadJson("data/artifacts.json", artifactsSchema),
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
          <a href="#lifecycle">Funded lifecycle</a>
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
            Funded testnet.
            <br />
            <em>Keyless policy</em>
            <span className="accent-dot">.</span>
          </h1>
          <div className="hero-bottom">
            <p className="hero-description">
              After owner funding and key removal, a NEAR policy holding 4 wNEAR
              authorized a keeper short and reduce-only close on Hyperliquid testnet.
              V2 records a fixed-recipient withdrawal; on 12 November, v3 opened
              and closed a 3.6 NEAR short, followed by owner-reported settlement. Owner-assisted open; keeper-only close.
            </p>
            <a className="primary-link" href="#lifecycle">
              Inspect the funded lifecycle <span>↓</span>
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
            oracle. This was a supervised testnet run; owner steps remain trusted. No multi-day carry or live Intents settlement is proven.
          </p>
        </section>
        <section id="lifecycle" className="section">
          <SectionHead number="01" label="2026-11-12 v3 · 2026-11-10 v2" title="Funded testnet lifecycle" />
          <div className="panel"><h3>12 November · keyless v3 open/close/settlement</h3><FundedLifecycle file="data/lifecycle-v3.json" /></div>
          <div className="panel"><h3>10 November · historical keyless v2 lifecycle</h3><FundedLifecycle file="data/lifecycle.json" /></div>
        </section>
        <section id="live" className="section">
          <SectionHead
            number="02"
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
            number="03"
            label="Live market & risk"
            title="Carry is earned. Risk is measured."
          />
          <div className="panel">
            <MarketPanel />
          </div>
        </section>
        <section id="evidence" className="section">
          <SectionHead
            number="04"
            label="Evidence trail"
            title="Proof, with its limits attached."
          />
          <EvidencePanel />
        </section>
        <section id="results" className="section">
          <SectionHead
            number="05"
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
            number="06"
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
        <a
          href={import.meta.env.VITE_REPO_URL || "https://github.com/Saylool/counterweight"}
          target="_blank"
          rel="noreferrer"
        >
          Source repository ↗
        </a>
      </footer>
    </>
  );
}
