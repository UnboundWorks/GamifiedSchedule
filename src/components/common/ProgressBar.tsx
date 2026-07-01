interface ProgressBarProps {
  ratio: number // 0..1
  className?: string
  color?: string
}

export function ProgressBar({ ratio, className = '', color }: ProgressBarProps) {
  return (
    <div
      className={`h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}
    >
      <div
        className="h-full rounded-full bg-brand-500 transition-all duration-500"
        style={{
          width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`,
          backgroundColor: color,
        }}
      />
    </div>
  )
}
