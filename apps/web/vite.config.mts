import { defineConfig, type Plugin } from "vite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { base58 } from "@scure/base";
import {
  reportSchema,
  demoSchema,
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
  const bytes = readFileSync(
    `${root}contracts/policy/artifacts/counterweight_policy.wasm`,
  );
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (!read("contracts/policy/artifacts/SHA256SUMS").startsWith(`${sha256}  `))
    throw new Error("Committed WASM manifest mismatch");
  add("data/artifact.json", {
    sha256,
    codeHash: base58.encode(new Uint8Array(Buffer.from(sha256, "hex"))),
  });
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
  for (const name of ["replay-report.json", "demo-local.json"])
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
