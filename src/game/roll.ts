import { gainQuickening, type QuickeningGain } from '../dice/quickening.js';
import { rollDice, type DieRoller } from '../dice/roller.js';
import {
  buildPool,
  canTakeOverqualified,
  evaluate,
  type Pool,
  type TestResult,
} from '../dice/test.js';
import type { Store } from '../state/store.js';

export interface RollRequest {
  channelId: string;
  userId: string;
  dice: number;
  difficulty: number;
  /** Bonuses and penalties chosen by the player; scene traits are added on top. */
  modifier: number;
  /** Quickening dice the player spends from their own pool. */
  quickening: number;
  /** Attack or defense test: no [Overqualified]. */
  combat: boolean;
  /** Second attempt after a failure (Trying Again, p. 79). */
  retry: boolean;
  /** Apply the channel's Drama scene traits. */
  applyTraits: boolean;
}

export type RollResponse =
  /** The player tried to spend more Quickening than they have. */
  | { kind: 'error'; available: number; requested: number }
  | { kind: 'overqualified'; request: RollRequest; pool: Pool; traitModifier: number }
  | { kind: 'no-dice'; request: RollRequest; pool: Pool; traitModifier: number }
  | {
      kind: 'rolled';
      request: RollRequest;
      pool: Pool;
      traitModifier: number;
      result: TestResult;
      /** Quickening after spending and after the 10s. */
      quickening: QuickeningGain & { total: number };
      bargainAvailable: boolean;
    };

export interface RollOptions {
  roller?: DieRoller;
  /** The player already chose to roll instead of taking a basic success. */
  skipOverqualified?: boolean;
}

export function performRoll(
  store: Store,
  request: RollRequest,
  options: RollOptions = {},
): RollResponse {
  const { channelId, userId } = request;
  const available = store.getQuickening(channelId, userId);
  if (request.quickening > available) {
    return { kind: 'error', available, requested: request.quickening };
  }

  const traitModifier = request.applyTraits ? store.traitModifier(channelId) : 0;
  const pool = buildPool({
    dice: request.dice,
    difficulty: request.difficulty,
    modifier: request.modifier + traitModifier,
    quickening: request.quickening,
  });

  if (!options.skipOverqualified && !request.retry && canTakeOverqualified(pool, request.combat)) {
    return { kind: 'overqualified', request, pool, traitModifier };
  }
  if (pool.total === 0) return { kind: 'no-dice', request, pool, traitModifier };

  const result = evaluate(rollDice(pool.total, options.roller), {
    failureIsPainful: request.retry,
  });
  const afterSpend = available - request.quickening;
  const gain = gainQuickening(afterSpend, result.tens);
  store.setQuickening(channelId, userId, gain.value);

  return {
    kind: 'rolled',
    request,
    pool,
    traitModifier,
    result,
    quickening: { ...gain, total: gain.value },
    bargainAvailable:
      result.outcome === 'failure' && !request.retry && !store.hasUsedBargain(channelId, userId),
  };
}

/** Adds Quickening to a player, capped at 5; returns how much spilled onto the Beast or Nature tracker. */
export function grantQuickening(
  store: Store,
  channelId: string,
  userId: string,
  amount: number,
): QuickeningGain {
  const gain = gainQuickening(store.getQuickening(channelId, userId), amount);
  store.setQuickening(channelId, userId, gain.value);
  return gain;
}
