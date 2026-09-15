import { DEFAULT_SETTINGS, STATE_VERSION, initialState, newId, recompute } from './state'
import { slotsForLevel } from './rules'
import type { GameState, Tier } from './types'

export const STORAGE_KEY = 'spell-slots/v1'

/** Whether a parsed object is plausibly one of our saves at all. */
export function looksLikeSave(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false
  const data = raw as Partial<GameState>
  return (
    Array.isArray(data.spells) &&
    typeof data.today === 'object' &&
    data.today !== null &&
    typeof data.today.date === 'string'
  )
}

const TIERS_VALID = new Set([0, 1, 2, 3, 4])

function asTier(value: unknown): Tier {
  return (TIERS_VALID.has(value as number) ? value : 1) as Tier
}

/**
 * Coerces whatever came out of storage (or an import file) into a usable state.
 * Anything missing falls back to a default rather than throwing, so a partial
 * or older save still opens.
 */
export function hydrate(raw: unknown, now = Date.now()): GameState {
  const fresh = initialState(now)
  if (!raw || typeof raw !== 'object') return fresh
  const data = raw as Partial<GameState>
  if (!data.today || !Array.isArray(data.spells)) return fresh

  const settings = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) }
  const state: GameState = {
    version: STATE_VERSION,
    xpBanked: num(data.xpBanked, 0),
    streak: num(data.streak, 0),
    bestStreak: num(data.bestStreak, 0),
    lastCompleteDate: typeof data.lastCompleteDate === 'string' ? data.lastCompleteDate : null,
    daysAdventured: num(data.daysAdventured, 0),
    spells: data.spells.map((s) => ({
      ...s,
      // An id and a valid tier are load-bearing: React keys and slot maths
      // both depend on them, and a hand-edited export might be missing either.
      id: s.id ?? newId(),
      name: String(s.name ?? 'Unnamed spell'),
      tier: asTier(s.tier),
      notes: s.notes ?? '',
      ritual: Boolean(s.ritual),
      archived: Boolean(s.archived),
      timesCast: num(s.timesCast, 0),
      lastCastOn: s.lastCastOn ?? null,
    })),
    today: {
      ...data.today,
      slots: data.today.slots ?? slotsForLevel(1),
      prepared: Array.isArray(data.today.prepared) ? data.today.prepared : [],
    },
    history: Array.isArray(data.history) ? data.history : [],
    settings,
  }
  return recompute(state)
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function load(now = Date.now()): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState(now)
    return hydrate(JSON.parse(raw), now)
  } catch {
    return initialState(now)
  }
}

export function save(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private-browsing or a full quota. The session still works in memory.
  }
}

export function exportFile(state: GameState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `spell-slots-${state.today.date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importFile(file: File): Promise<GameState> {
  const parsed = JSON.parse(await file.text())
  // Without this, importing any valid JSON would hand back a fresh game and
  // quietly wipe whatever the player already had.
  if (!looksLikeSave(parsed)) throw new Error('Not a Spell Slots backup')
  return hydrate(parsed)
}
