import {
  ApplicationCommandOptionType,
  type APIApplicationCommandOption,
  type APIApplicationCommandSubcommandGroupOption,
  type APIApplicationCommandSubcommandOption,
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import { localizations, t } from '../i18n/index.js';
import type { Command, Context } from './types.js';

export const ROOT = 'elder';

type Nested = APIApplicationCommandSubcommandOption | APIApplicationCommandSubcommandGroupOption;

// Every command lives under one /elder command so the bot adds a single entry to the server.
// A command with subcommands becomes a group (/elder quickening set), any other a subcommand
// (/elder roll). discord.js reads options the same way at either depth, so commands don't change.
export function elderCommand(commands: Command[]): RESTPostAPIChatInputApplicationCommandsJSONBody {
  return {
    name: ROOT,
    description: t('en', 'cmd.elder.description'),
    description_localizations: localizations('cmd.elder.description'),
    options: commands.map((c) => nest(c.data.toJSON())),
  };
}

function nest(command: RESTPostAPIChatInputApplicationCommandsJSONBody): Nested {
  const options: APIApplicationCommandOption[] = command.options ?? [];
  // The translated descriptions travel with the name and the English description.
  const { name, description, description_localizations } = command;
  if (options.some((o) => o.type === ApplicationCommandOptionType.Subcommand)) {
    return {
      type: ApplicationCommandOptionType.SubcommandGroup,
      name,
      description,
      description_localizations,
      options: options as APIApplicationCommandSubcommandOption[],
    };
  }
  return {
    type: ApplicationCommandOptionType.Subcommand,
    name,
    description,
    description_localizations,
    options: options as APIApplicationCommandSubcommandOption['options'],
  };
}

/** Runs the command the user picked under /elder. */
export async function runElder(
  commands: Map<string, Command>,
  interaction: ChatInputCommandInteraction,
  ctx: Context,
): Promise<void> {
  if (interaction.commandName !== ROOT) return;
  const name =
    interaction.options.getSubcommandGroup(false) ?? interaction.options.getSubcommand(false);
  if (name) await commands.get(name)?.execute(interaction, ctx);
}
