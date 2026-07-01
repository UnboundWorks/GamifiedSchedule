import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/db'
import { resetToSeed } from '../db/seed'
import { getSettings } from './settings.repo'
import { toggleCompletion } from './completions.repo'
import type { Profile, TaskInstance } from '../domain/types'

async function firstChild(): Promise<Profile> {
  const kids = await db.profiles.where('role').equals('child').toArray()
  return kids[0]
}

function choreInstance(profile: Profile, points = 10, requiresApproval = false): TaskInstance {
  return {
    key: 'chore:test:p:2026-07-01',
    profileId: profile.id,
    sourceType: 'chore',
    sourceId: 'test-chore',
    date: '2026-07-01',
    title: 'Test chore',
    icon: '🧹',
    points,
    category: 'chore',
    requiresApproval,
  }
}

describe('toggleCompletion', () => {
  beforeEach(async () => {
    await resetToSeed(0)
  })

  it('awards points + xp and logs a completion', async () => {
    const profile = await firstChild()
    const settings = await getSettings()
    const before = profile.points
    const res = await toggleCompletion(profile, choreInstance(profile), settings, new Date('2026-07-01T09:00:00'))

    expect(res.undone).toBe(false)
    expect(res.pointsAwarded).toBeGreaterThan(0)
    const after = await db.profiles.get(profile.id)
    expect(after!.points).toBe(before + res.pointsAwarded)
    expect(after!.xp).toBe(res.xpAwarded)
    const log = await db.completions.toArray()
    expect(log).toHaveLength(1)
    expect(log[0].status).toBe('done')
  })

  it('awards a first-of-day and earns the starter badge', async () => {
    const profile = await firstChild()
    const settings = await getSettings()
    const res = await toggleCompletion(profile, choreInstance(profile), settings, new Date('2026-07-01T09:00:00'))
    expect(res.newBadges.some((b) => b.id === 'badge-first-step')).toBe(true)
  })

  it('undoes a completion and reverses points', async () => {
    const profile = await firstChild()
    const settings = await getSettings()
    const inst = choreInstance(profile)
    await toggleCompletion(profile, inst, settings, new Date('2026-07-01T09:00:00'))
    const mid = await db.profiles.get(profile.id)
    expect(mid!.points).toBeGreaterThan(0)

    const undo = await toggleCompletion(profile, inst, settings, new Date('2026-07-01T09:05:00'))
    expect(undo.undone).toBe(true)
    const after = await db.profiles.get(profile.id)
    expect(after!.points).toBe(0)
    expect(after!.xp).toBe(0)
    expect(await db.completions.count()).toBe(0)
  })

  it('holds points pending when approval is required', async () => {
    const profile = await firstChild()
    const settings = await getSettings()
    const res = await toggleCompletion(
      profile,
      choreInstance(profile, 10, true),
      settings,
      new Date('2026-07-01T09:00:00'),
    )
    expect(res.pointsAwarded).toBe(0)
    const after = await db.profiles.get(profile.id)
    expect(after!.points).toBe(0)
    const log = await db.completions.toArray()
    expect(log[0].status).toBe('pending-approval')
  })
})
