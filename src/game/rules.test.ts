import { describe, expect, it } from 'vitest'
import { levelForXp, levelProgress, levelUpGains, restBonusXp, slotsForLevel, totalSlots, xpForLevel } from './rules'
import { dayKey, daysBetween, msUntilNextDay } from './date'
import {
  currentStreak,
  initialState,
  isDayComplete,
  openSlots,
  reducer,
  rollOverIfNeeded,
  totalXp,
} from './state'
import { hydrate } from './storage'
import type { GameState, Tier } from './types'

const AT = new Date(2026, 0, 10, 9, 0, 0).getTime()

/** A clean slate with no starter spells, so tests control every slot. */
function bare(now = AT): GameState {
  const s = initialState(now)
  return { ...s, spells: [], today: { ...s.today, prepared: [] } }
}

function addAndPrepare(state: GameState, name: string, tier: Tier, slotTier = tier): GameState {
  return reducer(state, { type: 'addSpell', name, tier, prepareInto: slotTier })
}

/** Prepares a spell into every open slot, whatever the current level grants. */
function fillDay(state: GameState, tag: string): GameState {
  let s = state
  for (const tier of [1, 2, 3, 4] as Tier[]) {
    let n = 0
    while (openSlots(s.today, tier) > 0) s = addAndPrepare(s, `${tag}-t${tier}-${n++}`, tier)
  }
  return s
}

function castAll(state: GameState): GameState {
  return state.today.prepared.reduce(
    (s, p) => reducer(s, { type: 'toggleDone', preparedId: p.id, now: AT }),
    state,
  )
}

describe('levels and slots', () => {
  it('starts at level 1 with two first-tier slots and nothing else', () => {
    expect(levelForXp(0)).toBe(1)
    expect(slotsForLevel(1)).toEqual([0, 2, 0, 0, 0])
    expect(totalSlots(slotsForLevel(1))).toBe(2)
  })

  it('never shrinks the slot table as levels rise', () => {
    for (let level = 2; level <= 20; level++) {
      const prev = slotsForLevel(level - 1)
      const next = slotsForLevel(level)
      for (const tier of [1, 2, 3, 4] as Tier[]) {
        expect(next[tier]).toBeGreaterThanOrEqual(prev[tier])
      }
      expect(totalSlots(next)).toBeGreaterThan(totalSlots(prev))
    }
  })

  it('grants at least one new slot at every level up', () => {
    for (let level = 2; level <= 20; level++) {
      expect(levelUpGains(level - 1, level).length).toBeGreaterThan(0)
    }
  })

  it('clamps out-of-range levels instead of returning undefined', () => {
    expect(slotsForLevel(0)).toEqual(slotsForLevel(1))
    expect(slotsForLevel(99)).toEqual(slotsForLevel(20))
  })

  it('maps XP back to the level it was earned for', () => {
    for (let level = 1; level <= 20; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level)
      if (level > 1) expect(levelForXp(xpForLevel(level) - 1)).toBe(level - 1)
    }
  })

  it('reports level progress as a fraction, and caps at 20', () => {
    const early = levelProgress(75)
    expect(early.level).toBe(1)
    expect(early.fraction).toBeCloseTo(0.5)
    const maxed = levelProgress(xpForLevel(20) + 9999)
    expect(maxed.atMax).toBe(true)
    expect(maxed.fraction).toBe(1)
  })
})

describe('rest bonus', () => {
  it('pays a flat bonus on the first complete day and grows with the streak', () => {
    expect(restBonusXp(1)).toBe(50)
    expect(restBonusXp(2)).toBe(60)
    expect(restBonusXp(11)).toBe(150)
  })

  it('caps the streak bonus so it cannot run away', () => {
    expect(restBonusXp(50)).toBe(restBonusXp(11))
  })
})

describe('day boundaries', () => {
  it('counts the small hours as the previous day', () => {
    const lateNight = new Date(2026, 0, 11, 1, 30).getTime()
    expect(dayKey(lateNight, 4)).toBe('2026-01-10')
    expect(dayKey(lateNight, 0)).toBe('2026-01-11')
  })

  it('schedules the next rollover in the future', () => {
    const ms = msUntilNextDay(AT, 4)
    expect(ms).toBeGreaterThan(0)
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000)
  })

  it('measures whole days between keys', () => {
    expect(daysBetween('2026-01-10', '2026-01-11')).toBe(1)
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1)
  })
})

describe('preparing spells', () => {
  it('refuses to prepare more spells than there are slots', () => {
    let s = bare()
    s = addAndPrepare(s, 'a', 1)
    s = addAndPrepare(s, 'b', 1)
    expect(openSlots(s.today, 1)).toBe(0)
    s = addAndPrepare(s, 'c', 1)
    expect(s.today.prepared).toHaveLength(2)
  })

  it('lets cantrips in without limit and without touching a slot', () => {
    let s = bare()
    for (let i = 0; i < 12; i++) s = addAndPrepare(s, `cantrip ${i}`, 0, 0)
    expect(s.today.prepared).toHaveLength(12)
    expect(openSlots(s.today, 1)).toBe(2)
  })

  it('allows upcasting a small spell into a bigger slot, but never the reverse', () => {
    let s = bare()
    s = { ...s, today: { ...s.today, slots: [0, 1, 1, 0, 0] } }
    s = addAndPrepare(s, 'small', 1, 2)
    expect(s.today.prepared[0].slotTier).toBe(2)
    s = addAndPrepare(s, 'big', 2, 1)
    expect(s.today.prepared).toHaveLength(1)
  })

  it('keeps a cantrip out of a spell slot and a spell out of the cantrip list', () => {
    let s = bare()
    s = addAndPrepare(s, 'tiny', 0, 1)
    s = addAndPrepare(s, 'large', 1, 0)
    expect(s.today.prepared).toHaveLength(0)
  })

  it('will not prepare the same spell twice in one day', () => {
    let s = bare()
    s = addAndPrepare(s, 'once', 1)
    const id = s.today.prepared[0].spellId
    s = reducer(s, { type: 'prepare', spellId: id, slotTier: 1 })
    expect(s.today.prepared).toHaveLength(1)
  })
})

describe('casting and XP', () => {
  it('awards XP for the slot used, not the spell tier, when upcasting', () => {
    let s = bare()
    s = { ...s, today: { ...s.today, slots: [0, 0, 1, 0, 0] } }
    s = addAndPrepare(s, 'small in a big slot', 1, 2)
    s = castAll(s)
    // 35 for the second-tier slot, plus a 50 rest bonus for spending every slot.
    expect(totalXp(s)).toBe(85)
  })

  it('takes the rest bonus back if you undo the final cast', () => {
    let s = bare()
    s = addAndPrepare(s, 'a', 1)
    s = addAndPrepare(s, 'b', 1)
    s = castAll(s)
    expect(s.today.complete).toBe(true)
    const withBonus = totalXp(s)
    s = reducer(s, { type: 'toggleDone', preparedId: s.today.prepared[1].id })
    expect(s.today.complete).toBe(false)
    expect(totalXp(s)).toBe(withBonus - 15 - 50)
  })

  it('does not count a day complete while a slot sits empty', () => {
    let s = bare()
    s = addAndPrepare(s, 'only one', 1)
    s = castAll(s)
    expect(isDayComplete(s.today)).toBe(false)
  })

  it('ignores cantrips when deciding whether the day is complete', () => {
    let s = bare()
    s = { ...s, today: { ...s.today, slots: [0, 1, 0, 0, 0] } }
    s = addAndPrepare(s, 'the real one', 1)
    s = addAndPrepare(s, 'a cantrip', 0, 0)
    s = reducer(s, { type: 'toggleDone', preparedId: s.today.prepared[0].id })
    expect(s.today.complete).toBe(true)
  })

  it('counts a cast on the spell itself, and uncounts an undo', () => {
    let s = bare()
    s = addAndPrepare(s, 'tracked', 1)
    s = reducer(s, { type: 'toggleDone', preparedId: s.today.prepared[0].id })
    expect(s.spells[0].timesCast).toBe(1)
    s = reducer(s, { type: 'toggleDone', preparedId: s.today.prepared[0].id })
    expect(s.spells[0].timesCast).toBe(0)
  })
})

describe('the long rest', () => {
  const nextDay = (state: GameState, days = 1) =>
    rollOverIfNeeded(state, AT + days * 24 * 60 * 60 * 1000)

  it('banks the day, files it in history, and lays out fresh slots', () => {
    let s = bare()
    s = addAndPrepare(s, 'a', 1)
    s = addAndPrepare(s, 'b', 1)
    s = castAll(s)
    const earned = totalXp(s)
    s = nextDay(s)
    expect(s.history).toHaveLength(1)
    expect(s.xpBanked).toBe(earned)
    expect(s.today.prepared).toHaveLength(0)
    expect(s.daysAdventured).toBe(1)
  })

  it('does not file an untouched day, so skipping a day leaves no debris', () => {
    const s = nextDay(bare())
    expect(s.history).toHaveLength(0)
    expect(s.daysAdventured).toBe(0)
  })

  it('extends the streak over consecutive complete days', () => {
    let s = bare()
    for (let day = 0; day < 3; day++) {
      s = fillDay(s, `d${day}`)
      s = castAll(s)
      expect(currentStreak(s)).toBe(day + 1)
      s = rollOverIfNeeded(s, AT + (day + 1) * 24 * 60 * 60 * 1000)
    }
    expect(s.streak).toBe(3)
    expect(s.bestStreak).toBe(3)
  })

  it('drops the streak after a missed day but keeps the best on record', () => {
    let s = bare()
    s = addAndPrepare(s, 'a', 1)
    s = addAndPrepare(s, 'b', 1)
    s = castAll(s)
    s = nextDay(s, 1)
    expect(currentStreak(s)).toBe(1) // yesterday counts until today resolves
    s = nextDay(s, 3) // two days skipped
    expect(currentStreak(s)).toBe(0)
    expect(s.bestStreak).toBe(1)
  })

  it('opens the new day with the slots the character has earned', () => {
    let s = bare()
    s = { ...s, xpBanked: xpForLevel(5) }
    s = nextDay(s)
    expect(s.today.slots).toEqual(slotsForLevel(5))
  })

  it('re-prepares rituals each morning, up to the slots available', () => {
    let s = bare()
    s = reducer(s, { type: 'addSpell', name: 'stretch', tier: 1, ritual: true })
    s = reducer(s, { type: 'addSpell', name: 'water', tier: 0, ritual: true })
    s = nextDay(s)
    expect(s.today.prepared.map((p) => p.name).sort()).toEqual(['stretch', 'water'])
  })
})

describe('editing the spellbook', () => {
  it('renames today\'s card along with the spell', () => {
    let s = bare()
    s = addAndPrepare(s, 'old name', 1)
    s = reducer(s, { type: 'updateSpell', id: s.spells[0].id, patch: { name: 'new name' } })
    expect(s.today.prepared[0].name).toBe('new name')
  })

  it('pulls an archived spell out of today', () => {
    let s = bare()
    s = addAndPrepare(s, 'gone', 1)
    s = reducer(s, { type: 'updateSpell', id: s.spells[0].id, patch: { archived: true } })
    expect(s.today.prepared).toHaveLength(0)
  })

  it('rejects a blank name', () => {
    const s = reducer(bare(), { type: 'addSpell', name: '   ', tier: 1 })
    expect(s.spells).toHaveLength(0)
  })
})

describe('storage', () => {
  it('falls back to a fresh game for junk input', () => {
    expect(hydrate(null, AT).today.date).toBe(dayKey(AT, 4))
    expect(hydrate({ nonsense: true }, AT).spells.length).toBeGreaterThan(0)
  })

  it('round-trips a real save', () => {
    let s = bare()
    s = addAndPrepare(s, 'keep me', 1)
    s = castAll(s)
    const restored = hydrate(JSON.parse(JSON.stringify(s)), AT)
    expect(restored.today.prepared[0].name).toBe('keep me')
    expect(totalXp(restored)).toBe(totalXp(s))
  })

  it('repairs a save that is missing fields', () => {
    const s = bare()
    const damaged = { ...s, xpBanked: undefined, history: undefined, settings: undefined }
    const repaired = hydrate(damaged, AT)
    expect(repaired.xpBanked).toBe(0)
    expect(repaired.history).toEqual([])
    expect(repaired.settings.dayStartHour).toBe(4)
  })
})
