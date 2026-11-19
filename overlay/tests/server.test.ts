import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startOverlay, type Overlay } from '../src/server.ts';

const TOKEN = 'test-token-0123456789abcdefghijklmnopqrstuv';
let overlay: Overlay;
let dir: string;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'elder-overlay-'));
  overlay = await startOverlay({ port: 0, dataDir: dir, token: TOKEN, saveDelay: 0 });
});
afterEach(async () => {
  await overlay.close();
  rmSync(dir, { recursive: true, force: true });
});

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return fetch(overlay.url + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Elder-Token': TOKEN, ...headers },
    body: JSON.stringify(body),
  });
}

/** Raw request, to send a Host header that fetch would not let us forge. */
function raw(path: string, host: string): Promise<number> {
  const { port } = new URL(overlay.url);
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, headers: { Host: host } }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on('error', reject);
    req.end();
  });
}

describe('overlay server', () => {
  it('listens on 127.0.0.1 only', () => {
    expect(new URL(overlay.url).hostname).toBe('127.0.0.1');
  });

  it('adds a character and adjusts a tracker, returning the new value', async () => {
    expect((await post('/api/characters/add', { name: 'Nina', clan: 'tremere' })).status).toBe(200);
    const res = await post('/api/adjust?pg=nina&track=vitae&delta=-3', {});
    expect(await res.json()).toEqual({ ok: true, value: 7 });
    const state = (await (await fetch(overlay.url + '/api/state')).json()) as {
      characters: { hunger: number }[];
    };
    expect(state.characters[0]?.hunger).toBe(2);
    expect((await post('/api/adjust?pg=nina&track=hunger&delta=1', {})).status).toBe(400);
  });

  it('accepts form bodies and a Bearer token, as Stream Deck plugins send', async () => {
    await post('/api/characters/add', { name: 'Nina', clan: 'tremere' });
    const res = await fetch(overlay.url + '/api/adjust', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: 'pg=nina&track=vitae&delta=-1',
    });
    expect(await res.json()).toEqual({ ok: true, value: 9 });
  });

  it('refuses changes without the right token', async () => {
    const res = await post(
      '/api/characters/add',
      { name: 'Nina', clan: 'tremere' },
      { 'X-Elder-Token': 'wrong' },
    );
    expect(res.status).toBe(401);
    expect(overlay.state.characters).toHaveLength(0);
  });

  it('refuses changes sent by another website', async () => {
    const res = await post(
      '/api/characters/add',
      { name: 'Nina', clan: 'tremere' },
      { Origin: 'https://evil.example' },
    );
    expect(res.status).toBe(403);
  });

  it('refuses requests addressed to another host name (DNS rebinding)', async () => {
    expect(await raw('/api/state', 'evil.example')).toBe(403);
    expect(await raw('/dock', `evil.example:${new URL(overlay.url).port}`)).toBe(403);
    expect(await raw('/api/state', `localhost:${new URL(overlay.url).port}`)).toBe(200);
  });

  it('answers bad input with 400 and a reason', async () => {
    const res = await post('/api/adjust', { pg: 'nobody', track: 'health', delta: -1 });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toMatch(/no character/);
  });

  it('rejects oversized bodies', async () => {
    const res = await post('/api/characters/add', { name: 'x'.repeat(5000), clan: 'brujah' });
    expect(res.status).toBe(400);
  });

  it('serves only listed static files, with a strict CSP', async () => {
    const ok = await fetch(overlay.url + '/static/frame.js');
    expect(ok.status).toBe(200);
    expect(ok.headers.get('content-security-policy')).toContain("script-src 'self'");
    expect((await fetch(overlay.url + '/static/../src/server.ts')).status).toBe(404);
    expect((await fetch(overlay.url + '/static/dock.html')).status).toBe(404);
    expect((await fetch(overlay.url + '/symbols/..%2Fdata%2Ftoken.png')).status).toBe(404);
  });

  it('puts the token only in the dock page', async () => {
    expect(await (await fetch(overlay.url + '/dock')).text()).toContain(TOKEN);
    expect(await (await fetch(overlay.url + '/frame?pg=x')).text()).not.toContain(TOKEN);
    const scene = await fetch(overlay.url + '/scena');
    expect(scene.status).toBe(200);
    expect(await scene.text()).not.toContain(TOKEN);
    expect(await (await fetch(overlay.url + '/api/state')).text()).not.toContain(TOKEN);
  });

  it('streams the state to the frames', async () => {
    await post('/api/characters/add', { name: 'Nina', clan: 'tremere' });
    const res = await fetch(overlay.url + '/events');
    const reader = res.body!.getReader();
    const first = new TextDecoder().decode((await reader.read()).value);
    expect(first).toContain('"id":"nina"');
    await post('/api/adjust', { pg: 'nina', track: 'vitae', delta: -1 });
    const next = new TextDecoder().decode((await reader.read()).value);
    expect(next).toContain('"hunger":1');
    await reader.cancel();
  });

  it('saves the state to disk', async () => {
    await post('/api/characters/add', { name: 'Nina', clan: 'tremere' });
    await new Promise((r) => setTimeout(r, 20));
    expect(JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8')).characters[0].id).toBe('nina');
  });
});

describe('link to the bot', () => {
  const KEY = 'elk_' + 'k'.repeat(43);
  let linked: Overlay;
  let linkDir: string;
  let botCalls: { path: string; body?: unknown }[];
  let botState: {
    chronicle: { slug: string; name: string; sect: string; masquerade: number };
    chronicles: { slug: string; name: string; live: boolean }[];
    characters: Record<string, unknown>[];
  };
  let up: boolean;

  /** A fake bot panel: GET /api/overlay and the two POSTs, with the overlay key. */
  const fakeBot: typeof fetch = async (input, init) => {
    if (!up) throw new TypeError('fetch failed');
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    if (headers.get('authorization') !== `Bearer ${KEY}`)
      return new Response('{}', { status: 401 });
    const body = init?.body
      ? (JSON.parse(String(init.body)) as Record<string, unknown>)
      : undefined;
    botCalls.push({ path: url.pathname, body });
    if (url.pathname === '/api/overlay')
      return Response.json(botState, { headers: { etag: '"x"' } });
    if (url.pathname === '/api/overlay/adjust') {
      const c = botState.characters.find((x) => x.id === body?.pg) as {
        vitae: { current: number };
      };
      c.vitae.current += Number(body?.delta);
      return Response.json({ ok: true, value: c.vitae.current });
    }
    if (url.pathname === '/api/overlay/live') {
      for (const c of botState.chronicles) c.live = c.slug === body?.chronicle;
      return Response.json({ ok: true });
    }
    return new Response('{}', { status: 404 });
  };

  const character = (id: string, name: string) => ({
    id,
    name,
    clan: 'toreador',
    health: { max: 8, current: 8, baneful: 0 },
    vitae: { max: 10, current: 10 },
    willpower: { max: 6, current: 6 },
    humanity: { rank: 6, violations: 0 },
    hunger: 0,
  });

  beforeEach(async () => {
    up = true;
    botCalls = [];
    botState = {
      chronicle: { slug: 'testament', name: 'Testament', sect: 'anarch', masquerade: 3 },
      chronicles: [
        { slug: 'testament', name: 'Testament', live: true },
        { slug: 'berlino', name: 'Berlino', live: false },
      ],
      characters: [character('lucrezia', 'Lucrezia'), character('lucrezia-2', 'Lucrezia')],
    };
    linkDir = mkdtempSync(join(tmpdir(), 'elder-overlay-link-'));
    linked = await startOverlay({
      port: 0,
      dataDir: linkDir,
      token: TOKEN,
      saveDelay: 0,
      pollMs: 60_000,
      fetchFn: fakeBot,
    });
  });
  afterEach(async () => {
    await linked.close();
    rmSync(linkDir, { recursive: true, force: true });
  });

  const send = (path: string, body: unknown) =>
    fetch(linked.url + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Elder-Token': TOKEN },
      body: JSON.stringify(body),
    });
  const state = async () =>
    (await (await fetch(linked.url + '/api/state')).json()) as {
      characters: { id: string; vitae: { current: number }; hunger: number }[];
      chronicle: { masquerade: number; sect: string };
      link: { linked: boolean; ok?: boolean; chronicle?: string; error?: string };
    };

  it('shows the Chronicle on air and keeps the key in a private file', async () => {
    const res = await send('/api/bot/link', { url: 'http://127.0.0.1:9/', key: KEY });
    expect(res.status).toBe(200);
    const s = await state();
    expect(s.characters.map((c) => c.id)).toEqual(['lucrezia', 'lucrezia-2']);
    expect(s.chronicle).toEqual({ masquerade: 3, sect: 'anarch' });
    expect(s.link).toMatchObject({ linked: true, ok: true, chronicle: 'Testament' });
    expect(JSON.stringify(s)).not.toContain(KEY);
    expect(JSON.parse(readFileSync(join(linkDir, 'bot.json'), 'utf8'))).toEqual({
      url: 'http://127.0.0.1:9',
      key: KEY,
    });
  });

  it('refuses a key the bot does not know, and plain http to another host', async () => {
    const wrong = await send('/api/bot/link', {
      url: 'http://127.0.0.1:9',
      key: 'elk_' + 'x'.repeat(43),
    });
    expect(wrong.status).toBe(400);
    expect((await state()).link.linked).toBe(false);
    const http = await send('/api/bot/link', { url: 'http://panel.example.com', key: KEY });
    expect(http.status).toBe(400);
  });

  it('sends Stream Deck keys to the bot and switches the Chronicle on air', async () => {
    await send('/api/bot/link', { url: 'http://127.0.0.1:9', key: KEY });
    const res = await send('/api/adjust?pg=lucrezia-2&track=vitae&delta=-4', {});
    expect(await res.json()).toEqual({ ok: true, value: 6 });
    expect(botCalls).toContainEqual({
      path: '/api/overlay/adjust',
      body: { pg: 'lucrezia-2', track: 'vitae', delta: -4 },
    });
    expect((await state()).characters[1]).toMatchObject({ vitae: { current: 6 }, hunger: 2 });
    expect((await send('/api/live?cronaca=berlino', {})).status).toBe(200);
    expect(botCalls).toContainEqual({ path: '/api/overlay/live', body: { chronicle: 'berlino' } });
    expect((await send('/api/characters/add', { name: 'Nina', clan: 'tremere' })).status).toBe(409);
  });

  it('keeps the last values when the bot is down, and works locally once unlinked', async () => {
    await send('/api/bot/link', { url: 'http://127.0.0.1:9', key: KEY });
    up = false;
    const res = await send('/api/adjust?pg=lucrezia&track=vitae&delta=-1', {});
    expect(res.status).toBe(502);
    const s = await state();
    expect(s.characters).toHaveLength(2);
    expect(s.link).toMatchObject({ linked: true });
    expect((await send('/api/bot/unlink', {})).status).toBe(200);
    expect((await send('/api/adjust?pg=lucrezia&track=vitae&delta=-1', {})).status).toBe(200);
    expect((await state()).link.linked).toBe(false);
  });
});
