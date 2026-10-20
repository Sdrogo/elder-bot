// [Quickening] limits from the Player Packet, p. 82.

export const MAX_QUICKENING = 5;

export interface QuickeningGain {
  value: number;
  gained: number;
  /** Points past the maximum: mark this many boxes on the Beast or Nature tracker. */
  overflow: number;
}

export function gainQuickening(current: number, amount: number): QuickeningGain {
  const value = Math.min(MAX_QUICKENING, current + amount);
  return { value, gained: value - current, overflow: current + amount - value };
}

/** Spending 3 buys a basic success on a Skill with at least 1 dot; 5 on a Skill with none. */
export function basicSuccessCost(hasSkillDots: boolean): number {
  return hasSkillDots ? 3 : 5;
}
