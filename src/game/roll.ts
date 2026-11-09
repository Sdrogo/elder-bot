import { rollDice, type DieRoller } from '../dice/roller.js';
import { buildPool, evaluate, takeHalf, type Pool, type TestResult } from '../dice/test.js';

export interface RollRequest {
  channelId: string;
  userId: string;
  dice: number;
  /** Successes needed; 0 means none given (open roll, contested test). */
  difficulty: number;
  /** Bonuses and penalties chosen by the player. */
  modifier: number;
  /** Hunger dice in the pool, already resolved from the option or the stored value. */
  hunger: number;
  /** Taking Half (p. 94): no roll, half the pool as successes. */
  takeHalf: boolean;
  /** Second attempt after a failure (Trying Again, p. 98). */
  retry: boolean;
}

export type RollResponse =
  /** Taking Half: no dice rolled. */
  | { kind: 'half'; request: RollRequest; pool: Pool; successes: number; won?: boolean }
  /** Penalties left no dice: the test fails automatically (Impairment, p. 105). */
  | { kind: 'no-dice'; request: RollRequest; pool: Pool }
  | {
      kind: 'rolled';
      request: RollRequest;
      pool: Pool;
      result: TestResult;
      /** Beast's Bargain: only after a plain failure, never on a retry. */
      bargainAvailable: boolean;
      /** Trying Again: once, after a failure against a Difficulty. */
      retryAvailable: boolean;
      /** An NPC roll: no player mechanics (Hunger, bargain, pain, Try again). */
      npc: boolean;
    };

export interface RollOptions {
  roller?: DieRoller;
  npc?: boolean;
}

/**
 * Rolls a test. NPCs roll the plain pool: no Hunger, no Beast's Bargain, no Trying Again,
 * and a roll with no successes is just a failure.
 */
export function performRoll(request: RollRequest, options: RollOptions = {}): RollResponse {
  const npc = options.npc ?? false;
  const pool = buildPool({
    dice: request.dice,
    modifier: request.modifier,
    hunger: npc ? 0 : request.hunger,
  });
  const difficulty = request.difficulty > 0 ? request.difficulty : undefined;

  if (request.takeHalf && !request.retry) {
    const successes = takeHalf(pool.total);
    return {
      kind: 'half',
      request,
      pool,
      successes,
      won: difficulty === undefined ? undefined : successes >= difficulty,
    };
  }
  if (pool.total === 0) return { kind: 'no-dice', request, pool };

  const result = evaluate(
    rollDice(pool.normal, options.roller),
    rollDice(pool.hunger, options.roller),
    { difficulty, failureIsPainful: request.retry },
  );
  if (npc && result.outcome === 'painful-failure') {
    result.outcome = difficulty === undefined ? 'open' : 'failure';
  }
  const plainFailure = result.outcome === 'failure' && !result.bestial;
  return {
    kind: 'rolled',
    request,
    pool,
    result,
    bargainAvailable: !npc && plainFailure && !request.retry,
    retryAvailable:
      !npc &&
      !request.retry &&
      difficulty !== undefined &&
      (result.outcome === 'failure' || result.outcome === 'painful-failure'),
    npc,
  };
}
