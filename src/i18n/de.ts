import type { Messages } from './en.js';

// German catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Hunger, Painful Failure, Beast's Bargain, ...) stay in English.

export const de: Messages = {
  // Slash command descriptions (names never change).
  'cmd.elder.description': 'Würfelwürfe für Vampire: The Masquerade 6e',

  'cmd.roll.description':
    'Probe: Attribut + Fertigkeit (oder Disziplin), Erfolg ab 6, eine 10 zählt 2',
  'opt.roll.dice': 'Attribut + Fertigkeit, Disziplin oder Composure + Resolve',

  'opt.test.difficulty': 'Schwierigkeit: benötigte Erfolge',
  'opt.test.bonus': 'Bonuswürfel (positiv) oder Maluswürfel (negativ)',
  'opt.test.hunger': 'Deine Hunger-Würfel (0-5): ersetzen normale Würfel im Pool',
  'opt.test.take_half': 'Taking Half: kein Wurf, halber Pool (aufgerundet) als Erfolge',
  'opt.test.reason': 'Was du versuchst',

  'cmd.contest.description': 'Vergleichende Probe: die meisten Erfolge gewinnen',
  'opt.contest.dice': 'Dein Pool',
  'opt.contest.opponent_dice': 'Pool des Gegners',
  'opt.contest.opponent': 'Gegnerischer Spieler',
  'opt.contest.attribute': 'Dein Attribut, bei Gleichstand',
  'opt.contest.opponent_attribute': 'Attribut des Gegners, bei Gleichstand (ein NSC: halber Pool)',
  'opt.contest.hunger': 'Deine Hunger-Würfel (0-5)',
  'opt.contest.opponent_hunger': 'Hunger-Würfel des Gegners (ein Vampir-SC)',
  'opt.contest.reason': 'Worum es geht',

  'cmd.prolonged.description': 'Langwierige Aufgabe: zählt die Erfolge mehrerer Würfe zusammen',
  'cmd.prolonged.start.description': 'Startet eine langwierige Aufgabe',
  'opt.prolonged.name': 'Die Aufgabe',
  'opt.prolonged.target': 'Benötigte Erfolge',
  'opt.prolonged.tests': 'Verfügbare Würfe',
  'choice.prolonged.target': '{count} Erfolge',
  'choice.prolonged.tests': '{count} Würfe',
  'cmd.prolonged.roll.description': 'Würfle für deine langwierige Aufgabe',
  'opt.prolonged.dice': 'Attribut + Fertigkeit',
  'opt.prolonged.bonus': 'Bonus- oder Maluswürfel',
  'opt.prolonged.hunger': 'Deine Hunger-Würfel (0-5)',

  // Shared roll output.
  'roll.title': 'Probe',
  'roll.retryTitle': '{title} (Try again)',
  'roll.field.dice': 'Würfel',
  'roll.field.outcome': 'Ergebnis',
  'dice.count.one': '{count} Würfel',
  'dice.count.other': '{count} Würfel',
  'roll.successes.one': '{count} Erfolg',
  'roll.successes.other': '{count} Erfolge',
  'roll.successesOf.one': '{count} Erfolg von {difficulty}',
  'roll.successesOf.other': '{count} Erfolge von {difficulty}',
  'roll.margin': 'Spanne {margin}',
  'pool.bonus': 'Bonus',
  'pool.difficulty': 'Schwierigkeit {n}',
  'pool.total.one': '= **{count}** Würfel',
  'pool.total.other': '= **{count}** Würfel',
  'roll.takingHalf': 'Taking Half: kein Wurf, der halbe Pool (aufgerundet) zählt als Erfolge.',
  'roll.noDice': '**Failure**: keine Würfel im Pool, die Probe scheitert automatisch.',
  'roll.complication':
    'Kein Erfolg: Zusätzlich zum Fehlschlag legt ihr mit dem Erzähler fest, wie es schlimmer wird (etwas beschädigen oder verlieren, Aufmerksamkeit erregen, sich verwundbar machen, Schaden nehmen).',
  'roll.bestial':
    'Eine 1 auf einem Hunger-Würfel: das Tier bricht hervor. Der Erzähler wählt die Folge (Kollateralschaden, das Tier nähren, Bruch der Maskerade, Raserei droht).',
  'roll.hungerOne':
    'Eine 1 auf einem Hunger-Würfel: geht diese Probe verloren, ist es ein Bestial Failure.',
  'roll.automaticWin':
    'Pool mindestens doppelt so groß wie die Schwierigkeit: der Spielleiter kann einen automatischen Sieg ohne Wurf gewähren.',
  'roll.retryNote': 'Zweiter Versuch: Schwierigkeit +1, jeder Fehlschlag ist ein Painful Failure.',

  'button.grantBargain': 'Handel gewähren',
  'button.refuseBargain': 'Kein Handel',
  'button.alreadyUsed': 'Dieser Button wurde bereits benutzt.',
  'button.notYours': 'Nur wer gewürfelt hat, kann diesen Button benutzen.',

  // Beast's Bargain and the Try again modal.
  'bargain.requested':
    'Der Spieler greift nach dem Tier. Erzähler: beschreibe den Preis (Kollateralschaden, das Tier nähren, Bruch der Maskerade, Raserei droht), bemessen an der Fehlschlagspanne, und gewähre oder verweigere ihn.',
  'bargain.granted.title': 'Handel geschlossen',
  'bargain.granted':
    '**Success** (einfacher Sieg, ohne Spanne) zum Preis, den der Erzähler beschrieben hat.',
  'bargain.refused.title': 'Kein Handel',
  'bargain.refused': 'Der Erzähler bietet keinen Handel an: der Fehlschlag bleibt.',
  'retry.modal.title': 'Try again: Schwierigkeit {difficulty}',
  'retry.modal.dice': 'Neuer Pool (Attribut oder Fertigkeit ändern)',
  'retry.modal.invalid': 'Gib eine ganze Zahl von 0 bis 30 ein.',

  // /elder roll npc:true and /elder contest.
  'npc.name': 'NSC',
  'contest.opponent': 'Gegner',
  'contest.title': '{a} gegen {b}',
  'contest.result': 'Ergebnis',
  'contest.win': '**{winner}** gewinnt.',
  'contest.tie.attribute': 'Gleichstand: **{winner}** gewinnt mit dem höheren Attribut.',
  'contest.tie.initiator':
    'Gleichstand bei gleichen (oder unbekannten) Attributen: wer die Probe begonnen hat, gewinnt.',
  'contest.consequences': 'Folgen',
  'contest.bestialIfLost':
    'eine 1 auf einem Hunger-Würfel, Bestial Failure bei verlorenem Gleichstand',

  // /elder prolonged.
  'prolonged.none':
    'Du hast in diesem Kanal keine langwierige Aufgabe offen. Nutze `/elder prolonged start`.',
  'prolonged.cancelled': 'Langwierige Aufgabe „{name}“ geschlossen.',
  'prolonged.noDice':
    'Dein Pool hat keine Würfel: such Vorteile, die dir Extrawürfel geben, oder hol dir Hilfe. Der Wurf wurde nicht gezählt.',
  'prolonged.disaster': 'Painful oder Bestial Failure: die Aufgabe scheitert sofort.',
  'prolonged.completed': 'Geschafft!',
  'prolonged.failed': 'Keine Würfe mehr: Aufgabe gescheitert.',
  'prolonged.progress': 'Erfolge **{successes}/{target}** · Würfe genutzt **{done}/{max}**',

  // The Storyteller.
  // Willpower, /elder frenzy and /elder masquerade.
  'cmd.frenzy.description':
    'Raserei widerstehen: Composure + Resolve, höchstens so viele Würfel wie Menschlichkeit',
  'opt.frenzy.type': 'Art der Raserei',
  'opt.frenzy.dice': 'Composure + Resolve',
  'opt.frenzy.humanity': 'Dein Menschlichkeits- (oder Pfad-)Rang: begrenzt die Würfel',
  'opt.frenzy.hunger': 'Deine Hunger-Würfel (0-5): Schwierigkeit der Hungerraserei',
  'opt.frenzy.difficulty':
    'Schwierigkeit vom Spielleiter (Wut 2 ± Modifikatoren, Clan 3 + Generationsmodifikator)',
  'frenzy.title': 'widersteht einer {frenzy}',
  'frenzy.capped': 'Pool von {pool} Würfeln, aber Menschlichkeit {humanity} begrenzt ihn.',
  'frenzy.resisted': 'Widersteht für den Rest der Szene.',
  'frenzy.suffered': 'Der Charakter verfällt in {frenzy}.',
  'frenzy.painful': 'Der Charakter verfällt in {frenzy} und tut etwas, das er bereuen wird.',
  'frenzy.error.difficulty': 'Gib die vom Spielleiter festgelegte `difficulty` an.',
  'frenzy.error.noHunger':
    'Die Schwierigkeit der Hungerraserei sind deine Hunger-Würfel: gib `hunger` (mindestens 1) oder eine `difficulty` an.',
  'cmd.masquerade.description':
    'Der Masquerade Tracker dieses Tisches, mit Knöpfen für den Spielleiter',
  'masquerade.title': 'Masquerade Tracker',
  'masquerade.threat.title': 'Threat test der Maskerade',
  'willpower.pick': 'Wähle bis zu {max} Würfel zum Neuwurf (−1 Willpower)',
  'willpower.option': 'Würfel {n}: {face}',
  'willpower.spent': '1 Willpower ausgegeben, neu gewürfelt: {changes}.',
  'button.cancel': 'Abbrechen',

  'auth.storytellerOnly':
    'Das kann nur der Spielleiter der Chronik, die in diesem Kanal gespielt wird (oder ein Server-Admin). Den Kanal wählst du im Web-Panel (`/elder panel`).',

  // Characters and Chronicles.
  'cmd.sheet.description': 'Zeigt einen Charakterbogen mit + und − Knöpfen',
  'opt.sheet.character': 'Der Charakter (Standard: deiner an diesem Tisch)',
  'opt.sheet.public': 'Dem ganzen Kanal zeigen, ohne Knöpfe',
  'opt.invite.chronicle': 'Die Chronik (Standard: die in diesem Kanal gespielte)',
  'cmd.invite.description': 'Lädt einen Spieler ein, einen Charakter in die Chronik zu bringen',
  'opt.invite.player': 'Der Spieler',
  'campaign.guildOnly': 'Charaktere und Chroniken gehören zu einem Server: nutze den Befehl dort.',
  'character.noneYet':
    'Du hast noch keine Charaktere auf diesem Server. Erstelle einen im Web-Panel (`/elder panel`).',
  'character.notFound': 'Charakter nicht gefunden.',
  'character.pickOne': 'Du hast mehrere Charaktere: wähle einen mit der Option `character`.',
  'character.cannotEdit':
    'Nur der Besitzer, der Spielleiter seiner Chronik oder ein Server-Admin können diesen Charakter ändern.',
  'chronicle.invite.invalid': 'Wähle einen anderen Spieler (nicht dich selbst und keinen Bot).',
  'character.hungerFromVitae':
    '{hunger} aus der Vitae von {name} ({vitae}/{max}). Mit der Option `hunger` änderst du das.',
  'sheet.chronicle': 'Chronik: {name}',
  'sheet.noChronicle': 'keine Chronik',
  'button.pickCharacter': 'Charakter wählen',
  'opt.roll.npc': 'Wurf für einen NSC: Pool aus dem Werteblock, ohne Hunger-Würfel',
  'button.masqueradeThreat': 'Bedrohungsprobe',
  'button.prolongedCancel': 'Aufgabe abbrechen',
  'button.willpowerBest': 'Willpower: Fehlschläge neu würfeln',
  'willpower.noFailures': 'Keine fehlgeschlagenen normalen Würfel zum Neuwürfeln.',
  'chronicle.noneYet': 'Noch keine Chroniken. Erstelle eine im Web-Panel (`/elder panel`).',
  'chronicle.notFound': 'Chronik nicht gefunden.',
  'chronicle.pickOne': 'Du leitest mehrere Chroniken: wähle eine mit der Option `chronicle`.',
  'chronicle.storytellerOnly': 'Das kann nur der Spielleiter dieser Chronik oder ein Server-Admin.',
  'chronicle.invite':
    '{user}, {storyteller} lädt dich in **{chronicle}** ein: wähle den Charakter, den du mitbringst.',
  'chronicle.noFreeCharacter':
    'Alle deine Charaktere sind schon in einer Chronik. Erstelle einen neuen im Web-Panel (`/elder panel`) und drücke den Knopf erneut.',
  'chronicle.pickPlaceholder': 'Dein Charakter',
  'chronicle.busy': '**{name}** spielt schon in einer anderen Chronik.',
  'chronicle.wrongTier': '**{name}** kann nicht beitreten: Die Chronik ist auf Stufe {tier}.',
  'chronicle.joined.private': '**{name}** tritt {chronicle} bei.',
  'chronicle.joined': '**{name}** ({user}) tritt {chronicle} bei.',
  'frenzy.error.noCharacter':
    'Du hast keinen Charakter an diesem Tisch: gib `dice` (Composure + Resolve) und `humanity` an.',
  'willpower.none': '**{name}** hat keine Willpower mehr.',
  'willpower.left': '{name}: Willpower {left}/{max}.',

  // Web panel.
  'cmd.panel.description': 'Link zum Web-Panel: deine Charaktere und Chroniken',
  'panel.link':
    'Deine Charaktere und Chroniken im Browser. Melde dich mit deinem Discord-Konto an.',
  'panel.open': 'Panel öffnen',
  'panel.notConfigured': 'Das Web-Panel ist bei diesem Bot nicht eingerichtet.',

  'error.generic': 'Etwas ist schiefgelaufen.',
};
