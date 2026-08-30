import { Link } from 'react-router-dom'
import { Card, CardHeader } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'
import { Badge } from '../ui/Badge'
import { useStudy } from '../../hooks/useStudy'
import { overallProgress } from '../../utils/calculations'
import { formatFriendlyDate } from '../../utils/date'

/** Compact cross-goal summary: "YOUR GOALS" — progress % and deadline for every goal. */
export function GoalsOverviewList() {
  const { state, setActiveGoalId } = useStudy()

  return (
    <Card>
      <CardHeader
        title="Your goals"
        action={
          <Link to="/goals" className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Manage goals
          </Link>
        }
      />
      <div className="space-y-3">
        {state.goals.map((goal) => {
          const goalItems = state.items.filter((i) => i.goalId === goal.id)
          const progress = overallProgress(goalItems)
          const isActive = goal.id === state.activeGoalId
          return (
            <button
              key={goal.id}
              onClick={() => setActiveGoalId(goal.id)}
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                isActive
                  ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{goal.name}</span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {goal.status !== 'active' && (
                    <Badge tone={goal.status === 'completed' ? 'green' : 'slate'}>{goal.status}</Badge>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">{formatFriendlyDate(goal.deadline)}</span>
                </div>
              </div>
              <ProgressBar percent={progress.percent} size="sm" tone={progress.percent >= 100 ? 'green' : 'indigo'} />
            </button>
          )
        })}
      </div>
    </Card>
  )
}
