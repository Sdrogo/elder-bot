import { SlashCommandBuilder } from 'discord.js';
import { npcPool } from '../dice/contest.js';
import { described, localeFor, t } from '../i18n/index.js';
import { addTestOptions, replyWithRoll } from './shared.js';
import type { Command } from './types.js';

const data = addTestOptions(
  described(new SlashCommandBuilder().setName('npc'), 'cmd.npc.description').addIntegerOption((o) =>
    described(o.setName('level'), 'opt.npc.level').setRequired(true).setMinValue(1).setMaxValue(10),
  ) as SlashCommandBuilder,
);

export const npc: Command = {
  data,
  async execute(interaction, ctx) {
    const level = interaction.options.getInteger('level', true);
    const title = t(localeFor(interaction, ctx.store), 'npc.name', { level });
    await replyWithRoll(interaction, ctx, npcPool(level), title);
  },
};
