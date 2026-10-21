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
import { MAX_QUICKENING } from '../dice/quickening.js';
import { grantQuickening, performRoll, type RollRequest } from '../game/roll.js';
import type { Context } from '../commands/types.js';
import { decodeRollId, encodeRollId } from '../ui/customId.js';
import {
  COLORS,
  PAIN_OPTIONS,
  button,
  choosePainRow,
  quickeningLine,
  retryRow,
  rollMessage,
} from '../ui/format.js';

/** Buttons the Storyteller (or anyone at the table) answers; all others belong to the roller. */
const TABLE_ACTIONS = new Set(['bargain-yes', 'bargain-no']);

export async function handleRollButton(
  interaction: ButtonInteraction,
  ctx: Context,
): Promise<void> {
  const ref = decodeRollId(interaction.customId);
  if (!ref) return;
  const { store } = ctx;
  const channelId = interaction.channelId;
  const request: RollRequest = { ...ref.request, channelId };
  const userId = request.userId;

  if (!TABLE_ACTIONS.has(ref.action) && interaction.user.id !== userId) {
    await interaction.reply({
      content: 'Solo chi ha tirato può usare questo pulsante.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const original = interaction.message.embeds[0];
  const title = original?.title ?? 'Test';
  const embed = original ? EmbedBuilder.from(original) : new EmbedBuilder().setTitle(title);

  switch (ref.action) {
    case 'oq-take': {
      embed.setColor(COLORS.success).setFields({
        name: 'Esito',
        value: '**Success** · successo base senza tirare (Overqualified)',
      });
      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    case 'oq-roll': {
      const response = performRoll(store, request, { roller: ctx.roller, skipOverqualified: true });
      if (response.kind === 'error') {
        await interaction.reply({ content: response.message, flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.update(rollMessage(response, title));
      return;
    }

    case 'zero-accept': {
      const gain = grantQuickening(store, channelId, userId, 1);
      const drama = store.getDrama(channelId) + 1;
      store.setDrama(channelId, drama);
      const lines = [
        '**Failure** accettato: racconta come la situazione si complica.',
        gain.gained
          ? `+1 Quickening (ora ${gain.value}/${MAX_QUICKENING}).`
          : quickeningLine(0, gain.value, gain.overflow)!,
        `+1 Drama al Narratore (ora ${drama}).`,
      ];
      embed.setColor(COLORS.failure).setFields({ name: 'Esito', value: lines.join('\n') });
      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    case 'bargain': {
      if (store.hasUsedBargain(channelId, userId)) {
        await interaction.reply({
          content: "Hai già proposto un Devil's Bargain in questa scena.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      store.markBargain(channelId, userId);
      embed.addFields({
        name: "Devil's Bargain",
        value:
          'Proposta: una complicazione in cambio di un successo base. Il Narratore accetta (+1 Drama) o rifiuta spendendo 1 Drama.',
      });
      await interaction.update({
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            button(encodeRollId('bargain-yes', request), 'Accept bargain', ButtonStyle.Success),
            button(encodeRollId('bargain-no', request), 'Reject bargain', ButtonStyle.Danger),
          ),
        ],
      });
      return;
    }

    case 'bargain-yes': {
      const drama = store.getDrama(channelId) + 1;
      store.setDrama(channelId, drama);
      embed.setColor(COLORS.success).addFields({
        name: 'Bargain accettato',
        value: `**Success** (successo base) con la complicazione concordata. +1 Drama al Narratore (ora ${drama}).`,
      });
      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    case 'bargain-no': {
      const drama = store.getDrama(channelId);
      if (drama < 1) {
        await interaction.reply({
          content: 'Il Narratore non ha Drama: per rifiutare deve spenderne 1.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      store.setDrama(channelId, drama - 1);
      embed.addFields({
        name: 'Bargain rifiutato',
        value: `Il Narratore spende 1 Drama (ora ${drama - 1}). Il fallimento resta.`,
      });
      await interaction.update({
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            button(encodeRollId('retry', request), 'Try again', ButtonStyle.Secondary),
          ),
        ],
      });
      return;
    }

    case 'retry': {
      const next = { ...request, difficulty: request.difficulty + 1, retry: true, quickening: 0 };
      const modal = new ModalBuilder()
        .setCustomId(encodeRollId('retry-modal', next))
        .setTitle('Try again: Difficoltà +1')
        .addLabelComponents(
          new LabelBuilder()
            .setLabel('Nuovo pool (cambia Attributo o Abilità)')
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId('dice')
                .setStyle(TextInputStyle.Short)
                .setValue(String(request.dice))
                .setRequired(true)
                .setMaxLength(2),
            ),
          new LabelBuilder()
            .setLabel('Quickening da spendere')
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
          await interaction.reply({
            content: 'Non hai Quickening da perdere: scegli un altro prezzo.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        store.setQuickening(channelId, userId, 0);
        lines.push(`Quickening: ${current} → 0.`);
      }
      if (ref.action === 'pain-drama') {
        const drama = store.getDrama(channelId) + 1;
        store.setDrama(channelId, drama);
        lines.push(`Drama del Narratore: ora ${drama}.`);
      }
      if (ref.action === 'pain-vitae' || ref.action === 'pain-beast') {
        lines.push('Aggiornalo sulla scheda del personaggio.');
      }
      const choice = `${interaction.user.displayName} ${PAIN_OPTIONS[ref.action].result}.`;
      const fields = (original?.fields ?? []).map((f) =>
        f.name === 'Choose Your Pain'
          ? { name: 'Choose Your Pain', value: [choice, ...lines].join('\n') }
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
  const dice = parseCount(interaction.fields.getTextInputValue('dice'), 30);
  const quickening = parseCount(
    interaction.fields.getTextInputValue('quickening') || '0',
    MAX_QUICKENING,
  );
  if (dice === undefined || quickening === undefined) {
    await interaction.reply({
      content: 'Inserisci numeri interi: pool da 0 a 30, Quickening da 0 a 5.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const request: RollRequest = {
    ...ref.request,
    channelId: interaction.channelId!,
    dice,
    quickening,
  };
  const response = performRoll(ctx.store, request, { roller: ctx.roller });
  if (response.kind === 'error') {
    await interaction.reply({ content: response.message, flags: MessageFlags.Ephemeral });
    return;
  }
  const title = interaction.message?.embeds[0]?.title ?? 'Test';
  await interaction.reply(rollMessage(response, `${title} (Try again)`));
  // Only one second attempt: drop the first roll's buttons, but keep Choose Your Pain if still open.
  const pain = interaction.message?.embeds[0]?.fields.find((f) => f.name === 'Choose Your Pain');
  const painOpen = pain?.value.startsWith('- ') ?? false;
  await interaction.message?.edit({
    components: painOpen
      ? // ref.request carries the retry flag, so choosing the pain later offers no second retry.
        [choosePainRow(ref.request, ctx.store.getQuickening(request.channelId, request.userId) > 0)]
      : [],
  });
}

function parseCount(text: string, max: number): number | undefined {
  const n = Number(text.trim());
  return Number.isInteger(n) && n >= 0 && n <= max ? n : undefined;
}
