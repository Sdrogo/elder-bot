import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { isStoryteller, storytellerOnly } from '../auth/storyteller.js';
import { MAX_QUICKENING, basicSuccessCost } from '../dice/quickening.js';
import { grantQuickening } from '../game/roll.js';
import { described, localeFor, t } from '../i18n/index.js';
import { infoEmbed, quickeningLine } from '../ui/format.js';
import type { Command } from './types.js';

const data = described(
  new SlashCommandBuilder().setName('quickening'),
  'cmd.quickening.description',
)
  .addSubcommand((s) =>
    described(s.setName('show'), 'cmd.quickening.show.description').addUserOption((o) =>
      described(o.setName('player'), 'opt.quickening.player'),
    ),
  )
  .addSubcommand((s) =>
    described(s.setName('add'), 'cmd.quickening.add.description')
      .addIntegerOption((o) =>
        described(o.setName('amount'), 'opt.quickening.amount')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(10),
      )
      .addUserOption((o) => described(o.setName('player'), 'opt.quickening.player')),
  )
  .addSubcommand((s) =>
    described(s.setName('spend'), 'cmd.quickening.spend.description')
      .addIntegerOption((o) =>
        described(o.setName('amount'), 'opt.quickening.amount')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(5),
      )
      .addStringOption((o) =>
        described(o.setName('reason'), 'opt.quickening.reason').setMaxLength(100),
      ),
  )
  .addSubcommand((s) =>
    described(s.setName('success'), 'cmd.quickening.success.description').addBooleanOption((o) =>
      described(o.setName('skill_dots'), 'opt.quickening.skill_dots').setRequired(true),
    ),
  )
  .addSubcommand((s) =>
    described(s.setName('set'), 'cmd.quickening.set.description')
      .addIntegerOption((o) =>
        described(o.setName('value'), 'opt.quickening.value')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(MAX_QUICKENING),
      )
      .addUserOption((o) => described(o.setName('player'), 'opt.quickening.player')),
  );

export const quickening: Command = {
  data,
  async execute(interaction, { store }) {
    const locale = localeFor(interaction, store);
    const channelId = interaction.channelId;
    const player = interaction.options.getUser('player') ?? interaction.user;
    const current = store.getQuickening(channelId, player.id);
    const sub = interaction.options.getSubcommand();

    // Everyone tracks their own Quickening; only the Storyteller changes someone else's.
    const otherPlayer = player.id !== interaction.user.id;
    if (
      sub !== 'show' &&
      otherPlayer &&
      !isStoryteller(interaction, store.getStoryteller(channelId))
    ) {
      await interaction.reply({ content: storytellerOnly(locale), flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'show') {
      await interaction.reply({
        embeds: [
          infoEmbed('Quickening', `${player.displayName}: **${current}/${MAX_QUICKENING}**`),
        ],
      });
      return;
    }

    if (sub === 'add') {
      const gain = grantQuickening(
        store,
        channelId,
        player.id,
        interaction.options.getInteger('amount', true),
      );
      const lines = [`${player.displayName}: **${gain.value}/${MAX_QUICKENING}**`];
      if (gain.overflow) lines.push(quickeningLine(locale, 0, gain.value, gain.overflow)!);
      await interaction.reply({ embeds: [infoEmbed('Quickening', lines.join('\n'))] });
      return;
    }

    if (sub === 'set') {
      const value = interaction.options.getInteger('value', true);
      store.setQuickening(channelId, player.id, value);
      await interaction.reply({
        embeds: [infoEmbed('Quickening', `${player.displayName}: **${value}/${MAX_QUICKENING}**`)],
      });
      return;
    }

    const cost =
      sub === 'success'
        ? basicSuccessCost(interaction.options.getBoolean('skill_dots', true))
        : interaction.options.getInteger('amount', true);
    if (cost > current) {
      await interaction.reply({
        content: t(locale, 'quickening.notEnough', { current, cost }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    store.setQuickening(channelId, player.id, current - cost);
    const what =
      sub === 'success'
        ? t(locale, 'quickening.spentSuccess', { player: player.displayName, cost })
        : t(locale, 'quickening.spent', {
            player: player.displayName,
            cost,
            reason: reason(interaction.options.getString('reason')),
          });
    const left = t(locale, 'quickening.left', { left: current - cost, max: MAX_QUICKENING });
    await interaction.reply({ embeds: [infoEmbed('Quickening', `${what}. ${left}`)] });
  },
};

function reason(text: string | null): string {
  return text ? ` (${text})` : '';
}
