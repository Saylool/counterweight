import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './common.js';
import { scriptMarkdown } from './edit.js';
await writeFile(path.join(ROOT, 'docs/DEMO-SCRIPT.md'), scriptMarkdown());
console.log('Updated docs/DEMO-SCRIPT.md from scripts/video/edit.ts');
