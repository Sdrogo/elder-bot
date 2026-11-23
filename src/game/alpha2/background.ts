// Sires, [lifepaths], [merits], Paths and example flaws (Player Packet ch. 2).
// Names, lists and prerequisites only; `it` lines are our own summaries.

import type { ResourceKind, Skill } from './core.js';
import type { Discipline } from './disciplines.js';
import { need, VAMPIRE_OR_DUSKBORN, type Prereq } from './prereq.js';

// ---------- Step 3: sires ----------

export interface Sire {
  id: string;
  name: string;
  /** Bonus Discipline choices; empty for Brood Child (one of a coterie member's clan Disciplines). */
  disciplines: readonly Discipline[];
  it: string;
}

export const SIRES: readonly Sire[] = [
  {
    id: 'brood-child',
    name: 'Brood Child',
    disciplines: [],
    it: 'Cresciuto in una covata: impari una Disciplina da un compagno di coterie, che deve essere d’accordo.',
  },
  {
    id: 'caring',
    name: 'Caring Sire',
    disciplines: ['fortitude', 'potence', 'presence'],
    it: 'Ti ha cresciuto e guidato con cura.',
  },
  {
    id: 'cruel',
    name: 'Cruel Sire',
    disciplines: ['dominate', 'fortitude', 'obfuscate'],
    it: 'Crudele e spietato: hai dovuto indurirti.',
  },
  {
    id: 'distant',
    name: 'Distant Sire',
    disciplines: ['celerity', 'fortitude', 'obfuscate'],
    it: 'Quasi sempre assente: hai imparato da solo.',
  },
  // The packet's table says Potence, its text Fortitude; Andrea chose the table (2026-11-23).
  {
    id: 'feral',
    name: 'Feral Sire',
    disciplines: ['animalism', 'celerity', 'potence'],
    it: 'Più vicino alla Bestia della maggior parte dei vampiri.',
  },
  {
    id: 'manipulative',
    name: 'Manipulative Sire',
    disciplines: ['dominate', 'potence', 'presence'],
    it: 'Un manipolatore che ti usava come pedina.',
  },
  {
    id: 'secretive',
    name: 'Secretive Sire',
    disciplines: ['auspex', 'celerity', 'obfuscate'],
    it: 'Misterioso, sempre nell’ombra.',
  },
  {
    id: 'uncaring',
    name: 'Uncaring Sire',
    disciplines: ['auspex', 'fortitude', 'potence'],
    it: 'Ti trattava come un vampiro di serie B.',
  },
  {
    id: 'unknown',
    name: 'Unknown Sire',
    disciplines: ['celerity', 'fortitude', 'potence'],
    it: 'Non l’hai mai conosciuto.',
  },
  {
    id: 'vigilant',
    name: 'Vigilant Sire',
    disciplines: ['auspex', 'dominate', 'fortitude'],
    it: 'Esigente e sempre pronto a punire.',
  },
];

export const SIRES_BY_ID: ReadonlyMap<string, Sire> = new Map(SIRES.map((s) => [s.id, s]));

// ---------- Step 4: lifepaths ----------

export type LifepathGroup = 'mortal' | 'neonate' | 'ancilla';

export interface LifepathSkill {
  skill: Skill;
  /** Specialty the lifepath gives; several = choose one. */
  specialties?: readonly string[];
  /** The lifepath asks you to choose a field, e.g. an art form. */
  choose?: string;
}

export interface LifepathResource {
  kind: ResourceKind;
  /** Subject as the packet names it, e.g. "Repository: Library". */
  detail?: string;
}

export interface Lifepath {
  id: string;
  name: string;
  group: LifepathGroup;
  skills: readonly LifepathSkill[];
  resources: readonly LifepathResource[];
  it: string;
}

const s = (skill: Skill, ...specialties: string[]): LifepathSkill =>
  specialties.length ? { skill, specialties } : { skill };
const pick = (skill: Skill, choose: string): LifepathSkill => ({ skill, choose });
const r = (kind: ResourceKind, detail?: string): LifepathResource =>
  detail ? { kind, detail } : { kind };

export const LIFEPATHS: readonly Lifepath[] = [
  // Mortal
  {
    id: 'academic',
    name: 'Academic',
    group: 'mortal',
    it: 'Studioso di un campo accademico.',
    skills: [
      s('awareness'),
      s('expression', 'Writing'),
      s('investigation'),
      s('knowledge'),
      s('persuasion'),
    ],
    resources: [
      r('haven'),
      r('repository', 'Library (choose a subject)'),
      r('contact', 'Another Academic'),
    ],
  },
  {
    id: 'artist',
    name: 'Artist',
    group: 'mortal',
    it: 'Scrittore, attore, pittore o altro creativo.',
    skills: [
      s('awareness'),
      s('craft'),
      pick('expression', 'an art form'),
      pick('knowledge', 'an art form'),
      s('persuasion'),
    ],
    resources: [r('wealth'), r('contact', 'Art Dealer'), r('ally', 'Patron')],
  },
  {
    id: 'athlete',
    name: 'Athlete',
    group: 'mortal',
    it: 'Atleta professionista.',
    skills: [
      s('athletics'),
      s('awareness'),
      s('fighting'),
      s('medicine', 'First Aid'),
      s('survival'),
    ],
    resources: [r('wealth'), r('fame', 'Famous Athlete'), r('vehicle')],
  },
  {
    id: 'conniver',
    name: 'Conniver',
    group: 'mortal',
    it: 'Truffatore che vive di parlantina.',
    skills: [
      s('awareness'),
      s('expression', 'Acting'),
      s('persuasion'),
      s('sabotage'),
      s('subterfuge', 'Disguise'),
    ],
    resources: [r('haven'), r('contact'), r('mask')],
  },
  {
    id: 'corporate-executive',
    name: 'Corporate Executive',
    group: 'mortal',
    it: 'Dirigente abituato ai consigli d’amministrazione.',
    skills: [
      s('awareness'),
      s('investigation', 'Gossip'),
      s('knowledge', 'Business'),
      s('persuasion'),
      s('subterfuge', 'Deceit'),
    ],
    resources: [r('wealth'), r('property'), r('haven')],
  },
  {
    id: 'criminal',
    name: 'Criminal',
    group: 'mortal',
    it: 'Vivevi infrangendo la legge.',
    skills: [
      s('athletics', 'Running'),
      s('awareness'),
      s('fighting', 'Fighting Dirty'),
      s('sabotage', 'Burglary'),
      s('subterfuge'),
    ],
    resources: [r('contact', 'Fence'), r('wealth'), r('mask')],
  },
  {
    id: 'holy-person',
    name: 'Holy Person',
    group: 'mortal',
    it: 'Hai dedicato la vita a una fede.',
    skills: [
      s('awareness'),
      s('expression', 'Oratory'),
      s('knowledge', 'Religion'),
      s('medicine'),
      s('persuasion'),
    ],
    resources: [r('status', 'Local Church'), r('contact', 'Clergy'), r('wealth')],
  },
  {
    id: 'investigator',
    name: 'Investigator',
    group: 'mortal',
    it: 'Detective o investigatore privato.',
    skills: [
      s('awareness'),
      s('investigation', 'Crime Scene'),
      s('sabotage'),
      s('shooting', 'Light Firearms'),
      s('subterfuge', 'Skulking'),
    ],
    resources: [r('ally', 'Former Partner'), r('contact', 'Criminal Informant'), r('mask')],
  },
  {
    id: 'mechanic',
    name: 'Mechanic',
    group: 'mortal',
    it: 'Costruivi e riparavi motori e macchine.',
    skills: [
      s('craft'),
      s('investigation'),
      s('knowledge', 'Engineering'),
      s('sabotage'),
      s('shooting'),
    ],
    resources: [r('vehicle'), r('repository', 'Mechanical Parts'), r('contact', 'Fence')],
  },
  {
    id: 'military',
    name: 'Military',
    group: 'mortal',
    it: 'Addestrato nelle forze armate.',
    skills: [
      s('athletics'),
      s('fighting'),
      s('medicine', 'First Aid'),
      s('shooting', 'Heavy Firearms'),
      s('survival'),
    ],
    resources: [r('repository', 'Weapons'), r('contact', 'Military'), r('ally', 'Former comrades')],
  },
  {
    id: 'occultist',
    name: 'Occultist',
    group: 'mortal',
    it: 'Studioso ossessivo di ciò che altri chiamano superstizione.',
    skills: [
      s('awareness', 'Supernatural'),
      s('investigation', 'Physical Media'),
      s('knowledge', 'Occult'),
      s('sabotage'),
      s('subterfuge', 'Stealth'),
    ],
    resources: [r('repository', 'Occult library'), r('haven'), r('herd', 'Cult')],
  },
  {
    id: 'physician',
    name: 'Physician',
    group: 'mortal',
    it: 'Medico con una specializzazione.',
    skills: [
      s('investigation'),
      s('knowledge', 'Biology'),
      pick('medicine', 'a medical field'),
      s('persuasion'),
      s('survival'),
    ],
    resources: [r('wealth'), r('herd', 'Patients'), r('contact', 'Nurse')],
  },
  {
    id: 'politician',
    name: 'Politician',
    group: 'mortal',
    it: 'Politico tra accordi e opinione pubblica.',
    skills: [
      s('awareness', 'Insight'),
      s('investigation'),
      s('knowledge', 'Politics'),
      s('persuasion', 'Negotiation'),
      s('subterfuge', 'Deceit'),
    ],
    resources: [r('wealth'), r('status', 'Political'), r('haven')],
  },
  {
    id: 'programmer',
    name: 'Programmer',
    group: 'mortal',
    it: 'Crei, ripari o saboti software e reti.',
    skills: [
      s('craft', 'Computers'),
      s('investigation', 'Digital Media'),
      s('persuasion'),
      s('sabotage', 'Hacking'),
      s('subterfuge'),
    ],
    resources: [r('repository', 'Electronic hardware'), r('ally', 'Hacker friend'), r('mask')],
  },
  {
    id: 'scientist',
    name: 'Scientist',
    group: 'mortal',
    it: 'Ricercatore in un campo scientifico.',
    skills: [
      s('awareness'),
      s('craft'),
      s('investigation', 'Physical Media'),
      pick('knowledge', 'a scientific field'),
      s('persuasion'),
    ],
    resources: [r('contact', 'Lab Technician'), r('repository', 'Chemical lab'), r('haven')],
  },
  {
    id: 'technician',
    name: 'Technician',
    group: 'mortal',
    it: 'Pratico con gli attrezzi, sai arrangiarti.',
    skills: [
      s('athletics'),
      s('craft', 'Improvised'),
      s('fighting'),
      s('sabotage', 'Security Systems'),
      s('subterfuge'),
    ],
    resources: [r('vehicle'), r('repository', 'Tools'), r('haven')],
  },
  {
    id: 'therapist',
    name: 'Therapist',
    group: 'mortal',
    it: 'Curavi la mente senza farmaci né chirurgia.',
    skills: [
      s('awareness', 'Insight'),
      s('knowledge'),
      s('medicine', 'Psychology'),
      s('persuasion'),
      s('subterfuge'),
    ],
    resources: [r('herd'), r('haven'), r('contact', 'Psychiatric Hospital Worker')],
  },
  {
    id: 'tracker',
    name: 'Tracker',
    group: 'mortal',
    it: 'Cacciatore che segue tracce e piazza trappole.',
    skills: [
      s('awareness'),
      s('craft', 'Traps'),
      s('fighting'),
      s('shooting'),
      s('survival', 'Wilderness Hunting'),
    ],
    resources: [r('haven'), r('ally', 'Fellow hunter'), r('repository', 'Armory')],
  },
  // Neonate vampire
  {
    id: 'blood-deliverer',
    name: 'Blood Deliverer',
    group: 'neonate',
    it: 'Procuravi e consegnavi sangue ad altri vampiri.',
    skills: [
      s('athletics'),
      s('awareness'),
      s('persuasion'),
      s('sabotage'),
      s('subterfuge', 'Skulking'),
    ],
    resources: [r('vehicle'), r('wealth'), r('contact')],
  },
  {
    id: 'clean-up-crew',
    name: 'Clean Up Crew',
    group: 'neonate',
    it: 'Ripulivi i disastri lasciati da altri vampiri.',
    skills: [
      s('athletics'),
      s('fighting'),
      s('investigation', 'Crime Scene'),
      s('sabotage'),
      s('subterfuge'),
    ],
    resources: [
      r('contact', 'Vampiric Authority'),
      r('vehicle'),
      r('repository', 'Cleaning Materials'),
    ],
  },
  {
    id: 'herald',
    name: 'Herald',
    group: 'neonate',
    it: 'Accoglievi e annunciavi in Elysium.',
    skills: [
      s('expression', 'Oratory'),
      s('knowledge', 'Sect'),
      s('persuasion'),
      s('subterfuge'),
      s('survival'),
    ],
    resources: [r('status', 'Sect'), r('contact', 'Elysium Guard or Harpy'), r('wealth')],
  },
  {
    id: 'hound',
    name: 'Hound',
    group: 'neonate',
    it: 'Il braccio armato dell’autorità locale (anche Sweeper o Ductus).',
    skills: [
      s('fighting'),
      s('investigation', 'Streetwise'),
      s('shooting'),
      s('subterfuge'),
      s('survival', 'Urban Tracking'),
    ],
    resources: [r('status', 'Sect'), r('repository', 'Armory'), r('contact', 'Vampiric Authority')],
  },
  {
    id: 'mask-forger',
    name: 'Mask Forger',
    group: 'neonate',
    it: 'Falsificavi documenti per i vampiri.',
    skills: [
      s('awareness', 'Attention to Detail'),
      s('craft', 'Forgery'),
      s('investigation', 'Streetwise'),
      s('shooting'),
      s('subterfuge', 'Deceit'),
    ],
    resources: [r('contact', 'Fence'), r('ally', 'Local Gang'), r('wealth')],
  },
  {
    id: 'molotov',
    name: 'Molotov',
    group: 'neonate',
    it: 'Agitatore che diffonde il verbo della setta.',
    skills: [
      s('athletics'),
      s('fighting'),
      s('persuasion', 'Intimidation'),
      s('sabotage'),
      s('subterfuge'),
    ],
    resources: [r('contact', 'Sect Leader'), r('status', 'Sect'), r('repository', 'Armory')],
  },
  {
    id: 'pack-priest',
    name: 'Pack Priest',
    group: 'neonate',
    it: 'Guida spirituale di un branco Sabbat.',
    skills: [
      s('awareness', 'Empathy'),
      s('expression', 'Oratory'),
      s('fighting'),
      s('knowledge', 'Occult'),
      s('persuasion', 'Fraternize'),
    ],
    resources: [r('contact', 'Local Bishop'), r('status', 'Sabbat'), r('haven')],
  },
  {
    id: 'torpor-sentinel',
    name: 'Torpor Sentinel',
    group: 'neonate',
    it: 'Vegliavi un anziano in torpore.',
    skills: [
      s('awareness'),
      s('fighting'),
      s('knowledge', 'Vampire History'),
      s('subterfuge', 'Stealth'),
      s('survival'),
    ],
    resources: [r('status', 'Sect'), r('ally', 'Elder Vampire'), r('haven')],
  },
  // Ancilla vampire
  {
    id: 'blood-genealogist',
    name: 'Blood Genealogist',
    group: 'ancilla',
    it: 'Ricostruivi le stirpi vampiriche.',
    skills: [
      s('awareness'),
      s('investigation', 'Physical Media'),
      s('knowledge', 'Vampire History'),
      s('persuasion', 'Negotiation'),
      s('sabotage', 'Hacking'),
    ],
    resources: [
      r('status', 'Sect'),
      r('ally', 'Elder Vampire'),
      r('repository', 'Vampiric Library'),
    ],
  },
  {
    id: 'chameleon',
    name: 'Chameleon',
    group: 'ancilla',
    it: 'Spia infiltrata in un’altra setta.',
    skills: [
      s('athletics'),
      s('awareness'),
      s('investigation'),
      s('persuasion', 'Fraternize'),
      s('subterfuge', 'Disguise'),
    ],
    resources: [r('ally', 'Other Sect'), r('mask'), r('status', 'Sect')],
  },
  {
    id: 'diplomat',
    name: 'Diplomat',
    group: 'ancilla',
    it: 'Rappresentavi la setta presso le corti rivali (anche Emissary).',
    skills: [
      s('awareness', 'Empathy'),
      s('expression', 'Oratory'),
      s('investigation'),
      s('persuasion', 'Fraternize', 'Negotiation'),
      s('subterfuge'),
    ],
    resources: [r('haven'), r('status', 'Sect'), r('mask')],
  },
  {
    id: 'elysium-guard',
    name: 'Elysium Guard',
    group: 'ancilla',
    it: 'Garantivi la pace dell’Elysium.',
    skills: [
      s('athletics', 'Running'),
      s('awareness', 'Vigil'),
      s('fighting'),
      s('persuasion', 'Diplomacy'),
      s('shooting'),
    ],
    resources: [r('status', 'Sect'), r('contact', 'Harpy or Herald'), r('haven')],
  },
  {
    id: 'harpy',
    name: 'Harpy',
    group: 'ancilla',
    it: 'Facevi e disfacevi le reputazioni.',
    skills: [
      s('awareness'),
      s('expression'),
      s('knowledge', 'Vampire Society'),
      s('persuasion'),
      s('subterfuge', 'Deceit'),
    ],
    resources: [r('haven'), r('status', 'Sect'), r('contact', 'Elysium Guard or Herald')],
  },
  {
    id: 'sheriff',
    name: 'Sheriff',
    group: 'ancilla',
    it: 'Facevi rispettare le leggi vampiriche (anche Warlord).',
    skills: [
      s('awareness', 'Insight'),
      s('investigation'),
      s('knowledge', 'Vampire Politics'),
      s('persuasion', 'Intimidation'),
      s('survival', 'Urban Tracking'),
    ],
    resources: [r('ally', 'Hound/Sweeper'), r('repository', 'Armory'), r('status', 'Sect')],
  },
];

export const LIFEPATHS_BY_ID: ReadonlyMap<string, Lifepath> = new Map(
  LIFEPATHS.map((l) => [l.id, l]),
);

// ---------- Step 6: merits ----------

export interface Merit {
  id: string;
  name: string;
  prereq?: Prereq;
  it: string;
}

const VD = VAMPIRE_OR_DUSKBORN;

export const MERITS: readonly Merit[] = [
  {
    id: 'bond-famulus',
    name: 'Bond Famulus',
    prereq: { creatures: VD, dots: [need('animalism')] },
    it: 'Un tuo animale ghoul diventa un famiglio potenziato.',
  },
  { id: 'bond-resistant', name: 'Bond Resistant', it: 'Resisti meglio ai Blood Bond.' },
  {
    id: 'chain-the-psyche',
    name: 'Chain the Psyche',
    prereq: { dots: [need('dominate', 3)] },
    it: 'Chi disobbedisce al tuo Dominate prova dolore.',
  },
  {
    id: 'code-of-honor',
    name: 'Code of Honor',
    it: 'Un codice personale ti aiuta a restare lucido.',
  },
  {
    id: 'eidetic-memory',
    name: 'Eidetic Memory',
    it: 'Ricordi nei dettagli ciò che hai visto e sentito.',
  },
  {
    id: 'enchanting-presence',
    name: 'Enchanting Presence',
    prereq: { creatures: VD, dots: [need('presence', 2)] },
    it: 'I mortali resistono peggio ai tuoi poteri di Presence.',
  },
  {
    id: 'fleetness',
    name: 'Fleetness',
    prereq: { dots: [need('celerity')] },
    it: 'Bonus ai test di Dexterity fuori dai conflitti.',
  },
  { id: 'flexible-limbs', name: 'Flexible Limbs', it: 'Bonus per sgusciare via e liberarti.' },
  {
    id: 'forgettable-face',
    name: 'Forgettable Face',
    it: 'Bonus a Subterfuge per passare inosservato.',
  },
  { id: 'friends-in-high-places', name: 'Friends in High Places', it: 'Bonus con l’alta società.' },
  { id: 'friends-in-low-places', name: 'Friends in Low Places', it: 'Bonus con la malavita.' },
  {
    id: 'from-a-different-time',
    name: 'From a Different Time',
    prereq: { creatures: ['vampire'] },
    it: 'Bonus su tutto ciò che riguarda l’epoca del tuo Abbraccio.',
  },
  {
    id: 'hunger-strength',
    name: 'Hunger Strength',
    prereq: { creatures: VD },
    it: 'Con 3 o più dadi Fame, bonus a Strength.',
  },
  {
    id: 'intimidating-presence',
    name: 'Intimidating Presence',
    it: 'Bonus per intimidire chi ti vede.',
  },
  {
    id: 'might',
    name: 'Might',
    prereq: { dots: [need('potence')] },
    it: 'Bonus a sollevare e trasportare.',
  },
  {
    id: 'monstrous-facade',
    name: 'Monstrous Facade',
    prereq: { creatures: VD },
    it: 'Mostri l’aspetto della Bestia per spaventare.',
  },
  {
    id: 'prestigious-sire',
    name: 'Prestigious Sire',
    prereq: { creatures: ['duskborn', 'ghoul', 'vampire'] },
    it: 'La fama del tuo Sire ti aiuta con una setta o un clan.',
  },
  {
    id: 'prowess',
    name: 'Prowess',
    prereq: { dots: [need('potence', 2)] },
    it: 'Bonus agli attacchi senz’armi pari a Potence.',
  },
  { id: 'street-rat', name: 'Street Rat', it: 'Conosci a memoria le strade di una città.' },
  {
    id: 'subdued-hunger',
    name: 'Subdued Hunger',
    prereq: { creatures: VD },
    it: 'Bonus a resistere alla frenzy da fame.',
  },
  {
    id: 'tough-skin',
    name: 'Tough Skin',
    prereq: { creatures: VD, dots: [need('fortitude', 3)] },
    it: 'Riduci di 1 in più i danni subiti.',
  },
  { id: 'vengeance', name: 'Vengeance', it: 'Bonus contro chi hai giurato di punire.' },
  {
    id: 'wrecker',
    name: 'Wrecker',
    prereq: { dots: [need('potence', 2)] },
    it: 'Bonus a distruggere oggetti.',
  },
];

export const MERITS_BY_ID: ReadonlyMap<string, Merit> = new Map(MERITS.map((m) => [m.id, m]));

// ---------- Step 7: Paths of Enlightenment ----------

export interface Path {
  id: string;
  name: string;
  it: string;
}

/** Only with the Storyteller's approval (p. 50). */
export const PATHS: readonly Path[] = [
  {
    id: 'caine',
    name: 'Path of Caine',
    it: 'Emulare il primo vampiro e studiare la propria natura.',
  },
  { id: 'honor', name: 'Path of Honor', it: 'Dovere, parola data e regole ferree.' },
  { id: 'power', name: 'Path of Power', it: 'Dominare il mondo e giocare sul lungo periodo.' },
  {
    id: 'temptation',
    name: 'Path of Temptation',
    it: 'Indulgere nei vizi e indurre gli altri a farlo.',
  },
  {
    id: 'beast',
    name: 'Path of the Beast',
    it: 'Essere il predatore perfetto senza perdere il controllo.',
  },
];

// ---------- Step 9: flaws ----------

export interface ExampleFlaw {
  id: string;
  name: string;
  it: string;
}

/** Examples only: players can write their own (p. 56). */
export const FLAWS: readonly ExampleFlaw[] = [
  { id: 'addiction', name: 'Addiction', it: 'Dipendenza da una sostanza che cerchi nel sangue.' },
  { id: 'bondable-blood', name: 'Bondable Blood', it: 'Più vulnerabile ai Blood Bond.' },
  { id: 'cursed', name: 'Cursed', it: 'Una maledizione soprannaturale.' },
  { id: 'dark-secret', name: 'Dark Secret', it: 'Un segreto che ti rovinerebbe.' },
  { id: 'deep-sleeper', name: 'Deep Sleeper', it: 'Fatichi a svegliarti dal riposo diurno.' },
  { id: 'eerie-presence', name: 'Eerie Presence', it: 'I mortali percepiscono che sei strano.' },
  { id: 'haunted', name: 'Haunted', it: 'Uno spirito arrabbiato ti perseguita.' },
  { id: 'hunted', name: 'Hunted', it: 'Un gruppo ti dà la caccia.' },
  { id: 'infamous-sire', name: 'Infamous Sire', it: 'Il tuo Sire è malvisto.' },
  { id: 'lost-love', name: 'Lost Love', it: 'Il dolore per una persona amata perduta.' },
  {
    id: 'masquerade-breaker',
    name: 'Masquerade Breaker',
    it: 'Hai infranto la Masquerade e qualcuno ti tiene in pugno.',
  },
  { id: 'nightmares', name: 'Nightmares', it: 'Incubi che ti perseguitano anche da sveglio.' },
  { id: 'permanent-fangs', name: 'Permanent Fangs', it: 'Le zanne non si ritirano.' },
  { id: 'phobia', name: 'Phobia', it: 'Una paura incontrollabile.' },
  { id: 'short-fuse', name: 'Short Fuse', it: 'Ti arrabbi per un nonnulla.' },
  {
    id: 'sleeping-with-the-enemy',
    name: 'Sleeping with the Enemy',
    it: 'Un legame intimo con un nemico.',
  },
  { id: 'smell-of-the-grave', name: 'Smell of the Grave', it: 'Odori di terra e tomba.' },
  { id: 'superstition', name: 'Superstition', it: 'Una superstizione ti condiziona davvero.' },
];
