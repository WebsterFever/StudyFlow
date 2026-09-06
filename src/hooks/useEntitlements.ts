import { PLAN_LIMITS, getCurrentPlan } from '../config/entitlements'

export function useEntitlements() {
  const plan = getCurrentPlan()
  const limits = PLAN_LIMITS[plan]

  return {
    plan,
    limits,
    canCreateStudentGoal: (currentCount: number) => currentCount < limits.maxStudentGoals,
    canCreatePlannerGoal: (currentCount: number) => currentCount < limits.maxPlannerGoals,
  }
}
