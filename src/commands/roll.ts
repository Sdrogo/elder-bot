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
).addBooleanOption((o) => described(o.setName('npc'), 'opt.roll.npc'));

export const roll: Command = {
  data,
  async execute(interaction, ctx) {
    // An NPC's pool from its stat block: no Hunger dice, no Willpower, no Beast's Bargain.
    const npc = interaction.options.getBoolean('npc') ?? false;
    const title = t(localeFor(interaction, ctx.store), npc ? 'npc.name' : 'roll.title');
    await replyWithRoll(interaction, ctx, interaction.options.getInteger('dice', true), title, {
      npc,
    });
  },
};
