import { useCallback, useState } from 'react'

export type DefaultFlow = 'ask' | 'student' | 'planner'

const DEFAULT_FLOW_KEY = 'goalflow_default_flow_v1'

function loadDefaultFlow(): DefaultFlow {
  try {
    const raw = localStorage.getItem(DEFAULT_FLOW_KEY)
    return raw === 'student' || raw === 'planner' ? raw : 'ask'
  } catch {
    return 'ask'
  }
}

function saveDefaultFlow(flow: DefaultFlow): void {
  try {
    if (flow === 'ask') localStorage.removeItem(DEFAULT_FLOW_KEY)
    else localStorage.setItem(DEFAULT_FLOW_KEY, flow)
  } catch {
    // Non-fatal — the preference just won't persist across reloads.
  }
}

/**
 * A reversible, client-only landing-page preference — never a permanent
 * choice. Defaults to "ask" (always show the GoalFlow picker) until the
 * user explicitly opts into skipping it for one flow.
 */
export function useDefaultFlow() {
  const [defaultFlow, setDefaultFlowState] = useState<DefaultFlow>(loadDefaultFlow)

  const setDefaultFlow = useCallback((flow: DefaultFlow) => {
    saveDefaultFlow(flow)
    setDefaultFlowState(flow)
  }, [])

  return { defaultFlow, setDefaultFlow }
}
