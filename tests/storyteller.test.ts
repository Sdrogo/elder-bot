import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { describe, expect, it } from 'vitest';
import { isStoryteller } from '../src/auth/storyteller.js';

const player = (id: string, ...perms: bigint[]) => ({
  user: { id },
  memberPermissions: new PermissionsBitField(perms),
});

describe('isStoryteller', () => {
  it("accepts the table's Storyteller", () => {
    expect(isStoryteller(player('u1'), 'u1')).toBe(true);
  });

  it('refuses everyone else', () => {
    expect(isStoryteller(player('u2'), 'u1')).toBe(false);
  });

  it('refuses everyone when the table has no Storyteller yet', () => {
    expect(isStoryteller(player('u1'), undefined)).toBe(false);
  });

  it('always accepts server admins', () => {
    expect(isStoryteller(player('u2', PermissionFlagsBits.ManageGuild), 'u1')).toBe(true);
  });

  it('refuses outside a server', () => {
    expect(isStoryteller({ user: { id: 'u2' }, memberPermissions: null }, 'u1')).toBe(false);
  });
});
