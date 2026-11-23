// Turns whatever a browser sends as a saved draft into a clean SheetDraft. A draft is work in
// progress, so nothing here enforces the rules (evaluate() does that): it only keeps known ids,
// whole numbers in range and short strings, and drops everything else.

import { LIFEPATHS_BY_ID, MERITS_BY_ID, PATHS, SIRES_BY_ID } from './alpha2/background.js';
import { CLAN_TRAITS_BY_ID, isAlpha2Clan } from './alpha2/clans.js';
import {
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTES,
  RESOURCE_KINDS,
  SKILLS,
  type AttributeCategory,
  type ResourceKind,
} from './alpha2/core.js';
import { DISCIPLINES, isDiscipline, POWERS_BY_ID } from './alpha2/disciplines.js';
import { CREATION_TIERS, type CreationTier } from './alpha2/prereq.js';
import type { FlawPick, LifepathPick, ResourcePick, SheetDraft } from './creation.js';

export const DRAFT_LIMITS = {
  /** Highest dot value kept anywhere in a draft. */
  dots: 10,
  name: 80,
  text: 120,
  list: 12,
} as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const dots = (v: unknown) =>
  Number.isInteger(v) && (v as number) >= 0 && (v as number) <= DRAFT_LIMITS.dots
    ? (v as number)
    : undefined;
const text = (v: unknown, max: number = DRAFT_LIMITS.text) =>
  typeof v === 'string' ? v.slice(0, max) : undefined;
const list = (v: unknown) => (Array.isArray(v) ? v.slice(0, DRAFT_LIMITS.list) : []);

/** Keeps the keys in `keys` whose values are dot counts above zero. */
function dotMap<K extends string>(v: unknown, keys: readonly K[]): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  if (!isObj(v)) return out;
  for (const k of keys) {
    const n = dots(v[k]);
    if (n) out[k] = n;
  }
  return out;
}

const ids = (v: unknown, known: (id: string) => boolean) => [
  ...new Set(list(v).filter((id): id is string => typeof id === 'string' && known(id))),
];

function lifepath(v: unknown): LifepathPick | undefined {
  if (!isObj(v) || typeof v.id !== 'string') return undefined;
  const lp = LIFEPATHS_BY_ID.get(v.id);
  if (!lp) return undefined;
  const own = lp.skills.map((s) => s.skill);
  const resources = lp.resources.map((_, i) => dots(list(v.resources)[i]) ?? 0);
  const pick: LifepathPick = { id: lp.id, skills: dotMap(v.skills, own), resources };
  const details = list(v.resourceDetails).slice(0, lp.resources.length);
  if (details.some((d) => typeof d === 'string' && d.trim())) {
    pick.resourceDetails = lp.resources.map((_, i) => text(details[i]) ?? '');
  }
  return pick;
}

function resource(v: unknown): ResourcePick | undefined {
  if (!isObj(v) || !RESOURCE_KINDS.includes(v.kind as ResourceKind)) return undefined;
  const pick: ResourcePick = {
    kind: v.kind as ResourceKind,
    detail: text(v.detail) ?? '',
    dots: dots(v.dots) ?? 0,
  };
  if (v.coterie === true && pick.kind === 'haven') pick.coterie = true;
  return pick;
}

function flaw(v: unknown): FlawPick | undefined {
  if (!isObj(v)) return undefined;
  const name = text(v.name);
  if (name === undefined) return undefined;
  const out: FlawPick = { name };
  const id = text(v.id, 40);
  if (id) out.id = id;
  const note = text(v.note);
  if (note) out.note = note;
  return out;
}

/** A clean draft, or undefined when the input is not even an object with a known tier. */
export function parseDraft(v: unknown): SheetDraft | undefined {
  if (!isObj(v) || !CREATION_TIERS.includes(v.tier as CreationTier)) return undefined;
  const d: SheetDraft = {
    tier: v.tier as CreationTier,
    lifepaths: list(v.lifepaths)
      .map(lifepath)
      .filter((l) => l !== undefined),
    attributes: dotMap(v.attributes, ATTRIBUTES),
    extraSkills: dotMap(v.extraSkills, SKILLS),
    specialties: {},
    disciplines: dotMap(v.disciplines, DISCIPLINES),
    powers: ids(v.powers, (id) => POWERS_BY_ID.has(id)),
    clanTraits: ids(v.clanTraits, (id) => CLAN_TRAITS_BY_ID.has(id)),
    merits: ids(v.merits, (id) => MERITS_BY_ID.has(id)),
    extraResources: list(v.extraResources)
      .map(resource)
      .filter((r) => r !== undefined),
    flaws: list(v.flaws)
      .map(flaw)
      .filter((f) => f !== undefined),
  };
  if (isAlpha2Clan(v.clan)) d.clan = v.clan;
  if (isDiscipline(v.clanChoice)) d.clanChoice = v.clanChoice;
  if (typeof v.sire === 'string' && SIRES_BY_ID.has(v.sire)) d.sire = v.sire;
  if (isDiscipline(v.sireDiscipline)) d.sireDiscipline = v.sireDiscipline;
  const broodmate = text(v.broodmate, DRAFT_LIMITS.name);
  if (broodmate) d.broodmate = broodmate;
  if (Number.isInteger(v.generation) && (v.generation as number) >= 4) {
    if ((v.generation as number) <= 16) d.generation = v.generation as number;
  }
  if (v.young === true) d.young = true;
  const priority = list(v.attributePriority).filter((c): c is AttributeCategory =>
    ATTRIBUTE_CATEGORIES.includes(c as AttributeCategory),
  );
  if (priority.length === 3 && new Set(priority).size === 3) d.attributePriority = priority;
  if (isObj(v.specialties)) {
    for (const skill of SKILLS) {
      const names = list(v.specialties[skill])
        .map((s) => text(s, 40))
        .filter((s): s is string => !!s?.trim());
      if (names.length) d.specialties[skill] = names.slice(0, 6);
    }
  }
  if (typeof v.path === 'string' && PATHS.some((p) => p.id === v.path)) d.path = v.path;
  const name = text(v.name, DRAFT_LIMITS.name);
  if (name?.trim()) d.name = name;
  if (Number.isInteger(v.characterId) && (v.characterId as number) > 0) {
    d.characterId = v.characterId as number;
  }
  return d;
}
