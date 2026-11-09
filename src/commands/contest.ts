import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { resolveContest, type ContestResult } from '../dice/contest.js';
import { rollDice, type DieRoller } from '../dice/roller.js';
import { buildPool, evaluate, type TestResult } from '../dice/test.js';
import { described, localeFor, t, tn, type Locale } from '../i18n/index.js';
import { COLORS, TERMS, formatDice } from '../ui/format.js';
import { hungerOption } from './shared.js';
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
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(30),
  )
  .addUserOption((o) => described(o.setName('opponent'), 'opt.contest.opponent'))
  .addIntegerOption((o) =>
    described(o.setName('attribute'), 'opt.contest.attribute').setMinValue(0).setMaxValue(10),
  )
  .addIntegerOption((o) =>
    described(o.setName('opponent_attribute'), 'opt.contest.opponent_attribute')
      .setMinValue(0)
      .setMaxValue(15),
  )
  .addIntegerOption((o) => hungerOption(o, 'opt.contest.hunger'))
  .addIntegerOption((o) =>
    hungerOption(o, 'opt.contest.opponent_hunger').setName('opponent_hunger'),
  )
  .addStringOption((o) => described(o.setName('reason'), 'opt.contest.reason').setMaxLength(100));

interface Side {
  name: string;
  pool: number;
  result: TestResult;
  /** A player character: painful and bestial failures apply. */
  player: boolean;
}

function rollSide(dice: number, hunger: number, roller?: DieRoller): TestResult {
  const pool = buildPool({ dice, hunger });
  return evaluate(rollDice(pool.normal, roller), rollDice(pool.hunger, roller));
}

export const contest: Command = {
  data,
  async execute(interaction, ctx) {
    const { store, roller } = ctx;
    const locale = localeFor(interaction, store);
    const me = interaction.user;
    const opponentUser = interaction.options.getUser('opponent');
    const myDice = interaction.options.getInteger('dice', true);
    const theirDice = interaction.options.getInteger('opponent_dice', true);

    const myHunger = interaction.options.getInteger('hunger') ?? 0;
    const givenTheirHunger = interaction.options.getInteger('opponent_hunger');
    const theirHunger = givenTheirHunger ?? 0;

    const mine: Side = {
      name: me.displayName,
      pool: myDice,
      result: rollSide(myDice, myHunger, roller),
      player: true,
    };
    const theirs: Side = {
      name: opponentUser?.displayName ?? t(locale, 'contest.opponent'),
      pool: theirDice,
      result: rollSide(theirDice, theirHunger, roller),
      player: opponentUser !== null || givenTheirHunger !== null,
    };

    const outcome = resolveContest(
      {
        successes: mine.result.successes,
        attribute: interaction.options.getInteger('attribute') ?? undefined,
      },
      {
        successes: theirs.result.successes,
        attribute: interaction.options.getInteger('opponent_attribute') ?? undefined,
      },
    );

    const title = t(locale, 'contest.title', { a: mine.name, b: theirs.name });
    const reason = interaction.options.getString('reason');
    const embed = new EmbedBuilder()
      .setTitle(reason ? `${title}: ${reason}` : title)
      .setColor(outcome.winner === 'tie' ? COLORS.neutral : COLORS.success)
      .addFields(field(locale, mine), field(locale, theirs), {
        name: t(locale, 'contest.result'),
        value: describe(
          locale,
          outcome,
          mine.name,
          theirs.name,
          Math.abs(mine.result.successes - theirs.result.successes),
        ),
      });

    const notes: string[] = [];
    for (const [side, key] of [
      [mine, 'a'],
      [theirs, 'b'],
    ] as const) {
      if (!side.player) continue;
      const lost = outcome.winner !== 'tie' && outcome.winner !== key;
      if (side.result.successes === 0) notes.push(`${side.name}: **${TERMS.painful}**`);
      if (side.result.hungerOnes > 0 && lost) notes.push(`${side.name}: **${TERMS.bestial}**`);
      if (side.result.hungerOnes > 0 && outcome.winner === 'tie') {
        notes.push(`${side.name}: ${t(locale, 'contest.bestialIfLost')}`);
      }
    }
    if (notes.length)
      embed.addFields({ name: t(locale, 'contest.consequences'), value: notes.join('\n') });
    await interaction.reply({ embeds: [embed] });
  },
};

function field(locale: Locale, side: Side) {
  const { result } = side;
  const lines = [formatDice(result.dice)];
  if (result.hunger.length) lines.push(`${TERMS.hunger}: ${formatDice(result.hunger)}`);
  lines.push(tn(locale, 'roll.successes', result.successes));
  return {
    name: `${side.name} (${tn(locale, 'dice.count', side.pool)})`,
    value: lines.join('\n'),
    inline: true,
  };
}

/** The winner and its margin of success: the loser's margin of failure (p. 97). */
function describe(
  locale: Locale,
  result: ContestResult,
  a: string,
  b: string,
  margin: number,
): string {
  const winner = result.winner === 'a' ? a : b;
  switch (result.tieBreak) {
    case undefined:
      return `${t(locale, 'contest.win', { winner })} (${t(locale, 'roll.margin', { margin: `+${margin}` })})`;
    case 'attribute':
      return t(locale, 'contest.tie.attribute', { winner });
    case 'initiator':
      return t(locale, 'contest.tie.initiator');
  }
}
