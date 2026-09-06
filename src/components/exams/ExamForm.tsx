import { useState } from 'react'
import { Save } from 'lucide-react'
import type { Exam, ExamInput } from '../../types'
import { Field, Input } from '../ui/Form'
import { Button } from '../ui/Button'

interface ExamFormProps {
  goalId: string
  exam?: Exam | null
  onSave: (values: ExamInput) => void
  onCancel?: () => void
}

export function ExamForm({ goalId, exam, onSave, onCancel }: ExamFormProps) {
  const [title, setTitle] = useState(exam?.title ?? '')
  const [examDate, setExamDate] = useState(exam?.examDate ?? '')
  const [reminderEnabled, setReminderEnabled] = useState(exam?.reminderEnabled ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {}
    if (!title.trim()) nextErrors.title = 'Title cannot be empty.'
    if (!examDate) nextErrors.examDate = 'Exam date is required.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    onSave({ goalId, title: title.trim(), examDate, reminderEnabled })
  }

  return (
    <div className="space-y-4">
      <Field label="Title" required error={errors.title}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Midterm Exam"
          error={!!errors.title}
          autoFocus
        />
      </Field>

      <Field label="Exam date" required error={errors.examDate}>
        <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} error={!!errors.examDate} />
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
          {exam ? 'Save changes' : 'Create Exam'}
        </Button>
      </div>
    </div>
  )
}
