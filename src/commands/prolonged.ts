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
  TERMS,
  consequenceFields,
  formatDice,
  formatPool,
  outcomeLine,
} from '../ui/format.js';
import { hungerOption } from './shared.js';
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
        described(o.setName('bonus'), 'opt.prolonged.bonus').setMinValue(-10).setMaxValue(10),
      )
      .addIntegerOption((o) => hungerOption(o, 'opt.prolonged.hunger')),
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
      {
        channelId,
        userId,
        dice: interaction.options.getInteger('dice', true),
        difficulty: 0,
        modifier: interaction.options.getInteger('bonus') ?? 0,
        hunger: interaction.options.getInteger('hunger') ?? 0,
        takeHalf: false,
        retry: false,
      },
      { roller },
    );
    if (response.kind !== 'rolled') {
      await interaction.reply({
        content: t(locale, 'prolonged.noDice'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { result } = response;
    // Each roll only adds successes; a roll with none is a painful failure (bestial too with a
    // Hunger 1), and either ends the task (p. 112).
    const disaster = result.outcome === 'painful-failure';
    const { task, status } = addProlongedTest(current, result.successes, { disaster });
    if (status === 'ongoing') store.saveProlonged(channelId, userId, task);
    else store.deleteProlonged(channelId, userId);

    const embed = taskEmbed(locale, task, interaction.user.displayName).addFields({
      name: 'Pool',
      value: formatPool(locale, response.request, response.pool),
    });
    if (result.dice.length) {
      embed.addFields({
        name: t(locale, 'roll.field.dice'),
        value: formatDice(result.dice),
        inline: true,
      });
    }
    if (result.hunger.length) {
      embed.addFields({ name: TERMS.hunger, value: formatDice(result.hunger), inline: true });
    }
    embed.addFields(
      { name: t(locale, 'roll.field.outcome'), value: outcomeLine(locale, result) },
      ...consequenceFields(locale, result),
    );
    if (disaster) {
      embed.setColor(result.bestial ? COLORS.bestial : COLORS.painful).setFooter({
        text: t(locale, 'prolonged.disaster'),
      });
    } else if (status === 'completed') {
      embed.setColor(COLORS.success).setFooter({ text: t(locale, 'prolonged.completed') });
    } else if (status === 'failed') {
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
