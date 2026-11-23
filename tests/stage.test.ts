import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newCharacter } from '../src/game/character.js';
import { judge, type RollRequest } from '../src/game/roll.js';
import { labelOf, showRoll, shownTest } from '../src/game/shownRoll.js';
import { camLinks, imageType, isCamId } from '../src/state/stage.js';
import { Store } from '../src/state/store.js';
import { createPanelHandler, overlayView } from '../src/web/server.js';

const PUBLIC = 'https://elder.example.com';
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32, 1),
]);

let store: Store;
let server: Server;
let base: string;

const fakeDiscord: typeof fetch = async (input) => {
  const url = String(input);
  if (url.endsWith('/oauth2/token')) return Response.json({ access_token: 'at' });
  if (url.endsWith('/users/@me')) return Response.json({ id: '111', username: 'andrea' });
  return new Response('', { status: 404 });
};

beforeEach(async () => {
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

const values = newCharacter({ tier: 'neonate', stamina: 3, composure: 4, resolve: 2 });

function character(ownerId: string, name: string) {
  const c = store.campaign.createCharacter({ guildId: 'g', ownerId, name, clan: 'brujah', values });
  if (typeof c !== 'object') throw new Error('setup');
  return c;
}

function chronicle(storytellerId = '111') {
  const ch = store.campaign.createChronicle({
    guildId: 'g',
    storytellerId,
    name: 'Testament',
    sect: 'anarch',
  });
  if (typeof ch !== 'object') throw new Error('setup');
  store.campaign.setLive(ch.id);
  return ch;
}

/** Logs in as user 111 and returns a sender for panel changes. */
async function panel() {
  const start = await fetch(`${base}/login`, { redirect: 'manual' });
  const stateCookie = start.headers.get('set-cookie')!.split(';')[0]!;
  const state = new URL(start.headers.get('location')!).searchParams.get('state')!;
  const back = await fetch(`${base}/callback?code=ok&state=${state}`, {
    redirect: 'manual',
    headers: { cookie: stateCookie },
  });
  const cookie = back.headers.getSetCookie().find((c) => c.startsWith('elder_session='))!;
  const session = cookie.split(';')[0]!;
  const me = (await (await fetch(`${base}/api/me`, { headers: { cookie: session } })).json()) as {
    csrf: string;
  };
  const send = (method: string, path: string, body?: unknown, type = 'application/json') =>
    fetch(base + path, {
      method,
      headers: { cookie: session, 'content-type': type, 'x-csrf-token': me.csrf, origin: PUBLIC },
      body: body === undefined ? undefined : Buffer.isBuffer(body) ? body : JSON.stringify(body),
    });
  const meNow = async () =>
    (await (await fetch(`${base}/api/me`, { headers: { cookie: session } })).json()) as {
      characters: { id: number; cam: { push: string; view: string } | null }[];
      overlay: {
        stage: { resolution: string; layout: string; rollBox: boolean; background: string | null };
      } | null;
    };
  return { send, meNow };
}

describe('webcams', () => {
  it('make unguessable VDO.Ninja links without the microphone', () => {
    const cam = 'elder' + 'ab'.repeat(10);
    expect(isCamId(cam)).toBe(true);
    const links = camLinks(cam, 'Lucrezia Rossi');
    expect(links.push).toBe(
      `https://vdo.ninja/?push=${cam}&webcam&audiodevice=0&label=Lucrezia%20Rossi`,
    );
    expect(links.view).toContain(`view=${cam}`);
    expect(links.view).toContain('noaudio');
  });

  it('are made by the player for their character and shown in the overlay', async () => {
    const own = character('111', 'Lucrezia');
    const other = character('222', 'Marco');
    const { send, meNow } = await panel();
    expect((await send('POST', `/api/characters/${other.id}/cam`)).status).toBe(404);
    expect((await send('POST', `/api/characters/${own.id}/cam`)).status).toBe(200);
    const cam = (await meNow()).characters[0]!.cam!;
    expect(cam.push).toMatch(/^https:\/\/vdo\.ninja\/\?push=elder[0-9a-f]{20}&/);

    const ch = chronicle('333');
    store.campaign.join(ch.id, own.id);
    const id = store.stage.camOf(own.id)!;
    expect(overlayView(store, '333').characters[0]!.cam).toBe(id);

    // DELETE removes the webcam, never the character.
    expect((await send('DELETE', `/api/characters/${own.id}/cam`)).status).toBe(200);
    expect(store.campaign.getCharacter(own.id)).toBeDefined();
    expect(store.stage.camOf(own.id)).toBeUndefined();
  });
});

describe('scene settings', () => {
  it('are for Storytellers, checked, and reach the overlay', async () => {
    const { send, meNow } = await panel();
    expect((await send('POST', '/api/stage', { layout: 'sides' })).status).toBe(403);
    chronicle();
    expect((await send('POST', '/api/stage', { layout: 'circle' })).status).toBe(400);
    expect((await send('POST', '/api/stage', { resolution: '4k' })).status).toBe(400);
    const ok = await send('POST', '/api/stage', {
      layout: 'stage',
      resolution: '1440',
      rollBox: false,
    });
    expect(ok.status).toBe(200);
    expect((await meNow()).overlay!.stage).toMatchObject({
      layout: 'stage',
      resolution: '1440',
      rollBox: false,
    });
    expect(overlayView(store, '111').stage).toMatchObject({
      width: 2560,
      height: 1440,
      layout: 'stage',
    });
    expect((await send('POST', '/api/stage/cam')).status).toBe(200);
    expect(overlayView(store, '111').stage.cam).toMatch(/^elder/);
  });

  it('keep a background image that only the view key shows', async () => {
    chronicle();
    const { send, meNow } = await panel();
    const text = Buffer.from('<svg onload="alert(1)"></svg>');
    expect((await send('PUT', '/api/stage/background', text, 'image/png')).status).toBe(415);
    expect((await send('PUT', '/api/stage/background', PNG, 'image/png')).status).toBe(200);
    const tag = (await meNow()).overlay!.stage.background;
    expect(tag).toBeTruthy();
    expect((await fetch(`${base}/overlay/background`)).status).toBe(401);
    const v = store.viewKeys.get('111');
    const image = await fetch(`${base}/overlay/background?v=${v}&t=${tag}`);
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toBe('image/png');
    expect(Buffer.from(await image.arrayBuffer()).equals(PNG)).toBe(true);
    expect((await send('DELETE', '/api/stage/background')).status).toBe(200);
    expect((await fetch(`${base}/overlay/background?v=${v}`)).status).toBe(404);
  });

  it('refuse a background over 8 MB', async () => {
    chronicle();
    const { send } = await panel();
    const big = Buffer.concat([PNG, Buffer.alloc(8 * 1024 * 1024)]);
    expect((await send('PUT', '/api/stage/background', big, 'image/png')).status).toBe(413);
  });

  it('tells images from their first bytes', () => {
    expect(imageType(PNG)).toBe('image/png');
    expect(imageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(imageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
    expect(imageType(Buffer.from('GIF89a'))).toBeUndefined();
  });
});

describe('roll box', () => {
  const request: RollRequest = {
    channelId: 'c',
    userId: '222',
    dice: 5,
    difficulty: 3,
    modifier: 0,
    hunger: 2,
    takeHalf: false,
    retry: false,
  };

  it('shows the dice and the result in game terms', () => {
    const shown = shownTest('Lucrezia', 'Persuasion', judge(request, [10, 6, 3], [1, 2]));
    expect(shown).toMatchObject({
      label: 'Persuasion',
      difficulty: 3,
      sides: [{ who: 'Lucrezia', normal: [10, 6, 3], hunger: [1, 2], successes: 3 }],
      outcome: 'Critical Win',
      tone: 'critical',
    });
    const bestial = shownTest('Lucrezia', 'x', judge(request, [6, 3, 3], [1, 2]));
    expect(bestial).toMatchObject({ outcome: 'Bestial Failure', tone: 'bestial' });
    expect(labelOf('Andrea: Persuasion', 'Andrea')).toBe('Persuasion');
  });

  it('goes to the Chronicle on air where the roller has a character', () => {
    const ch = chronicle();
    const pc = character('222', 'Lucrezia');
    store.campaign.join(ch.id, pc.id);
    const where = { guildId: 'g', channelId: 'unbound', userId: '222', displayName: 'Marco' };
    showRoll(store, where, (who) => shownTest(who, 'Persuasion', judge(request, [6], [7])));
    expect(overlayView(store, '111').roll).toMatchObject({
      label: 'Persuasion',
      sides: [{ who: 'Lucrezia' }],
    });

    // The Storyteller rolling for an NPC: their own Chronicle on air, under their name.
    const st = { guildId: 'g', channelId: 'unbound', userId: '111', displayName: 'Andrea' };
    showRoll(store, st, (who) => shownTest(who, 'NPC', judge(request, [2], [])));
    expect(overlayView(store, '111').roll!.sides[0]!.who).toBe('Andrea');

    // Someone with no Chronicle on air: nothing kept.
    const stranger = { guildId: 'g', channelId: 'unbound', userId: '999', displayName: 'X' };
    showRoll(store, stranger, (who) => shownTest(who, 'Other', judge(request, [2], [])));
    expect(overlayView(store, '111').roll!.label).toBe('NPC');
  });
});

describe('saved layouts', () => {
  const items = {
    players: [
      { x: 20, y: 0, w: 8, h: 6 },
      { x: 20, y: 6, w: 8, h: 6, hidden: true },
    ],
    storyteller: { x: 0, y: 0, w: 20, h: 13 },
    roll: { x: 28, y: 0, w: 4, h: 18 },
  };

  it('are saved on the grid, put on the scene and reach the overlay', async () => {
    const ch = chronicle();
    store.campaign.join(ch.id, character('222', 'Lucrezia').id);
    const { send } = await panel();
    const bad = { ...items, roll: { x: 30, y: 0, w: 4, h: 18 } };
    expect((await send('POST', '/api/stage/layouts', { name: 'Fuori', items: bad })).status).toBe(
      400,
    );
    expect((await send('POST', '/api/stage/layouts', { name: '', items })).status).toBe(400);
    const res = await send('POST', '/api/stage/layouts', { name: 'Combattimento', items });
    expect(res.status).toBe(200);
    const { layout } = (await res.json()) as { layout: { id: number } };
    expect(
      (await send('POST', '/api/stage/layouts', { name: 'combattimento', items })).status,
    ).toBe(409);

    expect(overlayView(store, '111').stage.custom).toBeNull();
    expect((await send('POST', '/api/stage/layout', { id: layout.id })).status).toBe(200);
    expect(overlayView(store, '111').stage.custom).toEqual({ name: 'Combattimento', items });

    expect((await send('DELETE', `/api/stage/layouts/${layout.id}`)).status).toBe(200);
    expect(overlayView(store, '111').stage.custom).toBeNull();
  });

  it('are only for Storytellers and at most ten each', async () => {
    const { send } = await panel();
    expect((await send('POST', '/api/stage/layouts', { name: 'X', items })).status).toBe(403);
    chronicle();
    for (let i = 0; i < 10; i++) {
      expect((await send('POST', '/api/stage/layouts', { name: `L${i}`, items })).status).toBe(200);
    }
    expect((await send('POST', '/api/stage/layouts', { name: 'L10', items })).status).toBe(409);
  });

  it('switch from the Stream Deck by name, in turn, or back to automatic', async () => {
    chronicle();
    const a = store.stage.saveLayout('111', { name: 'Dialogo', items });
    const b = store.stage.saveLayout('111', { name: 'Combattimento', items });
    if (typeof a !== 'object' || typeof b !== 'object') throw new Error('setup');
    const key = store.overlayKeys.create('111');
    const deck = (query: string) =>
      fetch(`${base}/api/overlay/layout?${query}`, {
        method: 'POST',
        headers: { 'x-elder-token': key },
      });
    expect((await deck('name=COMBATTIMENTO')).status).toBe(200);
    expect(store.stage.settings('111').activeLayout).toBe(b.id);
    await deck('step=1');
    expect(store.stage.settings('111').activeLayout).toBe(a.id);
    await deck('step=-1');
    expect(store.stage.settings('111').activeLayout).toBe(b.id);
    await deck('auto=1');
    expect(store.stage.settings('111').activeLayout).toBeUndefined();
    expect((await deck('name=Nessuno')).status).toBe(404);
    expect((await deck('')).status).toBe(400);
  });

  it('keep the last ten rolls of a Chronicle, newest first', () => {
    const ch = chronicle();
    for (let i = 0; i < 12; i++) {
      store.stage.recordRoll(ch.id, {
        label: `Tiro ${i}`,
        sides: [],
        outcome: '',
        tone: 'neutral',
      });
    }
    const rolls = store.stage.recentRolls(ch.id);
    expect(rolls).toHaveLength(10);
    expect(rolls[0]!.label).toBe('Tiro 11');
    expect(rolls[9]!.label).toBe('Tiro 2');
  });
});
