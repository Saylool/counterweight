import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { policyDecision, type PolicyScenario } from '../packages/domain/src/policy.js';
import { stressMetrics } from '../packages/domain/src/index.js';
import { deriveEvmAddress } from '../packages/hyperliquid/src/index.js';
import { freshV3Steps, initialization } from './testnet-plan.js';
import { V3_POLICY, PATH, OWNER, PROBE_ADDRESS } from './testnet-common.js';

it('v3 open-short withdrawals match TS engine post-withdrawal integer health including micro boundaries', () => {
  const env: NodeJS.ProcessEnv = { ...process.env, CARGO_HOME: `${process.cwd()}/contracts/policy/.cargo-home`, RUSTUP_HOME: `${process.cwd()}/contracts/policy/.rustup` };
  if (!existsSync(env.CARGO_HOME!)) delete (env as Record<string, unknown>).CARGO_HOME;
  if (existsSync(`${env.RUSTUP_HOME}/toolchains`)) env.RUSTUP_TOOLCHAIN ??= readdirSync(`${env.RUSTUP_HOME}/toolchains`).find(n => n.startsWith('stable-'));
  const out = execFileSync('cargo', ['test','--locked','--lib','v3_cross_layer_withdrawals','--','--nocapture'], { cwd:'contracts/policy', env, encoding:'utf8', stdio:['ignore','pipe','pipe'] });
  const actual = JSON.parse(out.match(/V3_WITHDRAWAL_DECISIONS=(\[[^\n]+\])/)! [1]!);
  const cases = JSON.parse(readFileSync('contracts/policy/fixtures/v3-withdrawals.json','utf8')) as { short:string; price:string; equity:string; amount:string }[];
  const decisions = cases.map(x => {
    const post = BigInt(x.equity) - BigInt(x.amount);
    const scenario = { size:'0', action:'health', short:x.short, price:x.price, equity:post.toString(), reserve:'100000', band:100, minHeadroom:1000 } as PolicyScenario;
    const healthy = policyDecision(scenario);
    const short = Number(x.short)/1e24, price = Number(x.price)/1e6;
    const metrics = stressMetrics({ shortNotional:short*price, shortQuantityNear:short, referencePriceUsd:price, venueEquity:Number(post)/1e6 });
    const upper = (BigInt(x.price)*10100n+9999n)/10000n;
    const notional = (BigInt(x.short)*upper+10n**24n-1n)/(10n**24n);
    const headroom = post-100000n-notional;
    expect(Math.round(metrics.headroom*1e6)).toBe(Number(headroom));
    expect(healthy).toBe(post>=1000000n && headroom>=(notional*1000n+9999n)/10000n);
    return healthy && BigInt(x.amount)>0n && BigInt(x.amount)<=10000000n && BigInt(x.amount)<=BigInt(x.equity);
  });
  expect(actual).toEqual(decisions);
  expect(actual).toEqual([true,true,false,true,false,true,false,false,true]);
},120000);

it('prints fresh v3-only atomic deployment, explicit policy verification and adapter-free withdrawal setup', () => {
  const steps = freshV3Steps(initialization(54,1,PROBE_ADDRESS,'3.5'),'a'.repeat(64));
  const commands = steps.map(s=>s.command).join('\n');
  expect(commands).toContain(V3_POLICY);
  expect(commands).toContain('with-init-call new');
  expect(commands).toContain('configure_margin_withdrawals');
  expect(commands).not.toMatch(/policy-v2\.|configure_rebalancing|npm run lifecycle/);
  expect(commands).toContain(`sign-as ${OWNER}`);
  expect(steps.at(-1)!.command).toContain('testnet:verify');
});
it('pins the v3 address to the public signer root and fixed derivation path', () => {
  const fixture = JSON.parse(readFileSync('fixtures/chainsig-public-derivation.json','utf8'));
  expect(deriveEvmAddress(fixture.root.value,V3_POLICY,PATH).address).toBe('0xb4b87e81e185b7ad1911cbf5d1ee3729c92d62a5');
});
