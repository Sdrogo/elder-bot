/* global document, fetch, location, navigator, history, setTimeout, clearTimeout, URLSearchParams */
// Guided character creation (Alpha 2.0). The rules engine is the server's own code, loaded from
// /game/: the page asks it what is allowed and what is left, and saves the sheet as a draft.
// Every text goes in with textContent: names come from users.

import {
  attributeDots,
  clanOptions,
  clanTraitOptions,
  disciplineRoom,
  emptyDraft,
  evaluate,
  lifepathCount,
  lifepathOptions,
  meritOptions,
  pathOptions,
  powerOptions,
  ranksFit,
  sireDisciplineOptions,
  sireOptions,
  skillDots,
  specialtySlots,
  youngAllowed,
} from '/game/creation.js';
import {
  FLAWS,
  LIFEPATHS,
  LIFEPATHS_BY_ID,
  MERITS_BY_ID,
  PATHS,
  SIRES_BY_ID,
} from '/game/alpha2/background.js';
import { CLAN_INFO, CLAN_TRAITS_BY_ID } from '/game/alpha2/clans.js';
import {
  ATTRIBUTE_CATEGORIES,
  ATTRIBUTE_NAMES,
  ATTRIBUTES_BY_CATEGORY,
  RESOURCE_INFO,
  RESOURCE_KINDS,
  SKILL_INFO,
  SKILLS,
} from '/game/alpha2/core.js';
import { DISCIPLINE_NAMES, POWERS_BY_ID } from '/game/alpha2/disciplines.js';
import { CREATION_TIERS } from '/game/alpha2/prereq.js';
import {
  LIFEPATH_RESOURCE_DOTS,
  LIFEPATH_SKILL_DOTS,
  TIER_RULES,
  YOUNG_EXTRA_RESOURCES,
  YOUNG_EXTRA_SKILLS,
  YOUNG_MAX_SKILL,
} from '/game/alpha2/tiers.js';

const TEXT = {
  it: {
    back: '← Pannello',
    error: 'Qualcosa è andato storto. Ricarica la pagina.',
    notFound: 'Bozza non trovata: ne parte una nuova.',
    limit: 'Hai già il numero massimo di bozze: eliminane una dal pannello.',
    'save.saved': 'Bozza salvata',
    'save.dirty': 'Modifiche da salvare…',
    'save.saving': 'Salvataggio…',
    'save.error': 'Salvataggio non riuscito: riprovo alla prossima modifica.',
    'save.new': 'Bozza non ancora salvata',
    'step.type': 'Tipo',
    'step.clan': 'Clan',
    'step.sire': 'Sire',
    'step.lifepaths': 'Lifepath',
    'step.attributes': 'Attributi',
    'step.skills': 'Skill',
    'step.disciplines': 'Discipline',
    'step.traits': 'Tratti di clan',
    'step.merits': 'Merit',
    'step.humanity': 'Humanity',
    'step.resources': 'Resources',
    'step.details': 'Dettagli',
    'disc.title': 'Discipline e poteri',
    'disc.note': (t) =>
      `Hai ${t.clanDisciplineDots} punti nelle Discipline del clan${t.extraDisciplineDots ? ` (fino a ${t.extraDisciplineDots} anche fuori clan)` : ''}, più il punto gratis del Sire. Massimo ${t.startDiscipline} punti per Disciplina. Ogni punto dà un potere, di rango non più alto dei punti.`,
    'disc.inClan': 'del clan',
    'disc.outClan': 'fuori clan',
    'disc.sire': 'punto del Sire',
    'disc.noPowers': 'Nel playtest questa Disciplina non ha ancora poteri.',
    'traits.title': (n) => (n === 1 ? 'Scegli 1 tratto di clan' : `Scegli ${n} tratti di clan`),
    'traits.note': 'Alcuni tratti chiedono punti in una Disciplina o un livello più alto.',
    'traits.noClan': 'Scegli prima un clan.',
    'merits.title': (n) => (n === 1 ? 'Scegli 1 Merit' : `Scegli ${n} Merit`),
    'merits.note': 'Alcuni Merit chiedono punti in una Disciplina o un livello più alto.',
    'hum.title': 'Humanity o un Path',
    'hum.note':
      'Si parte con Humanity 6. Un Path of Enlightenment sostituisce Humanity e serve l’approvazione del Narratore.',
    'hum.humanity': 'La strada di quasi tutti i vampiri: restare legati alla propria umanità.',
    'res.title': 'Resources',
    'res.note': (n, max) =>
      `Ai punti dei lifepath si aggiungono ${n} punti da mettere dove vuoi. La stessa Resource da più fonti si somma, fino a ${max} punti.`,
    'res.fromLifepaths': 'Dai lifepath',
    'res.none': 'Nessun punto messo nelle Resources dei lifepath.',
    'res.extra': 'Resources extra',
    'res.add': 'Aggiungi Resource',
    'details.title': 'Nome, Flaws e creazione',
    'details.note': (n) =>
      `Servono almeno ${n} Flaw: scegline uno dagli esempi o scrivine uno tuo.`,
    'details.name': 'Nome del personaggio',
    'details.flaw': 'Flaw',
    'details.flawNote': 'Nota (facoltativa)',
    'details.addFlaw': 'Aggiungi Flaw',
    'create.title': 'Crea il personaggio',
    'create.server': 'Server Discord',
    'create.button': 'Crea il personaggio',
    'create.completeButton': 'Completa la scheda',
    'create.complete': (name) => `La scheda completerà ${name}, che hai già sul bot.`,
    'create.notYet': 'Il bottone si attiva quando non resta niente da sistemare.',
    'create.approvals': (list) => `Il Narratore dovrà approvare: ${list}.`,
    'create.noServer':
      'Il bot non è in nessun server con te: aggiungilo prima di creare il personaggio.',
    'create.duplicate': 'Hai già un personaggio con questo nome su quel server.',
    'create.limit': 'Hai già il numero massimo di personaggi su quel server.',
    'create.failed': 'Creazione non riuscita: controlla la scheda e riprova.',
    'create.tier':
      'Il personaggio è in una Cronaca di un altro livello: scegli il livello della Cronaca.',
    'side.disciplines': 'Discipline',
    'side.outOfClan': 'di cui fuori clan',
    'side.powers': 'Poteri',
    'side.traits': 'Tratti di clan',
    'side.merits': 'Merit',
    'side.extraResources': 'Resources extra',
    'reason.rank': (r) => `Serve almeno ${r.rank} punti nella Disciplina.`,
    'reason.curse': (r) => `Solo con la maledizione ${r.curse}.`,
    'reason.clan': 'Di un altro clan.',
    prev: '← Indietro',
    next: 'Avanti →',
    'type.title': 'Che personaggio vuoi creare?',
    'type.note':
      'Il livello lo scegli tu. Quando il personaggio entrerà in una Cronaca, dovrà avere lo stesso livello della Cronaca.',
    'type.name': 'Nome (puoi cambiarlo dopo)',
    'type.young': 'Personaggio giovane',
    'type.youngNote': `Un solo lifepath, ${YOUNG_EXTRA_SKILLS} punti Skill e ${YOUNG_EXTRA_RESOURCES} punti Resource in più, nessuna Skill oltre ${YOUNG_MAX_SKILL}.`,
    'tier.duskborn': 'Sangue debole, a metà tra vivi e morti.',
    'tier.neonate': 'Vampiro giovane, appena entrato nella società dei Fratelli.',
    'tier.ancilla': 'Vampiro affermato, con secoli o decenni alle spalle.',
    'tier.elder': 'Antico e potente, molto vicino agli Antidiluviani.',
    'tier.sum': (t) =>
      `${t.lifepaths} lifepath · Attributi ${t.attributes.join('/')} · Discipline ${t.clanDisciplineDots}+1${t.extraDisciplineDots ? ` (+${t.extraDisciplineDots} fuori clan)` : ''} · ${t.powers} poteri · ${t.merits} Merit · ${t.clanTraits} tratti di clan`,
    'clan.title': 'Scegli il clan',
    'clan.note':
      'Si possono scegliere solo i clan completi nel playtest: gli altri sono ancora in sviluppo.',
    'clan.choice': 'Terza Disciplina del clan',
    'clan.curse': 'Maledizione',
    'clan.beast': 'Bestia',
    'sire.title': 'Chi è il tuo Sire?',
    'sire.note':
      'Il Sire ti insegna una Disciplina: il suo punto è gratis e si aggiunge agli altri.',
    'sire.discipline': 'Disciplina insegnata',
    'sire.broodmate': 'Compagno di covata che ti insegna la Disciplina',
    'sire.approval': 'Serve l’approvazione del Narratore e del compagno di coterie.',
    'sire.generation': 'Generazione',
    'sire.anyDiscipline': 'Qualsiasi Disciplina di clan del tuo compagno di covata.',
    'lp.title': (n) => (n === 1 ? 'Scegli 1 lifepath' : `Scegli ${n} lifepath`),
    'lp.note': (skill, res) =>
      `Ogni lifepath dà ${skill} punti tra le sue Skill e ${res} punti tra le sue Resources.`,
    'lp.add': 'Aggiungi',
    'lp.remove': 'Togli',
    'reason.full': 'Hai già tutti i lifepath.',
    'lp.skills': 'Skill',
    'lp.resources': 'Resources',
    'lp.detail': 'Di cosa si tratta?',
    'lp.chosen': 'I tuoi lifepath',
    'lp.all': 'Tutti i lifepath',
    'lp.choose': 'a scelta',
    'group.mortal': 'Da mortale',
    'group.neonate': 'Da Neonate',
    'group.ancilla': 'Da Ancilla',
    'attr.title': 'Attributi',
    'attr.note':
      'Ogni Attributo parte da 1. Ordina le tre categorie: la prima riceve più punti, l’ultima meno.',
    'attr.rank': ['Prima', 'Seconda', 'Terza'],
    'skills.title': 'Skill e specialità',
    'skills.note': (n) =>
      `Oltre ai punti dei lifepath hai ${n} punti da mettere dove vuoi. Ricevi una specialità a 1, 3 e 5 punti, e una in più se due lifepath danno punti alla stessa Skill.`,
    'skills.fromLifepaths': 'dai lifepath',
    'skills.extra': 'extra',
    'skills.specialty': 'Specialità',
    'cat.physical': 'Fisici',
    'cat.social': 'Sociali',
    'cat.mental': 'Mentali',
    'side.points': 'Punti',
    'side.derived': 'Tracciati',
    'side.extraSkills': 'Skill extra',
    'side.lifepathSkills': (name) => `${name}: Skill`,
    'side.lifepathResources': (name) => `${name}: Resources`,
    'side.issues': 'Da sistemare',
    'side.allGood': 'Tutto a posto in questi passi.',
    'reason.tier': (r) => `Serve il livello ${cap(r.min)} o superiore.`,
    'reason.creature': 'Non per questo tipo di personaggio.',
    'reason.incomplete': 'Ancora in sviluppo nel playtest.',
    'reason.taken': 'Già scelto.',
    'reason.budget': 'Nessun punto rimasto.',
    'reason.storyteller': 'Serve l’approvazione del Narratore.',
    issue: {
      'clan-missing': 'Scegli un clan.',
      'clan-incomplete': 'Questo clan è ancora in sviluppo nel playtest.',
      'clan-choice-missing': 'Scegli la terza Disciplina del clan.',
      'sire-missing': 'Scegli il tipo di Sire.',
      'sire-unknown': 'Sire sconosciuto.',
      'sire-discipline-missing': 'Scegli la Disciplina insegnata dal Sire.',
      'sire-discipline-not-allowed': (i) => `Questo Sire non insegna ${nameOf(i.target)}.`,
      'discipline-without-powers': (i) => `${nameOf(i.target)} non ha ancora poteri nel playtest.`,
      'broodmate-missing': 'Indica il compagno di covata.',
      'generation-missing': 'Generazione non ancora scelta.',
      'generation-out-of-range': 'Generazione fuori dai limiti del livello.',
      'young-not-allowed': 'Solo Duskborn e Neonate possono essere giovani.',
      'lifepaths-missing': (i) => `Lifepath scelti: ${i.value} di ${i.limit}.`,
      'lifepaths-too-many': (i) => `Troppi lifepath: ${i.value} su ${i.limit}.`,
      'lifepath-repeated': 'Lo stesso lifepath due volte.',
      'lifepath-tier': (i) => `${nameOf(i.target)} non è per questo livello.`,
      'lifepath-skills-left': (i) => `${nameOf(i.target)}: ${left(i)} punti Skill da mettere.`,
      'lifepath-skills-over': (i) => `${nameOf(i.target)}: ${over(i)} punti Skill di troppo.`,
      'lifepath-resources-left': (i) =>
        `${nameOf(i.target)}: ${left(i)} punti Resource da mettere.`,
      'lifepath-resources-over': (i) => `${nameOf(i.target)}: ${over(i)} punti Resource di troppo.`,
      'skill-not-in-lifepath': 'Punti in una Skill che il lifepath non ha.',
      'priority-missing': 'Ordina le categorie di Attributi.',
      'attributes-left': (i) => `Attributi ${nameOf(i.target)}: ${left(i)} punti da mettere.`,
      'attributes-over': (i) => `Attributi ${nameOf(i.target)}: ${over(i)} punti di troppo.`,
      'attribute-max': (i) => `${nameOf(i.target)} oltre il massimo di ${i.limit}.`,
      'extra-skills-left': (i) => `${left(i)} punti Skill extra da mettere.`,
      'extra-skills-over': (i) => `${over(i)} punti Skill extra di troppo.`,
      'skill-max': (i) => `${nameOf(i.target)} oltre il massimo di ${i.limit}.`,
      'specialties-too-many': (i) => `${nameOf(i.target)}: troppe specialità.`,
      'specialties-free': (i) => `${nameOf(i.target)}: ${left(i)} specialità da scegliere.`,
      'discipline-max': (i) => `${nameOf(i.target)} oltre il massimo di ${i.limit}.`,
      'powers-rank': (i) => `${nameOf(i.target)}: poteri di rango troppo alto per i punti.`,
      'powers-missing': (i) => `${nameOf(i.target)}: ${left(i)} poteri da scegliere.`,
      'sire-dot-missing': (i) =>
        `Metti almeno un punto in ${nameOf(i.target)}, la Disciplina del Sire.`,
      'out-of-clan': (i) => `Troppi punti fuori clan: ${i.value} su ${i.limit}.`,
      'disciplines-left': (i) => `${left(i)} punti Disciplina da mettere.`,
      'disciplines-over': (i) => `${over(i)} punti Disciplina di troppo.`,
      'powers-left': (i) => `${left(i)} poteri da scegliere.`,
      'powers-over': (i) => `${over(i)} poteri di troppo.`,
      'power-repeated': 'Lo stesso potere due volte.',
      'clan-traits-left': (i) => `${left(i)} tratti di clan da scegliere.`,
      'clan-traits-over': (i) => `${over(i)} tratti di clan di troppo.`,
      'merits-left': (i) => `${left(i)} Merit da scegliere.`,
      'merits-over': (i) => `${over(i)} Merit di troppo.`,
      prereq: (i) => `${nameOf(i.target)}: requisiti non più soddisfatti.`,
      'other-clan': (i) => `${nameOf(i.target)} è di un altro clan.`,
      repeated: (i) => `${nameOf(i.target)} scelto due volte.`,
      'extra-resources-left': (i) => `${left(i)} punti Resource extra da mettere.`,
      'extra-resources-over': (i) => `${over(i)} punti Resource extra di troppo.`,
      'resource-detail-missing': (i) => `${nameOf(i.target)}: scrivi di cosa si tratta.`,
      'resource-max': (i) => `${nameOf(i.target)} oltre il massimo di ${i.limit}.`,
      'flaws-missing': (i) => `Flaw scelti: ${i.value} di ${i.limit}.`,
      'name-missing': 'Dai un nome al personaggio.',
      negative: 'Un valore sotto zero.',
    },
  },
  en: {
    back: '← Panel',
    error: 'Something went wrong. Reload the page.',
    notFound: 'Draft not found: starting a new one.',
    limit: 'You already have the maximum number of drafts: delete one from the panel.',
    'save.saved': 'Draft saved',
    'save.dirty': 'Unsaved changes…',
    'save.saving': 'Saving…',
    'save.error': 'Saving failed: trying again on the next change.',
    'save.new': 'Draft not saved yet',
    'step.type': 'Type',
    'step.clan': 'Clan',
    'step.sire': 'Sire',
    'step.lifepaths': 'Lifepaths',
    'step.attributes': 'Attributes',
    'step.skills': 'Skills',
    'step.disciplines': 'Disciplines',
    'step.traits': 'Clan traits',
    'step.merits': 'Merits',
    'step.humanity': 'Humanity',
    'step.resources': 'Resources',
    'step.details': 'Details',
    'disc.title': 'Disciplines and powers',
    'disc.note': (t) =>
      `You have ${t.clanDisciplineDots} dots in clan Disciplines${t.extraDisciplineDots ? ` (up to ${t.extraDisciplineDots} out of clan too)` : ''}, plus your Sire's free dot. At most ${t.startDiscipline} dots per Discipline. Each dot gives one power, of a rank no higher than the dots.`,
    'disc.inClan': 'clan',
    'disc.outClan': 'out of clan',
    'disc.sire': "Sire's dot",
    'disc.noPowers': 'This Discipline has no powers in the playtest yet.',
    'traits.title': (n) => (n === 1 ? 'Choose 1 clan trait' : `Choose ${n} clan traits`),
    'traits.note': 'Some traits need dots in a Discipline or a higher tier.',
    'traits.noClan': 'Choose a clan first.',
    'merits.title': (n) => (n === 1 ? 'Choose 1 Merit' : `Choose ${n} Merits`),
    'merits.note': 'Some Merits need dots in a Discipline or a higher tier.',
    'hum.title': 'Humanity or a Path',
    'hum.note':
      'You start at Humanity 6. A Path of Enlightenment replaces Humanity and needs the Storyteller’s approval.',
    'hum.humanity': 'The road of almost every vampire: holding on to what is left of being human.',
    'res.title': 'Resources',
    'res.note': (n, max) =>
      `On top of the lifepaths' dots you have ${n} dots to put anywhere. The same Resource from several sources adds up, to at most ${max} dots.`,
    'res.fromLifepaths': 'From lifepaths',
    'res.none': 'No dots in the lifepaths’ Resources yet.',
    'res.extra': 'Extra Resources',
    'res.add': 'Add a Resource',
    'details.title': 'Name, Flaws and creation',
    'details.note': (n) => `You need at least ${n} Flaw: pick an example or write your own.`,
    'details.name': 'Character name',
    'details.flaw': 'Flaw',
    'details.flawNote': 'Note (optional)',
    'details.addFlaw': 'Add a Flaw',
    'create.title': 'Create the character',
    'create.server': 'Discord server',
    'create.button': 'Create the character',
    'create.completeButton': 'Complete the sheet',
    'create.complete': (name) => `This sheet will complete ${name}, already on the bot.`,
    'create.notYet': 'The button turns on when nothing is left to fix.',
    'create.approvals': (list) => `The Storyteller will have to approve: ${list}.`,
    'create.noServer': 'The bot shares no server with you: add it before creating the character.',
    'create.duplicate': 'You already have a character with this name on that server.',
    'create.limit': 'You reached the maximum number of characters on that server.',
    'create.failed': 'Creation failed: check the sheet and try again.',
    'create.tier': 'The character is in a Chronicle of another tier: pick the Chronicle’s tier.',
    'side.disciplines': 'Disciplines',
    'side.outOfClan': 'of which out of clan',
    'side.powers': 'Powers',
    'side.traits': 'Clan traits',
    'side.merits': 'Merits',
    'side.extraResources': 'Extra Resources',
    'reason.rank': (r) => `Needs at least ${r.rank} dots in the Discipline.`,
    'reason.curse': (r) => `Only with the ${r.curse} curse.`,
    'reason.clan': 'Another clan’s.',
    prev: '← Back',
    next: 'Next →',
    'type.title': 'What kind of character?',
    'type.note':
      'You choose the tier. When the character joins a Chronicle, its tier must match the Chronicle’s.',
    'type.name': 'Name (you can change it later)',
    'type.young': 'Young character',
    'type.youngNote': `One lifepath only, ${YOUNG_EXTRA_SKILLS} more Skill dots and ${YOUNG_EXTRA_RESOURCES} more Resource dots, no Skill above ${YOUNG_MAX_SKILL}.`,
    'tier.duskborn': 'Thin of blood, between the living and the dead.',
    'tier.neonate': 'A young vampire, new to Kindred society.',
    'tier.ancilla': 'An established vampire, with decades or centuries behind them.',
    'tier.elder': 'Ancient and powerful, close to the Antediluvians.',
    'tier.sum': (t) =>
      `${t.lifepaths} lifepaths · Attributes ${t.attributes.join('/')} · Disciplines ${t.clanDisciplineDots}+1${t.extraDisciplineDots ? ` (+${t.extraDisciplineDots} out of clan)` : ''} · ${t.powers} powers · ${t.merits} Merits · ${t.clanTraits} clan traits`,
    'clan.title': 'Choose a clan',
    'clan.note':
      'Only clans complete in the playtest can be chosen: the others are in development.',
    'clan.choice': 'Third clan Discipline',
    'clan.curse': 'Curse',
    'clan.beast': 'Beast',
    'sire.title': 'Who is your Sire?',
    'sire.note': 'Your Sire teaches you a Discipline: that dot is free, on top of the others.',
    'sire.discipline': 'Discipline taught',
    'sire.broodmate': 'Broodmate who teaches you the Discipline',
    'sire.approval': 'Needs the approval of the Storyteller and of your coterie mate.',
    'sire.generation': 'Generation',
    'sire.anyDiscipline': 'Any clan Discipline of your broodmate.',
    'lp.title': (n) => (n === 1 ? 'Choose 1 lifepath' : `Choose ${n} lifepaths`),
    'lp.note': (skill, res) =>
      `Each lifepath gives ${skill} dots among its Skills and ${res} dots among its Resources.`,
    'lp.add': 'Add',
    'lp.remove': 'Remove',
    'reason.full': 'You have all your lifepaths.',
    'lp.skills': 'Skills',
    'lp.resources': 'Resources',
    'lp.detail': 'What is it?',
    'lp.chosen': 'Your lifepaths',
    'lp.all': 'All lifepaths',
    'lp.choose': 'your choice',
    'group.mortal': 'Mortal',
    'group.neonate': 'Neonate',
    'group.ancilla': 'Ancilla',
    'attr.title': 'Attributes',
    'attr.note':
      'Every Attribute starts at 1. Order the three categories: the first gets the most dots.',
    'attr.rank': ['First', 'Second', 'Third'],
    'skills.title': 'Skills and specialties',
    'skills.note': (n) =>
      `On top of the lifepaths’ dots you have ${n} dots to put anywhere. You get a specialty at 1, 3 and 5 dots, and one more when two lifepaths feed the same Skill.`,
    'skills.fromLifepaths': 'from lifepaths',
    'skills.extra': 'extra',
    'skills.specialty': 'Specialty',
    'cat.physical': 'Physical',
    'cat.social': 'Social',
    'cat.mental': 'Mental',
    'side.points': 'Points',
    'side.derived': 'Trackers',
    'side.extraSkills': 'Extra Skills',
    'side.lifepathSkills': (name) => `${name}: Skills`,
    'side.lifepathResources': (name) => `${name}: Resources`,
    'side.issues': 'To do',
    'side.allGood': 'All good in these steps.',
    'reason.tier': (r) => `Needs tier ${cap(r.min)} or higher.`,
    'reason.creature': 'Not for this kind of character.',
    'reason.incomplete': 'Still in development in the playtest.',
    'reason.taken': 'Already chosen.',
    'reason.budget': 'No points left.',
    'reason.storyteller': 'Needs the Storyteller’s approval.',
    issue: {
      'clan-missing': 'Choose a clan.',
      'clan-incomplete': 'This clan is still in development in the playtest.',
      'clan-choice-missing': 'Choose the third clan Discipline.',
      'sire-missing': 'Choose a Sire.',
      'sire-unknown': 'Unknown Sire.',
      'sire-discipline-missing': 'Choose the Discipline your Sire taught you.',
      'sire-discipline-not-allowed': (i) => `This Sire does not teach ${nameOf(i.target)}.`,
      'discipline-without-powers': (i) => `${nameOf(i.target)} has no powers in the playtest yet.`,
      'broodmate-missing': 'Name your broodmate.',
      'generation-missing': 'No Generation chosen yet.',
      'generation-out-of-range': 'Generation outside the tier’s limits.',
      'young-not-allowed': 'Only Duskborn and Neonates can be young.',
      'lifepaths-missing': (i) => `Lifepaths chosen: ${i.value} of ${i.limit}.`,
      'lifepaths-too-many': (i) => `Too many lifepaths: ${i.value} of ${i.limit}.`,
      'lifepath-repeated': 'The same lifepath twice.',
      'lifepath-tier': (i) => `${nameOf(i.target)} is not for this tier.`,
      'lifepath-skills-left': (i) => `${nameOf(i.target)}: ${left(i)} Skill dots left.`,
      'lifepath-skills-over': (i) => `${nameOf(i.target)}: ${over(i)} Skill dots too many.`,
      'lifepath-resources-left': (i) => `${nameOf(i.target)}: ${left(i)} Resource dots left.`,
      'lifepath-resources-over': (i) => `${nameOf(i.target)}: ${over(i)} Resource dots too many.`,
      'skill-not-in-lifepath': 'Dots in a Skill the lifepath does not have.',
      'priority-missing': 'Order the Attribute categories.',
      'attributes-left': (i) => `${nameOf(i.target)} Attributes: ${left(i)} dots left.`,
      'attributes-over': (i) => `${nameOf(i.target)} Attributes: ${over(i)} dots too many.`,
      'attribute-max': (i) => `${nameOf(i.target)} above the maximum of ${i.limit}.`,
      'extra-skills-left': (i) => `${left(i)} extra Skill dots left.`,
      'extra-skills-over': (i) => `${over(i)} extra Skill dots too many.`,
      'skill-max': (i) => `${nameOf(i.target)} above the maximum of ${i.limit}.`,
      'specialties-too-many': (i) => `${nameOf(i.target)}: too many specialties.`,
      'specialties-free': (i) => `${nameOf(i.target)}: ${left(i)} specialties to choose.`,
      'discipline-max': (i) => `${nameOf(i.target)} above the maximum of ${i.limit}.`,
      'powers-rank': (i) => `${nameOf(i.target)}: powers of too high a rank for the dots.`,
      'powers-missing': (i) => `${nameOf(i.target)}: ${left(i)} powers to choose.`,
      'sire-dot-missing': (i) =>
        `Put at least one dot in ${nameOf(i.target)}, your Sire's Discipline.`,
      'out-of-clan': (i) => `Too many dots out of clan: ${i.value} of ${i.limit}.`,
      'disciplines-left': (i) => `${left(i)} Discipline dots left.`,
      'disciplines-over': (i) => `${over(i)} Discipline dots too many.`,
      'powers-left': (i) => `${left(i)} powers to choose.`,
      'powers-over': (i) => `${over(i)} powers too many.`,
      'power-repeated': 'The same power twice.',
      'clan-traits-left': (i) => `${left(i)} clan traits to choose.`,
      'clan-traits-over': (i) => `${over(i)} clan traits too many.`,
      'merits-left': (i) => `${left(i)} Merits to choose.`,
      'merits-over': (i) => `${over(i)} Merits too many.`,
      prereq: (i) => `${nameOf(i.target)}: requirements no longer met.`,
      'other-clan': (i) => `${nameOf(i.target)} belongs to another clan.`,
      repeated: (i) => `${nameOf(i.target)} chosen twice.`,
      'extra-resources-left': (i) => `${left(i)} extra Resource dots left.`,
      'extra-resources-over': (i) => `${over(i)} extra Resource dots too many.`,
      'resource-detail-missing': (i) => `${nameOf(i.target)}: say what it is.`,
      'resource-max': (i) => `${nameOf(i.target)} above the maximum of ${i.limit}.`,
      'flaws-missing': (i) => `Flaws chosen: ${i.value} of ${i.limit}.`,
      'name-missing': 'Give the character a name.',
      negative: 'A value below zero.',
    },
  },
};

const lang = navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en';
const tr = (key, ...args) => {
  const v = TEXT[lang][key] ?? TEXT.en[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const left = (i) => i.limit - i.value;
const over = (i) => i.value - i.limit;

/** A readable name for an issue's target: a lifepath, Skill, Attribute, category, clan… */
function nameOf(target) {
  if (!target) return '';
  if (LIFEPATHS_BY_ID.has(target)) return LIFEPATHS_BY_ID.get(target).name;
  if (SKILL_INFO[target]) return SKILL_INFO[target].name;
  if (ATTRIBUTE_NAMES[target]) return ATTRIBUTE_NAMES[target];
  if (DISCIPLINE_NAMES[target]) return DISCIPLINE_NAMES[target];
  if (CLAN_INFO[target]) return CLAN_INFO[target].name;
  if (POWERS_BY_ID.has(target)) return POWERS_BY_ID.get(target).name;
  if (CLAN_TRAITS_BY_ID.has(target)) return CLAN_TRAITS_BY_ID.get(target).name;
  if (MERITS_BY_ID.has(target)) return MERITS_BY_ID.get(target).name;
  const path = PATHS.find((p) => p.id === target);
  if (path) return path.name;
  // Resource totals are keyed "kind:subject".
  const [kind, subject] = target.split(':');
  if (RESOURCE_INFO[kind])
    return subject ? `${RESOURCE_INFO[kind].name}: ${subject}` : RESOURCE_INFO[kind].name;
  if (ATTRIBUTE_CATEGORIES.includes(target)) return tr(`cat.${target}`);
  return target;
}

function issueText(i) {
  const v = TEXT[lang].issue[i.code] ?? TEXT.en.issue[i.code];
  if (typeof v === 'function') return v(i);
  return v ?? i.code;
}

function reasonText(r) {
  if (r.kind === 'dots') {
    return r.anyOf.map((x) => `${DISCIPLINE_NAMES[x.discipline]} ${x.dots}`).join(' / ');
  }
  return tr(`reason.${r.kind}`, r);
}

// ---------- Small DOM helpers ----------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function button(text, onClick, className = '') {
  const b = el('button', className, text);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

const dotsText = (n, max) => '●'.repeat(Math.max(0, n)) + '○'.repeat(Math.max(0, max - n));

/** − dots + : `canAdd` says whether + may go one higher. */
function stepper(value, { min = 0, max, canAdd = true, onChange, label, plain = false }) {
  const box = el('span', 'stepper');
  const minus = button('−', () => onChange(value - 1), 'step-btn');
  minus.disabled = value <= min;
  minus.setAttribute('aria-label', `${label} −1`);
  const plus = button('+', () => onChange(value + 1), 'step-btn');
  plus.disabled = !canAdd || value >= max;
  plus.setAttribute('aria-label', `${label} +1`);
  const shown = plain ? el('span', 'count', `+${value}`) : el('span', 'dots', dotsText(value, max));
  box.append(minus, shown, plus);
  return box;
}

/** A clickable card; locked ones show why instead of acting. */
function choiceCard({ title, lines = [], selected, available = true, reasons = [], onPick }) {
  const card = el(
    'button',
    'choice' + (selected ? ' selected' : '') + (available ? '' : ' locked'),
  );
  card.type = 'button';
  card.setAttribute('aria-pressed', String(!!selected));
  card.append(el('strong', '', title));
  for (const line of lines) if (line) card.append(el('span', 'line', line));
  if (!available) {
    card.disabled = true;
    for (const r of reasons) card.append(el('span', 'reason', reasonText(r)));
  } else card.addEventListener('click', onPick);
  return card;
}

function field(label, input) {
  const wrap = el('label', 'field');
  wrap.append(el('span', '', label), input);
  return wrap;
}

// ---------- State and saving ----------

let me;
let draftId;
let d = emptyDraft('neonate');
let step = 'type';
let saveState = 'new';
let saveTimer;
let saving = false;
let again = false;

const STEPS = [
  'type',
  'clan',
  'sire',
  'lifepaths',
  'attributes',
  'skills',
  'disciplines',
  'traits',
  'merits',
  'humanity',
  'resources',
  'details',
];

const isLifepathIssue = (i) =>
  i.step === 'lifepaths' ||
  i.code.startsWith('lifepath-') ||
  ['skill-not-in-lifepath', 'resource-not-in-lifepath'].includes(i.code);

/** The issues that belong to one tab of the wizard. */
function issuesOf(tab, issues) {
  if (tab === 'lifepaths') return issues.filter(isLifepathIssue);
  if (tab === 'skills') return issues.filter((i) => i.step === 'skills' && !isLifepathIssue(i));
  return issues.filter((i) => i.step === tab && !isLifepathIssue(i));
}

/** Applies a change; text fields skip redrawing the step so they keep the focus. */
function update(change, redraw = true) {
  change(d);
  saveState = 'dirty';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 1200);
  render(redraw);
}

async function api(method, url, body) {
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) {
    location.href = '/';
    throw new Error('login');
  }
  return response;
}

async function save() {
  if (saving) {
    again = true;
    return;
  }
  saving = true;
  saveState = 'saving';
  renderSave();
  try {
    const response = await api('POST', draftId ? `/api/drafts/${draftId}` : '/api/drafts', {
      data: d,
    });
    if (response.status === 409) {
      notify(tr('limit'));
      saveState = 'error';
    } else if (!response.ok) {
      saveState = 'error';
    } else {
      const { draft } = await response.json();
      if (!draftId) {
        draftId = draft.id;
        history.replaceState(null, '', `/crea?bozza=${draftId}`);
      }
      saveState = 'saved';
    }
  } catch {
    saveState = 'error';
  }
  saving = false;
  renderSave();
  if (again) {
    again = false;
    save();
  }
}

function notify(text) {
  const box = document.getElementById('notice');
  box.textContent = text;
  box.hidden = false;
}

// ---------- Rendering ----------

let current;

function render(redraw = true) {
  current = evaluate(d);
  renderSteps();
  if (redraw) {
    const view = VIEWS[step]();
    const nav = el('div', 'step-nav');
    const at = STEPS.indexOf(step);
    if (at > 0) nav.append(button(tr('prev'), () => go(STEPS[at - 1])));
    if (at < STEPS.length - 1) nav.append(button(tr('next'), () => go(STEPS[at + 1]), 'primary'));
    document.getElementById('step').replaceChildren(view, nav);
  }
  renderSide();
}

function go(next) {
  step = next;
  render();
  document.getElementById('step').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function renderSteps() {
  const nav = document.getElementById('steps');
  nav.replaceChildren(
    ...STEPS.map((s, n) => {
      const issues = issuesOf(s, current.issues);
      const state = issues.some((i) => i.severity === 'error')
        ? 'error'
        : issues.some((i) => i.severity === 'todo')
          ? 'todo'
          : 'done';
      const b = button(`${n + 1}. ${tr(`step.${s}`)}`, () => go(s), `tab ${state}`);
      if (s === step) b.setAttribute('aria-current', 'step');
      return b;
    }),
  );
}

function renderSave() {
  const box = document.getElementById('save-state');
  if (box) {
    box.textContent = tr(`save.${saveState}`);
    box.className = `save ${saveState}`;
  }
}

function pool(label, p) {
  const row = el(
    'div',
    'pool' + (p.spent > p.budget ? ' over' : p.spent === p.budget ? ' full' : ''),
  );
  row.append(el('span', '', label), el('span', 'count', `${p.spent}/${p.budget}`));
  return row;
}

function renderSide() {
  const side = document.getElementById('side');
  const { pools, derived } = current;
  const box = el('div', 'card');
  const saveLine = el('p', '', '');
  saveLine.id = 'save-state';
  box.append(saveLine);

  box.append(el('h3', '', tr('side.points')));
  for (const cat of ATTRIBUTE_CATEGORIES) {
    box.append(
      pool(`${tr('step.attributes')} ${tr(`cat.${cat}`).toLowerCase()}`, pools.attributes[cat]),
    );
  }
  d.lifepaths.forEach((pick, n) => {
    const name = LIFEPATHS_BY_ID.get(pick.id)?.name ?? pick.id;
    box.append(pool(tr('side.lifepathSkills', name), pools.lifepathSkills[n]));
    box.append(pool(tr('side.lifepathResources', name), pools.lifepathResources[n]));
  });
  box.append(pool(tr('side.extraSkills'), pools.extraSkills));
  box.append(pool(tr('side.disciplines'), pools.disciplines));
  if (pools.outOfClan.budget) box.append(pool(tr('side.outOfClan'), pools.outOfClan));
  box.append(pool(tr('side.powers'), pools.powers));
  box.append(pool(tr('side.traits'), pools.clanTraits));
  box.append(pool(tr('side.merits'), pools.merits));
  box.append(pool(tr('side.extraResources'), pools.extraResources));
  // Flaws are a minimum, not a budget: more than enough is fine.
  const flaws = pools.flaws;
  box.append(pool('Flaws', { spent: Math.min(flaws.spent, flaws.budget), budget: flaws.budget }));

  box.append(el('h3', '', tr('side.derived')));
  for (const [label, value] of [
    ['Health', derived.health],
    ['Willpower', derived.willpower],
    ['Vitae', derived.vitae],
    ['Humanity', derived.humanity],
  ]) {
    const row = el('div', 'pool');
    row.append(el('span', '', label), el('span', 'count', value));
    box.append(row);
  }

  box.append(el('h3', '', tr('side.issues')));
  const shown = STEPS.flatMap((s) => issuesOf(s, current.issues)).filter(
    (i) => i.severity !== 'hint',
  );
  if (!shown.length) box.append(el('p', 'quiet', tr('side.allGood')));
  else {
    const list = el('ul', 'issues');
    for (const i of shown) list.append(el('li', i.severity, issueText(i)));
    box.append(list);
  }
  side.replaceChildren(box);
  renderSave();
}

function stepHead(title, note) {
  const head = el('div', 'step-head');
  head.append(el('h2', '', title));
  if (note) head.append(el('p', 'quiet', note));
  return head;
}

function hints(tab) {
  const list = el('ul', 'issues');
  // Free specialty slots already show as empty boxes: no need to list them too.
  for (const i of issuesOf(tab, current.issues)) {
    if (i.code !== 'specialties-free') list.append(el('li', i.severity, issueText(i)));
  }
  return list;
}

const VIEWS = {
  type() {
    const box = el('div');
    box.append(stepHead(tr('type.title'), tr('type.note')));
    const name = el('input');
    name.maxLength = me.options.maxName;
    name.value = d.name ?? '';
    name.addEventListener('input', () =>
      update((x) => {
        x.name = name.value || undefined;
      }, false),
    );
    box.append(field(tr('type.name'), name));
    const grid = el('div', 'choices');
    for (const tier of CREATION_TIERS) {
      grid.append(
        choiceCard({
          title: cap(tier),
          lines: [tr(`tier.${tier}`), tr('tier.sum', TIER_RULES[tier])],
          selected: d.tier === tier,
          onPick: () =>
            update((x) => {
              x.tier = tier;
              if (!youngAllowed(tier)) delete x.young;
              const [lo, hi] = TIER_RULES[tier].generations;
              if (x.generation !== undefined && (x.generation < lo || x.generation > hi)) {
                delete x.generation;
              }
            }),
        }),
      );
    }
    box.append(grid);
    if (youngAllowed(d.tier)) {
      const young = el('input');
      young.type = 'checkbox';
      young.checked = !!d.young;
      young.addEventListener('change', () =>
        update((x) => {
          if (young.checked) x.young = true;
          else delete x.young;
          // A young character keeps one lifepath: the first one.
          x.lifepaths = x.lifepaths.slice(0, lifepathCount(x));
        }),
      );
      const label = el('label', 'check');
      label.append(young, el('span', '', tr('type.young')));
      box.append(label, el('p', 'quiet', tr('type.youngNote')));
    }
    box.append(hints('type'));
    return box;
  },

  clan() {
    const box = el('div');
    box.append(stepHead(tr('clan.title'), tr('clan.note')));
    const grid = el('div', 'choices');
    for (const o of clanOptions()) {
      const info = CLAN_INFO[o.id];
      const discs = info.disciplines.map((x) => DISCIPLINE_NAMES[x]);
      if (info.choice) discs.push(info.choice.map((x) => DISCIPLINE_NAMES[x]).join(' / '));
      grid.append(
        choiceCard({
          title: info.name,
          lines: [
            info.it,
            discs.join(', '),
            info.curse ? `${tr('clan.curse')}: ${info.curse}` : '',
            info.beast ? `${tr('clan.beast')}: ${info.beast}` : '',
          ],
          selected: d.clan === o.id,
          available: o.available,
          reasons: o.reasons,
          onPick: () =>
            update((x) => {
              x.clan = o.id;
              if (!info.choice?.includes(x.clanChoice)) delete x.clanChoice;
            }),
        }),
      );
    }
    box.append(grid);
    const info = d.clan && CLAN_INFO[d.clan];
    if (info?.choice) {
      const row = el('div', 'chips');
      for (const disc of info.choice) {
        row.append(
          button(
            DISCIPLINE_NAMES[disc],
            () =>
              update((x) => {
                x.clanChoice = disc;
              }),
            'chip' + (d.clanChoice === disc ? ' selected' : ''),
          ),
        );
      }
      box.append(el('h3', '', tr('clan.choice')), row);
    }
    box.append(hints('clan'));
    return box;
  },

  sire() {
    const box = el('div');
    box.append(stepHead(tr('sire.title'), tr('sire.note')));
    const grid = el('div', 'choices');
    for (const o of sireOptions()) {
      const sire = SIRES_BY_ID.get(o.id);
      grid.append(
        choiceCard({
          title: sire.name,
          lines: [
            sire.it,
            sire.disciplines.length
              ? sire.disciplines.map((x) => DISCIPLINE_NAMES[x]).join(', ')
              : tr('sire.anyDiscipline'),
          ],
          selected: d.sire === o.id,
          onPick: () =>
            update((x) => {
              x.sire = o.id;
              if (sire.disciplines.length && !sire.disciplines.includes(x.sireDiscipline)) {
                delete x.sireDiscipline;
              }
              if (o.id !== 'brood-child') delete x.broodmate;
            }),
        }),
      );
    }
    box.append(grid);
    if (d.sire) {
      const row = el('div', 'chips');
      for (const o of sireDisciplineOptions(d)) {
        row.append(
          button(
            DISCIPLINE_NAMES[o.id],
            () =>
              update((x) => {
                x.sireDiscipline = o.id;
              }),
            'chip' + (d.sireDiscipline === o.id ? ' selected' : ''),
          ),
        );
      }
      box.append(el('h3', '', tr('sire.discipline')), row);
    }
    if (d.sire === 'brood-child') {
      const mate = el('input');
      mate.maxLength = 80;
      mate.value = d.broodmate ?? '';
      mate.addEventListener('input', () =>
        update((x) => {
          x.broodmate = mate.value || undefined;
        }, false),
      );
      box.append(field(tr('sire.broodmate'), mate), el('p', 'quiet', tr('sire.approval')));
    }
    const [lo, hi] = TIER_RULES[d.tier].generations;
    const gen = el('select');
    gen.append(el('option', '', '—'));
    for (let g = lo; g <= hi; g++) {
      const opt = el('option', '', `${g}ª`);
      opt.value = String(g);
      opt.selected = d.generation === g;
      gen.append(opt);
    }
    gen.addEventListener('change', () =>
      update((x) => {
        if (gen.value) x.generation = Number(gen.value);
        else delete x.generation;
      }),
    );
    box.append(field(tr('sire.generation'), gen), hints('sire'));
    return box;
  },

  lifepaths() {
    const box = el('div');
    const wanted = lifepathCount(d);
    const young = youngAllowed(d.tier) && d.young;
    const skillBudget = LIFEPATH_SKILL_DOTS + (young ? YOUNG_EXTRA_SKILLS : 0);
    const resBudget = LIFEPATH_RESOURCE_DOTS + (young ? YOUNG_EXTRA_RESOURCES : 0);
    box.append(stepHead(tr('lp.title', wanted), tr('lp.note', skillBudget, resBudget)));

    if (d.lifepaths.length) {
      box.append(el('h3', '', tr('lp.chosen')));
      d.lifepaths.forEach((pick, n) => box.append(chosenLifepath(pick, n)));
    }
    box.append(hints('lifepaths'));

    const full = d.lifepaths.length >= wanted;
    const options = new Map(lifepathOptions(d).map((o) => [o.id, o]));
    // Once every lifepath is chosen, the list folds away: it is only there to look again.
    const list = el('details', 'lifepath-list');
    list.open = !full;
    list.append(el('summary', '', tr('lp.all')));
    box.append(list);
    for (const group of ['mortal', 'neonate', 'ancilla']) {
      list.append(el('h3', '', tr(`group.${group}`)));
      const grid = el('div', 'choices');
      for (const lp of LIFEPATHS.filter((l) => l.group === group)) {
        const o = options.get(lp.id);
        grid.append(
          choiceCard({
            title: lp.name,
            lines: [
              lp.it,
              `${tr('lp.skills')}: ${lp.skills.map(skillLabel).join(', ')}`,
              `${tr('lp.resources')}: ${lp.resources.map(resourceLabel).join(', ')}`,
            ],
            available: o.available && !full,
            reasons: o.available ? [{ kind: 'full' }] : o.reasons,
            onPick: () =>
              update((x) => {
                x.lifepaths.push({ id: lp.id, skills: {}, resources: lp.resources.map(() => 0) });
              }),
          }),
        );
      }
      list.append(grid);
    }
    return box;
  },

  attributes() {
    const box = el('div');
    box.append(stepHead(tr('attr.title'), tr('attr.note')));
    const t = TIER_RULES[d.tier];
    const priority = d.attributePriority;
    const grid = el('div', 'attr-grid');
    for (const cat of ATTRIBUTE_CATEGORIES) {
      const col = el('div', 'card');
      col.append(el('h3', '', tr(`cat.${cat}`)));
      const ranks = el('div', 'chips');
      t.attributes.forEach((dots, rank) => {
        ranks.append(
          button(
            `${tr('attr.rank')[rank]} (${dots})`,
            () => update((x) => setPriority(x, cat, rank)),
            'chip' + (priority?.[rank] === cat ? ' selected' : ''),
          ),
        );
      });
      col.append(ranks);
      const p = current.pools.attributes[cat];
      for (const a of ATTRIBUTES_BY_CATEGORY[cat]) {
        const value = attributeDots(d, a);
        const row = el('div', 'trait');
        row.append(
          el('span', '', ATTRIBUTE_NAMES[a]),
          stepper(value, {
            min: 1,
            max: t.maxDots,
            canAdd: !!priority && p.spent < p.budget,
            label: ATTRIBUTE_NAMES[a],
            onChange: (v) =>
              update((x) => {
                if (v <= 1) delete x.attributes[a];
                else x.attributes[a] = v;
              }),
          }),
        );
        col.append(row);
      }
      col.append(pool(tr('side.points'), p));
      grid.append(col);
    }
    box.append(grid, hints('attributes'));
    return box;
  },

  skills() {
    const box = el('div');
    const t = TIER_RULES[d.tier];
    box.append(stepHead(tr('skills.title'), tr('skills.note', t.extraSkills)));
    const extra = current.pools.extraSkills;
    const cap = skillCap();
    const table = el('div', 'skills');
    for (const skill of SKILLS) {
      const info = SKILL_INFO[skill];
      const total = skillDots(d, skill);
      const fromLp = total - (d.extraSkills[skill] ?? 0);
      const row = el('div', 'skill-row');
      const name = el('div', 'skill-name');
      name.append(el('strong', '', info.name), el('span', 'quiet', info.it));
      const own = d.extraSkills[skill] ?? 0;
      const counts = el('div', 'skill-counts');
      counts.append(
        el('span', 'dots', dotsText(total, cap)),
        el(
          'span',
          'quiet',
          `${fromLp} ${tr('skills.fromLifepaths')} + ${own} ${tr('skills.extra')}`,
        ),
        stepper(own, {
          max: cap,
          plain: true,
          canAdd: extra.spent < extra.budget && total < cap,
          label: info.name,
          onChange: (v) =>
            update((x) => {
              if (v <= 0) delete x.extraSkills[skill];
              else x.extraSkills[skill] = v;
            }),
        }),
      );
      row.append(name, counts);
      const slots = specialtySlots(d, skill);
      if (slots) row.append(specialtyInputs(skill, slots));
      table.append(row);
    }
    box.append(hints('skills'), table);
    return box;
  },

  disciplines() {
    const box = el('div');
    const t = TIER_RULES[d.tier];
    box.append(stepHead(tr('disc.title'), tr('disc.note', t)));
    box.append(hints('disciplines'));
    for (const room of disciplineRoom(d)) {
      const disc = room.discipline;
      const card = el('div', 'card discipline');
      const head = el('div', 'trait');
      const title = el('span', 'disc-title');
      title.append(el('strong', '', DISCIPLINE_NAMES[disc]));
      const tags = [room.inClan ? tr('disc.inClan') : tr('disc.outClan')];
      if (d.sireDiscipline === disc) tags.push(tr('disc.sire'));
      title.append(el('span', 'quiet', tags.join(' · ')));
      head.append(
        title,
        stepper(room.dots, {
          max: t.startDiscipline,
          canAdd: room.dots < room.max,
          label: DISCIPLINE_NAMES[disc],
          onChange: (v) => update((x) => setDisciplineDots(x, disc, v)),
        }),
      );
      card.append(head);
      if (!room.hasPowers) card.append(el('p', 'quiet', tr('disc.noPowers')));
      else if (room.dots > 0) {
        const grid = el('div', 'choices powers');
        for (const o of powerOptions(d, disc)) {
          const p = POWERS_BY_ID.get(o.id);
          grid.append(
            choiceCard({
              title: p.name,
              lines: [
                `Rank ${p.rank} · ${DISCIPLINE_NAMES[disc]} + ${ATTRIBUTE_NAMES[p.attribute]}${p.maturing ? ' · [Maturing]' : ''}`,
                p.it,
              ],
              selected: d.powers.includes(p.id),
              available: o.available,
              reasons: o.reasons,
              onPick: () => update((x) => toggle(x.powers, p.id)),
            }),
          );
        }
        card.append(grid);
      }
      box.append(card);
    }
    return box;
  },

  traits() {
    const box = el('div');
    const t = TIER_RULES[d.tier];
    box.append(stepHead(tr('traits.title', t.clanTraits), tr('traits.note')));
    if (!d.clan) box.append(el('p', 'quiet', tr('traits.noClan')));
    const grid = el('div', 'choices');
    for (const o of clanTraitOptions(d)) {
      const trait = CLAN_TRAITS_BY_ID.get(o.id);
      grid.append(
        choiceCard({
          title: trait.name,
          lines: [trait.it],
          selected: d.clanTraits.includes(o.id),
          available: o.available,
          reasons: o.reasons,
          onPick: () => update((x) => toggle(x.clanTraits, o.id)),
        }),
      );
    }
    box.append(hints('traits'), grid);
    return box;
  },

  merits() {
    const box = el('div');
    const t = TIER_RULES[d.tier];
    box.append(stepHead(tr('merits.title', t.merits), tr('merits.note')));
    const grid = el('div', 'choices');
    for (const o of meritOptions(d)) {
      const merit = MERITS_BY_ID.get(o.id);
      grid.append(
        choiceCard({
          title: merit.name,
          lines: [merit.it],
          selected: d.merits.includes(o.id),
          available: o.available,
          reasons: o.reasons,
          onPick: () => update((x) => toggle(x.merits, o.id)),
        }),
      );
    }
    box.append(hints('merits'), grid);
    return box;
  },

  humanity() {
    const box = el('div');
    box.append(stepHead(tr('hum.title'), tr('hum.note')));
    const grid = el('div', 'choices');
    grid.append(
      choiceCard({
        title: 'Humanity',
        lines: [tr('hum.humanity')],
        selected: d.path === undefined,
        onPick: () =>
          update((x) => {
            delete x.path;
          }),
      }),
    );
    for (const o of pathOptions()) {
      const path = PATHS.find((p) => p.id === o.id);
      grid.append(
        choiceCard({
          title: path.name,
          lines: [path.it, tr('reason.storyteller')],
          selected: d.path === o.id,
          onPick: () =>
            update((x) => {
              x.path = o.id;
            }),
        }),
      );
    }
    box.append(grid, hints('humanity'));
    return box;
  },

  resources() {
    const box = el('div');
    const t = TIER_RULES[d.tier];
    box.append(stepHead(tr('res.title'), tr('res.note', t.extraResources, t.maxDots)));
    const fromLifepaths = el('div', 'card');
    fromLifepaths.append(el('h3', '', tr('res.fromLifepaths')));
    let any = false;
    for (const pick of d.lifepaths) {
      const lp = LIFEPATHS_BY_ID.get(pick.id);
      lp?.resources.forEach((r, i) => {
        const dots = pick.resources[i] ?? 0;
        if (!dots) return;
        any = true;
        const subject = pick.resourceDetails?.[i] || r.detail;
        const row = el('div', 'trait');
        row.append(
          el(
            'span',
            '',
            subject ? `${RESOURCE_INFO[r.kind].name}: ${subject}` : RESOURCE_INFO[r.kind].name,
          ),
          el('span', 'dots', dotsText(dots, t.maxDots)),
        );
        fromLifepaths.append(row);
      });
    }
    if (!any) fromLifepaths.append(el('p', 'quiet', tr('res.none')));
    box.append(fromLifepaths);

    box.append(el('h3', '', tr('res.extra')));
    const extra = current.pools.extraResources;
    d.extraResources.forEach((r, n) => {
      const row = el('div', 'card resource-row');
      const kind = el('select');
      for (const k of RESOURCE_KINDS) {
        const opt = el('option', '', RESOURCE_INFO[k].name);
        opt.value = k;
        opt.selected = r.kind === k;
        kind.append(opt);
      }
      kind.addEventListener('change', () =>
        update((x) => {
          x.extraResources[n].kind = kind.value;
        }),
      );
      const detail = el('input');
      detail.maxLength = 120;
      detail.placeholder = tr('lp.detail');
      detail.value = r.detail;
      detail.addEventListener('input', () =>
        update((x) => {
          x.extraResources[n].detail = detail.value;
        }, false),
      );
      row.append(
        kind,
        detail,
        stepper(r.dots, {
          max: t.maxDots,
          canAdd: extra.spent < extra.budget,
          label: RESOURCE_INFO[r.kind].name,
          onChange: (v) =>
            update((x) => {
              x.extraResources[n].dots = v;
            }),
        }),
        button(tr('lp.remove'), () =>
          update((x) => {
            x.extraResources.splice(n, 1);
          }),
        ),
      );
      row.append(el('span', 'quiet hint', RESOURCE_INFO[r.kind].it));
      box.append(row);
    });
    const add = button(tr('res.add'), () =>
      update((x) => {
        x.extraResources.push({ kind: 'contact', detail: '', dots: 1 });
      }),
    );
    add.disabled = extra.spent >= extra.budget || d.extraResources.length >= 12;
    box.append(add, hints('resources'));
    return box;
  },

  details() {
    const box = el('div');
    box.append(stepHead(tr('details.title'), tr('details.note', current.pools.flaws.budget)));
    const name = el('input');
    name.maxLength = me.options.maxName;
    name.value = d.name ?? '';
    name.addEventListener('input', () =>
      update((x) => {
        x.name = name.value || undefined;
      }, false),
    );
    box.append(field(tr('details.name'), name));

    box.append(el('h3', '', 'Flaws'));
    const list = el('datalist');
    list.id = 'flaw-list';
    for (const f of FLAWS) {
      const opt = el('option');
      opt.value = f.name;
      opt.textContent = f.it;
      list.append(opt);
    }
    box.append(list);
    d.flaws.forEach((f, n) => {
      const row = el('div', 'card resource-row');
      const flawName = el('input');
      flawName.maxLength = 120;
      flawName.setAttribute('list', 'flaw-list');
      flawName.placeholder = tr('details.flaw');
      flawName.value = f.name;
      flawName.addEventListener('input', () =>
        update((x) => {
          const known = FLAWS.find((k) => k.name === flawName.value);
          x.flaws[n] = { ...x.flaws[n], name: flawName.value, ...(known ? { id: known.id } : {}) };
          if (!known) delete x.flaws[n].id;
        }, false),
      );
      const note = el('input');
      note.maxLength = 120;
      note.placeholder = tr('details.flawNote');
      note.value = f.note ?? '';
      note.addEventListener('input', () =>
        update((x) => {
          if (note.value) x.flaws[n].note = note.value;
          else delete x.flaws[n].note;
        }, false),
      );
      row.append(
        flawName,
        note,
        button(tr('lp.remove'), () =>
          update((x) => {
            x.flaws.splice(n, 1);
          }),
        ),
      );
      box.append(row);
    });
    const add = button(tr('details.addFlaw'), () =>
      update((x) => {
        x.flaws.push({ name: '' });
      }),
    );
    add.disabled = d.flaws.length >= 12;
    box.append(add, hints('details'), createBox());
    return box;
  },
};

function skillCap() {
  const max = TIER_RULES[d.tier].maxSkill;
  return youngAllowed(d.tier) && d.young ? Math.min(YOUNG_MAX_SKILL, max) : max;
}

/** Gives `cat` the rank `rank`; the category that had it takes the other's old place. */
function setPriority(x, cat, rank) {
  const p = x.attributePriority ? [...x.attributePriority] : [...ATTRIBUTE_CATEGORIES];
  const from = p.indexOf(cat);
  [p[from], p[rank]] = [p[rank], p[from]];
  x.attributePriority = p;
}

/** The last box: where the character goes, and the button that makes it. */
function createBox() {
  const box = el('div', 'card create');
  box.append(el('h3', '', tr('create.title')));
  if (current.approvals.length) {
    const names = current.approvals.map((a) =>
      a.code === 'path' ? nameOf(a.target) : 'Brood Child',
    );
    box.append(el('p', 'quiet', tr('create.approvals', names.join(', '))));
  }
  const existing = d.characterId !== undefined && me.characters.find((c) => c.id === d.characterId);
  let guild;
  if (existing) box.append(el('p', '', tr('create.complete', existing.name)));
  else if (!me.guilds.length) box.append(el('p', 'error', tr('create.noServer')));
  else {
    guild = el('select');
    for (const g of me.guilds) {
      const opt = el('option', '', g.name);
      opt.value = g.id;
      guild.append(opt);
    }
    box.append(field(tr('create.server'), guild));
  }
  const make = button(
    existing ? tr('create.completeButton') : tr('create.button'),
    async () => {
      make.disabled = true;
      try {
        await flush();
        if (saveState !== 'saved' || !draftId) throw new Error('save');
        const response = await api('POST', `/api/drafts/${draftId}/create`, {
          guild: guild?.value,
        });
        if (response.ok) {
          location.href = '/';
          return;
        }
        const data = await response.json().catch(() => ({}));
        const known = ['duplicate', 'limit', 'tier'].includes(data.error);
        notify(tr(known ? `create.${data.error}` : 'create.failed'));
      } catch {
        notify(tr('create.failed'));
      }
      make.disabled = false;
    },
    'primary',
  );
  make.disabled = !current.complete || (!existing && !guild);
  box.append(make);
  if (!current.complete) box.append(el('p', 'quiet', tr('create.notYet')));
  return box;
}

/** Saves now, waiting for a save already on its way. */
async function flush() {
  clearTimeout(saveTimer);
  while (saving) await new Promise((resolve) => setTimeout(resolve, 100));
  if (saveState !== 'saved') await save();
}

/** Sets a Discipline's dots and drops the powers that no longer fit, highest rank first. */
function setDisciplineDots(x, disc, v) {
  if (v <= 0) delete x.disciplines[disc];
  else x.disciplines[disc] = v;
  const mine = () =>
    x.powers
      .filter((id) => POWERS_BY_ID.get(id)?.discipline === disc)
      .map((id) => POWERS_BY_ID.get(id));
  while (
    !ranksFit(
      mine().map((p) => p.rank),
      v,
    )
  ) {
    const top = mine().sort((a, b) => b.rank - a.rank)[0];
    x.powers = x.powers.filter((id) => id !== top.id);
  }
}

function toggle(list, id) {
  const at = list.indexOf(id);
  if (at >= 0) list.splice(at, 1);
  else list.push(id);
}

function skillLabel(s) {
  const name = SKILL_INFO[s.skill].name;
  if (s.specialties) return `${name} (${s.specialties.join(' / ')})`;
  if (s.choose) return `${name} (${s.choose})`;
  return name;
}

function resourceLabel(r) {
  const name = RESOURCE_INFO[r.kind].name;
  return r.detail ? `${name}: ${r.detail}` : name;
}

function chosenLifepath(pick, n) {
  const lp = LIFEPATHS_BY_ID.get(pick.id);
  const card = el('div', 'card lifepath');
  const head = el('div', 'section-head');
  head.append(
    el('h3', '', lp?.name ?? pick.id),
    button(tr('lp.remove'), () =>
      update((x) => {
        x.lifepaths.splice(n, 1);
      }),
    ),
  );
  card.append(head);
  if (!lp) return card;
  const sp = current.pools.lifepathSkills[n];
  const rp = current.pools.lifepathResources[n];
  const cap = skillCap();

  card.append(pool(tr('lp.skills'), sp));
  for (const s of lp.skills) {
    const value = pick.skills[s.skill] ?? 0;
    const row = el('div', 'trait');
    row.append(
      el('span', '', skillLabel(s)),
      stepper(value, {
        max: cap,
        canAdd: sp.spent < sp.budget && skillDots(d, s.skill) < cap,
        label: SKILL_INFO[s.skill].name,
        onChange: (v) =>
          update((x) => {
            const skills = x.lifepaths[n].skills;
            if (v <= 0) delete skills[s.skill];
            else skills[s.skill] = v;
          }),
      }),
    );
    card.append(row);
  }

  card.append(pool(tr('lp.resources'), rp));
  const max = TIER_RULES[d.tier].maxDots;
  lp.resources.forEach((r, i) => {
    const value = pick.resources[i] ?? 0;
    const row = el('div', 'trait');
    const label = el('span', 'resource');
    label.append(el('span', '', resourceLabel(r)));
    const detail = el('input');
    detail.maxLength = 120;
    detail.placeholder = tr('lp.detail');
    detail.value = pick.resourceDetails?.[i] ?? '';
    detail.addEventListener('input', () =>
      update((x) => {
        const p = x.lifepaths[n];
        const details = p.resourceDetails ?? lp.resources.map(() => '');
        details[i] = detail.value;
        p.resourceDetails = details;
      }, false),
    );
    label.append(detail);
    row.append(
      label,
      stepper(value, {
        max,
        canAdd: rp.spent < rp.budget,
        label: RESOURCE_INFO[r.kind].name,
        onChange: (v) =>
          update((x) => {
            const p = x.lifepaths[n];
            p.resources = lp.resources.map((_, k) => (k === i ? v : (p.resources[k] ?? 0)));
          }),
      }),
    );
    card.append(row);
  });
  return card;
}

/** One text box per specialty slot, with the packet's examples and the lifepaths' as hints. */
function specialtyInputs(skill, slots) {
  const wrap = el('div', 'specialties');
  const listId = `spec-${skill}`;
  const list = el('datalist');
  list.id = listId;
  const fromLifepaths = d.lifepaths.flatMap(
    (p) => LIFEPATHS_BY_ID.get(p.id)?.skills.find((s) => s.skill === skill)?.specialties ?? [],
  );
  for (const name of new Set([...fromLifepaths, ...SKILL_INFO[skill].specialties])) {
    const opt = el('option');
    opt.value = name;
    list.append(opt);
  }
  wrap.append(list);
  const chosen = d.specialties[skill] ?? [];
  for (let i = 0; i < slots; i++) {
    const input = el('input');
    input.maxLength = 40;
    input.setAttribute('list', listId);
    input.placeholder = `${tr('skills.specialty')} ${i + 1}`;
    input.value = chosen[i] ?? '';
    input.addEventListener('input', () =>
      update((x) => {
        const names = [...(x.specialties[skill] ?? [])];
        names[i] = input.value;
        while (names.length && !names[names.length - 1]) names.pop();
        if (names.length) x.specialties[skill] = names.map((s) => s ?? '');
        else delete x.specialties[skill];
      }, false),
    );
    wrap.append(input);
  }
  return wrap;
}

// ---------- Start ----------

/**
 * "Complete the sheet" for a character that has only trackers: the wizard starts from what the
 * bot already knows (name, clan, tier, three Attributes) and finishes on that character.
 */
function prefill(id) {
  const c = me.characters.find((x) => x.id === id && x.owned && !x.sheet);
  if (!c || !CREATION_TIERS.includes(c.tierId)) return;
  d = emptyDraft(c.tierId);
  d.characterId = c.id;
  d.name = c.name;
  if (CLAN_INFO[c.clanId]?.complete) d.clan = c.clanId;
  for (const a of ['stamina', 'composure', 'resolve']) {
    if (c.attributes[a] > 1) d.attributes[a] = c.attributes[a];
  }
  saveState = 'dirty';
  saveTimer = setTimeout(save, 0);
}

async function start() {
  document.documentElement.lang = lang;
  document.getElementById('back').textContent = tr('back');
  const meResponse = await fetch('/api/me', { credentials: 'same-origin' });
  if (meResponse.status === 401) {
    location.href = '/';
    return;
  }
  if (!meResponse.ok) throw new Error(String(meResponse.status));
  me = await meResponse.json();
  document.getElementById('user').textContent = me.user.name;

  const params = new URLSearchParams(location.search);
  const from = Number(params.get('personaggio'));
  if (Number.isInteger(from) && from > 0) prefill(from);
  const wanted = Number(params.get('bozza'));
  if (Number.isInteger(wanted) && wanted > 0) {
    const response = await fetch(`/api/drafts/${wanted}`, { credentials: 'same-origin' });
    if (response.ok) {
      const { draft } = await response.json();
      draftId = draft.id;
      d = { ...emptyDraft(draft.data.tier), ...draft.data };
      saveState = 'saved';
    } else {
      notify(tr('notFound'));
      history.replaceState(null, '', '/crea');
    }
  }
  render();
}

start().catch(() => {
  document.querySelector('main').prepend(el('p', 'error', tr('error')));
});
