// Contested tests, Player Packet p. 81.

export interface ContestSide {
  successes: number;
  /** Attribute used for the test; only player characters have one. */
  attribute?: number;
  /** NPCs roll 2 x NPC Level and have no Attribute. */
  npc?: boolean;
}

export type TieBreak =
  /** Higher Attribute wins: only possible between two characters with known Attributes. */
  | 'attribute'
  /** Against an NPC: the initiator wins, or the Storyteller decides. */
  | 'initiator-or-storyteller'
  /** Between characters with equal or unknown Attributes: the Storyteller picks attribute or initiator. */
  | 'storyteller';

export interface ContestResult {
  winner: 'a' | 'b' | 'tie';
  tieBreak?: TieBreak;
}

export function resolveContest(a: ContestSide, b: ContestSide): ContestResult {
  if (a.successes > b.successes) return { winner: 'a' };
  if (b.successes > a.successes) return { winner: 'b' };
  if (a.npc || b.npc) return { winner: 'tie', tieBreak: 'initiator-or-storyteller' };
  if (a.attribute !== undefined && b.attribute !== undefined && a.attribute !== b.attribute) {
    return { winner: a.attribute > b.attribute ? 'a' : 'b', tieBreak: 'attribute' };
  }
  return { winner: 'tie', tieBreak: 'storyteller' };
}

/** A player-controlled or opposing NPC rolls twice its Level (pp. 77, 81). */
export function npcPool(level: number): number {
  return Math.max(0, level * 2);
}
