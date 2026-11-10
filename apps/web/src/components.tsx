import { useEffect, useRef, useState, type ReactNode } from "react";
import { errorMessage } from "./data";
import { date, formatNumber, pct, usd } from "./model";

export function useResource<T>(
  loader: () => Promise<T>,
  dependencies: unknown[] = [],
) {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ data: null, error: null, loading: true });
    void loader()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (active)
          setState({ data: null, error: errorMessage(error), loading: false });
      });
    return () => {
      active = false;
    };
    // Loaders are deliberately keyed by the explicit inputs at each call site.
  }, [...dependencies, version]);
  return { ...state, retry: () => setVersion((v) => v + 1) };
}
export function Notice({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "warning" | "good";
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "warning" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function ResourceState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  if (loading)
    return (
      <div className="loading" role="status">
        <span className="pulse" />
        Reading public data…
      </div>
    );
  if (error)
    return (
      <Notice tone="warning">
        <strong>Data unavailable.</strong> {error}{" "}
        <button className="text-button" onClick={retry}>
          Try again
        </button>
      </Notice>
    );
  return null;
}
export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
export function SectionHead({
  number,
  label,
  title,
  children,
}: {
  number: string;
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow">
          {number} / {label}
        </p>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function Architecture() {
  return (
    <div
      className="architecture"
      aria-label="Owner configures policy; keeper requests bounded actions; policy requests NEAR MPC signatures for a Hyperliquid account; owner approves NEAR Intents rebalancing"
    >
      <div className="flow">
        <div className="flow-node">
          <span className="node-icon">01</span>
          <strong>Owner</strong>
          <small>Sets the boundaries</small>
        </div>
        <div className="connector">
          <svg viewBox="0 0 60 20" aria-hidden="true">
            <path d="M0 10H57m-6-5 6 5-6 5" />
          </svg>
        </div>
        <div className="flow-node policy-node">
          <span className="node-icon">02</span>
          <strong>Policy contract</strong>
          <small>Enforces signing limits</small>
        </div>
        <div className="connector">
          <svg viewBox="0 0 60 20" aria-hidden="true">
            <path d="M0 10H57m-6-5 6 5-6 5" />
          </svg>
        </div>
        <div className="flow-node">
          <span className="node-icon">03</span>
          <strong>NEAR MPC</strong>
          <small>v1.signer · Chain Signatures</small>
        </div>
        <div className="connector">
          <svg viewBox="0 0 60 20" aria-hidden="true">
            <path d="M0 10H57m-6-5 6 5-6 5" />
          </svg>
        </div>
        <div className="flow-node">
          <span className="node-icon">04</span>
          <strong>Hyperliquid</strong>
          <small>Policy-derived account</small>
        </div>
      </div>
      <div className="flow-support">
        <span>
          <i />
          Keeper <small>monitors risk · requests constrained closes</small>
        </span>
        <span>
          <i />
          NEAR Intents{" "}
          <small>owner-approved rebalancing · prototype route</small>
        </span>
      </div>
    </div>
  );
}
export type ChartLine = {
  label: string;
  color: string;
  points: { time: number; value: number | null }[];
};
export function Chart({
  title,
  lines,
  unit = "usd",
  note,
}: {
  title: string;
  lines: ChartLine[];
  unit?: "usd" | "pct";
  note: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(880);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured) setWidth(Math.max(280, measured));
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  const valid = lines.flatMap((l) =>
    l.points.filter(
      (p): p is { time: number; value: number } =>
        p.value !== null && Number.isFinite(p.value),
    ),
  );
  if (!valid.length)
    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <p>No comparable observations in this period.</p>
      </div>
    );
  const minTime = Math.min(...valid.map((p) => p.time)),
    maxTime = Math.max(...valid.map((p) => p.time));
  const minValue = Math.min(...valid.map((p) => p.value)),
    maxValue = Math.max(...valid.map((p) => p.value));
  const padding = (maxValue - minValue || 1) * 0.12;
  const lo = minValue - padding,
    hi = maxValue + padding;
  const x = (time: number) =>
    66 + ((time - minTime) / (maxTime - minTime || 1)) * (width - 88);
  const y = (value: number) => 24 + ((hi - value) / (hi - lo)) * 200;
  const format = unit === "usd" ? usd : pct;
  const selectedTime =
    hover === null ? null : minTime + hover * (maxTime - minTime);
  return (
    <figure className="chart-card">
      <figcaption>
        <h3>{title}</h3>
        <div className="legend">
          {lines.map((l) => (
            <span key={l.label}>
              <i style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </figcaption>
      <svg
        ref={svgRef}
        className="chart"
        viewBox={`0 0 ${width} 270`}
        role="img"
        aria-label={`${title}. ${note}`}
        onPointerLeave={() => setHover(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          setHover(
            Math.max(
              0,
              Math.min(
                1,
                (((e.clientX - box.left) / box.width) * width - 66) /
                  (width - 88),
              ),
            ),
          );
        }}
      >
        <title>{title}</title>
        <desc>{note}</desc>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const value = lo + t * (hi - lo);
          return (
            <g key={t}>
              <line
                x1="66"
                x2={width - 22}
                y1={y(value)}
                y2={y(value)}
                className="grid-line"
              />
              <text x="55" y={y(value) + 4} textAnchor="end">
                {unit === "pct"
                  ? `${formatNumber(value, 1)}%`
                  : formatNumber(value, 2)}
              </text>
            </g>
          );
        })}
        {lo < 0 && hi > 0 && (
          <line
            x1="66"
            x2={width - 22}
            y1={y(0)}
            y2={y(0)}
            className="zero-line"
          />
        )}
        {lines.map((l) => {
          let open = false;
          const d = l.points
            .map((p) => {
              if (p.value === null) {
                open = false;
                return "";
              }
              const command = `${open ? "L" : "M"}${x(p.time).toFixed(1)},${y(p.value).toFixed(1)}`;
              open = true;
              return command;
            })
            .join(" ");
          return (
            <path
              key={l.label}
              d={d}
              fill="none"
              stroke={l.color}
              strokeWidth="2.2"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        <text x="66" y="255">
          {date(minTime)}
        </text>
        <text x={width - 22} y="255" textAnchor="end">
          {date(maxTime)}
        </text>
        {selectedTime !== null && (
          <line
            x1={x(selectedTime)}
            x2={x(selectedTime)}
            y1="24"
            y2="224"
            className="hover-line"
          />
        )}
      </svg>
      <div className="chart-readout" aria-live="polite">
        {selectedTime === null ? (
          note
        ) : (
          <>
            <strong>{date(selectedTime)}</strong>
            {lines.map((l) => {
              const point = l.points
                .filter((p) => p.value !== null)
                .reduce<{ time: number; value: number | null } | null>(
                  (a, b) =>
                    !a ||
                    Math.abs(b.time - selectedTime) <
                      Math.abs(a.time - selectedTime)
                      ? b
                      : a,
                  null,
                );
              return (
                <span key={l.label}>
                  {l.label}: {format(point?.value)}{" "}
                  <small>(nearest observation)</small>
                </span>
              );
            })}
          </>
        )}
      </div>
    </figure>
  );
}
