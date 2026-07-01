import { useUI } from '../../store/ui'

/** Bottom-centered transient toasts for point/badge feedback. */
export function Toaster() {
  const toasts = useUI((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-pop-in rounded-full bg-slate-900/90 px-5 py-3 text-base font-semibold text-white shadow-lg dark:bg-white/90 dark:text-slate-900"
        >
          {t.emoji && <span className="mr-1">{t.emoji}</span>}
          {t.message}
        </div>
      ))}
    </div>
  )
}
