import { Client, Events, GatewayIntentBits, MessageFlags, type Interaction } from 'discord.js';
import { commands } from './commands/index.js';
import { runElder } from './commands/elder.js';
import type { Context } from './commands/types.js';
import { loadConfig } from './config.js';
import { localeFor, resolveLocale, t } from './i18n/index.js';
import { handleRollButton, handleRollModal } from './interactions/rollButtons.js';
import { Store } from './state/store.js';
import { syncDiceEmojis } from './ui/diceEmojis.js';

const config = loadConfig();
const ctx: Context = { store: new Store(config.databasePath) };
const byName = new Map(commands.map((c) => [c.data.name, c]));

// Slash commands and buttons need no privileged intents.
// No mentions: text typed by players (task names, reasons) must never ping @everyone or a role.
const client = new Client({ intents: [GatewayIntentBits.Guilds], allowedMentions: { parse: [] } });

// Log gateway and stray async errors instead of letting them crash the process.
client.on(Events.Error, (error) => console.error('Errore del client Discord:', error));
process.on('unhandledRejection', (error) => console.error('Promise non gestita:', error));

client.once(Events.ClientReady, (c) => {
  console.log(`Connesso come ${c.user.tag}`);
  // Without the emojis the dice are shown as numbers, so a failure here is not fatal.
  syncDiceEmojis(c).catch((error) => console.error('Emoji dei dadi non caricate:', error));
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await runElder(byName, interaction, ctx);
    } else if (interaction.isButton()) {
      await handleRollButton(interaction, ctx);
    } else if (interaction.isModalSubmit()) {
      await handleRollModal(interaction, ctx);
    }
  } catch (error) {
    console.error(error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      let locale = resolveLocale(interaction.locale);
      try {
        locale = localeFor(interaction, ctx.store);
      } catch {
        // The store may be what failed: answer in the user's own language.
      }
      const content = t(locale, 'error.generic');
      await interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => undefined);
    }
  }
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void client.destroy().finally(() => {
      ctx.store.close();
      process.exit(0);
    });
  });
}

await client.login(config.token);
