import type { PlannerMilestone, PlannerMilestoneInput } from '../types'
import { apiRequest } from './api'

export function fetchPlannerMilestones(goalId?: string): Promise<PlannerMilestone[]> {
  const query = goalId ? `?goalId=${encodeURIComponent(goalId)}` : ''
  return apiRequest<PlannerMilestone[]>(`/planner-milestones${query}`)
}

export function createPlannerMilestone(input: PlannerMilestoneInput): Promise<PlannerMilestone> {
  return apiRequest<PlannerMilestone>('/planner-milestones', { method: 'POST', body: input })
}

export function updatePlannerMilestone(id: string, patch: Partial<Omit<PlannerMilestoneInput, 'goalId'>>): Promise<PlannerMilestone> {
  return apiRequest<PlannerMilestone>(`/planner-milestones/${id}`, { method: 'PATCH', body: patch })
}

export function deletePlannerMilestone(id: string): Promise<void> {
  return apiRequest<void>(`/planner-milestones/${id}`, { method: 'DELETE' })
}
