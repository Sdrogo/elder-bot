// Character creation engine for the Alpha 2.0 playtest (Player Packet ch. 2, "Making Your Monster").
// Pure functions with no I/O: the web panel runs them to filter options and count points as the
// player builds the sheet, and the server runs the same code again before it saves anything.

import {
  LIFEPATHS_BY_ID,
  MERITS,
  MERITS_BY_ID,
  PATHS,
  SIRES,
  SIRES_BY_ID,
} from './alpha2/background.js';
import type { Lifepath } from './alpha2/background.js';
import {
  ALPHA2_CLANS,
  CLAN_INFO,
  CLAN_TRAITS,
  CLAN_TRAITS_BY_ID,
  clanDisciplines,
  type Alpha2Clan,
} from './alpha2/clans.js';
import {
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTES,
  ATTRIBUTES_BY_CATEGORY,
  SKILLS,
  type Attribute,
  type AttributeCategory,
  type ResourceKind,
  type Skill,
} from './alpha2/core.js';
import { DISCIPLINES, POWERS, POWERS_BY_ID, type Discipline } from './alpha2/disciplines.js';
import { unmet, type CreationTier, type Prereq, type Reason } from './alpha2/prereq.js';
import {
  LIFEPATH_RESOURCE_DOTS,
  LIFEPATH_SKILL_DOTS,
  STARTING_HUMANITY,
  TIER_RULES,
  YOUNG_EXTRA_RESOURCES,
  YOUNG_EXTRA_SKILLS,
  YOUNG_MAX_SKILL,
} from './alpha2/tiers.js';

// ---------- The draft the player fills in ----------

export interface LifepathPick {
  id: string;
  /** Dots this lifepath puts in its own Skills. */
  skills: Partial<Record<Skill, number>>;
  /** Dots per entry of the lifepath's Resources list, in the same order. */
  resources: number[];
  /** Subjects the player writes for those entries (e.g. which Contact), same order. */
  resourceDetails?: string[];
}

export interface ResourcePick {
  kind: ResourceKind;
  /** The specific subject, e.g. "Contact: Mechanic". */
  detail: string;
  dots: number;
}

export interface FlawPick {
  /** An example flaw id, or absent for one the player wrote. */
  id?: string;
  name: string;
  note?: string;
}

export interface SheetDraft {
  tier: CreationTier;
  clan?: Alpha2Clan;
  /** Tzimisce's third clan Discipline: [Tellurgy] or Vicissitude. */
  clanChoice?: Discipline;
  sire?: string;
  sireDiscipline?: Discipline;
  /** Brood Child: the coterie member the Discipline was learned from. */
  broodmate?: string;
  generation?: number;
  /** "Young character" option: one lifepath with extra dots (p. 30). */
  young?: boolean;
  lifepaths: LifepathPick[];
  attributePriority?: readonly AttributeCategory[];
  /** Total dots, counting the free one every Attribute starts with. */
  attributes: Partial<Record<Attribute, number>>;
  /** Skill dots outside the lifepaths (step 5). */
  extraSkills: Partial<Record<Skill, number>>;
  specialties: Partial<Record<Skill, string[]>>;
  /** Total dots per Discipline, counting the sire's bonus dot. */
  disciplines: Partial<Record<Discipline, number>>;
  powers: string[];
  clanTraits: string[];
  merits: string[];
  /** A Path of Enlightenment id; absent = Humanity. */
  path?: string;
  /** Resource dots outside the lifepaths (step 8). */
  extraResources: ResourcePick[];
  flaws: FlawPick[];
  name?: string;
  /** A tracker-only character this sheet completes, instead of making a new one. */
  characterId?: number;
}

export function emptyDraft(tier: CreationTier): SheetDraft {
  return {
    tier,
    lifepaths: [],
    attributes: {},
    extraSkills: {},
    specialties: {},
    disciplines: {},
    powers: [],
    clanTraits: [],
    merits: [],
    extraResources: [],
    flaws: [],
  };
}

// ---------- Small helpers ----------

const sum = (values: Iterable<number>) => {
  let total = 0;
  for (const v of values) total += v;
  return total;
};
const dotsOf = <K extends string>(rec: Partial<Record<K, number>>, k: K) => rec[k] ?? 0;
const rules = (d: SheetDraft) => TIER_RULES[d.tier];

/** Lifepath groups a character may pick from (p. 29). */
export function allowedLifepathGroups(tier: CreationTier): Lifepath['group'][] {
  if (tier === 'duskborn' || tier === 'neonate') return ['mortal', 'neonate'];
  return ['mortal', 'neonate', 'ancilla'];
}

/** How many lifepaths the draft needs. Young characters take one instead of two. */
export function lifepathCount(d: SheetDraft): number {
  return youngAllowed(d.tier) && d.young ? 1 : rules(d).lifepaths;
}
export const youngAllowed = (tier: CreationTier) => TIER_RULES[tier].lifepaths === 2;

const isYoung = (d: SheetDraft) => youngAllowed(d.tier) && !!d.young;
const lifepathSkillDots = (d: SheetDraft) =>
  LIFEPATH_SKILL_DOTS + (isYoung(d) ? YOUNG_EXTRA_SKILLS : 0);
const lifepathResourceDots = (d: SheetDraft) =>
  LIFEPATH_RESOURCE_DOTS + (isYoung(d) ? YOUNG_EXTRA_RESOURCES : 0);
const skillCap = (d: SheetDraft) =>
  isYoung(d) ? Math.min(YOUNG_MAX_SKILL, rules(d).maxSkill) : rules(d).maxSkill;

export const attributeDots = (d: SheetDraft, a: Attribute) => Math.max(1, dotsOf(d.attributes, a));

/** Total Skill dots: every lifepath's plus the extra ones. */
export function skillDots(d: SheetDraft, skill: Skill): number {
  return sum(d.lifepaths.map((l) => dotsOf(l.skills, skill))) + dotsOf(d.extraSkills, skill);
}

/** Specialties allowed in a Skill: one at 1, 3 and 5 dots, one more when two lifepaths fed it. */
export function specialtySlots(d: SheetDraft, skill: Skill): number {
  const dots = skillDots(d, skill);
  const thresholds = [1, 3, 5].filter((t) => dots >= t).length;
  const fed = d.lifepaths.filter((l) => dotsOf(l.skills, skill) > 0).length;
  return thresholds + (thresholds > 0 && fed >= 2 ? 1 : 0);
}

export function clanSet(d: SheetDraft): Discipline[] {
  return d.clan ? clanDisciplines(d.clan, d.clanChoice) : [];
}

/** Dots that cost points: the sire's bonus dot is free. */
function boughtDots(d: SheetDraft, disc: Discipline): number {
  return Math.max(0, dotsOf(d.disciplines, disc) - (d.sireDiscipline === disc ? 1 : 0));
}

/** True when the powers' ranks can all sit on distinct dots of a Discipline with `dots` dots. */
export function ranksFit(ranks: readonly number[], dots: number): boolean {
  if (ranks.length > dots) return false;
  const desc = [...ranks].sort((a, b) => b - a);
  return desc.every((rank, i) => rank <= dots - i);
}

const powerRanks = (powers: readonly string[], disc: Discipline) =>
  powers
    .map((id) => POWERS_BY_ID.get(id))
    .filter((p) => p?.discipline === disc)
    .map((p) => p!.rank);

const subject = (d: SheetDraft) => ({
  tier: d.tier,
  dots: d.disciplines,
  curse: d.clan ? CLAN_INFO[d.clan].curse : undefined,
});

// ---------- Pools and issues ----------

export interface Pool {
  spent: number;
  budget: number;
}

export type Step =
  | 'type'
  | 'clan'
  | 'sire'
  | 'lifepaths'
  | 'attributes'
  | 'skills'
  | 'disciplines'
  | 'traits'
  | 'merits'
  | 'humanity'
  | 'resources'
  | 'details';

/**
 * `error`: breaks a rule and must be fixed. `todo`: still to fill before the sheet is complete.
 * `hint`: optional (specialties not chosen yet, a generation the Storyteller has not set).
 */
export interface Issue {
  step: Step;
  severity: 'error' | 'todo' | 'hint';
  code: string;
  /** What the issue is about: a Skill, a Discipline, a lifepath, a merit… */
  target?: string;
  value?: number;
  limit?: number;
}

/** Choices the packet leaves to the Storyteller: the sheet saves, but shows them as pending. */
export interface Approval {
  code: 'brood-child' | 'path';
  target?: string;
}

export interface Evaluation {
  pools: {
    attributes: Record<AttributeCategory, Pool>;
    lifepathSkills: Pool[];
    extraSkills: Pool;
    disciplines: Pool;
    outOfClan: Pool;
    powers: Pool;
    merits: Pool;
    clanTraits: Pool;
    lifepathResources: Pool[];
    extraResources: Pool;
    flaws: Pool;
  };
  derived: {
    generationModifier: number;
    health: number;
    vitae: number;
    willpower: number;
    humanity: number;
  };
  issues: Issue[];
  approvals: Approval[];
  /** No errors and nothing left to do. */
  complete: boolean;
}

export function evaluate(d: SheetDraft): Evaluation {
  const t = rules(d);
  const issues: Issue[] = [];
  const approvals: Approval[] = [];
  const add = (i: Issue) => issues.push(i);

  // Step 2: clan.
  if (!d.clan) add({ step: 'clan', severity: 'todo', code: 'clan-missing' });
  else if (!CLAN_INFO[d.clan].complete)
    add({ step: 'clan', severity: 'error', code: 'clan-incomplete', target: d.clan });
  else if (
    CLAN_INFO[d.clan].choice &&
    !CLAN_INFO[d.clan].choice!.includes(d.clanChoice as Discipline)
  ) {
    add({ step: 'clan', severity: 'todo', code: 'clan-choice-missing', target: d.clan });
  }

  // Step 3: sire and generation.
  const sire = d.sire ? SIRES_BY_ID.get(d.sire) : undefined;
  if (!d.sire) add({ step: 'sire', severity: 'todo', code: 'sire-missing' });
  else if (!sire) add({ step: 'sire', severity: 'error', code: 'sire-unknown', target: d.sire });
  else if (!d.sireDiscipline)
    add({ step: 'sire', severity: 'todo', code: 'sire-discipline-missing' });
  else if (sire.disciplines.length && !sire.disciplines.includes(d.sireDiscipline)) {
    add({
      step: 'sire',
      severity: 'error',
      code: 'sire-discipline-not-allowed',
      target: d.sireDiscipline,
    });
  } else if (!POWERS.some((p) => p.discipline === d.sireDiscipline)) {
    add({
      step: 'sire',
      severity: 'error',
      code: 'discipline-without-powers',
      target: d.sireDiscipline,
    });
  }
  if (sire?.id === 'brood-child') {
    approvals.push({ code: 'brood-child', target: d.broodmate });
    if (!d.broodmate?.trim()) add({ step: 'sire', severity: 'todo', code: 'broodmate-missing' });
  }
  if (d.generation === undefined)
    add({ step: 'sire', severity: 'hint', code: 'generation-missing' });
  else if (d.generation < t.generations[0] || d.generation > t.generations[1]) {
    add({ step: 'sire', severity: 'error', code: 'generation-out-of-range', value: d.generation });
  }

  // Step 4: lifepaths.
  const wanted = lifepathCount(d);
  if (d.young && !youngAllowed(d.tier))
    add({ step: 'lifepaths', severity: 'error', code: 'young-not-allowed' });
  if (d.lifepaths.length < wanted) {
    add({
      step: 'lifepaths',
      severity: 'todo',
      code: 'lifepaths-missing',
      value: d.lifepaths.length,
      limit: wanted,
    });
  } else if (d.lifepaths.length > wanted) {
    add({
      step: 'lifepaths',
      severity: 'error',
      code: 'lifepaths-too-many',
      value: d.lifepaths.length,
      limit: wanted,
    });
  }
  const groups = allowedLifepathGroups(d.tier);
  const seen = new Set<string>();
  const lifepathSkills: Pool[] = [];
  const lifepathResources: Pool[] = [];
  for (const pick of d.lifepaths) {
    const lp = LIFEPATHS_BY_ID.get(pick.id);
    if (!lp) {
      add({ step: 'lifepaths', severity: 'error', code: 'lifepath-unknown', target: pick.id });
      lifepathSkills.push({ spent: 0, budget: 0 });
      lifepathResources.push({ spent: 0, budget: 0 });
      continue;
    }
    if (seen.has(lp.id))
      add({ step: 'lifepaths', severity: 'error', code: 'lifepath-repeated', target: lp.id });
    seen.add(lp.id);
    if (!groups.includes(lp.group))
      add({ step: 'lifepaths', severity: 'error', code: 'lifepath-tier', target: lp.id });

    const own = new Set(lp.skills.map((s) => s.skill));
    for (const skill of SKILLS) {
      if (dotsOf(pick.skills, skill) > 0 && !own.has(skill)) {
        add({
          step: 'skills',
          severity: 'error',
          code: 'skill-not-in-lifepath',
          target: `${lp.id}:${skill}`,
        });
      }
      if (dotsOf(pick.skills, skill) < 0)
        add({ step: 'skills', severity: 'error', code: 'negative', target: skill });
    }
    const skillPool = {
      spent: sum(Object.values(pick.skills) as number[]),
      budget: lifepathSkillDots(d),
    };
    lifepathSkills.push(skillPool);
    poolIssues(add, 'skills', 'lifepath-skills', skillPool, lp.id);

    const resPool = {
      spent: sum(pick.resources.slice(0, lp.resources.length)),
      budget: lifepathResourceDots(d),
    };
    if (pick.resources.length > lp.resources.length || pick.resources.some((n) => n < 0)) {
      add({
        step: 'resources',
        severity: 'error',
        code: 'resource-not-in-lifepath',
        target: lp.id,
      });
    }
    lifepathResources.push(resPool);
    poolIssues(add, 'resources', 'lifepath-resources', resPool, lp.id);
  }

  // Step 5: Attributes.
  const priority = d.attributePriority ?? [];
  const validPriority =
    priority.length === 3 && ATTRIBUTE_CATEGORIES.every((c) => priority.includes(c));
  if (!validPriority) add({ step: 'attributes', severity: 'todo', code: 'priority-missing' });
  const attributes = {} as Record<AttributeCategory, Pool>;
  for (const cat of ATTRIBUTE_CATEGORIES) {
    const rank = validPriority ? priority.indexOf(cat) : -1;
    const pool = {
      spent: sum(ATTRIBUTES_BY_CATEGORY[cat].map((a) => attributeDots(d, a) - 1)),
      budget: rank >= 0 ? (t.attributes.at(rank) ?? 0) : 0,
    };
    attributes[cat] = pool;
    if (validPriority) poolIssues(add, 'attributes', 'attributes', pool, cat);
  }
  for (const a of ATTRIBUTES) {
    if (attributeDots(d, a) > t.maxDots) {
      add({
        step: 'attributes',
        severity: 'error',
        code: 'attribute-max',
        target: a,
        limit: t.maxDots,
      });
    }
  }

  // Step 5: extra Skills, caps and specialties.
  const extraSkills = {
    spent: sum(Object.values(d.extraSkills) as number[]),
    budget: t.extraSkills,
  };
  poolIssues(add, 'skills', 'extra-skills', extraSkills);
  for (const skill of SKILLS) {
    if (dotsOf(d.extraSkills, skill) < 0)
      add({ step: 'skills', severity: 'error', code: 'negative', target: skill });
    const dots = skillDots(d, skill);
    if (dots > skillCap(d))
      add({
        step: 'skills',
        severity: 'error',
        code: 'skill-max',
        target: skill,
        value: dots,
        limit: skillCap(d),
      });
    const chosen = d.specialties[skill]?.filter((s) => s.trim()) ?? [];
    const slots = specialtySlots(d, skill);
    if (chosen.length > slots) {
      add({
        step: 'skills',
        severity: 'error',
        code: 'specialties-too-many',
        target: skill,
        value: chosen.length,
        limit: slots,
      });
    } else if (chosen.length < slots) {
      add({
        step: 'skills',
        severity: 'hint',
        code: 'specialties-free',
        target: skill,
        value: chosen.length,
        limit: slots,
      });
    }
  }

  // Step 6: Disciplines and powers.
  const inClan = new Set(clanSet(d));
  let clanSpent = 0;
  let outSpent = 0;
  for (const disc of DISCIPLINES) {
    const dots = dotsOf(d.disciplines, disc);
    if (dots < 0) add({ step: 'disciplines', severity: 'error', code: 'negative', target: disc });
    if (dots > t.startDiscipline) {
      add({
        step: 'disciplines',
        severity: 'error',
        code: 'discipline-max',
        target: disc,
        value: dots,
        limit: t.startDiscipline,
      });
    }
    const bought = boughtDots(d, disc);
    if (inClan.has(disc)) clanSpent += bought;
    else outSpent += bought;
    const ranks = powerRanks(d.powers, disc);
    if (!ranksFit(ranks, dots))
      add({ step: 'disciplines', severity: 'error', code: 'powers-rank', target: disc });
    else if (ranks.length < dots) {
      add({
        step: 'disciplines',
        severity: 'todo',
        code: 'powers-missing',
        target: disc,
        value: ranks.length,
        limit: dots,
      });
    }
  }
  if (d.sireDiscipline && dotsOf(d.disciplines, d.sireDiscipline) < 1) {
    add({
      step: 'disciplines',
      severity: 'todo',
      code: 'sire-dot-missing',
      target: d.sireDiscipline,
    });
  }
  const disciplines = {
    spent: clanSpent + outSpent,
    budget: t.clanDisciplineDots + t.extraDisciplineDots,
  };
  const outOfClan = { spent: outSpent, budget: t.extraDisciplineDots };
  if (outSpent > outOfClan.budget)
    add({
      step: 'disciplines',
      severity: 'error',
      code: 'out-of-clan',
      value: outSpent,
      limit: outOfClan.budget,
    });
  poolIssues(add, 'disciplines', 'disciplines', disciplines);
  const knownPowers = new Set<string>();
  for (const id of d.powers) {
    if (!POWERS_BY_ID.has(id))
      add({ step: 'disciplines', severity: 'error', code: 'power-unknown', target: id });
    if (knownPowers.has(id))
      add({ step: 'disciplines', severity: 'error', code: 'power-repeated', target: id });
    knownPowers.add(id);
  }
  const powers = { spent: d.powers.length, budget: t.powers };
  poolIssues(add, 'disciplines', 'powers', powers);

  // Step 6: clan traits and merits.
  const clanTraits = { spent: d.clanTraits.length, budget: t.clanTraits };
  poolIssues(add, 'traits', 'clan-traits', clanTraits);
  checkPicks(add, 'traits', d.clanTraits, (id) => {
    const trait = CLAN_TRAITS_BY_ID.get(id);
    if (!trait) return 'unknown';
    if (trait.clan !== d.clan) return 'other-clan';
    return unmet(trait.prereq, subject(d)).length ? 'prereq' : undefined;
  });
  const merits = { spent: d.merits.length, budget: t.merits };
  poolIssues(add, 'merits', 'merits', merits);
  checkPicks(add, 'merits', d.merits, (id) => {
    const merit = MERITS_BY_ID.get(id);
    if (!merit) return 'unknown';
    return unmet(merit.prereq, subject(d)).length ? 'prereq' : undefined;
  });

  // Step 7: Humanity or a Path.
  if (d.path !== undefined) {
    if (!PATHS.some((p) => p.id === d.path))
      add({ step: 'humanity', severity: 'error', code: 'path-unknown', target: d.path });
    approvals.push({ code: 'path', target: d.path });
  }

  // Step 8: extra Resources and per-Resource caps.
  const extraResources = {
    spent: sum(d.extraResources.map((r) => r.dots)),
    budget: t.extraResources,
  };
  poolIssues(add, 'resources', 'extra-resources', extraResources);
  for (const r of d.extraResources) {
    if (r.dots < 0) add({ step: 'resources', severity: 'error', code: 'negative', target: r.kind });
    if (r.kind !== 'wealth' && !r.detail.trim())
      add({ step: 'resources', severity: 'todo', code: 'resource-detail-missing', target: r.kind });
  }
  for (const [key, dots] of resourceTotals(d)) {
    if (dots > t.maxDots)
      add({
        step: 'resources',
        severity: 'error',
        code: 'resource-max',
        target: key,
        value: dots,
        limit: t.maxDots,
      });
  }

  // Step 9: flaws and name.
  const flaws = {
    spent: d.flaws.filter((f) => f.name.trim()).length,
    budget: t.generationModifier,
  };
  if (flaws.spent < flaws.budget)
    add({
      step: 'details',
      severity: 'todo',
      code: 'flaws-missing',
      value: flaws.spent,
      limit: flaws.budget,
    });
  if (!d.name?.trim()) add({ step: 'details', severity: 'todo', code: 'name-missing' });

  return {
    pools: {
      attributes,
      lifepathSkills,
      extraSkills,
      disciplines,
      outOfClan,
      powers,
      merits,
      clanTraits,
      lifepathResources,
      extraResources,
      flaws,
    },
    derived: {
      generationModifier: t.generationModifier,
      health: attributeDots(d, 'stamina') + 5,
      vitae: 5 + 5 * t.generationModifier,
      willpower: attributeDots(d, 'composure') + attributeDots(d, 'resolve'),
      humanity: STARTING_HUMANITY,
    },
    issues,
    approvals,
    complete: !issues.some((i) => i.severity !== 'hint'),
  };
}

/** A pool over budget is an error; one under budget is still to do. */
function poolIssues(
  add: (i: Issue) => void,
  step: Step,
  code: string,
  pool: Pool,
  target?: string,
) {
  if (pool.spent > pool.budget)
    add({
      step,
      severity: 'error',
      code: `${code}-over`,
      target,
      value: pool.spent,
      limit: pool.budget,
    });
  else if (pool.spent < pool.budget)
    add({
      step,
      severity: 'todo',
      code: `${code}-left`,
      target,
      value: pool.spent,
      limit: pool.budget,
    });
}

function checkPicks(
  add: (i: Issue) => void,
  step: Step,
  ids: readonly string[],
  problem: (id: string) => string | undefined,
) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) add({ step, severity: 'error', code: 'repeated', target: id });
    seen.add(id);
    const p = problem(id);
    if (p) add({ step, severity: 'error', code: p, target: id });
  }
}

/** Resource dots summed by type and subject, so the same Resource from two sources counts once. */
export function resourceTotals(d: SheetDraft): Map<string, number> {
  const totals = new Map<string, number>();
  const put = (kind: ResourceKind, detail: string | undefined, dots: number) => {
    if (dots <= 0) return;
    const key = `${kind}:${(detail ?? '').trim().toLowerCase()}`;
    totals.set(key, (totals.get(key) ?? 0) + dots);
  };
  for (const pick of d.lifepaths) {
    const lp = LIFEPATHS_BY_ID.get(pick.id);
    lp?.resources.forEach((r, i) =>
      put(r.kind, pick.resourceDetails?.[i] || r.detail, pick.resources[i] ?? 0),
    );
  }
  for (const r of d.extraResources) put(r.kind, r.detail, r.dots);
  return totals;
}

// ---------- Options for the wizard ----------

export interface Option<T = string> {
  id: T;
  available: boolean;
  /** Why it is out of reach; empty when available. */
  reasons: Reason[];
}

const option = <T>(id: T, reasons: Reason[]): Option<T> => ({
  id,
  available: !reasons.length,
  reasons,
});

/** All clans; the "in development" ones are shown but locked. */
export function clanOptions(): Option<Alpha2Clan>[] {
  return ALPHA2_CLANS.map((c) => option(c, CLAN_INFO[c].complete ? [] : [{ kind: 'incomplete' }]));
}

/** Sires are always open; Brood Child also asks for a broodmate and the Storyteller's approval. */
export function sireOptions(): Option[] {
  return SIRES.map((s) => option(s.id, []));
}

/** Disciplines the chosen sire can grant. Brood Child: any Discipline that has powers. */
export function sireDisciplineOptions(d: SheetDraft): Option<Discipline>[] {
  const sire = d.sire ? SIRES_BY_ID.get(d.sire) : undefined;
  if (!sire) return [];
  const list = sire.disciplines.length
    ? sire.disciplines
    : DISCIPLINES.filter((disc) => POWERS.some((p) => p.discipline === disc));
  return list.map((disc) => option(disc, []));
}

/** Lifepaths with tier limits and repeats marked. */
export function lifepathOptions(d: SheetDraft): Option[] {
  const groups = allowedLifepathGroups(d.tier);
  const taken = new Set(d.lifepaths.map((l) => l.id));
  return [...LIFEPATHS_BY_ID.values()].map((lp) => {
    const reasons: Reason[] = [];
    if (!groups.includes(lp.group)) reasons.push({ kind: 'tier', min: 'ancilla' });
    if (taken.has(lp.id)) reasons.push({ kind: 'taken' });
    return option(lp.id, reasons);
  });
}

export interface DisciplineRoom {
  discipline: Discipline;
  inClan: boolean;
  dots: number;
  /** Highest value the next click may reach, given the start limit and points left. */
  max: number;
  hasPowers: boolean;
}

/** For each Discipline the player can touch: current dots and how far they can go. */
export function disciplineRoom(d: SheetDraft): DisciplineRoom[] {
  const t = rules(d);
  const ev = evaluate(d);
  const inClan = new Set(clanSet(d));
  const leftTotal = ev.pools.disciplines.budget - ev.pools.disciplines.spent;
  const leftOut = ev.pools.outOfClan.budget - ev.pools.outOfClan.spent;
  return DISCIPLINES.filter(
    (disc) =>
      inClan.has(disc) ||
      disc === d.sireDiscipline ||
      t.extraDisciplineDots > 0 ||
      dotsOf(d.disciplines, disc) > 0,
  ).map((disc) => {
    const dots = dotsOf(d.disciplines, disc);
    const isIn = inClan.has(disc);
    const left = Math.max(0, isIn ? leftTotal : Math.min(leftTotal, leftOut));
    const floor = d.sireDiscipline === disc ? 1 : 0;
    return {
      discipline: disc,
      inClan: isIn,
      dots,
      max: Math.min(t.startDiscipline, Math.max(dots, floor) + left),
      hasPowers: POWERS.some((p) => p.discipline === disc),
    };
  });
}

/** Powers of one Discipline, locked by rank, by repeats and by the dots left to fill. */
export function powerOptions(d: SheetDraft, disc: Discipline): Option[] {
  const dots = dotsOf(d.disciplines, disc);
  const chosen = d.powers.filter((id) => POWERS_BY_ID.get(id)?.discipline === disc);
  const ranks = powerRanks(chosen, disc);
  return POWERS.filter((p) => p.discipline === disc).map((p) => {
    if (chosen.includes(p.id)) return option(p.id, []);
    const reasons: Reason[] = [];
    if (p.rank > dots) reasons.push({ kind: 'rank', rank: p.rank, dots });
    else if (!ranksFit([...ranks, p.rank], dots)) reasons.push({ kind: 'budget' });
    return option(p.id, reasons);
  });
}

const withLimit = <T>(opts: Option<T>[], chosen: readonly string[], budget: number) => {
  const full = chosen.length >= budget;
  return opts.map((o) =>
    full && o.available && !chosen.includes(o.id as string)
      ? { ...o, available: false, reasons: [{ kind: 'budget' } as Reason] }
      : o,
  );
};

const prereqOption = (
  id: string,
  prereq: Prereq | undefined,
  d: SheetDraft,
  taken: readonly string[],
) => (taken.includes(id) ? option(id, []) : option(id, unmet(prereq, subject(d))));

/** The clan's traits, with unmet prerequisites as reasons. */
export function clanTraitOptions(d: SheetDraft): Option[] {
  if (!d.clan) return [];
  const opts = CLAN_TRAITS.filter((tr) => tr.clan === d.clan).map((tr) =>
    prereqOption(tr.id, tr.prereq, d, d.clanTraits),
  );
  return withLimit(opts, d.clanTraits, rules(d).clanTraits);
}

/** All merits, with unmet prerequisites as reasons. */
export function meritOptions(d: SheetDraft): Option[] {
  const opts = MERITS.map((m) => prereqOption(m.id, m.prereq, d, d.merits));
  return withLimit(opts, d.merits, rules(d).merits);
}

/** Paths of Enlightenment: selectable, but the sheet lists them as waiting for the Storyteller. */
export function pathOptions(): Option[] {
  return PATHS.map((p) => option(p.id, []));
}

// ---------- Hand-off to the trackers ----------

/** What the existing `characters` row needs once the sheet is complete. */
export function trackerValues(d: SheetDraft) {
  return {
    tier: d.tier,
    stamina: attributeDots(d, 'stamina'),
    composure: attributeDots(d, 'composure'),
    resolve: attributeDots(d, 'resolve'),
    humanity: STARTING_HUMANITY,
  };
}
