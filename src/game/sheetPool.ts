// Dice pools built from a character's full sheet (Player Packet ch. 4, "Tests", p. 95).
// A test always adds an Attribute to a second trait: a Skill (+1 with a specialty, p. 39),
// a Discipline (Power test), another Attribute or a lifepath worth 2 dots (Unlisted Skills, p. 39).
// Pure functions: the commands read the sheet and the trackers, these only do the sums.

import {
  ATTRIBUTES,
  ATTRIBUTES_BY_CATEGORY,
  ATTRIBUTE_NAMES,
  SKILLS,
  SKILL_INFO,
  type Attribute,
  type AttributeCategory,
  type Skill,
} from './alpha2/core.js';
import { LIFEPATHS_BY_ID } from './alpha2/background.js';
import {
  DISCIPLINES,
  DISCIPLINE_NAMES,
  POWERS,
  type Discipline,
  type Power,
} from './alpha2/disciplines.js';
import { TIER_RULES } from './alpha2/tiers.js';
import { attributeDots, skillDots, type SheetDraft } from './creation.js';
import type { CharacterValues, Tier } from './character.js';

/** Dots a lifepath lends when no Skill fits the task (Unlisted Skills, p. 39). */
export const LIFEPATH_DOTS = 2;
/** Dice lost per Impaired Attribute in the pool (Impairment, p. 105). */
export const IMPAIRMENT = 2;
/** A specialty that applies adds one die (Specialties, p. 39). */
export const SPECIALTY_BONUS = 1;
/** Blood Surge lasts the scene; the bot forgets it after this long anyway. */
export const SURGE_TTL_MS = 3 * 60 * 60 * 1000;

/** How far [Blood Surge] can raise an Attribute at each tier (Tiers of Play, p. 115). */
export const SURGE_ATTRIBUTE_MAX: Record<Tier, number> = {
  ghoul: 2,
  duskborn: 2,
  neonate: 2,
  ancilla: 4,
  elder: 6,
};
/** Vitae per dot of [Blood Surge] (p. 147): 1 for an Attribute, 2 for a Discipline. */
export const SURGE_COST = { attr: 1, disc: 2 } as const;

// ---------- Trait references (the values carried by the autocomplete choices) ----------

export type TraitRef =
  | { kind: 'attr'; id: Attribute }
  | { kind: 'skill'; id: Skill; specialty?: number }
  | { kind: 'disc'; id: Discipline }
  | { kind: 'power'; id: string }
  | { kind: 'life'; id: string };

/** A trait Blood Surge can raise, as stored on the character: `attr:dexterity`, `disc:potence`. */
export type SurgeKey = `attr:${Attribute}` | `disc:${Discipline}`;
/** Active surges: dots added per trait until the scene ends. */
export type Surges = Partial<Record<SurgeKey, number>>;

export interface SurgePick {
  key: SurgeKey;
  dots: number;
}

const isAttribute = (v: string): v is Attribute => (ATTRIBUTES as readonly string[]).includes(v);
const isSkill = (v: string): v is Skill => (SKILLS as readonly string[]).includes(v);
const isDiscipline = (v: string): v is Discipline => (DISCIPLINES as readonly string[]).includes(v);
const POWERS_BY_ID: ReadonlyMap<string, Power> = new Map(POWERS.map((p) => [p.id, p]));

export function encodeTrait(t: TraitRef): string {
  if (t.kind === 'skill' && t.specialty !== undefined) return `skill:${t.id}:${t.specialty}`;
  return `${t.kind}:${t.id}`;
}

export function decodeTrait(value: string | null | undefined): TraitRef | undefined {
  if (!value) return undefined;
  const [kind, id = '', extra] = value.split(':');
  switch (kind) {
    case 'attr':
      return isAttribute(id) ? { kind, id } : undefined;
    case 'skill': {
      if (!isSkill(id)) return undefined;
      if (extra === undefined) return { kind, id };
      const n = Number(extra);
      return Number.isInteger(n) && n >= 0 ? { kind, id, specialty: n } : undefined;
    }
    case 'disc':
      return isDiscipline(id) ? { kind, id } : undefined;
    case 'power':
      return POWERS_BY_ID.has(id) ? { kind, id } : undefined;
    case 'life':
      return LIFEPATHS_BY_ID.has(id) ? { kind, id } : undefined;
    default:
      return undefined;
  }
}

export function encodeSurge(p: SurgePick): string {
  return `${p.key}:${p.dots}`;
}

export function decodeSurge(value: string | null | undefined): SurgePick | undefined {
  if (!value) return undefined;
  const [kind, id = '', dots] = value.split(':');
  const n = Number(dots);
  if (!Number.isInteger(n) || n < 1 || n > 10) return undefined;
  if (kind === 'attr' && isAttribute(id)) return { key: `attr:${id}`, dots: n };
  if (kind === 'disc' && isDiscipline(id)) return { key: `disc:${id}`, dots: n };
  return undefined;
}

/** Cleans surges read from storage: known traits, positive whole dots. */
export function parseSurges(v: unknown): Surges {
  const out: Surges = {};
  if (!v || typeof v !== 'object') return out;
  for (const [key, dots] of Object.entries(v as Record<string, unknown>)) {
    const pick = decodeSurge(`${key}:${String(dots)}`);
    if (pick) out[pick.key] = pick.dots;
  }
  return out;
}

// ---------- Values ----------

const categoryOf = (a: Attribute): AttributeCategory =>
  (Object.keys(ATTRIBUTES_BY_CATEGORY) as AttributeCategory[]).find((c) =>
    ATTRIBUTES_BY_CATEGORY[c].includes(a),
  )!;

/** Attribute groups Impaired by empty trackers: Health 0 (p. 103), Willpower 0 (p. 104). */
export function impairedCategories(
  values: Pick<CharacterValues, 'health' | 'willpower'>,
): AttributeCategory[] {
  const out: AttributeCategory[] = [];
  if (values.health <= 0) out.push('physical');
  if (values.willpower <= 0) out.push('social', 'mental');
  return out;
}

export const isImpaired = (a: Attribute, impaired: readonly AttributeCategory[]) =>
  impaired.includes(categoryOf(a));

export const disciplineDots = (d: SheetDraft, disc: Discipline) => d.disciplines[disc] ?? 0;

export interface PoolPart {
  /** Shown name: "Dexterity", "Fighting", "Hand-to-Hand", "Lifepath: Mechanic". */
  label: string;
  /** Dots from the sheet, before any Blood Surge. */
  dots: number;
  /** Dots added by an active Blood Surge. */
  surge?: number;
}

export type PoolIssue =
  | 'need-attribute'
  | 'need-second'
  | 'same-attribute'
  | 'unknown-trait'
  | 'no-power'
  | 'no-discipline'
  | 'no-specialty'
  | 'surge-no-discipline'
  | 'surge-limit'
  | 'surge-vitae';

export interface SheetPool {
  /** Dice to roll before the player's bonus: never below 0. */
  dice: number;
  parts: PoolPart[];
  /** Dice lost to Impaired Attributes (a positive number). */
  impairment: number;
  /** The Attributes in the pool that are Impaired. */
  impaired: Attribute[];
  /** The power's own Attribute, when the player chose another one for its Power test. */
  powerAttribute?: Attribute;
  /** The Attribute of the pool, for contested ties (p. 95). */
  attribute: Attribute;
}

export interface PoolInput {
  sheet: SheetDraft;
  values: Pick<CharacterValues, 'health' | 'willpower'>;
  attribute?: TraitRef;
  second?: TraitRef;
  /** Surges already active on the character (a new one is added before calling). */
  surges?: Surges;
}

/** Sums an Attribute and a second trait from the sheet, or says what is missing. */
export function buildSheetPool(input: PoolInput): SheetPool | PoolIssue {
  const { sheet, second } = input;
  const surges = input.surges ?? {};
  const impaired = impairedCategories(input.values);
  if (input.attribute && input.attribute.kind !== 'attr') return 'unknown-trait';

  let power: Power | undefined;
  if (second?.kind === 'power') {
    power = POWERS_BY_ID.get(second.id);
    if (!power || !sheet.powers.includes(power.id)) return 'no-power';
  }
  const attribute = (input.attribute?.id as Attribute | undefined) ?? power?.attribute;
  if (!attribute) return 'need-attribute';
  if (!second) return 'need-second';

  const attrPart = (a: Attribute): PoolPart => ({
    label: ATTRIBUTE_NAMES[a],
    dots: attributeDots(sheet, a),
    ...(surges[`attr:${a}`] ? { surge: surges[`attr:${a}`] } : {}),
  });
  const discPart = (disc: Discipline): PoolPart => ({
    label: DISCIPLINE_NAMES[disc],
    dots: disciplineDots(sheet, disc),
    ...(surges[`disc:${disc}`] ? { surge: surges[`disc:${disc}`] } : {}),
  });

  const parts: PoolPart[] = [attrPart(attribute)];
  const attributes: Attribute[] = [attribute];
  switch (second.kind) {
    case 'attr':
      if (second.id === attribute) return 'same-attribute';
      parts.push(attrPart(second.id));
      attributes.push(second.id);
      break;
    case 'skill': {
      parts.push({ label: SKILL_INFO[second.id].name, dots: skillDots(sheet, second.id) });
      if (second.specialty !== undefined) {
        const name = specialtiesOf(sheet, second.id)[second.specialty];
        if (!name) return 'no-specialty';
        parts.push({ label: name, dots: SPECIALTY_BONUS });
      }
      break;
    }
    case 'disc':
      if (disciplineDots(sheet, second.id) < 1) return 'no-discipline';
      parts.push(discPart(second.id));
      break;
    case 'power':
      parts.push(discPart(power!.discipline));
      break;
    case 'life': {
      if (!sheet.lifepaths.some((l) => l.id === second.id)) return 'unknown-trait';
      const name = LIFEPATHS_BY_ID.get(second.id)!.name;
      parts.push({ label: `Lifepath: ${name}`, dots: LIFEPATH_DOTS });
      break;
    }
  }

  const hit = attributes.filter((a) => isImpaired(a, impaired));
  const impairment = hit.length * IMPAIRMENT;
  const raw = parts.reduce((n, p) => n + p.dots + (p.surge ?? 0), 0);
  return {
    dice: Math.max(0, raw - impairment),
    parts,
    impairment,
    impaired: hit,
    attribute,
    ...(power && power.attribute !== attribute ? { powerAttribute: power.attribute } : {}),
  };
}

/** The pool as a sum: "Dexterity 3 (+2 Surge) + Fighting 2 + Hand-to-Hand 1 − 2 Impaired = 6". */
export function recipe(pool: SheetPool): string {
  const terms = pool.parts.map(
    (p) => `${p.label} ${p.dots}${p.surge ? ` (+${p.surge} Blood Surge)` : ''}`,
  );
  const minus = pool.impairment ? ` − ${pool.impairment} Impaired` : '';
  return `${terms.join(' + ')}${minus} = ${pool.dice}`;
}

export const specialtiesOf = (sheet: SheetDraft, skill: Skill): string[] =>
  (sheet.specialties[skill] ?? []).map((s) => s.trim()).filter(Boolean);

// ---------- Blood Surge ----------

export interface SurgeCheck {
  cost: number;
  /** The surges once this one is added. */
  surges: Surges;
}

/**
 * Checks a new [Blood Surge] (p. 147): a Discipline needs at least 1 dot and can't pass the
 * tier's maximum; an Attribute can't be raised by more than the tier allows (p. 115).
 * Surges on the same trait add up within those limits.
 */
export function checkSurge(
  sheet: SheetDraft,
  values: Pick<CharacterValues, 'tier' | 'vitae'>,
  active: Surges,
  pick: SurgePick,
): SurgeCheck | PoolIssue {
  const [kind, id] = pick.key.split(':') as ['attr' | 'disc', string];
  const total = (active[pick.key] ?? 0) + pick.dots;
  if (kind === 'disc') {
    const dots = disciplineDots(sheet, id as Discipline);
    if (dots < 1) return 'surge-no-discipline';
    if (dots + total > TIER_RULES[sheet.tier].maxDiscipline) return 'surge-limit';
  } else if (total > SURGE_ATTRIBUTE_MAX[values.tier]) {
    return 'surge-limit';
  }
  const cost = pick.dots * SURGE_COST[kind];
  if (cost > values.vitae) return 'surge-vitae';
  return { cost, surges: { ...active, [pick.key]: total } };
}

export function surgeLabel(key: SurgeKey): string {
  const [kind, id] = key.split(':') as ['attr' | 'disc', string];
  return kind === 'attr' ? ATTRIBUTE_NAMES[id as Attribute] : DISCIPLINE_NAMES[id as Discipline];
}

// ---------- Autocomplete choices ----------

export interface TraitChoice {
  name: string;
  value: string;
}

const surgeNote = (surges: Surges, key: SurgeKey) =>
  surges[key] ? ` (+${surges[key]} Blood Surge)` : '';
const impairedNote = (a: Attribute, impaired: readonly AttributeCategory[]) =>
  isImpaired(a, impaired) ? ` (−${IMPAIRMENT} Impaired)` : '';

/** The nine Attributes with their dots, for the `attribute` option. */
export function attributeChoices(
  sheet: SheetDraft,
  values: Pick<CharacterValues, 'health' | 'willpower'>,
  surges: Surges = {},
): TraitChoice[] {
  const impaired = impairedCategories(values);
  return ATTRIBUTES.map((a) => ({
    name: `${ATTRIBUTE_NAMES[a]} ${attributeDots(sheet, a)}${surgeNote(surges, `attr:${a}`)}${impairedNote(a, impaired)}`,
    value: encodeTrait({ kind: 'attr', id: a }),
  }));
}

/**
 * Everything that can go with an Attribute, for the `with` option: Skills (their specialties in brackets),
 * Disciplines, known powers with their whole Power test, the other Attributes and the lifepaths.
 * Skills with dots come first; with an Attribute chosen, it is left out of the list.
 */
export function secondChoices(
  sheet: SheetDraft,
  values: Pick<CharacterValues, 'health' | 'willpower'>,
  surges: Surges = {},
  attribute?: Attribute,
): TraitChoice[] {
  const skills = [...SKILLS].sort((a, b) => skillDots(sheet, b) - skillDots(sheet, a));
  const out: TraitChoice[] = [];
  for (const skill of skills) {
    const dots = skillDots(sheet, skill);
    const name = SKILL_INFO[skill].name;
    // One line per Skill: its specialties are picked in the separate `specialization` option.
    const specs = specialtiesOf(sheet, skill);
    const hint = specs.length ? ` (${specs.join(', ')})` : '';
    out.push({ name: `${name} ${dots}${hint}`, value: encodeTrait({ kind: 'skill', id: skill }) });
  }
  for (const disc of DISCIPLINES) {
    const dots = disciplineDots(sheet, disc);
    if (dots < 1) continue;
    out.push({
      name: `${DISCIPLINE_NAMES[disc]} ${dots}${surgeNote(surges, `disc:${disc}`)}`,
      value: encodeTrait({ kind: 'disc', id: disc }),
    });
  }
  for (const id of sheet.powers) {
    const power = POWERS_BY_ID.get(id);
    if (!power) continue;
    const pool = buildSheetPool({
      sheet,
      values,
      surges,
      second: { kind: 'power', id },
      ...(attribute ? { attribute: { kind: 'attr', id: attribute } } : {}),
    });
    const a = attribute ?? power.attribute;
    const total = typeof pool === 'string' ? '' : ` = ${pool.dice}`;
    out.push({
      name: `${power.name} (${ATTRIBUTE_NAMES[a]} + ${DISCIPLINE_NAMES[power.discipline]}${total})`,
      value: encodeTrait({ kind: 'power', id }),
    });
  }
  for (const a of ATTRIBUTES) {
    if (a === attribute) continue;
    out.push({
      name: `${ATTRIBUTE_NAMES[a]} ${attributeDots(sheet, a)}${surgeNote(surges, `attr:${a}`)}`,
      value: encodeTrait({ kind: 'attr', id: a }),
    });
  }
  for (const l of sheet.lifepaths) {
    const lifepath = LIFEPATHS_BY_ID.get(l.id);
    if (!lifepath) continue;
    out.push({
      name: `Lifepath: ${lifepath.name} ${LIFEPATH_DOTS}`,
      value: encodeTrait({ kind: 'life', id: l.id }),
    });
  }
  return out;
}

/**
 * The specialties of the Skill picked in `with`, for the `specialization` option (+1 die, p. 39).
 * Empty when `with` is not a Skill or the Skill has none.
 */
export function specialtyChoices(sheet: SheetDraft, second?: TraitRef): TraitChoice[] {
  if (second?.kind !== 'skill') return [];
  return specialtiesOf(sheet, second.id).map((spec, i) => ({
    name: `${spec} +${SPECIALTY_BONUS}`,
    value: String(i),
  }));
}

/** The index a `specialization` choice carries, or undefined for anything typed by hand. */
export function decodeSpecialty(value: string | null | undefined): number | undefined {
  if (!value || !/^\d{1,2}$/.test(value)) return undefined;
  return Number(value);
}

/**
 * Blood Surges the character can afford now, for the `surge` option: the Attributes and the
 * Disciplines with dots, each at every step within the tier limit and the Vitae left.
 * The traits already in the roll come first.
 */
export function surgeChoices(
  sheet: SheetDraft,
  values: Pick<CharacterValues, 'tier' | 'vitae'>,
  surges: Surges = {},
  first: SurgeKey[] = [],
): TraitChoice[] {
  const keys: SurgeKey[] = [
    ...ATTRIBUTES.map((a) => `attr:${a}` as const),
    ...DISCIPLINES.filter((d) => disciplineDots(sheet, d) > 0).map((d) => `disc:${d}` as const),
  ];
  keys.sort((a, b) => Number(first.includes(b)) - Number(first.includes(a)));
  const out: TraitChoice[] = [];
  for (const key of keys) {
    for (let dots = 1; dots <= 6; dots++) {
      const check = checkSurge(sheet, values, surges, { key, dots });
      if (typeof check === 'string') break;
      out.push({
        name: `${surgeLabel(key)} +${dots} (${check.cost} Vitae)`,
        value: encodeSurge({ key, dots }),
      });
    }
  }
  return out;
}

/** The surge keys a roll uses, so the `surge` list can show them first. */
export function surgeKeysOf(attribute?: TraitRef, second?: TraitRef): SurgeKey[] {
  const keys: SurgeKey[] = [];
  for (const t of [attribute, second]) {
    if (t?.kind === 'attr') keys.push(`attr:${t.id}`);
    if (t?.kind === 'disc') keys.push(`disc:${t.id}`);
    if (t?.kind === 'power') {
      const p = POWERS_BY_ID.get(t.id);
      if (p) keys.push(`disc:${p.discipline}`, `attr:${p.attribute}`);
    }
  }
  return keys;
}
