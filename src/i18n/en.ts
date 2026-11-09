// English catalog: the source of truth for every message key. Other languages copy these keys.
// `{name}` marks a placeholder; `.one` / `.other` pairs are picked by count with tn().
// Game terms (Hunger, Painful Failure, Beast's Bargain, ...) stay in English everywhere.

export const en = {
  // Slash command descriptions (names never change).
  'cmd.elder.description': 'Dice rolls for Vampire: The Masquerade 6e',

  'cmd.roll.description': 'Test: Attribute + Skill (or Discipline), success on 6+, a 10 counts 2',
  'opt.roll.dice': 'Attribute + Skill, Discipline, or Composure + Resolve',

  'opt.test.difficulty': 'Difficulty: successes needed to win',
  'opt.test.bonus': 'Bonus dice (positive) or penalty dice (negative)',
  'opt.test.hunger': 'Your Hunger dice (0-5): they replace normal dice in the pool',
  'opt.test.take_half': 'Taking Half: no roll, half your pool (rounded up) as successes',
  'opt.test.reason': 'What you are attempting',

  'cmd.npc.description': 'Test for an NPC: roll the dice pool from its stats',
  'opt.npc.dice': 'NPC dice pool (Physical, Social, Mental, or a Skill pool)',

  'cmd.contest.description': 'Contested test: the most successes wins',
  'opt.contest.dice': 'Your pool',
  'opt.contest.opponent_dice': "Opponent's pool",
  'opt.contest.opponent': 'Opposing player',
  'opt.contest.attribute': 'Your Attribute, for ties',
  'opt.contest.opponent_attribute': "Opponent's Attribute, for ties (an NPC: half its pool)",
  'opt.contest.hunger': 'Your Hunger dice (0-5)',
  'opt.contest.opponent_hunger': "Opponent's Hunger dice (a vampire PC)",
  'opt.contest.reason': "What's at stake",

  'cmd.prolonged.description': 'Prolonged task: add up the successes of several rolls',
  'cmd.prolonged.start.description': 'Start a prolonged task',
  'opt.prolonged.name': 'The task',
  'opt.prolonged.target': 'Successes required',
  'opt.prolonged.tests': 'Rolls available',
  'choice.prolonged.target': '{count} successes',
  'choice.prolonged.tests': '{count} rolls',
  'cmd.prolonged.roll.description': 'Roll for your prolonged task',
  'opt.prolonged.dice': 'Attribute + Skill',
  'opt.prolonged.bonus': 'Bonus or penalty dice',
  'opt.prolonged.hunger': 'Your Hunger dice (0-5)',
  'cmd.prolonged.status.description': 'Show your prolonged task',
  'cmd.prolonged.cancel.description': 'Close your prolonged task',

  'cmd.session.description': 'Sessions, Storyteller and table language',
  'cmd.session.new.description': 'New session: whoever starts it becomes Storyteller',
  'cmd.session.end.description': 'End the session: reset the table and free the Storyteller role',
  'cmd.session.storyteller.description': "Show or change this channel's Storyteller",
  'opt.session.user': 'The new Storyteller',
  'cmd.session.language.description': "Language of the bot's replies in this channel",
  'opt.session.language': "Table language, or auto to follow each user's Discord language",
  'choice.language.auto': 'Auto (Discord language)',

  // Shared roll output.
  'roll.title': 'Test',
  'roll.retryTitle': '{title} (Try again)',
  'roll.field.dice': 'Dice',
  'roll.field.outcome': 'Outcome',
  'dice.count.one': '{count} die',
  'dice.count.other': '{count} dice',
  'roll.successes.one': '{count} success',
  'roll.successes.other': '{count} successes',
  'roll.successesOf.one': '{count} success of {difficulty}',
  'roll.successesOf.other': '{count} successes of {difficulty}',
  'roll.margin': 'margin {margin}',
  'pool.bonus': 'bonus',
  'pool.difficulty': 'Difficulty {n}',
  'pool.total.one': '= **{count}** die',
  'pool.total.other': '= **{count}** dice',
  'roll.takingHalf': 'Taking Half: no dice rolled, half the pool (rounded up) as successes.',
  'roll.noDice': '**Failure**: no dice left in the pool, the test fails automatically.',
  'roll.complication':
    'No successes: on top of the failure, work out with the Storyteller how things get worse (damage or lose something, draw attention, expose a vulnerability, suffer harm).',
  'roll.bestial':
    'A 1 on a Hunger die: the Beast lashes out. The Storyteller picks the outcome (collateral damage, feed the Beast, Masquerade breach, risk a frenzy).',
  'roll.hungerOne': 'A 1 on a Hunger die: if this test is lost, it is a Bestial Failure.',
  'roll.automaticWin':
    'Pool at least twice the Difficulty: the Storyteller can grant an automatic win without rolling.',
  'roll.retryNote': 'Second attempt: Difficulty +1, any failure is a Painful Failure.',

  'button.grantBargain': 'Grant bargain',
  'button.refuseBargain': 'No bargain',
  'button.alreadyUsed': 'This button has already been used.',
  'button.notYours': 'Only the player who rolled can use this button.',

  // Beast's Bargain and the Try again modal.
  'bargain.requested':
    'The player reaches for the Beast. Storyteller: describe the cost (collateral damage, feed the Beast, Masquerade breach, risk a frenzy), sized by the margin of failure, then grant or refuse it.',
  'bargain.granted.title': 'Bargain struck',
  'bargain.granted': '**Success** (basic win, no margin) at the price the Storyteller described.',
  'bargain.refused.title': 'No bargain',
  'bargain.refused': 'The Storyteller offers no bargain: the failure stands.',
  'retry.modal.title': 'Try again: Difficulty {difficulty}',
  'retry.modal.dice': 'New pool (change Attribute or Skill)',
  'retry.modal.invalid': 'Enter a whole number from 0 to 30.',

  // /elder npc and /elder contest.
  'npc.name': 'NPC',
  'contest.opponent': 'Opponent',
  'contest.title': '{a} vs {b}',
  'contest.result': 'Result',
  'contest.win': '**{winner}** wins.',
  'contest.tie.attribute': 'Tie: **{winner}** wins with the higher Attribute.',
  'contest.tie.initiator':
    'Tie with equal (or unknown) Attributes: whoever initiated the contest wins.',
  'contest.consequences': 'Consequences',
  'contest.bestialIfLost': 'a 1 on a Hunger die, Bestial Failure if they lose the tie',

  // /elder prolonged.
  'prolonged.none':
    'You have no prolonged task open in this channel. Use `/elder prolonged start`.',
  'prolonged.cancelled': 'Prolonged task "{name}" closed.',
  'prolonged.noDice':
    'Your pool has no dice: look for advantages that give you extra dice, or get help. The roll was not counted.',
  'prolonged.disaster': 'Painful or Bestial Failure: the task fails at once.',
  'prolonged.completed': 'Completed!',
  'prolonged.failed': 'Out of rolls: task failed.',
  'prolonged.progress': 'Successes **{successes}/{target}** · rolls used **{done}/{max}**',

  // /elder session and the Storyteller.
  'auth.storytellerOnly':
    "Only this table's Storyteller can do that. Whoever runs `/elder session new` becomes Storyteller, and can hand the role over with `/elder session storyteller`.",
  'session.storyteller.title': 'Storyteller',
  'session.storyteller.current': 'Table Storyteller: {who}.',
  'session.storyteller.none': 'nobody: whoever runs `/elder session new` takes the role',
  'session.storyteller.set': '{user} is the Storyteller of this table.',
  'session.ended.title': 'Session ended',
  'session.ended':
    'Prolonged tasks and table language reset. The table no longer has a Storyteller: the next `/elder session new` assigns one.',
  'session.new.title': 'New session',
  'session.new': 'The table is ready. Add your Hunger dice to each roll with the `hunger` option.',
  'session.language.title': 'Language',
  'session.language.set': 'Table language: {language}.',
  'session.language.auto': 'The bot answers everyone in their own Discord language.',

  'error.generic': 'Something went wrong.',
};

export type MessageKey = keyof typeof en;

/** Every catalog has exactly the keys of the English one. */
export type Messages = Record<MessageKey, string>;
