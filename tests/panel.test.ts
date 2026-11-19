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
    guildsOf: async () => [{ id: 'g', name: 'Tavolo' }],
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

describe('panel changes', () => {
  /** Logs in as 111 and returns a sender of changes with the session's CSRF token. */
  async function asUser() {
    const cookie = await login();
    const me = (await (await get('/api/me', cookie)).json()) as { csrf: string };
    return (method: string, path: string, body?: unknown, csrf = me.csrf) =>
      fetch(base + path, {
        method,
        headers: {
          cookie,
          'content-type': 'application/json',
          'x-csrf-token': csrf,
          origin: PUBLIC,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
  }

  const sheet = { tier: 'neonate' as const, stamina: 3, composure: 4, resolve: 2 };

  it('creates a character on a server the user shares with the bot', async () => {
    const send = await asUser();
    const body = { guild: 'g', name: 'Lucia', clan: 'toreador', ...sheet };
    const res = await send('POST', '/api/characters', body);
    expect(res.status).toBe(200);
    const { character } = (await res.json()) as { character: { health: { max: number } } };
    expect(character.health.max).toBe(8);
    expect(store.campaign.charactersOwnedBy('111')).toHaveLength(1);

    expect((await send('POST', '/api/characters', body)).status).toBe(409);
    expect((await send('POST', '/api/characters', { ...body, guild: 'other' })).status).toBe(400);
    expect((await send('POST', '/api/characters', { ...body, stamina: 11 })).status).toBe(400);
    expect((await send('POST', '/api/characters', { ...body, clan: 'x' })).status).toBe(400);
  });

  it('moves trackers one step within the rules', async () => {
    const mine = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '111',
      name: 'Test',
      clan: 'malkavian',
      values: newCharacter(sheet),
    });
    if (typeof mine !== 'object') throw new Error('setup');
    const send = await asUser();
    const step = (track: string, delta: number) =>
      send('POST', `/api/characters/${mine.id}/track`, { track, delta });

    expect((await step('vitae', -3)).status).toBe(200);
    expect((await step('health', 1)).status).toBe(200);
    const after = store.campaign.getCharacter(mine.id)!;
    expect(after.values.vitae).toBe(7);
    expect(after.values.health).toBe(8);
    expect((await step('hunger', 1)).status).toBe(400);
    expect((await step('vitae', 1.5)).status).toBe(400);
  });

  it('refuses changes without the CSRF token or to other people characters', async () => {
    const theirs = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '222',
      name: 'Altro',
      clan: 'brujah',
      values: newCharacter(sheet),
    });
    if (typeof theirs !== 'object') throw new Error('setup');
    const send = await asUser();
    const path = `/api/characters/${theirs.id}/track`;
    expect((await send('POST', path, { track: 'vitae', delta: -1 })).status).toBe(404);
    expect((await send('DELETE', `/api/characters/${theirs.id}`)).status).toBe(404);
    const mine = await send('POST', '/api/characters', {
      guild: 'g',
      name: 'A',
      clan: 'ventrue',
      ...sheet,
    });
    const { character } = (await mine.json()) as { character: { id: number } };
    const forged = await send('POST', `/api/characters/${character.id}`, { name: 'B' }, 'wrong');
    expect(forged.status).toBe(403);
    expect(store.campaign.getCharacter(character.id)?.name).toBe('A');
  });

  it('lets the Storyteller change but not delete a player character', async () => {
    const theirs = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '222',
      name: 'Altro',
      clan: 'brujah',
      values: newCharacter(sheet),
    });
    const chronicle = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '111',
      name: 'Testament',
      sect: 'camarilla',
    });
    if (typeof theirs !== 'object' || typeof chronicle !== 'object') throw new Error('setup');
    store.campaign.join(chronicle.id, theirs.id);
    const send = await asUser();
    const res = await send('POST', `/api/characters/${theirs.id}/track`, {
      track: 'willpower',
      delta: -1,
    });
    expect(res.status).toBe(200);
    expect(store.campaign.getCharacter(theirs.id)?.values.willpower).toBe(5);
    expect((await send('DELETE', `/api/characters/${theirs.id}`)).status).toBe(403);
  });

  it('edits and deletes the user own character', async () => {
    const send = await asUser();
    const created = await send('POST', '/api/characters', {
      guild: 'g',
      name: 'Lucia',
      clan: 'toreador',
      ...sheet,
    });
    const { character } = (await created.json()) as { character: { id: number } };
    const edit = await send('POST', `/api/characters/${character.id}`, {
      name: 'Lucia Bianchi',
      tier: 'ancilla',
      stamina: 5,
    });
    expect(edit.status).toBe(200);
    const saved = store.campaign.getCharacter(character.id)!;
    expect(saved.name).toBe('Lucia Bianchi');
    expect(saved.values).toMatchObject({ tier: 'ancilla', stamina: 5 });
    expect((await send('DELETE', `/api/characters/${character.id}`)).status).toBe(204);
    expect(store.campaign.getCharacter(character.id)).toBeUndefined();
  });
});

describe('Storyteller controls', () => {
  async function setup() {
    const cookie = await login();
    const me = (await (await get('/api/me', cookie)).json()) as { csrf: string };
    const send = (path: string, body: unknown) =>
      fetch(base + path, {
        method: 'POST',
        headers: {
          cookie,
          'content-type': 'application/json',
          'x-csrf-token': me.csrf,
          origin: PUBLIC,
        },
        body: JSON.stringify(body),
      });
    const values = newCharacter({ tier: 'neonate', stamina: 3, composure: 4, resolve: 2 });
    const make = (ownerId: string, name: string) => {
      const c = store.campaign.createCharacter({
        guildId: 'g',
        ownerId,
        name,
        clan: 'brujah',
        values,
      });
      if (typeof c !== 'object') throw new Error('setup');
      return c;
    };
    return { send, make };
  }

  it('creates Chronicles and switches the one on air', async () => {
    const { send } = await setup();
    const create = (name: string) => send('/api/chronicles', { guild: 'g', name, sect: 'anarch' });
    expect((await create('Prima')).status).toBe(200);
    expect((await create('Seconda')).status).toBe(200);
    expect((await create('Prima')).status).toBe(409);
    const [first, second] = store.campaign.chroniclesRunBy('111');
    expect(store.campaign.liveChronicle('g', '111')?.id).toBe(first!.id);
    expect((await send(`/api/chronicles/${second!.id}/live`, {})).status).toBe(200);
    expect(store.campaign.liveChronicle('g', '111')?.id).toBe(second!.id);
    expect(
      (await send(`/api/chronicles/${second!.id}`, { name: 'Terza', sect: 'sabbat' })).status,
    ).toBe(200);
    expect(store.campaign.getChronicle(second!.id)).toMatchObject({
      name: 'Terza',
      sect: 'sabbat',
    });
  });

  it('moves the Masquerade within 0 and 10', async () => {
    const { send } = await setup();
    await send('/api/chronicles', { guild: 'g', name: 'Prima', sect: 'camarilla' });
    const [ch] = store.campaign.chroniclesRunBy('111');
    expect((await send(`/api/chronicles/${ch!.id}/masquerade`, { delta: 3 })).status).toBe(200);
    await send(`/api/chronicles/${ch!.id}/masquerade`, { delta: -5 });
    expect(store.campaign.getChronicle(ch!.id)?.masquerade).toBe(0);
    await send(`/api/chronicles/${ch!.id}/masquerade`, { delta: 10 });
    await send(`/api/chronicles/${ch!.id}/masquerade`, { delta: 1 });
    expect(store.campaign.getChronicle(ch!.id)?.masquerade).toBe(10);
  });

  it('reorders and removes characters only in the Storyteller own Chronicle', async () => {
    const { send, make } = await setup();
    await send('/api/chronicles', { guild: 'g', name: 'Prima', sect: 'camarilla' });
    const [ch] = store.campaign.chroniclesRunBy('111');
    const a = make('222', 'A');
    const b = make('333', 'B');
    store.campaign.join(ch!.id, a.id);
    store.campaign.join(ch!.id, b.id);
    const path = `/api/chronicles/${ch!.id}`;
    expect((await send(`${path}/move`, { character: b.id, delta: -1 })).status).toBe(200);
    expect(store.campaign.members(ch!.id).map((m) => m.name)).toEqual(['B', 'A']);
    expect((await send(`${path}/remove`, { character: a.id })).status).toBe(200);
    expect(store.campaign.members(ch!.id).map((m) => m.name)).toEqual(['B']);
    expect((await send(`${path}/remove`, { character: a.id })).status).toBe(400);

    const other = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '999',
      name: 'Altrui',
      sect: 'camarilla',
    });
    if (typeof other !== 'object') throw new Error('setup');
    expect((await send(`/api/chronicles/${other.id}/live`, {})).status).toBe(404);
    expect((await send(`/api/chronicles/${other.id}/masquerade`, { delta: 1 })).status).toBe(404);
  });
});

describe('overlay API', () => {
  const values = newCharacter({ tier: 'neonate', stamina: 3, composure: 4, resolve: 2 });

  /** A Storyteller (111) with a Chronicle on air and two players, and an overlay key. */
  async function setup() {
    const cookie = await login();
    const me = (await (await get('/api/me', cookie)).json()) as { csrf: string };
    const made = await fetch(`${base}/api/overlay-key`, {
      method: 'POST',
      headers: { cookie, 'x-csrf-token': me.csrf, origin: PUBLIC },
    });
    const { key } = (await made.json()) as { key: string };
    const ch = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '111',
      name: 'Testament',
      sect: 'anarch',
    });
    const other = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '111',
      name: 'Berlino',
      sect: 'camarilla',
    });
    if (typeof ch !== 'object' || typeof other !== 'object') throw new Error('setup');
    store.campaign.setLive(ch.id);
    for (const [owner, name] of [
      ['222', 'Lucrezia'],
      ['333', 'Lucrezia'],
    ] as const) {
      const c = store.campaign.createCharacter({
        guildId: 'g',
        ownerId: owner,
        name,
        clan: 'toreador',
        values,
      });
      if (typeof c !== 'object') throw new Error('setup');
      store.campaign.join(ch.id, c.id);
    }
    const call = (path: string, init: RequestInit = {}) =>
      fetch(base + path, {
        ...init,
        headers: {
          authorization: `Bearer ${key}`,
          'content-type': 'application/json',
          ...init.headers,
        },
      });
    return { key, ch, other, call, cookie, csrf: me.csrf };
  }

  it('gives the Chronicle on air in the overlay shape, with a 304 when unchanged', async () => {
    const { call } = await setup();
    const res = await call('/api/overlay');
    expect(res.status).toBe(200);
    const view = (await res.json()) as {
      chronicle: { slug: string; sect: string };
      chronicles: { slug: string; live: boolean }[];
      characters: { id: string; health: { max: number }; hunger: number }[];
    };
    expect(view.chronicle).toMatchObject({ slug: 'testament', sect: 'anarch' });
    expect(view.chronicles.map((c) => c.slug).sort()).toEqual(['berlino', 'testament']);
    expect(view.characters.map((c) => c.id)).toEqual(['lucrezia', 'lucrezia-2']);
    expect(view.characters[0]).toMatchObject({ health: { max: 8 }, hunger: 0 });
    const again = await call('/api/overlay', {
      headers: { 'if-none-match': res.headers.get('etag')! },
    });
    expect(again.status).toBe(304);
  });

  it('moves trackers and switches the Chronicle on air for the Stream Deck', async () => {
    const { call, ch, other } = await setup();
    const post = (path: string, body: unknown) =>
      call(path, { method: 'POST', body: JSON.stringify(body) });
    const vitae = await post('/api/overlay/adjust', {
      pg: 'lucrezia-2',
      track: 'vitae',
      delta: -4,
    });
    expect(await vitae.json()).toEqual({ ok: true, value: 6 });
    expect(store.campaign.members(ch.id)[1]!.values.vitae).toBe(6);
    const masq = await post('/api/overlay/adjust', { track: 'masquerade', delta: 2 });
    expect(await masq.json()).toEqual({ ok: true, value: 2 });
    expect((await post('/api/overlay/adjust', { pg: 'x', track: 'vitae', delta: 1 })).status).toBe(
      404,
    );
    expect(
      (
        await post('/api/overlay/adjust', {
          pg: 'lucrezia',
          track: 'vitae',
          field: 'max',
          delta: 1,
        })
      ).status,
    ).toBe(400);
    expect((await post('/api/overlay/live', { chronicle: 'berlino' })).status).toBe(200);
    expect(store.campaign.liveChronicle('g', '111')?.id).toBe(other.id);
  });

  it('refuses a wrong or revoked key and any request from a web page', async () => {
    const { call, key, cookie, csrf } = await setup();
    const wrong = await fetch(`${base}/api/overlay`, {
      headers: { authorization: 'Bearer elk_nope' },
    });
    expect(wrong.status).toBe(401);
    expect(
      (await call('/api/overlay', { headers: { origin: 'https://evil.example' } })).status,
    ).toBe(403);
    expect(store.overlayKeys.userOf(key)).toBe('111');
    await fetch(`${base}/api/overlay-key`, {
      method: 'DELETE',
      headers: { cookie, 'x-csrf-token': csrf, origin: PUBLIC },
    });
    expect((await call('/api/overlay')).status).toBe(401);
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

describe('overlay pages for OBS', () => {
  it('need the view key and stream the Chronicle on air as it changes', async () => {
    const ch = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '111',
      name: 'Testament',
      sect: 'anarch',
    });
    const pc = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '222',
      name: 'Lucrezia',
      clan: 'toreador',
      values: newCharacter({ tier: 'neonate', stamina: 3, composure: 4, resolve: 2 }),
    });
    if (typeof ch !== 'object' || typeof pc !== 'object') throw new Error('setup');
    store.campaign.setLive(ch.id);
    store.campaign.join(ch.id, pc.id);
    const v = store.viewKeys.get('111');

    expect((await get('/overlay/scena')).status).toBe(401);
    expect((await get('/overlay/scena?v=elv_wrong')).status).toBe(401);
    const page = await get(`/overlay/scena?v=${v}`);
    expect(page.status).toBe(200);
    expect(page.headers.get('content-security-policy')).toContain('fonts.googleapis.com');
    expect(await page.text()).toContain('static/frame.js');
    expect((await get('/overlay/static/frame.js')).status).toBe(200);
    expect((await get('/overlay/static/../../package.json')).status).not.toBe(200);
    expect((await get(`/overlay/symbols/brujah.png?v=${v}`)).status).toBe(404);

    const controller = new AbortController();
    const events = await fetch(`${base}/overlay/events?v=${v}`, { signal: controller.signal });
    const reader = events.body!.getReader();
    const next = async () => {
      let text = '';
      while (!text.includes('\n\n')) text += new TextDecoder().decode((await reader.read()).value);
      return JSON.parse(/data: (.*)/.exec(text)![1]!) as {
        characters: { id: string; vitae: { current: number } }[];
        chronicle: { masquerade: number };
      };
    };
    const first = await next();
    expect(first.characters[0]).toMatchObject({ id: 'lucrezia', vitae: { current: 10 } });
    store.campaign.setTrack(pc.id, 'vitae', 7, '222');
    const second = await next();
    expect(second.characters[0]!.vitae.current).toBe(7);
    controller.abort();

    store.viewKeys.renew('111');
    expect((await get(`/overlay/scena?v=${v}`)).status).toBe(401);
  });

  it('take Stream Deck keys with the token in a header and the values in the address', async () => {
    const ch = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '111',
      name: 'Testament',
      sect: 'anarch',
    });
    if (typeof ch !== 'object') throw new Error('setup');
    store.campaign.setLive(ch.id);
    const key = store.overlayKeys.create('111');
    const res = await fetch(`${base}/api/overlay/adjust?track=masquerade&delta=2`, {
      method: 'POST',
      headers: { 'x-elder-token': key },
    });
    expect(await res.json()).toEqual({ ok: true, value: 2 });
  });
});

describe('overlay keys', () => {
  it('keep only a hash and replace the old key', async () => {
    const { default: Database } = await import('better-sqlite3');
    const { OverlayKeys } = await import('../src/state/overlayKeys.js');
    const db = new Database(':memory:');
    const keys = new OverlayKeys(db);
    const first = keys.create('111');
    const second = keys.create('111');
    expect(keys.userOf(first)).toBeUndefined();
    expect(keys.userOf(second)).toBe('111');
    const row = db.prepare('SELECT key_hash FROM overlay_keys').get() as { key_hash: string };
    expect(row.key_hash).not.toContain(second.slice(4));
    db.close();
  });
});
