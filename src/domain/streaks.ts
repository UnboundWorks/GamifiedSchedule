import type { Completion } from './types'
import { addDaysStr } from '../lib/dates'

/**
 * Current streak = number of consecutive days up to and including `today` on
 * which the profile has at least one qualifying completion. If there is no
 * completion today, the streak is measured up to yesterday (a day is not
 * "broken" until it ends), unless there's also nothing yesterday -> 0.
 *
 * `completions` may contain any profiles/dates; we only consider dates with a
 * non-rejected completion.
 */
export function currentStreak(completions: Completion[], today: string): number {
  const days = new Set(
    completions
      .filter((c) => c.status !== 'rejected')
      .map((c) => c.date),
  )
  if (days.size === 0) return 0

  // Start from today if present, else yesterday (grace for the in-progress day).
  let cursor = days.has(today) ? today : addDaysStr(today, -1)
  if (!days.has(cursor)) return 0

  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = addDaysStr(cursor, -1)
  }
  return streak
}

/** Longest streak ever recorded in the completion set. */
export function longestStreak(completions: Completion[]): number {
  const days = Array.from(
    new Set(completions.filter((c) => c.status !== 'rejected').map((c) => c.date)),
  ).sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const day of days) {
    if (prev && addDaysStr(prev, 1) === day) {
      run += 1
    } else {
      run = 1
    }
    best = Math.max(best, run)
    prev = day
  }
  return best
}
