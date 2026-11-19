# Spell Slots — case study

A running, modular case study of this project, kept in the repo so it is
written while the reasons are still fresh rather than reconstructed from a
diff a year later.

This file is not built or shipped. It is source material for a portfolio
write-up, a conference talk, or an interview answer.

## How this file works

**Modules, not chapters.** Each `##` section stands alone. A write-up can take
modules 1, 2 and 9 and drop the rest without leaving a hole — no module
depends on the one before it, and none says "as we saw above".

**Every module opens with an italic tag line:**

- ***Core*** — the spine. Any version of this story includes it.
- ***Optional [audience]*** — for the long form, or for the named audience.
- ***Evidence:*** what to show beside the text. `[ ]` means not captured yet;
  `[x]` means it exists and where.

**Running.** When a piece of work is worth telling, add or amend a module and
add a row to *Log of additions*. Facts and dates come from
`docs/DECISION-LOG.md`; the reasoning comes from `docs/DECISIONS.md` and the
README. This file is where they stop being a record and become a story.

**Placeholders** in `[[double brackets]]` are for the owner to fill in — role,
tools, metrics, reflections, anything about intent or experience. These are
never invented or guessed; an empty placeholder is better than a plausible
lie.

## Suggested cuts

| Form | Modules |
| --- | --- |
| Short — portfolio tile, ~200 words | 1, 2, 3, 11 |
| Standard — case study page | 1, 2, 3, 4, 5, 8, 10, 11 |
| Long — talk, deep-dive, or interview | All |

---

## 1. Overview

*Core. **Evidence:** `[ ]` hero shot of the Today view at a high level, all four tiers in play; `[ ]` the three-orb app icon.*

Spell Slots is a habit and priority tracker built on a hard limit. A day grants
a finite number of "spell slots", borrowed from tabletop RPGs; big commitments
consume one, small things are free "cantrips", and the slots refill overnight.
Finishing every slot completes the day and earns experience; experience earns
levels; a level grants exactly one more slot. Capacity is something you grow
into by finishing the days you already have.

It is an offline-first installable web app with no account and no server.
Everything lives on the device.

- **Role:** [[your role — e.g. sole designer and engineer / direction and review]]
- **Timeline:** first working version built 2026-09-15; [[ongoing? how long since?]]
- **Tools:** React, TypeScript, Vite, vite-plugin-pwa, Vitest, Playwright, GitHub Pages
- **Team:** [[who else, if anyone]]
- **Status:** [[live and in daily use? / prototype? / parked?]]

## 2. The problem

*Core. **Evidence:** `[ ]` a screenshot of a typical overloaded to-do list for contrast.*

Conventional to-do apps are unbounded by design. They let you write down twenty
things for a Tuesday, and the interface treats all twenty as equally plausible.
The result is predictable: you finish four, carry sixteen, and end the day
having worked hard and still feeling behind. The app's only feedback is a
growing list of things you didn't do.

The failure isn't willpower, it's the data model. An unbounded list cannot tell
you that you have over-committed, because it has no concept of capacity. Every
to-do app is implicitly claiming your day is infinite.

## 3. Reframing the brief

*Core. **Evidence:** `[ ]` the level-1 Today view — two slots, nothing else, which is the whole argument in one screen.*

The reframe was to make the limit the product rather than a warning.

At level 1 you get **two slots**. Not a suggestion, not a soft target — the
interface will not let you prepare a third. The interesting question stops
being *what could I do today* and becomes *what deserves one of my two slots*.

That inversion drove everything downstream. If the cap is real, it has to be
enforced in the data model, visible in the layout, and impossible to argue
with. And if the cap is real, the app owes the user an escape valve for the
genuinely trivial — hence cantrips, which are free, unlimited, and deliberately
excluded from whether a day counts as complete. The cap only works if it is
never the thing stopping you from watering a plant.

[[What prompted this project in the first place — a personal frustration, a
specific bad week, something you read?]]

## 4. Designing the economy

*Optional [design, product]. **Evidence:** `[ ]` the slot table from the README; `[ ]` the Character sheet showing earned slots as filled pips and next-level slots as hollow ones.*

The mechanics needed to reward the right behaviour, which meant being careful
about what earns points.

**Tiers measure effort, not importance.** A 1st-tier slot is a focused twenty
minutes; a 4th-tier slot is the thing that would make the day matter. Sorting
by importance would have recreated the priority-flag problem where everything
drifts to "high". Sorting by cost is a question people can actually answer.

**Levels grant one slot at a time, slowly.** The XP curve is superlinear, so
early levels land in a couple of days and later ones take weeks. Growing
capacity fast would rebuild the overloaded list the app exists to prevent. A
level-up should pose a single question — what else can I genuinely hold?

**Upcasting** lets a small task be cast from a bigger slot when that's what's
left, earning the bigger slot's XP, because the energy was spent either way.

**An unfinished day carries no penalty** beyond losing the bonus and the
streak. No red badges, no "you missed 3 days". The premise depends on people
still being here in month two.

## 5. Making the limit visible

*Optional [design]. **Evidence:** `[ ]` the three orb states side by side; `[ ]` a full multi-tier day showing the colour escalation from sky to amber.*

A cap you have to read is not a cap. The day is drawn as a column of orbs —
hollow for an empty slot, charged once something is prepared in it, blazing
once it is cast. Tiers are colour-coded in escalating warmth so the shape and
weight of a day is legible before a single word is read.

The empty orb does real work: it is a visible, finite space, so an unfilled
slot reads as *available capacity* rather than as another unfinished task.
This is the one place where a to-do app's usual red-dot grammar is exactly
inverted.

[[Was there a version that didn't work? Anything you tried and threw away?]]

## 6. Two engineering decisions that paid for themselves

*Optional [engineering]. **Evidence:** `[x]` `README.md → How it's built`; `[ ]` the undo case on video — check the last spell, watch the bonus land, uncheck it, watch it leave cleanly.*

**Today's XP is derived, not accumulated.** Experience from finished days is
banked; today's is recomputed from today's state after every change. The
alternative — incrementing a counter on each completion — would have needed a
matching decrement on undo, and every such pair is a drift bug waiting to
happen. Deriving it means unchecking the last spell of the day takes back the
rest bonus exactly as cleanly as checking it granted it, with no reconciliation
logic at all.

**A day is a date key, not a timestamp.** The day boundary is configurable and
defaults to 4am, so finishing something at 1am still spends the previous day's
slot. This matches how people actually experience a late night, and it turns a
whole category of timezone and midnight-rollover bugs into string comparison.

## 7. Saying no on the record

*Optional [product, process]. **Evidence:** `[x]` `docs/DECISIONS.md → Not doing (yet)`; `[ ]` the Deferred rows in the decision log.*

The deferred list is kept in the repo with reasons, not as a backlog anybody
promised to deliver.

- **No accounts, sync, or backend.** It would be more convenient, and it would
  need a server, a privacy policy, and somebody's uptime. For a habit tracker,
  local-only is a feature: nothing to sign up for, nothing to leak.
- **No reminders or notifications.** A notification is an interruption claiming
  to be a priority — the exact thing the app exists to push back on.
- **Rituals repeat daily or not at all.** Recurrence rules are a complexity
  sink, and a habit you only do on Tuesdays is one you're still negotiating.
- **Levels stop at 20.** Past 9/6/4/3 the honest answer is that the app has
  nothing left to give, and inventing prestige tiers rewards the wrong thing.
- **Dark theme only.** The orbs read as *light* because they sit on near-black;
  a light theme isn't a token swap, it's a redesign of the core metaphor.

Writing the reason next to each one is what makes the list useful: it converts
"we never got to it" into a decision that can be revisited on purpose.

## 8. Quality, and what it caught

*Optional [engineering, process]. **Evidence:** `[x]` 62 passing tests, 15 browser checks; `[ ]` terminal capture of `npm test` and `npm run verify` green.*

Correctness is checked at two levels, because the risky parts live in different
places.

The rules engine is pure functions, so unit tests cover it cheaply and
completely — the slot table never shrinking as levels rise, streaks surviving
skipped days, upcasting, save repair. But the three things most likely to break
a PWA are invisible to unit tests: whether the service worker takes control,
whether the app renders with the network off, and whether leaving it overnight
rolls the day over correctly. Those are properties of the built artefact in a
real browser, so `scripts/verify-pwa.mjs` drives the real build in Chromium and
checks all three.

Two things this actually caught:

- **A silent data-loss bug.** The save loader was deliberately forgiving so a
  partial save would still open — which meant importing any valid JSON handed
  back a *fresh game*, erasing the player's history with no warning. Since the
  export is the only backup that exists, that was unrecoverable. Found by
  re-reading the diff adversarially, not by a test.
- **A deploy that could never run.** The Pages workflow triggered on `main`,
  but the repository's first push had created a differently-named default
  branch, so no `main` existed and zero workflow runs ever fired. Pages was
  correctly configured and the site was simply never built.

[[Anything that got through and bit you later?]]

## 9. Shipping it

*Optional [engineering]. **Evidence:** `[ ]` the live site on a phone home screen, installed, showing the generated icon; `[ ]` a green Actions run.*

The app deploys to GitHub Pages from a workflow on push. Two details that
mattered more than expected:

A project Pages site is served from a subdirectory, not the root, so the base
path, the manifest `scope` and `start_url`, and the service worker's scope all
have to agree — if they don't, the app loads but silently refuses to install.
The verification script was made base-aware so the subpath build is checked
exactly as it will be served.

The workflow now triggers on whichever branch the repository reports as its
*default*, rather than a hard-coded name, so it deploys regardless of what that
branch is called and survives a later rename.

The icons are drawn procedurally by a script that encodes the PNGs itself, so
the repo carries no binary source art and no build-time image dependency.
Changing the icon is an edit to a number, not a round trip through a design
tool.

## 10. Working with an AI collaborator

*Optional [process, AI-curious audiences]. **Evidence:** `[ ]` a representative commit message; `[ ]` this file and the decision log as artefacts of the practice.*

The project was built in collaboration with an AI coding agent, which shaped
the process in ways worth naming.

Commit messages were written to carry the *why*, not the *what* — which is why
this case study and the decision log could be backfilled from history at all.
Verification was weighted heavily toward things a model cannot confirm by
reading its own output: a real browser, a real build, a real day rollover.
Several of the most valuable catches came from adversarially re-reading a diff
that already passed its tests.

[[Your own view: what did the collaboration do well, where did you have to
push back, and what would you do differently? This module is worthless without
a first-person opinion — leave it out of a write-up rather than fill it with
generalities.]]

## 11. Outcome and reflection

*Core. **Evidence:** `[ ]` usage over time, if you have it; `[ ]` a screenshot of a real streak rather than a seeded one.*

[[Did it actually change your behaviour? Be concrete — what did you do
differently, and for how long?]]

[[Usage: how many days adventured, what level did you reach, longest streak?
These come straight off the Character sheet.]]

[[Did anyone else use it? What did they say?]]

[[What would you change about the premise now, having lived with it? The most
interesting version of this answer names something the design got wrong.]]

What the project argues, and what I'd defend: **an app that lets you plan an
impossible day is not neutral — it is actively participating in the problem.**
Capacity should be a number the tool knows, enforces, and grows with you.

---

## Log of additions

| Date | Module | Change |
| --- | --- | --- |
| 2026-11-19 | All | Initial draft, backfilled from git history, the README, and the decision log |
