import { Locale as DiscordLocale, type LocalizationMap } from 'discord.js';
import type { Store } from '../state/store.js';
import { en, type MessageKey, type Messages } from './en.js';
import { it } from './it.js';

export type { MessageKey, Messages } from './en.js';

/** Languages the bot speaks. English is the default and the fallback. */
export type Locale = 'en' | 'it';

/** To add a language: write its catalog (a copy of en.ts) and register it here. */
const CATALOGS: Record<Locale, Messages> = { en, it };

export const LOCALES = Object.keys(CATALOGS) as Locale[];

/** Each language under its own name, for the /elder session language choices and replies. */
export const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', it: 'Italiano' };

/** Discord locale codes that map to each non-English language (descriptions in English are the default). */
const DISCORD_LOCALES: Record<Exclude<Locale, 'en'>, DiscordLocale[]> = {
  it: [DiscordLocale.Italian],
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value);
}

/** Maps a Discord locale ('it', 'en-US', 'en-GB', ...) to a bot language; anything else is English. */
export function resolveLocale(discordLocale?: string | null): Locale {
  const language = discordLocale?.toLowerCase().split('-')[0];
  return isLocale(language) ? language : 'en';
}

export type Params = Record<string, string | number>;

/** The message for `key` in `locale`, with `{name}` placeholders filled from `params`. */
export function t(locale: Locale, key: MessageKey, params: Params = {}): string {
  const text = CATALOGS[locale][key] ?? en[key];
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Keys that come as a `.one` / `.other` pair. */
export type PluralKey = {
  [K in MessageKey]: K extends `${infer Base}.one` ? Base : never;
}[MessageKey];

/** Count-dependent message: `key.one` for 1, `key.other` otherwise. `{count}` is filled in. */
export function tn(locale: Locale, key: PluralKey, count: number, params: Params = {}): string {
  const form = (count === 1 ? `${key}.one` : `${key}.other`) as MessageKey;
  return t(locale, form, { count, ...params });
}

/** Discord `description_localizations` (or choice `name_localizations`) for a key. */
export function localizations(key: MessageKey, params: Params = {}): LocalizationMap {
  const map: LocalizationMap = {};
  for (const locale of LOCALES) {
    if (locale === 'en') continue;
    for (const code of DISCORD_LOCALES[locale]) map[code] = t(locale, key, params);
  }
  return map;
}

interface Describable {
  setDescription(description: string): unknown;
  setDescriptionLocalizations(localizations: LocalizationMap | null): unknown;
}

/** Sets a slash command builder's English description and its translations. */
export function described<T extends Describable>(builder: T, key: MessageKey): T {
  builder.setDescription(t('en', key));
  builder.setDescriptionLocalizations(localizations(key));
  return builder;
}

/** A localized slash command choice. */
export function choice<V extends string | number>(key: MessageKey, value: V, params: Params = {}) {
  return { name: t('en', key, params), name_localizations: localizations(key, params), value };
}

/**
 * The language to answer an interaction in: the table's language if the Storyteller fixed one
 * with /elder session language, otherwise the user's Discord language.
 */
export function localeFor(
  interaction: { channelId: string | null; locale?: string | null },
  store: Pick<Store, 'getTableLocale'>,
): Locale {
  const stored = interaction.channelId ? store.getTableLocale(interaction.channelId) : undefined;
  return isLocale(stored) ? stored : resolveLocale(interaction.locale);
}
