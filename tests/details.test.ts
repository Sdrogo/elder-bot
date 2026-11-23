import { describe, expect, it } from 'vitest';
import { LIFEPATHS, MERITS } from '../src/game/alpha2/background.js';
import {
  DISCIPLINE_DETAILS,
  LIFEPATH_DETAILS,
  MERIT_DETAILS,
  POWER_DETAILS,
} from '../src/game/alpha2/details.js';
import { DISCIPLINES, POWERS } from '../src/game/alpha2/disciplines.js';

describe('expanded details', () => {
  const cases: [string, string[], Record<string, string>][] = [
    ['lifepath', LIFEPATHS.map((l) => l.id), LIFEPATH_DETAILS],
    ['merit', MERITS.map((m) => m.id), MERIT_DETAILS],
    ['discipline', [...DISCIPLINES], DISCIPLINE_DETAILS],
    ['power', POWERS.map((p) => p.id), POWER_DETAILS],
  ];

  it.each(cases)('covers every %s and nothing else', (_, ids, details) => {
    expect(ids.filter((id) => !details[id]?.trim())).toEqual([]);
    expect(Object.keys(details).filter((id) => !ids.includes(id))).toEqual([]);
  });
});
