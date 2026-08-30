import { NavLink } from 'react-router-dom'
import { Flame, GraduationCap, LogOut } from 'lucide-react'
import { NAV_ITEMS } from './navConfig'
import { useStudy } from '../../hooks/useStudy'
import { useAuth } from '../../hooks/useAuth'
import { computeStreak } from '../../utils/streak'

export function Sidebar() {
  const { state } = useStudy()
  const { user, logout } = useAuth()
  const streak = computeStreak(state.sessions)

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <GraduationCap size={20} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">StudyFlow</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Study planner</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {streak.currentStreak > 0 && (
        <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5 text-sm font-medium text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
          <Flame size={16} className="fill-orange-500 text-orange-500" />
          {streak.currentStreak}-day streak
        </div>
      )}

      <div className="mx-3 mb-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={user?.email}>
          {user?.email}
        </p>
        <button
          onClick={logout}
          aria-label="Log out"
          title="Log out"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
