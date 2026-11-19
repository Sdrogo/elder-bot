import type Database from 'better-sqlite3';
import { createHash, randomBytes } from 'node:crypto';

/** How long a panel login lasts. */
export const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export interface WebSession {
  userId: string;
  /** Discord display name at login, shown in the panel. */
  name: string;
  /** Sent back with every change, so another site can't make the browser change anything. */
  csrf: string;
  expiresAt: number;
}

/** The database keeps only a hash: a copy of the database can't be used to log in. */
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

/** Web panel logins. Each one is a random token in an HttpOnly cookie. */
export class WebSessions {
  constructor(
    private readonly db: Database.Database,
    private readonly now: () => number = Date.now,
  ) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS web_sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL, name TEXT NOT NULL, csrf TEXT NOT NULL,
        created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS web_sessions_expires ON web_sessions (expires_at);
    `);
  }

  /** Starts a session and returns the token for the cookie. */
  create(userId: string, name: string): { token: string; session: WebSession } {
    const token = randomBytes(32).toString('base64url');
    const now = this.now();
    const session = {
      userId,
      name,
      csrf: randomBytes(24).toString('base64url'),
      expiresAt: now + SESSION_MS,
    };
    this.db.prepare('DELETE FROM web_sessions WHERE expires_at < ?').run(now);
    this.db
      .prepare(
        `INSERT INTO web_sessions (token_hash, user_id, name, csrf, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(hash(token), userId, name, session.csrf, now, session.expiresAt);
    return { token, session };
  }

  get(token: string | undefined): WebSession | undefined {
    if (!token || token.length > 100) return undefined;
    const row = this.db
      .prepare(
        'SELECT user_id, name, csrf, expires_at FROM web_sessions WHERE token_hash = ? AND expires_at > ?',
      )
      .get(hash(token), this.now()) as
      { user_id: string; name: string; csrf: string; expires_at: number } | undefined;
    return row
      ? { userId: row.user_id, name: row.name, csrf: row.csrf, expiresAt: row.expires_at }
      : undefined;
  }

  delete(token: string): void {
    this.db.prepare('DELETE FROM web_sessions WHERE token_hash = ?').run(hash(token));
  }

  /** Logs a user out everywhere. */
  deleteUser(userId: string): void {
    this.db.prepare('DELETE FROM web_sessions WHERE user_id = ?').run(userId);
  }
}
