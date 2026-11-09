import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  StringSelectMenuBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
} from 'discord.js';
import { isStoryteller, storytellerOnly } from '../auth/storyteller.js';
import {
  WILLPOWER_REROLL,
  judge,
  performRoll,
  rerollWithWillpower,
  type RollRequest,
} from '../game/roll.js';
import type { Context } from '../commands/types.js';
import { localeFor, t, type Locale } from '../i18n/index.js';
import { decodeRollId, encodeRollId, type RollRef } from '../ui/customId.js';
import { COLORS, TERMS, button, retryRow, rollMessage } from '../ui/format.js';
import { OnceGuard } from './once.js';

/** Buttons only the Storyteller answers; all others belong to the roller. */
const STORYTELLER_ACTIONS = new Set(['bargain-yes', 'bargain-no']);

const once = new OnceGuard();

/** Claims one step of a roll message; false if someone already clicked it. */
type RollInteraction = ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction;

function claim(interaction: RollInteraction, step: string): boolean {
  return once.claim(`${interaction.message?.id ?? interaction.id}:${step}`);
}

function alreadyUsed(interaction: RollInteraction, locale: Locale): Promise<void> {
  return replyEphemeral(interaction, t(locale, 'button.alreadyUsed'));
}

async function replyEphemeral(interaction: RollInteraction, content: string): Promise<void> {
  await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}

export async function handleRollButton(
  interaction: ButtonInteraction,
  ctx: Context,
): Promise<void> {
  const ref = decodeRollId(interaction.customId);
  if (!ref) return;
  const { store } = ctx;
  const locale = localeFor(interaction, store);
  const channelId = interaction.channelId;
  const request: RollRequest = { ...ref.request, channelId };

  if (STORYTELLER_ACTIONS.has(ref.action)) {
    if (!isStoryteller(interaction, store.getStoryteller(channelId))) {
      await replyEphemeral(interaction, storytellerOnly(locale));
      return;
    }
  } else if (interaction.user.id !== request.userId) {
    await replyEphemeral(interaction, t(locale, 'button.notYours'));
    return;
  }

  const original = interaction.message.embeds[0];
  const embed = original
    ? EmbedBuilder.from(original)
    : new EmbedBuilder().setTitle(t(locale, 'roll.title'));

  switch (ref.action) {
    // Beast's Bargain (p. 98): the player asks, the Storyteller names the cost and grants it.
    case 'bargain': {
      if (!claim(interaction, 'bargain')) return alreadyUsed(interaction, locale);
      embed.addFields({ name: TERMS.bargain, value: t(locale, 'bargain.requested') });
      await interaction.update({
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            button(
              encodeRollId('bargain-yes', request),
              t(locale, 'button.grantBargain'),
              ButtonStyle.Success,
            ),
            button(
              encodeRollId('bargain-no', request),
              t(locale, 'button.refuseBargain'),
              ButtonStyle.Secondary,
            ),
          ),
        ],
      });
      return;
    }

    case 'bargain-yes': {
      if (!claim(interaction, 'bargain-answer')) return alreadyUsed(interaction, locale);
      embed.setColor(COLORS.success).addFields({
        name: t(locale, 'bargain.granted.title'),
        value: t(locale, 'bargain.granted'),
      });
      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    case 'bargain-no': {
      if (!claim(interaction, 'bargain-answer')) return alreadyUsed(interaction, locale);
      embed.addFields({
        name: t(locale, 'bargain.refused.title'),
        value: t(locale, 'bargain.refused'),
      });
      await interaction.update({ embeds: [embed], components: [retryRow(request)] });
      return;
    }

    case 'retry': {
      // A new test: Willpower can be spent on it again.
      const next = {
        ...request,
        difficulty: request.difficulty + 1,
        retry: true,
        willpower: false,
      };
      const modal = new ModalBuilder()
        .setCustomId(encodeRollId('retry-modal', next))
        .setTitle(t(locale, 'retry.modal.title', { difficulty: next.difficulty }))
        .addLabelComponents(
          new LabelBuilder()
            .setLabel(t(locale, 'retry.modal.dice'))
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId('dice')
                .setStyle(TextInputStyle.Short)
                .setValue(String(request.dice))
                .setRequired(true)
                .setMaxLength(2),
            ),
        );
      await interaction.showModal(modal);
      return;
    }

    // Push Yourself (p. 104): pick up to 3 normal dice to reroll.
    case 'wp': {
      if (!ref.faces) return;
      const menu = new StringSelectMenuBuilder()
        .setCustomId(encodeRollId('wp-pick', ref.request, ref.faces))
        .setPlaceholder(t(locale, 'willpower.pick', { max: WILLPOWER_REROLL }))
        .setMinValues(1)
        .setMaxValues(Math.min(WILLPOWER_REROLL, ref.faces.normal.length))
        .addOptions(
          ref.faces.normal.map((face, i) => ({
            label: t(locale, 'willpower.option', { n: i + 1, face }),
            value: String(i),
          })),
        );
      await interaction.update({
        components: [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu),
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            button(
              encodeRollId('wp-cancel', ref.request, ref.faces),
              t(locale, 'button.cancel'),
              ButtonStyle.Secondary,
            ),
          ),
        ],
      });
      return;
    }

    // Back to the roll as it was, with its buttons.
    case 'wp-cancel': {
      if (!ref.faces) return;
      const response = judge(request, ref.faces.normal, ref.faces.hunger);
      const { components } = rollMessage(locale, response, embed.data.title ?? '');
      await interaction.update({ components });
      return;
    }

    default:
      return;
  }
}

export async function handleRollSelect(
  interaction: StringSelectMenuInteraction,
  ctx: Context,
): Promise<void> {
  const ref: RollRef | undefined = decodeRollId(interaction.customId);
  if (!ref || ref.action !== 'wp-pick' || !ref.faces) return;
  const locale = localeFor(interaction, ctx.store);
  if (interaction.user.id !== ref.request.userId) {
    await replyEphemeral(interaction, t(locale, 'button.notYours'));
    return;
  }
  if (!claim(interaction, 'willpower')) return alreadyUsed(interaction, locale);

  const request: RollRequest = { ...ref.request, channelId: interaction.channelId };
  const response = rerollWithWillpower(
    request,
    ref.faces.normal,
    ref.faces.hunger,
    interaction.values.map(Number),
    ctx.roller,
  );
  const original = interaction.message.embeds[0];
  const title = original?.title ?? t(locale, 'roll.title');
  const changes = response.rerolled.map(([from, to]) => `${from} → ${to}`).join(', ');
  const message = rollMessage(locale, response, title, [
    { name: TERMS.willpower, value: t(locale, 'willpower.spent', { changes }) },
  ]);
  await interaction.update({ content: message.content ?? '', ...message });
}

export async function handleRollModal(
  interaction: ModalSubmitInteraction,
  ctx: Context,
): Promise<void> {
  const ref = decodeRollId(interaction.customId);
  if (!ref || ref.action !== 'retry-modal') return;
  const locale = localeFor(interaction, ctx.store);
  const dice = parseCount(interaction.fields.getTextInputValue('dice'), 30);
  if (dice === undefined) {
    await replyEphemeral(interaction, t(locale, 'retry.modal.invalid'));
    return;
  }

  if (!claim(interaction, 'retry')) return alreadyUsed(interaction, locale);

  const request: RollRequest = { ...ref.request, channelId: interaction.channelId!, dice };
  const response = performRoll(request, { roller: ctx.roller });
  const title = interaction.message?.embeds[0]?.title ?? t(locale, 'roll.title');
  await interaction.reply(rollMessage(locale, response, t(locale, 'roll.retryTitle', { title })));
  // Only one second attempt: drop the first roll's buttons.
  await interaction.message?.edit({ components: [] });
}

function parseCount(text: string, max: number): number | undefined {
  const n = Number(text.trim());
  return Number.isInteger(n) && n >= 0 && n <= max ? n : undefined;
}
