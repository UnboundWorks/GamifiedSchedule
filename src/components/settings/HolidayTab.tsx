import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useSettings } from '../../hooks/data'
import { updateSettings } from '../../repositories/settings.repo'
import { holidayRepo } from '../../repositories/content.repo'
import { Modal } from '../common/Modal'
import { Field, WeekdayPicker } from '../common/FormControls'
import { todayStr } from '../../lib/dates'
import type {
  HolidayOverride,
  HolidayPeriod,
  HolidayWorkConfig,
  Settings,
  Weekday,
} from '../../domain/types'

type PeriodDraft = Omit<HolidayPeriod, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

const OVERRIDES: { key: HolidayOverride; label: string; hint: string }[] = [
  { key: 'auto', label: 'Auto', hint: 'Follow the dates below' },
  { key: 'on', label: 'Always on', hint: 'Force holiday mode' },
  { key: 'off', label: 'Always off', hint: 'Force school mode' },
]

export function HolidayTab() {
  const settings = useSettings()
  const periods = useLiveQuery(() => db.holidayPeriods.orderBy('startDate').toArray(), []) ?? []
  const [draft, setDraft] = useState<PeriodDraft | null>(null)

  if (!settings) return null

  const savePeriod = async () => {
    if (!draft || !draft.name.trim()) return
    const now = Date.now()
    const { id, ...rest } = draft
    if (id) await holidayRepo.update(id, rest, now)
    else await holidayRepo.create(rest, now)
    setDraft(null)
  }
  const removePeriod = async (id: string) => {
    if (confirm('Delete this holiday period?')) {
      await holidayRepo.remove(id)
      setDraft(null)
    }
  }

  const newPeriod = (): PeriodDraft => ({
    name: '',
    startDate: todayStr(),
    endDate: todayStr(),
    active: true,
  })

  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <h3 className="font-bold">Holiday mode</h3>
        <div className="grid grid-cols-3 gap-2">
          {OVERRIDES.map((o) => (
            <button
              key={o.key}
              onClick={() => updateSettings({ holidayModeOverride: o.key })}
              className={`rounded-xl p-3 text-center ${
                settings.holidayModeOverride === o.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <div className="font-semibold">{o.label}</div>
              <div className="text-xs opacity-80">{o.hint}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-bold">Breaks & holidays</h3>
        {periods.map((p) => (
          <button
            key={p.id}
            className="card flex w-full items-center gap-3 text-left"
            onClick={() => setDraft({ ...p })}
          >
            <span className="text-2xl">🏖️</span>
            <div className="flex-1">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-slate-400">
                {p.startDate} → {p.endDate}
                {!p.active && ' · disabled'}
              </div>
            </div>
            <span className="text-2xl text-slate-400">›</span>
          </button>
        ))}
        <button className="btn-primary w-full" onClick={() => setDraft(newPeriod())}>
          + Add holiday period
        </button>
      </section>

      <WorkConfigCard
        title="📚 Reading work"
        cfg={settings.holidayConfig.reading}
        onChange={(reading) =>
          updateSettings({
            holidayConfig: { ...settings.holidayConfig, reading },
          } as Partial<Settings>)
        }
      />
      <WorkConfigCard
        title="➗ Math work"
        cfg={settings.holidayConfig.math}
        onChange={(math) =>
          updateSettings({
            holidayConfig: { ...settings.holidayConfig, math },
          } as Partial<Settings>)
        }
      />

      <p className="text-sm text-slate-400">
        Reading and math sessions appear automatically for children on holiday
        days, on the days you choose above.
      </p>

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit period' : 'New holiday period'}
        onClose={() => setDraft(null)}
        footer={
          <>
            {draft?.id && (
              <button className="btn-danger mr-auto" onClick={() => removePeriod(draft.id!)}>
                Delete
              </button>
            )}
            <button className="btn-ghost" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={savePeriod}>
              Save
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Name">
              <input
                className="input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Summer break"
              />
            </Field>
            <div className="flex gap-3">
              <Field label="Start">
                <input
                  type="date"
                  className="input"
                  value={draft.startDate}
                  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                />
              </Field>
              <Field label="End">
                <input
                  type="date"
                  className="input"
                  value={draft.endDate}
                  onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                />
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function WorkConfigCard({
  title,
  cfg,
  onChange,
}: {
  title: string
  cfg: HolidayWorkConfig
  onChange: (cfg: HolidayWorkConfig) => void
}) {
  return (
    <section className="card space-y-3">
      <h3 className="font-bold">{title}</h3>
      <Field label="Days">
        <WeekdayPicker
          value={cfg.daysOfWeek}
          onChange={(daysOfWeek: Weekday[]) => onChange({ ...cfg, daysOfWeek })}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Per day">
          <input
            type="number"
            min={1}
            className="input"
            value={cfg.sessionsPerDay}
            onChange={(e) =>
              onChange({ ...cfg, sessionsPerDay: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </Field>
        <Field label="Minutes">
          <input
            type="number"
            className="input"
            value={cfg.durationMin}
            onChange={(e) => onChange({ ...cfg, durationMin: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Points">
          <input
            type="number"
            className="input"
            value={cfg.points}
            onChange={(e) => onChange({ ...cfg, points: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>
      <Field label="Time">
        <input
          type="time"
          className="input w-40"
          value={cfg.anchorTime}
          onChange={(e) => onChange({ ...cfg, anchorTime: e.target.value })}
        />
      </Field>
    </section>
  )
}
