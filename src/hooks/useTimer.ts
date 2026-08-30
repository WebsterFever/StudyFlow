import { useEffect, useState } from 'react'
import type { ActiveTimer } from '../types'

/** Ticks once a second while a timer is running, returning total elapsed seconds. */
export function useTimer(activeTimer: ActiveTimer | null): number {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) return
    const interval = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(interval)
  }, [activeTimer])

  if (!activeTimer) return 0
  const running = activeTimer.isPaused ? 0 : (Date.now() - new Date(activeTimer.startedAt).getTime()) / 1000
  return activeTimer.accumulatedSeconds + running
}
