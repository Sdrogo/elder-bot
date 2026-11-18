import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { DieRoller } from '../dice/roller.js';
import type { Store } from '../state/store.js';

export interface Context {
  store: Store;
  roller?: DieRoller;
}

export interface Command {
  data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  execute(interaction: ChatInputCommandInteraction, ctx: Context): Promise<void>;
  /** Suggestions for options marked with setAutocomplete(true). */
  autocomplete?(interaction: AutocompleteInteraction, ctx: Context): Promise<void>;
}
