import { PermissionFlagsBits, type PermissionsBitField } from 'discord.js';
import { t, type Locale } from '../i18n/index.js';

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

/** The refusal shown to anyone else who tries a Storyteller action. */
export function storytellerOnly(locale: Locale): string {
  return t(locale, 'auth.storytellerOnly');
}
