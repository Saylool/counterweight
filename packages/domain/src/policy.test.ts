import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { stressMetrics } from './index.js';
import { policyDecision, policyUpperNotional, type PolicyScenario } from './policy.js';
it('feeds the same cap, headroom, reduce and open-short withdrawal scenarios through TS and real contract methods', () => {
  const scenarios = JSON.parse(readFileSync('contracts/policy/fixtures/policy-scenarios.json', 'utf8')) as PolicyScenario[];
  const cargoEnv = { ...process.env };
  const localCargo = `${process.cwd()}/contracts/policy/.cargo-home`;
  const localRustup = `${process.cwd()}/contracts/policy/.rustup`;
  if (!cargoEnv.CARGO_HOME && existsSync(localCargo)) cargoEnv.CARGO_HOME = localCargo;
  if (!cargoEnv.RUSTUP_HOME && existsSync(`${localRustup}/toolchains`)) {
    cargoEnv.RUSTUP_HOME = localRustup;
    const stable = readdirSync(`${localRustup}/toolchains`).find(n => n.startsWith('stable-'));
    if (!cargoEnv.RUSTUP_TOOLCHAIN && stable) cargoEnv.RUSTUP_TOOLCHAIN = stable;
  }
  const output = execFileSync('cargo', ['test', '--locked', '--lib', 'cross_layer_decisions', '--', '--nocapture'], { cwd: 'contracts/policy', env: cargoEnv, encoding: 'utf8', stdio: ['ignore','pipe','pipe'], maxBuffer: 5e6 });
  const actual = JSON.parse(output.match(/CROSS_LAYER_DECISIONS=(\[[^\n]+\])/)! [1]!);
  expect(scenarios.map(policyDecision)).toEqual(actual);
  for (const x of scenarios.filter(x => x.action === 'health')) {
    const notional = policyUpperNotional(Number(BigInt(x.short) / 10n ** 18n) / 1e6, Number(x.price) / 1e6, x.band);
    const h = Number(x.equity) - Number(x.reserve) - Math.round(notional * 1e6);
    const metrics = stressMetrics({ shortNotional: Number(x.short) / 1e24 * Number(x.price) / 1e6, shortQuantityNear: Number(x.short) / 1e24, referencePriceUsd: Number(x.price) / 1e6, venueEquity: Number(x.equity) / 1e6 });
    expect(Math.round(metrics.headroom * 1e6)).toBe(h);
    expect(Number(x.equity) >= 1000000 && h >= Math.ceil(Math.round(notional * 1e6) * x.minHeadroom / 10000)).toBe(policyDecision(x));
  }
  expect(actual).toEqual([true,false,false,false,false,false,true,false,false,true,true,false,false,false,false,false,true,false,false]);
}, 120000);
