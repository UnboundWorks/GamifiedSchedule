import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSession } from '../store/session'
import { useProfileStats } from '../hooks/data'
import { redeemReward, listRedemptionsForProfile } from '../repositories/redemptions.repo'
import { Loading } from './Home'
import { Modal } from '../components/common/Modal'
import { useUI } from '../store/ui'
import type { Reward } from '../domain/types'

export function Rewards() {
  const profile = useSession((s) => s.activeProfile)!
  const stats = useProfileStats(profile)
  const pushToast = useUI((s) => s.pushToast)
  const [confirm, setConfirm] = useState<Reward | null>(null)

  const rewards = useLiveQuery(
    () => db.rewards.filter((r) => r.active).toArray(),
    [],
  )
  const myRedemptions = useLiveQuery(
    () => listRedemptionsForProfile(profile.id),
    [profile.id],
  )

  if (!rewards || !stats) return <Loading />

  const doRedeem = async (reward: Reward) => {
    setConfirm(null)
    const res = await redeemReward(profile.id, reward.id)
    if (res.ok) {
      pushToast(
        res.redemption?.status === 'pending'
          ? 'Requested! Waiting for parent approval'
          : `Redeemed ${reward.title}!`,
        '🎁',
      )
    } else {
      pushToast(res.reason ?? 'Could not redeem', '⚠️')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reward Store</h1>
        <span className="text-lg font-bold text-amber-500">⭐ {stats.points}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rewards.map((r) => {
          const affordable = stats.points >= r.cost
          const outOfStock = r.stock !== null && r.stock <= 0
          return (
            <button
              key={r.id}
              disabled={!affordable || outOfStock}
              onClick={() => setConfirm(r)}
              className="card flex flex-col items-center gap-1 py-5 text-center disabled:opacity-50"
            >
              <span className="text-4xl">{r.icon}</span>
              <span className="text-sm font-semibold">{r.title}</span>
              {r.description && (
                <span className="text-xs text-slate-400">{r.description}</span>
              )}
              <span className="mt-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-200">
                ⭐ {r.cost}
              </span>
              {outOfStock && (
                <span className="text-xs text-red-500">Out of stock</span>
              )}
              {r.stock !== null && !outOfStock && (
                <span className="text-xs text-slate-400">{r.stock} left</span>
              )}
            </button>
          )
        })}
        {rewards.length === 0 && (
          <div className="card col-span-full text-center text-slate-500">
            No rewards yet. A parent can add some in Settings.
          </div>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          My redemptions
        </h2>
        {(myRedemptions ?? []).length === 0 ? (
          <p className="text-sm text-slate-400">Nothing redeemed yet.</p>
        ) : (
          (myRedemptions ?? []).map((r) => (
            <div key={r.id} className="card flex items-center justify-between py-3">
              <span>{r.rewardTitle}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  r.status === 'pending'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
                    : r.status === 'rejected'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                }`}
              >
                {r.status}
              </span>
            </div>
          ))
        )}
      </section>

      <Modal
        open={!!confirm}
        title="Redeem reward?"
        onClose={() => setConfirm(null)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={() => confirm && doRedeem(confirm)}>
              Redeem for ⭐ {confirm?.cost}
            </button>
          </>
        }
      >
        {confirm && (
          <div className="text-center">
            <div className="text-5xl">{confirm.icon}</div>
            <p className="mt-2 font-semibold">{confirm.title}</p>
            <p className="text-sm text-slate-500">
              This will cost {confirm.cost} points.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
