import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Target } from 'lucide-react'
import { useStudy } from '../hooks/useStudy'
import { useEntitlements } from '../hooks/useEntitlements'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { GoalFormModal } from '../components/settings/GoalFormModal'
import { GoalCard } from '../components/goals/GoalCard'
import type { GoalInput, ReminderSettings, StudyGoal } from '../types'

export default function Goals() {
  const { state, setActiveGoalId, createGoal, updateGoal, duplicateGoal, deleteGoal } = useStudy()
  const { canCreateStudentGoal, limits } = useEntitlements()
  const navigate = useNavigate()

  const [formOpen, setFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<StudyGoal | null>(null)

  const atGoalLimit = !canCreateStudentGoal(state.goals.length)

  const openCreate = () => {
    if (atGoalLimit) return
    setEditingGoal(null)
    setFormOpen(true)
  }
  const openEdit = (goal: StudyGoal) => {
    setEditingGoal(goal)
    setFormOpen(true)
  }

  const handleSave = (values: GoalInput & ReminderSettings) => {
    if (editingGoal) updateGoal(editingGoal.id, values)
    else createGoal(values)
  }

  const handleOpen = (goal: StudyGoal) => {
    setActiveGoalId(goal.id)
    navigate('/')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Study Goals</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage every goal you're working toward</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate} disabled={atGoalLimit} title={atGoalLimit ? `Your plan allows up to ${limits.maxStudentGoals} goals` : undefined}>
          New Goal
        </Button>
      </div>

      {atGoalLimit && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          You've reached your plan's goal limit ({limits.maxStudentGoals}). Upgrade to add more.
        </p>
      )}

      {state.goals.length === 0 ? (
        <EmptyState
          icon={<Target size={40} />}
          title="No study goals yet"
          description="Create your first goal — a name, a start date, a deadline, and how many hours you can study each day."
          action={<Button icon={<Plus size={16} />} onClick={openCreate}>Create your first goal</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              items={state.items.filter((i) => i.goalId === goal.id)}
              isActive={goal.id === state.activeGoalId}
              onOpen={() => handleOpen(goal)}
              onEdit={() => openEdit(goal)}
              onDuplicate={() => duplicateGoal(goal.id)}
              onDelete={() => setDeletingGoal(goal)}
              onToggleComplete={() => updateGoal(goal.id, { status: goal.status === 'completed' ? 'active' : 'completed' })}
            />
          ))}
        </div>
      )}

      <GoalFormModal open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} goal={editingGoal} />

      <ConfirmDialog
        open={deletingGoal != null}
        title="Delete goal"
        message={`Are you sure you want to delete "${deletingGoal?.name}"? This permanently removes its study content, schedule and history.`}
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
