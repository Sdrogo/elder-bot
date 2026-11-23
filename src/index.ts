import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  type Interaction,
} from 'discord.js';
import { commands } from './commands/index.js';
import { autocompleteElder, runElder } from './commands/elder.js';
import { handleMasqueradeButton, isMasqueradeId } from './commands/masquerade.js';
import { handleProlongedButton, isProlongedId } from './commands/prolonged.js';
import { handleSurgeButton, isSurgeId } from './interactions/surgeButtons.js';
import type { Context } from './commands/types.js';
import { loadConfig } from './config.js';
import { localeFor, resolveLocale, t } from './i18n/index.js';
import {
  handleCampaignButton,
  handleCampaignSelect,
  isCampaignId,
} from './interactions/campaignButtons.js';
import { handleRollButton, handleRollModal, handleRollSelect } from './interactions/rollButtons.js';
import { Store } from './state/store.js';
import { syncDiceEmojis } from './ui/diceEmojis.js';
import { startPanel } from './web/server.js';

const config = loadConfig();
const ctx: Context = {
  store: new Store(config.databasePath),
  ...(config.panel ? { panelUrl: config.panel.url } : {}),
};
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
    } else if (interaction.isAutocomplete()) {
      await autocompleteElder(byName, interaction, ctx);
    } else if (interaction.isButton()) {
      const id = interaction.customId;
      if (isCampaignId(id)) await handleCampaignButton(interaction, ctx);
      else if (isMasqueradeId(id)) await handleMasqueradeButton(interaction, ctx);
      else if (isProlongedId(id)) await handleProlongedButton(interaction, ctx);
      else if (isSurgeId(id)) await handleSurgeButton(interaction, ctx);
      else await handleRollButton(interaction, ctx);
    } else if (interaction.isStringSelectMenu()) {
      if (isCampaignId(interaction.customId)) await handleCampaignSelect(interaction, ctx);
      else await handleRollSelect(interaction, ctx);
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

// The web panel starts only when PANEL_URL and DISCORD_CLIENT_SECRET are set.
const panel = config.panel
  ? startPanel(
      {
        store: ctx.store,
        publicUrl: config.panel.url,
        clientId: config.clientId,
        clientSecret: config.panel.clientSecret,
        // One REST call per server the bot is on; no privileged intent needed.
        guildsOf: async (userId) => {
          const guilds = [];
          for (const guild of client.guilds.cache.values()) {
            const member = await guild.members
              .fetch({ user: userId, cache: false })
              .catch(() => undefined);
            if (member) guilds.push({ id: guild.id, name: guild.name });
          }
          return guilds;
        },
        // Text channels where the user and the bot can both read and write.
        channelsOf: async (guildId, userId) => {
          const guild = client.guilds.cache.get(guildId);
          if (!guild) return [];
          const [channels, member, bot] = await Promise.all([
            guild.channels.fetch(),
            guild.members.fetch({ user: userId, cache: false }).catch(() => undefined),
            guild.members.fetchMe(),
          ]);
          if (!member) return [];
          return [...channels.values()]
            .filter(
              (ch) =>
                ch !== null &&
                (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement) &&
                ch.permissionsFor(member).has(PermissionFlagsBits.ViewChannel) &&
                ch
                  .permissionsFor(bot)
                  .has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]),
            )
            .sort((a, b) => a!.rawPosition - b!.rawPosition)
            .map((ch) => ({ id: ch!.id, name: `#${ch!.name}` }));
        },
        memberName: async (guildId, userId) => {
          const guild = client.guilds.cache.get(guildId);
          const member = await guild?.members
            .fetch({ user: userId, cache: false })
            .catch(() => undefined);
          return member?.displayName;
        },
      },
      config.panel.port,
    )
  : undefined;

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    panel?.close();
    void client.destroy().finally(() => {
      ctx.store.close();
      process.exit(0);
    });
  });
}

await client.login(config.token);
