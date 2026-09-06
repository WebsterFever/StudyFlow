import type { PlannerSubtask, PlannerSubtaskInput } from '../types'
import { apiRequest } from './api'

export function fetchPlannerSubtasks(taskId?: string): Promise<PlannerSubtask[]> {
  const query = taskId ? `?taskId=${encodeURIComponent(taskId)}` : ''
  return apiRequest<PlannerSubtask[]>(`/planner-subtasks${query}`)
}

export function createPlannerSubtask(input: PlannerSubtaskInput): Promise<PlannerSubtask> {
  return apiRequest<PlannerSubtask>('/planner-subtasks', { method: 'POST', body: input })
}

export function updatePlannerSubtask(id: string, patch: Partial<Omit<PlannerSubtaskInput, 'taskId'>>): Promise<PlannerSubtask> {
  return apiRequest<PlannerSubtask>(`/planner-subtasks/${id}`, { method: 'PATCH', body: patch })
}

export function deletePlannerSubtask(id: string): Promise<void> {
  return apiRequest<void>(`/planner-subtasks/${id}`, { method: 'DELETE' })
}
