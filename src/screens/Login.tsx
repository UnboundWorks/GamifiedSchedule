import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfiles, useSettings } from '../hooks/data'
import { useSession } from '../store/session'
import { verifyPin } from '../lib/pin'
import { PinPad } from '../components/common/PinPad'
import { useApplyTheme } from '../hooks/useTheme'
import type { Profile } from '../domain/types'

export function Login() {
  const profiles = useProfiles()
  const settings = useSettings()
  const signIn = useSession((s) => s.signIn)
  const navigate = useNavigate()
  useApplyTheme()
  const [selected, setSelected] = useState<Profile | null>(null)
  const [error, setError] = useState('')

  const enter = (profile: Profile) => {
    signIn(profile)
    navigate('/home')
  }

  const pick = (profile: Profile) => {
    setError('')
    const needsPin =
      profile.pinHash !== null &&
      (profile.role === 'parent' || (settings?.pinRequiredForChild ?? true))
    if (needsPin) {
      setSelected(profile)
    } else {
      enter(profile)
    }
  }

  const submitPin = async (pin: string) => {
    if (!selected) return
    const ok = await verifyPin(pin, selected.pinHash, selected.pinSalt)
    if (ok) {
      enter(selected)
    } else {
      setError('Incorrect PIN. Try again.')
    }
  }

  return (
    <div className="safe-top safe-bottom flex min-h-full flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <div className="text-5xl">🗓️</div>
        <h1 className="mt-2 text-3xl font-bold">GamifiedSchedule</h1>
        <p className="text-slate-500 dark:text-slate-400">Who's using the app?</p>
      </div>

      {!selected ? (
        <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
          {(profiles ?? [])
            .filter((p) => p.active)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => pick(p)}
                className="card flex flex-col items-center gap-2 py-6 transition active:scale-95"
                style={{ borderTop: `4px solid ${p.color}` }}
              >
                <span className="text-5xl">{p.avatar}</span>
                <span className="text-lg font-semibold">{p.name}</span>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {p.role === 'parent' ? 'Parent' : 'Child'}
                  {p.pinHash ? ' · 🔒' : ''}
                </span>
              </button>
            ))}
        </div>
      ) : (
        <div className="card w-full max-w-sm">
          <PinPad
            title={`Hi ${selected.name}!`}
            subtitle="Enter your PIN"
            error={error}
            onSubmit={submitPin}
            onCancel={() => {
              setSelected(null)
              setError('')
            }}
          />
        </div>
      )}
    </div>
  )
}
