import type { PlannerMilestone, PlannerMilestoneInput } from '../../types'
import { Modal } from '../ui/Modal'
import { MilestoneForm } from './MilestoneForm'

interface MilestoneFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: PlannerMilestoneInput) => void
  goalId: string
  milestone?: PlannerMilestone | null
}

export function MilestoneFormModal({ open, onClose, onSave, goalId, milestone }: MilestoneFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={milestone ? 'Edit milestone' : 'New milestone'} size="sm">
      <MilestoneForm
        goalId={goalId}
        milestone={milestone}
        onCancel={onClose}
        onSave={(values) => {
          onSave(values)
          onClose()
        }}
      />
    </Modal>
  )
}
