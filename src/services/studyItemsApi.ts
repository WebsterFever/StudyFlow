import type { StudyItem } from '../types'
import { apiRequest } from './api'

export function fetchItems(): Promise<StudyItem[]> {
  return apiRequest<StudyItem[]>('/study-items')
}

export function createItem(item: StudyItem): Promise<StudyItem> {
  return apiRequest<StudyItem>('/study-items', { method: 'POST', body: item })
}

export function bulkCreateItems(items: StudyItem[]): Promise<StudyItem[]> {
  return apiRequest<StudyItem[]>('/study-items/bulk', { method: 'POST', body: { items } })
}

export function updateItem(item: StudyItem): Promise<StudyItem> {
  const { id, ...rest } = item
  return apiRequest<StudyItem>(`/study-items/${id}`, { method: 'PATCH', body: rest })
}

export function deleteItem(id: string): Promise<void> {
  return apiRequest<void>(`/study-items/${id}`, { method: 'DELETE' })
}
