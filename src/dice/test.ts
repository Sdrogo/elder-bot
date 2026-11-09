// Core test rules from the Player Packet, Chapter 4 "Rules of the Night" (Alpha 2.0, pp. 93-104).

/** A die showing this value or higher is a success (p. 94). */
export const SUCCESS_THRESHOLD = 6;
/** A 10 is a critical success and counts as 2 successes (p. 96). */
export const CRITICAL = 10;
/** Hunger dice go from 0 to 5 (Hunger Dice per Vitae, p. 103). */
export const MAX_HUNGER = 5;

export interface PoolInput {
  /** Attribute + Skill (or Discipline, or Composure + Resolve). */
  dice: number;
  /** Dice bonuses and penalties: focus, assist, story assets, Impairment. */
  modifier?: number;
  /** The character's Hunger dice: they replace normal dice one for one (p. 103). */
  hunger?: number;
}

export interface Pool {
  /** Dice rolled: dice + modifier, never below 0. */
  total: number;
  /** How many of them are Hunger dice: never more than the pool. */
  hunger: number;
  /** Normal dice: the ones Willpower can reroll. */
  normal: number;
}

/** Difficulty no longer removes dice: it is the number of successes to reach (p. 96). */
export function buildPool({ dice, modifier = 0, hunger = 0 }: PoolInput): Pool {
  const total = Math.max(0, dice + modifier);
  const h = Math.min(total, Math.max(0, Math.min(MAX_HUNGER, hunger)));
  return { total, hunger: h, normal: total - h };
}

/** Taking Half (p. 94): skip the roll and count half the pool, rounded up, as successes. */
export function takeHalf(pool: number): number {
  return Math.ceil(Math.max(0, pool) / 2);
}

export type Outcome =
  /** Successes reached the Difficulty. */
  | 'success'
  /** At least one success, but fewer than the Difficulty. */
  | 'failure'
  /** No successes at all (p. 97): a failure plus a complication. */
  | 'painful-failure'
  /** No Difficulty given: the successes are compared later (contested test, open roll). */
  | 'open';

export interface TestResult {
  /** Normal dice faces. */
  dice: number[];
  /** Hunger dice faces. */
  hunger: number[];
  /** Each die on 6+ is one success, each 10 is two. */
  successes: number;
  /** Number of 10s rolled. */
  criticals: number;
  /** Difficulty of the test, if any. */
  difficulty?: number;
  outcome: Outcome;
  /** Won with at least one 10 (Critical Win, p. 19). */
  criticalWin: boolean;
  /** Failed (or painful) with a 1 on a Hunger die (p. 103). */
  bestial: boolean;
  /** A 1 on a Hunger die in an open roll: bestial if the test turns out to be lost. */
  hungerOnes: number;
  /** Successes above (positive) or below (negative) the Difficulty. */
  margin?: number;
}

export interface EvaluateOptions {
  difficulty?: number;
  /** Trying Again (p. 98): any failure counts as a painful failure. */
  failureIsPainful?: boolean;
}

export function countSuccesses(faces: number[]): number {
  return faces.reduce((n, d) => n + (d >= CRITICAL ? 2 : d >= SUCCESS_THRESHOLD ? 1 : 0), 0);
}

export function evaluate(
  dice: number[],
  hunger: number[] = [],
  { difficulty, failureIsPainful = false }: EvaluateOptions = {},
): TestResult {
  const all = [...dice, ...hunger];
  const successes = countSuccesses(all);
  const criticals = all.filter((d) => d >= CRITICAL).length;
  const hungerOnes = hunger.filter((d) => d === 1).length;
  const target = difficulty && difficulty > 0 ? difficulty : undefined;

  let outcome: Outcome;
  if (successes === 0) outcome = 'painful-failure';
  else if (target === undefined) outcome = 'open';
  else if (successes >= target) outcome = 'success';
  else outcome = failureIsPainful ? 'painful-failure' : 'failure';

  const failed = outcome === 'failure' || outcome === 'painful-failure';
  return {
    dice,
    hunger,
    successes,
    criticals,
    difficulty: target,
    outcome,
    criticalWin: outcome === 'success' && criticals > 0,
    bestial: failed && hungerOnes > 0,
    hungerOnes,
    margin: target === undefined ? undefined : successes - target,
  };
}
