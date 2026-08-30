import type { StudySession } from '../types'
import { apiRequest } from './api'

export function fetchSessions(): Promise<StudySession[]> {
  return apiRequest<StudySession[]>('/study-sessions')
}

/** Replaces the user's entire session list — used after the plan generator recalculates. */
export function replaceAllSessions(sessions: StudySession[]): Promise<StudySession[]> {
  return apiRequest<StudySession[]>('/study-sessions', { method: 'PUT', body: { sessions } })
}

export function updateSession(id: string, patch: Partial<StudySession>): Promise<StudySession> {
  return apiRequest<StudySession>(`/study-sessions/${id}`, { method: 'PATCH', body: patch })
}

export function reorderSessions(date: string, orderedIds: string[]): Promise<StudySession[]> {
  return apiRequest<StudySession[]>('/study-sessions/reorder', { method: 'PATCH', body: { date, orderedIds } })
}

export function deleteSession(id: string): Promise<void> {
  return apiRequest<void>(`/study-sessions/${id}`, { method: 'DELETE' })
}
