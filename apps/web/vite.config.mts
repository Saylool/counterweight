import { defineConfig, type Plugin } from "vite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { base58 } from "@scure/base";
import {
  lifecycleSchema,
  reportSchema,
  demoSchema,
  v3DemoSchema,
  policies,
  nearTransactionHashes,
} from "./src/model";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path: string) => readFileSync(`${root}${path}`, "utf8");
/** Static, build-time copies: the browser never needs filesystem access or a server. */
function publicEvidence(): Plugin {
  const assets = new Map<string, { source: string; type: string }>();
  const add = (name: string, value: unknown) =>
    assets.set(name, {
      source: JSON.stringify(value),
      type: "application/json",
    });
  add("data/lifecycle.json", lifecycleSchema.parse(JSON.parse(read("docs/evidence/2026-11-10-lifecycle-summary.json"))));
  add("data/lifecycle-v3.json", lifecycleSchema.parse(JSON.parse(read("docs/evidence/2026-11-12-v3-lifecycle-summary.json"))));
  const report = reportSchema.parse(
    JSON.parse(read("reports/replay-report.json")),
  );
  report.comparisons = report.comparisons.filter((r) =>
    (policies as readonly string[]).includes(r.policy),
  );
  // Preserve the first/last point and local minima/maxima in each 12-hour bucket.
  for (const run of report.comparisons) {
    const points = run.equityCurve;
    const keep = new Set([0, points.length - 1]);
    for (let i = 0; i < points.length; i += 12) {
      const bucket = points.slice(i, i + 12);
      for (const extreme of [
        Math.min(...bucket.map((p) => p.equityUsd)),
        Math.max(...bucket.map((p) => p.equityUsd)),
      ])
        keep.add(i + bucket.findIndex((p) => p.equityUsd === extreme));
    }
    run.equityCurve = points.filter((_, i) => keep.has(i));
  }
  add("data/replay.json", report);
  add(
    "data/demo.json",
    demoSchema.parse(JSON.parse(read("reports/demo-local.json"))),
  );
  add("data/demo-v3.json", v3DemoSchema.parse(JSON.parse(read("reports/demo-local-v3.json"))));
  const manifest = read("contracts/policy/artifacts/SHA256SUMS").trim().split("\n");
  const artifacts = Object.fromEntries([
    ["v2", "counterweight_policy.wasm"],
    ["v3", "counterweight_policy_v3.wasm"],
  ].map(([version, filename]) => {
    const bytes = readFileSync(`${root}contracts/policy/artifacts/${filename}`);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (!manifest.includes(`${sha256}  artifacts/${filename}`))
      throw new Error(`Committed ${version} WASM manifest mismatch`);
    return [version, {
      sha256,
      codeHash: base58.encode(new Uint8Array(Buffer.from(sha256, "hex"))),
    }];
  }));
  add("data/artifacts.json", artifacts);
  const evidence = readdirSync(`${root}docs/evidence`).filter((n) =>
    /\.(md|json|txt)$/.test(n),
  );
  add(
    "data/evidence.json",
    evidence
      .filter((n) => n.endsWith(".md"))
      .map((name) => {
        const markdown = read(`docs/evidence/${name}`);
        const referencedText = [...markdown.matchAll(/\]\(([^)]+\.txt)\)/g)]
          .map((match) =>
            evidence.includes(match[1]!)
              ? read(`docs/evidence/${match[1]}`)
              : "",
          )
          .join("\n");
        return {
          name,
          markdown,
          transactions: nearTransactionHashes(markdown + "\n" + referencedText),
        };
      }),
  );
  for (const name of evidence)
    assets.set(`evidence/${name}`, {
      source: read(`docs/evidence/${name}`),
      type: name.endsWith(".json")
        ? "application/json"
        : "text/plain; charset=utf-8",
    });
  for (const name of ["replay-report.json", "demo-local.json", "demo-local-v3.json"])
    assets.set(`reports/${name}`, {
      source: read(`reports/${name}`),
      type: "application/json",
    });
  return {
    name: "counterweight-public-evidence",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURI((req.url ?? "").split("?")[0] ?? "");
        const base = server.config.base;
        const relative = pathname.startsWith(base)
          ? pathname.slice(base.length)
          : pathname.replace(/^\//, "");
        const asset = assets.get(relative);
        if (!asset) return next();
        res.setHeader("Content-Type", asset.type);
        res.end(asset.source);
      });
    },
    generateBundle() {
      for (const [fileName, asset] of assets)
        this.emitFile({ type: "asset", fileName, source: asset.source });
    },
  };
}
export default defineConfig({
  base: process.env.WEB_BASE_PATH || "./",
  plugins: [publicEvidence()],
  resolve: { dedupe: ["zod"] },
  build: { outDir: "dist" },
});
