import { useState } from 'react'
import { CalendarClock, RefreshCw, Target } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { SessionListItem } from '../components/session/SessionListItem'
import { TimerWidget } from '../components/today/TimerWidget'
import { MasteryModal } from '../components/session/MasteryModal'
import { minutesForDate } from '../utils/calculations'
import { formatMinutes, todayISO } from '../utils/date'
import type { MasteryRating } from '../types'
import { Link } from 'react-router-dom'

export default function Today() {
  const { state, startSession, pauseTimer, resumeTimer, stopTimer, completeSession, completeActiveTimer, setItemMastery, regeneratePlanNow } =
    useStudy()
  const today = todayISO()
  const [ratingItemId, setRatingItemId] = useState<string | null>(null)

  if (!state.goal) {
    return (
      <EmptyState
        icon={<Target size={40} />}
        title="No study goal yet"
        description="Set up your goal in Settings to start generating a daily plan."
        action={
          <Link to="/settings">
            <Button>Set up your goal</Button>
          </Link>
        }
      />
    )
  }

  const todaySessions = state.sessions.filter((s) => s.date === today).sort((a, b) => a.order - b.order)
  const itemsById = new Map(state.items.map((i) => [i.id, i]))
  const { planned, actual } = minutesForDate(state.sessions, today)
  const remaining = Math.max(0, planned - actual)
  const percent = planned === 0 ? 0 : Math.round((actual / planned) * 100)

  const activeSession = state.activeTimer ? state.sessions.find((s) => s.id === state.activeTimer?.sessionId) : undefined
  const activeItem = activeSession ? itemsById.get(activeSession.itemId) : undefined

  const ratingItem = ratingItemId ? itemsById.get(ratingItemId) : undefined

  const handleCompleteResult = (result: { itemCompleted: boolean; itemId: string }) => {
    if (result.itemCompleted) setRatingItemId(result.itemId)
  }

  const handleQuickComplete = (sessionId: string, plannedMinutes: number) => {
    const result = completeSession(sessionId, plannedMinutes)
    handleCompleteResult(result)
  }

  const handleCompleteTimer = () => {
    const result = completeActiveTimer()
    if (result) handleCompleteResult(result)
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Today's target</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatMinutes(planned)}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatMinutes(actual)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Remaining</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{formatMinutes(remaining)}</p>
            </div>
          </div>
        </div>
        <ProgressBar percent={percent} tone="green" showPercent />
      </Card>

      {state.activeTimer && (
        <TimerWidget
          activeTimer={state.activeTimer}
          session={activeSession}
          item={activeItem}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onStop={stopTimer}
          onComplete={handleCompleteTimer}
        />
      )}

      <Card>
        <CardHeader
          title="Today's sessions"
          subtitle={todaySessions.length > 0 ? `${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} scheduled` : undefined}
          action={
            <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={regeneratePlanNow}>
              Recalculate
            </Button>
          }
        />
        {todaySessions.length === 0 ? (
          <EmptyState
            icon={<CalendarClock size={36} />}
            title="Nothing scheduled for today"
            description="Enjoy your day off, or head to Study Content to add more material."
          />
        ) : (
          <div className="space-y-2">
            {todaySessions.map((session) => (
              <SessionListItem
                key={session.id}
                session={session}
                item={itemsById.get(session.itemId)}
                isActive={state.activeTimer?.sessionId === session.id}
                onStart={session.status === 'in-progress' ? undefined : () => startSession(session.id)}
                onComplete={
                  session.status === 'completed'
                    ? undefined
                    : session.status === 'in-progress'
                      ? handleCompleteTimer
                      : () => handleQuickComplete(session.id, session.plannedMinutes)
                }
              />
            ))}
          </div>
        )}
      </Card>

      <MasteryModal
        open={ratingItem != null}
        itemTitle={ratingItem?.title ?? ''}
        onRate={(rating: MasteryRating) => {
          if (ratingItemId) setItemMastery(ratingItemId, rating)
          setRatingItemId(null)
        }}
        onSkip={() => setRatingItemId(null)}
      />
    </div>
  )
}
