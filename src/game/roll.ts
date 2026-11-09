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
  /** Willpower already spent on this test (Push Yourself, p. 104): one reroll per test. */
  willpower?: boolean;
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
      /** Push Yourself: reroll up to 3 normal dice, once per test. */
      willpowerAvailable: boolean;
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

  return judge(
    request,
    rollDice(pool.normal, options.roller),
    rollDice(pool.hunger, options.roller),
    npc,
  );
}

/** Most normal dice a player can pick to reroll; also the most a Discord menu can list. */
export const WILLPOWER_REROLL = 3;
export const WILLPOWER_MAX_DICE = 25;

/** Evaluates rolled dice and works out which follow-ups the roller is offered. */
export function judge(
  request: RollRequest,
  normal: number[],
  hunger: number[],
  npc = false,
): Extract<RollResponse, { kind: 'rolled' }> {
  const pool = buildPool({
    dice: request.dice,
    modifier: request.modifier,
    hunger: npc ? 0 : request.hunger,
  });
  const difficulty = request.difficulty > 0 ? request.difficulty : undefined;
  const result = evaluate(normal, hunger, { difficulty, failureIsPainful: request.retry });
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
    willpowerAvailable:
      !npc && !request.willpower && normal.length > 0 && normal.length <= WILLPOWER_MAX_DICE,
    npc,
  };
}

/**
 * Push Yourself (p. 104): spend 1 Willpower to reroll up to 3 normal dice, never Hunger dice.
 * `picked` are indexes into `normal`.
 */
export function rerollWithWillpower(
  request: RollRequest,
  normal: number[],
  hunger: number[],
  picked: number[],
  roller?: DieRoller,
): Extract<RollResponse, { kind: 'rolled' }> & { rerolled: [number, number][] } {
  const chosen = [...new Set(picked)]
    .filter((i) => Number.isInteger(i) && i >= 0 && i < normal.length)
    .slice(0, WILLPOWER_REROLL);
  const fresh = rollDice(chosen.length, roller);
  const next = [...normal];
  const rerolled: [number, number][] = chosen.map((i, k) => {
    next[i] = fresh[k]!;
    return [normal[i]!, fresh[k]!];
  });
  return { ...judge({ ...request, willpower: true }, next, hunger), rerolled };
}
