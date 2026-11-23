// Core lists of the Alpha 2.0 playtest character sheet (Player Packet ch. 2).
// Game terms stay in English, as everywhere else in the bot; `it` lines are our own short summaries.

export const ATTRIBUTE_CATEGORIES = ['physical', 'social', 'mental'] as const;
export type AttributeCategory = (typeof ATTRIBUTE_CATEGORIES)[number];

export const ATTRIBUTES = [
  'strength',
  'dexterity',
  'stamina',
  'charisma',
  'manipulation',
  'composure',
  'intelligence',
  'wits',
  'resolve',
] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

/** Power / finesse / resistance per category (p. 37). */
export const ATTRIBUTES_BY_CATEGORY: Record<AttributeCategory, readonly Attribute[]> = {
  physical: ['strength', 'dexterity', 'stamina'],
  social: ['charisma', 'manipulation', 'composure'],
  mental: ['intelligence', 'wits', 'resolve'],
};

export const ATTRIBUTE_NAMES: Record<Attribute, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  stamina: 'Stamina',
  charisma: 'Charisma',
  manipulation: 'Manipulation',
  composure: 'Composure',
  intelligence: 'Intelligence',
  wits: 'Wits',
  resolve: 'Resolve',
};

export const SKILLS = [
  'athletics',
  'awareness',
  'craft',
  'expression',
  'fighting',
  'investigation',
  'knowledge',
  'medicine',
  'persuasion',
  'sabotage',
  'shooting',
  'subterfuge',
  'survival',
] as const;
export type Skill = (typeof SKILLS)[number];

export interface SkillInfo {
  name: string;
  it: string;
  /** Example specialties (p. 40-43); players can also invent their own. */
  specialties: readonly string[];
}

export const SKILL_INFO: Record<Skill, SkillInfo> = {
  athletics: {
    name: 'Athletics',
    it: 'Allenamento fisico: correre, arrampicarsi, saltare.',
    specialties: ['Climbing', 'Lifting', 'Running', 'Throwing'],
  },
  awareness: {
    name: 'Awareness',
    it: 'Cogliere segnali sottili nelle persone, nell’ambiente e nel soprannaturale.',
    specialties: ['Empathy', 'Insight', 'Instinct', 'Supernatural'],
  },
  craft: {
    name: 'Craft',
    it: 'Costruire, riparare e improvvisare attrezzi e congegni.',
    specialties: ['Carpentry', 'Computers', 'Engines', 'Forgery', 'Improvised'],
  },
  expression: {
    name: 'Expression',
    it: 'Esprimersi con un’arte: scrittura, musica, recitazione.',
    specialties: ['Acting', 'Drawing', 'Music', 'Sculpting', 'Writing'],
  },
  fighting: {
    name: 'Fighting',
    it: 'Combattimento corpo a corpo, a mani nude o con armi da mischia.',
    specialties: ['Ancient Weaponry', 'Fighting Dirty', 'Hand-to-Hand', 'Improvised Weaponry'],
  },
  investigation: {
    name: 'Investigation',
    it: 'Trovare informazioni nascoste con metodo e deduzione.',
    specialties: ['Crime Scene', 'Digital Media', 'Gossip', 'Physical Media', 'Streetwise'],
  },
  knowledge: {
    name: 'Knowledge',
    it: 'Cultura e conoscenze accademiche o erudite.',
    specialties: ['Chemistry', 'History', 'Law', 'Linguistics', 'Occult', 'Politics'],
  },
  medicine: {
    name: 'Medicine',
    it: 'Pratica medica, dal primo soccorso alla chirurgia e alla psicologia.',
    specialties: ['Animals', 'First Aid', 'Psychology', 'Surgery', 'Toxicology'],
  },
  persuasion: {
    name: 'Persuasion',
    it: 'Convincere gli altri, con garbo o con la forza.',
    specialties: [
      'Etiquette',
      'Fraternize',
      'Intimidation',
      'Leadership',
      'Negotiation',
      'Seduction',
    ],
  },
  sabotage: {
    name: 'Sabotage',
    it: 'Superare sistemi di sicurezza e distruggere cose.',
    specialties: ['Burglary', 'Explosives', 'Hacking', 'Security Systems'],
  },
  shooting: {
    name: 'Shooting',
    it: 'Combattimento a distanza, dall’arco all’arma da fuoco.',
    specialties: ['Ancient Weaponry', 'Heavy Firearms', 'Improvised Weaponry', 'Light Firearms'],
  },
  subterfuge: {
    name: 'Subterfuge',
    it: 'Muoversi non visti e mentire in modo convincente.',
    specialties: ['Deceit', 'Disguise', 'Skulking', 'Sleight of Hand', 'Stealth'],
  },
  survival: {
    name: 'Survival',
    it: 'Cavarsela in condizioni ostili, con animali e tracce.',
    specialties: ['Animal Handling', 'Foraging', 'Hunting', 'Shelter', 'Tracking'],
  },
};

/** Resource types (p. 53-55). Each Resource is a type plus a specific subject. */
export const RESOURCE_KINDS = [
  'haven',
  'property',
  'repository',
  'vehicle',
  'ally',
  'contact',
  'fame',
  'herd',
  'mask',
  'mentor',
  'servants',
  'status',
  'wealth',
] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export interface ResourceKindInfo {
  name: string;
  group: 'physical' | 'social' | 'wealth';
  it: string;
}

export const RESOURCE_INFO: Record<ResourceKind, ResourceKindInfo> = {
  haven: { name: 'Haven', group: 'physical', it: 'Rifugio sicuro per il riposo diurno.' },
  property: { name: 'Property', group: 'physical', it: 'Immobili posseduti.' },
  repository: {
    name: 'Repository',
    group: 'physical',
    it: 'Una collezione utile: biblioteca, armeria, officina.',
  },
  vehicle: { name: 'Vehicle', group: 'physical', it: 'Un mezzo, dalla moto al jet.' },
  ally: {
    name: 'Ally',
    group: 'social',
    it: 'Qualcuno che ti aiuta per affetto: Minions (3 per punto) o un Retainer.',
  },
  contact: { name: 'Contact', group: 'social', it: 'Una fonte di informazioni in un ambiente.' },
  fame: { name: 'Fame', group: 'social', it: 'Notorietà in una cultura o sottocultura.' },
  herd: { name: 'Herd', group: 'social', it: 'Mortali da cui nutrirsi senza rischi.' },
  mask: { name: 'Mask', group: 'social', it: 'Identità false ben costruite.' },
  mentor: { name: 'Mentor', group: 'social', it: 'Una guida esperta.' },
  servants: {
    name: 'Servants',
    group: 'social',
    it: 'Chi ti obbedisce perché costretto: Minions o un Retainer.',
  },
  status: { name: 'Status', group: 'social', it: 'Autorità in una società, mortale o vampirica.' },
  wealth: { name: 'Wealth', group: 'wealth', it: 'Denaro e beni liquidi.' },
};
