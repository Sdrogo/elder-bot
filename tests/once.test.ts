import { describe, expect, it } from 'vitest';
import { OnceGuard } from '../src/interactions/once.js';

describe('OnceGuard', () => {
  it('lets a key through only once', () => {
    const once = new OnceGuard();
    expect(once.claim('m1:pain')).toBe(true);
    expect(once.claim('m1:pain')).toBe(false);
    expect(once.claim('m1:retry')).toBe(true);
  });

  it('gives a released key back', () => {
    const once = new OnceGuard();
    once.claim('m1:retry');
    once.release('m1:retry');
    expect(once.claim('m1:retry')).toBe(true);
  });

  it('forgets the oldest keys past its limit', () => {
    const once = new OnceGuard(2);
    once.claim('a');
    once.claim('b');
    once.claim('c');
    expect(once.claim('a')).toBe(true);
    expect(once.claim('c')).toBe(false);
  });
});
