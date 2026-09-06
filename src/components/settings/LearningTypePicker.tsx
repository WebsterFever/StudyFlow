import type { LearningType } from '../../types'
import { LEARNING_TYPES, LEARNING_TYPE_LABELS } from '../../types'
import { Field, Select } from '../ui/Form'

interface LearningTypePickerProps {
  value: LearningType
  onChange: (value: LearningType) => void
}

export function LearningTypePicker({ value, onChange }: LearningTypePickerProps) {
  return (
    <Field label="What are you learning?" required>
      <Select value={value} onChange={(e) => onChange(e.target.value as LearningType)}>
        {LEARNING_TYPES.map((type) => (
          <option key={type} value={type}>
            {LEARNING_TYPE_LABELS[type]}
          </option>
        ))}
      </Select>
    </Field>
  )
}
