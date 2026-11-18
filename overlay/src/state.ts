// Tracker state for the OBS overlay: characters with their Alpha 2.0 trackers,
// plus the chronicle (Masquerade Tracker and sect). Pure functions, no I/O.

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

export const SECTS = ['camarilla', 'camarilla-v5', 'anarch', 'sabbat', 'none'] as const;
export type Sect = (typeof SECTS)[number];

export interface Character {
  id: string;
  name: string;
  clan: Clan;
  /** Health = Stamina + 5; `current` counts usable boxes still filled, `baneful` crosses boxes out from the right. */
  health: { max: number; current: number; baneful: number };
  /** Vitae maximum = 5 + 5 × generation modifier. */
  vitae: { max: number; current: number };
  /** Willpower maximum = Composure + Resolve. */
  willpower: { max: number; current: number };
  /** 10-box Humanity tracker: rank filled from the left, violations marked from the right. */
  humanity: { rank: number; violations: number };
  /** Hunger dice, 0-5. Not set by hand: they follow Vitae (see hungerFor). */
  hunger: number;
}

export interface OverlayState {
  characters: Character[];
  chronicle: { masquerade: number; sect: Sect };
}

export type Track = 'health' | 'vitae' | 'willpower' | 'humanity' | 'masquerade';
export type Field = 'current' | 'max' | 'baneful' | 'violations';

export const LIMITS = {
  healthMax: 15,
  vitaeMax: 30,
  willpowerMax: 10,
  humanity: 10,
  hunger: 5,
  masquerade: 10,
  nameLength: 32,
  characters: 8,
} as const;

export class StateError extends Error {}

export function emptyState(): OverlayState {
  return { characters: [], chronicle: { masquerade: 0, sect: 'camarilla' } };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Hunger dice for a Vitae value (Player Packet, Hunger Dice per Vitae, p. 103): one die each
 * time about a fifth of the maximum is spent. With maximum 10 (neonates) 9-8 Vitae give 1
 * die and 1-0 give 5; with 15 (ancillae) 14-12 give 1; with 20 (elders) 19-16 give 1.
 */
export function hungerFor(vitae: { max: number; current: number }): number {
  if (vitae.max <= 0) return 0;
  const spent = vitae.max - vitae.current;
  return clamp(Math.ceil((spent * LIMITS.hunger) / vitae.max), 0, LIMITS.hunger);
}

function int(value: unknown, what: string): number {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n))
    throw new StateError(`${what} must be a whole number`);
  return n;
}

/** Turns a display name into the id used in URLs (`?pg=`) and Stream Deck calls. */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITS.nameLength);
}

function cleanName(value: unknown): string {
  if (typeof value !== 'string') throw new StateError('name is required');
  // Strip control characters; the pages always render names as text, never HTML.
  // eslint-disable-next-line no-control-regex
  const name = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!name) throw new StateError('name is required');
  if (name.length > LIMITS.nameLength)
    throw new StateError(`name is longer than ${LIMITS.nameLength} characters`);
  return name;
}

function clan(value: unknown): Clan {
  if (typeof value === 'string' && (CLANS as readonly string[]).includes(value))
    return value as Clan;
  throw new StateError(`unknown clan; use one of: ${CLANS.join(', ')}`);
}

function sect(value: unknown): Sect {
  if (typeof value === 'string' && (SECTS as readonly string[]).includes(value))
    return value as Sect;
  throw new StateError(`unknown sect; use one of: ${SECTS.join(', ')}`);
}

export function findCharacter(state: OverlayState, id: unknown): Character {
  const c = state.characters.find((x) => x.id === id);
  if (!c) throw new StateError('no character with that id');
  return c;
}

export interface NewCharacter {
  name: unknown;
  clan: unknown;
  stamina?: unknown;
  vitaeMax?: unknown;
  willpowerMax?: unknown;
  humanity?: unknown;
}

/** Adds a character at full Health, Vitae and Willpower (so Hunger 0), Humanity 6 unless given. */
export function addCharacter(state: OverlayState, input: NewCharacter): Character {
  if (state.characters.length >= LIMITS.characters) {
    throw new StateError(`at most ${LIMITS.characters} characters`);
  }
  const name = cleanName(input.name);
  const id = slugify(name);
  if (!id) throw new StateError('name needs at least one letter or digit');
  if (id === 'storyteller')
    throw new StateError('"storyteller" is reserved for the Storyteller frame');
  if (state.characters.some((c) => c.id === id))
    throw new StateError('a character with that name exists');
  const stamina = input.stamina === undefined ? 2 : clamp(int(input.stamina, 'stamina'), 1, 10);
  const healthMax = Math.min(stamina + 5, LIMITS.healthMax);
  const vitaeMax =
    input.vitaeMax === undefined ? 10 : clamp(int(input.vitaeMax, 'vitaeMax'), 1, LIMITS.vitaeMax);
  const willMax =
    input.willpowerMax === undefined
      ? 4
      : clamp(int(input.willpowerMax, 'willpowerMax'), 1, LIMITS.willpowerMax);
  const humanity =
    input.humanity === undefined ? 6 : clamp(int(input.humanity, 'humanity'), 0, LIMITS.humanity);
  const c: Character = {
    id,
    name,
    clan: clan(input.clan),
    health: { max: healthMax, current: healthMax, baneful: 0 },
    vitae: { max: vitaeMax, current: vitaeMax },
    willpower: { max: willMax, current: willMax },
    humanity: { rank: humanity, violations: 0 },
    hunger: 0,
  };
  state.characters.push(c);
  return c;
}

export function removeCharacter(state: OverlayState, id: unknown): void {
  const c = findCharacter(state, id);
  state.characters = state.characters.filter((x) => x !== c);
}

/** Changes name or clan. The id stays the same, so OBS and Stream Deck URLs keep working. */
export function updateCharacter(
  state: OverlayState,
  id: unknown,
  input: { name?: unknown; clan?: unknown },
): Character {
  const c = findCharacter(state, id);
  if (input.name !== undefined) c.name = cleanName(input.name);
  if (input.clan !== undefined) c.clan = clan(input.clan);
  return c;
}

export function setSect(state: OverlayState, value: unknown): void {
  state.chronicle.sect = sect(value);
}

/**
 * Sets one value, clamped to the tracker's rules. Returns true when something changed.
 * `pg` is ignored for the chronicle's Masquerade Tracker.
 */
export function setValue(
  state: OverlayState,
  pg: unknown,
  track: unknown,
  field: unknown,
  rawValue: unknown,
): boolean {
  const value = int(rawValue, 'value');
  const f = (field ?? 'current') as Field;
  if (track === 'masquerade') {
    if (f !== 'current') throw new StateError('the Masquerade Tracker only has a current value');
    const before = state.chronicle.masquerade;
    state.chronicle.masquerade = clamp(value, 0, LIMITS.masquerade);
    return before !== state.chronicle.masquerade;
  }
  const c = findCharacter(state, pg);
  const before = JSON.stringify(c);
  switch (track) {
    case 'health': {
      const h = c.health;
      if (f === 'current') h.current = clamp(value, 0, h.max - h.baneful);
      else if (f === 'baneful') {
        h.baneful = clamp(value, 0, h.max);
        h.current = Math.min(h.current, h.max - h.baneful);
      } else if (f === 'max') {
        h.max = clamp(value, 1, LIMITS.healthMax);
        h.baneful = Math.min(h.baneful, h.max);
        h.current = Math.min(h.current, h.max - h.baneful);
      } else throw badField(track, f);
      break;
    }
    case 'vitae':
    case 'willpower': {
      const t = c[track];
      const cap = track === 'vitae' ? LIMITS.vitaeMax : LIMITS.willpowerMax;
      if (f === 'current') t.current = clamp(value, 0, t.max);
      else if (f === 'max') {
        t.max = clamp(value, 1, cap);
        t.current = Math.min(t.current, t.max);
      } else throw badField(track, f);
      if (track === 'vitae') c.hunger = hungerFor(c.vitae);
      break;
    }
    case 'humanity': {
      const t = c.humanity;
      if (f === 'current') {
        t.rank = clamp(value, 0, LIMITS.humanity);
        t.violations = Math.min(t.violations, LIMITS.humanity - t.rank);
      } else if (f === 'violations') t.violations = clamp(value, 0, LIMITS.humanity - t.rank);
      else throw badField(track, f);
      break;
    }
    case 'hunger':
      throw new StateError('Hunger follows Vitae; change vitae instead');
    default:
      throw new StateError('unknown track; use health, vitae, willpower, humanity or masquerade');
  }
  return before !== JSON.stringify(c);
}

function badField(track: string, field: string) {
  return new StateError(`${track} has no field "${field}"`);
}

export function getValue(state: OverlayState, pg: unknown, track: unknown, field: unknown): number {
  const f = (field ?? 'current') as Field;
  if (track === 'masquerade') return state.chronicle.masquerade;
  const c = findCharacter(state, pg);
  switch (track) {
    case 'health':
      return f === 'baneful' ? c.health.baneful : f === 'max' ? c.health.max : c.health.current;
    case 'vitae':
    case 'willpower':
      return f === 'max' ? c[track].max : c[track].current;
    case 'humanity':
      return f === 'violations' ? c.humanity.violations : c.humanity.rank;
    case 'hunger':
      return c.hunger;
    default:
      throw new StateError('unknown track; use health, vitae, willpower, humanity or masquerade');
  }
}

/** Adds `delta` (usually +1 or -1) to one value. Returns true when something changed. */
export function adjust(
  state: OverlayState,
  pg: unknown,
  track: unknown,
  field: unknown,
  delta: unknown,
): boolean {
  const d = int(delta, 'delta');
  if (Math.abs(d) > 30) throw new StateError('delta is too large');
  return setValue(state, pg, track, field, getValue(state, pg, track, field) + d);
}

/** Checks a state loaded from disk, dropping anything malformed instead of trusting it. */
export function restore(raw: unknown): OverlayState {
  const state = emptyState();
  if (!raw || typeof raw !== 'object') return state;
  const r = raw as { characters?: unknown; chronicle?: { masquerade?: unknown; sect?: unknown } };
  try {
    setValue(state, null, 'masquerade', 'current', r.chronicle?.masquerade ?? 0);
    setSect(state, r.chronicle?.sect ?? 'camarilla');
  } catch {
    // keep defaults
  }
  if (!Array.isArray(r.characters)) return state;
  for (const item of r.characters.slice(0, LIMITS.characters)) {
    try {
      const x = item as Character;
      const c = addCharacter(state, {
        name: x.name,
        clan: x.clan,
        humanity: x.humanity?.rank,
      });
      setValue(state, c.id, 'health', 'max', x.health?.max ?? c.health.max);
      setValue(state, c.id, 'health', 'baneful', x.health?.baneful ?? 0);
      setValue(state, c.id, 'health', 'current', x.health?.current ?? c.health.max);
      setValue(state, c.id, 'vitae', 'max', x.vitae?.max ?? c.vitae.max);
      setValue(state, c.id, 'vitae', 'current', x.vitae?.current ?? c.vitae.max);
      setValue(state, c.id, 'willpower', 'max', x.willpower?.max ?? c.willpower.max);
      setValue(state, c.id, 'willpower', 'current', x.willpower?.current ?? c.willpower.max);
      setValue(state, c.id, 'humanity', 'violations', x.humanity?.violations ?? 0);
    } catch {
      // skip a malformed character
    }
  }
  return state;
}
