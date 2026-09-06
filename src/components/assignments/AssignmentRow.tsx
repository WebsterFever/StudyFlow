import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import type { Assignment } from '../../types'
import { ASSIGNMENT_STATUS_LABELS } from '../../types'
import { Badge, priorityTone } from '../ui/Badge'
import { DropdownMenu } from '../ui/DropdownMenu'
import { formatFriendlyDate, isBefore, todayISO } from '../../utils/date'

function statusTone(status: Assignment['status']): 'green' | 'blue' | 'slate' {
  if (status === 'completed') return 'green'
  if (status === 'in_progress') return 'blue'
  return 'slate'
}

export function AssignmentRow({
  assignment,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  assignment: Assignment
  onEdit: () => void
  onDelete: () => void
  onToggleComplete: () => void
}) {
  const overdue = assignment.status !== 'completed' && isBefore(assignment.dueDate, todayISO())

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{assignment.title}</p>
          <Badge tone={statusTone(assignment.status)}>{ASSIGNMENT_STATUS_LABELS[assignment.status]}</Badge>
          <Badge tone={priorityTone(assignment.priority)}>{assignment.priority}</Badge>
          {overdue && <Badge tone="red">Overdue</Badge>}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Due {formatFriendlyDate(assignment.dueDate, { withYear: true })}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {assignment.status !== 'completed' && (
          <button
            onClick={onToggleComplete}
            aria-label="Mark complete"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
          >
            <CheckCircle2 size={18} />
          </button>
        )}
        <DropdownMenu
          items={[
            { label: 'Edit', icon: <Pencil size={14} />, onClick: onEdit },
            { label: 'Delete', icon: <Trash2 size={14} />, onClick: onDelete, danger: true },
          ]}
        />
      </div>
    </div>
  )
}
