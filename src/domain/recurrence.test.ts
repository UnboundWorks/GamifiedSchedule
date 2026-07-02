import { describe, expect, it } from 'vitest'
import { dayContext, getDayInstances } from './recurrence'
import { defaultSettings } from '../db/defaults'
import type { Chore, Profile, Routine } from './types'

const now = 0
const settings = defaultSettings(now)

const child: Profile = {
  id: 'kid',
  role: 'child',
  name: 'Kid',
  avatar: '🦊',
  color: '#f00',
  pinHash: null,
  pinSalt: null,
  points: 0,
  xp: 0,
  level: 1,
  gameModeOptIn: false,
  sortOrder: 0,
  active: true,
  createdAt: now,
  updatedAt: now,
}

const morning: Routine = {
  id: 'r1',
  name: 'Morning',
  icon: '🌅',
  anchorTime: '07:00',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  schoolMode: true,
  holidayMode: true,
  assignedProfileIds: ['kid'],
  steps: [
    { id: 's1', order: 0, title: 'Brush', icon: '🪥' },
    { id: 's2', order: 1, title: 'Dress', icon: '👕' },
  ],
  active: true,
  createdAt: now,
  updatedAt: now,
}

const schoolChore: Chore = {
  id: 'c1',
  title: 'Homework',
  icon: '✏️',
  cadence: 'daily',
  daysOfWeek: [1, 2, 3, 4, 5],
  assignedProfileIds: ['kid'],
  points: 10,
  requiresApproval: false,
  schoolMode: true,
  holidayMode: false,
  active: true,
  createdAt: now,
  updatedAt: now,
}

// 2026-07-01 is a Wednesday.
const WED = '2026-07-01'

describe('getDayInstances', () => {
  const sources = {
    routines: [morning],
    chores: [schoolChore],
    scheduleItems: [],
    completions: [],
  }

  it('includes routines assigned to the profile on the weekday', () => {
    const ctx = dayContext(WED, [], settings)
    const instances = getDayInstances(child, ctx, sources, settings)
    const routine = instances.find((i) => i.sourceType === 'routine')
    expect(routine).toBeTruthy()
    expect(routine!.steps).toHaveLength(2)
  })

  it('school-only chore appears on a school day but not a holiday day', () => {
    const school = getDayInstances(child, dayContext(WED, [], settings), sources, settings)
    expect(school.some((i) => i.sourceId === 'c1')).toBe(true)

    const holiday = getDayInstances(
      child,
      dayContext(WED, [], { ...settings, holidayModeOverride: 'on' }),
      sources,
      settings,
    )
    expect(holiday.some((i) => i.sourceId === 'c1')).toBe(false)
  })

  it('generates reading/math work on holiday days for children', () => {
    const ctx = dayContext(WED, [], { ...settings, holidayModeOverride: 'on' })
    const instances = getDayInstances(child, ctx, sources, {
      ...settings,
      holidayModeOverride: 'on',
    })
    expect(instances.some((i) => i.sourceType === 'reading')).toBe(true)
    expect(instances.some((i) => i.sourceType === 'math')).toBe(true)
  })

  it('merges completion state onto instances', () => {
    const withCompletion = {
      ...sources,
      completions: [
        {
          id: 'x',
          profileId: 'kid',
          sourceType: 'chore' as const,
          sourceId: 'c1',
          date: WED,
          completedAt: 1,
          pointsAwarded: 10,
          xpAwarded: 10,
          status: 'done' as const,
        },
      ],
    }
    const instances = getDayInstances(
      child,
      dayContext(WED, [], settings),
      withCompletion,
      settings,
    )
    const chore = instances.find((i) => i.sourceId === 'c1')
    expect(chore!.completion?.status).toBe('done')
  })
})
