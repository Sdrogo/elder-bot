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

  'cmd.npc.description': 'Test pour un PNJ : lance la réserve indiquée dans son profil',
  'opt.npc.dice': "Réserve du PNJ (Physique, Sociale, Mentale ou d'une Compétence)",

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
  'cmd.prolonged.status.description': 'Affiche ta tâche prolongée',
  'cmd.prolonged.cancel.description': 'Ferme ta tâche prolongée',

  'cmd.session.description': 'Sessions, Conteur et langue de la table',
  'cmd.session.new.description': 'Nouvelle session : celui qui la lance devient Conteur',
  'cmd.session.end.description':
    'Termine la session : remet la table à zéro et libère le rôle de Conteur',
  'cmd.session.storyteller.description': 'Affiche ou change le Conteur de ce salon',
  'opt.session.user': 'Le nouveau Conteur',
  'cmd.session.language.description': 'Langue des réponses du bot dans ce salon',
  'opt.session.language': 'Langue de la table, ou auto pour suivre la langue Discord de chacun',
  'choice.language.auto': 'Auto (langue de Discord)',

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

  // /elder npc and /elder contest.
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

  // /elder session and the Storyteller.
  'auth.storytellerOnly':
    'Seul le Conteur de cette table peut faire ça. Celui qui lance `/elder session new` devient Conteur, et peut passer le rôle avec `/elder session storyteller`.',
  'session.storyteller.title': 'Conteur',
  'session.storyteller.current': 'Conteur de la table : {who}.',
  'session.storyteller.none': 'personne : celui qui lance `/elder session new` prend le rôle',
  'session.storyteller.set': '{user} est le Conteur de cette table.',
  'session.ended.title': 'Session terminée',
  'session.ended':
    "Tâches prolongées et langue de la table réinitialisées. La table n'a plus de Conteur : le prochain `/elder session new` en désigne un.",
  'session.new.title': 'Nouvelle session',
  'session.new':
    "La table est prête. Ajoute tes dés de Hunger à chaque jet avec l'option `hunger`.",
  'session.language.title': 'Langue',
  'session.language.set': 'Langue de la table : {language}.',
  'session.language.auto': 'Le bot répond à chacun dans sa propre langue Discord.',

  'error.generic': "Quelque chose s'est mal passé.",
};
