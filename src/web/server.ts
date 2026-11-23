import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLANS,
  CLAN_NAMES,
  LIMITS,
  SECT_NAMES,
  TIERS,
  TIER_NAMES,
  cleanName,
  healthMax,
  slugify,
  hungerDice,
  isClan,
  isSect,
  isTier,
  isTrack,
  type Track,
  newCharacter,
  vitaeMax,
  willpowerMax,
  SECTS,
  type CharacterValues,
  type Clan,
} from '../game/character.js';
import {
  CHRONICLE_TIERS,
  isChronicleTier,
  tierFits,
  type Character,
  type Chronicle,
  type ChronicleTier,
} from '../state/campaign.js';
import { evaluate, trackerValues } from '../game/creation.js';
import { parseDraft } from '../game/draft.js';
import type { Draft } from '../state/drafts.js';
import { SESSION_DAYS, type WebSession } from '../state/sessions.js';
import {
  BACKGROUND_TYPES,
  LAYOUTS,
  MAX_BACKGROUND,
  RESOLUTIONS,
  camLinks,
  imageType,
  isLayout,
  isResolution,
} from '../state/stage.js';
import { MASQUERADE_BOXES, type Store } from '../state/store.js';
import { authorizeUrl, identify, type Fetch, type OAuthApp } from './discord.js';

// The web panel: "Log in with Discord", then each user sees their own characters and Chronicles.
// It listens inside the container only; cloudflared is the one way in from the Internet.

const SESSION_COOKIE = 'elder_session';
const STATE_COOKIE = 'elder_oauth_state';
const STATE_MINUTES = 10;
/** Requests per minute for one address; logins have their own, lower limit. */
const RATE_LIMIT = 120;
const LOGIN_LIMIT = 10;
const MAX_BODY = 4096;
/** A saved draft of a character sheet is bigger than any other change. */
const MAX_DRAFT_BODY = 16_384;

/** The static pages live in panel/ at the root of the repository (and of the image). */
export const STATIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'panel');

/** The OBS frame pages are the overlay program's own, served by the bot too. */
export const OVERLAY_DIR = join(STATIC_DIR, '..', 'overlay', 'static');
/** Clan and sect symbols (Paradox IP, not in git): a folder mounted read-only on the VPS. */
export const SYMBOLS_DIR = join(STATIC_DIR, '..', 'symbols');

/**
 * The character creation engine runs in the browser too, as the same modules the server runs:
 * dist/game in the image. Only these files are served, and only as JavaScript.
 */
export const GAME_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'game');
const GAME_MODULES = new Set([
  'creation',
  'alpha2/background',
  'alpha2/clans',
  'alpha2/core',
  'alpha2/disciplines',
  'alpha2/prereq',
  'alpha2/tiers',
]);

const OVERLAY_FILES: Record<string, string> = {
  'common.js': 'text/javascript; charset=utf-8',
  'frame.js': 'text/javascript; charset=utf-8',
  'overlay.css': 'text/css; charset=utf-8',
};
const SYMBOLS = new Set<string>([...CLANS, ...SECTS.filter((s) => s !== 'none')]);

/** The frames load their fonts from Google Fonts; everything else is the bot's own. */
const OVERLAY_CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; " +
  "font-src https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; base-uri 'none'; " +
  // Each player's webcam comes from VDO.Ninja in a frame of its own.
  'frame-src https://vdo.ninja; ' +
  "form-action 'none'; frame-ancestors 'none'";

/** Open live streams to OBS: in all, and for one view key. */
const MAX_STREAMS = 64;
const MAX_STREAMS_PER_USER = 16;
/** How often a stream checks the database for changes, in ms. */
const STREAM_TICK_MS = 1000;

const STATIC_FILES: Record<string, string> = {
  '/app.js': 'text/javascript; charset=utf-8',
  '/panel.css': 'text/css; charset=utf-8',
  '/wizard.js': 'text/javascript; charset=utf-8',
  '/wizard.css': 'text/css; charset=utf-8',
  '/scheda.js': 'text/javascript; charset=utf-8',
};

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; " +
    "form-action 'self' https://discord.com; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export interface PanelDeps {
  store: Store;
  /** Public address, no trailing slash: https://elder.example.com */
  publicUrl: string;
  clientId: string;
  clientSecret: string;
  fetchFn?: Fetch;
  staticDir?: string;
  overlayDir?: string;
  symbolsDir?: string;
  gameDir?: string;
  now?: () => number;
  /**
   * The Discord servers the bot shares with a user, where they can create characters.
   * Without it, only the servers where they already have a character or a Chronicle count.
   */
  guildsOf?: (userId: string) => Promise<Guild[]>;
}

export interface Guild {
  id: string;
  name: string;
}

/** How long the list of a user's servers is kept before asking Discord again. */
const GUILDS_TTL_MS = 5 * 60_000;

/** A fixed one-minute window per key. Old windows are dropped so the map stays small. */
class RateLimiter {
  private hits = new Map<string, { window: number; count: number }>();
  constructor(private readonly now: () => number) {}

  allow(key: string, limit: number): boolean {
    const window = Math.floor(this.now() / 60_000);
    const entry = this.hits.get(key);
    if (!entry || entry.window !== window) {
      if (this.hits.size > 10_000) this.hits.clear();
      this.hits.set(key, { window, count: 1 });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const name = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (name && !(name in out)) out[name] = value;
  }
  return out;
}

function sameSecret(a: string | undefined, b: string): boolean {
  if (typeof a !== 'string') return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Who may change a character from the panel: its owner or the Storyteller of its Chronicle.
 * Server admins are not known here (the login reads only the user's id), so they use Discord.
 */
export function canEditOnPanel(
  userId: string,
  c: Character,
  getChronicle: (id: number) => Chronicle | undefined,
): boolean {
  if (c.ownerId === userId) return true;
  if (c.chronicleId === undefined) return false;
  return getChronicle(c.chronicleId)?.storytellerId === userId;
}

/** A sheet choice the Storyteller must approve, with their answer. */
interface SheetApproval {
  code: string;
  target?: string;
  status: 'pending' | 'approved' | 'rejected';
}

/** What the panel shows of a character: the saved values plus everything worked out from them. */
export function characterView(
  c: Character,
  chronicles: Map<number, Chronicle>,
  viewerId = '',
  cam?: string,
  pending = 0,
) {
  const v = c.values;
  const chronicle = c.chronicleId !== undefined ? chronicles.get(c.chronicleId) : undefined;
  const editable = c.ownerId === viewerId || (!!viewerId && chronicle?.storytellerId === viewerId);
  return {
    id: c.id,
    name: c.name,
    clan: CLAN_NAMES[c.clan],
    clanId: c.clan,
    tier: TIER_NAMES[v.tier],
    tierId: v.tier,
    chronicle: chronicle?.name ?? null,
    owned: c.ownerId === viewerId,
    editable,
    // Tracker-only characters can get a full sheet from the creation wizard.
    sheet: !!c.hasSheet,
    // Sheet choices still waiting for the Storyteller (Brood Child, a Path).
    pending,
    // The player's VDO.Ninja links, only for those who may change the character.
    cam: cam && editable ? camLinks(cam, c.name) : null,
    attributes: { stamina: v.stamina, composure: v.composure, resolve: v.resolve },
    health: { current: v.health, max: healthMax(v), baneful: v.baneful },
    vitae: { current: v.vitae, max: vitaeMax(v) },
    hunger: hungerDice(v),
    willpower: { current: v.willpower, max: willpowerMax(v) },
    humanity: { rank: v.humanity, violations: v.violations },
    baneful: v.baneful,
  };
}

/**
 * What the OBS overlay gets: the Storyteller's Chronicle on air, with its characters in the
 * overlay's own shape. Character ids are slugs of their names, unique within the Chronicle,
 * because OBS Browser Sources and Stream Deck keys use them (`?pg=lucrezia`).
 */
export function overlayView(store: Store, userId: string) {
  const { campaign } = store;
  const runs = campaign.chroniclesRunBy(userId);
  const isLive = (c: Chronicle) => campaign.liveChronicle(c.guildId, c.storytellerId)?.id === c.id;
  const live = runs.find(isLive);
  const characters = live ? overlayCharacters(campaign.members(live.id)) : [];
  const stage = store.stage.settings(userId);
  const [width, height] = RESOLUTIONS[stage.resolution];
  return {
    // The /scena page: its size, where the frames go, the background and the roll box.
    stage: {
      width,
      height,
      layout: stage.layout,
      rollBox: stage.rollBox,
      background: stage.background ?? null,
      cam: stage.cam ?? null,
    },
    roll: (live && store.stage.lastRoll(live.id)) ?? null,
    chronicle: live
      ? { slug: live.slug, name: live.name, sect: live.sect, masquerade: live.masquerade }
      : null,
    chronicles: runs.map((c) => ({ slug: c.slug, name: c.name, live: isLive(c) })),
    characters: characters.map(({ id, c }) => {
      const v = c.values;
      return {
        id,
        name: c.name,
        clan: c.clan,
        health: { max: healthMax(v), current: v.health, baneful: v.baneful },
        vitae: { max: vitaeMax(v), current: v.vitae },
        willpower: { max: willpowerMax(v), current: v.willpower },
        humanity: { rank: v.humanity, violations: v.violations },
        hunger: hungerDice(v),
        cam: store.stage.camOf(c.id) ?? null,
      };
    }),
  };
}

/** Characters with their overlay ids: the name's slug, with -2, -3 ... when two share it. */
function overlayCharacters(members: Character[]) {
  const used = new Set<string>(['storyteller']);
  return members.map((c) => {
    const base = slugify(c.name) || `pg-${c.id}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return { id, c };
  });
}

/** The overlay's tracker names (track + field) on the bot's trackers. */
function overlayTrack(track: unknown, field: unknown): Track | 'masquerade' | undefined {
  const f = field ?? 'current';
  if (track === 'masquerade' && f === 'current') return 'masquerade';
  if (track === 'health')
    return f === 'current' ? 'health' : f === 'baneful' ? 'baneful' : undefined;
  if (track === 'vitae' || track === 'willpower') return f === 'current' ? track : undefined;
  if (track === 'humanity') {
    return f === 'current' ? 'humanity' : f === 'violations' ? 'violations' : undefined;
  }
  return undefined;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isInt = (v: unknown, lo: number, hi: number): v is number =>
  Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;

/** The fields of a character form that are present and valid; `error` names the first bad one. */
function characterFields(body: Record<string, unknown>) {
  const out: {
    name?: string;
    clan?: Clan;
    values: Partial<CharacterValues>;
    error?: string;
  } = { values: {} };
  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? cleanName(body.name) : undefined;
    if (!name) return { ...out, error: 'name' };
    out.name = name;
  }
  if (body.clan !== undefined) {
    if (!isClan(body.clan)) return { ...out, error: 'clan' };
    out.clan = body.clan;
  }
  if (body.tier !== undefined) {
    if (!isTier(body.tier)) return { ...out, error: 'tier' };
    out.values.tier = body.tier;
  }
  for (const key of ['stamina', 'composure', 'resolve'] as const) {
    if (body[key] === undefined) continue;
    if (!isInt(body[key], 1, LIMITS.attribute)) return { ...out, error: key };
    out.values[key] = body[key];
  }
  return out;
}

export function createPanelHandler(deps: PanelDeps) {
  const now = deps.now ?? Date.now;
  const fetchFn = deps.fetchFn ?? fetch;
  const staticDir = deps.staticDir ?? STATIC_DIR;
  const secure = deps.publicUrl.startsWith('https://');
  const app: OAuthApp = {
    clientId: deps.clientId,
    clientSecret: deps.clientSecret,
    redirectUri: `${deps.publicUrl}/callback`,
  };
  const limiter = new RateLimiter(now);
  const { store } = deps;
  const overlayDir = deps.overlayDir ?? OVERLAY_DIR;
  const symbolsDir = deps.symbolsDir ?? SYMBOLS_DIR;
  const gameDir = deps.gameDir ?? GAME_DIR;
  const gameCache = new Map<string, Buffer>();
  const streams = new Map<ServerResponse, { userId: string; last: string }>();
  let ticker: NodeJS.Timeout | undefined;

  /**
   * Every second, each OBS stream gets the Chronicle on air again if anything changed, from
   * Discord, the panel or the Stream Deck alike: the database is the one source of truth.
   */
  function tick() {
    const views = new Map<string, string>();
    for (const [res, s] of streams) {
      let view = views.get(s.userId);
      if (view === undefined) {
        view = JSON.stringify(overlayView(store, s.userId));
        views.set(s.userId, view);
      }
      if (view !== s.last) {
        s.last = view;
        res.write(`data: ${view}\n\n`);
      }
    }
  }

  /** The overlay pages for OBS: /overlay/scena, /overlay/frame, their files and the stream. */
  async function overlayPage(req: IncomingMessage, res: ServerResponse, url: URL) {
    const headers = { 'Content-Security-Policy': OVERLAY_CSP };
    const userId = store.viewKeys.userOf(url.searchParams.get('v'));
    const name = url.pathname.slice('/overlay/'.length);
    if (name.startsWith('static/')) {
      const file = name.slice('static/'.length);
      if (!Object.hasOwn(OVERLAY_FILES, file)) return json(res, 404, { error: 'not found' });
      const body = await readFile(join(overlayDir, file));
      return sendFile(req, res, body, OVERLAY_FILES[file]!, headers);
    }
    if (!userId) {
      return send(
        res,
        401,
        'Chiave di visione mancante o non valida: copia di nuovo l’indirizzo dal pannello.',
        'text/plain; charset=utf-8',
        headers,
      );
    }
    if (name === 'scena' || name === 'frame') {
      const body = await readFile(join(overlayDir, 'frame.html'));
      return send(res, 200, body, 'text/html; charset=utf-8', headers);
    }
    const symbol = /^symbols\/([a-z0-9-]+)\.png$/.exec(name);
    if (symbol) {
      const key = symbol[1]!;
      if (!SYMBOLS.has(key)) return json(res, 404, { error: 'no symbol' });
      const body = await readFile(join(symbolsDir, `${key}.png`)).catch(() => undefined);
      if (!body) return json(res, 404, { error: 'no symbol' });
      return sendFile(req, res, body, 'image/png', headers);
    }
    if (name === 'background') {
      const found = store.stage.background(userId);
      if (!found) return json(res, 404, { error: 'no background' });
      return sendFile(req, res, found.image, found.type, headers);
    }
    if (name === 'events') {
      const mine = [...streams.values()].filter((s) => s.userId === userId).length;
      if (streams.size >= MAX_STREAMS || mine >= MAX_STREAMS_PER_USER) {
        return json(res, 503, { error: 'too many listeners' });
      }
      res.writeHead(200, {
        ...SECURITY_HEADERS,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
        // Cloudflare must pass each event on at once instead of buffering the response.
        'X-Accel-Buffering': 'no',
        Connection: 'keep-alive',
      });
      const view = JSON.stringify(overlayView(store, userId));
      res.write(`retry: 2000\ndata: ${view}\n\n`);
      streams.set(res, { userId, last: view });
      ticker ??= setInterval(tick, STREAM_TICK_MS);
      const ping = setInterval(() => res.write(': ping\n\n'), 20_000);
      req.on('close', () => {
        clearInterval(ping);
        streams.delete(res);
        if (streams.size === 0) {
          clearInterval(ticker);
          ticker = undefined;
        }
      });
      return;
    }
    return json(res, 404, { error: 'not found' });
  }
  const guildCache = new Map<string, { at: number; guilds: Guild[] }>();

  /** Servers where the user may create a character: shared with the bot, or already used. */
  async function guildsFor(userId: string): Promise<Guild[]> {
    const cached = guildCache.get(userId);
    if (cached && now() - cached.at < GUILDS_TTL_MS) return cached.guilds;
    let guilds: Guild[] = [];
    if (deps.guildsOf) {
      try {
        guilds = await deps.guildsOf(userId);
      } catch (error) {
        console.error('Server Discord non letti:', (error as Error).message);
      }
    }
    const known = new Set(guilds.map((g) => g.id));
    const { campaign } = store;
    for (const c of [...campaign.charactersOwnedBy(userId), ...campaign.chroniclesRunBy(userId)]) {
      if (!known.has(c.guildId)) {
        known.add(c.guildId);
        guilds.push({ id: c.guildId, name: c.guildId });
      }
    }
    if (guildCache.size > 1000) guildCache.clear();
    guildCache.set(userId, { at: now(), guilds });
    return guilds;
  }

  const cookie = (name: string, value: string, maxAgeSeconds: number) =>
    `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`;

  function send(
    res: ServerResponse,
    status: number,
    body: string | Buffer,
    type = 'text/plain; charset=utf-8',
    headers: Record<string, string | string[]> = {},
  ) {
    res.writeHead(status, {
      ...SECURITY_HEADERS,
      'Content-Type': type,
      'Cache-Control': 'no-store',
      ...headers,
    });
    res.end(body);
  }

  const json = (res: ServerResponse, status: number, data: unknown) =>
    send(res, status, JSON.stringify(data), 'application/json; charset=utf-8');

  const redirect = (res: ServerResponse, location: string, cookies: string[] = []) =>
    send(res, 302, '', 'text/plain; charset=utf-8', {
      Location: location,
      ...(cookies.length ? { 'Set-Cookie': cookies } : {}),
    });

  /**
   * Sends a script, stylesheet or image that browsers must check again on every load.
   * Cloudflare stretches a short max-age to hours in the browser, which kept an old
   * panel script running after an update; no-cache with an ETag costs one 304 instead.
   */
  function sendFile(
    req: IncomingMessage,
    res: ServerResponse,
    body: Buffer,
    type: string,
    headers: Record<string, string> = {},
  ) {
    const etag = `"${createHash('sha256').update(body).digest('base64url').slice(0, 22)}"`;
    const cache = { ...headers, ETag: etag, 'Cache-Control': 'no-cache' };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ...SECURITY_HEADERS, ...cache });
      res.end();
      return;
    }
    send(res, 200, body, type, cache);
  }

  /**
   * One engine module as browser JavaScript. The image has the compiled .js files; running from
   * the sources (tsx, tests) there are only .ts files, turned into JavaScript on first request.
   */
  async function gameModule(name: string): Promise<Buffer> {
    const cached = gameCache.get(name);
    if (cached) return cached;
    let body: Buffer;
    try {
      body = await readFile(join(gameDir, `${name}.js`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const source = await readFile(join(gameDir, `${name}.ts`), 'utf8');
      const ts = (await import('typescript')).default;
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
      });
      body = Buffer.from(outputText);
    }
    gameCache.set(name, body);
    return body;
  }

  const draftView = (d: Draft) => ({ id: d.id, updatedAt: d.updatedAt, data: d.data });

  /** Drafts of the creation wizard: list, read, save, delete. Only the owner sees them. */
  async function draftsApi(
    req: IncomingMessage,
    res: ServerResponse,
    me: WebSession,
    method: string,
    idText: string | undefined,
    sub: string | undefined,
  ) {
    const id = idText === undefined ? undefined : Number(idText);
    if (sub === 'create') {
      if (method !== 'POST') return json(res, 404, { error: 'not found' });
      return createFromDraft(req, res, me, id!);
    }
    if (method === 'GET') {
      if (id === undefined) {
        return json(res, 200, { drafts: store.drafts.ownedBy(me.userId).map(draftView) });
      }
      const draft = store.drafts.get(id, me.userId);
      return draft
        ? json(res, 200, { draft: draftView(draft) })
        : json(res, 404, { error: 'not found' });
    }
    if (method !== 'POST' && method !== 'DELETE') return json(res, 404, { error: 'not found' });
    if (method === 'DELETE' && id === undefined) return json(res, 404, { error: 'not found' });
    const bytes = await readBytes(req, MAX_DRAFT_BODY);
    if (bytes === undefined) return json(res, 413, { error: 'body too large' });
    if (!trustedChange(req, me)) return json(res, 403, { error: 'forbidden' });
    if (!limiter.allow(`change:${me.userId}`, RATE_LIMIT)) {
      return json(res, 429, { error: 'too many requests' });
    }
    if (method === 'DELETE') {
      return store.drafts.delete(id!, me.userId)
        ? send(res, 204, '')
        : json(res, 404, { error: 'not found' });
    }
    const body = parseObject(bytes.toString('utf8'));
    const data = body ? parseDraft(body.data) : undefined;
    if (!data) return json(res, 400, { error: 'invalid body' });
    if (id === undefined) {
      const created = store.drafts.create(me.userId, data);
      if (created === 'limit') return json(res, 409, { error: 'limit' });
      return json(res, 200, { draft: draftView(created) });
    }
    const updated = store.drafts.update(id, me.userId, data);
    return updated
      ? json(res, 200, { draft: draftView(updated) })
      : json(res, 404, { error: 'not found' });
  }

  /**
   * POST /api/drafts/:id/create {guild}: a complete draft becomes a character with its full
   * sheet, or completes the tracker-only character it was opened from. The server runs the
   * rules again: what the browser says is never trusted.
   */
  async function createFromDraft(
    req: IncomingMessage,
    res: ServerResponse,
    me: WebSession,
    id: number,
  ) {
    const text = await readBody(req);
    if (text === undefined) return json(res, 413, { error: 'body too large' });
    if (!trustedChange(req, me)) return json(res, 403, { error: 'forbidden' });
    if (!limiter.allow(`change:${me.userId}`, RATE_LIMIT)) {
      return json(res, 429, { error: 'too many requests' });
    }
    const body = text.trim() ? parseObject(text) : {};
    if (!body) return json(res, 400, { error: 'invalid body' });
    const draft = store.drafts.get(id, me.userId);
    if (!draft) return json(res, 404, { error: 'not found' });
    const d = draft.data;
    const result = evaluate(d);
    if (!result.complete || !d.clan) return json(res, 400, { error: 'incomplete' });
    const name = cleanName(d.name ?? '');
    if (!name) return json(res, 400, { error: 'invalid', field: 'name' });
    // The bot still calls the Giovanni line by its V5 name.
    const clan: Clan = d.clan === 'giovanni' ? 'hecata' : d.clan;
    const sheet = {
      data: d,
      approvals: result.approvals.map((a) => ({ ...a, status: 'pending' as const })),
    };
    const { campaign } = store;
    let character: Character | undefined;
    if (d.characterId !== undefined) {
      const old = campaign.getCharacter(d.characterId);
      if (!old || old.ownerId !== me.userId) return json(res, 404, { error: 'not found' });
      if (old.hasSheet) return json(res, 409, { error: 'has sheet' });
      const { tier, stamina, composure, resolve } = trackerValues(d);
      const updated = campaign.updateCharacter(
        old.id,
        { name, clan, values: { tier, stamina, composure, resolve } },
        me.userId,
      );
      if (updated === 'duplicate' || updated === 'limit' || updated === 'tier') {
        return json(res, 409, { error: updated });
      }
      if (!updated) return json(res, 404, { error: 'not found' });
      campaign.attachSheet(old.id, sheet);
      character = campaign.getCharacter(old.id);
    } else {
      const guild = (await guildsFor(me.userId)).find((g) => g.id === body.guild);
      if (!guild) return json(res, 400, { error: 'invalid', field: 'guild' });
      const created = campaign.createCharacter({
        guildId: guild.id,
        ownerId: me.userId,
        name,
        clan,
        values: newCharacter(trackerValues(d)),
        sheet,
      });
      if (created === 'duplicate' || created === 'limit') return json(res, 409, { error: created });
      character = created;
    }
    store.drafts.delete(id, me.userId);
    const chronicles = new Map<number, Chronicle>();
    const ch =
      character?.chronicleId === undefined
        ? undefined
        : campaign.getChronicle(character.chronicleId);
    if (ch) chronicles.set(ch.id, ch);
    return json(res, 200, {
      character: character && characterView(character, chronicles, me.userId),
      approvals: result.approvals,
    });
  }

  /** How many of a character's sheet choices still wait for the Storyteller. */
  function pendingOf(c: Character): number {
    if (!c.hasSheet) return 0;
    const approvals = store.campaign.getSheet(c.id)?.approvals ?? [];
    return approvals.filter((a) => (a as SheetApproval).status === 'pending').length;
  }

  /**
   * GET /api/characters/:id/sheet: the full sheet, for the owner and the Storyteller of its
   * Chronicle. POST …/approval {index, approved}: the Storyteller's answer to one choice.
   */
  async function sheetApi(
    req: IncomingMessage,
    res: ServerResponse,
    me: WebSession,
    method: string,
    id: number,
    sub: string,
  ) {
    const { campaign } = store;
    const c = campaign.getCharacter(id);
    const getChronicle = (n: number) => campaign.getChronicle(n);
    if (!c || !canEditOnPanel(me.userId, c, getChronicle)) {
      return json(res, 404, { error: 'not found' });
    }
    const sheet = campaign.getSheet(c.id);
    if (!sheet) return json(res, 404, { error: 'not found' });
    const chronicle = c.chronicleId === undefined ? undefined : getChronicle(c.chronicleId);
    const canApprove = chronicle?.storytellerId === me.userId;
    const chronicles = new Map<number, Chronicle>(chronicle ? [[chronicle.id, chronicle]] : []);
    if (sub === 'sheet' && method === 'GET') {
      return json(res, 200, {
        character: characterView(c, chronicles, me.userId, undefined, pendingOf(c)),
        sheet,
        canApprove,
      });
    }
    if (sub !== 'approval' || method !== 'POST') return json(res, 404, { error: 'not found' });
    const text = await readBody(req);
    if (text === undefined) return json(res, 413, { error: 'body too large' });
    if (!trustedChange(req, me)) return json(res, 403, { error: 'forbidden' });
    if (!canApprove) return json(res, 403, { error: 'storyteller only' });
    const body = parseObject(text);
    const approvals = sheet.approvals as SheetApproval[];
    if (
      !body ||
      !isInt(body.index, 0, approvals.length - 1) ||
      typeof body.approved !== 'boolean'
    ) {
      return json(res, 400, { error: 'invalid body' });
    }
    approvals[body.index] = {
      ...approvals[body.index]!,
      status: body.approved ? 'approved' : 'rejected',
    };
    campaign.setApprovals(c.id, approvals);
    return json(res, 200, { approvals });
  }

  async function page(res: ServerResponse, file: string) {
    send(res, 200, await readFile(join(staticDir, file)), 'text/html; charset=utf-8');
  }

  /** Reads a request body, refusing anything larger than MAX_BODY (undefined). */
  async function readBody(req: IncomingMessage): Promise<string | undefined> {
    return (await readBytes(req, MAX_BODY))?.toString('utf8');
  }

  /** A request body as bytes, undefined when it is larger than `max`. */
  async function readBytes(req: IncomingMessage, max: number): Promise<Buffer | undefined> {
    const declared = Number(req.headers['content-length']);
    if (declared > max) return undefined;
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > max) return undefined;
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }

  /** The Storyteller's scene: size, layout, roll box, their webcam and the background. */
  async function stageChange(
    req: IncomingMessage,
    res: ServerResponse,
    me: WebSession,
    action: string | undefined,
  ) {
    const method = req.method ?? 'GET';
    const isBackground = action === 'background';
    const data = await readBytes(req, isBackground ? MAX_BACKGROUND : MAX_BODY);
    if (data === undefined) return json(res, 413, { error: 'body too large' });
    if (!trustedChange(req, me)) return json(res, 403, { error: 'forbidden' });
    if (!limiter.allow(`change:${me.userId}`, RATE_LIMIT)) {
      return json(res, 429, { error: 'too many requests' });
    }
    // Only Storytellers have a scene.
    if (!store.campaign.chroniclesRunBy(me.userId).length) {
      return json(res, 403, { error: 'storytellers only' });
    }
    const { stage } = store;
    const ok = () => json(res, 200, { ok: true });

    if (isBackground) {
      if (method === 'DELETE') {
        stage.removeBackground(me.userId);
        return ok();
      }
      if (method !== 'PUT') return json(res, 404, { error: 'not found' });
      const type = imageType(data);
      if (!type) return json(res, 415, { error: 'PNG, JPEG or WebP only' });
      stage.setBackground(me.userId, data, type);
      return ok();
    }
    if (action === 'cam') {
      if (method === 'DELETE') stage.removeStorytellerCam(me.userId);
      else if (method === 'POST') stage.renewStorytellerCam(me.userId);
      else return json(res, 404, { error: 'not found' });
      return ok();
    }
    if (method !== 'POST' || action !== undefined) return json(res, 404, { error: 'not found' });
    const body = parseObject(data.toString('utf8'));
    if (!body) return json(res, 400, { error: 'invalid body' });
    const patch: Parameters<typeof stage.update>[1] = {};
    if (body.resolution !== undefined) {
      if (!isResolution(body.resolution))
        return json(res, 400, { error: 'invalid', field: 'resolution' });
      patch.resolution = body.resolution;
    }
    if (body.layout !== undefined) {
      if (!isLayout(body.layout)) return json(res, 400, { error: 'invalid', field: 'layout' });
      patch.layout = body.layout;
    }
    if (body.rollBox !== undefined) {
      if (typeof body.rollBox !== 'boolean')
        return json(res, 400, { error: 'invalid', field: 'rollBox' });
      patch.rollBox = body.rollBox;
    }
    stage.update(me.userId, patch);
    return ok();
  }

  /** A JSON object body; null when it is missing, malformed or not an object. */
  function parseObject(text: string): Record<string, unknown> | null {
    try {
      const value: unknown = JSON.parse(text);
      return isRecord(value) ? value : null;
    } catch {
      return null;
    }
  }

  function session(req: IncomingMessage): { token: string; session: WebSession } | undefined {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const found = store.sessions.get(token);
    return found && token ? { token, session: found } : undefined;
  }

  /** A change must come from the panel itself: same origin and the session's CSRF token. */
  function trustedChange(req: IncomingMessage, s: WebSession): boolean {
    const origin = req.headers.origin;
    if (origin !== undefined && origin !== deps.publicUrl) return false;
    const token = req.headers['x-csrf-token'];
    return sameSecret(Array.isArray(token) ? token[0] : token, s.csrf);
  }

  /** The Storyteller's changes to their own Chronicles. */
  async function chronicleChange(
    res: ServerResponse,
    userId: string,
    body: Record<string, unknown>,
    idText: string | undefined,
    action: string | undefined,
  ) {
    const { campaign } = store;
    const ok = () => json(res, 200, { ok: true });
    const name = (v: unknown) => (typeof v === 'string' ? cleanName(v) : undefined);

    if (idText === undefined) {
      // POST /api/chronicles {guild, name, sect}: a new Chronicle, on air if none is.
      const guild = (await guildsFor(userId)).find((g) => g.id === body.guild);
      if (!guild) return json(res, 400, { error: 'invalid', field: 'guild' });
      const chronicleName = name(body.name);
      if (!chronicleName) return json(res, 400, { error: 'invalid', field: 'name' });
      if (!isSect(body.sect)) return json(res, 400, { error: 'invalid', field: 'sect' });
      // The tier of play: '' or none takes any character.
      const tier = body.tier === undefined || body.tier === '' ? undefined : body.tier;
      if (tier !== undefined && !isChronicleTier(tier)) {
        return json(res, 400, { error: 'invalid', field: 'tier' });
      }
      const created = campaign.createChronicle({
        guildId: guild.id,
        storytellerId: userId,
        name: chronicleName,
        sect: body.sect,
        tier,
      });
      if (created === 'duplicate' || created === 'limit') return json(res, 409, { error: created });
      if (!campaign.liveChronicle(guild.id, userId)) campaign.setLive(created.id);
      return ok();
    }

    const chronicle = campaign.getChronicle(Number(idText));
    if (!chronicle || chronicle.archived || chronicle.storytellerId !== userId) {
      return json(res, 404, { error: 'not found' });
    }
    const member = () => {
      const id = body.character;
      return typeof id === 'number' && campaign.members(chronicle.id).some((m) => m.id === id)
        ? id
        : undefined;
    };

    switch (action) {
      case 'live':
        campaign.setLive(chronicle.id);
        return ok();
      case 'masquerade': {
        if (!isInt(body.delta, -MASQUERADE_BOXES, MASQUERADE_BOXES)) {
          return json(res, 400, { error: 'invalid body' });
        }
        const value = Math.min(MASQUERADE_BOXES, Math.max(0, chronicle.masquerade + body.delta));
        campaign.setMasquerade(chronicle.id, value);
        return ok();
      }
      case 'move': {
        const id = member();
        if (id === undefined || (body.delta !== -1 && body.delta !== 1)) {
          return json(res, 400, { error: 'invalid body' });
        }
        campaign.moveMember(chronicle.id, id, body.delta);
        return ok();
      }
      case 'remove': {
        const id = member();
        if (id === undefined) return json(res, 400, { error: 'invalid body' });
        campaign.leave(id);
        return ok();
      }
      default: {
        // POST /api/chronicles/:id {name?, sect?}
        const patch: { name?: string; sect?: (typeof SECTS)[number] } = {};
        if (body.name !== undefined) {
          const n = name(body.name);
          if (!n) return json(res, 400, { error: 'invalid', field: 'name' });
          patch.name = n;
        }
        if (body.sect !== undefined) {
          if (!isSect(body.sect)) return json(res, 400, { error: 'invalid', field: 'sect' });
          patch.sect = body.sect;
        }
        let tier: ChronicleTier | undefined | null = null;
        if (body.tier !== undefined) {
          if (body.tier !== '' && !isChronicleTier(body.tier)) {
            return json(res, 400, { error: 'invalid', field: 'tier' });
          }
          tier = body.tier === '' ? undefined : body.tier;
        }
        // Checked before anything changes: a refused tier leaves the Chronicle as it was.
        if (
          tier !== null &&
          campaign.members(chronicle.id).some((c) => !tierFits(c.values.tier, tier))
        ) {
          return json(res, 409, { error: 'tier' });
        }
        campaign.updateChronicle(chronicle.id, patch);
        if (tier !== null) campaign.setChronicleTier(chronicle.id, tier);
        return ok();
      }
    }
  }

  /**
   * The OBS overlay's API. It authenticates with an overlay key (Authorization: Bearer), not
   * with the session cookie, and is meant for the overlay program, never for a browser page:
   * a request with an Origin header is refused, so no web page can use a key it doesn't hold.
   */
  async function overlayApi(req: IncomingMessage, res: ServerResponse, url: URL) {
    const path = url.pathname;
    if (req.headers.origin !== undefined) return json(res, 403, { error: 'forbidden' });
    // Stream Deck plugins: Authorization: Bearer, or the X-Elder-Token header of the overlay.
    const auth = req.headers.authorization;
    const header = req.headers['x-elder-token'];
    const userId = store.overlayKeys.userOf(
      auth?.startsWith('Bearer ')
        ? auth.slice(7).trim()
        : Array.isArray(header)
          ? header[0]
          : header,
    );
    if (!userId) return json(res, 401, { error: 'invalid overlay key' });
    const { campaign } = store;
    const method = req.method ?? 'GET';

    if (method === 'GET' && path === '/api/overlay') {
      const body = JSON.stringify(overlayView(store, userId));
      // The overlay asks every few seconds: answer 304 when nothing changed.
      const etag = `"${createHash('sha256').update(body).digest('base64url').slice(0, 22)}"`;
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, { ...SECURITY_HEADERS, ETag: etag, 'Cache-Control': 'no-cache' });
        res.end();
        return;
      }
      return send(res, 200, body, 'application/json; charset=utf-8', {
        ETag: etag,
        'Cache-Control': 'no-cache',
      });
    }

    if (method !== 'POST' || !['/api/overlay/adjust', '/api/overlay/live'].includes(path)) {
      return json(res, 404, { error: 'not found' });
    }
    if (!limiter.allow(`change:${userId}`, RATE_LIMIT)) {
      return json(res, 429, { error: 'too many requests' });
    }
    const text = await readBody(req);
    if (text === undefined) return json(res, 413, { error: 'body too large' });
    const parsed = text.trim() ? parseObject(text) : {};
    if (!parsed) return json(res, 400, { error: 'invalid body' });
    // Stream Deck keys often put everything in the address: ?pg=lucrezia&track=vitae&delta=-1
    const body: Record<string, unknown> = { ...Object.fromEntries(url.searchParams), ...parsed };
    body.chronicle ??= body.cronaca;
    body.delta = body.delta === undefined ? 1 : Number(body.delta);
    const runs = campaign.chroniclesRunBy(userId);

    if (path === '/api/overlay/live') {
      // Stream Deck: one key per Chronicle puts it on air.
      const target = runs.find((c) => c.slug === body.chronicle);
      if (!target) return json(res, 404, { error: 'no Chronicle with that id' });
      campaign.setLive(target.id);
      return json(res, 200, { ok: true });
    }

    // POST /api/overlay/adjust {pg, track, field?, delta}: the overlay's Stream Deck keys.
    const live = runs.find((c) => campaign.liveChronicle(c.guildId, userId)?.id === c.id);
    if (!live) return json(res, 409, { error: 'no Chronicle on air' });
    const track = overlayTrack(body.track, body.field);
    if (!track || !isInt(body.delta, -30, 30)) {
      return json(res, 400, { error: 'unknown track or field, or bad delta' });
    }
    if (track === 'masquerade') {
      const value = Math.min(MASQUERADE_BOXES, Math.max(0, live.masquerade + body.delta));
      campaign.setMasquerade(live.id, value);
      return json(res, 200, { ok: true, value });
    }
    const found = overlayCharacters(campaign.members(live.id)).find((m) => m.id === body.pg);
    if (!found) return json(res, 404, { error: 'no character with that id on air' });
    const updated = campaign.setTrack(
      found.c.id,
      track,
      found.c.values[track] + body.delta,
      userId,
    );
    return json(res, 200, { ok: true, value: updated?.values[track] });
  }

  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Only cloudflared reaches this port, and it passes on the visitor's address.
    const forwarded = req.headers['cf-connecting-ip'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) ?? req.socket.remoteAddress;
    if (!limiter.allow(`ip:${ip}`, RATE_LIMIT)) return send(res, 429, 'Too many requests');

    const url = new URL(req.url ?? '/', 'http://panel.invalid');
    const path = url.pathname;
    const method = req.method ?? 'GET';

    if (method === 'GET' && path === '/healthz') return send(res, 200, 'ok');

    if (method === 'GET' && Object.hasOwn(STATIC_FILES, path)) {
      const body = await readFile(join(staticDir, path.slice(1)));
      return sendFile(req, res, body, STATIC_FILES[path]!);
    }

    const gamePath = /^\/game\/([a-z0-9/]+)\.js$/.exec(path);
    if (method === 'GET' && gamePath && GAME_MODULES.has(gamePath[1]!)) {
      return sendFile(req, res, await gameModule(gamePath[1]!), 'text/javascript; charset=utf-8');
    }

    if (method === 'GET' && path === '/') {
      return page(res, session(req) ? 'index.html' : 'login.html');
    }

    // The guided character creation: its own page, same login.
    if (method === 'GET' && path === '/crea') {
      return session(req) ? page(res, 'crea.html') : redirect(res, '/', []);
    }
    if (method === 'GET' && path === '/scheda') {
      return session(req) ? page(res, 'scheda.html') : redirect(res, '/', []);
    }

    if (method === 'GET' && path === '/login') {
      if (!limiter.allow(`login:${ip}`, LOGIN_LIMIT)) return send(res, 429, 'Too many requests');
      const state = randomBytes(24).toString('base64url');
      return redirect(res, authorizeUrl(app, state), [
        cookie(STATE_COOKIE, state, STATE_MINUTES * 60),
      ]);
    }

    if (method === 'GET' && path === '/callback') {
      if (!limiter.allow(`login:${ip}`, LOGIN_LIMIT)) return send(res, 429, 'Too many requests');
      const expected = parseCookies(req.headers.cookie)[STATE_COOKIE];
      const state = url.searchParams.get('state') ?? undefined;
      const code = url.searchParams.get('code');
      const clearState = cookie(STATE_COOKIE, '', 0);
      // A user who cancels on Discord comes back with ?error=access_denied.
      if (!code || !expected || !sameSecret(state, expected)) {
        return redirect(res, '/?login=failed', [clearState]);
      }
      let user;
      try {
        user = await identify(app, code, fetchFn);
      } catch (error) {
        console.error('Login Discord non riuscito:', (error as Error).message);
        return redirect(res, '/?login=failed', [clearState]);
      }
      const { token } = store.sessions.create(user.id, user.name);
      return redirect(res, '/', [clearState, cookie(SESSION_COOKIE, token, SESSION_DAYS * 86400)]);
    }

    if (method === 'GET' && path.startsWith('/overlay/')) return overlayPage(req, res, url);

    if (path === '/api/overlay' || path.startsWith('/api/overlay/')) {
      return overlayApi(req, res, url);
    }

    const current = session(req);
    if (!current) return json(res, 401, { error: 'login required' });
    const me = current.session;

    if (method === 'POST' && path === '/logout') {
      if ((await readBody(req)) === undefined) return json(res, 413, { error: 'body too large' });
      if (!trustedChange(req, me)) return json(res, 403, { error: 'forbidden' });
      store.sessions.delete(current.token);
      return send(res, 204, '', 'text/plain; charset=utf-8', {
        'Set-Cookie': cookie(SESSION_COOKIE, '', 0),
      });
    }

    if (method === 'GET' && path === '/api/me') {
      const { campaign } = store;
      const characters = campaign.charactersOwnedBy(me.userId);
      const runs = campaign.chroniclesRunBy(me.userId);
      const chronicleIds = new Set([
        ...runs.map((c) => c.id),
        ...characters.flatMap((c) => (c.chronicleId === undefined ? [] : [c.chronicleId])),
      ]);
      const chronicles = new Map<number, Chronicle>();
      for (const id of chronicleIds) {
        const c = campaign.getChronicle(id);
        if (c) chronicles.set(id, c);
      }
      const view = (c: Character) =>
        characterView(c, chronicles, me.userId, store.stage.camOf(c.id), pendingOf(c));
      const stage = store.stage.settings(me.userId);
      return json(res, 200, {
        user: { id: me.userId, name: me.name },
        csrf: me.csrf,
        characters: characters.map(view),
        chronicles: runs.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          sect: SECT_NAMES[c.sect],
          sectId: c.sect,
          tier: c.tier ? TIER_NAMES[c.tier] : null,
          tierId: c.tier ?? '',
          guild: c.guildId,
          masquerade: c.masquerade,
          live: campaign.liveChronicle(c.guildId, c.storytellerId)?.id === c.id,
          characters: campaign.members(c.id).map(view),
        })),
        guilds: await guildsFor(me.userId),
        overlayKey: store.overlayKeys.createdAt(me.userId) ?? null,
        // The OBS addresses, for Storytellers: the view key and the ids of the frames on air.
        overlay: runs.length
          ? {
              viewKey: store.viewKeys.get(me.userId),
              characters: overlayView(store, me.userId).characters.map((c) => ({
                id: c.id,
                name: c.name,
              })),
              stage: {
                resolution: stage.resolution,
                layout: stage.layout,
                rollBox: stage.rollBox,
                background: stage.background ?? null,
                cam: stage.cam ? camLinks(stage.cam, 'Storyteller') : null,
              },
              layouts: LAYOUTS,
              resolutions: Object.keys(RESOLUTIONS),
              backgroundTypes: BACKGROUND_TYPES,
            }
          : null,
        options: {
          clans: CLANS.map((id) => ({ id, name: CLAN_NAMES[id] })),
          tiers: TIERS.map((id) => ({ id, name: TIER_NAMES[id] })),
          sects: SECTS.map((id) => ({ id, name: SECT_NAMES[id] })),
          chronicleTiers: CHRONICLE_TIERS.map((id) => ({ id, name: TIER_NAMES[id] })),
          maxAttribute: LIMITS.attribute,
          maxName: LIMITS.nameLength,
        },
      });
    }

    // Every change below: a JSON body, the CSRF token and the panel's own origin.
    if (path === '/api/overlay-view-key' && method === 'POST') {
      if ((await readBody(req)) === undefined) return json(res, 413, { error: 'body too large' });
      if (!trustedChange(req, me)) return json(res, 403, { error: 'forbidden' });
      store.viewKeys.renew(me.userId);
      return json(res, 200, { ok: true });
    }

    if (path === '/api/overlay-key' && (method === 'POST' || method === 'DELETE')) {
      if ((await readBody(req)) === undefined) return json(res, 413, { error: 'body too large' });
      if (!trustedChange(req, me)) return json(res, 403, { error: 'forbidden' });
      if (method === 'DELETE') {
        store.overlayKeys.revoke(me.userId);
        return send(res, 204, '');
      }
      // Shown once: the database keeps only its hash.
      return json(res, 200, { key: store.overlayKeys.create(me.userId) });
    }

    const draftPath = /^\/api\/drafts(?:\/(\d{1,12})(?:\/(create))?)?$/.exec(path);
    if (draftPath) return draftsApi(req, res, me, method, draftPath[1], draftPath[2]);

    const stagePath = /^\/api\/stage(?:\/(cam|background))?$/.exec(path);
    if (stagePath) return stageChange(req, res, me, stagePath[1]);

    const sheetPath = /^\/api\/characters\/(\d{1,12})\/(sheet|approval)$/.exec(path);
    if (sheetPath) return sheetApi(req, res, me, method, Number(sheetPath[1]), sheetPath[2]!);

    const characterPath = /^\/api\/characters(?:\/(\d{1,12})(?:\/(track|cam))?)?$/.exec(path);
    const chroniclePath =
      /^\/api\/chronicles(?:\/(\d{1,12})(?:\/(live|masquerade|move|remove))?)?$/.exec(path);
    if (!(characterPath || chroniclePath) || !['POST', 'DELETE'].includes(method)) {
      return json(res, 404, { error: 'not found' });
    }
    const text = await readBody(req);
    if (text === undefined) return json(res, 413, { error: 'body too large' });
    if (!trustedChange(req, me)) return json(res, 403, { error: 'forbidden' });
    if (!limiter.allow(`change:${me.userId}`, RATE_LIMIT)) {
      return json(res, 429, { error: 'too many requests' });
    }
    // A new webcam link needs no body.
    const noBody = method === 'DELETE' || (characterPath?.[2] === 'cam' && !text.trim());
    const body = noBody ? {} : parseObject(text);
    if (!body) return json(res, 400, { error: 'invalid body' });
    const { campaign } = store;
    const getChronicle = (id: number) => campaign.getChronicle(id);
    const done = (c: Character) => {
      const chronicles = new Map<number, Chronicle>();
      const ch = c.chronicleId === undefined ? undefined : getChronicle(c.chronicleId);
      if (ch) chronicles.set(ch.id, ch);
      return json(res, 200, {
        character: characterView(c, chronicles, me.userId, store.stage.camOf(c.id)),
      });
    };

    if (chroniclePath) {
      if (method !== 'POST') return json(res, 404, { error: 'not found' });
      return chronicleChange(res, me.userId, body, chroniclePath[1], chroniclePath[2]);
    }

    const [, idText, sub] = characterPath!;
    const track = sub === 'track';
    if (idText === undefined) {
      // POST /api/characters: a new character, on a server the user shares with the bot.
      if (method !== 'POST') return json(res, 404, { error: 'not found' });
      const fields = characterFields(body);
      if (fields.error) return json(res, 400, { error: 'invalid', field: fields.error });
      const guilds = await guildsFor(me.userId);
      const guild = guilds.find((g) => g.id === body.guild);
      if (!guild) return json(res, 400, { error: 'invalid', field: 'guild' });
      const { name, clan } = fields;
      const { tier, stamina, composure, resolve } = fields.values;
      if (!name || !clan || !tier || !stamina || !composure || !resolve) {
        return json(res, 400, { error: 'missing fields' });
      }
      const created = campaign.createCharacter({
        guildId: guild.id,
        ownerId: me.userId,
        name,
        clan,
        values: newCharacter({ tier, stamina, composure, resolve }),
      });
      if (created === 'duplicate' || created === 'limit') return json(res, 409, { error: created });
      return done(created);
    }

    const character = campaign.getCharacter(Number(idText));
    if (!character || !canEditOnPanel(me.userId, character, getChronicle)) {
      // The same answer for "not there" and "not yours": ids can't be probed.
      return json(res, 404, { error: 'not found' });
    }

    if (sub === 'cam') {
      // POST /api/characters/:id/cam: a new VDO.Ninja link, the old one stops working.
      if (method === 'POST') store.stage.renewCam(character.id);
      else store.stage.removeCam(character.id);
      return done(character);
    }

    if (method === 'DELETE') {
      if (track || character.ownerId !== me.userId) return json(res, 403, { error: 'owner only' });
      campaign.deleteCharacter(character.id);
      return send(res, 204, '');
    }

    if (track) {
      // POST /api/characters/:id/track {track, delta}: one step of a tracker, clamped to the rules.
      if (!isTrack(body.track) || !isInt(body.delta, -10, 10)) {
        return json(res, 400, { error: 'invalid body' });
      }
      const value = character.values[body.track] + body.delta;
      const updated = campaign.setTrack(character.id, body.track, value, me.userId);
      return updated ? done(updated) : json(res, 404, { error: 'not found' });
    }

    // POST /api/characters/:id: name, clan, tier or Attributes.
    const fields = characterFields(body);
    if (fields.error) return json(res, 400, { error: 'invalid', field: fields.error });
    const updated = campaign.updateCharacter(
      character.id,
      {
        ...(fields.name ? { name: fields.name } : {}),
        ...(fields.clan ? { clan: fields.clan } : {}),
        values: fields.values,
      },
      me.userId,
    );
    if (updated === 'duplicate' || updated === 'limit' || updated === 'tier') {
      return json(res, 409, { error: updated });
    }
    return updated ? done(updated) : json(res, 404, { error: 'not found' });
  };
}
/** Starts the panel on its internal port. Errors are logged and answered with a 500. */
export function startPanel(deps: PanelDeps, port: number): Server {
  const handle = createPanelHandler(deps);
  const server = createServer((req, res) => {
    handle(req, res).catch((error) => {
      console.error('Errore del pannello:', error);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal error');
    });
  });
  // Slow clients can't hold connections open for long.
  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;
  server.listen(port, () => console.log(`Pannello in ascolto sulla porta ${port}`));
  return server;
}
