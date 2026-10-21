import {
  PermissionFlagsBits,
  type APIInteractionGuildMember,
  type GuildMember,
  type PermissionsBitField,
} from 'discord.js';

/** The parts of an interaction needed to tell who is the Storyteller. */
export interface MemberInfo {
  member: GuildMember | APIInteractionGuildMember | null;
  memberPermissions: Readonly<PermissionsBitField> | null;
}

/**
 * The Storyteller is whoever has STORYTELLER_ROLE_ID, plus the server's admins (Manage Server),
 * so the bot stays usable before the role is configured. Outside a server nobody is.
 */
export function isStoryteller(info: MemberInfo, roleId?: string): boolean {
  if (info.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  if (!roleId || !info.member) return false;
  const roles = info.member.roles;
  return Array.isArray(roles) ? roles.includes(roleId) : roles.cache.has(roleId);
}

export const STORYTELLER_ONLY = 'Solo il Narratore può farlo.';
