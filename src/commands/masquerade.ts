import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  SlashCommandBuilder,
  type ButtonInteraction,
} from 'discord.js';
import { isStoryteller, storytellerOnly } from '../auth/storyteller.js';
import { masqueradeLevel, threatReaction } from '../dice/masquerade.js';
import { rollDice, type DieRoller } from '../dice/roller.js';
import { countSuccesses } from '../dice/test.js';
import { described, localeFor, t, tn, type Locale } from '../i18n/index.js';
import { MASQUERADE_BOXES } from '../state/store.js';
import { COLORS, button, diceLine, formatDice, infoEmbed } from '../ui/format.js';
import type { Command, Context } from './types.js';

// /elder masquerade shows the table's Masquerade Tracker (Storyteller Packet p. 32). Its buttons
// mark or clear a box and roll the threat test; only the Storyteller (or an admin) presses them.
//   mq:-1  mq:+1  mq:threat

const data = described(
  new SlashCommandBuilder().setName('masquerade'),
  'cmd.masquerade.description',
);

const MASQUERADE_PREFIX = 'mq:';

export function isMasqueradeId(customId: string): boolean {
  return customId.startsWith(MASQUERADE_PREFIX);
}

/** The tracker as boxes: ■■■□□□□□□□ 3/10 · Skepticism */
function tracker(rank: number): string {
  const boxes = '■'.repeat(rank) + '□'.repeat(MASQUERADE_BOXES - rank);
  return `${boxes} **${rank}/${MASQUERADE_BOXES}** · ${masqueradeLevel(rank)}`;
}

function trackerMessage(locale: Locale, rank: number) {
  return {
    embeds: [infoEmbed(t(locale, 'masquerade.title'), tracker(rank))],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        button(`${MASQUERADE_PREFIX}-1`, '−1', ButtonStyle.Secondary),
        button(`${MASQUERADE_PREFIX}+1`, '+1', ButtonStyle.Primary),
        button(
          `${MASQUERADE_PREFIX}threat`,
          t(locale, 'button.masqueradeThreat'),
          ButtonStyle.Danger,
        ),
      ),
    ],
  };
}

/** The optional threat test: dice equal to the marked boxes (Storyteller Packet p. 32). */
function threatMessage(locale: Locale, rank: number, roller?: DieRoller) {
  const dice = rollDice(rank, roller);
  const successes = countSuccesses(dice);
  const embed = infoEmbed(
    t(locale, 'masquerade.threat.title'),
    `${tracker(rank)}\n${tn(locale, 'roll.successes', successes)} · **${threatReaction(successes)}**`,
    successes === 0 ? COLORS.neutral : COLORS.painful,
  );
  if (dice.length && !diceLine(dice)) {
    embed.addFields({ name: t(locale, 'roll.field.dice'), value: formatDice(dice) });
  }
  const content = diceLine(dice);
  return { ...(content ? { content } : {}), embeds: [embed] };
}

export const masquerade: Command = {
  data,
  async execute(interaction, { store }) {
    const locale = localeFor(interaction, store);
    await interaction.reply(trackerMessage(locale, store.getMasquerade(interaction.channelId)));
  },
};

export async function handleMasqueradeButton(
  interaction: ButtonInteraction,
  { store, roller }: Context,
): Promise<void> {
  const locale = localeFor(interaction, store);
  const channelId = interaction.channelId;
  if (!isStoryteller(interaction, store.getStoryteller(channelId))) {
    await interaction.reply({ content: storytellerOnly(locale), flags: MessageFlags.Ephemeral });
    return;
  }
  const action = interaction.customId.slice(MASQUERADE_PREFIX.length);
  const current = store.getMasquerade(channelId);
  if (action === 'threat') {
    await interaction.reply(threatMessage(locale, current, roller));
    return;
  }
  const delta = action === '+1' ? 1 : action === '-1' ? -1 : 0;
  if (!delta) return;
  const value = store.setMasquerade(channelId, current + delta);
  await interaction.update(trackerMessage(locale, value));
}
