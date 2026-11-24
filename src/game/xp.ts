// Experience points for the Alpha 2.0 playtest (Player Packet ch. 2, "Advancement", pp. 64-66).
// Pure rules: the store keeps the log, these functions say what an award is worth.

/** The five reasons that earn 1 XP at the end of a session. */
export const AWARD_CONDITIONS = ['ambition', 'beast', 'flaw', 'loss', 'survival'] as const;
export type AwardCondition = (typeof AWARD_CONDITIONS)[number];

/** No character gets more than this from the session conditions in one session. */
export const SESSION_XP_CAP = 5;
/** Largest single "other" award (downtime, Diablerie): a sanity bound, not a rule. */
export const MAX_OTHER_XP = 1000;
export const MAX_NOTE_LENGTH = 200;

export const isAwardCondition = (v: unknown): v is AwardCondition =>
  typeof v === 'string' && (AWARD_CONDITIONS as readonly string[]).includes(v);

/** One entry of a character's XP log; spending is negative. */
export interface XpEntry {
  id: number;
  at: number;
  actorId: string;
  amount: number;
  kind: 'session' | 'other' | 'spend' | 'refund';
  note: string;
  /** For a purchase: what it bought (an Advance, see advancement.ts). */
  advance?: unknown;
  /** For a refund: the purchase it undoes. */
  ref?: number;
}

/** The award a Storyteller asked for: 1 XP per condition, or a free amount (outside the cap). */
export type AwardRequest = { conditions: AwardCondition[] } | { other: number; note: string };

/** Checks a request body; undefined when it is not a valid award. */
export function parseAward(v: Record<string, unknown>): AwardRequest | undefined {
  if (v.conditions !== undefined) {
    if (!Array.isArray(v.conditions) || !v.conditions.every(isAwardCondition)) return undefined;
    const conditions = [...new Set(v.conditions)];
    return conditions.length ? { conditions } : undefined;
  }
  if (
    Number.isInteger(v.other) &&
    (v.other as number) >= 1 &&
    (v.other as number) <= MAX_OTHER_XP
  ) {
    const note = typeof v.note === 'string' ? v.note.trim().slice(0, MAX_NOTE_LENGTH) : '';
    return note ? { other: v.other as number, note } : undefined;
  }
  return undefined;
}

export const awardAmount = (a: AwardRequest) =>
  'conditions' in a ? Math.min(SESSION_XP_CAP, a.conditions.length) : a.other;

/** XP earned so far and what is left to spend. */
export function totals(log: readonly XpEntry[]): { earned: number; balance: number } {
  let earned = 0;
  let balance = 0;
  for (const e of log) {
    balance += e.amount;
    if (e.kind === 'session' || e.kind === 'other') earned += e.amount;
  }
  return { earned, balance };
}

/** The log line of a purchase: kind and target, e.g. `skill:persuasion`. */
export function advanceNote(a: {
  kind: string;
  id?: string;
  skill?: string;
  name?: string;
}): string {
  return a.kind === 'specialty' ? `specialty:${a.skill}:${a.name}` : `${a.kind}:${a.id}`;
}
