import type { Profile, Weekday } from '../../domain/types'
import { WEEKDAY_LABELS } from '../../lib/dates'

const ALL_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function WeekdayPicker({
  value,
  onChange,
}: {
  value: Weekday[]
  onChange: (v: Weekday[]) => void
}) {
  const toggle = (d: Weekday) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d])
  return (
    <div className="flex gap-1">
      {ALL_WEEKDAYS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => toggle(d)}
          className={`h-10 flex-1 rounded-lg text-xs font-semibold ${
            value.includes(d)
              ? 'bg-brand-600 text-white'
              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {WEEKDAY_LABELS[d][0]}
        </button>
      ))}
    </div>
  )
}

export function ProfileMultiSelect({
  profiles,
  value,
  onChange,
}: {
  profiles: Profile[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <div className="flex flex-wrap gap-2">
      {profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => toggle(p.id)}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium ${
            value.includes(p.id)
              ? 'bg-brand-600 text-white'
              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <span>{p.avatar}</span> {p.name}
        </button>
      ))}
    </div>
  )
}

export function ModeToggle({
  schoolMode,
  holidayMode,
  onChange,
}: {
  schoolMode: boolean
  holidayMode: boolean
  onChange: (v: { schoolMode: boolean; holidayMode: boolean }) => void
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange({ schoolMode: !schoolMode, holidayMode })}
        className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
          schoolMode
            ? 'bg-brand-600 text-white'
            : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
        }`}
      >
        🏫 School days
      </button>
      <button
        type="button"
        onClick={() => onChange({ schoolMode, holidayMode: !holidayMode })}
        className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
          holidayMode
            ? 'bg-amber-500 text-white'
            : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
        }`}
      >
        🏖️ Holidays
      </button>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="font-medium">{label}</div>
        {hint && <div className="text-sm text-slate-400">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
