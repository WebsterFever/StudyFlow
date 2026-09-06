import { CheckCircle2, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import type { PlannerGoal, PlannerTask } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge, priorityTone } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { DropdownMenu } from '../ui/DropdownMenu'
import { formatFriendlyDate } from '../../utils/date'

interface PlannerGoalCardProps {
  goal: PlannerGoal
  tasks: PlannerTask[]
  isActive: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleComplete: () => void
}

export function PlannerGoalCard({ goal, tasks, isActive, onOpen, onEdit, onDelete, onToggleComplete }: PlannerGoalCardProps) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <Card className={isActive ? 'border-indigo-300 dark:border-indigo-800' : ''}>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{goal.name}</h3>
            {goal.status !== 'active' && <Badge tone={goal.status === 'completed' ? 'green' : 'slate'}>{goal.status}</Badge>}
            {isActive && <Badge tone="indigo">Current</Badge>}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Badge tone={priorityTone(goal.priority)}>{goal.priority}</Badge>
            {goal.deadline && <span>Due {formatFriendlyDate(goal.deadline)}</span>}
          </p>
        </div>
        <DropdownMenu
          items={[
            { label: 'Edit', icon: <Pencil size={14} />, onClick: onEdit },
            {
              label: goal.status === 'completed' ? 'Reopen' : 'Mark Complete',
              icon: goal.status === 'completed' ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />,
              onClick: onToggleComplete,
            },
            { label: 'Delete', icon: <Trash2 size={14} />, onClick: onDelete, danger: true },
          ]}
        />
      </div>

      {goal.description && <p className="mb-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{goal.description}</p>}

      <div className="my-3">
        <ProgressBar percent={percent} showPercent label={`${completed} / ${total} tasks`} tone={percent >= 100 && total > 0 ? 'green' : 'indigo'} />
      </div>

      <Button variant={isActive ? 'secondary' : 'primary'} size="sm" fullWidth onClick={onOpen}>
        {isActive ? 'Currently open' : 'Open Goal'}
      </Button>
    </Card>
  )
}
