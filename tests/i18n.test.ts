import type { ChatInputCommandInteraction } from 'discord.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { session } from '../src/commands/session.js';
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
    expect(t('it', 'session.language.set', { language: 'Italiano' })).toBe(
      'Lingua del tavolo: Italiano.',
    );
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

  /** A fake /elder session language interaction, enough for the command to run. */
  function languageCommand(value: string, userId = 'st', locale = 'en-US') {
    const replies: { embeds: { toJSON(): { description?: string } }[] }[] = [];
    const interaction = {
      channelId: 'c1',
      locale,
      user: { id: userId },
      memberPermissions: null,
      options: {
        getSubcommand: () => 'language',
        getString: () => value,
        getUser: () => null,
      },
      reply: async (message: (typeof replies)[number]) => {
        replies.push(message);
      },
    } as unknown as ChatInputCommandInteraction;
    return { interaction, replies };
  }

  it("beats the user's Discord language", () => {
    expect(localeFor({ channelId: 'c1', locale: 'it' }, store)).toBe('it');
    store.setTableLocale('c1', 'en');
    expect(localeFor({ channelId: 'c1', locale: 'it' }, store)).toBe('en');
    expect(localeFor({ channelId: 'c2', locale: 'it' }, store)).toBe('it');
  });

  it('is set by the Storyteller and cleared by auto', async () => {
    store.setStoryteller('c1', 'st');
    const set = languageCommand('it');
    await session.execute(set.interaction, { store });
    expect(store.getTableLocale('c1')).toBe('it');
    expect(set.replies[0]?.embeds[0]?.toJSON().description).toBe('Lingua del tavolo: Italiano.');
    expect(localeFor({ channelId: 'c1', locale: 'en-US' }, store)).toBe('it');

    const auto = languageCommand('auto');
    await session.execute(auto.interaction, { store });
    expect(store.getTableLocale('c1')).toBeUndefined();
    expect(localeFor({ channelId: 'c1', locale: 'en-US' }, store)).toBe('en');
  });

  it('can only be changed by the Storyteller', async () => {
    store.setStoryteller('c1', 'st');
    const other = languageCommand('it', 'player');
    await session.execute(other.interaction, { store });
    expect(store.getTableLocale('c1')).toBeUndefined();
  });

  it('is cleared when the session ends', () => {
    store.setTableLocale('c1', 'it');
    store.setTableLocale('c2', 'it');
    store.endSession('c1');
    expect(store.getTableLocale('c1')).toBeUndefined();
    expect(store.getTableLocale('c2')).toBe('it');
  });

  it('ignores an unknown stored value', () => {
    store.setTableLocale('c1', 'xx');
    expect(localeFor({ channelId: 'c1', locale: 'it' }, store)).toBe('it');
  });
});
