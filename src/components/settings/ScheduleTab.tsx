import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useProfiles } from '../../hooks/data'
import { scheduleRepo } from '../../repositories/content.repo'
import { Modal } from '../common/Modal'
import {
  Field,
  ModeToggle,
  ProfileMultiSelect,
  WeekdayPicker,
} from '../common/FormControls'
import { IconPicker } from '../common/IconPicker'
import { formatTime } from '../../lib/dates'
import type { ScheduleItem, ScheduleItemType, Weekday } from '../../domain/types'

type Draft = Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

const TYPES: ScheduleItemType[] = ['activity', 'meal', 'event', 'reading', 'math']

const emptyDraft = (): Draft => ({
  title: '',
  type: 'activity',
  icon: '📌',
  startTime: '15:00',
  endTime: '16:00',
  daysOfWeek: [1, 2, 3, 4, 5] as Weekday[],
  assignedProfileIds: [],
  schoolMode: true,
  holidayMode: true,
  active: true,
})

export function ScheduleTab() {
  const profiles = useProfiles() ?? []
  const items = useLiveQuery(() => db.scheduleItems.toArray(), []) ?? []
  const [draft, setDraft] = useState<Draft | null>(null)

  const save = async () => {
    if (!draft || !draft.title.trim()) return
    const now = Date.now()
    const { id, ...rest } = draft
    if (id) await scheduleRepo.update(id, rest, now)
    else await scheduleRepo.create(rest, now)
    setDraft(null)
  }
  const remove = async (id: string) => {
    if (confirm('Delete this schedule item?')) {
      await scheduleRepo.remove(id)
      setDraft(null)
    }
  }

  const sorted = [...items].sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="space-y-3">
      {sorted.map((s) => (
        <button
          key={s.id}
          className="card flex w-full items-center gap-3 text-left"
          onClick={() => setDraft({ ...s })}
        >
          <span className="text-3xl">{s.icon}</span>
          <div className="flex-1">
            <div className="font-semibold">{s.title}</div>
            <div className="text-sm text-slate-400">
              {formatTime(s.startTime)}
              {s.endTime ? `–${formatTime(s.endTime)}` : ''} · {s.type}
            </div>
          </div>
          <span className="text-2xl text-slate-400">›</span>
        </button>
      ))}

      <button className="btn-primary w-full" onClick={() => setDraft(emptyDraft())}>
        + Add schedule item
      </button>

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit item' : 'New item'}
        onClose={() => setDraft(null)}
        footer={
          <>
            {draft?.id && (
              <button className="btn-danger mr-auto" onClick={() => remove(draft.id!)}>
                Delete
              </button>
            )}
            <button className="btn-ghost" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save}>
              Save
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Icon">
              <IconPicker
                value={draft.icon}
                onChange={(icon) => setDraft({ ...draft, icon })}
              />
            </Field>
            <Field label="Title">
              <input
                className="input"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Soccer practice"
              />
            </Field>

            <Field label="Type">
              <select
                className="input"
                value={draft.type}
                onChange={(e) =>
                  setDraft({ ...draft, type: e.target.value as ScheduleItemType })
                }
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex gap-3">
              <Field label="Start">
                <input
                  type="time"
                  className="input"
                  value={draft.startTime}
                  onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                />
              </Field>
              <Field label="End">
                <input
                  type="time"
                  className="input"
                  value={draft.endTime ?? ''}
                  onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Days">
              <WeekdayPicker
                value={draft.daysOfWeek}
                onChange={(v) => setDraft({ ...draft, daysOfWeek: v })}
              />
            </Field>

            <Field label="Applies during">
              <ModeToggle
                schoolMode={draft.schoolMode}
                holidayMode={draft.holidayMode}
                onChange={(v) => setDraft({ ...draft, ...v })}
              />
            </Field>

            <Field label="For (none = everyone)">
              <ProfileMultiSelect
                profiles={profiles}
                value={draft.assignedProfileIds}
                onChange={(v) => setDraft({ ...draft, assignedProfileIds: v })}
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
