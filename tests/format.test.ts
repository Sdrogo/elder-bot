import { describe, expect, it } from 'vitest';
import { performNpcRoll, performRoll, type RollRequest } from '../src/game/roll.js';
import { Store } from '../src/state/store.js';
import { setDiceEmojis } from '../src/ui/diceEmojis.js';
import type { Locale } from '../src/i18n/index.js';
import { formatDice, rollErrorText, rollMessage } from '../src/ui/format.js';

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

function render(request: RollRequest, dice: number[], quickening = 0, locale: Locale = 'it') {
  const store = new Store(':memory:');
  store.setQuickening(request.channelId, request.userId, quickening);
  let i = 0;
  const response = performRoll(store, request, { roller: () => dice[i++ % dice.length]! });
  store.close();
  if (response.kind === 'error') throw new Error(rollErrorText(locale, response));
  const message = rollMessage(locale, response, 'Andrea: salto sul tetto');
  return {
    content: message.content,
    embed: message.embeds[0]!.toJSON(),
    buttons: message.components.flatMap((row) => row.toJSON().components),
  };
}

describe('rollMessage', () => {
  it('puts the dice faces in the message text, where Discord draws them large', () => {
    setDiceEmojis({ 10: '<:d10:1>', 8: '<:d8:2>', 2: '<:d2:3>' });
    try {
      const { content, embed } = render(base, [10, 8, 2]);
      expect(content).toBe('<:d10:1> <:d8:2> <:d2:3>');
      expect(embed.fields?.find((f) => f.name === 'Dadi')).toBeUndefined();
    } finally {
      setDiceEmojis({});
    }
  });

  it('lists the dice as numbers when the faces are not available', () => {
    const { content, embed } = render(base, [10, 8, 2]);
    expect(content).toBeUndefined();
    expect(embed.fields?.find((f) => f.name === 'Dadi')?.value).toBe('**10** **8** 2');
  });

  it('shows a success with extra successes and the 10s', () => {
    const { embed, buttons } = render(base, [10, 8, 2]);
    expect(embed.description).toContain('= **3** dadi');
    expect(embed.fields?.find((f) => f.name === 'Esito')?.value).toContain('2 successi (1 extra)');
    expect(embed.fields?.find((f) => f.name === 'Quickening')?.value).toContain('+1 Quickening');
    expect(buttons).toEqual([]);
  });

  it("offers Devil's Bargain and Try again on a failure", () => {
    const { buttons } = render(base, [5], 0, 'en');
    expect(buttons.map((b) => 'label' in b && b.label)).toEqual(["Devil's Bargain", 'Try again']);
  });

  it('lists Choose Your Pain on a painful failure, with a button per option', () => {
    const { embed, buttons } = render(base, [1, 3], 0, 'en');
    expect(embed.fields?.map((f) => f.name)).toContain('Choose Your Pain');
    expect(buttons.map((b) => 'label' in b && b.label)).toEqual([
      'Lose 3 Vitae/Willpower',
      'Mark Beast',
      'Give 1 Drama',
      'Try again',
    ]);
  });

  it('offers Lose all Quickening only to a player who has some', () => {
    const { buttons } = render(base, [1, 3], 0, 'en');
    expect(buttons.map((b) => 'label' in b && b.label)).not.toContain('Lose all Quickening');
    const withQuickening = render(base, [1, 3], 2, 'en');
    expect(withQuickening.buttons.map((b) => 'label' in b && b.label)).toContain(
      'Lose all Quickening',
    );
  });

  it('asks before rolling when Overqualified', () => {
    const { buttons } = render({ ...base, dice: 6 }, [9], 0, 'en');
    expect(buttons.map((b) => 'label' in b && b.label)).toEqual(['Take basic success', 'Roll']);
  });

  it('offers Accept failure at No Dice Left', () => {
    const { buttons } = render({ ...base, dice: 0 }, [9], 0, 'en');
    expect(buttons.map((b) => 'label' in b && b.label)).toEqual(['Accept failure']);
  });

  it('writes the roll in English, keeping the game terms', () => {
    const { embed } = render(base, [10, 8, 2], 0, 'en');
    expect(embed.description).toBe('3 dice + 1 bonus − Difficulty 1 = **3** dice');
    expect(embed.fields?.find((f) => f.name === 'Dice')?.value).toBe('**10** **8** 2');
    expect(embed.fields?.find((f) => f.name === 'Outcome')?.value).toBe(
      '**Success** · 2 successes (1 extra)',
    );
  });

  it('translates the buttons but not the game terms in Italian', () => {
    const painful = render(base, [1, 3], 0, 'it');
    expect(painful.buttons.map((b) => 'label' in b && b.label)).toEqual([
      'Perdi 3 Vitae/Willpower',
      'Segna Beast',
      'Dai 1 Drama',
      'Try again',
    ]);
    expect(painful.embed.fields?.find((f) => f.name === 'Choose Your Pain')?.value).toContain(
      '- Perdi 3 Vitae o Willpower (a tua scelta)',
    );
    const failure = render(base, [5], 0, 'it');
    expect(failure.buttons.map((b) => 'label' in b && b.label)).toEqual([
      "Devil's Bargain",
      'Try again',
    ]);
  });

  it('uses the singular for one die and one success', () => {
    const { embed } = render({ ...base, dice: 1, modifier: 0, difficulty: 0 }, [9], 0, 'it');
    expect(embed.description).toBe('1 dado = **1** dado');
    expect(embed.fields?.find((f) => f.name === 'Esito')?.value).toBe('**Success** · 1 successo');
  });
});

describe('formatDice', () => {
  it('sorts high to low and bolds successes', () => {
    expect(formatDice([3, 10, 8, 1])).toBe('**10** **8** 3 1');
  });
});

describe('NPC rolls', () => {
  function renderNpc(request: RollRequest, dice: number[]) {
    const store = new Store(':memory:');
    let i = 0;
    const response = performNpcRoll(store, request, { roller: () => dice[i++ % dice.length]! });
    const quickening = store.getQuickening(request.channelId, request.userId);
    store.close();
    const message = rollMessage('en', response, 'Level 3 NPC');
    return {
      quickening,
      embed: message.embeds[0]!.toJSON(),
      buttons: message.components.flatMap((row) => row.toJSON().components),
    };
  }

  it('turns a would-be Painful Failure into a plain Failure with no player buttons', () => {
    const { embed, buttons } = renderNpc({ ...base, dice: 6, difficulty: 0 }, [1, 3, 5]);
    expect(embed.fields?.find((f) => f.name === 'Outcome')?.value).toContain('Failure');
    expect(embed.fields?.find((f) => f.name === 'Outcome')?.value).not.toContain('Painful');
    expect(embed.fields?.find((f) => f.name === 'Choose Your Pain')).toBeUndefined();
    expect(buttons).toEqual([]);
  });

  it('rolls straight away even with 4+ dice, and gives nobody Quickening for its 10s', () => {
    const { embed, quickening, buttons } = renderNpc({ ...base, dice: 8, difficulty: 0 }, [10]);
    expect(embed.fields?.find((f) => f.name === 'Outcome')?.value).toContain('Success');
    expect(embed.fields?.find((f) => f.name === 'Quickening')).toBeUndefined();
    expect(quickening).toBe(0);
    expect(buttons).toEqual([]);
  });

  it('just fails when Difficulty leaves no dice', () => {
    const { embed, buttons } = renderNpc({ ...base, dice: 2, modifier: 0, difficulty: 3 }, [9]);
    expect(embed.fields?.find((f) => f.name === 'Outcome')?.value).toContain('Failure');
    expect(buttons).toEqual([]);
  });
});
