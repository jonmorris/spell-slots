# Spell Slots

A priority tracker that gives each day a finite pool of spell slots. See
`README.md` for the premise, the mechanics, and how to run and deploy it.

## Running records

`docs/DECISION-LOG.md` and `docs/CASE-STUDY.md` are repo-only indexes over the
other docs. They are never built or shipped, and they are kept *as the work
happens* — backfilling them later loses exactly the reasoning that makes them
worth having.

**When a change makes a decision, or is worth telling, update them in the same
commit as the change itself.**

- **A decision** — anything a future reader might otherwise undo by accident —
  gets an entry file in `docs/decision-log/`, named
  `YYYY-MM-DD-short-name.md` and holding exactly one table row.
  **Always a new file, never an edit to the table in `DECISION-LOG.md`.**
  Separate files never conflict between branches; appended rows always do.
  Fold them into the table with `npm run decision-log -- --fold`, on the
  default branch, in a commit of its own.
- **The why** goes in a document, not only in the entry: `README.md` for
  anything a user would want to know, `docs/DECISIONS.md` for trade-offs and
  the deferred list. The log's Ref column points at it. If the why isn't
  written anywhere, write it first.
- **Worth telling** means a module in `docs/CASE-STUDY.md` — add or amend one,
  and add a row to its *Log of additions*. Leave `[[placeholders]]` for
  anything about role, intent, metrics or reflection: those are the owner's to
  fill in and must never be invented.

`npm run decision-log` validates and prints what is pending. `npm test` fails
on a malformed entry, so a bad row cannot reach the table.

Kinds are `Product`, `Design`, `Copy`, `Engineering`, `Process`, `Deferred`,
`Reversed`, defined in `scripts/decision-log/entries.mjs`. A reversed decision
gets a new `Reversed` row; the old row stays.

## Conventions

- `src/game/` is pure logic with no React — keep it that way, and test it
  there rather than through the UI.
- `npm test` is the fast loop. `npm run verify` needs `npm run build` first and
  drives the real build in Chromium; run it before anything touching the
  service worker, the manifest, or the day rollover.
- Don't hand-edit `public/icons/` — regenerate with `npm run icons`.
