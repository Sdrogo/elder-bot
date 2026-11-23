# ElderBot user guide

ElderBot rolls dice for **Vampire: The Masquerade 6th Edition** using the playtest rules (Alpha 2.0). It does the math, shows every die and offers the follow-ups the rules allow: Willpower, Beast's Bargain, Try again. You type how many dice you roll. If your character is saved in the bot and plays in the channel's Chronicle, the bot also knows your Vitae, so it works out your Hunger dice, takes Willpower when you reroll and caps frenzy dice at your Humanity.

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

Each table has one **Storyteller**. Whoever runs `/elder session new` on a table without one becomes the Storyteller, and can hand the role over with `/elder session storyteller user:@someone`. Server admins (Manage Server permission) always count as Storyteller, so a table never gets stuck.

Only the Storyteller can:

- run `/elder session` (new session, end, language, change Storyteller);
- mark, clear or set the Masquerade Tracker and roll the threat test (anyone can look with `/elder masquerade show`);
- grant or refuse a Beast's Bargain.

## Characters and Chronicles

Each player can save characters in the bot, several per player. A character keeps its trackers: Health (and baneful damage), Vitae, Willpower, Humanity (and violations). The bot works out the maxima from the sheet: Health = Stamina + 5, Willpower = Composure + Resolve, Vitae 5/10/15/20 by tier (Ghoul, Neonate or Duskborn, Ancilla, Elder).

**Hunger dice are never typed on the sheet**: they come from the Vitae you have left, as in the Hunger Dice per Vitae table (Player Packet p. 103). A neonate at 10 Vitae has 0 Hunger dice, at 7 has 2, at 1 has 5.

A **Chronicle** is a Storyteller's game: its players' characters, its Masquerade Tracker and its sect. A Storyteller can run several Chronicles; one at a time is **on air**, the one the OBS overlay shows.

| Command                                                                                  | Who                | What it does                                                                      |
| ---------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `/elder character create name clan tier stamina composure resolve [humanity]`            | Anyone             | Creates a character at full Health, Vitae and Willpower, Humanity 6 unless given  |
| `/elder character sheet [character] [public]`                                            | Anyone             | The sheet with − and + buttons for each tracker. Only you see it, unless `public` |
| `/elder character list`                                                                  | Anyone             | Your characters and their Chronicles                                              |
| `/elder character set track value [character]`                                           | Owner, Storyteller | Sets a tracker to an exact value                                                  |
| `/elder character edit [character] [name] [clan] [tier] [stamina] [composure] [resolve]` | Owner, Storyteller | Changes the sheet; current values follow the new maxima                           |
| `/elder character give user character`                                                   | Owner              | Offers the character to another player, who accepts with a button                 |
| `/elder character delete character`                                                      | Owner              | Deletes it, after a confirmation                                                  |
| `/elder chronicle create name [sect]`                                                    | Anyone             | Creates a Chronicle; you are its Storyteller. Your first one goes on air          |
| `/elder chronicle invite user [chronicle]`                                               | Storyteller        | The player chooses which character to bring                                       |
| `/elder chronicle remove character`                                                      | Storyteller        | Takes a character out; the player keeps it                                        |
| `/elder chronicle live [chronicle]`                                                      | Storyteller        | Puts the Chronicle on air                                                         |
| `/elder chronicle list`                                                                  | Storyteller        | Your Chronicles, their characters and which is on air                             |
| `/elder chronicle edit [chronicle] [name] [sect]`                                        | Storyteller        | Renames it or changes its sect                                                    |
| `/elder chronicle archive chronicle`                                                     | Storyteller        | Hides it and frees its channel and characters; nothing is deleted                 |

The owner, the Storyteller of the character's Chronicle and server admins can change a character; only the owner can give it away or delete it. A character plays in one Chronicle at a time.

To play a Chronicle in a channel, the Storyteller runs `/elder session new chronicle:<name>`. From then on, in that channel:

- every roll without `hunger` takes your Hunger dice from your character's Vitae, and says so under the roll; typing `hunger` still wins;
- the **Willpower** button takes 1 Willpower from your character, and is refused at 0;
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
- **Beast's Bargain** (after a plain Failure; never on a Painful or Bestial Failure or a second attempt): you reach for the Beast. The **Storyteller** describes the price (collateral damage, feed the Beast, a Masquerade breach, risking a frenzy), sized by your margin of failure, and presses **Grant bargain** for a basic win or **No bargain**.
- **Try again** (after a failure against a Difficulty, once): roll a second time at Difficulty +1, changing your Attribute or Skill in the form that opens. Any failure on the second attempt is a Painful Failure.

## Commands

Options in `[brackets]` are optional.

### `/elder roll`

A standard, Power or Self-Control test.

`/elder roll dice [difficulty] [bonus] [hunger] [take_half] [reason]`

| Option       | What it does                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `dice`       | Attribute + Skill (0–30)                                                                                      |
| `difficulty` | Successes needed to win (1–15)                                                                                |
| `bonus`      | Bonus (positive) or penalty (negative) dice, −10 to +10                                                       |
| `hunger`     | Your Hunger dice (0–5)                                                                                        |
| `take_half`  | **Taking Half**: no roll, half your pool (rounded up) counts as successes. Only when you are not under stress |
| `reason`     | What you are attempting, shown in the title                                                                   |

Example: `/elder roll dice:7 difficulty:2 hunger:1 reason:Climb the wall`

### `/elder contest`

A contested test: both sides roll, the most successes wins.

`/elder contest dice opponent_dice [opponent] [attribute] [opponent_attribute] [hunger] [opponent_hunger] [reason]`

- **Ties** go to the higher Attribute, so fill in `attribute` and `opponent_attribute`. For a minor or standard NPC, its Attribute is half its pool. With equal or unknown Attributes, whoever started the contest wins.
- The winner's margin is shown: the loser's margin of failure.
- `hunger` and `opponent_hunger`: each side's Hunger dice. Losing with a 1 on a Hunger die is a Bestial Failure.
- `opponent`: the opposing player, shown by name.

### `/elder npc`

`/elder npc dice [difficulty] [bonus] [take_half] [reason]`: a test for an NPC. Roll the pool from its stat block: its Physical, Social or Mental pool, or a Skill pool.

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
- `/elder prolonged roll dice [bonus] [hunger]`: roll for it. The bot adds up the successes and tells you when the task is done or failed. A roll with no successes (a Painful or Bestial Failure) fails the task at once.
- `/elder prolonged status`: show your progress.
- `/elder prolonged cancel`: close it.

Each player can have one prolonged task open per channel.

### `/elder masquerade`

The table's Masquerade Tracker: 10 boxes, from Superstition (0) to Open War (9–10).

- `show`: the tracker and its level (anyone).
- `mark [amount] [reason]`, `clear [amount]`, `set value`: Storyteller only.
- `threat`: the optional threat test. The bot rolls one die per marked box and names the reaction, from Calm Before the Storm to Overwhelming Threat.

The tracker belongs to the chronicle: `/elder session end` doesn't reset it.

### `/elder session`

- `new [chronicle]`: start a session. On a table without a Storyteller, you become it. With `chronicle`, this channel plays that Chronicle and it goes on air.
- `end`: end the game on this table. Prolonged tasks and table language are reset, and the Storyteller role is freed. The Masquerade Tracker stays.
- `storyteller [user]`: show the Storyteller, or hand the role to `user`.
- `language language`: the table's language (see below).

## Languages

The bot speaks English, Italian, Spanish, French and German. By default it answers each player in their own Discord language, and English for any other language. Command descriptions in the Discord menu follow your Discord language too; command and option names stay in English.

The Storyteller can fix one language for the whole table with `/elder session language`, or pick `Auto` to go back to each player's language. Game terms (Hunger, Willpower, Painful Failure, Bestial Failure, Beast's Bargain, Taking Half…) stay in English in every language, as in the playtest.

## Typical session

1. Once: the Storyteller runs `/elder chronicle create name:Nights of Rome` and `/elder chronicle invite user:@player`; each player creates a character with `/elder character create` and picks it from the invitation.
2. The Storyteller opens the table: `/elder session new chronicle:Nights of Rome`.
3. Players roll: `/elder roll dice:6 difficulty:2 reason:Pick the lock`. Hunger dice come from their Vitae; spending Vitae is a click on the sheet (`/elder character sheet`).
4. A failed roll? Press **Willpower** to reroll up to 3 dice, ask for a **Beast's Bargain**, or **Try again** another way.
5. Someone bares their fangs in public: `/elder masquerade mark reason:Fangs in the hotel lobby`.
6. When the chronicle is over, `/elder session end` clears the table.

---

ElderBot is a fan-made project and is not affiliated with Paradox Interactive or World of Darkness. See the [Terms of Service](../TERMS.md) and [Privacy Policy](../PRIVACY.md).
