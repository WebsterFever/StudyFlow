import { CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import type { StudyItem, StudySession } from '../../types'
import { Badge, typeTone } from '../ui/Badge'
import { formatMinutes } from '../../utils/date'

interface SessionListItemProps {
  session: StudySession
  item: StudyItem | undefined
  compact?: boolean
  onStart?: () => void
  onComplete?: () => void
  isActive?: boolean
}

export function SessionListItem({ session, item, compact, onStart, onComplete, isActive }: SessionListItemProps) {
  if (!item) return null
  const isCompleted = session.status === 'completed'
  const isMissed = session.status === 'skipped'
  const partLabel = session.partTotal > 1 ? ` — Part ${session.partIndex}/${session.partTotal}` : ''

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        isActive
          ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40'
          : isCompleted
            ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60'
            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <button
        onClick={onComplete}
        disabled={isCompleted || !onComplete}
        aria-label={isCompleted ? 'Completed' : 'Mark complete'}
        className="shrink-0 text-slate-300 hover:text-emerald-500 disabled:hover:text-slate-300 dark:text-slate-600"
      >
        {isCompleted ? <CheckCircle2 size={22} className="text-emerald-500" /> : <Circle size={22} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isCompleted ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
          {item.title}
          {partLabel}
        </p>
        {!compact && (
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {item.topic} · {formatMinutes(session.plannedMinutes)}
            {isMissed && <span className="ml-1.5 font-medium text-amber-600 dark:text-amber-400">Missed</span>}
          </p>
        )}
      </div>

      <Badge tone={typeTone(item.type)} className="hidden sm:inline-flex">
        {item.type}
      </Badge>

      {!isCompleted && onStart && (
        <button
          onClick={onStart}
          className="shrink-0 rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60"
          aria-label="Start studying"
        >
          <PlayCircle size={22} />
        </button>
      )}
    </div>
  )
}
