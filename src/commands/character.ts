import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandIntegerOption,
  type SlashCommandStringOption,
} from 'discord.js';
import { canEditCharacter } from '../auth/campaign.js';
import {
  CLANS,
  CLAN_NAMES,
  LIMITS,
  TIERS,
  TIER_NAMES,
  TRACKS,
  TRACK_NAMES,
  cleanName,
  isClan,
  isTier,
  newCharacter,
  type CharacterValues,
  type Clan,
  type Track,
} from '../game/character.js';
import { described, localeFor, t, type MessageKey } from '../i18n/index.js';
import { COLORS } from '../ui/format.js';
import { characterLine, encodeCampaignId, sheetMessage } from '../ui/sheet.js';
import { guildOf, pickCharacter, replyEphemeral, suggestCharacters } from './campaignShared.js';
import type { Command } from './types.js';

const attribute = (name: string, key: MessageKey) => (o: SlashCommandIntegerOption) =>
  described(o.setName(name), key).setMinValue(1).setMaxValue(LIMITS.attribute);

const characterOption = (key: MessageKey) => (o: SlashCommandStringOption) =>
  described(o.setName('character'), key).setAutocomplete(true).setMaxLength(100);

const clanChoices = CLANS.map((c) => ({ name: CLAN_NAMES[c], value: c as string }));
const tierChoices = TIERS.map((c) => ({ name: TIER_NAMES[c], value: c as string }));

const data = described(new SlashCommandBuilder().setName('character'), 'cmd.character.description')
  .addSubcommand((s) =>
    described(s.setName('create'), 'cmd.character.create.description')
      .addStringOption((o) =>
        described(o.setName('name'), 'opt.character.name')
          .setRequired(true)
          .setMaxLength(LIMITS.nameLength),
      )
      .addStringOption((o) =>
        described(o.setName('clan'), 'opt.character.clan')
          .setRequired(true)
          .addChoices(...clanChoices),
      )
      .addStringOption((o) =>
        described(o.setName('tier'), 'opt.character.tier')
          .setRequired(true)
          .addChoices(...tierChoices),
      )
      .addIntegerOption((o) => attribute('stamina', 'opt.character.stamina')(o).setRequired(true))
      .addIntegerOption((o) =>
        attribute('composure', 'opt.character.composure')(o).setRequired(true),
      )
      .addIntegerOption((o) => attribute('resolve', 'opt.character.resolve')(o).setRequired(true))
      .addIntegerOption((o) =>
        described(o.setName('humanity'), 'opt.character.humanity')
          .setMinValue(0)
          .setMaxValue(LIMITS.humanity),
      ),
  )
  .addSubcommand((s) =>
    described(s.setName('sheet'), 'cmd.character.sheet.description')
      .addStringOption(characterOption('opt.character.pick'))
      .addBooleanOption((o) => described(o.setName('public'), 'opt.character.public')),
  )
  .addSubcommand((s) => described(s.setName('list'), 'cmd.character.list.description'))
  .addSubcommand((s) =>
    described(s.setName('set'), 'cmd.character.set.description')
      .addStringOption((o) =>
        described(o.setName('track'), 'opt.character.track')
          .setRequired(true)
          .addChoices(...TRACKS.map((tr) => ({ name: TRACK_NAMES[tr], value: tr as string }))),
      )
      .addIntegerOption((o) =>
        described(o.setName('value'), 'opt.character.value')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(30),
      )
      .addStringOption(characterOption('opt.character.pick')),
  )
  .addSubcommand((s) =>
    described(s.setName('edit'), 'cmd.character.edit.description')
      .addStringOption(characterOption('opt.character.pick'))
      .addStringOption((o) =>
        described(o.setName('name'), 'opt.character.newName').setMaxLength(LIMITS.nameLength),
      )
      .addStringOption((o) =>
        described(o.setName('clan'), 'opt.character.clan').addChoices(...clanChoices),
      )
      .addStringOption((o) =>
        described(o.setName('tier'), 'opt.character.tier').addChoices(...tierChoices),
      )
      .addIntegerOption(attribute('stamina', 'opt.character.stamina'))
      .addIntegerOption(attribute('composure', 'opt.character.composure'))
      .addIntegerOption(attribute('resolve', 'opt.character.resolve')),
  )
  .addSubcommand((s) =>
    described(s.setName('give'), 'cmd.character.give.description')
      .addUserOption((o) => described(o.setName('user'), 'opt.character.giveTo').setRequired(true))
      .addStringOption((o) => characterOption('opt.character.pick')(o).setRequired(true)),
  )
  .addSubcommand((s) =>
    described(s.setName('delete'), 'cmd.character.delete.description').addStringOption((o) =>
      characterOption('opt.character.pick')(o).setRequired(true),
    ),
  );

export const character: Command = {
  data,

  async autocomplete(interaction, ctx) {
    const sub = interaction.options.getSubcommand();
    await suggestCharacters(interaction, ctx, { ownOnly: sub === 'give' || sub === 'delete' });
  },

  async execute(interaction, ctx) {
    const { campaign } = ctx.store;
    const locale = localeFor(interaction, ctx.store);
    const guildId = await guildOf(interaction, locale);
    if (!guildId) return;
    const sub = interaction.options.getSubcommand();
    const ephemeral = { flags: MessageFlags.Ephemeral } as const;

    if (sub === 'create') {
      const name = cleanName(interaction.options.getString('name', true));
      const clan = interaction.options.getString('clan', true);
      const tier = interaction.options.getString('tier', true);
      if (!name) return replyEphemeral(interaction, locale, 'character.badName');
      if (!isClan(clan) || !isTier(tier)) return;
      const values = newCharacter({
        tier,
        stamina: interaction.options.getInteger('stamina', true),
        composure: interaction.options.getInteger('composure', true),
        resolve: interaction.options.getInteger('resolve', true),
        humanity: interaction.options.getInteger('humanity') ?? undefined,
      });
      const created = campaign.createCharacter({
        guildId,
        ownerId: interaction.user.id,
        name,
        clan,
        values,
      });
      if (created === 'duplicate')
        return replyEphemeral(interaction, locale, 'character.duplicate');
      if (created === 'limit') {
        return replyEphemeral(interaction, locale, 'character.limit', {
          max: LIMITS.charactersPerUser,
        });
      }
      await interaction.reply({
        content: t(locale, 'character.created', { name: created.name }),
        ...sheetMessage(locale, created, undefined, true),
        ...ephemeral,
      });
      return;
    }

    if (sub === 'list') {
      const own = campaign.charactersOf(guildId, interaction.user.id);
      if (!own.length) return replyEphemeral(interaction, locale, 'character.noneYet');
      const lines = own.map((c) =>
        characterLine(
          c,
          c.chronicleId !== undefined ? campaign.getChronicle(c.chronicleId) : undefined,
        ),
      );
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.neutral)
            .setTitle(t(locale, 'character.list.title'))
            .setDescription(lines.join('\n\n').slice(0, 4000)),
        ],
        ...ephemeral,
      });
      return;
    }

    const c = await pickCharacter(interaction, ctx, locale, guildId, {
      required: sub === 'give' || sub === 'delete',
    });
    if (!c) return;
    const chronicle =
      c.chronicleId !== undefined ? campaign.getChronicle(c.chronicleId) : undefined;
    const editable = canEditCharacter(interaction, c, campaign);

    if (sub === 'sheet') {
      // Anyone at the table can look; only those who may change it get the buttons.
      const isPublic = interaction.options.getBoolean('public') ?? false;
      await interaction.reply({
        ...sheetMessage(locale, c, chronicle, editable && !isPublic),
        ...(isPublic ? {} : ephemeral),
      });
      return;
    }

    if (sub === 'give' || sub === 'delete') {
      if (c.ownerId !== interaction.user.id) {
        return replyEphemeral(interaction, locale, 'character.ownerOnly');
      }
    } else if (!editable) {
      return replyEphemeral(interaction, locale, 'character.cannotEdit');
    }

    if (sub === 'set') {
      const track = interaction.options.getString('track', true) as Track;
      const updated = campaign.setTrack(
        c.id,
        track,
        interaction.options.getInteger('value', true),
        interaction.user.id,
      );
      if (!updated) return;
      await interaction.reply({ ...sheetMessage(locale, updated, chronicle, true), ...ephemeral });
      return;
    }

    if (sub === 'edit') {
      const rawName = interaction.options.getString('name');
      const name = rawName === null ? undefined : cleanName(rawName);
      if (rawName !== null && !name)
        return replyEphemeral(interaction, locale, 'character.badName');
      const clan = interaction.options.getString('clan');
      const tier = interaction.options.getString('tier');
      const values: Partial<CharacterValues> = {};
      if (isTier(tier)) values.tier = tier;
      for (const key of ['stamina', 'composure', 'resolve'] as const) {
        const value = interaction.options.getInteger(key);
        if (value !== null) values[key] = value;
      }
      if (name === undefined && clan === null && Object.keys(values).length === 0) {
        return replyEphemeral(interaction, locale, 'character.editNothing');
      }
      const updated = campaign.updateCharacter(
        c.id,
        { name, clan: isClan(clan) ? (clan as Clan) : undefined, values },
        interaction.user.id,
      );
      if (updated === 'duplicate')
        return replyEphemeral(interaction, locale, 'character.duplicate');
      if (!updated || updated === 'limit') return;
      await interaction.reply({ ...sheetMessage(locale, updated, chronicle, true), ...ephemeral });
      return;
    }

    if (sub === 'delete') {
      await interaction.reply({
        content: t(locale, 'character.delete.confirm', { name: c.name }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(encodeCampaignId({ kind: 'delete', characterId: c.id }))
              .setLabel(t(locale, 'button.delete'))
              .setStyle(ButtonStyle.Danger),
          ),
        ],
        ...ephemeral,
      });
      return;
    }

    if (sub === 'give') {
      const to = interaction.options.getUser('user', true);
      if (to.bot || to.id === interaction.user.id) {
        return replyEphemeral(interaction, locale, 'character.give.invalid');
      }
      const ref = { kind: 'give', characterId: c.id, fromId: interaction.user.id, toId: to.id };
      await interaction.reply({
        content: t(locale, 'character.give.offer', {
          from: `${interaction.user}`,
          to: `${to}`,
          name: c.name,
        }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(encodeCampaignId({ ...ref, kind: 'give', accept: true }))
              .setLabel(t(locale, 'button.accept'))
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(encodeCampaignId({ ...ref, kind: 'give', accept: false }))
              .setLabel(t(locale, 'button.refuse'))
              .setStyle(ButtonStyle.Secondary),
          ),
        ],
        // Ping only the player who receives the character.
        allowedMentions: { users: [to.id] },
      });
    }
  },
};
