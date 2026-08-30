import type { DailyHours, DayOverride, GoalStatus, StudyItem, StudySession } from '../types'
import type { LegacyAppState } from './storage'
import { apiRequest } from './api'

export interface GoalBundle {
  id?: string
  name: string
  startDate: string
  deadline: string
  dailyHours: DailyHours
  status?: GoalStatus
  items: StudyItem[]
  sessions: StudySession[]
  dayOverrides: Record<string, DayOverride>
}

export interface MultiGoalPayload {
  goals: GoalBundle[]
}

/** The pre-multi-goal `studyflow_v1` shape, still accepted by /data/migrate-local for existing local backups. */
export type LegacyImportPayload = LegacyAppState

export interface ImportSummary {
  goalsImported: number
  itemsImported: number
  sessionsImported: number
  dayOverridesImported: number
}

export interface MigrateResult {
  migrated: boolean
  alreadyMigrated: boolean
  summary: ImportSummary | null
}

export function migrateLocalData(payload: LegacyImportPayload): Promise<MigrateResult> {
  return apiRequest<MigrateResult>('/data/migrate-local', { method: 'POST', body: payload })
}

export function restoreData(payload: MultiGoalPayload): Promise<ImportSummary> {
  return apiRequest<ImportSummary>('/data/restore', { method: 'POST', body: payload })
}

export function wipeAllData(): Promise<void> {
  return apiRequest<void>('/data/wipe', { method: 'DELETE' })
}
