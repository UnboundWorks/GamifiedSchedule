import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useProfiles } from '../../hooks/data'
import { choresRepo } from '../../repositories/content.repo'
import { Modal } from '../common/Modal'
import {
  Field,
  ModeToggle,
  ProfileMultiSelect,
  Toggle,
  WeekdayPicker,
} from '../common/FormControls'
import { IconPicker } from '../common/IconPicker'
import type { Chore, ChoreCadence, Weekday } from '../../domain/types'

type Draft = Omit<Chore, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

const emptyDraft = (): Draft => ({
  title: '',
  icon: '🧹',
  cadence: 'daily',
  daysOfWeek: [1, 2, 3, 4, 5] as Weekday[],
  assignedProfileIds: [],
  points: 10,
  requiresApproval: false,
  schoolMode: true,
  holidayMode: true,
  active: true,
})

export function ChoresTab() {
  const profiles = useProfiles() ?? []
  const chores = useLiveQuery(() => db.chores.toArray(), []) ?? []
  const [draft, setDraft] = useState<Draft | null>(null)

  const save = async () => {
    if (!draft || !draft.title.trim()) return
    const now = Date.now()
    const { id, ...rest } = draft
    if (id) await choresRepo.update(id, rest, now)
    else await choresRepo.create(rest, now)
    setDraft(null)
  }
  const remove = async (id: string) => {
    if (confirm('Delete this chore?')) {
      await choresRepo.remove(id)
      setDraft(null)
    }
  }

  return (
    <div className="space-y-3">
      {chores.map((c) => (
        <button
          key={c.id}
          className="card flex w-full items-center gap-3 text-left"
          onClick={() => setDraft({ ...c })}
        >
          <span className="text-3xl">{c.icon}</span>
          <div className="flex-1">
            <div className="font-semibold">{c.title}</div>
            <div className="text-sm text-slate-400">
              {c.cadence} · ⭐ {c.points}
              {c.requiresApproval ? ' · needs approval' : ''}
            </div>
          </div>
          <span className="text-2xl text-slate-400">›</span>
        </button>
      ))}

      <button className="btn-primary w-full" onClick={() => setDraft(emptyDraft())}>
        + Add chore
      </button>

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit chore' : 'New chore'}
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
                placeholder="Take out trash"
              />
            </Field>

            <div className="flex gap-3">
              <Field label="Cadence">
                <div className="flex gap-2">
                  {(['daily', 'weekly'] as ChoreCadence[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDraft({ ...draft, cadence: c })}
                      className={`rounded-lg px-4 py-2 font-semibold capitalize ${
                        draft.cadence === c
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Points">
                <input
                  type="number"
                  className="input w-24"
                  value={draft.points}
                  onChange={(e) =>
                    setDraft({ ...draft, points: Number(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>

            <Field label={draft.cadence === 'daily' ? 'Repeats on' : 'Due on'}>
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

            <Field label="Assigned to (none = everyone)">
              <ProfileMultiSelect
                profiles={profiles}
                value={draft.assignedProfileIds}
                onChange={(v) => setDraft({ ...draft, assignedProfileIds: v })}
              />
            </Field>

            <Toggle
              label="Requires parent approval"
              hint="Points are held until a parent approves"
              checked={draft.requiresApproval}
              onChange={(v) => setDraft({ ...draft, requiresApproval: v })}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
