import { useState } from 'react'
import { Save } from 'lucide-react'
import type { PlannerMilestone, PlannerMilestoneInput } from '../../types'
import { Field, Input } from '../ui/Form'
import { Button } from '../ui/Button'

interface MilestoneFormProps {
  goalId: string
  milestone?: PlannerMilestone | null
  onSave: (values: PlannerMilestoneInput) => void
  onCancel?: () => void
}

export function MilestoneForm({ goalId, milestone, onSave, onCancel }: MilestoneFormProps) {
  const [title, setTitle] = useState(milestone?.title ?? '')
  const [dueDate, setDueDate] = useState(milestone?.dueDate ?? '')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Title cannot be empty.')
      return
    }
    setError(null)
    onSave({ goalId, title: title.trim(), dueDate: dueDate || undefined })
  }

  return (
    <div className="space-y-4">
      <Field label="Title" required error={error ?? undefined}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Run first 5k" error={!!error} autoFocus />
      </Field>
      <Field label="Due date" hint="Optional">
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button icon={<Save size={16} />} onClick={handleSubmit}>
          {milestone ? 'Save changes' : 'Add Milestone'}
        </Button>
      </div>
    </div>
  )
}
