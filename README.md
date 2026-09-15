# Spell Slots

A priority tracker built on a hard limit. Your day grants a finite number of
spell slots, and no amount of enthusiasm adds more. Put the things that matter
into them, spend them all, rest, and the slots come back tomorrow.

It is an offline-first PWA. Everything lives on your device; there is no
account, no server, and nothing to sign up for.

## The idea

Most to-do apps let you write down twenty things and then feel bad about
nineteen of them. This one won't let you. At level 1 you get **two slots**. That
is the entire day. The interesting question stops being *what could I do* and
becomes *what deserves a slot*.

- **Spell slots** are for the things that cost real energy. They are capped,
  and they refill each morning on a long rest.
- **Cantrips** are free and unlimited — water the plants, reply to that text.
  They never compete with the things that matter, so spend them freely.
- **Rituals** are spells you prepare automatically every morning: the habits
  you are trying to make automatic.

Aim to spend every slot. A day with every slot spent is **complete**, pays a
rest bonus, and extends your streak. There is no penalty for a day you don't
finish — you just don't get the bonus.

## Levelling

Casting spells and completing days earns XP, and XP earns levels. A level does
one thing: it gives you **more slots**. Capacity is something you grow into by
finishing the days you already have, rather than something you assume on a
Monday morning and abandon by Thursday.

| Level | 1st | 2nd | 3rd | 4th |
| ----- | --- | --- | --- | --- |
| 1     | 2   |     |     |     |
| 3     | 3   | 1   |     |     |
| 6     | 4   | 2   | 1   |     |
| 11    | 6   | 3   | 2   | 1   |
| 20    | 9   | 6   | 4   | 3   |

Tiers are about effort, not importance: a 1st-tier slot is a focused
twenty minutes, a 4th-tier slot is the thing that would make the day matter.
A small spell can be **upcast** into a bigger slot when that's all you have
left — you spent the energy, so you get the bigger slot's XP.

## Running it

```sh
npm install
npm run dev       # development server
npm test          # the rules engine, 33 tests
npm run build     # typecheck and build to dist/
npm run verify    # drives the built app in a real browser (see below)
npm run icons     # regenerate the app icons
```

`npm run verify` builds nothing itself — run `npm run build` first. It starts a
preview server and uses Playwright to check the things unit tests can't: that
the service worker takes control, that the app renders with the network
switched off, and that leaving it for two days rolls the day over correctly.

## Deploying

`.github/workflows/deploy.yml` publishes to GitHub Pages on every push to
`main`. Enable it once under **Settings → Pages → Source → GitHub Actions**.
The workflow sets `BASE_PATH` to the repository name, since a project Pages
site is served from a subdirectory and the service worker scope has to match.

Anywhere that serves static files over HTTPS works just as well — build with
`npm run build` and upload `dist/`. HTTPS is required: browsers will not
install a PWA or register a service worker without it.

## How it's built

No backend, no state library, no UI framework beyond React itself.

```
src/game/      the rules engine — pure functions and a reducer, no React
  rules.ts     slot table, XP curve, levels, tiers
  state.ts     the reducer, selectors, and the long rest
  date.ts      day keys, honouring a configurable day-start hour
  storage.ts   localStorage, with repair for partial or damaged saves
src/components/ the views
scripts/       icon generation and the browser verification run
```

Two decisions are worth knowing about:

**Today's XP is derived, not accumulated.** `xpBanked` holds XP from finished
days; today's is recomputed from scratch after every change. Unchecking the
last spell of the day takes back the rest bonus exactly as cleanly as checking
it granted it, with no drift.

**A day is a key, not a timestamp.** `dayStartHour` (4am by default) means
finishing something at 1am still spends the previous day's slot, which is how
people actually experience a late night.

## Your data

Everything is in `localStorage` on the device. Nothing is uploaded. The
character sheet has **Export backup** and **Import backup** — that is the only
way to move your history to another device, and the only backup that exists, so
clearing site data really does erase it.
