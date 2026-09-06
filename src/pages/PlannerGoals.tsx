import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { usePlanner } from '../hooks/usePlanner'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PlannerGoalFormModal } from '../components/planner/PlannerGoalFormModal'
import { PlannerGoalCard } from '../components/planner/PlannerGoalCard'
import type { PlannerGoal, PlannerGoalInput } from '../types'

export default function PlannerGoals() {
  const { state, setActiveGoalId, createGoal, updateGoal, deleteGoal } = usePlanner()
  const navigate = useNavigate()

  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<PlannerGoal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<PlannerGoal | null>(null)

  const openCreate = () => {
    setEditingGoal(null)
    setFormOpen(true)
  }
  const openEdit = (goal: PlannerGoal) => {
    setEditingGoal(goal)
    setFormOpen(true)
  }

  const handleSave = (values: PlannerGoalInput) => {
    if (editingGoal) updateGoal(editingGoal.id, values)
    else createGoal(values)
  }

  const handleOpen = (goal: PlannerGoal) => {
    setActiveGoalId(goal.id)
    navigate('/planner')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Planner Goals</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage every goal you're working toward</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>
          New Goal
        </Button>
      </div>

      {state.goals.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={40} />}
          title="No planner goals yet"
          description="Create your first goal — a name, an optional deadline, and priority."
          action={<Button icon={<Plus size={16} />} onClick={openCreate}>Create your first goal</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.goals.map((goal) => (
            <PlannerGoalCard
              key={goal.id}
              goal={goal}
              tasks={state.tasks.filter((t) => t.goalId === goal.id)}
              isActive={goal.id === state.activeGoalId}
              onOpen={() => handleOpen(goal)}
              onEdit={() => openEdit(goal)}
              onDelete={() => setDeletingGoal(goal)}
              onToggleComplete={() => updateGoal(goal.id, { status: goal.status === 'completed' ? 'active' : 'completed' })}
            />
          ))}
        </div>
      )}

      <PlannerGoalFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} goal={editingGoal} />

      <ConfirmDialog
        open={deletingGoal != null}
        title="Delete goal"
        message={`Are you sure you want to delete "${deletingGoal?.name}"? This permanently removes its milestones, tasks and notes.`}
        confirmLabel="Delete goal"
        danger
        onConfirm={() => {
          if (deletingGoal) deleteGoal(deletingGoal.id)
          setDeletingGoal(null)
        }}
        onCancel={() => setDeletingGoal(null)}
      />
    </div>
  )
}
