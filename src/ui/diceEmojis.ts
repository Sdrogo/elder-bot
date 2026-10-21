import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Client } from 'discord.js';

// One application emoji per die value, built by scripts/build-dice.sh from the artwork in
// assets/dice/art: the value is drawn on the face so it always sits with its die.
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const EMOJI_PREFIX = 'vtm6e_';
const ASSETS = new URL('../../assets/dice/', import.meta.url);

let emojis: Partial<Record<number, string>> = {};

/** The `<:name:id>` markup for a die value, or undefined until the emojis are synced. */
export function diceEmoji(value: number): string | undefined {
  return emojis[value];
}

export function setDiceEmojis(map: Partial<Record<number, string>>): void {
  emojis = map;
}

/**
 * Uploads each die face as an application emoji, then remembers their markup.
 * The name carries a hash of the artwork, so changed art replaces the old emoji.
 */
export async function syncDiceEmojis(client: Client<true>): Promise<void> {
  const existing = await client.application.emojis.fetch();
  const map: Partial<Record<number, string>> = {};
  const wanted = new Set<string>();
  for (const value of VALUES) {
    const attachment = await readFile(fileURLToPath(new URL(`${value}.png`, ASSETS)));
    const name = emojiName(value, attachment);
    wanted.add(name);
    const emoji =
      existing.find((e) => e.name === name) ??
      (await client.application.emojis.create({ attachment, name }));
    map[value] = emoji.toString();
  }
  const stale = existing.filter(
    (e) => e.name !== null && e.name.startsWith(EMOJI_PREFIX) && !wanted.has(e.name),
  );
  for (const emoji of stale.values()) {
    await emoji.delete();
  }
  setDiceEmojis(map);
}

export function emojiName(value: number, art: Buffer): string {
  const hash = createHash('sha256').update(art).digest('hex').slice(0, 8);
  return `${EMOJI_PREFIX}d${value}_${hash}`;
}
