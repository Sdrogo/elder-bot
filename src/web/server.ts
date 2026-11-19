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
import type { Character, Chronicle } from '../state/campaign.js';
import { SESSION_DAYS, type WebSession } from '../state/sessions.js';
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

/** The static pages live in panel/ at the root of the repository (and of the image). */
export const STATIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'panel');

/** The OBS frame pages are the overlay program's own, served by the bot too. */
export const OVERLAY_DIR = join(STATIC_DIR, '..', 'overlay', 'static');
/** Clan and sect symbols (Paradox IP, not in git): a folder mounted read-only on the VPS. */
export const SYMBOLS_DIR = join(STATIC_DIR, '..', 'symbols');

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
  "form-action 'none'; frame-ancestors 'none'";

/** Open live streams to OBS: in all, and for one view key. */
const MAX_STREAMS = 64;
const MAX_STREAMS_PER_USER = 16;
/** How often a stream checks the database for changes, in ms. */
const STREAM_TICK_MS = 1000;

const STATIC_FILES: Record<string, string> = {
  '/app.js': 'text/javascript; charset=utf-8',
  '/panel.css': 'text/css; charset=utf-8',
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

/** What the panel shows of a character: the saved values plus everything worked out from them. */
export function characterView(c: Character, chronicles: Map<number, Chronicle>, viewerId = '') {
  const v = c.values;
  const chronicle = c.chronicleId !== undefined ? chronicles.get(c.chronicleId) : undefined;
  return {
    id: c.id,
    name: c.name,
    clan: CLAN_NAMES[c.clan],
    clanId: c.clan,
    tier: TIER_NAMES[v.tier],
    tierId: v.tier,
    chronicle: chronicle?.name ?? null,
    owned: c.ownerId === viewerId,
    editable: c.ownerId === viewerId || (!!viewerId && chronicle?.storytellerId === viewerId),
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
  return {
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
      return send(res, 200, body, OVERLAY_FILES[file]!, {
        ...headers,
        'Cache-Control': 'public, max-age=300',
      });
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
      return send(res, 200, body, 'image/png', {
        ...headers,
        'Cache-Control': 'private, max-age=300',
      });
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

  async function page(res: ServerResponse, file: string) {
    send(res, 200, await readFile(join(staticDir, file)), 'text/html; charset=utf-8');
  }

  /** Reads a request body, refusing anything larger than MAX_BODY (undefined). */
  async function readBody(req: IncomingMessage): Promise<string | undefined> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > MAX_BODY) return undefined;
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks).toString('utf8');
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
      const created = campaign.createChronicle({
        guildId: guild.id,
        storytellerId: userId,
        name: chronicleName,
        sect: body.sect,
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
        campaign.updateChronicle(chronicle.id, patch);
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
      return send(res, 200, body, STATIC_FILES[path]!, { 'Cache-Control': 'public, max-age=300' });
    }

    if (method === 'GET' && path === '/') {
      return page(res, session(req) ? 'index.html' : 'login.html');
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
      const view = (c: Character) => characterView(c, chronicles, me.userId);
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
            }
          : null,
        options: {
          clans: CLANS.map((id) => ({ id, name: CLAN_NAMES[id] })),
          tiers: TIERS.map((id) => ({ id, name: TIER_NAMES[id] })),
          sects: SECTS.map((id) => ({ id, name: SECT_NAMES[id] })),
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

    const characterPath = /^\/api\/characters(?:\/(\d{1,12})(\/track)?)?$/.exec(path);
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
    const body = method === 'DELETE' ? {} : parseObject(text);
    if (!body) return json(res, 400, { error: 'invalid body' });
    const { campaign } = store;
    const getChronicle = (id: number) => campaign.getChronicle(id);
    const done = (c: Character) => {
      const chronicles = new Map<number, Chronicle>();
      const ch = c.chronicleId === undefined ? undefined : getChronicle(c.chronicleId);
      if (ch) chronicles.set(ch.id, ch);
      return json(res, 200, { character: characterView(c, chronicles, me.userId) });
    };

    if (chroniclePath) {
      if (method !== 'POST') return json(res, 404, { error: 'not found' });
      return chronicleChange(res, me.userId, body, chroniclePath[1], chroniclePath[2]);
    }

    const [, idText, track] = characterPath!;
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
    if (updated === 'duplicate' || updated === 'limit') return json(res, 409, { error: updated });
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
