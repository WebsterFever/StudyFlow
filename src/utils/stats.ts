import type { StudyItem, StudySession } from '../types'
import { addDays, todayISO } from './date'
import { minutesForDate } from './calculations'

export interface DailyMinutes {
  date: string
  label: string
  planned: number
  actual: number
}

export function hoursPerDaySeries(sessions: StudySession[], days = 14, endDate: string = todayISO()): DailyMinutes[] {
  const series: DailyMinutes[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(endDate, -i)
    const { planned, actual } = minutesForDate(sessions, date)
    const label = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    series.push({ date, label, planned, actual })
  }
  return series
}

export interface TopicMastery {
  topic: string
  averageMastery: number
  ratedCount: number
}

export function masteryByTopic(items: StudyItem[]): TopicMastery[] {
  const groups = new Map<string, number[]>()
  for (const item of items) {
    if (item.mastery == null) continue
    const list = groups.get(item.topic) ?? []
    list.push(item.mastery)
    groups.set(item.topic, list)
  }
  return Array.from(groups.entries()).map(([topic, ratings]) => ({
    topic,
    averageMastery: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
    ratedCount: ratings.length,
  }))
}

export interface TypeCount {
  type: string
  count: number
}

export function lessonsCompletedByType(items: StudyItem[]): TypeCount[] {
  const groups = new Map<string, number>()
  for (const item of items) {
    if (!item.completed) continue
    groups.set(item.type, (groups.get(item.type) ?? 0) + 1)
  }
  return Array.from(groups.entries()).map(([type, count]) => ({ type, count }))
}

export interface EstimateVsActual {
  label: string
  estimated: number
  actual: number
}

/** Compares estimated vs actual minutes for the most recently completed items. */
export function estimatedVsActual(items: StudyItem[], sessions: StudySession[], limit = 8): EstimateVsActual[] {
  const completedItems = items
    .filter((i) => i.completed && i.completedDate)
    .sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''))
    .slice(0, limit)

  return completedItems
    .map((item) => {
      const itemSessions = sessions.filter((s) => s.itemId === item.id && s.status === 'completed')
      const actual = itemSessions.reduce((sum, s) => sum + (s.actualMinutes ?? 0), 0)
      return {
        label: item.title.length > 18 ? `${item.title.slice(0, 18)}…` : item.title,
        estimated: item.durationMinutes,
        actual,
      }
    })
    .reverse()
}
