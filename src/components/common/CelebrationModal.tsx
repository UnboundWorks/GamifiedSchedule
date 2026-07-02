import { useUI } from '../../store/ui'

/** Shown after a level-up or newly earned badge(s). */
export function CelebrationModal() {
  const celebration = useUI((s) => s.celebration)
  const clear = useUI((s) => s.clearCelebration)
  if (!celebration) return null
  const { leveledUp, newLevel, badges } = celebration
  if (!leveledUp && badges.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={clear}
    >
      <div className="card w-full max-w-sm animate-pop-in text-center">
        {leveledUp && (
          <div className="mb-4">
            <div className="text-6xl">🎉</div>
            <h2 className="mt-2 text-2xl font-bold">Level Up!</h2>
            <p className="text-slate-500 dark:text-slate-400">
              You reached level {newLevel}
            </p>
          </div>
        )}
        {badges.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-lg font-semibold">New badge{badges.length > 1 ? 's' : ''}!</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {badges.map((b) => (
                <div key={b.id} className="flex w-24 flex-col items-center">
                  <span className="text-4xl">{b.icon}</span>
                  <span className="mt-1 text-sm font-medium">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button className="btn-primary w-full" onClick={clear}>
          Awesome!
        </button>
      </div>
    </div>
  )
}
