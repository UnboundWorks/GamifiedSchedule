import { useState } from 'react'
import { useProfiles } from '../../hooks/data'
import {
  createProfile,
  deleteProfile,
  setProfilePin,
  updateProfile,
} from '../../repositories/profiles.repo'
import { Modal } from '../common/Modal'
import { Field, Toggle } from '../common/FormControls'
import type { Profile, Role } from '../../domain/types'

const COLORS = ['#4f46e5', '#f97316', '#0ea5e9', '#22c55e', '#ec4899', '#eab308', '#8b5cf6']
const AVATARS = ['👦', '👧', '🧒', '🦊', '🐼', '🦁', '🐵', '🐯', '🦄', '🐲', '👪', '👩', '👨']

interface Draft {
  id?: string
  role: Role
  name: string
  avatar: string
  color: string
  pin: string
  clearPin: boolean
  gameModeOptIn: boolean
}

const emptyDraft = (role: Role): Draft => ({
  role,
  name: '',
  avatar: role === 'parent' ? '👪' : '🦊',
  color: COLORS[0],
  pin: '',
  clearPin: false,
  gameModeOptIn: false,
})

export function ProfilesTab() {
  const profiles = useProfiles() ?? []
  const [draft, setDraft] = useState<Draft | null>(null)

  const openNew = (role: Role) => setDraft(emptyDraft(role))
  const openEdit = (p: Profile) =>
    setDraft({
      id: p.id,
      role: p.role,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      pin: '',
      clearPin: false,
      gameModeOptIn: p.gameModeOptIn,
    })

  const save = async () => {
    if (!draft || !draft.name.trim()) return
    if (draft.id) {
      await updateProfile(draft.id, {
        name: draft.name.trim(),
        avatar: draft.avatar,
        color: draft.color,
        role: draft.role,
        gameModeOptIn: draft.gameModeOptIn,
      })
      if (draft.clearPin) await setProfilePin(draft.id, null)
      else if (draft.pin) await setProfilePin(draft.id, draft.pin)
    } else {
      await createProfile({
        role: draft.role,
        name: draft.name.trim(),
        avatar: draft.avatar,
        color: draft.color,
        pin: draft.pin || null,
        gameModeOptIn: draft.gameModeOptIn,
      })
    }
    setDraft(null)
  }

  const remove = async (p: Profile) => {
    const parents = profiles.filter((x) => x.role === 'parent')
    if (p.role === 'parent' && parents.length <= 1) {
      alert('You need at least one parent account.')
      return
    }
    if (confirm(`Delete ${p.name}? This removes their progress and history.`)) {
      await deleteProfile(p.id)
      setDraft(null)
    }
  }

  return (
    <div className="space-y-3">
      {profiles.map((p) => (
        <div key={p.id} className="card flex items-center gap-3">
          <span className="text-3xl">{p.avatar}</span>
          <div className="flex-1">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-slate-400">
              {p.role} · Lv {p.level} · ⭐ {p.points}
              {p.pinHash ? ' · 🔒' : ''}
            </div>
          </div>
          <button className="btn-ghost !min-h-[38px] !py-1" onClick={() => openEdit(p)}>
            Edit
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={() => openNew('child')}>
          + Add child
        </button>
        <button className="btn-ghost flex-1" onClick={() => openNew('parent')}>
          + Add parent
        </button>
      </div>

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit profile' : 'New profile'}
        onClose={() => setDraft(null)}
        footer={
          <>
            {draft?.id && (
              <button
                className="btn-danger mr-auto"
                onClick={() => {
                  const p = profiles.find((x) => x.id === draft.id)
                  if (p) void remove(p)
                }}
              >
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
            <Field label="Name">
              <input
                className="input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Alex"
              />
            </Field>

            <Field label="Role">
              <div className="flex gap-2">
                {(['child', 'parent'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDraft({ ...draft, role: r })}
                    className={`flex-1 rounded-lg py-2 font-semibold capitalize ${
                      draft.role === r
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Avatar">
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setDraft({ ...draft, avatar: a })}
                    className={`h-11 w-11 rounded-lg text-2xl ${
                      draft.avatar === a
                        ? 'bg-brand-100 ring-2 ring-brand-500 dark:bg-brand-900'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Color">
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDraft({ ...draft, color: c })}
                    className={`h-9 w-9 rounded-full ${
                      draft.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Field>

            <Field label={draft.id ? 'New PIN (leave blank to keep)' : 'PIN (optional)'}>
              <input
                className="input"
                inputMode="numeric"
                value={draft.pin}
                onChange={(e) =>
                  setDraft({ ...draft, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })
                }
                placeholder="4–6 digits"
              />
            </Field>
            {draft.id && (
              <Toggle
                label="Remove PIN"
                hint="Allow sign-in without a PIN"
                checked={draft.clearPin}
                onChange={(v) => setDraft({ ...draft, clearPin: v })}
              />
            )}

            {draft.role === 'parent' && (
              <Toggle
                label="Join game mode"
                hint="Earn points and take part in challenges with the kids"
                checked={draft.gameModeOptIn}
                onChange={(v) => setDraft({ ...draft, gameModeOptIn: v })}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
