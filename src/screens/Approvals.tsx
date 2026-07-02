import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import { useSession } from '../store/session'
import { getSettings } from '../repositories/settings.repo'
import {
  approveCompletion,
  rejectCompletion,
} from '../repositories/completions.repo'
import { resolveRedemption } from '../repositories/redemptions.repo'
import { Loading } from './Home'
import { useUI } from '../store/ui'

export function Approvals() {
  const profile = useSession((s) => s.activeProfile)!
  const navigate = useNavigate()
  const pushToast = useUI((s) => s.pushToast)

  const data = useLiveQuery(async () => {
    const [completions, redemptions, profiles] = await Promise.all([
      db.completions.where('status').equals('pending-approval').toArray(),
      db.redemptions.where('status').equals('pending').toArray(),
      db.profiles.toArray(),
    ])
    return { completions, redemptions, profiles }
  }, [])

  if (!data) return <Loading />
  const nameOf = (id: string) =>
    data.profiles.find((p) => p.id === id)?.name ?? 'Someone'

  const approveTask = async (id: string) => {
    const settings = await getSettings()
    const badges = await approveCompletion(id, profile.id, settings)
    pushToast(badges.length ? 'Approved · badge earned!' : 'Approved', '✅')
  }

  const total = data.completions.length + data.redemptions.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl dark:bg-slate-800"
          onClick={() => navigate('/settings')}
        >
          ‹
        </button>
        <h1 className="text-2xl font-bold">Approvals</h1>
      </div>

      {total === 0 && (
        <div className="card text-center text-slate-500">
          Nothing waiting for approval. 🎉
        </div>
      )}

      {data.completions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Chores
          </h2>
          {data.completions.map((c) => (
            <div key={c.id} className="card flex items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold">{c.label ?? 'Task'}</div>
                <div className="text-sm text-slate-500">
                  {nameOf(c.profileId)} · +{c.pointsAwarded} ⭐ · {c.date}
                </div>
              </div>
              <button
                className="btn-danger !min-h-[38px] !py-1"
                onClick={() => rejectCompletion(c.id, profile.id)}
              >
                Reject
              </button>
              <button
                className="btn-primary !min-h-[38px] !py-1"
                onClick={() => approveTask(c.id)}
              >
                Approve
              </button>
            </div>
          ))}
        </section>
      )}

      {data.redemptions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Reward redemptions
          </h2>
          {data.redemptions.map((r) => (
            <div key={r.id} className="card flex items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold">{r.rewardTitle}</div>
                <div className="text-sm text-slate-500">
                  {nameOf(r.profileId)} · {r.cost} ⭐
                </div>
              </div>
              <button
                className="btn-danger !min-h-[38px] !py-1"
                onClick={() => resolveRedemption(r.id, 'rejected', profile.id)}
              >
                Reject
              </button>
              <button
                className="btn-primary !min-h-[38px] !py-1"
                onClick={() => resolveRedemption(r.id, 'approved', profile.id)}
              >
                Approve
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
