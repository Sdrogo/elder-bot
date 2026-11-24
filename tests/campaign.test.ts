import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { canEditCharacter } from '../src/auth/campaign.js';
import { newCharacter } from '../src/game/character.js';
import type { Character, Chronicle } from '../src/state/campaign.js';
import { Store } from '../src/state/store.js';

let store: Store;
beforeEach(() => {
  store = new Store(':memory:');
});
afterEach(() => store.close());

const values = () => newCharacter({ tier: 'neonate', stamina: 2, composure: 2, resolve: 3 });

function makeCharacter(ownerId: string, name: string, guildId = 'g1'): Character {
  const c = store.campaign.createCharacter({
    guildId,
    ownerId,
    name,
    clan: 'toreador',
    values: values(),
  });
  if (typeof c !== 'object') throw new Error(c);
  return c;
}

function makeChronicle(storytellerId: string, name: string, guildId = 'g1'): Chronicle {
  const c = store.campaign.createChronicle({ guildId, storytellerId, name, sect: 'camarilla' });
  if (typeof c !== 'object') throw new Error(c);
  return c;
}

const member = (id: string, admin = false) => ({
  user: { id },
  memberPermissions: { has: () => admin } as never,
});

describe('characters', () => {
  it('belong to their owner, several per user, names unique per owner', () => {
    makeCharacter('u1', 'Lucrezia');
    makeCharacter('u1', 'Marco');
    makeCharacter('u2', 'Lucrezia');
    expect(store.campaign.charactersOf('g1', 'u1').map((c) => c.name)).toEqual([
      'Lucrezia',
      'Marco',
    ]);
    expect(
      store.campaign.createCharacter({
        guildId: 'g1',
        ownerId: 'u1',
        name: 'lucrezia',
        clan: 'brujah',
        values: values(),
      }),
    ).toBe('duplicate');
    expect(store.campaign.charactersOf('g2', 'u1')).toEqual([]);
  });

  it('log tracker changes and clamp them', () => {
    const c = makeCharacter('u1', 'Lucrezia');
    const after = store.campaign.setTrack(c.id, 'vitae', 3, 'u1');
    expect(after?.values.vitae).toBe(3);
    expect(store.campaign.setTrack(c.id, 'vitae', 50, 'u1')?.values.vitae).toBe(10);
    expect(store.campaign.changes(c.id)[0]).toMatchObject({ field: 'vitae', before: 3, after: 10 });
  });

  it('clamp current values when an edit lowers a maximum', () => {
    const c = makeCharacter('u1', 'Lucrezia');
    const edited = store.campaign.updateCharacter(c.id, { values: { stamina: 1 } }, 'u1');
    expect(typeof edited === 'object' && edited.values.health).toBe(6);
  });

  it('change hands only from the current owner', () => {
    const c = makeCharacter('u1', 'Lucrezia');
    expect(store.campaign.transferCharacter(c.id, 'u3', 'u2')).toBeUndefined();
    const moved = store.campaign.transferCharacter(c.id, 'u1', 'u2');
    expect(typeof moved === 'object' && moved.ownerId).toBe('u2');
  });
});

describe('playedCharacter', () => {
  it('falls back to the only character on the server when the channel has no Chronicle', () => {
    const only = makeCharacter('u1', 'Smerdino');
    expect(store.campaign.playedCharacter('g1', 'free-channel', 'u1')?.id).toBe(only.id);
    expect(store.campaign.playedCharacter('g1', 'free-channel', 'u2')).toBeUndefined();
    expect(store.campaign.playedCharacter(null, 'dm', 'u1')).toBeUndefined();
    makeCharacter('u1', 'Second');
    expect(store.campaign.playedCharacter('g1', 'free-channel', 'u1')).toBeUndefined();
  });
});

describe('willpowerPayer', () => {
  it('asks for a choice instead of rerolling unpaid when several characters and none chosen', () => {
    expect(store.campaign.willpowerPayer('g1', 'free', 'u1')).toBe('none');
    const a = makeCharacter('u1', 'Alfa');
    expect(store.campaign.willpowerPayer('g1', 'free', 'u1')).toEqual({
      character: expect.objectContaining({ id: a.id }),
    });
    const b = makeCharacter('u1', 'Beta');
    expect(store.campaign.willpowerPayer('g1', 'free', 'u1')).toBe('ambiguous');
    expect(store.campaign.willpowerPayer(null, 'dm', 'u1')).toBe('none');
    store.campaign.selectCharacter(b.id, 'u1');
    expect(store.campaign.willpowerPayer('g1', 'free', 'u1')).toEqual({
      character: expect.objectContaining({ id: b.id }),
    });
  });
});

describe('willpowerPayer after a sheet roll', () => {
  it('charges the same character the roll used: the only one with a sheet', () => {
    const sheeted = makeCharacter('u1', 'Con scheda');
    makeCharacter('u1', 'Senza scheda');
    store.campaign.attachSheet(sheeted.id, { data: {}, approvals: [] });
    expect(store.campaign.playedCharacter('g1', 'free', 'u1')).toBeUndefined();
    expect(store.campaign.sheetCharacter('g1', 'free', 'u1')?.id).toBe(sheeted.id);
    expect(store.campaign.willpowerPayer('g1', 'free', 'u1')).toEqual({
      character: expect.objectContaining({ id: sheeted.id }),
    });
  });
});

describe('selected character', () => {
  it('wins over the sole-character fallback and the scene order, and only for the owner', () => {
    const a = makeCharacter('u1', 'Alfa');
    const b = makeCharacter('u1', 'Beta');
    expect(store.campaign.playedCharacter('g1', 'free', 'u1')).toBeUndefined();
    expect(store.campaign.selectCharacter(b.id, 'u2')).toBeUndefined();
    store.campaign.selectCharacter(b.id, 'u1');
    expect(store.campaign.playedCharacter('g1', 'free', 'u1')?.id).toBe(b.id);

    const rome = makeChronicle('st', 'Roma');
    store.campaign.join(rome.id, a.id);
    store.campaign.join(rome.id, b.id);
    store.bindChronicle('c-rome', rome.id);
    expect(store.campaign.activeCharacter('c-rome', 'u1')?.id).toBe(b.id);
    store.campaign.selectCharacter(a.id, 'u1');
    expect(store.campaign.activeCharacter('c-rome', 'u1')?.id).toBe(a.id);
  });
});

describe('chronicles', () => {
  it('play one per channel, and give each player their character there', () => {
    const st = 'st';
    const rome = makeChronicle(st, 'Notti di Roma');
    const milan = makeChronicle(st, 'Milano');
    expect(rome.slug).toBe('notti-di-roma');
    const lucrezia = makeCharacter('u1', 'Lucrezia');
    const marco = makeCharacter('u1', 'Marco');
    expect(store.campaign.join(rome.id, lucrezia.id)).toBe('ok');
    expect(store.campaign.join(milan.id, lucrezia.id)).toBe('busy');
    store.campaign.join(milan.id, marco.id);

    store.bindChronicle('c-rome', rome.id);
    store.bindChronicle('c-milan', milan.id);
    expect(store.campaign.activeCharacter('c-rome', 'u1')?.name).toBe('Lucrezia');
    expect(store.campaign.activeCharacter('c-milan', 'u1')?.name).toBe('Marco');
    expect(store.campaign.activeCharacter('elsewhere', 'u1')).toBeUndefined();

    // Moving Rome to Milan's channel frees the old binding.
    store.bindChronicle('c-milan', rome.id);
    expect(store.campaign.chronicleByChannel('c-milan')?.id).toBe(rome.id);
    expect(store.campaign.chronicleByChannel('c-rome')).toBeUndefined();
  });

  it('keep members in scene order', () => {
    const rome = makeChronicle('st', 'Roma');
    for (const name of ['C', 'A', 'B']) store.campaign.join(rome.id, makeCharacter(name, name).id);
    expect(store.campaign.members(rome.id).map((c) => c.name)).toEqual(['C', 'A', 'B']);
  });

  it('take over the channel Masquerade Tracker and keep their own afterwards', () => {
    store.setMasquerade('c1', 4);
    const rome = makeChronicle('st', 'Roma');
    store.bindChronicle('c1', rome.id);
    expect(store.getMasquerade('c1')).toBe(4);
    store.setMasquerade('c1', 6);
    expect(store.campaign.getChronicle(rome.id)?.masquerade).toBe(6);
  });

  it('go on air one per Storyteller, and archiving frees everything', () => {
    const rome = makeChronicle('st', 'Roma');
    const milan = makeChronicle('st', 'Milano');
    store.campaign.setLive(rome.id);
    store.campaign.setLive(milan.id);
    expect(store.campaign.liveChronicle('g1', 'st')?.id).toBe(milan.id);

    const c = makeCharacter('u1', 'Lucrezia');
    store.campaign.join(milan.id, c.id);
    store.bindChronicle('c1', milan.id);
    store.campaign.archiveChronicle(milan.id);
    expect(store.campaign.liveChronicle('g1', 'st')).toBeUndefined();
    expect(store.campaign.chronicleByChannel('c1')).toBeUndefined();
    expect(store.campaign.getCharacter(c.id)?.chronicleId).toBeUndefined();
    expect(store.campaign.join(rome.id, c.id)).toBe('ok');
    expect(store.campaign.chronicles('g1', 'st').map((x) => x.name)).toEqual(['Roma']);
  });

  it('let the owner, the Chronicle Storyteller and admins edit a character', () => {
    const rome = makeChronicle('st', 'Roma');
    const c = makeCharacter('u1', 'Lucrezia');
    const { campaign } = store;
    expect(canEditCharacter(member('st'), c, campaign)).toBe(false);
    campaign.join(rome.id, c.id);
    const joined = campaign.getCharacter(c.id)!;
    expect(canEditCharacter(member('u1'), joined, campaign)).toBe(true);
    expect(canEditCharacter(member('st'), joined, campaign)).toBe(true);
    expect(canEditCharacter(member('u2'), joined, campaign)).toBe(false);
    expect(canEditCharacter(member('u2', true), joined, campaign)).toBe(true);
  });

  it('delete a character with its membership and history', () => {
    const rome = makeChronicle('st', 'Roma');
    const c = makeCharacter('u1', 'Lucrezia');
    store.campaign.join(rome.id, c.id);
    store.campaign.setTrack(c.id, 'vitae', 2, 'u1');
    store.campaign.deleteCharacter(c.id);
    expect(store.campaign.members(rome.id)).toEqual([]);
    expect(store.campaign.changes(c.id)).toEqual([]);
  });
});
