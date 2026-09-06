import type { Assignment, AssignmentInput } from '../types'
import { apiRequest } from './api'

export function fetchAssignments(goalId?: string): Promise<Assignment[]> {
  const query = goalId ? `?goalId=${encodeURIComponent(goalId)}` : ''
  return apiRequest<Assignment[]>(`/assignments${query}`)
}

export function createAssignment(input: AssignmentInput): Promise<Assignment> {
  return apiRequest<Assignment>('/assignments', { method: 'POST', body: input })
}

export function updateAssignment(id: string, patch: Partial<Omit<AssignmentInput, 'goalId'>>): Promise<Assignment> {
  return apiRequest<Assignment>(`/assignments/${id}`, { method: 'PATCH', body: patch })
}

export function deleteAssignment(id: string): Promise<void> {
  return apiRequest<void>(`/assignments/${id}`, { method: 'DELETE' })
}
