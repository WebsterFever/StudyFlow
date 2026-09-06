import { NavLink, useLocation } from 'react-router-dom'
import { NAV_ITEMS, PLANNER_NAV_ITEMS } from './navConfig'

export function MobileNav() {
  const location = useLocation()
  const navItems = location.pathname.startsWith('/planner') ? PLANNER_NAV_ITEMS : NAV_ITEMS

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
      <div className="scrollbar-none flex w-full overflow-x-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <item.icon size={20} />
            <span className="leading-none">
              {item.label === 'Study Content' ? 'Content' : item.label === 'Study Plan' ? 'Plan' : item.label === 'Study Notes' ? 'Notes' : item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
