import type { DayOverride, StudyGoal, StudyItem, StudySession } from '../types'
import { apiRequest } from './api'

export interface ImportPayload {
  goal: StudyGoal | null
  items: StudyItem[]
  sessions: StudySession[]
  dayOverrides: Record<string, DayOverride>
}

export interface ImportSummary {
  goalImported: boolean
  itemsImported: number
  sessionsImported: number
  dayOverridesImported: number
}

export interface MigrateResult {
  migrated: boolean
  alreadyMigrated: boolean
  summary: ImportSummary | null
}

export function migrateLocalData(payload: ImportPayload): Promise<MigrateResult> {
  return apiRequest<MigrateResult>('/data/migrate-local', { method: 'POST', body: payload })
}

export function restoreData(payload: ImportPayload): Promise<ImportSummary> {
  return apiRequest<ImportSummary>('/data/restore', { method: 'POST', body: payload })
}

export function wipeAllData(): Promise<void> {
  return apiRequest<void>('/data/wipe', { method: 'DELETE' })
}
