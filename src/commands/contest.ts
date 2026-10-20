import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { npcPool, resolveContest, type ContestResult } from '../dice/contest.js';
import { rollDice } from '../dice/roller.js';
import { buildPool, evaluate, type TestResult } from '../dice/test.js';
import { grantQuickening } from '../game/roll.js';
import { COLORS, formatDice, quickeningLine } from '../ui/format.js';
import type { Command } from './types.js';

const data = new SlashCommandBuilder()
  .setName('contest')
  .setDescription('Test contrapposto: vince chi ottiene più successi')
  .addIntegerOption((o) =>
    o
      .setName('dice')
      .setDescription('Il tuo pool')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(30),
  )
  .addIntegerOption((o) =>
    o
      .setName('opponent_dice')
      .setDescription("Pool dell'avversario (PG)")
      .setMinValue(0)
      .setMaxValue(30),
  )
  .addIntegerOption((o) =>
    o
      .setName('opponent_npc_level')
      .setDescription("Livello dell'avversario PNG: tira 2 × Livello")
      .setMinValue(1)
      .setMaxValue(10),
  )
  .addUserOption((o) =>
    o.setName('opponent').setDescription('Giocatore avversario: riceve il Quickening dei suoi 10'),
  )
  .addIntegerOption((o) =>
    o
      .setName('attribute')
      .setDescription('Il tuo Attributo, per i pareggi tra PG')
      .setMinValue(0)
      .setMaxValue(10),
  )
  .addIntegerOption((o) =>
    o
      .setName('opponent_attribute')
      .setDescription("Attributo dell'avversario PG, per i pareggi")
      .setMinValue(0)
      .setMaxValue(10),
  )
  .addIntegerOption((o) =>
    o
      .setName('difficulty')
      .setDescription('Solo se competete contro lo stesso ostacolo: tolta a entrambi')
      .setMinValue(0)
      .setMaxValue(15),
  )
  .addStringOption((o) => o.setName('reason').setDescription('Posta in gioco').setMaxLength(100));

export const contest: Command = {
  data,
  async execute(interaction, ctx) {
    const opponentDice = interaction.options.getInteger('opponent_dice');
    const npcLevel = interaction.options.getInteger('opponent_npc_level');
    if ((opponentDice === null) === (npcLevel === null)) {
      await interaction.reply({
        content:
          'Indica il pool avversario con `opponent_dice` (PG) oppure `opponent_npc_level` (PNG), non entrambi.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const difficulty = interaction.options.getInteger('difficulty') ?? 0;
    const isNpc = npcLevel !== null;
    const myPool = buildPool({
      dice: interaction.options.getInteger('dice', true),
      difficulty,
    }).total;
    const theirPool = buildPool({
      dice: isNpc ? npcPool(npcLevel) : opponentDice!,
      difficulty,
    }).total;
    const mine = evaluate(rollDice(myPool, ctx.roller));
    const theirs = evaluate(rollDice(theirPool, ctx.roller));

    const outcome = resolveContest(
      {
        successes: mine.successes,
        attribute: interaction.options.getInteger('attribute') ?? undefined,
      },
      {
        successes: theirs.successes,
        attribute: interaction.options.getInteger('opponent_attribute') ?? undefined,
        npc: isNpc,
      },
    );

    const me = interaction.user;
    const opponentUser = isNpc ? null : interaction.options.getUser('opponent');
    const myName = me.displayName;
    const theirName = isNpc
      ? `PNG di Livello ${npcLevel}`
      : (opponentUser?.displayName ?? 'Avversario');

    const notes: string[] = [];
    const myGain = grantQuickening(ctx.store, interaction.channelId, me.id, mine.tens);
    const myLine = quickeningLine(myGain.gained, myGain.value, myGain.overflow);
    if (myLine) notes.push(`${myName}: ${myLine}`);
    if (opponentUser) {
      const gain = grantQuickening(ctx.store, interaction.channelId, opponentUser.id, theirs.tens);
      const line = quickeningLine(gain.gained, gain.value, gain.overflow);
      if (line) notes.push(`${theirName}: ${line}`);
    }

    const embed = new EmbedBuilder()
      .setTitle(
        `${myName} contro ${theirName}${reasonSuffix(interaction.options.getString('reason'))}`,
      )
      .setColor(outcome.winner === 'tie' ? COLORS.neutral : COLORS.success)
      .addFields(side(myName, myPool, mine), side(theirName, theirPool, theirs), {
        name: 'Risultato',
        value: describe(outcome, myName, theirName),
      });
    if (notes.length) embed.addFields({ name: 'Quickening', value: notes.join('\n') });
    await interaction.reply({ embeds: [embed] });
  },
};

function reasonSuffix(reason: string | null): string {
  return reason ? `: ${reason}` : '';
}

function side(name: string, pool: number, result: TestResult) {
  return {
    name: `${name} (${pool} ${pool === 1 ? 'dado' : 'dadi'})`,
    value: `${formatDice(result.dice)}\n${result.successes} ${result.successes === 1 ? 'successo' : 'successi'}`,
    inline: true,
  };
}

function describe(result: ContestResult, a: string, b: string): string {
  const winner = result.winner === 'a' ? a : b;
  switch (result.tieBreak) {
    case undefined:
      return `Vince **${winner}**.`;
    case 'attribute':
      return `Pareggio: vince **${winner}** per l'Attributo più alto.`;
    case 'initiator-or-storyteller':
      return 'Pareggio contro un PNG: vince chi ha iniziato la sfida, oppure decide il Narratore.';
    case 'storyteller':
      return "Pareggio: il Narratore assegna la vittoria all'Attributo più alto o a chi ha iniziato la sfida.";
  }
}
