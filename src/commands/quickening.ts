import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { STORYTELLER_ONLY, isStoryteller } from '../auth/storyteller.js';
import { MAX_QUICKENING, basicSuccessCost } from '../dice/quickening.js';
import { grantQuickening } from '../game/roll.js';
import { infoEmbed, quickeningLine } from '../ui/format.js';
import type { Command } from './types.js';

const data = new SlashCommandBuilder()
  .setName('quickening')
  .setDescription('Il tuo Quickening in questo canale (massimo 5, si azzera a fine sessione)')
  .addSubcommand((s) =>
    s
      .setName('show')
      .setDescription('Mostra il Quickening')
      .addUserOption((o) => o.setName('player').setDescription('Un altro giocatore')),
  )
  .addSubcommand((s) =>
    s
      .setName('add')
      .setDescription('Aggiunge Quickening (oltre 5 si segnano caselle Beast o Nature)')
      .addIntegerOption((o) =>
        o
          .setName('amount')
          .setDescription('Quanti')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(10),
      )
      .addUserOption((o) => o.setName('player').setDescription('Un altro giocatore')),
  )
  .addSubcommand((s) =>
    s
      .setName('spend')
      .setDescription('Spende Quickening, ad esempio per dare dadi a un alleato')
      .addIntegerOption((o) =>
        o
          .setName('amount')
          .setDescription('Quanti')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(5),
      )
      .addStringOption((o) => o.setName('reason').setDescription('Per cosa').setMaxLength(100)),
  )
  .addSubcommand((s) =>
    s
      .setName('success')
      .setDescription("Compra un successo base: 3 Quickening, o 5 se non hai pallini nell'Abilità")
      .addBooleanOption((o) =>
        o
          .setName('skill_dots')
          .setDescription("Hai almeno 1 pallino nell'Abilità?")
          .setRequired(true),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName('set')
      .setDescription('Corregge il valore a mano')
      .addIntegerOption((o) =>
        o
          .setName('value')
          .setDescription('Nuovo valore')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(MAX_QUICKENING),
      )
      .addUserOption((o) => o.setName('player').setDescription('Un altro giocatore')),
  );

export const quickening: Command = {
  data,
  async execute(interaction, { store, storytellerRoleId }) {
    const channelId = interaction.channelId;
    const player = interaction.options.getUser('player') ?? interaction.user;
    const current = store.getQuickening(channelId, player.id);
    const sub = interaction.options.getSubcommand();

    // Everyone tracks their own Quickening; only the Storyteller changes someone else's.
    const otherPlayer = player.id !== interaction.user.id;
    if (sub !== 'show' && otherPlayer && !isStoryteller(interaction, storytellerRoleId)) {
      await interaction.reply({ content: STORYTELLER_ONLY, flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'show') {
      await interaction.reply({
        embeds: [
          infoEmbed('Quickening', `${player.displayName}: **${current}/${MAX_QUICKENING}**`),
        ],
      });
      return;
    }

    if (sub === 'add') {
      const gain = grantQuickening(
        store,
        channelId,
        player.id,
        interaction.options.getInteger('amount', true),
      );
      const lines = [`${player.displayName}: **${gain.value}/${MAX_QUICKENING}**`];
      if (gain.overflow) lines.push(quickeningLine(0, gain.value, gain.overflow)!);
      await interaction.reply({ embeds: [infoEmbed('Quickening', lines.join('\n'))] });
      return;
    }

    if (sub === 'set') {
      const value = interaction.options.getInteger('value', true);
      store.setQuickening(channelId, player.id, value);
      await interaction.reply({
        embeds: [infoEmbed('Quickening', `${player.displayName}: **${value}/${MAX_QUICKENING}**`)],
      });
      return;
    }

    const cost =
      sub === 'success'
        ? basicSuccessCost(interaction.options.getBoolean('skill_dots', true))
        : interaction.options.getInteger('amount', true);
    if (cost > current) {
      await interaction.reply({
        content: `Hai ${current} Quickening, ne servono ${cost}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    store.setQuickening(channelId, player.id, current - cost);
    const what =
      sub === 'success'
        ? `spende ${cost} Quickening per un **successo base**`
        : `spende ${cost} Quickening${reason(interaction.options.getString('reason'))}`;
    await interaction.reply({
      embeds: [
        infoEmbed(
          'Quickening',
          `${player.displayName} ${what}. Restano **${current - cost}/${MAX_QUICKENING}**.\nSi spende prima di tirare.`,
        ),
      ],
    });
  },
};

function reason(text: string | null): string {
  return text ? ` (${text})` : '';
}
