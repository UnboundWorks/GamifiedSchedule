import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSession } from '../store/session'
import { useSettings } from '../hooks/data'
import { getSettings } from '../repositories/settings.repo'
import { dayContext, getDayInstances } from '../domain/recurrence'
import { TaskItem } from '../components/TaskItem'
import { Loading } from './Home'
import { todayStr, weekDates, WEEKDAY_LABELS, parseDateStr } from '../lib/dates'
import type { TaskInstance } from '../domain/types'

export function Chores() {
  const profile = useSession((s) => s.activeProfile)!
  const settings = useSettings()
  const today = todayStr()

  const week = useLiveQuery(async () => {
    const s = await getSettings()
    const [routines, chores, scheduleItems, periods] = await Promise.all([
      db.routines.toArray(),
      db.chores.toArray(),
      db.scheduleItems.toArray(),
      db.holidayPeriods.toArray(),
    ])
    const dates = weekDates(today, s.weekStartsOn)
    const byDate: Record<string, TaskInstance[]> = {}
    for (const date of dates) {
      const completions = await db.completions
        .where('[profileId+date]')
        .equals([profile.id, date])
        .toArray()
      const ctx = dayContext(date, periods, s)
      byDate[date] = getDayInstances(
        profile,
        ctx,
        { routines, chores, scheduleItems, completions },
        s,
      ).filter((i) => i.category === 'chore')
    }
    return { dates, byDate }
  }, [profile.id, today])

  if (!settings || !week) return <Loading />

  const todaysChores = week.byDate[today] ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chores</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {todaysChores.length} due today
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Today
        </h2>
        {todaysChores.length === 0 ? (
          <div className="card text-slate-500 dark:text-slate-400">
            No chores today 🎉
          </div>
        ) : (
          todaysChores.map((i) => (
            <TaskItem key={i.key} instance={i} profile={profile} settings={settings} />
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          This week
        </h2>
        {week.dates
          .filter((d) => d !== today)
          .map((date) => {
            const items = week.byDate[date] ?? []
            if (items.length === 0) return null
            const label = WEEKDAY_LABELS[parseDateStr(date).getDay()]
            return (
              <div key={date} className="card">
                <div className="mb-1 text-sm font-semibold text-slate-400">
                  {label}
                </div>
                <ul className="space-y-1">
                  {items.map((i) => (
                    <li key={i.key} className="flex items-center gap-2">
                      <span>{i.icon}</span>
                      <span className="flex-1">{i.title}</span>
                      <span className="text-sm text-amber-500">⭐ {i.points}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
      </section>
    </div>
  )
}
