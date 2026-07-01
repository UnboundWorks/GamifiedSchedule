import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSession } from '../store/session'
import { getSettings } from '../repositories/settings.repo'
import { dayContext, getDayInstances } from '../domain/recurrence'
import { Loading } from './Home'
import {
  todayStr,
  weekDates,
  WEEKDAY_LABELS,
  parseDateStr,
  formatTime,
} from '../lib/dates'
import { isHoliday } from '../domain/holiday'
import type { TaskInstance } from '../domain/types'

export function Week() {
  const profile = useSession((s) => s.activeProfile)!
  const today = todayStr()

  const data = useLiveQuery(async () => {
    const s = await getSettings()
    const [routines, chores, scheduleItems, periods] = await Promise.all([
      db.routines.toArray(),
      db.chores.toArray(),
      db.scheduleItems.toArray(),
      db.holidayPeriods.toArray(),
    ])
    const dates = weekDates(today, s.weekStartsOn)
    const days = await Promise.all(
      dates.map(async (date) => {
        const completions = await db.completions
          .where('[profileId+date]')
          .equals([profile.id, date])
          .toArray()
        const ctx = dayContext(date, periods, s)
        const instances = getDayInstances(
          profile,
          ctx,
          { routines, chores, scheduleItems, completions },
          s,
        )
        return {
          date,
          holiday: isHoliday(date, periods, s.holidayModeOverride),
          instances,
        }
      }),
    )
    return days
  }, [profile.id, today])

  if (!data) return <Loading />

  const doneStatus = (i: TaskInstance) =>
    i.completion && ['done', 'approved'].includes(i.completion.status)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">This Week</h1>
      <div className="space-y-3">
        {data.map((day) => {
          const wd = parseDateStr(day.date).getDay()
          const isToday = day.date === today
          return (
            <div
              key={day.date}
              className={`card ${isToday ? 'ring-2 ring-brand-500' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-bold">
                  {WEEKDAY_LABELS[wd]}
                  {isToday && (
                    <span className="ml-2 text-xs font-semibold text-brand-500">
                      TODAY
                    </span>
                  )}
                </h2>
                {day.holiday && <span className="text-sm">🏖️</span>}
              </div>
              {day.instances.length === 0 ? (
                <p className="text-sm text-slate-400">Nothing scheduled</p>
              ) : (
                <ul className="space-y-1">
                  {day.instances.map((i) => (
                    <li
                      key={i.key}
                      className={`flex items-center gap-2 text-sm ${
                        doneStatus(i) ? 'text-slate-400 line-through' : ''
                      }`}
                    >
                      <span>{i.icon}</span>
                      {i.time && (
                        <span className="w-16 shrink-0 text-slate-400">
                          {formatTime(i.time)}
                        </span>
                      )}
                      <span className="flex-1">{i.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
