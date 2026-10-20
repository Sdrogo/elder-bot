import 'dotenv/config';

export interface Config {
  token: string;
  clientId: string;
  guildId?: string;
  databasePath: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variabile d'ambiente mancante: ${name}. Vedi .env.example.`);
  return value;
}

export function loadConfig(): Config {
  return {
    token: required('DISCORD_TOKEN'),
    clientId: required('DISCORD_CLIENT_ID'),
    guildId: process.env.DISCORD_GUILD_ID?.trim() || undefined,
    databasePath: process.env.DATABASE_PATH?.trim() || './data/elder-bot.db',
  };
}
