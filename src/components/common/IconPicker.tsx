import { useState } from 'react'

// Curated emoji grouped by the kinds of things families track. Parents pick from
// the grid; a "type your own" field keeps full flexibility.
const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: 'Chores',
    icons: ['🧹', '🧼', '🧽', '🗑️', '♻️', '🍽️', '🧺', '🛏️', '🧸', '🪣', '🧴', '🚽', '🪥', '🐶', '🐱', '🐟', '🪴', '🌱', '🚗', '📬'],
  },
  {
    label: 'Routines & self-care',
    icons: ['🌅', '🌙', '☀️', '🛁', '🚿', '👕', '👟', '🎒', '🥣', '🍎', '💧', '😴', '🦷', '💊', '🧴', '🧢'],
  },
  {
    label: 'School & learning',
    icons: ['🏫', '✏️', '📚', '📖', '➗', '➕', '🔢', '🔬', '🎨', '🎵', '🖍️', '📝', '🧠', '💡'],
  },
  {
    label: 'Activities & fun',
    icons: ['⚽', '🏀', '🏊', '🚴', '🤸', '🎮', '🍿', '🎬', '🎲', '🧩', '🎡', '🏞️', '🏕️', '🎳', '🎯', '🎪'],
  },
  {
    label: 'Food & rewards',
    icons: ['🍕', '🍦', '🍪', '🍭', '🎁', '💵', '⭐', '🏆', '🥇', '🎟️', '📱', '⏰', '🧁', '🍔'],
  },
]

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  /** Compact = icon-only button (for tight rows like routine steps). */
  compact?: boolean
}

export function IconPicker({ value, onChange, compact }: IconPickerProps) {
  const [open, setOpen] = useState(false)

  const pick = (icon: string) => {
    onChange(icon)
    setOpen(false)
  }

  return (
    <div className={compact ? 'relative' : ''}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          compact
            ? 'input w-14 text-center text-2xl'
            : 'input flex items-center justify-between'
        }
        aria-label="Choose icon"
      >
        {compact ? (
          value || '❓'
        ) : (
          <>
            <span className="text-2xl">{value || '❓'}</span>
            <span className="text-sm text-slate-400">
              {open ? 'Close' : 'Choose icon ▾'}
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          className={`mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800 ${
            compact ? 'absolute left-0 top-full z-10 w-72 shadow-xl' : ''
          }`}
        >
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {ICON_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => pick(icon)}
                      className={`h-10 w-10 rounded-lg text-2xl ${
                        value === icon
                          ? 'bg-brand-100 ring-2 ring-brand-500 dark:bg-brand-900'
                          : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Or type your own
            </span>
            <input
              className="input mt-1 text-center text-2xl"
              value={value}
              maxLength={4}
              onChange={(e) => onChange(e.target.value)}
              placeholder="🙂"
            />
          </label>
        </div>
      )}
    </div>
  )
}
