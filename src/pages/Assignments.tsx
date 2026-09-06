import { useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { useGoalAssignments } from '../hooks/useAssignments'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { AssignmentFormModal } from '../components/assignments/AssignmentFormModal'
import { AssignmentRow } from '../components/assignments/AssignmentRow'
import type { Assignment, AssignmentInput } from '../types'

export default function Assignments() {
  const { activeGoal } = useStudy()
  const goalId = activeGoal?.id ?? ''
  const { assignments, isLoading, error, addAssignment, editAssignment, removeAssignment } = useGoalAssignments(goalId)

  const [formOpen, setFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null)

  if (!activeGoal) {
    return (
      <EmptyState
        icon={<ClipboardList size={40} />}
        title="No active goal"
        description="Create or open a study goal first, then track its assignments here."
      />
    )
  }

  const openCreate = () => {
    setEditingAssignment(null)
    setFormOpen(true)
  }
  const openEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setFormOpen(true)
  }

  const handleSave = (values: AssignmentInput) => {
    if (editingAssignment) editAssignment(editingAssignment.id, values)
    else addAssignment(values)
  }

  const sorted = [...assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Assignments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{activeGoal.name}</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>
          New Assignment
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading assignments...</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={40} />}
          title="No assignments yet"
          description="Track homework, labs, and other assignments due for this goal."
          action={<Button icon={<Plus size={16} />} onClick={openCreate}>Add your first assignment</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {sorted.map((assignment) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              onEdit={() => openEdit(assignment)}
              onDelete={() => setDeletingAssignment(assignment)}
              onToggleComplete={() => editAssignment(assignment.id, { status: 'completed' })}
            />
          ))}
        </div>
      )}

      <AssignmentFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} goalId={goalId} assignment={editingAssignment} />

      <ConfirmDialog
        open={deletingAssignment != null}
        title="Delete assignment"
        message={`Are you sure you want to delete "${deletingAssignment?.title}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deletingAssignment) removeAssignment(deletingAssignment.id)
          setDeletingAssignment(null)
        }}
        onCancel={() => setDeletingAssignment(null)}
      />
    </div>
  )
}
