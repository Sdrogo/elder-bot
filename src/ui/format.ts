import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type APIEmbedField,
} from 'discord.js';
import { SUCCESS_THRESHOLD, type TestResult } from '../dice/test.js';
import type { Pool } from '../dice/test.js';
import { t, tn, type Locale } from '../i18n/index.js';
import type { RollRequest, RollResponse } from '../game/roll.js';
import { encodeRollId } from './customId.js';
import { diceEmoji } from './diceEmojis.js';

export const COLORS = {
  success: 0x2e7d32,
  failure: 0x616161,
  painful: 0xb71c1c,
  bestial: 0x4a0000,
  neutral: 0x6a1b9a,
};

// Outcomes and other game terms are the same in every language.
export const TERMS = {
  success: 'Success',
  criticalWin: 'Critical Win',
  failure: 'Failure',
  painful: 'Painful Failure',
  bestial: 'Bestial Failure',
  complication: 'Complication',
  bargain: "Beast's Bargain",
  takingHalf: 'Taking Half',
  hunger: 'Hunger',
  tryAgain: 'Try again',
  automaticWin: 'Automatic Win',
} as const;

export function retryRow(request: Omit<RollRequest, 'channelId'>): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(retryButton(request));
}

/** Try again is a game term: the same label in every language. */
export function retryButton(request: Omit<RollRequest, 'channelId'>): ButtonBuilder {
  return button(encodeRollId('retry', request), TERMS.tryAgain, ButtonStyle.Secondary);
}

/** Discord draws emojis large only in a message made of nothing else, and only up to this many. */
const JUMBO_LIMIT = 27;

const sortDesc = (dice: number[]) => [...dice].sort((a, b) => b - a);

export function formatDice(dice: number[]): string {
  if (dice.length === 0) return '-';
  return sortDesc(dice)
    .map((d) => (d >= SUCCESS_THRESHOLD ? `**${d}**` : `${d}`))
    .join(' ');
}

/**
 * The dice as rows of emoji faces (normal dice, then Hunger dice on their own line),
 * or undefined when they can't be shown large.
 */
export function diceLine(dice: number[], hunger: number[] = []): string | undefined {
  if (dice.length + hunger.length === 0 || dice.length + hunger.length > JUMBO_LIMIT) {
    return undefined;
  }
  const normal = sortDesc(dice).map((d) => diceEmoji(d));
  // Hunger dice share the normal faces for now: their own line sets them apart.
  const hungry = sortDesc(hunger).map((d) => diceEmoji(d));
  if ([...normal, ...hungry].some((f) => f === undefined)) return undefined;
  return [normal, hungry]
    .filter((row) => row.length)
    .map((row) => row.join(' '))
    .join('\n');
}

export function formatPool(
  locale: Locale,
  request: Omit<RollRequest, 'channelId'>,
  pool: Pool,
): string {
  const parts = [tn(locale, 'dice.count', request.dice)];
  if (request.modifier) parts.push(signed(request.modifier, t(locale, 'pool.bonus')));
  parts.push(tn(locale, 'pool.total', pool.total));
  let text = parts.join(' ');
  if (pool.hunger) text += ` (${pool.hunger} ${TERMS.hunger})`;
  if (request.difficulty) text += ` · ${t(locale, 'pool.difficulty', { n: request.difficulty })}`;
  return text;
}

function signed(n: number, label: string): string {
  return `${n > 0 ? '+' : '−'} ${Math.abs(n)} ${label}`;
}

/** "3 successes", or "3 successes of 4" against a Difficulty, with the margin. */
function successCount(locale: Locale, successes: number, difficulty?: number): string {
  if (!difficulty) return tn(locale, 'roll.successes', successes);
  const margin = successes - difficulty;
  const sign = margin > 0 ? '+' : margin < 0 ? '−' : '±';
  return `${tn(locale, 'roll.successesOf', successes, { difficulty })} (${t(locale, 'roll.margin', {
    margin: `${sign}${Math.abs(margin)}`,
  })})`;
}

export function outcomeLine(locale: Locale, result: TestResult): string {
  const count = successCount(locale, result.successes, result.difficulty);
  switch (result.outcome) {
    case 'success':
      return `**${result.criticalWin ? TERMS.criticalWin : TERMS.success}** · ${count}`;
    case 'failure':
      return `**${result.bestial ? TERMS.bestial : TERMS.failure}** · ${count}`;
    case 'painful-failure':
      return result.bestial
        ? `**${TERMS.painful}** + **${TERMS.bestial}** · ${count}`
        : `**${TERMS.painful}** · ${count}`;
    case 'open':
      return `**${count}**`;
  }
}

function outcomeColor(result: TestResult): number {
  if (result.bestial) return COLORS.bestial;
  if (result.outcome === 'success') return COLORS.success;
  if (result.outcome === 'painful-failure') return COLORS.painful;
  if (result.outcome === 'open') return COLORS.neutral;
  return COLORS.failure;
}

/** Notes for a painful or bestial failure, or a Hunger 1 in an open roll. */
export function consequenceFields(locale: Locale, result: TestResult): APIEmbedField[] {
  const fields: APIEmbedField[] = [];
  if (result.outcome === 'painful-failure') {
    fields.push({ name: TERMS.complication, value: t(locale, 'roll.complication') });
  }
  if (result.bestial) fields.push({ name: TERMS.bestial, value: t(locale, 'roll.bestial') });
  if (result.outcome === 'open' && result.hungerOnes > 0) {
    fields.push({ name: TERMS.hunger, value: t(locale, 'roll.hungerOne') });
  }
  return fields;
}

export interface RollMessage {
  content?: string;
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

/** Renders the response of /roll, /npc and the roll buttons. `title` keeps the player's reason. */
export function rollMessage(locale: Locale, response: RollResponse, title: string): RollMessage {
  const { request, pool } = response;
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(formatPool(locale, request, pool));
  const fields: APIEmbedField[] = [];
  const buttons: ButtonBuilder[] = [];
  let content: string | undefined;

  if (response.kind === 'half') {
    const { successes, won } = response;
    const count = successCount(locale, successes, request.difficulty || undefined);
    const label =
      won === undefined ? `**${count}**` : `**${won ? TERMS.success : TERMS.failure}** · ${count}`;
    embed.setColor(won === false ? COLORS.failure : won ? COLORS.success : COLORS.neutral);
    fields.push({
      name: t(locale, 'roll.field.outcome'),
      value: `${label}\n${t(locale, 'roll.takingHalf')}`,
    });
  } else if (response.kind === 'no-dice') {
    embed.setColor(COLORS.failure);
    fields.push({ name: t(locale, 'roll.field.outcome'), value: t(locale, 'roll.noDice') });
  } else {
    const { result } = response;
    embed.setColor(outcomeColor(result));
    // The faces carry their numbers; the fields are the fallback when they can't be shown.
    content = diceLine(result.dice, result.hunger);
    if (!content) {
      if (result.dice.length) {
        fields.push({ name: t(locale, 'roll.field.dice'), value: formatDice(result.dice) });
      }
      if (result.hunger.length) {
        fields.push({ name: TERMS.hunger, value: formatDice(result.hunger) });
      }
    }
    fields.push({ name: t(locale, 'roll.field.outcome'), value: outcomeLine(locale, result) });
    if (!response.npc) fields.push(...consequenceFields(locale, result));
    if (request.retry) fields.push({ name: TERMS.tryAgain, value: t(locale, 'roll.retryNote') });
    if (!response.npc && request.difficulty && pool.total >= 2 * request.difficulty) {
      fields.push({ name: TERMS.automaticWin, value: t(locale, 'roll.automaticWin') });
    }
    if (response.bargainAvailable) {
      buttons.push(button(encodeRollId('bargain', request), TERMS.bargain, ButtonStyle.Danger));
    }
    if (response.retryAvailable) buttons.push(retryButton(request));
  }

  embed.addFields(fields);
  return {
    ...(content ? { content } : {}),
    embeds: [embed],
    components: buttons.length
      ? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
      : [],
  };
}

export function button(customId: string, label: string, style: ButtonStyle): ButtonBuilder {
  return new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);
}

export function infoEmbed(
  title: string,
  description: string,
  color = COLORS.neutral,
): EmbedBuilder {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(color);
}
