import type {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { DieRoller } from '../dice/roller.js';
import type { Store } from '../state/store.js';

export interface Context {
  store: Store;
  roller?: DieRoller;
  /** Discord role that can change the table state (see auth/storyteller.ts). */
  storytellerRoleId?: string;
}

export interface Command {
  data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  execute(interaction: ChatInputCommandInteraction, ctx: Context): Promise<void>;
}
