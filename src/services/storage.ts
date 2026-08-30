import type { AppState, PersistedData } from '../types'
import { DAYS_OF_WEEK } from '../types'

const STORAGE_KEY = 'studyflow_v1'
const VERSION = '1'

export function createEmptyState(): AppState {
  return {
    goal: null,
    items: [],
    sessions: [],
    dayOverrides: {},
    activeTimer: null,
    demoDataLoaded: false,
  }
}

function isValidState(data: unknown): data is AppState {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (!Array.isArray(d.items)) return false
  if (!Array.isArray(d.sessions)) return false
  if (typeof d.dayOverrides !== 'object' || d.dayOverrides === null) return false
  return true
}

/** Loads StudyFlow data from localStorage. Returns an empty state if missing or invalid. */
export function loadStudyData(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyState()
    const parsed = JSON.parse(raw) as PersistedData
    if (!isValidState(parsed)) return createEmptyState()
    const empty = createEmptyState()
    return {
      goal: parsed.goal ?? empty.goal,
      items: parsed.items ?? empty.items,
      sessions: parsed.sessions ?? empty.sessions,
      dayOverrides: parsed.dayOverrides ?? empty.dayOverrides,
      activeTimer: parsed.activeTimer ?? empty.activeTimer,
      demoDataLoaded: parsed.demoDataLoaded ?? empty.demoDataLoaded,
    }
  } catch {
    return createEmptyState()
  }
}

export function saveStudyData(state: AppState): void {
  try {
    const payload: PersistedData = { ...state, version: VERSION }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage may be full or unavailable (e.g. private browsing); fail silently.
  }
}

export function clearStudyData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function exportStudyData(state: AppState): void {
  const payload: PersistedData = { ...state, version: VERSION }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `studyflow-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importStudyData(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!isValidState(parsed)) {
          reject(new Error('That file does not look like a valid StudyFlow backup.'))
          return
        }
        const empty = createEmptyState()
        resolve({
          goal: parsed.goal ?? empty.goal,
          items: parsed.items ?? empty.items,
          sessions: parsed.sessions ?? empty.sessions,
          dayOverrides: parsed.dayOverrides ?? empty.dayOverrides,
          activeTimer: parsed.activeTimer ?? empty.activeTimer,
          demoDataLoaded: parsed.demoDataLoaded ?? empty.demoDataLoaded,
        })
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
