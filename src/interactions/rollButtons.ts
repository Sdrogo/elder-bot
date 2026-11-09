import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
} from 'discord.js';
import { isStoryteller, storytellerOnly } from '../auth/storyteller.js';
import { performRoll, type RollRequest } from '../game/roll.js';
import type { Context } from '../commands/types.js';
import { localeFor, t, type Locale } from '../i18n/index.js';
import { decodeRollId, encodeRollId } from '../ui/customId.js';
import { COLORS, TERMS, button, retryRow, rollMessage } from '../ui/format.js';
import { OnceGuard } from './once.js';

/** Buttons only the Storyteller answers; all others belong to the roller. */
const STORYTELLER_ACTIONS = new Set(['bargain-yes', 'bargain-no']);

const once = new OnceGuard();

/** Claims one step of a roll message; false if someone already clicked it. */
function claim(interaction: ButtonInteraction | ModalSubmitInteraction, step: string): boolean {
  return once.claim(`${interaction.message?.id ?? interaction.id}:${step}`);
}

function alreadyUsed(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  locale: Locale,
): Promise<void> {
  return replyEphemeral(interaction, t(locale, 'button.alreadyUsed'));
}

async function replyEphemeral(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  content: string,
): Promise<void> {
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
      const next = { ...request, difficulty: request.difficulty + 1, retry: true };
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

    default:
      return;
  }
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
