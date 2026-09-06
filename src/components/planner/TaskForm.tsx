import { useState } from 'react'
import { Save } from 'lucide-react'
import type { PlannerMilestone, PlannerTask, PlannerTaskInput, PlannerTaskStatus, Priority } from '../../types'
import { PLANNER_TASK_STATUS_LABELS, PLANNER_TASK_STATUSES, PRIORITIES } from '../../types'
import { Field, Input, Select } from '../ui/Form'
import { Button } from '../ui/Button'

interface TaskFormProps {
  goalId: string
  milestones: PlannerMilestone[]
  task?: PlannerTask | null
  onSave: (values: PlannerTaskInput) => void
  onCancel?: () => void
}

export function TaskForm({ goalId, milestones, task, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [milestoneId, setMilestoneId] = useState(task?.milestoneId ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'Medium')
  const [status, setStatus] = useState<PlannerTaskStatus>(task?.status ?? 'not_started')
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring ?? false)
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState(task?.recurrenceIntervalDays ?? 7)
  const [reminderEnabled, setReminderEnabled] = useState(task?.reminderEnabled ?? true)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Title cannot be empty.')
      return
    }
    setError(null)
    onSave({
      goalId,
      milestoneId: milestoneId || undefined,
      title: title.trim(),
      dueDate: dueDate || undefined,
      priority,
      status,
      isRecurring,
      recurrenceIntervalDays: isRecurring ? recurrenceIntervalDays : undefined,
      reminderEnabled,
    })
  }

  return (
    <div className="space-y-4">
      <Field label="Title" required error={error ?? undefined}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Go for a run" error={!!error} autoFocus />
      </Field>

      {milestones.length > 0 && (
        <Field label="Milestone" hint="Optional">
          <Select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
            <option value="">No milestone</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Due date" hint="Optional">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value as PlannerTaskStatus)}>
          {PLANNER_TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PLANNER_TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
          />
          Recurring task
        </label>
        {isRecurring && (
          <div className="mt-3">
            <Field label="Repeat every" hint="Completing this task pushes its due date forward instead of finishing it for good.">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={recurrenceIntervalDays}
                  onChange={(e) => setRecurrenceIntervalDays(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">days</span>
              </div>
            </Field>
          </div>
        )}
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
          />
          Email me a reminder when this is due
        </label>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button icon={<Save size={16} />} onClick={handleSubmit}>
          {task ? 'Save changes' : 'Add Task'}
        </Button>
      </div>
    </div>
  )
}
