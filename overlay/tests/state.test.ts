import { describe, expect, it } from 'vitest';
import {
  addCharacter,
  adjust,
  emptyState,
  removeCharacter,
  restore,
  setSect,
  setValue,
  slugify,
  StateError,
  updateCharacter,
} from '../src/state.ts';

function withLucrezia() {
  const state = emptyState();
  addCharacter(state, {
    name: 'Lucrezia',
    clan: 'toreador',
    stamina: 2,
    vitaeMax: 10,
    willpowerMax: 5,
  });
  return state;
}

describe('characters', () => {
  it('starts at full trackers with Health = Stamina + 5 and Humanity 6', () => {
    const c = withLucrezia().characters[0];
    expect(c).toMatchObject({
      id: 'lucrezia',
      health: { max: 7, current: 7, baneful: 0 },
      vitae: { max: 10, current: 10 },
      willpower: { max: 5, current: 5 },
      humanity: { rank: 6, violations: 0 },
      hunger: 0,
    });
  });

  it('makes URL-safe ids and refuses duplicates and the Storyteller name', () => {
    expect(slugify('Niña Dell’Àngelo')).toBe('nina-dell-angelo');
    const state = withLucrezia();
    expect(() => addCharacter(state, { name: 'lucrezia', clan: 'brujah' })).toThrow(StateError);
    expect(() => addCharacter(state, { name: 'Storyteller', clan: 'brujah' })).toThrow(StateError);
    expect(() => addCharacter(state, { name: '!!!', clan: 'brujah' })).toThrow(StateError);
  });

  it('rejects unknown clans and over-long names', () => {
    const state = emptyState();
    expect(() => addCharacter(state, { name: 'X', clan: 'gargoyle' })).toThrow(StateError);
    expect(() => addCharacter(state, { name: 'x'.repeat(33), clan: 'brujah' })).toThrow(StateError);
  });

  it('keeps the id when the name changes, and removes characters', () => {
    const state = withLucrezia();
    updateCharacter(state, 'lucrezia', { name: 'Lucrezia Borgia', clan: 'ventrue' });
    expect(state.characters[0]).toMatchObject({
      id: 'lucrezia',
      name: 'Lucrezia Borgia',
      clan: 'ventrue',
    });
    removeCharacter(state, 'lucrezia');
    expect(state.characters).toHaveLength(0);
  });
});

describe('trackers', () => {
  it('clamps values and reports whether anything changed', () => {
    const state = withLucrezia();
    expect(adjust(state, 'lucrezia', 'health', 'current', 1)).toBe(false);
    expect(adjust(state, 'lucrezia', 'health', 'current', -2)).toBe(true);
    expect(state.characters[0]?.health.current).toBe(5);
    setValue(state, 'lucrezia', 'hunger', 'current', 9);
    expect(state.characters[0]?.hunger).toBe(5);
    setValue(state, null, 'masquerade', 'current', 12);
    expect(state.chronicle.masquerade).toBe(10);
  });

  it('crosses out Health boxes with baneful damage', () => {
    const state = withLucrezia();
    adjust(state, 'lucrezia', 'health', 'baneful', 2);
    expect(state.characters[0]?.health).toEqual({ max: 7, current: 5, baneful: 2 });
    adjust(state, 'lucrezia', 'health', 'current', 3);
    expect(state.characters[0]?.health.current).toBe(5);
  });

  it('keeps Humanity rank and violations within 10 boxes', () => {
    const state = withLucrezia();
    adjust(state, 'lucrezia', 'humanity', 'violations', 6);
    expect(state.characters[0]?.humanity).toEqual({ rank: 6, violations: 4 });
    adjust(state, 'lucrezia', 'humanity', 'current', 2);
    expect(state.characters[0]?.humanity).toEqual({ rank: 8, violations: 2 });
  });

  it('lowers current values when a maximum drops', () => {
    const state = withLucrezia();
    setValue(state, 'lucrezia', 'willpower', 'max', 3);
    expect(state.characters[0]?.willpower).toEqual({ max: 3, current: 3 });
  });

  it('rejects unknown tracks, fields, characters and non-integers', () => {
    const state = withLucrezia();
    expect(() => adjust(state, 'lucrezia', 'blood', 'current', 1)).toThrow(StateError);
    expect(() => adjust(state, 'lucrezia', 'hunger', 'max', 1)).toThrow(StateError);
    expect(() => adjust(state, 'nobody', 'health', 'current', 1)).toThrow(StateError);
    expect(() => adjust(state, 'lucrezia', 'health', 'current', '1.5')).toThrow(StateError);
    expect(() => adjust(state, 'lucrezia', 'health', 'current', 1000)).toThrow(StateError);
    expect(() => setSect(state, 'inconnu')).toThrow(StateError);
  });
});

describe('restore', () => {
  it('round-trips a saved state', () => {
    const state = withLucrezia();
    adjust(state, 'lucrezia', 'health', 'baneful', 1);
    adjust(state, 'lucrezia', 'hunger', 'current', 3);
    setValue(state, null, 'masquerade', 'current', 4);
    setSect(state, 'anarch');
    expect(restore(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it('drops malformed data instead of trusting it', () => {
    const state = restore({
      characters: [
        { name: '<img onerror=x>', clan: 'nope' },
        { name: 'Ok', clan: 'gangrel', hunger: 99 },
      ],
      chronicle: { masquerade: 'lots', sect: 'x' },
    });
    expect(state.characters.map((c) => c.id)).toEqual(['ok']);
    expect(state.characters[0]?.hunger).toBe(5);
    expect(state.chronicle).toEqual({ masquerade: 0, sect: 'camarilla' });
    expect(restore(null)).toEqual(emptyState());
  });
});
