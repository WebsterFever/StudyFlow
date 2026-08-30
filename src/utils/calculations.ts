import type { DayOverride, DeadlineStatus, StudyGoal, StudyItem, StudySession } from '../types'
import { addDays, daysBetweenInclusive, getDayOfWeek, isAfter, maxISO, todayISO } from './date'

/** Total minutes of all incomplete study items. */
export function totalUnfinishedMinutes(items: StudyItem[]): number {
  return items.filter((i) => !i.completed).reduce((sum, i) => sum + i.durationMinutes, 0)
}

export function totalItemsCount(items: StudyItem[]): number {
  return items.length
}

export function completedItemsCount(items: StudyItem[]): number {
  return items.filter((i) => i.completed).length
}

/** Available minutes for a single calendar date, respecting overrides. */
export function availableMinutesForDate(
  dateIso: string,
  goal: StudyGoal,
  dayOverrides: Record<string, DayOverride>,
): number {
  const override = dayOverrides[dateIso]
  if (override?.unavailable) return 0
  if (override && override.hoursOverride != null) return override.hoursOverride * 60
  const weekday = getDayOfWeek(dateIso)
  return (goal.dailyHours[weekday] ?? 0) * 60
}

/** Total available study minutes between fromDate and the deadline (inclusive). */
export function totalAvailableMinutes(
  goal: StudyGoal,
  dayOverrides: Record<string, DayOverride>,
  fromDate: string = todayISO(),
): number {
  const start = maxISO(fromDate, goal.startDate)
  if (isAfter(start, goal.deadline)) return 0
  const days = daysBetweenInclusive(start, goal.deadline)
  return days.reduce((sum, day) => sum + availableMinutesForDate(day, goal, dayOverrides), 0)
}

export interface AchievabilitySummary {
  requiredMinutes: number
  availableMinutes: number
  differenceMinutes: number // positive = shortfall
  achievable: boolean
  remainingDays: number
  extraMinutesPerDayNeeded: number
  status: DeadlineStatus
}

export function computeAchievability(
  items: StudyItem[],
  goal: StudyGoal | null,
  dayOverrides: Record<string, DayOverride>,
  fromDate: string = todayISO(),
): AchievabilitySummary {
  if (!goal) {
    return {
      requiredMinutes: 0,
      availableMinutes: 0,
      differenceMinutes: 0,
      achievable: true,
      remainingDays: 0,
      extraMinutesPerDayNeeded: 0,
      status: 'no-goal',
    }
  }
  const required = totalUnfinishedMinutes(items)
  const available = totalAvailableMinutes(goal, dayOverrides, fromDate)
  const difference = required - available
  const start = maxISO(fromDate, goal.startDate)
  const remainingDays = isAfter(start, goal.deadline) ? 0 : daysBetweenInclusive(start, goal.deadline).length
  const extraPerDay = difference > 0 && remainingDays > 0 ? difference / remainingDays : 0

  let status: DeadlineStatus = 'on-track'
  if (difference > 0) {
    const ratio = difference / Math.max(available, 1)
    status = ratio > 0.15 ? 'behind' : 'at-risk'
  }

  return {
    requiredMinutes: required,
    availableMinutes: available,
    differenceMinutes: difference,
    achievable: difference <= 0,
    remainingDays,
    extraMinutesPerDayNeeded: extraPerDay,
    status,
  }
}

export function daysRemaining(goal: StudyGoal | null, fromDate: string = todayISO()): number {
  if (!goal) return 0
  if (isAfter(fromDate, goal.deadline)) return 0
  return daysBetweenInclusive(fromDate, goal.deadline).length
}

export interface ProgressGroup {
  label: string
  completed: number
  total: number
  percent: number
}

function groupProgress(items: StudyItem[], keyFn: (item: StudyItem) => string): ProgressGroup[] {
  const groups = new Map<string, { completed: number; total: number }>()
  for (const item of items) {
    const key = keyFn(item)
    const entry = groups.get(key) ?? { completed: 0, total: 0 }
    entry.total += 1
    if (item.completed) entry.completed += 1
    groups.set(key, entry)
  }
  return Array.from(groups.entries())
    .map(([label, { completed, total }]) => ({
      label,
      completed,
      total,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function progressByCourse(items: StudyItem[]): ProgressGroup[] {
  return groupProgress(items, (i) => i.course)
}

export function progressByTopic(items: StudyItem[]): ProgressGroup[] {
  return groupProgress(items, (i) => i.topic)
}

export function progressByType(items: StudyItem[]): ProgressGroup[] {
  return groupProgress(items, (i) => i.type)
}

export function overallProgress(items: StudyItem[]): ProgressGroup {
  const completed = completedItemsCount(items)
  const total = items.length
  return {
    label: 'Overall',
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}

/** Minutes planned vs actually completed for a specific date, based on sessions. */
export function minutesForDate(sessions: StudySession[], dateIso: string) {
  const daySessions = sessions.filter((s) => s.date === dateIso)
  const planned = daySessions.reduce((sum, s) => sum + s.plannedMinutes, 0)
  const actual = daySessions
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + (s.actualMinutes ?? 0), 0)
  return { planned, actual }
}

export function averageSessionDurationMinutes(sessions: StudySession[]): number {
  const completed = sessions.filter((s) => s.status === 'completed' && s.actualMinutes != null)
  if (completed.length === 0) return 0
  const total = completed.reduce((sum, s) => sum + (s.actualMinutes ?? 0), 0)
  return total / completed.length
}

export function totalPlannedMinutes(sessions: StudySession[]): number {
  return sessions.reduce((sum, s) => sum + s.plannedMinutes, 0)
}

export function totalActualMinutes(sessions: StudySession[]): number {
  return sessions
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + (s.actualMinutes ?? 0), 0)
}

export function nextNDates(fromDate: string, n: number): string[] {
  const dates: string[] = []
  for (let i = 0; i < n; i++) dates.push(addDays(fromDate, i))
  return dates
}
