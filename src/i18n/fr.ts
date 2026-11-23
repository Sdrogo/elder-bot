import type { Messages } from './en.js';

// French catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Hunger, Painful Failure, Beast's Bargain, ...) stay in English.

export const fr: Messages = {
  // Slash command descriptions (names never change).
  'cmd.elder.description': 'Jets de dés pour Vampire: The Masquerade 6e',

  'cmd.roll.description':
    'Test : Attribut + Compétence (ou Discipline), réussite sur 6+, un 10 compte 2',
  'opt.roll.dice': 'Attribut + Compétence, Discipline ou Composure + Resolve',

  'opt.test.difficulty': 'Difficulté : réussites nécessaires pour gagner',
  'opt.test.bonus': 'Dés bonus (positif) ou dés de malus (négatif)',
  'opt.test.hunger': 'Tes dés de Hunger (0-5) : ils remplacent des dés normaux de la réserve',
  'opt.test.take_half':
    'Taking Half : pas de jet, la moitié de la réserve (arrondie au supérieur) en réussites',
  'opt.test.reason': 'Ce que tu tentes',

  'cmd.contest.description': "Test en opposition : celui qui a le plus de réussites l'emporte",
  'opt.contest.dice': 'Ta réserve',
  'opt.contest.opponent_dice': "Réserve de l'adversaire",
  'opt.contest.opponent': 'Joueur adverse',
  'opt.contest.attribute': 'Ton Attribut, pour les égalités',
  'opt.contest.opponent_attribute':
    "Attribut de l'adversaire, pour les égalités (un PNJ : la moitié de sa réserve)",
  'opt.contest.hunger': 'Tes dés de Hunger (0-5)',
  'opt.contest.opponent_hunger': "Dés de Hunger de l'adversaire (un PJ vampire)",
  'opt.contest.reason': "L'enjeu",

  'cmd.prolonged.description': 'Tâche prolongée : additionne les réussites de plusieurs jets',
  'cmd.prolonged.start.description': 'Commence une tâche prolongée',
  'opt.prolonged.name': 'La tâche',
  'opt.prolonged.target': 'Réussites requises',
  'opt.prolonged.tests': 'Jets disponibles',
  'choice.prolonged.target': '{count} réussites',
  'choice.prolonged.tests': '{count} jets',
  'cmd.prolonged.roll.description': 'Lance pour ta tâche prolongée',
  'opt.prolonged.dice': 'Attribut + Compétence',
  'opt.prolonged.bonus': 'Dés bonus ou de malus',
  'opt.prolonged.hunger': 'Tes dés de Hunger (0-5)',

  // Shared roll output.
  'roll.title': 'Test',
  'roll.retryTitle': '{title} (Try again)',
  'roll.field.dice': 'Dés',
  'roll.field.outcome': 'Résultat',
  'dice.count.one': '{count} dé',
  'dice.count.other': '{count} dés',
  'roll.successes.one': '{count} réussite',
  'roll.successes.other': '{count} réussites',
  'roll.successesOf.one': '{count} réussite sur {difficulty}',
  'roll.successesOf.other': '{count} réussites sur {difficulty}',
  'roll.margin': 'marge {margin}',
  'pool.bonus': 'bonus',
  'pool.difficulty': 'Difficulté {n}',
  'pool.total.one': '= **{count}** dé',
  'pool.total.other': '= **{count}** dés',
  'roll.takingHalf':
    'Taking Half : aucun dé lancé, la moitié de la réserve (arrondie au supérieur) en réussites.',
  'roll.noDice': '**Failure** : plus aucun dé dans la réserve, le test échoue automatiquement.',
  'roll.complication':
    "Aucune réussite : en plus de l'échec, voyez avec le Conteur comment la situation empire (abîmer ou perdre quelque chose, attirer l'attention, s'exposer, subir des dégâts).",
  'roll.bestial':
    "Un 1 sur un dé de Hunger : la Bête se déchaîne. Le Conteur choisit l'effet (dégâts collatéraux, nourrir la Bête, brèche de la Masquerade, risque de frénésie).",
  'roll.hungerOne': "Un 1 sur un dé de Hunger : si ce test est perdu, c'est un Bestial Failure.",
  'roll.automaticWin':
    "Réserve d'au moins deux fois la Difficulté : le Conteur peut accorder une victoire automatique sans jet.",
  'roll.retryNote': 'Deuxième tentative : Difficulté +1, tout échec est un Painful Failure.',

  'button.grantBargain': 'Accorder le marché',
  'button.refuseBargain': 'Pas de marché',
  'button.alreadyUsed': 'Ce bouton a déjà été utilisé.',
  'button.notYours': 'Seul le joueur qui a lancé peut utiliser ce bouton.',

  // Beast's Bargain and the Try again modal.
  'bargain.requested':
    "Le joueur fait appel à la Bête. Conteur : décris le prix (dégâts collatéraux, nourrir la Bête, brèche de la Masquerade, risque de frénésie), selon la marge d'échec, puis accorde-le ou refuse-le.",
  'bargain.granted.title': 'Marché conclu',
  'bargain.granted': '**Success** (victoire simple, sans marge) au prix décrit par le Conteur.',
  'bargain.refused.title': 'Pas de marché',
  'bargain.refused': "Le Conteur ne propose pas de marché : l'échec demeure.",
  'retry.modal.title': 'Try again : Difficulté {difficulty}',
  'retry.modal.dice': 'Nouvelle réserve (change Attribut ou Compétence)',
  'retry.modal.invalid': 'Saisis un nombre entier de 0 à 30.',

  // /elder roll npc:true and /elder contest.
  'npc.name': 'PNJ',
  'contest.opponent': 'Adversaire',
  'contest.title': '{a} contre {b}',
  'contest.result': 'Résultat',
  'contest.win': "**{winner}** l'emporte.",
  'contest.tie.attribute': "Égalité : **{winner}** l'emporte grâce à l'Attribut le plus élevé.",
  'contest.tie.initiator':
    "Égalité avec des Attributs égaux (ou inconnus) : celui qui a lancé l'opposition l'emporte.",
  'contest.consequences': 'Conséquences',
  'contest.bestialIfLost': "un 1 sur un dé de Hunger, Bestial Failure s'il perd l'égalité",

  // /elder prolonged.
  'prolonged.none':
    "Tu n'as aucune tâche prolongée ouverte dans ce salon. Utilise `/elder prolonged start`.",
  'prolonged.cancelled': 'Tâche prolongée « {name} » fermée.',
  'prolonged.noDice':
    "Ta réserve n'a aucun dé : cherche des avantages qui te donnent des dés en plus, ou fais-toi aider. Le jet n'a pas été compté.",
  'prolonged.disaster': 'Painful ou Bestial Failure : la tâche échoue aussitôt.',
  'prolonged.completed': 'Terminé !',
  'prolonged.failed': 'Plus de jets : tâche échouée.',
  'prolonged.progress': 'Réussites **{successes}/{target}** · jets utilisés **{done}/{max}**',

  // The Storyteller.
  // Willpower, /elder frenzy and /elder masquerade.
  'cmd.frenzy.description':
    "Résister à la frénésie : Composure + Resolve, au plus autant de dés que l'Humanité",
  'opt.frenzy.type': 'Type de frénésie',
  'opt.frenzy.dice': 'Composure + Resolve',
  'opt.frenzy.humanity': "Ton rang d'Humanité (ou de Voie) : plafonne les dés",
  'opt.frenzy.hunger': 'Tes dés de Hunger (0-5) : la Difficulté de la frénésie de faim',
  'opt.frenzy.difficulty':
    'Difficulté du Conteur (rage 2 ± modificateurs, clan 3 + modificateur de génération)',
  'frenzy.title': 'résiste à une {frenzy}',
  'frenzy.capped': "Réserve de {pool} dés, mais l'Humanité {humanity} la plafonne.",
  'frenzy.resisted': 'Résiste pour le reste de la scène.',
  'frenzy.suffered': 'Le personnage subit une {frenzy}.',
  'frenzy.painful': "Le personnage subit une {frenzy} et fait quelque chose qu'il regrettera.",
  'frenzy.error.difficulty': 'Indique la `difficulty` fixée par le Conteur.',
  'frenzy.error.noHunger':
    'La Difficulté de la frénésie de faim, ce sont tes dés de Hunger : indique `hunger` (au moins 1) ou une `difficulty`.',
  'cmd.masquerade.description':
    'Le Masquerade Tracker de cette table, avec des boutons pour le Conteur',
  'masquerade.title': 'Masquerade Tracker',
  'masquerade.threat.title': 'Threat test de la Masquerade',
  'willpower.pick': "Choisis jusqu'à {max} dés à relancer (−1 Willpower)",
  'willpower.option': 'Dé {n} : {face}',
  'willpower.spent': '1 Willpower dépensée, relancés : {changes}.',
  'button.cancel': 'Annuler',

  'auth.storytellerOnly':
    'Seul le Conteur de la Chronique jouée dans ce salon (ou un admin du serveur) peut faire ça. Le salon se choisit sur le panneau web (`/elder panel`).',

  // Characters and Chronicles.
  'cmd.sheet.description': "Affiche la fiche d'un personnage avec des boutons + et −",
  'opt.sheet.character': 'Le personnage (par défaut : le tien à cette table)',
  'opt.sheet.public': 'La montrer à tout le salon, sans boutons',
  'opt.invite.chronicle': 'La Chronique (par défaut : celle jouée dans ce salon)',
  'cmd.invite.description': 'Invite un joueur à amener un personnage dans une Chronique',
  'opt.invite.player': 'Le joueur',
  'campaign.guildOnly':
    'Les personnages et les Chroniques appartiennent à un serveur : utilise la commande là-bas.',
  'character.noneYet':
    "Tu n'as pas encore de personnage sur ce serveur. Crée-en un sur le panneau web (`/elder panel`).",
  'character.notFound': 'Personnage introuvable.',
  'character.pickOne': "Tu as plusieurs personnages : choisis-en un avec l'option `character`.",
  'character.cannotEdit':
    'Seuls le propriétaire, le Conteur de sa Chronique ou un admin du serveur peuvent modifier ce personnage.',
  'chronicle.invite.invalid': 'Choisis un autre joueur (ni toi ni un bot).',
  'character.hungerFromVitae':
    "{hunger} d'après la Vitae de {name} ({vitae}/{max}). L'option `hunger` permet de le changer.",
  'sheet.chronicle': 'Chronique : {name}',
  'sheet.noChronicle': 'aucune Chronique',
  'button.pickCharacter': 'Choisir un personnage',
  'opt.roll.npc': 'Jet pour un PNJ : la réserve de sa fiche, sans dés de Hunger',
  'button.masqueradeThreat': 'Test de menace',
  'button.prolongedCancel': 'Annuler la tâche',
  'button.willpowerBest': 'Willpower : relancer les échecs',
  'willpower.noFailures': 'Aucun dé normal raté à relancer.',
  'chronicle.noneYet': 'Aucune Chronique. Crée-en une sur le panneau web (`/elder panel`).',
  'chronicle.notFound': 'Chronique introuvable.',
  'chronicle.pickOne': "Tu mènes plusieurs Chroniques : choisis-en une avec l'option `chronicle`.",
  'chronicle.storytellerOnly':
    'Seul le Conteur de cette Chronique ou un admin du serveur peut faire ça.',
  'chronicle.invite':
    "{user}, {storyteller} t'invite dans **{chronicle}** : choisis le personnage que tu amènes.",
  'chronicle.noFreeCharacter':
    'Tous tes personnages sont déjà dans une Chronique. Crées-en un sur le panneau web (`/elder panel`), puis appuie à nouveau sur le bouton.',
  'chronicle.pickPlaceholder': 'Ton personnage',
  'chronicle.busy': '**{name}** joue déjà dans une autre Chronique.',
  'chronicle.wrongTier': '**{name}** ne peut pas rejoindre : la Chronique est de niveau {tier}.',
  'chronicle.joined.private': '**{name}** rejoint {chronicle}.',
  'chronicle.joined': '**{name}** ({user}) rejoint {chronicle}.',
  'frenzy.error.noCharacter':
    "Tu n'as pas de personnage à cette table : indique `dice` (Composure + Resolve) et `humanity`.",
  'willpower.none': "**{name}** n'a plus de Willpower.",
  'willpower.left': '{name} : Willpower {left}/{max}.',

  // Web panel.
  'cmd.panel.description': 'Lien vers le panneau web : tes personnages et tes Chroniques',
  'panel.link':
    'Tes personnages et tes Chroniques, dans le navigateur. Connecte-toi avec ton compte Discord.',
  'panel.open': 'Ouvrir le panneau',
  'panel.notConfigured': "Le panneau web n'est pas activé sur ce bot.",

  'error.generic': "Quelque chose s'est mal passé.",
};
