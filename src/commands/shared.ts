import {
  MessageFlags,
  type ChatInputCommandInteraction,
  type SlashCommandBuilder,
} from 'discord.js';
import { performNpcRoll, performRoll, type RollRequest } from '../game/roll.js';
import { described, localeFor } from '../i18n/index.js';
import { rollErrorText, rollMessage } from '../ui/format.js';
import type { Context } from './types.js';

/** Options shared by /roll and /npc. NPCs have no Quickening and no Overqualified to skip. */
export function addTestOptions(
  builder: SlashCommandBuilder,
  { npc = false }: { npc?: boolean } = {},
): SlashCommandBuilder {
  builder
    .addIntegerOption((o) =>
      described(o.setName('difficulty'), 'opt.test.difficulty').setMinValue(0).setMaxValue(15),
    )
    .addIntegerOption((o) =>
      described(o.setName('bonus'), 'opt.test.bonus').setMinValue(-10).setMaxValue(10),
    );
  if (!npc) {
    builder
      .addIntegerOption((o) =>
        described(o.setName('quickening'), 'opt.test.quickening').setMinValue(0).setMaxValue(5),
      )
      .addBooleanOption((o) => described(o.setName('combat'), 'opt.test.combat'));
  }
  builder
    .addStringOption((o) => described(o.setName('reason'), 'opt.test.reason').setMaxLength(100))
    .addBooleanOption((o) => described(o.setName('ignore_traits'), 'opt.test.ignore_traits'));
  return builder;
}

/** Rolls a test for /roll and /npc. `title` is used when the player gives no reason. */
export async function replyWithRoll(
  interaction: ChatInputCommandInteraction,
  ctx: Context,
  dice: number,
  title: string,
  { npc = false }: { npc?: boolean } = {},
): Promise<void> {
  const locale = localeFor(interaction, ctx.store);
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
  const response = npc
    ? performNpcRoll(ctx.store, request, { roller: ctx.roller })
    : performRoll(ctx.store, request, { roller: ctx.roller });
  if (response.kind === 'error') {
    await interaction.reply({
      content: rollErrorText(locale, response),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const reason = interaction.options.getString('reason');
  const fullTitle = `${interaction.user.displayName}: ${reason ?? title}`;
  await interaction.reply(rollMessage(locale, response, fullTitle));
}
