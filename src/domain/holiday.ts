import type { HolidayOverride, HolidayPeriod } from './types'
import { isDateInRange } from '../lib/dates'

/**
 * Resolve whether a given date is a "holiday" day.
 *
 * - override 'on'  -> always holiday
 * - override 'off' -> never holiday
 * - override 'auto' (default) -> holiday if any active period covers the date
 */
export function isHoliday(
  dateStr: string,
  periods: HolidayPeriod[],
  override: HolidayOverride,
): boolean {
  if (override === 'on') return true
  if (override === 'off') return false
  return periods.some(
    (p) => p.active && isDateInRange(dateStr, p.startDate, p.endDate),
  )
}

/** The active holiday period covering a date, if any (for display). */
export function activeHolidayPeriod(
  dateStr: string,
  periods: HolidayPeriod[],
): HolidayPeriod | undefined {
  return periods.find(
    (p) => p.active && isDateInRange(dateStr, p.startDate, p.endDate),
  )
}
