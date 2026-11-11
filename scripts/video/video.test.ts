import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, wrap } from './common.js';
import { claims, duration, main, short, schedule, scriptMarkdown } from './edit.js';
import { validateClaims } from './assemble.js';
import { terminalBody, transcript } from './terminal.js';

describe('video timing and claim mapping', () => {
  it('keeps continuous frame-aligned timelines at 2:30 and 1:00', () => {
    expect(duration(main)).toBe(150);
    expect(duration(short)).toBe(60);
    for (const scenes of [main, short]) {
      const timeline = schedule(scenes);
      for (const [i, scene] of timeline.entries()) {
        expect(scene.seconds).toBeGreaterThan(0);
        expect(scene.start).toBe(i ? timeline[i - 1]!.end : 0);
        expect(Number.isInteger(scene.start * 30)).toBe(true);
        expect(Number.isInteger(scene.end * 30)).toBe(true);
        expect(claims[scene.claim]).toBeDefined();
        expect(scene.scope.length).toBeLessThan(100);
        expect(wrap(claims[scene.claim].caption, 87).length).toBeLessThanOrEqual(3);
        // Limit text to a judge-readable caption rate, including dense proof scenes.
        expect(claims[scene.claim].caption.length / scene.seconds).toBeLessThanOrEqual(24);
      }
    }
  });
  it('opens the X cut with owner-untouched keeper and rogue evidence, then public testnet proof', () => {
    expect(short.slice(0, 4).map(scene => scene.shot)).toEqual(['keeper', 'rogue', 'lifecycle-top', 'lifecycle-scroll']);
    expect(short[0]!.scope).toContain('LOCAL');
    expect(main.find(scene => scene.shot === 'v3-proof')!.scope).toContain('SEPARATE V3');
  });
  it('resolves every reviewed evidence anchor; captions cannot be added without mapping', async () => {
    await validateClaims();
    for (const claim of Object.values(claims)) {
      expect(claim.evidence.length).toBeGreaterThan(0);
      expect(claim.caption).not.toMatch(/guaranteed (return|yield)|risk.free|promised yield/i);
    }
  });
  it('keeps the written recording plan identical to the burned captions and timings', async () => {
    expect(await readFile(path.join(ROOT, 'docs/DEMO-SCRIPT.md'), 'utf8')).toBe(scriptMarkdown());
  });
});
describe('authentic local terminal rendering', () => {
  it('reads the actual saved report and preserves the owner-free phase boundary', async () => {
    const lines = transcript(await readFile(path.join(ROOT, 'reports/demo-local.json'), 'utf8'));
    expect(lines.filter(line => /^ROGUE .*REJECT/.test(line))).toHaveLength(7);
    expect(lines.findIndex(line => line.includes('OWNER RESUMED'))).toBeGreaterThan(lines.findIndex(line => line.startsWith('PASS 7/7')));
  });
  it('fails closed on incomplete or failed logs', () => {
    expect(() => transcript('made up demo output')).toThrow();
    expect(() => transcript(JSON.stringify({ status: 'failed', transcript: [] }))).toThrow();
    expect(() => transcript('COUNTERWEIGHT | LOCAL SANDBOX | MOCK MPC')).toThrow();
  });
  it('escapes terminal text and assigns rejection/success colors without drawtext', () => {
    const body = terminalBody([{ number: 9, text: 'REJECT <script>&' }, { number: 10, text: 'SIGNED PASS' }], 1, 'saved.json', 'a'.repeat(64), true);
    expect(body).toContain('REJECT &lt;script&gt;&amp;');
    expect(body).toContain('#ff777d');
    expect(body).toContain('#69e2a8');
    expect(body).toContain('NOT COMMAND RUNTIME');
  });
});
