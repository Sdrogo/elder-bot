import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { described, localeFor, t, type MessageKey } from '../i18n/index.js';
import { rollerHunger } from './campaignShared.js';
import { addTestOptions, replyWithRoll } from './shared.js';
import { respondSheetChoices, rollFromSheet, shortTitle, surgeEndButton } from './sheetRoll.js';
import type { Command } from './types.js';

// /elder roll takes the pool as a number (`dice`) or from the character's sheet:
// an `attribute` plus what goes `with` it (Skill, specialty, Discipline, power, Attribute,
// lifepath), with an optional [Blood Surge] (`surge`) bought with Vitae for the scene.

const SHEET_OPTIONS = ['attribute', 'with', 'surge'] as const;
const NAMES = { attribute: 'attribute', with: 'with', surge: 'surge' };

const data = addTestOptions(
  described(new SlashCommandBuilder().setName('roll'), 'cmd.roll.description')
    .addIntegerOption((o) =>
      described(o.setName('dice'), 'opt.roll.dice').setMinValue(0).setMaxValue(30),
    )
    .addStringOption((o) =>
      described(o.setName('attribute'), 'opt.roll.attribute').setAutocomplete(true),
    )
    .addStringOption((o) => described(o.setName('with'), 'opt.roll.with').setAutocomplete(true))
    .addStringOption((o) =>
      described(o.setName('surge'), 'opt.roll.surge').setAutocomplete(true),
    ) as SlashCommandBuilder,
).addBooleanOption((o) => described(o.setName('npc'), 'opt.roll.npc'));

export const roll: Command = {
  data,

  async autocomplete(interaction, ctx) {
    await respondSheetChoices(interaction, ctx, interaction.user.id, NAMES);
  },

  async execute(interaction, ctx) {
    const locale = localeFor(interaction, ctx.store);
    // An NPC's pool from its stat block: no Hunger dice, no Willpower, no Beast's Bargain.
    const npc = interaction.options.getBoolean('npc') ?? false;
    const dice = interaction.options.getInteger('dice');
    const fromSheet = SHEET_OPTIONS.some((o) => interaction.options.getString(o) !== null);

    const refuse = (key: MessageKey, params: Record<string, string | number> = {}) =>
      interaction.reply({ content: t(locale, key, params), flags: MessageFlags.Ephemeral });

    if (fromSheet && npc) return void (await refuse('sheetRoll.npc'));
    if (fromSheet && dice !== null) return void (await refuse('sheetRoll.mixed'));
    if (!fromSheet) {
      if (dice === null) return void (await refuse('sheetRoll.needPool'));
      const title = t(locale, npc ? 'npc.name' : 'roll.title');
      await replyWithRoll(interaction, ctx, dice, title, { npc });
      return;
    }

    const side = rollFromSheet(
      ctx,
      locale,
      { guildId: interaction.guildId, channelId: interaction.channelId },
      interaction.user.id,
      interaction.user.id,
      {
        attribute: interaction.options.getString('attribute'),
        with: interaction.options.getString('with'),
        surge: interaction.options.getString('surge'),
      },
      NAMES,
    );
    if ('refuse' in side) return void (await refuse(side.refuse, side.params));
    const hunger = rollerHunger(interaction, ctx, locale, 'hunger', side.character);
    await replyWithRoll(interaction, ctx, side.pool.dice, shortTitle(side.pool), {
      hunger,
      notes: side.notes,
      extraButtons: surgeEndButton(locale, side),
    });
  },
};
