import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { db } from '../db/db'
import { getSettings } from '../repositories/settings.repo'
import {
  dayContext,
  getDayInstances,
  type InstanceSources,
} from '../domain/recurrence'
import { levelProgress } from '../domain/gamification'
import { currentStreak, longestStreak } from '../domain/streaks'
import type { Profile, Settings, TaskInstance } from '../domain/types'
import { todayStr } from '../lib/dates'
import { useSession } from '../store/session'

export function useSettings(): Settings | undefined {
  return useLiveQuery(() => getSettings(), [])
}

export function useProfiles(): Profile[] | undefined {
  return useLiveQuery(() => db.profiles.orderBy('sortOrder').toArray(), [])
}

export function useProfile(id: string | undefined): Profile | undefined {
  return useLiveQuery(() => (id ? db.profiles.get(id) : undefined), [id])
}

/** Keep the signed-in session profile in sync with DB edits (points, etc.). */
export function useSyncActiveProfile(): void {
  const active = useSession((s) => s.activeProfile)
  const refresh = useSession((s) => s.refreshProfile)
  const live = useProfile(active?.id)
  useEffect(() => {
    if (live) refresh(live)
  }, [live, refresh])
}

/** Materialized task instances for a profile on a given date. */
export function useDayInstances(
  profile: Profile | null,
  date: string,
): TaskInstance[] | undefined {
  return useLiveQuery(async () => {
    if (!profile) return []
    const settings = await getSettings()
    const [routines, chores, scheduleItems, periods, completions] =
      await Promise.all([
        db.routines.toArray(),
        db.chores.toArray(),
        db.scheduleItems.toArray(),
        db.holidayPeriods.toArray(),
        db.completions.where('[profileId+date]').equals([profile.id, date]).toArray(),
      ])
    const sources: InstanceSources = { routines, chores, scheduleItems, completions }
    const ctx = dayContext(date, periods, settings)
    return getDayInstances(profile, ctx, sources, settings)
  }, [profile?.id, date])
}

export interface ProfileStats {
  points: number
  xp: number
  level: number
  levelRatio: number
  intoLevel: number
  span: number
  streak: number
  bestStreak: number
  badgeCount: number
}

export function useProfileStats(
  profile: Profile | null,
): ProfileStats | undefined {
  return useLiveQuery(async () => {
    if (!profile) return undefined
    const settings = await getSettings()
    const [fresh, completions, awards] = await Promise.all([
      db.profiles.get(profile.id),
      db.completions.where('profileId').equals(profile.id).toArray(),
      db.badgeAwards.where('profileId').equals(profile.id).toArray(),
    ])
    const p = fresh ?? profile
    const prog = levelProgress(p.xp, settings.levelCurve)
    return {
      points: p.points,
      xp: p.xp,
      level: prog.level,
      levelRatio: prog.ratio,
      intoLevel: prog.intoLevel,
      span: prog.span,
      streak: currentStreak(completions, todayStr()),
      bestStreak: longestStreak(completions),
      badgeCount: awards.length,
    }
  }, [profile?.id])
}

export function usePendingApprovalsCount(): number {
  return (
    useLiveQuery(async () => {
      const [comps, reds] = await Promise.all([
        db.completions.where('status').equals('pending-approval').count(),
        db.redemptions.where('status').equals('pending').count(),
      ])
      return comps + reds
    }, []) ?? 0
  )
}
