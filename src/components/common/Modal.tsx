import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl dark:bg-slate-900 sm:rounded-3xl ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
