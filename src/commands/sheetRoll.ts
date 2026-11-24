import { ButtonStyle, type APIEmbedField, type AutocompleteInteraction } from 'discord.js';
import { localeFor, t, type Locale, type MessageKey } from '../i18n/index.js';
import { ATTRIBUTE_NAMES, type Attribute } from '../game/alpha2/core.js';
import {
  attributeChoices,
  buildSheetPool,
  checkSurge,
  decodeSurgeBonus,
  decodeSurgeKey,
  surgeBonusChoices,
  decodeTrait,
  recipe,
  secondChoices,
  specialtyChoices,
  decodeSpecialty,
  surgeChoices,
  surgeKeysOf,
  surgeLabel,
  type PoolIssue,
  type SheetPool,
  type SurgeKey,
  type Surges,
  type TraitChoice,
} from '../game/sheetPool.js';
import { attributeDots, type SheetDraft } from '../game/creation.js';
import type { Character } from '../state/campaign.js';
import { button } from '../ui/format.js';
import { encodeSurgeEndId } from '../interactions/surgeButtons.js';
import { sheetCharacter } from './campaignShared.js';
import type { Context } from './types.js';

// Pools from a character's sheet, shared by /elder roll and /elder contest: the options'
// suggestions, the checks, the Blood Surge purchase and the notes shown on the roll.

const MAX_CHOICES = 25;

export const ISSUE_KEYS: Record<PoolIssue, MessageKey> = {
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

/** Option names of one side of a roll: the roller's, or the opponent's in a contest. */
export interface SheetOptionNames {
  attribute: string;
  with: string;
  specialty: string;
  surge?: string;
  surgeBonus?: string;
}

/**
 * Suggestions for the focused sheet option, read from `userId`'s character at this table.
 * `numbersAllowed`: the option also takes a plain number (a tie-break Attribute), so a missing
 * sheet answers with no suggestions instead of a hint.
 */
export async function respondSheetChoices(
  interaction: AutocompleteInteraction,
  ctx: Context,
  userId: string,
  names: SheetOptionNames,
  { numbersAllowed = false }: { numbersAllowed?: boolean } = {},
): Promise<void> {
  const focused = interaction.options.getFocused(true);
  const found = sheetCharacter(ctx, {
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    userId,
  });
  if (!found.sheet) {
    if (numbersAllowed && focused.name === names.attribute) return interaction.respond([]);
    const locale = localeFor(interaction, ctx.store);
    const key = found.character ? 'sheetRoll.hint.noSheet' : 'sheetRoll.hint.noCharacter';
    return interaction.respond([{ name: t(locale, key).slice(0, 100), value: 'none' }]);
  }
  const { character, sheet } = found;
  const surges = ctx.store.campaign.getSurges(character.id);
  const impairments = ctx.store.campaign.getImpairments(character.id);
  const attribute = decodeTrait(interaction.options.getString(names.attribute));
  const second = decodeTrait(interaction.options.getString(names.with));
  let choices: TraitChoice[] = [];
  if (focused.name === names.attribute) {
    choices = attributeChoices(sheet, character.values, surges, impairments);
  } else if (focused.name === names.with) {
    const a = attribute?.kind === 'attr' ? attribute.id : undefined;
    choices = secondChoices(sheet, character.values, surges, a, impairments);
  } else if (focused.name === names.specialty) {
    choices = specialtyChoices(sheet, second);
    if (!choices.length) {
      const locale = localeFor(interaction, ctx.store);
      return interaction.respond([
        { name: t(locale, 'sheetRoll.hint.noSpecialties').slice(0, 100), value: 'none' },
      ]);
    }
  } else if (focused.name === names.surge) {
    choices = surgeChoices(sheet, character.values, surges, surgeKeysOf(attribute, second));
  } else if (focused.name === names.surgeBonus) {
    const key = decodeSurgeKey(interaction.options.getString(names.surge ?? ''));
    choices = key ? surgeBonusChoices(sheet, character.values, surges, key) : [];
    if (!choices.length) {
      const locale = localeFor(interaction, ctx.store);
      return interaction.respond([
        { name: t(locale, 'sheetRoll.hint.pickSurge').slice(0, 100), value: 'none' },
      ]);
    }
  }
  await interaction.respond(matching(choices, String(focused.value)));
}

export interface SheetSide {
  character: Character;
  sheet: SheetDraft;
  pool: SheetPool;
  surges: Surges;
  /** The recipe, Blood Surge, Impairment and other notes for the roll's embed. */
  notes: APIEmbedField[];
}

export type SheetRefusal = { refuse: MessageKey; params?: Record<string, string | number> };

/**
 * Builds a pool from `userId`'s sheet with the values picked in the options. A new Blood Surge
 * is paid in Vitae (by `actorId`) only once the pool is known to be valid.
 */
export function rollFromSheet(
  ctx: Context,
  locale: Locale,
  where: { guildId: string | null; channelId: string | null },
  userId: string,
  actorId: string,
  values: {
    attribute: string | null;
    with: string | null;
    specialty: string | null;
    surge?: string | null;
    surgeBonus?: string | null;
  },
  names: SheetOptionNames,
): SheetSide | SheetRefusal {
  const found = sheetCharacter(ctx, { ...where, userId });
  if (!found.sheet) {
    return found.character
      ? { refuse: 'sheetRoll.noSheet', params: { name: found.character.name } }
      : { refuse: 'sheetRoll.noCharacter' };
  }
  const { sheet } = found;
  let character = found.character;
  const { campaign } = ctx.store;

  const attribute = decodeTrait(values.attribute);
  const second = decodeTrait(values.with);
  const surgeKey = decodeSurgeKey(values.surge);
  const surgeBonus = decodeSurgeBonus(values.surgeBonus);
  const specialty = decodeSpecialty(values.specialty);
  // A value typed by hand instead of picked from the list.
  for (const [name, text, decoded] of [
    [names.attribute, values.attribute, attribute],
    [names.with, values.with, second],
    [names.specialty, values.specialty, specialty],
    [names.surge ?? '', values.surge, surgeKey],
    [names.surgeBonus ?? '', values.surgeBonus, surgeBonus],
  ] as const) {
    if (text != null && decoded === undefined) {
      return { refuse: 'sheetRoll.pickFromList', params: { option: name } };
    }
  }

  // The bonus goes with a trait picked in `surge`; without one, +1.
  if (surgeBonus !== undefined && !surgeKey) return { refuse: 'sheetRoll.issue.bonusNeedsSurge' };
  const surge = surgeKey ? { key: surgeKey, dots: surgeBonus ?? 1 } : undefined;

  // A specialty adds a die to the Skill picked in `with`, and to nothing else.
  if (specialty !== undefined && second?.kind !== 'skill') {
    return { refuse: 'sheetRoll.issue.specialtyNeedsSkill' };
  }
  const withSpecialty =
    second?.kind === 'skill' && specialty !== undefined ? { ...second, specialty } : second;

  let surges = campaign.getSurges(character.id);
  const impairments = campaign.getImpairments(character.id);
  const input = {
    sheet,
    ...(attribute ? { attribute } : {}),
    ...(withSpecialty ? { second: withSpecialty } : {}),
  };
  // Check the pool before spending any Vitae.
  const trial = buildSheetPool({ ...input, values: character.values, surges, impairments });
  if (typeof trial === 'string') return { refuse: ISSUE_KEYS[trial] };

  const notes: APIEmbedField[] = [];
  if (surge) {
    const check = checkSurge(sheet, character.values, surges, surge);
    if (typeof check === 'string') return { refuse: ISSUE_KEYS[check] };
    // Blood Surge comes before the test: the Vitae go first, so Hunger is the new one.
    const spent = campaign.setTrack(
      character.id,
      'vitae',
      character.values.vitae - check.cost,
      actorId,
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
    ...input,
    values: character.values,
    surges,
    impairments,
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
  return { character, sheet, pool, surges, notes };
}

/** "Dexterity + Fighting": the pool's parts without numbers, for titles and the overlay. */
export function shortTitle(pool: SheetPool): string {
  return pool.parts.map((p) => p.label).join(' + ');
}

/** The "End Blood Surge" button, when the character has surges running. */
export function surgeEndButton(locale: Locale, side: SheetSide) {
  return Object.keys(side.surges).length
    ? [
        button(
          encodeSurgeEndId(side.character.id),
          t(locale, 'button.surgeEnd'),
          ButtonStyle.Secondary,
        ),
      ]
    : [];
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
  sheet: SheetDraft,
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
