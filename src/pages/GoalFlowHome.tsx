import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, GraduationCap } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/ui/Card'

export default function GoalFlowHome() {
  const { state } = useStudy()
  const { user } = useAuth()
  const activeGoalCount = state.goals.filter((g) => g.status === 'active').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Welcome to GoalFlow{user?.name ? `, ${user.name}` : ''}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">What would you like to work on?</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/student">
          <Card className="h-full transition-colors hover:border-indigo-300 dark:hover:border-indigo-800">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <GraduationCap size={22} />
            </div>
            <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">StudentFlow</h3>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Learn, study and master your subjects and courses.</p>
            {activeGoalCount > 0 && (
              <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                {activeGoalCount} active {activeGoalCount === 1 ? 'goal' : 'goals'}
              </p>
            )}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Open StudentFlow <ArrowRight size={14} />
            </span>
          </Card>
        </Link>

        <Link to="/planner">
          <Card className="h-full transition-colors hover:border-indigo-300 dark:hover:border-indigo-800">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <ClipboardList size={22} />
            </div>
            <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">PlannerFlow</h3>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Plan goals, projects and everyday life.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Open PlannerFlow <ArrowRight size={14} />
            </span>
          </Card>
        </Link>
      </div>
    </div>
  )
}
