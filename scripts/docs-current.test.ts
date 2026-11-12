import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));
const excluded = new Set(['node_modules', 'target', 'dist', 'build', 'videos']);
function markdown(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.name.startsWith('.') || excluded.has(entry.name)
      || relative(root, path) === 'reports/keeper-run'
      || relative(root, path) === 'apps/keeper/src') return [];
    return entry.isDirectory() ? markdown(path) : /\.md$/i.test(entry.name) ? [path] : [];
  });
}

it('keeps documentation free of obsolete v3 deployment and local-demo status', () => {
  for (const path of markdown(root)) {
    const text = readFileSync(path, 'utf8').replace(/[*_`]/g, '').replace(/\s+/g, ' ');
    expect(text, relative(root, path)).not.toMatch(/\bv3\s+(?:is\s+)?(?:still\s+)?(?:undeployed|not\s+(?:yet\s+)?deployed)\b/i);
    expect(text, relative(root, path)).not.toMatch(/\b(?:this updated\s+)?artifact has not been deployed\b/i);
    expect(text, relative(root, path)).not.toMatch(/(?:failed|blocked) before deployment|successful rerun remains pending|signed payloads in the blocked run/i);
  }
});
