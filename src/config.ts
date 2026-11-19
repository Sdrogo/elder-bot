import 'dotenv/config';

export interface Config {
  token: string;
  clientId: string;
  guildId?: string;
  databasePath: string;
  /** The web panel, when PANEL_URL and DISCORD_CLIENT_SECRET are both set. */
  panel?: PanelConfig;
}

export interface PanelConfig {
  /** Public address of the panel, as players type it (https://elder.example.com). No trailing slash. */
  url: string;
  clientSecret: string;
  /** Port inside the container; only cloudflared reaches it. */
  port: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variabile d'ambiente mancante: ${name}. Vedi .env.example.`);
  return value;
}

function panelConfig(clientId: string): PanelConfig | undefined {
  const url = process.env.PANEL_URL?.trim().replace(/\/+$/, '');
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim();
  if (!url || !clientSecret || !clientId) return undefined;
  if (!/^https?:\/\/[^/\s]+$/.test(url)) {
    throw new Error("PANEL_URL deve essere solo l'indirizzo, per esempio https://elder.esempio.it");
  }
  const port = Number(process.env.PANEL_PORT ?? 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PANEL_PORT non valida');
  return { url, clientSecret, port };
}

export function loadConfig(): Config {
  const clientId = required('DISCORD_CLIENT_ID');
  return {
    token: required('DISCORD_TOKEN'),
    clientId,
    guildId: process.env.DISCORD_GUILD_ID?.trim() || undefined,
    databasePath: process.env.DATABASE_PATH?.trim() || './data/elder-bot.db',
    panel: panelConfig(clientId),
  };
}
