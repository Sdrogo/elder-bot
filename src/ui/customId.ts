import type { RollRequest } from '../game/roll.js';

// Button, menu and modal ids carry the roll so the bot stays stateless between clicks.
// Format: roll:<action>:<userId>:<dice>:<difficulty>:<modifier>:<hunger>:<flags>[:<dice>:<hunger dice>]
// The optional faces (one character each, 0 for a 10) let Willpower reroll the dice on the message.

export type RollAction =
  | 'bargain'
  | 'bargain-yes'
  | 'bargain-no'
  | 'retry'
  | 'retry-modal'
  | 'wp'
  | 'wp-pick'
  | 'wp-cancel';

export interface RollRef {
  action: RollAction;
  request: Omit<RollRequest, 'channelId'>;
  /** Normal and Hunger dice faces, for the Willpower steps. */
  faces?: { normal: number[]; hunger: number[] };
}

const encodeFaces = (dice: number[]) => dice.map((d) => String(d % 10)).join('');
const decodeFaces = (text: string) => [...text].map((c) => (c === '0' ? 10 : Number(c)));

export function encodeRollId(
  action: RollAction,
  r: Omit<RollRequest, 'channelId'>,
  faces?: { normal: number[]; hunger: number[] },
): string {
  const flags = `${r.takeHalf ? 'h' : ''}${r.retry ? 'r' : ''}${r.willpower ? 'w' : ''}`;
  const parts = ['roll', action, r.userId, r.dice, r.difficulty, r.modifier, r.hunger, flags];
  if (faces) parts.push(encodeFaces(faces.normal), encodeFaces(faces.hunger));
  return parts.join(':');
}

export function decodeRollId(customId: string): RollRef | undefined {
  const parts = customId.split(':');
  if (parts[0] !== 'roll' || (parts.length !== 8 && parts.length !== 10)) return undefined;
  const [, action, userId, dice, difficulty, modifier, hunger, flags = '', normal, hungry] = parts;
  return {
    action: action as RollAction,
    request: {
      userId: userId!,
      dice: Number(dice),
      difficulty: Number(difficulty),
      modifier: Number(modifier),
      hunger: Number(hunger),
      takeHalf: flags.includes('h'),
      retry: flags.includes('r'),
      willpower: flags.includes('w'),
    },
    ...(normal !== undefined && hungry !== undefined
      ? { faces: { normal: decodeFaces(normal), hunger: decodeFaces(hungry) } }
      : {}),
  };
}
