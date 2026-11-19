# Decisions

The reasoning behind choices that aren't explained anywhere else.

Most of this project's "why" already lives somewhere readable: the premise in
`README.md → The idea`, the progression in `README.md → Levelling`, the two
load-bearing engineering choices in `README.md → How it's built`, and a lot of
detail in the commit messages. This file is for the rest — the trade-offs that
were made deliberately but had nowhere to be written down, and the things
deliberately *not* built.

`docs/DECISION-LOG.md` indexes these. It is the table of contents; this is one
of the places the reasoning lives.

## Not doing (yet)

These were considered and set aside on purpose. They are not a backlog
anybody has committed to.

**No accounts, sync, or backend.** The app would be more convenient with your
history on every device. It would also need a server, a privacy policy, and
somebody's uptime. For a habit tracker whose whole value is opening it every
morning, local-only is a feature: nothing to sign up for, nothing to leak,
works on a plane. Export/import covers moving devices. Revisit only if people
actually ask to use it on two devices.

**No reminders or notifications.** A notification is an interruption that
claims to be a priority, which is exactly the thing this app exists to push
back on. If it is ever added, it should be one gentle nudge at a time the
person chose, not a streak-protection alarm.

**Rituals repeat daily only.** No weekday scheduling, no "every other day",
no cron. See *Rituals are a flag, not a scheduler* below.

**Levels stop at 20.** The slot table tops out at 9/6/4/3, which is already
more than anyone should attempt in a day. Past that the honest answer is that
the app has nothing left to give you, and inventing prestige tiers would be
rewarding the wrong thing.

**Dark theme only.** See *Dark only* below.

**No reordering or drag-and-drop.** A slot is a slot; which order you cast in
is yours to decide, not the app's to model.

## The shape of the level curve

The thresholds are `75n² + 75n` (n = level − 1), which is superlinear on
purpose. Early levels land every two or three days, so a new user feels the
first slot arrive while they still remember installing the thing. Later levels
take weeks, because by then each new slot is a real daily commitment and
handing them out quickly would recreate the overloaded to-do list the app is
supposed to prevent. Reaching 20 is meant to take months of consistent use.

The slot table grows by **one slot per level**, never two. A level up should
be a single question — "what else can I genuinely hold?" — not a shopping trip.

## Rituals are a flag, not a scheduler

A ritual is a boolean on a spell meaning "prepare this every morning". The
obvious richer design is a recurrence rule: weekdays, every third day, twice a
week. That was rejected. Recurrence rules are a notorious source of complexity
(timezones, skipped days, catch-up semantics), and the failure mode is worse
than the gap: a habit you only do on Tuesdays is a habit you are still
negotiating with. Daily or not at all is the opinionated answer, and it keeps
the long rest trivial to reason about.

## Dark only

The palette is a single dark theme with no light variant and no toggle. The
orbs carry the core metaphor — hollow, charged, blazing — and they read as
*light* because they sit on near-black. On a white background a glowing orb is
just a coloured circle, and the whole visual language goes flat. A light theme
is not a CSS variable swap here; it would be a redesign of the one thing that
makes the app feel like what it is.

## History is capped

`HISTORY_LIMIT` keeps the last 400 day records and drops the rest at the long
rest. Every save is serialised to `localStorage` on every change, so unbounded
history would mean an ever-growing write on every tap. 400 days is a bit over a
year, which is far past the point where an individual day matters, and the
aggregate stats (streaks, best, days adventured) are counters that survive the
trim.

## Why a browser check as well as unit tests

The rules engine is pure functions, so unit tests cover it completely and
cheaply. But three of the things most likely to break are invisible to them:
whether the service worker actually takes control, whether the app renders with
the network off, and whether leaving it overnight rolls the day over correctly.
Those are properties of the *built* artefact in a real browser, not of the
reducer. `scripts/verify-pwa.mjs` drives the real build in Chromium so a
regression in any of them fails loudly instead of silently shipping a PWA that
won't install.

It is a separate command from `npm test` on purpose: it needs a build first,
so making it part of the default test run would make the fast feedback loop
slow and order-dependent.

## Generated icons

`scripts/gen-icons.mjs` draws the icons procedurally and encodes the PNGs with
a small hand-written encoder, rather than committing exported art or pulling in
an image library. Icons are a handful of circles and a gradient — well within
what a short script can draw — and this keeps the repo free of both binary
source files that can't be diffed and a dependency that exists only at build
time. The tuning (orb size, spacing, bloom) is readable as numbers in the
script, so changing the icon is an edit, not a round trip through a design
tool.

## Voice

The app never scolds. An unfinished day costs you the rest bonus and the
streak; it does not get a red badge, a guilt message, or a "you missed 3 days"
counter. Completing a day says *"Anything more is a gift, not a duty."* The
cost of the harsher version is that people delete the app in week two, and the
whole premise — build capacity gradually — depends on them still being here in
month two.

Effort labels say what the work feels like ("an hour", "deep") rather than what
it costs the system ("2 slots"), because the player is budgeting attention,
not currency.
