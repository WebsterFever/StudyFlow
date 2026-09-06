import type { PlannerGoal, PlannerGoalInput, PlannerGoalStatus } from '../types'
import { apiRequest } from './api'

export function fetchPlannerGoals(): Promise<PlannerGoal[]> {
  return apiRequest<PlannerGoal[]>('/planner-goals')
}

export function createPlannerGoal(input: PlannerGoalInput): Promise<PlannerGoal> {
  return apiRequest<PlannerGoal>('/planner-goals', { method: 'POST', body: input })
}

export function updatePlannerGoal(id: string, patch: Partial<PlannerGoalInput> & { status?: PlannerGoalStatus }): Promise<PlannerGoal> {
  return apiRequest<PlannerGoal>(`/planner-goals/${id}`, { method: 'PATCH', body: patch })
}

export function deletePlannerGoal(id: string): Promise<void> {
  return apiRequest<void>(`/planner-goals/${id}`, { method: 'DELETE' })
}
