import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { runsChronicle } from '../auth/campaign.js';
import { ATTRIBUTES, ATTRIBUTE_NAMES } from '../game/alpha2/core.js';
import {
  IMPAIR_CATEGORIES,
  decodeImpairKey,
  impairLabel,
  type ImpairKey,
} from '../game/sheetPool.js';
import { choice, described, localeFor, t } from '../i18n/index.js';
import { guildOf, pickCharacter, replyEphemeral, suggestCharacters } from './campaignShared.js';
import type { Command } from './types.js';

// /elder impair: the Storyteller Impairs a character's Attributes for the scene (Remorse, a
// monster's ability...). A whole group or a single Attribute; each Impaired Attribute in a test
// costs 2 dice (Player Packet p. 105). The empty Health and Willpower trackers already do it alone.

const CLEAR = 'clear';

const data = described(new SlashCommandBuilder().setName('impair'), 'cmd.impair.description')
  .addStringOption((o) =>
    described(o.setName('character'), 'opt.impair.character')
      .setRequired(true)
      .setAutocomplete(true)
      .setMaxLength(100),
  )
  .addStringOption((o) =>
    described(o.setName('target'), 'opt.impair.target')
      .setRequired(true)
      .addChoices(
        ...IMPAIR_CATEGORIES.map((c) => ({ name: impairLabel(c), value: c })),
        ...ATTRIBUTES.map((a) => ({ name: ATTRIBUTE_NAMES[a], value: a })),
        choice('impair.choice.clear', CLEAR),
      ),
  )
  .addBooleanOption((o) => described(o.setName('remove'), 'opt.impair.remove'));

export const impair: Command = {
  data,

  async autocomplete(interaction, ctx) {
    await suggestCharacters(interaction, ctx);
  },

  async execute(interaction, ctx) {
    const { campaign } = ctx.store;
    const locale = localeFor(interaction, ctx.store);
    const guildId = await guildOf(interaction, locale);
    if (!guildId) return;
    const c = await pickCharacter(interaction, ctx, locale, guildId, { required: true });
    if (!c) return;
    const chronicle =
      c.chronicleId !== undefined ? campaign.getChronicle(c.chronicleId) : undefined;
    if (!chronicle) return replyEphemeral(interaction, locale, 'impair.noChronicle');
    if (!runsChronicle(interaction, chronicle)) {
      return replyEphemeral(interaction, locale, 'impair.notYours');
    }

    const target = interaction.options.getString('target', true);
    const remove = interaction.options.getBoolean('remove') ?? false;
    const current = campaign.getImpairments(c.id);
    let next: ImpairKey[];
    if (target === CLEAR || remove) {
      const key = target === CLEAR ? undefined : decodeImpairKey(target);
      next = key ? current.filter((k) => k !== key) : [];
      if (next.length === current.length) {
        return replyEphemeral(interaction, locale, 'impair.nothingToRemove', { name: c.name });
      }
    } else {
      const key = decodeImpairKey(target);
      if (!key)
        return replyEphemeral(interaction, locale, 'impair.nothingToRemove', { name: c.name });
      next = current.includes(key) ? current : [...current, key];
    }
    const saved = campaign.setImpairments(c.id, next);
    const message = saved.length
      ? t(locale, 'impair.added', { name: c.name, list: saved.map(impairLabel).join(', ') })
      : t(locale, 'impair.none', { name: c.name });
    await interaction.reply({ content: message, flags: MessageFlags.SuppressNotifications });
  },
};
