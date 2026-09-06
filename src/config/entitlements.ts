export type PlanId = 'free'

export interface PlanLimits {
  maxStudentGoals: number
  maxPlannerGoals: number
}

// Generous/unlimited today since there's no billing yet — the point of this
// file is the shape, not the numbers. When a real plan system lands, swap
// getCurrentPlan()'s hardcoded return for the user's actual subscription
// tier and tighten these limits; every call site already reads through here.
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    maxStudentGoals: Infinity,
    maxPlannerGoals: Infinity,
  },
}

export function getCurrentPlan(): PlanId {
  return 'free'
}
