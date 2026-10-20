import { describe, expect, it } from 'vitest';
import { rollDice } from '../src/dice/roller.js';
import { buildPool, canTakeOverqualified, evaluate } from '../src/dice/test.js';
import { basicSuccessCost, gainQuickening } from '../src/dice/quickening.js';
import { npcPool, resolveContest } from '../src/dice/contest.js';
import { addProlongedTest, startProlonged } from '../src/dice/prolonged.js';

function loaded(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe('buildPool', () => {
  it('subtracts Difficulty from Attribute + Skill (Adrian: 3 + 3, Difficulty 2)', () => {
    expect(buildPool({ dice: 6, difficulty: 2 })).toEqual({
      base: 6,
      afterDifficulty: 4,
      total: 4,
    });
  });

  it('never goes below 0', () => {
    expect(buildPool({ dice: 2, difficulty: 5 }).total).toBe(0);
    expect(buildPool({ dice: 2, modifier: -3 }).base).toBe(0);
  });

  it('adds bonuses before Difficulty (Ulfred: 4 + 3 + 1 focus, Difficulty 2)', () => {
    expect(buildPool({ dice: 7, modifier: 1, difficulty: 2 }).total).toBe(6);
  });

  it('adds Quickening dice after Difficulty (Ulfred dodge: 1 die + 2 Quickening)', () => {
    const pool = buildPool({ dice: 4, difficulty: 3, quickening: 2 });
    expect(pool.afterDifficulty).toBe(1);
    expect(pool.total).toBe(3);
  });
});

describe('canTakeOverqualified', () => {
  it('needs 4+ dice after Difficulty', () => {
    expect(canTakeOverqualified(buildPool({ dice: 6, difficulty: 2 }), false)).toBe(true);
    expect(canTakeOverqualified(buildPool({ dice: 5, difficulty: 2 }), false)).toBe(false);
  });

  it('does not count Quickening dice', () => {
    expect(canTakeOverqualified(buildPool({ dice: 3, quickening: 2 }), false)).toBe(false);
  });

  it('is never allowed on attack or defense tests', () => {
    expect(canTakeOverqualified(buildPool({ dice: 8 }), true)).toBe(false);
  });
});

describe('evaluate', () => {
  it('succeeds on any 8+ (Adrian: 2, 4, 7, 8)', () => {
    const r = evaluate([2, 4, 7, 8]);
    expect(r.outcome).toBe('success');
    expect(r.successes).toBe(1);
    expect(r.extraSuccesses).toBe(0);
  });

  it('counts extra successes beyond the first', () => {
    const r = evaluate([8, 9, 10, 3, 1]);
    expect(r.successes).toBe(3);
    expect(r.extraSuccesses).toBe(2);
    expect(r.outcome).toBe('success');
  });

  it('a 1 does not spoil a success', () => {
    expect(evaluate([1, 1, 8]).outcome).toBe('success');
  });

  it('fails with no 8+ and no 1', () => {
    expect(evaluate([2, 5, 7]).outcome).toBe('failure');
  });

  it('is a painful failure with no 8+ and at least one 1', () => {
    expect(evaluate([1, 5, 7]).outcome).toBe('painful-failure');
  });

  it('treats any failure as painful when trying again', () => {
    expect(evaluate([2, 5], { failureIsPainful: true }).outcome).toBe('painful-failure');
    expect(evaluate([9], { failureIsPainful: true }).outcome).toBe('success');
  });

  it('counts each 10 for Quickening (Ulfred: two 10s)', () => {
    expect(evaluate([10, 10]).tens).toBe(2);
  });

  it('6s and 7s are not successes, unlike V5', () => {
    expect(evaluate([6, 7, 6]).successes).toBe(0);
  });
});

describe('rollDice', () => {
  it('rolls the requested number of dice with the given roller', () => {
    expect(rollDice(3, loaded(10, 1, 8))).toEqual([10, 1, 8]);
    expect(rollDice(0)).toEqual([]);
  });

  it('only produces values from 1 to 10', () => {
    const dice = rollDice(2000);
    expect(Math.min(...dice)).toBe(1);
    expect(Math.max(...dice)).toBe(10);
  });
});

describe('Quickening', () => {
  it('caps at 5 and reports the overflow for the Beast or Nature tracker', () => {
    expect(gainQuickening(4, 3)).toEqual({ value: 5, gained: 1, overflow: 2 });
    expect(gainQuickening(0, 2)).toEqual({ value: 2, gained: 2, overflow: 0 });
  });

  it('costs 3 for a basic success with Skill dots, 5 without', () => {
    expect(basicSuccessCost(true)).toBe(3);
    expect(basicSuccessCost(false)).toBe(5);
  });
});

describe('contested tests', () => {
  it('more successes win', () => {
    expect(resolveContest({ successes: 2 }, { successes: 1 })).toEqual({ winner: 'a' });
    expect(resolveContest({ successes: 0 }, { successes: 1, npc: true })).toEqual({ winner: 'b' });
  });

  it('a tie between characters goes to the higher Attribute', () => {
    expect(resolveContest({ successes: 1, attribute: 2 }, { successes: 1, attribute: 4 })).toEqual({
      winner: 'b',
      tieBreak: 'attribute',
    });
  });

  it('a tie with equal or unknown Attributes is left to the Storyteller', () => {
    expect(
      resolveContest({ successes: 1, attribute: 3 }, { successes: 1, attribute: 3 }).tieBreak,
    ).toBe('storyteller');
    expect(resolveContest({ successes: 1 }, { successes: 1, attribute: 3 }).tieBreak).toBe(
      'storyteller',
    );
  });

  it('a tie against an NPC ignores Attributes', () => {
    expect(resolveContest({ successes: 1, attribute: 5 }, { successes: 1, npc: true })).toEqual({
      winner: 'tie',
      tieBreak: 'initiator-or-storyteller',
    });
  });

  it('NPCs roll twice their Level', () => {
    expect(npcPool(3)).toBe(6);
  });
});

describe('prolonged tasks', () => {
  it('completes when the successes reach the target', () => {
    let task = startProlonged('Hack', 5, 3);
    let r = addProlongedTest(task, 2);
    expect(r.status).toBe('ongoing');
    task = r.task;
    r = addProlongedTest(task, 3);
    expect(r.status).toBe('completed');
    expect(r.task).toMatchObject({ testsDone: 2, successes: 5 });
  });

  it('fails when the tests run out', () => {
    let task = startProlonged('Research', 7, 3);
    for (const s of [2, 1]) task = addProlongedTest(task, s).task;
    expect(addProlongedTest(task, 1).status).toBe('failed');
  });
});
