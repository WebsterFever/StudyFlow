import { useState } from 'react'
import { Save } from 'lucide-react'
import type { DailyHours, StudyGoal } from '../../types'
import { DAYS_OF_WEEK } from '../../types'
import { Field, Input } from '../ui/Form'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { weekdayLabel } from '../../utils/date'
import { generateId } from '../../utils/id'
import { makeDefaultDailyHours } from '../../services/storage'

interface GoalFormProps {
  goal: StudyGoal | null
  onSave: (goal: StudyGoal) => void
}

export function GoalForm({ goal, onSave }: GoalFormProps) {
  const [name, setName] = useState(goal?.name ?? '')
  const [startDate, setStartDate] = useState(goal?.startDate ?? '')
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [dailyHours, setDailyHours] = useState<DailyHours>(goal?.dailyHours ?? makeDefaultDailyHours(2))
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
    onSave({
      id: goal?.id ?? generateId('goal'),
      name: name.trim(),
      startDate,
      deadline,
      dailyHours,
    })
  }

  return (
    <Card>
      <CardHeader title="Study goal" subtitle="Your main objective, timeline and daily availability" />
      <div className="space-y-4">
        <Field label="Goal name" required error={errors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Master Frontend Development" error={!!errors.name} />
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

        <div className="flex justify-end">
          <Button icon={<Save size={16} />} onClick={handleSubmit}>
            Save goal
          </Button>
        </div>
      </div>
    </Card>
  )
}
