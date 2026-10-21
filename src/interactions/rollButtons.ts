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
import { MAX_QUICKENING } from '../dice/quickening.js';
import { grantQuickening, performRoll, type RollRequest } from '../game/roll.js';
import type { Context } from '../commands/types.js';
import { localeFor, t, type Locale } from '../i18n/index.js';
import { decodeRollId, encodeRollId } from '../ui/customId.js';
import {
  CHOOSE_YOUR_PAIN,
  COLORS,
  PAIN_OPTIONS,
  button,
  choosePainRow,
  quickeningLine,
  retryRow,
  rollErrorText,
  rollMessage,
} from '../ui/format.js';
import { OnceGuard } from './once.js';

/** Buttons only the Storyteller answers; all others belong to the roller. */
const STORYTELLER_ACTIONS = new Set(['bargain-yes', 'bargain-no']);

const once = new OnceGuard();

/** Claims one step of a roll message; false if someone already clicked it. */
function claim(interaction: ButtonInteraction | ModalSubmitInteraction, step: string): boolean {
  return once.claim(stepKey(interaction, step));
}

function release(interaction: ButtonInteraction | ModalSubmitInteraction, step: string): void {
  once.release(stepKey(interaction, step));
}

function stepKey(interaction: ButtonInteraction | ModalSubmitInteraction, step: string): string {
  return `${interaction.message?.id ?? interaction.id}:${step}`;
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
  const userId = request.userId;

  if (STORYTELLER_ACTIONS.has(ref.action)) {
    if (interaction.user.id === userId) {
      await replyEphemeral(interaction, t(locale, 'bargain.storytellerAnswers'));
      return;
    }
    if (!isStoryteller(interaction, store.getStoryteller(channelId))) {
      await replyEphemeral(interaction, storytellerOnly(locale));
      return;
    }
  } else if (interaction.user.id !== userId) {
    await replyEphemeral(interaction, t(locale, 'button.notYours'));
    return;
  }

  const original = interaction.message.embeds[0];
  const title = original?.title ?? t(locale, 'roll.title');
  const embed = original ? EmbedBuilder.from(original) : new EmbedBuilder().setTitle(title);

  switch (ref.action) {
    case 'oq-take': {
      if (!claim(interaction, 'overqualified')) return alreadyUsed(interaction, locale);
      embed.setColor(COLORS.success).setFields({
        name: t(locale, 'roll.field.outcome'),
        value: t(locale, 'overqualified.taken'),
      });
      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    case 'oq-roll': {
      if (!claim(interaction, 'overqualified')) return alreadyUsed(interaction, locale);
      const response = performRoll(store, request, { roller: ctx.roller, skipOverqualified: true });
      if (response.kind === 'error') {
        release(interaction, 'overqualified');
        await replyEphemeral(interaction, rollErrorText(locale, response));
        return;
      }
      await interaction.update(rollMessage(locale, response, title));
      return;
    }

    case 'zero-accept': {
      if (!claim(interaction, 'zero')) return alreadyUsed(interaction, locale);
      const gain = grantQuickening(store, channelId, userId, 1);
      const drama = store.getDrama(channelId) + 1;
      store.setDrama(channelId, drama);
      const lines = [
        t(locale, 'noDice.accepted'),
        gain.gained
          ? t(locale, 'noDice.quickening', { value: gain.value, max: MAX_QUICKENING })
          : quickeningLine(locale, 0, gain.value, gain.overflow)!,
        t(locale, 'noDice.drama', { drama }),
      ];
      embed
        .setColor(COLORS.failure)
        .setFields({ name: t(locale, 'roll.field.outcome'), value: lines.join('\n') });
      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    case 'bargain': {
      if (store.hasUsedBargain(channelId, userId)) {
        await replyEphemeral(interaction, t(locale, 'bargain.alreadyUsed'));
        return;
      }
      if (!claim(interaction, 'bargain')) return alreadyUsed(interaction, locale);
      store.markBargain(channelId, userId);
      embed.addFields({
        name: "Devil's Bargain",
        value: t(locale, 'bargain.offer'),
      });
      await interaction.update({
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            button(
              encodeRollId('bargain-yes', request),
              t(locale, 'button.acceptBargain'),
              ButtonStyle.Success,
            ),
            button(
              encodeRollId('bargain-no', request),
              t(locale, 'button.rejectBargain'),
              ButtonStyle.Danger,
            ),
          ),
        ],
      });
      return;
    }

    case 'bargain-yes': {
      if (!claim(interaction, 'bargain-answer')) return alreadyUsed(interaction, locale);
      const drama = store.getDrama(channelId) + 1;
      store.setDrama(channelId, drama);
      embed.setColor(COLORS.success).addFields({
        name: t(locale, 'bargain.accepted.title'),
        value: t(locale, 'bargain.accepted', { drama }),
      });
      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    case 'bargain-no': {
      const drama = store.getDrama(channelId);
      if (drama < 1) {
        await replyEphemeral(interaction, t(locale, 'bargain.noDrama'));
        return;
      }
      if (!claim(interaction, 'bargain-answer')) return alreadyUsed(interaction, locale);
      store.setDrama(channelId, drama - 1);
      embed.addFields({
        name: t(locale, 'bargain.rejected.title'),
        value: t(locale, 'bargain.rejected', { drama: drama - 1 }),
      });
      await interaction.update({ embeds: [embed], components: [retryRow(request)] });
      return;
    }

    case 'retry': {
      const next = { ...request, difficulty: request.difficulty + 1, retry: true, quickening: 0 };
      const modal = new ModalBuilder()
        .setCustomId(encodeRollId('retry-modal', next))
        .setTitle(t(locale, 'retry.modal.title'))
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
          new LabelBuilder()
            .setLabel(t(locale, 'retry.modal.quickening'))
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId('quickening')
                .setStyle(TextInputStyle.Short)
                .setValue('0')
                .setRequired(false)
                .setMaxLength(1),
            ),
        );
      await interaction.showModal(modal);
      return;
    }

    case 'pain-vitae':
    case 'pain-quickening':
    case 'pain-beast':
    case 'pain-drama': {
      const lines: string[] = [];
      if (ref.action === 'pain-quickening') {
        const current = store.getQuickening(channelId, userId);
        if (current === 0) {
          await replyEphemeral(interaction, t(locale, 'pain.noQuickening'));
          return;
        }
        if (!claim(interaction, 'pain')) return alreadyUsed(interaction, locale);
        store.setQuickening(channelId, userId, 0);
        lines.push(`Quickening: ${current} → 0.`);
      }
      if (ref.action !== 'pain-quickening' && !claim(interaction, 'pain')) {
        return alreadyUsed(interaction, locale);
      }
      if (ref.action === 'pain-drama') {
        const drama = store.getDrama(channelId) + 1;
        store.setDrama(channelId, drama);
        lines.push(t(locale, 'pain.drama', { drama }));
      }
      if (ref.action === 'pain-vitae' || ref.action === 'pain-beast') {
        lines.push(t(locale, 'pain.sheet'));
      }
      const choice = t(locale, PAIN_OPTIONS[ref.action].result, {
        player: interaction.user.displayName,
      });
      const fields = (original?.fields ?? []).map((f) =>
        f.name === CHOOSE_YOUR_PAIN
          ? { name: CHOOSE_YOUR_PAIN, value: [choice, ...lines].join('\n') }
          : f,
      );
      embed.setFields(fields);
      await interaction.update({
        embeds: [embed],
        components: request.retry ? [] : [retryRow(request)],
      });
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
  const quickening = parseCount(
    interaction.fields.getTextInputValue('quickening') || '0',
    MAX_QUICKENING,
  );
  if (dice === undefined || quickening === undefined) {
    await replyEphemeral(interaction, t(locale, 'retry.modal.invalid'));
    return;
  }

  if (!claim(interaction, 'retry')) return alreadyUsed(interaction, locale);

  const request: RollRequest = {
    ...ref.request,
    channelId: interaction.channelId!,
    dice,
    quickening,
  };
  const response = performRoll(ctx.store, request, { roller: ctx.roller });
  if (response.kind === 'error') {
    release(interaction, 'retry');
    await replyEphemeral(interaction, rollErrorText(locale, response));
    return;
  }
  const title = interaction.message?.embeds[0]?.title ?? t(locale, 'roll.title');
  await interaction.reply(rollMessage(locale, response, t(locale, 'roll.retryTitle', { title })));
  // Only one second attempt: drop the first roll's buttons, but keep Choose Your Pain if still open.
  const pain = interaction.message?.embeds[0]?.fields.find((f) => f.name === CHOOSE_YOUR_PAIN);
  const painOpen = pain?.value.startsWith('- ') ?? false;
  await interaction.message?.edit({
    components: painOpen
      ? // ref.request carries the retry flag, so choosing the pain later offers no second retry.
        [
          choosePainRow(
            locale,
            ref.request,
            ctx.store.getQuickening(request.channelId, request.userId) > 0,
          ),
        ]
      : [],
  });
}

function parseCount(text: string, max: number): number | undefined {
  const n = Number(text.trim());
  return Number.isInteger(n) && n >= 0 && n <= max ? n : undefined;
}
