import type { Messages } from './en.js';

// German catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Quickening, Drama, Painful Failure, Devil's Bargain, ...) stay in English.

export const de: Messages = {
  'cmd.elder.description': 'Würfe und Ressourcen für Vampire: The Masquerade 6e',

  'cmd.roll.description':
    'Probe: Attribut + Fertigkeit (oder Disziplin) − Schwierigkeit, Erfolg ab 8',
  'opt.roll.dice': 'Attribut + Fertigkeit, Disziplin oder Composure + Resolve',

  'opt.test.difficulty': 'Schwierigkeit: Würfel, die vom Pool abgezogen werden',
  'opt.test.bonus': 'Bonuswürfel (positiv) oder Maluswürfel (negativ)',
  'opt.test.quickening': 'Quickening zum Ausgeben: je +1 Würfel',
  'opt.test.combat': 'Angriffs- oder Verteidigungsprobe: kein Overqualified',
  'opt.test.reason': 'Was du versuchst',
  'opt.test.ignore_traits': 'Die scene traits des Drama nicht anwenden',

  'cmd.npc.description': 'Probe für einen NSC, den du führst: Pool = 2 × NSC-Stufe',
  'opt.npc.level': 'Stufe des NSC',

  'cmd.contest.description': 'Vergleichende Probe: die meisten Erfolge gewinnen',
  'opt.contest.dice': 'Dein Pool',
  'opt.contest.opponent_dice': 'Pool des Gegners (SC)',
  'opt.contest.opponent_npc_level': 'Stufe des gegnerischen NSC: würfelt 2 × Stufe',
  'opt.contest.opponent': 'Gegnerischer Spieler: erhält Quickening aus seinen 10ern',
  'opt.contest.attribute': 'Dein Attribut, für Gleichstände zwischen SC',
  'opt.contest.opponent_attribute': 'Attribut des gegnerischen SC, für Gleichstände',
  'opt.contest.difficulty': 'Nur bei gleichem Hindernis für beide: gilt für beide Seiten',
  'opt.contest.reason': 'Worum es geht',

  'cmd.prolonged.description': 'Ausgedehnte Probe: Erfolge mehrerer Würfe zusammenzählen',
  'cmd.prolonged.start.description': 'Startet eine ausgedehnte Probe',
  'opt.prolonged.name': 'Die Aufgabe',
  'opt.prolonged.target': 'Benötigte Erfolge',
  'opt.prolonged.tests': 'Verfügbare Würfe',
  'choice.prolonged.target': '{count} Erfolge',
  'choice.prolonged.tests': '{count} Würfe',
  'cmd.prolonged.roll.description': 'Würfle für deine ausgedehnte Probe',
  'opt.prolonged.dice': 'Attribut + Fertigkeit',
  'opt.prolonged.difficulty': 'Schwierigkeit',
  'opt.prolonged.bonus': 'Bonus- oder Maluswürfel',
  'opt.prolonged.quickening': 'Quickening zum Ausgeben',
  'cmd.prolonged.status.description': 'Zeigt deine ausgedehnte Probe',
  'cmd.prolonged.cancel.description': 'Schließt deine ausgedehnte Probe',

  'cmd.quickening.description':
    'Dein Quickening in diesem Kanal (max. 5, wird am Sitzungsende zurückgesetzt)',
  'cmd.quickening.show.description': 'Zeigt Quickening',
  'cmd.quickening.add.description': 'Fügt Quickening hinzu (über 5: Beast- oder Nature-Kästchen)',
  'cmd.quickening.spend.description':
    'Gibt Quickening aus, z. B. um einem Verbündeten Würfel zu geben',
  'cmd.quickening.success.description':
    'Kauft einen Basiserfolg: 3 Quickening, oder 5 ohne Punkte in der Fertigkeit',
  'cmd.quickening.set.description': 'Korrigiert den Wert von Hand',
  'opt.quickening.player': 'Ein anderer Spieler',
  'opt.quickening.amount': 'Wie viele',
  'opt.quickening.reason': 'Wofür',
  'opt.quickening.skill_dots': 'Hast du mindestens 1 Punkt in der Fertigkeit?',
  'opt.quickening.value': 'Neuer Wert',

  'cmd.drama.description': 'Drama des Spielleiters in diesem Kanal',
  'cmd.drama.show.description': 'Zeigt Drama und die aktiven scene traits',
  'cmd.drama.add.description': 'Fügt Drama hinzu',
  'cmd.drama.spend.description': 'Gibt Drama aus',
  'cmd.drama.trait.description':
    'Erstellt einen scene trait (2 Drama): Bonus oder Malus auf jeden Wurf der Szene',
  'cmd.drama.clear_traits.description': 'Entfernt die scene traits',
  'opt.drama.amount': 'Wie viel',
  'opt.drama.add_reason': 'Warum',
  'opt.drama.spend_reason': 'Wofür',
  'opt.drama.name': 'Zum Beispiel "Strömender Regen"',
  'opt.drama.modifier': 'Von -3 bis +3 Würfel',

  'cmd.session.description': 'Sitzungen, Szenen, Spielleiter und Sprache des Tisches',
  'cmd.session.new.description': 'Neue Sitzung: Quickening auf 0, Drama = 1 pro SC',
  'opt.session.player_characters': 'Anzahl der SC am Tisch',
  'cmd.session.scene.description':
    "Neue Szene: entfernt die scene traits, Devil's Bargain wieder verfügbar",
  'cmd.session.end.description':
    'Beendet die Sitzung: setzt den Tisch zurück, Spielleiter-Rolle frei',
  'cmd.session.storyteller.description': 'Zeigt oder ändert den Spielleiter dieses Kanals',
  'opt.session.user': 'Der neue Spielleiter',
  'cmd.session.language.description': 'Sprache der Bot-Antworten in diesem Kanal',
  'opt.session.language': 'Sprache des Tisches, oder auto für die Discord-Sprache jedes Nutzers',
  'choice.language.auto': 'Auto (Discord-Sprache)',

  'roll.title': 'Probe',
  'roll.retryTitle': '{title} (Try again)',
  'roll.field.dice': 'Würfel',
  'roll.field.outcome': 'Ergebnis',
  'dice.count.one': '{count} Würfel',
  'dice.count.other': '{count} Würfel',
  'roll.successes.one': '{count} Erfolg',
  'roll.successes.other': '{count} Erfolge',
  'roll.extra': '{count} zusätzlich',
  'pool.bonus': 'Bonus',
  'pool.difficulty': '− Schwierigkeit {n}',
  'pool.quickening': '+ {n} Quickening',
  'pool.total.one': '= **{count}** Würfel',
  'pool.total.other': '= **{count}** Würfel',
  'quickening.gained': '+{gained} Quickening aus den 10ern (jetzt {total}/{max})',
  'quickening.overflow.one':
    'Quickening am Maximum: markiere {count} Kästchen auf der Beast- oder Nature-Leiste.',
  'quickening.overflow.other':
    'Quickening am Maximum: markiere {count} Kästchen auf der Beast- oder Nature-Leiste.',
  'roll.error.quickening':
    'Du hast nur {available} Quickening: du kannst nicht {requested} ausgeben.',
  'roll.overqualified':
    'Nach der Schwierigkeit bleiben dir 4 oder mehr Würfel: du kannst einen Basiserfolg ohne Wurf nehmen (keine zusätzlichen Erfolge) oder würfeln.',
  'roll.noDice':
    'Die Schwierigkeit hat deinen Pool auf null gesenkt. Wähle:\n- **Fehlschlag akzeptieren**: beschreibe, wie es kompliziert wird, +1 Quickening für dich und +1 Drama für den Spielleiter\n- **Vorteile suchen**: Hilfe, Werkzeuge oder Position, die dir zusätzliche Würfel geben, dann würfle erneut\n- **Jemandem helfen** mit der Aktion assist',
  'roll.retryNote': 'Zweiter Versuch: Schwierigkeit +1, jeder Fehlschlag ist ein Painful Failure.',

  'button.takeBasic': 'Basiserfolg nehmen',
  'button.roll': 'Würfeln',
  'button.acceptFailure': 'Fehlschlag akzeptieren',
  'button.acceptBargain': 'Bargain annehmen',
  'button.rejectBargain': 'Bargain ablehnen',
  'button.alreadyUsed': 'Dieser Button wurde bereits benutzt.',
  'button.notYours': 'Nur wer gewürfelt hat, kann diesen Button benutzen.',

  'pain.option.vitae': 'Verliere 3 Vitae oder Willpower (deine Wahl)',
  'pain.option.quickening': 'Verliere dein gesamtes Quickening (nicht bei 0)',
  'pain.option.beast': 'Markiere 1 Kästchen auf der Beast-Leiste',
  'pain.option.drama': 'Gib dem Spielleiter 1 Drama',
  'pain.label.vitae': '3 Vitae/Willpower verlieren',
  'pain.label.quickening': 'Alles Quickening verlieren',
  'pain.label.beast': 'Beast markieren',
  'pain.label.drama': '1 Drama geben',
  'pain.result.vitae': '{player} verliert 3 Vitae oder Willpower.',
  'pain.result.quickening': '{player} verliert sein gesamtes Quickening.',
  'pain.result.beast': '{player} markiert 1 Kästchen auf der Beast-Leiste.',
  'pain.result.drama': '{player} gibt dem Spielleiter 1 Drama.',
  'pain.noQuickening': 'Du hast kein Quickening zu verlieren: wähle einen anderen Preis.',
  'pain.drama': 'Drama des Spielleiters: jetzt {drama}.',
  'pain.sheet': 'Trag es auf deinem Charakterbogen nach.',

  'overqualified.taken': '**Success** · Basiserfolg ohne Wurf (Overqualified)',
  'noDice.accepted': '**Failure** akzeptiert: beschreibe, wie die Lage kompliziert wird.',
  'noDice.quickening': '+1 Quickening (jetzt {value}/{max}).',
  'noDice.drama': '+1 Drama für den Spielleiter (jetzt {drama}).',
  'bargain.storytellerAnswers': 'Der Spielleiter nimmt den Bargain an oder lehnt ihn ab.',
  'bargain.alreadyUsed': "Du hast in dieser Szene schon einen Devil's Bargain angeboten.",
  'bargain.offer':
    'Angebot: eine Komplikation im Tausch gegen einen Basiserfolg. Der Spielleiter nimmt an (+1 Drama) oder lehnt ab, indem er 1 Drama ausgibt.',
  'bargain.accepted.title': 'Bargain angenommen',
  'bargain.accepted':
    '**Success** (Basiserfolg) mit der vereinbarten Komplikation. +1 Drama für den Spielleiter (jetzt {drama}).',
  'bargain.noDrama': 'Der Spielleiter hat kein Drama: Ablehnen kostet 1.',
  'bargain.rejected.title': 'Bargain abgelehnt',
  'bargain.rejected': 'Der Spielleiter gibt 1 Drama aus (jetzt {drama}). Der Fehlschlag bleibt.',
  'retry.modal.title': 'Try again: Schwierigkeit +1',
  'retry.modal.dice': 'Neuer Pool (Attribut oder Fertigkeit ändern)',
  'retry.modal.quickening': 'Quickening zum Ausgeben',
  'retry.modal.invalid': 'Gib ganze Zahlen ein: Pool von 0 bis 30, Quickening von 0 bis 5.',

  'npc.name': 'NSC der Stufe {level}',
  'contest.error.pool':
    'Gib den gegnerischen Pool mit `opponent_dice` (SC) oder `opponent_npc_level` (NSC) an, nicht mit beiden.',
  'contest.opponent': 'Gegner',
  'contest.title': '{a} gegen {b}',
  'contest.result': 'Ergebnis',
  'contest.win': '**{winner}** gewinnt.',
  'contest.tie.attribute': 'Gleichstand: **{winner}** gewinnt mit dem höheren Attribut.',
  'contest.tie.npc':
    'Gleichstand gegen einen NSC: wer die Herausforderung begonnen hat, gewinnt, oder der Spielleiter entscheidet.',
  'contest.tie.storyteller':
    'Gleichstand: der Spielleiter gibt den Sieg dem höheren Attribut oder dem, der die Herausforderung begonnen hat.',

  'prolonged.none':
    'Du hast keine offene ausgedehnte Probe in diesem Kanal. Nutze `/elder prolonged start`.',
  'prolonged.cancelled': 'Ausgedehnte Probe "{name}" geschlossen.',
  'prolonged.noDice':
    'Die Schwierigkeit hat deinen Pool auf null gesenkt: such Vorteile, die dir zusätzliche Würfel geben, oder hol dir Hilfe. Der Wurf wurde nicht gezählt.',
  'prolonged.painful': 'Der Wurf zählt trotzdem, aber du musst Choose Your Pain wählen.',
  'prolonged.completed': 'Geschafft!',
  'prolonged.failed': 'Keine Würfe mehr: Aufgabe gescheitert.',
  'prolonged.progress': 'Erfolge **{successes}/{target}** · Würfe genutzt **{done}/{max}**',

  'quickening.notEnough': 'Du hast {current} Quickening, {cost} benötigt.',
  'quickening.spentSuccess': '{player} gibt {cost} Quickening für einen **Basiserfolg** aus',
  'quickening.spent': '{player} gibt {cost} Quickening aus{reason}',
  'quickening.left': '**{left}/{max}** übrig.\nGib es vor dem Würfeln aus.',

  'drama.activeTraits': 'Aktive scene traits:',
  'drama.trait': '- {name}: {modifier} Würfel',
  'drama.max': 'max. {max}',
  'drama.added': '+{amount} Drama{reason}. Jetzt **{now}**{cap}.',
  'drama.traitsCleared': 'Scene traits entfernt.',
  'drama.traitLimit':
    'Es gibt schon {max} scene traits: entferne sie mit `/elder drama clear_traits`.',
  'drama.notEnough': 'Der Spielleiter hat {current} Drama, {cost} benötigt.',
  'drama.traitCreated':
    '**{name}**: {modifier} Würfel auf jedes `/elder roll` der Szene (Unbeteiligte nutzen `ignore_traits`).\nDrama übrig: **{left}**.',
  'drama.spent': 'Der Spielleiter gibt {cost} Drama aus{reason}. **{left}** übrig.',

  'auth.storytellerOnly':
    'Das kann nur der Spielleiter dieses Tisches. Wer `/elder session new` ausführt, wird Spielleiter und kann die Rolle mit `/elder session storyteller` weitergeben.',
  'session.storyteller.title': 'Spielleiter',
  'session.storyteller.current': 'Spielleiter des Tisches: {who}.',
  'session.storyteller.none': 'niemand: wer `/elder session new` ausführt, übernimmt die Rolle',
  'session.storyteller.set': '{user} ist der Spielleiter dieses Tisches.',
  'session.ended.title': 'Sitzung beendet',
  'session.ended':
    'Quickening, Drama, scene traits, Bargains, ausgedehnte Proben und Sprache des Tisches zurückgesetzt. Der Tisch hat keinen Spielleiter mehr: das nächste `/elder session new` bestimmt einen.',
  'session.new.title': 'Neue Sitzung',
  'session.new':
    'Quickening aller auf 0, Drama des Spielleiters auf **{pcs}**, scene traits entfernt.',
  'session.scene.title': 'Neue Szene',
  'session.scene': "Scene traits entfernt, Devil's Bargain wieder für alle verfügbar.",
  'session.language.title': 'Sprache',
  'session.language.set': 'Sprache des Tisches: {language}.',
  'session.language.auto': 'Der Bot antwortet allen in ihrer eigenen Discord-Sprache.',

  'error.generic': 'Etwas ist schiefgelaufen.',
};
