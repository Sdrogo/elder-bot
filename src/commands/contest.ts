import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { npcPool, resolveContest, type ContestResult } from '../dice/contest.js';
import { rollDice } from '../dice/roller.js';
import { buildPool, evaluate, type TestResult } from '../dice/test.js';
import { grantQuickening } from '../game/roll.js';
import { described, localeFor, t, tn, type Locale } from '../i18n/index.js';
import { COLORS, formatDice, quickeningLine } from '../ui/format.js';
import type { Command } from './types.js';

const data = described(new SlashCommandBuilder().setName('contest'), 'cmd.contest.description')
  .addIntegerOption((o) =>
    described(o.setName('dice'), 'opt.contest.dice')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(30),
  )
  .addIntegerOption((o) =>
    described(o.setName('opponent_dice'), 'opt.contest.opponent_dice')
      .setMinValue(0)
      .setMaxValue(30),
  )
  .addIntegerOption((o) =>
    described(o.setName('opponent_npc_level'), 'opt.contest.opponent_npc_level')
      .setMinValue(1)
      .setMaxValue(10),
  )
  .addUserOption((o) => described(o.setName('opponent'), 'opt.contest.opponent'))
  .addIntegerOption((o) =>
    described(o.setName('attribute'), 'opt.contest.attribute').setMinValue(0).setMaxValue(10),
  )
  .addIntegerOption((o) =>
    described(o.setName('opponent_attribute'), 'opt.contest.opponent_attribute')
      .setMinValue(0)
      .setMaxValue(10),
  )
  .addIntegerOption((o) =>
    described(o.setName('difficulty'), 'opt.contest.difficulty').setMinValue(0).setMaxValue(15),
  )
  .addStringOption((o) => described(o.setName('reason'), 'opt.contest.reason').setMaxLength(100));

export const contest: Command = {
  data,
  async execute(interaction, ctx) {
    const locale = localeFor(interaction, ctx.store);
    const opponentDice = interaction.options.getInteger('opponent_dice');
    const npcLevel = interaction.options.getInteger('opponent_npc_level');
    if ((opponentDice === null) === (npcLevel === null)) {
      await interaction.reply({
        content: t(locale, 'contest.error.pool'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const difficulty = interaction.options.getInteger('difficulty') ?? 0;
    const isNpc = npcLevel !== null;
    const myPool = buildPool({
      dice: interaction.options.getInteger('dice', true),
      difficulty,
    }).total;
    const theirPool = buildPool({
      dice: isNpc ? npcPool(npcLevel) : opponentDice!,
      difficulty,
    }).total;
    const mine = evaluate(rollDice(myPool, ctx.roller));
    const theirs = evaluate(rollDice(theirPool, ctx.roller));

    const outcome = resolveContest(
      {
        successes: mine.successes,
        attribute: interaction.options.getInteger('attribute') ?? undefined,
      },
      {
        successes: theirs.successes,
        attribute: interaction.options.getInteger('opponent_attribute') ?? undefined,
        npc: isNpc,
      },
    );

    const me = interaction.user;
    const opponentUser = isNpc ? null : interaction.options.getUser('opponent');
    const myName = me.displayName;
    const theirName = isNpc
      ? t(locale, 'npc.name', { level: npcLevel })
      : (opponentUser?.displayName ?? t(locale, 'contest.opponent'));

    const notes: string[] = [];
    const myGain = grantQuickening(ctx.store, interaction.channelId, me.id, mine.tens);
    const myLine = quickeningLine(locale, myGain.gained, myGain.value, myGain.overflow);
    if (myLine) notes.push(`${myName}: ${myLine}`);
    if (opponentUser) {
      const gain = grantQuickening(ctx.store, interaction.channelId, opponentUser.id, theirs.tens);
      const line = quickeningLine(locale, gain.gained, gain.value, gain.overflow);
      if (line) notes.push(`${theirName}: ${line}`);
    }

    const title = t(locale, 'contest.title', { a: myName, b: theirName });
    const embed = new EmbedBuilder()
      .setTitle(`${title}${reasonSuffix(interaction.options.getString('reason'))}`)
      .setColor(outcome.winner === 'tie' ? COLORS.neutral : COLORS.success)
      .addFields(side(locale, myName, myPool, mine), side(locale, theirName, theirPool, theirs), {
        name: t(locale, 'contest.result'),
        value: describe(locale, outcome, myName, theirName),
      });
    if (notes.length) embed.addFields({ name: 'Quickening', value: notes.join('\n') });
    await interaction.reply({ embeds: [embed] });
  },
};

function reasonSuffix(reason: string | null): string {
  return reason ? `: ${reason}` : '';
}

function side(locale: Locale, name: string, pool: number, result: TestResult) {
  return {
    name: `${name} (${tn(locale, 'dice.count', pool)})`,
    value: `${formatDice(result.dice)}\n${tn(locale, 'roll.successes', result.successes)}`,
    inline: true,
  };
}

function describe(locale: Locale, result: ContestResult, a: string, b: string): string {
  const winner = result.winner === 'a' ? a : b;
  switch (result.tieBreak) {
    case undefined:
      return t(locale, 'contest.win', { winner });
    case 'attribute':
      return t(locale, 'contest.tie.attribute', { winner });
    case 'initiator-or-storyteller':
      return t(locale, 'contest.tie.npc');
    case 'storyteller':
      return t(locale, 'contest.tie.storyteller');
  }
}
