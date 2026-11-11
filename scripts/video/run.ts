import { run, ROOT } from './common.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { scriptMarkdown } from './edit.js';
const args = process.argv.slice(2);
if ((await readFile(path.join(ROOT, 'docs/DEMO-SCRIPT.md'), 'utf8')) !== scriptMarkdown()) throw new Error('DEMO-SCRIPT.md differs from editorial manifest. Run npm run video:script and review.');
await run('npm', ['run', 'video:test']);
// Local report first, so a server started by capture sees the same regenerated demo data.
await run(process.execPath, ['--import', 'tsx', 'scripts/video/terminal.ts', ...args.filter(arg => arg.startsWith('--log='))], { timeout: 1_800_000 });
await run(process.execPath, ['--import', 'tsx', 'scripts/video/capture.ts', ...args.filter(arg => ['--headed', '--allow-unavailable'].includes(arg))], { timeout: 1_800_000 });
await run(process.execPath, ['--import', 'tsx', 'scripts/video/assemble.ts', ...args.filter(arg => arg === '--allow-unavailable')], { timeout: 1_800_000 });
