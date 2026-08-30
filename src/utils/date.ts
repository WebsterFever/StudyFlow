import type { DayOfWeek } from '../types'
import { DAYS_OF_WEEK } from '../types'

/** Returns today's date as an ISO yyyy-mm-dd string in local time. */
export function todayISO(): string {
  return toISODate(new Date())
}

/** Converts a Date to an ISO yyyy-mm-dd string using local time components. */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parses an ISO yyyy-mm-dd string into a local Date at midnight. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

/** Inclusive day difference between two ISO dates (b - a). */
export function diffDays(aIso: string, bIso: string): number {
  const a = parseISODate(aIso)
  const b = parseISODate(bIso)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((b.getTime() - a.getTime()) / msPerDay)
}

export function isBefore(aIso: string, bIso: string): boolean {
  return aIso < bIso
}

export function isAfter(aIso: string, bIso: string): boolean {
  return aIso > bIso
}

export function maxISO(aIso: string, bIso: string): string {
  return aIso > bIso ? aIso : bIso
}

export function minISO(aIso: string, bIso: string): string {
  return aIso < bIso ? aIso : bIso
}

const JS_DAY_TO_DAY_OF_WEEK: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export function getDayOfWeek(iso: string): DayOfWeek {
  const date = parseISODate(iso)
  return JS_DAY_TO_DAY_OF_WEEK[date.getDay()]
}

const WEEKDAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export function weekdayLabel(day: DayOfWeek): string {
  return WEEKDAY_LABELS[day]
}

export function shortWeekdayLabel(day: DayOfWeek): string {
  return WEEKDAY_LABELS[day].slice(0, 3)
}

export { DAYS_OF_WEEK }

/** Formats an ISO date as e.g. "September 17" */
export function formatFriendlyDate(iso: string, opts?: { withYear?: boolean; withWeekday?: boolean }): string {
  const date = parseISODate(iso)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: opts?.withYear ? 'numeric' : undefined,
    weekday: opts?.withWeekday ? 'long' : undefined,
  })
}

export function formatShortDate(iso: string): string {
  const date = parseISODate(iso)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Formats a minute count as e.g. "1h 30m", "45m", "2h" */
export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes)
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Formats a minute count as e.g. "1h 30m" always showing hours with one decimal too if useful */
export function formatHours(totalMinutes: number): string {
  const hours = totalMinutes / 60
  return `${hours.toFixed(1)}h`
}

/** Formats seconds as HH:MM:SS for the study timer. */
export function formatStopwatch(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function isSameDay(aIso: string, bIso: string): boolean {
  return aIso === bIso
}

/** Returns the ISO date of the Monday that starts the week containing iso. */
export function startOfWeek(iso: string): string {
  const date = parseISODate(iso)
  const jsDay = date.getDay() // 0 = Sunday
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay
  date.setDate(date.getDate() + diffToMonday)
  return toISODate(date)
}

export function daysBetweenInclusive(startIso: string, endIso: string): string[] {
  const days: string[] = []
  let cursor = startIso
  while (!isAfter(cursor, endIso)) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}
