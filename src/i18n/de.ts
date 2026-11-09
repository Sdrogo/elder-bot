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

  'cmd.npc.description': 'Probe für einen NSC: würfle den Pool aus seinen Werten',
  'opt.npc.dice': 'Pool des NSC (Körperlich, Gesellschaftlich, Geistig oder Fertigkeit)',

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
  'cmd.prolonged.status.description': 'Zeigt deine langwierige Aufgabe',
  'cmd.prolonged.cancel.description': 'Schließt deine langwierige Aufgabe',

  'cmd.session.description': 'Sitzungen, Erzähler und Sprache des Tisches',
  'cmd.session.new.description': 'Neue Sitzung: wer sie startet, wird Erzähler',
  'cmd.session.end.description':
    'Beendet die Sitzung: setzt den Tisch zurück, Spielleiter-Rolle frei',
  'cmd.session.storyteller.description': 'Zeigt oder ändert den Spielleiter dieses Kanals',
  'opt.session.user': 'Der neue Spielleiter',
  'cmd.session.language.description': 'Sprache der Bot-Antworten in diesem Kanal',
  'opt.session.language': 'Sprache des Tisches, oder auto für die Discord-Sprache jedes Nutzers',
  'choice.language.auto': 'Auto (Discord-Sprache)',

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

  // /elder npc and /elder contest.
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

  // /elder session and the Storyteller.
  'auth.storytellerOnly':
    'Das kann nur der Spielleiter dieses Tisches. Wer `/elder session new` ausführt, wird Spielleiter und kann die Rolle mit `/elder session storyteller` weitergeben.',
  'session.storyteller.title': 'Spielleiter',
  'session.storyteller.current': 'Spielleiter des Tisches: {who}.',
  'session.storyteller.none': 'niemand: wer `/elder session new` ausführt, übernimmt die Rolle',
  'session.storyteller.set': '{user} ist der Spielleiter dieses Tisches.',
  'session.ended.title': 'Sitzung beendet',
  'session.ended':
    'Langwierige Aufgaben und Tischsprache zurückgesetzt. Der Tisch hat keinen Erzähler mehr: das nächste `/elder session new` bestimmt einen.',
  'session.new.title': 'Neue Sitzung',
  'session.new':
    'Der Tisch ist bereit. Gib deine Hunger-Würfel bei jedem Wurf mit der Option `hunger` an.',
  'session.language.title': 'Sprache',
  'session.language.set': 'Sprache des Tisches: {language}.',
  'session.language.auto': 'Der Bot antwortet allen in ihrer eigenen Discord-Sprache.',

  'error.generic': 'Etwas ist schiefgelaufen.',
};
