import { afterEach, describe, expect, it } from 'vitest';
import { emojiName, setDiceEmojis } from '../src/ui/diceEmojis.js';
import { diceLine, formatDice } from '../src/ui/format.js';

const EMOJIS = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [i + 1, `<:vtm6e_d${i + 1}:1000000000000000${i + 10}>`]),
);

afterEach(() => setDiceEmojis({}));

describe('dice emojis', () => {
  it('shows one face per die, highest first, on its own line so Discord draws them large', () => {
    setDiceEmojis(EMOJIS);
    expect(diceLine([1, 10, 5])).toBe(`${EMOJIS[10]} ${EMOJIS[5]} ${EMOJIS[1]}`);
    expect(formatDice([1, 10, 5])).toBe('**10** 5 1');
  });

  it('skips the faces until synced or when the pool is too big to show large', () => {
    expect(diceLine([10])).toBeUndefined();
    setDiceEmojis(EMOJIS);
    expect(diceLine(Array.from({ length: 28 }, () => 9))).toBeUndefined();
  });

  it('names each emoji after its value and artwork so new art gets uploaded', () => {
    const a = emojiName(10, Buffer.from('old art'));
    const b = emojiName(10, Buffer.from('new art'));
    expect(a).toMatch(/^vtm6e_d10_[0-9a-f]{8}$/);
    expect(a).not.toBe(b);
  });
});
