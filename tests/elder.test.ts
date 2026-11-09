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
    const prolonged = byName.get('prolonged');
    expect(prolonged?.type).toBe(ApplicationCommandOptionType.SubcommandGroup);
    expect(prolonged && 'options' in prolonged && prolonged.options?.map((o) => o.name)).toContain(
      'roll',
    );
  });

  it('translates the descriptions into Italian at every level, keeping English names', () => {
    expect(json.description_localizations?.it).toBe('Tiri di dado per Vampire: The Masquerade 6e');
    const prolonged = byName.get('prolonged');
    expect(prolonged?.description_localizations?.it).toBe(
      'Compito prolungato: somma i successi di più tiri',
    );
    const start =
      prolonged && 'options' in prolonged
        ? prolonged.options?.find((o) => o.name === 'start')
        : undefined;
    expect(start?.description).toBe('Start a prolonged task');
    expect(start?.description_localizations?.it).toBe('Apre un compito prolungato');
    const roll = byName.get('roll');
    const dice =
      roll && 'options' in roll ? roll.options?.find((o) => o.name === 'dice') : undefined;
    expect(dice?.description_localizations?.it).toBe(
      'Attributo + Abilità, Disciplina o Composure + Resolve',
    );
    expect(roll?.description_localizations?.it).toContain('Attributo + Abilità');
  });

  it('translates choice names', () => {
    const prolonged = byName.get('prolonged');
    const start =
      prolonged && 'options' in prolonged
        ? prolonged.options?.find((o) => o.name === 'start')
        : undefined;
    const target =
      start && 'options' in start ? start.options?.find((o) => o.name === 'target') : undefined;
    const choices = target && 'choices' in target ? target.choices : undefined;
    expect(choices?.[0]).toMatchObject({
      name: '3 successes',
      name_localizations: { it: '3 successi' },
      value: 3,
    });
  });

  it('keeps every description within the Discord limit', () => {
    const descriptions: string[] = [];
    const walk = (o: {
      description?: string;
      description_localizations?: object | null;
      options?: unknown[];
    }) => {
      if (o.description) descriptions.push(o.description);
      descriptions.push(...Object.values(o.description_localizations ?? {}));
      for (const child of o.options ?? []) walk(child as typeof o);
    };
    walk(json);
    expect(descriptions.length).toBeGreaterThan(50);
    for (const d of descriptions) expect(d.length, d).toBeLessThanOrEqual(100);
  });
});
