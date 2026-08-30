import { useState } from 'react'
import { Save } from 'lucide-react'
import type { DailyHours, GoalInput, ReminderSettings, StudyGoal } from '../../types'
import { DAYS_OF_WEEK, REMINDER_INTERVAL_MINUTES_OPTIONS } from '../../types'
import { Field, Input, Select } from '../ui/Form'
import { Button } from '../ui/Button'
import { weekdayLabel } from '../../utils/date'
import { makeDefaultDailyHours } from '../../services/storage'

interface GoalFormProps {
  goal?: StudyGoal | null
  onSave: (values: GoalInput & ReminderSettings) => void
  onCancel?: () => void
  submitLabel?: string
}

function formatReminderInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`
  const hours = minutes / 60
  return hours === 1 ? '1 hour' : `${hours} hours`
}

function formatLastReminder(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const timeLabel = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const isToday = new Date().toDateString() === date.toDateString()
  return `${isToday ? 'Today' : dateLabel} at ${timeLabel}`
}

export function GoalForm({ goal, onSave, onCancel, submitLabel }: GoalFormProps) {
  const [name, setName] = useState(goal?.name ?? '')
  const [startDate, setStartDate] = useState(goal?.startDate ?? '')
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [dailyHours, setDailyHours] = useState<DailyHours>(goal?.dailyHours ?? makeDefaultDailyHours(2))
  const [reminderEnabled, setReminderEnabled] = useState(goal?.reminderEnabled ?? false)
  const [reminderIntervalMinutes, setReminderIntervalMinutes] = useState(goal?.reminderIntervalMinutes ?? 120)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setHour = (day: keyof DailyHours, value: string) => {
    const parsed = Number(value)
    setDailyHours((prev) => ({ ...prev, [day]: Number.isFinite(parsed) ? parsed : 0 }))
  }

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = 'Goal name cannot be empty.'
    if (!startDate) nextErrors.startDate = 'Start date is required.'
    if (!deadline) nextErrors.deadline = 'Deadline is required.'
    if (startDate && deadline && deadline < startDate) nextErrors.deadline = 'Deadline cannot be before the start date.'
    for (const day of DAYS_OF_WEEK) {
      if (dailyHours[day] < 0) nextErrors[day] = 'Hours cannot be negative.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    onSave({ name: name.trim(), startDate, deadline, dailyHours, reminderEnabled, reminderIntervalMinutes })
  }

  const lastReminderLabel = formatLastReminder(goal?.lastReminderSentAt ?? null)

  return (
    <div className="space-y-4">
      <Field label="Goal name" required error={errors.name}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Frontend Mastery"
          error={!!errors.name}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Start date" required error={errors.startDate}>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={!!errors.startDate} />
        </Field>
        <Field label="Deadline" required error={errors.deadline}>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} error={!!errors.deadline} />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Daily study hours</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {DAYS_OF_WEEK.map((day) => (
            <Field key={day} label={weekdayLabel(day)} error={errors[day]}>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={dailyHours[day]}
                onChange={(e) => setHour(day, e.target.value)}
                error={!!errors[day]}
              />
            </Field>
          ))}
        </div>
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
                {REMINDER_INTERVAL_MINUTES_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatReminderInterval(minutes)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {lastReminderLabel && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Last reminder: <span className="font-medium text-slate-700 dark:text-slate-300">{lastReminderLabel}</span>
          </p>
        )}

        {reminderEnabled && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Reminders continue automatically while this goal is active.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button icon={<Save size={16} />} onClick={handleSubmit}>
          {submitLabel ?? (goal ? 'Save changes' : 'Create Goal')}
        </Button>
      </div>
    </div>
  )
}
