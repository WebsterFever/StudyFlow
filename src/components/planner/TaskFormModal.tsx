import type { PlannerMilestone, PlannerTask, PlannerTaskInput } from '../../types'
import { Modal } from '../ui/Modal'
import { TaskForm } from './TaskForm'

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (values: PlannerTaskInput) => void
  goalId: string
  milestones: PlannerMilestone[]
  task?: PlannerTask | null
}

export function TaskFormModal({ open, onClose, onSave, goalId, milestones, task }: TaskFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <TaskForm
        goalId={goalId}
        milestones={milestones}
        task={task}
        onCancel={onClose}
        onSave={(values) => {
          onSave(values)
          onClose()
        }}
      />
    </Modal>
  )
}
