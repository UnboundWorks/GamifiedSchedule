import { useSession } from '../store/session'
import { useDayInstances, useSettings } from '../hooks/data'
import { TaskItem } from '../components/TaskItem'
import { todayStr, WEEKDAY_LABELS_FULL, parseDateStr } from '../lib/dates'
import { activeHolidayPeriod } from '../domain/holiday'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { isHoliday } from '../domain/holiday'
import type { TaskInstance } from '../domain/types'

const SECTIONS: { key: TaskInstance['category']; title: string }[] = [
  { key: 'routine', title: 'Routines' },
  { key: 'schedule', title: 'Schedule' },
  { key: 'work', title: 'Holiday Learning' },
  { key: 'chore', title: 'Chores' },
]

export function Home() {
  const profile = useSession((s) => s.activeProfile)!
  const settings = useSettings()
  const date = todayStr()
  const instances = useDayInstances(profile, date)

  const holidayInfo = useLiveQuery(async () => {
    if (!settings) return null
    const periods = await db.holidayPeriods.toArray()
    const on = isHoliday(date, periods, settings.holidayModeOverride)
    return { on, period: activeHolidayPeriod(date, periods) }
  }, [settings?.holidayModeOverride, date])

  if (!settings || !instances) return <Loading />

  const weekday = WEEKDAY_LABELS_FULL[parseDateStr(date).getDay()]
  const done = instances.filter(
    (i) => i.completion && ['done', 'approved'].includes(i.completion.status),
  ).length
  const total = instances.length

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{weekday}</h1>
          {holidayInfo?.on && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-200">
              🏖️ {holidayInfo.period?.name ?? 'Holiday mode'}
            </span>
          )}
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          {total === 0
            ? 'Nothing scheduled today 🎈'
            : `${done} of ${total} done`}
        </p>
      </div>

      {SECTIONS.map((section) => {
        const items = instances.filter((i) => i.category === section.key)
        if (items.length === 0) return null
        return (
          <section key={section.key} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {section.title}
            </h2>
            {items.map((i) => (
              <TaskItem
                key={i.key}
                instance={i}
                profile={profile}
                settings={settings}
              />
            ))}
          </section>
        )
      })}

      {total === 0 && (
        <div className="card text-center text-slate-500 dark:text-slate-400">
          Add routines, chores or schedule items in Settings to see them here.
        </div>
      )}
    </div>
  )
}

export function Loading() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">
      Loading…
    </div>
  )
}
