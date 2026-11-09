// The Masquerade Tracker and the optional threat test, Storyteller Packet pp. 32-37.

/** What the marked boxes mean for the city (Masquerade Tracker Effects). */
export function masqueradeLevel(rank: number): string {
  if (rank <= 0) return 'Superstition';
  if (rank <= 2) return 'Disbelief';
  if (rank <= 4) return 'Skepticism';
  if (rank <= 6) return 'Concern';
  if (rank <= 8) return 'Certainty';
  return 'Open War';
}

/** How hard the world reacts tonight, by successes on the threat test (Threat Test Reactions). */
export function threatReaction(successes: number): string {
  const reactions = [
    'Calm Before the Storm',
    'Rumors and Omens',
    'Vigilance',
    'Minor Threat',
    'Medium Threat',
    'Greater Threat',
  ];
  return reactions[successes] ?? 'Overwhelming Threat';
}
