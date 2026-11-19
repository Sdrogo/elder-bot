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
  'cmd.masquerade.description': 'Le Masquerade Tracker de cette table',
  'cmd.masquerade.show.description': 'Affiche le Masquerade Tracker',
  'cmd.masquerade.mark.description': 'Coche des cases après une brèche (Conteur)',
  'cmd.masquerade.clear.description': 'Efface des cases quand la Masquerade est réparée (Conteur)',
  'cmd.masquerade.set.description': 'Règle le tracker à la main (Conteur)',
  'cmd.masquerade.threat.description': 'Threat test : un dé par case cochée (Conteur)',
  'opt.masquerade.mark': 'Cases à cocher (1 par défaut)',
  'opt.masquerade.clear': 'Cases à effacer (1 par défaut)',
  'opt.masquerade.reason': "Ce qui s'est passé",
  'opt.masquerade.value': 'Cases cochées, de 0 à 10',
  'masquerade.title': 'Masquerade Tracker',
  'masquerade.threat.title': 'Threat test de la Masquerade',
  'willpower.pick': "Choisis jusqu'à {max} dés à relancer (−1 Willpower)",
  'willpower.option': 'Dé {n} : {face}',
  'willpower.spent': '1 Willpower dépensée, relancés : {changes}.',
  'button.cancel': 'Annuler',

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

  // Characters and Chronicles.
  'cmd.character.description': 'Tes personnages : fiche et jauges',
  'cmd.character.create.description':
    'Crée un personnage avec Health, Vitae et Willpower au maximum',
  'opt.character.name': 'Nom du personnage',
  'opt.character.clan': 'Clan',
  'opt.character.tier': 'Niveau de jeu : fixe la Vitae maximale et les dés de Hunger',
  'opt.character.stamina': 'Stamina : Health = Stamina + 5',
  'opt.character.composure': 'Composure : Willpower = Composure + Resolve',
  'opt.character.resolve': 'Resolve : Willpower = Composure + Resolve',
  'opt.character.humanity': 'Rang de Humanity (6 par défaut)',
  'cmd.character.sheet.description': "Affiche la fiche d'un personnage avec des boutons + et −",
  'opt.character.pick': 'Le personnage (par défaut : le tien à cette table)',
  'opt.character.public': 'La montrer à tout le salon, sans boutons',
  'cmd.character.list.description': 'Tes personnages sur ce serveur',
  'cmd.character.set.description': 'Règle une jauge sur une valeur précise',
  'opt.character.track': 'Jauge',
  'opt.character.value': 'Nouvelle valeur (gardée dans les limites)',
  'cmd.character.edit.description': 'Change nom, clan, niveau ou Attributs',
  'opt.character.newName': 'Nouveau nom',
  'cmd.character.give.description': 'Donne un de tes personnages à un autre joueur',
  'opt.character.giveTo': 'Le joueur qui le reçoit',
  'cmd.character.delete.description': 'Supprime un de tes personnages',
  'cmd.chronicle.description': "Chroniques : joueurs, Masquerade Tracker et celle à l'antenne",
  'cmd.chronicle.create.description': 'Crée une Chronique : tu en es le Conteur',
  'opt.chronicle.name': 'Nom de la Chronique',
  'opt.chronicle.sect': 'Secte affichée sur le cadre du Conteur',
  'cmd.chronicle.list.description': 'Tes Chroniques et leurs personnages',
  'cmd.chronicle.live.description': "Met une Chronique à l'antenne : l'overlay montre ses cadres",
  'opt.chronicle.pick': 'La Chronique (par défaut : celle jouée dans ce salon)',
  'cmd.chronicle.invite.description': 'Invite un joueur à amener un personnage dans une Chronique',
  'opt.chronicle.player': 'Le joueur',
  'cmd.chronicle.remove.description': 'Retire un personnage de sa Chronique',
  'opt.chronicle.character': 'Le personnage',
  'cmd.chronicle.edit.description': 'Renomme une Chronique ou change sa secte',
  'opt.chronicle.newName': "Nouveau nom (les liens de l'overlay restent valides)",
  'cmd.chronicle.archive.description': 'Masque une Chronique et libère ses personnages',
  'opt.session.chronicle': "Chronique jouée dans ce salon : elle passe aussi à l'antenne",
  'campaign.guildOnly':
    'Les personnages et les Chroniques appartiennent à un serveur : utilise la commande là-bas.',
  'character.badName':
    'Le nom doit contenir au moins une lettre ou un chiffre, et 32 caractères au plus.',
  'character.duplicate': 'Il existe déjà un personnage avec ce nom.',
  'character.limit': 'Tu peux avoir au plus {max} personnages sur ce serveur.',
  'character.created': '**{name}** est prêt. Revois-le avec `/elder character sheet`.',
  'character.list.title': 'Tes personnages',
  'character.noneYet':
    "Tu n'as pas encore de personnage sur ce serveur. Crée-en un avec `/elder character create`.",
  'character.notFound': 'Personnage introuvable.',
  'character.pickOne': "Tu as plusieurs personnages : choisis-en un avec l'option `character`.",
  'character.cannotEdit':
    'Seuls le propriétaire, le Conteur de sa Chronique ou un admin du serveur peuvent modifier ce personnage.',
  'character.ownerOnly': 'Seul le propriétaire peut faire ça.',
  'character.editNothing': 'Rien à changer : remplis au moins une option.',
  'character.delete.confirm': "Supprimer **{name}** et son historique ? C'est définitif.",
  'character.deleted': '**{name}** a été supprimé.',
  'character.give.invalid': 'Choisis un autre joueur (ni toi ni un bot).',
  'character.give.offer': '{from} veut donner **{name}** à {to}.',
  'character.give.done': '**{name}** appartient maintenant à {to}.',
  'character.give.refused': "{to} n'a pas accepté **{name}**.",
  'character.hungerFromVitae':
    "{hunger} d'après la Vitae de {name} ({vitae}/{max}). L'option `hunger` permet de le changer.",
  'sheet.chronicle': 'Chronique : {name}',
  'sheet.noChronicle': 'aucune Chronique',
  'button.delete': 'Supprimer',
  'button.accept': 'Accepter',
  'button.refuse': 'Refuser',
  'button.pickCharacter': 'Choisir un personnage',
  'chronicle.created':
    "Chronique créée, tu en es le Conteur. Id pour l'overlay : `{slug}`. Invite des joueurs avec `/elder chronicle invite` et joue-la dans un salon avec `/elder session new chronicle:`.",
  'chronicle.duplicate': 'Il existe déjà une Chronique avec ce nom sur ce serveur.',
  'chronicle.limit': "Tu peux mener au plus {max} Chroniques à la fois : archives-en une d'abord.",
  'chronicle.list.title': 'Chroniques',
  'chronicle.live.badge': "à l'antenne",
  'chronicle.live.set': "**{name}** est à l'antenne.",
  'chronicle.members': 'personnages : {count}',
  'chronicle.noneYet': 'Aucune Chronique. Crée-en une avec `/elder chronicle create`.',
  'chronicle.notFound': 'Chronique introuvable.',
  'chronicle.pickOne': "Tu mènes plusieurs Chroniques : choisis-en une avec l'option `chronicle`.",
  'chronicle.storytellerOnly':
    'Seul le Conteur de cette Chronique ou un admin du serveur peut faire ça.',
  'chronicle.notMember': "Ce personnage n'est dans aucune Chronique.",
  'chronicle.removed': '**{name}** quitte {chronicle}.',
  'chronicle.archived': '**{name}** est archivée : son salon et ses personnages sont libres.',
  'chronicle.invite':
    "{user}, {storyteller} t'invite dans **{chronicle}** : choisis le personnage que tu amènes.",
  'chronicle.noFreeCharacter':
    'Tous tes personnages sont déjà dans une Chronique. Crées-en un avec `/elder character create`, puis appuie à nouveau sur le bouton.',
  'chronicle.pickPlaceholder': 'Ton personnage',
  'chronicle.busy': '**{name}** joue déjà dans une autre Chronique.',
  'chronicle.joined.private': '**{name}** rejoint {chronicle}.',
  'chronicle.joined': '**{name}** ({user}) rejoint {chronicle}.',
  'session.new.chronicle':
    'Chronique : **{name}**. Les dés de Hunger viennent de la Vitae de chaque personnage.',
  'frenzy.error.noCharacter':
    "Tu n'as pas de personnage à cette table : indique `dice` (Composure + Resolve) et `humanity`.",
  'willpower.none': "**{name}** n'a plus de Willpower.",
  'willpower.left': '{name} : Willpower {left}/{max}.',

  'error.generic': "Quelque chose s'est mal passé.",
};
