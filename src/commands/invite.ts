import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import { runsChronicle } from '../auth/campaign.js';
import { described, localeFor, t } from '../i18n/index.js';
import { encodeCampaignId } from '../ui/sheet.js';
import { guildOf, pickChronicle, replyEphemeral, suggestChronicles } from './campaignShared.js';
import type { Command } from './types.js';

// The one Chronicle step that belongs on Discord: it mentions the player, who answers with a
// button. Everything else about Chronicles lives on the web panel.

const data = described(new SlashCommandBuilder().setName('invite'), 'cmd.invite.description')
  .addUserOption((o) => described(o.setName('user'), 'opt.invite.player').setRequired(true))
  .addStringOption((o) =>
    described(o.setName('chronicle'), 'opt.invite.chronicle')
      .setAutocomplete(true)
      .setMaxLength(100),
  );

export const invite: Command = {
  data,

  async autocomplete(interaction, ctx) {
    await suggestChronicles(interaction, ctx);
  },

  async execute(interaction, ctx) {
    const locale = localeFor(interaction, ctx.store);
    const guildId = await guildOf(interaction, locale);
    if (!guildId) return;
    const target = await pickChronicle(interaction, ctx, locale, guildId);
    if (!target) return;
    if (!runsChronicle(interaction, target)) {
      return replyEphemeral(interaction, locale, 'chronicle.storytellerOnly');
    }
    const user = interaction.options.getUser('user', true);
    if (user.bot) return replyEphemeral(interaction, locale, 'chronicle.invite.invalid');
    await interaction.reply({
      content: t(locale, 'chronicle.invite', {
        user: `${user}`,
        storyteller: `${interaction.user}`,
        chronicle: target.name,
      }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(
              encodeCampaignId({ kind: 'pick', chronicleId: target.id, userId: user.id }),
            )
            .setLabel(t(locale, 'button.pickCharacter'))
            .setStyle(ButtonStyle.Primary),
        ),
      ],
      allowedMentions: { users: [user.id] },
    });
  },
};
