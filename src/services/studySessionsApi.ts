import type { StudySession } from '../types'
import { apiRequest } from './api'

export function fetchSessions(): Promise<StudySession[]> {
  return apiRequest<StudySession[]>('/study-sessions')
}

/** Replaces one goal's entire session list — used after the plan generator recalculates that goal. */
export function replaceAllSessions(goalId: string, sessions: StudySession[]): Promise<StudySession[]> {
  return apiRequest<StudySession[]>('/study-sessions', { method: 'PUT', body: { goalId, sessions } })
}

export function updateSession(id: string, patch: Partial<StudySession>): Promise<StudySession> {
  return apiRequest<StudySession>(`/study-sessions/${id}`, { method: 'PATCH', body: patch })
}

export function reorderSessions(goalId: string, date: string, orderedIds: string[]): Promise<StudySession[]> {
  return apiRequest<StudySession[]>('/study-sessions/reorder', { method: 'PATCH', body: { goalId, date, orderedIds } })
}

export function deleteSession(id: string): Promise<void> {
  return apiRequest<void>(`/study-sessions/${id}`, { method: 'DELETE' })
}
