import { contest } from './contest.js';
import { frenzy } from './frenzy.js';
import { masquerade } from './masquerade.js';
import { npc } from './npc.js';
import { prolonged } from './prolonged.js';
import { roll } from './roll.js';
import { session } from './session.js';
import type { Command } from './types.js';

export const commands: Command[] = [roll, contest, prolonged, npc, frenzy, masquerade, session];
