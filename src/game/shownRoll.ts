import type { TestResult } from '../dice/test.js';
import type { ShownRoll } from '../state/stage.js';
import type { Store } from '../state/store.js';
import { TERMS } from '../ui/format.js';
import type { RollResponse } from './roll.js';

// The roll box at the bottom of the OBS scene: what a roll looked like, in game terms.

/** The result line and colour of one test, as the overlay shows them. */
export function resultOf(result: TestResult): Pick<ShownRoll, 'outcome' | 'tone'> {
  switch (result.outcome) {
    case 'success':
      return result.criticalWin
        ? { outcome: TERMS.criticalWin, tone: 'critical' }
        : { outcome: TERMS.success, tone: 'win' };
    case 'failure':
      return result.bestial
        ? { outcome: TERMS.bestial, tone: 'bestial' }
        : { outcome: TERMS.failure, tone: 'fail' };
    case 'painful-failure':
      return result.bestial
        ? { outcome: TERMS.bestial, tone: 'bestial' }
        : { outcome: TERMS.painful, tone: 'fail' };
    default:
      return { outcome: '', tone: 'neutral' };
  }
}

/** A test from /roll, /npc, /frenzy, a Willpower reroll or Try again, for the overlay. */
export function shownTest(
  who: string,
  label: string,
  response: RollResponse,
): Omit<ShownRoll, 'at'> {
  const difficulty = response.request.difficulty > 0 ? response.request.difficulty : undefined;
  const base = { label, ...(difficulty ? { difficulty } : {}) };
  if (response.kind === 'half') {
    const won = response.won;
    return {
      ...base,
      sides: [{ who, normal: [], hunger: [], successes: response.successes }],
      outcome: TERMS.takingHalf,
      tone: won === undefined ? 'neutral' : won ? 'win' : 'fail',
    };
  }
  if (response.kind === 'no-dice') {
    return {
      ...base,
      sides: [{ who, normal: [], hunger: [], successes: 0 }],
      outcome: TERMS.failure,
      tone: 'fail',
    };
  }
  const { result } = response;
  return {
    ...base,
    sides: [{ who, normal: result.dice, hunger: result.hunger, successes: result.successes }],
    ...resultOf(result),
  };
}

/** The roller's place in a title such as "Marco: Persuasion", left out of the label. */
export function labelOf(title: string, displayName: string): string {
  const prefix = `${displayName}: `;
  return title.startsWith(prefix) ? title.slice(prefix.length) : title;
}

/**
 * Keeps a roll for the overlay of the Chronicle it belongs to. Shown under the name of the
 * roller's character when they have one there, otherwise their Discord name.
 */
export function showRoll(
  store: Store,
  where: { guildId: string | null; channelId: string; userId: string; displayName: string },
  make: (who: string) => Omit<ShownRoll, 'at'>,
): void {
  try {
    const found = store.campaign.rollChronicle(where.guildId, where.channelId, where.userId);
    if (!found) return;
    store.stage.recordRoll(found.chronicle.id, make(found.character?.name ?? where.displayName));
  } catch (error) {
    // The roll on Discord matters more than the overlay.
    console.error('Tiro non salvato per l’overlay:', (error as Error).message);
  }
}
