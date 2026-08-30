import { useState } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, Circle, MoveRight, XCircle } from 'lucide-react'
import type { StudyItem, StudySession } from '../../types'
import { Badge, typeTone } from '../ui/Badge'
import { formatMinutes, formatShortDate } from '../../utils/date'

interface PlanSessionRowProps {
  session: StudySession
  item: StudyItem | undefined
  moveOptions: { date: string; label: string }[]
  onMove: (date: string) => void
  onDurationChange: (minutes: number) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export function PlanSessionRow({ session, item, moveOptions, onMove, onDurationChange, onMoveUp, onMoveDown }: PlanSessionRowProps) {
  const [duration, setDuration] = useState(String(session.plannedMinutes))

  if (!item) return null

  const isCompleted = session.status === 'completed'
  const isMissed = session.status === 'skipped'
  const partLabel = session.partTotal > 1 ? ` (Part ${session.partIndex}/${session.partTotal})` : ''

  const commitDuration = () => {
    const parsed = Number(duration)
    if (Number.isFinite(parsed) && parsed > 0 && parsed !== session.plannedMinutes) {
      onDurationChange(Math.round(parsed))
    } else {
      setDuration(String(session.plannedMinutes))
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {isCompleted ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
          ) : isMissed ? (
            <XCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
          ) : (
            <Circle size={16} className="mt-0.5 shrink-0 text-slate-300 dark:text-slate-600" />
          )}
          <div className="min-w-0">
            <p className={`truncate text-sm font-medium ${isCompleted ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
              {item.title}
              {partLabel}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone={typeTone(item.type)}>{item.type}</Badge>
              {isMissed && <Badge tone="amber">Missed</Badge>}
              {session.manuallyAdjusted && <Badge tone="indigo">Manual</Badge>}
            </div>
          </div>
        </div>
        {(onMoveUp || onMoveDown) && !isCompleted && (
          <div className="flex shrink-0 flex-col">
            <button
              onClick={onMoveUp}
              disabled={!onMoveUp}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              aria-label="Move up"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!onMoveDown}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              aria-label="Move down"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        )}
      </div>

      {!isCompleted && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            Duration
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onBlur={commitDuration}
              className="w-16 rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            min
          </label>

          {moveOptions.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MoveRight size={13} />
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onMove(e.target.value)
                }}
                className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Move to...</option>
                {moveOptions.map((opt) => (
                  <option key={opt.date} value={opt.date}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <span className="ml-auto text-xs text-slate-400">{formatMinutes(session.plannedMinutes)}</span>
        </div>
      )}
      {isCompleted && session.completedAt && (
        <p className="mt-1 text-xs text-slate-400">Completed {formatShortDate(session.completedAt.slice(0, 10))}</p>
      )}
    </div>
  )
}
