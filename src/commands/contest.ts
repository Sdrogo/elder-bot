import {
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type ButtonBuilder,
} from 'discord.js';
import { resolveContest, type ContestResult } from '../dice/contest.js';
import { rollDice, type DieRoller } from '../dice/roller.js';
import { buildPool, evaluate, type TestResult } from '../dice/test.js';
import { described, localeFor, t, tn, type Locale, type MessageKey } from '../i18n/index.js';
import { decodeTrait, recipe } from '../game/sheetPool.js';
import {
  respondSheetChoices,
  rollFromSheet,
  surgeEndButton,
  type SheetOptionNames,
  type SheetSide,
} from './sheetRoll.js';
import { COLORS, TERMS, formatDice } from '../ui/format.js';
import { hungerDice } from '../game/character.js';
import { rollerHunger } from './campaignShared.js';
import { showRoll } from '../game/shownRoll.js';
import { hungerOption, where } from './shared.js';
import type { Command } from './types.js';

const NAMES: SheetOptionNames = {
  attribute: 'attribute',
  with: 'with',
  specialty: 'specialization',
  surge: 'surge',
  surgeBonus: 'surge_bonus',
};
const OPPONENT: SheetOptionNames = {
  attribute: 'opponent_attribute',
  with: 'opponent_with',
  specialty: 'opponent_specialization',
};

const data = described(new SlashCommandBuilder().setName('contest'), 'cmd.contest.description')
  .addIntegerOption((o) =>
    described(o.setName('dice'), 'opt.contest.dice').setMinValue(0).setMaxValue(30),
  )
  .addStringOption((o) =>
    described(o.setName('attribute'), 'opt.contest.attribute')
      .setAutocomplete(true)
      .setMaxLength(40),
  )
  .addStringOption((o) => described(o.setName('with'), 'opt.contest.with').setAutocomplete(true))
  .addStringOption((o) =>
    described(o.setName('specialization'), 'opt.contest.specialization').setAutocomplete(true),
  )
  .addStringOption((o) => described(o.setName('surge'), 'opt.contest.surge').setAutocomplete(true))
  .addStringOption((o) =>
    described(o.setName('surge_bonus'), 'opt.contest.surge_bonus').setAutocomplete(true),
  )
  .addUserOption((o) => described(o.setName('opponent'), 'opt.contest.opponent'))
  .addIntegerOption((o) =>
    described(o.setName('opponent_dice'), 'opt.contest.opponent_dice')
      .setMinValue(0)
      .setMaxValue(30),
  )
  .addStringOption((o) =>
    described(o.setName('opponent_attribute'), 'opt.contest.opponent_attribute')
      .setAutocomplete(true)
      .setMaxLength(40),
  )
  .addStringOption((o) =>
    described(o.setName('opponent_with'), 'opt.contest.opponent_with').setAutocomplete(true),
  )
  .addStringOption((o) =>
    described(
      o.setName('opponent_specialization'),
      'opt.contest.opponent_specialization',
    ).setAutocomplete(true),
  )
  .addIntegerOption((o) =>
    hungerOption(o, 'opt.contest.opponent_hunger').setName('opponent_hunger'),
  )
  .addStringOption((o) => described(o.setName('reason'), 'opt.contest.reason').setMaxLength(100));

/** A tie-break Attribute typed as a number (a roll with `dice`, or an NPC: half its pool). */
export function tieNumber(text: string | null): number | undefined {
  if (text === null || !/^\s*\d{1,2}\s*$/.test(text)) return undefined;
  return Math.min(15, Number(text));
}

/** True when the options ask for a pool from a sheet rather than a number. */
export function wantsSheet(attribute: string | null, second: string | null, surge?: string | null) {
  return second !== null || (surge ?? null) !== null || decodeTrait(attribute) !== undefined;
}

/** The Attribute of a sheet pool, Blood Surge included: it breaks ties (p. 95). */
const tieOf = (side: SheetSide) => side.pool.parts[0]!.dots + (side.pool.parts[0]!.surge ?? 0);

interface Side {
  name: string;
  pool: number;
  result: TestResult;
  /** A player character: painful and bestial failures apply. */
  player: boolean;
  /** The pool as a sum, when it came from a character sheet. */
  recipe?: string;
}

function rollSide(dice: number, hunger: number, roller?: DieRoller): TestResult {
  const pool = buildPool({ dice, hunger });
  return evaluate(rollDice(pool.normal, roller), rollDice(pool.hunger, roller));
}

export const contest: Command = {
  data,
  async autocomplete(interaction, ctx) {
    const focused = interaction.options.getFocused(true).name;
    if (focused.startsWith('opponent_')) {
      const opponent = interaction.options.get('opponent')?.value;
      if (typeof opponent !== 'string') {
        if (focused === OPPONENT.attribute) return interaction.respond([]);
        const locale = localeFor(interaction, ctx.store);
        return interaction.respond([
          { name: t(locale, 'sheetRoll.hint.pickOpponent'), value: 'none' },
        ]);
      }
      await respondSheetChoices(interaction, ctx, opponent, OPPONENT, { numbersAllowed: true });
      return;
    }
    await respondSheetChoices(interaction, ctx, interaction.user.id, NAMES, {
      numbersAllowed: true,
    });
  },

  async execute(interaction, ctx) {
    const { store, roller } = ctx;
    const locale = localeFor(interaction, store);
    const me = interaction.user;
    const opponentUser = interaction.options.getUser('opponent');
    const place = { guildId: interaction.guildId, channelId: interaction.channelId };
    const refuse = (key: MessageKey, params: Record<string, string | number> = {}) =>
      interaction.reply({ content: t(locale, key, params), flags: MessageFlags.Ephemeral });
    const opt = (name: string) => interaction.options.getString(name);

    // My pool: a number, or Attribute + trait from my sheet (with a Blood Surge if I buy one).
    const myDiceOption = interaction.options.getInteger('dice');
    let mySheet: SheetSide | undefined;
    if (
      wantsSheet(
        opt('attribute'),
        opt('with'),
        opt('surge') ?? opt('surge_bonus') ?? opt('specialization'),
      )
    ) {
      if (myDiceOption !== null) return void (await refuse('sheetRoll.mixed'));
      const side = rollFromSheet(
        ctx,
        locale,
        place,
        me.id,
        me.id,
        {
          attribute: opt('attribute'),
          with: opt('with'),
          specialty: opt('specialization'),
          surge: opt('surge'),
          surgeBonus: opt('surge_bonus'),
        },
        NAMES,
      );
      if ('refuse' in side) return void (await refuse(side.refuse, side.params));
      mySheet = side;
    } else if (myDiceOption === null) {
      return void (await refuse('sheetRoll.contest.needPool'));
    }

    // The opponent's pool: a number, or Attribute + trait from the opposing player's sheet.
    const theirDiceOption = interaction.options.getInteger('opponent_dice');
    let theirSheet: SheetSide | undefined;
    if (
      wantsSheet(opt('opponent_attribute'), opt('opponent_with'), opt('opponent_specialization'))
    ) {
      if (theirDiceOption !== null) return void (await refuse('sheetRoll.mixed'));
      if (!opponentUser) return void (await refuse('sheetRoll.contest.needOpponent'));
      const side = rollFromSheet(
        ctx,
        locale,
        place,
        opponentUser.id,
        me.id,
        {
          attribute: opt('opponent_attribute'),
          with: opt('opponent_with'),
          specialty: opt('opponent_specialization'),
        },
        OPPONENT,
      );
      if ('refuse' in side) return void (await refuse(side.refuse, side.params));
      theirSheet = side;
    } else if (theirDiceOption === null) {
      return void (await refuse('sheetRoll.contest.needOpponentPool'));
    }

    const myDice = mySheet?.pool.dice ?? myDiceOption!;
    const theirDice = theirSheet?.pool.dice ?? theirDiceOption!;

    // Hunger dice not typed come from each player's character at this channel's Chronicle.
    const myHunger = rollerHunger(interaction, ctx, locale, 'hunger', mySheet?.character).hunger;
    const givenTheirHunger = interaction.options.getInteger('opponent_hunger');
    const theirCharacter =
      theirSheet?.character ??
      (opponentUser
        ? store.campaign.activeCharacter(interaction.channelId, opponentUser.id)
        : undefined);
    const theirHunger =
      givenTheirHunger ?? (theirCharacter ? hungerDice(theirCharacter.values) : 0);

    const mine: Side = {
      name: me.displayName,
      pool: myDice,
      result: rollSide(myDice, myHunger, roller),
      player: true,
      ...(mySheet ? { recipe: recipe(mySheet.pool) } : {}),
    };
    const theirs: Side = {
      name: opponentUser?.displayName ?? t(locale, 'contest.opponent'),
      pool: theirDice,
      result: rollSide(theirDice, theirHunger, roller),
      player: opponentUser !== null || givenTheirHunger !== null,
      ...(theirSheet ? { recipe: recipe(theirSheet.pool) } : {}),
    };

    const outcome = resolveContest(
      {
        successes: mine.result.successes,
        attribute: mySheet ? tieOf(mySheet) : tieNumber(opt('attribute')),
      },
      {
        successes: theirs.result.successes,
        attribute: theirSheet ? tieOf(theirSheet) : tieNumber(opt('opponent_attribute')),
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
    // Blood Surge, Impairment and the like, after the recipe each side already shows.
    for (const [side, sheet] of [
      [mine, mySheet],
      [theirs, theirSheet],
    ] as const) {
      const extra = sheet?.notes.slice(1) ?? [];
      if (extra.length) {
        embed.addFields({
          name: side.name,
          value: extra
            .map((n) => n.value)
            .join('\n')
            .slice(0, 1024),
        });
      }
    }
    const buttons = mySheet ? surgeEndButton(locale, mySheet) : [];
    await interaction.reply({
      embeds: [embed],
      components: buttons.length
        ? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
        : [],
    });
    showRoll(store, where(interaction), (who) => {
      const side = (s: Side, name: string) => ({
        who: name,
        normal: s.result.dice,
        hunger: s.result.hunger,
        successes: s.result.successes,
      });
      const them = theirCharacter?.name ?? theirs.name;
      const winner = outcome.winner === 'a' ? who : outcome.winner === 'b' ? them : '';
      return {
        label: reason ?? 'Contested Test',
        sides: [side(mine, who), side(theirs, them)],
        outcome: winner ? `Vince ${winner}` : 'Pareggio',
        tone: winner ? 'win' : 'neutral',
      };
    });
  },
};

function field(locale: Locale, side: Side) {
  const { result } = side;
  const lines = side.recipe ? [side.recipe, formatDice(result.dice)] : [formatDice(result.dice)];
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
