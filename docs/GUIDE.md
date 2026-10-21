# ElderBot user guide

ElderBot rolls dice for **Vampire: The Masquerade 6th Edition** using the playtest rules (Alpha 1.0). It does the math, shows every die and keeps track of Quickening, Drama and scene traits for your table. It does not store character sheets: you type how many dice you roll.

Every command lives under `/elder`. Discord shows each option as a field: type `/elder roll`, fill in `dice`, press Tab to move to the next option.

## Contents

- [Tables and the Storyteller](#tables-and-the-storyteller)
- [How a roll works](#how-a-roll-works)
- [Reading a roll](#reading-a-roll)
- [After the roll: buttons](#after-the-roll-buttons)
- [Commands](#commands)
- [Languages](#languages)
- [Typical session](#typical-session)

## Tables and the Storyteller

Each Discord channel is a separate **table**: Quickening, Drama, scene traits and prolonged tests in one channel never affect another.

Each table has one **Storyteller**. Whoever runs `/elder session new` on a table without one becomes the Storyteller, and can hand the role over with `/elder session storyteller user:@someone`. Server admins (Manage Server permission) always count as Storyteller, so a table never gets stuck.

Only the Storyteller can:

- run `/elder session` (new session, new scene, end, language, change Storyteller);
- add, spend or change Drama and scene traits (anyone can look with `/elder drama show`);
- change another player's Quickening;
- accept or reject a Devil's Bargain.

## How a roll works

1. **Pool** = Attribute + Skill (or Discipline, or Composure + Resolve), plus or minus any bonus or penalty dice and active scene traits.
2. **Difficulty** removes dice from the pool. The pool never goes below 0.
3. **Quickening** you choose to spend adds 1 die each, after Difficulty.
4. Roll d10s:
   - every die showing **8 or more** is a success; each success beyond the first is an **extra success**;
   - no 8+ and at least one **1** is a **Painful Failure**;
   - no 8+ and no 1 is a plain **Failure**;
   - every **10** gives you 1 **Quickening** (up to 5; past 5 you mark boxes on the Beast or Nature tracker instead).

There are no Hunger dice and no critical pairs of 10s: this is not V5.

## Reading a roll

Above the roll summary the bot shows each die as an icon with its number, highest first:

| Icon              | Die | Meaning                   |
| ----------------- | --- | ------------------------- |
| Red skull         | 1   | Can cause Painful Failure |
| Grey dot          | 2–7 | Failure                   |
| Green ankh        | 8–9 | Success                   |
| Bright green ankh | 10  | Success + 1 Quickening    |

The summary below shows the pool calculation, the outcome and any Quickening gained. With more than 27 dice the icons are replaced by plain numbers.

## After the roll: buttons

Depending on the result, the roll message offers buttons. Only the player who rolled can press them, except where noted.

- **Overqualified** (4+ dice left after Difficulty, not in attack or defense tests): before rolling, choose **Take basic success** (one success, no extras, no roll) or **Roll**. Mark the test as `combat:True` to skip this choice.
- **No Dice Left** (Difficulty took the pool to 0): **Accept failure** gives you +1 Quickening and the Storyteller +1 Drama. Or look for help, tools or position that give you dice and roll again.
- **Devil's Bargain** (after a plain Failure, not on a second attempt, once per player per scene): offer a complication in exchange for a basic success. The **Storyteller** accepts (+1 Drama) or rejects it by spending 1 Drama.
- **Try again** (after a failure, once): roll a second time at Difficulty +1. You can change your pool and Quickening in the form that opens. Any failure on the second attempt is a Painful Failure.
- **Choose Your Pain** (after a Painful Failure): pick one price.
  - Lose 3 Vitae or Willpower: update your sheet.
  - Lose all your Quickening: the bot sets it to 0 (only offered if you have some).
  - Mark 1 box on the Beast tracker: update your sheet.
  - Give the Storyteller 1 Drama: the bot adds it.

## Commands

Options in `[brackets]` are optional.

### `/elder roll`

A standard test.

`/elder roll dice [difficulty] [bonus] [quickening] [combat] [reason] [ignore_traits]`

| Option          | What it does                                                         |
| --------------- | -------------------------------------------------------------------- |
| `dice`          | Attribute + Skill (0–30)                                             |
| `difficulty`    | Dice removed from the pool (0–15)                                    |
| `bonus`         | Bonus (positive) or penalty (negative) dice, −10 to +10              |
| `quickening`    | Quickening to spend, +1 die each (0–5)                               |
| `combat`        | Attack or defense test: no Overqualified                             |
| `reason`        | What you are attempting, shown in the title                          |
| `ignore_traits` | Don't apply the table's scene traits (you're not part of that scene) |

Example: `/elder roll dice:7 difficulty:2 quickening:1 reason:Climb the wall`

### `/elder contest`

A contested test: both sides roll, the most successes wins.

`/elder contest dice (opponent_dice | opponent_npc_level) [attribute] [opponent_attribute] [opponent] [difficulty] [reason]`

- Give the other side either `opponent_dice` (a player character's pool) or `opponent_npc_level` (an NPC rolls 2 × Level), not both.
- **Ties between PCs**: the higher Attribute wins, so fill in `attribute` and `opponent_attribute`.
- **Ties against an NPC**: whoever started the challenge wins, or the Storyteller decides.
- `opponent`: the opposing player, so they get Quickening for their 10s.
- `difficulty`: only when both sides face the same obstacle; it is removed from both pools.

### `/elder npc`

`/elder npc level [difficulty] [bonus] [reason] [ignore_traits]`: a test for an NPC you control. The pool is 2 × NPC Level (1–10).

NPCs don't use the players' mechanics: no Quickening, Overqualified, No Dice Left, Devil's Bargain, Choose Your Pain or Try again. The dice are rolled straight away, and an NPC with no successes simply fails.

### `/elder prolonged`

A task that needs several rolls to complete.

- `/elder prolonged start name target tests`: start it. `target` is the successes needed (3, 5, 7 or 10), `tests` the rolls available (3, 5 or 7).
- `/elder prolonged roll dice [difficulty] [bonus] [quickening]`: roll for it. The bot adds up the successes and tells you when the task is done or failed.
- `/elder prolonged status`: show your progress.
- `/elder prolonged cancel`: close it.

Each player can have one prolonged test open per channel.

### `/elder quickening`

Your Quickening on this table (0–5, back to 0 at each new session).

- `show [player]`: show yours or another player's.
- `add amount [player]`: add Quickening. Past 5, the bot tells you how many Beast or Nature boxes to mark.
- `spend amount [reason]`: spend it outside a roll, for example to give dice to an ally.
- `success skill_dots`: buy a basic success without rolling: 3 Quickening, or 5 if you have no dots in the Skill.
- `set value [player]`: correct the value by hand.

You can always change your own Quickening; only the Storyteller can change someone else's.

### `/elder drama`

The Storyteller's Drama on this table.

- `show`: Drama and active scene traits (anyone).
- `add amount [reason]`, `spend amount [reason]`: Storyteller only.
- `trait name modifier`: create a scene trait for 2 Drama, from −3 to +3 dice on every `/elder roll` in the scene (up to 10 traits). Players not involved roll with `ignore_traits:True`.
- `clear_traits`: remove all scene traits.

### `/elder session`

- `new player_characters`: start a session. Everyone's Quickening goes to 0, the Storyteller's Drama to 1 per PC, scene traits are removed. On a table without a Storyteller, you become it.
- `scene`: start a new scene. Scene traits are removed and Devil's Bargain is available to everyone again.
- `end`: end the game on this table. Quickening, Drama, scene traits, bargains, prolonged tests and table language are reset, and the Storyteller role is freed.
- `storyteller [user]`: show the Storyteller, or hand the role to `user`.
- `language language`: the table's language (see below).

## Languages

The bot speaks English, Italian, Spanish, French and German. By default it answers each player in their own Discord language, and English for any other language. Command descriptions in the Discord menu follow your Discord language too; command and option names stay in English.

The Storyteller can fix one language for the whole table with `/elder session language`, or pick `Auto` to go back to each player's language. Game terms (Quickening, Drama, Painful Failure, Devil's Bargain, Overqualified, Choose Your Pain…) stay in English in every language, as in the playtest.

## Typical session

1. The Storyteller opens the table: `/elder session new player_characters:4`.
2. Players roll: `/elder roll dice:6 difficulty:2 reason:Pick the lock`.
3. The Storyteller sets the mood with Drama: `/elder drama trait name:Pouring rain modifier:-1`.
4. When the scene changes: `/elder session scene`.
5. Next game night starts again with `/elder session new`. When the chronicle is over, `/elder session end` clears the table.

---

ElderBot is a fan-made project and is not affiliated with Paradox Interactive or World of Darkness. See the [Terms of Service](../TERMS.md) and [Privacy Policy](../PRIVACY.md).
