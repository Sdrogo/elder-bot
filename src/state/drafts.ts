import type Database from 'better-sqlite3';
import type { SheetDraft } from '../game/creation.js';

/** Drafts a player can keep at once: enough to try a few ideas, not a storage service. */
export const MAX_DRAFTS = 10;

export interface Draft {
  id: number;
  ownerId: string;
  data: SheetDraft;
  createdAt: number;
  updatedAt: number;
}

interface Row {
  id: number;
  owner_id: string;
  data: string;
  created_at: number;
  updated_at: number;
}

const toDraft = (r: Row): Draft => ({
  id: r.id,
  ownerId: r.owner_id,
  data: JSON.parse(r.data) as SheetDraft,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/**
 * Character sheets in progress from the creation wizard, one row per draft, the sheet as JSON.
 * They belong to a user, not to a server: the server is chosen when the character is created.
 */
export class Drafts {
  constructor(
    private readonly db: Database.Database,
    private readonly now: () => number = Date.now,
  ) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS character_drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS character_drafts_owner ON character_drafts (owner_id);
    `);
  }

  /** The user's drafts, the last changed first. */
  ownedBy(ownerId: string): Draft[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM character_drafts WHERE owner_id = ? ORDER BY updated_at DESC, id DESC',
      )
      .all(ownerId) as Row[];
    return rows.map(toDraft);
  }

  /** One of the user's drafts; someone else's is not found. */
  get(id: number, ownerId: string): Draft | undefined {
    const row = this.db
      .prepare('SELECT * FROM character_drafts WHERE id = ? AND owner_id = ?')
      .get(id, ownerId) as Row | undefined;
    return row && toDraft(row);
  }

  create(ownerId: string, data: SheetDraft): Draft | 'limit' {
    return this.db.transaction(() => {
      const { n } = this.db
        .prepare('SELECT COUNT(*) AS n FROM character_drafts WHERE owner_id = ?')
        .get(ownerId) as { n: number };
      if (n >= MAX_DRAFTS) return 'limit' as const;
      const at = this.now();
      const { lastInsertRowid } = this.db
        .prepare(
          `INSERT INTO character_drafts (owner_id, data, created_at, updated_at)
           VALUES (?, ?, ?, ?)`,
        )
        .run(ownerId, JSON.stringify(data), at, at);
      return this.get(Number(lastInsertRowid), ownerId)!;
    })();
  }

  update(id: number, ownerId: string, data: SheetDraft): Draft | undefined {
    const { changes } = this.db
      .prepare('UPDATE character_drafts SET data = ?, updated_at = ? WHERE id = ? AND owner_id = ?')
      .run(JSON.stringify(data), this.now(), id, ownerId);
    return changes ? this.get(id, ownerId) : undefined;
  }

  delete(id: number, ownerId: string): boolean {
    return (
      this.db.prepare('DELETE FROM character_drafts WHERE id = ? AND owner_id = ?').run(id, ownerId)
        .changes > 0
    );
  }
}
