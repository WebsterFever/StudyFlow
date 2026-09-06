import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Pencil, Plus, Repeat, Trash2, X } from 'lucide-react'
import type { PlannerSubtask, PlannerTask } from '../../types'
import { Badge, priorityTone } from '../ui/Badge'
import { DropdownMenu } from '../ui/DropdownMenu'
import { Input } from '../ui/Form'
import { formatFriendlyDate, isBefore, todayISO } from '../../utils/date'

interface TaskRowProps {
  task: PlannerTask
  milestoneName: string | null
  subtasks: PlannerSubtask[]
  onToggleComplete: () => void
  onEdit: () => void
  onDelete: () => void
  onAddSubtask: (title: string) => void
  onToggleSubtask: (subtask: PlannerSubtask) => void
  onDeleteSubtask: (subtask: PlannerSubtask) => void
}

export function TaskRow({ task, milestoneName, subtasks, onToggleComplete, onEdit, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask }: TaskRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')
  const overdue = task.status !== 'completed' && !!task.dueDate && isBefore(task.dueDate, todayISO())

  const submitSubtask = () => {
    const trimmed = newSubtask.trim()
    if (!trimmed) return
    onAddSubtask(trimmed)
    setNewSubtask('')
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <button
          onClick={onToggleComplete}
          aria-label={task.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
          className="shrink-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          {task.status === 'completed' ? <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" /> : <Circle size={18} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={`truncate text-sm font-medium ${task.status === 'completed' ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
              {task.title}
            </p>
            <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
            {task.isRecurring && (
              <Badge tone="purple">
                <Repeat size={10} /> every {task.recurrenceIntervalDays}d
              </Badge>
            )}
            {overdue && <Badge tone="red">Overdue</Badge>}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {[task.dueDate ? formatFriendlyDate(task.dueDate) : null, milestoneName].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
          {subtasks.length > 0 ? `${subtasks.filter((s) => s.completed).length}/${subtasks.length}` : ''}
        </span>
        <DropdownMenu
          items={[
            { label: 'Edit', icon: <Pencil size={14} />, onClick: onEdit },
            { label: 'Delete', icon: <Trash2 size={14} />, onClick: onDelete, danger: true },
          ]}
        />
      </div>

      {expanded && (
        <div className="space-y-1.5 border-t border-slate-100 px-3 py-2.5 pl-10 dark:border-slate-800">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 text-sm">
              <button
                onClick={() => onToggleSubtask(subtask)}
                aria-label={subtask.completed ? 'Mark incomplete' : 'Mark complete'}
                className="shrink-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {subtask.completed ? <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" /> : <Circle size={15} />}
              </button>
              <span className={`flex-1 truncate ${subtask.completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                {subtask.title}
              </span>
              <button onClick={() => onDeleteSubtask(subtask)} aria-label="Delete subtask" className="shrink-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSubtask()
              }}
              placeholder="Add a subtask..."
              className="py-1.5 text-sm"
            />
            <button
              onClick={submitSubtask}
              aria-label="Add subtask"
              className="shrink-0 rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
