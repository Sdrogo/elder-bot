import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { described, localeFor, t } from '../i18n/index.js';
import type { Command } from './types.js';

const data = described(new SlashCommandBuilder().setName('panel'), 'cmd.panel.description');

/** Answers with the link to the web panel, only to whoever asked. */
export const panel: Command = {
  data,
  async execute(interaction, { store, panelUrl }) {
    const locale = localeFor(interaction, store);
    if (!panelUrl) {
      await interaction.reply({
        content: t(locale, 'panel.notConfigured'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply({
      content: t(locale, 'panel.link'),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(panelUrl)
            .setLabel(t(locale, 'panel.open')),
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
