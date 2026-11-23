import { brujah } from './fixtures/sheets.js';
import { describe, expect, it } from 'vitest';
import { LIFEPATHS, MERITS, SIRES } from '../src/game/alpha2/background.js';
import { ALPHA2_CLANS, CLAN_INFO, CLAN_TRAITS } from '../src/game/alpha2/clans.js';
import { DISCIPLINES, POWERS } from '../src/game/alpha2/disciplines.js';
import { unmet } from '../src/game/alpha2/prereq.js';
import { TIER_RULES } from '../src/game/alpha2/tiers.js';
import {
  clanOptions,
  clanTraitOptions,
  disciplineRoom,
  emptyDraft,
  evaluate,
  lifepathOptions,
  meritOptions,
  powerOptions,
  ranksFit,
  resourceTotals,
  specialtySlots,
  trackerValues,
  type SheetDraft,
} from '../src/game/creation.js';

const codes = (d: SheetDraft, severity?: string) =>
  evaluate(d)
    .issues.filter((i) => !severity || i.severity === severity)
    .map((i) => i.code);

describe('catalogue', () => {
  it('has 8 powers per Discipline (3/3/2 by rank), none for Blood Sorcery and Necromancy', () => {
    for (const disc of DISCIPLINES) {
      const ranks = POWERS.filter((p) => p.discipline === disc).map((p) => p.rank);
      if (disc === 'bloodsorcery' || disc === 'necromancy') expect(ranks).toEqual([]);
      else expect([1, 2, 3].map((r) => ranks.filter((x) => x === r).length)).toEqual([3, 3, 2]);
    }
    expect(new Set(POWERS.map((p) => p.id)).size).toBe(POWERS.length);
  });

  it('has five Neonate and three Ancilla traits for each of the 8 complete clans', () => {
    const complete = ALPHA2_CLANS.filter((c) => CLAN_INFO[c].complete);
    expect(complete).toEqual([
      'brujah',
      'gangrel',
      'lasombra',
      'ministry',
      'nosferatu',
      'toreador',
      'tzimisce',
      'ventrue',
    ]);
    for (const clan of complete) {
      const tiers = CLAN_TRAITS.filter((t) => t.clan === clan).map((t) => t.prereq.minTier);
      expect(tiers.filter((t) => t === 'neonate')).toHaveLength(5);
      expect(tiers.filter((t) => t === 'ancilla')).toHaveLength(3);
    }
    expect(new Set(CLAN_TRAITS.map((t) => t.id)).size).toBe(CLAN_TRAITS.length);
  });

  it('gives every lifepath 5 Skills and 3 Resources, and every sire three Disciplines', () => {
    expect(LIFEPATHS).toHaveLength(32);
    for (const lp of LIFEPATHS) {
      expect(lp.skills).toHaveLength(5);
      expect(lp.resources).toHaveLength(3);
    }
    for (const s of SIRES) expect(s.disciplines).toHaveLength(s.id === 'brood-child' ? 0 : 3);
    expect(SIRES.find((s) => s.id === 'feral')?.disciplines).toEqual([
      'animalism',
      'celerity',
      'potence',
    ]);
    expect(MERITS).toHaveLength(23);
  });

  it('matches the Dot Distribution table', () => {
    expect(TIER_RULES.neonate).toMatchObject({
      lifepaths: 2,
      attributes: [7, 5, 3],
      clanDisciplineDots: 3,
      powers: 4,
      merits: 1,
      clanTraits: 2,
      extraSkills: 8,
      extraResources: 3,
    });
    expect(TIER_RULES.elder).toMatchObject({
      lifepaths: 4,
      attributes: [9, 7, 5],
      clanDisciplineDots: 7,
      extraDisciplineDots: 2,
      powers: 10,
    });
  });
});

describe('evaluate', () => {
  it('accepts a complete neonate built by the rules', () => {
    const ev = evaluate(brujah());
    expect(ev.issues.filter((i) => i.severity !== 'hint')).toEqual([]);
    expect(ev.complete).toBe(true);
    expect(ev.derived).toEqual({
      generationModifier: 1,
      health: 8,
      vitae: 10,
      willpower: 5,
      humanity: 6,
    });
    expect(trackerValues(brujah())).toEqual({
      tier: 'neonate',
      stamina: 3,
      composure: 3,
      resolve: 2,
      humanity: 6,
    });
  });

  it('lists what is still to do on an empty draft', () => {
    const todo = codes(emptyDraft('neonate'), 'todo');
    expect(todo).toEqual(
      expect.arrayContaining([
        'clan-missing',
        'sire-missing',
        'lifepaths-missing',
        'priority-missing',
        'name-missing',
        'flaws-missing',
      ]),
    );
    expect(evaluate(emptyDraft('neonate')).complete).toBe(false);
  });

  it('refuses incomplete clans and asks Tzimisce for its third Discipline', () => {
    expect(codes({ ...brujah(), clan: 'tremere' })).toContain('clan-incomplete');
    expect(codes({ ...brujah(), clan: 'tzimisce' })).toContain('clan-choice-missing');
  });

  it('keeps sire Disciplines to the sire’s list', () => {
    expect(codes({ ...brujah(), sireDiscipline: 'auspex' })).toContain(
      'sire-discipline-not-allowed',
    );
  });

  it('keeps lifepaths within the tier', () => {
    const d = brujah();
    d.lifepaths[1] = {
      id: 'sheriff',
      skills: { awareness: 2, investigation: 2, survival: 1 },
      resources: [1, 1, 1],
    };
    expect(codes(d)).toContain('lifepath-tier');
    expect(lifepathOptions(emptyDraft('neonate')).filter((o) => o.available)).toHaveLength(26);
    expect(lifepathOptions(emptyDraft('ancilla')).filter((o) => o.available)).toHaveLength(32);
  });

  it('puts lifepath dots only in that lifepath’s Skills, at most 5', () => {
    const d = brujah();
    d.lifepaths[0]!.skills = { athletics: 2, fighting: 2, subterfuge: 1, knowledge: 1 };
    expect(codes(d)).toEqual(
      expect.arrayContaining(['skill-not-in-lifepath', 'lifepath-skills-over']),
    );
  });

  it('caps Skills at 3 for neonates', () => {
    const d = brujah();
    d.extraSkills = { athletics: 2, persuasion: 3, sabotage: 2, survival: 1 };
    expect(evaluate(d).issues).toContainEqual(
      expect.objectContaining({ code: 'skill-max', target: 'athletics', value: 4, limit: 3 }),
    );
  });

  it('spends Attribute dots by priority, on top of the free dot', () => {
    const d = { ...brujah(), attributePriority: ['mental', 'social', 'physical'] as const };
    expect(codes(d)).toEqual(expect.arrayContaining(['attributes-over', 'attributes-left']));
    expect(codes({ ...brujah(), attributes: { ...brujah().attributes, strength: 6 } })).toContain(
      'attribute-max',
    );
  });

  it('lets only ancillae and elders buy Disciplines outside the clan', () => {
    const neonate = {
      ...brujah(),
      disciplines: { celerity: 1, potence: 1, presence: 1, auspex: 1 },
      powers: ['rapid-reflexes', 'bull-rush', 'awe', 'analyze'],
    };
    expect(codes(neonate)).toContain('out-of-clan');
    const ancilla = { ...neonate, tier: 'ancilla' as const };
    expect(codes(ancilla)).not.toContain('out-of-clan');
    expect(evaluate(ancilla).pools.outOfClan).toEqual({ spent: 1, budget: 1 });
  });

  it('caps a Discipline at the starting limit', () => {
    const d = { ...brujah(), disciplines: { potence: 4, presence: 1 } };
    expect(codes(d)).toContain('discipline-max');
  });

  it('checks powers against the dots of their Discipline', () => {
    expect(ranksFit([1, 1, 3], 3)).toBe(true);
    expect(ranksFit([1, 2, 2], 3)).toBe(true);
    expect(ranksFit([2, 2, 2], 3)).toBe(false);
    expect(ranksFit([2], 1)).toBe(false);
    expect(ranksFit([2], 2)).toBe(true);
    const d = { ...brujah(), powers: ['rapid-reflexes', 'bone-breaker', 'earthshock', 'awe'] };
    expect(codes(d)).toContain('powers-rank');
  });

  it('enforces trait and merit prerequisites', () => {
    const d = {
      ...brujah(),
      clanTraits: ['spark-of-rage', 'combat-reflexes'],
      merits: ['prowess'],
    };
    d.disciplines = { celerity: 2, potence: 1, presence: 1 };
    d.powers = ['rapid-reflexes', 'blink', 'bull-rush', 'awe'];
    const issues = evaluate(d)
      .issues.filter((i) => i.code === 'prereq')
      .map((i) => i.target);
    expect(issues).toEqual(['combat-reflexes', 'prowess']);
    expect(codes({ ...brujah(), clanTraits: ['obedience', 'wrestler'] })).toContain('other-clan');
  });

  it('allows one specialty more when two lifepaths feed the same Skill', () => {
    const d = brujah();
    d.lifepaths[1] = {
      id: 'conniver',
      skills: { awareness: 2, subterfuge: 2, sabotage: 1 },
      resources: [1, 1, 1],
    };
    expect(specialtySlots(d, 'subterfuge')).toBe(3);
    expect(specialtySlots(d, 'fighting')).toBe(1);
    expect(specialtySlots(d, 'medicine')).toBe(1);
    expect(specialtySlots(d, 'craft')).toBe(0);
  });

  it('lets a young neonate take one lifepath with 9 Skill and 5 Resource dots', () => {
    const d = { ...brujah(), young: true };
    d.lifepaths = [
      {
        id: 'criminal',
        skills: { athletics: 3, fighting: 3, subterfuge: 3 },
        resources: [2, 2, 1],
      },
    ];
    const ev = evaluate(d);
    expect(ev.pools.lifepathSkills).toEqual([{ spent: 9, budget: 9 }]);
    expect(ev.pools.lifepathResources).toEqual([{ spent: 5, budget: 5 }]);
    expect(codes(d)).not.toContain('lifepaths-missing');
    expect(codes({ ...d, tier: 'ancilla' })).toContain('young-not-allowed');
  });

  it('adds up the same Resource from two sources', () => {
    const d = brujah();
    const totals = resourceTotals(d);
    expect(totals.get('mask:')).toBe(2);
    d.extraResources = [{ kind: 'mask', detail: '', dots: 3 }];
    d.lifepaths[0]!.resources = [1, 1, 1];
    d.lifepaths[1]!.resources = [0, 0, 3];
    expect(codes(d)).toContain('resource-max');
  });

  it('flags choices that need the Storyteller', () => {
    const d = {
      ...brujah(),
      sire: 'brood-child',
      sireDiscipline: 'presence' as const,
      path: 'beast',
    };
    expect(evaluate(d).approvals.map((a) => a.code)).toEqual(['brood-child', 'path']);
    expect(codes(d)).toContain('broodmate-missing');
  });

  it('needs one flaw per generation modifier', () => {
    expect(codes({ ...brujah(), tier: 'elder', flaws: [] })).toContain('flaws-missing');
  });
});

describe('options', () => {
  it('opens only the eight complete clans', () => {
    expect(clanOptions().filter((o) => o.available)).toHaveLength(8);
    expect(clanOptions().find((o) => o.id === 'malkavian')?.reasons).toEqual([
      { kind: 'incomplete' },
    ]);
  });

  it('explains why a trait or merit is locked', () => {
    const d = { ...emptyDraft('neonate'), clan: 'ventrue' as const, disciplines: { presence: 1 } };
    const traits = Object.fromEntries(clanTraitOptions(d).map((o) => [o.id, o]));
    expect(traits['unwavering-devotion']!.available).toBe(true);
    expect(traits['obedience']!.reasons).toEqual([
      { kind: 'dots', anyOf: [{ discipline: 'dominate', dots: 1 }] },
    ]);
    expect(traits['commanding-leader']!.reasons[0]).toEqual({ kind: 'tier', min: 'ancilla' });
    expect(traits['rarefied-smell']!.available).toBe(true);
    const merits = Object.fromEntries(meritOptions(d).map((o) => [o.id, o]));
    expect(merits['enchanting-presence']!.reasons).toEqual([
      { kind: 'dots', anyOf: [{ discipline: 'presence', dots: 2 }] },
    ]);
    expect(unmet({ creatures: ['vampire'] }, { tier: 'duskborn', dots: {} })).toEqual([
      { kind: 'creature', allowed: ['vampire'] },
    ]);
  });

  it('locks merits once the budget is spent', () => {
    const locked = meritOptions(brujah()).filter((o) => o.reasons.some((r) => r.kind === 'budget'));
    expect(locked.length).toBeGreaterThan(0);
    expect(meritOptions(brujah()).find((o) => o.id === 'might')?.available).toBe(true);
  });

  it('offers powers up to the dots in the Discipline', () => {
    const d = { ...brujah(), powers: ['rapid-reflexes', 'awe'] };
    const potence = Object.fromEntries(powerOptions(d, 'potence').map((o) => [o.id, o]));
    expect(potence['bull-rush']!.available).toBe(true);
    expect(potence['bone-breaker']!.available).toBe(true);
    expect(potence['strike-true']!.reasons).toEqual([{ kind: 'rank', rank: 3, dots: 2 }]);
    const two = { ...d, powers: [...d.powers, 'bone-breaker'] };
    expect(
      Object.fromEntries(powerOptions(two, 'potence').map((o) => [o.id, o]))['earthshock']!.reasons,
    ).toEqual([{ kind: 'budget' }]);
  });

  it('shows how far each Discipline can still grow', () => {
    const d = { ...brujah(), disciplines: { presence: 1 } };
    const room = Object.fromEntries(disciplineRoom(d).map((r) => [r.discipline, r]));
    expect(room.potence).toMatchObject({ inClan: true, dots: 0, max: 3 });
    expect(room.presence).toMatchObject({ dots: 1, max: 3 });
    expect(room.auspex).toBeUndefined();
  });
});
