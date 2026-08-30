import type { GoalInput, GoalStatus, StudyGoal, StudyItem } from '../types'
import { apiRequest } from './api'

export function fetchGoals(): Promise<StudyGoal[]> {
  return apiRequest<StudyGoal[]>('/goals')
}

export function createGoal(input: GoalInput): Promise<StudyGoal> {
  return apiRequest<StudyGoal>('/goals', { method: 'POST', body: input })
}

export function updateGoal(id: string, patch: Partial<GoalInput> & { status?: GoalStatus }): Promise<StudyGoal> {
  return apiRequest<StudyGoal>(`/goals/${id}`, { method: 'PATCH', body: patch })
}

export function duplicateGoal(id: string, name?: string): Promise<{ goal: StudyGoal; items: StudyItem[] }> {
  return apiRequest<{ goal: StudyGoal; items: StudyItem[] }>(`/goals/${id}/duplicate`, { method: 'POST', body: { name } })
}

export function deleteGoal(id: string): Promise<void> {
  return apiRequest<void>(`/goals/${id}`, { method: 'DELETE' })
}
