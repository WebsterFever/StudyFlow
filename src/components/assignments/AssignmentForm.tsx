import { useState } from 'react'
import { Save } from 'lucide-react'
import type { Assignment, AssignmentInput, AssignmentStatus, Priority } from '../../types'
import { ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUSES, PRIORITIES } from '../../types'
import { Field, Input, Select } from '../ui/Form'
import { Button } from '../ui/Button'

interface AssignmentFormProps {
  goalId: string
  assignment?: Assignment | null
  onSave: (values: AssignmentInput) => void
  onCancel?: () => void
}

export function AssignmentForm({ goalId, assignment, onSave, onCancel }: AssignmentFormProps) {
  const [title, setTitle] = useState(assignment?.title ?? '')
  const [dueDate, setDueDate] = useState(assignment?.dueDate ?? '')
  const [status, setStatus] = useState<AssignmentStatus>(assignment?.status ?? 'not_started')
  const [priority, setPriority] = useState<Priority>(assignment?.priority ?? 'Medium')
  const [reminderEnabled, setReminderEnabled] = useState(assignment?.reminderEnabled ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {}
    if (!title.trim()) nextErrors.title = 'Title cannot be empty.'
    if (!dueDate) nextErrors.dueDate = 'Due date is required.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    onSave({ goalId, title: title.trim(), dueDate, status, priority, reminderEnabled })
  }

  return (
    <div className="space-y-4">
      <Field label="Title" required error={errors.title}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Lab Report 3"
          error={!!errors.title}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Due date" required error={errors.dueDate}>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} error={!!errors.dueDate} />
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
        <Select value={status} onChange={(e) => setStatus(e.target.value as AssignmentStatus)}>
          {ASSIGNMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ASSIGNMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={reminderEnabled}
          onChange={(e) => setReminderEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
        />
        Email me a reminder when this is due
      </label>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button icon={<Save size={16} />} onClick={handleSubmit}>
          {assignment ? 'Save changes' : 'Create Assignment'}
        </Button>
      </div>
    </div>
  )
}
