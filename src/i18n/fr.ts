import type { Messages } from './en.js';

// French catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Hunger, Painful Failure, Beast's Bargain, ...) stay in English.

export const fr: Messages = {
  // Slash command descriptions (names never change).
  'cmd.elder.description': 'Jets de dés pour Vampire: The Masquerade 6e',

  'cmd.roll.description':
    'Test : Attribut + Compétence (ou Discipline), réussite sur 6+, un 10 compte 2',
  'opt.roll.dice': 'Réserve en nombre (ou laisse vide et utilise attribute + with de ta fiche)',

  'opt.test.difficulty': 'Difficulté : réussites nécessaires pour gagner',
  'opt.test.bonus': 'Dés bonus (positif) ou dés de malus (négatif)',
  'opt.test.reason': 'Ce que tu tentes',

  'cmd.contest.description': "Test en opposition : celui qui a le plus de réussites l'emporte",
  'opt.contest.dice': 'Ta réserve en nombre (ou attribute + with depuis ta fiche)',
  'opt.contest.opponent_dice':
    "Réserve de l'adversaire en nombre (ou opponent_attribute + opponent_with)",
  'opt.contest.opponent': 'Joueur adverse',
  'opt.contest.attribute':
    'Attribut de ta fiche, ou sa valeur pour les égalités si tu utilises dice',
  'opt.contest.opponent_attribute':
    'Attribut du joueur adverse, ou un nombre pour les égalités (PNJ : moitié de la réserve)',
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
  'cmd.impair.description': "Conteur : Impair les Attributs d'un personnage pour la scène",
  'opt.impair.character': 'Le personnage',
  'opt.impair.target': "Un groupe d'Attributs ou un seul Attribut (ou tous les retirer)",
  'opt.impair.remove': "Terminer cet Impairment au lieu de l'ajouter",
  'impair.choice.clear': 'Terminer tout Impairment',
  'impair.noChronicle':
    "Ce personnage n'est dans aucune Chronique : seul son Conteur peut lui imposer un Impairment.",
  'impair.notYours': 'Seul le Conteur de la Chronique peut imposer un Impairment à un personnage.',
  'impair.added':
    "{name} est Impaired : {list}. −2 dés par Attribut Impaired dans un test, jusqu'à la fin de la scène.",
  'impair.none': "{name} n'est plus Impaired par le Conteur.",
  'impair.nothingToRemove': "{name} n'a aucun Impairment du Conteur à terminer.",
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
  'sheet.usePlaceholder': 'Choisis le personnage en jeu',
  'sheet.nowPlaying': 'Tu joues maintenant {name} : les jets utilisent sa Faim et sa Volonté.',
  'button.pickCharacter': 'Choisir un personnage',
  'opt.roll.npc': 'Jet pour un PNJ : la réserve de sa fiche, sans dés de Hunger',
  'opt.roll.attribute': 'Attribut de la fiche de ton personnage',
  'opt.roll.with': 'Ce qui va avec : Compétence, Discipline, pouvoir, Attribut ou lifepath',
  'opt.roll.surge': "Blood Surge : l'Attribut ou la Discipline à hausser pour la scène",
  'sheetRoll.pool': 'Réserve',
  'sheetRoll.mixed':
    'Utilise `dice` ou les options de la fiche (`attribute`, `with`, `surge`), pas les deux.',
  'sheetRoll.needPool':
    'Indique la réserve : `dice`, ou `attribute` + `with` depuis la fiche de ton personnage.',
  'sheetRoll.npc':
    'Les jets de PNJ utilisent `dice` : les options de la fiche sont pour les personnages joueurs.',
  'sheetRoll.noCharacter':
    'Aucun personnage avec une fiche complète ici : lance dans le salon de ta Chronique ou complète la fiche sur le panneau. Tu peux toujours utiliser `dice`.',
  'sheetRoll.noSheet':
    "{name} n'a que des jauges : complète la fiche sur le panneau pour lancer depuis elle, ou utilise `dice`.",
  'sheetRoll.hint.noCharacter': 'Aucun personnage avec fiche complète ici : utilise dice',
  'sheetRoll.hint.noSheet': 'Complète la fiche sur le panneau, ou utilise dice',
  'sheetRoll.pickFromList': 'Choisis `{option}` dans la liste proposée par Discord.',
  'sheetRoll.issue.needAttribute':
    'Choisis un `attribute` (ou un pouvoir dans `with`, qui apporte le sien).',
  'sheetRoll.issue.needSecond':
    "Choisis ce qui va `with` l'Attribut : Compétence, Discipline, pouvoir, Attribut ou lifepath.",
  'sheetRoll.issue.sameAttribute': 'Choisis deux Attributs différents.',
  'sheetRoll.issue.unknownTrait': "Ce trait n'est pas sur la fiche : choisis-en un dans la liste.",
  'sheetRoll.issue.noPower': 'Ton personnage ne connaît pas ce pouvoir.',
  'sheetRoll.issue.noDiscipline': "Ton personnage n'a aucun point dans cette Discipline.",
  'sheetRoll.issue.noSpecialty':
    "Cette spécialité n'est plus sur la fiche : choisis à nouveau dans la liste.",
  'sheetRoll.issue.surgeNoDiscipline': 'Blood Surge demande au moins 1 point dans la Discipline.',
  'sheetRoll.issue.surgeLimit': 'Ce Blood Surge dépasse la limite de ton tier.',
  'sheetRoll.issue.surgeVitae': 'Pas assez de Vitae pour ce Blood Surge.',
  'sheetRoll.surgeSpent':
    "{name} dépense {cost} Vitae : {trait} +{dots} jusqu'à la fin de la scène.",
  'sheetRoll.surgeActive': "Actif jusqu'à la fin de la scène : {list}.",
  'sheetRoll.surgeEnded': 'Blood Surge terminé pour {name}.',
  'sheetRoll.impaired': '{attributes} Impaired (Health ou Willpower à 0) : −{dice} dés.',
  'sheetRoll.powerAttribute': 'Ce pouvoir utilise normalement {attribute} : le Storyteller décide.',
  'sheetRoll.trackerDiffers':
    '{attribute} : {sheet} sur la fiche, {tracker} sur les jauges. Le jet utilise la fiche.',
  'button.surgeEnd': 'Fin du Blood Surge',
  'sheetRoll.issue.bonusNeedsSurge': "Choisis d'abord dans `surge` le trait à hausser.",
  'sheetRoll.hint.pickSurge': "Choisis d'abord le trait dans surge",
  'opt.contest.surge_bonus': 'Bonus du Blood Surge, avec son coût en Vitae (par défaut +1)',
  'opt.roll.surge_bonus': 'Bonus du Blood Surge, avec son coût en Vitae (par défaut +1)',
  'opt.roll.specialization': 'Spécialité de la Compétence choisie dans with (+1 dé)',
  'opt.contest.specialization': 'Spécialité de la Compétence choisie dans with (+1 dé)',
  'opt.contest.opponent_specialization':
    'Spécialité de la Compétence choisie dans opponent_with (+1 dé)',
  'sheetRoll.hint.noSpecialties': "Choisis d'abord dans with une Compétence avec spécialités",
  'sheetRoll.issue.specialtyNeedsSkill':
    "La spécialité va avec une Compétence : choisis d'abord la Compétence dans `with`.",
  'sheetRoll.contest.needOpponent': "Choisis l'`opponent` pour lancer depuis sa fiche.",
  'sheetRoll.contest.needOpponentPool':
    "Indique la réserve de l'adversaire : `opponent_dice`, ou `opponent_attribute` + `opponent_with` depuis la fiche du joueur adverse.",
  'sheetRoll.contest.needPool':
    'Indique ta réserve : `dice`, ou `attribute` + `with` depuis ta fiche.',
  'sheetRoll.hint.pickOpponent': "Choisis d'abord l'adversaire",
  'opt.contest.opponent_with': "Ce qui va avec l'Attribut du joueur adverse, depuis sa fiche",
  'opt.contest.surge': "Blood Surge : l'Attribut ou la Discipline à hausser pour la scène",
  'opt.contest.with': 'Ce qui va avec ton Attribut : Compétence, Discipline, pouvoir, lifepath',
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
  'willpower.pickCharacter':
    "Choisis d'abord avec `/elder sheet` le personnage que tu joues, pour que la Willpower soit retirée de la bonne fiche.",
  'willpower.left': '{name} : Willpower {left}/{max}.',

  // Web panel.
  'cmd.panel.description': 'Lien vers le panneau web : tes personnages et tes Chroniques',
  'panel.link':
    'Tes personnages et tes Chroniques, dans le navigateur. Connecte-toi avec ton compte Discord.',
  'panel.open': 'Ouvrir le panneau',
  'panel.notConfigured': "Le panneau web n'est pas activé sur ce bot.",

  'error.generic': "Quelque chose s'est mal passé.",
};
