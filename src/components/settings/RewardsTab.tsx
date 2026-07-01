import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { rewardsRepo } from '../../repositories/content.repo'
import { Modal } from '../common/Modal'
import { Field, Toggle } from '../common/FormControls'
import { IconPicker } from '../common/IconPicker'
import type { Reward } from '../../domain/types'

type Draft = Omit<Reward, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
  limited: boolean
}

const emptyDraft = (): Draft => ({
  title: '',
  icon: '🎁',
  description: '',
  cost: 50,
  stock: null,
  limited: false,
  active: true,
})

export function RewardsTab() {
  const rewards = useLiveQuery(() => db.rewards.toArray(), []) ?? []
  const [draft, setDraft] = useState<Draft | null>(null)

  const save = async () => {
    if (!draft || !draft.title.trim()) return
    const now = Date.now()
    const { id, limited, ...rest } = draft
    const payload = { ...rest, stock: limited ? (rest.stock ?? 1) : null }
    if (id) await rewardsRepo.update(id, payload, now)
    else await rewardsRepo.create(payload, now)
    setDraft(null)
  }
  const remove = async (id: string) => {
    if (confirm('Delete this reward?')) {
      await rewardsRepo.remove(id)
      setDraft(null)
    }
  }

  return (
    <div className="space-y-3">
      {rewards.map((r) => (
        <button
          key={r.id}
          className="card flex w-full items-center gap-3 text-left"
          onClick={() => setDraft({ ...r, limited: r.stock !== null })}
        >
          <span className="text-3xl">{r.icon}</span>
          <div className="flex-1">
            <div className="font-semibold">{r.title}</div>
            <div className="text-sm text-slate-400">
              ⭐ {r.cost}
              {r.stock !== null ? ` · ${r.stock} left` : ''}
              {!r.active ? ' · hidden' : ''}
            </div>
          </div>
          <span className="text-2xl text-slate-400">›</span>
        </button>
      ))}

      <button className="btn-primary w-full" onClick={() => setDraft(emptyDraft())}>
        + Add reward
      </button>

      <Modal
        open={!!draft}
        title={draft?.id ? 'Edit reward' : 'New reward'}
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
                placeholder="Ice cream trip"
              />
            </Field>

            <Field label="Description (optional)">
              <input
                className="input"
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>

            <Field label="Cost (points)">
              <input
                type="number"
                className="input"
                value={draft.cost}
                onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) || 0 })}
              />
            </Field>

            <Toggle
              label="Limited stock"
              hint="Turn off for unlimited"
              checked={draft.limited}
              onChange={(v) => setDraft({ ...draft, limited: v })}
            />
            {draft.limited && (
              <Field label="Quantity available">
                <input
                  type="number"
                  className="input"
                  value={draft.stock ?? 1}
                  onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) || 0 })}
                />
              </Field>
            )}

            <Toggle
              label="Visible in store"
              checked={draft.active}
              onChange={(v) => setDraft({ ...draft, active: v })}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
