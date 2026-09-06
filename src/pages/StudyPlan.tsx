import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, RefreshCw, Target } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { DayCard } from '../components/plan/DayCard'
import { DeadlineStatusBanner } from '../components/dashboard/DeadlineStatusBanner'
import { availableMinutesForDate, computeAchievability } from '../utils/calculations'
import { addDays, formatFriendlyDate, startOfWeek, todayISO } from '../utils/date'

export default function StudyPlan() {
  const { activeGoal, items, sessions, dayOverrides, setDayOverride, clearDayOverride, moveSession, updateSessionDuration, reorderDay, regeneratePlanNow } =
    useStudy()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayISO()))

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const moveOptions = weekDates.map((d) => ({ date: d, label: formatFriendlyDate(d, { withWeekday: true }) }))

  if (!activeGoal) {
    return (
      <EmptyState
        icon={<Target size={40} />}
        title="No study goal yet"
        description="Create a goal with daily availability to generate a study plan."
        action={
          <Link to="/student/goals">
            <Button>Create a goal</Button>
          </Link>
        }
      />
    )
  }

  const goal = activeGoal
  const achievability = computeAchievability(items, goal, dayOverrides, todayISO())

  return (
    <div className="space-y-5">
      <DeadlineStatusBanner achievability={achievability} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[11rem] text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {formatFriendlyDate(weekDates[0])} – {formatFriendlyDate(weekDates[6])}
          </span>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="rounded-lg border border-slate-300 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(todayISO()))}>
            This week
          </Button>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={regeneratePlanNow}>
          Recalculate Study Plan
        </Button>
      </div>

      <div className="space-y-3">
        {weekDates.map((date) => {
          const daySessions = sessions.filter((s) => s.date === date).sort((a, b) => a.order - b.order)
          const override = dayOverrides[date]
          const isUnavailable = override?.unavailable ?? false
          const availableMinutes = availableMinutesForDate(date, goal, dayOverrides)

          const toggleUnavailable = () => {
            if (isUnavailable) {
              clearDayOverride(goal.id, date)
            } else {
              setDayOverride(goal.id, date, true, null)
            }
          }

          return (
            <DayCard
              key={date}
              date={date}
              sessions={daySessions}
              itemsById={itemsById}
              availableMinutes={availableMinutes}
              isUnavailable={isUnavailable}
              hasOverride={override != null && !isUnavailable}
              moveOptions={moveOptions}
              onToggleUnavailable={toggleUnavailable}
              onMoveSession={moveSession}
              onDurationChange={updateSessionDuration}
              onReorder={reorderDay}
            />
          )
        })}
      </div>
    </div>
  )
}
