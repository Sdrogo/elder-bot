import { MessageFlags, SlashCommandBuilder, type SlashCommandIntegerOption } from 'discord.js';
import { isStoryteller, storytellerOnly } from '../auth/storyteller.js';
import { masqueradeLevel, threatReaction } from '../dice/masquerade.js';
import { rollDice } from '../dice/roller.js';
import { countSuccesses } from '../dice/test.js';
import { described, localeFor, t, tn } from '../i18n/index.js';
import { MASQUERADE_BOXES } from '../state/store.js';
import { COLORS, diceLine, formatDice, infoEmbed } from '../ui/format.js';
import type { Command } from './types.js';

const amount =
  (key: 'opt.masquerade.mark' | 'opt.masquerade.clear') => (o: SlashCommandIntegerOption) =>
    described(o.setName('amount'), key).setMinValue(1).setMaxValue(MASQUERADE_BOXES);

const data = described(
  new SlashCommandBuilder().setName('masquerade'),
  'cmd.masquerade.description',
)
  .addSubcommand((s) => described(s.setName('show'), 'cmd.masquerade.show.description'))
  .addSubcommand((s) =>
    described(s.setName('mark'), 'cmd.masquerade.mark.description')
      .addIntegerOption(amount('opt.masquerade.mark'))
      .addStringOption((o) =>
        described(o.setName('reason'), 'opt.masquerade.reason').setMaxLength(100),
      ),
  )
  .addSubcommand((s) =>
    described(s.setName('clear'), 'cmd.masquerade.clear.description').addIntegerOption(
      amount('opt.masquerade.clear'),
    ),
  )
  .addSubcommand((s) =>
    described(s.setName('set'), 'cmd.masquerade.set.description').addIntegerOption((o) =>
      described(o.setName('value'), 'opt.masquerade.value')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(MASQUERADE_BOXES),
    ),
  )
  .addSubcommand((s) => described(s.setName('threat'), 'cmd.masquerade.threat.description'));

/** The tracker as boxes: ■■■□□□□□□□ 3/10 · Skepticism */
function tracker(rank: number): string {
  const boxes = '■'.repeat(rank) + '□'.repeat(MASQUERADE_BOXES - rank);
  return `${boxes} **${rank}/${MASQUERADE_BOXES}** · ${masqueradeLevel(rank)}`;
}

export const masquerade: Command = {
  data,
  async execute(interaction, { store, roller }) {
    const locale = localeFor(interaction, store);
    const channelId = interaction.channelId;
    const sub = interaction.options.getSubcommand();
    const current = store.getMasquerade(channelId);

    if (sub !== 'show' && !isStoryteller(interaction, store.getStoryteller(channelId))) {
      await interaction.reply({ content: storytellerOnly(locale), flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'threat') {
      const dice = rollDice(current, roller);
      const successes = countSuccesses(dice);
      const embed = infoEmbed(
        t(locale, 'masquerade.threat.title'),
        `${tracker(current)}\n${tn(locale, 'roll.successes', successes)} · **${threatReaction(successes)}**`,
        successes === 0 ? COLORS.neutral : COLORS.painful,
      );
      if (dice.length && !diceLine(dice)) {
        embed.addFields({ name: t(locale, 'roll.field.dice'), value: formatDice(dice) });
      }
      const content = diceLine(dice);
      await interaction.reply({ ...(content ? { content } : {}), embeds: [embed] });
      return;
    }

    let value = current;
    let note = '';
    if (sub === 'mark') {
      value = store.setMasquerade(
        channelId,
        current + (interaction.options.getInteger('amount') ?? 1),
      );
      const reason = interaction.options.getString('reason');
      if (reason) note = `\n${reason}`;
    } else if (sub === 'clear') {
      value = store.setMasquerade(
        channelId,
        current - (interaction.options.getInteger('amount') ?? 1),
      );
    } else if (sub === 'set') {
      value = store.setMasquerade(channelId, interaction.options.getInteger('value', true));
    }
    await interaction.reply({
      embeds: [infoEmbed(t(locale, 'masquerade.title'), `${tracker(value)}${note}`)],
    });
  },
};
