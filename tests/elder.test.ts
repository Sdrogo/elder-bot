import { ApplicationCommandOptionType } from 'discord.js';
import { describe, expect, it } from 'vitest';
import { elderCommand } from '../src/commands/elder.js';
import { commands } from '../src/commands/index.js';

describe('/elder', () => {
  const json = elderCommand(commands);
  const byName = new Map(json.options?.map((o) => [o.name, o]));

  it('registers every command under one /elder command', () => {
    expect(json.name).toBe('elder');
    expect([...byName.keys()]).toEqual(commands.map((c) => c.data.name));
  });

  it('keeps plain commands as subcommands with their options', () => {
    const roll = byName.get('roll');
    expect(roll?.type).toBe(ApplicationCommandOptionType.Subcommand);
    expect(roll && 'options' in roll && roll.options?.map((o) => o.name)).toContain('dice');
  });

  it('turns commands with subcommands into groups', () => {
    const quickening = byName.get('quickening');
    expect(quickening?.type).toBe(ApplicationCommandOptionType.SubcommandGroup);
    expect(
      quickening && 'options' in quickening && quickening.options?.map((o) => o.name),
    ).toContain('set');
  });
});
