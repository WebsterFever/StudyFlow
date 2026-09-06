import type { Exam, ExamInput } from '../types'
import { apiRequest } from './api'

export function fetchExams(goalId?: string): Promise<Exam[]> {
  const query = goalId ? `?goalId=${encodeURIComponent(goalId)}` : ''
  return apiRequest<Exam[]>(`/exams${query}`)
}

export function createExam(input: ExamInput): Promise<Exam> {
  return apiRequest<Exam>('/exams', { method: 'POST', body: input })
}

export function updateExam(id: string, patch: Partial<Omit<ExamInput, 'goalId'>>): Promise<Exam> {
  return apiRequest<Exam>(`/exams/${id}`, { method: 'PATCH', body: patch })
}

export function replaceExamReviewItems(id: string, studyItemIds: string[]): Promise<Exam> {
  return apiRequest<Exam>(`/exams/${id}/review-items`, { method: 'PUT', body: { studyItemIds } })
}

export function deleteExam(id: string): Promise<void> {
  return apiRequest<void>(`/exams/${id}`, { method: 'DELETE' })
}
