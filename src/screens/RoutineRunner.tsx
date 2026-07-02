import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../store/session'
import { useDayInstances, useSettings } from '../hooks/data'
import { ProgressBar } from '../components/common/ProgressBar'
import { completeInstance } from '../lib/complete'
import { todayStr } from '../lib/dates'
import { Loading } from './Home'

export function RoutineRunner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const profile = useSession((s) => s.activeProfile)!
  const settings = useSettings()
  const instances = useDayInstances(profile, todayStr())
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const instance = useMemo(
    () => instances?.find((i) => i.sourceType === 'routine' && i.sourceId === id),
    [instances, id],
  )

  if (!settings || !instances) return <Loading />

  if (!instance) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Routine not found.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/home')}>
          Back
        </button>
      </div>
    )
  }

  const steps = instance.steps ?? []
  const alreadyDone =
    instance.completion &&
    ['done', 'approved'].includes(instance.completion.status)
  const allChecked = steps.length > 0 && steps.every((s) => checked.has(s.id))

  const toggleStep = (stepId: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(stepId) ? next.delete(stepId) : next.add(stepId)
      return next
    })
  }

  const finish = async () => {
    await completeInstance(profile, instance, settings)
    navigate('/home')
  }

  const undo = async () => {
    await completeInstance(profile, instance, settings)
    setChecked(new Set())
  }

  return (
    <div className="safe-top safe-bottom flex min-h-full flex-col bg-slate-100 dark:bg-slate-950">
      <header className="flex items-center gap-3 p-4">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl dark:bg-slate-800"
          onClick={() => navigate('/home')}
        >
          ‹
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {instance.icon} {instance.title}
          </h1>
        </div>
      </header>

      {alreadyDone ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="text-7xl">✅</div>
          <h2 className="text-2xl font-bold">All done!</h2>
          <p className="text-slate-500">You finished this routine today.</p>
          <div className="flex gap-3">
            <button className="btn-ghost" onClick={undo}>
              Undo
            </button>
            <button className="btn-primary" onClick={() => navigate('/home')}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-4">
            <ProgressBar ratio={steps.length ? checked.size / steps.length : 0} />
            <p className="mt-1 text-center text-sm text-slate-500">
              {checked.size} / {steps.length} steps
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-32">
            {steps.map((step) => {
              const on = checked.has(step.id)
              return (
                <button
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={`card flex w-full items-center gap-4 text-left transition active:scale-[0.99] ${
                    on ? 'opacity-70' : ''
                  }`}
                >
                  <span className="text-4xl">{step.icon ?? '•'}</span>
                  <span
                    className={`flex-1 text-lg font-semibold ${
                      on ? 'line-through' : ''
                    }`}
                  >
                    {step.title}
                  </span>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl ${
                      on
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {on ? '✓' : ''}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="safe-bottom fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <button
              className="btn-primary mx-auto flex w-full max-w-md"
              disabled={!allChecked}
              onClick={finish}
            >
              {allChecked ? `Finish · +${instance.points} ⭐` : 'Complete all steps'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
