import { SlashCommandBuilder } from 'discord.js';
import { described, localeFor, t } from '../i18n/index.js';
import { addTestOptions, replyWithRoll } from './shared.js';
import type { Command } from './types.js';

const data = addTestOptions(
  described(new SlashCommandBuilder().setName('roll'), 'cmd.roll.description').addIntegerOption(
    (o) =>
      described(o.setName('dice'), 'opt.roll.dice')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(30),
  ) as SlashCommandBuilder,
);

export const roll: Command = {
  data,
  async execute(interaction, ctx) {
    const title = t(localeFor(interaction, ctx.store), 'roll.title');
    await replyWithRoll(interaction, ctx, interaction.options.getInteger('dice', true), title);
  },
};
