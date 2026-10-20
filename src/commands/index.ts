import { contest } from './contest.js';
import { drama } from './drama.js';
import { npc } from './npc.js';
import { prolonged } from './prolonged.js';
import { quickening } from './quickening.js';
import { roll } from './roll.js';
import { session } from './session.js';
import type { Command } from './types.js';

export const commands: Command[] = [roll, contest, prolonged, npc, quickening, drama, session];
