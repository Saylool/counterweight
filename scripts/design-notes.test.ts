import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
it('records contract nonce, expiry, keeper rate-limit and pause invalidation requirements', () => {
  const notes = readFileSync(new URL('../docs/DESIGN-NOTES.md', import.meta.url), 'utf8');
  for (const rule of ['max(last_nonce + 1, block_timestamp_ms())', 'expiresAfter', 'on-chain keeper rate limit', 'noop', 'pause', '100', '5x']) expect(notes).toContain(rule);
});
