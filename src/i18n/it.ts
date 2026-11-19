import type { Messages } from './en.js';

// Italian catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Hunger, Painful Failure, Beast's Bargain, ...) stay in English.

export const it: Messages = {
  // Slash command descriptions (names never change).
  'cmd.elder.description': 'Tiri di dado per Vampire: The Masquerade 6e',

  'cmd.roll.description': 'Test: Attributo + Abilità (o Disciplina), successo con 6+, un 10 vale 2',
  'opt.roll.dice': 'Attributo + Abilità, Disciplina o Composure + Resolve',

  'opt.test.difficulty': 'Difficoltà: successi necessari per vincere',
  'opt.test.bonus': 'Dadi bonus (positivi) o penalità (negativi)',
  'opt.test.hunger': 'I tuoi dadi Hunger (0-5): sostituiscono dadi normali del pool',
  'opt.test.take_half': 'Taking Half: niente tiro, metà del pool (per eccesso) come successi',
  'opt.test.reason': 'Cosa stai tentando',

  'cmd.npc.description': 'Test per un PNG: tira il pool indicato nella sua scheda',
  'opt.npc.dice': "Pool del PNG (Fisico, Sociale, Mentale o di un'Abilità)",

  'cmd.contest.description': 'Test contrapposto: vince chi ottiene più successi',
  'opt.contest.dice': 'Il tuo pool',
  'opt.contest.opponent_dice': "Pool dell'avversario",
  'opt.contest.opponent': 'Giocatore avversario',
  'opt.contest.attribute': 'Il tuo Attributo, per i pareggi',
  'opt.contest.opponent_attribute':
    "Attributo dell'avversario, per i pareggi (un PNG: metà del suo pool)",
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
  'cmd.prolonged.status.description': 'Mostra il tuo compito prolungato',
  'cmd.prolonged.cancel.description': 'Chiude il tuo compito prolungato',

  'cmd.session.description': 'Sessioni, Narratore e lingua del tavolo',
  'cmd.session.new.description': 'Nuova sessione: chi la avvia diventa Narratore',
  'cmd.session.end.description':
    'Chiude la sessione: azzera il tavolo e libera il ruolo di Narratore',
  'cmd.session.storyteller.description': 'Mostra o cambia il Narratore di questo canale',
  'opt.session.user': 'Il nuovo Narratore',
  'cmd.session.language.description': 'Lingua delle risposte del bot in questo canale',
  'opt.session.language': 'Lingua del tavolo, o auto per seguire la lingua di Discord di ciascuno',
  'choice.language.auto': 'Auto (lingua di Discord)',

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

  // /elder npc and /elder contest.
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

  // /elder session and the Storyteller.
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
  'cmd.masquerade.description': 'Il Masquerade Tracker di questo tavolo',
  'cmd.masquerade.show.description': 'Mostra il Masquerade Tracker',
  'cmd.masquerade.mark.description': 'Segna caselle dopo una violazione (Narratore)',
  'cmd.masquerade.clear.description':
    'Cancella caselle quando la Masquerade viene riparata (Narratore)',
  'cmd.masquerade.set.description': 'Imposta il tracker a mano (Narratore)',
  'cmd.masquerade.threat.description': 'Threat test: un dado per casella segnata (Narratore)',
  'opt.masquerade.mark': 'Caselle da segnare (predefinito 1)',
  'opt.masquerade.clear': 'Caselle da cancellare (predefinito 1)',
  'opt.masquerade.reason': 'Cosa è successo',
  'opt.masquerade.value': 'Caselle segnate, da 0 a 10',
  'masquerade.title': 'Masquerade Tracker',
  'masquerade.threat.title': 'Threat test della Masquerade',
  'willpower.pick': 'Scegli fino a {max} dadi da ritirare (−1 Willpower)',
  'willpower.option': 'Dado {n}: {face}',
  'willpower.spent': '1 Willpower spesa, ritirati: {changes}.',
  'button.cancel': 'Annulla',

  'auth.storytellerOnly':
    'Solo il Narratore di questo tavolo può farlo. Chi fa `/elder session new` diventa Narratore, e può passare il ruolo con `/elder session storyteller`.',
  'session.storyteller.title': 'Narratore',
  'session.storyteller.current': 'Narratore del tavolo: {who}.',
  'session.storyteller.none': 'nessuno: chi fa `/elder session new` lo diventa',
  'session.storyteller.set': '{user} è il Narratore di questo tavolo.',
  'session.ended.title': 'Sessione chiusa',
  'session.ended':
    'Compiti prolungati e lingua del tavolo azzerati. Il tavolo non ha più un Narratore: il prossimo `/elder session new` ne assegna uno.',
  'session.new.title': 'Nuova sessione',
  'session.new':
    "Il tavolo è pronto. Aggiungi i tuoi dadi Hunger a ogni tiro con l'opzione `hunger`.",
  'session.language.title': 'Lingua',
  'session.language.set': 'Lingua del tavolo: {language}.',
  'session.language.auto': 'Il bot risponde a ciascuno nella sua lingua di Discord.',

  // Characters and Chronicles.
  'cmd.character.description': 'I tuoi personaggi: scheda e tracciati',
  'cmd.character.create.description': 'Crea un personaggio con Health, Vitae e Willpower pieni',
  'opt.character.name': 'Nome del personaggio',
  'opt.character.clan': 'Clan',
  'opt.character.tier': 'Livello di gioco: decide la Vitae massima e i dadi Hunger',
  'opt.character.stamina': 'Stamina: Health = Stamina + 5',
  'opt.character.composure': 'Composure: Willpower = Composure + Resolve',
  'opt.character.resolve': 'Resolve: Willpower = Composure + Resolve',
  'opt.character.humanity': 'Grado di Humanity (predefinito 6)',
  'cmd.character.sheet.description': 'Mostra la scheda di un personaggio con i pulsanti + e −',
  'opt.character.pick': 'Il personaggio (predefinito: il tuo a questo tavolo)',
  'opt.character.public': 'Mostrala a tutto il canale, senza pulsanti',
  'cmd.character.list.description': 'I tuoi personaggi su questo server',
  'cmd.character.set.description': 'Imposta un tracciato a un valore preciso',
  'opt.character.track': 'Tracciato',
  'opt.character.value': 'Nuovo valore (resta nei limiti)',
  'cmd.character.edit.description': 'Cambia nome, clan, livello o Attributi',
  'opt.character.newName': 'Nuovo nome',
  'cmd.character.give.description': 'Passa uno dei tuoi personaggi a un altro giocatore',
  'opt.character.giveTo': 'Il giocatore che lo riceve',
  'cmd.character.delete.description': 'Cancella uno dei tuoi personaggi',
  'cmd.chronicle.description': 'Cronache: giocatori, Masquerade Tracker e quella in onda',
  'cmd.chronicle.create.description': 'Crea una Cronaca: ne sei il Narratore',
  'opt.chronicle.name': 'Nome della Cronaca',
  'opt.chronicle.sect': 'Setta mostrata sulla cornice del Narratore',
  'cmd.chronicle.list.description': 'Le tue Cronache e i loro personaggi',
  'cmd.chronicle.live.description': "Mette in onda una Cronaca: l'overlay mostra le sue cornici",
  'opt.chronicle.pick': 'La Cronaca (predefinito: quella giocata in questo canale)',
  'cmd.chronicle.invite.description': 'Invita un giocatore a portare un personaggio nella Cronaca',
  'opt.chronicle.player': 'Il giocatore',
  'cmd.chronicle.remove.description': 'Toglie un personaggio dalla sua Cronaca',
  'opt.chronicle.character': 'Il personaggio',
  'cmd.chronicle.edit.description': 'Rinomina una Cronaca o ne cambia la setta',
  'opt.chronicle.newName': "Nuovo nome (i link dell'overlay continuano a funzionare)",
  'cmd.chronicle.archive.description': 'Nasconde una Cronaca e libera i suoi personaggi',
  'opt.session.chronicle': 'Cronaca giocata in questo canale: va anche in onda',
  'campaign.guildOnly': 'Personaggi e Cronache appartengono a un server: usa il comando lì.',
  'character.badName':
    'Il nome deve avere almeno una lettera o una cifra e al massimo 32 caratteri.',
  'character.duplicate': "C'è già un personaggio con quel nome.",
  'character.limit': 'Puoi avere al massimo {max} personaggi su questo server.',
  'character.created': '**{name}** è pronto. Con `/elder character sheet` lo rivedi.',
  'character.list.title': 'I tuoi personaggi',
  'character.noneYet':
    'Non hai ancora personaggi su questo server. Creane uno con `/elder character create`.',
  'character.notFound': 'Personaggio non trovato.',
  'character.pickOne': "Hai più personaggi: scegline uno con l'opzione `character`.",
  'character.cannotEdit':
    'Solo il proprietario, il Narratore della sua Cronaca o un admin del server possono cambiare questo personaggio.',
  'character.ownerOnly': 'Solo il proprietario può farlo.',
  'character.editNothing': "Niente da cambiare: compila almeno un'opzione.",
  'character.delete.confirm': 'Cancellare **{name}** e il suo storico? Non si può annullare.',
  'character.deleted': '**{name}** è stato cancellato.',
  'character.give.invalid': 'Scegli un altro giocatore (non te stesso né un bot).',
  'character.give.offer': '{from} vuole passare **{name}** a {to}.',
  'character.give.done': '**{name}** ora appartiene a {to}.',
  'character.give.refused': '{to} non ha accettato **{name}**.',
  'character.hungerFromVitae':
    "{hunger} dalla Vitae di {name} ({vitae}/{max}). Per cambiarla usa l'opzione `hunger`.",
  'sheet.chronicle': 'Cronaca: {name}',
  'sheet.noChronicle': 'nessuna Cronaca',
  'button.delete': 'Cancella',
  'button.accept': 'Accetta',
  'button.refuse': 'Rifiuta',
  'button.pickCharacter': 'Scegli un personaggio',
  'chronicle.created':
    "Cronaca creata, ne sei il Narratore. Id per l'overlay: `{slug}`. Invita i giocatori con `/elder chronicle invite` e giocala in un canale con `/elder session new chronicle:`.",
  'chronicle.duplicate': "C'è già una Cronaca con quel nome su questo server.",
  'chronicle.limit': 'Puoi gestire al massimo {max} Cronache insieme: prima archiviane una.',
  'chronicle.list.title': 'Cronache',
  'chronicle.live.badge': 'in onda',
  'chronicle.live.set': '**{name}** è in onda.',
  'chronicle.members': 'personaggi: {count}',
  'chronicle.noneYet': 'Nessuna Cronaca. Creane una con `/elder chronicle create`.',
  'chronicle.notFound': 'Cronaca non trovata.',
  'chronicle.pickOne': "Gestisci più Cronache: scegline una con l'opzione `chronicle`.",
  'chronicle.storytellerOnly':
    'Solo il Narratore di questa Cronaca o un admin del server può farlo.',
  'chronicle.notMember': 'Quel personaggio non è in una Cronaca.',
  'chronicle.removed': '**{name}** lascia {chronicle}.',
  'chronicle.archived': '**{name}** è archiviata: il suo canale e i suoi personaggi sono liberi.',
  'chronicle.invite':
    '{user}, {storyteller} ti invita in **{chronicle}**: scegli il personaggio che porti.',
  'chronicle.noFreeCharacter':
    'Tutti i tuoi personaggi sono già in una Cronaca. Creane uno nuovo con `/elder character create`, poi premi di nuovo il pulsante.',
  'chronicle.pickPlaceholder': 'Il tuo personaggio',
  'chronicle.busy': "**{name}** gioca già in un'altra Cronaca.",
  'chronicle.joined.private': '**{name}** entra in {chronicle}.',
  'chronicle.joined': '**{name}** ({user}) entra in {chronicle}.',
  'session.new.chronicle':
    'Cronaca: **{name}**. I dadi Hunger arrivano dalla Vitae di ogni personaggio.',
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
