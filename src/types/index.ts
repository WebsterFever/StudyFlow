// Core domain types for StudyFlow.
// Union string literals are used instead of `enum` (erasableSyntaxOnly).

export type StudyType = 'Video' | 'Exercise' | 'Project' | 'Reading' | 'Review'

export const STUDY_TYPES: StudyType[] = ['Video', 'Exercise', 'Project', 'Reading', 'Review']

export type Difficulty = 'Easy' | 'Intermediate' | 'Hard'

export const DIFFICULTIES: Difficulty[] = ['Easy', 'Intermediate', 'Hard']

export type Priority = 'Low' | 'Medium' | 'High'

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High']

export type MasteryRating = 1 | 2 | 3 | 4 | 5

export const MASTERY_LABELS: Record<MasteryRating, string> = {
  1: 'Very weak',
  2: 'Weak',
  3: 'Understand',
  4: 'Good',
  5: 'Mastered',
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export type DailyHours = Record<DayOfWeek, number>

export type GoalStatus = 'active' | 'completed' | 'paused'

export const GOAL_STATUSES: GoalStatus[] = ['active', 'completed', 'paused']

// Values are minutes. Sub-hour options exist so a user can verify the
// reminder pipeline actually works without waiting hours for the first send.
export const REMINDER_INTERVAL_MINUTES_OPTIONS = [5, 10, 30, 60, 120, 240, 360, 720, 1440] as const
export type ReminderIntervalMinutes = (typeof REMINDER_INTERVAL_MINUTES_OPTIONS)[number]

export interface StudyGoal {
  id: string
  name: string
  startDate: string // ISO yyyy-mm-dd
  deadline: string // ISO yyyy-mm-dd
  dailyHours: DailyHours
  status: GoalStatus
  reminderEnabled: boolean
  reminderIntervalMinutes: number
  lastReminderSentAt: string | null // ISO datetime
}

/** The editable fields of a goal — what a create/edit form collects, before the backend assigns id/status. */
export interface GoalInput {
  name: string
  startDate: string
  deadline: string
  dailyHours: DailyHours
}

export interface ReminderSettings {
  reminderEnabled: boolean
  reminderIntervalMinutes: number
}

export interface StudyItem {
  id: string
  goalId: string
  title: string
  course: string
  topic: string
  type: StudyType
  durationMinutes: number
  difficulty: Difficulty
  priority: Priority
  completed: boolean
  completedDate: string | null // ISO datetime
  mastery: MasteryRating | null
  notes: string
  createdDate: string // ISO datetime
  order: number // for stable ordering / learning sequence
}

export type SessionStatus = 'planned' | 'in-progress' | 'completed' | 'skipped'

export interface StudySession {
  id: string
  goalId: string
  itemId: string
  date: string // ISO yyyy-mm-dd, planned date
  order: number // order within the day
  plannedMinutes: number // may be less than the item's full duration if split
  partIndex: number // 1-based
  partTotal: number // total parts this item was split into
  status: SessionStatus
  actualMinutes: number | null
  startedAt: string | null // ISO datetime
  completedAt: string | null // ISO datetime
  manuallyAdjusted: boolean // true once user manually moves/edits this session
}

export interface DayOverride {
  id: string
  goalId: string
  date: string // ISO yyyy-mm-dd
  unavailable: boolean
  hoursOverride: number | null // null = use goal's default hours for that weekday
}

export interface StudyPlanDay {
  date: string
  availableMinutes: number
  sessions: StudySession[]
}

export interface StudyHistoryEntry {
  date: string // ISO yyyy-mm-dd
  plannedMinutes: number
  actualMinutes: number
  sessionsCompleted: number
}

export interface ActiveTimer {
  sessionId: string
  itemId: string
  goalId: string
  startedAt: string // ISO datetime of the current run start
  accumulatedSeconds: number // seconds banked from previous runs (before pause)
  isPaused: boolean
}

export interface ReviewSuggestion {
  itemId: string
  itemTitle: string
  topic: string
  course: string
  mastery: MasteryRating
  dueDates: string[] // ISO yyyy-mm-dd suggested review dates
}

export type DeadlineStatus = 'on-track' | 'at-risk' | 'behind' | 'no-goal'

/**
 * The full state held by StudyContext: every goal, plus every item/session/
 * day-override across ALL goals (not just the active one). Per-goal views
 * are derived by filtering on `goalId` rather than re-fetching on switch,
 * which is what makes switching goals instant and lets "All Goals" views
 * (Today, combined workload) work without extra requests.
 */
export interface AppState {
  goals: StudyGoal[]
  activeGoalId: string | null
  items: StudyItem[]
  sessions: StudySession[]
  dayOverrides: DayOverride[]
  activeTimer: ActiveTimer | null
}
