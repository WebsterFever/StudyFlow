import { useContext } from 'react'
import { PlannerContext } from '../context/PlannerContext'

export function usePlanner() {
  const ctx = useContext(PlannerContext)
  if (!ctx) throw new Error('usePlanner must be used within a PlannerProvider')
  return ctx
}
