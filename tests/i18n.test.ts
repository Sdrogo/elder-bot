import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en.js';
import { LOCALES, localeFor, resolveLocale, t, tn } from '../src/i18n/index.js';
import { de } from '../src/i18n/de.js';
import { es } from '../src/i18n/es.js';
import { fr } from '../src/i18n/fr.js';
import { it as italian } from '../src/i18n/it.js';
import { Store } from '../src/state/store.js';

const CATALOGS = { en, it: italian, es, fr, de };

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
}

describe('catalogs', () => {
  it('cover every language', () => {
    expect(Object.keys(CATALOGS).sort()).toEqual([...LOCALES].sort());
  });

  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    it(`${locale} has exactly the English keys and placeholders`, () => {
      expect(Object.keys(catalog).sort()).toEqual(Object.keys(en).sort());
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(placeholders(catalog[key]), key).toEqual(placeholders(en[key]));
        expect(catalog[key].trim(), key).not.toBe('');
      }
    });
  }

  it('fills placeholders and picks the plural form', () => {
    expect(t('it', 'chronicle.busy', { name: 'Lucrezia' })).toContain('Lucrezia');
    expect(tn('en', 'dice.count', 1)).toBe('1 die');
    expect(tn('en', 'dice.count', 3)).toBe('3 dice');
    expect(tn('it', 'roll.successes', 1)).toBe('1 successo');
    expect(tn('it', 'roll.successes', 0)).toBe('0 successi');
  });
});

describe('resolveLocale', () => {
  it('maps Discord locales to a bot language, English by default', () => {
    expect(resolveLocale('it')).toBe('it');
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('en-GB')).toBe('en');
    expect(resolveLocale('es-ES')).toBe('es');
    expect(resolveLocale('es-419')).toBe('es');
    expect(resolveLocale('fr')).toBe('fr');
    expect(resolveLocale('de')).toBe('de');
    expect(resolveLocale('pt-BR')).toBe('en');
    expect(resolveLocale(undefined)).toBe('en');
    expect(resolveLocale(null)).toBe('en');
  });
});

describe('table language', () => {
  let store: Store;
  beforeEach(() => {
    store = new Store(':memory:');
  });
  afterEach(() => store.close());

  /** A Chronicle played in channel c1, with the language set on the panel. */
  function chronicleIn(channelId: string, locale?: string) {
    const c = store.campaign.createChronicle({
      guildId: 'g1',
      storytellerId: 'st',
      name: `Roma ${channelId}`,
      sect: 'camarilla',
    });
    if (typeof c !== 'object') throw new Error(c);
    store.bindChronicle(channelId, c.id);
    store.campaign.setChronicleLocale(c.id, locale);
    return c;
  }

  it("is the Chronicle's and beats the user's Discord language", () => {
    expect(localeFor({ channelId: 'c1', locale: 'it' }, store)).toBe('it');
    chronicleIn('c1', 'en');
    expect(localeFor({ channelId: 'c1', locale: 'it' }, store)).toBe('en');
    expect(localeFor({ channelId: 'c2', locale: 'it' }, store)).toBe('it');
  });

  it("follows each user's Discord with no language set", () => {
    const c = chronicleIn('c1', 'it');
    store.campaign.setChronicleLocale(c.id, undefined);
    expect(localeFor({ channelId: 'c1', locale: 'en-US' }, store)).toBe('en');
  });

  it('stays when the session ends', () => {
    chronicleIn('c1', 'it');
    store.endSession('c1');
    expect(store.getTableLocale('c1')).toBe('it');
  });

  it('ignores an unknown stored value', () => {
    chronicleIn('c1', 'xx');
    expect(localeFor({ channelId: 'c1', locale: 'it' }, store)).toBe('it');
  });
});
