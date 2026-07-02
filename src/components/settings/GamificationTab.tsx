import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { useProfiles, useSettings } from '../../hooks/data'
import { updateSettings } from '../../repositories/settings.repo'
import { challengesRepo } from '../../repositories/content.repo'
import { Modal } from '../common/Modal'
import { Field, ProfileMultiSelect, Toggle } from '../common/FormControls'
import { todayStr, addDaysStr } from '../../lib/dates'
import type {
  Challenge,
  ChallengeMetric,
  PointValues,
  Settings,
} from '../../domain/types'

type ChallengeDraft = Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

const POINT_FIELDS: { key: keyof PointValues; label: string }[] = [
  { key: 'perChore', label: 'Per chore' },
  { key: 'perRoutineStep', label: 'Per routine step' },
  { key: 'routineCompletionBonus', label: 'Routine finish bonus' },
  { key: 'perScheduleItem', label: 'Per schedule item' },
  { key: 'onTimeBonus', label: 'On-time bonus' },
  { key: 'streakDailyBonus', label: 'Daily streak bonus' },
]

const METRICS: ChallengeMetric[] = ['points', 'completions', 'streak']

export function GamificationTab() {
  const settings = useSettings()
  const profiles = useProfiles() ?? []
  const challenges = useLiveQuery(() => db.challenges.toArray(), []) ?? []
  const [draft, setDraft] = useState<ChallengeDraft | null>(null)

  if (!settings) return null

  const setPoint = (key: keyof PointValues, value: number) =>
    updateSettings({ points: { ...settings.points, [key]: value } } as Partial<Settings>)

  const setCurve = (patch: Partial<Settings['levelCurve']>) =>
    updateSettings({ levelCurve: { ...settings.levelCurve, ...patch } } as Partial<Settings>)

  const newChallenge = (): ChallengeDraft => ({
    title: '',
    icon: '🏁',
    description: '',
    startDate: todayStr(),
    endDate: addDaysStr(todayStr(), 7),
    metric: 'completions',
    goal: 10,
    bonusPoints: 100,
    participantProfileIds: profiles.filter((p) => p.role === 'child').map((p) => p.id),
    active: true,
  })

  const saveChallenge = async () => {
    if (!draft || !draft.title.trim()) return
    const now = Date.now()
    const { id, ...rest } = draft
    if (id) await challengesRepo.update(id, rest, now)
    else await challengesRepo.create(rest, now)
    setDraft(null)
  }
  const removeChallenge = async (id: string) => {
    if (confirm('Delete this challenge?')) {
      await challengesRepo.remove(id)
      setDraft(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <Toggle
          label="Parent game mode"
          hint="Let opted-in parents earn points and join challenges"
          checked={settings.parentGameMode}
          onChange={(v) => updateSettings({ parentGameMode: v })}
        />
      </section>

      <section className="card space-y-3">
        <h3 className="font-bold">Point values</h3>
        <div className="grid grid-cols-2 gap-3">
          {POINT_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                type="number"
                className="input"
                value={settings.points[f.key]}
                onChange={(e) => setPoint(f.key, Number(e.target.value) || 0)}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h3 className="font-bold">Level curve</h3>
        <p className="text-sm text-slate-400">
          XP for level n = base × (n−1)^factor. Higher values = slower leveling.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base">
            <input
              type="number"
              className="input"
              value={settings.levelCurve.base}
              onChange={(e) => setCurve({ base: Number(e.target.value) || 1 })}
            />
          </Field>
          <Field label="Factor">
            <input
              type="number"
              step="0.1"
              className="input"
              value={settings.levelCurve.factor}
              onChange={(e) => setCurve({ factor: Number(e.target.value) || 1 })}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-bold">Challenges</h3>
        {challenges.map((c) => (
          <button
            key={c.id}
            className="card flex w-full items-center gap-3 text-left"
            onClick={() => setDraft({ ...c })}
          >
            <span className="text-2xl">{c.icon}</span>
            <div className="flex-1">
              <div className="font-semibold">{c.title}</div>
              <div className="text-sm text-slate-400">
                {c.goal} {c.metric} · 🎁 {c.bonusPoints}
                {!c.active ? ' · finished' : ''}
              </div>
            </div>
            <span className="text-2xl text-slate-400">›</span>
          </button>
        ))}
        <button className="btn-primary w-full" onClick={() => setDraft(newChallenge())}>
          + Add challenge
        </button>
      </section>

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit challenge' : 'New challenge'}
        onClose={() => setDraft(null)}
        footer={
          <>
            {draft?.id && (
              <button className="btn-danger mr-auto" onClick={() => removeChallenge(draft.id!)}>
                Delete
              </button>
            )}
            <button className="btn-ghost" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={saveChallenge}>
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
                <Field label="Title">
                  <input
                    className="input"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Weekend sprint"
                  />
                </Field>
              </div>
            </div>

            <Field label="Description (optional)">
              <input
                className="input"
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
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

            <div className="flex gap-3">
              <Field label="Metric">
                <select
                  className="input"
                  value={draft.metric}
                  onChange={(e) =>
                    setDraft({ ...draft, metric: e.target.value as ChallengeMetric })
                  }
                >
                  {METRICS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Goal">
                <input
                  type="number"
                  className="input"
                  value={draft.goal}
                  onChange={(e) => setDraft({ ...draft, goal: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Bonus">
                <input
                  type="number"
                  className="input"
                  value={draft.bonusPoints}
                  onChange={(e) =>
                    setDraft({ ...draft, bonusPoints: Number(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>

            <Field label="Participants">
              <ProfileMultiSelect
                profiles={profiles}
                value={draft.participantProfileIds}
                onChange={(v) => setDraft({ ...draft, participantProfileIds: v })}
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
