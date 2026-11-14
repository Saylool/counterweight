import { describe, expect, it } from 'vitest';
import { executionOptions, executeMainnet, executionJournal } from './mainnet-execute.js';
describe('explicit owner execution boundary', () => {
  it('refuses sends before any side effect without both mainnet and consent', async () => {
    await expect(executeMainnet(['--network=mainnet', '--step=open'])).rejects.toThrow('i-understand-real-funds');
    expect(() => executionOptions(['--i-understand-real-funds', '--network=testnet', '--step=open'])).toThrow('network=mainnet');
    expect(() => executionOptions(['--i-understand-real-funds', '--network=mainnet', '--step=plan'])).toThrow();
  });
  it('accepts only fixed lifecycle operations and rejects send flags it does not own', () => {
    expect(executionOptions(['--i-understand-real-funds', '--network=mainnet', '--step=invalidate']).step).toBe('invalidate');
    expect(() => executionOptions(['--i-understand-real-funds', '--network=mainnet', '--step=open', '--signer=other.near'])).toThrow();
  });
});


describe('uncertain execution recovery journals', () => {
  it('blocks fresh exposure but permits reduction and settlement without overwriting the original evidence', () => {
    expect(() => executionJournal('plan', 'open', { step: 'open' }, [], false)).toThrow('uncertain');
    expect(() => executionJournal('plan', 'withdraw', { step: 'open' }, [], false)).toThrow('blocks new risk');
    expect(executionJournal('plan', 'close', { step: 'open' }, [], false)).toBe('plan.close.recovery-execution.json');
    expect(executionJournal('plan', 'settle', { step: 'open' }, ['close'], false)).toBe('plan.settle.recovery-execution.json');
    expect(executionJournal('plan', 'invalidate', { step: 'withdraw' }, [], false)).toBe('plan.invalidate.recovery-execution.json');
  });
  it('never resends an uncertain recovery operation and resumes its matching journal', () => {
    expect(() => executionJournal('plan', 'close', { step: 'open' }, ['close'], false)).toThrow('uncertain close');
    expect(executionJournal('plan', 'close', { step: 'open' }, ['close'], true)).toBe('plan.close.recovery-execution.json');
    expect(executionJournal('plan', 'open', { step: 'open' }, ['close'], true)).toBe('plan.active-execution.json');
    expect(() => executionJournal('plan', 'to-perp', null, ['close'], false)).toThrow('blocks new risk');
  });
});
