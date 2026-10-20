import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { performRoll, type RollRequest } from '../src/game/roll.js';
import { Store } from '../src/state/store.js';
import { decodeRollId, encodeRollId } from '../src/ui/customId.js';
import { commands } from '../src/commands/index.js';

function loaded(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

const base: RollRequest = {
  channelId: 'c1',
  userId: 'u1',
  dice: 3,
  difficulty: 0,
  modifier: 0,
  quickening: 0,
  combat: false,
  retry: false,
  applyTraits: true,
};

let store: Store;
beforeEach(() => {
  store = new Store(':memory:');
});
afterEach(() => store.close());

describe('performRoll', () => {
  it('offers Overqualified with 4+ dice left', () => {
    expect(performRoll(store, { ...base, dice: 6, difficulty: 2 }).kind).toBe('overqualified');
  });

  it('rolls when Overqualified is declined, and in combat', () => {
    const roller = loaded(9);
    expect(performRoll(store, { ...base, dice: 6 }, { roller, skipOverqualified: true }).kind).toBe(
      'rolled',
    );
    expect(performRoll(store, { ...base, dice: 6, combat: true }, { roller }).kind).toBe('rolled');
  });

  it('stops at No Dice Left', () => {
    expect(performRoll(store, { ...base, dice: 2, difficulty: 2 }).kind).toBe('no-dice');
  });

  it('applies scene traits unless ignored', () => {
    store.addTrait('c1', 'Nebbia', -2);
    const r = performRoll(store, { ...base, dice: 3 }, { roller: loaded(5) });
    expect(r.kind === 'rolled' && r.pool.total).toBe(1);
    const ignored = performRoll(
      store,
      { ...base, dice: 3, applyTraits: false },
      { roller: loaded(5) },
    );
    expect(ignored.kind === 'rolled' && ignored.pool.total).toBe(3);
  });

  it('spends Quickening and earns it back from 10s', () => {
    store.setQuickening('c1', 'u1', 2);
    const r = performRoll(
      store,
      { ...base, dice: 1, quickening: 2 },
      { roller: loaded(10, 10, 3) },
    );
    expect(r.kind).toBe('rolled');
    expect(store.getQuickening('c1', 'u1')).toBe(2);
  });

  it('refuses to spend Quickening the player does not have', () => {
    expect(performRoll(store, { ...base, quickening: 1 }).kind).toBe('error');
  });

  it("offers the Devil's Bargain only on a plain failure, once per scene", () => {
    const fail = performRoll(store, base, { roller: loaded(5) });
    expect(fail.kind === 'rolled' && fail.bargainAvailable).toBe(true);
    const painful = performRoll(store, base, { roller: loaded(1) });
    expect(painful.kind === 'rolled' && painful.bargainAvailable).toBe(false);
    store.markBargain('c1', 'u1');
    const again = performRoll(store, base, { roller: loaded(5) });
    expect(again.kind === 'rolled' && again.bargainAvailable).toBe(false);
  });

  it('a retry failure is painful and has no bargain', () => {
    const r = performRoll(store, { ...base, retry: true }, { roller: loaded(5) });
    expect(r.kind === 'rolled' && r.result.outcome).toBe('painful-failure');
    expect(r.kind === 'rolled' && r.bargainAvailable).toBe(false);
  });
});

describe('button ids', () => {
  it('round-trip the roll and stay under the 100 character limit', () => {
    const request = {
      userId: '123456789012345678',
      dice: 12,
      difficulty: 4,
      modifier: -3,
      quickening: 5,
      combat: true,
      retry: true,
      applyTraits: false,
    };
    const id = encodeRollId('bargain-yes', request);
    expect(id.length).toBeLessThanOrEqual(100);
    expect(decodeRollId(id)).toEqual({ action: 'bargain-yes', request });
  });

  it('ignores foreign ids', () => {
    expect(decodeRollId('something:else')).toBeUndefined();
  });
});

describe('slash commands', () => {
  it('all build valid Discord payloads with English names', () => {
    const names = commands.map((c) => c.data.toJSON().name);
    expect(names).toEqual([
      'roll',
      'contest',
      'prolonged',
      'npc',
      'quickening',
      'drama',
      'session',
    ]);
  });
});
