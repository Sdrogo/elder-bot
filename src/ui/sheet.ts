import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type InteractionReplyOptions,
} from 'discord.js';
import {
  CLAN_NAMES,
  LIMITS,
  SECT_NAMES,
  TIER_NAMES,
  TRACK_NAMES,
  healthMax,
  hungerDice,
  vitaeMax,
  willpowerMax,
  type Track,
} from '../game/character.js';
import { t, type Locale } from '../i18n/index.js';
import type { Character, Chronicle } from '../state/campaign.js';
import { COLORS } from './format.js';

// Component ids for characters and Chronicles. Like the roll buttons, they carry everything the
// click needs, so the bot keeps no state between clicks.
//   pc:adj:<characterId>:<track>:<delta>        a sheet button
//   pc:del:<characterId>                        confirm deleting
//   pc:give:<characterId>:<fromId>:<toId>:y|n   accept or refuse a character
//   chr:pick:<chronicleId>:<userId>             open the invited player's character menu
//   chr:join:<chronicleId>:<userId>             the menu itself

export type CampaignRef =
  | { kind: 'adjust'; characterId: number; track: Track; delta: number }
  | { kind: 'delete'; characterId: number }
  | { kind: 'give'; characterId: number; fromId: string; toId: string; accept: boolean }
  | { kind: 'pick'; chronicleId: number; userId: string }
  | { kind: 'join'; chronicleId: number; userId: string };

export function encodeCampaignId(ref: CampaignRef): string {
  switch (ref.kind) {
    case 'adjust':
      return `pc:adj:${ref.characterId}:${ref.track}:${ref.delta}`;
    case 'delete':
      return `pc:del:${ref.characterId}`;
    case 'give':
      return `pc:give:${ref.characterId}:${ref.fromId}:${ref.toId}:${ref.accept ? 'y' : 'n'}`;
    case 'pick':
      return `chr:pick:${ref.chronicleId}:${ref.userId}`;
    case 'join':
      return `chr:join:${ref.chronicleId}:${ref.userId}`;
  }
}

const SNOWFLAKE = /^\d{1,20}$/;
const TRACK_IDS = new Set<string>(Object.keys(TRACK_NAMES));

export function decodeCampaignId(customId: string): CampaignRef | undefined {
  const [prefix, action, a, b, c, d] = customId.split(':');
  const id = Number(a);
  if (!Number.isInteger(id) || id <= 0) return undefined;
  if (prefix === 'pc' && action === 'adj' && b && TRACK_IDS.has(b)) {
    const delta = Number(c);
    if (delta !== 1 && delta !== -1) return undefined;
    return { kind: 'adjust', characterId: id, track: b as Track, delta };
  }
  if (prefix === 'pc' && action === 'del') return { kind: 'delete', characterId: id };
  if (prefix === 'pc' && action === 'give' && SNOWFLAKE.test(b ?? '') && SNOWFLAKE.test(c ?? '')) {
    return { kind: 'give', characterId: id, fromId: b!, toId: c!, accept: d === 'y' };
  }
  if (prefix === 'chr' && (action === 'pick' || action === 'join') && SNOWFLAKE.test(b ?? '')) {
    return { kind: action, chronicleId: id, userId: b! };
  }
  return undefined;
}

/** Boxes like the paper sheet: ■ filled, □ empty, ✖ crossed out (baneful, violations). */
function boxes(filled: number, empty: number, crossed = 0): string {
  return '■'.repeat(filled) + '□'.repeat(Math.max(0, empty)) + '✖'.repeat(crossed);
}

/** The character's trackers as an embed. */
export function sheetEmbed(locale: Locale, c: Character, chronicle?: Chronicle): EmbedBuilder {
  const v = c.values;
  const hMax = healthMax(v);
  const vMax = vitaeMax(v);
  const wMax = willpowerMax(v);
  const hunger = hungerDice(v);
  const header = [
    CLAN_NAMES[c.clan],
    TIER_NAMES[v.tier],
    chronicle
      ? t(locale, 'sheet.chronicle', { name: chronicle.name })
      : t(locale, 'sheet.noChronicle'),
  ].join(' · ');
  const attributes = `Stamina ${v.stamina} · Composure ${v.composure} · Resolve ${v.resolve}`;
  return new EmbedBuilder()
    .setColor(COLORS.neutral)
    .setTitle(c.name)
    .setDescription(`${header}\n${attributes} · <@${c.ownerId}>`)
    .addFields(
      {
        name: TRACK_NAMES.health,
        value:
          `${boxes(v.health, hMax - v.baneful - v.health, v.baneful)} **${v.health}/${hMax}**` +
          (v.baneful ? ` · ${v.baneful} baneful` : ''),
      },
      {
        name: TRACK_NAMES.vitae,
        value: `${boxes(v.vitae, vMax - v.vitae)} **${v.vitae}/${vMax}**`,
        inline: true,
      },
      { name: 'Hunger', value: `**${hunger}**/${LIMITS.hunger}`, inline: true },
      {
        name: TRACK_NAMES.willpower,
        value: `${boxes(v.willpower, wMax - v.willpower)} **${v.willpower}/${wMax}**`,
      },
      {
        name: TRACK_NAMES.humanity,
        value:
          `${boxes(v.humanity, LIMITS.humanity - v.humanity - v.violations, v.violations)} **${v.humanity}**` +
          (v.violations ? ` · ${v.violations} violations` : ''),
      },
    );
}

const ROWS: [Track, Track][] = [
  ['health', 'baneful'],
  ['vitae', 'willpower'],
  ['humanity', 'violations'],
];

/** − and + buttons for each tracker, three rows of four. */
export function sheetButtons(c: Character): ActionRowBuilder<ButtonBuilder>[] {
  return ROWS.map(([a, b]) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...[a, b].flatMap((track) =>
        [-1, 1].map((delta) =>
          new ButtonBuilder()
            .setCustomId(encodeCampaignId({ kind: 'adjust', characterId: c.id, track, delta }))
            .setLabel(`${TRACK_NAMES[track]} ${delta < 0 ? '−' : '+'}`)
            .setStyle(delta < 0 ? ButtonStyle.Secondary : ButtonStyle.Primary),
        ),
      ),
    ),
  );
}

/** The sheet with its buttons when the viewer may change it. */
export function sheetMessage(
  locale: Locale,
  c: Character,
  chronicle: Chronicle | undefined,
  editable: boolean,
): Pick<InteractionReplyOptions, 'embeds' | 'components'> {
  return {
    embeds: [sheetEmbed(locale, c, chronicle)],
    components: editable ? sheetButtons(c) : [],
  };
}

/** One line per character, for lists. */
export function characterLine(c: Character, chronicle?: Chronicle): string {
  const v = c.values;
  const where = chronicle ? ` · ${chronicle.name}` : '';
  return (
    `**${c.name}** · ${CLAN_NAMES[c.clan]} · ${TIER_NAMES[v.tier]}${where}\n` +
    `Health ${v.health}/${healthMax(v)} · Vitae ${v.vitae}/${vitaeMax(v)} · Hunger ${hungerDice(v)} · ` +
    `Willpower ${v.willpower}/${willpowerMax(v)} · Humanity ${v.humanity}`
  );
}

/** One line per Chronicle, for /elder chronicle list. */
export function chronicleLine(
  locale: Locale,
  c: Chronicle,
  members: number,
  live: boolean,
): string {
  const channel = c.channelId ? ` · <#${c.channelId}>` : '';
  const onAir = live ? ` · **${t(locale, 'chronicle.live.badge')}**` : '';
  return `**${c.name}** (\`${c.slug}\`) · ${SECT_NAMES[c.sect]} · ${t(locale, 'chronicle.members', { count: members })}${channel}${onAir}`;
}
