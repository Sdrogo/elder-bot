import { ButtonStyle, MessageFlags, SlashCommandBuilder, type APIEmbedField } from 'discord.js';
import { described, localeFor, t, type Locale, type MessageKey } from '../i18n/index.js';
import { ATTRIBUTE_NAMES, type Attribute } from '../game/alpha2/core.js';
import {
  attributeChoices,
  buildSheetPool,
  checkSurge,
  decodeSurge,
  decodeTrait,
  recipe,
  secondChoices,
  surgeChoices,
  surgeKeysOf,
  surgeLabel,
  type PoolIssue,
  type SheetPool,
  type SurgeKey,
  type Surges,
  type TraitChoice,
} from '../game/sheetPool.js';
import { attributeDots } from '../game/creation.js';
import { button } from '../ui/format.js';
import { encodeSurgeEndId } from '../interactions/surgeButtons.js';
import { rollerHunger, sheetCharacter } from './campaignShared.js';
import { addTestOptions, replyWithRoll } from './shared.js';
import type { Command } from './types.js';

// /elder roll takes the pool as a number (`dice`) or from the character's sheet:
// an `attribute` plus what goes `with` it (Skill, specialty, Discipline, power, Attribute,
// lifepath), with an optional [Blood Surge] (`surge`) bought with Vitae for the scene.

const SHEET_OPTIONS = ['attribute', 'with', 'surge'] as const;
const MAX_CHOICES = 25;

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

const ISSUE_KEYS: Record<PoolIssue, MessageKey> = {
  'need-attribute': 'sheetRoll.issue.needAttribute',
  'need-second': 'sheetRoll.issue.needSecond',
  'same-attribute': 'sheetRoll.issue.sameAttribute',
  'unknown-trait': 'sheetRoll.issue.unknownTrait',
  'no-power': 'sheetRoll.issue.noPower',
  'no-discipline': 'sheetRoll.issue.noDiscipline',
  'no-specialty': 'sheetRoll.issue.noSpecialty',
  'surge-no-discipline': 'sheetRoll.issue.surgeNoDiscipline',
  'surge-limit': 'sheetRoll.issue.surgeLimit',
  'surge-vitae': 'sheetRoll.issue.surgeVitae',
};

function matching(choices: TraitChoice[], typed: string) {
  const words = typed.toLowerCase().split(/\s+/).filter(Boolean);
  return choices
    .filter((c) => words.every((w) => c.name.toLowerCase().includes(w)))
    .slice(0, MAX_CHOICES)
    .map((c) => ({ name: c.name.slice(0, 100), value: c.value }));
}

export const roll: Command = {
  data,

  async autocomplete(interaction, ctx) {
    const focused = interaction.options.getFocused(true);
    const found = sheetCharacter(ctx, {
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
    });
    if (!found.sheet) {
      const locale = localeFor(interaction, ctx.store);
      const key = found.character ? 'sheetRoll.hint.noSheet' : 'sheetRoll.hint.noCharacter';
      return interaction.respond([{ name: t(locale, key).slice(0, 100), value: 'none' }]);
    }
    const { character, sheet } = found;
    const surges = ctx.store.campaign.getSurges(character.id);
    const attribute = decodeTrait(interaction.options.getString('attribute'));
    const second = decodeTrait(interaction.options.getString('with'));
    const typed = String(focused.value);
    let choices: TraitChoice[] = [];
    if (focused.name === 'attribute') {
      choices = attributeChoices(sheet, character.values, surges);
    } else if (focused.name === 'with') {
      const a = attribute?.kind === 'attr' ? attribute.id : undefined;
      choices = secondChoices(sheet, character.values, surges, a);
    } else if (focused.name === 'surge') {
      choices = surgeChoices(sheet, character.values, surges, surgeKeysOf(attribute, second));
    }
    await interaction.respond(matching(choices, typed));
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

    const found = sheetCharacter(ctx, {
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
    });
    if (!found.sheet) {
      return void (await (found.character
        ? refuse('sheetRoll.noSheet', { name: found.character.name })
        : refuse('sheetRoll.noCharacter')));
    }
    const { sheet } = found;
    let character = found.character;
    const { campaign } = ctx.store;

    const attribute = decodeTrait(interaction.options.getString('attribute'));
    const second = decodeTrait(interaction.options.getString('with'));
    const surgeText = interaction.options.getString('surge');
    const surge = decodeSurge(surgeText);
    // A value typed by hand instead of picked from the list.
    for (const [name, decoded] of [
      ['attribute', attribute],
      ['with', second],
      ['surge', surge],
    ] as const) {
      if (interaction.options.getString(name) !== null && !decoded) {
        return void (await refuse('sheetRoll.pickFromList', { option: name }));
      }
    }

    let surges = campaign.getSurges(character.id);
    const notes: APIEmbedField[] = [];
    // Check the pool before spending any Vitae.
    const trial = buildSheetPool({
      sheet,
      values: character.values,
      surges,
      ...(attribute ? { attribute } : {}),
      ...(second ? { second } : {}),
    });
    if (typeof trial === 'string') return void (await refuse(ISSUE_KEYS[trial]));

    if (surge) {
      const check = checkSurge(sheet, character.values, surges, surge);
      if (typeof check === 'string') return void (await refuse(ISSUE_KEYS[check]));
      // Blood Surge comes before the test: the Vitae go first, so Hunger is the new one.
      const spent = campaign.setTrack(
        character.id,
        'vitae',
        character.values.vitae - check.cost,
        interaction.user.id,
      );
      if (spent) character = spent;
      campaign.setSurges(character.id, check.surges);
      surges = check.surges;
      notes.push({
        name: 'Blood Surge',
        value: t(locale, 'sheetRoll.surgeSpent', {
          name: character.name,
          cost: check.cost,
          trait: surgeLabel(surge.key),
          dots: surge.dots,
        }),
      });
    }

    const pool = buildSheetPool({
      sheet,
      values: character.values,
      surges,
      ...(attribute ? { attribute } : {}),
      ...(second ? { second } : {}),
    }) as SheetPool;

    notes.unshift({ name: t(locale, 'sheetRoll.pool'), value: recipe(pool) });
    if (pool.impairment) {
      notes.push({
        name: 'Impairment',
        value: t(locale, 'sheetRoll.impaired', {
          attributes: pool.impaired.map((a) => ATTRIBUTE_NAMES[a]).join(', '),
          dice: pool.impairment,
        }),
      });
    }
    if (pool.powerAttribute) {
      notes.push({
        name: 'Power test',
        value: t(locale, 'sheetRoll.powerAttribute', {
          attribute: ATTRIBUTE_NAMES[pool.powerAttribute],
        }),
      });
    }
    const differs = trackerDifference(locale, sheet, character.values, pool.attribute);
    if (differs) notes.push(differs);
    const active = activeSurges(locale, surges, surge?.key);
    if (active) notes.push(active);

    const hunger = rollerHunger(interaction, ctx, locale, 'hunger', character);
    const extraButtons = Object.keys(surges).length
      ? [
          button(
            encodeSurgeEndId(character.id),
            t(locale, 'button.surgeEnd'),
            ButtonStyle.Secondary,
          ),
        ]
      : [];
    await replyWithRoll(interaction, ctx, pool.dice, shortTitle(pool), {
      hunger,
      notes,
      extraButtons,
    });
  },
};

/** "Dexterity + Fighting": the pool's parts without numbers, for titles and the overlay. */
function shortTitle(pool: SheetPool): string {
  return pool.parts.map((p) => p.label).join(' + ');
}

/** Surges still running from earlier in the scene (the new one has its own note). */
function activeSurges(locale: Locale, surges: Surges, fresh?: SurgeKey): APIEmbedField | undefined {
  const list = (Object.entries(surges) as [SurgeKey, number][])
    .filter(([key]) => key !== fresh)
    .map(([key, dots]) => `${surgeLabel(key)} +${dots}`);
  if (!list.length) return undefined;
  return {
    name: 'Blood Surge',
    value: t(locale, 'sheetRoll.surgeActive', { list: list.join(', ') }),
  };
}

/** Stamina, Composure and Resolve live on the sheet and on the trackers: say when they differ. */
function trackerDifference(
  locale: Locale,
  sheet: Parameters<typeof attributeDots>[0],
  values: { stamina: number; composure: number; resolve: number },
  attribute: Attribute,
): APIEmbedField | undefined {
  if (attribute !== 'stamina' && attribute !== 'composure' && attribute !== 'resolve') return;
  const onSheet = attributeDots(sheet, attribute);
  if (onSheet === values[attribute]) return undefined;
  return {
    name: ATTRIBUTE_NAMES[attribute],
    value: t(locale, 'sheetRoll.trackerDiffers', {
      attribute: ATTRIBUTE_NAMES[attribute],
      sheet: onSheet,
      tracker: values[attribute],
    }),
  };
}
