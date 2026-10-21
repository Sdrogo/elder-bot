import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { STORYTELLER_ONLY, isStoryteller } from '../auth/storyteller.js';
import { MAX_DRAMA, MAX_SCENE_TRAITS } from '../state/store.js';
import { infoEmbed } from '../ui/format.js';
import type { Command } from './types.js';

/** Storyteller Packet p. 30: a scene trait costs 2 Drama and gives +1 to +3 or -1 to -3 dice. */
export const SCENE_TRAIT_COST = 2;

const data = new SlashCommandBuilder()
  .setName('drama')
  .setDescription('Drama del Narratore in questo canale')
  .addSubcommand((s) =>
    s.setName('show').setDescription('Mostra il Drama e gli scene trait attivi'),
  )
  .addSubcommand((s) =>
    s
      .setName('add')
      .setDescription('Aggiunge Drama')
      .addIntegerOption((o) =>
        o
          .setName('amount')
          .setDescription('Quanto')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(20),
      )
      .addStringOption((o) => o.setName('reason').setDescription('Perché').setMaxLength(100)),
  )
  .addSubcommand((s) =>
    s
      .setName('spend')
      .setDescription('Spende Drama')
      .addIntegerOption((o) =>
        o
          .setName('amount')
          .setDescription('Quanto')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(20),
      )
      .addStringOption((o) => o.setName('reason').setDescription('Per cosa').setMaxLength(100)),
  )
  .addSubcommand((s) =>
    s
      .setName('trait')
      .setDescription('Crea uno scene trait (2 Drama): bonus o penalità a tutti i tiri della scena')
      .addStringOption((o) =>
        o
          .setName('name')
          .setDescription('Ad esempio "Pioggia battente"')
          .setRequired(true)
          .setMaxLength(60),
      )
      .addIntegerOption((o) =>
        o
          .setName('modifier')
          .setDescription('Da -3 a +3 dadi')
          .setRequired(true)
          .addChoices(
            ...[-3, -2, -1, 1, 2, 3].map((n) => ({ name: n > 0 ? `+${n}` : `${n}`, value: n })),
          ),
      ),
  )
  .addSubcommand((s) => s.setName('clear_traits').setDescription('Rimuove gli scene trait'));

export const drama: Command = {
  data,
  async execute(interaction, { store, storytellerRoleId }) {
    const channelId = interaction.channelId;
    const current = store.getDrama(channelId);
    const sub = interaction.options.getSubcommand();

    if (sub !== 'show' && !isStoryteller(interaction, storytellerRoleId)) {
      await interaction.reply({ content: STORYTELLER_ONLY, flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'show') {
      const traits = store.listTraits(channelId);
      const lines = [`Drama: **${current}**`];
      if (traits.length) {
        lines.push(
          '',
          'Scene trait attivi:',
          ...traits.map((t) => `- ${t.name}: ${signed(t.modifier)} dadi`),
        );
      }
      await interaction.reply({ embeds: [infoEmbed('Drama', lines.join('\n'))] });
      return;
    }

    if (sub === 'add') {
      const amount = interaction.options.getInteger('amount', true);
      store.setDrama(channelId, current + amount);
      const now = store.getDrama(channelId);
      const cap = now === MAX_DRAMA ? ` (massimo ${MAX_DRAMA})` : '';
      await interaction.reply({
        embeds: [
          infoEmbed(
            'Drama',
            `+${amount} Drama${reason(interaction.options.getString('reason'))}. Ora **${now}**${cap}.`,
          ),
        ],
      });
      return;
    }

    if (sub === 'clear_traits') {
      store.clearTraits(channelId);
      await interaction.reply({ embeds: [infoEmbed('Drama', 'Scene trait rimossi.')] });
      return;
    }

    if (sub === 'trait' && store.listTraits(channelId).length >= MAX_SCENE_TRAITS) {
      await interaction.reply({
        content: `Ci sono già ${MAX_SCENE_TRAITS} scene trait: rimuovili con \`/drama clear_traits\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const cost =
      sub === 'trait' ? SCENE_TRAIT_COST : interaction.options.getInteger('amount', true);
    if (cost > current) {
      await interaction.reply({
        content: `Il Narratore ha ${current} Drama, ne servono ${cost}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    store.setDrama(channelId, current - cost);

    if (sub === 'trait') {
      const name = interaction.options.getString('name', true);
      const modifier = interaction.options.getInteger('modifier', true);
      store.addTrait(channelId, name, modifier);
      await interaction.reply({
        embeds: [
          infoEmbed(
            'Scene trait',
            `**${name}**: ${signed(modifier)} dadi a tutti i \`/roll\` della scena (chi non è coinvolto usa \`ignore_traits\`).\nDrama rimasto: **${current - cost}**.`,
          ),
        ],
      });
      return;
    }

    await interaction.reply({
      embeds: [
        infoEmbed(
          'Drama',
          `Il Narratore spende ${cost} Drama${reason(interaction.options.getString('reason'))}. Restano **${current - cost}**.`,
        ),
      ],
    });
  },
};

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function reason(text: string | null): string {
  return text ? ` (${text})` : '';
}
