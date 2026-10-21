import { PermissionFlagsBits, type PermissionsBitField } from 'discord.js';

/** The parts of an interaction needed to tell who is the Storyteller. */
export interface MemberInfo {
  user: { id: string };
  memberPermissions: Readonly<PermissionsBitField> | null;
}

/**
 * Each channel (table) has its own Storyteller, saved by /session. Server admins (Manage Server)
 * always count too, so a table is never stuck if its Storyteller leaves.
 */
export function isStoryteller(info: MemberInfo, storytellerId: string | undefined): boolean {
  if (info.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  return storytellerId !== undefined && info.user.id === storytellerId;
}

export const STORYTELLER_ONLY =
  'Solo il Narratore di questo tavolo può farlo. Chi fa `/session new` diventa Narratore, e può passare il ruolo con `/session storyteller`.';
