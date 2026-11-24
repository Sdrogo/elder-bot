// Spending XP (Player Packet ch. 2, "Advancement", pp. 64-66). Pure rules, no I/O.
// The sheet saved by the wizard stays as it was made; purchases are a list on top of it, and
// applyAdvances() works out the sheet as it is now. The panel and the server run the same code.

import { MERITS_BY_ID } from './alpha2/background.js';
import { CLAN_TRAITS, CLAN_TRAITS_BY_ID } from './alpha2/clans.js';
import { ATTRIBUTES, SKILLS, type Attribute, type Skill } from './alpha2/core.js';
import { DISCIPLINES, POWERS, POWERS_BY_ID, type Discipline } from './alpha2/disciplines.js';
import { unmet, type Reason } from './alpha2/prereq.js';
import { TIER_RULES } from './alpha2/tiers.js';
import { MERITS } from './alpha2/background.js';
import { attributeDots, clanSet, ranksFit, skillDots, type SheetDraft } from './creation.js';
import { CLAN_INFO } from './alpha2/clans.js';

/** What a purchase adds; `power` on a Discipline is the free power its new dot brings. */
export type Advance =
  | { kind: 'attribute'; id: Attribute }
  | { kind: 'skill'; id: Skill }
  | { kind: 'specialty'; skill: Skill; name: string }
  | { kind: 'merit'; id: string }
  | { kind: 'trait'; id: string }
  | { kind: 'discipline'; id: Discipline; power?: string }
  | { kind: 'power'; id: string }
  /** One rank of Humanity: only with the Storyteller's word, and no violations (p. 128). */
  | { kind: 'humanity' };

/** XP costs of the Experience Costs table (p. 65). Every dot costs the same. */
export const XP_COSTS = {
  attribute: 20,
  skill: 10,
  specialty: 5,
  merit: 8,
  traitOwn: 10,
  traitOther: 15,
  disciplineOwn: 15,
  disciplineOther: 20,
  power: 8,
  humanity: 20,
} as const;

/** Highest Skill rating anywhere in play. */
export const MAX_SKILL = 5;
export const MAX_SPECIALTY_LENGTH = 40;

const dotsOf = <K extends string>(rec: Partial<Record<K, number>>, k: K) => rec[k] ?? 0;

/** Out-of-clan Disciplines and traits need Vitae from someone who has them: the Storyteller says. */
const needsStoryteller = (d: SheetDraft, a: Advance): boolean => {
  if (a.kind === 'discipline') return !clanSet(d).includes(a.id);
  if (a.kind === 'trait') return CLAN_TRAITS_BY_ID.get(a.id)?.clan !== d.clan;
  return false;
};

export function costOf(d: SheetDraft, a: Advance): number {
  switch (a.kind) {
    case 'attribute':
      return XP_COSTS.attribute;
    case 'skill':
      return XP_COSTS.skill;
    case 'specialty':
      return XP_COSTS.specialty;
    case 'merit':
      return XP_COSTS.merit;
    case 'trait':
      return needsStoryteller(d, a) ? XP_COSTS.traitOther : XP_COSTS.traitOwn;
    case 'discipline':
      return needsStoryteller(d, a) ? XP_COSTS.disciplineOther : XP_COSTS.disciplineOwn;
    case 'power':
      return XP_COSTS.power;
    case 'humanity':
      return XP_COSTS.humanity;
  }
}

/** Purchases the Storyteller must approve: Humanity, and Disciplines or traits outside the clan. */
export const needsApproval = (d: SheetDraft, a: Advance): boolean =>
  a.kind === 'humanity' || needsStoryteller(d, a);

/** Why `a` can't be bought or even asked for: its reasons without the Storyteller's approval. */
export const blockers = (d: SheetDraft, a: Advance): Reason[] =>
  advanceReasons(d, a).filter((r) => r.kind !== 'storyteller');

const subject = (d: SheetDraft) => ({
  tier: d.tier,
  dots: d.disciplines,
  curse: d.clan ? CLAN_INFO[d.clan].curse : undefined,
});

const powersOf = (d: SheetDraft, disc: Discipline) =>
  d.powers.map((id) => POWERS_BY_ID.get(id)).filter((p) => p?.discipline === disc);

/** Powers of a Discipline that could still be learned with `dots` dots. */
export function learnablePowers(d: SheetDraft, disc: Discipline, dots: number): string[] {
  const mine = powersOf(d, disc).map((p) => p!.rank);
  return POWERS.filter(
    (p) =>
      p.discipline === disc &&
      !d.powers.includes(p.id) &&
      p.rank <= dots &&
      ranksFit([...mine, p.rank], dots),
  ).map((p) => p.id);
}

/**
 * Why `a` can't be bought on sheet `d` (the sheet as it is now); empty when it can.
 * `storyteller` means the rules ask for the Storyteller's word (not handled yet: the panel
 * keeps those closed).
 */
export function advanceReasons(d: SheetDraft, a: Advance): Reason[] {
  const max = TIER_RULES[d.tier].maxDots;
  switch (a.kind) {
    case 'attribute':
      return ATTRIBUTES.includes(a.id) && attributeDots(d, a.id) < max ? [] : [{ kind: 'budget' }];
    case 'skill':
      return SKILLS.includes(a.id) && skillDots(d, a.id) < MAX_SKILL ? [] : [{ kind: 'budget' }];
    case 'specialty': {
      const name = a.name.trim();
      const known = (d.specialties[a.skill] ?? []).map((s) => s.toLowerCase());
      return SKILLS.includes(a.skill) &&
        skillDots(d, a.skill) >= 1 &&
        name.length > 0 &&
        name.length <= MAX_SPECIALTY_LENGTH &&
        !known.includes(name.toLowerCase())
        ? []
        : [{ kind: 'budget' }];
    }
    case 'merit': {
      const merit = MERITS_BY_ID.get(a.id);
      if (!merit) return [{ kind: 'incomplete' }];
      if (d.merits.includes(a.id)) return [{ kind: 'taken' }];
      return unmet(merit.prereq, subject(d));
    }
    case 'trait': {
      const trait = CLAN_TRAITS_BY_ID.get(a.id);
      if (!trait) return [{ kind: 'incomplete' }];
      if (d.clanTraits.includes(a.id)) return [{ kind: 'taken' }];
      const reasons = unmet(trait.prereq, subject(d));
      return needsStoryteller(d, a) ? [...reasons, { kind: 'storyteller' }] : reasons;
    }
    case 'discipline': {
      if (!DISCIPLINES.includes(a.id)) return [{ kind: 'incomplete' }];
      const dots = dotsOf(d.disciplines, a.id);
      if (dots >= TIER_RULES[d.tier].maxDiscipline) return [{ kind: 'budget' }];
      // The new dot brings one power of that rank or lower; required when one is on offer.
      const offer = learnablePowers(d, a.id, dots + 1);
      const reasons: Reason[] =
        a.power === undefined
          ? offer.length
            ? [{ kind: 'incomplete' }]
            : []
          : offer.includes(a.power)
            ? []
            : [{ kind: 'rank', rank: dots + 1, dots: dots + 1 }];
      return needsStoryteller(d, a) ? [...reasons, { kind: 'storyteller' }] : reasons;
    }
    case 'humanity':
      return [{ kind: 'storyteller' }];
    case 'power': {
      const power = POWERS_BY_ID.get(a.id);
      if (!power) return [{ kind: 'incomplete' }];
      const dots = dotsOf(d.disciplines, power.discipline);
      if (d.powers.includes(a.id)) return [{ kind: 'taken' }];
      if (dots < 1) return [{ kind: 'incomplete' }];
      return learnablePowers(d, power.discipline, dots).includes(a.id)
        ? []
        : [{ kind: 'rank', rank: power.rank, dots }];
    }
  }
}

/**
 * Whether the purchase at `index` can be undone without breaking a later one (a power bought
 * on a Discipline dot, a Skill dot behind a specialty). Replays the rest from the creation sheet.
 */
export function canUndo(base: SheetDraft, advances: readonly Advance[], index: number): boolean {
  let sheet = base;
  for (const [i, a] of advances.entries()) {
    if (i === index) continue;
    if (blockers(sheet, a).length) return false;
    sheet = applyAdvance(sheet, a);
  }
  return true;
}

/** The sheet with one purchase added. Does not check the rules: see advanceReasons(). */
export function applyAdvance(d: SheetDraft, a: Advance): SheetDraft {
  const next: SheetDraft = {
    ...d,
    attributes: { ...d.attributes },
    extraSkills: { ...d.extraSkills },
    specialties: { ...d.specialties },
    disciplines: { ...d.disciplines },
    powers: [...d.powers],
    clanTraits: [...d.clanTraits],
    merits: [...d.merits],
  };
  switch (a.kind) {
    case 'attribute':
      next.attributes[a.id] = attributeDots(d, a.id) + 1;
      break;
    case 'skill':
      next.extraSkills[a.id] = dotsOf(d.extraSkills, a.id) + 1;
      break;
    case 'specialty':
      next.specialties[a.skill] = [...(d.specialties[a.skill] ?? []), a.name.trim()];
      break;
    case 'merit':
      next.merits.push(a.id);
      break;
    case 'trait':
      next.clanTraits.push(a.id);
      break;
    case 'discipline':
      next.disciplines[a.id] = dotsOf(d.disciplines, a.id) + 1;
      if (a.power) next.powers.push(a.power);
      break;
    case 'power':
      next.powers.push(a.id);
      break;
    case 'humanity':
      // Humanity lives on the tracker, not on the sheet.
      break;
  }
  return next;
}

/** The sheet as it is now: the one from creation plus every purchase, in order. */
export const applyAdvances = (d: SheetDraft, advances: readonly Advance[]): SheetDraft =>
  advances.reduce(applyAdvance, d);

/** Every non-specialty purchase on offer, with its cost and what is in the way. */
export function advanceOptions(
  d: SheetDraft,
): { advance: Advance; cost: number; reasons: Reason[] }[] {
  const candidates: Advance[] = [
    ...ATTRIBUTES.map((id): Advance => ({ kind: 'attribute', id })),
    ...SKILLS.map((id): Advance => ({ kind: 'skill', id })),
    ...MERITS.map((m): Advance => ({ kind: 'merit', id: m.id })),
    ...CLAN_TRAITS.map((t): Advance => ({ kind: 'trait', id: t.id })),
    ...DISCIPLINES.map((id): Advance => ({ kind: 'discipline', id })),
    ...POWERS.map((p): Advance => ({ kind: 'power', id: p.id })),
    { kind: 'humanity' },
  ];
  return candidates.map((advance) => ({
    advance,
    cost: costOf(d, advance),
    reasons: advanceReasons(d, advance),
  }));
}

/** Parses an advance from untrusted JSON; undefined when it isn't one. */
export function parseAdvance(v: unknown): Advance | undefined {
  if (typeof v !== 'object' || v === null) return undefined;
  const o = v as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === 'string' ? x : undefined);
  switch (o.kind) {
    case 'attribute':
      return ATTRIBUTES.includes(o.id as Attribute)
        ? { kind: 'attribute', id: o.id as Attribute }
        : undefined;
    case 'skill':
      return SKILLS.includes(o.id as Skill) ? { kind: 'skill', id: o.id as Skill } : undefined;
    case 'specialty': {
      const name = str(o.name)?.trim();
      return SKILLS.includes(o.skill as Skill) && name
        ? { kind: 'specialty', skill: o.skill as Skill, name: name.slice(0, MAX_SPECIALTY_LENGTH) }
        : undefined;
    }
    case 'merit':
      return typeof o.id === 'string' && MERITS_BY_ID.has(o.id)
        ? { kind: 'merit', id: o.id }
        : undefined;
    case 'trait':
      return typeof o.id === 'string' && CLAN_TRAITS_BY_ID.has(o.id)
        ? { kind: 'trait', id: o.id }
        : undefined;
    case 'discipline': {
      if (!DISCIPLINES.includes(o.id as Discipline)) return undefined;
      const power = str(o.power);
      if (power !== undefined && !POWERS_BY_ID.has(power)) return undefined;
      return power === undefined
        ? { kind: 'discipline', id: o.id as Discipline }
        : { kind: 'discipline', id: o.id as Discipline, power };
    }
    case 'humanity':
      return { kind: 'humanity' };
    case 'power':
      return typeof o.id === 'string' && POWERS_BY_ID.has(o.id)
        ? { kind: 'power', id: o.id }
        : undefined;
  }
  return undefined;
}
