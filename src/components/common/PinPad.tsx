import { useState } from 'react'

interface PinPadProps {
  onSubmit: (pin: string) => void | Promise<void>
  onCancel?: () => void
  title?: string
  subtitle?: string
  error?: string
  maxLength?: number
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export function PinPad({
  onSubmit,
  onCancel,
  title = 'Enter PIN',
  subtitle,
  error,
  maxLength = 6,
}: PinPadProps) {
  const [pin, setPin] = useState('')

  const press = (k: string) => {
    if (k === '⌫') {
      setPin((p) => p.slice(0, -1))
    } else if (k !== '') {
      setPin((p) => (p.length < maxLength ? p + k : p))
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
      <div className="my-6 flex gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              i < pin.length
                ? 'border-brand-500 bg-brand-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          />
        ))}
      </div>
      {error && <p className="mb-3 text-sm font-medium text-red-500">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k, i) =>
          k === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              className="h-16 w-16 rounded-2xl bg-slate-100 text-2xl font-semibold active:scale-95 dark:bg-slate-800"
              onClick={() => press(k)}
            >
              {k}
            </button>
          ),
        )}
      </div>
      <div className="mt-6 flex w-full gap-3">
        {onCancel && (
          <button className="btn-ghost flex-1" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          className="btn-primary flex-1"
          disabled={pin.length === 0}
          onClick={() => void onSubmit(pin)}
        >
          Enter
        </button>
      </div>
    </div>
  )
}
