import { describe, expect, it } from 'vitest';
import { rollDice } from '../src/dice/roller.js';
import { buildPool, countSuccesses, evaluate, takeHalf } from '../src/dice/test.js';
import { resolveContest } from '../src/dice/contest.js';
import { addProlongedTest, startProlonged } from '../src/dice/prolonged.js';
import { masqueradeLevel, threatReaction } from '../src/dice/masquerade.js';

function loaded(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe('buildPool', () => {
  it('adds bonuses to Attribute + Skill; Difficulty removes nothing', () => {
    expect(buildPool({ dice: 7, modifier: 1 })).toEqual({ total: 8, hunger: 0, normal: 8 });
  });

  it('never goes below 0', () => {
    expect(buildPool({ dice: 2, modifier: -3 }).total).toBe(0);
  });

  it('swaps normal dice for Hunger dice, never more than the pool', () => {
    expect(buildPool({ dice: 6, hunger: 2 })).toEqual({ total: 6, hunger: 2, normal: 4 });
    expect(buildPool({ dice: 2, hunger: 4 })).toEqual({ total: 2, hunger: 2, normal: 0 });
    expect(buildPool({ dice: 9, hunger: 8 }).hunger).toBe(5);
  });
});

describe('takeHalf', () => {
  it('is half the pool rounded up', () => {
    expect(takeHalf(5)).toBe(3);
    expect(takeHalf(6)).toBe(3);
    expect(takeHalf(0)).toBe(0);
  });
});

describe('evaluate', () => {
  it('succeeds on 6+ (Adrian: 2, 5, 4, 6, 6, 8 against Difficulty 2)', () => {
    const r = evaluate([2, 5, 4, 6, 6, 8], [], { difficulty: 2 });
    expect(r.successes).toBe(3);
    expect(r.outcome).toBe('success');
    expect(r.margin).toBe(1);
    expect(r.criticalWin).toBe(false);
  });

  it('counts a 10 as two successes and makes a win critical', () => {
    expect(countSuccesses([10, 6, 3])).toBe(3);
    const r = evaluate([10, 2], [], { difficulty: 2 });
    expect(r.outcome).toBe('success');
    expect(r.criticalWin).toBe(true);
  });

  it('fails with fewer successes than the Difficulty, giving the margin of failure', () => {
    const r = evaluate([6, 3], [], { difficulty: 3 });
    expect(r.outcome).toBe('failure');
    expect(r.margin).toBe(-2);
  });

  it('is a painful failure with no successes, even without a 1', () => {
    expect(evaluate([2, 5], [], { difficulty: 1 }).outcome).toBe('painful-failure');
    expect(evaluate([2, 5]).outcome).toBe('painful-failure');
  });

  it('a 1 on a normal die means nothing', () => {
    const r = evaluate([1, 1, 3], [], { difficulty: 2 });
    expect(r.outcome).toBe('painful-failure');
    expect(r.bestial).toBe(false);
  });

  it('a failure with a 1 on a Hunger die is bestial', () => {
    expect(evaluate([7], [1], { difficulty: 2 })).toMatchObject({
      outcome: 'failure',
      bestial: true,
    });
  });

  it('painful and bestial can stack', () => {
    expect(evaluate([3], [1], { difficulty: 2 })).toMatchObject({
      outcome: 'painful-failure',
      bestial: true,
    });
  });

  it('a Hunger 1 does not spoil a win', () => {
    expect(evaluate([8, 9], [1], { difficulty: 2 })).toMatchObject({
      outcome: 'success',
      bestial: false,
    });
  });

  it('Hunger dice succeed on 6+ like normal dice', () => {
    expect(evaluate([], [6, 10], { difficulty: 3 }).outcome).toBe('success');
  });

  it('without a Difficulty the roll stays open, and flags a Hunger 1', () => {
    const r = evaluate([8], [1]);
    expect(r.outcome).toBe('open');
    expect(r.bestial).toBe(false);
    expect(r.hungerOnes).toBe(1);
    expect(r.margin).toBeUndefined();
  });

  it('treats any failure as painful when trying again', () => {
    const opts = { difficulty: 2, failureIsPainful: true };
    expect(evaluate([6, 2], [], opts).outcome).toBe('painful-failure');
    expect(evaluate([6, 9], [], opts).outcome).toBe('success');
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

describe('contested tests', () => {
  it('more successes win', () => {
    expect(resolveContest({ successes: 2 }, { successes: 1 })).toEqual({ winner: 'a' });
    expect(resolveContest({ successes: 0 }, { successes: 1 })).toEqual({ winner: 'b' });
  });

  it('a tie goes to the higher Attribute', () => {
    expect(resolveContest({ successes: 1, attribute: 2 }, { successes: 1, attribute: 4 })).toEqual({
      winner: 'b',
      tieBreak: 'attribute',
    });
  });

  it('then to whoever initiated the contest', () => {
    expect(
      resolveContest({ successes: 1, attribute: 3 }, { successes: 1, attribute: 3 }).tieBreak,
    ).toBe('initiator');
    expect(resolveContest({ successes: 1 }, { successes: 1, attribute: 3 }).tieBreak).toBe(
      'initiator',
    );
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

  it('fails at once on a painful or bestial failure', () => {
    const task = startProlonged('Ritual', 7, 7);
    expect(addProlongedTest(task, 0, { disaster: true }).status).toBe('failed');
  });
});

describe('Masquerade Tracker', () => {
  it('names the level of each rank', () => {
    expect([0, 2, 3, 6, 8, 10].map(masqueradeLevel)).toEqual([
      'Superstition',
      'Disbelief',
      'Skepticism',
      'Concern',
      'Certainty',
      'Open War',
    ]);
  });

  it('turns threat test successes into a reaction', () => {
    expect(threatReaction(0)).toBe('Calm Before the Storm');
    expect(threatReaction(3)).toBe('Minor Threat');
    expect(threatReaction(9)).toBe('Overwhelming Threat');
  });
});
