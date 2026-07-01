import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useSession, isParent } from '../store/session'
import { Loading } from './Home'
import { ProgressBar } from '../components/common/ProgressBar'
import { challengeStanding, challengeIsLive } from '../domain/challenges'
import { closeChallenge } from '../repositories/challenges.repo'
import { todayStr } from '../lib/dates'
import { useUI } from '../store/ui'
import type { Challenge, Completion } from '../domain/types'

export function Challenges() {
  const profile = useSession((s) => s.activeProfile)!
  const parent = isParent(profile)
  const pushToast = useUI((s) => s.pushToast)
  const today = todayStr()

  const data = useLiveQuery(async () => {
    const [challenges, profiles, completions] = await Promise.all([
      db.challenges.toArray(),
      db.profiles.toArray(),
      db.completions.toArray(),
    ])
    return { challenges, profiles, completions }
  }, [])

  if (!data) return <Loading />

  const profileById = new Map(data.profiles.map((p) => [p.id, p]))
  const active = data.challenges.filter((c) => c.active)
  const past = data.challenges.filter((c) => !c.active)

  const close = async (c: Challenge) => {
    const res = await closeChallenge(c.id)
    pushToast(
      res.winners.length > 0
        ? `Awarded ${res.winners.length} winner(s)!`
        : 'Challenge closed (no winners)',
      '🏁',
    )
  }

  const renderChallenge = (c: Challenge, live: boolean) => (
    <div key={c.id} className="card space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">
            {c.icon} {c.title}
          </h3>
          {c.description && (
            <p className="text-sm text-slate-500">{c.description}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            {c.startDate} → {c.endDate} · Goal: {c.goal} {c.metric} · 🎁 {c.bonusPoints} pts
          </p>
        </div>
        {parent && live && (
          <button className="btn-ghost !min-h-[36px] !py-1 text-sm" onClick={() => close(c)}>
            Close & award
          </button>
        )}
      </div>
      <div className="space-y-2">
        {c.participantProfileIds.map((pid) => {
          const p = profileById.get(pid)
          if (!p) return null
          const standing = challengeStanding(
            c,
            pid,
            data.completions.filter((x: Completion) => x.profileId === pid),
          )
          return (
            <div key={pid}>
              <div className="mb-0.5 flex items-center justify-between text-sm">
                <span>
                  {p.avatar} {p.name}
                </span>
                <span className={standing.met ? 'font-bold text-green-500' : 'text-slate-500'}>
                  {standing.progress}/{standing.goal}
                  {standing.met && ' ✓'}
                </span>
              </div>
              <ProgressBar ratio={standing.ratio} color={p.color} />
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quests & Challenges</h1>

      {active.length === 0 ? (
        <div className="card text-center text-slate-500">
          No active challenges.
          {parent && ' Create one in Settings → Gamification.'}
        </div>
      ) : (
        <section className="space-y-3">
          {active.map((c) => renderChallenge(c, challengeIsLive(c, today)))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Finished
          </h2>
          {past.map((c) => renderChallenge(c, false))}
        </section>
      )}
    </div>
  )
}
