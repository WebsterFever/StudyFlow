import { Copy, Pencil, RotateCcw, CheckCircle2, Trash2 } from 'lucide-react'
import type { StudyGoal, StudyItem } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { DropdownMenu } from '../ui/DropdownMenu'
import { daysRemaining, overallProgress, totalUnfinishedMinutes } from '../../utils/calculations'
import { formatFriendlyDate, formatMinutes, todayISO } from '../../utils/date'

interface GoalCardProps {
  goal: StudyGoal
  items: StudyItem[]
  isActive: boolean
  onOpen: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleComplete: () => void
}

export function GoalCard({ goal, items, isActive, onOpen, onEdit, onDuplicate, onDelete, onToggleComplete }: GoalCardProps) {
  const progress = overallProgress(items)
  const today = todayISO()
  const days = daysRemaining(goal, today)
  const remainingMinutes = totalUnfinishedMinutes(items)

  return (
    <Card className={isActive ? 'border-indigo-300 dark:border-indigo-800' : ''}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{goal.name}</h3>
            {goal.status !== 'active' && (
              <Badge tone={goal.status === 'completed' ? 'green' : 'slate'}>{goal.status}</Badge>
            )}
            {isActive && <Badge tone="indigo">Current</Badge>}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatFriendlyDate(goal.startDate)} → {formatFriendlyDate(goal.deadline)}
          </p>
        </div>
        <DropdownMenu
          items={[
            { label: 'Edit', icon: <Pencil size={14} />, onClick: onEdit },
            { label: 'Duplicate', icon: <Copy size={14} />, onClick: onDuplicate },
            {
              label: goal.status === 'completed' ? 'Reopen' : 'Mark Complete',
              icon: goal.status === 'completed' ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />,
              onClick: onToggleComplete,
            },
            { label: 'Delete', icon: <Trash2 size={14} />, onClick: onDelete, danger: true },
          ]}
        />
      </div>

      <div className="my-3">
        <ProgressBar percent={progress.percent} showPercent label={`${progress.completed} / ${progress.total} complete`} tone={progress.percent >= 100 ? 'green' : 'indigo'} />
      </div>

      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        {days > 0 ? `${days} days remaining` : 'Deadline passed'} · {formatMinutes(remainingMinutes)} left
      </p>

      <Button variant={isActive ? 'secondary' : 'primary'} size="sm" fullWidth onClick={onOpen}>
        {isActive ? 'Currently open' : 'Open Goal'}
      </Button>
    </Card>
  )
}
