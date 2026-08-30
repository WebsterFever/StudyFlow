import { CheckCircle2, Pause, Play, Square } from 'lucide-react'
import type { ActiveTimer, StudyItem, StudySession } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useTimer } from '../../hooks/useTimer'
import { formatMinutes, formatStopwatch } from '../../utils/date'

interface TimerWidgetProps {
  activeTimer: ActiveTimer
  session: StudySession | undefined
  item: StudyItem | undefined
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onComplete: () => void
}

export function TimerWidget({ activeTimer, session, item, onPause, onResume, onStop, onComplete }: TimerWidgetProps) {
  const elapsed = useTimer(activeTimer)

  if (!session || !item) return null

  const partLabel = session.partTotal > 1 ? ` — Part ${session.partIndex}/${session.partTotal}` : ''

  return (
    <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-900 dark:bg-indigo-950/30">
      <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Current study session</p>
      <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
        {item.title}
        {partLabel}
      </h3>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        {item.topic} · Estimated {formatMinutes(session.plannedMinutes)}
      </p>

      <div className="mt-4 text-center">
        <span className="font-mono text-5xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
          {formatStopwatch(elapsed)}
        </span>
        {activeTimer.isPaused && <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">Paused</p>}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {activeTimer.isPaused ? (
          <Button icon={<Play size={16} />} onClick={onResume}>
            Resume
          </Button>
        ) : (
          <Button icon={<Pause size={16} />} variant="secondary" onClick={onPause}>
            Pause
          </Button>
        )}
        <Button icon={<Square size={16} />} variant="secondary" onClick={onStop}>
          Stop
        </Button>
        <Button icon={<CheckCircle2 size={16} />} variant="primary" onClick={onComplete}>
          Complete Session
        </Button>
      </div>
    </Card>
  )
}
