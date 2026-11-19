# Decision log

A dated, one-line-per-decision index of what this project decided and when.

**This is an index, not a second source of truth.** Every row points at the
file and section where the reasoning actually lives. In this repo that is:

- `README.md` — the premise, the progression, the two load-bearing engineering
  choices, and how it deploys.
- `docs/DECISIONS.md` — the trade-offs and the deferred list, i.e. everything
  that had nowhere else to go.
- `git history` — where the commit message is genuinely the best account of a
  decision. Honest, but a weaker Ref than a document: prefer writing the why
  down somewhere a reader will find it.

If a decision's why is not written anywhere, write it in `docs/DECISIONS.md`
first, then add the row.

## How to keep this file

**Add a file, not a row.** A new decision goes in `docs/decision-log/` as its
own file named `YYYY-MM-DD-short-name.md` (lowercase, hyphenated), holding
exactly one table row and nothing else. Never edit the table on a branch: rows
appended to the same last line by parallel branches always conflict, and
separate files never do.

**Fold on main.** `npm run decision-log -- --fold` appends the waiting entries
to the end of the table in filename order (date, then name) and deletes their
files. Run it on main, in a commit of its own, whenever the folder gets long.
`npm run decision-log` on its own validates and prints what is waiting.

Rows are appended, never inserted, so the table reads in the order decisions
were *recorded*. A fold can therefore land a row dated earlier than the one
above it. That is the cost of never touching an existing line, and it is the
right trade: the Date column is the source of truth for when, and the table
never conflicts.

**One row per decision, not per commit.** A decision reversed later gets a new
row of kind `Reversed`. The old row stays — the point of a log is that you can
see what you used to think.

**Say the decision, not the change.** "Bookmarks widened to every content
type", not "edit bookmark.js". A reader should learn what was decided without
opening a diff.

**Kind** is one of: `Product`, `Design`, `Copy`, `Engineering`, `Process`,
`Deferred`, `Reversed`. The list lives in code, in
`scripts/decision-log/entries.mjs`, and a test asserts this file documents the
same set. (`Copy` stands in for the usual `Content`: this project has no
content pipeline, but its wording — effort labels, the completion line, the
tier hints — is a real design axis.)

**Ref** names the file → section holding the why.

## Log

| Date | Kind | Decision | Ref |
| --- | --- | --- | --- |
| 2026-09-15 | Process | Rules engine written and tested on its own before any UI | git history → eef50d1 |
| 2026-09-15 | Product | A day grants a fixed number of spell slots, and nothing adds more | README.md → The idea |
| 2026-09-15 | Product | Small tasks are cantrips: free, unlimited, and never counted toward a complete day | README.md → The idea |
| 2026-09-15 | Product | Effort is tiered 1st to 4th by the attention a thing costs, not by how important it is | README.md → Levelling |
| 2026-09-15 | Product | A level grants one new slot at a time, on a superlinear XP curve | docs/DECISIONS.md → The shape of the level curve |
| 2026-09-15 | Product | A small spell may be upcast into a bigger slot, and earns the bigger slot's XP | README.md → Levelling |
| 2026-09-15 | Product | Rituals re-prepare every morning; daily or not at all | docs/DECISIONS.md → Rituals are a flag, not a scheduler |
| 2026-09-15 | Product | A new day starts at a configurable hour, so a late night spends the previous day's slots | README.md → How it's built |
| 2026-09-15 | Product | An unfinished day costs the rest bonus and the streak, and carries no other penalty | docs/DECISIONS.md → Voice |
| 2026-09-15 | Product | Data stays on the device; export and import are the only backup | README.md → Your data |
| 2026-09-15 | Engineering | No backend and no state library: React, TypeScript, Vite, and localStorage | README.md → How it's built |
| 2026-09-15 | Engineering | Today's XP is derived from today's state rather than accumulated, so undo is exact | README.md → How it's built |
| 2026-09-15 | Engineering | A day is identified by a date key, not a timestamp | README.md → How it's built |
| 2026-09-15 | Engineering | Day history is capped at 400 records and trimmed at the long rest | docs/DECISIONS.md → History is capped |
| 2026-09-15 | Engineering | Icons are drawn procedurally by a script, not committed as art or built with a dependency | docs/DECISIONS.md → Generated icons |
| 2026-09-15 | Engineering | Import rejects a file that is not a save instead of replacing the game with a fresh one | git history → 02f7cfe |
| 2026-09-15 | Design | A day is shown as orbs: hollow when empty, charged when prepared, blazing when cast | git history → a904b8f |
| 2026-09-15 | Design | Tiers are colour-coded so the shape of a day reads before any of the words do | git history → a904b8f |
| 2026-09-15 | Design | Three views, and only three: Today, Spellbook, Character | git history → a904b8f |
| 2026-09-15 | Design | Preparing a slot offers yesterday's unfinished spells first | git history → a904b8f |
| 2026-09-15 | Design | A level-up names the slots it granted rather than showing a number going up | git history → a904b8f |
| 2026-09-15 | Design | Dark theme only, with no light variant and no toggle | docs/DECISIONS.md → Dark only |
| 2026-09-15 | Copy | Effort labels name what the work feels like, not what it costs the system | docs/DECISIONS.md → Voice |
| 2026-09-15 | Copy | Completing a day reads as permission to stop, not as a prompt to do more | docs/DECISIONS.md → Voice |
| 2026-09-15 | Process | Correctness is checked twice: unit tests on the engine, a real browser run on the build | docs/DECISIONS.md → Why a browser check as well as unit tests |
| 2026-09-15 | Process | Published to GitHub Pages by a workflow on push | README.md → Deploying |
| 2026-09-15 | Process | The deploy workflow triggers on a branch named main | git history → a904b8f |
| 2026-09-15 | Reversed | The deploy workflow triggers on whichever branch the repository reports as its default | README.md → Deploying |
| 2026-09-15 | Deferred | No accounts, sync, or backend | docs/DECISIONS.md → Not doing (yet) |
| 2026-09-15 | Deferred | Levels stop at 20, with no prestige beyond it | docs/DECISIONS.md → Not doing (yet) |
| 2026-11-19 | Deferred | No reminders or notifications | docs/DECISIONS.md → Not doing (yet) |
| 2026-11-19 | Deferred | No reordering or drag-and-drop of prepared slots | docs/DECISIONS.md → Not doing (yet) |
