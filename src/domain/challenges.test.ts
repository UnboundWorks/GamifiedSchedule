import { describe, expect, it } from 'vitest'
import { challengeProgress, challengeStanding } from './challenges'
import type { Challenge, Completion } from './types'

const comp = (
  date: string,
  pts: number,
  status: Completion['status'] = 'done',
): Completion => ({
  id: date + pts,
  profileId: 'p',
  sourceType: 'chore',
  sourceId: 's',
  date,
  completedAt: 0,
  pointsAwarded: pts,
  xpAwarded: pts,
  status,
})

const challenge: Challenge = {
  id: 'ch',
  title: 'July sprint',
  icon: '🏁',
  startDate: '2026-07-01',
  endDate: '2026-07-07',
  metric: 'points',
  goal: 50,
  bonusPoints: 100,
  participantProfileIds: ['p'],
  active: true,
  createdAt: 0,
  updatedAt: 0,
}

describe('challengeProgress', () => {
  it('sums points within the window only', () => {
    const completions = [
      comp('2026-06-30', 20), // before window
      comp('2026-07-02', 30),
      comp('2026-07-05', 15),
      comp('2026-07-10', 40), // after window
    ]
    expect(challengeProgress(challenge, 'p', completions)).toBe(45)
  })

  it('counts completions metric', () => {
    const c2 = { ...challenge, metric: 'completions' as const }
    const completions = [comp('2026-07-02', 5), comp('2026-07-03', 5)]
    expect(challengeProgress(c2, 'p', completions)).toBe(2)
  })

  it('reports standing met when goal reached', () => {
    const completions = [comp('2026-07-02', 30), comp('2026-07-03', 30)]
    const s = challengeStanding(challenge, 'p', completions)
    expect(s.progress).toBe(60)
    expect(s.met).toBe(true)
    expect(s.ratio).toBe(1)
  })
})
