import type { Messages } from './en.js';

// Italian catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Hunger, Painful Failure, Beast's Bargain, ...) stay in English.

export const it: Messages = {
  // Slash command descriptions (names never change).
  'cmd.elder.description': 'Tiri di dado per Vampire: The Masquerade 6e',

  'cmd.roll.description': 'Test: Attributo + Abilità (o Disciplina), successo con 6+, un 10 vale 2',
  'opt.roll.dice': 'Pool come numero (oppure lascialo vuoto e usa attribute + with dalla scheda)',

  'opt.test.difficulty': 'Difficoltà: successi necessari per vincere',
  'opt.test.bonus': 'Dadi bonus (positivi) o penalità (negativi)',
  'opt.test.hunger': 'I tuoi dadi Hunger (0-5): sostituiscono dadi normali del pool',
  'opt.test.take_half': 'Taking Half: niente tiro, metà del pool (per eccesso) come successi',
  'opt.test.reason': 'Cosa stai tentando',

  'cmd.contest.description': 'Test contrapposto: vince chi ottiene più successi',
  'opt.contest.dice': 'La tua pool come numero (oppure attribute + with dalla scheda)',
  'opt.contest.opponent_dice':
    "Pool dell'avversario come numero (oppure opponent_attribute + opponent_with)",
  'opt.contest.opponent': 'Giocatore avversario',
  'opt.contest.attribute': 'Attributo dalla scheda, o il suo valore per i pareggi se usi dice',
  'opt.contest.opponent_attribute':
    'Attributo del giocatore avversario, o un numero per i pareggi (PNG: metà pool)',
  'opt.contest.hunger': 'I tuoi dadi Hunger (0-5)',
  'opt.contest.opponent_hunger': "Dadi Hunger dell'avversario (un PG vampiro)",
  'opt.contest.reason': 'Posta in gioco',

  'cmd.prolonged.description': 'Compito prolungato: somma i successi di più tiri',
  'cmd.prolonged.start.description': 'Apre un compito prolungato',
  'opt.prolonged.name': 'Il compito',
  'opt.prolonged.target': 'Successi richiesti',
  'opt.prolonged.tests': 'Tiri disponibili',
  'choice.prolonged.target': '{count} successi',
  'choice.prolonged.tests': '{count} tiri',
  'cmd.prolonged.roll.description': 'Tira per il tuo compito prolungato',
  'opt.prolonged.dice': 'Attributo + Abilità',
  'opt.prolonged.bonus': 'Dadi bonus o penalità',
  'opt.prolonged.hunger': 'I tuoi dadi Hunger (0-5)',

  // Shared roll output.
  'roll.title': 'Test',
  'roll.retryTitle': '{title} (Try again)',
  'roll.field.dice': 'Dadi',
  'roll.field.outcome': 'Esito',
  'dice.count.one': '{count} dado',
  'dice.count.other': '{count} dadi',
  'roll.successes.one': '{count} successo',
  'roll.successes.other': '{count} successi',
  'roll.successesOf.one': '{count} successo su {difficulty}',
  'roll.successesOf.other': '{count} successi su {difficulty}',
  'roll.margin': 'margine {margin}',
  'pool.bonus': 'bonus',
  'pool.difficulty': 'Difficoltà {n}',
  'pool.total.one': '= **{count}** dado',
  'pool.total.other': '= **{count}** dadi',
  'roll.takingHalf': 'Taking Half: nessun dado tirato, metà del pool (per eccesso) come successi.',
  'roll.noDice': '**Failure**: nessun dado nel pool, il test fallisce automaticamente.',
  'roll.complication':
    'Nessun successo: oltre al fallimento, decidete con il Narratore come peggiora la situazione (danneggi o perdi qualcosa, attiri attenzione, ti esponi, subisci danni).',
  'roll.bestial':
    "Un 1 su un dado Hunger: la Bestia si scatena. Il Narratore sceglie l'effetto (danni collaterali, nutrire la Bestia, violazione della Masquerade, rischio di frenesia).",
  'roll.hungerOne': 'Un 1 su un dado Hunger: se questo test viene perso, è un Bestial Failure.',
  'roll.automaticWin':
    'Pool almeno doppio della Difficoltà: il Narratore può concedere la vittoria automatica senza tirare.',
  'roll.retryNote': 'Secondo tentativo: Difficoltà +1, ogni fallimento è un Painful Failure.',

  'button.grantBargain': 'Concedi il patto',
  'button.refuseBargain': 'Nessun patto',
  'button.alreadyUsed': 'Questo pulsante è già stato usato.',
  'button.notYours': 'Solo chi ha tirato può usare questo pulsante.',

  // Beast's Bargain and the Try again modal.
  'bargain.requested':
    'Il giocatore si rivolge alla Bestia. Narratore: descrivi il prezzo (danni collaterali, nutrire la Bestia, violazione della Masquerade, rischio di frenesia), commisurato al margine di fallimento, poi concedilo o rifiutalo.',
  'bargain.granted.title': 'Patto stretto',
  'bargain.granted':
    '**Success** (vittoria base, senza margine) al prezzo descritto dal Narratore.',
  'bargain.refused.title': 'Nessun patto',
  'bargain.refused': 'Il Narratore non offre patti: il fallimento resta.',
  'retry.modal.title': 'Try again: Difficoltà {difficulty}',
  'retry.modal.dice': 'Nuovo pool (cambia Attributo o Abilità)',
  'retry.modal.invalid': 'Inserisci un numero intero da 0 a 30.',

  // /elder roll npc:true and /elder contest.
  'npc.name': 'PNG',
  'contest.opponent': 'Avversario',
  'contest.title': '{a} contro {b}',
  'contest.result': 'Risultato',
  'contest.win': 'Vince **{winner}**.',
  'contest.tie.attribute': "Pareggio: vince **{winner}** per l'Attributo più alto.",
  'contest.tie.initiator':
    'Pareggio con Attributi uguali (o non indicati): vince chi ha iniziato la contesa.',
  'contest.consequences': 'Conseguenze',
  'contest.bestialIfLost': 'un 1 su un dado Hunger, Bestial Failure se perde il pareggio',

  // /elder prolonged.
  'prolonged.none':
    'Non hai compiti prolungati aperti in questo canale. Usa `/elder prolonged start`.',
  'prolonged.cancelled': 'Compito prolungato "{name}" chiuso.',
  'prolonged.noDice':
    'Il tuo pool non ha dadi: cerca vantaggi che ti diano dadi extra, o fatti aiutare. Il tiro non è stato contato.',
  'prolonged.disaster': 'Painful o Bestial Failure: il compito fallisce subito.',
  'prolonged.completed': 'Completato!',
  'prolonged.failed': 'Tiri esauriti: compito fallito.',
  'prolonged.progress': 'Successi **{successes}/{target}** · tiri usati **{done}/{max}**',

  // The Storyteller.
  // Willpower, /elder frenzy and /elder masquerade.
  'cmd.frenzy.description':
    'Resisti alla frenesia: Composure + Resolve, al massimo tanti dadi quanta Umanità',
  'opt.frenzy.type': 'Tipo di frenesia',
  'opt.frenzy.dice': 'Composure + Resolve',
  'opt.frenzy.humanity': 'Il tuo grado di Umanità (o Sentiero): limita i dadi',
  'opt.frenzy.hunger': 'I tuoi dadi Hunger (0-5): la Difficoltà della frenesia da fame',
  'opt.frenzy.difficulty':
    'Difficoltà del Narratore (rabbia 2 ± modificatori, clan 3 + modificatore di generazione)',
  'frenzy.title': 'resiste a una {frenzy}',
  'frenzy.capped': "Pool di {pool} dadi, ma l'Umanità {humanity} lo limita.",
  'frenzy.resisted': 'Resiste per il resto della scena.',
  'frenzy.suffered': 'Il personaggio cade in {frenzy}.',
  'frenzy.painful': 'Il personaggio cade in {frenzy} e fa qualcosa di cui si pentirà.',
  'frenzy.error.difficulty': 'Indica la `difficulty` decisa dal Narratore.',
  'frenzy.error.noHunger':
    'La Difficoltà della frenesia da fame sono i tuoi dadi Hunger: indica `hunger` (almeno 1) o una `difficulty`.',
  'cmd.masquerade.description':
    'Il Masquerade Tracker di questo tavolo, con i pulsanti per il Narratore',
  'masquerade.title': 'Masquerade Tracker',
  'masquerade.threat.title': 'Threat test della Masquerade',
  'willpower.pick': 'Scegli fino a {max} dadi da ritirare (−1 Willpower)',
  'willpower.option': 'Dado {n}: {face}',
  'willpower.spent': '1 Willpower spesa, ritirati: {changes}.',
  'button.cancel': 'Annulla',

  'auth.storytellerOnly':
    'Solo il Narratore della Cronaca giocata in questo canale (o un admin del server) può farlo. Il canale si sceglie nel pannello web (`/elder panel`).',

  // Characters and Chronicles.
  'cmd.sheet.description': 'Mostra la scheda di un personaggio con i pulsanti + e −',
  'opt.sheet.character': 'Il personaggio (predefinito: il tuo a questo tavolo)',
  'opt.sheet.public': 'Mostrala a tutto il canale, senza pulsanti',
  'opt.invite.chronicle': 'La Cronaca (predefinito: quella giocata in questo canale)',
  'cmd.invite.description': 'Invita un giocatore a portare un personaggio nella Cronaca',
  'opt.invite.player': 'Il giocatore',
  'campaign.guildOnly': 'Personaggi e Cronache appartengono a un server: usa il comando lì.',
  'character.noneYet':
    'Non hai ancora personaggi su questo server. Creane uno nel pannello web (`/elder panel`).',
  'character.notFound': 'Personaggio non trovato.',
  'character.pickOne': "Hai più personaggi: scegline uno con l'opzione `character`.",
  'character.cannotEdit':
    'Solo il proprietario, il Narratore della sua Cronaca o un admin del server possono cambiare questo personaggio.',
  'chronicle.invite.invalid': 'Scegli un altro giocatore (non te stesso né un bot).',
  'character.hungerFromVitae':
    "{hunger} dalla Vitae di {name} ({vitae}/{max}). Per cambiarla usa l'opzione `hunger`.",
  'sheet.chronicle': 'Cronaca: {name}',
  'sheet.noChronicle': 'nessuna Cronaca',
  'button.pickCharacter': 'Scegli un personaggio',
  'opt.roll.npc': 'Tiro per un PNG: il pool dalla sua scheda, senza dadi Hunger',
  'opt.roll.attribute': 'Attributo dalla scheda del personaggio',
  'opt.roll.with': 'Cosa va insieme: Skill, specialità, Disciplina, potere, Attributo o lifepath',
  'opt.roll.surge':
    'Blood Surge: spendi Vitae per alzare un Attributo o una Disciplina per la scena',
  'sheetRoll.pool': 'Pool',
  'sheetRoll.mixed':
    'Usa `dice` oppure le opzioni della scheda (`attribute`, `with`, `surge`), non entrambi.',
  'sheetRoll.needPool':
    'Indica la pool: `dice`, oppure `attribute` + `with` dalla scheda del personaggio.',
  'sheetRoll.npc':
    'I tiri dei PNG usano `dice`: le opzioni della scheda sono per i personaggi dei giocatori.',
  'sheetRoll.noCharacter':
    'Nessun personaggio con scheda completa qui: tira nel canale della tua Cronaca o completa la scheda sul pannello. Puoi sempre usare `dice`.',
  'sheetRoll.noSheet':
    '{name} ha solo i tracker: completa la scheda sul pannello per tirare da lì, oppure usa `dice`.',
  'sheetRoll.hint.noCharacter': 'Nessun personaggio con scheda completa qui: usa dice',
  'sheetRoll.hint.noSheet': 'Completa la scheda sul pannello, oppure usa dice',
  'sheetRoll.pickFromList': 'Scegli `{option}` dalla lista suggerita da Discord.',
  'sheetRoll.issue.needAttribute':
    'Scegli un `attribute` (oppure un potere in `with`, che porta il suo).',
  'sheetRoll.issue.needSecond':
    "Scegli cosa va `with` l'Attributo: una Skill, Disciplina, potere, Attributo o lifepath.",
  'sheetRoll.issue.sameAttribute': 'Scegli due Attributi diversi.',
  'sheetRoll.issue.unknownTrait': 'Questo tratto non è sulla scheda: scegline uno dalla lista.',
  'sheetRoll.issue.noPower': 'Il tuo personaggio non conosce questo potere.',
  'sheetRoll.issue.noDiscipline': 'Il tuo personaggio non ha punti in questa Disciplina.',
  'sheetRoll.issue.noSpecialty':
    'Questa specialità non è più sulla scheda: scegli di nuovo dalla lista.',
  'sheetRoll.issue.surgeNoDiscipline': 'Blood Surge richiede almeno 1 punto nella Disciplina.',
  'sheetRoll.issue.surgeLimit': 'Questo Blood Surge supera il limite del tuo tier.',
  'sheetRoll.issue.surgeVitae': 'Non hai abbastanza Vitae per questo Blood Surge.',
  'sheetRoll.surgeSpent': '{name} spende {cost} Vitae: {trait} +{dots} fino alla fine della scena.',
  'sheetRoll.surgeActive': 'Attivo fino alla fine della scena: {list}.',
  'sheetRoll.surgeEnded': 'Blood Surge terminato per {name}.',
  'sheetRoll.impaired': '{attributes} Impaired (Health o Willpower a 0): −{dice} dadi.',
  'sheetRoll.powerAttribute': 'Questo potere di solito usa {attribute}: decide lo Storyteller.',
  'sheetRoll.trackerDiffers':
    '{attribute}: {sheet} sulla scheda, {tracker} sui tracker. Il tiro usa la scheda.',
  'button.surgeEnd': 'Fine Blood Surge',
  'sheetRoll.contest.needOpponent': "Scegli l'`opponent` per tirare dalla sua scheda.",
  'sheetRoll.contest.needOpponentPool':
    "Indica la pool dell'avversario: `opponent_dice`, oppure `opponent_attribute` + `opponent_with` dalla scheda del giocatore avversario.",
  'sheetRoll.contest.needPool':
    'Indica la tua pool: `dice`, oppure `attribute` + `with` dalla scheda.',
  'sheetRoll.hint.pickOpponent': "Scegli prima l'avversario",
  'opt.contest.opponent_with': "Cosa va con l'Attributo del giocatore avversario, dalla sua scheda",
  'opt.contest.surge':
    'Blood Surge: spendi Vitae per alzare un Attributo o una Disciplina per la scena',
  'opt.contest.with': 'Cosa va col tuo Attributo: Skill, specialità, Disciplina, potere, lifepath',
  'button.masqueradeThreat': 'Test di minaccia',
  'button.prolongedCancel': 'Annulla compito',
  'button.willpowerBest': 'Willpower: rilancia i fallimenti',
  'willpower.noFailures': 'Nessun dado normale fallito da rilanciare.',
  'chronicle.noneYet': 'Nessuna Cronaca. Creane una nel pannello web (`/elder panel`).',
  'chronicle.notFound': 'Cronaca non trovata.',
  'chronicle.pickOne': "Gestisci più Cronache: scegline una con l'opzione `chronicle`.",
  'chronicle.storytellerOnly':
    'Solo il Narratore di questa Cronaca o un admin del server può farlo.',
  'chronicle.invite':
    '{user}, {storyteller} ti invita in **{chronicle}**: scegli il personaggio che porti.',
  'chronicle.noFreeCharacter':
    'Tutti i tuoi personaggi sono già in una Cronaca. Creane uno nuovo nel pannello web (`/elder panel`), poi premi di nuovo il pulsante.',
  'chronicle.pickPlaceholder': 'Il tuo personaggio',
  'chronicle.busy': "**{name}** gioca già in un'altra Cronaca.",
  'chronicle.wrongTier': '**{name}** non può entrare: la Cronaca è di livello {tier}.',
  'chronicle.joined.private': '**{name}** entra in {chronicle}.',
  'chronicle.joined': '**{name}** ({user}) entra in {chronicle}.',
  'frenzy.error.noCharacter':
    'Non hai un personaggio a questo tavolo: indica `dice` (Composure + Resolve) e `humanity`.',
  'willpower.none': '**{name}** non ha più Willpower.',
  'willpower.left': '{name}: Willpower {left}/{max}.',

  // Web panel.
  'cmd.panel.description': 'Link al pannello web: i tuoi personaggi e le tue Cronache',
  'panel.link':
    'I tuoi personaggi e le tue Cronache, nel browser. Entra con il tuo account Discord.',
  'panel.open': 'Apri il pannello',
  'panel.notConfigured': 'Il pannello web non è attivo su questo bot.',

  'error.generic': 'Qualcosa è andato storto.',
};
