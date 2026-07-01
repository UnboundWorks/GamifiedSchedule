import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useProfiles } from '../../hooks/data'
import { routinesRepo } from '../../repositories/content.repo'
import { uid } from '../../lib/id'
import { Modal } from '../common/Modal'
import {
  Field,
  ModeToggle,
  ProfileMultiSelect,
  WeekdayPicker,
} from '../common/FormControls'
import type { Routine, RoutineStep, Weekday } from '../../domain/types'

type Draft = Omit<Routine, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

const emptyDraft = (): Draft => ({
  name: '',
  icon: '⭐',
  anchorTime: '07:00',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as Weekday[],
  schoolMode: true,
  holidayMode: true,
  assignedProfileIds: [],
  steps: [],
  active: true,
})

export function RoutinesTab() {
  const profiles = useProfiles() ?? []
  const routines = useLiveQuery(() => db.routines.toArray(), []) ?? []
  const [draft, setDraft] = useState<Draft | null>(null)

  const save = async () => {
    if (!draft || !draft.name.trim()) return
    const now = Date.now()
    const { id, ...rest } = draft
    if (id) await routinesRepo.update(id, rest, now)
    else await routinesRepo.create(rest, now)
    setDraft(null)
  }

  const remove = async (id: string) => {
    if (confirm('Delete this routine?')) {
      await routinesRepo.remove(id)
      setDraft(null)
    }
  }

  const setStep = (i: number, patch: Partial<RoutineStep>) => {
    if (!draft) return
    const steps = draft.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    setDraft({ ...draft, steps })
  }
  const addStep = () => {
    if (!draft) return
    setDraft({
      ...draft,
      steps: [
        ...draft.steps,
        { id: uid(), order: draft.steps.length, title: '', icon: '•' },
      ],
    })
  }
  const moveStep = (i: number, dir: -1 | 1) => {
    if (!draft) return
    const j = i + dir
    if (j < 0 || j >= draft.steps.length) return
    const steps = [...draft.steps]
    ;[steps[i], steps[j]] = [steps[j], steps[i]]
    steps.forEach((s, idx) => (s.order = idx))
    setDraft({ ...draft, steps })
  }
  const removeStep = (i: number) => {
    if (!draft) return
    setDraft({ ...draft, steps: draft.steps.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      {routines.map((r) => (
        <button
          key={r.id}
          className="card flex w-full items-center gap-3 text-left"
          onClick={() => setDraft({ ...r })}
        >
          <span className="text-3xl">{r.icon}</span>
          <div className="flex-1">
            <div className="font-semibold">{r.name}</div>
            <div className="text-sm text-slate-400">
              {r.anchorTime} · {r.steps.length} steps
            </div>
          </div>
          <span className="text-2xl text-slate-400">›</span>
        </button>
      ))}

      <button className="btn-primary w-full" onClick={() => setDraft(emptyDraft())}>
        + Add routine
      </button>

      <Modal
        open={!!draft}
        wide
        title={draft?.id ? 'Edit routine' : 'New routine'}
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
            <div className="flex gap-3">
              <Field label="Icon">
                <input
                  className="input w-20 text-center text-2xl"
                  value={draft.icon}
                  onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                />
              </Field>
              <div className="flex-1">
                <Field label="Name">
                  <input
                    className="input"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Morning Routine"
                  />
                </Field>
              </div>
              <Field label="Time">
                <input
                  type="time"
                  className="input w-32"
                  value={draft.anchorTime}
                  onChange={(e) => setDraft({ ...draft, anchorTime: e.target.value })}
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

            <Field label="Assigned to (none = everyone)">
              <ProfileMultiSelect
                profiles={profiles}
                value={draft.assignedProfileIds}
                onChange={(v) => setDraft({ ...draft, assignedProfileIds: v })}
              />
            </Field>

            <div>
              <span className="label">Steps</span>
              <div className="space-y-2">
                {draft.steps.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <input
                      className="input w-14 text-center text-xl"
                      value={s.icon ?? ''}
                      onChange={(e) => setStep(i, { icon: e.target.value })}
                    />
                    <input
                      className="input flex-1"
                      value={s.title}
                      placeholder={`Step ${i + 1}`}
                      onChange={(e) => setStep(i, { title: e.target.value })}
                    />
                    <button
                      className="px-2 text-lg"
                      onClick={() => moveStep(i, -1)}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="px-2 text-lg"
                      onClick={() => moveStep(i, 1)}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className="px-2 text-lg text-red-500"
                      onClick={() => removeStep(i)}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn-ghost mt-2 w-full" onClick={addStep}>
                + Add step
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
