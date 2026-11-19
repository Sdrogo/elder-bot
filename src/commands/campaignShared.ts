import {
  MessageFlags,
  type APIEmbedField,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { isAdmin } from '../auth/campaign.js';
import { CLAN_NAMES, hungerDice, vitaeMax } from '../game/character.js';
import { t, type Locale, type MessageKey } from '../i18n/index.js';
import type { Character, Chronicle } from '../state/campaign.js';
import type { Context } from './types.js';

/** Discord lists at most 25 autocomplete suggestions. */
const MAX_CHOICES = 25;

export async function replyEphemeral(
  interaction: ChatInputCommandInteraction,
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number> = {},
): Promise<void> {
  await interaction.reply({ content: t(locale, key, params), flags: MessageFlags.Ephemeral });
}

/** Characters and Chronicles belong to a server: these commands don't work in DMs. */
export async function guildOf(
  interaction: ChatInputCommandInteraction,
  locale: Locale,
): Promise<string | undefined> {
  if (interaction.guildId) return interaction.guildId;
  await replyEphemeral(interaction, locale, 'campaign.guildOnly');
  return undefined;
}

function matches(name: string, typed: string): boolean {
  return name.toLowerCase().includes(typed.trim().toLowerCase());
}

/**
 * Suggestions for a `character` option: the user's own characters and, unless `ownOnly`,
 * the characters in the Chronicles they run (all of the server's for an admin).
 */
export async function suggestCharacters(
  interaction: AutocompleteInteraction,
  { store }: Context,
  { ownOnly = false }: { ownOnly?: boolean } = {},
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return interaction.respond([]);
  const typed = String(interaction.options.getFocused());
  const { campaign } = store;
  const own = campaign.charactersOf(guildId, interaction.user.id);
  let others: Character[] = [];
  if (!ownOnly) {
    const storytellers = isAdmin(interaction)
      ? [...new Set(campaign.chronicles(guildId).map((c) => c.storytellerId))]
      : [interaction.user.id];
    others = storytellers
      .flatMap((id) => campaign.charactersRunBy(guildId, id))
      .filter((c) => c.ownerId !== interaction.user.id);
  }
  const choices = [...own, ...others]
    .filter((c) => matches(c.name, typed))
    .slice(0, MAX_CHOICES)
    .map((c) => ({ name: `${c.name} (${CLAN_NAMES[c.clan]})`.slice(0, 100), value: String(c.id) }));
  await interaction.respond(choices);
}

/** Suggestions for a `chronicle` option: the user's Chronicles (all of the server's for an admin). */
export async function suggestChronicles(
  interaction: AutocompleteInteraction,
  { store }: Context,
): Promise<void> {
  const guildId = interaction.guildId;
  if (!guildId) return interaction.respond([]);
  const typed = String(interaction.options.getFocused());
  const list = store.campaign.chronicles(
    guildId,
    isAdmin(interaction) ? undefined : interaction.user.id,
  );
  await interaction.respond(
    list
      .filter((c) => matches(c.name, typed))
      .slice(0, MAX_CHOICES)
      .map((c) => ({ name: c.name.slice(0, 100), value: String(c.id) })),
  );
}

/**
 * The character a command is about: the one picked in the `character` option (an id from the
 * suggestions, or a name typed by hand among the user's own), otherwise the user's character
 * at this channel's Chronicle, otherwise their only character. Replies and returns undefined
 * when there is none.
 */
export async function pickCharacter(
  interaction: ChatInputCommandInteraction,
  { store }: Context,
  locale: Locale,
  guildId: string,
  { required = false }: { required?: boolean } = {},
): Promise<Character | undefined> {
  const { campaign } = store;
  const given = interaction.options.getString('character', required);
  if (given) {
    const byId = /^\d+$/.test(given) ? campaign.getCharacter(Number(given)) : undefined;
    const found =
      byId ??
      campaign
        .charactersOf(guildId, interaction.user.id)
        .find((c) => c.name.toLowerCase() === given.trim().toLowerCase());
    if (found && found.guildId === guildId) return found;
    await replyEphemeral(interaction, locale, 'character.notFound');
    return undefined;
  }
  const active = campaign.activeCharacter(interaction.channelId, interaction.user.id);
  if (active) return active;
  const own = campaign.charactersOf(guildId, interaction.user.id);
  if (own.length === 1) return own[0];
  await replyEphemeral(interaction, locale, own.length ? 'character.pickOne' : 'character.noneYet');
  return undefined;
}

/**
 * The Chronicle a command is about: the one picked in the `chronicle` option, otherwise the
 * one played in this channel, otherwise the user's Chronicle on air, otherwise their only one.
 */
export async function pickChronicle(
  interaction: ChatInputCommandInteraction,
  { store }: Context,
  locale: Locale,
  guildId: string,
): Promise<Chronicle | undefined> {
  const { campaign } = store;
  const given = interaction.options.getString('chronicle');
  if (given) {
    const byId = /^\d+$/.test(given) ? campaign.getChronicle(Number(given)) : undefined;
    const found =
      byId ??
      campaign.chronicles(guildId).find((c) => c.name.toLowerCase() === given.trim().toLowerCase());
    if (found && found.guildId === guildId && !found.archived) return found;
    await replyEphemeral(interaction, locale, 'chronicle.notFound');
    return undefined;
  }
  const here = campaign.chronicleByChannel(interaction.channelId);
  if (here) return here;
  const live = campaign.liveChronicle(guildId, interaction.user.id);
  if (live) return live;
  const own = campaign.chronicles(guildId, interaction.user.id);
  if (own.length === 1) return own[0];
  await replyEphemeral(interaction, locale, own.length ? 'chronicle.pickOne' : 'chronicle.noneYet');
  return undefined;
}

/**
 * Hunger dice for a roll: the `hunger` option when given, otherwise worked out from the
 * Vitae of the roller's character at this channel's Chronicle (Player Packet p. 103).
 * `note` tells the table where the number came from.
 */
export function rollerHunger(
  interaction: ChatInputCommandInteraction,
  { store }: Context,
  locale: Locale,
  option = 'hunger',
): { hunger: number; note?: APIEmbedField } {
  const given = interaction.options.getInteger(option);
  if (given !== null) return { hunger: given };
  const c = store.campaign.activeCharacter(interaction.channelId, interaction.user.id);
  if (!c) return { hunger: 0 };
  const hunger = hungerDice(c.values);
  return {
    hunger,
    note: {
      name: 'Hunger',
      value: t(locale, 'character.hungerFromVitae', {
        name: c.name,
        hunger,
        vitae: c.values.vitae,
        max: vitaeMax(c.values),
      }),
    },
  };
}
