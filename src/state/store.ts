import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ProlongedTask } from '../dice/prolonged.js';

/** A Drama scene trait (Storyteller Packet p. 30): a dice bonus or penalty for everyone in the scene. */
export interface SceneTrait {
  id: number;
  name: string;
  modifier: number;
}

/**
 * Table state, scoped by Discord channel: one channel is one game table.
 * [Quickening] and the Devil's Bargain are tracked per player in that channel.
 */
export class Store {
  private db: Database.Database;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quickening (
        channel_id TEXT NOT NULL, user_id TEXT NOT NULL, value INTEGER NOT NULL,
        PRIMARY KEY (channel_id, user_id));
      CREATE TABLE IF NOT EXISTS drama (
        channel_id TEXT PRIMARY KEY, value INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS scene_traits (
        id INTEGER PRIMARY KEY AUTOINCREMENT, channel_id TEXT NOT NULL,
        name TEXT NOT NULL, modifier INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS bargains (
        channel_id TEXT NOT NULL, user_id TEXT NOT NULL,
        PRIMARY KEY (channel_id, user_id));
      CREATE TABLE IF NOT EXISTS prolonged (
        channel_id TEXT NOT NULL, user_id TEXT NOT NULL, task TEXT NOT NULL,
        PRIMARY KEY (channel_id, user_id));
    `);
  }

  getQuickening(channelId: string, userId: string): number {
    const row = this.db
      .prepare('SELECT value FROM quickening WHERE channel_id = ? AND user_id = ?')
      .get(channelId, userId) as { value: number } | undefined;
    return row?.value ?? 0;
  }

  setQuickening(channelId: string, userId: string, value: number): void {
    this.db
      .prepare(
        `INSERT INTO quickening (channel_id, user_id, value) VALUES (?, ?, ?)
         ON CONFLICT (channel_id, user_id) DO UPDATE SET value = excluded.value`,
      )
      .run(channelId, userId, value);
  }

  resetQuickening(channelId: string): void {
    this.db.prepare('DELETE FROM quickening WHERE channel_id = ?').run(channelId);
  }

  getDrama(channelId: string): number {
    const row = this.db.prepare('SELECT value FROM drama WHERE channel_id = ?').get(channelId) as
      { value: number } | undefined;
    return row?.value ?? 0;
  }

  setDrama(channelId: string, value: number): void {
    this.db
      .prepare(
        `INSERT INTO drama (channel_id, value) VALUES (?, ?)
         ON CONFLICT (channel_id) DO UPDATE SET value = excluded.value`,
      )
      .run(channelId, Math.max(0, value));
  }

  listTraits(channelId: string): SceneTrait[] {
    return this.db
      .prepare('SELECT id, name, modifier FROM scene_traits WHERE channel_id = ? ORDER BY id')
      .all(channelId) as SceneTrait[];
  }

  addTrait(channelId: string, name: string, modifier: number): void {
    this.db
      .prepare('INSERT INTO scene_traits (channel_id, name, modifier) VALUES (?, ?, ?)')
      .run(channelId, name, modifier);
  }

  clearTraits(channelId: string): void {
    this.db.prepare('DELETE FROM scene_traits WHERE channel_id = ?').run(channelId);
  }

  traitModifier(channelId: string): number {
    return this.listTraits(channelId).reduce((sum, t) => sum + t.modifier, 0);
  }

  hasUsedBargain(channelId: string, userId: string): boolean {
    return (
      this.db
        .prepare('SELECT 1 FROM bargains WHERE channel_id = ? AND user_id = ?')
        .get(channelId, userId) !== undefined
    );
  }

  markBargain(channelId: string, userId: string): void {
    this.db
      .prepare('INSERT OR IGNORE INTO bargains (channel_id, user_id) VALUES (?, ?)')
      .run(channelId, userId);
  }

  clearBargains(channelId: string): void {
    this.db.prepare('DELETE FROM bargains WHERE channel_id = ?').run(channelId);
  }

  getProlonged(channelId: string, userId: string): ProlongedTask | undefined {
    const row = this.db
      .prepare('SELECT task FROM prolonged WHERE channel_id = ? AND user_id = ?')
      .get(channelId, userId) as { task: string } | undefined;
    return row ? (JSON.parse(row.task) as ProlongedTask) : undefined;
  }

  saveProlonged(channelId: string, userId: string, task: ProlongedTask): void {
    this.db
      .prepare(
        `INSERT INTO prolonged (channel_id, user_id, task) VALUES (?, ?, ?)
         ON CONFLICT (channel_id, user_id) DO UPDATE SET task = excluded.task`,
      )
      .run(channelId, userId, JSON.stringify(task));
  }

  deleteProlonged(channelId: string, userId: string): void {
    this.db
      .prepare('DELETE FROM prolonged WHERE channel_id = ? AND user_id = ?')
      .run(channelId, userId);
  }

  /** New scene: scene traits and Devil's Bargains (once per scene) reset. */
  newScene(channelId: string): void {
    this.clearTraits(channelId);
    this.clearBargains(channelId);
  }

  /** New session: Quickening back to 0, Drama to 1 per player character (Storyteller Packet p. 29). */
  newSession(channelId: string, playerCharacters: number): void {
    this.db.transaction(() => {
      this.resetQuickening(channelId);
      this.newScene(channelId);
      this.setDrama(channelId, playerCharacters);
    })();
  }

  close(): void {
    this.db.close();
  }
}
