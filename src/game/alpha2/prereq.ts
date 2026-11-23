// Prerequisites as data: every merit, clan trait and lifepath in the packet fits this shape.

import type { Discipline } from './disciplines.js';

/** Tiers of play in creation order. Duskborn play at the neonate tier (p. 114). */
export const CREATION_TIERS = ['duskborn', 'neonate', 'ancilla', 'elder'] as const;
export type CreationTier = (typeof CREATION_TIERS)[number];

export type Creature = 'vampire' | 'duskborn' | 'ghoul';

/** Tier-of-play strength used by "Neonate or stronger" rules. */
export type PlayTier = 'neonate' | 'ancilla' | 'elder';
const PLAY_RANK: Record<PlayTier, number> = { neonate: 0, ancilla: 1, elder: 2 };

export const playTier = (t: CreationTier): PlayTier => (t === 'duskborn' ? 'neonate' : t);
export const creatureOf = (t: CreationTier): Creature =>
  t === 'duskborn' ? 'duskborn' : 'vampire';

/** One Discipline requirement: at least `dots` dots in `discipline`. */
export interface DotsReq {
  discipline: Discipline;
  dots: number;
}

export interface Prereq {
  /** "Neonate or stronger", "Ancilla or stronger". */
  minTier?: PlayTier;
  /** Allowed creature types; absent = any. */
  creatures?: readonly Creature[];
  /** AND of groups; each group is satisfied by ANY of its entries ("A or B"). */
  dots?: readonly (readonly DotsReq[])[];
  /** Clan curse needed (only Rarefied Smell asks for one). */
  curse?: string;
}

/** Why an option is out of reach, as data: the panel turns it into words in its own language. */
export type Reason =
  | { kind: 'tier'; min: PlayTier }
  | { kind: 'creature'; allowed: readonly Creature[] }
  | { kind: 'dots'; anyOf: readonly DotsReq[] }
  | { kind: 'curse'; curse: string }
  | { kind: 'clan' }
  | { kind: 'incomplete' }
  | { kind: 'taken' }
  | { kind: 'budget' }
  | { kind: 'rank'; rank: number; dots: number }
  | { kind: 'storyteller' };

export interface PrereqSubject {
  tier: CreationTier;
  dots: Partial<Record<Discipline, number>>;
  curse?: string;
}

/** Every unmet requirement of `p`; empty when the subject qualifies. */
export function unmet(p: Prereq | undefined, s: PrereqSubject): Reason[] {
  if (!p) return [];
  const out: Reason[] = [];
  if (p.minTier && PLAY_RANK[playTier(s.tier)] < PLAY_RANK[p.minTier]) {
    out.push({ kind: 'tier', min: p.minTier });
  }
  if (p.creatures && !p.creatures.includes(creatureOf(s.tier))) {
    out.push({ kind: 'creature', allowed: p.creatures });
  }
  for (const group of p.dots ?? []) {
    if (!group.some((r) => (s.dots[r.discipline] ?? 0) >= r.dots)) {
      out.push({ kind: 'dots', anyOf: group });
    }
  }
  if (p.curse && s.curse !== p.curse) out.push({ kind: 'curse', curse: p.curse });
  return out;
}

/** Shorthands that keep the data files readable. */
export const need = (discipline: Discipline, dots = 1): DotsReq[] => [{ discipline, dots }];
export const VAMPIRE_OR_DUSKBORN: readonly Creature[] = ['duskborn', 'vampire'];
