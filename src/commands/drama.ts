import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { isStoryteller, storytellerOnly } from '../auth/storyteller.js';
import { described, localeFor, t } from '../i18n/index.js';
import { MAX_DRAMA, MAX_SCENE_TRAITS } from '../state/store.js';
import { infoEmbed } from '../ui/format.js';
import type { Command } from './types.js';

/** Storyteller Packet p. 30: a scene trait costs 2 Drama and gives +1 to +3 or -1 to -3 dice. */
export const SCENE_TRAIT_COST = 2;

const data = described(new SlashCommandBuilder().setName('drama'), 'cmd.drama.description')
  .addSubcommand((s) => described(s.setName('show'), 'cmd.drama.show.description'))
  .addSubcommand((s) =>
    described(s.setName('add'), 'cmd.drama.add.description')
      .addIntegerOption((o) =>
        described(o.setName('amount'), 'opt.drama.amount')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(20),
      )
      .addStringOption((o) =>
        described(o.setName('reason'), 'opt.drama.add_reason').setMaxLength(100),
      ),
  )
  .addSubcommand((s) =>
    described(s.setName('spend'), 'cmd.drama.spend.description')
      .addIntegerOption((o) =>
        described(o.setName('amount'), 'opt.drama.amount')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(20),
      )
      .addStringOption((o) =>
        described(o.setName('reason'), 'opt.drama.spend_reason').setMaxLength(100),
      ),
  )
  .addSubcommand((s) =>
    described(s.setName('trait'), 'cmd.drama.trait.description')
      .addStringOption((o) =>
        described(o.setName('name'), 'opt.drama.name').setRequired(true).setMaxLength(60),
      )
      .addIntegerOption((o) =>
        described(o.setName('modifier'), 'opt.drama.modifier')
          .setRequired(true)
          .addChoices(
            ...[-3, -2, -1, 1, 2, 3].map((n) => ({ name: n > 0 ? `+${n}` : `${n}`, value: n })),
          ),
      ),
  )
  .addSubcommand((s) => described(s.setName('clear_traits'), 'cmd.drama.clear_traits.description'));

export const drama: Command = {
  data,
  async execute(interaction, { store }) {
    const locale = localeFor(interaction, store);
    const channelId = interaction.channelId;
    const current = store.getDrama(channelId);
    const sub = interaction.options.getSubcommand();

    if (sub !== 'show' && !isStoryteller(interaction, store.getStoryteller(channelId))) {
      await interaction.reply({ content: storytellerOnly(locale), flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'show') {
      const traits = store.listTraits(channelId);
      const lines = [`Drama: **${current}**`];
      if (traits.length) {
        lines.push(
          '',
          t(locale, 'drama.activeTraits'),
          ...traits.map((tr) =>
            t(locale, 'drama.trait', { name: tr.name, modifier: signed(tr.modifier) }),
          ),
        );
      }
      await interaction.reply({ embeds: [infoEmbed('Drama', lines.join('\n'))] });
      return;
    }

    if (sub === 'add') {
      const amount = interaction.options.getInteger('amount', true);
      store.setDrama(channelId, current + amount);
      const now = store.getDrama(channelId);
      const cap = now === MAX_DRAMA ? ` (${t(locale, 'drama.max', { max: MAX_DRAMA })})` : '';
      await interaction.reply({
        embeds: [
          infoEmbed(
            'Drama',
            t(locale, 'drama.added', {
              amount,
              reason: reason(interaction.options.getString('reason')),
              now,
              cap,
            }),
          ),
        ],
      });
      return;
    }

    if (sub === 'clear_traits') {
      store.clearTraits(channelId);
      await interaction.reply({
        embeds: [infoEmbed('Drama', t(locale, 'drama.traitsCleared'))],
      });
      return;
    }

    if (sub === 'trait' && store.listTraits(channelId).length >= MAX_SCENE_TRAITS) {
      await interaction.reply({
        content: t(locale, 'drama.traitLimit', { max: MAX_SCENE_TRAITS }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const cost =
      sub === 'trait' ? SCENE_TRAIT_COST : interaction.options.getInteger('amount', true);
    if (cost > current) {
      await interaction.reply({
        content: t(locale, 'drama.notEnough', { current, cost }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    store.setDrama(channelId, current - cost);

    if (sub === 'trait') {
      const name = interaction.options.getString('name', true);
      const modifier = interaction.options.getInteger('modifier', true);
      store.addTrait(channelId, name, modifier);
      await interaction.reply({
        embeds: [
          infoEmbed(
            'Scene trait',
            t(locale, 'drama.traitCreated', {
              name,
              modifier: signed(modifier),
              left: current - cost,
            }),
          ),
        ],
      });
      return;
    }

    await interaction.reply({
      embeds: [
        infoEmbed(
          'Drama',
          t(locale, 'drama.spent', {
            cost,
            reason: reason(interaction.options.getString('reason')),
            left: current - cost,
          }),
        ),
      ],
    });
  },
};

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function reason(text: string | null): string {
  return text ? ` (${text})` : '';
}
