import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { performRoll } from '../game/roll.js';
import { described, localeFor, t } from '../i18n/index.js';
import { rollMessage } from '../ui/format.js';
import { hungerOption } from './shared.js';
import type { Command } from './types.js';

export const FRENZY_TYPES = ['hunger', 'rage', 'fear', 'clan'] as const;
type FrenzyType = (typeof FRENZY_TYPES)[number];

// Frenzy types are game terms: the same in every language.
const FRENZY_NAMES: Record<FrenzyType, string> = {
  hunger: 'Hunger Frenzy',
  rage: 'Rage Frenzy',
  fear: 'Fear Frenzy',
  clan: 'Clan Frenzy',
};

const data = described(new SlashCommandBuilder().setName('frenzy'), 'cmd.frenzy.description')
  .addStringOption((o) =>
    described(o.setName('type'), 'opt.frenzy.type')
      .setRequired(true)
      .addChoices(...FRENZY_TYPES.map((v) => ({ name: FRENZY_NAMES[v], value: v }))),
  )
  .addIntegerOption((o) =>
    described(o.setName('dice'), 'opt.frenzy.dice')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(20),
  )
  .addIntegerOption((o) =>
    described(o.setName('humanity'), 'opt.frenzy.humanity')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(10),
  )
  .addIntegerOption((o) => hungerOption(o, 'opt.frenzy.hunger'))
  .addIntegerOption((o) =>
    described(o.setName('difficulty'), 'opt.frenzy.difficulty').setMinValue(1).setMaxValue(15),
  )
  .addIntegerOption((o) =>
    described(o.setName('bonus'), 'opt.test.bonus').setMinValue(-10).setMaxValue(10),
  );

/**
 * Resisting frenzy (Player Packet pp. 144-147): a Self-Control test, COMPOSURE + RESOLVE,
 * rolling no more dice than the Humanity (or Path) rank. A hunger frenzy's Difficulty is the
 * number of Hunger dice; the others come from the Storyteller (rage 2 ± modifiers,
 * fear from its table, clan 3 + generation modifier).
 */
export const frenzy: Command = {
  data,
  async execute(interaction, ctx) {
    const locale = localeFor(interaction, ctx.store);
    const type = interaction.options.getString('type', true) as FrenzyType;
    const hunger = interaction.options.getInteger('hunger') ?? 0;
    const difficulty =
      interaction.options.getInteger('difficulty') ?? (type === 'hunger' ? hunger : null);
    if (!difficulty) {
      await interaction.reply({
        content: t(locale, type === 'hunger' ? 'frenzy.error.noHunger' : 'frenzy.error.difficulty'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const humanity = interaction.options.getInteger('humanity', true);
    const modifier = interaction.options.getInteger('bonus') ?? 0;
    // The cap applies to the final pool, bonuses included.
    const pool = Math.max(0, interaction.options.getInteger('dice', true) + modifier);
    const capped = Math.min(pool, humanity);
    const response = performRoll(
      {
        channelId: interaction.channelId,
        userId: interaction.user.id,
        dice: capped,
        difficulty,
        modifier: 0,
        hunger,
        takeHalf: false,
        retry: false,
      },
      { roller: ctx.roller },
    );
    const won =
      response.kind === 'rolled'
        ? response.result.outcome === 'success'
        : response.kind === 'half' && response.won === true;
    const painful = response.kind === 'rolled' && response.result.outcome === 'painful-failure';
    const name = FRENZY_NAMES[type];
    const notes = [];
    if (capped < pool) {
      notes.push({ name: 'Humanity', value: t(locale, 'frenzy.capped', { pool, humanity }) });
    }
    notes.push({
      name,
      value: won
        ? t(locale, 'frenzy.resisted')
        : t(locale, painful ? 'frenzy.painful' : 'frenzy.suffered', { frenzy: name }),
    });
    const title = `${interaction.user.displayName}: ${t(locale, 'frenzy.title', { frenzy: name })}`;
    const message = rollMessage(locale, response, title, notes);
    // Resisting frenzy is its own call: no bargain, no second attempt, no reroll buttons.
    message.components = [];
    await interaction.reply(message);
  },
};
