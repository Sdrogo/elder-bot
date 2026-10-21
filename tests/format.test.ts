import { describe, expect, it } from 'vitest';
import { performRoll, type RollRequest } from '../src/game/roll.js';
import { Store } from '../src/state/store.js';
import { formatDice, rollMessage } from '../src/ui/format.js';

const base: RollRequest = {
  channelId: 'c1',
  userId: '123456789012345678',
  dice: 3,
  difficulty: 1,
  modifier: 1,
  quickening: 0,
  combat: false,
  retry: false,
  applyTraits: true,
};

function render(request: RollRequest, dice: number[], quickening = 0) {
  const store = new Store(':memory:');
  store.setQuickening(request.channelId, request.userId, quickening);
  let i = 0;
  const response = performRoll(store, request, { roller: () => dice[i++ % dice.length]! });
  store.close();
  if (response.kind === 'error') throw new Error(response.message);
  const message = rollMessage(response, 'Andrea: salto sul tetto');
  return {
    embed: message.embeds[0]!.toJSON(),
    buttons: message.components.flatMap((row) => row.toJSON().components),
  };
}

describe('rollMessage', () => {
  it('shows a success with extra successes and the 10s', () => {
    const { embed, buttons } = render(base, [10, 8, 2]);
    expect(embed.description).toContain('= **3** dadi');
    expect(embed.fields?.find((f) => f.name === 'Esito')?.value).toContain('2 successi (1 extra)');
    expect(embed.fields?.find((f) => f.name === 'Quickening')?.value).toContain('+1 Quickening');
    expect(buttons).toEqual([]);
  });

  it("offers Devil's Bargain and Try again on a failure", () => {
    const { buttons } = render(base, [5]);
    expect(buttons.map((b) => 'label' in b && b.label)).toEqual(["Devil's Bargain", 'Try again']);
  });

  it('lists Choose Your Pain on a painful failure, with a button per option', () => {
    const { embed, buttons } = render(base, [1, 3]);
    expect(embed.fields?.map((f) => f.name)).toContain('Choose Your Pain');
    expect(buttons.map((b) => 'label' in b && b.label)).toEqual([
      'Lose 3 Vitae/Willpower',
      'Mark Beast',
      'Give 1 Drama',
      'Try again',
    ]);
  });

  it('offers Lose all Quickening only to a player who has some', () => {
    const { buttons } = render(base, [1, 3]);
    expect(buttons.map((b) => 'label' in b && b.label)).not.toContain('Lose all Quickening');
    const withQuickening = render(base, [1, 3], 2);
    expect(withQuickening.buttons.map((b) => 'label' in b && b.label)).toContain(
      'Lose all Quickening',
    );
  });

  it('asks before rolling when Overqualified', () => {
    const { buttons } = render({ ...base, dice: 6 }, [9]);
    expect(buttons.map((b) => 'label' in b && b.label)).toEqual(['Take basic success', 'Roll']);
  });

  it('offers Accept failure at No Dice Left', () => {
    const { buttons } = render({ ...base, dice: 0 }, [9]);
    expect(buttons.map((b) => 'label' in b && b.label)).toEqual(['Accept failure']);
  });
});

describe('formatDice', () => {
  it('sorts high to low and bolds successes', () => {
    expect(formatDice([3, 10, 8, 1])).toBe('**10** **8** 3 1');
  });
});
