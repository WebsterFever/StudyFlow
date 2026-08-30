import type { DayOverride } from '../types'
import { apiRequest } from './api'

export function fetchDayOverrides(): Promise<DayOverride[]> {
  return apiRequest<DayOverride[]>('/day-overrides')
}

export function upsertDayOverride(
  goalId: string,
  date: string,
  unavailable: boolean,
  hoursOverride: number | null,
): Promise<DayOverride> {
  return apiRequest<DayOverride>(`/day-overrides/${goalId}/${date}`, { method: 'PUT', body: { unavailable, hoursOverride } })
}

export function deleteDayOverride(goalId: string, date: string): Promise<void> {
  return apiRequest<void>(`/day-overrides/${goalId}/${date}`, { method: 'DELETE' })
}
