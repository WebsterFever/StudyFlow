import type { StudySession } from '../types'
import { addDays, parseISODate, todayISO } from './date'

export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  studyDaysThisWeek: number
  studyDates: Set<string>
}

/** A calendar date counts as a "study day" if at least one session was completed on it. */
function studyDatesFromSessions(sessions: StudySession[]): Set<string> {
  const dates = new Set<string>()
  for (const s of sessions) {
    if (s.status === 'completed' && s.completedAt) {
      dates.add(s.completedAt.slice(0, 10))
    }
  }
  return dates
}

export function computeStreak(sessions: StudySession[], today: string = todayISO()): StreakInfo {
  const studyDates = studyDatesFromSessions(sessions)

  // Current streak: walk backward from today (or yesterday if today has no study yet).
  let currentStreak = 0
  let cursor = studyDates.has(today) ? today : addDays(today, -1)
  while (studyDates.has(cursor)) {
    currentStreak += 1
    cursor = addDays(cursor, -1)
  }

  // Longest streak: scan all study dates sorted chronologically.
  const sorted = Array.from(studyDates).sort()
  let longestStreak = 0
  let running = 0
  let prev: string | null = null
  for (const date of sorted) {
    if (prev && addDays(prev, 1) === date) {
      running += 1
    } else {
      running = 1
    }
    longestStreak = Math.max(longestStreak, running)
    prev = date
  }

  // Study days in the current week (Mon-Sun containing today).
  const jsDay = parseISODate(today).getDay()
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay
  const weekStart = addDays(today, mondayOffset)
  let studyDaysThisWeek = 0
  for (let i = 0; i < 7; i++) {
    if (studyDates.has(addDays(weekStart, i))) studyDaysThisWeek += 1
  }

  return { currentStreak, longestStreak, studyDaysThisWeek, studyDates }
}
