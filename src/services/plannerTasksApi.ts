import type { PlannerTask, PlannerTaskInput } from '../types'
import { apiRequest } from './api'

export function fetchPlannerTasks(goalId?: string): Promise<PlannerTask[]> {
  const query = goalId ? `?goalId=${encodeURIComponent(goalId)}` : ''
  return apiRequest<PlannerTask[]>(`/planner-tasks${query}`)
}

export function createPlannerTask(input: PlannerTaskInput): Promise<PlannerTask> {
  return apiRequest<PlannerTask>('/planner-tasks', { method: 'POST', body: input })
}

export function updatePlannerTask(id: string, patch: Partial<Omit<PlannerTaskInput, 'goalId'>>): Promise<PlannerTask> {
  return apiRequest<PlannerTask>(`/planner-tasks/${id}`, { method: 'PATCH', body: patch })
}

export function deletePlannerTask(id: string): Promise<void> {
  return apiRequest<void>(`/planner-tasks/${id}`, { method: 'DELETE' })
}
