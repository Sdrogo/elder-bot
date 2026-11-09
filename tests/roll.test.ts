import { describe, expect, it } from 'vitest';
import { performRoll, rerollWithWillpower, type RollRequest } from '../src/game/roll.js';
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
  difficulty: 2,
  modifier: 0,
  hunger: 0,
  takeHalf: false,
  retry: false,
};

describe('performRoll', () => {
  it('rolls Hunger dice in place of normal ones', () => {
    const r = performRoll({ ...base, dice: 4, hunger: 2 }, { roller: loaded(7) });
    expect(r.kind === 'rolled' && [r.result.dice.length, r.result.hunger.length]).toEqual([2, 2]);
  });

  it('takes half the pool without rolling', () => {
    const r = performRoll({ ...base, dice: 5, takeHalf: true });
    expect(r).toMatchObject({ kind: 'half', successes: 3, won: true });
    expect(performRoll({ ...base, dice: 2, takeHalf: true })).toMatchObject({ won: false });
  });

  it('fails automatically with no dice left', () => {
    expect(performRoll({ ...base, dice: 2, modifier: -2 }).kind).toBe('no-dice');
  });

  it("offers Beast's Bargain and Try again on a plain failure", () => {
    const r = performRoll(base, { roller: loaded(6, 2, 2) });
    expect(r.kind === 'rolled' && [r.bargainAvailable, r.retryAvailable]).toEqual([true, true]);
  });

  it('offers no bargain on a painful or bestial failure', () => {
    const painful = performRoll(base, { roller: loaded(2) });
    expect(painful.kind === 'rolled' && painful.bargainAvailable).toBe(false);
    const bestial = performRoll({ ...base, hunger: 1 }, { roller: loaded(6, 2, 1) });
    expect(bestial.kind === 'rolled' && bestial.result.bestial).toBe(true);
    expect(bestial.kind === 'rolled' && bestial.bargainAvailable).toBe(false);
  });

  it('a retry failure is painful, with no bargain and no further retry', () => {
    const r = performRoll({ ...base, retry: true }, { roller: loaded(6, 2, 2) });
    expect(r.kind === 'rolled' && r.result.outcome).toBe('painful-failure');
    expect(r.kind === 'rolled' && [r.bargainAvailable, r.retryAvailable]).toEqual([false, false]);
  });

  it('no Try again without a Difficulty', () => {
    const r = performRoll({ ...base, difficulty: 0 }, { roller: loaded(2) });
    expect(r.kind === 'rolled' && r.retryAvailable).toBe(false);
  });

  it('NPCs roll no Hunger and just fail', () => {
    const r = performRoll({ ...base, hunger: 3 }, { roller: loaded(2), npc: true });
    expect(r.kind === 'rolled' && r.result.hunger).toEqual([]);
    expect(r.kind === 'rolled' && r.result.outcome).toBe('failure');
    expect(r.kind === 'rolled' && [r.bargainAvailable, r.retryAvailable]).toEqual([false, false]);
  });
});

describe('Willpower', () => {
  it('rerolls up to 3 normal dice, never Hunger dice, once per test', () => {
    const r = rerollWithWillpower(
      { ...base, dice: 5, hunger: 1 },
      [2, 3, 4, 9],
      [1],
      [0, 1, 2, 3],
      loaded(8),
    );
    expect(r.result.dice).toEqual([8, 8, 8, 9]);
    expect(r.result.hunger).toEqual([1]);
    expect(r.rerolled).toEqual([
      [2, 8],
      [3, 8],
      [4, 8],
    ]);
    expect(r.result.outcome).toBe('success');
    expect(r.willpowerAvailable).toBe(false);
  });

  it('is offered on a player roll with normal dice', () => {
    const r = performRoll(base, { roller: loaded(2) });
    expect(r.kind === 'rolled' && r.willpowerAvailable).toBe(true);
    const npc = performRoll(base, { roller: loaded(2), npc: true });
    expect(npc.kind === 'rolled' && npc.willpowerAvailable).toBe(false);
    const allHunger = performRoll({ ...base, hunger: 3 }, { roller: loaded(2) });
    expect(allHunger.kind === 'rolled' && allHunger.willpowerAvailable).toBe(false);
  });
});

describe('button ids', () => {
  it('round-trip the roll and stay under the 100 character limit', () => {
    const request = {
      userId: '123456789012345678',
      dice: 12,
      difficulty: 4,
      modifier: -3,
      hunger: 5,
      takeHalf: true,
      retry: true,
      willpower: true,
    };
    const id = encodeRollId('bargain-yes', request);
    expect(id.length).toBeLessThanOrEqual(100);
    expect(decodeRollId(id)).toEqual({ action: 'bargain-yes', request });
  });

  it('carry the dice faces for Willpower, even for the largest pool', () => {
    const request = {
      userId: '123456789012345678',
      dice: 25,
      difficulty: 15,
      modifier: -10,
      hunger: 5,
      takeHalf: false,
      retry: true,
      willpower: false,
    };
    const faces = {
      normal: [10, ...Array.from({ length: 24 }, (_, i) => (i % 9) + 1)],
      hunger: [1, 10, 6, 6, 2],
    };
    const id = encodeRollId('wp-cancel', request, faces);
    expect(id.length).toBeLessThanOrEqual(100);
    expect(decodeRollId(id)).toEqual({ action: 'wp-cancel', request, faces });
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
      'frenzy',
      'masquerade',
      'session',
    ]);
  });
});
