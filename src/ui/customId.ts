import type { RollRequest } from '../game/roll.js';

// Button and modal ids carry the roll so the bot stays stateless between clicks.
// Format: roll:<action>:<userId>:<dice>:<difficulty>:<modifier>:<quickening>:<flags>

export type RollAction =
  | 'oq-take'
  | 'oq-roll'
  | 'zero-accept'
  | 'bargain'
  | 'bargain-yes'
  | 'bargain-no'
  | 'retry'
  | 'retry-modal'
  | 'pain-vitae'
  | 'pain-quickening'
  | 'pain-beast'
  | 'pain-drama';

export interface RollRef {
  action: RollAction;
  request: Omit<RollRequest, 'channelId'>;
}

export function encodeRollId(action: RollAction, r: Omit<RollRequest, 'channelId'>): string {
  const flags = `${r.combat ? 'c' : ''}${r.retry ? 'r' : ''}${r.applyTraits ? '' : 'n'}`;
  return ['roll', action, r.userId, r.dice, r.difficulty, r.modifier, r.quickening, flags].join(
    ':',
  );
}

export function decodeRollId(customId: string): RollRef | undefined {
  const parts = customId.split(':');
  if (parts[0] !== 'roll' || parts.length !== 8) return undefined;
  const [, action, userId, dice, difficulty, modifier, quickening, flags = ''] = parts;
  return {
    action: action as RollAction,
    request: {
      userId: userId!,
      dice: Number(dice),
      difficulty: Number(difficulty),
      modifier: Number(modifier),
      quickening: Number(quickening),
      combat: flags.includes('c'),
      retry: flags.includes('r'),
      applyTraits: !flags.includes('n'),
    },
  };
}
