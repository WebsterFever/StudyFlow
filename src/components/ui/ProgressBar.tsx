interface ProgressBarProps {
  percent: number
  tone?: 'indigo' | 'green' | 'amber' | 'red'
  size?: 'sm' | 'md'
  label?: string
  showPercent?: boolean
}

const TONE_CLASSES: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  indigo: 'bg-indigo-600',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
}

export function ProgressBar({ percent, tone = 'indigo', size = 'md', label, showPercent }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'
  return (
    <div>
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>}
          {showPercent && <span className="text-slate-500 dark:text-slate-400">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${height}`}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${TONE_CLASSES[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
