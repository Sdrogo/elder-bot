// Prolonged tasks, Player Packet p. 112.

export const PROLONGED_TARGETS = [3, 5, 7, 10] as const;
export const PROLONGED_TESTS = [3, 5, 7] as const;

export interface ProlongedTask {
  name: string;
  /** Total successes needed. */
  target: number;
  /** Tests allowed to reach the target. */
  maxTests: number;
  testsDone: number;
  successes: number;
}

export type ProlongedStatus = 'ongoing' | 'completed' | 'failed';

export function startProlonged(name: string, target: number, maxTests: number): ProlongedTask {
  return { name, target, maxTests, testsDone: 0, successes: 0 };
}

/** A painful or bestial failure ends the task at once (p. 112). */
export function addProlongedTest(
  task: ProlongedTask,
  successes: number,
  { disaster = false }: { disaster?: boolean } = {},
): { task: ProlongedTask; status: ProlongedStatus } {
  const next = { ...task, testsDone: task.testsDone + 1, successes: task.successes + successes };
  return { task: next, status: disaster ? 'failed' : prolongedStatus(next) };
}

export function prolongedStatus(task: ProlongedTask): ProlongedStatus {
  if (task.successes >= task.target) return 'completed';
  if (task.testsDone >= task.maxTests) return 'failed';
  return 'ongoing';
}
