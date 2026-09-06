import type { Exam, ExamInput } from '../../types'
import { Modal } from '../ui/Modal'
import { ExamForm } from './ExamForm'

interface ExamFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: ExamInput) => void
  goalId: string
  exam?: Exam | null
}

export function ExamFormModal({ open, onClose, onSave, goalId, exam }: ExamFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={exam ? 'Edit exam' : 'New exam'}>
      <ExamForm
        goalId={goalId}
        exam={exam}
        onCancel={onClose}
        onSave={(values) => {
          onSave(values)
          onClose()
        }}
      />
    </Modal>
  )
}
