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

  // /elder roll npc:true and /elder contest.
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

  // The Storyteller.
  // Willpower, /elder frenzy and /elder masquerade.
  'cmd.frenzy.description':
    'Resist a frenzy: Composure + Resolve, at most as many dice as Humanity',
  'opt.frenzy.type': 'Type of frenzy',
  'opt.frenzy.dice': 'Composure + Resolve',
  'opt.frenzy.humanity': 'Your Humanity (or Path) rank: caps the dice',
  'opt.frenzy.hunger': 'Your Hunger dice (0-5): the Difficulty of a hunger frenzy',
  'opt.frenzy.difficulty':
    'Difficulty set by the Storyteller (rage 2 ± modifiers, clan 3 + generation modifier)',
  'frenzy.title': 'resisting a {frenzy}',
  'frenzy.capped': 'Pool of {pool} dice, but Humanity {humanity} caps it.',
  'frenzy.resisted': 'Resisted for the rest of the scene.',
  'frenzy.suffered': 'The character suffers a {frenzy}.',
  'frenzy.painful': 'The character suffers a {frenzy} and does something they will regret.',
  'frenzy.error.difficulty': 'Give the `difficulty` set by the Storyteller.',
  'frenzy.error.noHunger':
    "A hunger frenzy's Difficulty is your Hunger dice: give `hunger` (at least 1) or a `difficulty`.",
  'cmd.masquerade.description':
    'The Masquerade Tracker of this table, with buttons for the Storyteller',
  'masquerade.title': 'Masquerade Tracker',
  'masquerade.threat.title': 'Masquerade threat test',
  'willpower.pick': 'Pick up to {max} dice to reroll (−1 Willpower)',
  'willpower.option': 'Die {n}: {face}',
  'willpower.spent': '1 Willpower spent, rerolled: {changes}.',
  'button.cancel': 'Cancel',

  'auth.storytellerOnly':
    'Only the Storyteller of the Chronicle played in this channel (or a server admin) can do that. The channel is chosen on the web panel (`/elder panel`).',

  // Characters and Chronicles.
  'cmd.sheet.description': 'Shows a character sheet with + and − buttons',
  'opt.sheet.character': 'The character (default: yours at this table)',
  'opt.sheet.public': 'Show it to the whole channel, without buttons',
  'opt.invite.chronicle': 'The Chronicle (default: the one played in this channel)',
  'cmd.invite.description': 'Invites a player to bring a character into a Chronicle',
  'opt.invite.player': 'The player',
  'campaign.guildOnly': 'Characters and Chronicles belong to a server: use this command there.',
  'character.noneYet':
    'You have no characters on this server yet. Create one on the web panel (`/elder panel`).',
  'character.notFound': 'Character not found.',
  'character.pickOne': 'You have several characters: pick one with the `character` option.',
  'character.cannotEdit':
    'Only the owner, the Storyteller of its Chronicle or a server admin can change this character.',
  'chronicle.invite.invalid': 'Pick another player (not yourself or a bot).',
  'character.hungerFromVitae':
    "{hunger} from {name}'s Vitae ({vitae}/{max}). Use the `hunger` option to change it.",
  'sheet.chronicle': 'Chronicle: {name}',
  'sheet.noChronicle': 'no Chronicle',
  'button.pickCharacter': 'Choose a character',
  'opt.roll.npc': 'Roll for an NPC: the pool from their stat block, no Hunger dice',
  'button.masqueradeThreat': 'Threat test',
  'button.prolongedCancel': 'Cancel task',
  'button.willpowerBest': 'Willpower: reroll failures',
  'willpower.noFailures': 'No failed normal dice to reroll.',
  'chronicle.noneYet': 'No Chronicles yet. Create one on the web panel (`/elder panel`).',
  'chronicle.notFound': 'Chronicle not found.',
  'chronicle.pickOne': 'You run several Chronicles: pick one with the `chronicle` option.',
  'chronicle.storytellerOnly':
    'Only the Storyteller of this Chronicle or a server admin can do this.',
  'chronicle.invite':
    '{user}, {storyteller} invites you to **{chronicle}**: choose the character you bring.',
  'chronicle.noFreeCharacter':
    'All your characters are already in a Chronicle. Create a new one on the web panel (`/elder panel`), then press the button again.',
  'chronicle.pickPlaceholder': 'Your character',
  'chronicle.busy': '**{name}** already plays in another Chronicle.',
  'chronicle.wrongTier': "**{name}** can't join: the Chronicle is {tier} tier.",
  'chronicle.joined.private': '**{name}** joins {chronicle}.',
  'chronicle.joined': '**{name}** ({user}) joins {chronicle}.',
  'frenzy.error.noCharacter':
    'You have no character at this table: give `dice` (Composure + Resolve) and `humanity`.',
  'willpower.none': '**{name}** has no Willpower left.',
  'willpower.left': '{name}: Willpower {left}/{max}.',

  // Web panel.
  'cmd.panel.description': 'Link to the web panel: your characters and Chronicles',
  'panel.link': 'Your characters and Chronicles, in the browser. Log in with your Discord account.',
  'panel.open': 'Open the panel',
  'panel.notConfigured': 'The web panel is not set up on this bot.',

  'error.generic': 'Something went wrong.',
};

export type MessageKey = keyof typeof en;

/** Every catalog has exactly the keys of the English one. */
export type Messages = Record<MessageKey, string>;
