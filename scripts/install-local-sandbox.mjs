// Runs during npm install/ci. Runtime never downloads a sandbox or calls a public RPC.
import { mkdir, mkdtemp, readFile, rm, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const sandboxDirectory = fileURLToPath(new URL('../node_modules/.cache/counterweight-sandbox/', import.meta.url));
export const sandboxBinary = join(sandboxDirectory, 'near-sandbox');
export const sandboxVersion = '2.14.0';

export async function installSandbox() {
  const platform = `${process.platform}-${process.arch}`;
  const target = { 'darwin-arm64': 'Darwin-arm64', 'linux-x64': 'Linux-x86_64' }[platform];
  if (!target) throw new Error(`Local NEAR sandbox supports macOS arm64 and Linux x64; received ${platform}`);
  try {
    await readFile(sandboxBinary);
    if (execFileSync(sandboxBinary, ['--version'], { encoding: 'utf8' }).includes(`release ${sandboxVersion})`)) return;
  } catch { /* Install missing binary. */ }
  const staging = await mkdtemp(join(tmpdir(), 'counterweight-install-'));
  try {
    const url = `https://s3-us-west-1.amazonaws.com/build.nearprotocol.com/nearcore/${target}/${sandboxVersion}/near-sandbox.tar.gz`;
    const archive = join(staging, 'sandbox.tar.gz');
    execFileSync('curl', ['--fail', '--location', '--silent', '--show-error', '--max-time', '120', '--output', archive, url]);
    await mkdir(sandboxDirectory, { recursive: true });
    execFileSync('tar', ['-xzf', archive, '--strip-components=1', '-C', sandboxDirectory]);
    await chmod(sandboxBinary, 0o755);
    if (!execFileSync(sandboxBinary, ['--version'], { encoding: 'utf8' }).includes(`release ${sandboxVersion})`))
      throw new Error('Unexpected sandbox version');
    console.log(`Installed local NEAR sandbox ${sandboxVersion} (${platform}); demo is now offline-ready.`);
  } finally { await rm(staging, { recursive: true, force: true }); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  installSandbox().catch(error => { console.error(`Sandbox install failed: ${error.message}`); process.exitCode = 1; });
}
