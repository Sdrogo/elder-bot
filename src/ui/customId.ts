import type { RollRequest } from '../game/roll.js';

// Button and modal ids carry the roll so the bot stays stateless between clicks.
// Format: roll:<action>:<userId>:<dice>:<difficulty>:<modifier>:<hunger>:<flags>

export type RollAction = 'bargain' | 'bargain-yes' | 'bargain-no' | 'retry' | 'retry-modal';

export interface RollRef {
  action: RollAction;
  request: Omit<RollRequest, 'channelId'>;
}

export function encodeRollId(action: RollAction, r: Omit<RollRequest, 'channelId'>): string {
  const flags = `${r.takeHalf ? 'h' : ''}${r.retry ? 'r' : ''}`;
  return ['roll', action, r.userId, r.dice, r.difficulty, r.modifier, r.hunger, flags].join(':');
}

export function decodeRollId(customId: string): RollRef | undefined {
  const parts = customId.split(':');
  if (parts[0] !== 'roll' || parts.length !== 8) return undefined;
  const [, action, userId, dice, difficulty, modifier, hunger, flags = ''] = parts;
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
    },
  };
}
