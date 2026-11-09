import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Client } from 'discord.js';

// One application emoji per die value, for normal and Hunger dice, built by
// scripts/build-dice.sh from the artwork in assets/dice/art: the value is drawn on the face
// so it always sits with its die. Hunger faces are files h1.png … h10.png.
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FACES = [...VALUES.map(String), ...VALUES.map((v) => `h${v}`)];
const EMOJI_PREFIX = 'vtm6e_';
const ASSETS = new URL('../../assets/dice/', import.meta.url);

/** Emoji markup by face: '1' … '10' for normal dice, 'h1' … 'h10' for Hunger dice. */
let emojis: Partial<Record<string, string>> = {};

/** The `<:name:id>` markup for a die, or undefined until the emojis are synced. */
export function diceEmoji(value: number, { hunger = false } = {}): string | undefined {
  return emojis[hunger ? `h${value}` : String(value)];
}

export function setDiceEmojis(map: Partial<Record<string | number, string>>): void {
  emojis = Object.fromEntries(Object.entries(map).map(([k, v]) => [String(k), v]));
}

/**
 * Uploads each die face as an application emoji, then remembers their markup.
 * The name carries a hash of the artwork, so changed art replaces the old emoji.
 */
export async function syncDiceEmojis(client: Client<true>): Promise<void> {
  const existing = await client.application.emojis.fetch();
  const map: Partial<Record<string, string>> = {};
  const wanted = new Set<string>();
  for (const face of FACES) {
    const attachment = await readFile(fileURLToPath(new URL(`${face}.png`, ASSETS)));
    const name = emojiName(face, attachment);
    wanted.add(name);
    const emoji =
      existing.find((e) => e.name === name) ??
      (await client.application.emojis.create({ attachment, name }));
    map[face] = emoji.toString();
  }
  const stale = existing.filter(
    (e) => e.name !== null && e.name.startsWith(EMOJI_PREFIX) && !wanted.has(e.name),
  );
  for (const emoji of stale.values()) {
    await emoji.delete();
  }
  setDiceEmojis(map);
}

/** vtm6e_d7_<hash> for a normal 7, vtm6e_h7_<hash> for a Hunger 7. */
export function emojiName(face: number | string, art: Buffer): string {
  const hash = createHash('sha256').update(art).digest('hex').slice(0, 8);
  const id = String(face).startsWith('h') ? String(face) : `d${face}`;
  return `${EMOJI_PREFIX}${id}_${hash}`;
}
