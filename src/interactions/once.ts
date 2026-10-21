/**
 * Remembers which one-shot actions were already applied, so a double click on a button
 * (or a modal submitted twice) does not grant Quickening or Drama twice.
 * Kept in memory: after a restart old buttons work once more, which is harmless.
 */
export class OnceGuard {
  private seen = new Set<string>();

  constructor(private readonly limit = 5000) {}

  /** True the first time a key is claimed, false afterwards. */
  claim(key: string): boolean {
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    if (this.seen.size > this.limit) {
      // Sets iterate in insertion order: drop the oldest key.
      this.seen.delete(this.seen.values().next().value!);
    }
    return true;
  }

  /** Gives a key back, for an action that was refused after claiming it. */
  release(key: string): void {
    this.seen.delete(key);
  }
}
