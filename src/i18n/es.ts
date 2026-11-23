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

  // /elder roll npc:true and /elder contest.
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

  // The Storyteller.
  // Willpower, /elder frenzy and /elder masquerade.
  'cmd.frenzy.description':
    'Resistir el frenesí: Composure + Resolve, como máximo tantos dados como Humanidad',
  'opt.frenzy.type': 'Tipo de frenesí',
  'opt.frenzy.dice': 'Composure + Resolve',
  'opt.frenzy.humanity': 'Tu rango de Humanidad (o Senda): limita los dados',
  'opt.frenzy.hunger': 'Tus dados de Hunger (0-5): la Dificultad del frenesí de hambre',
  'opt.frenzy.difficulty':
    'Dificultad del Narrador (ira 2 ± modificadores, clan 3 + modificador de generación)',
  'frenzy.title': 'resiste un {frenzy}',
  'frenzy.capped': 'Reserva de {pool} dados, pero la Humanidad {humanity} la limita.',
  'frenzy.resisted': 'Resiste durante el resto de la escena.',
  'frenzy.suffered': 'El personaje sufre un {frenzy}.',
  'frenzy.painful': 'El personaje sufre un {frenzy} y hace algo de lo que se arrepentirá.',
  'frenzy.error.difficulty': 'Indica la `difficulty` que fija el Narrador.',
  'frenzy.error.noHunger':
    'La Dificultad del frenesí de hambre son tus dados de Hunger: indica `hunger` (al menos 1) o una `difficulty`.',
  'cmd.masquerade.description': 'El Masquerade Tracker de esta mesa, con botones para el Narrador',
  'masquerade.title': 'Masquerade Tracker',
  'masquerade.threat.title': 'Threat test de la Masquerade',
  'willpower.pick': 'Elige hasta {max} dados para repetir (−1 Willpower)',
  'willpower.option': 'Dado {n}: {face}',
  'willpower.spent': '1 Willpower gastada, repetidos: {changes}.',
  'button.cancel': 'Cancelar',

  'auth.storytellerOnly':
    'Solo el Narrador de la Crónica que se juega en este canal (o un admin del servidor) puede hacerlo. El canal se elige en el panel web (`/elder panel`).',

  // Characters and Chronicles.
  'cmd.sheet.description': 'Muestra la hoja de un personaje con botones + y −',
  'opt.sheet.character': 'El personaje (por defecto: el tuyo en esta mesa)',
  'opt.sheet.public': 'Mostrarla a todo el canal, sin botones',
  'opt.invite.chronicle': 'La Crónica (por defecto: la que se juega en este canal)',
  'cmd.invite.description': 'Invita a un jugador a traer un personaje a una Crónica',
  'opt.invite.player': 'El jugador',
  'campaign.guildOnly':
    'Los personajes y las Crónicas pertenecen a un servidor: usa el comando allí.',
  'character.noneYet':
    'Aún no tienes personajes en este servidor. Crea uno en el panel web (`/elder panel`).',
  'character.notFound': 'Personaje no encontrado.',
  'character.pickOne': 'Tienes varios personajes: elige uno con la opción `character`.',
  'character.cannotEdit':
    'Solo el dueño, el Narrador de su Crónica o un admin del servidor pueden cambiar este personaje.',
  'chronicle.invite.invalid': 'Elige a otro jugador (ni tú ni un bot).',
  'character.hungerFromVitae':
    '{hunger} por la Vitae de {name} ({vitae}/{max}). Usa la opción `hunger` para cambiarlo.',
  'sheet.chronicle': 'Crónica: {name}',
  'sheet.noChronicle': 'sin Crónica',
  'button.pickCharacter': 'Elegir personaje',
  'opt.roll.npc': 'Tirada de un PNJ: la reserva de su ficha, sin dados de Hunger',
  'button.masqueradeThreat': 'Prueba de amenaza',
  'button.prolongedCancel': 'Cancelar tarea',
  'button.willpowerBest': 'Willpower: repetir fallos',
  'willpower.noFailures': 'No hay dados normales fallidos que repetir.',
  'chronicle.noneYet': 'Aún no hay Crónicas. Crea una en el panel web (`/elder panel`).',
  'chronicle.notFound': 'Crónica no encontrada.',
  'chronicle.pickOne': 'Llevas varias Crónicas: elige una con la opción `chronicle`.',
  'chronicle.storytellerOnly':
    'Solo el Narrador de esta Crónica o un admin del servidor puede hacerlo.',
  'chronicle.invite':
    '{user}, {storyteller} te invita a **{chronicle}**: elige el personaje que traes.',
  'chronicle.noFreeCharacter':
    'Todos tus personajes ya están en una Crónica. Crea uno nuevo en el panel web (`/elder panel`) y vuelve a pulsar el botón.',
  'chronicle.pickPlaceholder': 'Tu personaje',
  'chronicle.busy': '**{name}** ya juega en otra Crónica.',
  'chronicle.wrongTier': '**{name}** no puede unirse: la Crónica es de nivel {tier}.',
  'chronicle.joined.private': '**{name}** entra en {chronicle}.',
  'chronicle.joined': '**{name}** ({user}) entra en {chronicle}.',
  'frenzy.error.noCharacter':
    'No tienes personaje en esta mesa: indica `dice` (Composure + Resolve) y `humanity`.',
  'willpower.none': '**{name}** no tiene más Willpower.',
  'willpower.left': '{name}: Willpower {left}/{max}.',

  // Web panel.
  'cmd.panel.description': 'Enlace al panel web: tus personajes y Crónicas',
  'panel.link': 'Tus personajes y Crónicas, en el navegador. Entra con tu cuenta de Discord.',
  'panel.open': 'Abrir el panel',
  'panel.notConfigured': 'El panel web no está activado en este bot.',

  'error.generic': 'Algo ha salido mal.',
};
