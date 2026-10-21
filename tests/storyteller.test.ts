import {
  PermissionFlagsBits,
  PermissionsBitField,
  type APIInteractionGuildMember,
} from 'discord.js';
import { describe, expect, it } from 'vitest';
import { isStoryteller } from '../src/auth/storyteller.js';

const ROLE = '111';

function apiMember(roles: string[]): APIInteractionGuildMember {
  return { roles } as unknown as APIInteractionGuildMember;
}

describe('isStoryteller', () => {
  it('accepts a member with the Storyteller role', () => {
    const info = { member: apiMember([ROLE]), memberPermissions: new PermissionsBitField() };
    expect(isStoryteller(info, ROLE)).toBe(true);
  });

  it('refuses a member without the role', () => {
    const info = { member: apiMember(['222']), memberPermissions: new PermissionsBitField() };
    expect(isStoryteller(info, ROLE)).toBe(false);
  });

  it('accepts server admins even without the role configured', () => {
    const info = {
      member: apiMember([]),
      memberPermissions: new PermissionsBitField(PermissionFlagsBits.ManageGuild),
    };
    expect(isStoryteller(info, undefined)).toBe(true);
  });

  it('refuses everyone else when no role is configured', () => {
    const info = { member: apiMember([ROLE]), memberPermissions: new PermissionsBitField() };
    expect(isStoryteller(info, undefined)).toBe(false);
  });

  it('refuses outside a server', () => {
    expect(isStoryteller({ member: null, memberPermissions: null }, ROLE)).toBe(false);
  });
});
