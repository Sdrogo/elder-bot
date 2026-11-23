import type Database from 'better-sqlite3';
import { createHash, randomBytes } from 'node:crypto';

// The OBS scene around the frames: each player's webcam (VDO.Ninja), the Storyteller's
// own settings (size, layout, background) and the last roll of each Chronicle.

/** Where the frames go on the /scena page. */
export const LAYOUTS = ['grid', 'stage', 'sides'] as const;
export type Layout = (typeof LAYOUTS)[number];

/** Scene sizes: Full HD and 2K. */
export const RESOLUTIONS = { '1080': [1920, 1080], '1440': [2560, 1440] } as const;
export type Resolution = keyof typeof RESOLUTIONS;

export const BACKGROUND_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type BackgroundType = (typeof BACKGROUND_TYPES)[number];
/** Background images up to 8 MB: a 2560×1440 JPEG or WebP is far smaller. */
export const MAX_BACKGROUND = 8 * 1024 * 1024;
/** Character portraits up to 2 MB: a 1000×1000 JPEG or WebP is far smaller. */
export const MAX_PORTRAIT = 2 * 1024 * 1024;

export const isLayout = (v: unknown): v is Layout => LAYOUTS.includes(v as Layout);

/** The scene editor's grid: 32×18 cells, 60 px each at 1080p and 80 px at 1440p. */
export const GRID = { cols: 32, rows: 18 } as const;
/** Saved layouts per Storyteller, player frames per layout, and rolls kept per Chronicle. */
export const MAX_LAYOUTS = 10;
export const MAX_LAYOUT_PLAYERS = 12;
export const ROLL_HISTORY = 10;

/** One component of a saved layout, in grid cells: the whole frame, bands included. */
export interface LayoutBox {
  x: number;
  y: number;
  w: number;
  h: number;
  hidden?: boolean;
}

/** Where everything goes: the players' frames in their Chronicle order, the Storyteller, the rolls. */
export interface LayoutItems {
  players: LayoutBox[];
  storyteller: LayoutBox;
  roll: LayoutBox;
}

export interface SavedLayout {
  id: number;
  name: string;
  items: LayoutItems;
}

function parseBox(v: unknown): LayoutBox | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const b = v as Record<string, unknown>;
  const int = (n: unknown, min: number, max: number) =>
    Number.isInteger(n) && (n as number) >= min && (n as number) <= max;
  if (!int(b.x, 0, GRID.cols - 1) || !int(b.y, 0, GRID.rows - 1)) return undefined;
  if (!int(b.w, 2, GRID.cols) || !int(b.h, 2, GRID.rows)) return undefined;
  const box = { x: b.x as number, y: b.y as number, w: b.w as number, h: b.h as number };
  if (box.x + box.w > GRID.cols || box.y + box.h > GRID.rows) return undefined;
  if (b.hidden !== undefined && typeof b.hidden !== 'boolean') return undefined;
  return b.hidden ? { ...box, hidden: true } : box;
}

/** A layout from the panel, checked cell by cell; undefined if anything is off the grid. */
export function parseLayoutItems(v: unknown): LayoutItems | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.players) || o.players.length > MAX_LAYOUT_PLAYERS) return undefined;
  const players = o.players.map(parseBox);
  const storyteller = parseBox(o.storyteller);
  const roll = parseBox(o.roll);
  if (!storyteller || !roll || players.some((p) => !p)) return undefined;
  return { players: players as LayoutBox[], storyteller, roll };
}

/** Layout names: what the Stream Deck key sends, 1–32 visible characters. */
export function cleanLayoutName(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const name = [...v]
    .filter((ch) => ch.charCodeAt(0) >= 32 && ch !== '\u007f')
    .join('')
    .trim();
  return name.length >= 1 && name.length <= 32 ? name : undefined;
}
export const isResolution = (v: unknown): v is Resolution =>
  typeof v === 'string' && Object.hasOwn(RESOLUTIONS, v);

export interface StageSettings {
  resolution: Resolution;
  layout: Layout;
  /** The box with the last roll, at the bottom centre of the scene. */
  rollBox: boolean;
  /** The Storyteller's own VDO.Ninja stream id. */
  cam?: string;
  /** A short hash of the background image, which changes with it; none without one. */
  background?: string;
  /** The saved layout in use; none for the automatic one (`layout`). */
  activeLayout?: number;
}

/** One side of a roll as the overlay shows it: dice faces and successes. */
export interface ShownSide {
  who: string;
  normal: number[];
  hunger: number[];
  successes: number;
}

/** The last roll of a Chronicle, for the box at the bottom of the scene. */
export interface ShownRoll {
  at: number;
  /** What was rolled: the player's reason or the kind of roll. */
  label: string;
  sides: ShownSide[];
  difficulty?: number;
  /** The result in game terms: Critical Win, Bestial Failure, Vince Marco... */
  outcome: string;
  tone: 'win' | 'critical' | 'fail' | 'bestial' | 'neutral';
}

/** VDO.Ninja stream ids: unguessable, letters and digits only (VDO.Ninja changes others). */
export function newCamId(): string {
  return 'elder' + randomBytes(10).toString('hex');
}

export const isCamId = (v: unknown): v is string =>
  typeof v === 'string' && /^elder[0-9a-f]{20}$/.test(v);

/** VDO.Ninja links: the player's own (sends the webcam, no microphone) and OBS's. */
export function camLinks(cam: string, label: string) {
  return {
    push: `https://vdo.ninja/?push=${cam}&webcam&audiodevice=0&label=${encodeURIComponent(label)}`,
    view: `https://vdo.ninja/?view=${cam}&cleanoutput&cover&noaudio&transparent`,
  };
}

const DEFAULTS: StageSettings = { resolution: '1080', layout: 'grid', rollBox: true };

export class Stage {
  constructor(
    private readonly db: Database.Database,
    private readonly now: () => number = Date.now,
  ) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS character_cams (
        character_id INTEGER PRIMARY KEY REFERENCES characters (id) ON DELETE CASCADE,
        cam TEXT NOT NULL UNIQUE);
      CREATE TABLE IF NOT EXISTS stage_settings (
        user_id TEXT PRIMARY KEY,
        resolution TEXT NOT NULL, layout TEXT NOT NULL, roll_box INTEGER NOT NULL,
        cam TEXT, background BLOB, background_type TEXT, background_tag TEXT);
      CREATE TABLE IF NOT EXISTS character_portraits (
        character_id INTEGER PRIMARY KEY REFERENCES characters (id) ON DELETE CASCADE,
        image BLOB NOT NULL, type TEXT NOT NULL, tag TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS chronicle_rolls (
        chronicle_id INTEGER PRIMARY KEY REFERENCES chronicles (id) ON DELETE CASCADE,
        roll TEXT NOT NULL, at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS roll_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chronicle_id INTEGER NOT NULL REFERENCES chronicles (id) ON DELETE CASCADE,
        roll TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS roll_history_chronicle ON roll_history (chronicle_id, id);
      CREATE TABLE IF NOT EXISTS stage_layouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL, name TEXT NOT NULL, items TEXT NOT NULL,
        UNIQUE (user_id, name));
    `);
    // Added with the saved layouts: older databases get the column here.
    const columns = db.prepare('PRAGMA table_info(stage_settings)').all() as { name: string }[];
    if (!columns.some((c) => c.name === 'active_layout')) {
      db.exec('ALTER TABLE stage_settings ADD COLUMN active_layout INTEGER');
    }
  }

  // Webcams of the characters.

  camOf(characterId: number): string | undefined {
    const row = this.db
      .prepare('SELECT cam FROM character_cams WHERE character_id = ?')
      .get(characterId) as { cam: string } | undefined;
    return row?.cam;
  }

  /** A new webcam link for a character: the old one stops showing in OBS. */
  renewCam(characterId: number): string {
    const cam = newCamId();
    this.db
      .prepare(
        `INSERT INTO character_cams (character_id, cam) VALUES (?, ?)
         ON CONFLICT (character_id) DO UPDATE SET cam = excluded.cam`,
      )
      .run(characterId, cam);
    return cam;
  }

  removeCam(characterId: number): void {
    this.db.prepare('DELETE FROM character_cams WHERE character_id = ?').run(characterId);
  }

  // Portraits of the characters, shown on the overlay.

  setPortrait(characterId: number, image: Buffer, type: BackgroundType): void {
    this.db
      .prepare(
        `INSERT INTO character_portraits (character_id, image, type, tag) VALUES (?, ?, ?, ?)
         ON CONFLICT (character_id) DO UPDATE SET
           image = excluded.image, type = excluded.type, tag = excluded.tag`,
      )
      .run(characterId, image, type, imageTag(image));
  }

  /** A short hash of the portrait, which changes with it; undefined without one. */
  portraitTag(characterId: number): string | undefined {
    const row = this.db
      .prepare('SELECT tag FROM character_portraits WHERE character_id = ?')
      .get(characterId) as { tag: string } | undefined;
    return row?.tag;
  }

  portrait(characterId: number): { image: Buffer; type: string } | undefined {
    return this.db
      .prepare('SELECT image, type FROM character_portraits WHERE character_id = ?')
      .get(characterId) as { image: Buffer; type: string } | undefined;
  }

  removePortrait(characterId: number): void {
    this.db.prepare('DELETE FROM character_portraits WHERE character_id = ?').run(characterId);
  }

  // The Storyteller's scene.

  settings(userId: string): StageSettings {
    const row = this.db
      .prepare(
        `SELECT resolution, layout, roll_box, cam, background_tag, active_layout
         FROM stage_settings WHERE user_id = ?`,
      )
      .get(userId) as
      | {
          resolution: string;
          layout: string;
          roll_box: number;
          cam: string | null;
          background_tag: string | null;
          active_layout: number | null;
        }
      | undefined;
    if (!row) return { ...DEFAULTS };
    return {
      resolution: isResolution(row.resolution) ? row.resolution : DEFAULTS.resolution,
      layout: isLayout(row.layout) ? row.layout : DEFAULTS.layout,
      rollBox: row.roll_box === 1,
      ...(row.cam ? { cam: row.cam } : {}),
      ...(row.background_tag ? { background: row.background_tag } : {}),
      ...(row.active_layout !== null ? { activeLayout: row.active_layout } : {}),
    };
  }

  private ensure(userId: string) {
    this.db
      .prepare(
        `INSERT INTO stage_settings (user_id, resolution, layout, roll_box) VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id) DO NOTHING`,
      )
      .run(userId, DEFAULTS.resolution, DEFAULTS.layout, DEFAULTS.rollBox ? 1 : 0);
  }

  update(
    userId: string,
    patch: Partial<Pick<StageSettings, 'resolution' | 'layout' | 'rollBox'>>,
  ): StageSettings {
    this.ensure(userId);
    const next = { ...this.settings(userId), ...patch };
    this.db
      .prepare(
        'UPDATE stage_settings SET resolution = ?, layout = ?, roll_box = ? WHERE user_id = ?',
      )
      .run(next.resolution, next.layout, next.rollBox ? 1 : 0, userId);
    return this.settings(userId);
  }

  /** The Storyteller's own webcam link, new each time. */
  renewStorytellerCam(userId: string): string {
    this.ensure(userId);
    const cam = newCamId();
    this.db.prepare('UPDATE stage_settings SET cam = ? WHERE user_id = ?').run(cam, userId);
    return cam;
  }

  removeStorytellerCam(userId: string): void {
    this.db.prepare('UPDATE stage_settings SET cam = NULL WHERE user_id = ?').run(userId);
  }

  setBackground(userId: string, image: Buffer, type: BackgroundType): void {
    this.ensure(userId);
    const tag = imageTag(image);
    this.db
      .prepare(
        `UPDATE stage_settings SET background = ?, background_type = ?, background_tag = ?
         WHERE user_id = ?`,
      )
      .run(image, type, tag, userId);
  }

  background(userId: string): { image: Buffer; type: string } | undefined {
    const row = this.db
      .prepare('SELECT background, background_type FROM stage_settings WHERE user_id = ?')
      .get(userId) as { background: Buffer | null; background_type: string | null } | undefined;
    return row?.background && row.background_type
      ? { image: row.background, type: row.background_type }
      : undefined;
  }

  removeBackground(userId: string): void {
    this.db
      .prepare(
        `UPDATE stage_settings SET background = NULL, background_type = NULL,
           background_tag = NULL WHERE user_id = ?`,
      )
      .run(userId);
  }

  // The Storyteller's saved layouts.

  layouts(userId: string): SavedLayout[] {
    const rows = this.db
      .prepare('SELECT id, name, items FROM stage_layouts WHERE user_id = ? ORDER BY id')
      .all(userId) as { id: number; name: string; items: string }[];
    return rows.flatMap((r) => {
      const items = parseLayoutItems(JSON.parse(r.items));
      return items ? [{ id: r.id, name: r.name, items }] : [];
    });
  }

  /** Saves a new layout (no `id`) or replaces one; the name must be the user's only one. */
  saveLayout(
    userId: string,
    layout: { id?: number; name: string; items: LayoutItems },
  ): SavedLayout | 'limit' | 'duplicate' | 'missing' {
    const mine = this.layouts(userId);
    const clash = mine.find(
      (l) => l.name.toLowerCase() === layout.name.toLowerCase() && l.id !== layout.id,
    );
    if (clash) return 'duplicate';
    const items = JSON.stringify(layout.items);
    if (layout.id !== undefined) {
      const info = this.db
        .prepare('UPDATE stage_layouts SET name = ?, items = ? WHERE id = ? AND user_id = ?')
        .run(layout.name, items, layout.id, userId);
      if (!info.changes) return 'missing';
      return { id: layout.id, name: layout.name, items: layout.items };
    }
    if (mine.length >= MAX_LAYOUTS) return 'limit';
    const info = this.db
      .prepare('INSERT INTO stage_layouts (user_id, name, items) VALUES (?, ?, ?)')
      .run(userId, layout.name, items);
    return { id: Number(info.lastInsertRowid), name: layout.name, items: layout.items };
  }

  deleteLayout(userId: string, id: number): boolean {
    const info = this.db
      .prepare('DELETE FROM stage_layouts WHERE id = ? AND user_id = ?')
      .run(id, userId);
    if (info.changes) {
      this.db
        .prepare(
          'UPDATE stage_settings SET active_layout = NULL WHERE user_id = ? AND active_layout = ?',
        )
        .run(userId, id);
    }
    return info.changes > 0;
  }

  /** Puts a saved layout on the scene, or the automatic one with `undefined`. */
  useLayout(userId: string, id: number | undefined): boolean {
    if (id !== undefined && !this.layouts(userId).some((l) => l.id === id)) return false;
    this.ensure(userId);
    this.db
      .prepare('UPDATE stage_settings SET active_layout = ? WHERE user_id = ?')
      .run(id ?? null, userId);
    return true;
  }

  /** The saved layout on the scene, if any. */
  activeLayout(userId: string): SavedLayout | undefined {
    const id = this.settings(userId).activeLayout;
    return id === undefined ? undefined : this.layouts(userId).find((l) => l.id === id);
  }

  // The last roll of each Chronicle.

  recordRoll(chronicleId: number, roll: Omit<ShownRoll, 'at'>): void {
    const at = this.now();
    this.db
      .prepare(
        `INSERT INTO chronicle_rolls (chronicle_id, roll, at) VALUES (?, ?, ?)
         ON CONFLICT (chronicle_id) DO UPDATE SET roll = excluded.roll, at = excluded.at`,
      )
      .run(chronicleId, JSON.stringify({ ...roll, at }), at);
    // The history for tall roll boxes: the last few rolls, oldest dropped.
    this.db
      .prepare('INSERT INTO roll_history (chronicle_id, roll) VALUES (?, ?)')
      .run(chronicleId, JSON.stringify({ ...roll, at }));
    this.db
      .prepare(
        `DELETE FROM roll_history WHERE chronicle_id = ? AND id NOT IN (
           SELECT id FROM roll_history WHERE chronicle_id = ? ORDER BY id DESC LIMIT ?)`,
      )
      .run(chronicleId, chronicleId, ROLL_HISTORY);
  }

  /** The last rolls of a Chronicle, newest first. */
  recentRolls(chronicleId: number): ShownRoll[] {
    const rows = this.db
      .prepare('SELECT roll FROM roll_history WHERE chronicle_id = ? ORDER BY id DESC LIMIT ?')
      .all(chronicleId, ROLL_HISTORY) as { roll: string }[];
    return rows.map((r) => JSON.parse(r.roll) as ShownRoll);
  }

  lastRoll(chronicleId: number): ShownRoll | undefined {
    const row = this.db
      .prepare('SELECT roll FROM chronicle_rolls WHERE chronicle_id = ?')
      .get(chronicleId) as { roll: string } | undefined;
    return row ? (JSON.parse(row.roll) as ShownRoll) : undefined;
  }
}

/** A short hash of an image for cache-busting URLs: it changes when the image does. */
export function imageTag(image: Buffer): string {
  return createHash('sha256').update(image).digest('base64url').slice(0, 12);
}

/** The image type from its first bytes; the browser's own Content-Type is not trusted. */
export function imageType(data: Buffer): BackgroundType | undefined {
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
  if (
    data.subarray(0, 4).toString('latin1') === 'RIFF' &&
    data.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return undefined;
}
