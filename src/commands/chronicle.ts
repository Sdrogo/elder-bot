import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandStringOption,
} from 'discord.js';
import { isAdmin, runsChronicle } from '../auth/campaign.js';
import { LIMITS, SECTS, SECT_NAMES, cleanName, isSect } from '../game/character.js';
import { described, localeFor, t, type MessageKey } from '../i18n/index.js';
import { COLORS, infoEmbed } from '../ui/format.js';
import { characterLine, chronicleLine, encodeCampaignId } from '../ui/sheet.js';
import {
  guildOf,
  pickChronicle,
  replyEphemeral,
  suggestCharacters,
  suggestChronicles,
} from './campaignShared.js';
import type { Command } from './types.js';

export const chronicleOption = (key: MessageKey) => (o: SlashCommandStringOption) =>
  described(o.setName('chronicle'), key).setAutocomplete(true).setMaxLength(100);

const sectChoices = SECTS.map((s) => ({ name: SECT_NAMES[s], value: s as string }));

const data = described(new SlashCommandBuilder().setName('chronicle'), 'cmd.chronicle.description')
  .addSubcommand((s) =>
    described(s.setName('create'), 'cmd.chronicle.create.description')
      .addStringOption((o) =>
        described(o.setName('name'), 'opt.chronicle.name')
          .setRequired(true)
          .setMaxLength(LIMITS.nameLength),
      )
      .addStringOption((o) =>
        described(o.setName('sect'), 'opt.chronicle.sect').addChoices(...sectChoices),
      ),
  )
  .addSubcommand((s) => described(s.setName('list'), 'cmd.chronicle.list.description'))
  .addSubcommand((s) =>
    described(s.setName('live'), 'cmd.chronicle.live.description').addStringOption(
      chronicleOption('opt.chronicle.pick'),
    ),
  )
  .addSubcommand((s) =>
    described(s.setName('invite'), 'cmd.chronicle.invite.description')
      .addUserOption((o) => described(o.setName('user'), 'opt.chronicle.player').setRequired(true))
      .addStringOption(chronicleOption('opt.chronicle.pick')),
  )
  .addSubcommand((s) =>
    described(s.setName('remove'), 'cmd.chronicle.remove.description').addStringOption((o) =>
      described(o.setName('character'), 'opt.chronicle.character')
        .setRequired(true)
        .setAutocomplete(true)
        .setMaxLength(100),
    ),
  )
  .addSubcommand((s) =>
    described(s.setName('edit'), 'cmd.chronicle.edit.description')
      .addStringOption(chronicleOption('opt.chronicle.pick'))
      .addStringOption((o) =>
        described(o.setName('name'), 'opt.chronicle.newName').setMaxLength(LIMITS.nameLength),
      )
      .addStringOption((o) =>
        described(o.setName('sect'), 'opt.chronicle.sect').addChoices(...sectChoices),
      ),
  )
  .addSubcommand((s) =>
    described(s.setName('archive'), 'cmd.chronicle.archive.description').addStringOption((o) =>
      chronicleOption('opt.chronicle.pick')(o).setRequired(true),
    ),
  );

export const chronicle: Command = {
  data,

  async autocomplete(interaction, ctx) {
    if (interaction.options.getFocused(true).name === 'character') {
      await suggestCharacters(interaction, ctx);
    } else {
      await suggestChronicles(interaction, ctx);
    }
  },

  async execute(interaction, ctx) {
    const { campaign } = ctx.store;
    const locale = localeFor(interaction, ctx.store);
    const guildId = await guildOf(interaction, locale);
    if (!guildId) return;
    const sub = interaction.options.getSubcommand();
    const me = interaction.user.id;

    if (sub === 'create') {
      const name = cleanName(interaction.options.getString('name', true));
      if (!name) return replyEphemeral(interaction, locale, 'character.badName');
      const sect = interaction.options.getString('sect') ?? 'camarilla';
      const created = campaign.createChronicle({
        guildId,
        storytellerId: me,
        name,
        sect: isSect(sect) ? sect : 'camarilla',
      });
      if (created === 'duplicate')
        return replyEphemeral(interaction, locale, 'chronicle.duplicate');
      if (created === 'limit') {
        return replyEphemeral(interaction, locale, 'chronicle.limit', {
          max: LIMITS.chroniclesPerStoryteller,
        });
      }
      // The first Chronicle goes on air straight away.
      if (!campaign.liveChronicle(guildId, me)) campaign.setLive(created.id);
      await interaction.reply({
        embeds: [infoEmbed(created.name, t(locale, 'chronicle.created', { slug: created.slug }))],
      });
      return;
    }

    if (sub === 'list') {
      const list = campaign.chronicles(guildId, isAdmin(interaction) ? undefined : me);
      if (!list.length) return replyEphemeral(interaction, locale, 'chronicle.noneYet');
      const blocks = list.map((c) => {
        const members = campaign.members(c.id);
        const live = campaign.liveChronicle(guildId, c.storytellerId)?.id === c.id;
        const names = members.map((m) => `${m.name} (<@${m.ownerId}>)`).join(', ');
        return `${chronicleLine(locale, c, members.length, live)}${names ? `\n${names}` : ''}`;
      });
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.neutral)
            .setTitle(t(locale, 'chronicle.list.title'))
            .setDescription(blocks.join('\n\n').slice(0, 4000)),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'remove') {
      const value = interaction.options.getString('character', true);
      const c = /^\d+$/.test(value) ? campaign.getCharacter(Number(value)) : undefined;
      const from = c?.chronicleId !== undefined ? campaign.getChronicle(c.chronicleId) : undefined;
      if (!c || !from || c.guildId !== guildId) {
        return replyEphemeral(interaction, locale, 'chronicle.notMember');
      }
      if (!runsChronicle(interaction, from)) {
        return replyEphemeral(interaction, locale, 'chronicle.storytellerOnly');
      }
      campaign.leave(c.id);
      await interaction.reply({
        embeds: [
          infoEmbed(
            from.name,
            t(locale, 'chronicle.removed', { name: c.name, chronicle: from.name }),
          ),
        ],
      });
      return;
    }

    const target = await pickChronicle(interaction, ctx, locale, guildId);
    if (!target) return;
    if (!runsChronicle(interaction, target)) {
      return replyEphemeral(interaction, locale, 'chronicle.storytellerOnly');
    }

    if (sub === 'live') {
      campaign.setLive(target.id);
      const members = campaign.members(target.id);
      const lines = members.map((m) => characterLine(m)).join('\n\n');
      await interaction.reply({
        embeds: [
          infoEmbed(
            target.name,
            `${t(locale, 'chronicle.live.set', { name: target.name })}${lines ? `\n\n${lines}` : ''}`.slice(
              0,
              4000,
            ),
          ),
        ],
      });
      return;
    }

    if (sub === 'invite') {
      const user = interaction.options.getUser('user', true);
      if (user.bot) return replyEphemeral(interaction, locale, 'character.give.invalid');
      await interaction.reply({
        content: t(locale, 'chronicle.invite', {
          user: `${user}`,
          storyteller: `${interaction.user}`,
          chronicle: target.name,
        }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(
                encodeCampaignId({ kind: 'pick', chronicleId: target.id, userId: user.id }),
              )
              .setLabel(t(locale, 'button.pickCharacter'))
              .setStyle(ButtonStyle.Primary),
          ),
        ],
        allowedMentions: { users: [user.id] },
      });
      return;
    }

    if (sub === 'edit') {
      const rawName = interaction.options.getString('name');
      const name = rawName === null ? undefined : cleanName(rawName);
      if (rawName !== null && !name)
        return replyEphemeral(interaction, locale, 'character.badName');
      const sect = interaction.options.getString('sect');
      if (name === undefined && sect === null) {
        return replyEphemeral(interaction, locale, 'character.editNothing');
      }
      const updated = campaign.updateChronicle(target.id, {
        name,
        sect: isSect(sect) ? sect : undefined,
      });
      if (!updated) return;
      await interaction.reply({
        embeds: [
          infoEmbed(
            updated.name,
            chronicleLine(
              locale,
              updated,
              campaign.members(updated.id).length,
              campaign.liveChronicle(guildId, updated.storytellerId)?.id === updated.id,
            ),
          ),
        ],
      });
      return;
    }

    if (sub === 'archive') {
      campaign.archiveChronicle(target.id);
      await interaction.reply({
        embeds: [infoEmbed(target.name, t(locale, 'chronicle.archived', { name: target.name }))],
      });
    }
  },
};
