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

export const isLayout = (v: unknown): v is Layout => LAYOUTS.includes(v as Layout);
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
      CREATE TABLE IF NOT EXISTS chronicle_rolls (
        chronicle_id INTEGER PRIMARY KEY REFERENCES chronicles (id) ON DELETE CASCADE,
        roll TEXT NOT NULL, at INTEGER NOT NULL);
    `);
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

  // The Storyteller's scene.

  settings(userId: string): StageSettings {
    const row = this.db
      .prepare(
        `SELECT resolution, layout, roll_box, cam, background_tag FROM stage_settings
         WHERE user_id = ?`,
      )
      .get(userId) as
      | {
          resolution: string;
          layout: string;
          roll_box: number;
          cam: string | null;
          background_tag: string | null;
        }
      | undefined;
    if (!row) return { ...DEFAULTS };
    return {
      resolution: isResolution(row.resolution) ? row.resolution : DEFAULTS.resolution,
      layout: isLayout(row.layout) ? row.layout : DEFAULTS.layout,
      rollBox: row.roll_box === 1,
      ...(row.cam ? { cam: row.cam } : {}),
      ...(row.background_tag ? { background: row.background_tag } : {}),
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
    const tag = createHash('sha256').update(image).digest('base64url').slice(0, 12);
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

  // The last roll of each Chronicle.

  recordRoll(chronicleId: number, roll: Omit<ShownRoll, 'at'>): void {
    const at = this.now();
    this.db
      .prepare(
        `INSERT INTO chronicle_rolls (chronicle_id, roll, at) VALUES (?, ?, ?)
         ON CONFLICT (chronicle_id) DO UPDATE SET roll = excluded.roll, at = excluded.at`,
      )
      .run(chronicleId, JSON.stringify({ ...roll, at }), at);
  }

  lastRoll(chronicleId: number): ShownRoll | undefined {
    const row = this.db
      .prepare('SELECT roll FROM chronicle_rolls WHERE chronicle_id = ?')
      .get(chronicleId) as { roll: string } | undefined;
    return row ? (JSON.parse(row.roll) as ShownRoll) : undefined;
  }
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
