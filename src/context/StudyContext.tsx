import type { ReactNode } from 'react'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  ActiveTimer,
  AppState,
  DayOverride,
  GoalInput,
  GoalStatus,
  MasteryRating,
  ReminderSettings,
  SessionStatus,
  StudyGoal,
  StudyItem,
  StudySession,
} from '../types'
import { buildDemoGoal, buildDemoItems } from '../data/demoData'
import {
  createEmptyState,
  downloadJson,
  loadActiveGoalId,
  loadActiveTimer,
  saveActiveGoalId,
  saveActiveTimer,
} from '../services/storage'
import * as goalsApi from '../services/goalsApi'
import * as studyItemsApi from '../services/studyItemsApi'
import * as studySessionsApi from '../services/studySessionsApi'
import * as dayOverridesApi from '../services/dayOverridesApi'
import * as dataApi from '../services/dataApi'
import type { MultiGoalPayload } from '../services/dataApi'
import { maxISO, todayISO } from '../utils/date'
import { generateId } from '../utils/id'
import { regeneratePlan } from '../utils/planGenerator'

function computeFromDate(goal: StudyGoal): string {
  return maxISO(goal.startDate, todayISO())
}

function dayOverridesMapForGoal(dayOverrides: DayOverride[], goalId: string): Record<string, DayOverride> {
  const map: Record<string, DayOverride> = {}
  for (const o of dayOverrides) {
    if (o.goalId === goalId) map[o.date] = o
  }
  return map
}

/**
 * Regenerates ONLY `goalId`'s sessions and splices the result back into the
 * full cross-goal sessions array — every other goal's schedule is untouched.
 * The backend never recomputes a plan; it only persists what this produces.
 */
function regenerateSessionsForGoal(state: AppState, goalId: string): StudySession[] {
  const goal = state.goals.find((g) => g.id === goalId)
  if (!goal) return state.sessions
  const goalItems = state.items.filter((i) => i.goalId === goalId)
  const goalSessions = state.sessions.filter((s) => s.goalId === goalId)
  const overridesMap = dayOverridesMapForGoal(state.dayOverrides, goalId)
  const { sessions: regenerated } = regeneratePlan(goalItems, goal, overridesMap, goalSessions, computeFromDate(goal))
  const otherSessions = state.sessions.filter((s) => s.goalId !== goalId)
  return [...otherSessions, ...regenerated]
}

function markItemCompletionFromSessions(sessions: StudySession[], items: StudyItem[], itemId: string): StudyItem[] {
  const stillIncomplete = sessions.some((s) => s.itemId === itemId && s.status !== 'completed')
  if (stillIncomplete) return items
  const now = new Date().toISOString()
  return items.map((i) => (i.id === itemId ? { ...i, completed: true, completedDate: now } : i))
}

function pickInitialActiveGoalId(goals: StudyGoal[]): string | null {
  const stored = loadActiveGoalId()
  if (stored && goals.some((g) => g.id === stored)) return stored
  return goals[0]?.id ?? null
}

interface CompletionResult {
  itemCompleted: boolean
  itemId: string
}

interface StudyContextValue {
  state: AppState
  activeGoal: StudyGoal | null
  items: StudyItem[]
  sessions: StudySession[]
  dayOverrides: Record<string, DayOverride>

  isLoading: boolean
  loadError: string | null
  syncError: string | null
  clearSyncError: () => void
  retryLoad: () => void

  setActiveGoalId: (goalId: string) => void
  createGoal: (values: GoalInput & Partial<ReminderSettings>) => Promise<StudyGoal>
  updateGoal: (id: string, values: Partial<GoalInput> & Partial<ReminderSettings> & { status?: GoalStatus }) => Promise<void>
  duplicateGoal: (id: string, name?: string) => Promise<void>
  deleteGoal: (id: string) => Promise<void>

  addItem: (item: StudyItem) => void
  addItems: (items: StudyItem[]) => void
  updateItem: (item: StudyItem) => void
  deleteItem: (id: string) => void
  toggleItemComplete: (id: string, completed: boolean) => void
  setItemMastery: (id: string, mastery: MasteryRating) => void

  moveSession: (id: string, date: string) => void
  reorderDay: (date: string, orderedIds: string[]) => void
  updateSessionDuration: (id: string, minutes: number) => void
  setDayOverride: (goalId: string, date: string, unavailable: boolean, hoursOverride: number | null) => void
  clearDayOverride: (goalId: string, date: string) => void
  regeneratePlanNow: () => void

  startSession: (sessionId: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  completeSession: (sessionId: string, actualMinutes: number) => CompletionResult
  completeActiveTimer: () => CompletionResult | null

  loadDemoData: () => void
  importData: (payload: MultiGoalPayload) => Promise<void>
  resetData: () => void
  exportData: () => void
}

export const StudyContext = createContext<StudyContextValue | null>(null)

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => ({ ...createEmptyState(), activeTimer: loadActiveTimer() }))
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [loadNonce, setLoadNonce] = useState(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const reportSyncError = useCallback((err: unknown, fallback: string) => {
    // eslint-disable-next-line no-console
    console.error(fallback, err)
    setSyncError(err instanceof Error ? err.message : fallback)
  }, [])

  useEffect(() => {
    saveActiveTimer(state.activeTimer)
  }, [state.activeTimer])

  useEffect(() => {
    saveActiveGoalId(state.activeGoalId)
  }, [state.activeGoalId])

  // Initial load from the backend (the source of truth for permanent data).
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    Promise.all([goalsApi.fetchGoals(), studyItemsApi.fetchItems(), studySessionsApi.fetchSessions(), dayOverridesApi.fetchDayOverrides()])
      .then(async ([goals, items, sessions, dayOverrides]) => {
        if (cancelled) return
        const persistedTimer = loadActiveTimer()
        const timerSessionStillActive = persistedTimer && sessions.some((s) => s.id === persistedTimer.sessionId && s.status === 'in-progress')

        let loaded: AppState = {
          goals,
          activeGoalId: pickInitialActiveGoalId(goals),
          items,
          sessions,
          dayOverrides,
          activeTimer: timerSessionStillActive ? persistedTimer : null,
        }

        // Quietly reflow any goal that has sessions left "planned" in the past
        // (e.g. the user missed a day) — mirrors the original single-goal behavior,
        // now applied per goal.
        const today = todayISO()
        for (const goal of goals) {
          const hasMissed = loaded.sessions.some((s) => s.goalId === goal.id && s.date < today && s.status === 'planned')
          if (!hasMissed) continue
          const regenerated = regenerateSessionsForGoal(loaded, goal.id)
          if (regenerated === loaded.sessions) continue
          loaded = { ...loaded, sessions: regenerated }
          try {
            const goalSessions = regenerated.filter((s) => s.goalId === goal.id)
            const saved = await studySessionsApi.replaceAllSessions(goal.id, goalSessions)
            const others = loaded.sessions.filter((s) => s.goalId !== goal.id)
            loaded = { ...loaded, sessions: [...others, ...saved] }
          } catch {
            // Non-fatal: keep the locally-regenerated plan even if the sync failed.
          }
        }

        if (!cancelled) {
          setState(loaded)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Could not load your study data.')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadNonce])

  const retryLoad = useCallback(() => setLoadNonce((n) => n + 1), [])
  const clearSyncError = useCallback(() => setSyncError(null), [])

  const setActiveGoalId = useCallback((goalId: string) => {
    setState((prev) => ({ ...prev, activeGoalId: goalId }))
  }, [])

  /** Optimistic local update + async persistence, used by the item/session/override actions. */
  const applyAndPersist = useCallback(
    (compute: (prev: AppState) => AppState, persist: (prev: AppState, next: AppState) => Promise<void>) => {
      const prev = stateRef.current
      const next = compute(prev)
      setState(next)
      persist(prev, next).catch((err) => reportSyncError(err, 'Failed to save your change.'))
    },
    [reportSyncError],
  )

  /** Persists whatever `goalId`'s sessions currently look like in the latest state, reconciling ids from the server response. */
  const persistGoalSessions = useCallback(async (goalId: string) => {
    const sessionsForGoal = stateRef.current.sessions.filter((s) => s.goalId === goalId)
    const saved = await studySessionsApi.replaceAllSessions(goalId, sessionsForGoal)
    setState((current) => {
      const others = current.sessions.filter((s) => s.goalId !== goalId)
      return { ...current, sessions: [...others, ...saved] }
    })
  }, [])

  // ---- Goals ----

  const createGoal = useCallback(async (values: GoalInput & Partial<ReminderSettings>): Promise<StudyGoal> => {
    try {
      const created = await goalsApi.createGoal(values)
      setState((prev) => ({ ...prev, goals: [...prev.goals, created], activeGoalId: created.id }))
      return created
    } catch (err) {
      reportSyncError(err, 'Failed to create goal.')
      throw err
    }
  }, [reportSyncError])

  const updateGoal = useCallback(
    async (id: string, values: Partial<GoalInput> & Partial<ReminderSettings> & { status?: GoalStatus }) => {
      try {
        const updated = await goalsApi.updateGoal(id, values)
        setState((prev) => ({ ...prev, goals: prev.goals.map((g) => (g.id === id ? updated : g)) }))
      } catch (err) {
        reportSyncError(err, 'Failed to update goal.')
        throw err
      }
    },
    [reportSyncError],
  )

  const duplicateGoal = useCallback(
    async (id: string, name?: string) => {
      try {
        const { goal, items } = await goalsApi.duplicateGoal(id, name)
        setState((prev) => ({ ...prev, goals: [...prev.goals, goal], items: [...prev.items, ...items], activeGoalId: goal.id }))
      } catch (err) {
        reportSyncError(err, 'Failed to duplicate goal.')
        throw err
      }
    },
    [reportSyncError],
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      try {
        await goalsApi.deleteGoal(id)
        setState((prev) => {
          const goals = prev.goals.filter((g) => g.id !== id)
          const items = prev.items.filter((i) => i.goalId !== id)
          const sessions = prev.sessions.filter((s) => s.goalId !== id)
          const dayOverrides = prev.dayOverrides.filter((o) => o.goalId !== id)
          const activeGoalId = prev.activeGoalId === id ? (goals[0]?.id ?? null) : prev.activeGoalId
          const activeTimer = prev.activeTimer?.goalId === id ? null : prev.activeTimer
          return { ...prev, goals, items, sessions, dayOverrides, activeGoalId, activeTimer }
        })
      } catch (err) {
        reportSyncError(err, 'Failed to delete goal.')
        throw err
      }
    },
    [reportSyncError],
  )

  // ---- Study items (always operate on whatever goal the item belongs to) ----

  const addItem = useCallback(
    (item: StudyItem) =>
      applyAndPersist(
        (prev) => {
          const items = [...prev.items, item]
          const sessions = regenerateSessionsForGoal({ ...prev, items }, item.goalId)
          return { ...prev, items, sessions }
        },
        async () => {
          await studyItemsApi.createItem(item)
          await persistGoalSessions(item.goalId)
        },
      ),
    [applyAndPersist, persistGoalSessions],
  )

  const addItems = useCallback(
    (items: StudyItem[]) =>
      applyAndPersist(
        (prev) => {
          const nextItems = [...prev.items, ...items]
          const goalIds = Array.from(new Set(items.map((i) => i.goalId)))
          let sessions = prev.sessions
          let working = { ...prev, items: nextItems }
          for (const goalId of goalIds) {
            sessions = regenerateSessionsForGoal(working, goalId)
            working = { ...working, sessions }
          }
          return { ...prev, items: nextItems, sessions }
        },
        async () => {
          await studyItemsApi.bulkCreateItems(items)
          const goalIds = Array.from(new Set(items.map((i) => i.goalId)))
          await Promise.all(goalIds.map((goalId) => persistGoalSessions(goalId)))
        },
      ),
    [applyAndPersist, persistGoalSessions],
  )

  const updateItem = useCallback(
    (item: StudyItem) =>
      applyAndPersist(
        (prev) => {
          const items = prev.items.map((i) => (i.id === item.id ? item : i))
          const sessions = regenerateSessionsForGoal({ ...prev, items }, item.goalId)
          return { ...prev, items, sessions }
        },
        async () => {
          await studyItemsApi.updateItem(item)
          await persistGoalSessions(item.goalId)
        },
      ),
    [applyAndPersist, persistGoalSessions],
  )

  const deleteItem = useCallback(
    (id: string) => {
      const goalId = stateRef.current.items.find((i) => i.id === id)?.goalId
      applyAndPersist(
        (prev) => {
          const items = prev.items.filter((i) => i.id !== id)
          const sessions = prev.sessions.filter((s) => s.itemId !== id)
          if (!goalId) return { ...prev, items, sessions }
          return { ...prev, items, sessions: regenerateSessionsForGoal({ ...prev, items, sessions }, goalId) }
        },
        async () => {
          await studyItemsApi.deleteItem(id)
          if (goalId) await persistGoalSessions(goalId)
        },
      )
    },
    [applyAndPersist, persistGoalSessions],
  )

  const toggleItemComplete = useCallback(
    (id: string, completed: boolean) =>
      applyAndPersist(
        (prev) => {
          const now = new Date().toISOString()
          const items = prev.items.map((i) =>
            i.id === id ? { ...i, completed, completedDate: completed ? now : null } : i,
          )
          const sessions = prev.sessions.map((s) =>
            s.itemId === id
              ? completed
                ? { ...s, status: 'completed' as SessionStatus, actualMinutes: s.actualMinutes ?? s.plannedMinutes, completedAt: now }
                : { ...s, status: 'planned' as SessionStatus, actualMinutes: null, completedAt: null }
              : s,
          )
          const item = items.find((i) => i.id === id)
          if (!item) return { ...prev, items, sessions }
          return { ...prev, items, sessions: regenerateSessionsForGoal({ ...prev, items, sessions }, item.goalId) }
        },
        async (_prev, next) => {
          const item = next.items.find((i) => i.id === id)
          if (item) {
            await studyItemsApi.updateItem(item)
            await persistGoalSessions(item.goalId)
          }
        },
      ),
    [applyAndPersist, persistGoalSessions],
  )

  const setItemMastery = useCallback(
    (id: string, mastery: MasteryRating) =>
      applyAndPersist(
        (prev) => ({ ...prev, items: prev.items.map((i) => (i.id === id ? { ...i, mastery } : i)) }),
        async (_prev, next) => {
          const item = next.items.find((i) => i.id === id)
          if (item) await studyItemsApi.updateItem(item)
        },
      ),
    [applyAndPersist],
  )

  // ---- Sessions ----

  const moveSession = useCallback(
    (id: string, date: string) =>
      applyAndPersist(
        (prev) => {
          const target = prev.sessions.filter((s) => s.date === date)
          const nextOrder = target.length === 0 ? 0 : Math.max(...target.map((s) => s.order)) + 1
          return {
            ...prev,
            sessions: prev.sessions.map((s) => (s.id === id ? { ...s, date, order: nextOrder, manuallyAdjusted: true } : s)),
          }
        },
        async (_prev, next) => {
          const session = next.sessions.find((s) => s.id === id)
          if (session) await studySessionsApi.updateSession(id, { date: session.date, order: session.order, manuallyAdjusted: true })
        },
      ),
    [applyAndPersist],
  )

  const reorderDay = useCallback(
    (date: string, orderedIds: string[]) => {
      const goalId = stateRef.current.sessions.find((s) => orderedIds.includes(s.id))?.goalId
      applyAndPersist(
        (prev) => {
          const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]))
          return {
            ...prev,
            sessions: prev.sessions.map((s) =>
              s.date === date && orderMap.has(s.id) ? { ...s, order: orderMap.get(s.id) as number, manuallyAdjusted: true } : s,
            ),
          }
        },
        async () => {
          if (goalId) await studySessionsApi.reorderSessions(goalId, date, orderedIds)
        },
      )
    },
    [applyAndPersist],
  )

  const updateSessionDuration = useCallback(
    (id: string, minutes: number) =>
      applyAndPersist(
        (prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) => (s.id === id ? { ...s, plannedMinutes: Math.max(1, minutes), manuallyAdjusted: true } : s)),
        }),
        async (_prev, next) => {
          const session = next.sessions.find((s) => s.id === id)
          if (session) await studySessionsApi.updateSession(id, { plannedMinutes: session.plannedMinutes, manuallyAdjusted: true })
        },
      ),
    [applyAndPersist],
  )

  const setDayOverride = useCallback(
    (goalId: string, date: string, unavailable: boolean, hoursOverride: number | null) =>
      applyAndPersist(
        (prev) => {
          const existing = prev.dayOverrides.find((o) => o.goalId === goalId && o.date === date)
          const next: DayOverride = { id: existing?.id ?? generateId('override'), goalId, date, unavailable, hoursOverride }
          const dayOverrides = existing
            ? prev.dayOverrides.map((o) => (o.goalId === goalId && o.date === date ? next : o))
            : [...prev.dayOverrides, next]
          return { ...prev, dayOverrides, sessions: regenerateSessionsForGoal({ ...prev, dayOverrides }, goalId) }
        },
        async () => {
          const saved = await dayOverridesApi.upsertDayOverride(goalId, date, unavailable, hoursOverride)
          setState((current) => ({
            ...current,
            dayOverrides: current.dayOverrides.map((o) => (o.goalId === goalId && o.date === date ? saved : o)),
          }))
          await persistGoalSessions(goalId)
        },
      ),
    [applyAndPersist, persistGoalSessions],
  )

  const clearDayOverride = useCallback(
    (goalId: string, date: string) =>
      applyAndPersist(
        (prev) => {
          const dayOverrides = prev.dayOverrides.filter((o) => !(o.goalId === goalId && o.date === date))
          return { ...prev, dayOverrides, sessions: regenerateSessionsForGoal({ ...prev, dayOverrides }, goalId) }
        },
        async () => {
          await dayOverridesApi.deleteDayOverride(goalId, date)
          await persistGoalSessions(goalId)
        },
      ),
    [applyAndPersist, persistGoalSessions],
  )

  const regeneratePlanNow = useCallback(() => {
    const goalId = stateRef.current.activeGoalId
    if (!goalId) return
    applyAndPersist(
      (prev) => ({ ...prev, sessions: regenerateSessionsForGoal(prev, goalId) }),
      async () => {
        await persistGoalSessions(goalId)
      },
    )
  }, [applyAndPersist, persistGoalSessions])

  // ---- Timer ----

  const startSession = useCallback(
    (sessionId: string) =>
      applyAndPersist(
        (prev) => {
          const now = new Date().toISOString()
          const target = prev.sessions.find((s) => s.id === sessionId)
          if (!target) return prev
          const sessions = prev.sessions.map((s) => {
            if (s.id === sessionId) return { ...s, status: 'in-progress' as SessionStatus, startedAt: s.startedAt ?? now }
            if (s.status === 'in-progress') return { ...s, status: 'planned' as SessionStatus, startedAt: null }
            return s
          })
          const timer: ActiveTimer = {
            sessionId: target.id,
            itemId: target.itemId,
            goalId: target.goalId,
            startedAt: now,
            accumulatedSeconds: 0,
            isPaused: false,
          }
          return { ...prev, sessions, activeTimer: timer }
        },
        async (prev, next) => {
          const requests: Promise<unknown>[] = []
          for (const nextSession of next.sessions) {
            const prevSession = prev.sessions.find((s) => s.id === nextSession.id)
            if (prevSession && (prevSession.status !== nextSession.status || prevSession.startedAt !== nextSession.startedAt)) {
              requests.push(studySessionsApi.updateSession(nextSession.id, { status: nextSession.status, startedAt: nextSession.startedAt }))
            }
          }
          await Promise.all(requests)
        },
      ),
    [applyAndPersist],
  )

  const pauseTimer = useCallback(() => {
    setState((prev) => {
      if (!prev.activeTimer || prev.activeTimer.isPaused) return prev
      const elapsed = (Date.now() - new Date(prev.activeTimer.startedAt).getTime()) / 1000
      return { ...prev, activeTimer: { ...prev.activeTimer, accumulatedSeconds: prev.activeTimer.accumulatedSeconds + elapsed, isPaused: true } }
    })
  }, [])

  const resumeTimer = useCallback(() => {
    setState((prev) => {
      if (!prev.activeTimer || !prev.activeTimer.isPaused) return prev
      return { ...prev, activeTimer: { ...prev.activeTimer, startedAt: new Date().toISOString(), isPaused: false } }
    })
  }, [])

  const stopTimer = useCallback(
    () =>
      applyAndPersist(
        (prev) => {
          if (!prev.activeTimer) return prev
          const sessionId = prev.activeTimer.sessionId
          return {
            ...prev,
            activeTimer: null,
            sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, status: 'planned' as SessionStatus, startedAt: null } : s)),
          }
        },
        async () => {
          const timer = stateRef.current.activeTimer
          if (timer) await studySessionsApi.updateSession(timer.sessionId, { status: 'planned', startedAt: null })
        },
      ),
    [applyAndPersist],
  )

  const completeSession = useCallback(
    (sessionId: string, actualMinutes: number): CompletionResult => {
      const current = stateRef.current
      const session = current.sessions.find((s) => s.id === sessionId)
      const itemId = session?.itemId ?? ''
      const otherIncomplete = current.sessions.some((s) => s.itemId === itemId && s.id !== sessionId && s.status !== 'completed')
      const roundedMinutes = Math.max(1, Math.round(actualMinutes))

      applyAndPersist(
        (prev) => {
          const now = new Date().toISOString()
          const sessions = prev.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: 'completed' as SessionStatus, actualMinutes: roundedMinutes, completedAt: now } : s,
          )
          const items = markItemCompletionFromSessions(sessions, prev.items, itemId)
          const activeTimer = prev.activeTimer?.sessionId === sessionId ? null : prev.activeTimer
          return { ...prev, sessions, items, activeTimer }
        },
        async (_prev, next) => {
          await studySessionsApi.updateSession(sessionId, {
            status: 'completed',
            actualMinutes: roundedMinutes,
            completedAt: new Date().toISOString(),
          })
          const item = next.items.find((i) => i.id === itemId)
          if (item && !otherIncomplete) {
            await studyItemsApi.updateItem(item)
          }
        },
      )

      return { itemCompleted: !otherIncomplete, itemId }
    },
    [applyAndPersist],
  )

  const completeActiveTimer = useCallback((): CompletionResult | null => {
    const timer = stateRef.current.activeTimer
    if (!timer) return null
    const elapsed = timer.isPaused ? 0 : (Date.now() - new Date(timer.startedAt).getTime()) / 1000
    const totalSeconds = timer.accumulatedSeconds + elapsed
    const actualMinutes = Math.max(1, Math.round(totalSeconds / 60))
    return completeSession(timer.sessionId, actualMinutes)
  }, [completeSession])

  // ---- Bulk data operations ----

  const loadDemoData = useCallback(async () => {
    try {
      const goalInput = buildDemoGoal()
      const createdGoal = await goalsApi.createGoal(goalInput)
      const demoItemsInput = buildDemoItems(createdGoal.id)
      const createdItems = await studyItemsApi.bulkCreateItems(demoItemsInput)

      setState((prev) => {
        const goals = [...prev.goals, createdGoal]
        const items = [...prev.items, ...createdItems]
        const sessions = regenerateSessionsForGoal({ ...prev, goals, items }, createdGoal.id)
        return { ...prev, goals, items, sessions, activeGoalId: createdGoal.id }
      })

      const goalSessions = regenerateSessionsForGoal(
        { ...stateRef.current, goals: [...stateRef.current.goals, createdGoal], items: [...stateRef.current.items, ...createdItems] },
        createdGoal.id,
      ).filter((s) => s.goalId === createdGoal.id)
      await studySessionsApi.replaceAllSessions(createdGoal.id, goalSessions)
    } catch (err) {
      reportSyncError(err, 'Failed to load demo data.')
    }
  }, [reportSyncError])

  const importData = useCallback(async (payload: MultiGoalPayload) => {
    await dataApi.restoreData(payload)
    setLoadNonce((n) => n + 1)
  }, [])

  const resetData = useCallback(async () => {
    try {
      await dataApi.wipeAllData()
      setState({ ...createEmptyState() })
    } catch (err) {
      reportSyncError(err, 'Failed to reset your data.')
    }
  }, [reportSyncError])

  const exportData = useCallback(() => {
    const { goals, items, sessions, dayOverrides } = stateRef.current
    const bundles = goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      startDate: goal.startDate,
      deadline: goal.deadline,
      dailyHours: goal.dailyHours,
      status: goal.status,
      items: items.filter((i) => i.goalId === goal.id),
      sessions: sessions.filter((s) => s.goalId === goal.id),
      dayOverrides: Object.fromEntries(dayOverrides.filter((o) => o.goalId === goal.id).map((o) => [o.date, o])),
    }))
    downloadJson('studyflow-backup', { version: '3', goals: bundles })
  }, [])

  // ---- Derived active-goal view ----

  const activeGoal = useMemo(() => state.goals.find((g) => g.id === state.activeGoalId) ?? null, [state.goals, state.activeGoalId])
  const activeItems = useMemo(() => state.items.filter((i) => i.goalId === state.activeGoalId), [state.items, state.activeGoalId])
  const activeSessions = useMemo(() => state.sessions.filter((s) => s.goalId === state.activeGoalId), [state.sessions, state.activeGoalId])
  const activeDayOverrides = useMemo(
    () => (state.activeGoalId ? dayOverridesMapForGoal(state.dayOverrides, state.activeGoalId) : {}),
    [state.dayOverrides, state.activeGoalId],
  )

  const value = useMemo<StudyContextValue>(
    () => ({
      state,
      activeGoal,
      items: activeItems,
      sessions: activeSessions,
      dayOverrides: activeDayOverrides,
      isLoading,
      loadError,
      syncError,
      clearSyncError,
      retryLoad,
      setActiveGoalId,
      createGoal,
      updateGoal,
      duplicateGoal,
      deleteGoal,
      addItem,
      addItems,
      updateItem,
      deleteItem,
      toggleItemComplete,
      setItemMastery,
      moveSession,
      reorderDay,
      updateSessionDuration,
      setDayOverride,
      clearDayOverride,
      regeneratePlanNow,
      startSession,
      pauseTimer,
      resumeTimer,
      stopTimer,
      completeSession,
      completeActiveTimer,
      loadDemoData,
      importData,
      resetData,
      exportData,
    }),
    [
      state,
      activeGoal,
      activeItems,
      activeSessions,
      activeDayOverrides,
      isLoading,
      loadError,
      syncError,
      clearSyncError,
      retryLoad,
      setActiveGoalId,
      createGoal,
      updateGoal,
      duplicateGoal,
      deleteGoal,
      addItem,
      addItems,
      updateItem,
      deleteItem,
      toggleItemComplete,
      setItemMastery,
      moveSession,
      reorderDay,
      updateSessionDuration,
      setDayOverride,
      clearDayOverride,
      regeneratePlanNow,
      startSession,
      pauseTimer,
      resumeTimer,
      stopTimer,
      completeSession,
      completeActiveTimer,
      loadDemoData,
      importData,
      resetData,
      exportData,
    ],
  )

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
}
