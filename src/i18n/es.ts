import type { Messages } from './en.js';

// Spanish catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Quickening, Drama, Painful Failure, Devil's Bargain, ...) stay in English.

export const es: Messages = {
  'cmd.elder.description': 'Tiradas y recursos de Vampire: The Masquerade 6e',

  'cmd.roll.description': 'Test: Atributo + Habilidad (o Disciplina) − Dificultad, éxito con 8+',
  'opt.roll.dice': 'Atributo + Habilidad, Disciplina o Composure + Resolve',

  'opt.test.difficulty': 'Dificultad: dados que se quitan del pool',
  'opt.test.bonus': 'Dados de bonificación (positivos) o penalización (negativos)',
  'opt.test.quickening': 'Quickening a gastar: +1 dado cada uno',
  'opt.test.combat': 'Test de ataque o defensa: sin Overqualified',
  'opt.test.reason': 'Qué intentas hacer',
  'opt.test.ignore_traits': 'No aplicar los scene trait del Drama',

  'cmd.npc.description': 'Test para un PNJ que controlas: pool = 2 × Nivel del PNJ',
  'opt.npc.level': 'Nivel del PNJ',

  'cmd.contest.description': 'Test enfrentado: gana quien saque más éxitos',
  'opt.contest.dice': 'Tu pool',
  'opt.contest.opponent_dice': 'Pool del oponente (PJ)',
  'opt.contest.opponent_npc_level': 'Nivel del PNJ oponente: tira 2 × Nivel',
  'opt.contest.opponent': 'Jugador oponente: gana Quickening con sus 10',
  'opt.contest.attribute': 'Tu Atributo, para empates entre PJ',
  'opt.contest.opponent_attribute': 'Atributo del PJ oponente, para empates',
  'opt.contest.difficulty': 'Solo si ambos se enfrentan al mismo obstáculo: se aplica a los dos',
  'opt.contest.reason': 'Qué está en juego',

  'cmd.prolonged.description': 'Test prolongado: suma los éxitos de varias tiradas',
  'cmd.prolonged.start.description': 'Abre un test prolongado',
  'opt.prolonged.name': 'La tarea',
  'opt.prolonged.target': 'Éxitos necesarios',
  'opt.prolonged.tests': 'Tiradas disponibles',
  'choice.prolonged.target': '{count} éxitos',
  'choice.prolonged.tests': '{count} tiradas',
  'cmd.prolonged.roll.description': 'Tira para tu test prolongado',
  'opt.prolonged.dice': 'Atributo + Habilidad',
  'opt.prolonged.difficulty': 'Dificultad',
  'opt.prolonged.bonus': 'Dados de bonificación o penalización',
  'opt.prolonged.quickening': 'Quickening a gastar',
  'cmd.prolonged.status.description': 'Muestra tu test prolongado',
  'cmd.prolonged.cancel.description': 'Cierra tu test prolongado',

  'cmd.quickening.description':
    'Tu Quickening en este canal (máximo 5, se reinicia al final de la sesión)',
  'cmd.quickening.show.description': 'Muestra el Quickening',
  'cmd.quickening.add.description':
    'Añade Quickening (por encima de 5, marca casillas Beast o Nature)',
  'cmd.quickening.spend.description': 'Gasta Quickening, por ejemplo para dar dados a un aliado',
  'cmd.quickening.success.description':
    'Compra un éxito básico: 3 Quickening, o 5 si no tienes puntos en la Habilidad',
  'cmd.quickening.set.description': 'Corrige el valor a mano',
  'opt.quickening.player': 'Otro jugador',
  'opt.quickening.amount': 'Cuántos',
  'opt.quickening.reason': 'Para qué',
  'opt.quickening.skill_dots': '¿Tienes al menos 1 punto en la Habilidad?',
  'opt.quickening.value': 'Nuevo valor',

  'cmd.drama.description': 'Drama del Narrador en este canal',
  'cmd.drama.show.description': 'Muestra el Drama y los scene trait activos',
  'cmd.drama.add.description': 'Añade Drama',
  'cmd.drama.spend.description': 'Gasta Drama',
  'cmd.drama.trait.description':
    'Crea un scene trait (2 Drama): bonificación o penalización a todas las tiradas de la escena',
  'cmd.drama.clear_traits.description': 'Elimina los scene trait',
  'opt.drama.amount': 'Cuánto',
  'opt.drama.add_reason': 'Por qué',
  'opt.drama.spend_reason': 'Para qué',
  'opt.drama.name': 'Por ejemplo "Lluvia torrencial"',
  'opt.drama.modifier': 'De -3 a +3 dados',

  'cmd.session.description': 'Sesión, escena, Narrador e idioma de la mesa',
  'cmd.session.new.description': 'Nueva sesión: Quickening a 0, Drama = 1 por PJ',
  'opt.session.player_characters': 'Número de PJ en la mesa',
  'cmd.session.scene.description':
    "Nueva escena: elimina los scene trait y vuelve a habilitar el Devil's Bargain",
  'cmd.session.end.description': 'Cierra la sesión: reinicia la mesa y libera el rol de Narrador',
  'cmd.session.storyteller.description': 'Muestra o cambia el Narrador de este canal',
  'opt.session.user': 'El nuevo Narrador',
  'cmd.session.language.description': 'Idioma de las respuestas del bot en este canal',
  'opt.session.language': 'Idioma de la mesa, o auto para seguir el idioma de Discord de cada uno',
  'choice.language.auto': 'Auto (idioma de Discord)',

  'roll.title': 'Test',
  'roll.retryTitle': '{title} (Try again)',
  'roll.field.dice': 'Dados',
  'roll.field.outcome': 'Resultado',
  'dice.count.one': '{count} dado',
  'dice.count.other': '{count} dados',
  'roll.successes.one': '{count} éxito',
  'roll.successes.other': '{count} éxitos',
  'roll.extra': '{count} extra',
  'pool.bonus': 'bonificación',
  'pool.difficulty': '− Dificultad {n}',
  'pool.quickening': '+ {n} Quickening',
  'pool.total.one': '= **{count}** dado',
  'pool.total.other': '= **{count}** dados',
  'quickening.gained': '+{gained} Quickening por los 10 (ahora {total}/{max})',
  'quickening.overflow.one':
    'Quickening al máximo: marca {count} casilla en el tracker de Beast o Nature.',
  'quickening.overflow.other':
    'Quickening al máximo: marca {count} casillas en el tracker de Beast o Nature.',
  'roll.error.quickening': 'Solo tienes {available} Quickening: no puedes gastar {requested}.',
  'roll.overqualified':
    'Te quedan 4 o más dados tras la Dificultad: puedes tomar un éxito básico sin tirar (sin éxitos extra), o tirar.',
  'roll.noDice':
    'La Dificultad ha dejado tu pool a cero. Elige:\n- **Aceptar el fallo**: describe cómo se complican las cosas, +1 Quickening para ti y +1 Drama para el Narrador\n- **Buscar ventajas**: ayuda, herramientas o posición que te den dados extra, y vuelve a tirar\n- **Ayudar a alguien** con la acción assist',
  'roll.retryNote': 'Segundo intento: Dificultad +1, cualquier fallo es un Painful Failure.',

  'button.takeBasic': 'Tomar éxito básico',
  'button.roll': 'Tirar',
  'button.acceptFailure': 'Aceptar el fallo',
  'button.acceptBargain': 'Aceptar el bargain',
  'button.rejectBargain': 'Rechazar el bargain',
  'button.alreadyUsed': 'Este botón ya se ha usado.',
  'button.notYours': 'Solo quien ha tirado puede usar este botón.',

  'pain.option.vitae': 'Pierdes 3 Vitae o Willpower (a tu elección)',
  'pain.option.quickening': 'Pierdes todo tu Quickening (no si tienes 0)',
  'pain.option.beast': 'Marca 1 casilla en el tracker de Beast',
  'pain.option.drama': 'Da 1 Drama al Narrador',
  'pain.label.vitae': 'Perder 3 Vitae/Willpower',
  'pain.label.quickening': 'Perder todo el Quickening',
  'pain.label.beast': 'Marcar Beast',
  'pain.label.drama': 'Dar 1 Drama',
  'pain.result.vitae': '{player} pierde 3 Vitae o Willpower.',
  'pain.result.quickening': '{player} pierde todo su Quickening.',
  'pain.result.beast': '{player} marca 1 casilla en el tracker de Beast.',
  'pain.result.drama': '{player} da 1 Drama al Narrador.',
  'pain.noQuickening': 'No tienes Quickening que perder: elige otro precio.',
  'pain.drama': 'Drama del Narrador: ahora {drama}.',
  'pain.sheet': 'Actualízalo en tu hoja de personaje.',

  'overqualified.taken': '**Success** · éxito básico sin tirar (Overqualified)',
  'noDice.accepted': '**Failure** aceptado: describe cómo se complica la situación.',
  'noDice.quickening': '+1 Quickening (ahora {value}/{max}).',
  'noDice.drama': '+1 Drama para el Narrador (ahora {drama}).',
  'bargain.storytellerAnswers': 'El Narrador acepta o rechaza el bargain.',
  'bargain.alreadyUsed': "Ya has ofrecido un Devil's Bargain en esta escena.",
  'bargain.offer':
    'Oferta: una complicación a cambio de un éxito básico. El Narrador acepta (+1 Drama) o rechaza gastando 1 Drama.',
  'bargain.accepted.title': 'Bargain aceptado',
  'bargain.accepted':
    '**Success** (éxito básico) con la complicación acordada. +1 Drama para el Narrador (ahora {drama}).',
  'bargain.noDrama': 'El Narrador no tiene Drama: rechazar cuesta 1.',
  'bargain.rejected.title': 'Bargain rechazado',
  'bargain.rejected': 'El Narrador gasta 1 Drama (ahora {drama}). El fallo se mantiene.',
  'retry.modal.title': 'Try again: Dificultad +1',
  'retry.modal.dice': 'Nuevo pool (cambia Atributo o Habilidad)',
  'retry.modal.quickening': 'Quickening a gastar',
  'retry.modal.invalid': 'Introduce números enteros: pool de 0 a 30, Quickening de 0 a 5.',

  'npc.name': 'PNJ de Nivel {level}',
  'contest.error.pool':
    'Indica el pool oponente con `opponent_dice` (PJ) o con `opponent_npc_level` (PNJ), no ambos.',
  'contest.opponent': 'Oponente',
  'contest.title': '{a} contra {b}',
  'contest.result': 'Resultado',
  'contest.win': 'Gana **{winner}**.',
  'contest.tie.attribute': 'Empate: gana **{winner}** por tener el Atributo más alto.',
  'contest.tie.npc': 'Empate contra un PNJ: gana quien inició el desafío, o decide el Narrador.',
  'contest.tie.storyteller':
    'Empate: el Narrador da la victoria al Atributo más alto o a quien inició el desafío.',

  'prolonged.none':
    'No tienes ningún test prolongado abierto en este canal. Usa `/elder prolonged start`.',
  'prolonged.cancelled': 'Test prolongado "{name}" cerrado.',
  'prolonged.noDice':
    'La Dificultad ha dejado tu pool a cero: busca ventajas que te den dados extra, o pide ayuda. La tirada no se ha contado.',
  'prolonged.painful': 'La tirada cuenta igualmente, pero se aplica el Choose Your Pain.',
  'prolonged.completed': '¡Completado!',
  'prolonged.failed': 'Sin tiradas: tarea fallida.',
  'prolonged.progress': 'Éxitos **{successes}/{target}** · tiradas usadas **{done}/{max}**',

  'quickening.notEnough': 'Tienes {current} Quickening, necesitas {cost}.',
  'quickening.spentSuccess': '{player} gasta {cost} Quickening en un **éxito básico**',
  'quickening.spent': '{player} gasta {cost} Quickening{reason}',
  'quickening.left': 'Quedan **{left}/{max}**.\nGástalo antes de tirar.',

  'drama.activeTraits': 'Scene trait activos:',
  'drama.trait': '- {name}: {modifier} dados',
  'drama.max': 'máximo {max}',
  'drama.added': '+{amount} Drama{reason}. Ahora **{now}**{cap}.',
  'drama.traitsCleared': 'Scene trait eliminados.',
  'drama.traitLimit': 'Ya hay {max} scene trait: elimínalos con `/elder drama clear_traits`.',
  'drama.notEnough': 'El Narrador tiene {current} Drama, necesita {cost}.',
  'drama.traitCreated':
    '**{name}**: {modifier} dados a todos los `/elder roll` de la escena (quien no esté implicado usa `ignore_traits`).\nDrama restante: **{left}**.',
  'drama.spent': 'El Narrador gasta {cost} Drama{reason}. Quedan **{left}**.',

  'auth.storytellerOnly':
    'Solo el Narrador de esta mesa puede hacerlo. Quien ejecuta `/elder session new` pasa a ser Narrador, y puede ceder el rol con `/elder session storyteller`.',
  'session.storyteller.title': 'Narrador',
  'session.storyteller.current': 'Narrador de la mesa: {who}.',
  'session.storyteller.none': 'nadie: quien ejecute `/elder session new` asume el rol',
  'session.storyteller.set': '{user} es el Narrador de esta mesa.',
  'session.ended.title': 'Sesión cerrada',
  'session.ended':
    'Quickening, Drama, scene trait, bargain, tests prolongados e idioma de la mesa reiniciados. La mesa ya no tiene Narrador: el próximo `/elder session new` asigna uno.',
  'session.new.title': 'Nueva sesión',
  'session.new': 'Quickening de todos a 0, Drama del Narrador a **{pcs}**, scene trait eliminados.',
  'session.scene.title': 'Nueva escena',
  'session.scene': "Scene trait eliminados, Devil's Bargain disponible de nuevo para todos.",
  'session.language.title': 'Idioma',
  'session.language.set': 'Idioma de la mesa: {language}.',
  'session.language.auto': 'El bot responde a cada uno en su idioma de Discord.',

  'error.generic': 'Algo ha salido mal.',
};
