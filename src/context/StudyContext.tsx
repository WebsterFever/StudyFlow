import type { ReactNode } from 'react'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  ActiveTimer,
  AppState,
  DayOverride,
  MasteryRating,
  SessionStatus,
  StudyGoal,
  StudyItem,
  StudySession,
} from '../types'
import { buildDemoGoal, buildDemoItems } from '../data/demoData'
import { createEmptyState, downloadJson, loadActiveTimer, saveActiveTimer } from '../services/storage'
import * as goalsApi from '../services/goalsApi'
import * as studyItemsApi from '../services/studyItemsApi'
import * as studySessionsApi from '../services/studySessionsApi'
import * as dayOverridesApi from '../services/dayOverridesApi'
import * as dataApi from '../services/dataApi'
import { maxISO, todayISO } from '../utils/date'
import { regeneratePlan } from '../utils/planGenerator'

type Action =
  | { type: 'SET_GOAL'; goal: StudyGoal }
  | { type: 'ADD_ITEM'; item: StudyItem }
  | { type: 'ADD_ITEMS'; items: StudyItem[] }
  | { type: 'UPDATE_ITEM'; item: StudyItem }
  | { type: 'DELETE_ITEM'; id: string }
  | { type: 'TOGGLE_ITEM_COMPLETE'; id: string; completed: boolean }
  | { type: 'SET_ITEM_MASTERY'; id: string; mastery: MasteryRating }
  | { type: 'MOVE_SESSION'; id: string; date: string }
  | { type: 'REORDER_DAY'; date: string; orderedIds: string[] }
  | { type: 'UPDATE_SESSION_DURATION'; id: string; minutes: number }
  | { type: 'SET_DAY_OVERRIDE'; override: DayOverride }
  | { type: 'CLEAR_DAY_OVERRIDE'; date: string }
  | { type: 'REGENERATE_PLAN' }
  | { type: 'START_SESSION'; sessionId: string }
  | { type: 'STOP_TIMER' }
  | { type: 'COMPLETE_SESSION'; sessionId: string; actualMinutes: number }
  | { type: 'LOAD_DEMO_DATA' }
  | { type: 'RESET_DATA' }

function computeFromDate(goal: StudyGoal): string {
  return maxISO(goal.startDate, todayISO())
}

function withRegeneratedPlan(state: AppState): AppState {
  if (!state.goal) return state
  const { sessions } = regeneratePlan(state.items, state.goal, state.dayOverrides, state.sessions, computeFromDate(state.goal))
  return { ...state, sessions }
}

function markItemCompletionFromSessions(state: AppState, itemId: string): StudyItem[] {
  const stillIncomplete = state.sessions.some((s) => s.itemId === itemId && s.status !== 'completed')
  if (stillIncomplete) return state.items
  const now = new Date().toISOString()
  return state.items.map((i) => (i.id === itemId ? { ...i, completed: true, completedDate: now } : i))
}

/**
 * Pure, synchronous local-state transitions — identical in spirit to the
 * original localStorage-only reducer. The backend never recomputes the plan;
 * it only persists whatever this function produces (see the *Api calls in
 * the wrapper functions below).
 */
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_GOAL':
      return withRegeneratedPlan({ ...state, goal: action.goal })

    case 'ADD_ITEM':
      return withRegeneratedPlan({ ...state, items: [...state.items, action.item] })

    case 'ADD_ITEMS':
      return withRegeneratedPlan({ ...state, items: [...state.items, ...action.items] })

    case 'UPDATE_ITEM':
      return withRegeneratedPlan({
        ...state,
        items: state.items.map((i) => (i.id === action.item.id ? action.item : i)),
      })

    case 'DELETE_ITEM':
      return withRegeneratedPlan({
        ...state,
        items: state.items.filter((i) => i.id !== action.id),
        sessions: state.sessions.filter((s) => s.itemId !== action.id),
      })

    case 'TOGGLE_ITEM_COMPLETE': {
      const now = new Date().toISOString()
      const items = state.items.map((i) =>
        i.id === action.id ? { ...i, completed: action.completed, completedDate: action.completed ? now : null } : i,
      )
      const sessions = state.sessions.map((s) =>
        s.itemId === action.id
          ? action.completed
            ? { ...s, status: 'completed' as SessionStatus, actualMinutes: s.actualMinutes ?? s.plannedMinutes, completedAt: now }
            : { ...s, status: 'planned' as SessionStatus, actualMinutes: null, completedAt: null }
          : s,
      )
      return withRegeneratedPlan({ ...state, items, sessions })
    }

    case 'SET_ITEM_MASTERY':
      return { ...state, items: state.items.map((i) => (i.id === action.id ? { ...i, mastery: action.mastery } : i)) }

    case 'MOVE_SESSION': {
      const target = state.sessions.filter((s) => s.date === action.date)
      const nextOrder = target.length === 0 ? 0 : Math.max(...target.map((s) => s.order)) + 1
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.id ? { ...s, date: action.date, order: nextOrder, manuallyAdjusted: true } : s,
        ),
      }
    }

    case 'REORDER_DAY': {
      const orderMap = new Map(action.orderedIds.map((id, idx) => [id, idx]))
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.date === action.date && orderMap.has(s.id)
            ? { ...s, order: orderMap.get(s.id) as number, manuallyAdjusted: true }
            : s,
        ),
      }
    }

    case 'UPDATE_SESSION_DURATION':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.id ? { ...s, plannedMinutes: Math.max(1, action.minutes), manuallyAdjusted: true } : s,
        ),
      }

    case 'SET_DAY_OVERRIDE':
      return withRegeneratedPlan({
        ...state,
        dayOverrides: { ...state.dayOverrides, [action.override.date]: action.override },
      })

    case 'CLEAR_DAY_OVERRIDE': {
      const next = { ...state.dayOverrides }
      delete next[action.date]
      return withRegeneratedPlan({ ...state, dayOverrides: next })
    }

    case 'REGENERATE_PLAN':
      return withRegeneratedPlan(state)

    case 'START_SESSION': {
      const now = new Date().toISOString()
      const target = state.sessions.find((s) => s.id === action.sessionId)
      if (!target) return state
      const sessions = state.sessions.map((s) => {
        if (s.id === action.sessionId) {
          return { ...s, status: 'in-progress' as SessionStatus, startedAt: s.startedAt ?? now }
        }
        if (s.status === 'in-progress') {
          return { ...s, status: 'planned' as SessionStatus, startedAt: null }
        }
        return s
      })
      const timer: ActiveTimer = {
        sessionId: target.id,
        itemId: target.itemId,
        startedAt: now,
        accumulatedSeconds: 0,
        isPaused: false,
      }
      return { ...state, sessions, activeTimer: timer }
    }

    case 'STOP_TIMER': {
      if (!state.activeTimer) return state
      const sessionId = state.activeTimer.sessionId
      return {
        ...state,
        activeTimer: null,
        sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, status: 'planned', startedAt: null } : s)),
      }
    }

    case 'COMPLETE_SESSION': {
      const now = new Date().toISOString()
      const session = state.sessions.find((s) => s.id === action.sessionId)
      if (!session) return state
      const sessions = state.sessions.map((s) =>
        s.id === action.sessionId
          ? { ...s, status: 'completed' as SessionStatus, actualMinutes: action.actualMinutes, completedAt: now }
          : s,
      )
      const withCompletion = { ...state, sessions }
      const items = markItemCompletionFromSessions(withCompletion, session.itemId)
      const activeTimer = state.activeTimer?.sessionId === action.sessionId ? null : state.activeTimer
      return { ...withCompletion, items, activeTimer }
    }

    case 'LOAD_DEMO_DATA': {
      const goal = buildDemoGoal()
      const items = buildDemoItems()
      return withRegeneratedPlan({
        ...state,
        goal,
        items,
        sessions: [],
        dayOverrides: {},
        activeTimer: null,
        demoDataLoaded: true,
      })
    }

    case 'RESET_DATA':
      return { ...createEmptyState() }

    default:
      return state
  }
}

interface CompletionResult {
  itemCompleted: boolean
  itemId: string
}

interface StudyContextValue {
  state: AppState
  isLoading: boolean
  loadError: string | null
  syncError: string | null
  clearSyncError: () => void
  retryLoad: () => void
  setGoal: (goal: StudyGoal) => void
  addItem: (item: StudyItem) => void
  addItems: (items: StudyItem[]) => void
  updateItem: (item: StudyItem) => void
  deleteItem: (id: string) => void
  toggleItemComplete: (id: string, completed: boolean) => void
  setItemMastery: (id: string, mastery: MasteryRating) => void
  moveSession: (id: string, date: string) => void
  reorderDay: (date: string, orderedIds: string[]) => void
  updateSessionDuration: (id: string, minutes: number) => void
  setDayOverride: (override: DayOverride) => void
  clearDayOverride: (date: string) => void
  regeneratePlanNow: () => void
  startSession: (sessionId: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  completeSession: (sessionId: string, actualMinutes: number) => CompletionResult
  completeActiveTimer: () => CompletionResult | null
  loadDemoData: () => void
  importData: (data: { goal: StudyGoal | null; items: StudyItem[]; sessions: StudySession[]; dayOverrides: Record<string, DayOverride> }) => Promise<void>
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

  // Persist the timer locally on every change (client-only, not synced to the backend).
  useEffect(() => {
    saveActiveTimer(state.activeTimer)
  }, [state.activeTimer])

  // Initial load from the backend (the source of truth for permanent data).
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    Promise.all([goalsApi.fetchGoal(), studyItemsApi.fetchItems(), studySessionsApi.fetchSessions(), dayOverridesApi.fetchDayOverrides()])
      .then(async ([goal, items, sessions, dayOverridesList]) => {
        if (cancelled) return
        const dayOverrides = Object.fromEntries(dayOverridesList.map((o) => [o.date, o]))
        const persistedTimer = loadActiveTimer()
        const timerSessionStillActive = persistedTimer && sessions.some((s) => s.id === persistedTimer.sessionId && s.status === 'in-progress')

        let loaded: AppState = {
          goal,
          items,
          sessions,
          dayOverrides,
          activeTimer: timerSessionStillActive ? persistedTimer : null,
          demoDataLoaded: false,
        }

        // Quietly reflow the plan once if sessions were left "planned" in the past
        // (e.g. the user missed a day) — mirrors the original localStorage behavior.
        const today = todayISO()
        const hasMissed = loaded.sessions.some((s) => s.date < today && s.status === 'planned')
        if (hasMissed && loaded.goal) {
          const regenerated = withRegeneratedPlan(loaded)
          if (regenerated.sessions !== loaded.sessions) {
            try {
              const saved = await studySessionsApi.replaceAllSessions(regenerated.sessions)
              loaded = { ...regenerated, sessions: saved }
            } catch {
              // Non-fatal: keep the locally-regenerated plan even if the sync failed;
              // it will retry next time an action triggers a regenerate.
              loaded = regenerated
            }
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

  const applyAndPersist = useCallback(
    (action: Action, persist: (prev: AppState, next: AppState) => Promise<void>) => {
      const prev = stateRef.current
      const next = reducer(prev, action)
      setState(next)
      persist(prev, next).catch((err) => reportSyncError(err, 'Failed to save your change.'))
    },
    [reportSyncError],
  )

  const syncPlanIfChanged = async (prev: AppState, next: AppState) => {
    if (next.sessions !== prev.sessions) {
      const saved = await studySessionsApi.replaceAllSessions(next.sessions)
      setState((current) => (current.sessions === next.sessions ? { ...current, sessions: saved } : current))
    }
  }

  const setGoal = useCallback(
    (goal: StudyGoal) =>
      applyAndPersist({ type: 'SET_GOAL', goal }, async (prev, next) => {
        const saved = await goalsApi.saveGoal(goal)
        setState((current) => (current.goal === next.goal ? { ...current, goal: saved } : current))
        await syncPlanIfChanged(prev, next)
      }),
    [applyAndPersist],
  )

  const addItem = useCallback(
    (item: StudyItem) =>
      applyAndPersist({ type: 'ADD_ITEM', item }, async (prev, next) => {
        await studyItemsApi.createItem(item)
        await syncPlanIfChanged(prev, next)
      }),
    [applyAndPersist],
  )

  const addItems = useCallback(
    (items: StudyItem[]) =>
      applyAndPersist({ type: 'ADD_ITEMS', items }, async (prev, next) => {
        await studyItemsApi.bulkCreateItems(items)
        await syncPlanIfChanged(prev, next)
      }),
    [applyAndPersist],
  )

  const updateItem = useCallback(
    (item: StudyItem) =>
      applyAndPersist({ type: 'UPDATE_ITEM', item }, async (prev, next) => {
        await studyItemsApi.updateItem(item)
        await syncPlanIfChanged(prev, next)
      }),
    [applyAndPersist],
  )

  const deleteItem = useCallback(
    (id: string) =>
      applyAndPersist({ type: 'DELETE_ITEM', id }, async (prev, next) => {
        await studyItemsApi.deleteItem(id)
        await syncPlanIfChanged(prev, next)
      }),
    [applyAndPersist],
  )

  const toggleItemComplete = useCallback(
    (id: string, completed: boolean) =>
      applyAndPersist({ type: 'TOGGLE_ITEM_COMPLETE', id, completed }, async (prev, next) => {
        const item = next.items.find((i) => i.id === id)
        if (item) await studyItemsApi.updateItem(item)
        await syncPlanIfChanged(prev, next)
      }),
    [applyAndPersist],
  )

  const setItemMastery = useCallback(
    (id: string, mastery: MasteryRating) =>
      applyAndPersist({ type: 'SET_ITEM_MASTERY', id, mastery }, async (_prev, next) => {
        const item = next.items.find((i) => i.id === id)
        if (item) await studyItemsApi.updateItem(item)
      }),
    [applyAndPersist],
  )

  const moveSession = useCallback(
    (id: string, date: string) =>
      applyAndPersist({ type: 'MOVE_SESSION', id, date }, async (_prev, next) => {
        const session = next.sessions.find((s) => s.id === id)
        if (session) await studySessionsApi.updateSession(id, { date: session.date, order: session.order, manuallyAdjusted: true })
      }),
    [applyAndPersist],
  )

  const reorderDay = useCallback(
    (date: string, orderedIds: string[]) =>
      applyAndPersist({ type: 'REORDER_DAY', date, orderedIds }, async () => {
        await studySessionsApi.reorderSessions(date, orderedIds)
      }),
    [applyAndPersist],
  )

  const updateSessionDuration = useCallback(
    (id: string, minutes: number) =>
      applyAndPersist({ type: 'UPDATE_SESSION_DURATION', id, minutes }, async (_prev, next) => {
        const session = next.sessions.find((s) => s.id === id)
        if (session) await studySessionsApi.updateSession(id, { plannedMinutes: session.plannedMinutes, manuallyAdjusted: true })
      }),
    [applyAndPersist],
  )

  const setDayOverride = useCallback(
    (override: DayOverride) =>
      applyAndPersist({ type: 'SET_DAY_OVERRIDE', override }, async (prev, next) => {
        await dayOverridesApi.upsertDayOverride(override)
        await syncPlanIfChanged(prev, next)
      }),
    [applyAndPersist],
  )

  const clearDayOverride = useCallback(
    (date: string) =>
      applyAndPersist({ type: 'CLEAR_DAY_OVERRIDE', date }, async (prev, next) => {
        await dayOverridesApi.deleteDayOverride(date)
        await syncPlanIfChanged(prev, next)
      }),
    [applyAndPersist],
  )

  const regeneratePlanNow = useCallback(
    () =>
      applyAndPersist({ type: 'REGENERATE_PLAN' }, async (prev, next) => {
        await syncPlanIfChanged(prev, next)
      }),
    [applyAndPersist],
  )

  const startSession = useCallback(
    (sessionId: string) =>
      applyAndPersist({ type: 'START_SESSION', sessionId }, async (prev, next) => {
        const requests: Promise<unknown>[] = []
        for (const nextSession of next.sessions) {
          const prevSession = prev.sessions.find((s) => s.id === nextSession.id)
          if (prevSession && (prevSession.status !== nextSession.status || prevSession.startedAt !== nextSession.startedAt)) {
            requests.push(
              studySessionsApi.updateSession(nextSession.id, { status: nextSession.status, startedAt: nextSession.startedAt }),
            )
          }
        }
        await Promise.all(requests)
      }),
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
      applyAndPersist({ type: 'STOP_TIMER' }, async (_prev, next) => {
        const timer = stateRef.current.activeTimer
        if (timer) {
          const session = next.sessions.find((s) => s.id === timer.sessionId)
          if (session) await studySessionsApi.updateSession(timer.sessionId, { status: 'planned', startedAt: null })
        }
      }),
    [applyAndPersist],
  )

  const completeSession = useCallback(
    (sessionId: string, actualMinutes: number): CompletionResult => {
      const current = stateRef.current
      const session = current.sessions.find((s) => s.id === sessionId)
      const itemId = session?.itemId ?? ''
      const otherIncomplete = current.sessions.some((s) => s.itemId === itemId && s.id !== sessionId && s.status !== 'completed')
      const roundedMinutes = Math.max(1, Math.round(actualMinutes))

      applyAndPersist({ type: 'COMPLETE_SESSION', sessionId, actualMinutes: roundedMinutes }, async (_prev, next) => {
        await studySessionsApi.updateSession(sessionId, {
          status: 'completed',
          actualMinutes: roundedMinutes,
          completedAt: new Date().toISOString(),
        })
        const item = next.items.find((i) => i.id === itemId)
        if (item && !otherIncomplete) {
          await studyItemsApi.updateItem(item)
        }
      })

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

  const loadDemoData = useCallback(
    () =>
      applyAndPersist({ type: 'LOAD_DEMO_DATA' }, async (_prev, next) => {
        await dataApi.restoreData({ goal: next.goal, items: next.items, sessions: next.sessions, dayOverrides: next.dayOverrides })
      }),
    [applyAndPersist],
  )

  const importData = useCallback(
    async (data: { goal: StudyGoal | null; items: StudyItem[]; sessions: StudySession[]; dayOverrides: Record<string, DayOverride> }) => {
      await dataApi.restoreData(data)
      setState({ ...data, activeTimer: null, demoDataLoaded: false })
    },
    [],
  )

  const resetData = useCallback(
    () =>
      applyAndPersist({ type: 'RESET_DATA' }, async () => {
        await dataApi.wipeAllData()
      }),
    [applyAndPersist],
  )

  const exportData = useCallback(() => {
    const { goal, items, sessions, dayOverrides } = stateRef.current
    downloadJson('studyflow-backup', { version: '2', goal, items, sessions, dayOverrides })
  }, [])

  const value = useMemo<StudyContextValue>(
    () => ({
      state,
      isLoading,
      loadError,
      syncError,
      clearSyncError,
      retryLoad,
      setGoal,
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
      isLoading,
      loadError,
      syncError,
      clearSyncError,
      retryLoad,
      setGoal,
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
