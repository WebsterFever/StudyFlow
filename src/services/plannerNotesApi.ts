import type { PlannerNote, PlannerNoteInput } from '../types'
import { apiRequest } from './api'

export function fetchPlannerNotes(goalId?: string): Promise<PlannerNote[]> {
  const query = goalId ? `?goalId=${encodeURIComponent(goalId)}` : ''
  return apiRequest<PlannerNote[]>(`/planner-notes${query}`)
}

export function createPlannerNote(input: PlannerNoteInput): Promise<PlannerNote> {
  return apiRequest<PlannerNote>('/planner-notes', { method: 'POST', body: input })
}

export function updatePlannerNote(id: string, patch: Partial<Omit<PlannerNoteInput, 'goalId'>>): Promise<PlannerNote> {
  return apiRequest<PlannerNote>(`/planner-notes/${id}`, { method: 'PATCH', body: patch })
}

export function deletePlannerNote(id: string): Promise<void> {
  return apiRequest<void>(`/planner-notes/${id}`, { method: 'DELETE' })
}
