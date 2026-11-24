import type Database from 'better-sqlite3';
import type { Advance } from '../game/advancement.js';
import type { XpEntry, XpRequest } from '../game/xp.js';
import {
  IMPAIR_TTL_MS,
  SURGE_TTL_MS,
  parseImpairments,
  parseSurges,
  type ImpairKey,
  type Surges,
} from '../game/sheetPool.js';
import {
  LIMITS,
  normalize,
  setTrack,
  slugify,
  type CharacterValues,
  type Clan,
  type Sect,
  type Tier,
  type Track,
} from '../game/character.js';

/** Tiers of play a Chronicle can be set to (Duskborn play at the Neonate tier, p. 114). */
export const CHRONICLE_TIERS = ['neonate', 'ancilla', 'elder'] as const;
export type ChronicleTier = (typeof CHRONICLE_TIERS)[number];
export const isChronicleTier = (v: unknown): v is ChronicleTier =>
  CHRONICLE_TIERS.includes(v as ChronicleTier);

/**
 * Whether a character may play in a Chronicle of that tier. A Chronicle with no tier takes
 * anyone; ghouls have no Alpha 2.0 rules yet, so they are not held to one.
 */
export function tierFits(character: Tier, chronicle: ChronicleTier | undefined): boolean {
  if (!chronicle || character === 'ghoul') return true;
  return (character === 'duskborn' ? 'neonate' : character) === chronicle;
}

/** A player character, saved per Discord server and owned by one Discord user. */
export interface Character {
  id: number;
  guildId: string;
  ownerId: string;
  name: string;
  clan: Clan;
  values: CharacterValues;
  /** The Chronicle the character plays in, if any (archived Chronicles count as none). */
  chronicleId?: number;
  /** True once a full Alpha 2.0 sheet from the panel's wizard is attached. */
  hasSheet?: boolean;
}

/** A full character sheet from the creation wizard, kept as JSON next to the trackers. */
export interface StoredSheet {
  /** The wizard's SheetDraft, as it was when the character was created. */
  data: unknown;
  /** Choices the Storyteller still has to approve (Brood Child, a Path). */
  approvals: unknown[];
  createdAt: number;
}

/** A Storyteller's Chronicle: its own players, Masquerade Tracker and sect. */
export interface Chronicle {
  id: number;
  guildId: string;
  /** Stable id for overlay URLs and Stream Deck keys; it does not change on rename. */
  slug: string;
  name: string;
  storytellerId: string;
  sect: Sect;
  masquerade: number;
  /** Tier of play: its characters must match it. None takes any character. */
  tier?: ChronicleTier;
  /** The Discord channel where this Chronicle is played, chosen on the panel. */
  channelId?: string;
  /** The bot's language at this Chronicle's table; none follows each user's Discord. */
  locale?: string;
  archived: boolean;
}

/** How long the change log keeps entries. */
const CHANGE_LOG_DAYS = 30;

interface CharacterRow {
  id: number;
  guild_id: string;
  owner_id: string;
  name: string;
  clan: string;
  tier: string;
  stamina: number;
  composure: number;
  resolve: number;
  health: number;
  baneful: number;
  vitae: number;
  willpower: number;
  humanity: number;
  violations: number;
  chronicle_id: number | null;
  has_sheet: number;
}

interface ChronicleRow {
  id: number;
  guild_id: string;
  slug: string;
  name: string;
  storyteller_id: string;
  sect: string;
  masquerade: number;
  channel_id: string | null;
  archived: number;
  tier: string | null;
  locale: string | null;
}

const toCharacter = (r: CharacterRow): Character => ({
  id: r.id,
  guildId: r.guild_id,
  ownerId: r.owner_id,
  name: r.name,
  clan: r.clan as Clan,
  values: {
    tier: r.tier as CharacterValues['tier'],
    stamina: r.stamina,
    composure: r.composure,
    resolve: r.resolve,
    health: r.health,
    baneful: r.baneful,
    vitae: r.vitae,
    willpower: r.willpower,
    humanity: r.humanity,
    violations: r.violations,
  },
  ...(r.chronicle_id !== null ? { chronicleId: r.chronicle_id } : {}),
  ...(r.has_sheet ? { hasSheet: true } : {}),
});

const toChronicle = (r: ChronicleRow): Chronicle => ({
  id: r.id,
  guildId: r.guild_id,
  slug: r.slug,
  name: r.name,
  storytellerId: r.storyteller_id,
  sect: r.sect as Sect,
  masquerade: r.masquerade,
  ...(isChronicleTier(r.tier) ? { tier: r.tier } : {}),
  ...(r.channel_id !== null ? { channelId: r.channel_id } : {}),
  ...(r.locale ? { locale: r.locale } : {}),
  archived: r.archived === 1,
});

// Characters joined with their current (not archived) Chronicle.
const CHARACTER_SELECT = `
  SELECT c.*, m.chronicle_id AS chronicle_id,
    EXISTS (SELECT 1 FROM character_sheets s WHERE s.character_id = c.id) AS has_sheet
  FROM characters c
  LEFT JOIN chronicle_members m ON m.character_id = c.id
    AND m.chronicle_id IN (SELECT id FROM chronicles WHERE archived = 0)`;

export type CreateResult<T> = T | 'duplicate' | 'limit';

/**
 * Characters and Chronicles. Shares the bot's SQLite database; every value goes through
 * normalize() before it is written, so the database never holds a value outside the rules.
 */
export class Campaign {
  constructor(private readonly db: Database.Database) {
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY,
        guild_id TEXT NOT NULL, owner_id TEXT NOT NULL,
        name TEXT NOT NULL, clan TEXT NOT NULL, tier TEXT NOT NULL,
        stamina INTEGER NOT NULL, composure INTEGER NOT NULL, resolve INTEGER NOT NULL,
        health INTEGER NOT NULL, baneful INTEGER NOT NULL, vitae INTEGER NOT NULL,
        willpower INTEGER NOT NULL, humanity INTEGER NOT NULL, violations INTEGER NOT NULL,
        created_at INTEGER NOT NULL);
      CREATE UNIQUE INDEX IF NOT EXISTS characters_name
        ON characters (guild_id, owner_id, name COLLATE NOCASE);
      CREATE TABLE IF NOT EXISTS chronicles (
        id INTEGER PRIMARY KEY,
        guild_id TEXT NOT NULL, slug TEXT NOT NULL, name TEXT NOT NULL,
        storyteller_id TEXT NOT NULL, sect TEXT NOT NULL,
        masquerade INTEGER NOT NULL DEFAULT 0,
        channel_id TEXT UNIQUE, archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        UNIQUE (guild_id, slug));
      CREATE TABLE IF NOT EXISTS chronicle_members (
        character_id INTEGER PRIMARY KEY REFERENCES characters (id) ON DELETE CASCADE,
        chronicle_id INTEGER NOT NULL REFERENCES chronicles (id) ON DELETE CASCADE,
        position INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS active_characters (
        guild_id TEXT NOT NULL, owner_id TEXT NOT NULL,
        character_id INTEGER NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
        PRIMARY KEY (guild_id, owner_id));
      CREATE TABLE IF NOT EXISTS live_chronicle (
        guild_id TEXT NOT NULL, storyteller_id TEXT NOT NULL,
        chronicle_id INTEGER NOT NULL REFERENCES chronicles (id) ON DELETE CASCADE,
        PRIMARY KEY (guild_id, storyteller_id));
      CREATE TABLE IF NOT EXISTS character_changes (
        id INTEGER PRIMARY KEY,
        character_id INTEGER NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
        actor_id TEXT NOT NULL, field TEXT NOT NULL,
        before INTEGER, after INTEGER, at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS character_changes_at ON character_changes (at);
      CREATE TABLE IF NOT EXISTS character_sheets (
        character_id INTEGER PRIMARY KEY REFERENCES characters (id) ON DELETE CASCADE,
        data TEXT NOT NULL, approvals TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS character_xp (
        id INTEGER PRIMARY KEY,
        character_id INTEGER NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
        actor_id TEXT NOT NULL, amount INTEGER NOT NULL, kind TEXT NOT NULL,
        note TEXT NOT NULL, at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS character_xp_character ON character_xp (character_id);
      CREATE TABLE IF NOT EXISTS character_xp_requests (
        id INTEGER PRIMARY KEY,
        character_id INTEGER NOT NULL REFERENCES characters (id) ON DELETE CASCADE,
        advance TEXT NOT NULL, cost INTEGER NOT NULL, status TEXT NOT NULL, at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS character_xp_requests_character
        ON character_xp_requests (character_id);
      CREATE TABLE IF NOT EXISTS character_surges (
        character_id INTEGER PRIMARY KEY REFERENCES characters (id) ON DELETE CASCADE,
        data TEXT NOT NULL, at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS character_impairments (
        character_id INTEGER PRIMARY KEY REFERENCES characters (id) ON DELETE CASCADE,
        data TEXT NOT NULL, at INTEGER NOT NULL);
    `);
    // Chronicles made before tiers of play have none: they take any character.
    const columns = db.prepare('PRAGMA table_info(chronicles)').all() as { name: string }[];
    if (!columns.some((c) => c.name === 'tier'))
      db.exec('ALTER TABLE chronicles ADD COLUMN tier TEXT');
    const xpColumns = db.prepare('PRAGMA table_info(character_xp)').all() as { name: string }[];
    if (!xpColumns.some((c) => c.name === 'advance'))
      db.exec('ALTER TABLE character_xp ADD COLUMN advance TEXT');
    if (!xpColumns.some((c) => c.name === 'ref'))
      db.exec('ALTER TABLE character_xp ADD COLUMN ref INTEGER');
    if (!columns.some((c) => c.name === 'locale'))
      db.exec('ALTER TABLE chronicles ADD COLUMN locale TEXT');
  }

  // Characters.

  createCharacter(input: {
    guildId: string;
    ownerId: string;
    name: string;
    clan: Clan;
    values: CharacterValues;
    /** A full sheet from the panel's wizard, saved with the character. */
    sheet?: Omit<StoredSheet, 'createdAt'>;
  }): CreateResult<Character> {
    const count = this.db
      .prepare('SELECT COUNT(*) AS n FROM characters WHERE guild_id = ? AND owner_id = ?')
      .get(input.guildId, input.ownerId) as { n: number };
    if (count.n >= LIMITS.charactersPerUser) return 'limit';
    if (this.ownCharacterByName(input.guildId, input.ownerId, input.name)) return 'duplicate';
    const v = normalize(input.values);
    const insert = () =>
      this.db
        .prepare(
          `INSERT INTO characters (guild_id, owner_id, name, clan, tier, stamina, composure, resolve,
           health, baneful, vitae, willpower, humanity, violations, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          input.guildId,
          input.ownerId,
          input.name,
          input.clan,
          v.tier,
          v.stamina,
          v.composure,
          v.resolve,
          v.health,
          v.baneful,
          v.vitae,
          v.willpower,
          v.humanity,
          v.violations,
          Date.now(),
        );
    // The character and its sheet go in together, or not at all.
    const id = this.db.transaction(() => {
      const created = Number(insert().lastInsertRowid);
      if (input.sheet) this.attachSheet(created, input.sheet);
      return created;
    })();
    return this.getCharacter(id)!;
  }

  /** Saves the wizard's full sheet for a character, replacing any earlier one. */
  attachSheet(characterId: number, sheet: Omit<StoredSheet, 'createdAt'>): void {
    this.db
      .prepare(
        `INSERT INTO character_sheets (character_id, data, approvals, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (character_id) DO UPDATE SET data = excluded.data,
           approvals = excluded.approvals, created_at = excluded.created_at`,
      )
      .run(characterId, JSON.stringify(sheet.data), JSON.stringify(sheet.approvals), Date.now());
  }

  /** Replaces the approvals list of a character's sheet (the Storyteller's answers). */
  setApprovals(characterId: number, approvals: unknown[]): void {
    this.db
      .prepare('UPDATE character_sheets SET approvals = ? WHERE character_id = ?')
      .run(JSON.stringify(approvals), characterId);
  }

  getSheet(characterId: number): StoredSheet | undefined {
    const row = this.db
      .prepare('SELECT data, approvals, created_at FROM character_sheets WHERE character_id = ?')
      .get(characterId) as { data: string; approvals: string; created_at: number } | undefined;
    return row
      ? {
          data: JSON.parse(row.data) as unknown,
          approvals: JSON.parse(row.approvals) as unknown[],
          createdAt: row.created_at,
        }
      : undefined;
  }

  // Experience points: an append-only log per character; the balance is its sum.

  /** Adds entries to the XP logs in one go: one `[characterId, amount]` per character. */
  addXp(
    entries: readonly (readonly [number, number])[],
    actorId: string,
    kind: XpEntry['kind'],
    note: string,
    now = Date.now(),
  ): void {
    const insert = this.db.prepare(
      `INSERT INTO character_xp (character_id, actor_id, amount, kind, note, at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    this.db.transaction(() => {
      for (const [id, amount] of entries) insert.run(id, actorId, amount, kind, note, now);
    })();
  }

  xpLog(characterId: number): XpEntry[] {
    const rows = this.db
      .prepare(
        `SELECT id, at, actor_id, amount, kind, note, advance, ref FROM character_xp
         WHERE character_id = ? ORDER BY id`,
      )
      .all(characterId) as {
      id: number;
      at: number;
      actor_id: string;
      amount: number;
      kind: XpEntry['kind'];
      note: string;
      advance: string | null;
      ref: number | null;
    }[];
    return rows.map((r) => ({
      id: r.id,
      at: r.at,
      actorId: r.actor_id,
      amount: r.amount,
      kind: r.kind,
      note: r.note,
      ...(r.advance === null ? {} : { advance: JSON.parse(r.advance) as unknown }),
      ...(r.ref === null ? {} : { ref: r.ref }),
    }));
  }

  /**
   * Spends XP on a purchase. Refused ('short') when the balance can't cover it, checked in the
   * same transaction as the write so two clicks can't overspend.
   */
  spendXp(
    characterId: number,
    actorId: string,
    cost: number,
    advance: unknown,
    note: string,
    now = Date.now(),
  ): 'ok' | 'short' {
    return this.db.transaction(() => {
      const { balance } = this.db
        .prepare(
          'SELECT COALESCE(SUM(amount), 0) AS balance FROM character_xp WHERE character_id = ?',
        )
        .get(characterId) as { balance: number };
      if (balance < cost) return 'short' as const;
      this.db
        .prepare(
          `INSERT INTO character_xp (character_id, actor_id, amount, kind, note, at, advance)
           VALUES (?, ?, ?, 'spend', ?, ?, ?)`,
        )
        .run(characterId, actorId, -cost, note, now, JSON.stringify(advance));
      return 'ok' as const;
    })();
  }

  /** A purchase the Storyteller must approve. 'duplicate': the same one is already waiting. */
  requestXp(
    characterId: number,
    advance: Advance,
    cost: number,
    now = Date.now(),
  ): number | 'duplicate' {
    const key = JSON.stringify(advance);
    if (this.xpRequests(characterId).some((r) => JSON.stringify(r.advance) === key)) {
      return 'duplicate';
    }
    const info = this.db
      .prepare(
        `INSERT INTO character_xp_requests (character_id, advance, cost, status, at)
         VALUES (?, ?, ?, 'pending', ?)`,
      )
      .run(characterId, key, cost, now);
    return Number(info.lastInsertRowid);
  }

  xpRequests(characterId: number): XpRequest[] {
    return (
      this.db
        .prepare(
          `SELECT id, advance, cost, at FROM character_xp_requests
           WHERE character_id = ? AND status = 'pending' ORDER BY id`,
        )
        .all(characterId) as { id: number; advance: string; cost: number; at: number }[]
    ).map((r) => ({
      id: r.id,
      advance: JSON.parse(r.advance) as Advance,
      cost: r.cost,
      at: r.at,
    }));
  }

  /** Closes a pending request ('done' or 'refused'); false when it was not pending. */
  closeXpRequest(characterId: number, id: number, status: 'done' | 'refused'): boolean {
    return (
      this.db
        .prepare(
          `UPDATE character_xp_requests SET status = ?
           WHERE id = ? AND character_id = ? AND status = 'pending'`,
        )
        .run(status, id, characterId).changes > 0
    );
  }

  /** Gives back the XP of a purchase still in force. False when there is no such purchase. */
  refundXp(characterId: number, actorId: string, entryId: number, now = Date.now()): boolean {
    return this.db.transaction(() => {
      const log = this.xpLog(characterId);
      const entry = log.find((e) => e.id === entryId && e.kind === 'spend');
      if (!entry || log.some((e) => e.ref === entryId)) return false;
      this.db
        .prepare(
          `INSERT INTO character_xp (character_id, actor_id, amount, kind, note, at, ref)
           VALUES (?, ?, ?, 'refund', ?, ?, ?)`,
        )
        .run(characterId, actorId, -entry.amount, entry.note, now, entryId);
      return true;
    })();
  }

  /** Purchases still in force, oldest first (refunded ones, with a later `ref`, are gone). */
  activeSpends(characterId: number): { id: number; advance: Advance }[] {
    const log = this.xpLog(characterId);
    const undone = new Set(log.flatMap((e) => (e.ref === undefined ? [] : [e.ref])));
    return log
      .filter((e) => e.kind === 'spend' && e.advance !== undefined && !undone.has(e.id))
      .map((e) => ({ id: e.id, advance: e.advance as Advance }));
  }

  advancesOf(characterId: number): Advance[] {
    return this.activeSpends(characterId).map((s) => s.advance);
  }

  // Blood Surge: lasts the scene (p. 147). Kept per character until the scene or session ends,
  // and forgotten after SURGE_TTL_MS in case nobody ends it.

  getSurges(characterId: number, now = Date.now()): Surges {
    const row = this.db
      .prepare('SELECT data, at FROM character_surges WHERE character_id = ?')
      .get(characterId) as { data: string; at: number } | undefined;
    if (!row) return {};
    if (now - row.at > SURGE_TTL_MS) {
      this.clearSurges(characterId);
      return {};
    }
    return parseSurges(JSON.parse(row.data));
  }

  /** Saves the active surges; the clock restarts with each new surge. */
  setSurges(characterId: number, surges: Surges, now = Date.now()): void {
    this.db
      .prepare(
        `INSERT INTO character_surges (character_id, data, at) VALUES (?, ?, ?)
         ON CONFLICT (character_id) DO UPDATE SET data = excluded.data, at = excluded.at`,
      )
      .run(characterId, JSON.stringify(surges), now);
  }

  clearSurges(characterId: number): void {
    this.db.prepare('DELETE FROM character_surges WHERE character_id = ?').run(characterId);
  }

  /** End of a session: every surge in the Chronicle ends. */
  clearChronicleSurges(chronicleId: number): void {
    this.db
      .prepare(
        `DELETE FROM character_surges WHERE character_id IN
           (SELECT character_id FROM chronicle_members WHERE chronicle_id = ?)`,
      )
      .run(chronicleId);
  }

  // Impairment from the Storyteller: lasts the scene like a surge, with the same safety clock.

  getImpairments(characterId: number, now = Date.now()): ImpairKey[] {
    const row = this.db
      .prepare('SELECT data, at FROM character_impairments WHERE character_id = ?')
      .get(characterId) as { data: string; at: number } | undefined;
    if (!row) return [];
    if (now - row.at > IMPAIR_TTL_MS) {
      this.clearImpairments(characterId);
      return [];
    }
    return parseImpairments(JSON.parse(row.data));
  }

  /** Saves the whole list; an empty one ends the Impairment. */
  setImpairments(characterId: number, keys: readonly ImpairKey[], now = Date.now()): ImpairKey[] {
    const list = parseImpairments([...keys]);
    if (!list.length) {
      this.clearImpairments(characterId);
      return [];
    }
    this.db
      .prepare(
        `INSERT INTO character_impairments (character_id, data, at) VALUES (?, ?, ?)
         ON CONFLICT (character_id) DO UPDATE SET data = excluded.data, at = excluded.at`,
      )
      .run(characterId, JSON.stringify(list), now);
    return list;
  }

  clearImpairments(characterId: number): void {
    this.db.prepare('DELETE FROM character_impairments WHERE character_id = ?').run(characterId);
  }

  /** End of a session: the Chronicle's Impairment ends. */
  clearChronicleImpairments(chronicleId: number): void {
    this.db
      .prepare(
        `DELETE FROM character_impairments WHERE character_id IN
           (SELECT character_id FROM chronicle_members WHERE chronicle_id = ?)`,
      )
      .run(chronicleId);
  }

  getCharacter(id: number): Character | undefined {
    const row = this.db.prepare(`${CHARACTER_SELECT} WHERE c.id = ?`).get(id) as
      CharacterRow | undefined;
    return row ? toCharacter(row) : undefined;
  }

  private ownCharacterByName(guildId: string, ownerId: string, name: string) {
    return this.db
      .prepare(
        'SELECT id FROM characters WHERE guild_id = ? AND owner_id = ? AND name = ? COLLATE NOCASE',
      )
      .get(guildId, ownerId, name) as { id: number } | undefined;
  }

  /** A user's characters on one server, by name. */
  charactersOf(guildId: string, ownerId: string): Character[] {
    const rows = this.db
      .prepare(
        `${CHARACTER_SELECT} WHERE c.guild_id = ? AND c.owner_id = ? ORDER BY c.name COLLATE NOCASE`,
      )
      .all(guildId, ownerId) as CharacterRow[];
    return rows.map(toCharacter);
  }

  /** Every character a user owns, on any server, by name: for the web panel. */
  charactersOwnedBy(ownerId: string): Character[] {
    const rows = this.db
      .prepare(`${CHARACTER_SELECT} WHERE c.owner_id = ? ORDER BY c.name COLLATE NOCASE`)
      .all(ownerId) as CharacterRow[];
    return rows.map(toCharacter);
  }

  /** Every Chronicle a Storyteller runs that is not archived, on any server: for the web panel. */
  chroniclesRunBy(storytellerId: string): Chronicle[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM chronicles WHERE storyteller_id = ? AND archived = 0
         ORDER BY name COLLATE NOCASE`,
      )
      .all(storytellerId) as ChronicleRow[];
    return rows.map(toChronicle);
  }

  /** Characters in the Chronicles a Storyteller runs on a server, by name. */
  charactersRunBy(guildId: string, storytellerId: string): Character[] {
    const rows = this.db
      .prepare(
        `${CHARACTER_SELECT}
         JOIN chronicles ch ON ch.id = m.chronicle_id
         WHERE ch.guild_id = ? AND ch.storyteller_id = ? ORDER BY c.name COLLATE NOCASE`,
      )
      .all(guildId, storytellerId) as CharacterRow[];
    return rows.map(toCharacter);
  }

  /**
   * Changes name, clan or the values behind the maxima. Current values are clamped to the
   * new maxima. Returns 'duplicate' when the owner already has a character with that name.
   */
  updateCharacter(
    id: number,
    patch: { name?: string; clan?: Clan; values?: Partial<CharacterValues> },
    actorId: string,
  ): CreateResult<Character> | 'tier' | undefined {
    const c = this.getCharacter(id);
    if (!c) return undefined;
    const tier = patch.values?.tier;
    if (tier !== undefined && tier !== c.values.tier && c.chronicleId !== undefined) {
      if (!tierFits(tier, this.getChronicle(c.chronicleId)?.tier)) return 'tier';
    }
    if (patch.name !== undefined) {
      const other = this.ownCharacterByName(c.guildId, c.ownerId, patch.name);
      if (other && other.id !== id) return 'duplicate';
    }
    const v = normalize({ ...c.values, ...patch.values });
    this.db.transaction(() => {
      this.db
        .prepare(
          `UPDATE characters SET name = ?, clan = ?, tier = ?, stamina = ?, composure = ?,
             resolve = ?, health = ?, baneful = ?, vitae = ?, willpower = ?, humanity = ?,
             violations = ? WHERE id = ?`,
        )
        .run(
          patch.name ?? c.name,
          patch.clan ?? c.clan,
          v.tier,
          v.stamina,
          v.composure,
          v.resolve,
          v.health,
          v.baneful,
          v.vitae,
          v.willpower,
          v.humanity,
          v.violations,
          id,
        );
      this.logChanges(id, actorId, c.values, v);
    })();
    return this.getCharacter(id);
  }

  /** Sets one tracker, clamped to the rules. */
  setTrack(id: number, track: Track, value: number, actorId: string): Character | undefined {
    const c = this.getCharacter(id);
    if (!c) return undefined;
    const result = this.updateCharacter(id, { values: setTrack(c.values, track, value) }, actorId);
    return typeof result === 'object' ? result : undefined;
  }

  deleteCharacter(id: number): void {
    this.db.prepare('DELETE FROM characters WHERE id = ?').run(id);
  }

  /**
   * Hands a character to another user, if `fromId` still owns it. Keeps its Chronicle.
   * Returns 'duplicate' when the new owner already has a character with that name.
   */
  transferCharacter(id: number, fromId: string, toId: string): CreateResult<Character> | undefined {
    const c = this.getCharacter(id);
    if (!c || c.ownerId !== fromId) return undefined;
    if (this.ownCharacterByName(c.guildId, toId, c.name)) return 'duplicate';
    const count = this.db
      .prepare('SELECT COUNT(*) AS n FROM characters WHERE guild_id = ? AND owner_id = ?')
      .get(c.guildId, toId) as { n: number };
    if (count.n >= LIMITS.charactersPerUser) return 'limit';
    this.db.prepare('UPDATE characters SET owner_id = ? WHERE id = ?').run(toId, id);
    return this.getCharacter(id);
  }

  /**
   * The character a user plays at this channel's table: theirs, in the Chronicle bound to the
   * channel. With several, the first in scene order.
   */
  activeCharacter(channelId: string, userId: string): Character | undefined {
    const row = this.db
      .prepare(
        `${CHARACTER_SELECT}
         JOIN chronicles ch ON ch.id = m.chronicle_id
         WHERE ch.channel_id = ? AND c.owner_id = ?
         ORDER BY EXISTS (SELECT 1 FROM active_characters a
                          WHERE a.owner_id = c.owner_id AND a.character_id = c.id) DESC,
                  m.position LIMIT 1`,
      )
      .get(channelId, userId) as CharacterRow | undefined;
    return row ? toCharacter(row) : undefined;
  }

  /** The character a user chose to play on a server, if they chose one. */
  selectedCharacter(guildId: string, userId: string): Character | undefined {
    const row = this.db
      .prepare(
        `${CHARACTER_SELECT}
         JOIN active_characters a ON a.character_id = c.id
         WHERE a.guild_id = ? AND a.owner_id = ?`,
      )
      .get(guildId, userId) as CharacterRow | undefined;
    return row ? toCharacter(row) : undefined;
  }

  /** Make one of a user's own characters the one they play. False if it is not theirs. */
  selectCharacter(characterId: number, userId: string): Character | undefined {
    const c = this.getCharacter(characterId);
    if (!c || c.ownerId !== userId) return undefined;
    this.db
      .prepare(
        `INSERT INTO active_characters (guild_id, owner_id, character_id) VALUES (?, ?, ?)
         ON CONFLICT (guild_id, owner_id) DO UPDATE SET character_id = excluded.character_id`,
      )
      .run(c.guildId, userId, c.id);
    return c;
  }

  /**
   * The character a roll is made as: the one at this channel's table, otherwise the user's only
   * character on the server (so a table channel not bound to a Chronicle still counts Hunger).
   */
  playedCharacter(
    guildId: string | null,
    channelId: string,
    userId: string,
  ): Character | undefined {
    const here = this.activeCharacter(channelId, userId);
    if (here || !guildId) return here;
    const chosen = this.selectedCharacter(guildId, userId);
    if (chosen) return chosen;
    const own = this.charactersOf(guildId, userId);
    return own.length === 1 ? own[0] : undefined;
  }

  /**
   * The Chronicle a roll belongs to, for the overlay: the one played in this channel,
   * otherwise a Chronicle on air where the roller has a character, otherwise the roller's
   * own Chronicle on air (a Storyteller rolling for an NPC). With the roller's character.
   */
  rollChronicle(
    guildId: string | null,
    channelId: string,
    userId: string,
  ): { chronicle: Chronicle; character?: Character } | undefined {
    const here = this.chronicleByChannel(channelId);
    if (here) return { chronicle: here, character: this.activeCharacter(channelId, userId) };
    if (!guildId) return undefined;
    const row = this.db
      .prepare(
        `${CHARACTER_SELECT}
         JOIN chronicles ch ON ch.id = m.chronicle_id
         JOIN live_chronicle l ON l.chronicle_id = ch.id
         WHERE c.guild_id = ? AND c.owner_id = ? ORDER BY m.position LIMIT 1`,
      )
      .get(guildId, userId) as CharacterRow | undefined;
    if (row) {
      const character = toCharacter(row);
      const chronicle = this.getChronicle(character.chronicleId!);
      if (chronicle) return { chronicle, character };
    }
    const own = this.liveChronicle(guildId, userId);
    return own ? { chronicle: own } : undefined;
  }

  /** Recent changes to a character, newest first. */
  changes(id: number, limit = 10) {
    return this.db
      .prepare(
        `SELECT actor_id AS actorId, field, before, after, at FROM character_changes
         WHERE character_id = ? ORDER BY at DESC, id DESC LIMIT ?`,
      )
      .all(id, limit) as {
      actorId: string;
      field: string;
      before: number | null;
      after: number | null;
      at: number;
    }[];
  }

  private logChanges(id: number, actorId: string, before: CharacterValues, after: CharacterValues) {
    const now = Date.now();
    const insert = this.db.prepare(
      `INSERT INTO character_changes (character_id, actor_id, field, before, after, at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    for (const key of Object.keys(after) as (keyof CharacterValues)[]) {
      if (key === 'tier' || before[key] === after[key]) continue;
      insert.run(id, actorId, key, before[key], after[key], now);
    }
    this.db
      .prepare('DELETE FROM character_changes WHERE at < ?')
      .run(now - CHANGE_LOG_DAYS * 24 * 60 * 60 * 1000);
  }

  // Chronicles.

  createChronicle(input: {
    guildId: string;
    storytellerId: string;
    name: string;
    sect: Sect;
    tier?: ChronicleTier;
  }): CreateResult<Chronicle> {
    const count = this.db
      .prepare(
        'SELECT COUNT(*) AS n FROM chronicles WHERE guild_id = ? AND storyteller_id = ? AND archived = 0',
      )
      .get(input.guildId, input.storytellerId) as { n: number };
    if (count.n >= LIMITS.chroniclesPerStoryteller) return 'limit';
    const slug = slugify(input.name);
    const taken = this.db
      .prepare('SELECT id FROM chronicles WHERE guild_id = ? AND slug = ?')
      .get(input.guildId, slug);
    if (taken) return 'duplicate';
    const info = this.db
      .prepare(
        `INSERT INTO chronicles (guild_id, slug, name, storyteller_id, sect, tier, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.guildId,
        slug,
        input.name,
        input.storytellerId,
        input.sect,
        input.tier ?? null,
        Date.now(),
      );
    return this.getChronicle(Number(info.lastInsertRowid))!;
  }

  /**
   * Sets or clears a Chronicle's tier of play. 'members' when a character already in it
   * would not fit: the Storyteller sorts that out first.
   */
  setChronicleTier(id: number, tier: ChronicleTier | undefined): 'ok' | 'members' {
    if (this.members(id).some((c) => !tierFits(c.values.tier, tier))) return 'members';
    this.db.prepare('UPDATE chronicles SET tier = ? WHERE id = ?').run(tier ?? null, id);
    return 'ok';
  }

  getChronicle(id: number): Chronicle | undefined {
    const row = this.db.prepare('SELECT * FROM chronicles WHERE id = ?').get(id) as
      ChronicleRow | undefined;
    return row ? toChronicle(row) : undefined;
  }

  /** The Chronicle played in a channel, if one was bound to it on the panel. */
  chronicleByChannel(channelId: string): Chronicle | undefined {
    const row = this.db
      .prepare('SELECT * FROM chronicles WHERE channel_id = ? AND archived = 0')
      .get(channelId) as ChronicleRow | undefined;
    return row ? toChronicle(row) : undefined;
  }

  /** Chronicles on a server that are not archived; only one Storyteller's when given. */
  chronicles(guildId: string, storytellerId?: string): Chronicle[] {
    const rows = (
      storytellerId === undefined
        ? this.db
            .prepare(
              'SELECT * FROM chronicles WHERE guild_id = ? AND archived = 0 ORDER BY name COLLATE NOCASE',
            )
            .all(guildId)
        : this.db
            .prepare(
              `SELECT * FROM chronicles WHERE guild_id = ? AND storyteller_id = ? AND archived = 0
               ORDER BY name COLLATE NOCASE`,
            )
            .all(guildId, storytellerId)
    ) as ChronicleRow[];
    return rows.map(toChronicle);
  }

  /** Renames or changes the sect. The slug stays, so overlay URLs keep working. */
  updateChronicle(id: number, patch: { name?: string; sect?: Sect }): Chronicle | undefined {
    const c = this.getChronicle(id);
    if (!c) return undefined;
    this.db
      .prepare('UPDATE chronicles SET name = ?, sect = ? WHERE id = ?')
      .run(patch.name ?? c.name, patch.sect ?? c.sect, id);
    return this.getChronicle(id);
  }

  /**
   * Hides a Chronicle: its channel is freed, it goes off air, and its characters are free to
   * join another Chronicle. Nothing is deleted.
   */
  archiveChronicle(id: number): void {
    this.db.transaction(() => {
      this.db.prepare('UPDATE chronicles SET archived = 1, channel_id = NULL WHERE id = ?').run(id);
      this.db.prepare('DELETE FROM live_chronicle WHERE chronicle_id = ?').run(id);
    })();
  }

  /** Hands a Chronicle to another Storyteller. It goes off air for the one who ran it. */
  transferChronicle(id: number, toId: string): Chronicle | undefined {
    this.db.transaction(() => {
      this.db.prepare('UPDATE chronicles SET storyteller_id = ? WHERE id = ?').run(toId, id);
      this.db.prepare('DELETE FROM live_chronicle WHERE chronicle_id = ?').run(id);
    })();
    return this.getChronicle(id);
  }

  /** The language of the Chronicle's table; undefined follows each user's Discord. */
  setChronicleLocale(id: number, locale: string | undefined): void {
    this.db.prepare('UPDATE chronicles SET locale = ? WHERE id = ?').run(locale ?? null, id);
  }

  /** Frees the Chronicle's channel: nobody plays it on Discord until a channel is chosen again. */
  unbindChannel(id: number): void {
    this.db.prepare('UPDATE chronicles SET channel_id = NULL WHERE id = ?').run(id);
  }

  /**
   * Everyone the bot knows on a server: owners of characters and Storytellers of Chronicles.
   * The panel offers them when a character or a Chronicle changes hands.
   */
  peopleOf(guildId: string): string[] {
    const rows = this.db
      .prepare(
        `SELECT owner_id AS id FROM characters WHERE guild_id = ?
         UNION SELECT storyteller_id FROM chronicles WHERE guild_id = ? AND archived = 0`,
      )
      .all(guildId, guildId) as { id: string }[];
    return rows.map((r) => r.id);
  }

  /** Plays a Chronicle in a channel; a channel holds one Chronicle at a time. */
  bindChannel(id: number, channelId: string): void {
    this.db.transaction(() => {
      this.db
        .prepare('UPDATE chronicles SET channel_id = NULL WHERE channel_id = ?')
        .run(channelId);
      this.db.prepare('UPDATE chronicles SET channel_id = ? WHERE id = ?').run(channelId, id);
    })();
  }

  setMasquerade(id: number, value: number): void {
    this.db.prepare('UPDATE chronicles SET masquerade = ? WHERE id = ?').run(value, id);
  }

  /** Puts a Chronicle on air for its Storyteller: the overlay shows its frames. */
  setLive(id: number): void {
    const c = this.getChronicle(id);
    if (!c) return;
    this.db
      .prepare(
        `INSERT INTO live_chronicle (guild_id, storyteller_id, chronicle_id) VALUES (?, ?, ?)
         ON CONFLICT (guild_id, storyteller_id) DO UPDATE SET chronicle_id = excluded.chronicle_id`,
      )
      .run(c.guildId, c.storytellerId, id);
  }

  liveChronicle(guildId: string, storytellerId: string): Chronicle | undefined {
    const row = this.db
      .prepare(
        `SELECT ch.* FROM live_chronicle l JOIN chronicles ch ON ch.id = l.chronicle_id
         WHERE l.guild_id = ? AND l.storyteller_id = ?`,
      )
      .get(guildId, storytellerId) as ChronicleRow | undefined;
    return row ? toChronicle(row) : undefined;
  }

  /** A Chronicle's characters in scene order. */
  members(chronicleId: number): Character[] {
    const rows = this.db
      .prepare(`${CHARACTER_SELECT} WHERE m.chronicle_id = ? ORDER BY m.position`)
      .all(chronicleId) as CharacterRow[];
    return rows.map(toCharacter);
  }

  /**
   * Adds a character to a Chronicle, at the end of the scene. 'busy' if it already plays in
   * another Chronicle that is not archived.
   */
  join(chronicleId: number, characterId: number): 'ok' | 'busy' | 'tier' {
    const c = this.getCharacter(characterId);
    if (c?.chronicleId !== undefined) return c.chronicleId === chronicleId ? 'ok' : 'busy';
    if (c && !tierFits(c.values.tier, this.getChronicle(chronicleId)?.tier)) return 'tier';
    this.db
      .prepare(
        `INSERT INTO chronicle_members (character_id, chronicle_id, position)
         VALUES (?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM chronicle_members
                        WHERE chronicle_id = ?))
         ON CONFLICT (character_id) DO UPDATE SET chronicle_id = excluded.chronicle_id,
           position = excluded.position`,
      )
      .run(characterId, chronicleId, chronicleId);
    return 'ok';
  }

  /**
   * Moves a character one place earlier (-1) or later (+1) in its Chronicle's scene order.
   * Returns false when it is not a member or is already at that end.
   */
  moveMember(chronicleId: number, characterId: number, delta: -1 | 1): boolean {
    const order = this.members(chronicleId).map((c) => c.id);
    const i = order.indexOf(characterId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= order.length) return false;
    [order[i], order[j]] = [order[j]!, order[i]!];
    const set = this.db.prepare('UPDATE chronicle_members SET position = ? WHERE character_id = ?');
    this.db.transaction(() => order.forEach((id, k) => set.run(k + 1, id)))();
    return true;
  }

  leave(characterId: number): void {
    this.db.prepare('DELETE FROM chronicle_members WHERE character_id = ?').run(characterId);
  }
}
