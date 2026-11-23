import {
  ActionRowBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { canEditCharacter } from '../auth/campaign.js';
import { CLAN_NAMES, LIMITS, TIER_NAMES } from '../game/character.js';
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

/** True for the ids of character sheets, invitations and hand-overs. */
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

  if (ref.kind === 'delete') {
    const c = campaign.getCharacter(ref.characterId);
    if (!c) return ephemeral(interaction, locale, 'character.notFound');
    if (c.ownerId !== interaction.user.id) {
      return ephemeral(interaction, locale, 'character.ownerOnly');
    }
    campaign.deleteCharacter(c.id);
    await interaction.update({
      content: t(locale, 'character.deleted', { name: c.name }),
      components: [],
    });
    return;
  }

  if (ref.kind === 'give') {
    if (interaction.user.id !== ref.toId) return ephemeral(interaction, locale, 'button.notYours');
    const c = campaign.getCharacter(ref.characterId);
    if (!c) return ephemeral(interaction, locale, 'character.notFound');
    if (!ref.accept) {
      await interaction.update({
        content: t(locale, 'character.give.refused', { name: c.name, to: `<@${ref.toId}>` }),
        components: [],
      });
      return;
    }
    const moved = campaign.transferCharacter(c.id, ref.fromId, ref.toId);
    if (moved === 'duplicate') return ephemeral(interaction, locale, 'character.duplicate');
    if (moved === 'limit')
      return ephemeral(interaction, locale, 'character.limit', {
        max: LIMITS.charactersPerUser,
      });
    if (!moved) return ephemeral(interaction, locale, 'button.alreadyUsed');
    await interaction.update({
      content: t(locale, 'character.give.done', { name: c.name, to: `<@${ref.toId}>` }),
      components: [],
    });
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
  if (ref?.kind !== 'join') return;
  const { campaign } = ctx.store;
  const locale = localeFor(interaction, ctx.store);
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
