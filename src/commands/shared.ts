import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandIntegerOption,
} from 'discord.js';
import { MAX_HUNGER } from '../dice/test.js';
import { performRoll, type RollRequest } from '../game/roll.js';
import { showRoll, shownTest } from '../game/shownRoll.js';
import { described, localeFor, type MessageKey } from '../i18n/index.js';
import { rollMessage } from '../ui/format.js';
import { rollerHunger } from './campaignShared.js';
import type { Context } from './types.js';

/** Options of /roll. NPCs (the `npc` option) ignore the Hunger dice. */
export function addTestOptions(builder: SlashCommandBuilder): SlashCommandBuilder {
  builder
    .addIntegerOption((o) =>
      described(o.setName('difficulty'), 'opt.test.difficulty').setMinValue(1).setMaxValue(15),
    )
    .addIntegerOption((o) =>
      described(o.setName('bonus'), 'opt.test.bonus').setMinValue(-10).setMaxValue(10),
    )
    .addIntegerOption((o) => hungerOption(o, 'opt.test.hunger'))
    .addBooleanOption((o) => described(o.setName('take_half'), 'opt.test.take_half'))
    .addStringOption((o) => described(o.setName('reason'), 'opt.test.reason').setMaxLength(100));
  return builder;
}

export function hungerOption(
  o: SlashCommandIntegerOption,
  key: MessageKey,
): SlashCommandIntegerOption {
  return described(o.setName('hunger'), key).setMinValue(0).setMaxValue(MAX_HUNGER);
}

/** Rolls a test for /roll, for a player or an NPC. `title` is used when the player gives no reason. */
export async function replyWithRoll(
  interaction: ChatInputCommandInteraction,
  ctx: Context,
  dice: number,
  title: string,
  { npc = false }: { npc?: boolean } = {},
): Promise<void> {
  const locale = localeFor(interaction, ctx.store);
  const fromCharacter = npc ? { hunger: 0 } : rollerHunger(interaction, ctx, locale);
  const request: RollRequest = {
    channelId: interaction.channelId,
    userId: interaction.user.id,
    dice,
    difficulty: interaction.options.getInteger('difficulty') ?? 0,
    modifier: interaction.options.getInteger('bonus') ?? 0,
    hunger: fromCharacter.hunger,
    takeHalf: interaction.options.getBoolean('take_half') ?? false,
    retry: false,
  };
  const response = performRoll(request, { roller: ctx.roller, npc });
  const reason = interaction.options.getString('reason');
  const fullTitle = `${interaction.user.displayName}: ${reason ?? title}`;
  const notes = fromCharacter.note ? [fromCharacter.note] : [];
  await interaction.reply(rollMessage(locale, response, fullTitle, notes));
  showRoll(ctx.store, where(interaction), (who) => shownTest(who, reason ?? title, response));
}

/** Where a roll was made, for the overlay's roll box. */
export function where(interaction: {
  guildId: string | null;
  channelId: string | null;
  user: { id: string; displayName: string };
}) {
  return {
    guildId: interaction.guildId,
    channelId: interaction.channelId ?? '',
    userId: interaction.user.id,
    displayName: interaction.user.displayName,
  };
}
