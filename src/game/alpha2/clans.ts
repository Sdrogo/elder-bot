// Clans and clan traits (Player Packet ch. 3). Names are game terms; `it` lines are our own summaries.
// Seven clans are still "in development" in Alpha 2.0 (no curse, frenzy or traits): they are listed
// but not selectable until the playtest completes them (Andrea, 2026-11-23).

import type { Discipline } from './disciplines.js';
import { need, type Prereq } from './prereq.js';

export const ALPHA2_CLANS = [
  'banuhaqim',
  'brujah',
  'gangrel',
  'giovanni',
  'lasombra',
  'malkavian',
  'ministry',
  'nosferatu',
  'ravnos',
  'salubri',
  'toreador',
  'tremere',
  'tzimisce',
  'ventrue',
  'caitiff',
] as const;
export type Alpha2Clan = (typeof ALPHA2_CLANS)[number];

export interface ClanInfo {
  name: string;
  it: string;
  /** Clan Disciplines; Tzimisce chooses its third one from `choice`. */
  disciplines: readonly Discipline[];
  choice?: readonly Discipline[];
  /** False while the packet marks the clan "in development". */
  complete: boolean;
  beast?: string;
  curse?: string;
  frenzy?: string;
}

export const CLAN_INFO: Record<Alpha2Clan, ClanInfo> = {
  banuhaqim: {
    name: 'Banu Haqim',
    it: 'Giudici e carnefici tra i vampiri.',
    disciplines: ['bloodsorcery', 'celerity', 'obfuscate'],
    complete: false,
  },
  brujah: {
    name: 'Brujah',
    it: 'Ribelli e rivoluzionari dal sangue che ribolle.',
    disciplines: ['celerity', 'potence', 'presence'],
    complete: true,
    beast: 'Anti-Authority',
    curse: 'Boiling Passion',
    frenzy: 'Rebellion',
  },
  gangrel: {
    name: 'Gangrel',
    it: 'Sopravvissuti solitari, più vicini alle bestie che agli uomini.',
    disciplines: ['animalism', 'celerity', 'fortitude'],
    complete: true,
    beast: 'Animalistic',
    curse: 'Embraced Beast',
    frenzy: 'Feral Impulses',
  },
  giovanni: {
    name: 'Giovanni',
    it: 'Ossessionati dalla morte e dai suoi segreti.',
    disciplines: ['auspex', 'necromancy', 'potence'],
    complete: false,
  },
  lasombra: {
    name: 'Lasombra',
    it: 'La mano nascosta nell’ombra che muove le pedine.',
    disciplines: ['dominate', 'oblivion', 'potence'],
    complete: true,
    beast: 'Punisher',
    curse: 'Shadow Presence',
    frenzy: 'Ruthlessness',
  },
  malkavian: {
    name: 'Malkavian',
    it: 'Menti che vedono oltre la realtà, unite in una rete di visioni.',
    disciplines: ['auspex', 'dominate', 'obfuscate'],
    complete: false,
  },
  ministry: {
    name: 'Ministry',
    it: 'Liberatori e corruttori che predicano la scoperta di sé.',
    disciplines: ['corruption', 'fortitude', 'obfuscate'],
    complete: true,
    beast: 'Enticer',
    curse: 'Sunlight Bane',
    frenzy: 'Transgression',
  },
  nosferatu: {
    name: 'Nosferatu',
    it: 'Il clan dei segreti e della furtività, dall’aspetto mostruoso.',
    disciplines: ['animalism', 'obfuscate', 'potence'],
    complete: true,
    beast: 'Secretive',
    curse: 'External Beast',
    frenzy: 'Cryptophilia',
  },
  ravnos: {
    name: 'Ravnos',
    it: 'Viandanti e signori dei crocevia.',
    disciplines: ['obfuscate', 'presence', 'tellurgy'],
    complete: false,
  },
  salubri: {
    name: 'Salubri',
    it: 'Guaritori in cerca di redenzione e guerrieri in cerca di vendetta.',
    disciplines: ['auspex', 'fortitude', 'obfuscate'],
    complete: false,
  },
  toreador: {
    name: 'Toreador',
    it: 'Artisti e esteti ossessionati dalla bellezza.',
    disciplines: ['auspex', 'celerity', 'presence'],
    complete: true,
    beast: 'Idol',
    curse: 'Starved for Beauty',
    frenzy: 'Obsession',
  },
  tremere: {
    name: 'Tremere',
    it: 'Ex maghi la cui stregoneria ora è legata al sangue.',
    disciplines: ['auspex', 'bloodsorcery', 'dominate'],
    complete: false,
  },
  tzimisce: {
    name: 'Tzimisce',
    it: 'Ossessionati dal possesso e dalla trasformazione della carne.',
    disciplines: ['animalism', 'dominate'],
    choice: ['tellurgy', 'vicissitude'],
    complete: true,
    beast: 'Possessive',
    curse: 'Grounded Slumber',
    frenzy: 'Covetousness',
  },
  ventrue: {
    name: 'Ventrue',
    it: 'Il sedicente Clan dei Re, da sempre vicino al potere.',
    disciplines: ['dominate', 'fortitude', 'presence'],
    complete: true,
    beast: 'Superior',
    curse: 'Rarefied Palate',
    frenzy: 'Arrogance',
  },
  caitiff: {
    name: 'Caitiff',
    it: 'Senza clan: tre Discipline casuali, spesso disprezzati.',
    disciplines: [],
    complete: false,
  },
};

/** The clan's Disciplines for a character, counting Tzimisce's chosen third one. */
export function clanDisciplines(clan: Alpha2Clan, choice?: Discipline): Discipline[] {
  const info = CLAN_INFO[clan];
  const extra = choice && info.choice?.includes(choice) ? [choice] : [];
  return [...info.disciplines, ...extra];
}

export interface ClanTrait {
  id: string;
  clan: Alpha2Clan;
  name: string;
  prereq: Prereq;
  it: string;
}

const N: Prereq['minTier'] = 'neonate';
const A: Prereq['minTier'] = 'ancilla';

/** Clan [traits]: five from Neonate and three from Ancilla for each complete clan. */
export const CLAN_TRAITS: readonly ClanTrait[] = [
  // Brujah
  {
    id: 'bloody-ballet',
    clan: 'brujah',
    name: 'Bloody Ballet',
    prereq: { minTier: N, dots: [need('celerity')] },
    it: 'Bonus all’attacco contro un bersaglio diverso dal turno prima.',
  },
  {
    id: 'inspired-defiance',
    clan: 'brujah',
    name: 'Inspired Defiance',
    prereq: { minTier: N },
    it: 'Bonus quando sfidi un’autorità o infrangi una regola.',
  },
  {
    id: 'might-of-the-ages',
    clan: 'brujah',
    name: 'Might of the Ages',
    prereq: { minTier: N, dots: [need('potence')] },
    it: 'Più danni con attacchi senz’armi o in mischia.',
  },
  {
    id: 'spark-of-rage',
    clan: 'brujah',
    name: 'Spark of Rage',
    prereq: { minTier: N, dots: [need('presence')] },
    it: 'Bonus per aizzare rabbia e violenza negli altri.',
  },
  {
    id: 'wrestler',
    clan: 'brujah',
    name: 'Wrestler',
    prereq: { minTier: N, dots: [need('potence')] },
    it: 'Bonus nella lotta; schiacciare fa danni pieni.',
  },
  {
    id: 'combat-reflexes',
    clan: 'brujah',
    name: 'Combat Reflexes',
    prereq: { minTier: A, dots: [need('celerity', 2)] },
    it: 'Bonus per evitare i colpi; ti rialzi senza perdere il movimento.',
  },
  {
    id: 'living-weapon',
    clan: 'brujah',
    name: 'Living Weapon',
    prereq: { minTier: A, dots: [need('potence', 2)] },
    it: 'Usi chi stai lottando come un’arma pesante.',
  },
  {
    id: 'words-of-power',
    clan: 'brujah',
    name: 'Words of Power',
    prereq: { minTier: A, dots: [need('potence'), need('presence')] },
    it: 'Con un discorso dai bonus agli alleati per la scena.',
  },
  // Gangrel
  {
    id: 'animal-succor',
    clan: 'gangrel',
    name: 'Animal Succor',
    prereq: { minTier: N, dots: [need('animalism')] },
    it: 'Ricavi il doppio della Vitae dagli animali.',
  },
  {
    id: 'enduring-beasts',
    clan: 'gangrel',
    name: 'Enduring Beasts',
    prereq: { minTier: N, dots: [need('animalism'), need('fortitude')] },
    it: 'Gli animali che influenzi guadagnano Health.',
  },
  {
    id: 'feral-whispers-gangrel',
    clan: 'gangrel',
    name: 'Feral Whispers',
    prereq: { minTier: N, dots: [need('animalism')] },
    it: 'Parli con gli animali, che non ti temono.',
  },
  {
    id: 'safety-of-the-earth-gangrel',
    clan: 'gangrel',
    name: 'Safety of the Earth',
    prereq: { minTier: N },
    it: 'Ti fondi con la terra durante il riposo diurno.',
  },
  {
    id: 'urban-instincts',
    clan: 'gangrel',
    name: 'Urban Instincts',
    prereq: { minTier: N, dots: [need('celerity')] },
    it: 'Ti muovi più lontano nelle città che conosci.',
  },
  {
    id: 'quick-and-tough',
    clan: 'gangrel',
    name: 'Quick and Tough',
    prereq: { minTier: A, dots: [need('celerity'), need('fortitude')] },
    it: 'Con Celerity attiva, i poteri di Fortitude sono azioni minori.',
  },
  {
    id: 'surrounded-prey',
    clan: 'gangrel',
    name: 'Surrounded Prey',
    prereq: { minTier: A, dots: [need('animalism', 2)] },
    it: 'Bonus all’attacco con un animale alleato vicino.',
  },
  {
    id: 'swift-animals',
    clan: 'gangrel',
    name: 'Swift Animals',
    prereq: { minTier: A, dots: [need('celerity', 2)] },
    it: 'I tuoi animali ghoul diventano più rapidi.',
  },
  // Lasombra
  {
    id: 'controlling-shadows',
    clan: 'lasombra',
    name: 'Controlling Shadows',
    prereq: { minTier: N, dots: [need('dominate')] },
    it: 'Bonus a Dominate su chi è nell’ombra.',
  },
  {
    id: 'eyes-of-the-night',
    clan: 'lasombra',
    name: 'Eyes of the Night',
    prereq: { minTier: N, dots: [need('oblivion')] },
    it: 'Vedi nel buio naturale e nel tuo.',
  },
  {
    id: 'shroud-of-darkness',
    clan: 'lasombra',
    name: 'Shroud of Darkness',
    prereq: { minTier: N, dots: [need('oblivion')] },
    it: 'Bonus per nasconderti e spaventare i mortali.',
  },
  {
    id: 'shadow-empowerment',
    clan: 'lasombra',
    name: 'Shadow Empowerment',
    prereq: { minTier: N, dots: [need('potence')] },
    it: 'Più danni a chi è nell’ombra.',
  },
  {
    id: 'tenebrous-reach',
    clan: 'lasombra',
    name: 'Tenebrous Reach',
    prereq: { minTier: N, dots: [need('oblivion')] },
    it: 'Le ombre vicine compiono piccole azioni per te.',
  },
  {
    id: 'night-blood',
    clan: 'lasombra',
    name: 'Night Blood',
    prereq: { minTier: A, dots: [need('oblivion', 2)] },
    it: 'I tuoi ghoul vedono al buio e intimidiscono meglio.',
  },
  {
    id: 'oppressing-dominance',
    clan: 'lasombra',
    name: 'Oppressing Dominance',
    prereq: { minTier: A, dots: [need('dominate', 2)] },
    it: 'Chi esce dal tuo Dominate resta spossato.',
  },
  {
    id: 'shadow-familiar',
    clan: 'lasombra',
    name: 'Shadow Familiar',
    prereq: { minTier: A },
    it: 'Stacchi un pezzo d’ombra che agisce da solo.',
  },
  // Ministry
  {
    id: 'beguiling-words',
    clan: 'ministry',
    name: 'Beguiling Words',
    prereq: { minTier: N, dots: [need('corruption')] },
    it: 'Bonus per mentire e per smascherare chi nasconde qualcosa.',
  },
  {
    id: 'eyes-of-the-serpent',
    clan: 'ministry',
    name: 'Eyes of the Serpent',
    prereq: { minTier: N },
    it: 'Occhi da serpente che catturano lo sguardo dei mortali.',
  },
  {
    id: 'scaled-hide',
    clan: 'ministry',
    name: 'Scaled Hide',
    prereq: { minTier: N, dots: [need('fortitude')] },
    it: 'Squame che riducono i danni non baneful.',
  },
  {
    id: 'serpent-speech',
    clan: 'ministry',
    name: 'Serpent Speech',
    prereq: { minTier: N },
    it: 'Parli con serpenti e rettili.',
  },
  {
    id: 'serpents-speed',
    clan: 'ministry',
    name: 'Serpent’s Speed',
    prereq: { minTier: N },
    it: 'Le gambe diventano coda: ti muovi più lontano.',
  },
  {
    id: 'blood-of-the-serpent',
    clan: 'ministry',
    name: 'Blood of the Serpent',
    prereq: { minTier: A, dots: [need('fortitude', 2)] },
    it: 'I tuoi ghoul resistono a veleni e poteri mentali e sociali.',
  },
  {
    id: 'divine-image',
    clan: 'ministry',
    name: 'Divine Image',
    prereq: { minTier: A, dots: [need('corruption', 2)] },
    it: 'Una volta per notte assumi una forma divina.',
  },
  {
    id: 'heart-of-darkness',
    clan: 'ministry',
    name: 'Heart of Darkness',
    prereq: { minTier: A, dots: [need('fortitude', 3)] },
    it: 'Ti togli il cuore e lo custodisci in un vaso.',
  },
  // Nosferatu
  {
    id: 'feral-whispers-nosferatu',
    clan: 'nosferatu',
    name: 'Feral Whispers',
    prereq: { minTier: N, dots: [need('animalism')] },
    it: 'Parli con gli animali, che non ti temono.',
  },
  {
    id: 'ghost-in-the-machine',
    clan: 'nosferatu',
    name: 'Ghost in the Machine',
    prereq: { minTier: N, dots: [need('obfuscate')] },
    it: 'Obfuscate inganna anche i dispositivi elettronici.',
  },
  {
    id: 'lingering-obscurement',
    clan: 'nosferatu',
    name: 'Lingering Obscurement',
    prereq: { minTier: N, dots: [need('obfuscate')] },
    it: 'Mantieni Obfuscate anche andandotene.',
  },
  {
    id: 'nose-for-secrets',
    clan: 'nosferatu',
    name: 'Nose for Secrets',
    prereq: { minTier: N },
    it: 'Bonus per scoprire segreti e ottenere confidenze.',
  },
  {
    id: 'strengthened-beasts',
    clan: 'nosferatu',
    name: 'Strengthened Beasts',
    prereq: { minTier: N, dots: [need('animalism'), need('potence')] },
    it: 'Gli animali che influenzi fanno più danni.',
  },
  {
    id: 'obscured-power',
    clan: 'nosferatu',
    name: 'Obscured Power',
    prereq: { minTier: A, dots: [need('obfuscate'), need('potence')] },
    it: 'Chiudi Obfuscate per potenziare un potere di Potence.',
  },
  {
    id: 'shared-shadows',
    clan: 'nosferatu',
    name: 'Shared Shadows',
    prereq: { minTier: A, dots: [need('obfuscate', 2)] },
    it: 'Il tuo Obfuscate copre anche i tuoi animali.',
  },
  {
    id: 'watchful-blood',
    clan: 'nosferatu',
    name: 'Watchful Blood',
    prereq: { minTier: A },
    it: 'I tuoi ghoul hanno bonus a Subterfuge e Awareness.',
  },
  // Toreador
  {
    id: 'addictive-kiss',
    clan: 'toreador',
    name: 'Addictive Kiss',
    prereq: { minTier: N },
    it: 'Il tuo morso dà piacere e dipendenza.',
  },
  {
    id: 'emotional-history',
    clan: 'toreador',
    name: 'Emotional History',
    prereq: { minTier: N, dots: [need('auspex')] },
    it: 'Percepisci le emozioni rimaste in un luogo.',
  },
  {
    id: 'instinctive-insight',
    clan: 'toreador',
    name: 'Instinctive Insight',
    prereq: { minTier: N, dots: [need('celerity')] },
    it: 'In un conflitto sociale ritenti subito cambiando approccio.',
  },
  {
    id: 'star-magnetism',
    clan: 'toreador',
    name: 'Star Magnetism',
    prereq: { minTier: N, dots: [need('presence')] },
    it: 'Presence funziona anche in diretta video.',
  },
  {
    id: 'throw-voice',
    clan: 'toreador',
    name: 'Throw Voice',
    prereq: { minTier: N, dots: [need('presence'), need('auspex')] },
    it: 'Proietti la voce e Presence da un altro punto.',
  },
  {
    id: 'artists-blood',
    clan: 'toreador',
    name: 'Artist’s Blood',
    prereq: { minTier: A },
    it: 'I tuoi ghoul hanno bonus a Expression e Persuasion.',
  },
  {
    id: 'entrancing-object',
    clan: 'toreador',
    name: 'Entrancing Object',
    prereq: { minTier: A, dots: [need('presence'), need('auspex')] },
    it: 'Infondi un potere di Presence in un oggetto.',
  },
  {
    id: 'powerful-presence',
    clan: 'toreador',
    name: 'Powerful Presence',
    prereq: { minTier: A, dots: [need('presence', 2)] },
    it: 'Presence arriva più lontano e su più bersagli.',
  },
  // Tzimisce
  {
    id: 'monstrous-mien',
    clan: 'tzimisce',
    name: 'Monstrous Mien',
    prereq: { minTier: N, dots: [need('vicissitude')] },
    it: 'Alcune modifiche di Vicissitude su di te diventano permanenti.',
  },
  {
    id: 'mutant-beasts',
    clan: 'tzimisce',
    name: 'Mutant Beasts',
    prereq: { minTier: N, dots: [need('animalism')] },
    it: 'Modifichi il corpo dei tuoi animali ghoul.',
  },
  {
    id: 'safety-of-the-earth-tzimisce',
    clan: 'tzimisce',
    name: 'Safety of the Earth',
    prereq: { minTier: N },
    it: 'Ti fondi con la terra durante il riposo diurno.',
  },
  {
    id: 'strength-of-dominion',
    clan: 'tzimisce',
    name: 'Strength of Dominion',
    prereq: { minTier: N, dots: [need('dominate')] },
    it: 'Bonus a influenzare gli altri nel tuo dominio.',
  },
  {
    id: 'whispering-land',
    clan: 'tzimisce',
    name: 'Whispering Land',
    prereq: { minTier: N, dots: [need('tellurgy')] },
    it: 'Bonus a Awareness e Investigation nel tuo dominio.',
  },
  {
    id: 'malleable-blood',
    clan: 'tzimisce',
    name: 'Malleable Blood',
    prereq: { minTier: A },
    it: 'I tuoi ghoul umani possono modificare il proprio corpo.',
  },
  {
    id: 'slippery-heart',
    clan: 'tzimisce',
    name: 'Slippery Heart',
    prereq: { minTier: A, dots: [need('vicissitude', 2)] },
    it: 'Il tuo cuore cambia posto ogni notte.',
  },
  {
    id: 'treacherous-domain',
    clan: 'tzimisce',
    name: 'Treacherous Domain',
    prereq: { minTier: A },
    it: 'Gli intrusi nel tuo dominio subiscono penalità.',
  },
  // Ventrue
  {
    id: 'court-instinct',
    clan: 'ventrue',
    name: 'Court Instinct',
    prereq: { minTier: N },
    it: 'Capisci al volo chi comanda in un gruppo.',
  },
  {
    id: 'obedience',
    clan: 'ventrue',
    name: 'Obedience',
    prereq: { minTier: N, dots: [need('dominate')] },
    it: 'Dominate con sguardo, tocco o voce, anche via dispositivi.',
  },
  {
    id: 'rationalize',
    clan: 'ventrue',
    name: 'Rationalize',
    prereq: { minTier: N, dots: [need('dominate')] },
    it: 'Le vittime di Dominate credono di aver agito di loro volontà.',
  },
  {
    id: 'rarefied-smell',
    clan: 'ventrue',
    name: 'Rarefied Smell',
    prereq: { minTier: N, curse: 'Rarefied Palate' },
    it: 'Fiuti i mortali adatti al tuo palato.',
  },
  {
    id: 'unwavering-devotion',
    clan: 'ventrue',
    name: 'Unwavering Devotion',
    prereq: {
      minTier: N,
      dots: [
        [
          { discipline: 'dominate', dots: 1 },
          { discipline: 'presence', dots: 1 },
        ],
      ],
    },
    it: 'Chi è sotto i tuoi poteri resiste a quelli altrui.',
  },
  {
    id: 'commanding-leader',
    clan: 'ventrue',
    name: 'Commanding Leader',
    prereq: {
      minTier: A,
      dots: [
        need('fortitude'),
        [
          { discipline: 'dominate', dots: 1 },
          { discipline: 'presence', dots: 1 },
        ],
      ],
    },
    it: 'Estendi Fortitude agli alleati vicini.',
  },
  {
    id: 'impressive-physique',
    clan: 'ventrue',
    name: 'Impressive Physique',
    prereq: { minTier: A, dots: [need('fortitude'), need('presence')] },
    it: 'Chiudi Fortitude per potenziare un potere di Presence.',
  },
  {
    id: 'obedient-blood',
    clan: 'ventrue',
    name: 'Obedient Blood',
    prereq: { minTier: A },
    it: 'Dominate e Presence costano meno sui tuoi ghoul umani.',
  },
];

export const CLAN_TRAITS_BY_ID: ReadonlyMap<string, ClanTrait> = new Map(
  CLAN_TRAITS.map((t) => [t.id, t]),
);

export function isAlpha2Clan(v: unknown): v is Alpha2Clan {
  return typeof v === 'string' && (ALPHA2_CLANS as readonly string[]).includes(v);
}
