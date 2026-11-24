import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { canEditCharacter } from '../auth/campaign.js';
import { described, localeFor } from '../i18n/index.js';
import { sheetMessage } from '../ui/sheet.js';
import { guildOf, pickCharacter, suggestCharacters } from './campaignShared.js';
import type { Command } from './types.js';

// The character at the table: its trackers, with − and + for those who may change them.
// Everything else about characters (creating, editing, deleting) lives on the web panel.

const data = described(new SlashCommandBuilder().setName('sheet'), 'cmd.sheet.description')
  .addStringOption((o) =>
    described(o.setName('character'), 'opt.sheet.character')
      .setAutocomplete(true)
      .setMaxLength(100),
  )
  .addBooleanOption((o) => described(o.setName('public'), 'opt.sheet.public'));

export const sheet: Command = {
  data,

  async autocomplete(interaction, ctx) {
    await suggestCharacters(interaction, ctx);
  },

  async execute(interaction, ctx) {
    const { campaign } = ctx.store;
    const locale = localeFor(interaction, ctx.store);
    const guildId = await guildOf(interaction, locale);
    if (!guildId) return;
    const c = await pickCharacter(interaction, ctx, locale, guildId);
    if (!c) return;
    const chronicle =
      c.chronicleId !== undefined ? campaign.getChronicle(c.chronicleId) : undefined;
    // Anyone at the table can look; only those who may change it get the buttons.
    const isPublic = interaction.options.getBoolean('public') ?? false;
    const editable = canEditCharacter(interaction, c, campaign);
    await interaction.reply({
      ...sheetMessage(locale, c, chronicle, editable && !isPublic),
      ...(isPublic ? {} : { flags: MessageFlags.Ephemeral }),
    });
  },
};
