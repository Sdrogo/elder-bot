import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import {
  PROLONGED_TARGETS,
  PROLONGED_TESTS,
  addProlongedTest,
  startProlonged,
  type ProlongedTask,
} from '../dice/prolonged.js';
import { performRoll } from '../game/roll.js';
import { COLORS, formatDice, formatPool, outcomeLine, quickeningLine } from '../ui/format.js';
import type { Command } from './types.js';

const data = new SlashCommandBuilder()
  .setName('prolonged')
  .setDescription('Test prolungato: somma i successi di più tiri')
  .addSubcommand((s) =>
    s
      .setName('start')
      .setDescription('Apre un test prolungato')
      .addStringOption((o) =>
        o.setName('name').setDescription('Il compito').setRequired(true).setMaxLength(80),
      )
      .addIntegerOption((o) =>
        o
          .setName('target')
          .setDescription('Successi richiesti')
          .setRequired(true)
          .addChoices(...PROLONGED_TARGETS.map((n) => ({ name: `${n} successi`, value: n }))),
      )
      .addIntegerOption((o) =>
        o
          .setName('tests')
          .setDescription('Tiri disponibili')
          .setRequired(true)
          .addChoices(...PROLONGED_TESTS.map((n) => ({ name: `${n} tiri`, value: n }))),
      ),
  )
  .addSubcommand((s) =>
    s
      .setName('roll')
      .setDescription('Tira per il tuo test prolungato')
      .addIntegerOption((o) =>
        o
          .setName('dice')
          .setDescription('Attributo + Abilità')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(30),
      )
      .addIntegerOption((o) =>
        o.setName('difficulty').setDescription('Difficoltà').setMinValue(0).setMaxValue(15),
      )
      .addIntegerOption((o) =>
        o.setName('bonus').setDescription('Dadi bonus o penalità').setMinValue(-10).setMaxValue(10),
      )
      .addIntegerOption((o) =>
        o
          .setName('quickening')
          .setDescription('Quickening da spendere')
          .setMinValue(0)
          .setMaxValue(5),
      ),
  )
  .addSubcommand((s) => s.setName('status').setDescription('Mostra il tuo test prolungato'))
  .addSubcommand((s) => s.setName('cancel').setDescription('Chiude il tuo test prolungato'));

export const prolonged: Command = {
  data,
  async execute(interaction, { store, roller }) {
    const channelId = interaction.channelId;
    const userId = interaction.user.id;
    const sub = interaction.options.getSubcommand();
    const current = store.getProlonged(channelId, userId);

    if (sub === 'start') {
      const task = startProlonged(
        interaction.options.getString('name', true),
        interaction.options.getInteger('target', true),
        interaction.options.getInteger('tests', true),
      );
      store.saveProlonged(channelId, userId, task);
      await interaction.reply({ embeds: [taskEmbed(task, interaction.user.displayName)] });
      return;
    }

    if (!current) {
      await interaction.reply({
        content:
          'Non hai un test prolungato aperto in questo canale. Usa `/elder prolonged start`.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'status') {
      await interaction.reply({ embeds: [taskEmbed(current, interaction.user.displayName)] });
      return;
    }

    if (sub === 'cancel') {
      store.deleteProlonged(channelId, userId);
      await interaction.reply({ content: `Test prolungato "${current.name}" chiuso.` });
      return;
    }

    const response = performRoll(
      store,
      {
        channelId,
        userId,
        dice: interaction.options.getInteger('dice', true),
        difficulty: interaction.options.getInteger('difficulty') ?? 0,
        modifier: interaction.options.getInteger('bonus') ?? 0,
        quickening: interaction.options.getInteger('quickening') ?? 0,
        combat: false,
        retry: false,
        applyTraits: true,
      },
      { roller, skipOverqualified: true },
    );
    if (response.kind === 'error') {
      await interaction.reply({ content: response.message, flags: MessageFlags.Ephemeral });
      return;
    }
    if (response.kind !== 'rolled') {
      await interaction.reply({
        content:
          'La Difficoltà ha azzerato il pool: cerca vantaggi che ti diano dadi extra, o fatti aiutare. Il tiro non è stato contato.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { task, status } = addProlongedTest(current, response.result.successes);
    if (status === 'ongoing') store.saveProlonged(channelId, userId, task);
    else store.deleteProlonged(channelId, userId);

    const embed = taskEmbed(task, interaction.user.displayName).addFields(
      { name: 'Pool', value: formatPool(response.request, response.pool, response.traitModifier) },
      { name: 'Dadi', value: formatDice(response.result.dice), inline: true },
      { name: 'Esito', value: outcomeLine(response.result), inline: true },
    );
    const q = quickeningLine(
      response.quickening.gained,
      response.quickening.total,
      response.quickening.overflow,
    );
    if (q) embed.addFields({ name: 'Quickening', value: q });
    if (response.result.outcome === 'painful-failure') {
      embed.addFields({
        name: 'Painful Failure',
        value: 'Il tiro conta comunque, ma devi Choose Your Pain.',
      });
    }
    if (status === 'completed') embed.setColor(COLORS.success).setFooter({ text: 'Completato!' });
    if (status === 'failed')
      embed.setColor(COLORS.painful).setFooter({ text: 'Tiri esauriti: compito fallito.' });
    await interaction.reply({ embeds: [embed] });
  },
};

function taskEmbed(task: ProlongedTask, player: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`${player}: ${task.name}`)
    .setColor(COLORS.neutral)
    .setDescription(
      `Successi **${task.successes}/${task.target}** · tiri usati **${task.testsDone}/${task.maxTests}**`,
    );
}
