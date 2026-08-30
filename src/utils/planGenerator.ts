import type {
  DayOverride,
  Priority,
  SessionStatus,
  StudyGoal,
  StudyItem,
  StudySession,
  StudyType,
} from '../types'
import { availableMinutesForDate } from './calculations'
import { addDays, todayISO } from './date'
import { generateId } from './id'

const MIN_FIRST_CHUNK_MINUTES = 15
// Safety cap on how many days ahead we'll search for capacity, so a plan where every
// day has 0 available hours can't loop forever.
const MAX_DAY_LOOKAHEAD = 3650

const PRIORITY_RANK: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 }
const TYPE_RANK: Record<StudyType, number> = {
  Video: 0,
  Reading: 1,
  Exercise: 2,
  Project: 3,
  Review: 4,
}

function isBeforeDate(a: string, b: string): boolean {
  return a < b
}

/** Priority first, then grouped by topic (keeps related exercises near their videos), then type, then creation order. */
function sortForScheduling(items: StudyItem[]): StudyItem[] {
  return [...items].sort((a, b) => {
    if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    }
    if (a.topic !== b.topic) return a.topic.localeCompare(b.topic)
    if (TYPE_RANK[a.type] !== TYPE_RANK[b.type]) return TYPE_RANK[a.type] - TYPE_RANK[b.type]
    if (a.order !== b.order) return a.order - b.order
    return a.createdDate.localeCompare(b.createdDate)
  })
}

export interface PlanResult {
  sessions: StudySession[]
  unscheduledItemIds: string[]
}

/**
 * Regenerates the study plan starting at `fromDate`.
 *
 * - Sessions dated before `fromDate` are historical: completed/skipped ones are kept untouched;
 *   ones that were planned but never completed are converted to "skipped" (missed) so the day's
 *   history is honest, and the leftover minutes flow back into the scheduling pool.
 * - Sessions dated on/after `fromDate` that are in-progress or were manually adjusted by the user
 *   are locked in place (they reserve their day's capacity but are not moved).
 * - Every other future/incomplete slice of work is freely reflowed across the remaining days,
 *   respecting each day's available hours, in priority -> topic -> type order.
 */
export function regeneratePlan(
  items: StudyItem[],
  goal: StudyGoal,
  dayOverrides: Record<string, DayOverride>,
  existingSessions: StudySession[],
  fromDate: string = todayISO(),
): PlanResult {
  const pastSessions = existingSessions.filter((s) => isBeforeDate(s.date, fromDate))
  const futureSessions = existingSessions.filter((s) => !isBeforeDate(s.date, fromDate))

  const preservedPast: StudySession[] = pastSessions.map((s) => {
    if (s.status === 'completed' || s.status === 'skipped') return s
    const missed: SessionStatus = 'skipped'
    return { ...s, status: missed }
  })
  const preservedFuture = futureSessions.filter((s) => s.status === 'completed' || s.status === 'skipped')
  const locked = futureSessions.filter(
    (s) => s.status !== 'completed' && s.status !== 'skipped' && (s.status === 'in-progress' || s.manuallyAdjusted),
  )
  const preserved = [...preservedPast, ...preservedFuture]

  const accountedByItem = new Map<string, number>()
  for (const s of preserved) {
    if (s.status === 'completed') {
      accountedByItem.set(s.itemId, (accountedByItem.get(s.itemId) ?? 0) + s.plannedMinutes)
    }
  }
  for (const s of locked) {
    accountedByItem.set(s.itemId, (accountedByItem.get(s.itemId) ?? 0) + s.plannedMinutes)
  }

  const lockedMinutesByDate = new Map<string, number>()
  for (const s of locked) {
    lockedMinutesByDate.set(s.date, (lockedMinutesByDate.get(s.date) ?? 0) + s.plannedMinutes)
  }

  const itemsToSchedule = sortForScheduling(
    items.filter((i) => !i.completed && i.durationMinutes - (accountedByItem.get(i.id) ?? 0) > 0),
  )

  const days: string[] = []
  const capacity: number[] = []
  function ensureDay(index: number) {
    while (days.length <= index) {
      const date = days.length === 0 ? fromDate : addDays(days[days.length - 1], 1)
      days.push(date)
      const base = availableMinutesForDate(date, goal, dayOverrides)
      const used = lockedMinutesByDate.get(date) ?? 0
      capacity.push(Math.max(0, base - used))
    }
  }
  ensureDay(0)

  const generated: StudySession[] = []
  const unscheduledItemIds: string[] = []
  let dayIndex = 0

  for (const item of itemsToSchedule) {
    let remaining = item.durationMinutes - (accountedByItem.get(item.id) ?? 0)
    const parts: { date: string; minutes: number }[] = []
    let startedAllocating = false
    let guard = 0

    while (remaining > 0) {
      guard += 1
      if (guard > MAX_DAY_LOOKAHEAD) {
        unscheduledItemIds.push(item.id)
        break
      }
      ensureDay(dayIndex)
      if (capacity[dayIndex] <= 0) {
        dayIndex += 1
        continue
      }
      if (!startedAllocating && capacity[dayIndex] < Math.min(MIN_FIRST_CHUNK_MINUTES, remaining)) {
        dayIndex += 1
        continue
      }
      const chunk = Math.min(remaining, capacity[dayIndex])
      parts.push({ date: days[dayIndex], minutes: chunk })
      capacity[dayIndex] -= chunk
      remaining -= chunk
      startedAllocating = true
      if (capacity[dayIndex] <= 0) dayIndex += 1
    }

    const partTotal = parts.length
    parts.forEach((part, idx) => {
      generated.push({
        id: generateId('session'),
        goalId: goal.id,
        itemId: item.id,
        date: part.date,
        order: 0,
        plannedMinutes: part.minutes,
        partIndex: idx + 1,
        partTotal,
        status: 'planned',
        actualMinutes: null,
        startedAt: null,
        completedAt: null,
        manuallyAdjusted: false,
      })
    })
  }

  const byDate = new Map<string, StudySession[]>()
  for (const s of [...preserved, ...locked, ...generated]) {
    const list = byDate.get(s.date) ?? []
    list.push(s)
    byDate.set(s.date, list)
  }
  const ordered: StudySession[] = []
  for (const list of byDate.values()) {
    list.sort((a, b) => a.order - b.order)
    list.forEach((s, idx) => ordered.push({ ...s, order: idx }))
  }
  ordered.sort((a, b) => (a.date === b.date ? a.order - b.order : a.date.localeCompare(b.date)))

  return { sessions: ordered, unscheduledItemIds }
}
