import { Client, Events, GatewayIntentBits, MessageFlags, type Interaction } from 'discord.js';
import { commands } from './commands/index.js';
import type { Context } from './commands/types.js';
import { loadConfig } from './config.js';
import { handleRollButton, handleRollModal } from './interactions/rollButtons.js';
import { Store } from './state/store.js';
import { syncDiceEmojis } from './ui/diceEmojis.js';

const config = loadConfig();
const ctx: Context = { store: new Store(config.databasePath) };
const byName = new Map(commands.map((c) => [c.data.name, c]));

// Slash commands and buttons need no privileged intents.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (c) => {
  console.log(`Connesso come ${c.user.tag}`);
  // Without the emojis the dice are shown as numbers, so a failure here is not fatal.
  syncDiceEmojis(c).catch((error) => console.error('Emoji dei dadi non caricate:', error));
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await byName.get(interaction.commandName)?.execute(interaction, ctx);
    } else if (interaction.isButton()) {
      await handleRollButton(interaction, ctx);
    } else if (interaction.isModalSubmit()) {
      await handleRollModal(interaction, ctx);
    }
  } catch (error) {
    console.error(error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction
        .reply({ content: 'Qualcosa è andato storto.', flags: MessageFlags.Ephemeral })
        .catch(() => undefined);
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
