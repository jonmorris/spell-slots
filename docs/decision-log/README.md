# Pending decision-log entries

One file per decision, each holding exactly one row for the table in
`../DECISION-LOG.md`. Separate files so that parallel branches never conflict
on the table's last line.

Name a file `YYYY-MM-DD-short-name.md` (lowercase, hyphenated) and put a single
row in it:

```
| 2026-11-19 | Process | Say the decision, not the change | docs/DECISIONS.md → Voice |
```

Print and validate what is waiting:

```sh
npm run decision-log
```

Fold them into the table and delete the files — on main, in a commit of its
own:

```sh
npm run decision-log -- --fold
```

See `../DECISION-LOG.md → How to keep this file` for the rules, including the
list of valid Kinds.
