import { SlashCommandBuilder } from 'discord.js';
import { addTestOptions, replyWithRoll } from './shared.js';
import type { Command } from './types.js';

const data = addTestOptions(
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Test: Attributo + Abilità (o Disciplina) − Difficoltà, successo con 8+')
    .addIntegerOption((o) =>
      o
        .setName('dice')
        .setDescription('Attributo + Abilità, Disciplina o Composure + Resolve')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(30),
    ) as SlashCommandBuilder,
);

export const roll: Command = {
  data,
  async execute(interaction, ctx) {
    await replyWithRoll(interaction, ctx, interaction.options.getInteger('dice', true), 'Test');
  },
};
