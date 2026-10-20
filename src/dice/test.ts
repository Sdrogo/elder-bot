// Core test rules from the Player Packet, Chapter 4 "Rules of the Night" (Alpha 1.0, pp. 76-81).

/** A die showing this value or higher is a success. */
export const SUCCESS_THRESHOLD = 8;
/** With this many dice left after Difficulty you may skip the roll and take a basic success. */
export const OVERQUALIFIED_MIN_DICE = 4;

export interface PoolInput {
  /** Attribute + Skill (or Discipline, or Composure + Resolve). */
  dice: number;
  difficulty?: number;
  /** Dice bonuses and penalties: focus, assist, conditions, scene traits. */
  modifier?: number;
  /** Dice bought with [Quickening], spent before the roll. */
  quickening?: number;
}

export interface Pool {
  /** Pool before Difficulty: dice + modifier, never below 0. */
  base: number;
  /** Pool after Difficulty, never below 0. Overqualified and No Dice Left look at this value. */
  afterDifficulty: number;
  /** Dice actually rolled: afterDifficulty + Quickening dice. */
  total: number;
}

/**
 * Difficulty removes dice and can never take the pool below 0 (p. 80).
 * Bonuses and penalties are applied to the starting pool, before Difficulty;
 * [Quickening] dice are added last, as in the Ulfred dodge example (p. 83).
 */
export function buildPool({ dice, difficulty = 0, modifier = 0, quickening = 0 }: PoolInput): Pool {
  const base = Math.max(0, dice + modifier);
  const afterDifficulty = Math.max(0, base - difficulty);
  return { base, afterDifficulty, total: afterDifficulty + Math.max(0, quickening) };
}

/** [Overqualified] (p. 81): 4+ dice after Difficulty, never for attack or defense tests. */
export function canTakeOverqualified(pool: Pool, combat: boolean): boolean {
  return !combat && pool.afterDifficulty >= OVERQUALIFIED_MIN_DICE;
}

export type Outcome = 'success' | 'failure' | 'painful-failure';

export interface TestResult {
  dice: number[];
  successes: number;
  /** Successes beyond the first. */
  extraSuccesses: number;
  /** Each 10 earns 1 [Quickening]. */
  tens: number;
  ones: number;
  outcome: Outcome;
}

export interface EvaluateOptions {
  /** Trying Again (p. 79): any failure counts as a painful failure. */
  failureIsPainful?: boolean;
}

export function evaluate(
  dice: number[],
  { failureIsPainful = false }: EvaluateOptions = {},
): TestResult {
  const successes = dice.filter((d) => d >= SUCCESS_THRESHOLD).length;
  const tens = dice.filter((d) => d === 10).length;
  const ones = dice.filter((d) => d === 1).length;
  let outcome: Outcome;
  if (successes > 0) outcome = 'success';
  else if (ones > 0 || failureIsPainful) outcome = 'painful-failure';
  else outcome = 'failure';
  return {
    dice,
    successes,
    extraSuccesses: Math.max(0, successes - 1),
    tens,
    ones,
    outcome,
  };
}
