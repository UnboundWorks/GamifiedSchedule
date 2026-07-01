import { useNavigate } from 'react-router-dom'
import type { Profile, Settings, TaskInstance } from '../domain/types'
import { formatTime } from '../lib/dates'
import { completeInstance } from '../lib/complete'

interface TaskItemProps {
  instance: TaskInstance
  profile: Profile
  settings: Settings
  readOnly?: boolean
}

function statusOf(instance: TaskInstance) {
  const c = instance.completion
  if (!c) return 'open' as const
  if (c.status === 'pending-approval') return 'pending' as const
  if (c.status === 'rejected') return 'rejected' as const
  return 'done' as const
}

export function TaskItem({ instance, profile, settings, readOnly }: TaskItemProps) {
  const navigate = useNavigate()
  const status = statusOf(instance)
  const isRoutine = instance.category === 'routine'

  const onClick = () => {
    if (readOnly) return
    if (isRoutine) {
      navigate(`/routine/${instance.sourceId}`)
      return
    }
    void completeInstance(profile, instance, settings)
  }

  return (
    <button
      onClick={onClick}
      disabled={readOnly}
      className={`card flex w-full items-center gap-3 text-left transition active:scale-[0.99] ${
        status === 'done' ? 'opacity-60' : ''
      }`}
    >
      <span className="text-3xl">{instance.icon}</span>
      <div className="min-w-0 flex-1">
        <div
          className={`font-semibold ${
            status === 'done' ? 'line-through' : ''
          }`}
        >
          {instance.title}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          {instance.time && <span>{formatTime(instance.time)}</span>}
          <span className="text-amber-500">⭐ {instance.points}</span>
          {instance.requiresApproval && status !== 'done' && (
            <span className="text-xs">needs approval</span>
          )}
        </div>
      </div>
      {isRoutine ? (
        <span className="text-2xl text-slate-400">›</span>
      ) : (
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg ${
            status === 'done'
              ? 'border-green-500 bg-green-500 text-white'
              : status === 'pending'
                ? 'border-amber-400 text-amber-500'
                : status === 'rejected'
                  ? 'border-red-400 text-red-500'
                  : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {status === 'done' ? '✓' : status === 'pending' ? '⏳' : status === 'rejected' ? '✕' : ''}
        </span>
      )}
    </button>
  )
}
