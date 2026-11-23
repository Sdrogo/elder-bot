import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ProlongedTask } from '../dice/prolonged.js';
import { Campaign } from './campaign.js';
import { Drafts } from './drafts.js';
import { OverlayKeys, ViewKeys } from './overlayKeys.js';
import { WebSessions } from './sessions.js';
import { Stage } from './stage.js';

/** The Masquerade Tracker has 10 boxes. */
export const MASQUERADE_BOXES = 10;

/**
 * Table state, scoped by Discord channel: one channel is one game table.
 * Hunger dice are not stored: players give them with each roll.
 */
export class Store {
  private db: Database.Database;
  /** Characters and Chronicles, in the same database. */
  readonly campaign: Campaign;
  /** Web panel logins. */
  readonly sessions: WebSessions;
  /** Keys for the Storyteller's OBS overlay. */
  readonly overlayKeys: OverlayKeys;
  /** View keys for the overlay pages in OBS. */
  readonly viewKeys: ViewKeys;
  /** Webcams, scene settings and last rolls for the OBS scene. */
  readonly stage: Stage;
  /** Character sheets in progress from the panel's creation wizard. */
  readonly drafts: Drafts;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      DROP TABLE IF EXISTS quickening;
      DROP TABLE IF EXISTS drama;
      DROP TABLE IF EXISTS scene_traits;
      DROP TABLE IF EXISTS bargains;
      CREATE TABLE IF NOT EXISTS prolonged (
        channel_id TEXT NOT NULL, user_id TEXT NOT NULL, task TEXT NOT NULL,
        PRIMARY KEY (channel_id, user_id));
      CREATE TABLE IF NOT EXISTS masquerade (
        channel_id TEXT PRIMARY KEY, value INTEGER NOT NULL);
    `);
    this.campaign = new Campaign(this.db);
    this.dropChannelSessions();
    this.sessions = new WebSessions(this.db);
    this.overlayKeys = new OverlayKeys(this.db);
    this.viewKeys = new ViewKeys(this.db);
    this.stage = new Stage(this.db);
    this.drafts = new Drafts(this.db);
  }

  /** Marked boxes on the Masquerade Tracker (Storyteller Packet p. 32), 0 to 10. */
  getMasquerade(channelId: string): number {
    const chronicle = this.campaign.chronicleByChannel(channelId);
    if (chronicle) return chronicle.masquerade;
    const row = this.db
      .prepare('SELECT value FROM masquerade WHERE channel_id = ?')
      .get(channelId) as { value: number } | undefined;
    return row?.value ?? 0;
  }

  setMasquerade(channelId: string, value: number): number {
    const clamped = Math.min(MASQUERADE_BOXES, Math.max(0, value));
    const chronicle = this.campaign.chronicleByChannel(channelId);
    if (chronicle) {
      this.campaign.setMasquerade(chronicle.id, clamped);
      return clamped;
    }
    this.db
      .prepare(
        `INSERT INTO masquerade (channel_id, value) VALUES (?, ?)
         ON CONFLICT (channel_id) DO UPDATE SET value = excluded.value`,
      )
      .run(channelId, clamped);
    return clamped;
  }

  /**
   * Plays a Chronicle in this channel. The Masquerade Tracker kept for the channel before
   * Chronicles existed moves to the Chronicle, unless the Chronicle already has boxes marked.
   */
  bindChronicle(channelId: string, chronicleId: number): void {
    this.db.transaction(() => {
      const old = this.db
        .prepare('SELECT value FROM masquerade WHERE channel_id = ?')
        .get(channelId) as { value: number } | undefined;
      this.campaign.bindChannel(chronicleId, channelId);
      const chronicle = this.campaign.getChronicle(chronicleId);
      if (old && chronicle && chronicle.masquerade === 0) {
        this.campaign.setMasquerade(chronicleId, old.value);
      }
      this.db.prepare('DELETE FROM masquerade WHERE channel_id = ?').run(channelId);
    })();
  }

  /**
   * Tables before Chronicles took over the session: the language moves to the Chronicle played
   * in that channel, then the per-channel Storyteller and language are dropped.
   */
  private dropChannelSessions(): void {
    const tables = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'table_locale'")
      .all();
    this.db.transaction(() => {
      if (tables.length) {
        this.db.exec(`UPDATE chronicles SET locale = (
            SELECT t.locale FROM table_locale t WHERE t.channel_id = chronicles.channel_id)
          WHERE locale IS NULL AND channel_id IN (SELECT channel_id FROM table_locale)`);
      }
      this.db.exec('DROP TABLE IF EXISTS table_locale; DROP TABLE IF EXISTS storytellers;');
    })();
  }

  /**
   * The Storyteller of a table: the one who runs the Chronicle played in this channel.
   * A channel with no Chronicle has none (server admins still count, see isStoryteller).
   */
  getStoryteller(channelId: string): string | undefined {
    return this.campaign.chronicleByChannel(channelId)?.storytellerId;
  }

  /** The language of the Chronicle played here; undefined follows each user's Discord. */
  getTableLocale(channelId: string): string | undefined {
    return this.campaign.chronicleByChannel(channelId)?.locale;
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

  /**
   * End of a session at this table: prolonged tasks still running are dropped. The Storyteller,
   * the language and the Masquerade Tracker belong to the Chronicle and stay.
   */
  endSession(channelId: string): void {
    this.db.prepare('DELETE FROM prolonged WHERE channel_id = ?').run(channelId);
  }

  close(): void {
    this.db.close();
  }
}
