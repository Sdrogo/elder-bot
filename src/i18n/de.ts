import type { Messages } from './en.js';

// German catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Hunger, Painful Failure, Beast's Bargain, ...) stay in English.

export const de: Messages = {
  // Slash command descriptions (names never change).
  'cmd.elder.description': 'Würfelwürfe für Vampire: The Masquerade 6e',

  'cmd.roll.description':
    'Probe: Attribut + Fertigkeit (oder Disziplin), Erfolg ab 6, eine 10 zählt 2',
  'opt.roll.dice':
    'Pool als Zahl (oder leer lassen und attribute + with vom Charakterbogen nutzen)',

  'opt.test.difficulty': 'Schwierigkeit: benötigte Erfolge',
  'opt.test.bonus': 'Bonuswürfel (positiv) oder Maluswürfel (negativ)',
  'opt.test.reason': 'Was du versuchst',

  'cmd.contest.description': 'Vergleichende Probe: die meisten Erfolge gewinnen',
  'opt.contest.dice': 'Dein Pool als Zahl (oder attribute + with vom Bogen)',
  'opt.contest.opponent_dice':
    'Pool des Gegners als Zahl (oder opponent_attribute + opponent_with)',
  'opt.contest.opponent': 'Gegnerischer Spieler',
  'opt.contest.attribute':
    'Attribut vom Bogen, oder sein Wert für Gleichstände, wenn du dice nutzt',
  'opt.contest.opponent_attribute':
    'Attribut des gegnerischen Spielers, oder eine Zahl für Gleichstände (NSC: halber Pool)',
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
  'cmd.impair.description': 'Erzähler: Impair die Attribute eines Charakters für die Szene',
  'opt.impair.character': 'Der Charakter',
  'opt.impair.target': 'Eine Attributgruppe oder ein einzelnes Attribut (oder alle aufheben)',
  'opt.impair.remove': 'Dieses Impairment beenden statt hinzufügen',
  'impair.choice.clear': 'Alle Impairments beenden',
  'impair.noChronicle':
    'Dieser Charakter ist in keiner Chronik: nur sein Erzähler kann ihn Impairen.',
  'impair.notYours': 'Nur der Erzähler der Chronik kann einen Charakter Impairen.',
  'impair.added':
    '{name} ist Impaired: {list}. −2 Würfel je Impaired Attribut in einer Probe, bis zum Ende der Szene.',
  'impair.none': '{name} ist durch den Erzähler nicht mehr Impaired.',
  'impair.nothingToRemove': '{name} hat kein Impairment des Erzählers, das enden könnte.',
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
  'sheet.usePlaceholder': 'Wähle die Figur im Spiel',
  'sheet.nowPlaying': 'Du spielst jetzt {name}: Würfe nutzen ihren Hunger und ihre Willenskraft.',
  'button.pickCharacter': 'Charakter wählen',
  'opt.roll.npc': 'Wurf für einen NSC: Pool aus dem Werteblock, ohne Hunger-Würfel',
  'opt.roll.attribute': 'Attribut vom Charakterbogen',
  'opt.roll.with': 'Was dazukommt: Fertigkeit, Disziplin, Kraft, Attribut oder Lifepath',
  'opt.roll.surge': 'Blood Surge: das Attribut oder die Disziplin, die für die Szene steigt',
  'sheetRoll.pool': 'Pool',
  'sheetRoll.mixed':
    'Nutze `dice` oder die Bogen-Optionen (`attribute`, `with`, `surge`), nicht beides.',
  'sheetRoll.needPool': 'Gib den Pool an: `dice`, oder `attribute` + `with` vom Charakterbogen.',
  'sheetRoll.npc': 'NSC-Würfe nutzen `dice`: die Bogen-Optionen sind für Spielercharaktere.',
  'sheetRoll.noCharacter':
    'Hier gibt es keinen Charakter mit vollständigem Bogen: würfle im Kanal deiner Chronik oder vervollständige den Bogen im Panel. `dice` geht immer.',
  'sheetRoll.noSheet':
    '{name} hat nur Leisten: vervollständige den Bogen im Panel, um daraus zu würfeln, oder nutze `dice`.',
  'sheetRoll.hint.noCharacter': 'Kein Charakter mit vollständigem Bogen hier: nutze dice',
  'sheetRoll.hint.noSheet': 'Vervollständige den Bogen im Panel, oder nutze dice',
  'sheetRoll.pickFromList': 'Wähle `{option}` aus der Liste, die Discord vorschlägt.',
  'sheetRoll.issue.needAttribute':
    'Wähle ein `attribute` (oder eine Kraft in `with`, die ihr eigenes mitbringt).',
  'sheetRoll.issue.needSecond':
    'Wähle, was `with` dem Attribut kommt: Fertigkeit, Disziplin, Kraft, Attribut oder Lifepath.',
  'sheetRoll.issue.sameAttribute': 'Wähle zwei verschiedene Attribute.',
  'sheetRoll.issue.unknownTrait':
    'Dieser Wert steht nicht auf dem Bogen: wähle einen aus der Liste.',
  'sheetRoll.issue.noPower': 'Dein Charakter kennt diese Kraft nicht.',
  'sheetRoll.issue.noDiscipline': 'Dein Charakter hat keine Punkte in dieser Disziplin.',
  'sheetRoll.issue.noSpecialty':
    'Diese Spezialisierung steht nicht mehr auf dem Bogen: wähle neu aus der Liste.',
  'sheetRoll.issue.surgeNoDiscipline': 'Blood Surge braucht mindestens 1 Punkt in der Disziplin.',
  'sheetRoll.issue.surgeLimit': 'Dieser Blood Surge überschreitet die Grenze deines Tiers.',
  'sheetRoll.issue.surgeVitae': 'Nicht genug Vitae für diesen Blood Surge.',
  'sheetRoll.surgeSpent': '{name} gibt {cost} Vitae aus: {trait} +{dots} bis zum Ende der Szene.',
  'sheetRoll.surgeActive': 'Aktiv bis zum Ende der Szene: {list}.',
  'sheetRoll.surgeEnded': 'Blood Surge für {name} beendet.',
  'sheetRoll.impaired': '{attributes} Impaired (Health oder Willpower auf 0): −{dice} Würfel.',
  'sheetRoll.powerAttribute':
    'Diese Kraft nutzt normalerweise {attribute}: der Storyteller entscheidet.',
  'sheetRoll.trackerDiffers':
    '{attribute}: {sheet} auf dem Bogen, {tracker} auf den Leisten. Der Wurf nutzt den Bogen.',
  'button.surgeEnd': 'Blood Surge beenden',
  'sheetRoll.issue.bonusNeedsSurge': 'Wähle zuerst in `surge` den Wert, der steigen soll.',
  'sheetRoll.hint.pickSurge': 'Wähle zuerst den Wert in surge',
  'opt.contest.surge_bonus': 'Bonus des Blood Surge, mit seinen Vitae-Kosten (Standard +1)',
  'opt.roll.surge_bonus': 'Bonus des Blood Surge, mit seinen Vitae-Kosten (Standard +1)',
  'opt.roll.specialization': 'Spezialisierung der Fertigkeit in with (+1 Würfel)',
  'opt.contest.specialization': 'Spezialisierung der Fertigkeit in with (+1 Würfel)',
  'opt.contest.opponent_specialization':
    'Spezialisierung der Fertigkeit in opponent_with (+1 Würfel)',
  'sheetRoll.hint.noSpecialties': 'Wähle zuerst in with eine Fertigkeit mit Spezialisierungen',
  'sheetRoll.issue.specialtyNeedsSkill':
    'Eine Spezialisierung gehört zu einer Fertigkeit: wähle zuerst die Fertigkeit in `with`.',
  'sheetRoll.contest.needOpponent': 'Wähle den `opponent`, um von seinem Bogen zu würfeln.',
  'sheetRoll.contest.needOpponentPool':
    'Gib den Pool des Gegners an: `opponent_dice`, oder `opponent_attribute` + `opponent_with` vom Bogen des gegnerischen Spielers.',
  'sheetRoll.contest.needPool': 'Gib deinen Pool an: `dice`, oder `attribute` + `with` vom Bogen.',
  'sheetRoll.hint.pickOpponent': 'Wähle zuerst den Gegner',
  'opt.contest.opponent_with': 'Was zum Attribut des gegnerischen Spielers kommt, von seinem Bogen',
  'opt.contest.surge': 'Blood Surge: das Attribut oder die Disziplin, die für die Szene steigt',
  'opt.contest.with': 'Was zu deinem Attribut kommt: Fertigkeit, Disziplin, Kraft, Lifepath',
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
  'willpower.pickCharacter':
    'Wähle zuerst mit `/elder sheet` die Figur, die du spielst, damit die Willpower vom richtigen Charakterbogen abgezogen wird.',
  'willpower.left': '{name}: Willpower {left}/{max}.',

  // Web panel.
  'cmd.panel.description': 'Link zum Web-Panel: deine Charaktere und Chroniken',
  'panel.link':
    'Deine Charaktere und Chroniken im Browser. Melde dich mit deinem Discord-Konto an.',
  'panel.open': 'Panel öffnen',
  'panel.notConfigured': 'Das Web-Panel ist bei diesem Bot nicht eingerichtet.',

  'error.generic': 'Etwas ist schiefgelaufen.',
};
