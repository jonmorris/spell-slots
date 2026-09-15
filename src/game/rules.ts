import type { SlotTable, Tier } from './types'

export const MAX_LEVEL = 20

/**
 * Slots granted at each character level, indexed [level][tier].
 * Growth is deliberately slow: the whole point is to add one commitment at a
 * time rather than to unlock a to-do list you can't finish.
 */
const SLOTS_BY_LEVEL: SlotTable[] = [
  [0, 0, 0, 0, 0], // level 0 placeholder
  [0, 2, 0, 0, 0],
  [0, 3, 0, 0, 0],
  [0, 3, 1, 0, 0],
  [0, 4, 1, 0, 0],
  [0, 4, 2, 0, 0],
  [0, 4, 2, 1, 0],
  [0, 5, 2, 1, 0],
  [0, 5, 3, 1, 0],
  [0, 5, 3, 2, 0],
  [0, 6, 3, 2, 0],
  [0, 6, 3, 2, 1],
  [0, 6, 4, 2, 1],
  [0, 6, 4, 3, 1],
  [0, 7, 4, 3, 1],
  [0, 7, 4, 3, 2],
  [0, 7, 5, 3, 2],
  [0, 8, 5, 3, 2],
  [0, 8, 5, 4, 2],
  [0, 8, 5, 4, 3],
  [0, 9, 6, 4, 3],
]

export const TIERS: Tier[] = [1, 2, 3, 4]

export const TIER_INFO: Record<
  Tier,
  { name: string; short: string; blurb: string; hint: string }
> = {
  0: {
    name: 'Cantrip',
    short: 'Cantrip',
    blurb: 'Free, unlimited, low effort',
    hint: 'A few minutes. Water the plants, reply to that text, ten push-ups.',
  },
  1: {
    name: 'First-tier spell',
    short: '1st',
    blurb: 'A small, focused push',
    hint: 'Fifteen to thirty minutes of real attention.',
  },
  2: {
    name: 'Second-tier spell',
    short: '2nd',
    blurb: 'A solid block of work',
    hint: 'About an hour. Enough to finish something small or start something real.',
  },
  3: {
    name: 'Third-tier spell',
    short: '3rd',
    blurb: 'Deep work',
    hint: 'Two hours or more, uninterrupted. Costly. Choose it on purpose.',
  },
  4: {
    name: 'Fourth-tier spell',
    short: '4th',
    blurb: "The day's centrepiece",
    hint: 'The one thing that would make today matter. Nothing else competes with it.',
  },
}

/** XP for casting a spell, by the tier of the slot it was cast from. */
const XP_BY_SLOT_TIER: Record<Tier, number> = { 0: 5, 1: 15, 2: 35, 3: 60, 4: 100 }

export const PERFECT_DAY_XP = 50
/** Each day of streak adds this much to the rest bonus, up to STREAK_BONUS_CAP days. */
export const STREAK_BONUS_XP = 10
export const STREAK_BONUS_CAP = 10

export function slotsForLevel(level: number): SlotTable {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)))
  return [...SLOTS_BY_LEVEL[clamped]] as SlotTable
}

/** Total XP required to reach a given level. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  const n = Math.min(level, MAX_LEVEL) - 1
  return 75 * n * n + 75 * n
}

export function levelForXp(xp: number): number {
  let level = 1
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++
  return level
}

/** Progress through the current level, for the XP bar. */
export function levelProgress(xp: number): {
  level: number
  into: number
  needed: number
  fraction: number
  atMax: boolean
} {
  const level = levelForXp(xp)
  const atMax = level >= MAX_LEVEL
  if (atMax) return { level, into: 0, needed: 0, fraction: 1, atMax }
  const floor = xpForLevel(level)
  const ceiling = xpForLevel(level + 1)
  const into = xp - floor
  const needed = ceiling - floor
  return { level, into, needed, fraction: needed === 0 ? 1 : into / needed, atMax }
}

export function castXp(slotTier: Tier): number {
  return XP_BY_SLOT_TIER[slotTier]
}

/** The rest bonus for spending every slot, given the streak the day extends. */
export function restBonusXp(streakAfterToday: number): number {
  const streakDays = Math.min(Math.max(streakAfterToday - 1, 0), STREAK_BONUS_CAP)
  return PERFECT_DAY_XP + streakDays * STREAK_BONUS_XP
}

/** Total slots across every tier. */
export function totalSlots(slots: SlotTable): number {
  return TIERS.reduce<number>((sum, tier) => sum + slots[tier], 0)
}

/** Tiers newly unlocked, and slots newly gained, when crossing from one level to the next. */
export function levelUpGains(from: number, to: number): { tier: Tier; gained: number }[] {
  const before = slotsForLevel(from)
  const after = slotsForLevel(to)
  return TIERS.map((tier) => ({ tier, gained: after[tier] - before[tier] })).filter(
    (gain) => gain.gained > 0,
  )
}

/** Flavourful titles, so levelling reads as a story and not just a number. */
const TITLES: { at: number; title: string }[] = [
  { at: 1, title: 'Apprentice' },
  { at: 3, title: 'Initiate' },
  { at: 5, title: 'Adept' },
  { at: 7, title: 'Conjurer' },
  { at: 9, title: 'Evoker' },
  { at: 11, title: 'Magus' },
  { at: 13, title: 'Arcanist' },
  { at: 15, title: 'Archmage' },
  { at: 18, title: 'Elder Archmage' },
  { at: 20, title: 'Keeper of the Weave' },
]

export function titleForLevel(level: number): string {
  let title = TITLES[0].title
  for (const entry of TITLES) if (level >= entry.at) title = entry.title
  return title
}
