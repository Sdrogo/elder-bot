import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MAX_DRAMA, Store } from '../src/state/store.js';

let store: Store;
beforeEach(() => {
  store = new Store(':memory:');
});
afterEach(() => store.close());

describe('Store', () => {
  it('keeps Quickening per player and per channel', () => {
    store.setQuickening('c1', 'u1', 3);
    store.setQuickening('c2', 'u1', 1);
    expect(store.getQuickening('c1', 'u1')).toBe(3);
    expect(store.getQuickening('c2', 'u1')).toBe(1);
    expect(store.getQuickening('c1', 'u2')).toBe(0);
  });

  it('never stores negative Drama', () => {
    store.setDrama('c1', -2);
    expect(store.getDrama('c1')).toBe(0);
  });

  it('caps Drama', () => {
    store.setDrama('c1', MAX_DRAMA + 50);
    expect(store.getDrama('c1')).toBe(MAX_DRAMA);
  });

  it('sums scene traits', () => {
    store.addTrait('c1', 'Pioggia', -2);
    store.addTrait('c1', 'Sirene', 1);
    expect(store.traitModifier('c1')).toBe(-1);
  });

  it('a new scene clears traits and bargains but keeps Quickening', () => {
    store.setQuickening('c1', 'u1', 2);
    store.addTrait('c1', 'Nebbia', -1);
    store.markBargain('c1', 'u1');
    store.newScene('c1');
    expect(store.listTraits('c1')).toEqual([]);
    expect(store.hasUsedBargain('c1', 'u1')).toBe(false);
    expect(store.getQuickening('c1', 'u1')).toBe(2);
  });

  it('a new session resets Quickening and sets Drama to 1 per PC', () => {
    store.setQuickening('c1', 'u1', 4);
    store.newSession('c1', 4);
    expect(store.getQuickening('c1', 'u1')).toBe(0);
    expect(store.getDrama('c1')).toBe(4);
  });

  it('saves and deletes prolonged tasks', () => {
    const task = { name: 'Hack', target: 5, maxTests: 3, testsDone: 1, successes: 2 };
    store.saveProlonged('c1', 'u1', task);
    expect(store.getProlonged('c1', 'u1')).toEqual(task);
    store.deleteProlonged('c1', 'u1');
    expect(store.getProlonged('c1', 'u1')).toBeUndefined();
  });
});
