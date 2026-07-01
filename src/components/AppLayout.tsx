import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSession, isParent } from '../store/session'
import {
  usePendingApprovalsCount,
  useProfileStats,
  useSettings,
  useSyncActiveProfile,
} from '../hooks/data'
import { ProgressBar } from './common/ProgressBar'
import { Confetti } from './common/Confetti'
import { Toaster } from './common/Toaster'
import { CelebrationModal } from './common/CelebrationModal'
import { useApplyTheme } from '../hooks/useTheme'

interface NavItem {
  to: string
  label: string
  icon: string
  parentOnly?: boolean
}

const NAV: NavItem[] = [
  { to: '/home', label: 'Today', icon: '🏠' },
  { to: '/week', label: 'Week', icon: '🗓️' },
  { to: '/chores', label: 'Chores', icon: '🧹' },
  { to: '/rewards', label: 'Rewards', icon: '🎁' },
  { to: '/challenges', label: 'Quests', icon: '🏁' },
  { to: '/settings', label: 'Settings', icon: '⚙️', parentOnly: true },
]

export function AppLayout() {
  const profile = useSession((s) => s.activeProfile)
  const signOut = useSession((s) => s.signOut)
  const touch = useSession((s) => s.touch)
  const settings = useSettings()
  const stats = useProfileStats(profile)
  const pending = usePendingApprovalsCount()
  const navigate = useNavigate()
  useSyncActiveProfile()
  useApplyTheme()

  // Auto-lock after inactivity.
  useEffect(() => {
    const handler = () => touch()
    const events = ['pointerdown', 'keydown']
    events.forEach((e) => window.addEventListener(e, handler))
    const iv = setInterval(() => {
      const mins = settings?.autoLockMinutes ?? 5
      if (mins <= 0) return
      const idle = Date.now() - useSession.getState().lastActivity
      if (idle > mins * 60_000) {
        signOut()
        navigate('/')
      }
    }, 15_000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler))
      clearInterval(iv)
    }
  }, [settings?.autoLockMinutes, signOut, touch, navigate])

  if (!profile) return null
  const parent = isParent(profile)
  const items = NAV.filter((n) => !n.parentOnly || parent)

  return (
    <div className="safe-top flex min-h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="text-3xl">{profile.avatar}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-bold">{profile.name}</span>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                Lv {stats?.level ?? profile.level}
              </span>
              {stats && stats.streak > 0 && (
                <span className="text-sm">🔥 {stats.streak}</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <ProgressBar ratio={stats?.levelRatio ?? 0} className="h-2 flex-1" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {stats?.intoLevel ?? 0}/{stats?.span ?? 0} XP
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-amber-500">
              ⭐ {stats?.points ?? profile.points}
            </span>
            <button
              className="text-xs text-slate-400 underline"
              onClick={() => {
                signOut()
                navigate('/')
              }}
            >
              Switch user
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-3xl flex-1 p-4 pb-28">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-3xl justify-around">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <span className="text-2xl">{n.icon}</span>
              {n.label}
              {n.to === '/settings' && pending > 0 && (
                <span className="absolute right-4 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {pending}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Confetti />
      <Toaster />
      <CelebrationModal />
    </div>
  )
}
