import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newCharacter } from '../src/game/character.js';
import { emptyDraft, type SheetDraft } from '../src/game/creation.js';
import { MAX_DRAFTS } from '../src/state/drafts.js';
import { brujah } from './fixtures/sheets.js';
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
    channelsOf: async () => [{ id: '5551', name: '#tavolo' }],
    // Everyone is on the server except user 404.
    memberName: async (_guild, id) => (id === '40404' ? undefined : `Utente ${id}`),
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

  it('makes browsers check the panel script again on every load', async () => {
    const first = await get('/app.js?v=33');
    expect(first.status).toBe(200);
    expect(first.headers.get('cache-control')).toBe('no-cache');
    const etag = first.headers.get('etag')!;
    const again = await fetch(base + '/app.js', { headers: { 'if-none-match': etag } });
    expect(again.status).toBe(304);
  });
});

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

describe('panel changes', () => {
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

describe('sessions and hand-overs from the panel', () => {
  async function setup() {
    const cookie = await login();
    const me = (await (await get('/api/me', cookie)).json()) as { csrf: string };
    const send = (path: string, body?: unknown) =>
      fetch(base + path, {
        method: 'POST',
        headers: {
          cookie,
          'content-type': 'application/json',
          'x-csrf-token': me.csrf,
          origin: PUBLIC,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    await send('/api/chronicles', { guild: 'g', name: 'Roma', sect: 'camarilla' });
    const [ch] = store.campaign.chroniclesRunBy('111');
    return { cookie, send, ch: ch! };
  }

  it('plays a Chronicle in a channel, with its language, and frees it', async () => {
    const { cookie, send, ch } = await setup();
    const channels = await (await get('/api/guilds/g/channels', cookie)).json();
    expect(channels).toEqual({ channels: [{ id: '5551', name: '#tavolo' }] });
    expect((await get('/api/guilds/other/channels', cookie)).status).toBe(404);

    const edit = (patch: object) =>
      send(`/api/chronicles/${ch.id}`, { name: 'Roma', sect: 'camarilla', ...patch });
    expect((await edit({ channel: '9999' })).status).toBe(400);
    expect((await edit({ locale: 'xx' })).status).toBe(400);
    expect((await edit({ channel: '5551', locale: 'it' })).status).toBe(200);
    expect(store.getStoryteller('5551')).toBe('111');
    expect(store.getTableLocale('5551')).toBe('it');
    const view = (await (await get('/api/me', cookie)).json()) as {
      chronicles: { channel: string; channelName: string; locale: string }[];
    };
    expect(view.chronicles[0]).toMatchObject({
      channel: '5551',
      channelName: '#tavolo',
      locale: 'it',
    });

    expect((await edit({ channel: '', locale: '' })).status).toBe(200);
    expect(store.getStoryteller('5551')).toBeUndefined();
    expect(store.campaign.getChronicle(ch.id)?.locale).toBeUndefined();
  });

  it('ends a session, archives and hands over a Chronicle, with no body needed', async () => {
    const { send, ch } = await setup();
    await send(`/api/chronicles/${ch.id}`, { channel: '5551' });
    const task = { name: 'Hack', target: 5, maxTests: 3, testsDone: 1, successes: 2 };
    store.saveProlonged('5551', '222', task);
    expect((await send(`/api/chronicles/${ch.id}/end`)).status).toBe(200);
    expect(store.getProlonged('5551', '222')).toBeUndefined();
    expect((await send(`/api/chronicles/${ch.id}/live`)).status).toBe(200);

    expect((await send(`/api/chronicles/${ch.id}/transfer`, { to: '40404' })).status).toBe(400);
    expect((await send(`/api/chronicles/${ch.id}/transfer`, { to: '111' })).status).toBe(400);
    expect((await send(`/api/chronicles/${ch.id}/transfer`, { to: '22222' })).status).toBe(200);
    expect(store.getStoryteller('5551')).toBe('22222');
    expect(store.campaign.liveChronicle('g', '111')).toBeUndefined();
    // No longer theirs: no more changes.
    expect((await send(`/api/chronicles/${ch.id}/archive`)).status).toBe(404);

    await send('/api/chronicles', { guild: 'g', name: 'Napoli', sect: 'anarch' });
    const [napoli] = store.campaign.chroniclesRunBy('111');
    expect((await send(`/api/chronicles/${napoli!.id}/archive`)).status).toBe(200);
    expect(store.campaign.getChronicle(napoli!.id)?.archived).toBe(true);
  });

  it('lets only the owner give a character to someone on the server', async () => {
    const { cookie, send } = await setup();
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
    const mine = make('111', 'Lucrezia');
    const theirs = make('22222', 'Altro');
    const people = (await (await get('/api/guilds/g/people', cookie)).json()) as {
      people: { id: string; name: string }[];
    };
    expect(people.people).toEqual([{ id: '22222', name: 'Utente 22222' }]);

    expect((await send(`/api/characters/${theirs.id}/give`, { to: '111' })).status).toBe(404);
    expect((await send(`/api/characters/${mine.id}/give`, { to: '40404' })).status).toBe(400);
    expect((await send(`/api/characters/${mine.id}/give`, { to: '22222' })).status).toBe(204);
    expect(store.campaign.getCharacter(mine.id)?.ownerId).toBe('22222');
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

describe('character portraits', () => {
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from('fake png body'),
  ]);

  it('are uploaded by the owner and shown on the overlay of the Chronicle on air', async () => {
    const ch = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '999',
      name: 'Testament',
      sect: 'anarch',
    });
    const pc = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '111',
      name: 'Lucrezia',
      clan: 'toreador',
      values: newCharacter({ tier: 'neonate', stamina: 3, composure: 4, resolve: 2 }),
    });
    const other = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '222',
      name: 'Altro',
      clan: 'brujah',
      values: newCharacter({ tier: 'neonate', stamina: 3, composure: 4, resolve: 2 }),
    });
    if (typeof ch !== 'object' || typeof pc !== 'object' || typeof other !== 'object') {
      throw new Error('setup');
    }
    store.campaign.setLive(ch.id);
    store.campaign.join(ch.id, pc.id);

    const cookie = await login();
    const me = (await (await get('/api/me', cookie)).json()) as { csrf: string };
    const put = (id: number, body: Buffer) =>
      fetch(`${base}/api/characters/${id}/portrait`, {
        method: 'PUT',
        headers: { cookie, 'x-csrf-token': me.csrf, origin: PUBLIC },
        body,
      });

    expect((await put(pc.id, Buffer.from('not an image'))).status).toBe(415);
    expect((await put(other.id, PNG)).status).toBe(404);
    const ok = await put(pc.id, PNG);
    expect(ok.status).toBe(200);
    const { portrait } = (await ok.json()) as { portrait: string };
    expect(portrait).toMatch(/^[\w-]{12}$/);

    const mine = await get(`/api/characters/${pc.id}/portrait`, cookie);
    expect(mine.headers.get('content-type')).toBe('image/png');
    expect(Buffer.from(await mine.arrayBuffer())).toEqual(PNG);
    expect((await get(`/api/characters/${other.id}/portrait`, cookie)).status).toBe(404);

    const v = store.viewKeys.get('999');
    expect((await get(`/overlay/portraits/lucrezia?v=${v}`)).status).toBe(200);
    expect((await get(`/overlay/portraits/altro?v=${v}`)).status).toBe(404);
    expect((await get('/overlay/portraits/lucrezia')).status).toBe(401);

    const del = await fetch(`${base}/api/characters/${pc.id}/portrait`, {
      method: 'DELETE',
      headers: { cookie, 'x-csrf-token': me.csrf, origin: PUBLIC },
    });
    expect(del.status).toBe(200);
    expect(store.stage.portraitTag(pc.id)).toBeUndefined();
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

describe('character creation wizard', () => {
  it('serves its page to logged-in users and the rules engine as browser modules', async () => {
    expect((await get('/crea')).status).toBe(302);
    const cookie = await login();
    const page = await get('/crea', cookie);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('/wizard.js');
    const engine = await get('/game/creation.js');
    expect(engine.status).toBe(200);
    expect(engine.headers.get('content-type')).toContain('javascript');
    const code = await engine.text();
    expect(code).toContain("from './alpha2/background.js'");
    expect(code).not.toContain('interface SheetDraft');
    expect((await get('/game/alpha2/clans.js')).status).toBe(200);
    // Only the engine's own modules: not the server, not the sources, no way up the tree.
    for (const path of ['/game/draft.js', '/game/creation.ts', '/game/../web/server.js']) {
      expect((await get(path)).status).not.toBe(200);
    }
    expect((await get('/wizard.js')).status).toBe(200);
  });

  it('saves, lists, updates and deletes the user own drafts', async () => {
    const send = await asUser();
    const empty = await (await send('GET', '/api/drafts')).json();
    expect(empty).toEqual({ drafts: [] });

    const created = await send('POST', '/api/drafts', {
      data: {
        tier: 'neonate',
        name: 'Lucia',
        clan: 'brujah',
        sire: 'caring',
        lifepaths: [{ id: 'criminal', skills: { fighting: 3, knowledge: 2 }, resources: [1, 2] }],
        attributes: { strength: 3, wits: 99 },
        powers: ['awe', 'not-a-power'],
        evil: '<script>',
      },
    });
    expect(created.status).toBe(200);
    const { draft } = (await created.json()) as { draft: { id: number; data: SheetDraft } };
    // Unknown ids, Skills outside the lifepath and silly numbers are dropped, not kept.
    expect(draft.data.name).toBe('Lucia');
    expect(draft.data.attributes).toEqual({ strength: 3 });
    expect(draft.data.powers).toEqual(['awe']);
    expect(draft.data.lifepaths[0]!.skills).toEqual({ fighting: 3 });
    expect(draft.data.lifepaths[0]!.resources).toEqual([1, 2, 0]);
    expect(draft.data).not.toHaveProperty('evil');

    const updated = await send('POST', `/api/drafts/${draft.id}`, {
      data: { ...draft.data, clan: 'gangrel' },
    });
    expect(((await updated.json()) as { draft: { data: SheetDraft } }).draft.data.clan).toBe(
      'gangrel',
    );
    const list = (await (await send('GET', '/api/drafts')).json()) as { drafts: unknown[] };
    expect(list.drafts).toHaveLength(1);

    expect((await send('POST', '/api/drafts', { data: { tier: 'ghoul' } })).status).toBe(400);
    expect((await send('POST', '/api/drafts', { data: draft.data }, 'wrong')).status).toBe(403);

    expect((await send('DELETE', `/api/drafts/${draft.id}`)).status).toBe(204);
    expect((await send('GET', `/api/drafts/${draft.id}`)).status).toBe(404);
  });

  it('keeps other people drafts out of reach and caps how many one user keeps', async () => {
    const other = store.drafts.create('222', emptyDraft('elder'));
    if (other === 'limit') throw new Error('setup');
    const send = await asUser();
    expect((await send('GET', `/api/drafts/${other.id}`)).status).toBe(404);
    expect((await send('POST', `/api/drafts/${other.id}`, { data: other.data })).status).toBe(404);
    expect((await send('DELETE', `/api/drafts/${other.id}`)).status).toBe(404);
    expect(store.drafts.get(other.id, '222')).toBeDefined();

    for (let i = 0; i < MAX_DRAFTS; i++) {
      expect((await send('POST', '/api/drafts', { data: { tier: 'neonate' } })).status).toBe(200);
    }
    expect((await send('POST', '/api/drafts', { data: { tier: 'neonate' } })).status).toBe(409);
    const big = { tier: 'neonate', name: 'x'.repeat(20_000) };
    expect((await send('POST', '/api/drafts', { data: big })).status).toBe(413);
  });

  it('creates a character with a custom lifepath waiting for the Storyteller', async () => {
    const send = await asUser();
    const data = brujah();
    data.lifepaths[1] = {
      id: 'custom-1',
      custom: {
        name: 'Gondoliere',
        description: 'Canali e segreti.',
        group: 'mortal',
        skills: ['awareness', 'investigation', 'athletics', 'persuasion', 'shooting'],
        resources: [{ kind: 'vehicle', detail: 'Gondola' }, { kind: 'contact' }, { kind: 'mask' }],
      },
      skills: { awareness: 2, investigation: 2, shooting: 1 },
      resources: [1, 1, 1],
    };
    const saved = await send('POST', '/api/drafts', { data });
    const id = ((await saved.json()) as { draft: { id: number } }).draft.id;
    const res = await send('POST', `/api/drafts/${id}/create`, { guild: 'g' });
    expect(res.status).toBe(200);
    const { character } = (await res.json()) as { character: { id: number } };
    const sheet = store.campaign.getSheet(character.id)!;
    expect(sheet.approvals).toEqual([
      { code: 'custom-lifepath', target: 'Gondoliere', status: 'pending' },
    ]);
    expect(sheet.data).toMatchObject({ lifepaths: [{}, { custom: { name: 'Gondoliere' } }] });
  });

  it('creates a character with its full sheet from a complete draft, only once', async () => {
    const send = await asUser();
    const half = await send('POST', '/api/drafts', { data: { tier: 'neonate', name: 'Mezza' } });
    const halfId = ((await half.json()) as { draft: { id: number } }).draft.id;
    expect((await send('POST', `/api/drafts/${halfId}/create`, { guild: 'g' })).status).toBe(400);

    const saved = await send('POST', '/api/drafts', { data: brujah() });
    const id = ((await saved.json()) as { draft: { id: number } }).draft.id;
    expect((await send('POST', `/api/drafts/${id}/create`, { guild: 'other' })).status).toBe(400);
    expect((await send('POST', `/api/drafts/${id}/create`, { guild: 'g' }, 'wrong')).status).toBe(
      403,
    );
    const res = await send('POST', `/api/drafts/${id}/create`, { guild: 'g' });
    expect(res.status).toBe(200);
    const { character } = (await res.json()) as {
      character: { id: number; name: string; clanId: string; sheet: boolean };
    };
    expect(character).toMatchObject({ name: 'Nico', clanId: 'brujah', sheet: true });
    const stored = store.campaign.getCharacter(character.id)!;
    // Stamina 3, Composure 3 and Resolve 2 from the sheet drive the trackers.
    expect(stored.values).toMatchObject({ tier: 'neonate', stamina: 3, health: 8, willpower: 5 });
    expect(store.campaign.getSheet(character.id)?.data).toMatchObject({ sire: 'caring' });
    // The draft is gone, so the same sheet can't make a second character.
    expect((await send('POST', `/api/drafts/${id}/create`, { guild: 'g' })).status).toBe(404);

    // Deleting the character deletes its sheet too.
    expect((await send('DELETE', `/api/characters/${character.id}`)).status).toBe(204);
    expect(store.campaign.getSheet(character.id)).toBeUndefined();
  });

  it('completes a tracker-only character instead of making a new one', async () => {
    const old = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '111',
      name: 'Vecchio',
      clan: 'brujah',
      values: {
        ...newCharacter({ tier: 'neonate', stamina: 2, composure: 2, resolve: 2 }),
        vitae: 3,
      },
    });
    const theirs = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '222',
      name: 'Altrui',
      clan: 'brujah',
      values: newCharacter({ tier: 'neonate', stamina: 2, composure: 2, resolve: 2 }),
    });
    if (typeof old !== 'object' || typeof theirs !== 'object') throw new Error('setup');
    const send = await asUser();

    const stolen = await send('POST', '/api/drafts', {
      data: { ...brujah(), characterId: theirs.id },
    });
    const stolenId = ((await stolen.json()) as { draft: { id: number } }).draft.id;
    expect((await send('POST', `/api/drafts/${stolenId}/create`, {})).status).toBe(404);

    const saved = await send('POST', '/api/drafts', { data: { ...brujah(), characterId: old.id } });
    const id = ((await saved.json()) as { draft: { id: number } }).draft.id;
    const res = await send('POST', `/api/drafts/${id}/create`, {});
    expect(res.status).toBe(200);
    const after = store.campaign.getCharacter(old.id)!;
    expect(after.name).toBe('Nico');
    expect(after.hasSheet).toBe(true);
    // Attributes come from the sheet; the trackers in play are kept.
    expect(after.values).toMatchObject({ stamina: 3, vitae: 3 });
    expect(store.campaign.charactersOwnedBy('111')).toHaveLength(1);

    const again = await send('POST', '/api/drafts', { data: { ...brujah(), characterId: old.id } });
    const againId = ((await again.json()) as { draft: { id: number } }).draft.id;
    expect((await send('POST', `/api/drafts/${againId}/create`, {})).status).toBe(409);
  });

  it('keeps a Chronicle and its characters on the same tier of play', async () => {
    const send = await asUser();
    expect(
      (
        await send('POST', '/api/chronicles', {
          guild: 'g',
          name: 'Roma',
          sect: 'camarilla',
          tier: 'mortal',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await send('POST', '/api/chronicles', {
          guild: 'g',
          name: 'Roma',
          sect: 'camarilla',
          tier: 'ancilla',
        })
      ).status,
    ).toBe(200);
    const rome = store.campaign.chroniclesRunBy('111')[0]!;
    expect(rome.tier).toBe('ancilla');
    const neonate = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '111',
      name: 'Giovane',
      clan: 'brujah',
      values: newCharacter({ tier: 'neonate', stamina: 2, composure: 2, resolve: 2 }),
    });
    const dusk = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '111',
      name: 'Crepuscolo',
      clan: 'brujah',
      values: newCharacter({ tier: 'duskborn', stamina: 2, composure: 2, resolve: 2 }),
    });
    if (typeof neonate !== 'object' || typeof dusk !== 'object') throw new Error('setup');
    expect(store.campaign.join(rome.id, neonate.id)).toBe('tier');

    // Back to "any tier", both join; a Neonate tier then fits both (Duskborn play as Neonates).
    expect((await send('POST', `/api/chronicles/${rome.id}`, { tier: '' })).status).toBe(200);
    expect(store.campaign.join(rome.id, neonate.id)).toBe('ok');
    expect(store.campaign.join(rome.id, dusk.id)).toBe('ok');
    const refused = await send('POST', `/api/chronicles/${rome.id}`, {
      name: 'Nuova',
      tier: 'elder',
    });
    expect(refused.status).toBe(409);
    expect(store.campaign.getChronicle(rome.id)).toMatchObject({ name: 'Roma' });
    expect((await send('POST', `/api/chronicles/${rome.id}`, { tier: 'neonate' })).status).toBe(
      200,
    );

    // A member can't move to another tier while the Chronicle has one.
    const moved = await send('POST', `/api/characters/${neonate.id}`, { tier: 'ancilla' });
    expect(moved.status).toBe(409);
    expect(((await moved.json()) as { error: string }).error).toBe('tier');
  });

  it('shows the full sheet to owner and Storyteller, and lets only the Storyteller approve', async () => {
    const send = await asUser();
    const saved = await send('POST', '/api/drafts', {
      data: {
        ...brujah(),
        sire: 'brood-child',
        sireDiscipline: 'presence',
        broodmate: 'Ada',
        path: 'honor',
      },
    });
    const draftId = ((await saved.json()) as { draft: { id: number } }).draft.id;
    const made = await send('POST', `/api/drafts/${draftId}/create`, { guild: 'g' });
    expect(made.status).toBe(200);
    const id = ((await made.json()) as { character: { id: number } }).character.id;

    const sheet = (await (await send('GET', `/api/characters/${id}/sheet`)).json()) as {
      character: { pending: number };
      sheet: { approvals: { code: string; status: string }[] };
      canApprove: boolean;
    };
    expect(sheet.character.pending).toBe(2);
    expect(sheet.sheet.approvals.map((a) => [a.code, a.status])).toEqual([
      ['brood-child', 'pending'],
      ['path', 'pending'],
    ]);
    // Not in a Chronicle: nobody can approve yet, not even the owner.
    expect(sheet.canApprove).toBe(false);
    expect(
      (await send('POST', `/api/characters/${id}/approval`, { index: 0, approved: true })).status,
    ).toBe(403);

    const ch = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '222',
      name: 'Altrui',
      sect: 'anarch',
    });
    if (typeof ch !== 'object') throw new Error('setup');
    expect(store.campaign.join(ch.id, id)).toBe('ok');
    // The owner still can't approve their own choices; the other Storyteller can.
    expect(
      (await send('POST', `/api/characters/${id}/approval`, { index: 0, approved: true })).status,
    ).toBe(403);
    const own = store.campaign.createChronicle({
      guildId: 'g',
      storytellerId: '111',
      name: 'Mia',
      sect: 'anarch',
    });
    if (typeof own !== 'object') throw new Error('setup');
    store.campaign.leave(id);
    store.campaign.join(own.id, id);
    const ok = await send('POST', `/api/characters/${id}/approval`, { index: 1, approved: false });
    expect(ok.status).toBe(200);
    expect(store.campaign.getSheet(id)?.approvals).toMatchObject([
      { code: 'brood-child', status: 'pending' },
      { code: 'path', status: 'rejected' },
    ]);
    expect(
      (await send('POST', `/api/characters/${id}/approval`, { index: 5, approved: true })).status,
    ).toBe(400);

    // Someone else's character is not found.
    const theirs = store.campaign.createCharacter({
      guildId: 'g',
      ownerId: '222',
      name: 'Altro',
      clan: 'brujah',
      values: newCharacter({ tier: 'neonate', stamina: 2, composure: 2, resolve: 2 }),
      sheet: { data: brujah(), approvals: [] },
    });
    if (typeof theirs !== 'object') throw new Error('setup');
    expect((await send('GET', `/api/characters/${theirs.id}/sheet`)).status).toBe(404);
    expect((await get('/scheda')).status).toBe(302);
  });
});
