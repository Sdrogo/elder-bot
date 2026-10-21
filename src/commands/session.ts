import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { STORYTELLER_ONLY, isStoryteller } from '../auth/storyteller.js';
import { infoEmbed } from '../ui/format.js';
import type { Command } from './types.js';

const data = new SlashCommandBuilder()
  .setName('session')
  .setDescription('Inizio di sessione o di scena')
  .addSubcommand((s) =>
    s
      .setName('new')
      .setDescription('Nuova sessione: Quickening a 0, Drama = 1 per PG')
      .addIntegerOption((o) =>
        o
          .setName('player_characters')
          .setDescription('Numero di PG al tavolo')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(20),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName('scene')
      .setDescription(
        "Nuova scena: rimuove gli scene trait e rende di nuovo disponibile il Devil's Bargain",
      ),
  );

export const session: Command = {
  data,
  async execute(interaction, { store, storytellerRoleId }) {
    if (!isStoryteller(interaction, storytellerRoleId)) {
      await interaction.reply({ content: STORYTELLER_ONLY, flags: MessageFlags.Ephemeral });
      return;
    }
    const channelId = interaction.channelId;
    if (interaction.options.getSubcommand() === 'new') {
      const pcs = interaction.options.getInteger('player_characters', true);
      store.newSession(channelId, pcs);
      await interaction.reply({
        embeds: [
          infoEmbed(
            'Nuova sessione',
            `Quickening di tutti a 0, Drama del Narratore a **${pcs}**, scene trait rimossi.`,
          ),
        ],
      });
      return;
    }
    store.newScene(channelId);
    await interaction.reply({
      embeds: [
        infoEmbed(
          'Nuova scena',
          "Scene trait rimossi, Devil's Bargain di nuovo disponibile per tutti.",
        ),
      ],
    });
  },
};
