// English catalog: the source of truth for every message key. Other languages copy these keys.
// `{name}` marks a placeholder; `.one` / `.other` pairs are picked by count with tn().
// Game terms (Quickening, Drama, Painful Failure, Devil's Bargain, ...) stay in English everywhere.

export const en = {
  // Slash command descriptions (names never change).
  'cmd.elder.description': 'Dice rolls and resources for Vampire: The Masquerade 6e',

  'cmd.roll.description': 'Test: Attribute + Skill (or Discipline) − Difficulty, success on 8+',
  'opt.roll.dice': 'Attribute + Skill, Discipline, or Composure + Resolve',

  'opt.test.difficulty': 'Difficulty: dice removed from the pool',
  'opt.test.bonus': 'Bonus dice (positive) or penalty dice (negative)',
  'opt.test.quickening': 'Quickening to spend: +1 die each',
  'opt.test.combat': 'Attack or defense test: no Overqualified',
  'opt.test.reason': 'What you are attempting',
  'opt.test.ignore_traits': "Don't apply the Drama scene traits",

  'cmd.npc.description': 'Test for an NPC you control: pool = 2 × NPC Level',
  'opt.npc.level': 'The NPC Level',

  'cmd.contest.description': 'Contested test: the most successes wins',
  'opt.contest.dice': 'Your pool',
  'opt.contest.opponent_dice': "Opponent's pool (PC)",
  'opt.contest.opponent_npc_level': 'Opposing NPC Level: rolls 2 × Level',
  'opt.contest.opponent': 'Opposing player: gains Quickening from their 10s',
  'opt.contest.attribute': 'Your Attribute, for ties between PCs',
  'opt.contest.opponent_attribute': "Opposing PC's Attribute, for ties",
  'opt.contest.difficulty': 'Only when you compete against the same obstacle: applied to both',
  'opt.contest.reason': "What's at stake",

  'cmd.prolonged.description': 'Prolonged test: add up the successes of several rolls',
  'cmd.prolonged.start.description': 'Start a prolonged test',
  'opt.prolonged.name': 'The task',
  'opt.prolonged.target': 'Successes required',
  'opt.prolonged.tests': 'Rolls available',
  'choice.prolonged.target': '{count} successes',
  'choice.prolonged.tests': '{count} rolls',
  'cmd.prolonged.roll.description': 'Roll for your prolonged test',
  'opt.prolonged.dice': 'Attribute + Skill',
  'opt.prolonged.difficulty': 'Difficulty',
  'opt.prolonged.bonus': 'Bonus or penalty dice',
  'opt.prolonged.quickening': 'Quickening to spend',
  'cmd.prolonged.status.description': 'Show your prolonged test',
  'cmd.prolonged.cancel.description': 'Close your prolonged test',

  'cmd.quickening.description':
    'Your Quickening in this channel (max 5, resets at the end of the session)',
  'cmd.quickening.show.description': 'Show Quickening',
  'cmd.quickening.add.description': 'Add Quickening (past 5, mark Beast or Nature boxes)',
  'cmd.quickening.spend.description': 'Spend Quickening, for example to give dice to an ally',
  'cmd.quickening.success.description':
    'Buy a basic success: 3 Quickening, or 5 with no dots in the Skill',
  'cmd.quickening.set.description': 'Correct the value by hand',
  'opt.quickening.player': 'Another player',
  'opt.quickening.amount': 'How many',
  'opt.quickening.reason': 'What for',
  'opt.quickening.skill_dots': 'Do you have at least 1 dot in the Skill?',
  'opt.quickening.value': 'New value',

  'cmd.drama.description': "The Storyteller's Drama in this channel",
  'cmd.drama.show.description': 'Show Drama and the active scene traits',
  'cmd.drama.add.description': 'Add Drama',
  'cmd.drama.spend.description': 'Spend Drama',
  'cmd.drama.trait.description':
    'Create a scene trait (2 Drama): bonus or penalty to every roll in the scene',
  'cmd.drama.clear_traits.description': 'Remove the scene traits',
  'opt.drama.amount': 'How much',
  'opt.drama.add_reason': 'Why',
  'opt.drama.spend_reason': 'What for',
  'opt.drama.name': 'For example "Pouring rain"',
  'opt.drama.modifier': 'From -3 to +3 dice',

  'cmd.session.description': 'Sessions, scenes, Storyteller and table language',
  'cmd.session.new.description': 'New session: Quickening to 0, Drama = 1 per PC',
  'opt.session.player_characters': 'Number of PCs at the table',
  'cmd.session.scene.description':
    "New scene: removes the scene traits and makes the Devil's Bargain available again",
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
  'roll.extra': '{count} extra',
  'pool.bonus': 'bonus',
  'pool.difficulty': '− Difficulty {n}',
  'pool.quickening': '+ {n} Quickening',
  'pool.total.one': '= **{count}** die',
  'pool.total.other': '= **{count}** dice',
  'quickening.gained': '+{gained} Quickening from the 10s (now {total}/{max})',
  'quickening.overflow.one':
    'Quickening at maximum: mark {count} box on the Beast or Nature tracker.',
  'quickening.overflow.other':
    'Quickening at maximum: mark {count} boxes on the Beast or Nature tracker.',
  'roll.error.quickening': "You only have {available} Quickening: you can't spend {requested}.",
  'roll.overqualified':
    'You have 4 or more dice left after Difficulty: you can take a basic success without rolling (no extra successes), or roll.',
  'roll.noDice':
    'Difficulty took your pool to zero. Choose:\n- **Accept failure**: describe how things get complicated, +1 Quickening for you and +1 Drama for the Storyteller\n- **Look for advantages**: help, tools or position that give you extra dice, then roll again\n- **Help someone** with the assist action',
  'roll.retryNote': 'Second attempt: Difficulty +1, any failure is a Painful Failure.',

  'button.takeBasic': 'Take basic success',
  'button.roll': 'Roll',
  'button.acceptFailure': 'Accept failure',
  'button.acceptBargain': 'Accept bargain',
  'button.rejectBargain': 'Reject bargain',
  'button.alreadyUsed': 'This button has already been used.',
  'button.notYours': 'Only the player who rolled can use this button.',

  // Choose Your Pain.
  'pain.option.vitae': 'Lose 3 Vitae or Willpower (your choice)',
  'pain.option.quickening': 'Lose all your Quickening (not if you have 0)',
  'pain.option.beast': 'Mark 1 box on the Beast tracker',
  'pain.option.drama': 'Give the Storyteller 1 Drama',
  'pain.label.vitae': 'Lose 3 Vitae/Willpower',
  'pain.label.quickening': 'Lose all Quickening',
  'pain.label.beast': 'Mark Beast',
  'pain.label.drama': 'Give 1 Drama',
  'pain.result.vitae': '{player} loses 3 Vitae or Willpower.',
  'pain.result.quickening': '{player} loses all their Quickening.',
  'pain.result.beast': '{player} marks 1 box on the Beast tracker.',
  'pain.result.drama': '{player} gives the Storyteller 1 Drama.',
  'pain.noQuickening': 'You have no Quickening to lose: pick another price.',
  'pain.drama': "Storyteller's Drama: now {drama}.",
  'pain.sheet': 'Update it on your character sheet.',

  // Roll buttons and the Try again modal.
  'overqualified.taken': '**Success** · basic success without rolling (Overqualified)',
  'noDice.accepted': '**Failure** accepted: describe how the situation gets complicated.',
  'noDice.quickening': '+1 Quickening (now {value}/{max}).',
  'noDice.drama': '+1 Drama for the Storyteller (now {drama}).',
  'bargain.storytellerAnswers': 'The Storyteller accepts or rejects the bargain.',
  'bargain.alreadyUsed': "You already offered a Devil's Bargain in this scene.",
  'bargain.offer':
    'Offer: a complication in exchange for a basic success. The Storyteller accepts (+1 Drama) or rejects by spending 1 Drama.',
  'bargain.accepted.title': 'Bargain accepted',
  'bargain.accepted':
    '**Success** (basic success) with the agreed complication. +1 Drama for the Storyteller (now {drama}).',
  'bargain.noDrama': 'The Storyteller has no Drama: rejecting costs 1.',
  'bargain.rejected.title': 'Bargain rejected',
  'bargain.rejected': 'The Storyteller spends 1 Drama (now {drama}). The failure stands.',
  'retry.modal.title': 'Try again: Difficulty +1',
  'retry.modal.dice': 'New pool (change Attribute or Skill)',
  'retry.modal.quickening': 'Quickening to spend',
  'retry.modal.invalid': 'Enter whole numbers: pool from 0 to 30, Quickening from 0 to 5.',

  // /elder npc and /elder contest.
  'npc.name': 'Level {level} NPC',
  'contest.error.pool':
    'Give the opposing pool with `opponent_dice` (PC) or `opponent_npc_level` (NPC), not both.',
  'contest.opponent': 'Opponent',
  'contest.title': '{a} vs {b}',
  'contest.result': 'Result',
  'contest.win': '**{winner}** wins.',
  'contest.tie.attribute': 'Tie: **{winner}** wins with the higher Attribute.',
  'contest.tie.npc':
    'Tie against an NPC: whoever started the challenge wins, or the Storyteller decides.',
  'contest.tie.storyteller':
    'Tie: the Storyteller gives the win to the higher Attribute or to whoever started the challenge.',

  // /elder prolonged.
  'prolonged.none':
    'You have no prolonged test open in this channel. Use `/elder prolonged start`.',
  'prolonged.cancelled': 'Prolonged test "{name}" closed.',
  'prolonged.noDice':
    'Difficulty took your pool to zero: look for advantages that give you extra dice, or get help. The roll was not counted.',
  'prolonged.painful': 'The roll still counts, but you must Choose Your Pain.',
  'prolonged.completed': 'Completed!',
  'prolonged.failed': 'Out of rolls: task failed.',
  'prolonged.progress': 'Successes **{successes}/{target}** · rolls used **{done}/{max}**',

  // /elder quickening.
  'quickening.notEnough': 'You have {current} Quickening, {cost} needed.',
  'quickening.spentSuccess': '{player} spends {cost} Quickening on a **basic success**',
  'quickening.spent': '{player} spends {cost} Quickening{reason}',
  'quickening.left': '**{left}/{max}** left.\nSpend it before rolling.',

  // /elder drama.
  'drama.activeTraits': 'Active scene traits:',
  'drama.trait': '- {name}: {modifier} dice',
  'drama.max': 'max {max}',
  'drama.added': '+{amount} Drama{reason}. Now **{now}**{cap}.',
  'drama.traitsCleared': 'Scene traits removed.',
  'drama.traitLimit':
    'There are already {max} scene traits: remove them with `/elder drama clear_traits`.',
  'drama.notEnough': 'The Storyteller has {current} Drama, {cost} needed.',
  'drama.traitCreated':
    '**{name}**: {modifier} dice to every `/elder roll` in the scene (anyone not involved uses `ignore_traits`).\nDrama left: **{left}**.',
  'drama.spent': 'The Storyteller spends {cost} Drama{reason}. **{left}** left.',

  // /elder session and the Storyteller.
  'auth.storytellerOnly':
    "Only this table's Storyteller can do that. Whoever runs `/elder session new` becomes Storyteller, and can hand the role over with `/elder session storyteller`.",
  'session.storyteller.title': 'Storyteller',
  'session.storyteller.current': 'Table Storyteller: {who}.',
  'session.storyteller.none': 'nobody: whoever runs `/elder session new` takes the role',
  'session.storyteller.set': '{user} is the Storyteller of this table.',
  'session.ended.title': 'Session ended',
  'session.ended':
    'Quickening, Drama, scene traits, bargains, prolonged tests and table language reset. The table no longer has a Storyteller: the next `/elder session new` assigns one.',
  'session.new.title': 'New session',
  'session.new':
    "Everyone's Quickening to 0, the Storyteller's Drama to **{pcs}**, scene traits removed.",
  'session.scene.title': 'New scene',
  'session.scene': "Scene traits removed, Devil's Bargain available to everyone again.",
  'session.language.title': 'Language',
  'session.language.set': 'Table language: {language}.',
  'session.language.auto': 'The bot answers everyone in their own Discord language.',

  'error.generic': 'Something went wrong.',
};

export type MessageKey = keyof typeof en;

/** Every catalog has exactly the keys of the English one. */
export type Messages = Record<MessageKey, string>;
