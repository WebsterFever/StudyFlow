import { AlertTriangle } from 'lucide-react'
import type { StudyGoal, StudySession } from '../../types'
import { formatMinutes } from '../../utils/date'

const HEAVY_DAY_THRESHOLD_MINUTES = 6 * 60

interface GoalWorkloadSummaryProps {
  goals: StudyGoal[]
  sessionsToday: StudySession[]
}

/** Combined workload across every goal for today — doesn't assume each goal's hours are separate physical time. */
export function GoalWorkloadSummary({ goals, sessionsToday }: GoalWorkloadSummaryProps) {
  const byGoal = goals
    .map((goal) => ({
      goal,
      minutes: sessionsToday.filter((s) => s.goalId === goal.id).reduce((sum, s) => sum + s.plannedMinutes, 0),
    }))
    .filter((g) => g.minutes > 0)

  const total = byGoal.reduce((sum, g) => sum + g.minutes, 0)
  const isHeavy = total > HEAVY_DAY_THRESHOLD_MINUTES

  if (byGoal.length === 0) return null

  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 ${
        isHeavy
          ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      {isHeavy && (
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
          <AlertTriangle size={15} /> Heavy study day — {formatMinutes(total)} scheduled across {byGoal.length} goals.
        </p>
      )}
      <div className="space-y-1.5">
        {byGoal.map(({ goal, minutes }) => (
          <div key={goal.id} className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">{goal.name}</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{formatMinutes(minutes)}</span>
          </div>
        ))}
        <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5 text-sm font-semibold dark:border-slate-700">
          <span className="text-slate-700 dark:text-slate-300">Total today</span>
          <span className={isHeavy ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}>{formatMinutes(total)}</span>
        </div>
      </div>
    </div>
  )
}
