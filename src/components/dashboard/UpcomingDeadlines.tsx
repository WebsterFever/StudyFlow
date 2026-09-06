import { Link } from 'react-router-dom'
import { ClipboardList, GraduationCap } from 'lucide-react'
import { useGoalAssignments } from '../../hooks/useAssignments'
import { useGoalExams } from '../../hooks/useExams'
import { Card, CardHeader } from '../ui/Card'
import { Badge, priorityTone } from '../ui/Badge'
import { formatFriendlyDate, isBefore, todayISO } from '../../utils/date'

const UPCOMING_WINDOW_DAYS = 14

/** Surfaces due-soon (and overdue) assignments/exams for the active goal on the Dashboard. */
export function UpcomingDeadlines({ goalId }: { goalId: string }) {
  const { assignments, isLoading: assignmentsLoading } = useGoalAssignments(goalId)
  const { exams, isLoading: examsLoading } = useGoalExams(goalId)

  if (assignmentsLoading || examsLoading) return null

  const today = todayISO()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + UPCOMING_WINDOW_DAYS)
  const cutoffISO = cutoff.toISOString().slice(0, 10)

  const upcomingAssignments = assignments
    .filter((a) => a.status !== 'completed' && a.dueDate <= cutoffISO)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const upcomingExams = exams.filter((e) => e.examDate <= cutoffISO).sort((a, b) => a.examDate.localeCompare(b.examDate))

  if (upcomingAssignments.length === 0 && upcomingExams.length === 0) return null

  return (
    <Card>
      <CardHeader title="Upcoming deadlines" subtitle={`Due within ${UPCOMING_WINDOW_DAYS} days`} />
      <div className="space-y-2">
        {upcomingAssignments.map((a) => (
          <Link
            key={a.id}
            to="/student/assignments"
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-2.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
          >
            <div className="flex min-w-0 items-center gap-2">
              <ClipboardList size={16} className="shrink-0 text-slate-400" />
              <span className="truncate font-medium text-slate-900 dark:text-slate-100">{a.title}</span>
              <Badge tone={priorityTone(a.priority)}>{a.priority}</Badge>
            </div>
            <span className={`shrink-0 text-xs ${isBefore(a.dueDate, today) ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {formatFriendlyDate(a.dueDate)}
            </span>
          </Link>
        ))}
        {upcomingExams.map((e) => (
          <Link
            key={e.id}
            to="/student/exams"
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-2.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
          >
            <div className="flex min-w-0 items-center gap-2">
              <GraduationCap size={16} className="shrink-0 text-slate-400" />
              <span className="truncate font-medium text-slate-900 dark:text-slate-100">{e.title}</span>
              <Badge tone="purple">{e.progressPercent}% ready</Badge>
            </div>
            <span className={`shrink-0 text-xs ${isBefore(e.examDate, today) ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {formatFriendlyDate(e.examDate)}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  )
}
