import type { Difficulty, Priority, StudyType } from '../types'
import { STUDY_TYPES } from '../types'

export interface BulkDefaults {
  course: string
  topic: string
  difficulty: Difficulty
  priority: Priority
}

export interface ParsedRow {
  line: number
  title: string
  course: string
  topic: string
  type: StudyType
  minutes: number
  difficulty: Difficulty
  priority: Priority
}

export interface BulkParseError {
  line: number
  text: string
  reason: string
}

export interface BulkParseResult {
  rows: ParsedRow[]
  errors: BulkParseError[]
}

function matchType(raw: string): StudyType | null {
  const found = STUDY_TYPES.find((t) => t.toLowerCase() === raw.trim().toLowerCase())
  return found ?? null
}

/**
 * Supported line formats (pipe-separated):
 *   Title | Minutes
 *   Title | Type | Minutes
 *   Title | Topic | Type | Minutes
 *   Title | Course | Topic | Type | Minutes
 * Missing course/topic fall back to the provided defaults.
 */
export function parseBulkText(text: string, defaults: BulkDefaults): BulkParseResult {
  const rows: ParsedRow[] = []
  const errors: BulkParseError[] = []

  const lines = text.split('\n')
  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim()
    if (line === '') return
    const lineNumber = idx + 1
    const parts = line.split('|').map((p) => p.trim())

    let title = ''
    let course = defaults.course
    let topic = defaults.topic
    let typeRaw = 'Video'
    let minutesRaw = ''

    if (parts.length === 2) {
      ;[title, minutesRaw] = parts
    } else if (parts.length === 3) {
      ;[title, typeRaw, minutesRaw] = parts
    } else if (parts.length === 4) {
      ;[title, topic, typeRaw, minutesRaw] = parts
    } else if (parts.length >= 5) {
      ;[title, course, topic, typeRaw, minutesRaw] = parts
    } else {
      errors.push({ line: lineNumber, text: line, reason: 'Expected "Title | Type | Minutes" (or similar).' })
      return
    }

    if (!title) {
      errors.push({ line: lineNumber, text: line, reason: 'Title is missing.' })
      return
    }

    const type = matchType(typeRaw)
    if (!type) {
      errors.push({ line: lineNumber, text: line, reason: `Unknown type "${typeRaw}". Use Video, Exercise, Project, Reading or Review.` })
      return
    }

    const minutes = Number(minutesRaw)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      errors.push({ line: lineNumber, text: line, reason: `Invalid duration "${minutesRaw}". Must be a number greater than 0.` })
      return
    }

    if (!course) {
      errors.push({ line: lineNumber, text: line, reason: 'Course is missing (set a default course above).' })
      return
    }

    rows.push({
      line: lineNumber,
      title,
      course,
      topic: topic || 'General',
      type,
      minutes: Math.round(minutes),
      difficulty: defaults.difficulty,
      priority: defaults.priority,
    })
  })

  return { rows, errors }
}
