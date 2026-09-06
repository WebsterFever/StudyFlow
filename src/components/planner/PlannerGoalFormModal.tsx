import type { PlannerGoal, PlannerGoalInput } from '../../types'
import { Modal } from '../ui/Modal'
import { PlannerGoalForm } from './PlannerGoalForm'

interface PlannerGoalFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: PlannerGoalInput) => void
  goal?: PlannerGoal | null
}

export function PlannerGoalFormModal({ open, onClose, onSave, goal }: PlannerGoalFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={goal ? 'Edit goal' : 'New planner goal'} size="lg">
      <PlannerGoalForm
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
