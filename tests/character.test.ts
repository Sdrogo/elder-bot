import { describe, expect, it } from 'vitest';
import {
  cleanName,
  healthMax,
  hungerDice,
  newCharacter,
  setTrack,
  vitaeMax,
  willpowerMax,
  type Tier,
} from '../src/game/character.js';
import { decodeCampaignId, encodeCampaignId, type CampaignRef } from '../src/ui/sheet.js';

describe('character maxima', () => {
  it('follow Stamina, Composure + Resolve and the tier', () => {
    const c = newCharacter({ tier: 'neonate', stamina: 3, composure: 2, resolve: 4 });
    expect(healthMax(c)).toBe(8);
    expect(willpowerMax(c)).toBe(6);
    expect(vitaeMax(c)).toBe(10);
    expect(c).toMatchObject({ health: 8, vitae: 10, willpower: 6, humanity: 6, baneful: 0 });
  });

  it('give Vitae 5 / 10 / 15 / 20 by generation modifier', () => {
    const vitae = (tier: Tier) => vitaeMax({ tier });
    expect([vitae('ghoul'), vitae('duskborn'), vitae('neonate')]).toEqual([5, 10, 10]);
    expect([vitae('ancilla'), vitae('elder')]).toEqual([15, 20]);
  });
});

describe('Hunger Dice per Vitae (Player Packet p. 103)', () => {
  const table: [Tier, number[][]][] = [
    ['neonate', [[10], [9, 8], [7, 6], [5, 4], [3, 2], [1, 0]]],
    ['ancilla', [[15], [14, 13, 12], [11, 10, 9], [8, 7, 6], [5, 4, 3], [2, 1, 0]]],
    [
      'elder',
      [[20], [19, 18, 17, 16], [15, 14, 13, 12], [11, 10, 9, 8], [7, 6, 5, 4], [3, 2, 1, 0]],
    ],
  ];
  for (const [tier, rows] of table) {
    it(`matches the ${tier} row`, () => {
      rows.forEach((vitaes, hunger) => {
        for (const vitae of vitaes) expect(hungerDice({ tier, vitae }), `${vitae}`).toBe(hunger);
      });
    });
  }

  it('gives ghouls no Hunger dice', () => {
    expect(hungerDice({ tier: 'ghoul', vitae: 0 })).toBe(0);
  });
});

describe('setTrack', () => {
  const base = newCharacter({ tier: 'neonate', stamina: 2, composure: 2, resolve: 2 });

  it('clamps to the maxima', () => {
    expect(setTrack(base, 'vitae', 99).vitae).toBe(10);
    expect(setTrack(base, 'willpower', -3).willpower).toBe(0);
  });

  it('lets baneful damage push filled Health boxes out', () => {
    const hurt = setTrack(base, 'baneful', 3);
    expect(hurt.baneful).toBe(3);
    expect(hurt.health).toBe(4);
    expect(setTrack(hurt, 'health', 7).health).toBe(4);
  });

  it('keeps violations within the free Humanity boxes', () => {
    const c = setTrack(base, 'violations', 9);
    expect(c.violations).toBe(4);
    expect(setTrack(c, 'humanity', 8).violations).toBe(2);
  });
});

describe('cleanName', () => {
  it('trims and refuses empty, symbol-only or long names', () => {
    expect(cleanName('  Lucrezia ')).toBe('Lucrezia');
    expect(cleanName('   ')).toBeUndefined();
    expect(cleanName('***')).toBeUndefined();
    expect(cleanName('x'.repeat(33))).toBeUndefined();
  });
});

describe('campaign component ids', () => {
  it('survive a round trip', () => {
    const refs: CampaignRef[] = [
      { kind: 'adjust', characterId: 4, track: 'vitae', delta: -1 },
      { kind: 'delete', characterId: 4 },
      { kind: 'give', characterId: 4, fromId: '111', toId: '222', accept: true },
      { kind: 'pick', chronicleId: 2, userId: '333' },
      { kind: 'join', chronicleId: 2, userId: '333' },
    ];
    for (const ref of refs) {
      const id = encodeCampaignId(ref);
      expect(id.length).toBeLessThanOrEqual(100);
      expect(decodeCampaignId(id)).toEqual(ref);
    }
  });

  it('refuse tampered ids', () => {
    expect(decodeCampaignId('pc:adj:4:vitae:5')).toBeUndefined();
    expect(decodeCampaignId('pc:adj:4:hunger:1')).toBeUndefined();
    expect(decodeCampaignId('pc:adj:x:vitae:1')).toBeUndefined();
    expect(decodeCampaignId('chr:join:2:abc')).toBeUndefined();
  });
});
