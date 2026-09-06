import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Flag, ListChecks, Plus } from 'lucide-react'
import { usePlanner } from '../hooks/usePlanner'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ProgressBar } from '../components/ui/ProgressBar'
import { MilestoneRow } from '../components/planner/MilestoneRow'
import { MilestoneFormModal } from '../components/planner/MilestoneFormModal'
import { TaskRow } from '../components/planner/TaskRow'
import { TaskFormModal } from '../components/planner/TaskFormModal'
import { formatFriendlyDate } from '../utils/date'
import type { PlannerMilestone, PlannerMilestoneInput, PlannerSubtask, PlannerTask, PlannerTaskInput } from '../types'

export default function PlannerFlowHome() {
  const {
    state,
    activeGoal,
    milestones,
    tasks,
    subtasksForTask,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    createTask,
    updateTask,
    deleteTask,
    createSubtask,
    updateSubtask,
    deleteSubtask,
  } = usePlanner()

  const [milestoneFormOpen, setMilestoneFormOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<PlannerMilestone | null>(null)
  const [deletingMilestone, setDeletingMilestone] = useState<PlannerMilestone | null>(null)

  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null)
  const [deletingTask, setDeletingTask] = useState<PlannerTask | null>(null)

  if (state.goals.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList size={40} />}
        title="Welcome to PlannerFlow"
        description="Create a goal to start planning — a name, an optional deadline, and priority. Then add milestones and tasks to break it down."
        action={
          <Link to="/planner/goals">
            <Button icon={<Plus size={16} />}>Create your first goal</Button>
          </Link>
        }
      />
    )
  }

  if (!activeGoal) {
    return (
      <EmptyState
        icon={<Flag size={40} />}
        title="Select a goal"
        description="Choose a goal from the sidebar to see its plan."
      />
    )
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const percent = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100)

  const milestoneById = new Map(milestones.map((m) => [m.id, m.title]))
  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order)
  const sortedTasks = [...tasks].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))

  const openCreateMilestone = () => {
    setEditingMilestone(null)
    setMilestoneFormOpen(true)
  }
  const openEditMilestone = (milestone: PlannerMilestone) => {
    setEditingMilestone(milestone)
    setMilestoneFormOpen(true)
  }
  const handleSaveMilestone = (values: PlannerMilestoneInput) => {
    if (editingMilestone) updateMilestone(editingMilestone.id, values)
    else createMilestone(values)
  }

  const openCreateTask = () => {
    setEditingTask(null)
    setTaskFormOpen(true)
  }
  const openEditTask = (task: PlannerTask) => {
    setEditingTask(task)
    setTaskFormOpen(true)
  }
  const handleSaveTask = (values: PlannerTaskInput) => {
    if (editingTask) updateTask(editingTask.id, values)
    else createTask(values)
  }

  const handleToggleSubtask = (subtask: PlannerSubtask) => updateSubtask(subtask.id, { completed: !subtask.completed })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Current goal</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeGoal.name}</h2>
          {activeGoal.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{activeGoal.description}</p>}
        </div>
        {activeGoal.deadline && (
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Deadline</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatFriendlyDate(activeGoal.deadline)}</p>
            </div>
          </div>
        )}
      </div>

      <Card>
        <ProgressBar percent={percent} showPercent label={`${completedTasks} / ${tasks.length} tasks complete`} tone={percent >= 100 && tasks.length > 0 ? 'green' : 'indigo'} />
      </Card>

      <Card>
        <CardHeader
          title="Milestones"
          action={
            <Button size="sm" variant="secondary" icon={<Flag size={14} />} onClick={openCreateMilestone}>
              Add
            </Button>
          }
        />
        {sortedMilestones.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No milestones yet.</p>
        ) : (
          <div className="space-y-2">
            {sortedMilestones.map((milestone) => (
              <MilestoneRow
                key={milestone.id}
                milestone={milestone}
                onToggleComplete={() => updateMilestone(milestone.id, { completed: !milestone.completed })}
                onEdit={() => openEditMilestone(milestone)}
                onDelete={() => setDeletingMilestone(milestone)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Tasks"
          action={
            <Button size="sm" variant="secondary" icon={<ListChecks size={14} />} onClick={openCreateTask}>
              Add
            </Button>
          }
        />
        {sortedTasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No tasks yet.</p>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                milestoneName={task.milestoneId ? (milestoneById.get(task.milestoneId) ?? null) : null}
                subtasks={subtasksForTask(task.id)}
                onToggleComplete={() => updateTask(task.id, { status: task.status === 'completed' ? 'not_started' : 'completed' })}
                onEdit={() => openEditTask(task)}
                onDelete={() => setDeletingTask(task)}
                onAddSubtask={(title) => createSubtask({ taskId: task.id, title })}
                onToggleSubtask={handleToggleSubtask}
                onDeleteSubtask={(subtask) => deleteSubtask(subtask.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <MilestoneFormModal
        open={milestoneFormOpen}
        onClose={() => setMilestoneFormOpen(false)}
        onSave={handleSaveMilestone}
        goalId={activeGoal.id}
        milestone={editingMilestone}
      />
      <TaskFormModal
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        onSave={handleSaveTask}
        goalId={activeGoal.id}
        milestones={milestones}
        task={editingTask}
      />

      <ConfirmDialog
        open={deletingMilestone != null}
        title="Delete milestone"
        message={`Are you sure you want to delete "${deletingMilestone?.title}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deletingMilestone) deleteMilestone(deletingMilestone.id)
          setDeletingMilestone(null)
        }}
        onCancel={() => setDeletingMilestone(null)}
      />
      <ConfirmDialog
        open={deletingTask != null}
        title="Delete task"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This also removes its subtasks.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deletingTask) deleteTask(deletingTask.id)
          setDeletingTask(null)
        }}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  )
}
