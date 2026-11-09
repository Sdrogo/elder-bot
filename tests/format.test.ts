import { describe, expect, it } from 'vitest';
import { performRoll, type RollRequest } from '../src/game/roll.js';
import { setDiceEmojis } from '../src/ui/diceEmojis.js';
import type { Locale } from '../src/i18n/index.js';
import { formatDice, rollMessage } from '../src/ui/format.js';

const base: RollRequest = {
  channelId: 'c1',
  userId: '123456789012345678',
  dice: 3,
  difficulty: 2,
  modifier: 1,
  hunger: 0,
  takeHalf: false,
  retry: false,
};

function render(request: RollRequest, dice: number[], locale: Locale = 'it', npc = false) {
  let i = 0;
  const response = performRoll(request, { roller: () => dice[i++ % dice.length]!, npc });
  const message = rollMessage(locale, response, 'Andrea: salto sul tetto');
  const embed = message.embeds[0]!.toJSON();
  return {
    content: message.content,
    embed,
    field: (name: string) => embed.fields?.find((f) => f.name === name)?.value,
    buttons: message.components.flatMap((row) => row.toJSON().components),
  };
}

const labels = (buttons: ReturnType<typeof render>['buttons']) =>
  buttons.map((b) => 'label' in b && b.label);

describe('rollMessage', () => {
  it('puts the dice faces in the message text, Hunger dice on their own line', () => {
    setDiceEmojis({ 10: '<:d10:1>', 8: '<:d8:2>', 2: '<:d2:3>', 1: '<:d1:4>' });
    try {
      const { content, field } = render(
        { ...base, dice: 4, modifier: 0, hunger: 1 },
        [10, 2, 8, 1],
      );
      expect(content).toBe('<:d10:1> <:d8:2> <:d2:3>\n<:d1:4>');
      expect(field('Dadi')).toBeUndefined();
    } finally {
      setDiceEmojis({});
    }
  });

  it('lists the dice as numbers when the faces are not available', () => {
    const { content, field } = render({ ...base, hunger: 1 }, [10, 6, 2, 1]);
    expect(content).toBeUndefined();
    expect(field('Dadi')).toBe('**10** **6** 2');
    expect(field('Hunger')).toBe('1');
  });

  it('writes the pool and a critical win in English, with the margin', () => {
    const { embed, field } = render(base, [10, 8, 2, 3], 'en');
    expect(embed.description).toBe('3 dice + 1 bonus = **4** dice · Difficulty 2');
    expect(field('Outcome')).toBe('**Critical Win** · 3 successes of 2 (margin +1)');
  });

  it("offers Beast's Bargain and Try again on a failure", () => {
    const { buttons, field } = render(base, [6, 2, 2, 2], 'en');
    expect(field('Outcome')).toBe('**Failure** · 1 success of 2 (margin −1)');
    expect(labels(buttons)).toEqual(['Willpower', "Beast's Bargain", 'Try again']);
  });

  it('asks for a complication on a painful failure, with Try again only', () => {
    const { buttons, field } = render(base, [2], 'en');
    expect(field('Outcome')).toContain('**Painful Failure**');
    expect(field('Complication')).toBeDefined();
    expect(labels(buttons)).toEqual(['Willpower', 'Try again']);
  });

  it('marks a bestial failure', () => {
    const { field, buttons } = render({ ...base, hunger: 1 }, [6, 2, 3, 1], 'en');
    expect(field('Outcome')).toContain('**Bestial Failure**');
    expect(field('Bestial Failure')).toBeDefined();
    expect(labels(buttons)).toEqual(['Willpower', 'Try again']);
  });

  it('points out an automatic win when the pool is twice the Difficulty', () => {
    expect(
      render({ ...base, dice: 4, modifier: 0 }, [9], 'en').field('Automatic Win'),
    ).toBeDefined();
    expect(render({ ...base, difficulty: 3 }, [9], 'en').field('Automatic Win')).toBeUndefined();
  });

  it('shows Taking Half without dice', () => {
    const { field, content } = render({ ...base, takeHalf: true }, [9], 'en');
    expect(content).toBeUndefined();
    expect(field('Outcome')).toContain('**Success** · 2 successes of 2');
  });

  it('uses the singular for one die and one success, in Italian', () => {
    const { embed, field } = render({ ...base, dice: 1, modifier: 0, difficulty: 0 }, [9]);
    expect(embed.description).toBe('1 dado = **1** dado');
    expect(field('Esito')).toBe('**1 successo**');
  });

  it('NPC rolls carry no player buttons or notes', () => {
    const { field, buttons } = render(base, [2], 'en', true);
    expect(field('Outcome')).toContain('**Failure**');
    expect(field('Complication')).toBeUndefined();
    expect(buttons).toEqual([]);
  });
});

describe('formatDice', () => {
  it('sorts high to low and bolds successes', () => {
    expect(formatDice([3, 10, 6, 1])).toBe('**10** **6** 3 1');
  });
});
