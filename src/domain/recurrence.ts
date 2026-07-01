import type {
  Chore,
  Completion,
  HolidayPeriod,
  HolidayWorkConfig,
  ModeApplicability,
  Profile,
  Routine,
  ScheduleItem,
  Settings,
  TaskInstance,
  Weekday,
} from './types'
import { compareTime, weekdayOf } from '../lib/dates'
import { isHoliday } from './holiday'

/** Does a mode-scoped definition apply on a school/holiday day? */
function appliesInMode(item: ModeApplicability, holiday: boolean): boolean {
  return holiday ? item.holidayMode : item.schoolMode
}

function completionKey(
  sourceType: string,
  sourceId: string,
  profileId: string,
  date: string,
): string {
  return `${sourceType}:${sourceId}:${profileId}:${date}`
}

export interface DayContext {
  date: string
  weekday: Weekday
  holiday: boolean
}

export function dayContext(
  date: string,
  periods: HolidayPeriod[],
  settings: Settings,
): DayContext {
  return {
    date,
    weekday: weekdayOf(date),
    holiday: isHoliday(date, periods, settings.holidayModeOverride),
  }
}

export interface InstanceSources {
  routines: Routine[]
  chores: Chore[]
  scheduleItems: ScheduleItem[]
  completions: Completion[] // completions for this profile+date (or superset)
}

/**
 * Derive the concrete task instances for one profile on one day from recurring
 * definitions + the holiday context + the completion log. This is the heart of
 * the app: there are no stored per-day rows.
 */
export function getDayInstances(
  profile: Profile,
  ctx: DayContext,
  sources: InstanceSources,
  settings: Settings,
): TaskInstance[] {
  const { date, weekday, holiday } = ctx
  const instances: TaskInstance[] = []

  // Index completions by their instance key for O(1) lookup.
  const byKey = new Map<string, Completion>()
  for (const c of sources.completions) {
    if (c.profileId !== profile.id || c.date !== date) continue
    byKey.set(completionKey(c.sourceType, c.sourceId, c.profileId, c.date), c)
  }
  const findCompletion = (sourceType: string, sourceId: string) =>
    byKey.get(completionKey(sourceType, sourceId, profile.id, date))

  const assigned = (ids: string[]) =>
    ids.length === 0 || ids.includes(profile.id)

  // --- Routines ---
  for (const r of sources.routines) {
    if (!r.active) continue
    if (!r.daysOfWeek.includes(weekday)) continue
    if (!appliesInMode(r, holiday)) continue
    if (!assigned(r.assignedProfileIds)) continue
    const stepPoints = r.steps.reduce(
      (sum, s) => sum + (s.points ?? settings.points.perRoutineStep),
      0,
    )
    instances.push({
      key: completionKey('routine', r.id, profile.id, date),
      profileId: profile.id,
      sourceType: 'routine',
      sourceId: r.id,
      date,
      title: r.name,
      icon: r.icon,
      time: r.anchorTime,
      points: stepPoints + settings.points.routineCompletionBonus,
      category: 'routine',
      requiresApproval: false,
      completion: findCompletion('routine', r.id),
      steps: [...r.steps].sort((a, b) => a.order - b.order),
    })
  }

  // --- Chores ---
  for (const c of sources.chores) {
    if (!c.active) continue
    if (!c.daysOfWeek.includes(weekday)) continue
    if (!appliesInMode(c, holiday)) continue
    if (!assigned(c.assignedProfileIds)) continue
    instances.push({
      key: completionKey('chore', c.id, profile.id, date),
      profileId: profile.id,
      sourceType: 'chore',
      sourceId: c.id,
      date,
      title: c.title,
      icon: c.icon,
      points: c.points,
      category: 'chore',
      requiresApproval: c.requiresApproval,
      completion: findCompletion('chore', c.id),
    })
  }

  // --- Schedule items ---
  for (const s of sources.scheduleItems) {
    if (!s.active) continue
    if (!s.daysOfWeek.includes(weekday)) continue
    if (!appliesInMode(s, holiday)) continue
    if (!assigned(s.assignedProfileIds)) continue
    instances.push({
      key: completionKey(s.type, s.id, profile.id, date),
      profileId: profile.id,
      sourceType: s.type,
      sourceId: s.id,
      date,
      title: s.title,
      icon: s.icon,
      time: s.startTime,
      points: settings.points.perScheduleItem,
      category: 'schedule',
      requiresApproval: false,
      completion: findCompletion(s.type, s.id),
    })
  }

  // --- Holiday work sessions (reading + math), generated on the fly ---
  if (holiday && profile.role === 'child') {
    instances.push(
      ...generateWorkInstances('reading', settings.holidayConfig.reading, profile, ctx, findCompletion),
    )
    instances.push(
      ...generateWorkInstances('math', settings.holidayConfig.math, profile, ctx, findCompletion),
    )
  }

  // Sort by time (untimed items last), then title.
  return instances.sort((a, b) => {
    const t = compareTime(a.time, b.time)
    if (t !== 0) return t
    return a.title.localeCompare(b.title)
  })
}

function generateWorkInstances(
  kind: 'reading' | 'math',
  cfg: HolidayWorkConfig,
  profile: Profile,
  ctx: DayContext,
  findCompletion: (t: string, id: string) => Completion | undefined,
): TaskInstance[] {
  if (!cfg.daysOfWeek.includes(ctx.weekday)) return []
  const out: TaskInstance[] = []
  const sessions = Math.max(1, cfg.sessionsPerDay)
  for (let n = 0; n < sessions; n++) {
    const sourceId = `${kind}:${ctx.date}:${n}`
    const label =
      kind === 'reading'
        ? `Reading (${cfg.durationMin} min)`
        : `Math practice (${cfg.durationMin} min)`
    out.push({
      key: completionKey(kind, sourceId, profile.id, ctx.date),
      profileId: profile.id,
      sourceType: kind,
      sourceId,
      date: ctx.date,
      title: sessions > 1 ? `${label} #${n + 1}` : label,
      icon: kind === 'reading' ? '📚' : '➗',
      time: cfg.anchorTime,
      points: cfg.points,
      category: 'work',
      requiresApproval: false,
      completion: findCompletion(kind, sourceId),
    })
  }
  return out
}
