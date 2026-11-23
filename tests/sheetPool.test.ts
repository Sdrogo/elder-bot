import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { newCharacter } from '../src/game/character.js';
import {
  attributeChoices,
  buildSheetPool,
  checkSurge,
  decodeSurge,
  decodeTrait,
  encodeTrait,
  recipe,
  secondChoices,
  specialtyChoices,
  decodeSpecialty,
  surgeChoices,
  type SheetPool,
} from '../src/game/sheetPool.js';
import { Store } from '../src/state/store.js';
import { brujah } from './fixtures/sheets.js';

const sheet = () => ({ ...brujah(), specialties: { fighting: ['Hand-to-Hand'] } });
const fine = { health: 8, willpower: 5 };
const pool = (
  input: Omit<Parameters<typeof buildSheetPool>[0], 'sheet' | 'values'>,
  values = fine,
) => buildSheetPool({ sheet: sheet(), values, ...input }) as SheetPool;

describe('buildSheetPool', () => {
  it('adds an Attribute and a Skill, plus one die for a specialty', () => {
    const plain = pool({
      attribute: { kind: 'attr', id: 'dexterity' },
      second: { kind: 'skill', id: 'fighting' },
    });
    expect(plain.dice).toBe(5);
    const special = pool({
      attribute: { kind: 'attr', id: 'dexterity' },
      second: { kind: 'skill', id: 'fighting', specialty: 0 },
    });
    expect(special.dice).toBe(6);
    expect(recipe(special)).toBe('Dexterity 3 + Fighting 2 + Hand-to-Hand 1 = 6');
  });

  it('builds a Power test from the power alone, with its own Attribute', () => {
    const p = pool({ second: { kind: 'power', id: 'bull-rush' } });
    expect(recipe(p)).toBe('Strength 4 + Potence 2 = 6');
    expect(p.powerAttribute).toBeUndefined();
    const other = pool({
      attribute: { kind: 'attr', id: 'dexterity' },
      second: { kind: 'power', id: 'bull-rush' },
    });
    expect([other.dice, other.powerAttribute]).toEqual([5, 'strength']);
  });

  it('takes two Attributes, a Discipline or a lifepath worth 2', () => {
    expect(
      pool({ attribute: { kind: 'attr', id: 'dexterity' }, second: { kind: 'attr', id: 'wits' } })
        .dice,
    ).toBe(5);
    expect(
      pool({ attribute: { kind: 'attr', id: 'strength' }, second: { kind: 'disc', id: 'potence' } })
        .dice,
    ).toBe(6);
    const life = pool({
      attribute: { kind: 'attr', id: 'wits' },
      second: { kind: 'life', id: 'criminal' },
    });
    expect(recipe(life)).toBe('Wits 2 + Lifepath: Criminal 2 = 4');
  });

  it('says what is missing or wrong', () => {
    const issue = (input: Parameters<typeof pool>[0]) =>
      buildSheetPool({ sheet: sheet(), values: fine, ...input });
    expect(issue({ second: { kind: 'skill', id: 'fighting' } })).toBe('need-attribute');
    expect(issue({ attribute: { kind: 'attr', id: 'wits' } })).toBe('need-second');
    expect(
      issue({ attribute: { kind: 'attr', id: 'wits' }, second: { kind: 'attr', id: 'wits' } }),
    ).toBe('same-attribute');
    expect(issue({ second: { kind: 'power', id: 'awe-not-known' } })).toBe('no-power');
    expect(
      issue({ attribute: { kind: 'attr', id: 'wits' }, second: { kind: 'disc', id: 'auspex' } }),
    ).toBe('no-discipline');
    expect(
      issue({
        attribute: { kind: 'attr', id: 'wits' },
        second: { kind: 'skill', id: 'craft', specialty: 0 },
      }),
    ).toBe('no-specialty');
    expect(
      issue({ attribute: { kind: 'attr', id: 'wits' }, second: { kind: 'life', id: 'academic' } }),
    ).toBe('unknown-trait');
  });

  it('applies Impairment from empty Health and Willpower, -2 per Attribute', () => {
    const hurt = pool(
      { attribute: { kind: 'attr', id: 'dexterity' }, second: { kind: 'skill', id: 'fighting' } },
      { health: 0, willpower: 5 },
    );
    expect([hurt.dice, hurt.impairment, hurt.impaired]).toEqual([3, 2, ['dexterity']]);
    const both = pool(
      { attribute: { kind: 'attr', id: 'dexterity' }, second: { kind: 'attr', id: 'wits' } },
      { health: 0, willpower: 0 },
    );
    expect([both.dice, both.impairment]).toEqual([1, 4]);
    const social = pool(
      { attribute: { kind: 'attr', id: 'dexterity' }, second: { kind: 'skill', id: 'fighting' } },
      { health: 5, willpower: 0 },
    );
    expect(social.impairment).toBe(0);
  });

  it('counts active Blood Surges on Attributes and Disciplines', () => {
    const p = pool({
      second: { kind: 'power', id: 'bull-rush' },
      surges: { 'attr:strength': 1, 'disc:potence': 1 },
    });
    expect(recipe(p)).toBe('Strength 4 (+1 Blood Surge) + Potence 2 (+1 Blood Surge) = 8');
  });
});

describe('Blood Surge', () => {
  const values = { tier: 'neonate' as const, vitae: 5 };

  it('costs 1 Vitae per Attribute dot and 2 per Discipline dot', () => {
    expect(checkSurge(sheet(), values, {}, { key: 'attr:dexterity', dots: 2 })).toMatchObject({
      cost: 2,
    });
    expect(checkSurge(sheet(), values, {}, { key: 'disc:potence', dots: 1 })).toMatchObject({
      cost: 2,
    });
    expect(checkSurge(sheet(), { ...values, vitae: 1 }, {}, { key: 'disc:potence', dots: 1 })).toBe(
      'surge-vitae',
    );
  });

  it('keeps to the tier limits and needs a dot in the Discipline', () => {
    expect(checkSurge(sheet(), values, {}, { key: 'attr:dexterity', dots: 3 })).toBe('surge-limit');
    expect(
      checkSurge(sheet(), values, { 'attr:dexterity': 2 }, { key: 'attr:dexterity', dots: 1 }),
    ).toBe('surge-limit');
    expect(
      checkSurge(sheet(), { tier: 'ancilla', vitae: 9 }, {}, { key: 'attr:dexterity', dots: 3 }),
    ).toMatchObject({ cost: 3 });
    // Neonate Discipline maximum is 5: Potence 2 can go up by 3 at most.
    expect(
      checkSurge(sheet(), { ...values, vitae: 10 }, {}, { key: 'disc:potence', dots: 4 }),
    ).toBe('surge-limit');
    expect(checkSurge(sheet(), values, {}, { key: 'disc:auspex', dots: 1 })).toBe(
      'surge-no-discipline',
    );
  });

  it('adds up on the same trait', () => {
    const check = checkSurge(
      sheet(),
      values,
      { 'attr:dexterity': 1 },
      { key: 'attr:dexterity', dots: 1 },
    );
    expect(check).toMatchObject({ cost: 1, surges: { 'attr:dexterity': 2 } });
  });

  it("lists only what the Vitae and the limits allow, the roll's traits first", () => {
    const list = surgeChoices(sheet(), { tier: 'neonate', vitae: 2 }, {}, ['disc:potence']);
    expect(list[0]).toEqual({ name: 'Potence +1 (2 Vitae)', value: 'disc:potence:1' });
    expect(list.some((c) => c.value === 'attr:strength:2')).toBe(true);
    expect(list.some((c) => c.value === 'attr:strength:3')).toBe(false);
  });
});

describe('choices', () => {
  it('show numbers, specialties and whole Power tests', () => {
    const attrs = attributeChoices(sheet(), { health: 0, willpower: 5 });
    expect(attrs[0]).toEqual({ name: 'Strength 4 (−2 Impaired)', value: 'attr:strength' });
    const names = secondChoices(sheet(), fine).map((c) => c.name);
    expect(names).toContain('Fighting 2 (Hand-to-Hand)');
    expect(names.filter((n) => n.startsWith('Fighting'))).toHaveLength(1);
    expect(names).toContain('Bull Rush (Strength + Potence = 6)');
    expect(names).toContain('Lifepath: Criminal 2');
    expect(secondChoices(sheet(), fine, {}, 'wits').some((c) => c.value === 'attr:wits')).toBe(
      false,
    );
  });

  it('list the specialties of the Skill in with, and nothing else', () => {
    expect(specialtyChoices(sheet(), { kind: 'skill', id: 'fighting' })).toEqual([
      { name: 'Hand-to-Hand +1', value: '0' },
    ]);
    expect(specialtyChoices(sheet(), { kind: 'skill', id: 'craft' })).toEqual([]);
    expect(specialtyChoices(sheet(), { kind: 'disc', id: 'potence' })).toEqual([]);
    expect(decodeSpecialty('0')).toBe(0);
    expect(decodeSpecialty('Hand')).toBeUndefined();
  });

  it('round-trip their values', () => {
    for (const c of secondChoices(sheet(), fine))
      expect(encodeTrait(decodeTrait(c.value)!)).toBe(c.value);
    expect(decodeTrait('skill:nope')).toBeUndefined();
    expect(decodeTrait('none')).toBeUndefined();
    expect(decodeSurge('attr:strength:2')).toEqual({ key: 'attr:strength', dots: 2 });
    expect(decodeSurge('attr:strength:0')).toBeUndefined();
  });
});

describe('stored surges', () => {
  let store: Store;
  beforeEach(() => {
    store = new Store(':memory:');
  });
  afterEach(() => store.close());

  it('last until cleared, the end of the session or three hours', () => {
    const c = store.campaign.createCharacter({
      guildId: 'g1',
      ownerId: 'u1',
      name: 'Nico',
      clan: 'brujah',
      values: newCharacter({ tier: 'neonate', stamina: 3, composure: 3, resolve: 2 }),
    });
    if (typeof c !== 'object') throw new Error(c);
    const { campaign } = store;
    campaign.setSurges(c.id, { 'attr:strength': 1 }, 1000);
    expect(campaign.getSurges(c.id, 2000)).toEqual({ 'attr:strength': 1 });
    expect(campaign.getSurges(c.id, 1000 + 3 * 60 * 60 * 1000 + 1)).toEqual({});

    const chronicle = campaign.createChronicle({
      guildId: 'g1',
      storytellerId: 'st',
      name: 'Roma',
      sect: 'camarilla',
    });
    if (typeof chronicle !== 'object') throw new Error(chronicle);
    campaign.join(chronicle.id, c.id);
    campaign.bindChannel(chronicle.id, 'c1');
    campaign.setSurges(c.id, { 'disc:potence': 1 });
    store.endSession('c1');
    expect(campaign.getSurges(c.id)).toEqual({});
  });
});

describe('/elder contest options', () => {
  it('read a typed number as a tie-break and a picked trait as a sheet pool', async () => {
    const { tieNumber, wantsSheet } = await import('../src/commands/contest.js');
    expect(tieNumber('3')).toBe(3);
    expect(tieNumber('attr:wits')).toBeUndefined();
    expect(tieNumber(null)).toBeUndefined();
    expect(wantsSheet('3', null)).toBe(false);
    expect(wantsSheet('attr:wits', null)).toBe(true);
    expect(wantsSheet(null, 'skill:fighting')).toBe(true);
    expect(wantsSheet(null, null, 'attr:strength:1')).toBe(true);
  });
});
