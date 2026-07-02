import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePendingApprovalsCount } from '../hooks/data'
import { ProfilesTab } from '../components/settings/ProfilesTab'
import { RoutinesTab } from '../components/settings/RoutinesTab'
import { ChoresTab } from '../components/settings/ChoresTab'
import { ScheduleTab } from '../components/settings/ScheduleTab'
import { HolidayTab } from '../components/settings/HolidayTab'
import { RewardsTab } from '../components/settings/RewardsTab'
import { GamificationTab } from '../components/settings/GamificationTab'
import { BackupTab } from '../components/settings/BackupTab'

const TABS = [
  { key: 'profiles', label: 'Family', icon: '👪', el: <ProfilesTab /> },
  { key: 'routines', label: 'Routines', icon: '🌅', el: <RoutinesTab /> },
  { key: 'chores', label: 'Chores', icon: '🧹', el: <ChoresTab /> },
  { key: 'schedule', label: 'Schedule', icon: '🗓️', el: <ScheduleTab /> },
  { key: 'holiday', label: 'Holiday', icon: '🏖️', el: <HolidayTab /> },
  { key: 'rewards', label: 'Rewards', icon: '🎁', el: <RewardsTab /> },
  { key: 'game', label: 'Game', icon: '🎮', el: <GamificationTab /> },
  { key: 'backup', label: 'Data', icon: '💾', el: <BackupTab /> },
]

export function Settings() {
  const [active, setActive] = useState('profiles')
  const navigate = useNavigate()
  const pending = usePendingApprovalsCount()
  const current = TABS.find((t) => t.key === active) ?? TABS[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          className="relative btn-ghost !min-h-[40px] !py-1.5"
          onClick={() => navigate('/settings/approvals')}
        >
          Approvals
          {pending > 0 && (
            <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {pending}
            </span>
          )}
        </button>
      </div>

      {/* Tab bar */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
              active === t.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div>{current.el}</div>
    </div>
  )
}
