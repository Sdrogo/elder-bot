import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLAN_NAMES,
  SECT_NAMES,
  TIER_NAMES,
  healthMax,
  hungerDice,
  vitaeMax,
  willpowerMax,
} from '../game/character.js';
import type { Character, Chronicle } from '../state/campaign.js';
import { SESSION_DAYS, type WebSession } from '../state/sessions.js';
import type { Store } from '../state/store.js';
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
  now?: () => number;
}

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

/** What the panel shows of a character: the saved values plus everything worked out from them. */
export function characterView(c: Character, chronicles: Map<number, Chronicle>) {
  const v = c.values;
  const chronicle = c.chronicleId !== undefined ? chronicles.get(c.chronicleId) : undefined;
  return {
    id: c.id,
    name: c.name,
    clan: CLAN_NAMES[c.clan],
    tier: TIER_NAMES[v.tier],
    chronicle: chronicle?.name ?? null,
    attributes: { stamina: v.stamina, composure: v.composure, resolve: v.resolve },
    health: { current: v.health, max: healthMax(v), baneful: v.baneful },
    vitae: { current: v.vitae, max: vitaeMax(v) },
    hunger: hungerDice(v),
    willpower: { current: v.willpower, max: willpowerMax(v) },
    humanity: { rank: v.humanity, violations: v.violations },
  };
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

  /** Reads and discards a request body, refusing anything larger than MAX_BODY. */
  async function drainBody(req: IncomingMessage): Promise<boolean> {
    let size = 0;
    for await (const chunk of req) {
      size += (chunk as Buffer).length;
      if (size > MAX_BODY) return false;
    }
    return true;
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

    const current = session(req);
    if (!current) return json(res, 401, { error: 'login required' });
    const me = current.session;

    if (method === 'POST' && path === '/logout') {
      if (!(await drainBody(req))) return json(res, 413, { error: 'body too large' });
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
      return json(res, 200, {
        user: { id: me.userId, name: me.name },
        csrf: me.csrf,
        characters: characters.map((c) => characterView(c, chronicles)),
        chronicles: runs.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          sect: SECT_NAMES[c.sect],
          masquerade: c.masquerade,
          live: campaign.liveChronicle(c.guildId, c.storytellerId)?.id === c.id,
          characters: campaign.members(c.id).map((m) => characterView(m, chronicles)),
        })),
      });
    }

    return json(res, 404, { error: 'not found' });
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
