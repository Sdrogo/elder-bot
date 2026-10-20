import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';
import { loadConfig } from './config.js';

// Registers the slash commands. With DISCORD_GUILD_ID they appear at once on that server;
// without it they are registered globally, which can take up to an hour to show up.
const config = loadConfig();
const rest = new REST().setToken(config.token);
const body = commands.map((c) => c.data.toJSON());
const route = config.guildId
  ? Routes.applicationGuildCommands(config.clientId, config.guildId)
  : Routes.applicationCommands(config.clientId);

await rest.put(route, { body });
console.log(
  `Registrati ${body.length} comandi ${config.guildId ? `sul server ${config.guildId}` : 'globalmente'}.`,
);
