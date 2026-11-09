// Contested tests, Player Packet p. 95.

export interface ContestSide {
  successes: number;
  /** Attribute used for the test. For a minor or standard NPC: half its dice pool. */
  attribute?: number;
}

export type TieBreak =
  /** Higher Attribute wins. */
  | 'attribute'
  /** Equal or unknown Attributes: whoever initiated the contest wins. */
  | 'initiator';

export interface ContestResult {
  winner: 'a' | 'b' | 'tie';
  tieBreak?: TieBreak;
}

/** Most successes wins; a tie goes to the higher Attribute, then to the initiator. */
export function resolveContest(a: ContestSide, b: ContestSide): ContestResult {
  if (a.successes > b.successes) return { winner: 'a' };
  if (b.successes > a.successes) return { winner: 'b' };
  if (a.attribute !== undefined && b.attribute !== undefined && a.attribute !== b.attribute) {
    return { winner: a.attribute > b.attribute ? 'a' : 'b', tieBreak: 'attribute' };
  }
  return { winner: 'tie', tieBreak: 'initiator' };
}
