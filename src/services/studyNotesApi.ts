import type { StudyNote, StudyNoteInput } from '../types'
import { apiRequest } from './api'

export function fetchItemNotes(goalId: string, itemId: string): Promise<StudyNote[]> {
  return apiRequest<StudyNote[]>(`/study-notes?goalId=${goalId}&itemId=${itemId}`)
}

export function fetchGoalNotes(goalId: string): Promise<StudyNote[]> {
  return apiRequest<StudyNote[]>(`/study-notes?goalId=${goalId}`)
}

export function createNote(goalId: string, studyItemId: string, input: StudyNoteInput): Promise<StudyNote> {
  return apiRequest<StudyNote>('/study-notes', { method: 'POST', body: { goalId, studyItemId, ...input } })
}

export function updateNote(id: string, patch: Partial<StudyNoteInput>): Promise<StudyNote> {
  return apiRequest<StudyNote>(`/study-notes/${id}`, { method: 'PATCH', body: patch })
}

export function deleteNote(id: string): Promise<void> {
  return apiRequest<void>(`/study-notes/${id}`, { method: 'DELETE' })
}
