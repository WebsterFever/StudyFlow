import { useCallback, useEffect, useState } from 'react'
import * as examsApi from '../services/examsApi'
import type { Exam, ExamInput } from '../types'

/** Exams are fetched per goal on demand, mirroring useGoalNotes — not kept in StudyContext's always-loaded global state. */
export function useGoalExams(goalId: string) {
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setIsLoading(true)
    setError(null)
    examsApi
      .fetchExams(goalId)
      .then(setExams)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load exams.'))
      .finally(() => setIsLoading(false))
  }, [goalId])

  useEffect(() => {
    reload()
  }, [reload])

  const addExam = useCallback(async (input: ExamInput) => {
    const created = await examsApi.createExam(input)
    setExams((prev) => [...prev, created])
    return created
  }, [])

  const editExam = useCallback(async (id: string, patch: Partial<Omit<ExamInput, 'goalId'>>) => {
    const updated = await examsApi.updateExam(id, patch)
    setExams((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }, [])

  const setExamReviewItems = useCallback(async (id: string, studyItemIds: string[]) => {
    const updated = await examsApi.replaceExamReviewItems(id, studyItemIds)
    setExams((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }, [])

  const removeExam = useCallback(async (id: string) => {
    await examsApi.deleteExam(id)
    setExams((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { exams, isLoading, error, reload, addExam, editExam, setExamReviewItems, removeExam }
}
