import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Client } from 'discord.js';

// Dice faces shown as application emojis (original artwork in assets/dice, V5-inspired).
// 6e only cares about four kinds of result: 1, 2-7, 8-9 and 10.
export type DieFace = 'one' | 'fail' | 'success' | 'ten';

const FACES: DieFace[] = ['one', 'fail', 'success', 'ten'];
const EMOJI_PREFIX = 'vtm6e_';
const ASSETS = new URL('../../assets/dice/', import.meta.url);

let emojis: Partial<Record<DieFace, string>> = {};

export function dieFace(value: number): DieFace {
  if (value === 1) return 'one';
  if (value === 10) return 'ten';
  return value >= 8 ? 'success' : 'fail';
}

/** The `<:name:id>` markup for each face, or undefined until the emojis are synced. */
export function diceEmoji(value: number): string | undefined {
  return emojis[dieFace(value)];
}

export function setDiceEmojis(map: Partial<Record<DieFace, string>>): void {
  emojis = map;
}

/** Uploads any missing face to the application's emojis, then remembers their markup. */
export async function syncDiceEmojis(client: Client<true>): Promise<void> {
  const existing = await client.application.emojis.fetch();
  const map: Partial<Record<DieFace, string>> = {};
  for (const face of FACES) {
    const name = `${EMOJI_PREFIX}${face}`;
    let emoji = existing.find((e) => e.name === name);
    if (!emoji) {
      const attachment = await readFile(fileURLToPath(new URL(`${face}.png`, ASSETS)));
      emoji = await client.application.emojis.create({ attachment, name });
    }
    map[face] = emoji.toString();
  }
  setDiceEmojis(map);
}
