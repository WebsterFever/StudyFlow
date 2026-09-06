import { CheckCircle2, Circle, Pencil, Trash2 } from 'lucide-react'
import type { PlannerMilestone } from '../../types'
import { formatFriendlyDate } from '../../utils/date'

export function MilestoneRow({
  milestone,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  milestone: PlannerMilestone
  onToggleComplete: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700">
      <button
        onClick={onToggleComplete}
        aria-label={milestone.completed ? 'Mark incomplete' : 'Mark complete'}
        className="shrink-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
      >
        {milestone.completed ? <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /> : <Circle size={18} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${milestone.completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
          {milestone.title}
        </p>
        {milestone.dueDate && <p className="text-xs text-slate-500 dark:text-slate-400">{formatFriendlyDate(milestone.dueDate)}</p>}
      </div>
      <button onClick={onEdit} aria-label="Edit milestone" className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
        <Pencil size={14} />
      </button>
      <button onClick={onDelete} aria-label="Delete milestone" className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400">
        <Trash2 size={14} />
      </button>
    </div>
  )
}
