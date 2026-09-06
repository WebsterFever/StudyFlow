import { useState } from 'react'
import { CalendarClock, RefreshCw, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudy } from '../hooks/useStudy'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { SessionListItem } from '../components/session/SessionListItem'
import { TimerWidget } from '../components/today/TimerWidget'
import { MasteryModal } from '../components/session/MasteryModal'
import { GoalWorkloadSummary } from '../components/today/GoalWorkloadSummary'
import { minutesForDate } from '../utils/calculations'
import { formatMinutes, todayISO } from '../utils/date'
import type { MasteryRating } from '../types'

type ViewMode = 'current' | 'all'

export default function Today() {
  const { state, activeGoal, startSession, pauseTimer, resumeTimer, stopTimer, completeSession, completeActiveTimer, setItemMastery, regeneratePlanNow } =
    useStudy()
  const today = todayISO()
  const [ratingItemId, setRatingItemId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('current')

  if (state.goals.length === 0) {
    return (
      <EmptyState
        icon={<Target size={40} />}
        title="No study goal yet"
        description="Create a goal to start generating a daily plan."
        action={
          <Link to="/student/goals">
            <Button>Create a goal</Button>
          </Link>
        }
      />
    )
  }

  const isAllGoals = viewMode === 'all' && state.goals.length > 1
  const scopedSessions = isAllGoals ? state.sessions : state.sessions.filter((s) => s.goalId === activeGoal?.id)
  const scopedItems = isAllGoals ? state.items : state.items.filter((i) => i.goalId === activeGoal?.id)

  const todaySessions = scopedSessions.filter((s) => s.date === today).sort((a, b) => a.order - b.order)
  const itemsById = new Map(scopedItems.map((i) => [i.id, i]))
  const goalsById = new Map(state.goals.map((g) => [g.id, g]))
  const { planned, actual } = minutesForDate(scopedSessions, today)
  const remaining = Math.max(0, planned - actual)
  const percent = planned === 0 ? 0 : Math.round((actual / planned) * 100)

  const activeSession = state.activeTimer ? state.sessions.find((s) => s.id === state.activeTimer?.sessionId) : undefined
  const activeItem = activeSession ? state.items.find((i) => i.id === activeSession.itemId) : undefined

  const ratingItem = ratingItemId ? state.items.find((i) => i.id === ratingItemId) : undefined

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
      {state.goals.length > 1 && (
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 sm:w-fit">
          <button
            onClick={() => setViewMode('current')}
            className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              viewMode === 'current' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Current Goal
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              viewMode === 'all' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            All Goals
          </button>
        </div>
      )}

      {isAllGoals && <GoalWorkloadSummary goals={state.goals} sessionsToday={state.sessions.filter((s) => s.date === today)} />}

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
          title={isAllGoals ? "Today's sessions — All Goals" : "Today's sessions"}
          subtitle={todaySessions.length > 0 ? `${todaySessions.length} session${todaySessions.length === 1 ? '' : 's'} scheduled` : undefined}
          action={
            !isAllGoals && (
              <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={regeneratePlanNow}>
                Recalculate
              </Button>
            )
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
                goalName={isAllGoals ? goalsById.get(session.goalId)?.name : undefined}
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
