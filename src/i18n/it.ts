import type { Messages } from './en.js';

// Italian catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Quickening, Drama, Painful Failure, Devil's Bargain, ...) stay in English.

export const it: Messages = {
  'cmd.elder.description': 'Tiri e risorse di Vampire: The Masquerade 6e',

  'cmd.roll.description': 'Test: Attributo + Abilità (o Disciplina) − Difficoltà, successo con 8+',
  'opt.roll.dice': 'Attributo + Abilità, Disciplina o Composure + Resolve',

  'opt.test.difficulty': 'Difficoltà: dadi da togliere al pool',
  'opt.test.bonus': 'Dadi bonus (positivi) o penalità (negativi)',
  'opt.test.quickening': 'Quickening da spendere: +1 dado ciascuno',
  'opt.test.combat': 'Test di attacco o difesa: niente Overqualified',
  'opt.test.reason': 'Cosa stai tentando',
  'opt.test.ignore_traits': 'Non applicare gli scene trait del Drama',

  'cmd.npc.description': 'Test per un PNG controllato da te: pool = 2 × Livello PNG',
  'opt.npc.level': 'Livello del PNG',

  'cmd.contest.description': 'Test contrapposto: vince chi ottiene più successi',
  'opt.contest.dice': 'Il tuo pool',
  'opt.contest.opponent_dice': "Pool dell'avversario (PG)",
  'opt.contest.opponent_npc_level': "Livello dell'avversario PNG: tira 2 × Livello",
  'opt.contest.opponent': 'Giocatore avversario: riceve il Quickening dei suoi 10',
  'opt.contest.attribute': 'Il tuo Attributo, per i pareggi tra PG',
  'opt.contest.opponent_attribute': "Attributo dell'avversario PG, per i pareggi",
  'opt.contest.difficulty': 'Solo se competete contro lo stesso ostacolo: tolta a entrambi',
  'opt.contest.reason': 'Posta in gioco',

  'cmd.prolonged.description': 'Test prolungato: somma i successi di più tiri',
  'cmd.prolonged.start.description': 'Apre un test prolungato',
  'opt.prolonged.name': 'Il compito',
  'opt.prolonged.target': 'Successi richiesti',
  'opt.prolonged.tests': 'Tiri disponibili',
  'choice.prolonged.target': '{count} successi',
  'choice.prolonged.tests': '{count} tiri',
  'cmd.prolonged.roll.description': 'Tira per il tuo test prolungato',
  'opt.prolonged.dice': 'Attributo + Abilità',
  'opt.prolonged.difficulty': 'Difficoltà',
  'opt.prolonged.bonus': 'Dadi bonus o penalità',
  'opt.prolonged.quickening': 'Quickening da spendere',
  'cmd.prolonged.status.description': 'Mostra il tuo test prolungato',
  'cmd.prolonged.cancel.description': 'Chiude il tuo test prolungato',

  'cmd.quickening.description':
    'Il tuo Quickening in questo canale (massimo 5, si azzera a fine sessione)',
  'cmd.quickening.show.description': 'Mostra il Quickening',
  'cmd.quickening.add.description':
    'Aggiunge Quickening (oltre 5 si segnano caselle Beast o Nature)',
  'cmd.quickening.spend.description': 'Spende Quickening, ad esempio per dare dadi a un alleato',
  'cmd.quickening.success.description':
    "Compra un successo base: 3 Quickening, o 5 se non hai pallini nell'Abilità",
  'cmd.quickening.set.description': 'Corregge il valore a mano',
  'opt.quickening.player': 'Un altro giocatore',
  'opt.quickening.amount': 'Quanti',
  'opt.quickening.reason': 'Per cosa',
  'opt.quickening.skill_dots': "Hai almeno 1 pallino nell'Abilità?",
  'opt.quickening.value': 'Nuovo valore',

  'cmd.drama.description': 'Drama del Narratore in questo canale',
  'cmd.drama.show.description': 'Mostra il Drama e gli scene trait attivi',
  'cmd.drama.add.description': 'Aggiunge Drama',
  'cmd.drama.spend.description': 'Spende Drama',
  'cmd.drama.trait.description':
    'Crea uno scene trait (2 Drama): bonus o penalità a tutti i tiri della scena',
  'cmd.drama.clear_traits.description': 'Rimuove gli scene trait',
  'opt.drama.amount': 'Quanto',
  'opt.drama.add_reason': 'Perché',
  'opt.drama.spend_reason': 'Per cosa',
  'opt.drama.name': 'Ad esempio "Pioggia battente"',
  'opt.drama.modifier': 'Da -3 a +3 dadi',

  'cmd.session.description': 'Inizio di sessione o di scena',
  'cmd.session.new.description': 'Nuova sessione: Quickening a 0, Drama = 1 per PG',
  'opt.session.player_characters': 'Numero di PG al tavolo',
  'cmd.session.scene.description':
    "Nuova scena: rimuove gli scene trait e rende di nuovo disponibile il Devil's Bargain",
  'cmd.session.end.description':
    'Chiude la sessione: azzera il tavolo e libera il ruolo di Narratore',
  'cmd.session.storyteller.description': 'Mostra o cambia il Narratore di questo canale',
  'opt.session.user': 'Il nuovo Narratore',
  'cmd.session.language.description': 'Lingua delle risposte del bot in questo canale',
  'opt.session.language': 'Lingua del tavolo, o auto per seguire la lingua di Discord di ciascuno',
  'choice.language.auto': 'Auto (lingua di Discord)',

  'roll.title': 'Test',
  'roll.retryTitle': '{title} (Try again)',
  'roll.field.dice': 'Dadi',
  'roll.field.outcome': 'Esito',
  'dice.count.one': '{count} dado',
  'dice.count.other': '{count} dadi',
  'roll.successes.one': '{count} successo',
  'roll.successes.other': '{count} successi',
  'roll.extra': '{count} extra',
  'pool.bonus': 'bonus',
  'pool.difficulty': '− Difficoltà {n}',
  'pool.quickening': '+ {n} Quickening',
  'pool.total.one': '= **{count}** dado',
  'pool.total.other': '= **{count}** dadi',
  'quickening.gained': '+{gained} Quickening dai 10 (ora {total}/{max})',
  'quickening.overflow.one':
    'Quickening al massimo: segna {count} casella sul tracker Beast o Nature.',
  'quickening.overflow.other':
    'Quickening al massimo: segna {count} caselle sul tracker Beast o Nature.',
  'roll.error.quickening': 'Hai solo {available} Quickening: non puoi spenderne {requested}.',
  'roll.overqualified':
    'Restano 4 o più dadi dopo la Difficoltà: puoi prendere un successo base senza tirare (niente successi extra), oppure tirare.',
  'roll.noDice':
    "La Difficoltà ha azzerato il pool. Scegli:\n- **Accetta il fallimento**: racconta come le cose si complicano, +1 Quickening a te e +1 Drama al Narratore\n- **Cerca vantaggi**: aiuti, strumenti o posizione che ti danno dadi extra, poi ritira\n- **Aiuta qualcuno** con l'azione assist",
  'roll.retryNote': 'Secondo tentativo: Difficoltà +1, ogni fallimento è un Painful Failure.',

  'button.takeBasic': 'Prendi il successo base',
  'button.roll': 'Tira',
  'button.acceptFailure': 'Accetta il fallimento',
  'button.acceptBargain': 'Accetta il bargain',
  'button.rejectBargain': 'Rifiuta il bargain',
  'button.alreadyUsed': 'Questo pulsante è già stato usato.',
  'button.notYours': 'Solo chi ha tirato può usare questo pulsante.',

  'pain.option.vitae': 'Perdi 3 Vitae o Willpower (a tua scelta)',
  'pain.option.quickening': 'Perdi tutto il tuo Quickening (non se ne hai 0)',
  'pain.option.beast': 'Segna 1 casella sul tracker Beast',
  'pain.option.drama': 'Dai 1 Drama al Narratore',
  'pain.label.vitae': 'Perdi 3 Vitae/Willpower',
  'pain.label.quickening': 'Perdi tutto il Quickening',
  'pain.label.beast': 'Segna Beast',
  'pain.label.drama': 'Dai 1 Drama',
  'pain.result.vitae': '{player} perde 3 Vitae o Willpower.',
  'pain.result.quickening': '{player} perde tutto il Quickening.',
  'pain.result.beast': '{player} segna 1 casella sul tracker Beast.',
  'pain.result.drama': '{player} dà 1 Drama al Narratore.',
  'pain.noQuickening': 'Non hai Quickening da perdere: scegli un altro prezzo.',
  'pain.drama': 'Drama del Narratore: ora {drama}.',
  'pain.sheet': 'Aggiornalo sulla scheda del personaggio.',

  'overqualified.taken': '**Success** · successo base senza tirare (Overqualified)',
  'noDice.accepted': '**Failure** accettato: racconta come la situazione si complica.',
  'noDice.quickening': '+1 Quickening (ora {value}/{max}).',
  'noDice.drama': '+1 Drama al Narratore (ora {drama}).',
  'bargain.storytellerAnswers': 'Il bargain lo accetta o rifiuta il Narratore.',
  'bargain.alreadyUsed': "Hai già proposto un Devil's Bargain in questa scena.",
  'bargain.offer':
    'Proposta: una complicazione in cambio di un successo base. Il Narratore accetta (+1 Drama) o rifiuta spendendo 1 Drama.',
  'bargain.accepted.title': 'Bargain accettato',
  'bargain.accepted':
    '**Success** (successo base) con la complicazione concordata. +1 Drama al Narratore (ora {drama}).',
  'bargain.noDrama': 'Il Narratore non ha Drama: per rifiutare deve spenderne 1.',
  'bargain.rejected.title': 'Bargain rifiutato',
  'bargain.rejected': 'Il Narratore spende 1 Drama (ora {drama}). Il fallimento resta.',
  'retry.modal.title': 'Try again: Difficoltà +1',
  'retry.modal.dice': 'Nuovo pool (cambia Attributo o Abilità)',
  'retry.modal.quickening': 'Quickening da spendere',
  'retry.modal.invalid': 'Inserisci numeri interi: pool da 0 a 30, Quickening da 0 a 5.',

  'npc.name': 'PNG di Livello {level}',
  'contest.error.pool':
    'Indica il pool avversario con `opponent_dice` (PG) oppure `opponent_npc_level` (PNG), non entrambi.',
  'contest.opponent': 'Avversario',
  'contest.title': '{a} contro {b}',
  'contest.result': 'Risultato',
  'contest.win': 'Vince **{winner}**.',
  'contest.tie.attribute': "Pareggio: vince **{winner}** per l'Attributo più alto.",
  'contest.tie.npc':
    'Pareggio contro un PNG: vince chi ha iniziato la sfida, oppure decide il Narratore.',
  'contest.tie.storyteller':
    "Pareggio: il Narratore assegna la vittoria all'Attributo più alto o a chi ha iniziato la sfida.",

  'prolonged.none':
    'Non hai un test prolungato aperto in questo canale. Usa `/elder prolonged start`.',
  'prolonged.cancelled': 'Test prolungato "{name}" chiuso.',
  'prolonged.noDice':
    'La Difficoltà ha azzerato il pool: cerca vantaggi che ti diano dadi extra, o fatti aiutare. Il tiro non è stato contato.',
  'prolonged.painful': 'Il tiro conta comunque, ma devi Choose Your Pain.',
  'prolonged.completed': 'Completato!',
  'prolonged.failed': 'Tiri esauriti: compito fallito.',
  'prolonged.progress': 'Successi **{successes}/{target}** · tiri usati **{done}/{max}**',

  'quickening.notEnough': 'Hai {current} Quickening, ne servono {cost}.',
  'quickening.spentSuccess': '{player} spende {cost} Quickening per un **successo base**',
  'quickening.spent': '{player} spende {cost} Quickening{reason}',
  'quickening.left': 'Restano **{left}/{max}**.\nSi spende prima di tirare.',

  'drama.activeTraits': 'Scene trait attivi:',
  'drama.trait': '- {name}: {modifier} dadi',
  'drama.max': 'massimo {max}',
  'drama.added': '+{amount} Drama{reason}. Ora **{now}**{cap}.',
  'drama.traitsCleared': 'Scene trait rimossi.',
  'drama.traitLimit': 'Ci sono già {max} scene trait: rimuovili con `/elder drama clear_traits`.',
  'drama.notEnough': 'Il Narratore ha {current} Drama, ne servono {cost}.',
  'drama.traitCreated':
    '**{name}**: {modifier} dadi a tutti i `/elder roll` della scena (chi non è coinvolto usa `ignore_traits`).\nDrama rimasto: **{left}**.',
  'drama.spent': 'Il Narratore spende {cost} Drama{reason}. Restano **{left}**.',

  'auth.storytellerOnly':
    'Solo il Narratore di questo tavolo può farlo. Chi fa `/elder session new` diventa Narratore, e può passare il ruolo con `/elder session storyteller`.',
  'session.storyteller.title': 'Narratore',
  'session.storyteller.current': 'Narratore del tavolo: {who}.',
  'session.storyteller.none': 'nessuno: chi fa `/elder session new` lo diventa',
  'session.storyteller.set': '{user} è il Narratore di questo tavolo.',
  'session.ended.title': 'Sessione chiusa',
  'session.ended':
    'Quickening, Drama, scene trait, bargain, test prolungati e lingua del tavolo azzerati. Il tavolo non ha più un Narratore: il prossimo `/elder session new` lo assegna.',
  'session.new.title': 'Nuova sessione',
  'session.new': 'Quickening di tutti a 0, Drama del Narratore a **{pcs}**, scene trait rimossi.',
  'session.scene.title': 'Nuova scena',
  'session.scene': "Scene trait rimossi, Devil's Bargain di nuovo disponibile per tutti.",
  'session.language.title': 'Lingua',
  'session.language.set': 'Lingua del tavolo: {language}.',
  'session.language.auto': 'Il bot risponde a ciascuno nella sua lingua di Discord.',

  'error.generic': 'Qualcosa è andato storto.',
};
