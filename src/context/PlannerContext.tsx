import type { ReactNode } from 'react'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  PlannerGoal,
  PlannerGoalInput,
  PlannerGoalStatus,
  PlannerMilestone,
  PlannerMilestoneInput,
  PlannerNote,
  PlannerNoteInput,
  PlannerSubtask,
  PlannerSubtaskInput,
  PlannerTask,
  PlannerTaskInput,
} from '../types'
import * as plannerGoalsApi from '../services/plannerGoalsApi'
import * as plannerMilestonesApi from '../services/plannerMilestonesApi'
import * as plannerTasksApi from '../services/plannerTasksApi'
import * as plannerSubtasksApi from '../services/plannerSubtasksApi'
import * as plannerNotesApi from '../services/plannerNotesApi'

const ACTIVE_PLANNER_GOAL_KEY = 'goalflow_active_planner_goal_id'

function loadActivePlannerGoalId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PLANNER_GOAL_KEY)
  } catch {
    return null
  }
}

function saveActivePlannerGoalId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_PLANNER_GOAL_KEY, id)
    else localStorage.removeItem(ACTIVE_PLANNER_GOAL_KEY)
  } catch {
    // Non-fatal — the active goal just won't persist across reloads.
  }
}

interface PlannerState {
  goals: PlannerGoal[]
  activeGoalId: string | null
  milestones: PlannerMilestone[]
  tasks: PlannerTask[]
  subtasks: PlannerSubtask[]
  notes: PlannerNote[]
}

function emptyState(): PlannerState {
  return { goals: [], activeGoalId: null, milestones: [], tasks: [], subtasks: [], notes: [] }
}

function pickInitialActiveGoalId(goals: PlannerGoal[]): string | null {
  const stored = loadActivePlannerGoalId()
  if (stored && goals.some((g) => g.id === stored)) return stored
  return goals[0]?.id ?? null
}

interface PlannerContextValue {
  state: PlannerState
  activeGoal: PlannerGoal | null
  milestones: PlannerMilestone[]
  tasks: PlannerTask[]
  notes: PlannerNote[]

  isLoading: boolean
  loadError: string | null
  syncError: string | null
  clearSyncError: () => void
  retryLoad: () => void

  setActiveGoalId: (goalId: string) => void
  createGoal: (values: PlannerGoalInput) => Promise<PlannerGoal>
  updateGoal: (id: string, values: Partial<PlannerGoalInput> & { status?: PlannerGoalStatus }) => Promise<void>
  deleteGoal: (id: string) => Promise<void>

  subtasksForTask: (taskId: string) => PlannerSubtask[]

  createMilestone: (values: PlannerMilestoneInput) => Promise<void>
  updateMilestone: (id: string, values: Partial<Omit<PlannerMilestoneInput, 'goalId'>>) => Promise<void>
  deleteMilestone: (id: string) => Promise<void>

  createTask: (values: PlannerTaskInput) => Promise<void>
  updateTask: (id: string, values: Partial<Omit<PlannerTaskInput, 'goalId'>>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  createSubtask: (values: PlannerSubtaskInput) => Promise<void>
  updateSubtask: (id: string, values: Partial<Omit<PlannerSubtaskInput, 'taskId'>>) => Promise<void>
  deleteSubtask: (id: string) => Promise<void>

  createNote: (values: PlannerNoteInput) => Promise<void>
  updateNote: (id: string, values: Partial<Omit<PlannerNoteInput, 'goalId'>>) => Promise<void>
  deleteNote: (id: string) => Promise<void>

  resetLocalState: () => void
}

export const PlannerContext = createContext<PlannerContextValue | null>(null)

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlannerState>(emptyState)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [loadNonce, setLoadNonce] = useState(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const reportSyncError = useCallback((err: unknown, fallback: string) => {
    // eslint-disable-next-line no-console
    console.error(fallback, err)
    setSyncError(err instanceof Error ? err.message : fallback)
  }, [])

  useEffect(() => {
    saveActivePlannerGoalId(state.activeGoalId)
  }, [state.activeGoalId])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    Promise.all([
      plannerGoalsApi.fetchPlannerGoals(),
      plannerMilestonesApi.fetchPlannerMilestones(),
      plannerTasksApi.fetchPlannerTasks(),
      plannerSubtasksApi.fetchPlannerSubtasks(),
      plannerNotesApi.fetchPlannerNotes(),
    ])
      .then(([goals, milestones, tasks, subtasks, notes]) => {
        if (cancelled) return
        setState({ goals, activeGoalId: pickInitialActiveGoalId(goals), milestones, tasks, subtasks, notes })
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Could not load your planner data.')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadNonce])

  const retryLoad = useCallback(() => setLoadNonce((n) => n + 1), [])
  const clearSyncError = useCallback(() => setSyncError(null), [])
  const resetLocalState = useCallback(() => setState(emptyState()), [])

  const setActiveGoalId = useCallback((goalId: string) => {
    setState((prev) => ({ ...prev, activeGoalId: goalId }))
  }, [])

  // ---- Goals ----

  const createGoal = useCallback(
    async (values: PlannerGoalInput): Promise<PlannerGoal> => {
      try {
        const created = await plannerGoalsApi.createPlannerGoal(values)
        setState((prev) => ({ ...prev, goals: [...prev.goals, created], activeGoalId: created.id }))
        return created
      } catch (err) {
        reportSyncError(err, 'Failed to create planner goal.')
        throw err
      }
    },
    [reportSyncError],
  )

  const updateGoal = useCallback(
    async (id: string, values: Partial<PlannerGoalInput> & { status?: PlannerGoalStatus }) => {
      try {
        const updated = await plannerGoalsApi.updatePlannerGoal(id, values)
        setState((prev) => ({ ...prev, goals: prev.goals.map((g) => (g.id === id ? updated : g)) }))
      } catch (err) {
        reportSyncError(err, 'Failed to update planner goal.')
        throw err
      }
    },
    [reportSyncError],
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      try {
        await plannerGoalsApi.deletePlannerGoal(id)
        setState((prev) => {
          const goals = prev.goals.filter((g) => g.id !== id)
          const milestones = prev.milestones.filter((m) => m.goalId !== id)
          const tasks = prev.tasks.filter((t) => t.goalId !== id)
          const removedTaskIds = new Set(prev.tasks.filter((t) => t.goalId === id).map((t) => t.id))
          const subtasks = prev.subtasks.filter((s) => !removedTaskIds.has(s.taskId))
          const notes = prev.notes.filter((n) => n.goalId !== id)
          const activeGoalId = prev.activeGoalId === id ? (goals[0]?.id ?? null) : prev.activeGoalId
          return { ...prev, goals, milestones, tasks, subtasks, notes, activeGoalId }
        })
      } catch (err) {
        reportSyncError(err, 'Failed to delete planner goal.')
        throw err
      }
    },
    [reportSyncError],
  )

  // ---- Milestones ----

  const createMilestone = useCallback(
    async (values: PlannerMilestoneInput) => {
      try {
        const created = await plannerMilestonesApi.createPlannerMilestone(values)
        setState((prev) => ({ ...prev, milestones: [...prev.milestones, created] }))
      } catch (err) {
        reportSyncError(err, 'Failed to create milestone.')
        throw err
      }
    },
    [reportSyncError],
  )

  const updateMilestone = useCallback(
    async (id: string, values: Partial<Omit<PlannerMilestoneInput, 'goalId'>>) => {
      try {
        const updated = await plannerMilestonesApi.updatePlannerMilestone(id, values)
        setState((prev) => ({ ...prev, milestones: prev.milestones.map((m) => (m.id === id ? updated : m)) }))
      } catch (err) {
        reportSyncError(err, 'Failed to update milestone.')
        throw err
      }
    },
    [reportSyncError],
  )

  const deleteMilestone = useCallback(
    async (id: string) => {
      try {
        await plannerMilestonesApi.deletePlannerMilestone(id)
        setState((prev) => ({ ...prev, milestones: prev.milestones.filter((m) => m.id !== id) }))
      } catch (err) {
        reportSyncError(err, 'Failed to delete milestone.')
        throw err
      }
    },
    [reportSyncError],
  )

  // ---- Tasks ----

  const createTask = useCallback(
    async (values: PlannerTaskInput) => {
      try {
        const created = await plannerTasksApi.createPlannerTask(values)
        setState((prev) => ({ ...prev, tasks: [...prev.tasks, created] }))
      } catch (err) {
        reportSyncError(err, 'Failed to create task.')
        throw err
      }
    },
    [reportSyncError],
  )

  const updateTask = useCallback(
    async (id: string, values: Partial<Omit<PlannerTaskInput, 'goalId'>>) => {
      try {
        const updated = await plannerTasksApi.updatePlannerTask(id, values)
        setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === id ? updated : t)) }))
      } catch (err) {
        reportSyncError(err, 'Failed to update task.')
        throw err
      }
    },
    [reportSyncError],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await plannerTasksApi.deletePlannerTask(id)
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id),
          subtasks: prev.subtasks.filter((s) => s.taskId !== id),
        }))
      } catch (err) {
        reportSyncError(err, 'Failed to delete task.')
        throw err
      }
    },
    [reportSyncError],
  )

  // ---- Subtasks ----

  const createSubtask = useCallback(
    async (values: PlannerSubtaskInput) => {
      try {
        const created = await plannerSubtasksApi.createPlannerSubtask(values)
        setState((prev) => ({ ...prev, subtasks: [...prev.subtasks, created] }))
      } catch (err) {
        reportSyncError(err, 'Failed to create subtask.')
        throw err
      }
    },
    [reportSyncError],
  )

  const updateSubtask = useCallback(
    async (id: string, values: Partial<Omit<PlannerSubtaskInput, 'taskId'>>) => {
      try {
        const updated = await plannerSubtasksApi.updatePlannerSubtask(id, values)
        setState((prev) => ({ ...prev, subtasks: prev.subtasks.map((s) => (s.id === id ? updated : s)) }))
      } catch (err) {
        reportSyncError(err, 'Failed to update subtask.')
        throw err
      }
    },
    [reportSyncError],
  )

  const deleteSubtask = useCallback(
    async (id: string) => {
      try {
        await plannerSubtasksApi.deletePlannerSubtask(id)
        setState((prev) => ({ ...prev, subtasks: prev.subtasks.filter((s) => s.id !== id) }))
      } catch (err) {
        reportSyncError(err, 'Failed to delete subtask.')
        throw err
      }
    },
    [reportSyncError],
  )

  // ---- Notes ----

  const createNote = useCallback(
    async (values: PlannerNoteInput) => {
      try {
        const created = await plannerNotesApi.createPlannerNote(values)
        setState((prev) => ({ ...prev, notes: [created, ...prev.notes] }))
      } catch (err) {
        reportSyncError(err, 'Failed to create note.')
        throw err
      }
    },
    [reportSyncError],
  )

  const updateNote = useCallback(
    async (id: string, values: Partial<Omit<PlannerNoteInput, 'goalId'>>) => {
      try {
        const updated = await plannerNotesApi.updatePlannerNote(id, values)
        setState((prev) => ({ ...prev, notes: prev.notes.map((n) => (n.id === id ? updated : n)) }))
      } catch (err) {
        reportSyncError(err, 'Failed to update note.')
        throw err
      }
    },
    [reportSyncError],
  )

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        await plannerNotesApi.deletePlannerNote(id)
        setState((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }))
      } catch (err) {
        reportSyncError(err, 'Failed to delete note.')
        throw err
      }
    },
    [reportSyncError],
  )

  // ---- Derived ----

  const activeGoal = useMemo(() => state.goals.find((g) => g.id === state.activeGoalId) ?? null, [state.goals, state.activeGoalId])
  const activeMilestones = useMemo(() => state.milestones.filter((m) => m.goalId === state.activeGoalId), [state.milestones, state.activeGoalId])
  const activeTasks = useMemo(() => state.tasks.filter((t) => t.goalId === state.activeGoalId), [state.tasks, state.activeGoalId])
  const activeNotes = useMemo(() => state.notes.filter((n) => n.goalId === state.activeGoalId), [state.notes, state.activeGoalId])

  const subtasksForTask = useCallback((taskId: string) => stateRef.current.subtasks.filter((s) => s.taskId === taskId), [])

  const value = useMemo<PlannerContextValue>(
    () => ({
      state,
      activeGoal,
      milestones: activeMilestones,
      tasks: activeTasks,
      notes: activeNotes,
      isLoading,
      loadError,
      syncError,
      clearSyncError,
      retryLoad,
      setActiveGoalId,
      createGoal,
      updateGoal,
      deleteGoal,
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
      createNote,
      updateNote,
      deleteNote,
      resetLocalState,
    }),
    [
      state,
      activeGoal,
      activeMilestones,
      activeTasks,
      activeNotes,
      isLoading,
      loadError,
      syncError,
      clearSyncError,
      retryLoad,
      setActiveGoalId,
      createGoal,
      updateGoal,
      deleteGoal,
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
      createNote,
      updateNote,
      deleteNote,
      resetLocalState,
    ],
  )

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>
}
