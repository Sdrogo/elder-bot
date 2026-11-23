import { emptyDraft, type SheetDraft } from '../../src/game/creation.js';

/** A complete, legal neonate Brujah built by hand from the Player Packet rules. */
export function brujah(): SheetDraft {
  return {
    ...emptyDraft('neonate'),
    clan: 'brujah',
    sire: 'caring',
    sireDiscipline: 'presence',
    generation: 13,
    lifepaths: [
      {
        id: 'criminal',
        skills: { athletics: 2, fighting: 2, subterfuge: 1 },
        resources: [1, 1, 1],
      },
      {
        id: 'investigator',
        skills: { awareness: 2, investigation: 2, shooting: 1 },
        resources: [1, 1, 1],
      },
    ],
    attributePriority: ['physical', 'social', 'mental'],
    attributes: {
      strength: 4,
      dexterity: 3,
      stamina: 3,
      charisma: 3,
      manipulation: 2,
      composure: 3,
      intelligence: 2,
      wits: 2,
      resolve: 2,
    },
    extraSkills: { persuasion: 3, sabotage: 2, survival: 1, medicine: 1, knowledge: 1 },
    disciplines: { celerity: 1, potence: 2, presence: 1 },
    powers: ['rapid-reflexes', 'bull-rush', 'bone-breaker', 'awe'],
    clanTraits: ['might-of-the-ages', 'bloody-ballet'],
    merits: ['might'],
    extraResources: [
      { kind: 'wealth', detail: '', dots: 1 },
      { kind: 'haven', detail: 'Squat', dots: 2 },
    ],
    flaws: [{ id: 'short-fuse', name: 'Short Fuse' }],
    name: 'Nico',
  };
}
