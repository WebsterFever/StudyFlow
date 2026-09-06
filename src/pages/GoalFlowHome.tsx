import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, GraduationCap, ListChecks } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { usePlanner } from '../hooks/usePlanner'
import { useAuth } from '../hooks/useAuth'
import { useDefaultFlow } from '../hooks/useDefaultFlow'
import { Card } from '../components/ui/Card'

// This page is the one reliable escape hatch back to the flow picker — it
// never auto-redirects, even when a default flow is set. The default only
// applies at login (see Login.tsx/Register.tsx), so clicking "GoalFlow home"
// from anywhere always lands here instead of bouncing straight back out.
export default function GoalFlowHome() {
  const { state: studyState } = useStudy()
  const { state: plannerState } = usePlanner()
  const { user } = useAuth()
  const { defaultFlow, setDefaultFlow } = useDefaultFlow()

  const activeStudentGoals = studyState.goals.filter((g) => g.status === 'active').length
  const openStudyItems = studyState.items.filter((i) => !i.completed).length

  const activePlannerGoals = plannerState.goals.filter((g) => g.status === 'active').length
  const openPlannerTasks = plannerState.tasks.filter((t) => t.status !== 'completed').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Welcome to GoalFlow{user?.name ? `, ${user.name}` : ''}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">What would you like to work on?</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex h-full flex-col">
          <Link to="/student" className="flex-1">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <GraduationCap size={22} />
            </div>
            <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">StudentFlow</h3>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Learn, study and master your subjects and courses.</p>
            {(activeStudentGoals > 0 || openStudyItems > 0) && (
              <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <ListChecks size={13} />
                {activeStudentGoals} active {activeStudentGoals === 1 ? 'goal' : 'goals'} · {openStudyItems} item{openStudyItems === 1 ? '' : 's'} remaining
              </p>
            )}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Open StudentFlow <ArrowRight size={14} />
            </span>
          </Link>
          {defaultFlow !== 'student' && (
            <button
              onClick={() => setDefaultFlow('student')}
              className="mt-3 self-start text-xs text-slate-400 hover:text-indigo-600 hover:underline dark:text-slate-500 dark:hover:text-indigo-400"
            >
              Always open StudentFlow
            </button>
          )}
        </Card>

        <Card className="flex h-full flex-col">
          <Link to="/planner" className="flex-1">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <ClipboardList size={22} />
            </div>
            <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">PlannerFlow</h3>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Plan goals, projects and everyday life.</p>
            {(activePlannerGoals > 0 || openPlannerTasks > 0) && (
              <p className="mb-3 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <ListChecks size={13} />
                {activePlannerGoals} active {activePlannerGoals === 1 ? 'goal' : 'goals'} · {openPlannerTasks} task{openPlannerTasks === 1 ? '' : 's'} remaining
              </p>
            )}
            <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Open PlannerFlow <ArrowRight size={14} />
            </span>
          </Link>
          {defaultFlow !== 'planner' && (
            <button
              onClick={() => setDefaultFlow('planner')}
              className="mt-3 self-start text-xs text-slate-400 hover:text-indigo-600 hover:underline dark:text-slate-500 dark:hover:text-indigo-400"
            >
              Always open PlannerFlow
            </button>
          )}
        </Card>
      </div>

      {defaultFlow !== 'ask' && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          You're set to always open {defaultFlow === 'student' ? 'StudentFlow' : 'PlannerFlow'}. Change this any time in{' '}
          <Link to="/settings" className="text-indigo-600 hover:underline dark:text-indigo-400">
            Settings
          </Link>
          .
        </p>
      )}
    </div>
  )
}
