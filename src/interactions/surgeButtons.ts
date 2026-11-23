import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { canEditCharacter } from '../auth/campaign.js';
import type { Context } from '../commands/types.js';
import { localeFor, t } from '../i18n/index.js';

// "End Blood Surge" under a roll: the scene is over, the character's surges end (p. 147).
// Id: surge:end:<characterId>

const PREFIX = 'surge:end:';

export const encodeSurgeEndId = (characterId: number) => `${PREFIX}${characterId}`;

export const isSurgeId = (customId: string) => customId.startsWith(PREFIX);

export async function handleSurgeButton(
  interaction: ButtonInteraction,
  { store }: Context,
): Promise<void> {
  const locale = localeFor(interaction, store);
  const id = Number(interaction.customId.slice(PREFIX.length));
  const c = Number.isInteger(id) ? store.campaign.getCharacter(id) : undefined;
  if (!c) {
    await interaction.reply({
      content: t(locale, 'character.notFound'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  // The player, the Chronicle's Storyteller or a server admin.
  if (!canEditCharacter(interaction, c, store.campaign)) {
    await interaction.reply({
      content: t(locale, 'character.cannotEdit'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  store.campaign.clearSurges(c.id);
  await interaction.reply({ content: t(locale, 'sheetRoll.surgeEnded', { name: c.name }) });
  // Keep the roll's other buttons, drop this one.
  const rows = interaction.message.components
    .map((row) => row.toJSON())
    .map((row) =>
      'components' in row
        ? {
            ...row,
            components: row.components.filter(
              (b) => !('custom_id' in b) || b.custom_id !== interaction.customId,
            ),
          }
        : row,
    )
    .filter((row) => !('components' in row) || row.components.length > 0);
  await interaction.message.edit({ components: rows as never }).catch(() => undefined);
}
