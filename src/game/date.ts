const DAY_MS = 24 * 60 * 60 * 1000

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * The day a moment belongs to, honouring a custom day-start hour.
 * With dayStartHour = 4, anything before 4am counts as the previous day —
 * so finishing something at 1am still spends yesterday's slot.
 */
export function dayKey(at: Date | number, dayStartHour = 0): string {
  const shifted = new Date(at)
  shifted.setHours(shifted.getHours() - dayStartHour)
  return toKey(shifted)
}

/** Milliseconds until the next day begins, so the app can roll over on its own. */
export function msUntilNextDay(at: Date | number, dayStartHour = 0): number {
  const now = new Date(at)
  const next = new Date(now)
  next.setHours(dayStartHour, 0, 0, 0)
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
  return next.getTime() - now.getTime()
}

/** Parses a `YYYY-MM-DD` key back into a local Date at midnight. */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, delta: number): string {
  const d = keyToDate(key)
  d.setDate(d.getDate() + delta)
  return toKey(d)
}

/** Whole days between two day keys. Positive when `b` is later. */
export function daysBetween(a: string, b: string): number {
  return Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / DAY_MS)
}

export function isYesterday(candidate: string, relativeTo: string): boolean {
  return daysBetween(candidate, relativeTo) === 1
}

export function formatDay(key: string, today: string): string {
  if (key === today) return 'Today'
  if (isYesterday(key, today)) return 'Yesterday'
  const d = keyToDate(key)
  const sameYear = d.getFullYear() === keyToDate(today).getFullYear()
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

export function weekdayLetter(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, { weekday: 'narrow' })
}
