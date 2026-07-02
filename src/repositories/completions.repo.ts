import { db } from '../db/db'
import type {
  Badge,
  Completion,
  Profile,
  Settings,
  TaskInstance,
} from '../domain/types'
import { uid } from '../lib/id'
import { levelForXp } from '../domain/gamification'
import { newlyEarnedBadges } from '../domain/badges'
import { todayStr } from '../lib/dates'
import { recordDeletion } from '../sync/tombstones'

export interface AwardResult {
  completion: Completion | null
  pointsAwarded: number
  xpAwarded: number
  leveledUp: boolean
  newLevel: number
  newBadges: Badge[]
  undone: boolean
}

function timeOfDay(now: Date): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`
}

/**
 * Compute the points/xp a completion should grant, including on-time and
 * first-of-day streak bonuses. Pure given its inputs.
 */
function computeAward(
  instance: TaskInstance,
  settings: Settings,
  onTime: boolean,
  firstOfDay: boolean,
): { points: number; xp: number } {
  let points = instance.points
  if (onTime && instance.time) points += settings.points.onTimeBonus
  if (firstOfDay) points += settings.points.streakDailyBonus
  return { points, xp: points }
}

/**
 * Toggle completion of a task instance for a profile. If already completed it
 * is undone (points/xp reversed). Otherwise it is marked done — or
 * pending-approval when the source requires parent sign-off. All mutations
 * happen in a single transaction so points, the log and badges stay consistent.
 */
export async function toggleCompletion(
  profile: Profile,
  instance: TaskInstance,
  settings: Settings,
  now: Date = new Date(),
): Promise<AwardResult> {
  const nowMs = now.getTime()
  return db.transaction(
    'rw',
    [db.completions, db.profiles, db.badges, db.badgeAwards, db.challenges, db.tombstones],
    async () => {
      const existing = await db.completions
        .where('[profileId+date]')
        .equals([profile.id, instance.date])
        .and(
          (c) =>
            c.sourceType === instance.sourceType &&
            c.sourceId === instance.sourceId,
        )
        .first()

      // --- Undo path ---
      if (existing) {
        await db.completions.delete(existing.id)
        await recordDeletion('completions', existing.id)
        const granted =
          existing.status === 'done' || existing.status === 'approved'
        const fresh = await db.profiles.get(profile.id)
        if (fresh && granted) {
          const xp = Math.max(0, fresh.xp - existing.xpAwarded)
          await db.profiles.update(profile.id, {
            points: Math.max(0, fresh.points - existing.pointsAwarded),
            xp,
            level: levelForXp(xp, settings.levelCurve),
            updatedAt: nowMs,
          })
        }
        return {
          completion: null,
          pointsAwarded: 0,
          xpAwarded: 0,
          leveledUp: false,
          newLevel: fresh?.level ?? profile.level,
          newBadges: [],
          undone: true,
        }
      }

      // --- Complete path ---
      const dayCompletions = await db.completions
        .where('[profileId+date]')
        .equals([profile.id, instance.date])
        .toArray()
      const firstOfDay = dayCompletions.length === 0
      const onTime = !instance.time || timeOfDay(now) <= instance.time
      const { points, xp } = computeAward(instance, settings, onTime, firstOfDay)

      const needsApproval = instance.requiresApproval
      const completion: Completion = {
        id: uid(),
        profileId: profile.id,
        sourceType: instance.sourceType,
        sourceId: instance.sourceId,
        date: instance.date,
        completedAt: nowMs,
        pointsAwarded: points,
        xpAwarded: xp,
        status: needsApproval ? 'pending-approval' : 'done',
        onTime,
        label: instance.title,
      }
      await db.completions.put(completion)

      let leveledUp = false
      let newLevel = profile.level
      let newBadges: Badge[] = []

      if (!needsApproval) {
        const fresh = await db.profiles.get(profile.id)
        if (fresh) {
          const newXp = fresh.xp + xp
          newLevel = levelForXp(newXp, settings.levelCurve)
          leveledUp = newLevel > fresh.level
          await db.profiles.update(profile.id, {
            points: fresh.points + points,
            xp: newXp,
            level: newLevel,
            updatedAt: nowMs,
          })
          newBadges = await evaluateBadges(profile.id, newLevel, instance.date)
        }
      }

      return {
        completion,
        pointsAwarded: needsApproval ? 0 : points,
        xpAwarded: needsApproval ? 0 : xp,
        leveledUp,
        newLevel,
        newBadges,
        undone: false,
      }
    },
  )
}

/**
 * Approve a pending completion: grant its stored points/xp and re-evaluate
 * badges. Runs in a transaction.
 */
export async function approveCompletion(
  completionId: string,
  byProfileId: string,
  settings: Settings,
  now: number = Date.now(),
): Promise<Badge[]> {
  return db.transaction(
    'rw',
    db.completions,
    db.profiles,
    db.badges,
    db.badgeAwards,
    async () => {
      const c = await db.completions.get(completionId)
      if (!c || c.status !== 'pending-approval') return []
      await db.completions.update(completionId, {
        status: 'approved',
        resolvedByProfileId: byProfileId,
      } as Partial<Completion>)
      const p = await db.profiles.get(c.profileId)
      if (!p) return []
      const newXp = p.xp + c.xpAwarded
      const newLevel = levelForXp(newXp, settings.levelCurve)
      await db.profiles.update(c.profileId, {
        points: p.points + c.pointsAwarded,
        xp: newXp,
        level: newLevel,
        updatedAt: now,
      })
      return evaluateBadges(c.profileId, newLevel, c.date)
    },
  )
}

export async function rejectCompletion(
  completionId: string,
  byProfileId: string,
): Promise<void> {
  await db.completions.update(completionId, {
    status: 'rejected',
    resolvedByProfileId: byProfileId,
  } as Partial<Completion>)
}

export function listPendingApprovals(): Promise<Completion[]> {
  return db.completions.where('status').equals('pending-approval').toArray()
}

/**
 * Evaluate and persist any newly earned badges for a profile. Must be called
 * within an rw transaction covering badges + badgeAwards + profiles.
 */
async function evaluateBadges(
  profileId: string,
  level: number,
  today: string,
): Promise<Badge[]> {
  const [profile, badges, awards, completions] = await Promise.all([
    db.profiles.get(profileId),
    db.badges.toArray(),
    db.badgeAwards.where('profileId').equals(profileId).toArray(),
    db.completions.where('profileId').equals(profileId).toArray(),
  ])
  if (!profile) return []
  const earned = new Set(awards.map((a) => a.badgeId))
  const challengesCompleted = 0 // challenge badges are awarded on challenge close
  const fresh = newlyEarnedBadges(badges, earned, {
    profile: { ...profile, level },
    completions,
    challengesCompleted,
    today,
  })
  for (const b of fresh) {
    await db.badgeAwards.put({
      id: uid(),
      profileId,
      badgeId: b.id,
      awardedAt: Date.now(),
    })
  }
  return fresh
}

export function listCompletionsForProfile(
  profileId: string,
): Promise<Completion[]> {
  return db.completions.where('profileId').equals(profileId).toArray()
}

export function listCompletionsForDate(date: string): Promise<Completion[]> {
  return db.completions.where('date').equals(date).toArray()
}

/** Convenience: today's completions for one profile. */
export function listTodayCompletions(profileId: string): Promise<Completion[]> {
  return db.completions
    .where('[profileId+date]')
    .equals([profileId, todayStr()])
    .toArray()
}
