import { describe, expect, it } from 'vitest';
import {
  advanceOptions,
  advanceReasons,
  applyAdvances,
  costOf,
  learnablePowers,
  parseAdvance,
} from '../src/game/advancement.js';
import { skillDots } from '../src/game/creation.js';
import { brujah } from './fixtures/sheets.js';

describe('advancement', () => {
  const d = brujah();

  it('prices every purchase with the Experience Costs table', () => {
    expect(costOf(d, { kind: 'attribute', id: 'wits' })).toBe(20);
    expect(costOf(d, { kind: 'skill', id: 'persuasion' })).toBe(10);
    expect(costOf(d, { kind: 'specialty', skill: 'persuasion', name: 'x' })).toBe(5);
    expect(costOf(d, { kind: 'merit', id: 'might' })).toBe(8);
    expect(costOf(d, { kind: 'discipline', id: 'potence' })).toBe(15);
    expect(costOf(d, { kind: 'discipline', id: 'auspex' })).toBe(20);
    expect(costOf(d, { kind: 'power', id: 'awe' })).toBe(8);
  });

  it('applies purchases on top of the creation sheet without touching it', () => {
    const after = applyAdvances(d, [
      { kind: 'attribute', id: 'wits' },
      { kind: 'skill', id: 'persuasion' },
      { kind: 'specialty', skill: 'persuasion', name: 'Haggling' },
    ]);
    expect(after.attributes.wits).toBe(3);
    expect(skillDots(after, 'persuasion')).toBe(skillDots(d, 'persuasion') + 1);
    expect(after.specialties.persuasion).toContain('Haggling');
    expect(d.attributes.wits).toBe(2);
  });

  it('keeps dots buying in order, to the tier maximum', () => {
    const maxed = { ...d, attributes: { ...d.attributes, strength: 5 } };
    expect(advanceReasons(maxed, { kind: 'attribute', id: 'strength' })).not.toEqual([]);
    expect(advanceReasons(d, { kind: 'attribute', id: 'strength' })).toEqual([]);
    const high = applyAdvances(d, [
      { kind: 'skill', id: 'persuasion' },
      { kind: 'skill', id: 'persuasion' },
    ]);
    expect(skillDots(high, 'persuasion')).toBe(5);
    expect(advanceReasons(high, { kind: 'skill', id: 'persuasion' })).not.toEqual([]);
  });

  it('gives a free power with a new Discipline dot and asks for it', () => {
    expect(advanceReasons(d, { kind: 'discipline', id: 'celerity' })).not.toEqual([]);
    const offer = learnablePowers(d, 'celerity', 2);
    expect(offer.length).toBeGreaterThan(0);
    const buy = { kind: 'discipline', id: 'celerity', power: offer[0]! } as const;
    expect(advanceReasons(d, buy)).toEqual([]);
    const after = applyAdvances(d, [buy]);
    expect(after.disciplines.celerity).toBe(2);
    expect(after.powers).toContain(offer[0]);
  });

  it('closes out-of-clan Disciplines (Storyteller) and what is already owned', () => {
    expect(advanceReasons(d, { kind: 'discipline', id: 'auspex' })).toEqual([
      { kind: 'storyteller' },
    ]);
    expect(advanceReasons(d, { kind: 'merit', id: 'might' })).toEqual([{ kind: 'taken' }]);
    expect(advanceReasons(d, { kind: 'power', id: 'awe' })).toEqual([{ kind: 'taken' }]);
    expect(advanceOptions(d).length).toBeGreaterThan(20);
  });

  it('parses only well-formed purchases', () => {
    expect(parseAdvance({ kind: 'skill', id: 'persuasion' })).toEqual({
      kind: 'skill',
      id: 'persuasion',
    });
    expect(parseAdvance({ kind: 'skill', id: 'nope' })).toBeUndefined();
    expect(parseAdvance({ kind: 'resource', id: 'x' })).toBeUndefined();
    expect(parseAdvance({ kind: 'specialty', skill: 'persuasion', name: '  ' })).toBeUndefined();
    expect(parseAdvance('x')).toBeUndefined();
  });
});
