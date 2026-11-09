import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ProlongedTask } from '../dice/prolonged.js';

/**
 * Table state, scoped by Discord channel: one channel is one game table.
 * Hunger dice are not stored: players give them with each roll.
 */
export class Store {
  private db: Database.Database;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      DROP TABLE IF EXISTS quickening;
      DROP TABLE IF EXISTS drama;
      DROP TABLE IF EXISTS scene_traits;
      DROP TABLE IF EXISTS bargains;
      CREATE TABLE IF NOT EXISTS storytellers (
        channel_id TEXT PRIMARY KEY, user_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS prolonged (
        channel_id TEXT NOT NULL, user_id TEXT NOT NULL, task TEXT NOT NULL,
        PRIMARY KEY (channel_id, user_id));
      CREATE TABLE IF NOT EXISTS table_locale (
        channel_id TEXT PRIMARY KEY, locale TEXT NOT NULL);
    `);
  }

  /** The Storyteller of a table, set by /session; undefined until someone takes the role. */
  getStoryteller(channelId: string): string | undefined {
    const row = this.db
      .prepare('SELECT user_id FROM storytellers WHERE channel_id = ?')
      .get(channelId) as { user_id: string } | undefined;
    return row?.user_id;
  }

  setStoryteller(channelId: string, userId: string): void {
    this.db
      .prepare(
        `INSERT INTO storytellers (channel_id, user_id) VALUES (?, ?)
         ON CONFLICT (channel_id) DO UPDATE SET user_id = excluded.user_id`,
      )
      .run(channelId, userId);
  }

  /** The language fixed for a table by /elder session language; undefined follows each user. */
  getTableLocale(channelId: string): string | undefined {
    const row = this.db
      .prepare('SELECT locale FROM table_locale WHERE channel_id = ?')
      .get(channelId) as { locale: string } | undefined;
    return row?.locale;
  }

  setTableLocale(channelId: string, locale: string): void {
    this.db
      .prepare(
        `INSERT INTO table_locale (channel_id, locale) VALUES (?, ?)
         ON CONFLICT (channel_id) DO UPDATE SET locale = excluded.locale`,
      )
      .run(channelId, locale);
  }

  clearTableLocale(channelId: string): void {
    this.db.prepare('DELETE FROM table_locale WHERE channel_id = ?').run(channelId);
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

  /** End of the game at this table: everything is wiped, including the Storyteller and the language. */
  endSession(channelId: string): void {
    this.db.transaction(() => {
      for (const table of ['prolonged', 'storytellers', 'table_locale']) {
        this.db.prepare(`DELETE FROM ${table} WHERE channel_id = ?`).run(channelId);
      }
    })();
  }

  close(): void {
    this.db.close();
  }
}
