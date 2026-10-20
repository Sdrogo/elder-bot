import { randomInt } from 'node:crypto';

/** Returns one d10 result, 1-10. Swappable so tests can load the dice. */
export type DieRoller = () => number;

export const d10: DieRoller = () => randomInt(1, 11);

export function rollDice(count: number, roller: DieRoller = d10): number[] {
  return Array.from({ length: Math.max(0, count) }, () => roller());
}
