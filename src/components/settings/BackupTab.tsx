import { useRef } from 'react'
import { useSettings } from '../../hooks/data'
import { updateSettings } from '../../repositories/settings.repo'
import { downloadBackup, importFromFile } from '../../db/backup'
import { resetToSeed } from '../../db/seed'
import { Field, Toggle } from '../common/FormControls'
import { useUI } from '../../store/ui'
import type { Settings, ThemePref } from '../../domain/types'

const THEMES: ThemePref[] = ['system', 'light', 'dark']

export function BackupTab() {
  const settings = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const pushToast = useUI((s) => s.pushToast)

  if (!settings) return null

  const onImport = async (file: File) => {
    if (
      !confirm(
        'Importing will REPLACE all current data with the backup. Continue?',
      )
    )
      return
    const res = await importFromFile(file)
    pushToast(res.ok ? 'Backup restored' : res.reason ?? 'Import failed', res.ok ? '✅' : '⚠️')
  }

  const onReset = async () => {
    if (
      confirm(
        'Reset to sample data? This ERASES everything and restores the starter family, routines and chores.',
      )
    ) {
      await resetToSeed()
      pushToast('Reset to sample data', '🔄')
    }
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <h3 className="font-bold">General</h3>
        <Field label="Theme">
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => updateSettings({ theme: t })}
                className={`flex-1 rounded-lg py-2 font-semibold capitalize ${
                  settings.theme === t
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Week starts on">
          <div className="flex gap-2">
            {([0, 1] as const).map((d) => (
              <button
                key={d}
                onClick={() => updateSettings({ weekStartsOn: d } as Partial<Settings>)}
                className={`flex-1 rounded-lg py-2 font-semibold ${
                  settings.weekStartsOn === d
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                {d === 0 ? 'Sunday' : 'Monday'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Auto-lock after (minutes, 0 = never)">
          <input
            type="number"
            min={0}
            className="input"
            value={settings.autoLockMinutes}
            onChange={(e) =>
              updateSettings({ autoLockMinutes: Math.max(0, Number(e.target.value) || 0) })
            }
          />
        </Field>

        <Toggle
          label="Require approval for chore points"
          hint="Only affects chores marked 'requires approval'"
          checked={settings.requireRedemptionApproval}
          onChange={(v) => updateSettings({ requireRedemptionApproval: v })}
        />
        <Toggle
          label="Children need a PIN to sign in"
          checked={settings.pinRequiredForChild}
          onChange={(v) => updateSettings({ pinRequiredForChild: v })}
        />
      </section>

      <section className="card space-y-3">
        <h3 className="font-bold">Backup & restore</h3>
        <p className="text-sm text-slate-400">
          All data lives only on this device. Export regularly so you never lose
          progress — this is your only backup.
        </p>
        <div className="flex flex-col gap-2">
          <button className="btn-primary" onClick={() => downloadBackup()}>
            ⬇️ Export data (JSON)
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            ⬆️ Import data
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onImport(f)
              e.target.value = ''
            }}
          />
          <button className="btn-danger" onClick={onReset}>
            🔄 Reset to sample data
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="font-bold">About security</h3>
        <p className="mt-1 text-sm text-slate-400">
          PINs and roles keep the app tidy for a shared family iPad — they are a
          convenience, not real security. Anyone with the device can access the
          data. Keep the iPad itself protected with its own passcode.
        </p>
      </section>
    </div>
  )
}
