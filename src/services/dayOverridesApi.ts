import type { DayOverride } from '../types'
import { apiRequest } from './api'

export function fetchDayOverrides(): Promise<DayOverride[]> {
  return apiRequest<DayOverride[]>('/day-overrides')
}

export function upsertDayOverride(override: DayOverride): Promise<DayOverride> {
  return apiRequest<DayOverride>(`/day-overrides/${override.date}`, {
    method: 'PUT',
    body: { unavailable: override.unavailable, hoursOverride: override.hoursOverride },
  })
}

export function deleteDayOverride(date: string): Promise<void> {
  return apiRequest<void>(`/day-overrides/${date}`, { method: 'DELETE' })
}
