import type { Assignment, AssignmentInput } from '../../types'
import { Modal } from '../ui/Modal'
import { AssignmentForm } from './AssignmentForm'

interface AssignmentFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: AssignmentInput) => void
  goalId: string
  assignment?: Assignment | null
}

export function AssignmentFormModal({ open, onClose, onSave, goalId, assignment }: AssignmentFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={assignment ? 'Edit assignment' : 'New assignment'}>
      <AssignmentForm
        goalId={goalId}
        assignment={assignment}
        onCancel={onClose}
        onSave={(values) => {
          onSave(values)
          onClose()
        }}
      />
    </Modal>
  )
}
