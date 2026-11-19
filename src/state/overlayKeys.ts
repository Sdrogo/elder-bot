import type Database from 'better-sqlite3';
import { createHash, randomBytes } from 'node:crypto';

/** Prefix that makes a leaked key easy to recognise in logs and secret scanners. */
const PREFIX = 'elk_';

/** The database keeps only a hash: a copy of the database can't be used as a key. */
const hash = (key: string) => createHash('sha256').update(key).digest('hex');

/**
 * Keys for the Storyteller's OBS overlay: one per user, made in the web panel. The overlay
 * sends it to read the Chronicle on air and to move trackers from the Stream Deck.
 */
export class OverlayKeys {
  constructor(
    private readonly db: Database.Database,
    private readonly now: () => number = Date.now,
  ) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS overlay_keys (
        user_id TEXT PRIMARY KEY, key_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL);
    `);
  }

  /** Makes a new key for the user, replacing the old one. The key is shown only once. */
  create(userId: string): string {
    const key = PREFIX + randomBytes(32).toString('base64url');
    this.db
      .prepare(
        `INSERT INTO overlay_keys (user_id, key_hash, created_at) VALUES (?, ?, ?)
         ON CONFLICT (user_id) DO UPDATE SET key_hash = excluded.key_hash,
           created_at = excluded.created_at`,
      )
      .run(userId, hash(key), this.now());
    return key;
  }

  /** The user a key belongs to. */
  userOf(key: string | undefined): string | undefined {
    if (!key || !key.startsWith(PREFIX) || key.length > 100) return undefined;
    const row = this.db
      .prepare('SELECT user_id FROM overlay_keys WHERE key_hash = ?')
      .get(hash(key)) as { user_id: string } | undefined;
    return row?.user_id;
  }

  /** When the user's key was made, if they have one. */
  createdAt(userId: string): number | undefined {
    const row = this.db
      .prepare('SELECT created_at FROM overlay_keys WHERE user_id = ?')
      .get(userId) as { created_at: number } | undefined;
    return row?.created_at;
  }

  revoke(userId: string): void {
    this.db.prepare('DELETE FROM overlay_keys WHERE user_id = ?').run(userId);
  }
}
