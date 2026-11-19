import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newCharacter } from '../src/game/character.js';
import { Store } from '../src/state/store.js';
import { createPanelHandler } from '../src/web/server.js';

const PUBLIC = 'https://elder.example.com';

let store: Store;
let server: Server;
let base: string;
let discordCalls: string[];

/** A fake Discord: any code is good unless it is "bad". */
const fakeDiscord: typeof fetch = async (input, init) => {
  const url = String(input);
  discordCalls.push(url);
  if (url.endsWith('/oauth2/token')) {
    const body = new URLSearchParams(String(init?.body));
    if (body.get('code') === 'bad') return new Response('{}', { status: 400 });
    expect(body.get('client_secret')).toBe('shh');
    expect(body.get('redirect_uri')).toBe(`${PUBLIC}/callback`);
    return Response.json({ access_token: 'at', token_type: 'Bearer' });
  }
  if (url.endsWith('/users/@me')) {
    return Response.json({ id: '111', username: 'andrea', global_name: 'Andrea' });
  }
  return new Response('', { status: 404 });
};

beforeEach(async () => {
  discordCalls = [];
  store = new Store(':memory:');
  const handle = createPanelHandler({
    store,
    publicUrl: PUBLIC,
    clientId: '42',
    clientSecret: 'shh',
    fetchFn: fakeDiscord,
  });
  server = createServer((req, res) => void handle(req, res));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  store.close();
});

const get = (path: string, cookie = '') =>
  fetch(base + path, { redirect: 'manual', headers: cookie ? { cookie } : {} });

/** Runs the whole login and returns the session cookie. */
async function login(): Promise<string> {
  const start = await get('/login');
  const stateCookie = start.headers.get('set-cookie')!.split(';')[0]!;
  const state = new URL(start.headers.get('location')!).searchParams.get('state')!;
  const back = await get(`/callback?code=good&state=${state}`, stateCookie);
  const cookies = back.headers.getSetCookie();
  const session = cookies.find((c) => c.startsWith('elder_session='))!;
  return session.split(';')[0]!;
}

describe('web panel', () => {
  it('shows the login page with security headers to strangers', async () => {
    const res = await get('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('/login');
    expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect((await get('/api/me')).status).toBe(401);
  });

  it('sends the user to Discord asking only for identify', async () => {
    const res = await get('/login');
    expect(res.status).toBe(302);
    const to = new URL(res.headers.get('location')!);
    expect(to.origin).toBe('https://discord.com');
    expect(to.searchParams.get('scope')).toBe('identify');
    expect(to.searchParams.get('redirect_uri')).toBe(`${PUBLIC}/callback`);
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain(`elder_oauth_state=${to.searchParams.get('state')}`);
  });

  it('refuses a callback whose state does not match', async () => {
    const res = await get('/callback?code=good&state=forged', 'elder_oauth_state=real');
    expect(res.headers.get('location')).toBe('/?login=failed');
    expect(discordCalls).toEqual([]);
  });

  it('refuses a code Discord rejects', async () => {
    const start = await get('/login');
    const stateCookie = start.headers.get('set-cookie')!.split(';')[0]!;
    const state = new URL(start.headers.get('location')!).searchParams.get('state')!;
    const res = await get(`/callback?code=bad&state=${state}`, stateCookie);
    expect(res.headers.get('location')).toBe('/?login=failed');
    expect(res.headers.getSetCookie().some((c) => c.startsWith('elder_session=x'))).toBe(false);
  });

  it('logs in and shows only the user own characters and Chronicles', async () => {
    const values = newCharacter({ tier: 'neonate', stamina: 3, composure: 4, resolve: 2 });
    const mine = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '111',
      name: 'Test',
      clan: 'malkavian',
      values: { ...values, vitae: 5 },
    });
    store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '222',
      name: 'Altro',
      clan: 'brujah',
      values,
    });
    const chronicle = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '111',
      name: 'Testament',
      sect: 'camarilla',
    });
    if (typeof mine !== 'object' || typeof chronicle !== 'object') throw new Error('setup');
    store.campaign.join(chronicle.id, mine.id);

    const cookie = await login();
    const page = await get('/', cookie);
    expect(await page.text()).toContain('id="characters"');

    const me = (await (await get('/api/me', cookie)).json()) as {
      user: { id: string; name: string };
      csrf: string;
      characters: { name: string; hunger: number; chronicle: string }[];
      chronicles: { name: string; characters: unknown[] }[];
    };
    expect(me.user).toEqual({ id: '111', name: 'Andrea' });
    expect(me.characters).toHaveLength(1);
    expect(me.characters[0]).toMatchObject({ name: 'Test', hunger: 3, chronicle: 'Testament' });
    expect(me.chronicles[0]).toMatchObject({ name: 'Testament' });
    expect(me.chronicles[0]!.characters).toHaveLength(1);
  });

  it('logs out only with the CSRF token and from the panel origin', async () => {
    const cookie = await login();
    const me = (await (await get('/api/me', cookie)).json()) as { csrf: string };
    const post = (headers: Record<string, string>) =>
      fetch(`${base}/logout`, { method: 'POST', headers: { cookie, ...headers } });

    expect((await post({})).status).toBe(403);
    expect((await post({ 'x-csrf-token': me.csrf, origin: 'https://evil.example' })).status).toBe(
      403,
    );
    expect((await post({ 'x-csrf-token': me.csrf, origin: PUBLIC })).status).toBe(204);
    expect((await get('/api/me', cookie)).status).toBe(401);
  });

  it('limits how often one address can try to log in', async () => {
    const statuses = [];
    for (let i = 0; i < 12; i++) statuses.push((await get('/login')).status);
    expect(statuses.slice(0, 10).every((s) => s === 302)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });

  it('serves only its own static files', async () => {
    expect((await get('/app.js')).headers.get('content-type')).toContain('javascript');
    expect((await get('/../package.json')).status).toBe(401);
    expect((await get('/%2e%2e/package.json')).status).toBe(401);
  });
});

describe('web sessions', () => {
  it('expire after 30 days and keep only a hash of the token', async () => {
    const { default: Database } = await import('better-sqlite3');
    const { WebSessions } = await import('../src/state/sessions.js');
    const db = new Database(':memory:');
    let now = 1_000;
    const sessions = new WebSessions(db, () => now);
    const { token } = sessions.create('111', 'Andrea');
    expect(sessions.get(token)?.userId).toBe('111');
    const stored = db.prepare('SELECT token_hash FROM web_sessions').get() as {
      token_hash: string;
    };
    expect(stored.token_hash).not.toContain(token);
    now += 31 * 24 * 60 * 60 * 1000;
    expect(sessions.get(token)).toBeUndefined();
    db.close();
  });
});
