// Character trackers for the Alpha 2.0 playtest (Player Packet ch. 2 and pp. 101-104).
// Pure rules, no I/O: the store saves the values, these functions work out the rest.

export const CLANS = [
  'banuhaqim',
  'brujah',
  'gangrel',
  'hecata',
  'lasombra',
  'malkavian',
  'ministry',
  'nosferatu',
  'ravnos',
  'salubri',
  'toreador',
  'tremere',
  'tzimisce',
  'ventrue',
  'caitiff',
  'thinblood',
] as const;
export type Clan = (typeof CLANS)[number];

/** Clan names are game terms: the same in every language. */
export const CLAN_NAMES: Record<Clan, string> = {
  banuhaqim: 'Banu Haqim',
  brujah: 'Brujah',
  gangrel: 'Gangrel',
  hecata: 'Hecata',
  lasombra: 'Lasombra',
  malkavian: 'Malkavian',
  ministry: 'The Ministry',
  nosferatu: 'Nosferatu',
  ravnos: 'Ravnos',
  salubri: 'Salubri',
  toreador: 'Toreador',
  tremere: 'Tremere',
  tzimisce: 'Tzimisce',
  ventrue: 'Ventrue',
  caitiff: 'Caitiff',
  thinblood: 'Thin-blood',
};

/** Tiers of play with their generation modifier (Total Vitae per Generation Modifier, p. 103). */
export const TIERS = ['ghoul', 'duskborn', 'neonate', 'ancilla', 'elder'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_NAMES: Record<Tier, string> = {
  ghoul: 'Ghoul',
  duskborn: 'Duskborn',
  neonate: 'Neonate',
  ancilla: 'Ancilla',
  elder: 'Elder',
};

const GENERATION_MODIFIER: Record<Tier, number> = {
  ghoul: 0,
  duskborn: 1,
  neonate: 1,
  ancilla: 2,
  elder: 3,
};

export const SECTS = ['camarilla', 'camarilla-v5', 'anarch', 'sabbat', 'none'] as const;
export type Sect = (typeof SECTS)[number];

export const SECT_NAMES: Record<Sect, string> = {
  camarilla: 'Camarilla',
  'camarilla-v5': 'Camarilla (V5)',
  anarch: 'Anarch',
  sabbat: 'Sabbat',
  none: '-',
};

export const LIMITS = {
  attribute: 10,
  humanity: 10,
  hunger: 5,
  nameLength: 32,
  charactersPerUser: 20,
  chroniclesPerStoryteller: 10,
} as const;

/** What the store saves: the Attributes behind the maxima and the current values. */
export interface CharacterValues {
  tier: Tier;
  stamina: number;
  composure: number;
  resolve: number;
  /** Usable Health boxes still filled. */
  health: number;
  /** Health boxes crossed out by baneful damage, from the right. */
  baneful: number;
  vitae: number;
  willpower: number;
  humanity: number;
  violations: number;
}

/** Health = Stamina + 5 (p. 56). */
export const healthMax = (c: Pick<CharacterValues, 'stamina'>) => c.stamina + 5;
/** Vitae maximum = 5 + 5 × generation modifier (p. 103). */
export const vitaeMax = (c: Pick<CharacterValues, 'tier'>) => 5 + 5 * GENERATION_MODIFIER[c.tier];
/** Willpower maximum = Composure + Resolve (p. 56). */
export const willpowerMax = (c: Pick<CharacterValues, 'composure' | 'resolve'>) =>
  c.composure + c.resolve;

/**
 * Hunger Dice per Vitae (p. 103): one Hunger die for about every fifth of the maximum spent.
 * Neonate 10 → 0, 9-8 → 1, 7-6 → 2 ... 1-0 → 5; Ancilla steps of 3, Elder steps of 4.
 * Ghouls have no Hunger dice.
 */
export function hungerDice(c: Pick<CharacterValues, 'tier' | 'vitae'>): number {
  if (c.tier === 'ghoul') return 0;
  const max = vitaeMax(c);
  const step = max / LIMITS.hunger;
  const spent = Math.max(0, max - c.vitae);
  return Math.min(LIMITS.hunger, Math.ceil(spent / step));
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Keeps every current value inside the rules after any change (Attributes, tier or a tracker). */
export function normalize(c: CharacterValues): CharacterValues {
  const stamina = clamp(c.stamina, 1, LIMITS.attribute);
  const composure = clamp(c.composure, 1, LIMITS.attribute);
  const resolve = clamp(c.resolve, 1, LIMITS.attribute);
  const hMax = healthMax({ stamina });
  const baneful = clamp(c.baneful, 0, hMax);
  const humanity = clamp(c.humanity, 0, LIMITS.humanity);
  return {
    tier: c.tier,
    stamina,
    composure,
    resolve,
    baneful,
    health: clamp(c.health, 0, hMax - baneful),
    vitae: clamp(c.vitae, 0, vitaeMax(c)),
    willpower: clamp(c.willpower, 0, willpowerMax({ composure, resolve })),
    humanity,
    violations: clamp(c.violations, 0, LIMITS.humanity - humanity),
  };
}

/** A new character starts at full Health, Vitae and Willpower, Humanity 6 (p. 50), no violations. */
export function newCharacter(input: {
  tier: Tier;
  stamina: number;
  composure: number;
  resolve: number;
  humanity?: number;
}): CharacterValues {
  const base = { ...input, health: 0, baneful: 0, vitae: 0, willpower: 0, violations: 0 };
  return normalize({
    ...base,
    humanity: input.humanity ?? 6,
    health: healthMax(input),
    vitae: vitaeMax(input),
    willpower: willpowerMax(input),
  });
}

/** Trackers a player or Storyteller can move with the sheet buttons or on the web panel. */
export const TRACKS = [
  'health',
  'baneful',
  'vitae',
  'willpower',
  'humanity',
  'violations',
] as const;
export type Track = (typeof TRACKS)[number];

export const TRACK_NAMES: Record<Track, string> = {
  health: 'Health',
  baneful: 'Baneful',
  vitae: 'Vitae',
  willpower: 'Willpower',
  humanity: 'Humanity',
  violations: 'Violations',
};

/** Sets one tracker; the result is normalized, so values out of range are clamped. */
export function setTrack(c: CharacterValues, track: Track, value: number): CharacterValues {
  return normalize({ ...c, [track]: value });
}

export function isClan(v: unknown): v is Clan {
  return typeof v === 'string' && (CLANS as readonly string[]).includes(v);
}
export function isTier(v: unknown): v is Tier {
  return typeof v === 'string' && (TIERS as readonly string[]).includes(v);
}
export function isSect(v: unknown): v is Sect {
  return typeof v === 'string' && (SECTS as readonly string[]).includes(v);
}
export function isTrack(v: unknown): v is Track {
  return typeof v === 'string' && (TRACKS as readonly string[]).includes(v);
}

/** Turns a display name into the id used in overlay URLs and Stream Deck calls. */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITS.nameLength);
}

/** Strips control characters and trims; undefined when nothing usable is left or it is too long. */
export function cleanName(value: string): string | undefined {
  // eslint-disable-next-line no-control-regex
  const name = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!name || name.length > LIMITS.nameLength || !slugify(name)) return undefined;
  return name;
}
