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
  )
  .addSubcommand((s) =>
    s
      .setName('end')
      .setDescription('Chiude la sessione: azzera il tavolo e libera il ruolo di Narratore'),
  )
  .addSubcommand((s) =>
    s
      .setName('storyteller')
      .setDescription('Mostra o cambia il Narratore di questo canale')
      .addUserOption((o) => o.setName('user').setDescription('Il nuovo Narratore')),
  );

export const session: Command = {
  data,
  async execute(interaction, { store }) {
    const channelId = interaction.channelId;
    const sub = interaction.options.getSubcommand();
    const current = store.getStoryteller(channelId);
    const newUser = sub === 'storyteller' ? interaction.options.getUser('user') : null;

    if (sub === 'storyteller' && !newUser) {
      const who = current ? `<@${current}>` : 'nessuno: chi fa `/session new` lo diventa';
      await interaction.reply({
        embeds: [infoEmbed('Narratore', `Narratore del tavolo: ${who}.`)],
      });
      return;
    }

    if (sub === 'end') {
      if (!isStoryteller(interaction, current)) {
        await interaction.reply({ content: STORYTELLER_ONLY, flags: MessageFlags.Ephemeral });
        return;
      }
      store.endSession(channelId);
      await interaction.reply({
        embeds: [
          infoEmbed(
            'Sessione chiusa',
            'Quickening, Drama, scene trait, bargain e test prolungati azzerati. Il tavolo non ha più un Narratore: il prossimo `/session new` lo assegna.',
          ),
        ],
      });
      return;
    }

    // A table without a Storyteller is claimed by whoever starts it; afterwards only the
    // Storyteller (or a server admin) runs the session.
    if (current !== undefined && !isStoryteller(interaction, current)) {
      await interaction.reply({ content: STORYTELLER_ONLY, flags: MessageFlags.Ephemeral });
      return;
    }

    if (newUser) {
      store.setStoryteller(channelId, newUser.id);
      await interaction.reply({
        embeds: [infoEmbed('Narratore', `${newUser} è il Narratore di questo tavolo.`)],
      });
      return;
    }

    const claimed = current === undefined;
    if (claimed) store.setStoryteller(channelId, interaction.user.id);
    const storytellerLine = claimed ? `\n${interaction.user} è il Narratore di questo tavolo.` : '';

    if (sub === 'new') {
      const pcs = interaction.options.getInteger('player_characters', true);
      store.newSession(channelId, pcs);
      await interaction.reply({
        embeds: [
          infoEmbed(
            'Nuova sessione',
            `Quickening di tutti a 0, Drama del Narratore a **${pcs}**, scene trait rimossi.${storytellerLine}`,
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
          `Scene trait rimossi, Devil's Bargain di nuovo disponibile per tutti.${storytellerLine}`,
        ),
      ],
    });
  },
};
