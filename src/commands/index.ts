import { contest } from './contest.js';
import { frenzy } from './frenzy.js';
import { impair } from './impair.js';
import { invite } from './invite.js';
import { masquerade } from './masquerade.js';
import { panel } from './panel.js';
import { prolonged } from './prolonged.js';
import { roll } from './roll.js';
import { sheet } from './sheet.js';
import type { Command } from './types.js';

// What the table needs during play. Characters, Chronicles and sessions live on the web panel.
export const commands: Command[] = [
  roll,
  contest,
  prolonged,
  frenzy,
  masquerade,
  impair,
  sheet,
  invite,
  panel,
];
