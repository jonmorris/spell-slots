/** Slot tiers. 0 is the cantrip tier: free, unlimited, never consumes a slot. */
export type Tier = 0 | 1 | 2 | 3 | 4

/** Counts of available slots, indexed by tier. Index 0 is unused (cantrips are free). */
export type SlotTable = [number, number, number, number, number]

/** A thing you might do. Lives in the spellbook until you prepare it for a day. */
export interface Spell {
  id: string
  name: string
  notes: string
  tier: Tier
  /** Rituals are re-prepared automatically every morning. */
  ritual: boolean
  archived: boolean
  createdAt: number
  timesCast: number
  lastCastOn: string | null
}

/** A spell prepared into one of today's slots. */
export interface Prepared {
  id: string
  spellId: string
  /** Snapshot of the name, so renaming or deleting a spell never rewrites history. */
  name: string
  /** The spell's own tier. */
  tier: Tier
  /** The tier of the slot it occupies. Higher than `tier` means it was upcast. */
  slotTier: Tier
  done: boolean
  doneAt: number | null
}

/** One day of adventuring. */
export interface DayRecord {
  date: string
  /** The slots available that day, snapshotted at dawn. */
  slots: SlotTable
  prepared: Prepared[]
  /** True once every available slot has been spent. */
  complete: boolean
  /** XP earned during the day, including the rest bonus. */
  xpEarned: number
  startedAt: number
}

export interface Settings {
  /** Hour (0-23) at which a new day begins. Lets late nights count as the day before. */
  dayStartHour: number
  reduceMotion: boolean
}

export interface GameState {
  version: number
  /** XP from finished days. Today's XP is derived, so undo is always exact. */
  xpBanked: number
  /** Streak as of `lastCompleteDate`. Use `currentStreak()` for the live value. */
  streak: number
  bestStreak: number
  lastCompleteDate: string | null
  daysAdventured: number
  spells: Spell[]
  today: DayRecord
  history: DayRecord[]
  settings: Settings
}
