import { useState } from 'react'
import { Save } from 'lucide-react'
import type { PlannerGoal, PlannerGoalInput, Priority } from '../../types'
import { PLANNER_REMINDER_INTERVAL_MINUTES_OPTIONS, PRIORITIES } from '../../types'
import { Field, Input, Select, Textarea } from '../ui/Form'
import { Button } from '../ui/Button'

interface PlannerGoalFormProps {
  goal?: PlannerGoal | null
  onSave: (values: PlannerGoalInput) => void
  onCancel?: () => void
}

function formatReminderInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  if (minutes < 1440) return `${minutes / 60} hours`
  const days = minutes / 1440
  return days === 1 ? '1 day' : `${days} days`
}

export function PlannerGoalForm({ goal, onSave, onCancel }: PlannerGoalFormProps) {
  const [name, setName] = useState(goal?.name ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [priority, setPriority] = useState<Priority>(goal?.priority ?? 'Medium')
  const [reminderEnabled, setReminderEnabled] = useState(goal?.reminderEnabled ?? false)
  const [reminderIntervalMinutes, setReminderIntervalMinutes] = useState(goal?.reminderIntervalMinutes ?? 1440)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrors({ name: 'Goal name cannot be empty.' })
      return
    }
    setErrors({})
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      priority,
      reminderEnabled,
      reminderIntervalMinutes,
    })
  }

  return (
    <div className="space-y-4">
      <Field label="Goal name" required error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Get Fit" error={!!errors.name} autoFocus />
      </Field>

      <Field label="Description" hint="Optional — what does success look like?">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="e.g. Run a 5k without stopping" />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Deadline" hint="Optional — leave blank for an open-ended goal">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
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

      <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700">
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Email reminders</p>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
          />
          Remind me about this goal
        </label>
        {reminderEnabled && (
          <div className="mt-3">
            <Field label="Send reminder every">
              <Select value={reminderIntervalMinutes} onChange={(e) => setReminderIntervalMinutes(Number(e.target.value))}>
                {PLANNER_REMINDER_INTERVAL_MINUTES_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatReminderInterval(minutes)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button icon={<Save size={16} />} onClick={handleSubmit}>
          {goal ? 'Save changes' : 'Create Goal'}
        </Button>
      </div>
    </div>
  )
}
