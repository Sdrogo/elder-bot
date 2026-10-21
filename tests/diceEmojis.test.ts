import { afterEach, describe, expect, it } from 'vitest';
import { dieFace, emojiName, setDiceEmojis } from '../src/ui/diceEmojis.js';
import { formatDice } from '../src/ui/format.js';

const EMOJIS = {
  one: '<:vtm6e_one:100000000000000001>',
  fail: '<:vtm6e_fail:100000000000000002>',
  success: '<:vtm6e_success:100000000000000003>',
  ten: '<:vtm6e_ten:100000000000000004>',
};

afterEach(() => setDiceEmojis({}));

describe('dice emojis', () => {
  it('groups results the way 6e reads them', () => {
    expect([1, 2, 7, 8, 9, 10].map(dieFace)).toEqual([
      'one',
      'fail',
      'fail',
      'success',
      'success',
      'ten',
    ]);
  });

  it('shows faces above the numbers once synced', () => {
    setDiceEmojis(EMOJIS);
    expect(formatDice([1, 10, 5])).toBe(
      `## ${EMOJIS.ten} ${EMOJIS.fail} ${EMOJIS.one}\n**10** 5 1`,
    );
  });

  it('falls back to numbers when a pool is too big for one field', () => {
    setDiceEmojis(EMOJIS);
    const dice = Array.from({ length: 40 }, () => 9);
    expect(formatDice(dice)).not.toContain('<:');
  });

  it('names each emoji after its artwork so new art gets uploaded', () => {
    const a = emojiName('ten', Buffer.from('old art'));
    const b = emojiName('ten', Buffer.from('new art'));
    expect(a).toMatch(/^vtm6e_ten_[0-9a-f]{8}$/);
    expect(a).not.toBe(b);
  });
});
