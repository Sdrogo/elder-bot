import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Store } from '../src/state/store.js';

let store: Store;
beforeEach(() => {
  store = new Store(':memory:');
});
afterEach(() => store.close());

describe('Store', () => {
  it('keeps one Storyteller per channel', () => {
    expect(store.getStoryteller('c1')).toBeUndefined();
    store.setStoryteller('c1', 'u1');
    store.setStoryteller('c1', 'u2');
    expect(store.getStoryteller('c1')).toBe('u2');
    expect(store.getStoryteller('c2')).toBeUndefined();
  });

  it('ending a session wipes the table, Storyteller included', () => {
    const task = { name: 'Hack', target: 5, maxTests: 3, testsDone: 1, successes: 2 };
    store.setStoryteller('c1', 'u1');
    store.saveProlonged('c1', 'u2', task);
    store.saveProlonged('c2', 'u2', task);
    store.endSession('c1');
    expect(store.getStoryteller('c1')).toBeUndefined();
    expect(store.getProlonged('c1', 'u2')).toBeUndefined();
    expect(store.getProlonged('c2', 'u2')).toEqual(task);
  });

  it('saves and deletes prolonged tasks', () => {
    const task = { name: 'Hack', target: 5, maxTests: 3, testsDone: 1, successes: 2 };
    store.saveProlonged('c1', 'u1', task);
    expect(store.getProlonged('c1', 'u1')).toEqual(task);
    store.deleteProlonged('c1', 'u1');
    expect(store.getProlonged('c1', 'u1')).toBeUndefined();
  });
});

describe('Masquerade Tracker storage', () => {
  let s: Store;
  beforeEach(() => {
    s = new Store(':memory:');
  });
  afterEach(() => s.close());

  it('stays between 0 and 10 and survives the end of a session', () => {
    expect(s.getMasquerade('c1')).toBe(0);
    expect(s.setMasquerade('c1', 14)).toBe(10);
    expect(s.setMasquerade('c1', -1)).toBe(0);
    s.setMasquerade('c1', 4);
    s.endSession('c1');
    expect(s.getMasquerade('c1')).toBe(4);
  });
});
