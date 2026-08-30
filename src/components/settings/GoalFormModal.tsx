import type { GoalInput, StudyGoal } from '../../types'
import { Modal } from '../ui/Modal'
import { GoalForm } from './GoalForm'

interface GoalFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: GoalInput) => void
  goal?: StudyGoal | null
}

export function GoalFormModal({ open, onClose, onSave, goal }: GoalFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit goal' : 'New goal'} size="lg">
      <GoalForm
        goal={goal}
        onCancel={onClose}
        onSave={(values) => {
          onSave(values)
          onClose()
        }}
      />
    </Modal>
  )
}
