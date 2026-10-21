import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type APIEmbedField,
} from 'discord.js';
import { MAX_QUICKENING } from '../dice/quickening.js';
import type { Outcome, Pool, TestResult } from '../dice/test.js';
import type { RollRequest, RollResponse } from '../game/roll.js';
import { encodeRollId } from './customId.js';

export const COLORS = {
  success: 0x2e7d32,
  failure: 0x616161,
  painful: 0xb71c1c,
  neutral: 0x6a1b9a,
};

const OUTCOME_LABEL: Record<Outcome, string> = {
  success: 'Success',
  failure: 'Failure',
  'painful-failure': 'Painful Failure',
};

export const CHOOSE_YOUR_PAIN = [
  'Perdi 3 Vitae o Willpower (a tua scelta)',
  'Perdi tutto il tuo Quickening (non se ne hai 0)',
  'Segna 1 casella sul tracker Beast',
  'Dai 1 Drama al Narratore',
].map((o) => `- ${o}`);

/** Choose Your Pain options as buttons; the bot applies Quickening and Drama, the rest is recorded. */
export const PAIN_OPTIONS = {
  'pain-vitae': { label: 'Lose 3 Vitae/Willpower', result: 'perde 3 Vitae o Willpower' },
  'pain-quickening': { label: 'Lose all Quickening', result: 'perde tutto il Quickening' },
  'pain-beast': { label: 'Mark Beast', result: 'segna 1 casella sul tracker Beast' },
  'pain-drama': { label: 'Give 1 Drama', result: 'dà 1 Drama al Narratore' },
} as const;

export type PainAction = keyof typeof PAIN_OPTIONS;

export function choosePainRow(
  request: Omit<RollRequest, 'channelId'>,
  hasQuickening: boolean,
): ActionRowBuilder<ButtonBuilder> {
  const actions = (Object.keys(PAIN_OPTIONS) as PainAction[]).filter(
    (a) => a !== 'pain-quickening' || hasQuickening,
  );
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    actions.map((a) => button(encodeRollId(a, request), PAIN_OPTIONS[a].label, ButtonStyle.Danger)),
  );
}

export function retryRow(request: Omit<RollRequest, 'channelId'>): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    button(encodeRollId('retry', request), 'Try again', ButtonStyle.Secondary),
  );
}

export function formatDice(dice: number[]): string {
  if (dice.length === 0) return '-';
  return [...dice]
    .sort((a, b) => b - a)
    .map((d) => (d >= 8 ? `**${d}**` : `${d}`))
    .join(' ');
}

export function formatPool(
  request: Omit<RollRequest, 'channelId'>,
  pool: Pool,
  traitModifier: number,
): string {
  const parts = [`${request.dice} dadi`];
  if (request.modifier) parts.push(signed(request.modifier, 'bonus'));
  if (traitModifier) parts.push(signed(traitModifier, 'scene trait'));
  if (request.difficulty) parts.push(`− Difficoltà ${request.difficulty}`);
  if (request.quickening) parts.push(`+ ${request.quickening} Quickening`);
  return `${parts.join(' ')} = **${pool.total}** ${pool.total === 1 ? 'dado' : 'dadi'}`;
}

function signed(n: number, label: string): string {
  return `${n > 0 ? '+' : '−'} ${Math.abs(n)} ${label}`;
}

export function outcomeLine(result: TestResult): string {
  const label = `**${OUTCOME_LABEL[result.outcome]}**`;
  if (result.outcome !== 'success') return label;
  const extra = result.extraSuccesses ? ` (${result.extraSuccesses} extra)` : '';
  return `${label} · ${result.successes} ${result.successes === 1 ? 'successo' : 'successi'}${extra}`;
}

function outcomeColor(outcome: Outcome): number {
  if (outcome === 'success') return COLORS.success;
  if (outcome === 'painful-failure') return COLORS.painful;
  return COLORS.failure;
}

export function quickeningLine(
  gained: number,
  total: number,
  overflow: number,
): string | undefined {
  const lines: string[] = [];
  if (gained > 0) lines.push(`+${gained} Quickening dai 10 (ora ${total}/${MAX_QUICKENING})`);
  if (overflow > 0) {
    lines.push(
      `Quickening al massimo: segna ${overflow} ${overflow === 1 ? 'casella' : 'caselle'} sul tracker Beast o Nature.`,
    );
  }
  return lines.length ? lines.join('\n') : undefined;
}

export interface RollMessage {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

/** Renders the response of /roll, /npc and the roll buttons. `title` keeps the player's reason. */
export function rollMessage(
  response: Exclude<RollResponse, { kind: 'error' }>,
  title: string,
): RollMessage {
  const { request, pool, traitModifier } = response;
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(formatPool(request, pool, traitModifier));
  const fields: APIEmbedField[] = [];
  const buttons: ButtonBuilder[] = [];
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  if (response.kind === 'overqualified') {
    embed.setColor(COLORS.neutral);
    fields.push({
      name: 'Overqualified',
      value:
        'Restano 4 o più dadi dopo la Difficoltà: puoi prendere un successo base senza tirare (niente successi extra), oppure tirare.',
    });
    buttons.push(
      button(encodeRollId('oq-take', request), 'Take basic success', ButtonStyle.Success),
      button(encodeRollId('oq-roll', request), 'Roll', ButtonStyle.Primary),
    );
  } else if (response.kind === 'no-dice') {
    embed.setColor(COLORS.neutral);
    fields.push({
      name: 'No Dice Left',
      value: [
        'La Difficoltà ha azzerato il pool. Scegli:',
        '- **Accept failure**: racconta come le cose si complicano, +1 Quickening a te e +1 Drama al Narratore',
        '- **Cerca vantaggi**: aiuti, strumenti o posizione che ti danno dadi extra, poi ritira',
        "- **Aiuta qualcuno** con l'azione assist",
      ].join('\n'),
    });
    buttons.push(
      button(encodeRollId('zero-accept', request), 'Accept failure', ButtonStyle.Secondary),
    );
  } else {
    const { result, quickening } = response;
    embed.setColor(outcomeColor(result.outcome));
    fields.push({ name: 'Dadi', value: formatDice(result.dice) });
    fields.push({ name: 'Esito', value: outcomeLine(result) });
    if (result.outcome === 'painful-failure') {
      fields.push({ name: 'Choose Your Pain', value: CHOOSE_YOUR_PAIN.join('\n') });
      rows.push(choosePainRow(request, quickening.total > 0));
    }
    if (request.retry) {
      fields.push({
        name: 'Try again',
        value: 'Secondo tentativo: Difficoltà +1, ogni fallimento è un Painful Failure.',
      });
    }
    const q = quickeningLine(quickening.gained, quickening.total, quickening.overflow);
    if (q) fields.push({ name: 'Quickening', value: q });
    if (response.bargainAvailable) {
      buttons.push(button(encodeRollId('bargain', request), "Devil's Bargain", ButtonStyle.Danger));
    }
    if (result.outcome !== 'success' && !request.retry) {
      buttons.push(button(encodeRollId('retry', request), 'Try again', ButtonStyle.Secondary));
    }
  }

  embed.addFields(fields);
  return {
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
