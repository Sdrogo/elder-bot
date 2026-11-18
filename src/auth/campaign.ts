import { PermissionFlagsBits } from 'discord.js';
import type { Campaign, Character, Chronicle } from '../state/campaign.js';
import type { MemberInfo } from './storyteller.js';

/** Server admins (Manage Server) can always step in, as for the table's Storyteller. */
export function isAdmin(info: MemberInfo): boolean {
  return info.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
}

/** The Storyteller who created the Chronicle, or a server admin. */
export function runsChronicle(info: MemberInfo, chronicle: Chronicle): boolean {
  return isAdmin(info) || info.user.id === chronicle.storytellerId;
}

/**
 * Who may change a character's trackers, name, clan and Attributes: its owner, the
 * Storyteller of its Chronicle, or a server admin. Deleting or giving it away is the owner's.
 */
export function canEditCharacter(
  info: MemberInfo,
  character: Character,
  campaign: Pick<Campaign, 'getChronicle'>,
): boolean {
  if (info.user.id === character.ownerId || isAdmin(info)) return true;
  if (character.chronicleId === undefined) return false;
  const chronicle = campaign.getChronicle(character.chronicleId);
  return chronicle !== undefined && info.user.id === chronicle.storytellerId;
}
