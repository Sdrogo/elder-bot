import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { isStoryteller, storytellerOnly } from '../auth/storyteller.js';
import {
  LANGUAGE_NAMES,
  LOCALES,
  choice,
  described,
  isLocale,
  localeFor,
  t,
} from '../i18n/index.js';
import { infoEmbed } from '../ui/format.js';
import type { Command } from './types.js';

/** `/elder session language` value that drops the table language and follows each user's Discord. */
export const AUTO_LANGUAGE = 'auto';

const data = described(new SlashCommandBuilder().setName('session'), 'cmd.session.description')
  .addSubcommand((s) =>
    described(s.setName('new'), 'cmd.session.new.description').addIntegerOption((o) =>
      described(o.setName('player_characters'), 'opt.session.player_characters')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(20),
    ),
  )
  .addSubcommand((s) => described(s.setName('scene'), 'cmd.session.scene.description'))
  .addSubcommand((s) => described(s.setName('end'), 'cmd.session.end.description'))
  .addSubcommand((s) =>
    described(s.setName('storyteller'), 'cmd.session.storyteller.description').addUserOption((o) =>
      described(o.setName('user'), 'opt.session.user'),
    ),
  )
  .addSubcommand((s) =>
    described(s.setName('language'), 'cmd.session.language.description').addStringOption((o) =>
      described(o.setName('language'), 'opt.session.language')
        .setRequired(true)
        .addChoices(
          choice('choice.language.auto', AUTO_LANGUAGE),
          // Each language is listed under its own name, in every language.
          ...LOCALES.map((l) => ({ name: LANGUAGE_NAMES[l], value: l as string })),
        ),
    ),
  );

export const session: Command = {
  data,
  async execute(interaction, { store }) {
    const locale = localeFor(interaction, store);
    const channelId = interaction.channelId;
    const sub = interaction.options.getSubcommand();
    const current = store.getStoryteller(channelId);
    const newUser = sub === 'storyteller' ? interaction.options.getUser('user') : null;

    if (sub === 'storyteller' && !newUser) {
      const who = current ? `<@${current}>` : t(locale, 'session.storyteller.none');
      await interaction.reply({
        embeds: [
          infoEmbed(
            t(locale, 'session.storyteller.title'),
            t(locale, 'session.storyteller.current', { who }),
          ),
        ],
      });
      return;
    }

    if (sub === 'end') {
      if (!isStoryteller(interaction, current)) {
        await interaction.reply({
          content: storytellerOnly(locale),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      store.endSession(channelId);
      await interaction.reply({
        embeds: [infoEmbed(t(locale, 'session.ended.title'), t(locale, 'session.ended'))],
      });
      return;
    }

    // A table without a Storyteller is claimed by whoever starts it; afterwards only the
    // Storyteller (or a server admin) runs the session.
    if (current !== undefined && !isStoryteller(interaction, current)) {
      await interaction.reply({ content: storytellerOnly(locale), flags: MessageFlags.Ephemeral });
      return;
    }

    if (newUser) {
      store.setStoryteller(channelId, newUser.id);
      await interaction.reply({
        embeds: [
          infoEmbed(
            t(locale, 'session.storyteller.title'),
            t(locale, 'session.storyteller.set', { user: `${newUser}` }),
          ),
        ],
      });
      return;
    }

    if (sub === 'language') {
      const value = interaction.options.getString('language', true);
      if (isLocale(value)) store.setTableLocale(channelId, value);
      else store.clearTableLocale(channelId);
      // Answer in the language just chosen.
      const now = localeFor(interaction, store);
      const text = isLocale(value)
        ? t(now, 'session.language.set', { language: LANGUAGE_NAMES[value] })
        : t(now, 'session.language.auto');
      await interaction.reply({ embeds: [infoEmbed(t(now, 'session.language.title'), text)] });
      return;
    }

    const claimed = current === undefined;
    if (claimed) store.setStoryteller(channelId, interaction.user.id);
    const storytellerLine = claimed
      ? `\n${t(locale, 'session.storyteller.set', { user: `${interaction.user}` })}`
      : '';

    if (sub === 'new') {
      const pcs = interaction.options.getInteger('player_characters', true);
      store.newSession(channelId, pcs);
      await interaction.reply({
        embeds: [
          infoEmbed(
            t(locale, 'session.new.title'),
            `${t(locale, 'session.new', { pcs })}${storytellerLine}`,
          ),
        ],
      });
      return;
    }
    store.newScene(channelId);
    await interaction.reply({
      embeds: [
        infoEmbed(
          t(locale, 'session.scene.title'),
          `${t(locale, 'session.scene')}${storytellerLine}`,
        ),
      ],
    });
  },
};
