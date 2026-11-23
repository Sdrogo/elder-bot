# ElderBot user guide

ElderBot rolls dice for **Vampire: The Masquerade 6th Edition** using the playtest rules (Alpha 2.0). It does the math, shows every die and offers the follow-ups the rules allow: Willpower, Beast's Bargain, Try again. You type how many dice you roll. If your character is saved in the bot and plays in the channel's Chronicle, the bot also knows your Vitae, so it works out your Hunger dice, takes Willpower when you reroll and caps frenzy dice at your Humanity.

Discord keeps only the commands you need at the table: managing characters, Chronicles and sessions happens on the **web panel** (`/elder panel` gives you the link).

Every command lives under `/elder`. Discord shows each option as a field: type `/elder roll`, fill in `dice`, press Tab to move to the next option.

## Contents

- [Tables and the Storyteller](#tables-and-the-storyteller)
- [Characters and Chronicles](#characters-and-chronicles)
- [How a roll works](#how-a-roll-works)
- [Reading a roll](#reading-a-roll)
- [After the roll: buttons](#after-the-roll-buttons)
- [Commands](#commands)
- [Languages](#languages)
- [Typical session](#typical-session)

## Tables and the Storyteller

Each Discord channel is a separate **table**: prolonged tasks and the Masquerade Tracker in one channel never affect another.

A table's **Storyteller** is the Storyteller of the Chronicle played in that channel. On the web panel the Storyteller picks, for each Chronicle, the **table channel** and the bot's **language** there, and can **end the session** or **hand the Chronicle over** to someone else. Server admins (Manage Server permission) always count as Storyteller, so a table never gets stuck; in a channel with no Chronicle they are the only ones.

Only the Storyteller can:

- mark or clear the Masquerade Tracker and roll the threat test, with the buttons under `/elder masquerade` (anyone can look);
- grant or refuse a Beast's Bargain.

## Characters and Chronicles

Each player can save characters in the bot, several per player. A character keeps its trackers: Health (and baneful damage), Vitae, Willpower, Humanity (and violations). The bot works out the maxima from the sheet: Health = Stamina + 5, Willpower = Composure + Resolve, Vitae 5/10/15/20 by tier (Ghoul, Neonate or Duskborn, Ancilla, Elder).

**Hunger dice are never typed on the sheet**: they come from the Vitae you have left, as in the Hunger Dice per Vitae table (Player Packet p. 103). A neonate at 10 Vitae has 0 Hunger dice, at 7 has 2, at 1 has 5.

A **Chronicle** is a Storyteller's game: its players' characters, its Masquerade Tracker and its sect. A Storyteller can run several Chronicles; one at a time is **on air**, the one the OBS overlay shows.

Characters and Chronicles are managed on the **web panel**: creating a character (with the guided Alpha 2.0 wizard), editing it, giving it to another player or deleting it; creating, editing, archiving or handing over a Chronicle, choosing the one on air, ordering and removing its characters. Two commands stay on Discord:

| Command                             | Who         | What it does                                                                      |
| ----------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `/elder sheet [character] [public]` | Anyone      | The sheet with − and + buttons for each tracker. Only you see it, unless `public` |
| `/elder invite user [chronicle]`    | Storyteller | Invites a player, who picks the character to bring with a button                  |

The owner, the Storyteller of the character's Chronicle and server admins can change a character; only the owner can give it away or delete it. A character plays in one Chronicle at a time.

Once the Storyteller has chosen the Chronicle's table channel on the panel, in that channel:

- every roll without `hunger` takes your Hunger dice from your character's Vitae, and says so under the roll; typing `hunger` still wins;
- the **Willpower** buttons take 1 Willpower from your character, and are refused at 0;
- `/elder frenzy` takes Composure + Resolve and Humanity from your character if you leave them out;
- `/elder masquerade` works on the Chronicle's tracker, which follows the Chronicle to any channel.

When you pick a `character` or `chronicle`, Discord suggests names as you type. Leave it empty to use your character at this table, or your only one.

## How a roll works

1. **Pool** = Attribute + Skill (or Discipline, or Composure + Resolve), plus or minus any bonus or penalty dice: assist, focus, story assets, Impairment.
2. **Hunger dice**: if your character has any (0–5), give them with `hunger`, or let the bot take them from your saved character (see above). They replace normal dice one for one; they are not extra dice.
3. Roll d10s:
   - every die showing **6 or more** is a success, and a **10** counts as **two**;
   - successes equal to or above the **Difficulty** win. Winning with at least one 10 is a **Critical Win**;
   - fewer successes than the Difficulty is a **Failure**; the bot shows the margin;
   - **no successes at all** is a **Painful Failure**: work out a complication with the Storyteller;
   - a failure with a **1 on a Hunger die** is a **Bestial Failure**: the Beast lashes out. It can come on top of a Painful Failure.
4. Without a Difficulty (for example when the Storyteller compares your successes with an opponent's), the bot just counts successes and warns you about any 1 on a Hunger die.

If your pool is at least twice the Difficulty, the bot reminds the Storyteller that they can grant an **Automatic Win** without a roll.

## Reading a roll

Above the roll summary the bot shows each die as an icon with its number, highest first. Hunger dice sit on a second line, in red.

| Icon                        | Die | Meaning                                  |
| --------------------------- | --- | ---------------------------------------- |
| Grey dot (dark red: Hunger) | 1–5 | No success                               |
| Green ankh (red: Hunger)    | 6–9 | Success                                  |
| Bright ankh                 | 10  | Two successes                            |
| Red skull                   | 1   | On a Hunger die: risk of Bestial Failure |

The summary below shows the pool, the Difficulty, the successes and the margin. With more than 27 dice the icons are replaced by plain numbers.

## After the roll: buttons

Depending on the result, the roll message offers buttons. Only the player who rolled can press them, except where noted.

- **Willpower** (once per test): spend 1 Willpower and pick up to 3 normal dice to reroll. Hunger dice can never be rerolled. The bot rerolls them in the same message and works the outcome out again. **Cancel** brings back the other buttons.
- **Willpower: reroll failures** (shown when a normal die failed): the same, in one click. The bot rerolls up to 3 normal dice that show 1 to 5, never a Hunger die.
- **Beast's Bargain** (after a plain Failure; never on a Painful or Bestial Failure or a second attempt): you reach for the Beast. The **Storyteller** describes the price (collateral damage, feed the Beast, a Masquerade breach, risking a frenzy), sized by your margin of failure, and presses **Grant bargain** for a basic win or **No bargain**.
- **Try again** (after a failure against a Difficulty, once): roll a second time at Difficulty +1, changing your Attribute or Skill in the form that opens. Any failure on the second attempt is a Painful Failure.

## Commands

Options in `[brackets]` are optional.

### `/elder roll`

A standard, Power or Self-Control test.

`/elder roll dice [difficulty] [bonus] [hunger] [take_half] [reason] [npc]`

| Option       | What it does                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `dice`       | Attribute + Skill (0–30)                                                                                      |
| `difficulty` | Successes needed to win (1–15)                                                                                |
| `bonus`      | Bonus (positive) or penalty (negative) dice, −10 to +10                                                       |
| `hunger`     | Your Hunger dice (0–5)                                                                                        |
| `take_half`  | **Taking Half**: no roll, half your pool (rounded up) counts as successes. Only when you are not under stress |
| `reason`     | What you are attempting, shown in the title                                                                   |
| `npc`        | A test for an NPC (see below)                                                                                 |

Example: `/elder roll dice:7 difficulty:2 hunger:1 reason:Climb the wall`

### `/elder contest`

A contested test: both sides roll, the most successes wins.

`/elder contest dice opponent_dice [opponent] [attribute] [opponent_attribute] [hunger] [opponent_hunger] [reason]`

- **Ties** go to the higher Attribute, so fill in `attribute` and `opponent_attribute`. For a minor or standard NPC, its Attribute is half its pool. With equal or unknown Attributes, whoever started the contest wins.
- The winner's margin is shown: the loser's margin of failure.
- `hunger` and `opponent_hunger`: each side's Hunger dice. Losing with a 1 on a Hunger die is a Bestial Failure.
- `opponent`: the opposing player, shown by name.

#### NPCs

`/elder roll dice npc:true [difficulty] [bonus] [take_half] [reason]`: a test for an NPC. Roll the pool from its stat block: its Physical, Social or Mental pool, or a Skill pool.

NPCs don't use the players' mechanics: no Hunger dice, Willpower, Beast's Bargain, complications or Try again. An NPC with no successes simply fails.

### `/elder frenzy`

Resist a frenzy with a Self-Control test.

`/elder frenzy type [dice] [humanity] [hunger] [difficulty] [bonus]`

- `type`: Hunger, Rage, Fear or Clan Frenzy.
- `dice`: Composure + Resolve. `humanity`: your Humanity (or Path) rank; you never roll more dice than that. With a saved character at this table both are optional.
- **Hunger Frenzy**: the Difficulty is your Hunger dice, so `hunger` is enough. For the others the Storyteller gives the `difficulty`: Rage 2 ± modifiers, Fear from its table, Clan 3 + generation modifier.
- Win: you resist for the rest of the scene. Failure: you suffer the frenzy. Painful Failure: you suffer it and do something you will regret.

To **ride the wave** instead, don't roll: you suffer the frenzy and regain 1 Willpower when it ends.

### `/elder prolonged`

A task that needs several rolls to complete.

- `/elder prolonged start name target tests`: start it. `target` is the successes needed (3, 5, 7 or 10), `tests` the rolls available (3, 5 or 7).
- `/elder prolonged roll dice [bonus] [hunger]`: roll for it. The bot adds up the successes and shows your progress, and tells you when the task is done or failed. A roll with no successes (a Painful or Bestial Failure) fails the task at once.
- **Cancel task**: the button under the task drops it.

Each player can have one prolonged task open per channel.

### `/elder masquerade`

The table's Masquerade Tracker: 10 boxes, from Superstition (0) to Open War (9–10). Anyone can show it; its buttons are for the Storyteller:

- **−1** and **+1** clear or mark a box;
- **Threat test**: the optional threat test. The bot rolls one die per marked box and names the reaction, from Calm Before the Storm to Overwhelming Threat.

The tracker belongs to the Chronicle: ending a session doesn't reset it. The panel moves it too.

### `/elder sheet` and `/elder invite`

See [Characters and Chronicles](#characters-and-chronicles).

### `/elder panel`

The link to the web panel, only for you.

## Languages

The bot speaks English, Italian, Spanish, French and German. By default it answers each player in their own Discord language, and English for any other language. Command descriptions in the Discord menu follow your Discord language too; command and option names stay in English.

The Storyteller can fix one language for a Chronicle's table on the web panel, or leave it on each player's Discord language. Game terms (Hunger, Willpower, Painful Failure, Bestial Failure, Beast's Bargain, Taking Half…) stay in English in every language, as in the playtest.

## Typical session

1. Once, on the web panel: the Storyteller creates the Chronicle "Nights of Rome" and picks its table channel; each player creates a character. On Discord the Storyteller runs `/elder invite user:@player`, and each player picks a character from the invitation.
2. Players roll: `/elder roll dice:6 difficulty:2 reason:Pick the lock`. Hunger dice come from their Vitae; spending Vitae is a click on the sheet (`/elder sheet`).
3. A failed roll? Press **Willpower** to pick up to 3 dice, or **Willpower: reroll failures** to let the bot pick them; ask for a **Beast's Bargain**, or **Try again** another way.
4. Someone bares their fangs in public: the Storyteller shows `/elder masquerade` and presses **+1**.
5. At the end of the night the Storyteller presses **End session** on the panel: prolonged tasks still open are dropped.

---

ElderBot is a fan-made project and is not affiliated with Paradox Interactive or World of Darkness. See the [Terms of Service](../TERMS.md) and [Privacy Policy](../PRIVACY.md).
