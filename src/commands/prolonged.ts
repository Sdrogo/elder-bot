import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import {
  PROLONGED_TARGETS,
  PROLONGED_TESTS,
  addProlongedTest,
  startProlonged,
  type ProlongedTask,
} from '../dice/prolonged.js';
import { performRoll } from '../game/roll.js';
import { choice, described, localeFor, t, type Locale } from '../i18n/index.js';
import {
  COLORS,
  formatDice,
  formatPool,
  outcomeLine,
  quickeningLine,
  rollErrorText,
} from '../ui/format.js';
import type { Command } from './types.js';

const data = described(new SlashCommandBuilder().setName('prolonged'), 'cmd.prolonged.description')
  .addSubcommand((s) =>
    described(s.setName('start'), 'cmd.prolonged.start.description')
      .addStringOption((o) =>
        described(o.setName('name'), 'opt.prolonged.name').setRequired(true).setMaxLength(80),
      )
      .addIntegerOption((o) =>
        described(o.setName('target'), 'opt.prolonged.target')
          .setRequired(true)
          .addChoices(
            ...PROLONGED_TARGETS.map((n) => choice('choice.prolonged.target', n, { count: n })),
          ),
      )
      .addIntegerOption((o) =>
        described(o.setName('tests'), 'opt.prolonged.tests')
          .setRequired(true)
          .addChoices(
            ...PROLONGED_TESTS.map((n) => choice('choice.prolonged.tests', n, { count: n })),
          ),
      ),
  )
  .addSubcommand((s) =>
    described(s.setName('roll'), 'cmd.prolonged.roll.description')
      .addIntegerOption((o) =>
        described(o.setName('dice'), 'opt.prolonged.dice')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(30),
      )
      .addIntegerOption((o) =>
        described(o.setName('difficulty'), 'opt.prolonged.difficulty')
          .setMinValue(0)
          .setMaxValue(15),
      )
      .addIntegerOption((o) =>
        described(o.setName('bonus'), 'opt.prolonged.bonus').setMinValue(-10).setMaxValue(10),
      )
      .addIntegerOption((o) =>
        described(o.setName('quickening'), 'opt.prolonged.quickening')
          .setMinValue(0)
          .setMaxValue(5),
      ),
  )
  .addSubcommand((s) => described(s.setName('status'), 'cmd.prolonged.status.description'))
  .addSubcommand((s) => described(s.setName('cancel'), 'cmd.prolonged.cancel.description'));

export const prolonged: Command = {
  data,
  async execute(interaction, { store, roller }) {
    const locale = localeFor(interaction, store);
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
      await interaction.reply({ embeds: [taskEmbed(locale, task, interaction.user.displayName)] });
      return;
    }

    if (!current) {
      await interaction.reply({
        content: t(locale, 'prolonged.none'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'status') {
      await interaction.reply({
        embeds: [taskEmbed(locale, current, interaction.user.displayName)],
      });
      return;
    }

    if (sub === 'cancel') {
      store.deleteProlonged(channelId, userId);
      await interaction.reply({
        content: t(locale, 'prolonged.cancelled', { name: current.name }),
      });
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
      await interaction.reply({
        content: rollErrorText(locale, response),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (response.kind !== 'rolled') {
      await interaction.reply({
        content: t(locale, 'prolonged.noDice'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { task, status } = addProlongedTest(current, response.result.successes);
    if (status === 'ongoing') store.saveProlonged(channelId, userId, task);
    else store.deleteProlonged(channelId, userId);

    const embed = taskEmbed(locale, task, interaction.user.displayName).addFields(
      {
        name: 'Pool',
        value: formatPool(locale, response.request, response.pool, response.traitModifier),
      },
      {
        name: t(locale, 'roll.field.dice'),
        value: formatDice(response.result.dice),
        inline: true,
      },
      {
        name: t(locale, 'roll.field.outcome'),
        value: outcomeLine(locale, response.result),
        inline: true,
      },
    );
    const q = quickeningLine(
      locale,
      response.quickening.gained,
      response.quickening.total,
      response.quickening.overflow,
    );
    if (q) embed.addFields({ name: 'Quickening', value: q });
    if (response.result.outcome === 'painful-failure') {
      embed.addFields({ name: 'Painful Failure', value: t(locale, 'prolonged.painful') });
    }
    if (status === 'completed') {
      embed.setColor(COLORS.success).setFooter({ text: t(locale, 'prolonged.completed') });
    }
    if (status === 'failed') {
      embed.setColor(COLORS.painful).setFooter({ text: t(locale, 'prolonged.failed') });
    }
    await interaction.reply({ embeds: [embed] });
  },
};

function taskEmbed(locale: Locale, task: ProlongedTask, player: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`${player}: ${task.name}`)
    .setColor(COLORS.neutral)
    .setDescription(
      t(locale, 'prolonged.progress', {
        successes: task.successes,
        target: task.target,
        done: task.testsDone,
        max: task.maxTests,
      }),
    );
}
