// Creation budgets and limits per creature and tier (Player Packet pp. 22, 28, 36, 44).

import type { CreationTier } from './prereq.js';

export interface TierRules {
  /** Maximum dots in an Attribute or Resource. */
  maxDots: number;
  /** Maximum dots in one Discipline at any time. */
  maxDiscipline: number;
  /** Maximum dots in one Discipline at the start of play. */
  startDiscipline: number;
  /** Maximum dots in one Skill during creation. */
  maxSkill: number;
  generationModifier: number;
  generations: readonly [number, number];
  lifepaths: number;
  /** Primary / secondary / tertiary Attribute dots, on top of the free dot each. */
  attributes: readonly [number, number, number];
  /** Dots in clan Disciplines; the sire's bonus dot comes on top. */
  clanDisciplineDots: number;
  /** Extra dots, beyond the sire's, that can go outside the clan (ancilla, elder). */
  extraDisciplineDots: number;
  powers: number;
  merits: number;
  clanTraits: number;
  extraSkills: number;
  extraResources: number;
}

export const TIER_RULES: Record<CreationTier, TierRules> = {
  duskborn: {
    maxDots: 5,
    maxDiscipline: 3,
    startDiscipline: 2,
    maxSkill: 3,
    generationModifier: 1,
    generations: [14, 16],
    lifepaths: 2,
    attributes: [6, 4, 3],
    clanDisciplineDots: 2,
    extraDisciplineDots: 0,
    powers: 3,
    merits: 1,
    clanTraits: 1,
    extraSkills: 8,
    extraResources: 2,
  },
  neonate: {
    maxDots: 5,
    maxDiscipline: 5,
    startDiscipline: 3,
    maxSkill: 3,
    generationModifier: 1,
    generations: [11, 13],
    lifepaths: 2,
    attributes: [7, 5, 3],
    clanDisciplineDots: 3,
    extraDisciplineDots: 0,
    powers: 4,
    merits: 1,
    clanTraits: 2,
    extraSkills: 8,
    extraResources: 3,
  },
  ancilla: {
    maxDots: 7,
    maxDiscipline: 7,
    startDiscipline: 4,
    maxSkill: 4,
    generationModifier: 2,
    generations: [9, 10],
    lifepaths: 3,
    attributes: [8, 6, 4],
    clanDisciplineDots: 5,
    extraDisciplineDots: 1,
    powers: 7,
    merits: 2,
    clanTraits: 3,
    extraSkills: 8,
    extraResources: 5,
  },
  elder: {
    maxDots: 8,
    maxDiscipline: 8,
    startDiscipline: 6,
    maxSkill: 5,
    generationModifier: 3,
    generations: [6, 8],
    lifepaths: 4,
    attributes: [9, 7, 5],
    clanDisciplineDots: 7,
    extraDisciplineDots: 2,
    powers: 10,
    merits: 3,
    clanTraits: 4,
    extraSkills: 8,
    extraResources: 7,
  },
};

/** Dots each lifepath gives (p. 29), and the "young character" extras (p. 30). */
export const LIFEPATH_SKILL_DOTS = 5;
export const LIFEPATH_RESOURCE_DOTS = 3;
export const YOUNG_EXTRA_SKILLS = 4;
export const YOUNG_EXTRA_RESOURCES = 2;
export const YOUNG_MAX_SKILL = 3;
export const STARTING_HUMANITY = 6;
