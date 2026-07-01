import type { Weekday } from '../domain/types'

/** Format a Date as a local "YYYY-MM-DD" string. */
export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today's local date string. */
export function todayStr(now: Date = new Date()): string {
  return toDateStr(now)
}

/** Parse a "YYYY-MM-DD" string into a local Date (midnight). */
export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Weekday (0=Sun..6=Sat) for a date string. */
export function weekdayOf(dateStr: string): Weekday {
  return parseDateStr(dateStr).getDay() as Weekday
}

/** Add days to a date string, returning a new date string. */
export function addDaysStr(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

/** True if dateStr is within [start, end] inclusive (all "YYYY-MM-DD"). */
export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end
}

/**
 * Return the 7 date strings of the week containing `dateStr`.
 * weekStartsOn: 0 = Sunday, 1 = Monday.
 */
export function weekDates(dateStr: string, weekStartsOn: 0 | 1 = 0): string[] {
  const d = parseDateStr(dateStr)
  const day = d.getDay()
  const diff = (day - weekStartsOn + 7) % 7
  const start = addDaysStr(dateStr, -diff)
  return Array.from({ length: 7 }, (_, i) => addDaysStr(start, i))
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const WEEKDAY_LABELS_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

/** Compare two "HH:MM" strings; returns negative/0/positive. */
export function compareTime(a?: string, b?: string): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.localeCompare(b)
}

/** Pretty a "HH:MM" 24h string as e.g. "7:30 AM". */
export function formatTime(hhmm?: string): string {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}
