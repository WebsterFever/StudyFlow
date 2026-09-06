import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronsUpDown, ClipboardList, Plus } from 'lucide-react'
import { usePlanner } from '../../hooks/usePlanner'

export function PlannerGoalSwitcher() {
  const { state, activeGoal, setActiveGoalId } = usePlanner()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (state.goals.length === 0) return null

  return (
    <div className="relative px-3 pb-3" ref={ref}>
      <p className="mb-1.5 px-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">Current Goal</p>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ClipboardList size={15} className="shrink-0 text-indigo-500" />
          <span className="truncate">{activeGoal?.name ?? 'Select a goal'}</span>
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute inset-x-3 z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {state.goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => {
                setActiveGoalId(goal.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span className="w-4 shrink-0">{goal.id === activeGoal?.id && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}</span>
              <span className="truncate">{goal.name}</span>
            </button>
          ))}
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <Link
            to="/planner/goals"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
          >
            <Plus size={14} /> Create New Goal
          </Link>
        </div>
      )}
    </div>
  )
}
