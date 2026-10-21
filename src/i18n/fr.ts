import type { Messages } from './en.js';

// French catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Quickening, Drama, Painful Failure, Devil's Bargain, ...) stay in English.

export const fr: Messages = {
  'cmd.elder.description': 'Jets de dés et ressources pour Vampire: The Masquerade 6e',

  'cmd.roll.description':
    'Test : Attribut + Compétence (ou Discipline) − Difficulté, réussite sur 8+',
  'opt.roll.dice': 'Attribut + Compétence, Discipline ou Composure + Resolve',

  'opt.test.difficulty': 'Difficulté : dés retirés de la réserve',
  'opt.test.bonus': 'Dés bonus (positif) ou dés de malus (négatif)',
  'opt.test.quickening': 'Quickening à dépenser : +1 dé chacun',
  'opt.test.combat': "Test d'attaque ou de défense : pas d'Overqualified",
  'opt.test.reason': 'Ce que tu tentes',
  'opt.test.ignore_traits': 'Ne pas appliquer les scene traits du Drama',

  'cmd.npc.description': 'Test pour un PNJ que tu contrôles : réserve = 2 × Niveau du PNJ',
  'opt.npc.level': 'Le Niveau du PNJ',

  'cmd.contest.description': "Test en opposition : celui qui a le plus de réussites l'emporte",
  'opt.contest.dice': 'Ta réserve',
  'opt.contest.opponent_dice': "Réserve de l'adversaire (PJ)",
  'opt.contest.opponent_npc_level': 'Niveau du PNJ adverse : lance 2 × Niveau',
  'opt.contest.opponent': 'Joueur adverse : gagne du Quickening grâce à ses 10',
  'opt.contest.attribute': 'Ton Attribut, pour départager les PJ',
  'opt.contest.opponent_attribute': 'Attribut du PJ adverse, pour départager',
  'opt.contest.difficulty': 'Seulement si vous affrontez le même obstacle : appliquée aux deux',
  'opt.contest.reason': "L'enjeu",

  'cmd.prolonged.description': 'Test prolongé : additionne les réussites de plusieurs jets',
  'cmd.prolonged.start.description': 'Lance un test prolongé',
  'opt.prolonged.name': 'La tâche',
  'opt.prolonged.target': 'Réussites requises',
  'opt.prolonged.tests': 'Jets disponibles',
  'choice.prolonged.target': '{count} réussites',
  'choice.prolonged.tests': '{count} jets',
  'cmd.prolonged.roll.description': 'Lance les dés pour ton test prolongé',
  'opt.prolonged.dice': 'Attribut + Compétence',
  'opt.prolonged.difficulty': 'Difficulté',
  'opt.prolonged.bonus': 'Dés bonus ou de malus',
  'opt.prolonged.quickening': 'Quickening à dépenser',
  'cmd.prolonged.status.description': 'Affiche ton test prolongé',
  'cmd.prolonged.cancel.description': 'Clôt ton test prolongé',

  'cmd.quickening.description':
    'Ton Quickening dans ce salon (max 5, remis à zéro en fin de session)',
  'cmd.quickening.show.description': 'Affiche le Quickening',
  'cmd.quickening.add.description':
    'Ajoute du Quickening (au-delà de 5, coche des cases Beast ou Nature)',
  'cmd.quickening.spend.description':
    'Dépense du Quickening, par exemple pour donner des dés à un allié',
  'cmd.quickening.success.description':
    'Achète une réussite de base : 3 Quickening, ou 5 sans point dans la Compétence',
  'cmd.quickening.set.description': 'Corrige la valeur à la main',
  'opt.quickening.player': 'Un autre joueur',
  'opt.quickening.amount': 'Combien',
  'opt.quickening.reason': 'Pour quoi faire',
  'opt.quickening.skill_dots': 'As-tu au moins 1 point dans la Compétence ?',
  'opt.quickening.value': 'Nouvelle valeur',

  'cmd.drama.description': 'Le Drama du Conteur dans ce salon',
  'cmd.drama.show.description': 'Affiche le Drama et les scene traits actifs',
  'cmd.drama.add.description': 'Ajoute du Drama',
  'cmd.drama.spend.description': 'Dépense du Drama',
  'cmd.drama.trait.description':
    'Crée un scene trait (2 Drama) : bonus ou malus à tous les jets de la scène',
  'cmd.drama.clear_traits.description': 'Retire les scene traits',
  'opt.drama.amount': 'Combien',
  'opt.drama.add_reason': 'Pourquoi',
  'opt.drama.spend_reason': 'Pour quoi faire',
  'opt.drama.name': 'Par exemple "Pluie battante"',
  'opt.drama.modifier': 'De -3 à +3 dés',

  'cmd.session.description': 'Sessions, scènes, Conteur et langue de la table',
  'cmd.session.new.description': 'Nouvelle session : Quickening à 0, Drama = 1 par PJ',
  'opt.session.player_characters': 'Nombre de PJ à la table',
  'cmd.session.scene.description':
    "Nouvelle scène : retire les scene traits et rend le Devil's Bargain de nouveau disponible",
  'cmd.session.end.description':
    'Termine la session : remet la table à zéro et libère le rôle de Conteur',
  'cmd.session.storyteller.description': 'Affiche ou change le Conteur de ce salon',
  'opt.session.user': 'Le nouveau Conteur',
  'cmd.session.language.description': 'Langue des réponses du bot dans ce salon',
  'opt.session.language': 'Langue de la table, ou auto pour suivre la langue Discord de chacun',
  'choice.language.auto': 'Auto (langue de Discord)',

  'roll.title': 'Test',
  'roll.retryTitle': '{title} (Try again)',
  'roll.field.dice': 'Dés',
  'roll.field.outcome': 'Résultat',
  'dice.count.one': '{count} dé',
  'dice.count.other': '{count} dés',
  'roll.successes.one': '{count} réussite',
  'roll.successes.other': '{count} réussites',
  'roll.extra': '{count} en plus',
  'pool.bonus': 'bonus',
  'pool.difficulty': '− Difficulté {n}',
  'pool.quickening': '+ {n} Quickening',
  'pool.total.one': '= **{count}** dé',
  'pool.total.other': '= **{count}** dés',
  'quickening.gained': '+{gained} Quickening grâce aux 10 (maintenant {total}/{max})',
  'quickening.overflow.one':
    'Quickening au maximum : coche {count} case sur la jauge Beast ou Nature.',
  'quickening.overflow.other':
    'Quickening au maximum : coche {count} cases sur la jauge Beast ou Nature.',
  'roll.error.quickening':
    "Tu n'as que {available} Quickening : tu ne peux pas en dépenser {requested}.",
  'roll.overqualified':
    'Il te reste 4 dés ou plus après la Difficulté : tu peux prendre une réussite de base sans lancer (pas de réussites en plus), ou lancer.',
  'roll.noDice':
    "La Difficulté a réduit ta réserve à zéro. Choisis :\n- **Accepter l'échec** : raconte comment les choses se compliquent, +1 Quickening pour toi et +1 Drama pour le Conteur\n- **Chercher des avantages** : aide, outils ou position qui te donnent des dés en plus, puis relance\n- **Aider quelqu'un** avec l'action d'assistance",
  'roll.retryNote': 'Deuxième tentative : Difficulté +1, tout échec est un Painful Failure.',

  'button.takeBasic': 'Prendre la réussite de base',
  'button.roll': 'Lancer',
  'button.acceptFailure': "Accepter l'échec",
  'button.acceptBargain': 'Accepter le bargain',
  'button.rejectBargain': 'Refuser le bargain',
  'button.alreadyUsed': 'Ce bouton a déjà été utilisé.',
  'button.notYours': 'Seul le joueur qui a lancé peut utiliser ce bouton.',

  'pain.option.vitae': 'Perds 3 Vitae ou Willpower (au choix)',
  'pain.option.quickening': 'Perds tout ton Quickening (pas si tu en as 0)',
  'pain.option.beast': 'Coche 1 case sur la jauge Beast',
  'pain.option.drama': 'Donne 1 Drama au Conteur',
  'pain.label.vitae': 'Perdre 3 Vitae/Willpower',
  'pain.label.quickening': 'Perdre tout le Quickening',
  'pain.label.beast': 'Cocher Beast',
  'pain.label.drama': 'Donner 1 Drama',
  'pain.result.vitae': '{player} perd 3 Vitae ou Willpower.',
  'pain.result.quickening': '{player} perd tout son Quickening.',
  'pain.result.beast': '{player} coche 1 case sur la jauge Beast.',
  'pain.result.drama': '{player} donne 1 Drama au Conteur.',
  'pain.noQuickening': "Tu n'as pas de Quickening à perdre : choisis un autre prix.",
  'pain.drama': 'Drama du Conteur : maintenant {drama}.',
  'pain.sheet': 'Mets-le à jour sur ta feuille de personnage.',

  'overqualified.taken': '**Success** · réussite de base sans lancer (Overqualified)',
  'noDice.accepted': '**Failure** accepté : raconte comment la situation se complique.',
  'noDice.quickening': '+1 Quickening (maintenant {value}/{max}).',
  'noDice.drama': '+1 Drama pour le Conteur (maintenant {drama}).',
  'bargain.storytellerAnswers': 'Le Conteur accepte ou refuse le bargain.',
  'bargain.alreadyUsed': "Tu as déjà proposé un Devil's Bargain dans cette scène.",
  'bargain.offer':
    "Proposition : une complication en échange d'une réussite de base. Le Conteur accepte (+1 Drama) ou refuse en dépensant 1 Drama.",
  'bargain.accepted.title': 'Bargain accepté',
  'bargain.accepted':
    '**Success** (réussite de base) avec la complication convenue. +1 Drama pour le Conteur (maintenant {drama}).',
  'bargain.noDrama': "Le Conteur n'a pas de Drama : refuser en coûte 1.",
  'bargain.rejected.title': 'Bargain refusé',
  'bargain.rejected': "Le Conteur dépense 1 Drama (maintenant {drama}). L'échec est maintenu.",
  'retry.modal.title': 'Try again : Difficulté +1',
  'retry.modal.dice': 'Nouvelle réserve (change Attribut ou Compétence)',
  'retry.modal.quickening': 'Quickening à dépenser',
  'retry.modal.invalid': 'Saisis des nombres entiers : réserve de 0 à 30, Quickening de 0 à 5.',

  'npc.name': 'PNJ de Niveau {level}',
  'contest.error.pool':
    'Indique la réserve adverse avec `opponent_dice` (PJ) ou `opponent_npc_level` (PNJ), pas les deux.',
  'contest.opponent': 'Adversaire',
  'contest.title': '{a} contre {b}',
  'contest.result': 'Résultat',
  'contest.win': "**{winner}** l'emporte.",
  'contest.tie.attribute': "Égalité : **{winner}** l'emporte grâce à l'Attribut le plus élevé.",
  'contest.tie.npc':
    "Égalité contre un PNJ : celui qui a lancé le défi l'emporte, ou le Conteur décide.",
  'contest.tie.storyteller':
    "Égalité : le Conteur donne la victoire à l'Attribut le plus élevé ou à celui qui a lancé le défi.",

  'prolonged.none':
    "Tu n'as pas de test prolongé en cours dans ce salon. Utilise `/elder prolonged start`.",
  'prolonged.cancelled': 'Test prolongé "{name}" clos.',
  'prolonged.noDice':
    "La Difficulté a réduit ta réserve à zéro : cherche des avantages qui te donnent des dés en plus, ou fais-toi aider. Le jet n'a pas été compté.",
  'prolonged.painful': 'Le jet compte quand même, mais le Choose Your Pain s’applique.',
  'prolonged.completed': 'Terminé !',
  'prolonged.failed': 'Plus de jets : tâche échouée.',
  'prolonged.progress': 'Réussites **{successes}/{target}** · jets utilisés **{done}/{max}**',

  'quickening.notEnough': 'Tu as {current} Quickening, il en faut {cost}.',
  'quickening.spentSuccess': '{player} dépense {cost} Quickening pour une **réussite de base**',
  'quickening.spent': '{player} dépense {cost} Quickening{reason}',
  'quickening.left': 'Il en reste **{left}/{max}**.\nDépense-le avant de lancer.',

  'drama.activeTraits': 'Scene traits actifs :',
  'drama.trait': '- {name} : {modifier} dés',
  'drama.max': 'max {max}',
  'drama.added': '+{amount} Drama{reason}. Maintenant **{now}**{cap}.',
  'drama.traitsCleared': 'Scene traits retirés.',
  'drama.traitLimit':
    'Il y a déjà {max} scene traits : retire-les avec `/elder drama clear_traits`.',
  'drama.notEnough': 'Le Conteur a {current} Drama, il en faut {cost}.',
  'drama.traitCreated':
    '**{name}** : {modifier} dés à chaque `/elder roll` de la scène (ceux qui ne sont pas concernés utilisent `ignore_traits`).\nDrama restant : **{left}**.',
  'drama.spent': 'Le Conteur dépense {cost} Drama{reason}. Il en reste **{left}**.',

  'auth.storytellerOnly':
    'Seul le Conteur de cette table peut faire ça. Celui qui lance `/elder session new` devient Conteur, et peut passer le rôle avec `/elder session storyteller`.',
  'session.storyteller.title': 'Conteur',
  'session.storyteller.current': 'Conteur de la table : {who}.',
  'session.storyteller.none': 'personne : celui qui lance `/elder session new` prend le rôle',
  'session.storyteller.set': '{user} est le Conteur de cette table.',
  'session.ended.title': 'Session terminée',
  'session.ended':
    "Quickening, Drama, scene traits, bargains, tests prolongés et langue de la table remis à zéro. La table n'a plus de Conteur : le prochain `/elder session new` en désigne un.",
  'session.new.title': 'Nouvelle session',
  'session.new':
    'Quickening de tout le monde à 0, Drama du Conteur à **{pcs}**, scene traits retirés.',
  'session.scene.title': 'Nouvelle scène',
  'session.scene': "Scene traits retirés, Devil's Bargain de nouveau disponible pour tous.",
  'session.language.title': 'Langue',
  'session.language.set': 'Langue de la table : {language}.',
  'session.language.auto': 'Le bot répond à chacun dans sa propre langue Discord.',

  'error.generic': "Quelque chose s'est mal passé.",
};
