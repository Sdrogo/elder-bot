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
