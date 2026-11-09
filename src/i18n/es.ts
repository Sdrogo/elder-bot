import type { Messages } from './en.js';

// Spanish catalog. TypeScript fails here if a key of en.ts is missing.
// Game terms (Hunger, Painful Failure, Beast's Bargain, ...) stay in English.

export const es: Messages = {
  // Slash command descriptions (names never change).
  'cmd.elder.description': 'Tiradas de dados para Vampire: The Masquerade 6e',

  'cmd.roll.description':
    'Prueba: Atributo + Habilidad (o Disciplina), éxito con 6+, un 10 cuenta 2',
  'opt.roll.dice': 'Atributo + Habilidad, Disciplina o Composure + Resolve',

  'opt.test.difficulty': 'Dificultad: éxitos necesarios para ganar',
  'opt.test.bonus': 'Dados de bonificación (positivos) o penalización (negativos)',
  'opt.test.hunger': 'Tus dados de Hunger (0-5): sustituyen dados normales de la reserva',
  'opt.test.take_half':
    'Taking Half: sin tirar, la mitad de la reserva (redondeando arriba) como éxitos',
  'opt.test.reason': 'Qué intentas hacer',

  'cmd.npc.description': 'Prueba para un PNJ: tira la reserva de su ficha',
  'opt.npc.dice': 'Reserva del PNJ (Física, Social, Mental o de una Habilidad)',

  'cmd.contest.description': 'Test enfrentado: gana quien saque más éxitos',
  'opt.contest.dice': 'Tu pool',
  'opt.contest.opponent_dice': 'Reserva del oponente',
  'opt.contest.opponent': 'Jugador oponente',
  'opt.contest.attribute': 'Tu Atributo, para los empates',
  'opt.contest.opponent_attribute':
    'Atributo del oponente, para empates (un PNJ: la mitad de su reserva)',
  'opt.contest.hunger': 'Tus dados de Hunger (0-5)',
  'opt.contest.opponent_hunger': 'Dados de Hunger del oponente (un PJ vampiro)',
  'opt.contest.reason': 'Qué está en juego',

  'cmd.prolonged.description': 'Tarea prolongada: suma los éxitos de varias tiradas',
  'cmd.prolonged.start.description': 'Empieza una tarea prolongada',
  'opt.prolonged.name': 'La tarea',
  'opt.prolonged.target': 'Éxitos necesarios',
  'opt.prolonged.tests': 'Tiradas disponibles',
  'choice.prolonged.target': '{count} éxitos',
  'choice.prolonged.tests': '{count} tiradas',
  'cmd.prolonged.roll.description': 'Tira para tu tarea prolongada',
  'opt.prolonged.dice': 'Atributo + Habilidad',
  'opt.prolonged.bonus': 'Dados de bonificación o penalización',
  'opt.prolonged.hunger': 'Tus dados de Hunger (0-5)',
  'cmd.prolonged.status.description': 'Muestra tu tarea prolongada',
  'cmd.prolonged.cancel.description': 'Cierra tu tarea prolongada',

  'cmd.session.description': 'Sesiones, Narrador e idioma de la mesa',
  'cmd.session.new.description': 'Nueva sesión: quien la empieza se convierte en Narrador',
  'cmd.session.end.description': 'Cierra la sesión: reinicia la mesa y libera el rol de Narrador',
  'cmd.session.storyteller.description': 'Muestra o cambia el Narrador de este canal',
  'opt.session.user': 'El nuevo Narrador',
  'cmd.session.language.description': 'Idioma de las respuestas del bot en este canal',
  'opt.session.language': 'Idioma de la mesa, o auto para seguir el idioma de Discord de cada uno',
  'choice.language.auto': 'Auto (idioma de Discord)',

  // Shared roll output.
  'roll.title': 'Test',
  'roll.retryTitle': '{title} (Try again)',
  'roll.field.dice': 'Dados',
  'roll.field.outcome': 'Resultado',
  'dice.count.one': '{count} dado',
  'dice.count.other': '{count} dados',
  'roll.successes.one': '{count} éxito',
  'roll.successes.other': '{count} éxitos',
  'roll.successesOf.one': '{count} éxito de {difficulty}',
  'roll.successesOf.other': '{count} éxitos de {difficulty}',
  'roll.margin': 'margen {margin}',
  'pool.bonus': 'bonificación',
  'pool.difficulty': 'Dificultad {n}',
  'pool.total.one': '= **{count}** dado',
  'pool.total.other': '= **{count}** dados',
  'roll.takingHalf':
    'Taking Half: sin tirar dados, la mitad de la reserva (redondeando arriba) como éxitos.',
  'roll.noDice': '**Failure**: no quedan dados en la reserva, la prueba falla automáticamente.',
  'roll.complication':
    'Ningún éxito: además del fallo, decidid con el Narrador cómo empeoran las cosas (dañas o pierdes algo, llamas la atención, te expones, sufres daño).',
  'roll.bestial':
    'Un 1 en un dado de Hunger: la Bestia se desata. El Narrador elige el efecto (daño colateral, alimentar a la Bestia, brecha de la Masquerade, riesgo de frenesí).',
  'roll.hungerOne': 'Un 1 en un dado de Hunger: si se pierde esta prueba, es un Bestial Failure.',
  'roll.automaticWin':
    'Reserva de al menos el doble de la Dificultad: el Narrador puede conceder la victoria automática sin tirar.',
  'roll.retryNote': 'Segundo intento: Dificultad +1, cualquier fallo es un Painful Failure.',

  'button.grantBargain': 'Conceder el trato',
  'button.refuseBargain': 'Sin trato',
  'button.alreadyUsed': 'Este botón ya se ha usado.',
  'button.notYours': 'Solo quien ha tirado puede usar este botón.',

  // Beast's Bargain and the Try again modal.
  'bargain.requested':
    'El jugador recurre a la Bestia. Narrador: describe el precio (daño colateral, alimentar a la Bestia, brecha de la Masquerade, riesgo de frenesí), según el margen de fallo, y luego concédelo o recházalo.',
  'bargain.granted.title': 'Trato cerrado',
  'bargain.granted':
    '**Success** (victoria básica, sin margen) al precio que describió el Narrador.',
  'bargain.refused.title': 'Sin trato',
  'bargain.refused': 'El Narrador no ofrece trato: el fallo se mantiene.',
  'retry.modal.title': 'Try again: Dificultad {difficulty}',
  'retry.modal.dice': 'Nuevo pool (cambia Atributo o Habilidad)',
  'retry.modal.invalid': 'Escribe un número entero de 0 a 30.',

  // /elder npc and /elder contest.
  'npc.name': 'PNJ',
  'contest.opponent': 'Oponente',
  'contest.title': '{a} contra {b}',
  'contest.result': 'Resultado',
  'contest.win': 'Gana **{winner}**.',
  'contest.tie.attribute': 'Empate: gana **{winner}** por tener el Atributo más alto.',
  'contest.tie.initiator':
    'Empate con Atributos iguales (o desconocidos): gana quien inició la contienda.',
  'contest.consequences': 'Consecuencias',
  'contest.bestialIfLost': 'un 1 en un dado de Hunger, Bestial Failure si pierde el empate',

  // /elder prolonged.
  'prolonged.none':
    'No tienes ninguna tarea prolongada abierta en este canal. Usa `/elder prolonged start`.',
  'prolonged.cancelled': 'Tarea prolongada "{name}" cerrada.',
  'prolonged.noDice':
    'Tu reserva no tiene dados: busca ventajas que te den dados extra, o pide ayuda. La tirada no se ha contado.',
  'prolonged.disaster': 'Painful o Bestial Failure: la tarea falla de inmediato.',
  'prolonged.completed': '¡Completado!',
  'prolonged.failed': 'Sin tiradas: tarea fallida.',
  'prolonged.progress': 'Éxitos **{successes}/{target}** · tiradas usadas **{done}/{max}**',

  // /elder session and the Storyteller.
  'auth.storytellerOnly':
    'Solo el Narrador de esta mesa puede hacerlo. Quien ejecuta `/elder session new` pasa a ser Narrador, y puede ceder el rol con `/elder session storyteller`.',
  'session.storyteller.title': 'Narrador',
  'session.storyteller.current': 'Narrador de la mesa: {who}.',
  'session.storyteller.none': 'nadie: quien ejecute `/elder session new` asume el rol',
  'session.storyteller.set': '{user} es el Narrador de esta mesa.',
  'session.ended.title': 'Sesión cerrada',
  'session.ended':
    'Tareas prolongadas e idioma de la mesa reiniciados. La mesa ya no tiene Narrador: el próximo `/elder session new` asigna uno.',
  'session.new.title': 'Nueva sesión',
  'session.new':
    'La mesa está lista. Añade tus dados de Hunger a cada tirada con la opción `hunger`.',
  'session.language.title': 'Idioma',
  'session.language.set': 'Idioma de la mesa: {language}.',
  'session.language.auto': 'El bot responde a cada uno en su idioma de Discord.',

  'error.generic': 'Algo ha salido mal.',
};
