import { describe, expect, it } from 'vitest'
import { isHoliday } from './holiday'
import type { HolidayPeriod } from './types'

const period = (
  id: string,
  startDate: string,
  endDate: string,
  active = true,
): HolidayPeriod => ({
  id,
  name: id,
  startDate,
  endDate,
  active,
  createdAt: 0,
  updatedAt: 0,
})

describe('isHoliday', () => {
  const periods = [
    period('summer', '2026-06-15', '2026-08-31'),
    period('winter', '2026-12-20', '2027-01-03'),
    period('inactive', '2026-03-01', '2026-03-10', false),
  ]

  it('auto: date inside an active period is a holiday', () => {
    expect(isHoliday('2026-07-01', periods, 'auto')).toBe(true)
    expect(isHoliday('2026-12-25', periods, 'auto')).toBe(true)
  })

  it('auto: boundaries are inclusive', () => {
    expect(isHoliday('2026-06-15', periods, 'auto')).toBe(true)
    expect(isHoliday('2026-08-31', periods, 'auto')).toBe(true)
    expect(isHoliday('2026-09-01', periods, 'auto')).toBe(false)
  })

  it('auto: inactive periods are ignored', () => {
    expect(isHoliday('2026-03-05', periods, 'auto')).toBe(false)
  })

  it('auto: date outside all periods is not a holiday', () => {
    expect(isHoliday('2026-04-01', periods, 'auto')).toBe(false)
  })

  it('override on/off wins regardless of dates', () => {
    expect(isHoliday('2026-04-01', periods, 'on')).toBe(true)
    expect(isHoliday('2026-07-01', periods, 'off')).toBe(false)
  })
})
