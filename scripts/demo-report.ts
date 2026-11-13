import { rm, writeFile } from 'node:fs/promises';

/**
 * Only a passing run may replace the committed report (`reports/<base>.json/.md`), which the web build,
 * video checks and claims read. Any other status is written to `reports/<base>.failed.*` (git-ignored),
 * so a failed or interrupted run on a judge's machine never clobbers the last passing evidence.
 */
export function demoReportBase(base: string, status: unknown): string {
  return status === 'passed' ? base : `${base}.failed`;
}

export function demoReportLine(base: string, status: unknown): string {
  const target = demoReportBase(base, status);
  return target === base
    ? `REPORTS reports/${base}.md + reports/${base}.json (timeline, logs, receipts, assertions)`
    : `REPORTS reports/${target}.md + reports/${target}.json (run did not pass; last passing reports/${base}.json kept)`;
}

/** Writes the JSON/Markdown pair for this status; a passing run also removes any stale failed pair. */
export async function writeDemoReports(directory: string, base: string, status: unknown, json: string, markdown: string) {
  const target = demoReportBase(base, status);
  await writeFile(`${directory}${target}.json`, json);
  await writeFile(`${directory}${target}.md`, markdown);
  if (target === base) {
    await rm(`${directory}${base}.failed.json`, { force: true });
    await rm(`${directory}${base}.failed.md`, { force: true });
  }
  return target;
}
