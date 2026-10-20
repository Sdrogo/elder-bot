import { SlashCommandBuilder } from 'discord.js';
import { npcPool } from '../dice/contest.js';
import { addTestOptions, replyWithRoll } from './shared.js';
import type { Command } from './types.js';

const data = addTestOptions(
  new SlashCommandBuilder()
    .setName('npc')
    .setDescription('Test per un PNG controllato da te: pool = 2 × Livello PNG')
    .addIntegerOption((o) =>
      o
        .setName('level')
        .setDescription('Livello del PNG')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10),
    ) as SlashCommandBuilder,
);

export const npc: Command = {
  data,
  async execute(interaction, ctx) {
    const level = interaction.options.getInteger('level', true);
    await replyWithRoll(interaction, ctx, npcPool(level), `PNG di Livello ${level}`);
  },
};
