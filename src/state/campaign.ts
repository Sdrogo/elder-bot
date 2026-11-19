import type Database from 'better-sqlite3';
import {
  LIMITS,
  normalize,
  setTrack,
  slugify,
  type CharacterValues,
  type Clan,
  type Sect,
  type Track,
} from '../game/character.js';

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
  /** The Discord channel where this Chronicle is played, set by /elder session new. */
  channelId?: string;
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
});

const toChronicle = (r: ChronicleRow): Chronicle => ({
  id: r.id,
  guildId: r.guild_id,
  slug: r.slug,
  name: r.name,
  storytellerId: r.storyteller_id,
  sect: r.sect as Sect,
  masquerade: r.masquerade,
  ...(r.channel_id !== null ? { channelId: r.channel_id } : {}),
  archived: r.archived === 1,
});

// Characters joined with their current (not archived) Chronicle.
const CHARACTER_SELECT = `
  SELECT c.*, m.chronicle_id AS chronicle_id FROM characters c
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
    `);
  }

  // Characters.

  createCharacter(input: {
    guildId: string;
    ownerId: string;
    name: string;
    clan: Clan;
    values: CharacterValues;
  }): CreateResult<Character> {
    const count = this.db
      .prepare('SELECT COUNT(*) AS n FROM characters WHERE guild_id = ? AND owner_id = ?')
      .get(input.guildId, input.ownerId) as { n: number };
    if (count.n >= LIMITS.charactersPerUser) return 'limit';
    if (this.ownCharacterByName(input.guildId, input.ownerId, input.name)) return 'duplicate';
    const v = normalize(input.values);
    const info = this.db
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
    return this.getCharacter(Number(info.lastInsertRowid))!;
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
  ): CreateResult<Character> | undefined {
    const c = this.getCharacter(id);
    if (!c) return undefined;
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
         WHERE ch.channel_id = ? AND c.owner_id = ? ORDER BY m.position LIMIT 1`,
      )
      .get(channelId, userId) as CharacterRow | undefined;
    return row ? toCharacter(row) : undefined;
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
        `INSERT INTO chronicles (guild_id, slug, name, storyteller_id, sect, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(input.guildId, slug, input.name, input.storytellerId, input.sect, Date.now());
    return this.getChronicle(Number(info.lastInsertRowid))!;
  }

  getChronicle(id: number): Chronicle | undefined {
    const row = this.db.prepare('SELECT * FROM chronicles WHERE id = ?').get(id) as
      ChronicleRow | undefined;
    return row ? toChronicle(row) : undefined;
  }

  /** The Chronicle played in a channel, if /elder session new bound one. */
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
  join(chronicleId: number, characterId: number): 'ok' | 'busy' {
    const c = this.getCharacter(characterId);
    if (c?.chronicleId !== undefined) return c.chronicleId === chronicleId ? 'ok' : 'busy';
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
