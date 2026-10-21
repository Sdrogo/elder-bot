import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type APIEmbedField,
} from 'discord.js';
import { MAX_QUICKENING } from '../dice/quickening.js';
import { t, tn, type Locale, type MessageKey } from '../i18n/index.js';
import type { Outcome, Pool, TestResult } from '../dice/test.js';
import type { RollRequest, RollResponse } from '../game/roll.js';
import { encodeRollId } from './customId.js';
import { diceEmoji } from './diceEmojis.js';

export const COLORS = {
  success: 0x2e7d32,
  failure: 0x616161,
  painful: 0xb71c1c,
  neutral: 0x6a1b9a,
};

// Outcomes are game terms: the same in every language.
const OUTCOME_LABEL: Record<Outcome, string> = {
  success: 'Success',
  failure: 'Failure',
  'painful-failure': 'Painful Failure',
};

/** Name of the Choose Your Pain field; the roll buttons find the field by it, so it never changes. */
export const CHOOSE_YOUR_PAIN = 'Choose Your Pain';

/** Choose Your Pain options as buttons; the bot applies Quickening and Drama, the rest is recorded. */
export const PAIN_OPTIONS = {
  'pain-vitae': {
    option: 'pain.option.vitae',
    label: 'pain.label.vitae',
    result: 'pain.result.vitae',
  },
  'pain-quickening': {
    option: 'pain.option.quickening',
    label: 'pain.label.quickening',
    result: 'pain.result.quickening',
  },
  'pain-beast': {
    option: 'pain.option.beast',
    label: 'pain.label.beast',
    result: 'pain.result.beast',
  },
  'pain-drama': {
    option: 'pain.option.drama',
    label: 'pain.label.drama',
    result: 'pain.result.drama',
  },
} as const satisfies Record<string, Record<'option' | 'label' | 'result', MessageKey>>;

export type PainAction = keyof typeof PAIN_OPTIONS;

/** The Choose Your Pain list; each line starts with "- " while the choice is still open. */
export function chooseYourPain(locale: Locale): string {
  return Object.values(PAIN_OPTIONS)
    .map((o) => `- ${t(locale, o.option)}`)
    .join('\n');
}

export function choosePainRow(
  locale: Locale,
  request: Omit<RollRequest, 'channelId'>,
  hasQuickening: boolean,
): ActionRowBuilder<ButtonBuilder> {
  const actions = (Object.keys(PAIN_OPTIONS) as PainAction[]).filter(
    (a) => a !== 'pain-quickening' || hasQuickening,
  );
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    actions.map((a) =>
      button(encodeRollId(a, request), t(locale, PAIN_OPTIONS[a].label), ButtonStyle.Danger),
    ),
  );
}

export function retryRow(request: Omit<RollRequest, 'channelId'>): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(retryButton(request));
}

/** Try again is a game term: the same label in every language. */
export function retryButton(request: Omit<RollRequest, 'channelId'>): ButtonBuilder {
  return button(encodeRollId('retry', request), 'Try again', ButtonStyle.Secondary);
}

/** Discord draws emojis large only in a message made of nothing else, and only up to this many. */
const JUMBO_LIMIT = 27;

export function formatDice(dice: number[]): string {
  if (dice.length === 0) return '-';
  return [...dice]
    .sort((a, b) => b - a)
    .map((d) => (d >= 8 ? `**${d}**` : `${d}`))
    .join(' ');
}

/** The dice as a row of emoji faces, or undefined when they can't be shown large. */
export function diceLine(dice: number[]): string | undefined {
  if (dice.length === 0 || dice.length > JUMBO_LIMIT) return undefined;
  const faces = [...dice].sort((a, b) => b - a).map((d) => diceEmoji(d));
  if (faces.some((f) => f === undefined)) return undefined;
  return faces.join(' ');
}

export function formatPool(
  locale: Locale,
  request: Omit<RollRequest, 'channelId'>,
  pool: Pool,
  traitModifier: number,
): string {
  const parts = [tn(locale, 'dice.count', request.dice)];
  if (request.modifier) parts.push(signed(request.modifier, t(locale, 'pool.bonus')));
  if (traitModifier) parts.push(signed(traitModifier, 'scene trait'));
  if (request.difficulty) parts.push(t(locale, 'pool.difficulty', { n: request.difficulty }));
  if (request.quickening) parts.push(t(locale, 'pool.quickening', { n: request.quickening }));
  parts.push(tn(locale, 'pool.total', pool.total));
  return parts.join(' ');
}

function signed(n: number, label: string): string {
  return `${n > 0 ? '+' : '−'} ${Math.abs(n)} ${label}`;
}

export function outcomeLine(locale: Locale, result: TestResult): string {
  const label = `**${OUTCOME_LABEL[result.outcome]}**`;
  if (result.outcome !== 'success') return label;
  const extra = result.extraSuccesses
    ? ` (${t(locale, 'roll.extra', { count: result.extraSuccesses })})`
    : '';
  return `${label} · ${tn(locale, 'roll.successes', result.successes)}${extra}`;
}

function outcomeColor(outcome: Outcome): number {
  if (outcome === 'success') return COLORS.success;
  if (outcome === 'painful-failure') return COLORS.painful;
  return COLORS.failure;
}

export function quickeningLine(
  locale: Locale,
  gained: number,
  total: number,
  overflow: number,
): string | undefined {
  const lines: string[] = [];
  if (gained > 0) {
    lines.push(t(locale, 'quickening.gained', { gained, total, max: MAX_QUICKENING }));
  }
  if (overflow > 0) lines.push(tn(locale, 'quickening.overflow', overflow));
  return lines.length ? lines.join('\n') : undefined;
}

export interface RollMessage {
  content?: string;
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

/** Renders the response of /roll, /npc and the roll buttons. `title` keeps the player's reason. */
export function rollMessage(
  locale: Locale,
  response: Exclude<RollResponse, { kind: 'error' }>,
  title: string,
): RollMessage {
  const { request, pool, traitModifier } = response;
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(formatPool(locale, request, pool, traitModifier));
  const fields: APIEmbedField[] = [];
  const buttons: ButtonBuilder[] = [];
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let content: string | undefined;

  if (response.kind === 'overqualified') {
    embed.setColor(COLORS.neutral);
    fields.push({
      name: 'Overqualified',
      value: t(locale, 'roll.overqualified'),
    });
    buttons.push(
      button(encodeRollId('oq-take', request), t(locale, 'button.takeBasic'), ButtonStyle.Success),
      button(encodeRollId('oq-roll', request), t(locale, 'button.roll'), ButtonStyle.Primary),
    );
  } else if (response.kind === 'no-dice') {
    embed.setColor(COLORS.neutral);
    fields.push({
      name: 'No Dice Left',
      value: t(locale, 'roll.noDice'),
    });
    buttons.push(
      button(
        encodeRollId('zero-accept', request),
        t(locale, 'button.acceptFailure'),
        ButtonStyle.Secondary,
      ),
    );
  } else {
    const { result, quickening } = response;
    embed.setColor(outcomeColor(result.outcome));
    // The faces carry their numbers; the field is the fallback when they can't be shown.
    content = diceLine(result.dice);
    if (!content) {
      fields.push({ name: t(locale, 'roll.field.dice'), value: formatDice(result.dice) });
    }
    fields.push({ name: t(locale, 'roll.field.outcome'), value: outcomeLine(locale, result) });
    if (result.outcome === 'painful-failure' && !response.npc) {
      fields.push({ name: CHOOSE_YOUR_PAIN, value: chooseYourPain(locale) });
      rows.push(choosePainRow(locale, request, quickening.total > 0));
    }
    if (request.retry) {
      fields.push({ name: 'Try again', value: t(locale, 'roll.retryNote') });
    }
    const q = quickeningLine(locale, quickening.gained, quickening.total, quickening.overflow);
    if (q) fields.push({ name: 'Quickening', value: q });
    if (response.bargainAvailable) {
      buttons.push(button(encodeRollId('bargain', request), "Devil's Bargain", ButtonStyle.Danger));
    }
    if (result.outcome !== 'success' && !request.retry && !response.npc) {
      buttons.push(retryButton(request));
    }
  }

  embed.addFields(fields);
  return {
    ...(content ? { content } : {}),
    embeds: [embed],
    components: buttons.length
      ? [...rows, new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
      : rows,
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

/** The message for a roll refused because the player spends more Quickening than they have. */
export function rollErrorText(
  locale: Locale,
  error: Extract<RollResponse, { kind: 'error' }>,
): string {
  return t(locale, 'roll.error.quickening', {
    available: error.available,
    requested: error.requested,
  });
}
