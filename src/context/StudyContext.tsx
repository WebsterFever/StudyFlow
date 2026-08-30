import type { ReactNode } from 'react'
import { createContext, useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type {
  ActiveTimer,
  AppState,
  DayOverride,
  MasteryRating,
  SessionStatus,
  StudyGoal,
  StudyItem,
} from '../types'
import { buildDemoGoal, buildDemoItems } from '../data/demoData'
import { createEmptyState, exportStudyData, loadStudyData, saveStudyData } from '../services/storage'
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
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'COMPLETE_SESSION'; sessionId: string; actualMinutes: number }
  | { type: 'LOAD_DEMO_DATA' }
  | { type: 'IMPORT_DATA'; data: AppState }
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
        // Revert any other in-progress session (only one active timer at a time).
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

    case 'PAUSE_TIMER': {
      if (!state.activeTimer || state.activeTimer.isPaused) return state
      const elapsed = (Date.now() - new Date(state.activeTimer.startedAt).getTime()) / 1000
      return {
        ...state,
        activeTimer: {
          ...state.activeTimer,
          accumulatedSeconds: state.activeTimer.accumulatedSeconds + elapsed,
          isPaused: true,
        },
      }
    }

    case 'RESUME_TIMER': {
      if (!state.activeTimer || !state.activeTimer.isPaused) return state
      return { ...state, activeTimer: { ...state.activeTimer, startedAt: new Date().toISOString(), isPaused: false } }
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

    case 'IMPORT_DATA':
      return { ...action.data }

    case 'RESET_DATA':
      return createEmptyState()

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
  importData: (data: AppState) => void
  resetData: () => void
  exportData: () => void
}

export const StudyContext = createContext<StudyContextValue | null>(null)

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadStudyData)
  const stateRef = useRef(state)
  stateRef.current = state
  const didAutoReschedule = useRef(false)

  useEffect(() => {
    saveStudyData(state)
  }, [state])

  // On first load, if there are missed sessions from before today, quietly reflow the plan once.
  useEffect(() => {
    if (didAutoReschedule.current) return
    didAutoReschedule.current = true
    const today = todayISO()
    const hasMissed = state.sessions.some((s) => s.date < today && s.status === 'planned')
    if (hasMissed && state.goal) {
      dispatch({ type: 'REGENERATE_PLAN' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setGoal = useCallback((goal: StudyGoal) => dispatch({ type: 'SET_GOAL', goal }), [])
  const addItem = useCallback((item: StudyItem) => dispatch({ type: 'ADD_ITEM', item }), [])
  const addItems = useCallback((items: StudyItem[]) => dispatch({ type: 'ADD_ITEMS', items }), [])
  const updateItem = useCallback((item: StudyItem) => dispatch({ type: 'UPDATE_ITEM', item }), [])
  const deleteItem = useCallback((id: string) => dispatch({ type: 'DELETE_ITEM', id }), [])
  const toggleItemComplete = useCallback(
    (id: string, completed: boolean) => dispatch({ type: 'TOGGLE_ITEM_COMPLETE', id, completed }),
    [],
  )
  const setItemMastery = useCallback(
    (id: string, mastery: MasteryRating) => dispatch({ type: 'SET_ITEM_MASTERY', id, mastery }),
    [],
  )
  const moveSession = useCallback((id: string, date: string) => dispatch({ type: 'MOVE_SESSION', id, date }), [])
  const reorderDay = useCallback(
    (date: string, orderedIds: string[]) => dispatch({ type: 'REORDER_DAY', date, orderedIds }),
    [],
  )
  const updateSessionDuration = useCallback(
    (id: string, minutes: number) => dispatch({ type: 'UPDATE_SESSION_DURATION', id, minutes }),
    [],
  )
  const setDayOverride = useCallback((override: DayOverride) => dispatch({ type: 'SET_DAY_OVERRIDE', override }), [])
  const clearDayOverride = useCallback((date: string) => dispatch({ type: 'CLEAR_DAY_OVERRIDE', date }), [])
  const regeneratePlanNow = useCallback(() => dispatch({ type: 'REGENERATE_PLAN' }), [])
  const startSession = useCallback((sessionId: string) => dispatch({ type: 'START_SESSION', sessionId }), [])
  const pauseTimer = useCallback(() => dispatch({ type: 'PAUSE_TIMER' }), [])
  const resumeTimer = useCallback(() => dispatch({ type: 'RESUME_TIMER' }), [])
  const stopTimer = useCallback(() => dispatch({ type: 'STOP_TIMER' }), [])

  const completeSession = useCallback((sessionId: string, actualMinutes: number): CompletionResult => {
    const current = stateRef.current
    const session = current.sessions.find((s) => s.id === sessionId)
    const itemId = session?.itemId ?? ''
    const otherIncomplete = current.sessions.some(
      (s) => s.itemId === itemId && s.id !== sessionId && s.status !== 'completed',
    )
    dispatch({ type: 'COMPLETE_SESSION', sessionId, actualMinutes: Math.max(1, Math.round(actualMinutes)) })
    return { itemCompleted: !otherIncomplete, itemId }
  }, [])

  const completeActiveTimer = useCallback((): CompletionResult | null => {
    const timer = stateRef.current.activeTimer
    if (!timer) return null
    const elapsed = timer.isPaused ? 0 : (Date.now() - new Date(timer.startedAt).getTime()) / 1000
    const totalSeconds = timer.accumulatedSeconds + elapsed
    const actualMinutes = Math.max(1, Math.round(totalSeconds / 60))
    return completeSession(timer.sessionId, actualMinutes)
  }, [completeSession])

  const loadDemoData = useCallback(() => dispatch({ type: 'LOAD_DEMO_DATA' }), [])
  const importData = useCallback((data: AppState) => dispatch({ type: 'IMPORT_DATA', data }), [])
  const resetData = useCallback(() => dispatch({ type: 'RESET_DATA' }), [])
  const exportData = useCallback(() => exportStudyData(stateRef.current), [])

  const value = useMemo<StudyContextValue>(
    () => ({
      state,
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
