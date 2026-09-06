import { NavLink } from 'react-router-dom'
import { ClipboardList, GraduationCap } from 'lucide-react'

/** Lets a user jump between StudentFlow and PlannerFlow from anywhere, without going back through the GoalFlow home. */
export function FlowSwitcher({ className = '' }: { className?: string }) {
  const pillClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
      isActive ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
    }`

  return (
    <div className={`flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 ${className}`}>
      <NavLink to="/student" className={pillClass}>
        <GraduationCap size={14} /> StudentFlow
      </NavLink>
      <NavLink to="/planner" className={pillClass}>
        <ClipboardList size={14} /> PlannerFlow
      </NavLink>
    </div>
  )
}
