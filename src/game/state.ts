import { dayKey, isYesterday } from './date'
import {
  TIERS,
  castXp,
  levelForXp,
  restBonusXp,
  slotsForLevel,
  totalSlots,
} from './rules'
import type { DayRecord, GameState, Prepared, Settings, SlotTable, Spell, Tier } from './types'

export const STATE_VERSION = 1

/** History beyond this is dropped, so a device that runs for years stays small. */
export const HISTORY_LIMIT = 400

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const DEFAULT_SETTINGS: Settings = { dayStartHour: 4, reduceMotion: false }

export function makeDay(date: string, slots: SlotTable, now = Date.now()): DayRecord {
  return { date, slots, prepared: [], complete: false, xpEarned: 0, startedAt: now }
}

export function makeSpell(partial: Partial<Spell> & { name: string; tier: Tier }): Spell {
  return {
    id: newId(),
    notes: '',
    ritual: false,
    archived: false,
    createdAt: Date.now(),
    timesCast: 0,
    lastCastOn: null,
    ...partial,
  }
}

const STARTER_SPELLS: { name: string; tier: Tier; ritual: boolean; notes: string }[] = [
  { name: 'The one thing that matters today', tier: 1, ritual: false, notes: 'Swap this for something real.' },
  { name: 'Move your body', tier: 1, ritual: true, notes: '' },
  { name: 'Make the bed', tier: 0, ritual: true, notes: '' },
  { name: 'Drink a glass of water', tier: 0, ritual: true, notes: '' },
  { name: 'Tidy one surface', tier: 0, ritual: false, notes: '' },
]

export function initialState(now = Date.now()): GameState {
  const settings = { ...DEFAULT_SETTINGS }
  const spells = STARTER_SPELLS.map(makeSpell)
  const base: GameState = {
    version: STATE_VERSION,
    xpBanked: 0,
    streak: 0,
    bestStreak: 0,
    lastCompleteDate: null,
    daysAdventured: 0,
    spells,
    today: makeDay(dayKey(now, settings.dayStartHour), slotsForLevel(1), now),
    history: [],
    settings,
  }
  return recompute(prepareRituals(base))
}

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

export function totalXp(state: GameState): number {
  return state.xpBanked + state.today.xpEarned
}

export function currentLevel(state: GameState): number {
  return levelForXp(totalXp(state))
}

/** The streak including today, which only counts once today is complete. */
export function currentStreak(state: GameState): number {
  const { lastCompleteDate, streak, today } = state
  const carried =
    lastCompleteDate && isYesterday(lastCompleteDate, today.date) ? streak : 0
  return today.complete ? carried + 1 : carried
}

/** Prepared spells occupying slots of a given tier. */
export function preparedInTier(day: DayRecord, tier: Tier): Prepared[] {
  return day.prepared.filter((p) => p.slotTier === tier)
}

export function cantrips(day: DayRecord): Prepared[] {
  return preparedInTier(day, 0)
}

export function openSlots(day: DayRecord, tier: Tier): number {
  return Math.max(0, day.slots[tier] - preparedInTier(day, tier).length)
}

/** Slots across every tier with nothing prepared in them. */
export function openSlotsTotal(day: DayRecord): number {
  return TIERS.reduce<number>((sum, tier) => sum + openSlots(day, tier), 0)
}

export function slotsSpent(day: DayRecord): number {
  return TIERS.reduce<number>(
    (sum, tier) => sum + preparedInTier(day, tier).filter((p) => p.done).length,
    0,
  )
}

export function slotsTotal(day: DayRecord): number {
  return totalSlots(day.slots)
}

export function isDayComplete(day: DayRecord): boolean {
  return TIERS.every(
    (tier) => preparedInTier(day, tier).filter((p) => p.done).length === day.slots[tier],
  )
}

export function spellById(state: GameState, id: string): Spell | undefined {
  return state.spells.find((s) => s.id === id)
}

/** Spells that can still be dropped into a slot of this tier (upcasting allowed). */
export function eligibleSpells(state: GameState, slotTier: Tier): Spell[] {
  const preparedIds = new Set(state.today.prepared.map((p) => p.spellId))
  return state.spells.filter(
    (s) =>
      !s.archived &&
      !preparedIds.has(s.id) &&
      (slotTier === 0 ? s.tier === 0 : s.tier !== 0 && s.tier <= slotTier),
  )
}

/** Yesterday's unfinished spells, offered first when preparing a new day. */
export function unfinishedYesterday(state: GameState): Set<string> {
  const last = state.history[state.history.length - 1]
  if (!last || !isYesterday(last.date, state.today.date)) return new Set()
  return new Set(last.prepared.filter((p) => !p.done).map((p) => p.spellId))
}

/* ------------------------------------------------------------------ *
 * Core recomputation
 * ------------------------------------------------------------------ */

/**
 * Re-derives today's completion and XP from scratch. Called after every change
 * to today, which keeps undo exact: unchecking the last spell takes back the
 * rest bonus as cleanly as checking it granted it.
 */
export function recompute(state: GameState): GameState {
  const day = state.today
  const complete = isDayComplete(day)
  const castXpTotal = day.prepared
    .filter((p) => p.done)
    .reduce((sum, p) => sum + castXp(p.slotTier), 0)
  const carried =
    state.lastCompleteDate && isYesterday(state.lastCompleteDate, day.date)
      ? state.streak
      : 0
  const bonus = complete ? restBonusXp(carried + 1) : 0
  const today = { ...day, complete, xpEarned: castXpTotal + bonus }
  return { ...state, today }
}

/** Adds every ritual that isn't prepared yet, as far as the slots allow. */
function prepareRituals(state: GameState): GameState {
  let day = state.today
  const alreadyPrepared = new Set(day.prepared.map((p) => p.spellId))
  for (const spell of state.spells) {
    if (!spell.ritual || spell.archived || alreadyPrepared.has(spell.id)) continue
    if (spell.tier !== 0 && openSlots(day, spell.tier) === 0) continue
    day = {
      ...day,
      prepared: [...day.prepared, makePrepared(spell, spell.tier)],
    }
    alreadyPrepared.add(spell.id)
  }
  return { ...state, today: day }
}

function makePrepared(spell: Spell, slotTier: Tier): Prepared {
  return {
    id: newId(),
    spellId: spell.id,
    name: spell.name,
    tier: spell.tier,
    slotTier,
    done: false,
    doneAt: null,
  }
}

/* ------------------------------------------------------------------ *
 * Actions
 * ------------------------------------------------------------------ */

export type Action =
  | { type: 'tick'; now: number }
  | { type: 'addSpell'; name: string; tier: Tier; ritual?: boolean; notes?: string; prepareInto?: Tier }
  | { type: 'updateSpell'; id: string; patch: Partial<Omit<Spell, 'id'>> }
  | { type: 'deleteSpell'; id: string }
  | { type: 'prepare'; spellId: string; slotTier: Tier }
  | { type: 'unprepare'; preparedId: string }
  | { type: 'toggleDone'; preparedId: string; now?: number }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'replaceState'; state: GameState }

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'tick':
      return rollOverIfNeeded(state, action.now)

    case 'addSpell': {
      const spell = makeSpell({
        name: action.name.trim(),
        tier: action.tier,
        ritual: action.ritual ?? false,
        notes: action.notes ?? '',
      })
      if (!spell.name) return state
      const withSpell = { ...state, spells: [...state.spells, spell] }
      if (action.prepareInto === undefined) return withSpell
      return reducer(withSpell, {
        type: 'prepare',
        spellId: spell.id,
        slotTier: action.prepareInto,
      })
    }

    case 'updateSpell': {
      const spells = state.spells.map((s) =>
        s.id === action.id ? { ...s, ...action.patch } : s,
      )
      let next = { ...state, spells }
      // Keep today's card in step with a rename, and drop it if it was archived.
      const patch = action.patch
      const prepared = next.today.prepared
        .filter((p) => p.spellId !== action.id || !patch.archived)
        .map((p) =>
          p.spellId === action.id && patch.name !== undefined
            ? { ...p, name: patch.name }
            : p,
        )
      next = { ...next, today: { ...next.today, prepared } }
      return recompute(next)
    }

    case 'deleteSpell': {
      const spells = state.spells.filter((s) => s.id !== action.id)
      const prepared = state.today.prepared.filter((p) => p.spellId !== action.id)
      return recompute({ ...state, spells, today: { ...state.today, prepared } })
    }

    case 'prepare': {
      const spell = spellById(state, action.spellId)
      if (!spell || spell.archived) return state
      if (state.today.prepared.some((p) => p.spellId === spell.id)) return state
      const slotTier = action.slotTier
      if (slotTier === 0 && spell.tier !== 0) return state
      if (slotTier !== 0 && (spell.tier === 0 || spell.tier > slotTier)) return state
      if (slotTier !== 0 && openSlots(state.today, slotTier) === 0) return state
      const prepared = [...state.today.prepared, makePrepared(spell, slotTier)]
      return recompute({ ...state, today: { ...state.today, prepared } })
    }

    case 'unprepare': {
      const prepared = state.today.prepared.filter((p) => p.id !== action.preparedId)
      return recompute({ ...state, today: { ...state.today, prepared } })
    }

    case 'toggleDone': {
      const now = action.now ?? Date.now()
      const target = state.today.prepared.find((p) => p.id === action.preparedId)
      if (!target) return state
      const done = !target.done
      const prepared = state.today.prepared.map((p) =>
        p.id === action.preparedId ? { ...p, done, doneAt: done ? now : null } : p,
      )
      const spells = state.spells.map((s) =>
        s.id === target.spellId
          ? {
              ...s,
              timesCast: Math.max(0, s.timesCast + (done ? 1 : -1)),
              lastCastOn: done ? state.today.date : s.lastCastOn,
            }
          : s,
      )
      return recompute({ ...state, spells, today: { ...state.today, prepared } })
    }

    case 'updateSettings': {
      const settings = { ...state.settings, ...action.patch }
      return { ...state, settings }
    }

    case 'replaceState':
      return recompute(action.state)

    default:
      return state
  }
}

/**
 * A long rest. Banks the finished day, advances the streak, and lays out fresh
 * slots for the level the character has actually reached.
 */
export function rollOverIfNeeded(state: GameState, now: number): GameState {
  const today = dayKey(now, state.settings.dayStartHour)
  if (today === state.today.date) return state

  const finished = recompute(state).today
  const touched = finished.prepared.length > 0
  let next: GameState = { ...state, xpBanked: state.xpBanked + finished.xpEarned }

  if (touched) {
    const history = [...state.history, finished].slice(-HISTORY_LIMIT)
    next = { ...next, history, daysAdventured: state.daysAdventured + 1 }
  }

  if (finished.complete) {
    const carried =
      state.lastCompleteDate && isYesterday(state.lastCompleteDate, finished.date)
        ? state.streak
        : 0
    const streak = carried + 1
    next = {
      ...next,
      streak,
      lastCompleteDate: finished.date,
      bestStreak: Math.max(state.bestStreak, streak),
    }
  }

  const level = levelForXp(next.xpBanked)
  next = { ...next, today: makeDay(today, slotsForLevel(level), now) }
  return recompute(prepareRituals(next))
}
