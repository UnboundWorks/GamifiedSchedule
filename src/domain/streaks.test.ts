import { describe, expect, it } from 'vitest'
import { currentStreak, longestStreak } from './streaks'
import type { Completion } from './types'

const c = (date: string, status: Completion['status'] = 'done'): Completion => ({
  id: date + status,
  profileId: 'p',
  sourceType: 'chore',
  sourceId: 's',
  date,
  completedAt: 0,
  pointsAwarded: 1,
  xpAwarded: 1,
  status,
})

describe('currentStreak', () => {
  it('is 0 with no completions', () => {
    expect(currentStreak([], '2026-07-01')).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const done = [c('2026-06-29'), c('2026-06-30'), c('2026-07-01')]
    expect(currentStreak(done, '2026-07-01')).toBe(3)
  })

  it('gives grace for today (counts up to yesterday)', () => {
    const done = [c('2026-06-29'), c('2026-06-30')]
    expect(currentStreak(done, '2026-07-01')).toBe(2)
  })

  it('breaks on a gap', () => {
    const done = [c('2026-06-25'), c('2026-06-30'), c('2026-07-01')]
    expect(currentStreak(done, '2026-07-01')).toBe(2)
  })

  it('ignores rejected completions', () => {
    const done = [c('2026-06-30', 'rejected'), c('2026-07-01')]
    expect(currentStreak(done, '2026-07-01')).toBe(1)
  })
})

describe('longestStreak', () => {
  it('finds the longest run', () => {
    const done = [
      c('2026-06-01'),
      c('2026-06-02'),
      c('2026-06-03'),
      c('2026-06-10'),
      c('2026-06-11'),
    ]
    expect(longestStreak(done)).toBe(3)
  })
})
