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
  'cmd.masquerade.description': 'El Masquerade Tracker de esta mesa',
  'cmd.masquerade.show.description': 'Muestra el Masquerade Tracker',
  'cmd.masquerade.mark.description': 'Marca casillas tras una brecha (Narrador)',
  'cmd.masquerade.clear.description': 'Borra casillas cuando se repara la Masquerade (Narrador)',
  'cmd.masquerade.set.description': 'Fija el tracker a mano (Narrador)',
  'cmd.masquerade.threat.description': 'Threat test: un dado por casilla marcada (Narrador)',
  'opt.masquerade.mark': 'Casillas a marcar (por defecto 1)',
  'opt.masquerade.clear': 'Casillas a borrar (por defecto 1)',
  'opt.masquerade.reason': 'Qué ha pasado',
  'opt.masquerade.value': 'Casillas marcadas, de 0 a 10',
  'masquerade.title': 'Masquerade Tracker',
  'masquerade.threat.title': 'Threat test de la Masquerade',
  'willpower.pick': 'Elige hasta {max} dados para repetir (−1 Willpower)',
  'willpower.option': 'Dado {n}: {face}',
  'willpower.spent': '1 Willpower gastada, repetidos: {changes}.',
  'button.cancel': 'Cancelar',

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

  // Characters and Chronicles.
  'cmd.character.description': 'Tus personajes: hoja y contadores',
  'cmd.character.create.description': 'Crea un personaje con Health, Vitae y Willpower completos',
  'opt.character.name': 'Nombre del personaje',
  'opt.character.clan': 'Clan',
  'opt.character.tier': 'Nivel de juego: fija la Vitae máxima y los dados de Hunger',
  'opt.character.stamina': 'Stamina: Health = Stamina + 5',
  'opt.character.composure': 'Composure: Willpower = Composure + Resolve',
  'opt.character.resolve': 'Resolve: Willpower = Composure + Resolve',
  'opt.character.humanity': 'Rango de Humanity (por defecto 6)',
  'cmd.character.sheet.description': 'Muestra la hoja de un personaje con botones + y −',
  'opt.character.pick': 'El personaje (por defecto: el tuyo en esta mesa)',
  'opt.character.public': 'Mostrarla a todo el canal, sin botones',
  'cmd.character.list.description': 'Tus personajes en este servidor',
  'cmd.character.set.description': 'Fija un contador a un valor exacto',
  'opt.character.track': 'Contador',
  'opt.character.value': 'Nuevo valor (dentro de los límites)',
  'cmd.character.edit.description': 'Cambia nombre, clan, nivel o Atributos',
  'opt.character.newName': 'Nuevo nombre',
  'cmd.character.give.description': 'Cede uno de tus personajes a otro jugador',
  'opt.character.giveTo': 'El jugador que lo recibe',
  'cmd.character.delete.description': 'Borra uno de tus personajes',
  'cmd.chronicle.description': 'Crónicas: jugadores, Masquerade Tracker y la que está en emisión',
  'cmd.chronicle.create.description': 'Crea una Crónica: tú eres su Narrador',
  'opt.chronicle.name': 'Nombre de la Crónica',
  'opt.chronicle.sect': 'Secta mostrada en el marco del Narrador',
  'cmd.chronicle.list.description': 'Tus Crónicas y sus personajes',
  'cmd.chronicle.live.description': 'Pone una Crónica en emisión: el overlay muestra sus marcos',
  'opt.chronicle.pick': 'La Crónica (por defecto: la que se juega en este canal)',
  'cmd.chronicle.invite.description': 'Invita a un jugador a traer un personaje a una Crónica',
  'opt.chronicle.player': 'El jugador',
  'cmd.chronicle.remove.description': 'Saca a un personaje de su Crónica',
  'opt.chronicle.character': 'El personaje',
  'cmd.chronicle.edit.description': 'Renombra una Crónica o cambia su secta',
  'opt.chronicle.newName': 'Nuevo nombre (los enlaces del overlay siguen funcionando)',
  'cmd.chronicle.archive.description': 'Oculta una Crónica y libera sus personajes',
  'opt.session.chronicle': 'Crónica jugada en este canal: también pasa a emisión',
  'campaign.guildOnly':
    'Los personajes y las Crónicas pertenecen a un servidor: usa el comando allí.',
  'character.badName': 'El nombre necesita al menos una letra o cifra y como máximo 32 caracteres.',
  'character.duplicate': 'Ya hay un personaje con ese nombre.',
  'character.limit': 'Puedes tener como máximo {max} personajes en este servidor.',
  'character.created': '**{name}** está listo. Vuelve a verlo con `/elder character sheet`.',
  'character.list.title': 'Tus personajes',
  'character.noneYet':
    'Aún no tienes personajes en este servidor. Crea uno con `/elder character create`.',
  'character.notFound': 'Personaje no encontrado.',
  'character.pickOne': 'Tienes varios personajes: elige uno con la opción `character`.',
  'character.cannotEdit':
    'Solo el dueño, el Narrador de su Crónica o un admin del servidor pueden cambiar este personaje.',
  'character.ownerOnly': 'Solo el dueño puede hacerlo.',
  'character.editNothing': 'Nada que cambiar: rellena al menos una opción.',
  'character.delete.confirm': '¿Borrar **{name}** y su historial? No se puede deshacer.',
  'character.deleted': '**{name}** ha sido borrado.',
  'character.give.invalid': 'Elige a otro jugador (ni tú ni un bot).',
  'character.give.offer': '{from} quiere ceder **{name}** a {to}.',
  'character.give.done': '**{name}** ahora pertenece a {to}.',
  'character.give.refused': '{to} no aceptó **{name}**.',
  'character.hungerFromVitae':
    '{hunger} por la Vitae de {name} ({vitae}/{max}). Usa la opción `hunger` para cambiarlo.',
  'sheet.chronicle': 'Crónica: {name}',
  'sheet.noChronicle': 'sin Crónica',
  'button.delete': 'Borrar',
  'button.accept': 'Aceptar',
  'button.refuse': 'Rechazar',
  'button.pickCharacter': 'Elegir personaje',
  'chronicle.created':
    'Crónica creada, eres su Narrador. Id del overlay: `{slug}`. Invita jugadores con `/elder chronicle invite` y juégala en un canal con `/elder session new chronicle:`.',
  'chronicle.duplicate': 'Ya hay una Crónica con ese nombre en este servidor.',
  'chronicle.limit': 'Puedes llevar como máximo {max} Crónicas a la vez: archiva una primero.',
  'chronicle.list.title': 'Crónicas',
  'chronicle.live.badge': 'en emisión',
  'chronicle.live.set': '**{name}** está en emisión.',
  'chronicle.members': 'personajes: {count}',
  'chronicle.noneYet': 'Aún no hay Crónicas. Crea una con `/elder chronicle create`.',
  'chronicle.notFound': 'Crónica no encontrada.',
  'chronicle.pickOne': 'Llevas varias Crónicas: elige una con la opción `chronicle`.',
  'chronicle.storytellerOnly':
    'Solo el Narrador de esta Crónica o un admin del servidor puede hacerlo.',
  'chronicle.notMember': 'Ese personaje no está en ninguna Crónica.',
  'chronicle.removed': '**{name}** deja {chronicle}.',
  'chronicle.archived': '**{name}** está archivada: su canal y sus personajes quedan libres.',
  'chronicle.invite':
    '{user}, {storyteller} te invita a **{chronicle}**: elige el personaje que traes.',
  'chronicle.noFreeCharacter':
    'Todos tus personajes ya están en una Crónica. Crea uno nuevo con `/elder character create` y vuelve a pulsar el botón.',
  'chronicle.pickPlaceholder': 'Tu personaje',
  'chronicle.busy': '**{name}** ya juega en otra Crónica.',
  'chronicle.joined.private': '**{name}** entra en {chronicle}.',
  'chronicle.joined': '**{name}** ({user}) entra en {chronicle}.',
  'session.new.chronicle':
    'Crónica: **{name}**. Los dados de Hunger salen de la Vitae de cada personaje.',
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
