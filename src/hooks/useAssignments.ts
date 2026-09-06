import { useCallback, useEffect, useState } from 'react'
import * as assignmentsApi from '../services/assignmentsApi'
import type { Assignment, AssignmentInput } from '../types'

/** Assignments are fetched per goal on demand, mirroring useGoalNotes — not kept in StudyContext's always-loaded global state. */
export function useGoalAssignments(goalId: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setIsLoading(true)
    setError(null)
    assignmentsApi
      .fetchAssignments(goalId)
      .then(setAssignments)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load assignments.'))
      .finally(() => setIsLoading(false))
  }, [goalId])

  useEffect(() => {
    reload()
  }, [reload])

  const addAssignment = useCallback(
    async (input: AssignmentInput) => {
      const created = await assignmentsApi.createAssignment(input)
      setAssignments((prev) => [...prev, created])
      return created
    },
    [],
  )

  const editAssignment = useCallback(async (id: string, patch: Partial<Omit<AssignmentInput, 'goalId'>>) => {
    const updated = await assignmentsApi.updateAssignment(id, patch)
    setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)))
    return updated
  }, [])

  const removeAssignment = useCallback(async (id: string) => {
    await assignmentsApi.deleteAssignment(id)
    setAssignments((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { assignments, isLoading, error, reload, addAssignment, editAssignment, removeAssignment }
}
