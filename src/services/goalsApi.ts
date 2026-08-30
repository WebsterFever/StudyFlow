import type { StudyGoal } from '../types'
import { apiRequest } from './api'

export async function fetchGoal(): Promise<StudyGoal | null> {
  const goals = await apiRequest<StudyGoal[]>('/goals')
  return goals[0] ?? null
}

/** Create-or-replace: the app only ever has one active goal per user. */
export function saveGoal(goal: StudyGoal): Promise<StudyGoal> {
  const { name, startDate, deadline, dailyHours } = goal
  return apiRequest<StudyGoal>('/goals', { method: 'POST', body: { name, startDate, deadline, dailyHours } })
}

export function deleteGoal(id: string): Promise<void> {
  return apiRequest<void>(`/goals/${id}`, { method: 'DELETE' })
}
