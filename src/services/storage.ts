import type { ActiveTimer, AppState, DailyHours, Difficulty, MasteryRating, Priority, SessionStatus, StudyType } from '../types'
import { DAYS_OF_WEEK } from '../types'

const TIMER_KEY = 'studyflow_timer_v1'
const LEGACY_KEY = 'studyflow_v1'
const LEGACY_BACKUP_KEY = 'studyflow_v1_backup'
const MIGRATION_DISMISSED_KEY = 'studyflow_migration_dismissed'
const ACTIVE_GOAL_KEY = 'studyflow_active_goal_id'

export function createEmptyState(): AppState {
  return {
    goals: [],
    activeGoalId: null,
    items: [],
    sessions: [],
    dayOverrides: [],
    activeTimer: null,
  }
}

// ---- Active timer: client-only, ephemeral, never sent to the backend ----
// (Cross-device sync doesn't apply to "what's ticking right now on this device".)

export function loadActiveTimer(): ActiveTimer | null {
  try {
    const raw = localStorage.getItem(TIMER_KEY)
    return raw ? (JSON.parse(raw) as ActiveTimer) : null
  } catch {
    return null
  }
}

export function saveActiveTimer(timer: ActiveTimer | null): void {
  try {
    if (timer) localStorage.setItem(TIMER_KEY, JSON.stringify(timer))
    else localStorage.removeItem(TIMER_KEY)
  } catch {
    // ignore (private browsing / storage full)
  }
}

// ---- Active goal selection: a UI preference only. The goal data itself
// always lives in PostgreSQL — this just remembers which one to show. ----

export function loadActiveGoalId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_GOAL_KEY)
  } catch {
    return null
  }
}

export function saveActiveGoalId(goalId: string | null): void {
  try {
    if (goalId) localStorage.setItem(ACTIVE_GOAL_KEY, goalId)
    else localStorage.removeItem(ACTIVE_GOAL_KEY)
  } catch {
    // ignore
  }
}

// ---- Legacy pre-auth data (old single-goal studyflow_v1 blob), used for one-time migration ----
// Shaped to match what the pre-multi-goal app actually wrote: no goalId on
// items/sessions/overrides, no status on the goal.

export interface LegacyStudyItem {
  id: string
  title: string
  course: string
  topic: string
  type: StudyType
  durationMinutes: number
  difficulty: Difficulty
  priority: Priority
  completed: boolean
  completedDate: string | null
  mastery: MasteryRating | null
  notes: string
  createdDate: string
  order: number
}

export interface LegacyStudySession {
  id: string
  itemId: string
  date: string
  order: number
  plannedMinutes: number
  partIndex: number
  partTotal: number
  status: SessionStatus
  actualMinutes: number | null
  startedAt: string | null
  completedAt: string | null
  manuallyAdjusted: boolean
}

export interface LegacyDayOverride {
  date: string
  unavailable: boolean
  hoursOverride: number | null
}

export interface LegacyAppState {
  goal: { id: string; name: string; startDate: string; deadline: string; dailyHours: DailyHours } | null
  items: LegacyStudyItem[]
  sessions: LegacyStudySession[]
  dayOverrides: Record<string, LegacyDayOverride>
}

function isValidLegacyState(data: unknown): data is LegacyAppState {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return Array.isArray(d.items) && Array.isArray(d.sessions) && typeof d.dayOverrides === 'object' && d.dayOverrides !== null
}

/** Returns the legacy pre-auth data if present and non-empty, else null. */
export function loadLegacyData(): LegacyAppState | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!isValidLegacyState(parsed)) return null
    if (!parsed.goal && parsed.items.length === 0) return null
    return { goal: parsed.goal ?? null, items: parsed.items, sessions: parsed.sessions, dayOverrides: parsed.dayOverrides }
  } catch {
    return null
  }
}

/** Moves legacy data out of the active key (so the prompt won't reappear) without deleting it. */
export function archiveLegacyData(): void {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (raw) {
      localStorage.setItem(LEGACY_BACKUP_KEY, raw)
      localStorage.removeItem(LEGACY_KEY)
    }
  } catch {
    // ignore
  }
}

export function dismissMigrationPromptForSession(): void {
  try {
    sessionStorage.setItem(MIGRATION_DISMISSED_KEY, 'true')
  } catch {
    // ignore
  }
}

export function isMigrationPromptDismissed(): boolean {
  try {
    return sessionStorage.getItem(MIGRATION_DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}

// ---- Generic JSON export/import helpers (manual backup/restore via Settings) ----

export function downloadJson(filenamePrefix: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `${filenamePrefix}-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readJsonFile<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)) as T)
      } catch {
        reject(new Error('That file could not be read as JSON.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read the selected file.'))
    reader.readAsText(file)
  })
}

export function makeDefaultDailyHours(hours = 2): Record<(typeof DAYS_OF_WEEK)[number], number> {
  const record = {} as Record<(typeof DAYS_OF_WEEK)[number], number>
  for (const day of DAYS_OF_WEEK) record[day] = hours
  return record
}
