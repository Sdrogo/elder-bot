import {
  MessageFlags,
  type ChatInputCommandInteraction,
  type SlashCommandBuilder,
} from 'discord.js';
import { performRoll, type RollRequest } from '../game/roll.js';
import { rollMessage } from '../ui/format.js';
import type { Context } from './types.js';

/** Options shared by /roll and /npc. */
export function addTestOptions(builder: SlashCommandBuilder): SlashCommandBuilder {
  builder
    .addIntegerOption((o) =>
      o
        .setName('difficulty')
        .setDescription('Difficoltà: dadi da togliere al pool')
        .setMinValue(0)
        .setMaxValue(15),
    )
    .addIntegerOption((o) =>
      o
        .setName('bonus')
        .setDescription('Dadi bonus (positivi) o penalità (negativi)')
        .setMinValue(-10)
        .setMaxValue(10),
    )
    .addIntegerOption((o) =>
      o
        .setName('quickening')
        .setDescription('Quickening da spendere: +1 dado ciascuno')
        .setMinValue(0)
        .setMaxValue(5),
    )
    .addBooleanOption((o) =>
      o.setName('combat').setDescription('Test di attacco o difesa: niente Overqualified'),
    )
    .addStringOption((o) =>
      o.setName('reason').setDescription('Cosa stai tentando').setMaxLength(100),
    )
    .addBooleanOption((o) =>
      o.setName('ignore_traits').setDescription('Non applicare gli scene trait del Drama'),
    );
  return builder;
}

export async function replyWithRoll(
  interaction: ChatInputCommandInteraction,
  ctx: Context,
  dice: number,
  title: string,
): Promise<void> {
  const request: RollRequest = {
    channelId: interaction.channelId,
    userId: interaction.user.id,
    dice,
    difficulty: interaction.options.getInteger('difficulty') ?? 0,
    modifier: interaction.options.getInteger('bonus') ?? 0,
    quickening: interaction.options.getInteger('quickening') ?? 0,
    combat: interaction.options.getBoolean('combat') ?? false,
    retry: false,
    applyTraits: !(interaction.options.getBoolean('ignore_traits') ?? false),
  };
  const response = performRoll(ctx.store, request, { roller: ctx.roller });
  if (response.kind === 'error') {
    await interaction.reply({ content: response.message, flags: MessageFlags.Ephemeral });
    return;
  }
  const reason = interaction.options.getString('reason');
  const fullTitle = `${interaction.user.displayName}: ${reason ?? title}`;
  await interaction.reply(rollMessage(response, fullTitle));
}
