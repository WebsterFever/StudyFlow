import { Link } from 'react-router-dom'
import { BookOpen, Calendar, CheckCircle2, Clock, Flame, ListChecks, Target, TrendingUp } from 'lucide-react'
import type { StudyGoal } from '../types'
import { useStudy } from '../hooks/useStudy'
import { StatCard } from '../components/dashboard/StatCard'
import { DeadlineStatusBanner } from '../components/dashboard/DeadlineStatusBanner'
import { SessionListItem } from '../components/session/SessionListItem'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  completedItemsCount,
  computeAchievability,
  daysRemaining,
  minutesForDate,
  overallProgress,
  totalAvailableMinutes,
  totalUnfinishedMinutes,
} from '../utils/calculations'
import { computeStreak } from '../utils/streak'
import { formatFriendlyDate, formatMinutes, todayISO } from '../utils/date'

export default function Dashboard() {
  const { state } = useStudy()
  const { goal, items, sessions } = state
  const today = todayISO()

  if (!goal) {
    return (
      <EmptyState
        icon={<Target size={40} />}
        title="No study goal yet"
        description="Set a goal, start date and deadline to unlock your personalized study plan."
        action={
          <Link to="/settings">
            <Button>Create your study goal</Button>
          </Link>
        }
      />
    )
  }

  const progress = overallProgress(items)
  const achievability = computeAchievability(items, goal, state.dayOverrides, today)
  const streak = computeStreak(sessions, today)
  const todayMinutes = minutesForDate(sessions, today)
  const todaySessions = sessions.filter((s) => s.date === today).sort((a, b) => a.order - b.order)
  const itemsById = new Map(items.map((i) => [i.id, i]))

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <GoalHeader goal={goal} daysLeft={daysRemaining(goal, today)} />
        <EmptyState
          icon={<BookOpen size={40} />}
          title="No study content yet"
          description="Add your first lesson to generate your study plan."
          action={
            <Link to="/content">
              <Button>Add study content</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GoalHeader goal={goal} daysLeft={daysRemaining(goal, today)} />

      <DeadlineStatusBanner achievability={achievability} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<TrendingUp size={20} />} label="Overall progress" value={`${progress.percent}%`} sub={`${progress.completed} / ${progress.total} lessons`} />
        <StatCard icon={<Flame size={20} />} label="Study streak" value={`${streak.currentStreak} days`} sub={`Longest: ${streak.longestStreak} days`} tone="amber" />
        <StatCard icon={<Target size={20} />} label="Today's goal" value={formatMinutes(todayMinutes.planned)} sub={`Completed: ${formatMinutes(todayMinutes.actual)}`} tone="green" />
        <StatCard
          icon={<Clock size={20} />}
          label="Study time remaining"
          value={formatMinutes(totalUnfinishedMinutes(items))}
          sub={`Available: ${formatMinutes(totalAvailableMinutes(goal, state.dayOverrides, today))}`}
          tone={achievability.achievable ? 'indigo' : 'red'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's study items"
            subtitle={todaySessions.length > 0 ? `${todaySessions.filter((s) => s.status === 'completed').length} of ${todaySessions.length} complete` : undefined}
            action={
              <Link to="/today" className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Go to Today
              </Link>
            }
          />
          {todaySessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Nothing scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {todaySessions.slice(0, 6).map((session) => (
                <SessionListItem key={session.id} session={session} item={itemsById.get(session.itemId)} compact />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Overview" />
          <div className="space-y-4">
            <ProgressBar percent={progress.percent} label="Overall completion" showPercent />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <ListChecks size={16} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">
                  {completedItemsCount(items)} / {items.length} done
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">{daysRemaining(goal, today)} days left</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">{streak.studyDaysThisWeek}/7 days this week</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300">{formatMinutes(achievability.requiredMinutes)} left</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function GoalHeader({ goal, daysLeft }: { goal: StudyGoal; daysLeft: number }) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Goal</p>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{goal.name}</h2>
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Deadline</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatFriendlyDate(goal.deadline)}</p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Days remaining</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{daysLeft}</p>
        </div>
      </div>
    </div>
  )
}
