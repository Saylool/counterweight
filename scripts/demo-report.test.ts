import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { demoReportBase, demoReportLine, writeDemoReports } from './demo-report.js';

describe('demo report targets', () => {
  it('lets only a passing run replace the committed report', () => {
    expect(demoReportBase('demo-local', 'passed')).toBe('demo-local');
    for (const status of ['failed', 'running', undefined]) expect(demoReportBase('demo-local', status)).toBe('demo-local.failed');
    expect(demoReportLine('demo-local', 'passed')).toBe('REPORTS reports/demo-local.md + reports/demo-local.json (timeline, logs, receipts, assertions)');
    expect(demoReportLine('demo-local', 'failed')).toContain('last passing reports/demo-local.json kept');
  });

  it('keeps the last passing pair on failure and clears the stale failed pair on the next pass', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'counterweight-report-')) + '/';
    try {
      await writeFile(directory + 'demo-local.json', '{"status":"passed"}\n');
      await writeDemoReports(directory, 'demo-local', 'failed', '{"status":"failed"}\n', '# failed\n');
      expect(await readFile(directory + 'demo-local.json', 'utf8')).toBe('{"status":"passed"}\n');
      expect(await readFile(directory + 'demo-local.failed.json', 'utf8')).toBe('{"status":"failed"}\n');
      await writeDemoReports(directory, 'demo-local', 'passed', '{"status":"passed","run":2}\n', '# passed\n');
      expect((await readdir(directory)).sort()).toEqual(['demo-local.json', 'demo-local.md']);
      expect(await readFile(directory + 'demo-local.json', 'utf8')).toContain('"run":2');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  it('git-ignores failed local runs so they cannot be committed by accident', async () => {
    const ignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8');
    expect(ignore).toContain('reports/*.failed.json');
    expect(ignore).toContain('reports/*.failed.md');
  });
});
