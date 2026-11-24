import {
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { canEditCharacter } from '../auth/campaign.js';
import { CLAN_NAMES, TIER_NAMES } from '../game/character.js';
import { tierFits } from '../state/campaign.js';
import type { Context } from '../commands/types.js';
import { localeFor, t, type Locale, type MessageKey } from '../i18n/index.js';
import { infoEmbed } from '../ui/format.js';
import { decodeCampaignId, encodeCampaignId, sheetMessage } from '../ui/sheet.js';

type CampaignInteraction = ButtonInteraction | StringSelectMenuInteraction;

async function ephemeral(
  interaction: CampaignInteraction,
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number> = {},
): Promise<void> {
  await interaction.reply({ content: t(locale, key, params), flags: MessageFlags.Ephemeral });
}

/** True for the ids of character sheets and invitations. */
export function isCampaignId(customId: string): boolean {
  return customId.startsWith('pc:') || customId.startsWith('chr:');
}

export async function handleCampaignButton(
  interaction: ButtonInteraction,
  ctx: Context,
): Promise<void> {
  const ref = decodeCampaignId(interaction.customId);
  if (!ref) return;
  const { campaign } = ctx.store;
  const locale = localeFor(interaction, ctx.store);

  if (ref.kind === 'adjust') {
    const c = campaign.getCharacter(ref.characterId);
    if (!c) return ephemeral(interaction, locale, 'character.notFound');
    if (!canEditCharacter(interaction, c, campaign)) {
      return ephemeral(interaction, locale, 'character.cannotEdit');
    }
    const updated = campaign.setTrack(
      c.id,
      ref.track,
      c.values[ref.track] + ref.delta,
      interaction.user.id,
    );
    if (!updated) return;
    const chronicle =
      updated.chronicleId !== undefined ? campaign.getChronicle(updated.chronicleId) : undefined;
    await interaction.update(sheetMessage(locale, updated, chronicle, true));
    return;
  }

  if (ref.kind === 'pick') {
    if (interaction.user.id !== ref.userId)
      return ephemeral(interaction, locale, 'button.notYours');
    const chronicle = campaign.getChronicle(ref.chronicleId);
    if (!chronicle || chronicle.archived)
      return ephemeral(interaction, locale, 'chronicle.notFound');
    const free = campaign
      .charactersOf(chronicle.guildId, interaction.user.id)
      .filter((c) => c.chronicleId === undefined && tierFits(c.values.tier, chronicle.tier));
    if (!free.length) return ephemeral(interaction, locale, 'chronicle.noFreeCharacter');
    const menu = new StringSelectMenuBuilder()
      .setCustomId(
        encodeCampaignId({ kind: 'join', chronicleId: chronicle.id, userId: ref.userId }),
      )
      .setPlaceholder(t(locale, 'chronicle.pickPlaceholder'))
      .addOptions(
        free.slice(0, 25).map((c) => ({
          label: c.name,
          description: CLAN_NAMES[c.clan],
          value: String(c.id),
        })),
      );
    await interaction.reply({
      components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
      flags: MessageFlags.Ephemeral,
    });
  }
}

export async function handleCampaignSelect(
  interaction: StringSelectMenuInteraction,
  ctx: Context,
): Promise<void> {
  const ref = decodeCampaignId(interaction.customId);
  const { campaign } = ctx.store;
  const locale = localeFor(interaction, ctx.store);
  if (ref?.kind === 'use') {
    if (interaction.user.id !== ref.userId)
      return ephemeral(interaction, locale, 'button.notYours');
    const chosen = campaign.selectCharacter(Number(interaction.values[0]), interaction.user.id);
    if (!chosen) return ephemeral(interaction, locale, 'character.notFound');
    const chronicle =
      chosen.chronicleId !== undefined ? campaign.getChronicle(chosen.chronicleId) : undefined;
    const own = campaign.charactersOf(chosen.guildId, interaction.user.id);
    await interaction.update({
      content: t(locale, 'sheet.nowPlaying', { name: chosen.name }),
      ...sheetMessage(
        locale,
        chosen,
        chronicle,
        canEditCharacter(interaction, chosen, campaign),
        own,
      ),
    });
    return;
  }
  if (ref?.kind !== 'join') return;
  if (interaction.user.id !== ref.userId) return ephemeral(interaction, locale, 'button.notYours');
  const chronicle = campaign.getChronicle(ref.chronicleId);
  const c = campaign.getCharacter(Number(interaction.values[0]));
  if (!chronicle || chronicle.archived) return ephemeral(interaction, locale, 'chronicle.notFound');
  if (!c || c.ownerId !== interaction.user.id || c.guildId !== chronicle.guildId) {
    return ephemeral(interaction, locale, 'character.notFound');
  }
  const joined = campaign.join(chronicle.id, c.id);
  if (joined === 'busy') return ephemeral(interaction, locale, 'chronicle.busy', { name: c.name });
  if (joined === 'tier') {
    return ephemeral(interaction, locale, 'chronicle.wrongTier', {
      name: c.name,
      tier: TIER_NAMES[chronicle.tier!],
    });
  }
  await interaction.update({
    content: t(locale, 'chronicle.joined.private', { name: c.name, chronicle: chronicle.name }),
    components: [],
  });
  // Tell the table, not just the player.
  await interaction.followUp({
    embeds: [
      infoEmbed(
        chronicle.name,
        t(locale, 'chronicle.joined', {
          name: c.name,
          user: `${interaction.user}`,
          chronicle: chronicle.name,
        }),
      ),
    ],
  });
}
