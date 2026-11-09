import { SlashCommandBuilder } from 'discord.js';
import { described, localeFor, t } from '../i18n/index.js';
import { addTestOptions, replyWithRoll } from './shared.js';
import type { Command } from './types.js';

const data = addTestOptions(
  described(new SlashCommandBuilder().setName('npc'), 'cmd.npc.description').addIntegerOption((o) =>
    described(o.setName('dice'), 'opt.npc.dice').setRequired(true).setMinValue(0).setMaxValue(30),
  ) as SlashCommandBuilder,
  { npc: true },
);

export const npc: Command = {
  data,
  async execute(interaction, ctx) {
    const title = t(localeFor(interaction, ctx.store), 'npc.name');
    await replyWithRoll(interaction, ctx, interaction.options.getInteger('dice', true), title, {
      npc: true,
    });
  },
};
