import type { MasteryRating, ReviewSuggestion, StudyItem } from '../types'
import { addDays, isAfter, todayISO } from './date'

/** Offsets (in days after completion) for suggested review sessions, keyed by mastery rating. */
const REVIEW_OFFSETS: Record<MasteryRating, number[]> = {
  1: [1],
  2: [1, 3],
  3: [3, 7],
  4: [7],
  5: [],
}

export function reviewOffsetsForRating(rating: MasteryRating): number[] {
  return REVIEW_OFFSETS[rating]
}

/** Builds suggested review dates for every completed, rated item, dropping dates already in the past. */
export function computeReviewSuggestions(items: StudyItem[], today: string = todayISO()): ReviewSuggestion[] {
  const suggestions: ReviewSuggestion[] = []
  for (const item of items) {
    if (!item.completed || item.mastery == null || !item.completedDate) continue
    const offsets = REVIEW_OFFSETS[item.mastery]
    if (offsets.length === 0) continue
    const baseDate = item.completedDate.slice(0, 10)
    const dueDates = offsets.map((offset) => addDays(baseDate, offset)).filter((date) => !isAfter(today, date))
    if (dueDates.length === 0) continue
    suggestions.push({
      itemId: item.id,
      itemTitle: item.title,
      topic: item.topic,
      course: item.course,
      mastery: item.mastery,
      dueDates,
    })
  }
  return suggestions.sort((a, b) => a.dueDates[0].localeCompare(b.dueDates[0]))
}
