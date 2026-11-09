import type { ChatInputCommandInteraction } from 'discord.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { frenzy } from '../src/commands/frenzy.js';
import { Store } from '../src/state/store.js';

let store: Store;
beforeEach(() => {
  store = new Store(':memory:');
});
afterEach(() => store.close());

interface Reply {
  content?: string;
  embeds?: { toJSON(): { description?: string; fields?: { name: string; value: string }[] } }[];
  components?: unknown[];
}

async function run(options: Record<string, string | number | null>, dice: number[]) {
  const replies: Reply[] = [];
  const interaction = {
    channelId: 'c1',
    locale: 'en-US',
    user: { id: 'u1', displayName: 'Ulfred' },
    options: {
      getString: (n: string) => options[n] ?? null,
      getInteger: (n: string) => options[n] ?? null,
    },
    reply: async (r: Reply) => {
      replies.push(r);
    },
  } as unknown as ChatInputCommandInteraction;
  let i = 0;
  await frenzy.execute(interaction, { store, roller: () => dice[i++ % dice.length]! });
  return replies[0]!;
}

describe('/elder frenzy', () => {
  it('rolls no more dice than the Humanity rank', async () => {
    const r = await run({ type: 'rage', dice: 6, humanity: 4, difficulty: 2 }, [9]);
    const embed = r.embeds![0]!.toJSON();
    expect(embed.description).toContain('= **4** dice');
    expect(embed.fields?.find((f) => f.name === 'Humanity')?.value).toContain('Humanity 4');
    expect(embed.fields?.find((f) => f.name === 'Rage Frenzy')?.value).toContain('Resisted');
    expect(r.components).toEqual([]);
  });

  it('uses the Hunger dice as the Difficulty of a hunger frenzy', async () => {
    const r = await run({ type: 'hunger', dice: 5, humanity: 7, hunger: 3 }, [6, 2, 2]);
    const embed = r.embeds![0]!.toJSON();
    expect(embed.description).toContain('Difficulty 3');
    expect(embed.fields?.find((f) => f.name === 'Hunger Frenzy')?.value).toContain('suffers');
  });

  it('asks for a Difficulty when it cannot work one out', async () => {
    const r = await run({ type: 'clan', dice: 5, humanity: 7 }, [9]);
    expect(r.content).toContain('difficulty');
  });
});
