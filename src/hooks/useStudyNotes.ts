import { useCallback, useEffect, useState } from 'react'
import * as studyNotesApi from '../services/studyNotesApi'
import type { StudyNote, StudyNoteInput } from '../types'

/**
 * Notes are fetched on demand per item/goal rather than kept in StudyContext's
 * global state — unlike items/sessions (lightweight metadata always needed),
 * a goal's notes are unbounded and can include full code files, so loading
 * every goal's notes on every app boot would be wasteful.
 */
function useNotesSource(load: () => Promise<StudyNote[]>, deps: unknown[]) {
  const [notes, setNotes] = useState<StudyNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setIsLoading(true)
    setError(null)
    load()
      .then(setNotes)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notes.'))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    reload()
  }, [reload])

  return { notes, setNotes, isLoading, error, reload }
}

export function useItemNotes(goalId: string, itemId: string) {
  const { notes, setNotes, isLoading, error, reload } = useNotesSource(() => studyNotesApi.fetchItemNotes(goalId, itemId), [goalId, itemId])

  const addNote = useCallback(
    async (input: StudyNoteInput) => {
      const created = await studyNotesApi.createNote(goalId, itemId, input)
      setNotes((prev) => [...prev, created])
      return created
    },
    [goalId, itemId, setNotes],
  )

  const editNote = useCallback(
    async (id: string, patch: Partial<StudyNoteInput>) => {
      const updated = await studyNotesApi.updateNote(id, patch)
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
      return updated
    },
    [setNotes],
  )

  const removeNote = useCallback(
    async (id: string) => {
      await studyNotesApi.deleteNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    },
    [setNotes],
  )

  return { notes, isLoading, error, reload, addNote, editNote, removeNote }
}

export function useGoalNotes(goalId: string) {
  const { notes, setNotes, isLoading, error, reload } = useNotesSource(() => studyNotesApi.fetchGoalNotes(goalId), [goalId])

  const editNote = useCallback(
    async (id: string, patch: Partial<StudyNoteInput>) => {
      const updated = await studyNotesApi.updateNote(id, patch)
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
      return updated
    },
    [setNotes],
  )

  const removeNote = useCallback(
    async (id: string) => {
      await studyNotesApi.deleteNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    },
    [setNotes],
  )

  return { notes, isLoading, error, reload, editNote, removeNote }
}
