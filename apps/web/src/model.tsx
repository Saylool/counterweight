import { z } from "zod";

const finite = z.number().finite();
export const pointSchema = z.object({ time: finite, equityUsd: finite });
export const eventSchema = z.object({
  time: finite,
  type: z.string(),
  perpPrice: finite,
  reason: z.string(),
  stressHeadroomUsd: finite.nullable().optional(),
});
export const comparisonSchema = z.object({
  period: z.enum(["training", "holdout", "full"]),
  label: z.string(),
  policy: z.string(),
  start: finite,
  end: finite,
  initialCapitalUsd: finite,
  spotCapitalUsd: finite,
  netPnlUsd: finite,
  netReturnPct: finite,
  hedgedEnvelopeReturnPct: finite,
  fundingPnlUsd: finite,
  totalCostsUsd: finite,
  maxDrawdownPct: finite,
  minIntrabarStressHeadroomUsd: finite.nullable(),
  maintenanceProxyBreachHours: finite,
  rebalances: finite,
  heldHours: finite,
  windowHours: finite,
  equityCurve: z.array(pointSchema),
  events: z.array(eventSchema),
});
export const reportSchema = z
  .object({
    status: z.literal("complete"),
    provenance: z.object({
      capturedAt: z.string(),
      windowStart: finite,
      windowEndExclusive: finite,
      completeHours: finite,
      expectedHours: finite,
      manifestSha256: z.string(),
    }),
    assumptions: z.array(z.string()),
    comparisons: z.array(comparisonSchema).min(1),
    rebalanceSelection: z.object({
      trainingStart: finite,
      trainingEndExclusive: finite,
      objective: z.string(),
      rule: z.object({
        lower: finite,
        target: finite,
        upper: finite,
        latencyHours: finite,
      }),
    }),
  })
  .superRefine((report, context) => {
    const labels = new Set(report.comparisons.map((row) => row.label));
    for (const label of labels)
      for (const period of ["full", "training", "holdout"])
        for (const policy of [
          "hedged-rebalance",
          "always-hedged",
          "spot-holder",
        ]) {
          if (
            report.comparisons.filter(
              (row) =>
                row.label === label &&
                row.period === period &&
                row.policy === policy,
            ).length !== 1
          )
            context.addIssue({
              code: "custom",
              message: `Missing or duplicate comparison: ${period}/${label}/${policy}`,
            });
        }
  });
export type Report = z.infer<typeof reportSchema>;
export type Comparison = z.infer<typeof comparisonSchema>;
export const demoSchema = z.object({
  status: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
  policySha256: z.string(),
  mocked: z.array(z.string()),
  boundaries: z.array(z.string()),
  transcript: z.array(z.string()),
  timeline: z.array(
    z.object({
      hour: finite.optional(),
      time: finite.optional(),
      nearPrice: finite.optional(),
      headroomUsd: finite.optional(),
      historicalTime: finite.optional(),
      action: z.string(),
      result: z.string(),
    }),
  ),
  rogueAttempts: z.array(
    z.object({
      name: z.string(),
      error: z.string(),
      rejected: z.boolean(),
      explanation: z.string(),
    }),
  ),
  assertions: z.record(z.string(), z.union([z.boolean(), finite])),
});
export type Demo = z.infer<typeof demoSchema>;
export function nearTransactionHashes(text: string): string[] {
  return [
    ...new Set(
      [
        ...text.matchAll(
          /https:\/\/(?:testnet\.nearblocks\.io\/txns\/|explorer\.testnet\.near\.org\/transactions\/)([1-9A-HJ-NP-Za-km-z]{32,44})/g,
        ),
      ].map((match) => match[1]!),
    ),
  ];
}
export const evidenceSchema = z.array(
  z.object({
    name: z.string(),
    markdown: z.string(),
    transactions: z.array(z.string()),
  }),
);
export type Evidence = z.infer<typeof evidenceSchema>;
export const artifactSchema = z.object({
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  codeHash: z.string(),
});
export type Artifact = z.infer<typeof artifactSchema>;
export const policies = [
  "hedged-rebalance",
  "always-hedged",
  "spot-holder",
] as const;
export const policyNames: Record<string, string> = {
  "hedged-rebalance": "Hedged rebalance",
  "always-hedged": "Always hedged",
  "spot-holder": "Spot holder",
};
export function comparisonsFor(
  report: Report,
  period: Comparison["period"],
  label: string,
) {
  return policies.map((policy) => {
    const row = report.comparisons.find(
      (r) => r.period === period && r.label === label && r.policy === policy,
    );
    if (!row)
      throw new Error(`Missing ${policy} comparison for ${period}/${label}`);
    return row;
  });
}
export function formatNumber(value: number | null | undefined, digits = 2) {
  return value == null || !Number.isFinite(value)
    ? "Unavailable"
    : new Intl.NumberFormat("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value);
}
export function usd(value: number | null | undefined) {
  return value == null || !Number.isFinite(value)
    ? "Unavailable"
    : `${value < 0 ? "−" : ""}$${formatNumber(Math.abs(value))}`;
}
export function pct(value: number | null | undefined, digits = 2) {
  return value == null || !Number.isFinite(value)
    ? "Unavailable"
    : `${formatNumber(value, digits)}%`;
}
export function date(value: number | string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}


export const lifecycleSchema = z.object({
  date: z.string(), policy: z.literal("policy-v2.counterweight-samet.testnet"),
  address: z.string().regex(/^0x[0-9a-f]{40}$/), recipient: z.string().regex(/^0x[0-9a-f]{40}$/),
  ledgerStartTime: z.number().int().nonnegative(), withdrawalHash: z.string().regex(/^0x[0-9a-f]{64}$/),
  steps: z.array(z.object({ step: z.string(), tx: z.string().nullable(), result: z.string(), evidence: z.string() })),
});
export type LifecycleSummary = z.infer<typeof lifecycleSchema>;
